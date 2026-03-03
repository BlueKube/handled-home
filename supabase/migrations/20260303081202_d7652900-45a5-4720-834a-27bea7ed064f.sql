
-- Drop existing function to change return type
DROP FUNCTION IF EXISTS public.admin_override_zone_state(uuid, text, text, text, integer);

-- 8) Enhanced admin_override_zone_state to support new states + change log
CREATE OR REPLACE FUNCTION public.admin_override_zone_state(
  p_zone_id uuid,
  p_category text,
  p_new_state text,
  p_reason text,
  p_lock_days integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_old_state text;
  v_lock_until timestamptz := NULL;
  v_is_locked boolean := false;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT status::text, locked_until
  INTO v_old_state, v_lock_until
  FROM market_zone_category_state
  WHERE zone_id = p_zone_id AND category = p_category;

  IF v_lock_until IS NOT NULL AND v_lock_until > now() AND p_new_state != 'PROTECT_QUALITY' THEN
    v_is_locked := true;
  END IF;

  IF p_lock_days IS NOT NULL THEN
    v_lock_until := now() + (p_lock_days || ' days')::interval;
  ELSE
    v_lock_until := NULL;
  END IF;

  INSERT INTO market_zone_category_state (zone_id, category, status, locked_until, locked_by_admin_user_id, lock_reason, last_state_change_at, last_state_change_by, previous_status)
  VALUES (p_zone_id, p_category, p_new_state::market_zone_category_status, v_lock_until, auth.uid(), p_reason, now(), 'admin', v_old_state)
  ON CONFLICT (zone_id, category) DO UPDATE SET
    status = p_new_state::market_zone_category_status,
    locked_until = v_lock_until,
    locked_by_admin_user_id = auth.uid(),
    lock_reason = p_reason,
    previous_status = v_old_state,
    last_state_change_at = now(),
    last_state_change_by = 'admin',
    updated_at = now();

  UPDATE zone_state_recommendations
  SET status = 'superseded', updated_at = now()
  WHERE zone_id = p_zone_id AND category = p_category AND status = 'pending';

  INSERT INTO zone_state_change_log (zone_id, category, previous_state, new_state, change_source, reason, actor_user_id, metrics_snapshot)
  VALUES (p_zone_id, p_category, v_old_state, p_new_state, 'manual', p_reason, auth.uid(), '{}'::jsonb);

  INSERT INTO growth_autopilot_actions (zone_id, category, action_type, previous_state, new_state, trigger_source, reason, actor_user_id, metadata)
  VALUES (p_zone_id, p_category, 'state_override', v_old_state, p_new_state, 'admin', p_reason, auth.uid(),
    jsonb_build_object('lock_days', p_lock_days, 'lock_until', v_lock_until, 'was_locked', v_is_locked));

  INSERT INTO admin_audit_log (admin_user_id, action, entity_type, entity_id, reason, before, after)
  VALUES (auth.uid(), 'zone_state_override', 'market_zone_category_state', p_zone_id, p_reason,
    jsonb_build_object('state', v_old_state),
    jsonb_build_object('state', p_new_state, 'lock_days', p_lock_days));

  RETURN jsonb_build_object(
    'success', true,
    'previous_state', v_old_state,
    'new_state', p_new_state,
    'was_locked', v_is_locked
  );
END;
$function$;

-- 9) RPC: Approve a recommendation
CREATE OR REPLACE FUNCTION public.approve_zone_state_recommendation(
  p_recommendation_id uuid,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rec record;
  v_old_state text;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_rec
  FROM zone_state_recommendations
  WHERE id = p_recommendation_id AND status = 'pending'
  FOR UPDATE;

  IF v_rec IS NULL THEN
    RAISE EXCEPTION 'Recommendation not found or not pending';
  END IF;

  SELECT status::text INTO v_old_state
  FROM market_zone_category_state
  WHERE zone_id = v_rec.zone_id AND category = v_rec.category;

  INSERT INTO market_zone_category_state (zone_id, category, status, last_state_change_at, last_state_change_by, previous_status)
  VALUES (v_rec.zone_id, v_rec.category, v_rec.recommended_state::market_zone_category_status, now(), 'approved_recommendation', v_old_state)
  ON CONFLICT (zone_id, category) DO UPDATE SET
    status = v_rec.recommended_state::market_zone_category_status,
    previous_status = v_old_state,
    last_state_change_at = now(),
    last_state_change_by = 'approved_recommendation',
    locked_until = NULL,
    locked_by_admin_user_id = NULL,
    lock_reason = NULL,
    updated_at = now();

  UPDATE zone_state_recommendations
  SET status = 'approved', reviewed_by_admin_user_id = auth.uid(), review_note = p_note, reviewed_at = now(), updated_at = now()
  WHERE id = p_recommendation_id;

  INSERT INTO zone_state_change_log (zone_id, category, previous_state, new_state, change_source, reason, reason_codes, actor_user_id, recommendation_id, metrics_snapshot)
  VALUES (v_rec.zone_id, v_rec.category, v_old_state, v_rec.recommended_state, 'approved_recommendation',
    COALESCE(p_note, array_to_string(v_rec.reasons, '; ')), v_rec.reasons, auth.uid(), p_recommendation_id, v_rec.metrics_snapshot);

  INSERT INTO admin_audit_log (admin_user_id, action, entity_type, entity_id, reason, before, after)
  VALUES (auth.uid(), 'approve_zone_state_recommendation', 'zone_state_recommendations', p_recommendation_id,
    COALESCE(p_note, 'Approved recommendation'),
    jsonb_build_object('state', v_old_state, 'recommendation_id', p_recommendation_id),
    jsonb_build_object('state', v_rec.recommended_state));

  RETURN jsonb_build_object(
    'success', true,
    'zone_id', v_rec.zone_id,
    'category', v_rec.category,
    'previous_state', v_old_state,
    'new_state', v_rec.recommended_state
  );
END;
$function$;

-- 10) RPC: Reject a recommendation
CREATE OR REPLACE FUNCTION public.reject_zone_state_recommendation(
  p_recommendation_id uuid,
  p_note text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rec record;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_rec
  FROM zone_state_recommendations
  WHERE id = p_recommendation_id AND status = 'pending'
  FOR UPDATE;

  IF v_rec IS NULL THEN
    RAISE EXCEPTION 'Recommendation not found or not pending';
  END IF;

  UPDATE zone_state_recommendations
  SET status = 'rejected', reviewed_by_admin_user_id = auth.uid(), review_note = p_note, reviewed_at = now(), updated_at = now()
  WHERE id = p_recommendation_id;

  INSERT INTO admin_audit_log (admin_user_id, action, entity_type, entity_id, reason, before, after)
  VALUES (auth.uid(), 'reject_zone_state_recommendation', 'zone_state_recommendations', p_recommendation_id, p_note,
    jsonb_build_object('recommended_state', v_rec.recommended_state, 'confidence', v_rec.confidence),
    jsonb_build_object('status', 'rejected'));

  RETURN jsonb_build_object('success', true, 'recommendation_id', p_recommendation_id);
END;
$function$;

-- 11) RPC: Snooze a recommendation
CREATE OR REPLACE FUNCTION public.snooze_zone_state_recommendation(
  p_recommendation_id uuid,
  p_snooze_days integer DEFAULT 7,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rec record;
  v_snoozed_until timestamptz;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_rec
  FROM zone_state_recommendations
  WHERE id = p_recommendation_id AND status = 'pending'
  FOR UPDATE;

  IF v_rec IS NULL THEN
    RAISE EXCEPTION 'Recommendation not found or not pending';
  END IF;

  v_snoozed_until := now() + (p_snooze_days || ' days')::interval;

  UPDATE zone_state_recommendations
  SET status = 'snoozed', snoozed_until = v_snoozed_until, reviewed_by_admin_user_id = auth.uid(), review_note = p_note, reviewed_at = now(), updated_at = now()
  WHERE id = p_recommendation_id;

  RETURN jsonb_build_object('success', true, 'snoozed_until', v_snoozed_until);
END;
$function$;

-- 12) Update check_zone_readiness to use market_zone_category_state
CREATE OR REPLACE FUNCTION public.check_zone_readiness(p_zip_codes text[], p_category text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_best_status text := 'not_supported';
  v_matched_zones jsonb := '[]'::jsonb;
  v_zone record;
BEGIN
  FOR v_zone IN
    SELECT z.id, z.name,
           COALESCE(mzcs.status::text, 'CLOSED') AS launch_status
    FROM zones z
    LEFT JOIN market_zone_category_state mzcs ON mzcs.zone_id = z.id AND mzcs.category = p_category
    WHERE z.status = 'active'
      AND z.zip_codes && p_zip_codes
  LOOP
    v_matched_zones := v_matched_zones || jsonb_build_object(
      'zone_id', v_zone.id,
      'zone_name', v_zone.name,
      'launch_status', v_zone.launch_status
    );

    CASE v_zone.launch_status
      WHEN 'OPEN' THEN v_best_status := 'open';
      WHEN 'SOFT_LAUNCH' THEN
        IF v_best_status NOT IN ('open') THEN v_best_status := 'soft_launch'; END IF;
      WHEN 'WAITLIST_ONLY' THEN
        IF v_best_status NOT IN ('open', 'soft_launch') THEN v_best_status := 'waitlist'; END IF;
      WHEN 'PROVIDER_RECRUITING' THEN
        IF v_best_status NOT IN ('open', 'soft_launch', 'waitlist') THEN v_best_status := 'waitlist'; END IF;
      WHEN 'PROTECT_QUALITY' THEN
        IF v_best_status NOT IN ('open', 'soft_launch', 'waitlist') THEN v_best_status := 'waitlist'; END IF;
      ELSE NULL;
    END CASE;
  END LOOP;

  RETURN jsonb_build_object(
    'status', v_best_status,
    'category', p_category,
    'matched_zones', v_matched_zones,
    'zip_codes_checked', to_jsonb(p_zip_codes)
  );
END;
$function$;
