
-- ============================================================
-- Sprint 5 Phase 1: Assignment Engine Schema & Config Foundation
-- ============================================================

-- 1. Add assignment columns to visits
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS backup_provider_org_id uuid REFERENCES public.provider_orgs(id);
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS assignment_confidence text;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS assignment_reasons jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS assignment_locked boolean DEFAULT false;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS assignment_run_id uuid;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS assignment_score numeric;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS unassigned_reason text;

-- 2. Create assignment_runs table
CREATE TABLE IF NOT EXISTS public.assignment_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  triggered_by text DEFAULT 'system',
  started_at timestamptz,
  completed_at timestamptz,
  run_date date NOT NULL,
  idempotency_key text UNIQUE,
  summary jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.assignment_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage assignment runs"
  ON public.assignment_runs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_memberships am WHERE am.user_id = auth.uid() AND am.is_active = true));

CREATE POLICY "Service role can manage assignment runs"
  ON public.assignment_runs FOR ALL
  USING (auth.uid() IS NULL);

-- 3. Create assignment_config table
CREATE TABLE IF NOT EXISTS public.assignment_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by_user_id uuid
);

ALTER TABLE public.assignment_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage assignment config"
  ON public.assignment_config FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_memberships am WHERE am.user_id = auth.uid() AND am.is_active = true));

CREATE POLICY "Service role can read assignment config"
  ON public.assignment_config FOR SELECT
  USING (auth.uid() IS NULL);

-- 4. Create visit_assignment_log table
CREATE TABLE IF NOT EXISTS public.visit_assignment_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid REFERENCES public.visits(id) NOT NULL,
  action text NOT NULL,
  provider_org_id uuid REFERENCES public.provider_orgs(id),
  previous_provider_org_id uuid REFERENCES public.provider_orgs(id),
  reason text,
  performed_by uuid,
  score_breakdown jsonb,
  candidates jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.visit_assignment_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage visit assignment log"
  ON public.visit_assignment_log FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_memberships am WHERE am.user_id = auth.uid() AND am.is_active = true));

CREATE POLICY "Service role can manage visit assignment log"
  ON public.visit_assignment_log FOR ALL
  USING (auth.uid() IS NULL);

-- 5. Add FK from visits.assignment_run_id to assignment_runs
ALTER TABLE public.visits ADD CONSTRAINT visits_assignment_run_id_fkey
  FOREIGN KEY (assignment_run_id) REFERENCES public.assignment_runs(id);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_visits_assignment_run_id ON public.visits(assignment_run_id);
CREATE INDEX IF NOT EXISTS idx_visits_backup_provider_org_id ON public.visits(backup_provider_org_id);
CREATE INDEX IF NOT EXISTS idx_visits_assignment_locked ON public.visits(assignment_locked) WHERE assignment_locked = true;
CREATE INDEX IF NOT EXISTS idx_assignment_runs_run_date ON public.assignment_runs(run_date);
CREATE INDEX IF NOT EXISTS idx_assignment_runs_status ON public.assignment_runs(status);
CREATE INDEX IF NOT EXISTS idx_visit_assignment_log_visit_id ON public.visit_assignment_log(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_assignment_log_created_at ON public.visit_assignment_log(created_at);

-- 7. Seed assignment_config with default dials
INSERT INTO public.assignment_config (config_key, config_value, description) VALUES
  ('w_distance', '0.40', 'Weight for distance/drive-time scoring'),
  ('w_balance', '0.25', 'Weight for workload balance scoring'),
  ('w_spread', '0.20', 'Weight for geographic spread penalty'),
  ('w_familiarity', '0.10', 'Weight for provider-customer familiarity'),
  ('w_zone_affinity', '0.05', 'Weight for zone affinity bonus'),
  ('max_candidate_drive_minutes', '45', 'Hard cap on candidate drive time in minutes'),
  ('utilization_target', '0.80', 'Target utilization ratio for providers'),
  ('default_task_minutes', '30', 'Default duration when visit_tasks lack estimates'),
  ('reassign_min_score_delta', '5.0', 'Minimum score improvement to reassign existing visit'),
  ('reassign_min_percent', '0.15', 'Minimum percentage improvement to reassign'),
  ('freeze_strictness_multiplier', '2.0', 'Multiplier for reassignment threshold in freeze window'),
  ('familiarity_cap_minutes', '15', 'Cap on familiarity bonus in drive-minutes equivalent'),
  ('buffer_minutes', '10', 'Buffer minutes between visits for travel/transition')
ON CONFLICT (config_key) DO NOTHING;
