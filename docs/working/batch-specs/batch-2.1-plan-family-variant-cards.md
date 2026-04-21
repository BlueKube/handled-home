# Batch 2.1 — `PlanFamilyCard` + `PlanVariantCard` split

> **Phase:** Round 64 Phase 2 — Onboarding: home signals → variant → "Starts at" pricing
> **Size:** Medium
> **Review tier:** Medium (3 parallel lanes + synthesis = 4 agents). Lane 3 will be skipped per CLAUDE.md §5 "Lane 3 skip rule" since this is the **first batch in the phase** (no prior review findings on the changed files). Override will be logged in the commit message.
> **Branch:** `claude/handled-home-phase-2-YTvlm`

---

## Why this batch exists

Phase 1 delivered the variant schema (`plans.plan_family`, `plans.size_tier`, `plan_variant_rules`, `pick_plan_variant` RPC, 12 draft variants seeded). Every downstream surface in Phase 2 — Browse, Plans, PlanStep, Subscribe — needs two distinct card shapes:

1. A **family** card (Basic / Full / Premier) that shows "Starts at $X" and a "4 sizes" chip. This is what public Browse and the initial onboarding view render.
2. A **variant** card (Basic 30, Full 20, etc.) that shows the resolved price, the variant-specific credit allowance, and a one-line rationale. This is what the customer sees after `pick_plan_variant` resolves their plan.

Building these once, as dumb/reusable components, keeps Batch 2.2 (PlanStep resolution) and Batch 2.3 (Browse/Plans/Checkout) focused on *wiring* instead of re-building the card shape three times. It also localizes the visual decisions (tier colors, ribbon, "Starts at" formatting) so we don't fork them.

## Scope

### New files

- `src/components/plans/PlanFamilyCard.tsx` — **family-level** card.
  - Props:
    - `family: 'basic' | 'full' | 'premier'` — family key, drives tier color + highlights.
    - `familyName: string` — display name ("Basic", "Full", "Premier"). Derived by caller.
    - `tagline?: string` — family-level tagline (e.g., "The basics, handled." for Basic).
    - `startsAtPriceText: string` — "Starts at" price, e.g., `"$79"`. Caller computes by picking smallest-tier variant's `display_price_text`.
    - `variantCount: number` — number of variants in the family; renders "N sizes" chip.
    - `highlights?: string[]` — bullet list of family-level value props (uses existing `TIER_HIGHLIGHTS` from `src/pages/customer/onboarding/shared.ts` keyed on family).
    - `isRecommended?: boolean` — shows "Most Popular" ribbon + `StatusBadge status="recommended"`.
    - `zoneEnabled?: boolean` — when `false`, renders the "Not available in your area" badge and hides the primary CTA.
    - `onSelect?: () => void` — primary CTA tap. When present, renders "Get Started" or "See plans" button.
    - `onPreview?: () => void` — secondary CTA. When present, renders "View Details" outline button.
  - Visual shape: same card frame as existing `PlanCard.tsx` (rounded, ring-2 when recommended, press-feedback, etc.). Differences:
    - Price row says `"Starts at $X"` not `"$X"`. `"/ 4 weeks"` suffix kept.
    - Replaces the handles-per-cycle callout with a "N sizes" chip (uses `Layers` icon from lucide-react).
    - No handles number and no per-variant sticker on this card.

- `src/components/plans/PlanVariantCard.tsx` — **resolved variant** card.
  - Props:
    - `variant: Plan` — the resolved plan (exact variant like "Basic 30"). Imported from `@/hooks/usePlans`.
    - `family: 'basic' | 'full' | 'premier'` — family key for color/highlights. Caller resolves from `variant.plan_family` and narrows the type.
    - `handlesPerCycle?: number` — variant-specific credits (looked up from `plan_handles` by caller).
    - `rationale?: string` — one-line copy: `"Based on your ~2,800 sqft home, your Basic plan is Basic 30."`. When provided, renders above the highlights in an `bg-muted/40` callout with an `Info` icon.
    - `highlights?: string[]` — tier highlights (same source as `PlanFamilyCard`).
    - `isRecommended?: boolean`.
    - `onChangeSize?: () => void` — tertiary action. Renders a ghost button labeled "See other sizes" below the primary CTA. Only shown when provided.
    - `onConfirm?: () => void` — primary CTA. Renders "Continue" (or caller passes `confirmLabel` if they need "Activate", "Subscribe", etc.).
    - `confirmLabel?: string` — optional label override for the primary CTA. Defaults to `"Continue"`.
  - Visual shape: same card frame as `PlanFamilyCard`. Differences:
    - Header shows variant name (e.g., `"Basic 30"`) as the Badge, with `family` label in smaller text above or to the left (e.g., muted `"Basic plan"` prefix so the hierarchy is clear).
    - Price row shows exact `variant.display_price_text` (no "Starts at").
    - Keeps the handles callout (`handlesPerCycle` in the accent pill) from existing `PlanCard`.
    - Renders the optional rationale callout above highlights.

### Shared extractions

- Move the existing `TIER_ACCENT` map (currently inline in `PlanCard.tsx`) into a new **lowercase-keyed** version that keys on family strings (`basic`, `full`, `premier`) — used by both new components. Extract to `src/components/plans/planTierStyles.ts` (single source of truth so we don't duplicate across the two cards and any future plan surface).
  - Keys: `basic`, `full`, `premier`, `legacy` (maps `legacy` → same neutral styling as `essential` does today).
  - Export: `TIER_ACCENT: Record<PlanFamilyKey, string>` and `type PlanFamilyKey = 'basic' | 'full' | 'premier' | 'legacy'`.
- Leave `src/pages/customer/onboarding/shared.ts` **alone** for Batch 2.1 — `TIER_HIGHLIGHTS` keyed on `essential/plus/premium` is still consumed by the legacy `PlanCard` code paths until Batch 2.2/2.3 migrate them. Adding family-keyed highlights without removing the legacy ones avoids breaking the current call sites this batch doesn't touch.
  - Add a parallel export `FAMILY_HIGHLIGHTS: Record<'basic' | 'full' | 'premier', string[]>` in `src/components/plans/planTierStyles.ts`. Same strings as `TIER_HIGHLIGHTS` but keyed on family; callers in 2.2/2.3 consume this.

### Files NOT changed in 2.1

- `src/components/plans/PlanCard.tsx` — **leave in place**. Still used by `Plans.tsx`, `PlanStep.tsx`, `PlanActivateStep.tsx`. Migrating those is Batch 2.2 (PlanStep) and Batch 2.3 (Plans, Checkout). Removing `PlanCard.tsx` here would break three screens mid-phase.
- `src/pages/customer/onboarding/shared.ts` — keep legacy `TIER_HIGHLIGHTS` export for back-compat with current `PlanCard` callers. Will be consolidated in 2.3 after all callers move.

## Acceptance criteria

1. `PlanFamilyCard` renders with:
   - `"Starts at $X / 4 weeks"` (caller-computed smallest variant price).
   - "N sizes" chip using `Layers` icon.
   - "Most Popular" ribbon when `isRecommended`.
   - "Not available in your area" badge + no primary CTA when `zoneEnabled={false}`.
   - Family-keyed highlight bullets from `FAMILY_HIGHLIGHTS` when `highlights` prop passed.
   - Primary CTA only renders when `onSelect` is provided AND `zoneEnabled !== false`.
2. `PlanVariantCard` renders with:
   - Variant name (e.g., `"Basic 30"`), family label, and exact `display_price_text`.
   - Handles callout using accent pill + `Sparkles` icon when `handlesPerCycle` is provided.
   - Optional rationale callout (muted background + `Info` icon) above highlights when `rationale` is provided.
   - Primary CTA label = `confirmLabel ?? "Continue"`.
   - "See other sizes" ghost button when `onChangeSize` is provided.
3. `planTierStyles.ts` exports:
   - `PlanFamilyKey` type = `'basic' | 'full' | 'premier' | 'legacy'`.
   - `TIER_ACCENT: Record<PlanFamilyKey, string>` with the same shape as the current PlanCard constants (neutral for legacy, accent-tinted for full, primary-tinted for premier, base for basic).
   - `FAMILY_HIGHLIGHTS: Record<'basic' | 'full' | 'premier', string[]>` with family-level bullet copy.
4. No existing call site changes behavior — `PlanCard.tsx`, `Plans.tsx`, `PlanStep.tsx`, `PlanActivateStep.tsx`, `Browse.tsx`, `Dashboard.tsx` all still compile and render exactly as before. (2.1 only *adds* files; it doesn't edit callers.)
5. `npx tsc --noEmit` passes clean. `npm run build` passes clean.

## Out of scope (deferred to 2.2 / 2.3)

- Wiring `pick_plan_variant` RPC into PlanStep (Batch 2.2).
- Writing the rationale copy ("Based on your ~2,800 sqft home, ...") from property signals (Batch 2.2).
- Manual override dropdown with admin review flag (Batch 2.2).
- Replacing `Browse.tsx` hardcoded `PLANS` array with live family query (Batch 2.3).
- Migrating `Plans.tsx` + `PlanStep.tsx` + `PlanActivateStep.tsx` from `PlanCard` to the new components (Batches 2.2/2.3).
- Checkout writing resolved-variant `plan_id` to `subscriptions.plan_id` (Batch 2.3).
- Deleting the old `PlanCard.tsx` and consolidating `shared.ts` — happens in Batch 2.3 once no callers remain.

## Risks

- **Visual regression risk = zero** for this batch because no call sites change. The new components are loaded only by future batches. Any divergence from the existing `PlanCard` look-and-feel gets caught in Batch 2.2/2.3 review.
- **Type risk**: `Plan.plan_family` is typed `string | null` on the DB, so callers must narrow before passing to `PlanVariantCard`. Each new component uses its own `PlanFamilyKey` prop to force that narrowing at the call site rather than papering over it with `as any`.

## Review checklist (for Lanes 1/2/4)

- Props on both components match the list above.
- `planTierStyles.ts` has exactly the three exports above (no drift).
- No accidental edit to `PlanCard.tsx`, `Plans.tsx`, `PlanStep.tsx`, `PlanActivateStep.tsx`, `Browse.tsx`, `Dashboard.tsx`.
- Tailwind tokens use project conventions (`accent`, `primary`, `muted`, `warning` — never `warn`).
- No `bg-*-100` / `text-*-600` light-only colors — dark-first palette only.
- No inline business logic; these are presentation components.
- `tsc --noEmit` and `npm run build` clean.
