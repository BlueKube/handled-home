# Batch 1: Settings HouseholdSection + useHouseholdInvites Polish

## Phase
Round 15: Household Members

## Review: Quality

## Scope
2 files:
- `src/pages/customer/Settings.tsx` (HouseholdSection function)
- `src/hooks/useHouseholdInvites.ts`

## Changes
1. **HouseholdSection loading state** — Show skeleton while members query loads
2. **HouseholdSection error state** — Show error message when query fails
3. **HouseholdSection empty state** — Show "No household members yet" when list empty
4. **handleRemove error handling** — Check for error from update, show error toast on failure
5. **useHouseholdInvites** — Add console.warn on error for debugging

## Acceptance Criteria
- [ ] Loading skeleton shown while members load
- [ ] Error message shown if members query fails
- [ ] Empty state message when no members
- [ ] handleRemove shows error toast on failure
- [ ] useHouseholdInvites logs errors for debugging
- [ ] No behavioral changes to invite/remove logic
