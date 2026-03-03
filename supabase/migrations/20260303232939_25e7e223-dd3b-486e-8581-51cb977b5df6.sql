
-- Sprint 6 Phase 1: Route Sequencing Schema Foundation (retry with correct column names)

-- 1. Add required_equipment to service_skus
ALTER TABLE public.service_skus
  ADD COLUMN IF NOT EXISTS required_equipment text[] NOT NULL DEFAULT '{}';

-- 2. Create provider_blocked_windows table
CREATE TABLE public.provider_blocked_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id) ON DELETE CASCADE,
  day_of_week int,
  start_time time NOT NULL,
  end_time time NOT NULL,
  label text NOT NULL DEFAULT '',
  location_lat numeric,
  location_lng numeric,
  is_recurring boolean NOT NULL DEFAULT true,
  specific_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_blocked_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider members can view own org blocked windows"
  ON public.provider_blocked_windows FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.provider_members pm
      WHERE pm.provider_org_id = provider_blocked_windows.provider_org_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'active'
    )
  );

CREATE POLICY "Provider members can insert own org blocked windows"
  ON public.provider_blocked_windows FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.provider_members pm
      WHERE pm.provider_org_id = provider_blocked_windows.provider_org_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'active'
    )
  );

CREATE POLICY "Provider members can update own org blocked windows"
  ON public.provider_blocked_windows FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.provider_members pm
      WHERE pm.provider_org_id = provider_blocked_windows.provider_org_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'active'
    )
  );

CREATE POLICY "Provider members can delete own org blocked windows"
  ON public.provider_blocked_windows FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.provider_members pm
      WHERE pm.provider_org_id = provider_blocked_windows.provider_org_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'active'
    )
  );

CREATE POLICY "Admins can manage all blocked windows"
  ON public.provider_blocked_windows FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Create route_sequence_runs table
CREATE TABLE public.route_sequence_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date date NOT NULL,
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  total_stops int NOT NULL DEFAULT 0,
  total_travel_minutes numeric NOT NULL DEFAULT 0,
  total_service_minutes numeric NOT NULL DEFAULT 0,
  estimated_finish_time timestamptz,
  is_feasible boolean NOT NULL DEFAULT true,
  infeasible_reason text,
  summary jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.route_sequence_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all route sequence runs"
  ON public.route_sequence_runs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Provider members can view own org route runs"
  ON public.route_sequence_runs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.provider_members pm
      WHERE pm.provider_org_id = route_sequence_runs.provider_org_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'active'
    )
  );

-- 4. Add columns to visits
ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS route_order int,
  ADD COLUMN IF NOT EXISTS stop_duration_minutes numeric,
  ADD COLUMN IF NOT EXISTS planned_arrival_time timestamptz,
  ADD COLUMN IF NOT EXISTS equipment_required text[] NOT NULL DEFAULT '{}';

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_provider_blocked_windows_org
  ON public.provider_blocked_windows(provider_org_id);

CREATE INDEX IF NOT EXISTS idx_route_sequence_runs_org_date
  ON public.route_sequence_runs(provider_org_id, run_date);

CREATE INDEX IF NOT EXISTS idx_visits_provider_date_order
  ON public.visits(provider_org_id, scheduled_date, route_order);
