

# Round 2B — Automation Engine: Revised Implementation Plan

## User Adjustments Applied

1. **Numbering fix**: 2B-14/15 in tasks.md are expansion triggers and waitlist (not cron). Cron/infrastructure becomes **2B-00** (new sprint-0 task).
2. **Reorder**: Assignment/Overflow/No-show (Sprint 2) comes before Billing (now Sprint 4). City loop first, billing polish after.
3. **Explainability columns**: Every automation table gets `explain_customer`, `explain_provider`, `explain_admin` text fields.
4. **Notification emission**: Every automation inserts into a `notifications` table so users are informed automatically.
5. **Security**: Waitlist gets rate limiting + anonymous insert guard. Batch edge functions get idempotency keys.
6. **performance_score**: Computed field with `formula_version` and `computed_at` stored alongside.

Plus **Sprint 0 bonus**: Clean up the Zone Provider Assignments UI to be foolproof before the Primary+Backup model depends on it.

---

## Revised Task ID Mapping

| Old Plan ID | Correct tasks.md ID | Description |
|---|---|---|
| "2B-14 cron" | **2B-00** (new) | pg_cron + infrastructure + cron_run_log |
| "2B-15 svc week" | **2B-00b** (new) | Service week consumption tracking |
| 2B-01 | 2B-01 | Auto-assign jobs |
| 2B-02 | 2B-02 | Route optimization |
| 2B-03 | 2B-03 | Overflow handling |
| 2B-04 | 2B-04 | No-show detection |
| 2B-05 | 2B-05 | SLA enforcement |
| 2B-06 | 2B-06 | Auto-flag low-quality |
| 2B-07 | 2B-07 | Photo quality validation |
| 2B-08 | 2B-08 | Dunning sequence |
| 2B-09 | 2B-09 | Referral credits |
| 2B-10 | 2B-10 | Hold release |
| 2B-11 | 2B-11 | Weather mode |
| 2B-12 | 2B-12 | Auto-weather |
| 2B-13 | 2B-13 | Holiday calendar |
| 2B-14 | 2B-14 | Zone expansion triggers |
| 2B-15 | 2B-15 | Waitlist system |
| 2B-16 | 2B-16 | Auto-zone creation |

---

## Build Order (7 Sprints)

### Sprint 0: Infrastructure + Admin UX Foundation
**Tasks: 2B-00, 2B-00b, Zone Provider UI cleanup**

1. **Notifications table** — `notifications` (id, user_id, type, title, body, data JSONB, read_at, created_at). RLS: users see own. Every automation inserts here.

2. **cron_run_log table** — function_name, started_at, completed_at, status, result_summary, error_message, idempotency_key.

3. **zone_category_providers table** — zone_id, category, provider_org_id, role (PRIMARY/BACKUP), priority_rank, status (ACTIVE/SUSPENDED), assigned_at, performance_score (numeric), formula_version (text, e.g. "v1"), computed_at (timestamptz). Unique constraint: one PRIMARY per zone+category.

4. **job_assignment_log table** — job_id, provider_org_id, assignment_reason, explain_customer, explain_provider, explain_admin, score_breakdown (JSONB), assigned_at, assigned_by (system/admin), previous_provider_org_id.

5. **Service week consumption**: Add `service_weeks_used` to `subscriptions`. Create `increment_service_week_usage` RPC with atomic increment + entitlement check.

6. **Zone Provider Assignments UI cleanup**: Rebuild `ZoneProvidersPanel` to be category-aware (per zone+category), show clear Primary/Backup designation with guardrails (only 1 Primary per category), prevent same provider as both Primary and Backup, show performance_score, and add confirmation dialogs for changes.

### Sprint 1: Job Assignment Engine
**Tasks: 2B-01, 2B-03, 2B-04**

7. **auto_assign_job RPC** — eligibility gate → Primary-first check via `zone_category_providers` → Backup fallback ranked by priority_rank + performance_score → stores audit in `job_assignment_log` with all three explain fields → inserts `notifications` for provider ("New job assigned: {explain_provider}").

8. **assign-jobs edge function** — batch processor with idempotency_key per run. Finds unassigned jobs, calls RPC for each. Logs to `cron_run_log`.

9. **Overflow handling (2B-03)** — When Primary at capacity and no Backup: check adjacent days → create overflow event → flag admin. Customer gets notification with explain_customer. Add overflow tab to admin/Scheduling.

10. **No-show detection (2B-04)** — Add `latest_start_by` column to `jobs`. `check-no-shows` edge function: runs hourly with idempotency, finds past-due jobs, auto-reassigns via Backup pool, creates notification for customer (calm framing) and provider (reliability impact), logs to `job_assignment_log`.

11. **Admin Scheduling enhancements** — Zone Provider Assignments panel (Primary/Backup per category), assignment log viewer, manual override with reason field, "why assigned" data display.

### Sprint 2: Quality Enforcement
**Tasks: 2B-05, 2B-06, 2B-07**

12. **provider_sla_status table** — provider_org_id, zone_id, category, sla_level (GREEN/YELLOW/ORANGE/RED), metrics_snapshot JSONB, explain_provider, explain_admin, formula_version, computed_at, evaluated_at.

13. **evaluate-provider-sla edge function** — daily cron, idempotency_key, pulls from `provider_health_snapshots`, applies threshold ladder, creates `provider_enforcement_actions` + `notifications` for provider with actionable explain_provider ("Your photo compliance dropped to 82%. Complete 10 compliant jobs to return to Green.").

14. **Auto-flag (2B-06)** — Extension of SLA: RED for 2+ weeks → suspend in `zone_category_providers`, auto-promote highest Backup, notify admin with explain_admin.

15. **Photo validation (2B-07)** — `validate-photo-quality` edge function: file size, dimension, duplicate hash. Returns pass/fail. On fail: provider notification with explain_provider.

### Sprint 3: Billing Automation
**Tasks: 2B-08, 2B-09, 2B-10**

16. **Dunning (2B-08)** — Add `dunning_step`, `dunning_started_at`, `last_dunning_at` to `subscriptions`. Create `dunning_events` table with explain_customer, explain_admin. `run-dunning` edge function: daily with idempotency, 5-step ladder, inserts `notifications` at each step with escalating explain_customer messaging.

17. **Referral credits (2B-09)** — Modify `generate_subscription_invoice` RPC: check credit balance, auto-apply, create ledger entry. Customer notification with explain_customer ("$15 referral credit applied to your invoice").

18. **Hold release (2B-10)** — Enhance `run-billing-automation`: nightly check for expired holds, update to ELIGIBLE, create notification for provider with explain_provider ("Your $X payout hold has been released").

### Sprint 4: Weather & Scheduling
**Tasks: 2B-11, 2B-12, 2B-13**

19. **weather_events table** — zone_id, category, start_date, end_date, strategy (SHIFT/SKIP_CREDIT/CUSTOMER_CHOICE), status, explain_customer, explain_provider, explain_admin, created_by. Admin UI in Scheduling page.

20. **Auto-weather (2B-12)** — Edge function with weather API. Requires API key secret. Advisory vs severe thresholds. Creates PENDING weather_event for admin approval.

21. **holiday_calendar table** — date, name, zone_id (nullable), shift_strategy. Pre-seed US federal holidays. Job generation skips holidays.

### Sprint 5: Zone Expansion
**Tasks: 2B-14, 2B-15, 2B-16**

22. **expansion_suggestions table** — zone_id, category, signals JSONB, suggested_action, explain_admin, status, created_at. `evaluate-zone-expansion` weekly edge function.

23. **waitlist_entries table** — email, zip_code, name, referral_code, created_at, notified_at, converted_at. RLS: anon insert allowed BUT rate-limited (validation trigger: max 5 per IP/email per hour via a `waitlist_rate_limits` tracking approach or edge function gating). Public signup via edge function (not direct table insert) for rate limiting.

24. **Auto-zone creation (2B-16)** — When waitlist threshold + provider available → create zone in DRAFT with pre-filled config. Admin reviews.

### Sprint 6: Route Optimization
**Tasks: 2B-02**

25. **Route optimization** — Add `route_order` to `jobs`. `optimize-routes` edge function: nightly for next day, geohash nearest-neighbor. Provider sees suggested order. Manual reorder allowed and logged.

---

## Cross-Cutting Patterns (Applied Everywhere)

### Explainability
Every automation table includes three text columns:
- `explain_customer` — Plain English, empathetic ("We moved your service to Tuesday due to weather")
- `explain_provider` — Action-oriented ("Overflow assist: this job was reassigned from the primary provider")
- `explain_admin` — Technical/diagnostic ("Primary capacity exceeded by 3 jobs, backup pool provider #2 selected, score: 0.87")

### Notification Emission
Every automation action inserts into `notifications`:
```text
notifications (user_id, type, title, body, data)
```
The `data` JSONB includes `deep_link` for in-app navigation. This feeds the future notification center (Round 2C) but the data is captured now.

### Idempotency
All batch edge functions include:
- `idempotency_key` (e.g., `assign-jobs:2026-02-25:zone-abc`) stored in `cron_run_log`
- Check before execution: if key exists with status=completed, skip
- Safe to re-run without side effects

### performance_score
- **Computed**, never manually editable
- Stored with `formula_version` (e.g., "v1") and `computed_at` timestamp
- Formula v1: weighted average of on_time_pct (0.3), photo_compliance (0.25), issue_free_rate (0.25), completion_rate (0.2)
- Recomputed by `evaluate-provider-sla` edge function daily
- Admin can see formula version + last computation time but cannot edit the score directly

### Security
- Waitlist signup goes through an edge function (not direct table insert) to enforce rate limiting
- All batch edge functions validate caller (service role key or admin JWT)
- `waitlist_entries` has RLS: anon can only insert (via edge function), admin can read/update

---

## New Database Objects Summary

**New tables (9):** `notifications`, `cron_run_log`, `zone_category_providers`, `job_assignment_log`, `provider_sla_status`, `dunning_events`, `weather_events`, `holiday_calendar`, `waitlist_entries`, `expansion_suggestions`

**Modified tables:** `subscriptions` (+dunning_step, dunning_started_at, last_dunning_at, service_weeks_used), `jobs` (+latest_start_by, route_order)

**New edge functions (8):** `assign-jobs`, `check-no-shows`, `evaluate-provider-sla`, `validate-photo-quality`, `run-dunning`, `check-weather-forecast`, `evaluate-zone-expansion`, `optimize-routes`

**New secrets needed:** Weather API key (Sprint 4 only, can defer)

---

## Recommended Start

**Sprint 0** first: infrastructure tables + notifications + Zone Provider UI cleanup. This is the foundation everything else builds on. Estimated: 2-3 implementation messages.

