# B2 — ByocOnboardingWizard + Plans Decomposition

## Problem
- `src/pages/customer/ByocOnboardingWizard.tsx` is 675 lines (limit: 300)
- `src/pages/admin/Plans.tsx` is 640 lines (limit: 300)

## Approach

### ByocOnboardingWizard (675 → ~100 main + 5 extracted files)
Already has well-separated inline functions. Extract each to its own file under `src/pages/customer/byoc-onboarding/`:

| New File | Source Component | ~Lines |
|----------|-----------------|--------|
| `shared.ts` | Types, constants (ByocStep, CADENCE_LABELS, TIER_HIGHLIGHTS, helpers) | ~50 |
| `ConfirmServiceStep.tsx` | ConfirmServiceStep function | ~150 |
| `PlanActivateStep.tsx` | PlanActivateStep function | ~110 |
| `SmallSteps.tsx` | ActivatingScreen + SuccessScreen + InviteFallbackScreen | ~130 |
| `index.ts` | Barrel exports | ~5 |

Main wizard imports from barrel and stays under 100 lines.

### Plans.tsx (640 → ~170 main + 3 extracted files)
Extract sub-components under `src/components/admin/plans/`:

| New File | Source Component | ~Lines |
|----------|-----------------|--------|
| `shared.ts` | MODEL_LABELS, RULE_OPTIONS, updatePlanVersion | ~20 |
| `PlanForm.tsx` | PlanForm + CreateFirstVersion | ~185 |
| `EntitlementEditor.tsx` | EntitlementEditor | ~185 |
| `PlanHandlesEditor.tsx` | PlanHandlesEditor | ~90 |

Main AdminPlans imports sub-components and stays under 170 lines.

## Acceptance Criteria
- [ ] ByocOnboardingWizard.tsx ≤ 300 lines
- [ ] Plans.tsx ≤ 300 lines
- [ ] All extracted files ≤ 300 lines
- [ ] No functionality changes — pure extraction
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes
