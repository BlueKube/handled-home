
CREATE OR REPLACE FUNCTION public.propose_provider_action(
  p_visit_id uuid,
  p_action_type text,
  p_payload jsonb DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_visit record;
  v_decision text := 'approved';
  v_reason text := '';
  v_customer_notified boolean := false;
  v_eta_slip_minutes int;
  v_max_slip int := 30;
  v_config_val jsonb;
  v_customer_id uuid;
  v_new_eta_start text;
  v_new_eta_end text;
  v_window_end_time time;
BEGIN
  -- 1. Fetch visit with ownership + schedule_state filter
  SELECT v.id, v.scheduling_profile, v.eta_range_start, v.eta_range_end,
         v.time_window_end, v.scheduled_date,
         pm.provider_org_id AS pm_org_id,
         v.property_id
    INTO v_visit
    FROM visits v
    JOIN provider_members pm ON pm.user_id = auth.uid()
     AND v.provider_org_id = pm.provider_org_id
   WHERE v.id = p_visit_id
     AND v.scheduled_date = current_date
     AND v.schedule_state IN ('scheduled', 'dispatched', 'in_progress')
   LIMIT 1;

  IF v_visit IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Visit not found or not active today');
  END IF;

  -- 2. Read config
  SELECT config_value INTO v_config_val
    FROM assignment_config
   WHERE config_key = 'autopilot_max_eta_slip_minutes';

  BEGIN
    v_max_slip := COALESCE((v_config_val #>> '{}')::int, 30);
  EXCEPTION WHEN OTHERS THEN
    v_max_slip := 30;
  END;

  -- 3. Evaluate action
  IF p_action_type = 'running_late' THEN
    v_eta_slip_minutes := COALESCE((p_payload->>'slip_minutes')::int, 15);

    IF v_eta_slip_minutes > v_max_slip THEN
      v_decision := 'denied';
      v_reason := format('Slip of %s min exceeds max allowed %s min', v_eta_slip_minutes, v_max_slip);
    ELSE
      v_reason := format('ETA shifted by %s minutes — within tolerance', v_eta_slip_minutes);

      BEGIN
        v_new_eta_start := (v_visit.eta_range_start::time + (v_eta_slip_minutes || ' minutes')::interval)::text;
        v_new_eta_end   := (v_visit.eta_range_end::time   + (v_eta_slip_minutes || ' minutes')::interval)::text;

        IF v_visit.time_window_end IS NOT NULL THEN
          v_window_end_time := v_visit.time_window_end::time;
          IF (v_new_eta_start::time) > v_window_end_time THEN
            v_reason := v_reason || ' — WARNING: new ETA exceeds customer window';
          END IF;
        END IF;

        UPDATE visits
           SET eta_range_start = v_new_eta_start,
               eta_range_end   = v_new_eta_end,
               updated_at      = now()
         WHERE id = p_visit_id;
      EXCEPTION WHEN OTHERS THEN
        v_reason := v_reason || ' — could not update ETA (format issue)';
      END;

      -- Notify customer
      SELECT p.customer_id INTO v_customer_id
        FROM properties p WHERE p.id = v_visit.property_id;

      IF v_customer_id IS NOT NULL THEN
        BEGIN
          PERFORM emit_notification(
            v_customer_id,
            'SERVICE',
            'Your provider is running late',
            format('New ETA: %s minutes later than originally scheduled', v_eta_slip_minutes),
            jsonb_build_object('visit_id', p_visit_id, 'slip_minutes', v_eta_slip_minutes)
          );
          v_customer_notified := true;
        EXCEPTION WHEN OTHERS THEN
          v_customer_notified := false;
        END;
      END IF;
    END IF;

  ELSIF p_action_type = 'reorder_stops' THEN
    IF v_visit.scheduling_profile IN ('appointment_window') THEN
      v_decision := 'denied';
      v_reason := 'Cannot reorder appointment-window visits';
    ELSE
      v_reason := 'Stop reorder approved — no appointment windows affected';
    END IF;

  ELSIF p_action_type = 'push_stop' THEN
    IF v_visit.scheduling_profile IN ('appointment_window', 'day_commit') THEN
      v_decision := 'denied';
      v_reason := 'Cannot push committed or windowed visits';
    ELSE
      v_reason := 'Stop push approved — flexible/unattended visit';
    END IF;

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Unknown action type');
  END IF;

  -- 4. Record proposal
  INSERT INTO provider_action_proposals (
    visit_id, provider_org_id, action_type, payload,
    decision, decision_reason, customer_notified,
    decided_at, decided_by
  ) VALUES (
    p_visit_id, v_visit.pm_org_id, p_action_type, p_payload,
    v_decision, v_reason, v_customer_notified,
    now(), 'system'
  );

  RETURN jsonb_build_object(
    'success', true,
    'decision', v_decision,
    'reason', v_reason,
    'customer_notified', v_customer_notified
  );
END;
$$;
