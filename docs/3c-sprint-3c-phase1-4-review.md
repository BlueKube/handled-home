# Sprint 3C Phase 1–4 Review: Growth Surfaces

**Reviewer:** Claude
**Date:** 2026-03-01
**Scope:** Suggestion engine schema/RPC, frontend hooks, SuggestionCard, AddServiceDrawer, FAB, Home tab restructure
**Commit range:** `e738b44..f877378` (on main)

---

## Summary

Sprint 3C delivers the growth engine: a scoring RPC that recommends services based on coverage gaps, seasonality, and home sizing — surfaced through a restructured Home tab and a bottom-sheet Add Service Drawer. The architecture is sound: SECURITY DEFINER RPC with ownership check, impression throttling, suppression filtering, and a clean hook→component chain. Six new components, two new hooks, three new tables, one RPC.

**Findings:** 2 medium, 4 low. No critical/high issues.

---

## Findings

### M-1: `SuggestionCard` receives `surface` prop but never uses it

**Severity:** Medium (dead code / unused prop)
**Location:** `src/components/customer/SuggestionCard.tsx:17,27`

The `surface` prop is declared in `SuggestionCardProps`, destructured in the component, and passed by every caller — but never referenced in the component body. The `onImpression` callback already captures the surface in the parent (`HomeSuggestions` hardcodes `"home"`, `AddServiceDrawer` hardcodes `"drawer"`), so the prop is redundant.

**Impact:** No runtime bug, but it creates confusion about where surface tracking happens and adds unnecessary API surface to the component.

**Recommendation:** Remove the `surface` prop from `SuggestionCardProps` and from all call sites. The parent is already responsible for surface-specific behavior.

---

### M-2: `recordDrawerOpen` mutation is a no-op

**Severity:** Medium (dead instrumentation)
**Location:** `src/hooks/useSuggestionActions.ts:59-65`

The `recordDrawerOpen` mutation has an empty `mutationFn` body with a comment explaining it can't work because `suggestion_actions.sku_id` is NOT NULL and drawer opens don't have a SKU. It's exported but never called (no caller in Dashboard or AddServiceDrawer).

**Impact:** Dead code that signals an incomplete design. If instrumentation is needed for drawer opens, the schema needs a nullable `sku_id` or a separate events table. As-is, this mutation silently does nothing and may mislead future developers into thinking drawer opens are being tracked.

**Recommendation:** Either:
- (a) Remove `recordDrawerOpen` entirely until the schema supports it, or
- (b) Add a `suggestion_events` table with nullable `sku_id` for surface-level events (drawer_open, browse_all_click, etc.)

---

### L-1: Impression fires on every mount, not on viewport visibility

**Severity:** Low (analytics accuracy)
**Location:** `src/components/customer/SuggestionCard.tsx:32-37`

The impression is recorded in a `useEffect` on mount, gated by a ref. This means if a SuggestionCard is rendered but below the fold (e.g., in the drawer's scrollable area), it counts as an impression even though the user never saw it.

**Impact:** Over-counts impressions, which inflates the denominator for add-rate calculations and causes the impression throttle (≥2 in 14 days) to suppress cards prematurely.

**Recommendation:** Consider using `IntersectionObserver` (or a library like `react-intersection-observer`) to fire `onImpression` only when the card enters the viewport. Not urgent for Phase 1-4, but should be addressed before Phase 6 instrumentation polish.

---

### L-2: RPC reason text doesn't prioritize the highest-scoring signal

**Severity:** Low (UX copy accuracy)
**Location:** `supabase/migrations/20260301163854_...sql:129-137`

The `reason` CASE evaluates top-to-bottom independently of the `score` CASE. A SKU could score highly from seasonality boost (+5) but the reason text says "No one covers this for your home yet" (coverage NONE) because coverage CASE comes first in the reason block. The reason doesn't always match the dominant scoring signal.

Example: `windows` in March with `coverage_status = 'NONE'` scores 10 (coverage) + 5 (seasonality) = 15. The reason says "No one covers this for your home yet" — the coverage signal — which is accurate but ignores that seasonality was also a strong factor.

**Impact:** Minor. The coverage reason is still truthful. The user just doesn't get the seasonal nudge copy when both signals fire.

**Recommendation:** Consider making the reason track the dominant scoring component. A pragmatic approach: if seasonality boost ≥ 5, prefer the seasonal reason. Not blocking.

---

### L-3: `handleUndo` finds item by `sku_id` in stale closure

**Severity:** Low (race condition edge case)
**Location:** `src/pages/customer/Dashboard.tsx:95-104`

`handleUndo` captures `routineItems` in its `useCallback` dependency array. When the user taps "Add" and then "Undo" within the 10-second toast window, `routineItems` may not yet reflect the newly added item (React Query invalidation is async). The `find()` would return `undefined` and the undo silently fails.

**Impact:** Narrow race window. In practice, React Query's cache invalidation is fast enough that by the time a user reads the toast and taps "Undo", the items are likely refreshed. But it's not guaranteed.

**Recommendation:** Instead of searching `routineItems` by `sku_id`, have `handleAddToRoutine` capture the returned `item.id` from `addItem.mutateAsync` and pass it directly to the undo callback. This eliminates the dependency on cache freshness.

---

### L-4: `hideSuggestion` upsert uses string `onConflict` instead of partial index

**Severity:** Low (correctness edge case)
**Location:** `src/hooks/useSuggestionActions.ts:23-29`

The upsert specifies `onConflict: "property_id,sku_id"`, but the unique index `idx_suggestion_suppressions_prop_sku` is a partial index (`WHERE sku_id IS NOT NULL`). Supabase/PostgREST upserts with partial unique indexes can behave unexpectedly — the `ON CONFLICT` clause may not match the partial index, causing an insert instead of an update, which then fails on the unique constraint.

**Impact:** In practice this works because `hideSuggestion` always passes a non-null `sku_id`, so the partial index condition is always satisfied. But it's fragile — if category-level suppression is ever added from the frontend, this pattern will break.

**Recommendation:** For robustness, consider adding a non-partial unique constraint `UNIQUE (property_id, sku_id)` alongside the partial index. Or use a manual select-then-insert/update pattern in the mutation instead of relying on PostgREST upsert with partial indexes.

---

## Architecture Notes (No Action Required)

1. **RPC as scoring engine is the right call.** Doing scoring in SQL keeps the logic co-located with the data, avoids N+1 fetches, and makes it easy to add new signals later. The CTE structure is readable and each scoring component is clearly separated.

2. **Dual-surface design (home + drawer) with surface-based limits** is clean. The `v_max_results` branching is simple and extensible for future surfaces (routine, receipt).

3. **One-tap add flow is well-wired.** The chain from `SuggestionCard → handleAdd → onAddToRoutine → addItem.mutate` correctly passes `default_level.id` through to `useAddRoutineItem`, which resolves level duration and inserts the full routine item. The undo toast at 10 seconds is a good pattern.

4. **Dashboard restructure is sensible.** The section ordering (Next Up → Handles → This Cycle → Health → Suggestions → Receipt → Seasonal) follows a priority hierarchy that matches user intent on the home screen.

5. **FAB with framer-motion entrance** — the spring animation with 0.3s delay is a nice touch. `bottom-20` clears the tab bar.

---

## Verdict

**Ship Phase 1-4 as-is. Address M-1 and M-2 in the next commit (quick cleanup). L-1 through L-4 can wait for Phase 6 instrumentation polish.**

| Severity | Count | Blocking? |
|----------|-------|-----------|
| Critical | 0     | —         |
| High     | 0     | —         |
| Medium   | 2     | No        |
| Low      | 4     | No        |
