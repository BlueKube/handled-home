
-- ============================================================
-- Module 13.3 — Growth Autopilot: Market Launch OS
-- Tables: market_zone_category_state, market_health_snapshots, growth_autopilot_actions
-- Enums: market_zone_category_status
-- RPCs: compute_zone_health_score, record_autopilot_action, admin_override_zone_state
-- ============================================================

-- 1. Enum for zone/category state machine
CREATE TYPE public.market_zone_category_status AS ENUM ('CLOSED', 'SOFT_LAUNCH', 'OPEN', 'PROTECT_QUALITY');

-- 2. Zone/category state table — one row per (zone, category)
CREATE TABLE public.market_zone_category_state (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  category text NOT NULL,
  status public.market_zone_category_status NOT NULL DEFAULT 'CLOSED',
  locked_until timestamptz NULL,
  locked_by_admin_user_id uuid NULL,
  lock_reason text NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(zone_id, category)
);

-- 3. Health snapshots — periodic snapshots of zone/category health
CREATE TABLE public.market_health_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  category text NOT NULL,
  supply_score numeric NOT NULL DEFAULT 0,
  demand_score numeric NOT NULL DEFAULT 0,
  quality_score numeric NOT NULL DEFAULT 0,
  health_score numeric NOT NULL DEFAULT 0,
  health_label text NOT NULL DEFAULT 'stable',
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_health_snapshots_zone_cat ON public.market_health_snapshots(zone_id, category, snapshot_at DESC);

-- 4. Growth autopilot actions — append-only audit log
CREATE TABLE public.growth_autopilot_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  category text NOT NULL,
  action_type text NOT NULL,
  previous_state text NULL,
  new_state text NULL,
  trigger_source text NOT NULL DEFAULT 'autopilot',
  reason text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_autopilot_actions_zone ON public.growth_autopilot_actions(zone_id, category, created_at DESC);

-- 5. Enable RLS
ALTER TABLE public.market_zone_category_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_autopilot_actions ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies

-- market_zone_category_state
CREATE POLICY "Admins full access zone_category_state"
  ON public.market_zone_category_state FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read zone_category_state"
  ON public.market_zone_category_state FOR SELECT
  USING (true);

-- market_health_snapshots
CREATE POLICY "Admins full access health_snapshots"
  ON public.market_health_snapshots FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read health_snapshots"
  ON public.market_health_snapshots FOR SELECT
  USING (true);

-- growth_autopilot_actions
CREATE POLICY "Admins full access autopilot_actions"
  ON public.growth_autopilot_actions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read autopilot_actions"
  ON public.growth_autopilot_actions FOR SELECT
  USING (true);

-- 7. RPC: compute_zone_health_score
-- Deterministic scoring based on supply, demand, quality inputs
CREATE OR REPLACE FUNCTION public.compute_zone_health_score(
  p_zone_id uuid,
  p_category text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supply_score numeric := 0;
  v_demand_score numeric := 0;
  v_quality_score numeric := 0;
  v_health_score numeric := 0;
  v_health_label text := 'stable';
  v_provider_count int := 0;
  v_capacity_pct numeric := 0;
  v_active_subs int := 0;
  v_recent_issues int := 0;
  v_recent_jobs int := 0;
  v_zone_zips text[];
  v_inputs jsonb;
  v_snapshot_id uuid;
BEGIN
  -- Get zone zip codes
  SELECT zip_codes INTO v_zone_zips FROM zones WHERE id = p_zone_id;

  -- Supply: count approved providers covering this zone with matching capabilities
  SELECT COUNT(DISTINCT pc.provider_org_id) INTO v_provider_count
  FROM provider_coverage pc
  JOIN provider_orgs po ON po.id = pc.provider_org_id
  WHERE pc.zone_id = p_zone_id
    AND pc.request_status = 'APPROVED'
    AND po.status = 'active';

  -- Supply score: 0-100 based on provider count (1 provider = 30, 2 = 60, 3+ = 100)
  v_supply_score := LEAST(100, v_provider_count * 33);

  -- Demand: count active subscriptions in the zone
  SELECT COUNT(*) INTO v_active_subs
  FROM subscriptions s
  WHERE s.zone_id = p_zone_id
    AND s.status = 'active';

  -- Demand score: 0-100 based on subscriber count
  v_demand_score := LEAST(100, v_active_subs * 10);

  -- Quality: recent issues vs recent jobs (last 30 days)
  SELECT COUNT(*) INTO v_recent_jobs
  FROM jobs j
  WHERE j.zone_id = p_zone_id
    AND j.created_at > now() - interval '30 days';

  SELECT COUNT(*) INTO v_recent_issues
  FROM job_issues ji
  JOIN jobs j ON j.id = ji.job_id
  WHERE j.zone_id = p_zone_id
    AND ji.created_at > now() - interval '30 days';

  -- Quality score: 100 if no issues, decreases with issue ratio
  IF v_recent_jobs > 0 THEN
    v_quality_score := GREATEST(0, 100 - (v_recent_issues::numeric / v_recent_jobs * 200));
  ELSE
    v_quality_score := 100; -- no jobs = no quality issues
  END IF;

  -- Overall health: weighted average (supply 40%, demand 20%, quality 40%)
  v_health_score := (v_supply_score * 0.4 + v_demand_score * 0.2 + v_quality_score * 0.4);

  -- Label
  IF v_health_score >= 70 THEN v_health_label := 'stable';
  ELSIF v_health_score >= 40 THEN v_health_label := 'tight';
  ELSE v_health_label := 'risk';
  END IF;

  v_inputs := jsonb_build_object(
    'provider_count', v_provider_count,
    'active_subs', v_active_subs,
    'recent_jobs', v_recent_jobs,
    'recent_issues', v_recent_issues
  );

  -- Insert snapshot
  INSERT INTO market_health_snapshots (zone_id, category, supply_score, demand_score, quality_score, health_score, health_label, inputs)
  VALUES (p_zone_id, p_category, v_supply_score, v_demand_score, v_quality_score, v_health_score, v_health_label, v_inputs)
  RETURNING id INTO v_snapshot_id;

  RETURN jsonb_build_object(
    'snapshot_id', v_snapshot_id,
    'supply_score', v_supply_score,
    'demand_score', v_demand_score,
    'quality_score', v_quality_score,
    'health_score', v_health_score,
    'health_label', v_health_label,
    'inputs', v_inputs
  );
END;
$$;

-- 8. RPC: record_autopilot_action
CREATE OR REPLACE FUNCTION public.record_autopilot_action(
  p_zone_id uuid,
  p_category text,
  p_action_type text,
  p_previous_state text DEFAULT NULL,
  p_new_state text DEFAULT NULL,
  p_trigger_source text DEFAULT 'autopilot',
  p_reason text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO growth_autopilot_actions (zone_id, category, action_type, previous_state, new_state, trigger_source, reason, metadata, actor_user_id)
  VALUES (p_zone_id, p_category, p_action_type, p_previous_state, p_new_state, p_trigger_source, p_reason, p_metadata, auth.uid())
  RETURNING id INTO v_id;

  -- If it's a state transition, update the state table
  IF p_new_state IS NOT NULL THEN
    INSERT INTO market_zone_category_state (zone_id, category, status)
    VALUES (p_zone_id, p_category, p_new_state::market_zone_category_status)
    ON CONFLICT (zone_id, category) DO UPDATE SET
      status = p_new_state::market_zone_category_status,
      updated_at = now();
  END IF;

  RETURN v_id;
END;
$$;

-- 9. RPC: admin_override_zone_state
CREATE OR REPLACE FUNCTION public.admin_override_zone_state(
  p_zone_id uuid,
  p_category text,
  p_new_state text,
  p_reason text,
  p_lock_days int DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_state text;
  v_lock_until timestamptz := NULL;
BEGIN
  -- Must be admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Get current state
  SELECT status::text INTO v_old_state
  FROM market_zone_category_state
  WHERE zone_id = p_zone_id AND category = p_category;

  IF p_lock_days IS NOT NULL THEN
    v_lock_until := now() + (p_lock_days || ' days')::interval;
  END IF;

  -- Upsert state
  INSERT INTO market_zone_category_state (zone_id, category, status, locked_until, locked_by_admin_user_id, lock_reason)
  VALUES (p_zone_id, p_category, p_new_state::market_zone_category_status, v_lock_until, auth.uid(), p_reason)
  ON CONFLICT (zone_id, category) DO UPDATE SET
    status = p_new_state::market_zone_category_status,
    locked_until = v_lock_until,
    locked_by_admin_user_id = auth.uid(),
    lock_reason = p_reason,
    updated_at = now();

  -- Log action
  INSERT INTO growth_autopilot_actions (zone_id, category, action_type, previous_state, new_state, trigger_source, reason, actor_user_id, metadata)
  VALUES (p_zone_id, p_category, 'state_override', v_old_state, p_new_state, 'admin', p_reason, auth.uid(),
    jsonb_build_object('lock_days', p_lock_days, 'lock_until', v_lock_until));

  -- Audit log
  INSERT INTO admin_audit_log (admin_user_id, action, entity_type, entity_id, reason, before, after)
  VALUES (auth.uid(), 'zone_state_override', 'market_zone_category_state', p_zone_id, p_reason,
    jsonb_build_object('state', v_old_state),
    jsonb_build_object('state', p_new_state, 'lock_days', p_lock_days));
END;
$$;

-- 10. Grant execute
GRANT EXECUTE ON FUNCTION public.compute_zone_health_score(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_autopilot_action(uuid, text, text, text, text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_override_zone_state(uuid, text, text, text, int) TO authenticated;
