# PRD-009: Admin Data Display & Navigation Fixes

> **Execution mode:** Quality
> **Priority:** P2 — Operational readiness
> **Source:** gstack Eng Review + UI/UX Audit (2026-03-29)

---

## Problem Statement

The Admin Payouts screen shows dollar amounts without provider names — operationally useless for reconciliation. The Exceptions screen lacks entity names and filters. The Reporting page is not in the sidebar nav.

---

## Goals

1. Add provider names to Payouts screen rows
2. Add entity names and filters to Exceptions screen
3. Add Reporting to sidebar navigation

---

## Non-Goals

- Redesigning admin page layouts
- Adding new admin features
- Changing Cron Health layout (deferred)

---

## Scope

### Batch 1: Payouts provider identity + Exceptions enrichment + Reporting nav
- Payouts: Enrich each payout row with provider org name (join provider_payouts → provider_orgs)
- Exceptions: Enrich with customer/provider name where available, add type filter tabs
- AdminShell: Add Reporting to sidebar nav under a suitable group
- Remove party emoji from Exceptions empty state

---

## Acceptance Criteria
- [ ] Payouts rows show provider org name
- [ ] Exceptions rows show related entity name (customer or provider)
- [ ] Exceptions has filter tabs by type or severity
- [ ] Reporting is in the admin sidebar nav
- [ ] npm run build passes
- [ ] npx tsc --noEmit passes
