# Batch 7.3 — Onboarding "who could you bring?" step + Referrals page restyle

> **Round:** 64 · **Phase:** 7 of 8 · **Batch:** 7.3 of 7.x · **Final batch of Phase 7**
> **Branch:** `feat/round-64-batch-7.3-onboarding-step-referrals-restyle`
> **Size:** Medium · **Tier:** Quality

## Review: Quality

3 parallel lanes + Lane 4 synthesis (sub-agent). Lane 3 in play (7.1 + 7.2 already in-history).

## Why

Final BYOC/BYOP/referral elevation surface. Catches the customer at peak post-onboarding momentum AND finishes the credits-language sweep on `/customer/referrals` (the last place "$X" still appears).

## Scope

### In

1. **New onboarding step** — insert `bring_someone` between `service_day` and `routine`:
   - Modify `src/hooks/useOnboardingProgress.ts` `ONBOARDING_STEPS` array (column is plain `string` per `types.ts:1407` — no migration needed).
   - Modify `src/pages/customer/OnboardingWizard.tsx`: add `STEP_LABELS["bring_someone"] = "Friend"`, render `<BringSomeoneStep />` when `effectiveStep === "bring_someone"`.
   - Wire up the `onSkip` path so users can skip the step (calls `completeStep("bring_someone")` without writing a recommendation).

2. **New step component `src/pages/customer/onboarding/BringSomeoneStep.tsx`** — single primary action:
   - Inputs: `provider_name` (required if not skipping), `phone` (optional), `category` (chip-select using existing `CATEGORY_ORDER` / `CATEGORY_LABELS`).
   - Submit calls `useByopRecommendations.submit({...})` with `note: "[from: onboarding]"`. On success: `completeStep("bring_someone")`.
   - Skip: gray-style button → `completeStep("bring_someone")` directly.
   - Helpful sub-copy explaining the BYOP value prop ("we vet, you earn 30 credits when they sign up").

3. **Extend `RecommendProvider.ALLOWED_REFERRERS`** — add `"onboarding"` to the whitelist so the BringSomeoneStep can use the same attribution path that `/customer/recommend-provider?from=onboarding` would.

4. **Referrals page credits-language sweep** (`src/pages/customer/Referrals.tsx`):
   - HelpTip: "$30 credit toward your next cycle" → "30 credits toward your next cycle"
   - Earned card: `${(earnedCents / 100).toFixed(0)}` → `{(earnedCents / 100).toFixed(0)} credits` (display value 1:1 — Phase 3 sweep convention).
   - Pending card: same treatment.
   - Milestones: `"$30 credit"` → `"30 credits"` (other rewards "Free month" / "VIP status" stay — they aren't dollar denominations).
   - Add a circular progress ring around the current-milestone count (Credits-page aesthetic) — replaces or augments the existing horizontal `<Progress />`. Keep the existing milestone chips below.
   - Acceptance: zero `$` symbols on the page after the sweep (verified by grep).

5. **Index export** — add `BringSomeoneStep` to `src/pages/customer/onboarding/index.ts`.

### Out (deferred / scope-control)

- **Provider lookup / autocomplete on the BYOP form** — manual entry only this batch.
- **Email field on BringSomeoneStep** — `RecommendProvider` accepts email; the inline onboarding step keeps the surface minimal (name + category + phone). Customer can fill the long form later via `/customer/recommend-provider`.
- **BYOC link generation from the step** — there's no customer-initiated BYOC creation today; same constraint as 7.1.
- **Removing the existing horizontal `<Progress />`** in favor of ring-only — adding the ring augments rather than replaces, to avoid coupling progress visual + milestone tiles refactor in the same batch.
- **Sarah PR #49 microcopy sweep on onboarding CTAs** — flagged in `sarah-backlog.md` (`vague-button-pair-clarity`, now 2 of 3 PRs); will likely fold into a Round 65 microcopy sweep batch unless 7.3's re-run promotes it. Not in this scope.

## Files touched

```
src/hooks/useOnboardingProgress.ts                                MODIFIED (1-line array insert)
src/pages/customer/OnboardingWizard.tsx                           MODIFIED (STEP_LABELS + render branch)
src/pages/customer/onboarding/BringSomeoneStep.tsx                NEW (~120 lines)
src/pages/customer/onboarding/index.ts                            MODIFIED (1-line export)
src/pages/customer/RecommendProvider.tsx                          MODIFIED (whitelist `onboarding`)
src/pages/customer/Referrals.tsx                                  MODIFIED (credits sweep + ring)
```

6 files, 1 new + 5 modified. New component well under decomposition threshold.

## Acceptance criteria

- [ ] Onboarding wizard now has 9 steps (was 8); progress bar correctly reflects step N of 9.
- [ ] `bring_someone` step shows after Service Day; renders form with provider name + category + phone.
- [ ] Submit button writes a `byop_recommendations` row with `note: "[from: onboarding]"` and advances to `routine`.
- [ ] Skip button advances to `routine` without writing.
- [ ] After completion or skip, the wizard never re-shows the `bring_someone` step (per the existing `completedSteps.includes(...)` pattern).
- [ ] `/customer/referrals` shows zero `$` symbols.
- [ ] Earned + Pending cards show `X credits` instead of `$X`.
- [ ] Milestones show "30 credits" instead of "$30 credit"; other rewards untouched.
- [ ] Circular ring renders around the current-milestone count (visual augment, not replacement).
- [ ] `RecommendProvider` accepts `?from=onboarding` and prefixes the BYOP note correctly.
- [ ] `npx tsc --noEmit` + `npm run build` + `npm test` clean.

## Testing tier

| T1 | T2 | T3 | T4 | T5 |
|----|----|----|----|----|
| ✅ | — | ✅ (smoke: render BringSomeoneStep mock; submit + skip paths) | — | optional (Sarah may re-measure onboarding) |

## Blast radius

Medium-low. Adding an onboarding step changes the DB-stored `current_step` value for in-progress customers — but it's just a string ("bring_someone"), no enum constraint. Existing customers mid-onboarding may transit through the new step on their next session. Acceptable: it's skippable, and no destructive action.

## Branching

- Branch: `feat/round-64-batch-7.3-onboarding-step-referrals-restyle` (off `main` after PR #51 merge).
- Single PR; self-merge per CLAUDE.md §11.
