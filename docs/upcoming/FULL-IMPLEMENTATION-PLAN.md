# Round 63: Systematic Bug Scan & Fix

> **Created:** 2026-04-03
> **Goal:** Systematically scan the entire codebase for 15 known bug patterns, fix all confirmed issues, and push clean code.
> **Approach:** Each phase targets one bug category. Sub-agents perform the scan, main thread applies fixes.
> **Review mode:** Micro (1 reviewer) for mechanical fixes, Small (2 agents) for logic-heavy fixes. Bug-scan batches are low-risk because each fix is small and isolated.

---

## Phase 1: Missing Error States

**Problem:** Pages that use `useQuery` but destructure only `{ data, isLoading }` without `isError` show infinite spinners or misleading empty states on network failure.

**Goals:**
- Find every page missing `isError` handling
- Add error UI (typically a centered error card with retry)

**Scope:**
- Grep: `const { data, isLoading }` (without `isError`) in src/pages/ and src/components/
- Fix: Add `isError` destructuring + `<QueryErrorCard />` or inline error state

**Deliverables:** All pages handle query errors gracefully.

**Review:** Micro — mechanical pattern, same fix everywhere.

**Batch estimate:** 2-3 batches (Large file count, Small fix per file)

---

## Phase 2: `as any` Cast Audit

**Problem:** `as any` casts hide real type bugs. Some are intentional (Lovable regenerates types.ts), but others paper over genuine mismatches.

**Goals:**
- Catalog every `as any` in the codebase
- Classify: intentional (Lovable types workaround) vs hiding a real bug
- Fix the real bugs, document the intentional ones

**Scope:**
- Grep: `as any` in src/
- For each: check if the underlying type actually exists in types.ts now
- Fix casts that are no longer needed (tables were added in consolidated migration)

**Deliverables:** Reduced `as any` count, real type bugs fixed.

**Review:** Small — type changes can have ripple effects.

**Batch estimate:** 2-3 batches

---

## Phase 3: Invalid Enum Values & Wrong Table/Column Names

**Problem:** Code references status enums, table names, or column names that don't exist in the DB. These queries silently return 0 rows.

**Goals:**
- Cross-reference all `.from("table")` calls against types.ts table list
- Cross-reference all status string literals against DB enum definitions
- Fix mismatches

**Scope:**
- Grep: `.from("` in src/ — compare table names against types.ts
- Grep: status string literals in `.eq("status", "...")` and `.in("status", [...])`
- Cross-reference against migration CHECK constraints and enum types

**Deliverables:** All queries target real tables/columns/enums.

**Review:** Small — wrong table names cause silent failures, need careful verification.

**Batch estimate:** 1-2 batches

---

## Phase 4: Silent Query Failures

**Problem:** Supabase `.select()` calls that don't check the `error` return silently show empty UI instead of error states.

**Goals:**
- Find queries that ignore the `error` field
- Add error handling where missing

**Scope:**
- Grep: `.from(` + `.select(` patterns where `error` is not destructured or checked
- Focus on user-facing pages (customer/, provider/) over admin/

**Deliverables:** All critical queries surface errors to the user.

**Review:** Micro — mechanical pattern.

**Batch estimate:** 1-2 batches

---

## Phase 5: Stale useState from Props/Context

**Problem:** `useState(someAsyncValue)` captures a snapshot. If the async source updates, the state is stale. Forms pre-filled from fetched data are the typical victim.

**Goals:**
- Find all `useState` initialized from query data, context, or props
- Check if a syncing `useEffect` exists
- Add sync where missing

**Scope:**
- Grep: `useState(data?.`, `useState(profile?.`, `useState(props.`, `useState(org?.` in src/
- For each: check if there's a `useEffect([dep])` that calls the setter

**Deliverables:** No stale form fields after data refresh.

**Review:** Micro — mechanical fix.

**Batch estimate:** 1 batch

---

## Phase 6: Wrong Query Key Invalidation

**Problem:** Code invalidates a query key that doesn't match the actual query's key, so the cache never refreshes.

**Goals:**
- Cross-reference every `invalidateQueries({ queryKey: [...] })` against the actual `useQuery({ queryKey: [...] })` definitions
- Fix mismatches

**Scope:**
- Grep: `invalidateQueries` in src/ — list all keys being invalidated
- Grep: `queryKey:` in src/hooks/ — list all keys being queried
- Compare

**Deliverables:** Every invalidation targets a real query key.

**Review:** Micro — string comparison.

**Batch estimate:** 1 batch

---

## Phase 7: Price Parsing Errors

**Problem:** `parseInt` or `parseFloat` on formatted price strings can produce wrong values (e.g., "$149/4 weeks" → 1494).

**Goals:**
- Find all price/currency parsing in the codebase
- Verify each handles format strings correctly

**Scope:**
- Grep: `parseInt`, `parseFloat` near price/cost/amount variables
- Grep: `.replace(/[^0-9]/g` — the dangerous "strip everything" pattern

**Deliverables:** All price parsing is safe.

**Review:** Micro — math verification.

**Batch estimate:** 1 batch

---

## Phase 8: Count Bugs on Head Queries

**Problem:** `{ count: "exact", head: true }` returns count on a separate field, but `data` is null. Code using `data?.length` always gets 0.

**Goals:**
- Find all queries using `count: "exact"` or `head: true`
- Verify they read `count` from the response, not `data.length`

**Scope:**
- Grep: `count: "exact"` and `head: true` in src/

**Deliverables:** All count queries read from the correct response field.

**Review:** Micro — verified by inspection.

**Batch estimate:** 1 batch

---

## Phase 9: Orphaned Links & Routes

**Problem:** Navigation links or `navigate()` calls that point to routes that were renamed or removed.

**Goals:**
- Cross-reference all `to="/..."` and `navigate("/...")` against the Route tree in App.tsx
- Find dead links

**Scope:**
- Extract all routes from App.tsx
- Grep: `to="/"`, `navigate("/"`, `href="/"` in src/
- Compare

**Deliverables:** No dead links in the app.

**Review:** Micro — string comparison.

**Batch estimate:** 1 batch

---

## Phase 10: Date/Timezone Logic Bugs

**Problem:** Off-by-one errors in date comparisons, missing timezone handling, or `new Date()` without UTC awareness.

**Goals:**
- Audit date logic in billing, scheduling, and dunning code
- Verify timezone handling in edge functions vs client code

**Scope:**
- Grep: `new Date()`, `toISOString`, `>= CURRENT_DATE`, date comparisons in migrations and edge functions
- Focus on billing cycle boundaries and move-date transitions

**Deliverables:** Date logic is timezone-safe and boundary-correct.

**Review:** Small — date bugs are subtle and high-impact.

**Batch estimate:** 1-2 batches

---

## Summary

| Phase | Bug Type | Est. Batches | Review |
|-------|----------|-------------|--------|
| 1 | Missing error states | 2-3 | Micro |
| 2 | `as any` cast audit | 2-3 | Small |
| 3 | Invalid enums/tables | 1-2 | Small |
| 4 | Silent query failures | 1-2 | Micro |
| 5 | Stale useState | 1 | Micro |
| 6 | Wrong query keys | 1 | Micro |
| 7 | Price parsing | 1 | Micro |
| 8 | Count bugs | 1 | Micro |
| 9 | Orphaned links | 1 | Micro |
| 10 | Date/timezone | 1-2 | Small |
| **Total** | | **12-18** | |
