

# Round 2E — Revised Scope & Implementation Plan

## Current State
The existing 2E section in `tasks.md` (lines 283-307) has 13 old tasks that don't align with the expanded PRD. Much of the old 2E scope is already partially built:
- **Job status flow** (2E-01/02/03): Already exists in `JobDetail.tsx` with EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED + arrival/departure timestamps + customer notifications via Round 2C
- **Earnings dashboard** (2E-04/05/06): Already exists in `Earnings.tsx` with per-job breakdowns, modifiers, holds, payouts
- **Quality Score** (2E-11/12/13): Already built as D8 with rolling 28-day score, bands, weekly rollups

## What the Expanded 2E PRD Adds (Net-New Work)

Based on the expanded PRD (`docs/prds/Expanded Round 2E.md`) cross-referenced with existing code:

### E0 — Provider Day Command Center (partially built)
- **E0-01**: "Today" screen enhancements — projected earnings today, expected drive time, "Start Route" lock button. Dashboard exists but lacks earnings projection and route lock.
- **E0-02**: Job detail already has full status flow + proof + timestamps. **Already done.**
- **E0-03**: Customer coarse state notifications. **Already done in Round 2C.**

### E1 — Earnings & Payout Trust (partially built)
- **E1-01**: Day/week/month tab filtering on earnings. Currently flat list — needs time-period tabs.
- **E1-02**: "At current pace" monthly projection based on scheduled jobs. **Net new.**
- **E1-03**: Modifier transparency (bonus/hold/rush). Hold reasons exist, but modifier breakdown could be enhanced.

### E2 — Quality & Tier (partially built)
- **E2-01**: Quality Score page exists at `/provider/quality`. **Already done.**
- **E2-02**: Tier system tied to assignment priority + hold periods. **Net new** — needs `provider_tier_history` table and tier logic.
- **E2-03**: Coaching checklist + SKU training gates. **Net new.**

### E3 — Availability + Coverage (net new)
- **E3-01**: `provider_availability_blocks` table + calendar UI for vacation/days off
- **E3-02**: Assignment engine respects blocks (modify `auto_assign_job`)
- **E3-03**: Lead-time warnings + coverage gap detection

### E4 — BYOC / Founding Partner (partially built)
- **E4-01**: Invite flow exists at `/provider/invite-customers`. Needs `byoc_attributions` table + funnel tracking.
- **E4-02**: Attribution + $10/week bonus computation. **Net new** — `provider_incentive_config`, weekly bonus RPC.
- **E4-03**: Reassignment rules + customer "request provider change". **Net new.**

### E5 — Pricing/Pay Engine Admin Controls (net new, P2)
- Deferred per PRD recommendation ("P1-P2 depending how deep")

## Recommended Sprint Order

| Sprint | Scope | Complexity |
|--------|-------|-----------|
| **E-01** | Provider Day Command Center enhancements (projected earnings, drive time, route lock) | M |
| **E-02** | Earnings trust polish (time-period tabs, monthly projection, modifier detail) | M |
| **E-03** | Availability + Coverage (blocks table, calendar UI, assignment integration) | L |
| **E-04** | BYOC / Founding Partner (attribution table, bonus computation, funnel dashboard) | XL |
| **E-05** | Tier system + training gates (tier history, assignment priority modifiers, SKU gates) | L |

## Proposed First Sprint: E-01 (Provider Day Command Center)

### What gets built
1. **Database**: `provider_route_plans` table (provider_org_id, date, locked_at, total_stops, est_drive_minutes, est_work_minutes, projected_earnings_cents)
2. **RPC**: `lock_provider_route(p_provider_org_id, p_date)` — freezes route order, computes projections
3. **Dashboard enhancements**: Add projected earnings today, estimated drive/work time, "Start Route" button that locks the route
4. **Route lock behavior**: Once locked, reorder arrows disabled, optimize button hidden

### Files changed
- New migration for `provider_route_plans` + `lock_provider_route` RPC
- New/updated hook: enhance `useProviderJobs` or create `useProviderRoutePlan`
- Update `src/pages/provider/Dashboard.tsx` — add projected earnings + drive time stats
- Update `src/pages/provider/Jobs.tsx` — add "Start Route" lock button, disable reorder when locked
- Update `docs/tasks.md` — replace old 2E section with new task list

### Documentation updates (all sprints)
- Replace `docs/tasks.md` lines 283-307 with the new 2E task structure
- Update progress table

