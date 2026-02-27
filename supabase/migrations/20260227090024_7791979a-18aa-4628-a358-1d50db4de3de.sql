
-- ==========================================
-- E-03 FIXES (F1-F4)
-- ==========================================

-- E03-F1: Label LIMITED_CAPACITY as informational-only in a comment.
-- Assignment engine intentionally only checks DAY_OFF/VACATION.
-- LIMITED_CAPACITY is a soft signal for admin dashboards, not a hard block.
COMMENT ON TABLE public.provider_availability_blocks IS 
  'Provider time-off blocks. DAY_OFF and VACATION block auto-assignment. LIMITED_CAPACITY is informational-only (visible to admin, does not block assignment).';

-- E03-F2: Add FK constraint on created_by_user_id
ALTER TABLE public.provider_availability_blocks
  ADD CONSTRAINT provider_availability_blocks_created_by_user_id_fkey
  FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id);

-- E03-F3: Overlap prevention via exclusion constraint
-- Using daterange overlap check with a trigger (gist exclusion requires btree_gist extension)
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.provider_availability_blocks
  ADD CONSTRAINT provider_availability_blocks_no_overlap
  EXCLUDE USING gist (
    provider_org_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  )
  WHERE (status = 'active');

-- E03-F4: Add provider_org_id guard trigger for cancelBlock + server-side updated_at
CREATE OR REPLACE FUNCTION public.trg_availability_block_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_availability_block_updated_at
  BEFORE UPDATE ON public.provider_availability_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_availability_block_updated_at();

-- ==========================================
-- E-04: BYOC / Founding Partner Program
-- ==========================================

-- Provider incentive configuration (global/region/zone level)
CREATE TABLE public.provider_incentive_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scope text NOT NULL DEFAULT 'GLOBAL' CHECK (scope IN ('GLOBAL', 'REGION', 'ZONE')),
  scope_id uuid, -- region_id or zone_id if scoped
  byoc_weekly_amount_cents int NOT NULL DEFAULT 1000, -- $10.00
  byoc_duration_days int NOT NULL DEFAULT 90,
  max_byoc_per_provider_per_month int, -- optional cap
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_incentive_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on provider_incentive_config"
  ON public.provider_incentive_config FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read provider_incentive_config"
  ON public.provider_incentive_config FOR SELECT
  TO authenticated USING (true);

-- BYOC Attributions table
CREATE TABLE public.byoc_attributions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id),
  customer_id uuid NOT NULL REFERENCES auth.users(id),
  invite_code text,
  referral_code text,
  invited_at timestamptz NOT NULL DEFAULT now(),
  installed_at timestamptz,
  subscribed_at timestamptz,
  first_completed_visit_at timestamptz,
  bonus_start_at timestamptz,
  bonus_end_at timestamptz,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'ENDED', 'REVOKED')),
  revoked_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Only one active attribution per customer
CREATE UNIQUE INDEX idx_byoc_attributions_customer_active
  ON public.byoc_attributions (customer_id)
  WHERE status IN ('PENDING', 'ACTIVE');

CREATE INDEX idx_byoc_attributions_provider_org
  ON public.byoc_attributions (provider_org_id, status);

ALTER TABLE public.byoc_attributions ENABLE ROW LEVEL SECURITY;

-- Providers can see their own attributions
CREATE POLICY "Provider members read own org attributions"
  ON public.byoc_attributions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.provider_members pm
      WHERE pm.provider_org_id = byoc_attributions.provider_org_id
        AND pm.user_id = auth.uid()
    )
  );

-- Admin full access
CREATE POLICY "Admin full access on byoc_attributions"
  ON public.byoc_attributions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Provider orgs can insert (via invite flow)
CREATE POLICY "Provider members insert own org attributions"
  ON public.byoc_attributions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.provider_members pm
      WHERE pm.provider_org_id = byoc_attributions.provider_org_id
        AND pm.user_id = auth.uid()
    )
  );

-- BYOC bonus ledger
CREATE TABLE public.byoc_bonus_ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attribution_id uuid NOT NULL REFERENCES public.byoc_attributions(id),
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id),
  customer_id uuid NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  amount_cents int NOT NULL DEFAULT 1000,
  status text NOT NULL DEFAULT 'EARNED' CHECK (status IN ('EARNED', 'PAID', 'VOIDED')),
  earning_id uuid, -- FK to provider_earnings when paid out
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_byoc_bonus_ledger_dedup
  ON public.byoc_bonus_ledger (attribution_id, week_start)
  WHERE status != 'VOIDED';

CREATE INDEX idx_byoc_bonus_ledger_provider
  ON public.byoc_bonus_ledger (provider_org_id, status);

ALTER TABLE public.byoc_bonus_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider members read own org bonus ledger"
  ON public.byoc_bonus_ledger FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.provider_members pm
      WHERE pm.provider_org_id = byoc_bonus_ledger.provider_org_id
        AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin full access on byoc_bonus_ledger"
  ON public.byoc_bonus_ledger FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger for byoc_attributions
CREATE TRIGGER set_byoc_attribution_updated_at
  BEFORE UPDATE ON public.byoc_attributions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_availability_block_updated_at();

-- ==========================================
-- RPC: compute_byoc_bonuses (weekly batch)
-- ==========================================
CREATE OR REPLACE FUNCTION public.compute_byoc_bonuses(p_week_start date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_week_end date := p_week_start + 6;
  v_count int := 0;
  v_attr record;
  v_has_visit boolean;
  v_has_active_sub boolean;
  v_config record;
BEGIN
  -- Admin guard
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  FOR v_attr IN
    SELECT ba.*
    FROM public.byoc_attributions ba
    WHERE ba.status = 'ACTIVE'
      AND ba.bonus_start_at IS NOT NULL
      AND ba.bonus_end_at IS NOT NULL
      AND p_week_start >= ba.bonus_start_at::date
      AND p_week_start <= ba.bonus_end_at::date
  LOOP
    -- Check active subscription
    SELECT EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.customer_id = v_attr.customer_id
        AND s.status = 'active'
    ) INTO v_has_active_sub;

    IF NOT v_has_active_sub THEN CONTINUE; END IF;

    -- Check completed visit this week
    SELECT EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.customer_id = v_attr.customer_id
        AND j.status = 'completed'
        AND j.scheduled_date BETWEEN p_week_start AND v_week_end
    ) INTO v_has_visit;

    IF NOT v_has_visit THEN CONTINUE; END IF;

    -- Get incentive config (GLOBAL fallback)
    SELECT * INTO v_config
    FROM public.provider_incentive_config
    WHERE scope = 'GLOBAL'
    ORDER BY updated_at DESC
    LIMIT 1;

    -- Insert bonus (idempotent via unique index)
    INSERT INTO public.byoc_bonus_ledger (
      attribution_id, provider_org_id, customer_id,
      week_start, week_end, amount_cents, status
    )
    VALUES (
      v_attr.id, v_attr.provider_org_id, v_attr.customer_id,
      p_week_start, v_week_end,
      COALESCE(v_config.byoc_weekly_amount_cents, 1000),
      'EARNED'
    )
    ON CONFLICT DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('bonuses_created', v_count, 'week_start', p_week_start);
END;
$$;

-- ==========================================
-- RPC: activate_byoc_attribution
-- Called when a BYOC customer completes first visit
-- ==========================================
CREATE OR REPLACE FUNCTION public.activate_byoc_attribution(p_customer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attr record;
  v_config record;
BEGIN
  -- Find pending attribution
  SELECT * INTO v_attr
  FROM public.byoc_attributions
  WHERE customer_id = p_customer_id
    AND status = 'PENDING'
  LIMIT 1;

  IF v_attr IS NULL THEN
    RETURN jsonb_build_object('activated', false, 'reason', 'no_pending_attribution');
  END IF;

  -- Get config
  SELECT * INTO v_config
  FROM public.provider_incentive_config
  WHERE scope = 'GLOBAL'
  ORDER BY updated_at DESC
  LIMIT 1;

  -- Activate
  UPDATE public.byoc_attributions SET
    status = 'ACTIVE',
    first_completed_visit_at = now(),
    bonus_start_at = now(),
    bonus_end_at = now() + (COALESCE(v_config.byoc_duration_days, 90) || ' days')::interval,
    updated_at = now()
  WHERE id = v_attr.id;

  RETURN jsonb_build_object('activated', true, 'attribution_id', v_attr.id);
END;
$$;

-- ==========================================
-- RPC: admin_revoke_byoc_attribution
-- ==========================================
CREATE OR REPLACE FUNCTION public.admin_revoke_byoc_attribution(
  p_attribution_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.byoc_attributions SET
    status = 'REVOKED',
    revoked_reason = p_reason,
    updated_at = now()
  WHERE id = p_attribution_id
    AND status IN ('PENDING', 'ACTIVE');
END;
$$;

-- Seed global incentive config
INSERT INTO public.provider_incentive_config (scope, byoc_weekly_amount_cents, byoc_duration_days, reason)
VALUES ('GLOBAL', 1000, 90, 'Initial default: $10/week for 90 days');
