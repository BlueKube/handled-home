
-- ============================================================
-- Module 06: Service Day Engine — Schema, RLS, RPCs, Triggers
-- ============================================================

-- 1. Add columns to zones table
ALTER TABLE public.zones
  ADD COLUMN IF NOT EXISTS alternative_strategy text NOT NULL DEFAULT 'window_first',
  ADD COLUMN IF NOT EXISTS offer_ttl_hours int NOT NULL DEFAULT 48;

-- 2. zone_service_day_capacity
CREATE TABLE public.zone_service_day_capacity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  day_of_week text NOT NULL,
  service_window text NOT NULL DEFAULT 'any',
  max_homes int NOT NULL,
  buffer_percent int NOT NULL DEFAULT 0,
  assigned_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (zone_id, day_of_week, service_window)
);

ALTER TABLE public.zone_service_day_capacity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read capacity"
  ON public.zone_service_day_capacity FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage capacity"
  ON public.zone_service_day_capacity FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. service_day_assignments
CREATE TABLE public.service_day_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  day_of_week text NOT NULL,
  service_window text NOT NULL DEFAULT 'any',
  status text NOT NULL DEFAULT 'offered',
  rejection_used boolean NOT NULL DEFAULT false,
  reserved_until timestamptz,
  reason_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_active_assignment_per_property
  ON public.service_day_assignments (property_id)
  WHERE status IN ('offered', 'confirmed');

ALTER TABLE public.service_day_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own assignments"
  ON public.service_day_assignments FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Admins can manage all assignments"
  ON public.service_day_assignments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. service_day_offers
CREATE TABLE public.service_day_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.service_day_assignments(id) ON DELETE CASCADE,
  offered_day_of_week text NOT NULL,
  offered_window text NOT NULL DEFAULT 'any',
  offer_type text NOT NULL DEFAULT 'primary',
  rank int NOT NULL DEFAULT 1,
  accepted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_day_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own offers"
  ON public.service_day_offers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.service_day_assignments a
    WHERE a.id = service_day_offers.assignment_id AND a.customer_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all offers"
  ON public.service_day_offers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. service_day_override_log
CREATE TABLE public.service_day_override_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_admin_id uuid NOT NULL,
  assignment_id uuid NOT NULL REFERENCES public.service_day_assignments(id) ON DELETE CASCADE,
  before jsonb NOT NULL,
  after jsonb NOT NULL,
  reason text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_day_override_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert override log"
  ON public.service_day_override_log FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read override log"
  ON public.service_day_override_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. service_day_preferences
CREATE TABLE public.service_day_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  preferred_days text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, property_id)
);

ALTER TABLE public.service_day_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own preferences"
  ON public.service_day_preferences FOR ALL
  USING (auth.uid() = customer_id);

CREATE POLICY "Admins can read all preferences"
  ON public.service_day_preferences FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. updated_at triggers
CREATE TRIGGER update_service_day_assignments_updated_at
  BEFORE UPDATE ON public.service_day_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_zone_service_day_capacity_updated_at
  BEFORE UPDATE ON public.zone_service_day_capacity
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RPCs
-- ============================================================

-- RPC 1: create_or_refresh_service_day_offer
CREATE OR REPLACE FUNCTION public.create_or_refresh_service_day_offer(p_property_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  v_days text[] := ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  v_day text;
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
    -- Return existing
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

      SELECT jsonb_build_object(
        'assignment', (SELECT row_to_json(a) FROM service_day_assignments a WHERE a.id = v_assignment_id),
        'offers', (SELECT jsonb_agg(row_to_json(o)) FROM service_day_offers o WHERE o.assignment_id = v_assignment_id)
      ) INTO v_result;
      RETURN v_result;
    END IF;
  END IF;

  -- Default day full or no capacity row — create assignment on default day but also offer alternatives
  INSERT INTO service_day_assignments (customer_id, property_id, zone_id, day_of_week, service_window, status, reserved_until, reason_code)
    VALUES (auth.uid(), p_property_id, v_zone.id, v_zone.default_service_day::text, 'any', 'offered',
            now() + (v_zone.offer_ttl_hours || ' hours')::interval, 'default_day_full')
    RETURNING id INTO v_assignment_id;

  -- Primary offer (default day, even though full — customer sees it as primary)
  INSERT INTO service_day_offers (assignment_id, offered_day_of_week, offered_window, offer_type, rank)
    VALUES (v_assignment_id, v_zone.default_service_day::text, 'any', 'primary', 1);

  -- Find up to 3 alternatives with capacity
  v_rank := 2;
  FOREACH v_day IN ARRAY v_days LOOP
    EXIT WHEN v_rank > 4;
    IF v_day = v_zone.default_service_day::text THEN CONTINUE; END IF;

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
END;
$$;

-- RPC 2: confirm_service_day
CREATE OR REPLACE FUNCTION public.confirm_service_day(p_assignment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment service_day_assignments%ROWTYPE;
BEGIN
  SELECT * INTO v_assignment FROM service_day_assignments
    WHERE id = p_assignment_id AND customer_id = auth.uid() AND status = 'offered'
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found or not in offered status';
  END IF;

  UPDATE service_day_assignments SET status = 'confirmed', reserved_until = NULL WHERE id = p_assignment_id;
  UPDATE service_day_offers SET accepted = true
    WHERE assignment_id = p_assignment_id AND offered_day_of_week = v_assignment.day_of_week AND offered_window = v_assignment.service_window;

  RETURN jsonb_build_object('status', 'confirmed', 'assignment_id', p_assignment_id);
END;
$$;

-- RPC 3: reject_service_day_once
CREATE OR REPLACE FUNCTION public.reject_service_day_once(p_assignment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment service_day_assignments%ROWTYPE;
  v_zone zones%ROWTYPE;
  v_days text[] := ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  v_day text;
  v_alt record;
  v_rank int := 1;
  v_alternatives jsonb := '[]'::jsonb;
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

  -- Generate new alternatives
  FOREACH v_day IN ARRAY v_days LOOP
    EXIT WHEN v_rank > 3;
    IF v_day = v_assignment.day_of_week THEN CONTINUE; END IF;

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
$$;

-- RPC 4: select_alternative_service_day
CREATE OR REPLACE FUNCTION public.select_alternative_service_day(p_assignment_id uuid, p_offer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment service_day_assignments%ROWTYPE;
  v_offer service_day_offers%ROWTYPE;
  v_old_cap zone_service_day_capacity%ROWTYPE;
  v_new_cap zone_service_day_capacity%ROWTYPE;
  v_effective_max int;
BEGIN
  SELECT * INTO v_assignment FROM service_day_assignments
    WHERE id = p_assignment_id AND customer_id = auth.uid() AND status = 'offered'
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found or not in offered status';
  END IF;

  SELECT * INTO v_offer FROM service_day_offers
    WHERE id = p_offer_id AND assignment_id = p_assignment_id AND offer_type = 'alternative';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  -- Release old capacity
  UPDATE zone_service_day_capacity SET assigned_count = GREATEST(assigned_count - 1, 0)
    WHERE zone_id = v_assignment.zone_id AND day_of_week = v_assignment.day_of_week AND service_window = v_assignment.service_window;

  -- Lock and check new capacity
  SELECT * INTO v_new_cap FROM zone_service_day_capacity
    WHERE zone_id = v_assignment.zone_id AND day_of_week = v_offer.offered_day_of_week AND service_window = v_offer.offered_window
    FOR UPDATE;

  IF FOUND THEN
    v_effective_max := v_new_cap.max_homes + FLOOR(v_new_cap.max_homes * v_new_cap.buffer_percent / 100.0)::int;
    IF v_new_cap.assigned_count >= v_effective_max THEN
      RAISE EXCEPTION 'Selected alternative is no longer available';
    END IF;
    UPDATE zone_service_day_capacity SET assigned_count = assigned_count + 1 WHERE id = v_new_cap.id;
  END IF;

  -- Update assignment
  UPDATE service_day_assignments
    SET day_of_week = v_offer.offered_day_of_week, service_window = v_offer.offered_window,
        status = 'confirmed', reserved_until = NULL
    WHERE id = p_assignment_id;

  UPDATE service_day_offers SET accepted = true WHERE id = p_offer_id;

  RETURN jsonb_build_object('status', 'confirmed', 'day_of_week', v_offer.offered_day_of_week, 'service_window', v_offer.offered_window);
END;
$$;

-- RPC 5: admin_override_service_day
CREATE OR REPLACE FUNCTION public.admin_override_service_day(
  p_assignment_id uuid, p_new_day text, p_new_window text, p_reason text, p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment service_day_assignments%ROWTYPE;
  v_before jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_assignment FROM service_day_assignments WHERE id = p_assignment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found';
  END IF;

  v_before := jsonb_build_object('day_of_week', v_assignment.day_of_week, 'service_window', v_assignment.service_window, 'status', v_assignment.status);

  -- Release old capacity
  UPDATE zone_service_day_capacity SET assigned_count = GREATEST(assigned_count - 1, 0)
    WHERE zone_id = v_assignment.zone_id AND day_of_week = v_assignment.day_of_week AND service_window = v_assignment.service_window;

  -- Increment new capacity (admin override allows exceeding)
  INSERT INTO zone_service_day_capacity (zone_id, day_of_week, service_window, max_homes, assigned_count)
    VALUES (v_assignment.zone_id, p_new_day, p_new_window, 20, 1)
    ON CONFLICT (zone_id, day_of_week, service_window) DO UPDATE SET assigned_count = zone_service_day_capacity.assigned_count + 1;

  -- Update assignment
  UPDATE service_day_assignments
    SET day_of_week = p_new_day, service_window = p_new_window, status = 'confirmed', reserved_until = NULL
    WHERE id = p_assignment_id;

  -- Log override
  INSERT INTO service_day_override_log (actor_admin_id, assignment_id, before, after, reason, notes)
    VALUES (auth.uid(), p_assignment_id, v_before,
            jsonb_build_object('day_of_week', p_new_day, 'service_window', p_new_window, 'status', 'confirmed'),
            p_reason, p_notes);

  RETURN jsonb_build_object('status', 'overridden', 'assignment_id', p_assignment_id);
END;
$$;

-- RPC 6: cleanup_expired_offers
CREATE OR REPLACE FUNCTION public.cleanup_expired_offers()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int := 0;
  v_rec record;
BEGIN
  FOR v_rec IN
    SELECT * FROM service_day_assignments
      WHERE status = 'offered' AND reserved_until IS NOT NULL AND reserved_until < now()
      FOR UPDATE
  LOOP
    -- Release capacity
    UPDATE zone_service_day_capacity SET assigned_count = GREATEST(assigned_count - 1, 0)
      WHERE zone_id = v_rec.zone_id AND day_of_week = v_rec.day_of_week AND service_window = v_rec.service_window;

    UPDATE service_day_assignments SET status = 'superseded' WHERE id = v_rec.id;
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('expired_count', v_count);
END;
$$;
