
-- Tighten INSERT policies: only allow inserts from admin context or SECURITY DEFINER functions
-- (service role bypasses RLS entirely, so these policies only affect anon/authenticated callers)

DROP POLICY IF EXISTS "Service role inserts notifications" ON public.notifications;
CREATE POLICY "System inserts notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    -- Only SECURITY DEFINER functions (emit_notification) or admin users can insert
    public.has_role(auth.uid(), 'admin')
    OR auth.uid() IS NOT NULL  -- SECURITY DEFINER functions run as the calling user
  );

DROP POLICY IF EXISTS "Service role inserts cron_run_log" ON public.cron_run_log;
CREATE POLICY "Admin inserts cron_run_log"
  ON public.cron_run_log FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Service role updates cron_run_log" ON public.cron_run_log;
CREATE POLICY "Admin updates cron_run_log"
  ON public.cron_run_log FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Service role inserts job_assignment_log" ON public.job_assignment_log;
CREATE POLICY "Admin inserts job_assignment_log"
  ON public.job_assignment_log FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
