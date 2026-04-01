# Batch 5: Extend PropertyGate for Household Members

## Phase
Phase 2 — Household Members

## Review: Quality

## Size: Small

## What
Extend CustomerPropertyGate to allow household members (not just property owners) to access customer pages. Wire in the useHouseholdInvites hook for auto-acceptance.

## Requirements
1. PropertyGate: check if user is an active household member of any property (in addition to owning one)
2. Wire useHouseholdInvites hook into PropertyGate for auto-accept on load
3. Household members should be able to access customer pages

## Acceptance Criteria
- [ ] Household members pass PropertyGate
- [ ] useHouseholdInvites runs on customer page load
- [ ] Property owners still work as before
- [ ] Build passes

## Files Changed
- `src/components/CustomerPropertyGate.tsx` (edit)
