# Sprint 3A Phase 6 Review — Level Analytics

**Reviewer:** Claude (automated spec reviewer)
**Date:** 2026-03-01
**Scope:** `useLevelAnalytics.ts`, `LevelAnalytics.tsx`, route/nav/cockpit wiring
**Spec:** Phase 6 — recommendation counts, courtesy upgrade counts, mismatch table by SKU x zone, outlier provider detection

---

## Verdict: 2 HIGH, 2 MEDIUM, 2 LOW findings

---

## P6-F1 (HIGH): `job_skus` query has no time-scope — inflates denominators

`useLevelAnalytics.ts:73-76`

```ts
supabase
  .from("job_skus")
  .select("job_id, sku_id, scheduled_level_id")
  .not("scheduled_level_id", "is", null),
```

This fetches **all** `job_skus` rows ever created, while `level_recommendations` and `courtesy_upgrades` are filtered to the last 30 days. The result: `totalJobsWithLevels` counts all-time jobs, making `recommendationRate` and `courtesyRate` artificially low, and mismatch percentages are diluted.

The `job_skus` table has no `created_at` column, but the parent `jobs` table has `scheduled_date` and `created_at`. The fix requires scoping `job_skus` to jobs from the last 30 days.

**Fix:** After fetching `job_skus`, fetch the corresponding `jobs` rows (already done at lines 110-124) and filter out any `job_skus` whose job's `scheduled_date` (or `created_at`) is older than 30 days. Alternatively, use a Supabase RPC or a join query. Simplest approach:

```ts
// After building jobZoneMap for jobSkuJobIds (line 124), filter:
const recentJobSkus = jobSkus.filter((js) => {
  const jobInfo = jobZoneMap.get(js.job_id);
  if (!jobInfo) return false;
  // jobZoneMap already only contains jobs we fetched —
  // but we need to also fetch created_at from the jobs query
  return true; // need created_at in the jobs select
});
```

Add `created_at` (or `scheduled_date`) to the jobs select at lines 96-99 and 114-117, then filter `jobSkus` to only those with `created_at >= thirtyDaysAgo`.

---

## P6-F2 (HIGH): Recommendation fan-out inflates per-SKU mismatch counts

`useLevelAnalytics.ts:172-181`

```ts
for (const rec of recs) {
  const jobInfo = jobZoneMap.get(rec.job_id);
  if (!jobInfo) continue;
  const skuIds = jobToSkus.get(rec.job_id) ?? [];
  for (const skuId of skuIds) {
    const key = makeKey(skuId, jobInfo.zone_id);
    const entry = mismatchAgg.get(key);
    if (entry) entry.recs++;
  }
}
```

A single `level_recommendation` is for one specific level mismatch, but this code credits it to **every** SKU on that job. If a job has 3 SKUs, one recommendation becomes 3 mismatch counts. This inflates `mismatchRows[].recommendation_count` and `mismatch_rate`.

The `level_recommendations` table has both `scheduled_level_id` and `recommended_level_id`. These reference `sku_levels`, which belong to a specific SKU. The recommendation should only count against the SKU whose level was mismatched.

**Fix:** Resolve the SKU from `recommended_level_id` (or `scheduled_level_id`) by joining through `sku_levels.sku_id`, rather than fanning out across all job SKUs. Or include `sku_id` in the `level_recommendations` select if a column exists (check schema).

If neither is practical short-term: at minimum, only count the recommendation against the first SKU (or the SKU with a matching `scheduled_level_id`).

---

## P6-F3 (MEDIUM): Mismatch row stores one arbitrary `provider_org_id` but aggregates across providers

`useLevelAnalytics.ts:155-162`

```ts
mismatchAgg.set(key, {
  sku_id: js.sku_id, zone_id: jobInfo.zone_id,
  provider_org_id: jobInfo.provider_org_id,  // <-- last-write-wins
  recs: 0, courtesies: 0, totalJobs: 0,
});
```

When multiple providers serve the same SKU in the same zone, the aggregation key is `sku_id|zone_id` (no provider dimension). But `provider_org_id` is stored from whichever job_sku initializes the entry first. The `MismatchRow` interface exports `provider_org_id` but the UI never displays it — so this is a data-model smell rather than a visible bug.

**Fix:** Either:
- Remove `provider_org_id` from `MismatchRow` (it's not displayed and is misleading), or
- Add a provider dimension to the aggregation key if per-provider mismatch is desired

---

## P6-F4 (MEDIUM): Duplicate "Recommendation Rate" tile

`LevelAnalytics.tsx:56-75`

Tile #2 ("Recommendations") already shows `recommendationRate` in its subtitle: `{data.recommendationRate}% of leveled jobs`. Tile #4 ("Recommendation Rate") shows the same `data.recommendationRate` as its primary value. This is redundant — both tiles derive from the same number.

**Fix:** Replace Tile #4 with a distinct metric. Good candidates:
- **Acceptance Rate** (already stubbed as `acceptanceCount: 0` in the hook)
- **Avg courtesy rate per provider** (median, not mean)
- **Top mismatch zone** (name + rate)

Or remove tile #4 entirely and use a 3-column grid.

---

## P6-F5 (LOW): `LevelMixRow` interface exported but never used

`useLevelAnalytics.ts:10-18`

```ts
export interface LevelMixRow {
  sku_id: string;
  sku_name: string;
  zone_id: string;
  zone_name: string;
  level_label: string;
  level_number: number;
  count: number;
}
```

This interface is defined and exported but never imported or used anywhere in the codebase. It appears to be a leftover from an earlier design that included a level-mix breakdown.

**Fix:** Remove the dead interface, or implement the level-mix breakdown if planned.

---

## P6-F6 (LOW): `MismatchKey` type alias declared but adds no value

`useLevelAnalytics.ts:142`

```ts
type MismatchKey = string;
```

This local type alias is just `string` — it provides no additional type safety. Not harmful, but adds noise.

**Fix:** Remove the alias and use `string` directly, or make it a branded type if stricter typing is desired.

---

## Wiring Verification (PASS)

| Component | Location | Status |
|-----------|----------|--------|
| Route | `App.tsx:257` — `/admin/ops/levels` → `AdminLevelAnalytics` | Correct |
| Nav link | `AdminShell.tsx:83` — "Level Analytics" in Catalog section | Correct |
| Cockpit tile | `OpsCockpit.tsx:256-262` — DrillTile in Quality column | Correct |
| Icon | `SlidersHorizontal` used consistently across all three | Correct |

---

## Summary

| ID | Severity | Component | Issue |
|----|----------|-----------|-------|
| P6-F1 | HIGH | useLevelAnalytics | `job_skus` not time-scoped → inflated denominators |
| P6-F2 | HIGH | useLevelAnalytics | Recommendation fans out to all SKUs on job |
| P6-F3 | MEDIUM | useLevelAnalytics | `provider_org_id` in mismatch row is arbitrary |
| P6-F4 | MEDIUM | LevelAnalytics | Duplicate recommendation rate tile |
| P6-F5 | LOW | useLevelAnalytics | Dead `LevelMixRow` interface |
| P6-F6 | LOW | useLevelAnalytics | No-op `MismatchKey` type alias |

**Recommendation:** Fix P6-F1 and P6-F2 before considering Sprint 3A complete — both produce incorrect aggregate numbers that would mislead ops decisions. P6-F3 and P6-F4 are cleanup items that can ship as-is but should be addressed soon.
