
-- H1: Fix create_or_refresh_service_day_offer so that when default day is full,
-- the primary offer points to the best available day (with reserved capacity).
-- H2: Implement alternative_strategy (window_first vs day_first) in both RPCs.

-- Helper function to get day order based on strategy
CREATE OR REPLACE FUNCTION public.get_day_order(p_strategy text, p_default_day text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
DECLARE
  v_all_days text[] := ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  v_idx int;
  v_result text[] := '{}';
  v_i int;
BEGIN
  IF p_strategy = 'day_first' THEN
    -- Find index of default day
    v_idx := array_position(v_all_days, p_default_day);
    IF v_idx IS NULL THEN v_idx := 1; END IF;
    -- Interleave: +1, -1, +2, -2, +3, -3
    FOR v_i IN 1..6 LOOP
      IF v_idx + v_i <= 7 THEN
        v_result := v_result || v_all_days[v_idx + v_i];
      END IF;
      IF v_idx - v_i >= 1 THEN
        v_result := v_result || v_all_days[v_idx - v_i];
      END IF;
    END LOOP;
    RETURN v_result;
  ELSE
    -- window_first: just Mon-Sun excluding default
    RETURN ARRAY(SELECT unnest(v_all_days) EXCEPT SELECT p_default_day);
  END IF;
END;
$function$;

-- Rewrite create_or_refresh_service_day_offer
CREATE OR REPLACE FUNCTION public.create_or_refresh_service_day_offer(p_property_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_property properties%ROWTYPE;
  v_zone zones%ROWTYPE;
  v_existing service_day_assignments%ROWTYPE;
  v_assignment_id uuid;
  v_cap zone_service_day_capacity%ROWTYPE;
  v_effective_max int;
  v_result jsonb;
  v_alt record;
  v_rank int;
  v_day text;
  v_ordered_days text[];
  v_best_day text := NULL;
  v_best_cap_id uuid := NULL;
BEGIN
  -- Verify property ownership
  SELECT * INTO v_property FROM properties WHERE id = p_property_id AND user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property not found or not owned by caller';
  END IF;

  -- Find zone for property
  SELECT z.* INTO v_zone FROM zones z WHERE z.id IN (
    SELECT s.zone_id FROM subscriptions s WHERE s.property_id = p_property_id AND s.customer_id = auth.uid() AND s.status = 'active'
  ) LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active subscription with zone found for this property';
  END IF;

  -- Check for existing active assignment
  SELECT * INTO v_existing FROM service_day_assignments
    WHERE property_id = p_property_id AND status IN ('offered', 'confirmed');
  IF FOUND THEN
    SELECT jsonb_build_object(
      'assignment', row_to_json(v_existing),
      'offers', COALESCE((SELECT jsonb_agg(row_to_json(o)) FROM service_day_offers o WHERE o.assignment_id = v_existing.id), '[]'::jsonb)
    ) INTO v_result;
    RETURN v_result;
  END IF;

  -- Lock capacity row for default day
  SELECT * INTO v_cap FROM zone_service_day_capacity
    WHERE zone_id = v_zone.id AND day_of_week = v_zone.default_service_day::text AND service_window = 'any'
    FOR UPDATE;

  IF FOUND THEN
    v_effective_max := v_cap.max_homes + FLOOR(v_cap.max_homes * v_cap.buffer_percent / 100.0)::int;

    IF v_cap.assigned_count < v_effective_max THEN
      -- Capacity available on default day
      UPDATE zone_service_day_capacity SET assigned_count = assigned_count + 1 WHERE id = v_cap.id;

      INSERT INTO service_day_assignments (customer_id, property_id, zone_id, day_of_week, service_window, status, reserved_until, reason_code)
        VALUES (auth.uid(), p_property_id, v_zone.id, v_zone.default_service_day::text, 'any', 'offered',
                now() + (v_zone.offer_ttl_hours || ' hours')::interval, 'default_day_available')
        RETURNING id INTO v_assignment_id;

      INSERT INTO service_day_offers (assignment_id, offered_day_of_week, offered_window, offer_type, rank)
        VALUES (v_assignment_id, v_zone.default_service_day::text, 'any', 'primary', 1);

      -- Also generate alternatives using strategy
      v_ordered_days := get_day_order(v_zone.alternative_strategy, v_zone.default_service_day::text);
      v_rank := 2;
      FOREACH v_day IN ARRAY v_ordered_days LOOP
        EXIT WHEN v_rank > 4;
        SELECT * INTO v_alt FROM zone_service_day_capacity
          WHERE zone_id = v_zone.id AND day_of_week = v_day AND service_window = 'any'
          FOR UPDATE;
        IF FOUND AND v_alt.assigned_count < (v_alt.max_homes + FLOOR(v_alt.max_homes * v_alt.buffer_percent / 100.0)::int) THEN
          INSERT INTO service_day_offers (assignment_id, offered_day_of_week, offered_window, offer_type, rank)
            VALUES (v_assignment_id, v_day, 'any', 'alternative', v_rank);
          v_rank := v_rank + 1;
        END IF;
      END LOOP;

      SELECT jsonb_build_object(
        'assignment', (SELECT row_to_json(a) FROM service_day_assignments a WHERE a.id = v_assignment_id),
        'offers', (SELECT jsonb_agg(row_to_json(o)) FROM service_day_offers o WHERE o.assignment_id = v_assignment_id)
      ) INTO v_result;
      RETURN v_result;
    END IF;
  END IF;

  -- Default day full or no capacity row — find best available day using strategy
  v_ordered_days := get_day_order(v_zone.alternative_strategy, v_zone.default_service_day::text);

  FOREACH v_day IN ARRAY v_ordered_days LOOP
    SELECT * INTO v_alt FROM zone_service_day_capacity
      WHERE zone_id = v_zone.id AND day_of_week = v_day AND service_window = 'any'
      FOR UPDATE;
    IF FOUND AND v_alt.assigned_count < (v_alt.max_homes + FLOOR(v_alt.max_homes * v_alt.buffer_percent / 100.0)::int) THEN
      v_best_day := v_day;
      v_best_cap_id := v_alt.id;
      EXIT;
    END IF;
  END LOOP;

  IF v_best_day IS NOT NULL THEN
    -- Reserve capacity on the best available day
    UPDATE zone_service_day_capacity SET assigned_count = assigned_count + 1 WHERE id = v_best_cap_id;

    INSERT INTO service_day_assignments (customer_id, property_id, zone_id, day_of_week, service_window, status, reserved_until, reason_code)
      VALUES (auth.uid(), p_property_id, v_zone.id, v_best_day, 'any', 'offered',
              now() + (v_zone.offer_ttl_hours || ' hours')::interval, 'default_day_full')
      RETURNING id INTO v_assignment_id;

    -- Primary offer is the best available day (with reserved capacity)
    INSERT INTO service_day_offers (assignment_id, offered_day_of_week, offered_window, offer_type, rank)
      VALUES (v_assignment_id, v_best_day, 'any', 'primary', 1);

    -- Find additional alternatives
    v_rank := 2;
    FOREACH v_day IN ARRAY v_ordered_days LOOP
      EXIT WHEN v_rank > 4;
      IF v_day = v_best_day THEN CONTINUE; END IF;

      SELECT * INTO v_alt FROM zone_service_day_capacity
        WHERE zone_id = v_zone.id AND day_of_week = v_day AND service_window = 'any'
        FOR UPDATE;
      IF FOUND AND v_alt.assigned_count < (v_alt.max_homes + FLOOR(v_alt.max_homes * v_alt.buffer_percent / 100.0)::int) THEN
        INSERT INTO service_day_offers (assignment_id, offered_day_of_week, offered_window, offer_type, rank)
          VALUES (v_assignment_id, v_day, 'any', 'alternative', v_rank);
        v_rank := v_rank + 1;
      END IF;
    END LOOP;
  ELSE
    -- No capacity anywhere — create assignment on default day with no reservation
    INSERT INTO service_day_assignments (customer_id, property_id, zone_id, day_of_week, service_window, status, reserved_until, reason_code)
      VALUES (auth.uid(), p_property_id, v_zone.id, v_zone.default_service_day::text, 'any', 'offered',
              now() + (v_zone.offer_ttl_hours || ' hours')::interval, 'no_capacity')
      RETURNING id INTO v_assignment_id;

    INSERT INTO service_day_offers (assignment_id, offered_day_of_week, offered_window, offer_type, rank)
      VALUES (v_assignment_id, v_zone.default_service_day::text, 'any', 'primary', 1);
  END IF;

  SELECT jsonb_build_object(
    'assignment', (SELECT row_to_json(a) FROM service_day_assignments a WHERE a.id = v_assignment_id),
    'offers', (SELECT jsonb_agg(row_to_json(o)) FROM service_day_offers o WHERE o.assignment_id = v_assignment_id)
  ) INTO v_result;
  RETURN v_result;
END;
$function$;

-- Rewrite reject_service_day_once to use alternative_strategy
CREATE OR REPLACE FUNCTION public.reject_service_day_once(p_assignment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_assignment service_day_assignments%ROWTYPE;
  v_zone zones%ROWTYPE;
  v_day text;
  v_alt record;
  v_rank int := 1;
  v_alternatives jsonb := '[]'::jsonb;
  v_ordered_days text[];
BEGIN
  SELECT * INTO v_assignment FROM service_day_assignments
    WHERE id = p_assignment_id AND customer_id = auth.uid() AND status = 'offered'
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found or not in offered status';
  END IF;

  IF v_assignment.rejection_used THEN
    RAISE EXCEPTION 'Rejection already used for this assignment';
  END IF;

  UPDATE service_day_assignments SET rejection_used = true WHERE id = p_assignment_id;

  SELECT * INTO v_zone FROM zones WHERE id = v_assignment.zone_id;

  -- Delete existing alternative offers
  DELETE FROM service_day_offers WHERE assignment_id = p_assignment_id AND offer_type = 'alternative';

  -- Generate new alternatives using zone's alternative_strategy
  v_ordered_days := get_day_order(v_zone.alternative_strategy, v_assignment.day_of_week);

  FOREACH v_day IN ARRAY v_ordered_days LOOP
    EXIT WHEN v_rank > 3;

    SELECT * INTO v_alt FROM zone_service_day_capacity
      WHERE zone_id = v_assignment.zone_id AND day_of_week = v_day AND service_window = 'any'
      FOR UPDATE;

    IF FOUND AND v_alt.assigned_count < (v_alt.max_homes + FLOOR(v_alt.max_homes * v_alt.buffer_percent / 100.0)::int) THEN
      INSERT INTO service_day_offers (assignment_id, offered_day_of_week, offered_window, offer_type, rank)
        VALUES (p_assignment_id, v_day, 'any', 'alternative', v_rank);
      v_rank := v_rank + 1;
    END IF;
  END LOOP;

  SELECT COALESCE(jsonb_agg(row_to_json(o)), '[]'::jsonb) INTO v_alternatives
    FROM service_day_offers o WHERE o.assignment_id = p_assignment_id AND o.offer_type = 'alternative';

  RETURN jsonb_build_object('alternatives', v_alternatives, 'rejection_used', true);
END;
$function$;
