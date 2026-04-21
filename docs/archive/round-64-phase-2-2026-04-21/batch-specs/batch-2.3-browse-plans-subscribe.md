# Batch 2.3 — Browse + Plans + Subscribe/Checkout integration

> **Phase:** Round 64 Phase 2 — Onboarding: home signals → variant → "Starts at" pricing
> **Size:** Large
> **Review tier:** Large — 3 parallel Sonnet lanes + 1 Sonnet synthesis + 1 Haiku second-opinion synthesis = 5 agents.
> **Branch:** `claude/handled-home-phase-2-YTvlm` (continuing)

---

## Why this batch exists

Batches 2.1 and 2.2 delivered the variant primitives and wired them into the onboarding Plan step. This batch migrates the two remaining customer-facing surfaces — public `/browse` and authenticated `/customer/plans` — off the legacy `PlanCard` and onto the family/variant paradigm, then validates that the Subscribe + `create-checkout-session` path writes the resolved variant id to `subscriptions.plan_id` (not a family root). Also migrates the BYOC `PlanActivateStep` off `PlanCard` so we can delete the legacy component, closing the Phase 2 loop.

## Scope

### 1. `src/pages/Browse.tsx` — public, unauthenticated

- Remove the hardcoded `PLANS` array (lines 46–71).
- Replace with a new local `FAMILY_SUMMARIES` constant — static array of three entries: `{ family: 'basic' | 'full' | 'premier', familyName, tagline, startsAtPriceText, variantCount }`. Hardcoded because the `plans` table RLS requires authentication (see `supabase/migrations/20260222044155*.sql:44`). A future migration can switch to live family data once variants are flipped to `active` and a public-read RLS policy is added; that's a separate product decision (noted in `docs/upcoming/TODO.md`).
- Render three `PlanFamilyCard`s using the new summary data. `highlights` from `FAMILY_HIGHLIGHTS`. `isRecommended={family === 'full'}` (Full is the public recommended tier).
- `onSelect` still navigates to `/auth?tab=signup` (existing behavior).
- Remove the "Most Popular" badge duplication with `PlanFamilyCard` — let the component handle it.
- Keep the existing SKU catalog, trust bar, ZIP check, and marketing sections unchanged.

### 2. `src/pages/customer/Plans.tsx` — authenticated

- Remove `PlanCard` import. Remove local `TIER_HIGHLIGHTS` + `getTierKey` helpers (they're dead after migration).
- Swap `usePlans("active")` → `usePlanVariants()`.
- Add state: `selectedFamily: ActiveFamily | null`, `resolvedVariantId: string | null`.
- When `selectedFamily` is null:
  - Render three `PlanFamilyCard`s for Basic / Full / Premier.
  - `startsAtPriceText` from smallest variant's `display_price_text`.
  - `isRecommended` based on highest `recommended_rank` across family (same logic as `PlanStep`).
  - `zoneEnabled` from the existing `plan_zone_availability` query, aggregated per family: a family is enabled if *any* variant in it is enabled for the customer's zone. Falls back to `true` when no zone or no availability data.
  - `onSelect` calls `useResolvePlanVariant().mutateAsync({ propertyId, family })` → sets `resolvedVariantId`. Requires `property?.id` — if missing, disabled with a "Set up your home first" helper message.
- When a family is selected and a variant is resolved:
  - Render a `PlanVariantCard` for the resolved variant.
  - `handlesPerCycle` from the existing `plan_handles_all` Map (shape stays compatible — see Batch 2.2 review fix).
  - `rationale` built via `buildRationale` using the customer's `property_signals`.
  - `onConfirm` labeled `"Subscribe"` → `navigate('/customer/subscribe?plan=' + variantId)`.
  - `onChangeSize` reveals the other variants in the family as a small inline list of `PlanVariantCard`s in compact form (or, to keep it simple and inside the 300-line budget, just render them with a "Subscribe" button each). **Simpler choice**: render a plain list of `<Button>`s labelled `"Basic 10 · $79"`, `"Basic 20 · $99"`, etc. — the primary variant card shows, and tapping a sibling button re-targets `resolvedVariantId` to that sibling. No override-reason dropdown (this is not onboarding; the admin flag doesn't apply).
  - `onBack` resets state to the family view.
- Isolated query for the customer's property + signals (reuse pattern from Batch 2.2).
- Keep the `isGated` alert banner, `HandlesExplainer`, `BundleSavingsCard`, and billing disclaimer from the current file.

### 3. `src/pages/customer/byoc-onboarding/PlanActivateStep.tsx`

- Remove `PlanCard` import. Remove `TIER_HIGHLIGHTS`/`getTierKey` imports from `./shared`.
- Swap `usePlans("active")` → `usePlanVariants()`.
- Render three `PlanFamilyCard`s. Auto-select the recommended family (highest `recommended_rank`) on mount and set `selectedPlanId` to the smallest variant (`size_tier` 10) of that family via the existing `onSelectPlan` callback.
- `onSelect` on a family card → call `onSelectPlan(smallestVariant.id)` for that family. No `pick_plan_variant` RPC call (BYOC flow doesn't have property signals context — the provider's service is what the customer is buying here; variant sizing matters less).
- Keep the existing `"Activate Service"` CTA semantics.
- Note: **`onSelectPlan` contract for BYOC stays as `(planId: string) => void`** (unlike onboarding's `PlanSelectionPayload`). BYOC doesn't carry override metadata.

### 4. `src/pages/customer/byoc-onboarding/shared.ts`

- Remove `TIER_HIGHLIGHTS` export and `getTierKey` function. No caller left.

### 5. `src/pages/customer/onboarding/shared.ts` + `index.ts`

- Remove `TIER_HIGHLIGHTS` export and `getTierKey` function from `shared.ts`.
- Remove their re-export from `index.ts`.
- Keep `PropertyFormData`, `FieldErrors`, `stripNonDigits`, `capitalize`, `validateProperty`.

### 6. `src/components/plans/PlanCard.tsx`

- **Delete**. No callers remain.

### 7. `src/pages/customer/Subscribe.tsx` + `supabase/functions/create-checkout-session/index.ts`

- **No code changes required.** Subscribe already reads `planId` from URL query. Onboarding (via Batch 2.2 `completeStep`) sets `customer_onboarding_progress.selected_plan_id` to the *resolved variant id* (or the override). `SubscribeStep` receives `planId={selectedPlanId}` (OnboardingWizard.tsx:168). The checkout function already looks up the plan row by id and returns the variant's Stripe price.
- **Verification steps (document in the spec, run smoke test):**
  1. On onboarding completion, `customer_onboarding_progress.selected_plan_id` is the resolved variant (e.g., a "Basic 30" row id), not a family root.
  2. Navigating to `/customer/subscribe?plan=<variant-id>` loads variant-level name and price in `usePlanDetail`.
  3. `create-checkout-session` receives the variant plan id in the payload; Stripe metadata has `plan_id: <variant-id>`.
  4. When the Stripe webhook later creates the `subscriptions` row (existing flow, not in this batch), `plan_id` is the variant id.
- No changes to the checkout function mean no edge-function deploy in this batch.

### 8. Admin review visibility (deferred)

- `docs/upcoming/TODO.md` gets an entry: "Admin dashboard surface for `customer_onboarding_progress.metadata.plan_variant_selection.admin_review_flagged=true`". Out of scope here; noted for a future Round 64 follow-up.

### 9. Feature list sync

- If `docs/feature-list.md` exists, update relevant rows for Browse / Plans / onboarding Plan step / BYOC to reflect the family/variant UX.

## Acceptance criteria

1. `Browse.tsx` renders three `PlanFamilyCard`s, no `PlanCard` import, no hardcoded `PLANS` array.
2. `Plans.tsx`:
   - Initial state shows three `PlanFamilyCard`s with correct "Starts at" pricing + recommended flag.
   - Tapping a family calls `pick_plan_variant` and shows the resolved `PlanVariantCard`.
   - "See other sizes" lists the other variants in the family.
   - "Subscribe" navigates to `/customer/subscribe?plan=<variantId>`.
   - Back button returns to the family view.
   - "Starts at" works when zones gating is off (zoneEnabled default).
3. `PlanActivateStep.tsx`: renders three family cards, auto-selects recommended family's smallest variant, "Activate Service" CTA unchanged.
4. No file imports `@/components/plans/PlanCard` anywhere in `src/`.
5. `src/components/plans/PlanCard.tsx` deleted.
6. `TIER_HIGHLIGHTS` / `getTierKey` removed from both `onboarding/shared.ts` and `byoc-onboarding/shared.ts` (and from `onboarding/index.ts` re-exports).
7. `Subscribe.tsx` + `create-checkout-session` untouched and still work with a variant plan id end-to-end.
8. `docs/upcoming/TODO.md` includes the "admin review dashboard" deferred item.
9. `npx tsc --noEmit` clean. `npm run build` clean.
10. Public `/browse` still renders for unauthenticated users (no new auth requirement slipped in).

## Out of scope

- Flipping the 12 draft variants to `active` — product decision.
- Public RLS policy on `plans` (would be needed for live Browse data) — tracked in TODO.md.
- Admin dashboard surface for variant override flag — future batch.
- Stripe product/price seeding for variants — already in TODO.md.
- Migration adding first-class override columns to `customer_plan_selections` — not required for this batch because the onboarding metadata is enough for admin visibility.

## Risks

- **Zone availability at the family level:** aggregating "any variant enabled in zone" is a judgment call. If product wants stricter (e.g., all variants must be enabled), we change the aggregator. Document in code.
- **Customer with no property:** Plans.tsx needs graceful handling. A pre-flight check before calling the RPC prevents runtime errors.
- **Browse staleness:** hardcoded prices in Browse.tsx may drift from the DB. Acceptable for marketing page until the RLS / activation decision is made. Add a code comment linking to the TODO item.
- **BYOC "smallest variant" default:** arguably unfair to provide a customer with large home the "10" variant. If this bites, a future batch can add property sizing to the BYOC flow — outside scope here.
- **Legacy subscribers:** customers with legacy Essential/Plus/Premium subscriptions are unaffected — they don't re-run onboarding, and Plans.tsx doesn't show their current plan highlighted (future polish).

## Review checklist

- Lane 1 (Spec Completeness): every AC 1–10 has a matching implementation in the diff.
- Lane 2 (Bug Scan): null safety, Radix-select sentinel if used anywhere, dark-mode colors, cache-key consistency (`plan_handles_all` still shape-compatible), no dead imports after deletions, Tailwind `warning` not `warn`.
- Lane 3 (Historical Context): `git blame`/`git log` on Plans.tsx, PlanActivateStep.tsx, Browse.tsx, and PlanCard.tsx — confirm this batch doesn't revert fixes. Specifically check `59bbc89` (error states on 7 customer pages) is preserved for Plans.tsx.
- Lane 4 (Sonnet Synthesis): cross-validate, score, categorize.
- Lane 5 (Haiku second-opinion synthesis): sanity check on the Sonnet synthesis — catch anything missed.
