# Sprint 2H-E Review — Admin Completeness Polish + E-F Remediation

**Reviewer:** Claude (automated spec reviewer)
**Date:** 2026-02-28
**Scope:** 20 files changed — migration, edge function, 8 admin pages, 2 new components, routes, provider Payouts

---

## Overall Verdict: CONDITIONAL PASS — 1 CRITICAL, 1 HIGH, 2 MEDIUM, 2 LOW

The sprint covers a lot of ground and the UI work is high quality (Playbooks, ControlConfig, CronHealth enhancements, DecisionTraceCard wiring, keyboard shortcuts). However, the core migration has a **breaking column mismatch** that will prevent `compute_provider_quality_scores` from running.

---

## Critical Finding — Migration Will Fail

| ID | Severity | Finding |
|----|----------|---------|
| **E2-F1** | **CRITICAL** | **Column mismatch in `compute_provider_quality_scores` upsert.** The migration `20260228053753` INSERTs into columns `rating_score`, `issue_score`, `photo_score`, `ontime_score`, `performance_band` — but the `provider_quality_score_snapshots` table (created in `20260227060303`) only has columns: `id`, `provider_org_id`, `score_window_days`, `score`, `band`, `components`, `computed_at`. The columns referenced in the new migration **do not exist**. The previous working RPC (migration `20260228045136`) correctly used `band` (not `performance_band`) and stored sub-scores inside the `components` jsonb column. This migration will throw `ERROR: column "rating_score" of relation "provider_quality_score_snapshots" does not exist` at runtime. |

**The fix:** Either (a) add ALTER TABLE statements to create the missing columns before the CREATE OR REPLACE, or (b) revert to using `band` + `components` jsonb like the previous working version did. Option (b) is simpler and preserves the existing schema.

The unique index itself (`idx_quality_snapshots_org_day`) is correct. The `to_date_immutable(computed_at) < CURRENT_DATE` fix for previous-score lookup (E-F1 from plan review) is also correct. It's only the INSERT/UPDATE column references that are broken.

---

## Step-by-Step Verification

### Step 1: Quality snapshot idempotency — FAIL (E2-F1)

- Unique index: CORRECT — `CREATE UNIQUE INDEX idx_quality_snapshots_org_day ON provider_quality_score_snapshots (provider_org_id, to_date_immutable(computed_at))`
- `to_date_immutable()` helper: CORRECT — immutable function for index
- Previous-score lookup fix (E-F1): CORRECT — `WHERE to_date_immutable(computed_at) < CURRENT_DATE`
- Column references: **BROKEN** — see E2-F1 above

### Step 2: pg_cron schedules — NOT DONE

No `cron.schedule()` SQL was created in any migration. The plan said "Use the insert tool to create `cron.schedule` entries" but this was not executed. The cron-health UI has a `SCHEDULE_MAP` showing expected schedules, but the actual database schedules don't exist.

| ID | Severity | Finding |
|----|----------|---------|
| **E2-F2** | **HIGH** | **pg_cron schedules not created.** Step 2 of the plan was skipped entirely. Without these schedules, the edge functions will never be called automatically. The cron-health UI shows expected schedules but they're just hardcoded labels, not connected to actual pg_cron entries. This needs a migration with `SELECT cron.schedule(...)` calls. |

### Step 3: Expected next run on cron-health UI — PASS

`CronHealth.tsx` now has:
- `SCHEDULE_MAP` with cron expressions + `intervalMinutes` for all known functions
- `getExpectedNextAndOverdue()` function computing next expected run from last run time
- "Overdue" badge with 5-minute grace period
- Schedule label shown on each summary card

Clean implementation. Works with or without actual pg_cron schedules.

### Step 4: Wire DecisionTraceCard — PASS

Confirmed wired to 5 locations (up from 1):
- `JobDetail.tsx` — `entityType="job"` (existed)
- `ProviderDetail.tsx:290` — `entityType="provider_org"`
- `Exceptions.tsx:38` — `entityType="billing_exception"`
- `Payouts.tsx:51` — `entityType="provider_payout"`
- `ServiceDayZoneDetail.tsx:134` — `entityType="zone"`

This resolves finding C-F5 from sprint 2G-C.

### Step 5: SOP Playbooks — PASS

`Playbooks.tsx` is well-built:
- 10 playbooks covering: EOD reconciliation, missing proof, no-show escalation, provider probation, zone pause, emergency pricing, growth zone launch, BYOC close checklist, coverage exception approvals, payout/hold escalation
- Role-based filtering (dispatcher, ops, superuser)
- Expandable step-by-step cards with sub-steps and route links
- Spec asked for 4 playbooks, Lovable delivered 10 — exceeds requirements
- Route registered at `/admin/playbooks`

### Step 6: Control Room — PASS with note

`ControlConfig.tsx` provides:
- 3 tabs: Incentive Caps, Algorithm Params, Policy Guardrails
- Each config key gets inline editor (Input for scalars, Textarea for JSON)
- Superuser-only edit, read-only for other admins
- "Other" tab catches uncategorized config keys
- Route at `/admin/control/config`

| ID | Severity | Finding |
|----|----------|---------|
| **E2-F3** | **MEDIUM** | **Config keys from ControlConfig `CATEGORY_MAP` may not all be seeded.** The UI references 15 config keys across 3 categories (e.g., `byoc_bonus_weekly_cap_cents`, `daily_capacity_cap`, `emergency_override_ttl_hours`). The UI handles empty gracefully ("No config entries found for this category"), but most keys were not seeded in any migration. Only `quality_score_weights`, `quality_band_thresholds`, and a few others exist from Sprint 2H-B. The UI works but will appear mostly empty until ops manually seeds values. |

### Step 7: Next payout card — PASS

`ProviderPayouts.tsx` now shows:
- "Next payout: Friday, Mar 6" card with `Calendar` icon
- "Estimated · Weekly Friday cadence" subtitle — **E-F6 properly addressed**
- Only shown when `isAccountReady && eligibleBalance > 0`
- Uses `date-fns/nextFriday` for computation
- Queries `provider_org_contracts` but doesn't actually use the result (query exists but `nextPayoutDate` is computed independently) — harmless but slightly wasteful

| ID | Severity | Finding |
|----|----------|---------|
| **E2-F4** | **LOW** | `contractQuery` fetches `provider_org_contracts` but its result is never used. The `nextPayoutDate` is computed purely from `new Date()` + `nextFriday()`. The query should either be removed or used to derive the payout cadence. Minor overhead, no functional impact. |

### Step 8: Dispatcher keyboard shortcuts — PASS

`DispatcherQueues.tsx` keyboard handler now includes:
- `e` → `setDefaultAction("create_ticket")` + open dialog
- `n` → `setDefaultAction("note")` + open dialog
- `a` → `setDefaultAction(undefined)` + open dialog (no preset)
- Dialog close resets both `actionJobId` and `defaultAction`

`DispatcherActionsDialog.tsx`:
- `defaultAction?: ActionType` prop added
- `useEffect` resets `action` + `note` when `jobId` or `defaultAction` changes
- Input focus guard prevents shortcuts firing in text fields (confirmed at lines 200-205)

Clean implementation, resolves E-F7.

### Step 9: Admin read-only map — PASS

`AdminReadOnlyMap.tsx`:
- Reusable component accepting `stops: MapStop[]` + optional `title`
- Status-colored pins, non-interactive map (`interactive={false}`)
- Token fallback, empty-stops fallback
- Integrated in `ProviderDetail.tsx` (today's route for that provider)
- Integrated in `OpsZoneDetail.tsx` (today's jobs in that zone)

| ID | Severity | Finding |
|----|----------|---------|
| **E2-F5** | **LOW** | `AdminReadOnlyMap` pin numbers use `mappableJobs` index (`i + 1`) rather than original route order. Same as D-F1 from the Sprint 2H-D review. However, since this is admin read-only and stops don't have unmappable gaps in practice, the impact is lower. |

### E-F Remediation Verification

| ID | Plan Review Finding | Status | Notes |
|----|-------------------|--------|-------|
| E-F1 | Upsert previous-score lookup | FIXED | `WHERE to_date_immutable(computed_at) < CURRENT_DATE` — correct |
| E-F2 | pg_cron extension check | VERIFIED | Extensions confirmed enabled |
| E-F3 | run-scheduled-jobs cron logging | FIXED | Orchestrator + per-sub-job logging with structured keys |
| E-F4 | ProviderOrgDetail may not exist | N/A | Used `ProviderDetail.tsx` (which is the detail page) |
| E-F5 | Config keys need seeding | PARTIAL | UI handles empty gracefully but keys aren't seeded |
| E-F6 | Payout card "Estimated" label | FIXED | "Estimated · Weekly Friday cadence" |
| E-F7 | DispatcherActionsDialog defaultAction | FIXED | Prop added, shortcuts wired |

---

## MEDIUM Finding

| ID | Severity | Finding |
|----|----------|---------|
| **E2-F6** | **MEDIUM** | **`run-scheduled-jobs` uses direct cron_run_log inserts, not `start_cron_run`/`finish_cron_run` RPCs.** The edge function writes directly to the `cron_run_log` table via Supabase client. This works because it uses the service role key, but it bypasses the RLS/RPC pattern established in Sprint 2H-A. The `start_cron_run()` and `finish_cron_run()` RPCs exist and should be used instead for consistency. Functional but inconsistent. |

---

## Findings Summary

| ID | Severity | Step | Issue | Action |
|----|----------|------|-------|--------|
| **E2-F1** | **CRITICAL** | 1 | Migration uses non-existent columns (`rating_score`, `performance_band`, etc.) in snapshot upsert | Must fix before merge — revert to `band` + `components` jsonb |
| **E2-F2** | **HIGH** | 2 | pg_cron schedules never created — edge functions won't auto-run | Add migration with `cron.schedule()` calls |
| **E2-F3** | MEDIUM | 6 | Most Control Room config keys not seeded in DB | Seed defaults in migration |
| **E2-F6** | MEDIUM | E-F3 fix | run-scheduled-jobs uses direct inserts instead of start/finish RPCs | Minor consistency issue |
| **E2-F4** | LOW | 7 | Unused `contractQuery` in Payouts.tsx | Remove dead query |
| **E2-F5** | LOW | 9 | Admin map pin numbers use filtered index | Same as D-F1, lower impact |

---

## Instructions for Lovable

> **E2-F1 (CRITICAL) must be fixed immediately.** The `compute_provider_quality_scores` RPC in migration `20260228053753` references columns that don't exist on `provider_quality_score_snapshots`:
>
> - `rating_score`, `issue_score`, `photo_score`, `ontime_score` → these sub-scores should go in the `components` jsonb column
> - `performance_band` → the column is called `band`
>
> Create a new migration that either:
> (a) Adds the missing columns with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, OR
> (b) Rewrites the INSERT to use `band` + `components` like the previous working version did in migration `20260228045136`
>
> Option (b) is recommended — it preserves the existing schema and doesn't add denormalized columns.
>
> **E2-F2 (HIGH):** Create a migration with `SELECT cron.schedule(...)` calls for all 4 edge functions. Without this, nothing runs automatically.
>
> **E2-F3 (MEDIUM):** Seed default values for the 15 config keys referenced in `ControlConfig.tsx`'s `CATEGORY_MAP`.

---

## Open Findings Tracker

| ID | Status | Description |
|----|--------|-------------|
| D-F1 | OPEN | Provider map pin numbers use filtered index instead of route order |
| E2-F1 | **OPEN** | CRITICAL: Migration column mismatch in quality score upsert |
| E2-F2 | **OPEN** | HIGH: pg_cron schedules not created |
| E2-F3 | OPEN | Control Room config keys not seeded |
| E2-F4 | OPEN | Unused contractQuery in Payouts.tsx |
| E2-F5 | OPEN | Admin map pin numbers use filtered index |
| E2-F6 | OPEN | run-scheduled-jobs uses direct inserts instead of RPCs |
