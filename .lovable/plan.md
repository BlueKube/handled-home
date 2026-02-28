

# Sprint 2H-E Plan — With ChatGPT Feedback Remediation

## Status of ChatGPT's 7 Recommendations

| # | Recommendation | Status | Action Needed |
|---|---------------|--------|---------------|
| 1 | Single-runner RPC pattern for cron | ✅ Already using start/finish helpers in edge functions | None |
| 2 | Idempotency constraints | ⚠️ Rollups + BYOC bonuses have unique indexes; **quality snapshots do NOT** | Add unique index |
| 3 | Config-driven quality weights | ✅ Already in `admin_system_config` (B-F2 fix) | None |
| 4 | Explicit cron scheduling | ❌ No `pg_cron` schedules created yet | Create schedules |
| 5 | Mapbox token scoping | ✅ Client-side `VITE_` env var; no server key exposed | None |
| 6 | Geocoding scope | ✅ `lat`/`lng` already on `properties` table; no new API | None |
| 7 | Next payout card from actual rules | Planned as 2H-E4; will compute from data, not hardcode | Build carefully |
| + | Expected next run time on cron-health | ❌ Not present | Add to UI |

## Implementation Steps

### Step 1: Quality snapshot idempotency (migration)
Add a unique index on `provider_quality_score_snapshots(provider_org_id, computed_at::date)` so "Retry Now" can't create duplicate daily snapshots. Update the INSERT in `compute_provider_quality_scores` to use `ON CONFLICT ... DO UPDATE` (upsert latest values for the day).

### Step 2: pg_cron schedules (SQL insert, not migration)
Use the insert tool to create `cron.schedule` entries:
- `compute-quality-scores`: daily at 03:00 UTC
- `run-scheduled-jobs`: daily at 04:00 UTC (handles BYOC lifecycle + Monday rollups/bonuses)
- `process-notification-events`: every 2 minutes
- `cleanup-expired-offers`: daily at 05:00 UTC

Each calls `net.http_post` to the edge function URL with the anon key.

### Step 3: Expected next run on cron-health UI
Add a computed "Expected Next" column to the summary cards based on a simple schedule map (function name → cron expression → next occurrence). Shows "Overdue" badge if last run is older than expected interval.

### Step 4: 2H-E1 — Wire DecisionTraceCard to more admin pages
Embed the existing `DecisionTraceCard` component into service day detail, provider org detail, payout/hold detail, and exception detail pages.

### Step 5: 2H-E2 — Add 4 missing SOP playbooks
Create markdown content for: Growth Manager zone launch, BYOC close checklist, coverage exception approvals, payout/hold escalation. Add to `/admin/playbooks` page rendering.

### Step 6: 2H-E3 — Control Room gaps
Build admin UI tabs for Incentive caps, Algorithm params, and Policy guardrails — all reading/writing `admin_system_config` entries. Superuser-only edit.

### Step 7: 2H-E4 — Next payout card (computed)
Add a "Next payout" card to provider Payouts page. Compute the date from actual payout schedule rules (weekly Friday cadence from `provider_org_contracts`), showing "Estimated" label. No hardcoded dates.

### Step 8: 2H-E5 — Dispatcher keyboard shortcuts
Wire E (escalate) and N (note) shortcuts to `DispatcherActionsDialog`.

### Step 9: 2H-D4 — Admin read-only map (deferred from 2H-D)
Add read-only Mapbox map to admin service day detail and provider org detail pages showing provider route pins.

