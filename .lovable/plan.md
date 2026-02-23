

# Module 14: Close the Final 15% (6 Items)

## 1. Rollup Snapshot Populator (Edge Function + Cron)

The 4 rollup tables exist but are never populated. Create a new edge function `snapshot-rollup` that computes daily snapshots and upserts them.

**Edge function `supabase/functions/snapshot-rollup/index.ts`:**
- Runs the same aggregation logic currently in `useOpsMetrics` but server-side using the Supabase service role key
- Upserts into `ops_kpi_snapshots_daily` (one row per metric_key per day)
- Upserts into `zone_health_snapshots` (one row per zone per day)
- Upserts into `provider_health_snapshots` (one row per provider_org per day)
- Updates `ops_kpi_snapshots_realtime` with latest values
- Returns a summary JSON of rows written

**Cron schedule (SQL insert via Run SQL, not migration):**
- Schedule `snapshot-rollup` to run once daily at 02:00 UTC via `pg_cron` + `pg_net`

**Hook updates:**
- `useOpsMetrics`: Add a secondary query that reads from `ops_kpi_snapshots_daily` for trend sparklines (last 7 days), still uses live queries for current values
- `useZoneHealth`: Read from `zone_health_snapshots` for the zone list's trend column

---

## 2. Refund/Chargeback Tiles in OpsBilling

Add two missing stat tiles and a "Refunds" tab to `OpsBilling.tsx`.

**New queries in OpsBilling's `queryFn`:**
- Count of `billing_exceptions` with `exception_type = 'CHARGEBACK'` (7d)
- Sum of refund amounts from `admin_adjustments` where `adjustment_type = 'refund'` (7d)

**UI additions:**
- Two new `StatCard` tiles: "Refunds (7d)" and "Chargebacks (7d)"
- A new "Refunds" tab listing `admin_adjustments` of type refund with amount, customer, date

---

## 3. Category/SKU Filter for OpsJobs

Add the 6th missing filter to `OpsJobs.tsx`.

**Changes:**
- Fetch `service_skus` (id, name, category) for a dropdown
- Add a `Select` for "All Categories" with distinct category values
- When a category is selected, fetch `job_skus` rows where `sku_id` matches SKUs of that category, then filter `jobs` client-side by matching job IDs (since `useAdminJobs` doesn't support a join filter)
- Alternative (cleaner): Add `category` filter support directly in `useAdminJobs` by joining `job_skus` -> `service_skus` server-side. This requires a nested select: `.select('*, property:properties(...), job_skus(id, sku_name_snapshot, sku_id, service_skus:sku_id(category))')` -- but this may hit the deep type issue. Use `as any` cast if needed.

**Decision:** Client-side filter is simpler and avoids deep type issues. Fetch SKU categories once, filter job list by checking `job.job_skus` against selected category's SKU IDs.

---

## 4. Scope Unscoped Queries in useOpsMetrics

Two queries fetch entire tables without date filters, which will degrade at scale.

**Fix in `useOpsMetrics.ts`:**
- `job_checklist_items`: Filter by joining to the already-fetched `completedJobs7d` IDs. Since we can't do a server-side join here, use `.in("job_id", completedJobIds)` -- but this requires splitting the `Promise.all` into two phases:
  - **Phase 1**: Fetch `completedJobs7d` (already done)
  - **Phase 2**: Fetch `job_checklist_items` and `job_photos` scoped to those IDs

- `job_photos`: Same treatment -- `.in("job_id", completedJobIds)`

This means restructuring from a single `Promise.all` to a two-phase pattern:
```text
Phase 1: 17 parallel queries (everything except checklist + photos)
Phase 2: 2 parallel queries scoped to completed job IDs from Phase 1
```

---

## 5. Server-Side Pagination for useAdminJobs

Currently `.limit(100)` with client-side pagination. At scale this misses jobs beyond the 100th.

**Changes to `useAdminJobs.ts`:**
- Accept `page` and `pageSize` parameters in `AdminJobFilters`
- Add `.range(offset, offset + pageSize - 1)` to the query
- Use `{ count: "exact" }` in `.select()` to get total count
- Return `{ jobs, totalCount, loading }` instead of just the array

**Changes to `OpsJobs.tsx`:**
- Pass `page` and `PAGE_SIZE` into `useAdminJobs`
- Use returned `totalCount` for pagination controls
- Remove client-side slicing

---

## 6. Dispatcher/Ops RLS Differentiation

Currently no `dispatcher` or `ops` role exists in the system (confirmed by search). This is a future concern -- the review flagged it as P3.

**Approach:** Create a lightweight foundation without adding a new role enum value (which would be a larger change).

- Add a new column `admin_scope` to the existing `user_roles` table (or a separate `admin_permissions` table) -- but this is heavy for a P3 item.
- **Recommended minimal approach:** Add a doc note in `docs/modules/14-reporting-and-analytics.md` describing the dispatcher RLS pattern for future implementation. No code change -- this avoids scope creep on a P3 item with no current users.
- Mark as "deferred to v2" explicitly.

---

## File Summary

| File | Action |
|------|--------|
| `supabase/functions/snapshot-rollup/index.ts` | New edge function for daily rollup |
| `src/hooks/useOpsMetrics.ts` | Two-phase queries + trend reads from rollup |
| `src/hooks/useZoneHealth.ts` | Read trends from `zone_health_snapshots` |
| `src/hooks/useAdminJobs.ts` | Add server-side pagination (page, pageSize, count) |
| `src/pages/admin/OpsJobs.tsx` | Add category/SKU filter + use server pagination |
| `src/pages/admin/OpsBilling.tsx` | Add refund/chargeback tiles + tab |
| `docs/modules/14-reporting-and-analytics.md` | Add dispatcher RLS note (deferred v2) |

### Dependencies

- Items 4 and 5 are independent and can be done in parallel
- Item 1 (rollup function) is independent but the hook changes depend on the function being deployed first
- Item 3 depends on SKU data already in the DB (it does exist)
- Item 6 is documentation only
