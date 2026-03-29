# Batch 1: Admin Payouts + Exceptions + Reporting Nav

## Phase
Phase 7 — Admin Operational Readiness

## Review: Quality

## Why it matters
Admins cannot identify which provider received a payout or which customer/provider is affected by an exception. Reporting is unreachable from nav.

## Scope
- Payouts: Add provider_orgs.name to each payout row via join or enrichment
- Exceptions: Add customer/provider name enrichment, add severity filter tabs, remove party emoji
- AdminShell: Add Reporting link to sidebar

## Non-goals
- Changing Payouts or Exceptions business logic
- Adding new admin pages

## File targets
| Action | File |
|--------|------|
| Modify | src/pages/admin/Payouts.tsx |
| Modify | src/pages/admin/Exceptions.tsx |
| Modify | src/components/admin/AdminShell.tsx |
| Possibly modify | src/hooks/useAdminBilling.ts (if data enrichment needed) |

## Acceptance criteria
- [ ] Payouts rows show provider org name
- [ ] Exceptions rows show entity name
- [ ] Exceptions has severity or type filter
- [ ] Reporting in sidebar nav
- [ ] No party emoji in Exceptions empty state
- [ ] npm run build passes

## Regression risks
- Adding joins/enrichment to Payouts query may impact load time if there are many payouts
- Filter tabs on Exceptions must handle the case where all exceptions are resolved (empty filtered view)
