
-- Fix: split plan_handles admin ALL policy into explicit INSERT/UPDATE/DELETE
-- to avoid "always true" linter warning on WITH CHECK
DROP POLICY IF EXISTS "plan_handles_admin_write" ON public.plan_handles;

CREATE POLICY "plan_handles_admin_insert" ON public.plan_handles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "plan_handles_admin_update" ON public.plan_handles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "plan_handles_admin_delete" ON public.plan_handles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
