# Batch 2.2 — PlanStep variant resolution + rationale + manual override

> **Phase:** Round 64 Phase 2 — Onboarding: home signals → variant → "Starts at" pricing
> **Size:** Medium
> **Review tier:** Medium (3 parallel lanes + synthesis = 4 agents). Lane 3 runs this time — Batch 2.1 left review findings on the plan card files, which PlanStep now consumes.
> **Branch:** `claude/handled-home-phase-2-YTvlm` (continuing)

---

## Why this batch exists

Phase 1 seeded 12 plan variants (Basic/Full/Premier × 10/20/30/40) and the `pick_plan_variant(property_id, family)` RPC. Batch 2.1 built `PlanFamilyCard` + `PlanVariantCard`. This batch wires those two pieces together inside the onboarding wizard's Plan step: the customer sees three family cards, taps one, and the RPC resolves the correct variant for their property signals with a one-line rationale. Manual override (one tier up/down) is allowed, with an override reason dropdown, and a review flag persists into `customer_onboarding_progress.metadata` so admins can audit overrides post-launch.

## Scope

### Files changed

- **New:** `src/hooks/usePlanVariants.ts` — single hook that queries `plans` filtered by `plan_family IN ('basic','full','premier')`, ordered by `recommended_rank` asc then `size_tier` asc. No status filter (Phase 1 seeded the 12 variants as `status='draft'`; we're intentionally showing them alongside anything flipped to `active` later). Returns `Plan[]` grouped by family into `{ basic: Plan[], full: Plan[], premier: Plan[] }`.

- **New:** `src/hooks/useResolvePlanVariant.ts` — mutation hook that wraps `supabase.rpc('pick_plan_variant', { p_property_id, p_plan_family })`. Returns the resolved `plans.id` string. Callers pass a family key + property id, handle errors.

- **Refactored:** `src/pages/customer/onboarding/PlanStep.tsx` —
  - Drops `PlanCard` import + the old 3-row plan mapping.
  - Adds state: `selectedFamily: 'basic' | 'full' | 'premier' | null`, `resolvedVariant: Plan | null`, `overrideVariantId: string | null`, `overrideReason: string | null`.
  - Initial render (no family selected): show three `PlanFamilyCard`s (Basic / Full / Premier). `startsAtPriceText` = smallest-`size_tier` variant's `display_price_text` within each family. `variantCount` = length of family array. `highlights` = `FAMILY_HIGHLIGHTS[family]` from `planTierStyles.ts`. Recommended family = highest `recommended_rank` (Premier by seed; Full is often "Most Popular" — match existing `recommended_rank` logic).
  - On family-card tap (`onSelect`): call `useResolvePlanVariant().mutateAsync({ propertyId, family })`; set `resolvedVariant` to the matched plan (looked up by id from `usePlanVariants`); keep `selectedFamily`; clear any override.
  - Resolved render: show one `PlanVariantCard` for the resolved variant with `rationale` text (computed — see below), `handlesPerCycle` from existing `plan_handles` query, `highlights` = `FAMILY_HIGHLIGHTS[family]`, `isRecommended` if it's the recommended family. `confirmLabel="Continue"`, `onChangeSize` opens an inline size override picker.
  - Override picker (inline, in the same card area or a small Radix Select below it): lists the adjacent variants (one smaller + one larger size_tier in the same family, if they exist). Plus an "override reason" dropdown: `["My home is larger than the default", "My home is smaller than the default", "Budget preference", "Other"]`. On confirm, update `overrideVariantId` + `overrideReason`; re-render `PlanVariantCard` for the overridden variant; flag the override.
  - A "Back to all plans" ghost button resets `selectedFamily` / `resolvedVariant` / overrides.
  - On "Continue" click (primary CTA): call the existing `onSelectPlan(planId)` prop where `planId = overrideVariantId ?? resolvedVariant.id`, but **also** call `onSelectPlan` with a structured payload — see "Contract change" below.

- **Contract change:** `PlanStep`'s `onSelectPlan` prop signature changes from `(planId: string) => Promise<void>` to `(payload: { planId: string; recommendedPlanId: string; overrideReason: string | null }) => Promise<void>`.
  - Callers:
    - `src/pages/customer/OnboardingWizard.tsx` — update the handler to pass the full payload to `completeStep("plan", ...)`. `completeStep` already forwards `selected_plan_id` + `metadata`; we'll stash override info in `metadata.plan_variant_selection = { recommended_plan_id, override_reason, admin_review_flagged: overrideReason !== null }`. No DB migration needed — `metadata` is already `jsonb`.
  - Any other caller of `PlanStep` (grep — only `OnboardingWizard.tsx` per the audit; if another is found, update it).

- **Rationale helper:** Add `src/lib/planRationale.ts` with a pure function `buildRationale(sqftTier: string | null, familyName: string, variantName: string): string`. Reverse-maps `home_sqft_tier` to a readable range, produces `"Based on your ~2,000 sqft home, your Basic plan is Basic 20."` or (when tier is null) `"Based on your property profile, your Basic plan is Basic 20."`. Also handles `yard_tier`/`windows_tier`/`stories_tier` fallbacks for families where sqft isn't the deciding dimension — but since all seed rules are sqft-primary, the basic sqft-based sentence is enough. If sqft is missing but another signal is present, use that instead.
  - Ranges:
    - `lt_1500` → "under 1,500 sqft"
    - `1500_2500` → "~2,000 sqft"
    - `2500_3500` → "~3,000 sqft"
    - `3500_5000` → "~4,000 sqft"
    - `5000_plus` → "5,000+ sqft"

- **Signals fetch:** add a lightweight query inside `PlanStep.tsx` for the customer's `property_signals` row (keyed on `property.id`). No new hook file needed — single `useQuery` inline, like the existing `zone_by_zip` and `plan_handles` queries. Null-safe (signals may not exist yet if home setup was skipped — fall back to generic rationale).

- **`useOnboardingProgress` metadata semantics:** change from "replace" to "merge" in both the mutation body and the optimistic `onMutate` cache update. Today every caller passes no metadata, so the behavior change is invisible — but without this, any future step that stashes its own field would clobber `plan_variant_selection`. Two-line spread: `{ ...(existing.metadata ?? {}), ...updates.metadata }`.

- **Type safety:** `pick_plan_variant` is already typed in `src/integrations/supabase/types.ts` per Phase 1 regen, so no `as any` is needed.

### Files NOT changed

- `src/components/plans/PlanCard.tsx`, `src/components/plans/PlanFamilyCard.tsx`, `src/components/plans/PlanVariantCard.tsx`, `src/components/plans/planTierStyles.ts` — stable.
- `src/pages/Browse.tsx`, `src/pages/customer/Plans.tsx`, `src/pages/customer/byoc-onboarding/PlanActivateStep.tsx` — migration deferred to Batch 2.3.
- `src/pages/customer/onboarding/shared.ts` — legacy `TIER_HIGHLIGHTS` stays for the BYOC onboarding callers until 2.3.
- `src/pages/customer/Subscribe.tsx` + `supabase/functions/create-checkout-session/index.ts` — wiring override info into `customer_plan_selections`/`subscriptions` is Batch 2.3.
- No DB migration. Override fields ride in the existing `metadata` jsonb.

## Acceptance criteria

1. `usePlanVariants()` returns variants grouped by family, with each family array sorted by `size_tier` ascending. Includes drafts.
2. `useResolvePlanVariant()` calls the RPC and returns a string plan id (or throws on failure).
3. Initial PlanStep render shows three `PlanFamilyCard`s with:
   - Correct "Starts at" price from smallest-`size_tier` variant in each family.
   - Correct variant count per family.
   - Family-level highlights from `FAMILY_HIGHLIGHTS`.
   - "Most Popular" / `StatusBadge status="recommended"` on the family with the highest `recommended_rank`.
4. On family-card tap, `pick_plan_variant` fires, and the resolved variant renders in a `PlanVariantCard` with:
   - Correct variant name + exact price.
   - `handlesPerCycle` from `plan_handles`.
   - Rationale sentence from `buildRationale()`.
5. Override picker lists only *adjacent* variants (one smaller size_tier and one larger, if they exist). Boundary variants show only one override option.
6. Confirming an override updates the displayed card and triggers the override-reason dropdown if reason is empty. Override confirmation is blocked until a reason is chosen.
7. "Back to all plans" resets to the three-family view.
8. On "Continue", `onSelectPlan` receives `{ planId, recommendedPlanId, overrideReason }`. `OnboardingWizard` stashes these in `metadata.plan_variant_selection`.
9. `admin_review_flagged` is `true` iff `overrideReason !== null`.
10. `npx tsc --noEmit` clean. `npm run build` clean.
11. Null-safe for missing signals, missing plan_handles row, missing adjacent variants.

## Out of scope (deferred)

- DB migration adding first-class override columns to `customer_plan_selections` (Batch 2.3 when Subscribe step promotes onboarding metadata into the persistent selection row).
- Admin dashboard surface reading the override flag (future batch).
- Browse.tsx hardcoded PLANS array removal (Batch 2.3).
- Checkout session writing the resolved variant id to `subscriptions.plan_id` (Batch 2.3).
- Activating the 12 draft variants (intentional deferral — product will decide status flip timing).

## Risks

- **Radix Select + null sentinel:** per CLAUDE.md conventions, never use empty string for "no override reason selected" — use `__none__` sentinel and coerce back to null.
- **Legacy plans ignored:** customers mid-flow with a legacy Essential/Plus/Premium preselection won't see their old plan in the three family cards. Acceptable — they'll complete onboarding on a new family. Existing subscribers aren't affected (they don't re-run onboarding).
- **Property signals missing:** if signals aren't present (home setup skipped), RPC falls back to `size_tier=10` smallest variant. The rationale sentence uses the generic fallback. Acceptable.
- **Small performance cost:** PlanStep now runs an extra `property_signals` query. One-row lookup, negligible.

## Review checklist

- Lane 1: every acceptance criterion 1–11 has a matching implementation.
- Lane 2: check for `as any`, missing null checks on signals/plans/plan_handles/adjacent variants. Check Radix Select sentinel pattern. Check the `onSelectPlan` contract change is reflected at every caller. Check no light-mode colors, no `warn`.
- Lane 3: `git blame` + review history on `PlanStep.tsx` — confirm the drop of `PlanCard` doesn't revert a recent fix. Confirm `useOnboardingProgress.completeStep` still receives `metadata` correctly.
- Lane 4: synthesize + score.
