
-- 1. Fix support-attachments SELECT: scope to ticket participants
DROP POLICY IF EXISTS "Users view own support attachments" ON storage.objects;

CREATE POLICY "Ticket participants can view support attachments"
  ON storage.objects FOR SELECT
  TO public
  USING (
    bucket_id = 'support-attachments'
    AND EXISTS (
      SELECT 1 FROM public.support_attachments sa
      JOIN public.support_tickets t ON t.id = sa.ticket_id
      WHERE sa.storage_path = name
      AND (
        sa.uploaded_by_user_id = auth.uid()
        OR t.customer_id = auth.uid()
      )
    )
  );

-- 2. Fix job-photos INSERT: scope to provider members or admins
DROP POLICY IF EXISTS "Authenticated can upload job photos" ON storage.objects;

CREATE POLICY "Provider members can upload job photos"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'job-photos'
    AND (
      is_admin_member(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.provider_members pm
        WHERE pm.user_id = auth.uid()
        AND pm.status = 'active'
      )
    )
  );

-- 3. Fix subscription_events INSERT: restrict to service_role only
DROP POLICY IF EXISTS "System can insert subscription events" ON public.subscription_events;

CREATE POLICY "Service role can insert subscription events"
  ON public.subscription_events FOR INSERT
  TO service_role
  WITH CHECK (true);
