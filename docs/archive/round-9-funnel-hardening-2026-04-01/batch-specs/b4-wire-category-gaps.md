# Batch 4: Wire Category Gaps RPC into Apply.tsx

## Phase
Phase 2 — Real Category Gap Intelligence

## Review: Quality

## Size: Small

## What
Replace the naive "all categories minus applied" logic with the real category gap data from the get_category_gaps RPC.

## Requirements

### Apply.tsx Status Screen Changes
1. Call get_category_gaps RPC with the applicant's zip_codes
2. Display results instead of the naive filter
3. Fallback to current behavior if RPC fails or returns empty
4. Show zone context: "In [zone_name], we need [category] providers"

## Acceptance Criteria
- [ ] Calls get_category_gaps with applicant's zip_codes
- [ ] Shows real category gaps from zone data
- [ ] Graceful fallback if RPC fails
- [ ] TypeScript compiles, build passes

## Files Changed
- `src/pages/provider/Apply.tsx` (edit — status screen section)
