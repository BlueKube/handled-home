# Handled Home — Round 2H Fix Pack (Updated Single Spec for Lovable)
**Attach alongside:** `2u-prd-completeness-review.md`  
**Purpose:** Close the gaps identified in the completeness review by wiring the “built but not running” systems, fixing known defects, and completing the highest-impact missing UX (Provider Map) while staying within the scope of Round 2E PRDs and the code delivered through Round 2G.

---

## 0) Intent and desired outcomes

### Intent
Turn the current codebase into a **self-running operational machine** by ensuring scheduled jobs execute reliably, quality scoring and training gates actually function, BYOC bonuses and weekly rollups are computed automatically, and the Provider Day Command Center meets the Round 2E spec (map + ordered stops).

### Desired outcomes
- Critical automations run on schedule with visible logs and failures are loud.
- Provider quality scores are computed and updated automatically; training gates evaluate correctly.
- BYOC bonuses compute weekly; BYOC lifecycle transitions happen daily.
- Provider Day Command Center includes an **embedded map** that shows **only today’s scheduled stops** with numbered pins + synced list and native navigation deep links.
- Admin can see cron run health and investigate failures quickly.

### Non-goals
- Redesigning architecture or adding net-new product lines
- Building live location streaming or real-time provider tracking
- Full routing optimization / map polylines / surge pricing
- Multi-step approval workflows for machine changes (decision remains: superuser-only changes)

---

## 1) Clarifying questions answered (decisions to implement)
Below are 10 clarifications for 2H with the recommended answer to implement.

### Q1. Should providers be allowed to reorder stops manually in 2H, or is the order locked?
**Suggested answer (implement):** Lock the order in 2H. Allow only: (a) mark stop as blocked/issue, (b) request reorder via a note/flag. Reordering creates downstream ETA assumptions and disputes; ship locked order first.

### Q2. Do we need provider location shown on the map, or only stop pins?
**Suggested answer (implement):** Show provider location only if permission is granted, and update only on screen focus/manual refresh. Default to stops-only if permission denied.

### Q3. What is the minimum map feature set: pan/zoom + pins, or also directions polyline?
**Suggested answer (implement):** Pan/zoom + numbered pins + selection highlighting only. No polyline routing in 2H; navigation is via deep links to Apple/Google Maps.

### Q4. Should dispatcher/admin be able to see a provider’s ‘today map’ too?
**Suggested answer (implement):** Yes, read-only in admin job/service-day detail: show the same stop pins for that service day to help dispatch troubleshoot.

### Q5. How should we handle missing/invalid lat-lng for an address?
**Suggested answer (implement):** Hard requirement: cache geocoded lat-lng at job creation/confirmation. If missing, show a ‘Map unavailable’ banner + list-only view + button to ‘Fix address’ (admin) or ‘Report address issue’ (provider).

### Q6. Should we support multi-stop navigation (‘route all stops’) or only single-destination deep links?
**Suggested answer (implement):** Single-destination deep links only in 2H: ‘Navigate to next stop’ and per-stop ‘Navigate’. Multi-stop routing is a later optimization.

### Q7. What’s the standard ‘Next stop’ selection rule?
**Suggested answer (implement):** Next stop = first incomplete stop in the planned order. If a stop is flagged ‘blocked’ or ‘skipped with reason’, move to the next incomplete stop.

### Q8. Do we need an offline mode for the map?
**Suggested answer (implement):** No true offline tiles in 2H. Provide graceful degradation: if map fails to load, fall back to list-only; all critical actions remain available.

### Q9. How should we measure and surface ‘at risk’ status for stops/jobs in the provider view?
**Suggested answer (implement):** Use simple heuristics: time-window remaining, ETA vs window end (if available), and ‘behind schedule’ based on expected durations. Show a small warning pill; do not add complex scoring in 2H.

### Q10. What are the default cron schedules (UTC) for 2H jobs?
**Suggested answer (implement):** Nightly: 00:30 compute_quality_scores; 01:00 evaluate_training_gates; Daily 02:00 byoc_lifecycle; Weekly Monday 00:30 compute_byoc_bonuses; Weekly Monday 01:30 provider_weekly_rollups. All log to cron_run_log.

---

## 2) Fix Pack Overview (Deliverables)

### Deliverable A — Scheduled automation infrastructure (pg_cron + pg_net)
- Enable **pg_cron** and **pg_net** (if not already enabled)
- Create `cron_run_log` for durable run history and debugging
- Implement scheduled jobs for:
  - Quality score computation
  - Training gate evaluation
  - BYOC weekly bonus computation
  - Weekly provider feedback rollups
  - BYOC lifecycle transitions / expiry

**Scheduling policy:**
- Single global schedule **defined in UTC**
- Weekly boundaries are **Monday–Sunday UTC**
- No timezone-per-zone scheduling in 2H

---

## 3) Deliverable A — Cron infra and run logging

### 3.1 Database objects
Create table `cron_run_log`:

| column | type | notes |
|---|---|---|
| id | uuid pk | default gen_random_uuid() |
| job_name | text | e.g., `compute_quality_scores_daily` |
| started_at | timestamptz | |
| finished_at | timestamptz | nullable |
| status | text | `success` / `error` / `partial` |
| result_summary | text | nullable |
| error_message | text | nullable |
| meta | jsonb | nullable (counts, durations, durations_by_step, etc.) |

### 3.2 Logging pattern (mandatory)
Every scheduled job:
- Inserts a `cron_run_log` row at start
- Updates it at completion
- On failure, records the error and partial metrics
- Optionally emits an `admin_audit_log` entry for machine-critical failures

### 3.3 Cron schedules (UTC)
Implement these schedules (or close equivalents):
- **Daily 00:30** — `compute_provider_quality_scores()`
- **Daily 01:00** — `evaluate_training_gates()`
- **Daily 02:00** — `run_byoc_lifecycle_transitions()`
- **Weekly Monday 00:30** — `compute_byoc_bonuses(week_start_utc)`
- **Weekly Monday 01:30** — `compute_provider_weekly_rollups(week_start_utc)`

> All schedules must write to `cron_run_log`.

### 3.4 Admin UI: Cron Health
Use `/admin/notification-health` or add `/admin/cron-health` and link it from Governance.
Must show:
- Last N runs per job
- Latest status + runtime
- Failure details + error stack (safe)
- “Retry now” button (**superuser only**) that triggers a manual run

---

## 4) Deliverable B — Quality score compute pipeline (make quality real)

### 4.1 Problem statement
Quality score schema/UI exists, but there is **no computation backend**, so quality tiers and enforcement/training gates don’t function.

### 4.2 Required data flow
1) Job completes → contributes signals (timeliness, proof quality, customer feedback, redo, etc.)
2) Nightly job computes provider + org **quality snapshot**
3) Snapshot updates current/latest score for fast reads
4) Training gates evaluate against latest snapshot/current score
5) UI renders snapshot history and current tier

### 4.3 Tables (use existing if present; otherwise implement)
- `provider_quality_snapshots`
  - provider_id
  - provider_org_id
  - score numeric
  - tier text
  - computed_at timestamptz
  - inputs jsonb (signals used)
- `provider_quality_current`
  - provider_id pk
  - score
  - tier
  - computed_at

**Design principle:** snapshots are append-only; current table/view is for speed.

### 4.4 Scheduled job: `compute_provider_quality_scores()`
Runs daily at 00:30 UTC.
Requirements:
- Computes scores/tier for each provider with activity in last X days
- Writes snapshot rows
- Updates current table
- Logs counts/durations into `cron_run_log`

### 4.5 UI hooks
- Provider Day Command Center: show tier + last computed time; optionally trend arrow if available
- Admin Provider detail: snapshot timeline, current tier, last compute time

---

## 5) Deliverable C — Fix training gates RPC + wire it to cron

### 5.1 Problem statement
`evaluate_training_gates()` references columns that don’t exist (per review):
- `composite_score` → should be `score`
- `snapshot_at` → should be `computed_at`

### 5.2 Fix requirements
- Update function to use correct column names
- Evaluate gates against **latest** snapshot/current score deterministically
- Write gate outcomes to a table or update provider status fields (per existing architecture)
- Log run results to `cron_run_log`

### 5.3 Scheduling
- Run daily at 01:00 UTC (after quality compute)

---

## 6) Deliverable D — BYOC automation: weekly bonuses + lifecycle transitions

### 6.1 Problem statement
`compute_byoc_bonuses()` exists but has no weekly runner; lifecycle transitions/expiry not automated.

### 6.2 Weekly bonus compute
- Runs weekly Monday 00:30 UTC for the previous Monday–Sunday UTC window
- Writes bonus ledger entries per provider/org
- Logs totals + counts to `cron_run_log`

### 6.3 Daily lifecycle transitions
- Runs daily at 02:00 UTC
- Marks referrals expired after window
- Advances statuses per Round 2E rules (install/subscribe/first visit, etc.)
- Produces anomaly flags for review

### 6.4 Admin visibility
- Growth Manager: funnel + attribution lookup
- Ops: anomaly review queue (non-financial)
- Superuser: caps/ceilings in Control Room (if in scope to finish)

---

## 7) Deliverable E — Weekly provider feedback rollups (DB-only v1)

### 7.1 Purpose
Create coaching-relevant summaries without AI in 2H.

### 7.2 Stored rollups
Store in `provider_weekly_rollups` (or existing table) keyed by:
- provider_id, week_start_utc, week_end_utc

Metrics:
- completion rate
- on-time rate
- redo rate
- average duration vs expected
- customer feedback aggregates (if available)

### 7.3 Schedule
- Weekly Monday 01:30 UTC (after BYOC bonus compute)
- Log to `cron_run_log`

---

## 8) Deliverable F — Provider Day Command Center Map View (embedded map + synced list)

### 8.1 Scope decision (2H)
- Embedded interactive map is required.
- Map shows **only today’s scheduled stops**.
- No live streaming; no routing polylines; no multi-stop route building.

### 8.2 Provider UX requirements
Map:
- Numbered pins (1..N) corresponding to planned stop order
- Optional provider dot if location permission granted (refresh on focus/manual)
- Tap pin → open stop preview; highlight list row

List:
- Ordered stops with status pills: Scheduled / In Progress / Completed / Issue
- Tap row → center/highlight corresponding pin

Actions:
- Primary: “Navigate to next stop” (deep link to Apple/Google Maps)
- Per-stop: “Navigate” (deep link)
- “Report issue” (creates note/incident; can escalate)

Fallback:
- If map fails or lat/lng missing, show “Map unavailable” banner and remain list-functional.

### 8.3 Address geocode handling (must)
- Cache lat/lng at job creation/confirmation.
- If missing/invalid:
  - Provider sees list-only + “Report address issue”
  - Admin sees “Fix address” action

### 8.4 “Next stop” rule
Next stop = first incomplete stop in planned order, skipping stops flagged as blocked/skipped-with-reason.

### 8.5 Admin read-only map
Expose the same “today route map” read-only to admin on:
- Service day detail
- Provider org detail (today view)

### 8.6 Performance guardrails
- Marker clustering if many stops
- Avoid high-frequency updates
- Minimal animations

---

## 9) Deliverable G — Admin completeness polish

### 9.1 Decision trace placements
Ensure Decision Trace appears on:
- Job detail
- Service day detail
- Provider org detail
- Payout/Hold detail
- Exception detail

### 9.2 SOP playbooks completion
Add missing playbooks, especially for Growth Manager, and link to filtered views.

### 9.3 Control Room page gaps
If incomplete per review, finish:
- Incentive caps & rules
- Algorithm & assignment parameters
- Policy guardrails (max weekly change, emergency TTL)

**Rule stays:** superuser-only machine changes.

---

## 10) Execution plan (sequencing)

### Sprint 2H-A (P0)
1) Enable pg_cron/pg_net
2) Add `cron_run_log`
3) Implement cron-health UI + manual retry (superuser only)

### Sprint 2H-B (P0)
4) Implement quality compute pipeline
5) Fix + schedule training gate evaluation

### Sprint 2H-C (P0)
6) Schedule BYOC weekly bonus + daily lifecycle transitions
7) Schedule weekly rollups

### Sprint 2H-D (P1)
8) Build Provider embedded map view + list sync + navigation deep links + fallback

### Sprint 2H-E (P1.5)
9) DecisionTrace placements, SOP completion, Control Room page gaps

---

## 11) Acceptance tests (high-level)
- Cron jobs run on schedule (verify via `cron_run_log`) and failures are visible in admin.
- Quality snapshots exist and tiers update after nightly run.
- Training gates evaluate successfully (no missing column errors).
- BYOC bonuses compute weekly; lifecycle transitions run daily.
- Weekly rollups exist for active providers for the prior week window.
- Provider Day Command Center shows **embedded map** with numbered pins for today’s stops and synced list; deep links work.
- Admin can view route pins read-only on service day/provider detail.
- Decision traces appear on all specified entities.
