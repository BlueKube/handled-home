
-- P1: Fix scheduling_profile case mismatch (uppercase → lowercase)
-- P2: Fix current_date::text coercion
-- P2: Add safer ETA time handling
-- P3: Add CHECK constraints on provider_action_proposals

-- Add CHECK constraints
ALTER TABLE public.provider_action_proposals
  ADD CONSTRAINT chk_action_type CHECK (action_type IN ('running_late','reorder_stops','push_stop')),
  ADD CONSTRAINT chk_decision CHECK (decision IN ('pending','approved','denied'));

-- Recreate propose_provider_action with all fixes
CREATE OR REPLACE FUNCTION public.propose_provider_action(
  p_visit_id uuid,
  p_action_type text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_visit record;
  v_provider_user_id uuid;
  v_proposal_id uuid;
  v_decision text := 'pending';
  v_reason text := '';
  v_customer_notified boolean := false;
  v_eta_slip_minutes int;
  v_max_slip int;
  v_config_row record;
  v_new_start text;
  v_new_end text;
  v_window_end_time time;
BEGIN
  -- Get calling user
  v_provider_user_id := auth.uid();
  IF v_provider_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get the visit + verify provider ownership
  SELECT v.*, pm.provider_org_id AS pm_org_id
  INTO v_visit
  FROM visits v
  JOIN provider_members pm ON pm.user_id = v_provider_user_id AND pm.is_active = true
  WHERE v.id = p_visit_id
    AND v.provider_org_id = pm.provider_org_id
    AND v.scheduled_date = current_date;

  IF v_visit IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Visit not found or not assigned to you today');
  END IF;

  -- ── RUNNING LATE ──
  IF p_action_type = 'running_late' THEN
    v_eta_slip_minutes := COALESCE((p_payload->>'slip_minutes')::int, 15);

    -- Read max slip from config
    SELECT config_value INTO v_config_row
    FROM assignment_config
    WHERE config_key = 'autopilot_max_eta_slip_minutes';

    v_max_slip := COALESCE((v_config_row.config_value #>> '{}')::int, 30);

    IF v_eta_slip_minutes > v_max_slip THEN
      v_decision := 'denied';
      v_reason := format('Slip of %s min exceeds max allowed %s min', v_eta_slip_minutes, v_max_slip);
    ELSE
      v_decision := 'approved';
      v_reason := format('ETA pushed by %s minutes', v_eta_slip_minutes);

      -- Safely update ETA — only if current values parse as time
      BEGIN
        v_new_start := (v_visit.eta_range_start::time + (v_eta_slip_minutes || ' minutes')::interval)::text;
        v_new_end := (v_visit.eta_range_end::time + (v_eta_slip_minutes || ' minutes')::interval)::text;

        UPDATE visits
        SET eta_range_start = v_new_start,
            eta_range_end = v_new_end,
            updated_at = now()
        WHERE id = p_visit_id;
      EXCEPTION WHEN others THEN
        -- ETA columns not in parseable time format; skip update, still approve
        v_reason := v_reason || ' (ETA fields could not be updated — format issue)';
      END;

      -- Check if window might be breached for appointment_window visits
      IF v_visit.scheduling_profile = 'appointment_window' AND v_visit.eta_range_end IS NOT NULL THEN
        BEGIN
          v_window_end_time := v_visit.eta_range_end::time + (v_eta_slip_minutes || ' minutes')::interval;
          IF v_visit.window_end IS NOT NULL AND v_window_end_time > v_visit.window_end::time THEN
            v_reason := v_reason || ' — WARNING: new ETA may exceed appointment window';
          END IF;
        EXCEPTION WHEN others THEN
          NULL; -- ignore parse errors for window check
        END;
      END IF;

      -- Notify customer
      BEGIN
        PERFORM emit_notification(
          v_visit.customer_id,
          'eta_update',
          'Updated ETA',
          format('Your provider is running about %s minutes late.', v_eta_slip_minutes),
          jsonb_build_object('visit_id', p_visit_id, 'slip_minutes', v_eta_slip_minutes)
        );
        v_customer_notified := true;
      EXCEPTION WHEN others THEN
        v_customer_notified := false;
      END;
    END IF;

  -- ── REORDER STOPS ──
  ELSIF p_action_type = 'reorder_stops' THEN
    -- Deny for appointment_window visits (lowercase match)
    IF v_visit.scheduling_profile = 'appointment_window' THEN
      v_decision := 'denied';
      v_reason := 'Cannot reorder appointment-window visits';
    ELSE
      v_decision := 'approved';
      v_reason := 'Stop reorder approved — no window constraints';
    END IF;

  -- ── PUSH STOP ──
  ELSIF p_action_type = 'push_stop' THEN
    -- Deny for appointment_window and day_commit (lowercase match)
    IF v_visit.scheduling_profile IN ('appointment_window', 'day_commit') THEN
      v_decision := 'denied';
      v_reason := format('Cannot push %s visits', v_visit.scheduling_profile);
    ELSE
      v_decision := 'approved';
      v_reason := 'Stop pushed to end of route';
    END IF;

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Unknown action type');
  END IF;

  -- Record the proposal
  INSERT INTO provider_action_proposals (visit_id, provider_user_id, action_type, payload, decision, reason)
  VALUES (p_visit_id, v_provider_user_id, p_action_type, p_payload, v_decision, v_reason)
  RETURNING id INTO v_proposal_id;

  RETURN jsonb_build_object(
    'success', true,
    'proposal_id', v_proposal_id,
    'decision', v_decision,
    'reason', v_reason,
    'customer_notified', v_customer_notified
  );
END;
$$;

-- ── P2 FIX: Create get_planner_horizon_stats RPC to replace 28 sequential queries ──
CREATE OR REPLACE FUNCTION public.get_planner_horizon_stats(
  p_start_date date DEFAULT current_date,
  p_days int DEFAULT 14
)
RETURNS TABLE(
  stat_date date,
  total bigint,
  assigned bigint,
  unassigned bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d::date AS stat_date,
    COUNT(v.id) AS total,
    COUNT(v.id) FILTER (WHERE v.provider_org_id IS NOT NULL) AS assigned,
    COUNT(v.id) FILTER (WHERE v.provider_org_id IS NULL) AS unassigned
  FROM generate_series(p_start_date, p_start_date + (p_days - 1), '1 day'::interval) AS d
  LEFT JOIN visits v
    ON v.scheduled_date = d::date
    AND v.schedule_state NOT IN ('canceled', 'rescheduled')
  GROUP BY d
  ORDER BY d;
$$;
