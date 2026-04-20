-- ============================================================
-- Round 64 · Batch 1.1 — Plan Variants Schema
-- ============================================================
-- Adds size_tier + plan_family to plans, introduces plan_variant_rules
-- (admin-tunable property_signals → target tier mapping), seeds 12 draft
-- variant rows (Basic / Full / Premier × sizes 10/20/30/40), seeds default
-- rules, and creates pick_plan_variant(property_id, family) RPC.
--
-- Legacy Essential / Plus / Premium rows are backfilled as plan_family='legacy'
-- so live subscriptions keep working. New variants are draft until Phase 2 flips
-- them active.
-- ============================================================

-- 1. Extend plans with variant dimensions ------------------------------------

ALTER TABLE public.plans
  ADD COLUMN plan_family text,
  ADD COLUMN size_tier smallint;

-- Backfill legacy rows before CHECK constraint lands.
UPDATE public.plans SET plan_family = 'legacy' WHERE plan_family IS NULL;

ALTER TABLE public.plans
  ADD CONSTRAINT plans_plan_family_valid
    CHECK (plan_family IN ('legacy', 'basic', 'full', 'premier')),
  ADD CONSTRAINT plans_size_tier_valid
    CHECK (size_tier IS NULL OR size_tier IN (10, 20, 30, 40));

COMMENT ON COLUMN public.plans.plan_family IS
  'Plan family for variant grouping. "legacy" preserves Essential/Plus/Premium.';
COMMENT ON COLUMN public.plans.size_tier IS
  'Property size tier this plan variant serves. NULL for legacy plans.';

-- 2. plan_variant_rules ------------------------------------------------------

CREATE TABLE public.plan_variant_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_family text NOT NULL
    CHECK (plan_family IN ('basic', 'full', 'premier')),
  target_size_tier smallint NOT NULL
    CHECK (target_size_tier IN (10, 20, 30, 40)),
  -- Empty array = wildcard. Non-empty = property's tier must be in array.
  sqft_tiers text[] NOT NULL DEFAULT '{}',
  yard_tiers text[] NOT NULL DEFAULT '{}',
  windows_tiers text[] NOT NULL DEFAULT '{}',
  stories_tiers text[] NOT NULL DEFAULT '{}',
  priority int NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.plan_variant_rules IS
  'Admin-tunable rules mapping property_signals tier strings to a target size_tier for a given plan_family. Higher priority wins. Empty tier arrays are wildcards.';

ALTER TABLE public.plan_variant_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read plan_variant_rules"
  ON public.plan_variant_rules FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage plan_variant_rules"
  ON public.plan_variant_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_plan_variant_rules_updated_at
  BEFORE UPDATE ON public.plan_variant_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Seed 12 variant plans (draft status) ------------------------------------

INSERT INTO public.plans
  (name, tagline, status, plan_family, size_tier, display_price_text, recommended_rank)
VALUES
  ('Basic 10',   'For smaller homes',     'draft', 'basic',   10, '$79',  1),
  ('Basic 20',   'For medium homes',      'draft', 'basic',   20, '$99',  1),
  ('Basic 30',   'For larger homes',      'draft', 'basic',   30, '$129', 1),
  ('Basic 40',   'For extra-large homes', 'draft', 'basic',   40, '$159', 1),
  ('Full 10',    'Full service, small',   'draft', 'full',    10, '$149', 2),
  ('Full 20',    'Full service, medium',  'draft', 'full',    20, '$189', 2),
  ('Full 30',    'Full service, large',   'draft', 'full',    30, '$229', 2),
  ('Full 40',    'Full service, XL',      'draft', 'full',    40, '$279', 2),
  ('Premier 10', 'Premium care, small',   'draft', 'premier', 10, '$219', 3),
  ('Premier 20', 'Premium care, medium',  'draft', 'premier', 20, '$279', 3),
  ('Premier 30', 'Premium care, large',   'draft', 'premier', 30, '$339', 3),
  ('Premier 40', 'Premium care, XL',      'draft', 'premier', 40, '$399', 3);

-- 4. Seed default rules (sqft-primary, priority 10) --------------------------

INSERT INTO public.plan_variant_rules
  (plan_family, target_size_tier, sqft_tiers, priority, notes)
SELECT family, tier, sqft::text[], pri, note FROM (VALUES
  ('basic',   10, ARRAY['lt_1500'],               10, 'Small home → Basic 10'),
  ('basic',   20, ARRAY['1500_2500'],             10, 'Medium home → Basic 20'),
  ('basic',   30, ARRAY['2500_3500'],             10, 'Large home → Basic 30'),
  ('basic',   40, ARRAY['3500_5000','5000_plus'], 10, 'XL home → Basic 40'),
  ('full',    10, ARRAY['lt_1500'],               10, 'Small home → Full 10'),
  ('full',    20, ARRAY['1500_2500'],             10, 'Medium home → Full 20'),
  ('full',    30, ARRAY['2500_3500'],             10, 'Large home → Full 30'),
  ('full',    40, ARRAY['3500_5000','5000_plus'], 10, 'XL home → Full 40'),
  ('premier', 10, ARRAY['lt_1500'],               10, 'Small home → Premier 10'),
  ('premier', 20, ARRAY['1500_2500'],             10, 'Medium home → Premier 20'),
  ('premier', 30, ARRAY['2500_3500'],             10, 'Large home → Premier 30'),
  ('premier', 40, ARRAY['3500_5000','5000_plus'], 10, 'XL home → Premier 40')
) AS t(family, tier, sqft, pri, note);

-- 5. pick_plan_variant RPC ---------------------------------------------------

CREATE OR REPLACE FUNCTION public.pick_plan_variant(
  p_property_id uuid,
  p_plan_family text
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_signals public.property_signals%ROWTYPE;
  v_target_tier smallint;
  v_plan_id uuid;
BEGIN
  IF p_plan_family NOT IN ('basic', 'full', 'premier') THEN
    RAISE EXCEPTION 'Invalid plan_family: %', p_plan_family;
  END IF;

  SELECT * INTO v_signals
  FROM public.property_signals
  WHERE property_id = p_property_id;

  -- Highest-priority rule whose non-empty tier arrays all match.
  -- Empty array on a dimension = wildcard; no match needed on that dimension.
  SELECT target_size_tier INTO v_target_tier
  FROM public.plan_variant_rules
  WHERE plan_family = p_plan_family
    AND (cardinality(sqft_tiers)    = 0 OR v_signals.home_sqft_tier = ANY(sqft_tiers))
    AND (cardinality(yard_tiers)    = 0 OR v_signals.yard_tier      = ANY(yard_tiers))
    AND (cardinality(windows_tiers) = 0 OR v_signals.windows_tier   = ANY(windows_tiers))
    AND (cardinality(stories_tiers) = 0 OR v_signals.stories_tier   = ANY(stories_tiers))
  ORDER BY priority DESC, created_at ASC
  LIMIT 1;

  -- Fallback: smallest tier when no rule matches (missing signals, etc.)
  IF v_target_tier IS NULL THEN
    v_target_tier := 10;
  END IF;

  SELECT id INTO v_plan_id
  FROM public.plans
  WHERE plan_family = p_plan_family
    AND size_tier = v_target_tier
    AND status IN ('active', 'draft')
  ORDER BY
    CASE status WHEN 'active' THEN 0 ELSE 1 END,
    created_at DESC
  LIMIT 1;

  RETURN v_plan_id;
END;
$$;

COMMENT ON FUNCTION public.pick_plan_variant(uuid, text) IS
  'Resolves a property + plan family to the matching plan variant id. Falls back to size_tier=10 when no rule matches.';

GRANT EXECUTE ON FUNCTION public.pick_plan_variant(uuid, text) TO authenticated;
