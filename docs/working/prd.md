# PRD-001: Edge Function Security Hardening

> **Execution mode:** Quality
> **Priority:** P0 — Must fix before any user touches production
> **Source:** gstack CSO Audit (2026-03-29), Findings 1-7, 10

---

## Problem Statement

The gstack CSO audit identified 3 critical and 4 high-severity security vulnerabilities in the Edge Function layer. These include a Stripe webhook signature bypass that allows forged payment events, 19 Edge Functions with no authentication that can be triggered by anyone who discovers the URL (including `send-email` which is an open relay), and a billing automation auth bypass via the public anon key. These vulnerabilities must be fixed before any real customer or provider uses the platform.

---

## Goals

1. Enforce Stripe webhook signature validation — never accept unsigned events
2. Add authentication to all 19 unprotected Edge Functions via a shared auth utility
3. Fix the billing automation anon-key bypass
4. Restrict `send-email` to service-role callers only
5. Fix BYOC invite link enumeration (restrict anon SELECT policy)
6. Remove `intended_role` from client-side auth bootstrap
7. Separate seed data from production migrations
8. Create a shared `_shared/` utilities layer for Edge Functions (auth, CORS, deps)

---

## Non-Goals

- Refactoring Edge Function business logic
- Adding new features to any Edge Function
- Changing the Stripe integration flow
- Modifying the customer/provider/admin UI
- Adding test coverage (covered in PRD-012)

---

## Scope

### Batch 1: Create shared Edge Function utilities (`_shared/`)
- Create `supabase/functions/_shared/cors.ts` — shared CORS headers (replace wildcard with origin allowlist)
- Create `supabase/functions/_shared/auth.ts` — shared auth utilities:
  - `requireServiceRole(req)` — validates Authorization header matches service role key
  - `requireCronSecret(req)` — validates CRON_SECRET header for scheduled functions
  - `requireUserJwt(req, supabase)` — validates user JWT and returns user
  - `requireAdminJwt(req, supabase)` — validates user JWT + admin role check
- Create `supabase/functions/_shared/deps.ts` — pinned dependency versions

### Batch 2: Fix Stripe webhook signature bypass
- In `stripe-webhook/index.ts`: Remove the `else { event = JSON.parse(body) }` fallback
- Enforce: if `STRIPE_WEBHOOK_SECRET` is not set, throw an error (fail closed, not open)
- If signature validation fails, return 401 (not 400)
- Remove CORS headers from webhook endpoint (server-to-server only)

### Batch 3: Add CRON_SECRET to all unauthed scheduled functions
- Add `CRON_SECRET` environment variable check to these functions:
  - `run-dunning`
  - `run-billing-automation` (replace anon-key passthrough)
  - `run-nightly-planner`
  - `run-scheduled-jobs`
  - `assign-jobs`
  - `assign-visits`
  - `check-no-shows`
  - `compute-quality-scores`
  - `snapshot-rollup`
  - `evaluate-zone-expansion`
  - `check-weather`
  - `compute-zone-state-recommendations`
  - `evaluate-provider-sla`
  - `send-reminders`
  - `cleanup-expired-offers` (already has partial pattern — standardize)
  - `process-notification-events`
  - `validate-photo-quality`
  - `optimize-routes`
  - `route-sequence`
- Each function: import `requireCronSecret` from `_shared/auth.ts`, call at top of handler
- Update `run-billing-automation` to use `requireCronSecret` OR `requireAdminJwt` (dual mode, but remove anon-key check)

### Batch 4: Restrict send-email + fix remaining auth issues
- `send-email`: Add `requireServiceRole` check — only service-role callers can send
- `predict-services`: Add `requireUserJwt` check (AI predictions should require auth)
- `support-ai-classify`: Add `requireServiceRole` check (internal classifier)
- `auto-resolve-dispute`: Add `requireAdminJwt` OR `requireCronSecret` check

### Batch 5: Fix BYOC invite enumeration + auth bootstrap + seed data
- Update BYOC invite link RLS policy: restrict anon SELECT to require token match via RPC parameter, or remove anon direct table access and route through `get_byoc_invite_public` RPC only
- Remove `intended_role` from client-side auth bootstrap in `AuthContext.tsx` — always pass `"customer"` to `bootstrap_new_user`. Provider role assignment must come through admin approval flow only.
- Create `supabase/seed.sql` with test user inserts extracted from `20260322000000_fix_test_users_and_seed_metro.sql`. Remove auth.users inserts from the migration file itself. Add comment documenting that seed.sql is for dev/staging only.

---

## Acceptance Criteria

- [ ] `_shared/auth.ts` exists with `requireServiceRole`, `requireCronSecret`, `requireUserJwt`, `requireAdminJwt` exports
- [ ] `_shared/cors.ts` exists with origin-restricted CORS headers
- [ ] Stripe webhook throws if `STRIPE_WEBHOOK_SECRET` is not set (fail closed)
- [ ] Stripe webhook returns 401 on signature failure
- [ ] Stripe webhook has no CORS headers
- [ ] All 19 previously unauthed functions require `CRON_SECRET` or appropriate auth
- [ ] `run-billing-automation` no longer accepts anon key as auth
- [ ] `send-email` requires service-role caller
- [ ] BYOC invite links are not enumerable by anon users via direct table SELECT
- [ ] `AuthContext.tsx` always passes `"customer"` to `bootstrap_new_user` (no `intended_role` from metadata)
- [ ] Test user inserts are in `supabase/seed.sql`, not in a numbered migration
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes

---

## Regression Risks

- Edge Functions that are called by pg_cron must accept the `CRON_SECRET` — if the secret is not configured in the Supabase environment, all scheduled jobs will fail. Document this in DEPLOYMENT.md.
- Removing the webhook signature fallback means the webhook will fail if `STRIPE_WEBHOOK_SECRET` is not set — this is the intended behavior (fail closed), but must be documented.
- Restricting BYOC invite links could break the BYOC activation flow if the RPC path is not correctly wired. Verify `activate-byoc-invite` still works after RLS change.
- Removing `intended_role` means existing provider signups that rely on metadata-based role assignment will default to customer. This is correct (providers should be admin-approved), but verify the provider application flow still works.
