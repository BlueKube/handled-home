
-- Re-run schema parts that were lost in the first failed migration

-- 1) Add missing enum values
ALTER TYPE public.market_zone_category_status ADD VALUE IF NOT EXISTS 'WAITLIST_ONLY';
ALTER TYPE public.market_zone_category_status ADD VALUE IF NOT EXISTS 'PROVIDER_RECRUITING';

ALTER TYPE public.zone_launch_status ADD VALUE IF NOT EXISTS 'closed';
ALTER TYPE public.zone_launch_status ADD VALUE IF NOT EXISTS 'provider_recruiting';
ALTER TYPE public.zone_launch_status ADD VALUE IF NOT EXISTS 'protect_quality';

-- 2) Add tracking columns to market_zone_category_state
ALTER TABLE public.market_zone_category_state
  ADD COLUMN IF NOT EXISTS last_state_change_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_state_change_by text DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS previous_status text;

-- 3) Zone State Recommendations table
CREATE TABLE IF NOT EXISTS public.zone_state_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  category text NOT NULL,
  current_state text NOT NULL,
  recommended_state text NOT NULL,
  confidence text NOT NULL DEFAULT 'medium',
  reasons text[] NOT NULL DEFAULT '{}',
  metrics_snapshot jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  reviewed_by_admin_user_id uuid,
  review_note text,
  reviewed_at timestamptz,
  snoozed_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  idempotency_key text UNIQUE,
  CONSTRAINT valid_confidence CHECK (confidence IN ('high', 'medium', 'low')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'snoozed', 'superseded'))
);

ALTER TABLE public.zone_state_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read recommendations"
  ON public.zone_state_recommendations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update recommendations"
  ON public.zone_state_recommendations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System inserts recommendations"
  ON public.zone_state_recommendations FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_zone_state_recs_zone_cat ON public.zone_state_recommendations (zone_id, category);
CREATE INDEX IF NOT EXISTS idx_zone_state_recs_status ON public.zone_state_recommendations (status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_zone_state_recs_created ON public.zone_state_recommendations (created_at DESC);

-- 4) Zone State Threshold Configs
CREATE TABLE IF NOT EXISTS public.zone_state_threshold_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL DEFAULT '{}',
  description text,
  updated_by_admin_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.zone_state_threshold_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read threshold configs"
  ON public.zone_state_threshold_configs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage threshold configs"
  ON public.zone_state_threshold_configs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5) Zone State Change Log
CREATE TABLE IF NOT EXISTS public.zone_state_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  category text NOT NULL,
  previous_state text,
  new_state text NOT NULL,
  change_source text NOT NULL DEFAULT 'manual',
  reason text,
  reason_codes text[] DEFAULT '{}',
  actor_user_id uuid,
  recommendation_id uuid REFERENCES public.zone_state_recommendations(id),
  metrics_snapshot jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_change_source CHECK (change_source IN ('manual', 'approved_recommendation', 'system_emergency'))
);

ALTER TABLE public.zone_state_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read state change log"
  ON public.zone_state_change_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System inserts state change log"
  ON public.zone_state_change_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_zone_state_change_log_zone_cat ON public.zone_state_change_log (zone_id, category);
CREATE INDEX IF NOT EXISTS idx_zone_state_change_log_created ON public.zone_state_change_log (created_at DESC);

-- 6) Seed default threshold configs
INSERT INTO public.zone_state_threshold_configs (config_key, config_value, description) VALUES
  ('min_providers_to_open', '{"value": 2}', 'Minimum qualified providers to move to OPEN'),
  ('open_utilization_enter', '{"value": 0.75}', 'Utilization must be ≤ this to enter OPEN'),
  ('open_utilization_exit', '{"value": 0.80}', 'Utilization above this triggers exit from OPEN (hysteresis)'),
  ('protect_quality_enter', '{"value": 0.85}', 'Utilization ≥ this triggers PROTECT_QUALITY'),
  ('protect_quality_exit', '{"value": 0.75}', 'Utilization ≤ this allows exit from PROTECT_QUALITY'),
  ('provider_recruiting_trigger_util', '{"value": 0.95}', 'Utilization would exceed this if opened'),
  ('coverage_risk_waitlist_threshold', '{"value": 0.40}', 'CoverageRisk > this → WAITLIST_ONLY'),
  ('coverage_risk_recruiting_threshold', '{"value": 0.20}', 'CoverageRisk > this → PROVIDER_RECRUITING'),
  ('minimum_time_in_state_days', '{"value": 7}', 'Minimum days before non-emergency state change'),
  ('soft_launch_intake_cap_per_week', '{"value": 5}', 'Max new subscribers per week during SOFT_LAUNCH')
ON CONFLICT (config_key) DO NOTHING;
