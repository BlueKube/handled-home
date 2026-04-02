# Batch 1: Property.tsx Decomposition

## Phase
Round 14: Property Profiles

## Review: Quality

## Scope
2 files:
- `src/pages/customer/Property.tsx` (456 lines → extract HomeSetupSection)
- `src/components/customer/HomeSetupSection.tsx` (NEW — extracted component)

## Changes
1. Extract `HomeSetupSection` (lines 49-114) into a separate file
2. Import it in Property.tsx

## Acceptance Criteria
- [ ] Property.tsx under 300 lines after extraction
- [ ] HomeSetupSection.tsx under 300 lines
- [ ] No behavioral changes
- [ ] TypeScript compiles clean
