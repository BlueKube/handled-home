
-- ============================================================
-- Module 07: Routine & Bundle Builder — Database Schema
-- ============================================================

-- 1. Create cadence_type enum
CREATE TYPE public.cadence_type AS ENUM (
  'weekly',
  'biweekly',
  'four_week',
  'monthly',
  'quarterly'
);

-- 2. Routines table — one per property
CREATE TABLE public.routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id),
  zone_id uuid REFERENCES public.zones(id),
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  entitlement_version_id uuid REFERENCES public.plan_entitlement_versions(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  effective_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, status) -- only one draft or active per property
);

-- 3. Routine versions — versioned snapshots
CREATE TABLE public.routine_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  version_number int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'locked')),
  effective_at timestamptz,
  locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (routine_id, version_number)
);

-- 4. Routine items — per version, per SKU
CREATE TABLE public.routine_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_version_id uuid NOT NULL REFERENCES public.routine_versions(id) ON DELETE CASCADE,
  sku_id uuid NOT NULL REFERENCES public.service_skus(id),
  cadence_type public.cadence_type NOT NULL DEFAULT 'weekly',
  cadence_detail jsonb NOT NULL DEFAULT '{}',
  -- Snapshot fields from SKU at lock time
  sku_name text,
  fulfillment_mode text,
  duration_minutes int,
  proof_photo_labels jsonb DEFAULT '[]',
  proof_photo_count int DEFAULT 0,
  checklist_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Zone ops config
CREATE TABLE public.zone_ops_config (
  zone_id uuid PRIMARY KEY REFERENCES public.zones(id),
  provider_home_label text,
  provider_home_lat double precision,
  provider_home_lng double precision,
  target_stops_per_week int DEFAULT 15,
  max_stops_per_week int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Add geo columns to properties (nullable)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS geohash text;

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_ops_config ENABLE ROW LEVEL SECURITY;

-- Routines: customer manages own, admin reads all
CREATE POLICY "Customers manage own routines"
  ON public.routines FOR ALL
  USING (auth.uid() = customer_id);

CREATE POLICY "Admins can read all routines"
  ON public.routines FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Routine versions: customer manages via routine ownership
CREATE POLICY "Customers manage own routine versions"
  ON public.routine_versions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.routines r WHERE r.id = routine_versions.routine_id AND r.customer_id = auth.uid()
  ));

CREATE POLICY "Admins can read all routine versions"
  ON public.routine_versions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Routine items: customer manages via version→routine ownership
CREATE POLICY "Customers manage own routine items"
  ON public.routine_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.routine_versions rv
    JOIN public.routines r ON r.id = rv.routine_id
    WHERE rv.id = routine_items.routine_version_id AND r.customer_id = auth.uid()
  ));

CREATE POLICY "Admins can read all routine items"
  ON public.routine_items FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Zone ops config: admin manages, authenticated reads
CREATE POLICY "Admins manage zone ops config"
  ON public.zone_ops_config FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read zone ops config"
  ON public.zone_ops_config FOR SELECT
  USING (true);

-- ============================================================
-- Triggers
-- ============================================================

CREATE TRIGGER update_routines_updated_at
  BEFORE UPDATE ON public.routines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_zone_ops_config_updated_at
  BEFORE UPDATE ON public.zone_ops_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RPCs
-- ============================================================

-- confirm_routine: atomic lock of a routine version with SKU snapshots
CREATE OR REPLACE FUNCTION public.confirm_routine(p_routine_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;
