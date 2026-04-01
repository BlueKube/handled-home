# Batch B2 — Unified Exception Hook + Page Update

> **Size:** S
> **Review:** Quality (Small: 1 combined reviewer + 1 synthesis)

---

## Goal

Update the Exceptions page to use the ops exception queue (which now includes billing types). Add a domain filter to distinguish ops vs billing exceptions.

## Deliverables

1. Update `src/pages/admin/Exceptions.tsx` — replace billing-only view with unified ops queue
2. Update `src/hooks/useOpsExceptions.ts` — add domain filter support (ops/billing/all)
3. Update `src/components/admin/ops/OpsExceptionQueue.tsx` — add domain filter tab

## Domain Classification

- **Ops domain:** window_at_risk, service_week_at_risk, provider_overload, coverage_break, provider_unavailable, access_failure, customer_reschedule, weather_safety, quality_block
- **Billing domain:** payment_failed, payment_past_due, payout_failed, dispute_opened, earnings_held, reconciliation_mismatch

## Acceptance Criteria

- [ ] /admin/exceptions shows the unified ops exception queue
- [ ] Domain filter (All / Ops / Billing) filters by exception type groups
- [ ] Existing /admin/ops/exceptions continues to work unchanged
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
