# Batch 6: P3-2 Skip Options — Provider Onboarding

## Phase
Phase 1 — UX Polish & Verification Gaps

## Why it matters
Mandatory steps for optional fields create unnecessary friction in provider onboarding.

## Scope
- OnboardingOrg: Add "Skip for now" ghost button below Continue
- OnboardingCompliance: Add conditional "Skip for now" ghost button

## Non-goals
- No skip buttons on Coverage, Capabilities, Agreement, or Review steps
- No changes to step progression logic in parent Onboarding.tsx

## File targets
| Action | File |
|--------|------|
| Modify | `src/pages/provider/OnboardingOrg.tsx` |
| Modify | `src/pages/provider/OnboardingCompliance.tsx` |

## Acceptance criteria
- [ ] Step 1 shows "Skip for now" below Continue
- [ ] Skip on Step 1 requires name + accountability filled
- [ ] Step 4 shows "Skip for now" only when no strictly required items
- [ ] Skip advances to next step without saving optional data
- [ ] Skip button styling: ghost variant, muted text
