# Batch 2: HomeSetupCard + CustomerPropertyGate Polish

## Phase
Round 14: Property Profiles

## Review: Quality

## Scope
2 files:
- `src/components/customer/HomeSetupCard.tsx`
- `src/components/CustomerPropertyGate.tsx`

## Changes
1. **HomeSetupCard** — Show skeleton loading state instead of returning null while coverage/sizing data loads
2. **CustomerPropertyGate** — Show error state when household_members query fails instead of silently returning false. Clarify "D1-F3 FIX" comment.

## Acceptance Criteria
- [ ] HomeSetupCard shows skeleton while loading
- [ ] CustomerPropertyGate shows error state on query failure
- [ ] Cryptic comment clarified
- [ ] No behavioral changes to redirect logic
