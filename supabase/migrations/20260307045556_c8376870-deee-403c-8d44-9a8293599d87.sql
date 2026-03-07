-- P1 Fix: Migrate plan_runs, job_assignment_log, notification_events RLS
-- from legacy has_role() to is_admin_member()

-- 1. plan_runs
DROP POLICY IF EXISTS "Admins can manage all plan runs" ON public.plan_runs;
CREATE POLICY "Admins can manage all plan runs"
  ON public.plan_runs FOR ALL TO authenticated
  USING (public.is_admin_member(auth.uid()));

-- 2. job_assignment_log
DROP POLICY IF EXISTS "Admins read job_assignment_log" ON public.job_assignment_log;
CREATE POLICY "Admins read job_assignment_log"
  ON public.job_assignment_log FOR ALL
  USING (public.is_admin_member(auth.uid()));

DROP POLICY IF EXISTS "Admin inserts job_assignment_log" ON public.job_assignment_log;
CREATE POLICY "Admin inserts job_assignment_log"
  ON public.job_assignment_log FOR INSERT
  WITH CHECK (public.is_admin_member(auth.uid()));

-- 3. notification_events
DROP POLICY IF EXISTS "Admins can manage notification events" ON public.notification_events;
CREATE POLICY "Admins can manage notification events"
  ON public.notification_events FOR ALL
  USING (public.is_admin_member(auth.uid()));