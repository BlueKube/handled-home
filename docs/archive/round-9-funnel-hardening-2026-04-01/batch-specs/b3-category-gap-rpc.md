# Batch 3: Category Gap RPC

## Phase
Phase 2 — Real Category Gap Intelligence

## Review: Quality

## Size: Small

## What
Create an RPC that returns which categories genuinely need providers for a set of ZIP codes, based on market_zone_category_state data.

## Requirements

### RPC: get_category_gaps
1. Input: p_zip_codes (text[])
2. Logic:
   - Find zones matching the ZIP codes
   - Query market_zone_category_state for those zones
   - Return categories where status is CLOSED, WAITLIST_ONLY, or PROVIDER_RECRUITING (these need providers)
3. Output: array of { category, status, zone_name }
4. Grant to authenticated users

### Why an RPC (not client-side query)
- Joins zones → market_zone_category_state in one call
- ZIP-to-zone mapping is a server concern
- Avoids leaking zone internals to the client

## Acceptance Criteria
- [ ] RPC exists and returns category gaps for given ZIPs
- [ ] Only returns categories with status CLOSED/WAITLIST_ONLY/PROVIDER_RECRUITING
- [ ] Returns empty array if no zones match or all categories are covered
- [ ] Granted to authenticated users

## Files Changed
- `supabase/migrations/20260401500000_get_category_gaps.sql` (new)
