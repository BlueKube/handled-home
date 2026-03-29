# Sprint 2H-C Review — BYOC Automation + Weekly Rollups

**Status:** CONDITIONAL PASS — 4 HIGH findings, 1 MEDIUM, 2 LOW. Lifecycle RPC structure is sound. Edge function orchestration is clean. Weekly rollups query has critical JOIN and schema bugs.

**Scope reviewed:**
- Migration `20260228050446`: `run_byoc_lifecycle_transitions()` + `compute_provider_weekly_rollups()` RPCs
- Edge function `run-scheduled-jobs/index.ts`
- Hook fix `useByocAttributions.ts`
- Config `supabase/config.toml`

---

## Findings

### C-F1 HIGH — `redo_requested` is not a valid `job_issues.issue_type`

**File:** Migration line 148
**Code:** `COUNT(DISTINCT ji.job_id) FILTER (WHERE ji.issue_type = 'redo_requested')`

The `job_issues.issue_type` CHECK constraint only allows:
`COULD_NOT_ACCESS`, `SAFETY_CONCERN`, `MISSING_SUPPLIES`, `EXCESSIVE_SCOPE`, `CUSTOMER_REQUESTED_CHANGE`, `WEATHER_RELATED`, `OTHER`

`'redo_requested'` is not in this list. The `redo_jobs` metric will **always be 0**, and `redo_rate` will always be 0%.

**Fix:** Either add `'redo_requested'` to the `job_issues.issue_type` CHECK constraint, or map redo tracking to an existing mechanism (e.g., a new table or a specific issue_type).

---

### C-F2 HIGH — JOIN fan-out inflates all aggregates in weekly rollups

**File:** Migration lines 138-161
**Code:**
```sql
FROM jobs j
LEFT JOIN job_issues ji ON ji.job_id = j.id
LEFT JOIN visit_ratings_private vr ON vr.job_id = j.id
...
GROUP BY j.provider_org_id
```

Two LEFT JOINs create a **cross product**. A job with 2 issues and 3 ratings produces 2×3 = 6 rows. This inflates:
- `total_jobs` (`COUNT(*)`) — counts duplicated rows, not distinct jobs
- `completed_jobs`, `ontime_jobs`, `late_jobs` — same problem
- `avg_rating` — duplicated by issue fan-out
- `avg_duration_minutes` — duplicated by both fan-outs

**Fix:** Use CTEs or subqueries to pre-aggregate issues and ratings separately:
```sql
WITH job_base AS (
  SELECT j.* FROM jobs j
  WHERE j.scheduled_date >= v_week_start::text AND j.scheduled_date <= v_week_end::text
),
issue_agg AS (
  SELECT ji.job_id, COUNT(*) FILTER (WHERE ji.issue_type = '...') AS redo_count
  FROM job_issues ji JOIN job_base jb ON ji.job_id = jb.id
  GROUP BY ji.job_id
),
rating_agg AS (
  SELECT vr.job_id, AVG(vr.rating) AS avg_rating, COUNT(*) AS rating_count
  FROM visit_ratings_private vr JOIN job_base jb ON vr.job_id = jb.id
  GROUP BY vr.job_id
)
SELECT j.provider_org_id, COUNT(*) AS total_jobs, ...
FROM job_base j
LEFT JOIN issue_agg ia ON ia.job_id = j.id
LEFT JOIN rating_agg ra ON ra.job_id = j.id
GROUP BY j.provider_org_id
```

---

### C-F3 HIGH — `updated_at` column doesn't exist on `provider_feedback_rollups`

**File:** Migration line 198
**Code:** `ON CONFLICT ... SET ... updated_at = now()`

The `provider_feedback_rollups` table definition (migration `20260227060303`) has these columns:
`id, provider_org_id, period_start, period_end, review_count, avg_rating, theme_counts, summary_positive, summary_improve, published_at, visibility_status, created_at`

There is **no `updated_at` column**. No subsequent migration adds one. This will cause a **runtime error** on any upsert conflict (re-running rollups for the same week).

**Fix:** Either:
1. Add `updated_at timestamptz DEFAULT now()` to the table, OR
2. Remove `updated_at = now()` from the ON CONFLICT clause

---

### C-F4 HIGH — Bonus query status filter is wrong (regression)

**File:** `src/hooks/useByocAttributions.ts:62`
**Code:** `.eq("status", "earned")` (lowercase)

The `byoc_bonus_ledger.status` CHECK constraint enforces uppercase: `CHECK (status IN ('EARNED', 'PAID', 'VOIDED'))`. The `compute_byoc_bonuses` RPC inserts with `'EARNED'` (uppercase, confirmed at migration line 80).

This is a **regression** — the original `"EARNED"` was correct. The "fix" to lowercase breaks the query, making `totalEarnedCents` **always 0**.

**Fix:** Revert to `.eq("status", "EARNED")`

---

### C-F5 MEDIUM — `installed_at` lifecycle step is missing

**File:** Migration lines 3-8 (header) vs lines 28-64 (body)

The function header describes 4 lifecycle steps:
1. Advance `installed_at` for customers who have signed up
2. Advance `subscribed_at` for customers with active subscriptions
3. Activate bonus window on first completed visit
4. Expire ACTIVE→ENDED

**Step 1 is not implemented.** The `v_installed_count` variable is declared (line 21) but never assigned. The function only implements steps 2-4.

**Fix:** Either implement the `installed_at` advancement logic, or remove the dead variable and update the comment.

---

### C-F6 LOW — `v_activated_count` inflated by failed activations

**File:** Migration lines 54-55
**Code:**
```sql
PERFORM public.activate_byoc_attribution(v_rec.customer_id);
v_activated_count := v_activated_count + 1;
```

The loop selects attributions with `status IN ('PENDING', 'ACTIVE')`, but `activate_byoc_attribution` only activates `PENDING` ones. For ACTIVE attributions, the function returns `{activated: false}` — but `PERFORM` discards the return value, so the counter increments regardless.

**Fix:** Either filter the loop to `ba.status = 'PENDING'` only, or capture the return value and check `activated = true`.

---

### C-F7 LOW — No authorization guard on new RPCs

**File:** Both `run_byoc_lifecycle_transitions` and `compute_provider_weekly_rollups`

Unlike `compute_provider_quality_scores` (which checks `admin_memberships` or `auth.uid() IS NULL`), these SECURITY DEFINER functions have **no authorization check**. Any authenticated user could call them directly via the PostgREST API.

**Fix:** Add the same guard pattern:
```sql
IF NOT (
  EXISTS (SELECT 1 FROM admin_memberships WHERE user_id = auth.uid() AND is_active = true)
  OR auth.uid() IS NULL -- service role
) THEN
  RAISE EXCEPTION 'Unauthorized';
END IF;
```

---

## What passed well

- **Lifecycle state machine** is logically correct (subscribe → activate → expire) with clean separation of concerns
- **Cron logging pattern** is consistent: `start_cron_run` → work → `finish_cron_run` with exception handler
- **Edge function orchestrator** cleanly separates daily vs weekly jobs with targeted invocation support
- **Monday calculation** in the edge function is correct for all days of the week
- **Idempotent upserts** — both RPCs handle re-runs gracefully (once C-F3 is fixed)
- **207 Multi-Status** response when partial failures occur is a good pattern
- **Config registration** in `config.toml` is consistent with existing functions

---

## Open findings tracker (cumulative)

### HIGH — 4 open
| ID | Status | Description |
|----|--------|-------------|
| C-F1 | **OPEN** | `redo_requested` not a valid `job_issues.issue_type` — redo metric always 0 |
| C-F2 | **OPEN** | JOIN fan-out inflates all aggregates in `compute_provider_weekly_rollups` |
| C-F3 | **OPEN** | `updated_at` column missing from `provider_feedback_rollups` — upsert will error |
| C-F4 | **OPEN** | Bonus query uses `"earned"` (lowercase) but DB stores `"EARNED"` — always returns 0 |

### MEDIUM — 4 open
| ID | Status | Description |
|----|--------|-------------|
| C-F5 | OPEN | `installed_at` lifecycle step missing from implementation |
| B-F3 (Round 2G) | OPEN | Search filter injection in `.or()` |
| B-F4 (Round 2G) | OPEN | Non-standard event types in job_events |
| A-F1 | OPEN | `cron_run_log` INSERT/UPDATE RLS overly permissive |

### LOW — 24 open
(Prior 22 + C-F6, C-F7)
