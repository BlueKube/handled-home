# Batch 9: Cancel Flow Intercept + Settings "I'm Moving" Button

## Phase
Phase 3 — "I'm Moving" Wizard

## Review: Quality

## Size: Small

## What
When a customer selects "Moving to a new area" as their cancel reason, redirect to the moving wizard instead of continuing with cancellation. Add "I'm moving" button to Settings.

## Requirements
1. CancellationFlow.tsx: when reason="moving" and user clicks "Next", navigate to /customer/moving
2. Settings.tsx: add "I'm Moving" card/button between Household and Legal sections

## Acceptance Criteria
- [ ] Selecting "moving" in cancel flow redirects to wizard
- [ ] Settings has visible "I'm moving" entry point
- [ ] Build passes

## Files Changed
- `src/components/plans/CancellationFlow.tsx` (edit)
- `src/pages/customer/Settings.tsx` (edit)
