# Module 14: Reporting & Analytics — Implementation Plan

## Overview
Build the Ops Cockpit (admin) and Provider Insights surfaces per the PRD at `docs/modules/14-reporting-and-analytics.md`. Mobile-first, tappable tiles → drill-down lists → deep links to existing module pages.

## Architecture Decisions

### Routing Strategy
The PRD suggests `/admin/ops/*` routes. The existing admin nav is flat (`/admin/*`). We'll use `/admin/ops` as the Ops Cockpit home and nest sub-routes under it, adding an "Ops Cockpit" nav item that replaces the current placeholder "Reports" link.

### Data Strategy (v1: Direct Queries, No Rollup Tables)
For v1, we query existing transaction tables directly rather than building rollup/snapshot tables. The PRD's recommended rollup tables (`ops_kpi_snapshots_daily`, `zone_health_snapshots`, `provider_health_snapshots`) are deferred to v2 when performance requires it.

**Rationale:** With current data volumes (early-stage), direct queries with proper indexes will be fast enough. Rollup tables add schema, cron jobs, and reconciliation complexity that isn't justified yet.

### Hook Strategy
Create a single `useOpsMetrics` hook that fetches all top-level KPIs in parallel, plus focused hooks for each drill-down section. Reuse existing hooks where possible.

---

## Phase 1: Foundation (hooks + Ops Cockpit home)

### Task 1.1: Create `useOpsMetrics` hook
**File:** `src/hooks/useOpsMetrics.ts`

Fetches all top-level KPI data in a single hook using parallel queries:
- **Today Execution:** Count jobs scheduled today, completed today, in-issue today, proof exceptions
- **Capacity Pressure:** Zones with >90% capacity utilization in next 7 days
- **Quality:** Issue rate per 100 jobs (7d), credits issued (7d), redo intents (7d)
- **Revenue & Billing:** Subscriptions paid today, past due count, failed payments today
- **Growth:** Activated referrals 7d, provider applications 7d, hot zones by demand

### Task 1.2: Create Ops Cockpit home page
**File:** `src/pages/admin/OpsCockpit.tsx`

Layout: 5 tile sections (A–E per PRD §6.1), each with 3–4 `StatCard` components. Each card is tappable → navigates to drill-down route. Shows "Updated X min ago" timestamp.

### Task 1.3: Update routing + nav
- Replace `/admin/reports` with `/admin/ops` → `OpsCockpit`
- Add sub-routes for drill-downs
- Update `AppSidebar.tsx`: rename "Reports" to "Ops Cockpit" with `Gauge` icon

---

## Phase 2: Zone Health Drill-Down

### Task 2.1: Create `useZoneHealth` hook
**File:** `src/hooks/useZoneHealth.ts`

### Task 2.2: Zone Health list page
**File:** `src/pages/admin/OpsZones.tsx`

### Task 2.3: Zone Health detail page
**File:** `src/pages/admin/OpsZoneDetail.tsx`
Route: `/admin/ops/zones/:zoneId`

---

## Phase 3: Service Day, Jobs & Proof Drill-Downs

### Task 3.1: Service Day Health page
**File:** `src/pages/admin/OpsServiceDays.tsx`
Route: `/admin/ops/service-days`

### Task 3.2: Jobs & Proof Health page
**File:** `src/pages/admin/OpsJobs.tsx`
Route: `/admin/ops/jobs`

---

## Phase 4: Billing, Support, Growth Health Drill-Downs

### Task 4.1: Billing Health page — `src/pages/admin/OpsBilling.tsx`
### Task 4.2: Support Health page — `src/pages/admin/OpsSupport.tsx`
### Task 4.3: Growth Health page — `src/pages/admin/OpsGrowth.tsx`

---

## Phase 5: KPI Definitions + Provider Insights

### Task 5.1: KPI Definitions page — `src/pages/admin/OpsDefinitions.tsx`
### Task 5.2: Provider Insights page — `src/pages/provider/Insights.tsx`
### Task 5.3: Update provider nav

---

## Phase 6: Polish + Existing Dashboard Upgrade

### Task 6.1: Upgrade Admin Dashboard with real data
### Task 6.2: Audit Log page (real implementation)

---

## File Summary

| Phase | New Files | Modified Files |
|-------|-----------|----------------|
| 1 | `useOpsMetrics.ts`, `OpsCockpit.tsx` | `App.tsx`, `AppSidebar.tsx` |
| 2 | `useZoneHealth.ts`, `OpsZones.tsx`, `OpsZoneDetail.tsx` | `App.tsx` |
| 3 | `OpsServiceDays.tsx`, `OpsJobs.tsx` | `App.tsx` |
| 4 | `OpsBilling.tsx`, `OpsSupport.tsx`, `OpsGrowth.tsx` | `App.tsx` |
| 5 | `OpsDefinitions.tsx`, `Insights.tsx` | `App.tsx`, `AppSidebar.tsx` |
| 6 | — | `Dashboard.tsx`, `Audit.tsx` |

## Dependencies
- No new npm packages
- No new database tables for v1
- No new edge functions
- Reuses existing hooks

## Deferred to v2
- Rollup/snapshot tables
- Cron-based snapshot computation
- Realtime 15-min counters
- Provider Insights history page
