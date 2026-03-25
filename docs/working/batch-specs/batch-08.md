# Batch 8 — F26 Provider Detail Earnings + F29 Billing Route + Payout Schedule

## Scope
Three admin-facing fixes.

## Requirements

### 1. F26 Provider Detail — Earnings tab
- Add "Earnings" tab to ProviderDetail.tsx
- Show: payout account status, summary stats, recent earnings, active holds, payouts
- Use existing `useAdminProviderLedger` hook
- Reference layout pattern from ProviderLedger.tsx

### 2. F29 Billing — Fix broken customer nav
- Billing.tsx navigates to `/admin/billing/customers` which doesn't exist
- Fix: navigate directly to a search or change to existing route

### 3. F29 Payouts — Payout schedule section
- Add payout schedule info to Payouts.tsx
- Link to `/admin/control/payouts` for policy config
- Show next scheduled payout info

## Acceptance Criteria
- [ ] Earnings tab on Provider Detail with account status, stats, earnings, holds, payouts
- [ ] Billing customer nav fixed (not broken)
- [ ] Payout schedule section on Payouts page with link to control
- [ ] Build passes
