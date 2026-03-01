
-- P5-F4: Change volatility from STABLE to VOLATILE since has_role reads mutable data
CREATE OR REPLACE FUNCTION public.get_property_profile_context(p_property_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_caller_id uuid;
  v_is_admin boolean;
  v_coverage jsonb;
  v_sizing jsonb;
  v_eligible text[];
  v_suppressed text[];
  v_switch_candidates text[];
  v_high_pain text[] := ARRAY['trash_bins','pet_waste','gutters','windows','power_wash'];
  v_high_confidence_upsells text[];
  v_row record;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT user_id INTO v_owner_id FROM properties WHERE id = p_property_id;
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Property not found';
  END IF;

  v_is_admin := has_role(v_caller_id, 'admin');
  IF v_caller_id != v_owner_id AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COALESCE(jsonb_object_agg(
    pc.category_key,
    jsonb_build_object(
      'status', pc.coverage_status,
      'switch_intent', pc.switch_intent
    )
  ), '{}'::jsonb)
  INTO v_coverage
  FROM property_coverage pc
  WHERE pc.property_id = p_property_id;

  SELECT COALESCE(jsonb_build_object(
    'home_sqft_tier', ps.home_sqft_tier,
    'yard_tier', ps.yard_tier,
    'windows_tier', ps.windows_tier,
    'stories_tier', ps.stories_tier
  ), '{}'::jsonb)
  INTO v_sizing
  FROM property_signals ps
  WHERE ps.property_id = p_property_id;

  IF v_sizing IS NULL THEN
    v_sizing := '{}'::jsonb;
  END IF;

  v_eligible := ARRAY[]::text[];
  v_suppressed := ARRAY[]::text[];
  v_switch_candidates := ARRAY[]::text[];
  v_high_confidence_upsells := ARRAY[]::text[];

  FOR v_row IN
    SELECT category_key, coverage_status, switch_intent
    FROM property_coverage
    WHERE property_id = p_property_id
  LOOP
    IF v_row.coverage_status = 'NA' THEN
      v_suppressed := array_append(v_suppressed, v_row.category_key);
    ELSIF v_row.coverage_status = 'NONE' THEN
      v_eligible := array_append(v_eligible, v_row.category_key);
      IF v_row.category_key = ANY(v_high_pain) THEN
        v_high_confidence_upsells := array_append(v_high_confidence_upsells, v_row.category_key);
      END IF;
    ELSIF v_row.coverage_status = 'SELF' THEN
      IF v_row.category_key = ANY(v_high_pain) THEN
        v_eligible := array_append(v_eligible, v_row.category_key);
        v_high_confidence_upsells := array_append(v_high_confidence_upsells, v_row.category_key);
      END IF;
    ELSIF v_row.coverage_status = 'PROVIDER' THEN
      IF v_row.switch_intent IN ('OPEN_NOW', 'OPEN_LATER') THEN
        v_switch_candidates := array_append(v_switch_candidates, v_row.category_key);
        v_eligible := array_append(v_eligible, v_row.category_key);
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'property_id', p_property_id,
    'coverage', v_coverage,
    'sizing', v_sizing,
    'computed', jsonb_build_object(
      'eligible_categories', to_jsonb(v_eligible),
      'suppressed_categories', to_jsonb(v_suppressed),
      'high_confidence_upsells', to_jsonb(v_high_confidence_upsells),
      'switch_candidates', to_jsonb(v_switch_candidates)
    )
  );
END;
$$;
