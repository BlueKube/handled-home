
-- Sprint 2G-D Part 1: Pricing & Payout Engine Schema

-- ═══ 1. SKU Pricing Base ═══
CREATE TABLE public.sku_pricing_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id uuid NOT NULL REFERENCES public.service_skus(id) ON DELETE CASCADE,
  base_price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  active_from timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  changed_by uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sku_pricing_base_sku_active ON public.sku_pricing_base(sku_id, active_from DESC);

ALTER TABLE public.sku_pricing_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read sku_pricing_base"
  ON public.sku_pricing_base FOR SELECT TO authenticated
  USING (public.is_admin_member(auth.uid()));

CREATE POLICY "Superuser write sku_pricing_base"
  ON public.sku_pricing_base FOR ALL TO authenticated
  USING (public.is_superuser(auth.uid()))
  WITH CHECK (public.is_superuser(auth.uid()));

-- ═══ 2. SKU Pricing Zone Overrides ═══
CREATE TABLE public.sku_pricing_zone_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  sku_id uuid NOT NULL REFERENCES public.service_skus(id) ON DELETE CASCADE,
  price_multiplier numeric(5,3),
  override_price_cents integer,
  active_from timestamptz NOT NULL DEFAULT now(),
  active_to timestamptz,
  version integer NOT NULL DEFAULT 1,
  changed_by uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sku_pricing_zone_sku_active ON public.sku_pricing_zone_overrides(zone_id, sku_id, active_from DESC);

ALTER TABLE public.sku_pricing_zone_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read sku_pricing_zone_overrides"
  ON public.sku_pricing_zone_overrides FOR SELECT TO authenticated
  USING (public.is_admin_member(auth.uid()));

CREATE POLICY "Superuser write sku_pricing_zone_overrides"
  ON public.sku_pricing_zone_overrides FOR ALL TO authenticated
  USING (public.is_superuser(auth.uid()))
  WITH CHECK (public.is_superuser(auth.uid()));

-- ═══ 3. Provider Payout Base ═══
CREATE TABLE public.provider_payout_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id uuid NOT NULL REFERENCES public.service_skus(id) ON DELETE CASCADE,
  base_payout_cents integer NOT NULL DEFAULT 0,
  active_from timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  changed_by uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_provider_payout_base_sku_active ON public.provider_payout_base(sku_id, active_from DESC);

ALTER TABLE public.provider_payout_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read provider_payout_base"
  ON public.provider_payout_base FOR SELECT TO authenticated
  USING (public.is_admin_member(auth.uid()));

CREATE POLICY "Superuser write provider_payout_base"
  ON public.provider_payout_base FOR ALL TO authenticated
  USING (public.is_superuser(auth.uid()))
  WITH CHECK (public.is_superuser(auth.uid()));

-- ═══ 4. Provider Payout Zone Overrides ═══
CREATE TABLE public.provider_payout_zone_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  sku_id uuid NOT NULL REFERENCES public.service_skus(id) ON DELETE CASCADE,
  payout_multiplier numeric(5,3),
  override_payout_cents integer,
  active_from timestamptz NOT NULL DEFAULT now(),
  active_to timestamptz,
  version integer NOT NULL DEFAULT 1,
  changed_by uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payout_zone_sku_active ON public.provider_payout_zone_overrides(zone_id, sku_id, active_from DESC);

ALTER TABLE public.provider_payout_zone_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read provider_payout_zone_overrides"
  ON public.provider_payout_zone_overrides FOR SELECT TO authenticated
  USING (public.is_admin_member(auth.uid()));

CREATE POLICY "Superuser write provider_payout_zone_overrides"
  ON public.provider_payout_zone_overrides FOR ALL TO authenticated
  USING (public.is_superuser(auth.uid()))
  WITH CHECK (public.is_superuser(auth.uid()));

-- ═══ 5. Provider Org Contracts ═══
CREATE TYPE public.provider_contract_type AS ENUM ('partner_flat', 'partner_time_guarded', 'contractor_time_based');

CREATE TABLE public.provider_org_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id) ON DELETE CASCADE,
  contract_type public.provider_contract_type NOT NULL DEFAULT 'partner_flat',
  category text,
  active_from timestamptz NOT NULL DEFAULT now(),
  active_to timestamptz,
  version integer NOT NULL DEFAULT 1,
  changed_by uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_provider_org_contracts_org ON public.provider_org_contracts(provider_org_id, active_from DESC);

ALTER TABLE public.provider_org_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read provider_org_contracts"
  ON public.provider_org_contracts FOR SELECT TO authenticated
  USING (public.is_admin_member(auth.uid()));

CREATE POLICY "Superuser write provider_org_contracts"
  ON public.provider_org_contracts FOR ALL TO authenticated
  USING (public.is_superuser(auth.uid()))
  WITH CHECK (public.is_superuser(auth.uid()));

-- ═══ 6. Payout Overtime Rules ═══
CREATE TABLE public.payout_overtime_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  sku_id uuid REFERENCES public.service_skus(id) ON DELETE CASCADE,
  category text,
  expected_minutes integer NOT NULL DEFAULT 30,
  overtime_rate_cents_per_min integer NOT NULL DEFAULT 50,
  overtime_start_after_minutes integer NOT NULL DEFAULT 5,
  overtime_cap_cents integer NOT NULL DEFAULT 2000,
  version integer NOT NULL DEFAULT 1,
  changed_by uuid NOT NULL,
  reason text,
  active_from timestamptz NOT NULL DEFAULT now(),
  active_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payout_overtime_zone ON public.payout_overtime_rules(zone_id, active_from DESC);

ALTER TABLE public.payout_overtime_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read payout_overtime_rules"
  ON public.payout_overtime_rules FOR SELECT TO authenticated
  USING (public.is_admin_member(auth.uid()));

CREATE POLICY "Superuser write payout_overtime_rules"
  ON public.payout_overtime_rules FOR ALL TO authenticated
  USING (public.is_superuser(auth.uid()))
  WITH CHECK (public.is_superuser(auth.uid()));

-- ═══ 7. Effective Price Resolution Function ═══
CREATE OR REPLACE FUNCTION public.get_effective_sku_price(p_zone_id uuid, p_sku_id uuid)
RETURNS TABLE(base_price_cents integer, zone_multiplier numeric, zone_override_cents integer, effective_price_cents integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  WITH base AS (
    SELECT spb.base_price_cents
    FROM sku_pricing_base spb
    WHERE spb.sku_id = p_sku_id AND spb.active_from <= now()
    ORDER BY spb.active_from DESC LIMIT 1
  ),
  zone_ov AS (
    SELECT szo.price_multiplier, szo.override_price_cents
    FROM sku_pricing_zone_overrides szo
    WHERE szo.zone_id = p_zone_id AND szo.sku_id = p_sku_id
      AND szo.active_from <= now()
      AND (szo.active_to IS NULL OR szo.active_to > now())
    ORDER BY szo.active_from DESC LIMIT 1
  )
  SELECT
    b.base_price_cents,
    zo.price_multiplier,
    zo.override_price_cents,
    COALESCE(
      zo.override_price_cents,
      CASE WHEN zo.price_multiplier IS NOT NULL
        THEN (b.base_price_cents * zo.price_multiplier)::integer
        ELSE b.base_price_cents
      END
    ) AS effective_price_cents
  FROM base b
  LEFT JOIN zone_ov zo ON true;
$$;

-- ═══ 8. Effective Payout Resolution Function ═══
CREATE OR REPLACE FUNCTION public.get_effective_provider_payout(p_zone_id uuid, p_sku_id uuid)
RETURNS TABLE(base_payout_cents integer, zone_multiplier numeric, zone_override_cents integer, effective_payout_cents integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  WITH base AS (
    SELECT ppb.base_payout_cents
    FROM provider_payout_base ppb
    WHERE ppb.sku_id = p_sku_id AND ppb.active_from <= now()
    ORDER BY ppb.active_from DESC LIMIT 1
  ),
  zone_ov AS (
    SELECT pzo.payout_multiplier, pzo.override_payout_cents
    FROM provider_payout_zone_overrides pzo
    WHERE pzo.zone_id = p_zone_id AND pzo.sku_id = p_sku_id
      AND pzo.active_from <= now()
      AND (pzo.active_to IS NULL OR pzo.active_to > now())
    ORDER BY pzo.active_from DESC LIMIT 1
  )
  SELECT
    b.base_payout_cents,
    zo.payout_multiplier,
    zo.override_payout_cents,
    COALESCE(
      zo.override_payout_cents,
      CASE WHEN zo.payout_multiplier IS NOT NULL
        THEN (b.base_payout_cents * zo.payout_multiplier)::integer
        ELSE b.base_payout_cents
      END
    ) AS effective_payout_cents
  FROM base b
  LEFT JOIN zone_ov zo ON true;
$$;

-- ═══ 9. Rollback RPC (creates new version from previous) ═══
CREATE OR REPLACE FUNCTION public.rollback_pricing_override(p_override_id uuid, p_reason text DEFAULT 'Rollback')
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_prev RECORD;
  v_new_id uuid;
BEGIN
  IF NOT is_superuser(auth.uid()) THEN
    RAISE EXCEPTION 'Only superusers can rollback pricing';
  END IF;

  SELECT * INTO v_prev FROM sku_pricing_zone_overrides WHERE id = p_override_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Override not found'; END IF;

  -- Expire current latest for same zone+sku
  UPDATE sku_pricing_zone_overrides
  SET active_to = now()
  WHERE zone_id = v_prev.zone_id AND sku_id = v_prev.sku_id
    AND active_to IS NULL AND id != p_override_id;

  INSERT INTO sku_pricing_zone_overrides (zone_id, sku_id, price_multiplier, override_price_cents, version, changed_by, reason)
  VALUES (v_prev.zone_id, v_prev.sku_id, v_prev.price_multiplier, v_prev.override_price_cents, v_prev.version + 1, auth.uid(), p_reason)
  RETURNING id INTO v_new_id;

  -- Audit
  PERFORM log_admin_action('rollback_pricing', 'sku_pricing_zone_overrides', v_new_id::text, p_reason, to_jsonb(v_prev), jsonb_build_object('rolled_back_to_version', v_prev.version));

  RETURN v_new_id;
END;
$$;
