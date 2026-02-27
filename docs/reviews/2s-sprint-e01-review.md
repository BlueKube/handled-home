# Sprint E-01 Review — Provider Day Command Center

**Status**: PASS with 3 findings (1 MEDIUM, 2 LOW)

## Scope delivered

| Task ID | Description | Verdict |
|---------|-------------|---------|
| 2E-E01-01 | `provider_route_plans` table + `lock_provider_route` RPC | PASS |
| 2E-E01-02 | `useProviderRoutePlan` hook (plan fetch + live stats fallback) | PASS |
| 2E-E01-03 | Dashboard enhancements (banner, stats, lock button) | PASS |
| 2E-E01-04 | Jobs page lock behavior (hide optimize/reorder, "Locked" badge) | PASS |

## Findings

### E01-F1 (MEDIUM) — Projected earnings double-counts completed jobs

**File:** `supabase/migrations/20260227083106_…_25556364.sql`, lines 48-56

**Problem:** The RPC first queries `provider_earnings` for today's jobs (lines 48-50). If that returns 0, it falls back to `AVG(pe.total_cents) * stops` from the last 30 days (lines 52-55). However, if some jobs are already completed with earnings recorded while others are still pending, the first query returns only the *completed* job earnings — it does not project the pending jobs. The result is an undercount when the day is partially complete.

Additionally, the fallback multiplies the historical average *per-job* earning by `v_total_stops`, but `v_total_stops` only counts jobs `NOT IN ('COMPLETED', 'CANCELED')` (line 43). So if 2 of 5 jobs are done, the first query returns those 2 jobs' earnings, and the fallback never fires because `v_projected_earnings_cents > 0`. The provider sees only the 2 completed jobs' earnings as the "projection" — not the full day.

**Fix:** Sum actual completed earnings + (historical avg × remaining stops):
```sql
-- Actual earnings from today's completed jobs
SELECT COALESCE(SUM(pe.total_cents), 0) INTO v_actual_earnings
FROM provider_earnings pe JOIN jobs j ON pe.job_id = j.id
WHERE j.provider_org_id = p_provider_org_id AND j.scheduled_date = p_date;

-- Count remaining (non-completed, non-canceled) stops
SELECT COUNT(*) INTO v_remaining_stops FROM jobs
WHERE provider_org_id = p_provider_org_id AND scheduled_date = p_date
  AND status NOT IN ('COMPLETED', 'CANCELED');

-- Project remaining at historical average
IF v_remaining_stops > 0 THEN
  SELECT COALESCE(AVG(pe.total_cents), 4500) INTO v_avg_per_job
  FROM provider_earnings pe JOIN jobs j ON pe.job_id = j.id
  WHERE j.provider_org_id = p_provider_org_id
    AND j.scheduled_date >= (p_date - INTERVAL '30 days');
  v_projected_earnings_cents := v_actual_earnings + (v_avg_per_job * v_remaining_stops)::int;
ELSE
  v_projected_earnings_cents := v_actual_earnings;
END IF;
```

### E01-F2 (LOW) — `total_stops` excludes COMPLETED jobs, misrepresenting the day

**File:** `supabase/migrations/20260227083106_…_25556364.sql`, line 43

**Problem:** The stops count uses `status NOT IN ('COMPLETED', 'CANCELED')`, meaning once a provider finishes jobs throughout the day, `total_stops` shrinks. If they lock the route at 7 AM (0 completed), they see "5 stops." But if they lock at noon after finishing 3, it shows "2 stops." The locked plan should represent the *full* day, not a snapshot of remaining work.

**Fix:** Count all jobs for the date except CANCELED:
```sql
WHERE j.provider_org_id = p_provider_org_id
  AND j.scheduled_date = p_date
  AND j.status != 'CANCELED'
```

This also fixes the drive time and work time estimates — they should reflect the full day plan, not just remaining jobs.

### E01-F3 (LOW) — No unlock/re-lock capability for schedule changes

**File:** `supabase/migrations/20260227083106_…_25556364.sql`, line 38

**Problem:** The RPC raises an exception if the route is already locked (`Route already locked for this date`). This is correct behavior for preventing accidental double-locks, but the PRD notes "locks route order unless exceptions" and the system must handle "schedule changes, reassigned jobs." If admin reassigns or adds a job mid-day, the provider can't re-lock to update their plan stats.

**Fix:** Not urgent for E-01 since this is an edge case. For a future sprint, add an `unlock_provider_route` RPC (admin-only or with reason) that clears `locked_at`, allowing the provider to re-lock with updated stats. Log the unlock event to `admin_audit_log`.

## What passed well

- **Table design is clean.** `provider_route_plans` is correctly metadata-only — it does not store `ordered_job_ids`, avoiding a dual-source-of-truth problem with `jobs.route_order`. The unique constraint on `(provider_org_id, plan_date)` prevents duplicates. The UPSERT pattern in the RPC is correct.
- **RLS is properly configured.** SELECT policy checks `provider_members` for org membership (not a `role` column on profiles). Admin policy uses `user_roles` table. Both are correct patterns consistent with the rest of the codebase.
- **Auth check is correct.** The RPC validates `auth.uid()` membership in the provider org before allowing lock. Re-lock prevention works via `locked_at IS NOT NULL` check.
- **Hook design is sound.** Dual-mode approach (live stats when unlocked, cached plan stats when locked) avoids showing stale data before locking. The `projectedEarningsCents` correctly returns 0 when unlocked — the Dashboard only shows projected earnings in the locked banner, so there's no UX gap.
- **Dashboard UI follows PRD.** "Start Route" banner with Lock icon, projected earnings display after lock, separate "Est. Work" and "Est. Drive" stat cards, and the greeting + job count summary all match the PRD §3.1 requirements.
- **Jobs page lock integration is correct.** Optimize Route button and reorder arrows are conditionally hidden when `isLocked` is true. The "Locked" badge is shown inline with the stop count. The `showReorder` prop on `JobCard` cleanly gates the reorder UI.
- **Tasks.md restructured correctly.** The old 2E section (13 flat tasks) has been replaced with the new 5-sprint structure (E-01 through E-05) matching the PRD scope, with E-01 items marked complete.
- **Drive time estimation** at `(stops - 1) * 8 minutes` is a reasonable rough heuristic for v1 without requiring a routing API call. Both the RPC and the client-side `liveStats` use the same formula, so locked vs unlocked stats are consistent.

## Recommendation cross-check (from plan review)

| Recommendation | Status |
|---|---|
| E01-R1: Use metadata-only table, no `ordered_job_ids` | Implemented correctly |
| E01-R2: Use haversine-based drive estimate, not routing API | Used simpler `(stops-1)*8` heuristic — acceptable for v1 |
| E01-R3: Projected earnings from historical avg per-stop | Implemented, but has the partial-day issue (E01-F1) |
| E01-R4: Ensure `useProviderRoutePlan` falls back to live stats | Implemented correctly with dual-mode approach |
