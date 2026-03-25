# Batch 4 — F17 Provider Onboarding Visual Progress Bar

## Scope
Add a visual progress bar with back navigation to all 6 provider onboarding steps (F17).

## Requirements (from screen-flows.md)
- Each step (17.2–17.7) specifies: "Progress Indicator: ArrowLeft back + Step X of 6 progress bar (accent fill)"
- Visual progress bar fills with accent color proportional to current step
- Back button navigates to previous step

## Current State
- All 6 pages show plain text `<p className="text-caption mb-1">Step X of 6</p>`
- No visual progress bar
- No back button UI

## Implementation

### 1. Create `OnboardingProgressHeader` component
**File:** `src/components/provider/OnboardingProgressHeader.tsx`
- Props: `currentStep: number`, `totalSteps: number`, `onBack?: () => void`
- Renders: ChevronLeft back button (per project conventions) + "Step X of Y" caption + `<Progress>` bar
- Uses existing `@/components/ui/progress` (Radix primitive)
- Accent-colored progress indicator
- Back button hidden on step 1 (no previous step)

### 2. Update all 6 onboarding pages
Replace plain text step counter with `<OnboardingProgressHeader>`:
- `OnboardingOrg.tsx` — Step 1, no back (or back to invite code)
- `OnboardingCoverage.tsx` — Step 2, back to org
- `OnboardingCapabilities.tsx` — Step 3, back to coverage
- `OnboardingCompliance.tsx` — Step 4, back to capabilities
- `OnboardingAgreement.tsx` — Step 5, back to compliance
- `OnboardingReview.tsx` — Step 6, back to agreement

## Acceptance Criteria
- [ ] Visual accent-filled progress bar on all 6 steps
- [ ] Progress fills proportionally (step/totalSteps)
- [ ] Back button (ChevronLeft) navigates to previous step
- [ ] Step 1 has no back button (or goes to /provider/onboarding)
- [ ] "Step X of 6" text preserved
- [ ] Consistent with mobile-first design (44px touch targets, p-4 pb-24)
- [ ] Build passes
