# Sprint 3B Phase 2 Review — Coverage Map UI

**Reviewer:** Claude (automated spec reviewer)
**Date:** 2026-03-01
**Scope:** `usePropertyCoverage.ts`, `CoverageMap.tsx`, route wiring
**Spec:** 3B-04 Coverage Map screen with ~10 categories, segmented controls, inline switch intent

---

## Verdict: 1 HIGH, 2 MEDIUM, 2 LOW findings

---

## P2-F1 (HIGH): `handleSave` has no error boundary — unhandled rejection on save failure

`CoverageMap.tsx:80-91`

```ts
const handleSave = async () => {
  const updates: CoverageUpdate[] = COVERAGE_CATEGORIES.map((cat) => { ... });
  await save(updates);    // save = mutateAsync — throws on error
  navigate(returnTo);     // skipped on error, but rejection is unhandled
};
```

`save` is `saveMutation.mutateAsync`, which throws on error. The `onError` callback in the hook fires and shows a toast, but the thrown error is never caught in `handleSave`. This causes an unhandled promise rejection logged to the console (and in React strict mode, potentially a warning). More critically, the `onClick={handleSave}` call doesn't have error handling either.

**Fix:** Wrap in try/catch:

```ts
const handleSave = async () => {
  const updates = COVERAGE_CATEGORIES.map((cat) => { ... });
  try {
    await save(updates);
    navigate(returnTo);
  } catch {
    // onError already shows toast
  }
};
```

Or use `saveMutation.mutate` (non-throwing) with an `onSuccess` callback that navigates.

---

## P2-F2 (MEDIUM): `useEffect` initialization only runs when `coverage.length > 0` — first-time users get no defaults

`CoverageMap.tsx:49-60`

```ts
useEffect(() => {
  if (coverage.length > 0) {
    const init = {};
    for (const row of coverage) {
      init[row.category_key] = { status: ..., intent: ... };
    }
    setSelections(init);
  }
}, [coverage]);
```

For a first-time user, `coverage` is an empty array (`[]`), so `selections` stays `{}`. The UI then shows all categories as unselected (no active buttons), which is the correct visual state. However, when the user hits "Save & Continue" without touching any categories, the `handleSave` function maps unset selections to `coverage_status: "NONE"` (line 85), which is the correct default.

The real issue: the progress counter shows `0/10 categories set` even though the save will treat them as "NONE". This is confusing — either all unset categories should be visually shown as "None" (pre-selected), or the save should only submit categories the user explicitly interacted with.

**Fix (option A):** Initialize all categories to `NONE` on mount when `coverage.length === 0`:

```ts
useEffect(() => {
  if (coverage.length > 0) {
    // existing init from DB
  } else {
    // first time — show NONE as default
    const init = {};
    for (const cat of COVERAGE_CATEGORIES) {
      init[cat.key] = { status: "NONE" as CoverageStatus, intent: null };
    }
    setSelections(init);
  }
}, [coverage]);
```

**Fix (option B):** Only save categories the user explicitly set, leaving unselected categories out of the upsert.

---

## P2-F3 (MEDIUM): Personalization event insert error silently swallowed

`usePropertyCoverage.ts:78-91`

```ts
// Log personalization event
await supabase.from("personalization_events").insert({
  property_id: propertyId,
  event_type: "coverage_map_updated",
  payload: { ... },
});
```

The coverage upsert (line 73-76) correctly checks for errors (`if (error) throw error`). But the personalization event insert on line 79 doesn't check the return value. If the insert fails (e.g., RLS issue, network blip), the mutation succeeds anyway — the coverage data is saved but the analytics event is lost, and no one knows.

This is arguably acceptable for analytics (non-critical), but the inconsistency with the upsert error handling suggests it's an oversight rather than a deliberate choice.

**Fix:** At minimum, log the error:

```ts
const { error: eventError } = await supabase.from("personalization_events").insert({ ... });
if (eventError) console.warn("Failed to log personalization event:", eventError);
```

---

## P2-F4 (LOW): `returnTo` from search param is an open redirect

`CoverageMap.tsx:40`

```ts
const returnTo = searchParams.get("return") || "/customer";
```

A URL like `/customer/coverage-map?return=https://evil.com` would cause `navigate("https://evil.com")`. In practice, `react-router`'s `navigate()` treats absolute URLs as relative paths (navigating to `/https://evil.com` which 404s), so this isn't exploitable. But it's worth noting for completeness — if the navigation method ever changes (e.g., `window.location.href = returnTo`), it becomes a real open redirect.

**Fix (optional):** Validate that `returnTo` starts with `/`:

```ts
const raw = searchParams.get("return") || "/customer";
const returnTo = raw.startsWith("/") ? raw : "/customer";
```

---

## P2-F5 (LOW): `coverageMap` rebuilt on every render — not memoized

`usePropertyCoverage.ts:102-106`

```ts
const coverageMap = new Map<string, CoverageRow>();
for (const row of query.data ?? []) {
  coverageMap.set(row.category_key, row);
}
```

This creates a new Map object on every render. With ~10 categories this is negligible, but it means any component using `coverageMap` as a dependency (e.g., in a `useEffect` dep array) would re-fire every render. The `CoverageMap` component currently doesn't use `coverageMap` directly (it uses `coverage`), so this is a latent issue for future consumers.

**Fix (optional):** Wrap in `useMemo`:

```ts
const coverageMap = useMemo(() => {
  const map = new Map<string, CoverageRow>();
  for (const row of query.data ?? []) map.set(row.category_key, row);
  return map;
}, [query.data]);
```

---

## Summary

| ID | Severity | Component | Issue |
|----|----------|-----------|-------|
| P2-F1 | HIGH | CoverageMap | Unhandled promise rejection on save failure |
| P2-F2 | MEDIUM | CoverageMap | First-time users see 0/10 progress despite NONE default |
| P2-F3 | MEDIUM | usePropertyCoverage | Personalization event error silently swallowed |
| P2-F4 | LOW | CoverageMap | `returnTo` param not validated (mitigated by react-router) |
| P2-F5 | LOW | usePropertyCoverage | `coverageMap` rebuilt every render |

**Recommendation:** Fix P2-F1 before proceeding — unhandled rejections in async handlers are a real UX issue (user clicks save, it fails, they see a toast but also a console error, and the button stays in a weird state). P2-F2 is a UX polish item that should be addressed before onboarding integration (3B-05).
