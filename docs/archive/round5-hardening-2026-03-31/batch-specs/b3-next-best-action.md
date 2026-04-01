# Batch B3 — Next-Best-Action Engine + One-Tap Actions

> **Size:** M
> **Review:** Quality (Small: 1 combined reviewer + 1 synthesis)

---

## Goal

Upgrade the static repair suggestions in the exception detail panel to actionable next-best-action buttons. Add billing type labels and suggestions.

## Deliverables

1. Update `OpsExceptionDetailPanel.tsx`:
   - Add billing type labels
   - Add billing repair suggestions
   - Convert static suggestions to actionable buttons with pre-filled action recording
2. Create `src/lib/exception-actions.ts` — maps exception types to structured actions with labels, action types, and reason codes

## Action Types per Exception

| Exception Type | Primary Action | Secondary Actions |
|---|---|---|
| payment_failed | Retry Payment | Contact Customer, Issue Credit |
| payment_past_due | Escalate to Dunning | Contact Customer, Pause Subscription |
| payout_failed | Retry Payout | Contact Provider, Manual Transfer |
| dispute_opened | Present Evidence | Issue Credit, Accept Dispute |
| earnings_held | Release Hold | Extend Hold, Contact Provider |
| reconciliation_mismatch | Investigate Mismatch | Issue Adjustment, Flag for Audit |
| (existing ops types keep their current suggestions but as buttons) |

## Acceptance Criteria

- [ ] All 15 exception types have repair suggestions
- [ ] Suggestions render as buttons, not just text
- [ ] Clicking a suggestion records an action with pre-filled type and reason
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
