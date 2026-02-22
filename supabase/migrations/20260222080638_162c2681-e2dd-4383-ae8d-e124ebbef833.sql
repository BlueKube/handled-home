
-- M5 + M6: Update confirm_routine RPC to check paused SKUs and archive previous active routine
CREATE OR REPLACE FUNCTION public.confirm_routine(p_routine_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_routine routines%ROWTYPE;
  v_version routine_versions%ROWTYPE;
  v_sub subscriptions%ROWTYPE;
  v_entitlements plan_entitlement_versions%ROWTYPE;
  v_item record;
  v_total_weekly_equivalent numeric := 0;
  v_included numeric := 0;
  v_max_extras numeric := 0;
  v_new_version_id uuid;
  v_next_version int;
  v_cadence_multiplier numeric;
  v_paused_skus text[];
BEGIN
  -- 1. Lock and validate routine
  SELECT * INTO v_routine FROM routines
    WHERE id = p_routine_id AND customer_id = auth.uid()
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Routine not found or not owned by caller';
  END IF;

  -- 2. Get active subscription for this property
  SELECT * INTO v_sub FROM subscriptions
    WHERE property_id = v_routine.property_id
      AND customer_id = auth.uid()
      AND status IN ('active', 'trialing')
    ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active subscription found for this property';
  END IF;

  -- 3. Get entitlement version
  SELECT * INTO v_entitlements FROM plan_entitlement_versions
    WHERE id = COALESCE(v_routine.entitlement_version_id, v_sub.entitlement_version_id,
      (SELECT current_entitlement_version_id FROM plans WHERE id = v_sub.plan_id));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No entitlement version found';
  END IF;

  -- 4. Get current draft version
  SELECT * INTO v_version FROM routine_versions
    WHERE routine_id = p_routine_id AND status = 'draft'
    ORDER BY version_number DESC LIMIT 1
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No draft version found for this routine';
  END IF;

  -- M5: Check for paused/inactive SKUs
  SELECT array_agg(ss.name) INTO v_paused_skus
  FROM routine_items ri
  JOIN service_skus ss ON ss.id = ri.sku_id
  WHERE ri.routine_version_id = v_version.id
    AND ss.status != 'active';

  IF v_paused_skus IS NOT NULL AND array_length(v_paused_skus, 1) > 0 THEN
    RAISE EXCEPTION 'Cannot confirm routine: the following services are no longer available: %', array_to_string(v_paused_skus, ', ');
  END IF;

  -- 5. Validate entitlement fit — compute total weekly-equivalent demand
  FOR v_item IN
    SELECT ri.*, ss.name as sku_name_live, ss.fulfillment_mode as fm, ss.duration_minutes as dm,
           ss.required_photos as rp, ss.checklist as cl
    FROM routine_items ri
    JOIN service_skus ss ON ss.id = ri.sku_id
    WHERE ri.routine_version_id = v_version.id
  LOOP
    CASE v_item.cadence_type
      WHEN 'weekly' THEN v_cadence_multiplier := 1.0;
      WHEN 'biweekly' THEN v_cadence_multiplier := 0.5;
      WHEN 'four_week' THEN v_cadence_multiplier := 0.25;
      WHEN 'monthly' THEN v_cadence_multiplier := 0.25;
      WHEN 'quarterly' THEN v_cadence_multiplier := 0.083;
      ELSE v_cadence_multiplier := 1.0;
    END CASE;
    v_total_weekly_equivalent := v_total_weekly_equivalent + v_cadence_multiplier;
  END LOOP;

  -- Check limits based on model type
  CASE v_entitlements.model_type
    WHEN 'credits_per_cycle' THEN
      v_included := COALESCE(v_entitlements.included_credits, 0);
      v_max_extras := CASE WHEN v_entitlements.extra_allowed THEN COALESCE(v_entitlements.max_extra_credits, 0) ELSE 0 END;
    WHEN 'count_per_cycle' THEN
      v_included := COALESCE(v_entitlements.included_count, 0);
      v_max_extras := CASE WHEN v_entitlements.extra_allowed THEN COALESCE(v_entitlements.max_extra_count, 0) ELSE 0 END;
    WHEN 'minutes_per_cycle' THEN
      v_included := COALESCE(v_entitlements.included_minutes, 0);
      v_max_extras := CASE WHEN v_entitlements.extra_allowed THEN COALESCE(v_entitlements.max_extra_minutes, 0) ELSE 0 END;
  END CASE;

  -- Total demand over a 4-week billing cycle
  IF (v_total_weekly_equivalent * 4) > (v_included + v_max_extras) THEN
    RAISE EXCEPTION 'Routine exceeds plan entitlement limits (% services over 4 weeks, limit %)',
      ROUND(v_total_weekly_equivalent * 4, 1), (v_included + v_max_extras);
  END IF;

  -- 6. Snapshot SKU data into routine items
  UPDATE routine_items ri SET
    sku_name = ss.name,
    fulfillment_mode = ss.fulfillment_mode::text,
    duration_minutes = ss.duration_minutes,
    proof_photo_labels = ss.required_photos,
    proof_photo_count = jsonb_array_length(COALESCE(ss.required_photos, '[]'::jsonb)),
    checklist_count = jsonb_array_length(COALESCE(ss.checklist, '[]'::jsonb))
  FROM service_skus ss
  WHERE ri.sku_id = ss.id AND ri.routine_version_id = v_version.id;

  -- 7. Lock the version
  UPDATE routine_versions SET
    status = 'locked',
    locked_at = now(),
    effective_at = COALESCE(v_sub.billing_cycle_end_at, v_sub.current_period_end, now())
  WHERE id = v_version.id;

  -- M6: Archive any existing active routine for this property before activating
  UPDATE routines SET status = 'archived'
  WHERE property_id = v_routine.property_id
    AND customer_id = auth.uid()
    AND status = 'active'
    AND id != p_routine_id;

  -- 8. Activate the routine
  UPDATE routines SET
    status = 'active',
    plan_id = v_sub.plan_id,
    zone_id = v_sub.zone_id,
    entitlement_version_id = v_entitlements.id,
    effective_at = COALESCE(v_sub.billing_cycle_end_at, v_sub.current_period_end, now())
  WHERE id = p_routine_id;

  RETURN jsonb_build_object(
    'status', 'confirmed',
    'routine_id', p_routine_id,
    'version_id', v_version.id,
    'effective_at', COALESCE(v_sub.billing_cycle_end_at, v_sub.current_period_end, now())
  );
END;
$function$;
