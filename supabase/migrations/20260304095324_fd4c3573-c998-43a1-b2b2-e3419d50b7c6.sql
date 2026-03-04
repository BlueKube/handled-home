
-- Sprint 8 Phase 3 Review Fixes: All P1/P2/P3 issues

-- ── 1) report_provider_issue — fix 'USER'→'CUSTOMER', 'HIGH'/'NORMAL'→'CRITICAL'/'SERVICE' ──
CREATE OR REPLACE FUNCTION public.report_provider_issue(
  p_visit_id uuid,
  p_issue_type text,
  p_reason_code text,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_visit record;
  v_caller_id uuid := auth.uid();
  v_is_member boolean;
  v_severity ops_exception_severity;
  v_exception_id uuid;
  v_hold_id uuid := NULL;
  v_sla_hours int;
  v_idem_key text;
  v_hold_ttl_hours int;
BEGIN
  IF p_issue_type NOT IN ('access_failure', 'provider_unavailable', 'weather_safety', 'quality_block') THEN
    RAISE EXCEPTION 'Invalid issue_type: %', p_issue_type;
  END IF;

  SELECT v.id, v.provider_org_id, v.customer_id, v.scheduled_date, v.zone_id,
         v.schedule_state, v.scheduling_profile, v.time_window_start, v.time_window_end
    INTO v_visit FROM visits v WHERE v.id = p_visit_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Visit not found: %', p_visit_id; END IF;

  SELECT EXISTS(
    SELECT 1 FROM provider_members pm
     WHERE pm.provider_org_id = v_visit.provider_org_id
       AND pm.user_id = v_caller_id AND pm.status = 'active'
  ) INTO v_is_member;

  IF NOT v_is_member THEN RAISE EXCEPTION 'Not a member of provider org'; END IF;

  IF v_visit.scheduled_date <= CURRENT_DATE + interval '2 days' THEN
    v_severity := 'urgent'; v_sla_hours := 8;
  ELSE
    v_severity := 'soon'; v_sla_hours := 48;
  END IF;

  v_idem_key := p_issue_type || ':' || p_visit_id || ':' || v_visit.scheduled_date || ':reactive';

  INSERT INTO ops_exceptions (
    exception_type, severity, sla_target_at, status,
    visit_id, provider_org_id, customer_id, scheduled_date, zone_id,
    reason_summary, reason_details, source, idempotency_key
  ) VALUES (
    p_issue_type::ops_exception_type, v_severity,
    now() + (v_sla_hours || ' hours')::interval, 'open',
    p_visit_id, v_visit.provider_org_id, v_visit.customer_id,
    v_visit.scheduled_date, v_visit.zone_id,
    COALESCE(p_note, p_issue_type || ' reported by provider'),
    jsonb_build_object('reason_code', p_reason_code, 'reported_by', v_caller_id,
      'scheduling_profile', v_visit.scheduling_profile, 'note', p_note),
    'provider_report', v_idem_key
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_exception_id;

  IF v_exception_id IS NULL THEN
    SELECT id INTO v_exception_id FROM ops_exceptions WHERE idempotency_key = v_idem_key;
    RETURN jsonb_build_object('exception_id', v_exception_id, 'created', false, 'hold_id', null);
  END IF;

  -- Access failure: mark visit + auto-hold
  IF p_issue_type = 'access_failure' THEN
    UPDATE visits SET schedule_state = 'exception_pending',
      unassigned_reason = 'Access failure: ' || COALESCE(p_reason_code, 'unknown'),
      updated_at = now()
    WHERE id = p_visit_id;

    SELECT COALESCE((config_value#>>'{}')::int, 12) INTO v_hold_ttl_hours
      FROM assignment_config WHERE config_key = 'hold_ttl_hours';
    v_hold_ttl_hours := COALESCE(v_hold_ttl_hours, 12);

    INSERT INTO customer_reschedule_holds (
      visit_id, customer_id, held_date, hold_type, status, expires_at,
      held_window_start, held_window_end
    ) VALUES (
      p_visit_id, v_visit.customer_id,
      CASE
        WHEN extract(dow from v_visit.scheduled_date + 1) IN (0, 6)
          THEN v_visit.scheduled_date + 3
        ELSE v_visit.scheduled_date + 1
      END,
      'auto_access_failure', 'held',
      now() + (v_hold_ttl_hours || ' hours')::interval,
      v_visit.time_window_start, v_visit.time_window_end
    ) RETURNING id INTO v_hold_id;

    PERFORM emit_notification_event(
      p_event_type := 'CUSTOMER_ACCESS_FAILURE_HOLD',
      p_idempotency_key := 'access_failure_hold:' || p_visit_id || ':' || v_visit.scheduled_date,
      p_audience_type := 'CUSTOMER',
      p_audience_user_id := v_visit.customer_id,
      p_priority := 'CRITICAL',
      p_payload := jsonb_build_object('visit_id', p_visit_id, 'exception_id', v_exception_id,
        'hold_id', v_hold_id, 'reason_code', p_reason_code)
    );
  END IF;

  PERFORM emit_notification_event(
    p_event_type := 'ADMIN_EXCEPTION_CREATED',
    p_idempotency_key := 'admin_exception:' || v_exception_id,
    p_audience_type := 'ADMIN',
    p_priority := CASE WHEN v_severity = 'urgent' THEN 'CRITICAL' ELSE 'SERVICE' END,
    p_payload := jsonb_build_object('exception_id', v_exception_id, 'exception_type', p_issue_type,
      'visit_id', p_visit_id, 'provider_org_id', v_visit.provider_org_id, 'reason_code', p_reason_code)
  );

  RETURN jsonb_build_object('exception_id', v_exception_id, 'created', true,
    'hold_id', v_hold_id, 'severity', v_severity::text);
END;
$$;

-- ── 2) request_customer_reschedule — fix 'completed'→'complete', 'NORMAL'→'SERVICE' ──
CREATE OR REPLACE FUNCTION public.request_customer_reschedule(
  p_visit_id uuid,
  p_reason text DEFAULT 'Customer requested reschedule'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_visit record;
  v_caller_id uuid := auth.uid();
  v_exception_id uuid;
  v_idem_key text;
  v_severity ops_exception_severity;
BEGIN
  SELECT v.id, v.customer_id, v.provider_org_id, v.scheduled_date, v.zone_id,
         v.schedule_state, v.scheduling_profile, v.plan_window
    INTO v_visit FROM visits v WHERE v.id = p_visit_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Visit not found'; END IF;
  IF v_visit.customer_id != v_caller_id THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF v_visit.schedule_state IN ('complete', 'canceled', 'exception_pending') THEN
    RAISE EXCEPTION 'Cannot reschedule visit in state: %', v_visit.schedule_state;
  END IF;

  v_severity := CASE WHEN v_visit.scheduled_date <= CURRENT_DATE + 2 THEN 'urgent'::ops_exception_severity
    ELSE 'soon'::ops_exception_severity END;
  v_idem_key := 'customer_reschedule:' || p_visit_id || ':' || v_visit.scheduled_date;

  INSERT INTO ops_exceptions (
    exception_type, severity, sla_target_at, status,
    visit_id, provider_org_id, customer_id, scheduled_date, zone_id,
    reason_summary, reason_details, source, idempotency_key
  ) VALUES (
    'customer_reschedule', v_severity,
    CASE WHEN v_severity = 'urgent' THEN now() + interval '8 hours' ELSE now() + interval '48 hours' END,
    'open', p_visit_id, v_visit.provider_org_id, v_visit.customer_id,
    v_visit.scheduled_date, v_visit.zone_id, p_reason,
    jsonb_build_object('requested_by', v_caller_id, 'scheduling_profile', v_visit.scheduling_profile,
      'plan_window', v_visit.plan_window, 'original_date', v_visit.scheduled_date),
    'customer_request', v_idem_key
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_exception_id;

  IF v_exception_id IS NULL THEN
    SELECT id INTO v_exception_id FROM ops_exceptions WHERE idempotency_key = v_idem_key;
    RETURN jsonb_build_object('exception_id', v_exception_id, 'created', false);
  END IF;

  PERFORM emit_notification_event(
    p_event_type := 'ADMIN_EXCEPTION_CREATED',
    p_idempotency_key := 'admin_exception:' || v_exception_id,
    p_audience_type := 'ADMIN', p_priority := 'SERVICE',
    p_payload := jsonb_build_object('exception_id', v_exception_id, 'exception_type', 'customer_reschedule',
      'visit_id', p_visit_id, 'customer_id', v_visit.customer_id, 'reason', p_reason)
  );

  RETURN jsonb_build_object('exception_id', v_exception_id, 'created', true);
END;
$$;

-- ── 3) confirm_reschedule_hold — fix 'USER'→'CUSTOMER', 'NORMAL'→'SERVICE' ──
CREATE OR REPLACE FUNCTION public.confirm_reschedule_hold(
  p_hold_id uuid,
  p_action text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hold record;
  v_caller_id uuid := auth.uid();
BEGIN
  SELECT h.id, h.visit_id, h.customer_id, h.status, h.held_date,
         h.held_window_start, h.held_window_end
    INTO v_hold FROM customer_reschedule_holds h WHERE h.id = p_hold_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Hold not found'; END IF;
  IF v_hold.customer_id != v_caller_id THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF v_hold.status != 'held' THEN RAISE EXCEPTION 'Hold no longer active (%)' , v_hold.status; END IF;
  IF p_action NOT IN ('confirm', 'release') THEN RAISE EXCEPTION 'Invalid action'; END IF;

  IF p_action = 'confirm' THEN
    UPDATE customer_reschedule_holds SET status = 'confirmed', updated_at = now() WHERE id = p_hold_id;

    UPDATE visits SET scheduled_date = v_hold.held_date,
      time_window_start = v_hold.held_window_start, time_window_end = v_hold.held_window_end,
      schedule_state = 'scheduled', unassigned_reason = NULL, updated_at = now()
    WHERE id = v_hold.visit_id;

    UPDATE ops_exceptions SET status = 'resolved', resolution_type = 'move_day',
      resolution_note = 'Customer confirmed auto-held reschedule slot',
      resolved_at = now(), resolved_by_user_id = v_caller_id, updated_at = now()
    WHERE visit_id = v_hold.visit_id AND exception_type = 'access_failure'
      AND status IN ('open', 'acknowledged', 'in_progress');

    PERFORM emit_notification_event(
      p_event_type := 'CUSTOMER_PROMISE_CHANGED',
      p_idempotency_key := 'promise_changed:' || v_hold.visit_id || ':' || v_hold.held_date,
      p_audience_type := 'CUSTOMER', p_audience_user_id := v_hold.customer_id,
      p_priority := 'SERVICE',
      p_payload := jsonb_build_object('visit_id', v_hold.visit_id, 'new_date', v_hold.held_date,
        'new_window_start', v_hold.held_window_start, 'new_window_end', v_hold.held_window_end)
    );

    RETURN jsonb_build_object('status', 'confirmed', 'new_date', v_hold.held_date);
  ELSE
    UPDATE customer_reschedule_holds SET status = 'released', updated_at = now() WHERE id = p_hold_id;
    RETURN jsonb_build_object('status', 'released');
  END IF;
END;
$$;

-- ── 4) apply_customer_reschedule — fix 'completed'→'complete', 'USER'→'CUSTOMER', 'NORMAL'→'SERVICE', add date validation ──
CREATE OR REPLACE FUNCTION public.apply_customer_reschedule(
  p_visit_id uuid,
  p_new_date date,
  p_new_window_start time DEFAULT NULL,
  p_new_window_end time DEFAULT NULL,
  p_exception_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_visit record;
  v_caller_id uuid := auth.uid();
  v_old_date date;
BEGIN
  -- P3 fix: validate new date is not in the past
  IF p_new_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot reschedule to a past date: %', p_new_date;
  END IF;

  SELECT id, customer_id, scheduled_date, schedule_state, provider_org_id, zone_id
    INTO v_visit FROM visits WHERE id = p_visit_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Visit not found'; END IF;
  IF v_visit.customer_id != v_caller_id THEN RAISE EXCEPTION 'Not authorized'; END IF;
  -- P1 fix: 'complete' not 'completed'
  IF v_visit.schedule_state IN ('complete', 'canceled') THEN
    RAISE EXCEPTION 'Cannot reschedule (%)' , v_visit.schedule_state;
  END IF;

  v_old_date := v_visit.scheduled_date;

  UPDATE visits SET scheduled_date = p_new_date,
    time_window_start = COALESCE(p_new_window_start, time_window_start),
    time_window_end = COALESCE(p_new_window_end, time_window_end),
    schedule_state = 'scheduled', unassigned_reason = NULL, updated_at = now()
  WHERE id = p_visit_id;

  IF p_exception_id IS NOT NULL THEN
    UPDATE ops_exceptions SET status = 'resolved', resolution_type = 'move_day',
      resolution_note = 'Customer self-serve reschedule to ' || p_new_date::text,
      resolved_at = now(), resolved_by_user_id = v_caller_id, updated_at = now()
    WHERE id = p_exception_id AND customer_id = v_caller_id;
  END IF;

  UPDATE customer_reschedule_holds SET status = 'released', updated_at = now()
  WHERE visit_id = p_visit_id AND status = 'held';

  PERFORM emit_notification_event(
    p_event_type := 'CUSTOMER_PROMISE_CHANGED',
    p_idempotency_key := 'promise_changed:' || p_visit_id || ':' || p_new_date::text,
    p_audience_type := 'CUSTOMER', p_audience_user_id := v_visit.customer_id,
    p_priority := 'SERVICE',
    p_payload := jsonb_build_object('visit_id', p_visit_id, 'old_date', v_old_date,
      'new_date', p_new_date, 'new_window_start', p_new_window_start, 'new_window_end', p_new_window_end)
  );

  RETURN jsonb_build_object('status', 'rescheduled', 'old_date', v_old_date, 'new_date', p_new_date);
END;
$$;

-- ── 5) expire_stale_holds — add escalation of linked exceptions + notification ──
CREATE OR REPLACE FUNCTION public.expire_stale_holds()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_hold record;
BEGIN
  -- Expire all stale holds and process each one
  FOR v_hold IN
    UPDATE customer_reschedule_holds SET status = 'expired', updated_at = now()
    WHERE status = 'held' AND expires_at < now()
    RETURNING id, visit_id, customer_id
  LOOP
    -- Escalate linked open access_failure exceptions
    UPDATE ops_exceptions
      SET severity = 'urgent', updated_at = now(),
          reason_summary = reason_summary || ' [hold expired — needs manual resolution]'
    WHERE visit_id = v_hold.visit_id
      AND exception_type = 'access_failure'
      AND status IN ('open', 'acknowledged', 'in_progress');

    -- Notify customer that their hold expired
    PERFORM emit_notification_event(
      p_event_type := 'CUSTOMER_HOLD_EXPIRED',
      p_idempotency_key := 'hold_expired:' || v_hold.id,
      p_audience_type := 'CUSTOMER',
      p_audience_user_id := v_hold.customer_id,
      p_priority := 'SERVICE',
      p_payload := jsonb_build_object('hold_id', v_hold.id, 'visit_id', v_hold.visit_id)
    );
  END LOOP;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ── 6) GRANT EXECUTE on all Phase 3 RPCs ──
GRANT EXECUTE ON FUNCTION public.report_provider_issue(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_customer_reschedule(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_reschedule_hold(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_customer_reschedule(uuid, date, time, time, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_holds() TO authenticated;
