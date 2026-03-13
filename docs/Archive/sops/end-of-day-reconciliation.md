---
title: End-of-Day Reconciliation
allowed_roles: [dispatcher, ops, superuser]
checklist: Verify all jobs completed, proof uploaded, no-shows flagged, exceptions resolved
---

# End-of-Day Reconciliation

## Purpose
Ensure every scheduled job for the day has a final status and no work is left untracked.

## Steps

1. **Open Dispatcher Queues** → Navigate to [Dispatcher Queues](/admin/ops/dispatch)
2. **Check "At Risk" tab** — Any remaining jobs must be resolved:
   - If provider is running late → contact provider, extend window or reassign
   - If customer cancelled same-day → mark as `cancelled` with reason
3. **Check "Missing Proof" tab** — Every completed job needs photos:
   - Send reminder notification to provider
   - If 2+ hours past completion → escalate to ops manager
4. **Check "Unassigned" tab** — Should be zero by end of day:
   - If jobs remain → trigger backup provider assignment
   - If no backup available → notify customer of reschedule
5. **Review Exceptions** → Navigate to [Exceptions](/admin/exceptions)
   - Resolve any `open` exceptions from today
   - Add resolution notes for audit trail
6. **Verify Coverage Gaps** — Check tomorrow's coverage:
   - Any zones with 0 assigned providers need immediate attention
7. **Log completion** — Reconciliation is auto-logged via cron; verify in [Audit Log](/admin/audit)

## When to escalate
- 3+ unresolved at-risk jobs → notify ops manager
- Provider no-show pattern (2+ in 7 days) → trigger probation ladder
- Missing proof after 4 hours → auto-deduct from payout
