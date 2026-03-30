# Batch 5: Payment & Billing Test Coverage (PRD-023)

## Phase
Phase 4 — Code Fixes from Audit

## Review: Quality (Large — 5 agents)

## Why it matters
The 5 core billing edge functions have zero test coverage beyond auth guard regression tests. A single silent bug in dunning, payout, or billing automation could cause financial harm.

## Scope
- Write Deno integration tests for: run-billing-automation, process-payout, run-dunning, create-checkout-session
- Test auth rejection, input validation, CORS preflight, and happy-path response shapes
- recalc_handles_balance is a SQL RPC (not an edge function) — out of scope for this batch
- Follow existing test pattern from security-regression.test.ts and activate-byoc-invite/index.test.ts

## Non-goals
- Does NOT mock Stripe API or Supabase RPCs (integration tests against running instance)
- Does NOT test the SQL RPCs called by the functions
- Does NOT set up CI automation for test runs

## File targets
| Action | File |
|--------|------|
| Create | supabase/functions/run-billing-automation/index.test.ts |
| Create | supabase/functions/process-payout/index.test.ts |
| Create | supabase/functions/run-dunning/index.test.ts |
| Create | supabase/functions/create-checkout-session/index.test.ts |

## Acceptance criteria
- [ ] run-billing-automation: tests for cron auth rejection, CORS, anon key rejection
- [ ] process-payout: tests for missing auth, missing payout_id, CORS, anon rejection
- [ ] run-dunning: tests for cron auth rejection, CORS, idempotency response shape
- [ ] create-checkout-session: tests for missing auth, missing plan_id, CORS, anon rejection
- [ ] All tests follow existing Deno test pattern (import assertions, fetch-based)
- [ ] Build passes (npm run build)

## Regression risks
- Tests require running Supabase instance — won't pass in dry CI
