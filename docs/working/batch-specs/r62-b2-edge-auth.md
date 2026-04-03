# Batch Spec: R62-B2 — Edge Function Auth Hardening

## Review: Quality (Small→Medium tier — 3 parallel lanes + 1 synthesis)

## Problem
4 edge functions have auth gaps (logged in TODO.md):
1. `offer-appointment-windows`: NO auth check — any POST body accepted
2. `backfill-property-zones`: JWT validated but no admin role check
3. `commit-zones`: JWT validated but no admin role check
4. `generate-zones`: JWT validated but no admin role check

## Files
- `supabase/functions/offer-appointment-windows/index.ts`
- `supabase/functions/backfill-property-zones/index.ts`
- `supabase/functions/commit-zones/index.ts`
- `supabase/functions/generate-zones/index.ts`

## Changes

### 1. offer-appointment-windows: Add requireUserJwt
This function exposes scheduling data. Add `requireUserJwt` from `_shared/auth.ts` before processing the request body.

### 2. backfill-property-zones, commit-zones, generate-zones: Add requireAdminJwt
These are admin-only zone operations. Replace the hand-rolled JWT check with `requireAdminJwt` from `_shared/auth.ts`.

## Acceptance Criteria
- [ ] offer-appointment-windows returns 401 without valid JWT
- [ ] backfill-property-zones returns 401/403 without admin role
- [ ] commit-zones returns 401/403 without admin role
- [ ] generate-zones returns 401/403 without admin role
- [ ] All functions still work correctly with proper auth
