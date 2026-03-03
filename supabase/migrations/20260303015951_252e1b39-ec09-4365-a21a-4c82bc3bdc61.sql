
-- ============================================================
-- Phase 1 Remediation — All code review findings
-- ============================================================

-- 1. Fix admin policy on provider_work_profiles: SELECT → FOR ALL
DROP POLICY IF EXISTS "admin_select_work_profiles" ON public.provider_work_profiles;
CREATE POLICY "Admins can manage work profiles"
  ON public.provider_work_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Add service_categories column to provider_work_profiles
ALTER TABLE public.provider_work_profiles
  ADD COLUMN IF NOT EXISTS service_categories text[] NOT NULL DEFAULT '{}';

-- 3. Add h3_index to provider_work_profiles and properties
ALTER TABLE public.provider_work_profiles
  ADD COLUMN IF NOT EXISTS h3_index text;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS h3_index text;

-- 4. Add updated_at + trigger to visit_tasks
ALTER TABLE public.visit_tasks
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TRIGGER update_visit_tasks_updated_at
  BEFORE UPDATE ON public.visit_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Rename snake_case policies to natural language on visits
DROP POLICY IF EXISTS "admin_all_visits" ON public.visits;
CREATE POLICY "Admins can manage all visits"
  ON public.visits FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "customer_select_visits" ON public.visits;
CREATE POLICY "Customers can view own visits"
  ON public.visits FOR SELECT TO authenticated
  USING (public.user_owns_property(auth.uid(), property_id));

DROP POLICY IF EXISTS "provider_select_visits" ON public.visits;
CREATE POLICY "Providers can view assigned visits"
  ON public.visits FOR SELECT TO authenticated
  USING (public.user_is_provider_owner(auth.uid(), provider_org_id));

-- 6. Rename snake_case policies to natural language on visit_tasks
DROP POLICY IF EXISTS "admin_all_visit_tasks" ON public.visit_tasks;
CREATE POLICY "Admins can manage all visit tasks"
  ON public.visit_tasks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "customer_select_visit_tasks" ON public.visit_tasks;
CREATE POLICY "Customers can view own visit tasks"
  ON public.visit_tasks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.visits v
      WHERE v.id = visit_id
        AND public.user_owns_property(auth.uid(), v.property_id)
    )
  );

DROP POLICY IF EXISTS "provider_select_visit_tasks" ON public.visit_tasks;
CREATE POLICY "Providers can view assigned visit tasks"
  ON public.visit_tasks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.visits v
      WHERE v.id = visit_id
        AND public.user_is_provider_owner(auth.uid(), v.provider_org_id)
    )
  );

-- 7. Rename snake_case policies on provider_work_profiles
DROP POLICY IF EXISTS "provider_manage_own_work_profile" ON public.provider_work_profiles;
CREATE POLICY "Providers can manage own work profile"
  ON public.provider_work_profiles FOR ALL TO authenticated
  USING (public.user_is_provider_owner(auth.uid(), provider_org_id));

-- 8. Add indexes for h3_index columns
CREATE INDEX IF NOT EXISTS idx_provider_work_profiles_h3
  ON public.provider_work_profiles (h3_index) WHERE h3_index IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_h3
  ON public.properties (h3_index) WHERE h3_index IS NOT NULL;
