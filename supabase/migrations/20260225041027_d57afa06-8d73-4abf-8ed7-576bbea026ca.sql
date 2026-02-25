-- Fix 1: Tighten notifications INSERT policy to admin-only
-- emit_notification() is SECURITY DEFINER and bypasses RLS, so only direct inserts need this policy
DROP POLICY IF EXISTS "System/admin can insert notifications" ON public.notifications;
CREATE POLICY "Only admins can insert notifications directly"
  ON public.notifications FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
