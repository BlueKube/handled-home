
-- Corrective migration: fix propose_provider_action RPC (P0/P1/P2/P3 findings)
-- and add missing GRANT on get_planner_horizon_stats

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
  v_customer_id uuid;
  v_decision text := 'approved';
  v_reason text := '';
  v_customer_notified boolean := false;
  v_proposal_id uuid;
  v_max_slip int;
  v_eta_slip_minutes int;
  v_window_end_time time;
  v_config_val jsonb;
BEGIN
  -- 1. Fetch visit with schedule_state filter (P1 fix: re-add filter)
  SELECT v.id, v.scheduling_profile, v.scheduled_date, v.schedule_state,
         v.eta_range_start, v.eta_range_end, v.time_window_end,
         v.property_id,
         pm.provider_org_id AS pm_org_id
    INTO v_visit
    FROM visits v
    JOIN provider_members pm ON pm.user_id = auth.uid()
    WHERE v.id = p_visit_id
      AND v.scheduled_date = current_date
      AND v.schedule_state IN ('scheduled', 'dispatched', 'in_progress')
      AND v.provider_org_id = pm.provider_org_id;

  IF v_visit IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Visit not found, not active today, or not assigned to you'
    );
  END IF;

  -- 2. Read autopilot max ETA slip config
  SELECT config_value INTO v_config_val
    FROM assignment_config
    WHERE config_key = 'autopilot_max_eta_slip_minutes';

  v_max_slip := COALESCE((v_config_val)::int, 30);

  -- 3. Evaluate action
  IF p_action_type = 'running_late' THEN
    v_eta_slip_minutes := COALESCE((p_payload->>'minutes')::int, 15);

    IF v_eta_slip_minutes > v_max_slip THEN
      v_decision := 'denied';
      v_reason := format('ETA slip %s min exceeds max allowed %s min', v_eta_slip_minutes, v_max_slip);
    ELSE
      v_reason := format('ETA slip %s min within tolerance', v_eta_slip_minutes);

      -- Try to update ETAs (defensive cast)
      BEGIN
        UPDATE visits SET
          eta_range_start = (eta_range_start::time + (v_eta_slip_minutes || ' minutes')::interval)::text,
          eta_range_end   = (eta_range_end::time   + (v_eta_slip_minutes || ' minutes')::interval)::text,
          updated_at = now()
        WHERE id = p_visit_id;
      EXCEPTION WHEN OTHERS THEN
        -- ETA text couldn't be cast to time; skip update, still approve
        NULL;
      END;

      -- Check window breach using correct column name (P1 fix: time_window_end)
      BEGIN
        IF v_visit.time_window_end IS NOT NULL AND v_visit.eta_range_end IS NOT NULL THEN
          v_window_end_time := (v_visit.eta_range_end::time + (v_eta_slip_minutes || ' minutes')::interval);
          IF v_window_end_time > v_visit.time_window_end::time THEN
            v_reason := v_reason || ' — WARNING: new ETA may breach appointment window';
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;

      -- Notify customer (P0 fix: resolve customer_id via property)
      BEGIN
        SELECT p.customer_id INTO v_customer_id
          FROM properties p WHERE p.id = v_visit.property_id;

        IF v_customer_id IS NOT NULL THEN
          PERFORM emit_notification(
            v_customer_id,
            'SERVICE',
            'Running Late',
            format('Your provider is running about %s minutes late', v_eta_slip_minutes),
            jsonb_build_object('visit_id', p_visit_id, 'slip_minutes', v_eta_slip_minutes)
          );
          v_customer_notified := true;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;

  ELSIF p_action_type = 'reorder_stops' THEN
    -- Deny for appointment_window visits (lowercase enum - P1 original fix)
    IF v_visit.scheduling_profile IN ('appointment_window') THEN
      v_decision := 'denied';
      v_reason := 'Cannot reorder stops for appointment-window visits';
    ELSE
      v_reason := 'Stop reorder approved for non-windowed visit';
    END IF;

  ELSIF p_action_type = 'push_stop' THEN
    -- Deny for appointment_window and day_commit (lowercase enum - P1 original fix)
    IF v_visit.scheduling_profile IN ('appointment_window', 'day_commit') THEN
      v_decision := 'denied';
      v_reason := 'Cannot push committed/windowed visits';
    ELSE
      v_reason := 'Push approved for flex/service-week visit';
    END IF;

  ELSE
    v_decision := 'denied';
    v_reason := format('Unknown action type: %s', p_action_type);
  END IF;

  -- 4. Insert proposal with CORRECT column names (P0 fix)
  INSERT INTO provider_action_proposals (
    visit_id, provider_org_id, action_type, payload,
    decision, decision_reason, customer_notified,
    decided_at, decided_by
  ) VALUES (
    p_visit_id, v_visit.pm_org_id, p_action_type, p_payload,
    v_decision, v_reason, v_customer_notified,
    now(), 'system'
  )
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

-- P2 fix: grant execute on horizon stats RPC
GRANT EXECUTE ON FUNCTION public.get_planner_horizon_stats(date, int) TO authenticated;
