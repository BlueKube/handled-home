# Batch 1.1 — Schema: size_tier + plan_family + variant rules + `pick_plan_variant` RPC

> **Phase:** 1 — Schema: size_tier on plans + variant selection RPC
> **Size:** M (Medium) — schema migration + new table + RPC + seed data + RLS.
> **Review tier:** Medium — 3 parallel lanes (Spec / Bug / Historical) + Sonnet synthesis = 4 agents.

---

## Problem

The `plans` table (migration `20260222044155_*.sql`) has no dimension that expresses "which variant of the Basic plan is this?" Three fixed rows (Essential / Plus / Premium) can't compose into the 12-variant grid (Basic / Full / Premier × sizes 10 / 20 / 30 / 40). Onboarding has no RPC to resolve a property's sizing signals into a variant. Subscriptions can't express variant identity.

## Goals

1. Add `plan_family` (text) + `size_tier` (smallint) columns to `plans` without breaking live Essential / Plus / Premium rows.
2. Introduce `plan_variant_rules` — admin-tunable rules that match property_signals tier strings to a target `size_tier` for a given `plan_family`.
3. Implement `pick_plan_variant(p_property_id, p_plan_family)` RPC that reads `property_signals`, matches rules, and returns the correct `plans.id`.
4. Seed the 12 new variant rows (`draft` status, won't show to live customers) and a minimal rule set so the RPC is testable.

## Scope

### Schema changes (new migration)

**File:** `supabase/migrations/<ts>_plan_variants.sql` (timestamp at implementation time).

```sql
-- 1. Extend plans with variant dimensions
ALTER TABLE public.plans
  ADD COLUMN plan_family text,
  ADD COLUMN size_tier smallint;

-- 2. Backfill legacy rows as 'legacy' family
UPDATE public.plans SET plan_family = 'legacy' WHERE plan_family IS NULL;

-- 3. Add CHECK constraints
ALTER TABLE public.plans
  ADD CONSTRAINT plans_plan_family_valid
    CHECK (plan_family IN ('legacy', 'basic', 'full', 'premier')),
  ADD CONSTRAINT plans_size_tier_valid
    CHECK (size_tier IS NULL OR size_tier IN (10, 20, 30, 40));

-- 4. Create plan_variant_rules
CREATE TABLE public.plan_variant_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_family text NOT NULL CHECK (plan_family IN ('basic', 'full', 'premier')),
  target_size_tier smallint NOT NULL CHECK (target_size_tier IN (10, 20, 30, 40)),
  -- Empty array = wildcard match. Non-empty = match if property's tier in array.
  sqft_tiers text[] NOT NULL DEFAULT '{}',
  yard_tiers text[] NOT NULL DEFAULT '{}',
  windows_tiers text[] NOT NULL DEFAULT '{}',
  stories_tiers text[] NOT NULL DEFAULT '{}',
  priority int NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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

-- 5. Seed 12 variant plans (draft status)
INSERT INTO public.plans (name, tagline, status, plan_family, size_tier, display_price_text, recommended_rank)
VALUES
  ('Basic 10',   'For smaller homes',        'draft', 'basic',   10, '$79',  1),
  ('Basic 20',   'For medium homes',         'draft', 'basic',   20, '$99',  1),
  ('Basic 30',   'For larger homes',         'draft', 'basic',   30, '$129', 1),
  ('Basic 40',   'For extra-large homes',    'draft', 'basic',   40, '$159', 1),
  ('Full 10',    'Full service, small',      'draft', 'full',    10, '$149', 2),
  ('Full 20',    'Full service, medium',     'draft', 'full',    20, '$189', 2),
  ('Full 30',    'Full service, large',      'draft', 'full',    30, '$229', 2),
  ('Full 40',    'Full service, XL',         'draft', 'full',    40, '$279', 2),
  ('Premier 10', 'Premium care, small',      'draft', 'premier', 10, '$219', 3),
  ('Premier 20', 'Premium care, medium',     'draft', 'premier', 20, '$279', 3),
  ('Premier 30', 'Premium care, large',      'draft', 'premier', 30, '$339', 3),
  ('Premier 40', 'Premium care, XL',         'draft', 'premier', 40, '$399', 3);

-- 6. Seed default rules (sqft-primary, priority ordered)
-- Higher priority = checked first. Lowest-tier rules catch-all at priority 0.
INSERT INTO public.plan_variant_rules (plan_family, target_size_tier, sqft_tiers, priority, notes)
SELECT family, tier, sqft, pri, note FROM (VALUES
  ('basic',   10, ARRAY['lt_1500']::text[],                10, 'Small home → Basic 10'),
  ('basic',   20, ARRAY['1500_2500']::text[],              10, 'Medium home → Basic 20'),
  ('basic',   30, ARRAY['2500_3500']::text[],              10, 'Large home → Basic 30'),
  ('basic',   40, ARRAY['3500_5000','5000_plus']::text[],  10, 'XL home → Basic 40'),
  ('full',    10, ARRAY['lt_1500']::text[],                10, 'Small home → Full 10'),
  ('full',    20, ARRAY['1500_2500']::text[],              10, 'Medium home → Full 20'),
  ('full',    30, ARRAY['2500_3500']::text[],              10, 'Large home → Full 30'),
  ('full',    40, ARRAY['3500_5000','5000_plus']::text[],  10, 'XL home → Full 40'),
  ('premier', 10, ARRAY['lt_1500']::text[],                10, 'Small home → Premier 10'),
  ('premier', 20, ARRAY['1500_2500']::text[],              10, 'Medium home → Premier 20'),
  ('premier', 30, ARRAY['2500_3500']::text[],              10, 'Large home → Premier 30'),
  ('premier', 40, ARRAY['3500_5000','5000_plus']::text[],  10, 'XL home → Premier 40')
) AS t(family, tier, sqft, pri, note);

-- 7. Create pick_plan_variant RPC
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

  -- Find highest-priority rule that matches (empty tier array = wildcard).
  SELECT target_size_tier INTO v_target_tier
  FROM public.plan_variant_rules
  WHERE plan_family = p_plan_family
    AND (cardinality(sqft_tiers)    = 0 OR v_signals.home_sqft_tier = ANY(sqft_tiers))
    AND (cardinality(yard_tiers)    = 0 OR v_signals.yard_tier      = ANY(yard_tiers))
    AND (cardinality(windows_tiers) = 0 OR v_signals.windows_tier   = ANY(windows_tiers))
    AND (cardinality(stories_tiers) = 0 OR v_signals.stories_tier   = ANY(stories_tiers))
  ORDER BY priority DESC, created_at ASC
  LIMIT 1;

  -- Fallback: smallest tier in the family.
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

GRANT EXECUTE ON FUNCTION public.pick_plan_variant(uuid, text) TO authenticated;
```

### Acceptance criteria

- [ ] Migration applies cleanly against a fresh DB. Existing Essential / Plus / Premium plans survive with `plan_family='legacy'`, `size_tier=NULL`.
- [ ] `SELECT COUNT(*) FROM plans WHERE plan_family IN ('basic','full','premier')` returns 12.
- [ ] `SELECT COUNT(*) FROM plan_variant_rules` returns 12 (one per variant).
- [ ] RLS: authenticated user can SELECT from `plan_variant_rules`; non-admin cannot INSERT/UPDATE/DELETE (verify via `set role authenticated; insert into plan_variant_rules ...` in a psql test).
- [ ] RPC test fixture:
  - Seed a property with `home_sqft_tier='2500_3500'` → `pick_plan_variant(id, 'basic')` returns the Basic 30 plan id.
  - `home_sqft_tier='lt_1500'` → returns Basic 10.
  - `home_sqft_tier='5000_plus'` → returns Basic 40.
  - Property with NULL `home_sqft_tier` → returns Basic 10 (fallback).
  - `pick_plan_variant(id, 'invalid')` raises.
- [ ] `npx tsc --noEmit` stays clean (no TS changes in this batch, but confirm types/supabase autogen doesn't break — regenerate types locally, not committed).
- [ ] `npm run build` passes.

### Out of scope for this batch

- No TypeScript types, hooks, or UI changes (those are Batch 1.2 and 1.3).
- No changes to live plans (Essential / Plus / Premium stay `active`; new variants stay `draft`).
- No changes to subscriptions / checkout / Stripe ids.
- No admin UI for editing rules (Batch 1.3).

### Edge cases handled

- **Legacy rows survive**: `plan_family='legacy'` CHECK constraint lets old rows coexist. No data loss.
- **Property with no signals row**: RPC falls through to `v_target_tier := 10` fallback.
- **Property with partial signals** (e.g., NULL `windows_tier`): rule matches because wildcard arrays don't require a match on NULL fields (the `ANY` check returns NULL → falsy → rule doesn't match UNLESS the array is empty).
- **Multiple rules match**: `ORDER BY priority DESC, created_at ASC` deterministic. Seed priority=10 so higher-priority custom rules (priority=20+) can be added later without re-seed.
- **`plan_family='legacy'` passed to RPC**: raises (not in CHECK list).

### Files touched

- **New:** `supabase/migrations/<ts>_plan_variants.sql`.
- **No changes** to TS, hooks, components, or config in this batch.

### Verification commands

```bash
# From project root
supabase db reset             # apply all migrations fresh
supabase db test <script>     # optional pgTAP test if we want

# Or manual psql via supabase CLI
supabase db execute "SELECT COUNT(*) FROM plans WHERE plan_family IN ('basic','full','premier');"
# Expected: 12

supabase db execute "SELECT COUNT(*) FROM plan_variant_rules;"
# Expected: 12

# Fixture test — requires inserting a property + signals row first
# (done inline in the batch's test script, not committed)
```

### Review prompt notes

- **Lane 1 (Spec Completeness):** verify all 12 variants seeded with correct size_tier + display_price_text; verify all 12 rules seeded; verify RPC signature + grants; verify CHECK constraints on new columns.
- **Lane 2 (Bug Scan):** scan the RPC for:
  - SQL injection (parameters used in dynamic SQL — not applicable here, plain parameter binding).
  - SECURITY DEFINER without SET search_path — we SET `search_path = public`, OK.
  - RLS bypass via SECURITY DEFINER — intentional (RPC needs to read `property_signals` even if caller doesn't own it in some future ops context); flag if this is a leak.
  - Off-by-one or wildcard logic in the ANY checks.
- **Lane 3 (Historical Context):** first batch in phase, no prior review findings — skip per CLAUDE.md §5 Lane 3 skip rule.
- **Synthesis (Lane 4):** Sonnet, cross-validates Lane 1 + Lane 2 findings; scores per CLAUDE.md §5 formula.
