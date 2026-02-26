# 14-reporting-and-analytics.md
> **Implementation Status:** ✅ Implemented in Round 1. Ops Cockpit, provider Insights, snapshot rollup, audit logs all built.

**Handled Home — Module 14 PRD (Reporting & Analytics: Mobile-First Ops Cockpit)**  
**Platforms:** iOS + Android (Capacitor) — mobile-first UI; Admin console mobile-optimized  
**Primary users:** Admins, Dispatch/Ops, Provider managers (optional)  
**Secondary users:** Providers (limited “my performance”), Customers (minimal “my stats” only if desired)  
**Core principle:** **Every number is tappable → drill to underlying rows → next action.**  
**Last updated:** 2026-02-22  

> This PRD expands and productionizes the attached guide, keeping the same intent and operating philosophy: real-time, pragmatic ops, drill-downable metrics, and actionability.  

---

## 0) Why this module exists

Handled Home is a density-based subscription machine. Quality and margin live or die in operations.

Module 14 is the **single source of operational truth** for:
- zone health (capacity vs demand)  
- service day execution (jobs done, proof quality, issues)  
- billing health (past due, credits, refunds)  
- provider health (throughput, proof compliance, hold rate)  
- growth health (referrals, cohort launches, category readiness)  

If Module 14 is good:
- support load drops  
- quality stays high while scaling  
- markets can open faster with less human spreadsheet work  

---

## 1) North Star outcomes (Definition of Done)

1) Admin can answer “What’s happening right now?” in < 10 seconds.  
2) Admin can answer “Why is this happening?” by drilling into raw rows.  
3) Admin can take an action from the drill-down (link to the right screen/module).  
4) Providers can see simple, motivating performance signals (no finance leakage).  
5) Metrics are consistent, reconciled, and stable:
   - one definition per KPI  
   - versioned if definitions change  
6) Dashboards remain fast on mobile:
   - < 2s for top-level summaries  
   - drill-down paginated and searchable  

---

## 2) Non-goals (keep it pragmatic)

- No BI monster (Looker-level modeling)  
- No bespoke chart builder for admins  
- No predictive ML forecasting required for v1  
- No customer-facing “analytics app”  
- No complex multi-currency accounting analytics (defer to Module 11 internals)  

---

## 3) Personas + what they need

### Admin (Owner/Ops Lead)
- “Are we on track today?”  
- “Which zone is breaking?”  
- “Where are we losing money (credits/refunds/redo)?”  
- “What do I fix first?”  

### Dispatcher / Ops
- “Who has issues right now?”  
- “Which jobs are missing proof?”  
- “Where are we overloaded tomorrow?”  

### Provider (Individual)
- “What’s my day?” (Module 09)  
- “How am I doing?” (simple score + proof compliance + rework rate)  
- “When do I get paid?” (Module 11)  

---

## 4) Key principles (design + reliability)

1) **Action > insight:** every widget links to a concrete list and next step.  
2) **Few metrics, correct metrics:** avoid vanity charts.  
3) **Mobile-first scanning:** 3–6 tiles per screen; drill-down for detail.  
4) **Truth over polish:** if data is delayed, show “Updated X min ago.”  
5) **Single KPI definitions:** publish a definitions page for admins.  
6) **No PII leakage:** provider views never show customer billing details.  

---

## 5) Primary surfaces (routes)

### Admin routes (recommended)
- `/admin/ops` (Ops Cockpit home)  
- `/admin/ops/zones` (zone health list)  
- `/admin/ops/zones/:zone_id` (zone detail: capacity, demand, quality)  
- `/admin/ops/service-days` (service day health)  
- `/admin/ops/jobs` (jobs drill-down; deep links to Module 09 admin job view)  
- `/admin/ops/billing` (billing health; deep links to Module 11 admin)  
- `/admin/ops/support` (support health; deep links to Module 12 admin)  
- `/admin/ops/growth` (referrals/cohorts health; deep links to Module 13 admin)  
- `/admin/ops/definitions` (KPI definitions + timestamps)

### Provider routes (limited)
- `/provider/insights` (my performance, my proof quality, my issue rate)  
- `/provider/insights/history` (weekly trends; minimal)

> Note: customer reporting is out of scope except optional micro-surfaces (e.g., “visits completed this month”).

---

## 6) Ops Cockpit (Admin) — `/admin/ops`

### 6.1 Top-level tiles (today + next 7 days)
Each tile is tappable.

**A) Today execution**
- Jobs scheduled today (count)  
- Jobs completed (count + %)  
- Jobs in issue (count)  
- Proof exceptions (missing required photos/checklist)  

**B) Capacity pressure**
- Zones over 90% capacity next 7 days (count)  
- “Tight days” list (top 3)  

**C) Quality**
- Issue rate per 100 jobs (7 days)  
- Credits issued (7 days)  
- Redo intents created (7 days)  

**D) Revenue & billing**
- Subscriptions paid today  
- Past due customers (count)  
- Add-on revenue (7 days)  

**E) Growth**
- Activated referrals (7 days)  
- Provider applications (7 days)  
- “Hot zones” by demand signal (top 3)

### 6.2 Drill-down behavior (uniform)
Tap any metric → opens a list view with:
- filters (time range, zone, provider org, category)  
- sorting  
- row tap → deep link to canonical detail screen  
  - job → Module 09 admin job view  
  - ticket → Module 12 ticket detail  
  - invoice/payout → Module 11 detail  
  - zone → Module 03 zone page + ops tab  

---

## 7) Zone Health (Admin)

### 7.1 `/admin/ops/zones` (list)
Each zone row shows:
- status (active/paused)  
- default service day  
- capacity utilization (assigned/limit)  
- upcoming week load (bars)  
- issue rate (7 days)  
- growth pressure:
  - waitlist / uncovered demand count (Module 03 expansion signals)  

Tap zone → zone detail.

### 7.2 `/admin/ops/zones/:zone_id` (detail)
Sections:
1) **Capacity**
   - assigned vs max homes by service day window  
   - buffer utilization  
2) **Demand**
   - active subscribed homes in zone  
   - new signups last 7/30 days  
3) **Quality**
   - issue rate  
   - proof compliance  
   - redo intents  
4) **Provider coverage**
   - primary/backup assigned (Module 03 mapping)  
   - jobs per provider (7 days)  
5) **Actions**
   - deep link: edit zone capacity/settings  
   - deep link: enable/disable plans in zone (Module 05)  
   - deep link: Founding Partner slots (Module 13)  

---

## 8) Service Day Health (Admin) — `/admin/ops/service-days`

Purpose: ensure density + predictability stays healthy.

Widgets:
- service day offer backlog (unconfirmed assignments, Module 06)  
- rejection rate (last 7/30 days)  
- overrides count (last 7 days)  
- capacity exceptions (attempts blocked due to full)  

Drill-down:
- list of assignments by status (offered/confirmed)  
- list of overrides (audit log)  
- list of zones with high rejection rate

---

## 9) Jobs & Proof Health (Admin)

### 9.1 `/admin/ops/jobs` (search + filters)
Filters:
- status (not started / in progress / issue / completed)  
- missing proof flag  
- zone  
- provider org  
- date range  
- category/SKU (optional)

Row fields:
- job date  
- zone  
- provider org  
- status  
- proof state (complete / missing)  
- issue state (none / open)  

Row tap → `/admin/jobs/:job_id` (Module 09 support view).

### 9.2 Proof KPI definitions (MVP)
- **Proof compliance %** = completed jobs with all required proof satisfied ÷ completed jobs  
- **Proof exception** = completed via admin override OR missing required artifacts

---

## 10) Billing Health (Admin) — `/admin/ops/billing`

This page is a read-only health cockpit that deep-links into Module 11 for action.

Tiles:
- past due customers (count)  
- failed payments today (count)  
- credits issued (7/30 days)  
- refunds issued (7/30 days)  
- chargebacks/disputes (count; if tracked)  

Drill-down lists:
- customers past due  
- invoices failed  
- credits by tier + reason  
- refunds by reason

---

## 11) Support Health (Admin) — `/admin/ops/support`

Deep-links into Module 12.

Tiles:
- open tickets (count)  
- SLA breach risk (count)  
- self-resolve rate (7 days)  
- median time-to-resolution  
- high severity tickets (count)

Drill-down:
- ticket queues by category/severity  
- “repeat claimers” list (risk view)

---

## 12) Growth Health (Admin) — `/admin/ops/growth`

Deep-links into Module 13.

Tiles:
- referrals activated (7 days)  
- provider invites sent (7 days)  
- provider applications submitted (7 days)  
- Founding Partner cohorts: top 3 by velocity  
- fraud holds on rewards (count)

Drill-down:
- referral leaderboard (by cohort/zone)  
- provider org performance (invites → subs → first visit)  
- held rewards list with reasons

---

## 13) Provider Insights (Provider) — `/provider/insights`

Provider-facing reporting must be motivating and safe:
- no customer billing  
- no internal margin data  
- no comparisons that feel punitive  

Tiles:
- jobs completed (this week)  
- proof compliance %  
- issue rate (last 30 days)  
- average time on site (optional)  
- payout status summary (deep link Module 11)

Optional “coaching cues” (template-based):
- “Add more after photos to improve proof score.”  
- “Issues spiked last week — review access notes first.”

---

## 14) KPI definitions (Admin) — `/admin/ops/definitions`

Must include:
- name  
- formula  
- time window  
- data source tables  
- update cadence  
- caveats  

This prevents “metric drift” as the company scales.

---

## 15) Data architecture (Supabase-friendly, pragmatic)

### 15.1 Approach
Use a hybrid:
- **event/transaction tables** are source of truth (Modules 03–13).  
- **read models** (materialized views or rollup tables) power fast dashboards.

### 15.2 Recommended rollup tables (v1)
1) `ops_kpi_snapshots_daily`
- date, zone_id, category_id (nullable), provider_org_id (nullable)
- jobs_scheduled, jobs_completed, jobs_issues
- proof_exceptions
- credits_issued_cents
- refunds_issued_cents
- open_tickets_count
- referrals_activated_count
- computed_at

2) `ops_kpi_snapshots_realtime`
- last_15_min window
- lightweight counters for “today”

3) `zone_health_snapshots`
- zone_id
- capacity_utilization_next_7_days
- rejection_rate_30d
- issue_rate_30d
- growth_pressure_score
- computed_at

4) `provider_health_snapshots`
- provider_org_id
- proof_compliance_30d
- issue_rate_30d
- earnings_hold_rate_30d (safe to show to admin only)
- computed_at

### 15.3 Update cadence
- Realtime: every 1–5 minutes (cron/scheduler)  
- Daily: nightly rollup  
- When data delayed: show “Updated X min ago.”

---

## 16) Permissions & RLS boundaries

- Admin: full access to rollups + raw rows  
- Dispatcher/Ops: access to ops dashboards + limited actions via deep links  
- Provider: access only to provider_health snapshot and their own job aggregates  
- Customer: none (or minimal if later)

Strict rule:
- provider cannot see customer billing or other providers’ data

---

## 17) Reliability, reconciliation, and “trust”

### 17.1 Trust rules
- If a KPI is derived from webhooks (billing/payout), it must reflect webhook truth (Module 11).  
- If a KPI is derived from job completion, it must reflect server-validated completion (Module 09).  

### 17.2 Idempotency impact
Rollups must be computed from stable sources (not double-counting retries).  
If an out-of-order event arrives:
- next rollup cycle corrects the snapshot  
- UI shows consistent totals (no oscillation)

---

## 18) Edge cases

- Jobs completed via admin override: count under “proof exceptions.”  
- Zone paused mid-week: dashboards must show “paused” and exclude from “open capacity” totals.  
- Provider org not payout-ready: show “held earnings” under admin/provider views (provider sees only their own).  
- Support tickets created without job_id (billing disputes): still counted in support health.  
- Market exploding (NJ scenario): growth health shows velocity and “protect quality” triggers surface (ties to Module 13.3).

---

## 19) Acceptance tests (explicit)

1) Admin ops home loads in < 2 seconds and all tiles drill down to lists.  
2) Zone list shows accurate utilization and issue rate; zone detail drills to jobs and tickets.  
3) Proof exception KPI correctly counts missing-proof and override completions.  
4) Billing health tiles match Module 11 ledger truth.  
5) Support health tiles match Module 12 ticket counts and SLA states.  
6) Growth tiles match Module 13 referral/program truth.  
7) Provider insights show only provider-safe metrics and never expose customer billing.  
8) Snapshot timestamps display and update correctly; delayed data shows “Updated X min ago.”

---

## 20) Definition of done

Module 14 is done when:
- Admins can see ops health, drill into causes, and take action without spreadsheets.  
- Providers can see motivating, safe performance summaries.  
- All metrics are consistent, tappable, and trustworthy.  
- The system scales with minimal manual reporting work.  

---

## 21) Dispatcher/Ops RLS Differentiation (Deferred to v2)

Currently all admin users share a single `admin` role with identical access. The review identified a need for differentiated `dispatcher` and `ops` roles with scoped permissions.

**Recommended v2 pattern:**
- Add an `admin_scope` column to `user_roles` (e.g., `full`, `ops_readonly`, `dispatcher`) or create a separate `admin_permissions` table.
- Create RLS helper function `has_admin_scope(user_id, scope)` similar to `has_role()`.
- Scope ops cockpit read access to `ops_readonly` and `dispatcher` roles.
- Scope write actions (overrides, adjustments) to `full` admin only.
- Add a migration to backfill existing admins with `full` scope.

**Why deferred:** No current users require scoped admin access. Adding a new role enum value and RLS policies for a P3 item risks scope creep. Revisit when the team grows beyond a single admin operator.
