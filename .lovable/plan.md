

# Sprint 6 Hardening — ChatGPT's Three Guardrails

Sprint 6 (route optimization) is already implemented and working. ChatGPT suggested three smart guardrails to prevent operational issues as the system scales. Here is the assessment and plan.

---

## Assessment of the Three Suggestions

| Guardrail | Verdict | Rationale |
|-----------|---------|-----------|
| **1. Freeze once started** — lock route when provider starts a job | **Add now** | Prevents "route whiplash" where optimization runs mid-day and reorders stops the provider already passed. Simple to implement: skip optimization/reorder for jobs with status IN_PROGRESS. |
| **2. Only optimize when it matters** — skip if < 5 jobs or all have route_order already set | **Add now** | Prevents wasted computation and unpredictable behavior on short routes. Easy guard in edge function. |
| **3. Manual reorder logs old→new order + reason** | **Partially done** | The RPC already logs to `job_events` with `new_route_order`. Adding `old_route_order` to the metadata is a one-line change. A "reason" quick-pick is UI polish — defer to a future sprint. |

**Not adding**: Haversine removal — it's already there and works as a fallback when lat/lng exist. No cost to keep it.

---

## Changes

### 1. Edge Function: `optimize-routes` — Add two guards

**Guard A**: Skip if job count < 3 (not 5 — three stops is the minimum where order matters in a lawn care route). Return early with `{ status: "ok", optimized: 0, message: "Too few jobs to optimize" }`.

**Guard B**: Skip jobs that are `IN_PROGRESS` — they are already being worked on. Only reorder `NOT_STARTED` jobs. If a provider has started their first job, the remaining `NOT_STARTED` jobs still get optimized, but the in-progress one stays pinned.

Current code on line 138 filters out `COMPLETED` and `CANCELED`. Change to also exclude `IN_PROGRESS` from the optimization set but keep their existing `route_order` intact.

### 2. RPC: `reorder_provider_route` — Add old_route_order to audit log

Currently the audit log writes `new_route_order` only. Add a subquery to capture the current `route_order` before updating, and include `old_route_order` in the `job_events` metadata. This is a surgical one-line addition to the existing INSERT.

Also: add a guard to prevent reordering jobs that are `IN_PROGRESS` — if a provider has started a stop, it should stay pinned at its current position.

### 3. Provider UI: Disable reorder on in-progress jobs

In `Jobs.tsx`, disable the up/down arrows on jobs with status `IN_PROGRESS`. They are already visually marked with a "Resume" label. This prevents the UI from allowing moves that the RPC would reject anyway.

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/optimize-routes/index.ts` | Add minimum-jobs guard (< 3 = skip), exclude IN_PROGRESS from optimization set |
| New migration | Patch `reorder_provider_route` to log `old_route_order` and skip IN_PROGRESS jobs |
| `src/pages/provider/Jobs.tsx` | Disable reorder arrows on IN_PROGRESS jobs |

---

## What is NOT changing

- No new tables or columns
- No Haversine removal (it works fine as-is)
- No "reason" quick-pick on reorder (future polish)
- No "Start Route" button concept (the existing job status flow already handles this — when a provider starts their first job, it goes to IN_PROGRESS which triggers the freeze)

