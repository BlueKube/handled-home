
-- PRD-300 Sprint 1 Phase 1: Visits, Visit Tasks, Provider Work Profiles, Schedule States
-- =====================================================================================

-- 1. Create visit_schedule_state enum
CREATE TYPE public.visit_schedule_state AS ENUM (
  'planning',
  'scheduled',
  'dispatched',
  'in_progress',
  'complete',
  'exception_pending',
  'canceled',
  'rescheduled'
);

-- 2. Create visits table
CREATE TABLE public.visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  provider_org_id uuid REFERENCES public.provider_orgs(id) ON DELETE SET NULL,
  scheduled_date date NOT NULL,
  schedule_state public.visit_schedule_state NOT NULL DEFAULT 'planning',
  time_window_start time,
  time_window_end time,
  eta_range_start timestamptz,
  eta_range_end timestamptz,
  route_plan_version int DEFAULT 0,
  locked_at timestamptz,
  draft_generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create visit_tasks table
CREATE TABLE public.visit_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  sku_id uuid NOT NULL REFERENCES public.service_skus(id) ON DELETE RESTRICT,
  duration_estimate_minutes int NOT NULL DEFAULT 30,
  presence_required boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create provider_work_profiles table (provider_org_id is PK + FK)
CREATE TABLE public.provider_work_profiles (
  provider_org_id uuid PRIMARY KEY REFERENCES public.provider_orgs(id) ON DELETE CASCADE,
  home_lat numeric(10,7),
  home_lng numeric(10,7),
  home_geohash text,
  home_address_label text,
  max_jobs_per_day int NOT NULL DEFAULT 12,
  working_hours jsonb NOT NULL DEFAULT '{"mon":{"start":"08:00","end":"17:00"},"tue":{"start":"08:00","end":"17:00"},"wed":{"start":"08:00","end":"17:00"},"thu":{"start":"08:00","end":"17:00"},"fri":{"start":"08:00","end":"17:00"}}',
  equipment_kits text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Add presence_required column to service_skus
ALTER TABLE public.service_skus ADD COLUMN presence_required boolean NOT NULL DEFAULT false;

-- 6. Updated_at triggers
CREATE TRIGGER update_visits_updated_at
  BEFORE UPDATE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_work_profiles_updated_at
  BEFORE UPDATE ON public.provider_work_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Indexes
CREATE INDEX idx_visits_property_date ON public.visits(property_id, scheduled_date);
CREATE INDEX idx_visits_provider_date ON public.visits(provider_org_id, scheduled_date);
CREATE INDEX idx_visit_tasks_visit ON public.visit_tasks(visit_id);
CREATE INDEX idx_provider_work_profiles_geohash ON public.provider_work_profiles(home_geohash);

-- 8. Security definer helper: check if user owns a property
CREATE OR REPLACE FUNCTION public.user_owns_property(p_user_id uuid, p_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = p_property_id AND user_id = p_user_id
  )
$$;

-- 9. Security definer helper: check if user is accountable owner of provider org
CREATE OR REPLACE FUNCTION public.user_is_provider_owner(p_user_id uuid, p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.provider_orgs
    WHERE id = p_org_id AND accountable_owner_user_id = p_user_id
  )
$$;

-- 10. RLS for visits
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Admin reads all visits
CREATE POLICY "admin_select_visits" ON public.visits
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin manages all visits
CREATE POLICY "admin_all_visits" ON public.visits
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Provider reads visits assigned to their org
CREATE POLICY "provider_select_visits" ON public.visits
  FOR SELECT TO authenticated
  USING (public.user_is_provider_owner(auth.uid(), provider_org_id));

-- Customer reads visits for their properties
CREATE POLICY "customer_select_visits" ON public.visits
  FOR SELECT TO authenticated
  USING (public.user_owns_property(auth.uid(), property_id));

-- 11. RLS for visit_tasks
ALTER TABLE public.visit_tasks ENABLE ROW LEVEL SECURITY;

-- Admin manages all visit_tasks
CREATE POLICY "admin_all_visit_tasks" ON public.visit_tasks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Provider reads visit_tasks for their visits
CREATE POLICY "provider_select_visit_tasks" ON public.visit_tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.visits v
      WHERE v.id = visit_id
        AND public.user_is_provider_owner(auth.uid(), v.provider_org_id)
    )
  );

-- Customer reads visit_tasks for their visits
CREATE POLICY "customer_select_visit_tasks" ON public.visit_tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.visits v
      WHERE v.id = visit_id
        AND public.user_owns_property(auth.uid(), v.property_id)
    )
  );

-- 12. RLS for provider_work_profiles
ALTER TABLE public.provider_work_profiles ENABLE ROW LEVEL SECURITY;

-- Admin reads all work profiles
CREATE POLICY "admin_select_work_profiles" ON public.provider_work_profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Provider reads/writes own org work profile
CREATE POLICY "provider_select_work_profile" ON public.provider_work_profiles
  FOR SELECT TO authenticated
  USING (public.user_is_provider_owner(auth.uid(), provider_org_id));

CREATE POLICY "provider_insert_work_profile" ON public.provider_work_profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.user_is_provider_owner(auth.uid(), provider_org_id));

CREATE POLICY "provider_update_work_profile" ON public.provider_work_profiles
  FOR UPDATE TO authenticated
  USING (public.user_is_provider_owner(auth.uid(), provider_org_id));
