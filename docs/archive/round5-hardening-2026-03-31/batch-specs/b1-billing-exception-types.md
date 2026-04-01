# Batch B1 — Migration: Add Billing Exception Types to ops_exceptions

> **Size:** S
> **Review:** Quality (Small: 1 combined reviewer + 1 synthesis)

---

## Goal

Extend the `ops_exception_type` enum to include billing-related exception types so that the ops_exceptions system can handle all exceptions (ops + billing) in one queue.

## New Exception Types

Add to `ops_exception_type` enum:
- `payment_failed` — failed payment after dunning step 2+
- `payment_past_due` — payment past due (dunning step 3+)
- `payout_failed` — provider payout processing failure
- `dispute_opened` — customer opened a payment dispute/chargeback
- `earnings_held` — provider earnings held >48 hours
- `reconciliation_mismatch` — billing vs actual service mismatch

## Migration Contents

1. Add 6 new values to `ops_exception_type` enum
2. Add a comment documenting which types are billing-origin vs ops-origin

## Acceptance Criteria

- [ ] 6 new enum values added via ALTER TYPE
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

## Out of Scope

- Auto-generation triggers (would need edge function changes — defer)
- UI changes (B2)
- Types.ts update (B2)
