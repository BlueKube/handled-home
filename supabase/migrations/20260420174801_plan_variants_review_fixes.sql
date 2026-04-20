-- ============================================================
-- Round 64 · Batch 1.1 — review fixes
-- ============================================================
-- Addresses SHOULD-FIX findings from Lane 2 code review of the prior
-- migration 20260420173758_plan_variants_schema.sql:
--
--   1. pick_plan_variant: add explicit IF NOT FOUND early fallback
--      when property_signals has no row, so the behavior is obvious
--      instead of relying on NULL-through-ANY propagation.
--   2. pick_plan_variant: add `id` as final ORDER BY tiebreaker so
--      rules seeded in the same transaction sort deterministically.
--   3. REVOKE EXECUTE ... FROM PUBLIC before GRANT — SECURITY DEFINER
--      best practice.
--   4. Admin RLS policy: add explicit WITH CHECK clause.
--
-- The NULL-ANY "MUST-FIX" flagged by Lane 2 was reclassified as intentional
-- Option A semantics ("rule constrains dimension X; property signals NULL
-- on X → do not assume a match"). Seeded rules are all sqft-only wildcards
-- on yard/windows/stories so no runtime impact.
-- ============================================================

-- 1 + 2. Rewrite pick_plan_variant with explicit NOT FOUND + id tiebreak.
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
  v_has_signals boolean;
  v_target_tier smallint;
  v_plan_id uuid;
BEGIN
  IF p_plan_family NOT IN ('basic', 'full', 'premier') THEN
    RAISE EXCEPTION 'Invalid plan_family: %', p_plan_family;
  END IF;

  SELECT * INTO v_signals
  FROM public.property_signals
  WHERE property_id = p_property_id;

  v_has_signals := FOUND;

  IF v_has_signals THEN
    -- Highest-priority rule whose non-empty tier arrays all match.
    -- Empty array on a dimension = wildcard. Any constraining dim with a
    -- NULL property value deliberately fails to match (Option A semantics).
    SELECT target_size_tier INTO v_target_tier
    FROM public.plan_variant_rules
    WHERE plan_family = p_plan_family
      AND (cardinality(sqft_tiers)    = 0 OR v_signals.home_sqft_tier = ANY(sqft_tiers))
      AND (cardinality(yard_tiers)    = 0 OR v_signals.yard_tier      = ANY(yard_tiers))
      AND (cardinality(windows_tiers) = 0 OR v_signals.windows_tier   = ANY(windows_tiers))
      AND (cardinality(stories_tiers) = 0 OR v_signals.stories_tier   = ANY(stories_tiers))
    ORDER BY priority DESC, created_at ASC, id ASC
    LIMIT 1;
  END IF;

  -- Fallback: smallest tier when no signals row OR no rule matches.
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
    created_at DESC,
    id ASC
  LIMIT 1;

  RETURN v_plan_id;
END;
$$;

COMMENT ON FUNCTION public.pick_plan_variant(uuid, text) IS
  'Resolves a property + plan family to the matching plan variant id. Falls back to size_tier=10 when no signals row exists or no rule matches. Returns draft plans until Phase 2 flips variants active.';

-- 3. SECURITY DEFINER hardening
REVOKE EXECUTE ON FUNCTION public.pick_plan_variant(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pick_plan_variant(uuid, text) TO authenticated;

-- 4. Explicit WITH CHECK on admin policy
DROP POLICY IF EXISTS "Admins can manage plan_variant_rules" ON public.plan_variant_rules;
CREATE POLICY "Admins can manage plan_variant_rules"
  ON public.plan_variant_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
