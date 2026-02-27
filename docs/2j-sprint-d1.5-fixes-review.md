# Sprint D1.5 — Fixes Review

**Commit reviewed:** `67a517d` ("Scheduling D1.5 fixes")
**Reviewed by:** Claude (spec-compliance reviewer)
**Date:** 2026-02-27

---

## Verdict: PASS — all 4 findings resolved

All four findings from `docs/2i-sprint-d1.5-review.md` are addressed. No new issues introduced.

---

## Finding-by-Finding Verification

### D1.5-F1 (HIGH) — Preferences not loaded from DB ✅ RESOLVED

**Fix:** `ServiceDay.tsx:44-66` adds a `useQuery` that fetches `align_days_preference`, `must_be_home`, `must_be_home_window` from `service_day_preferences` keyed on `property_id`. A `useEffect` seeds local state when `savedPrefs` arrives.

**Verification:**
- Query is `enabled: !!property?.id` — won't fire without a property. Good.
- Uses `.maybeSingle()` — returns `null` for first-time users instead of throwing. Good.
- `useEffect` dependency is `[savedPrefs]` — re-seeds on refetch. Good.
- React Query caches by `["service_day_prefs", property?.id]` — consistent across the page.

**Note:** The onboarding wizard `ServiceDayStep` (`OnboardingWizard.tsx:657-780`) does NOT load saved prefs from DB. This is acceptable — during onboarding the user is creating preferences for the first time, so hardcoded defaults (`false`/`null`) are correct. If the user clicks "Skip for now" and returns to the standalone page, the standalone page's `useQuery` will handle loading.

### D1.5-F2 (MEDIUM) — Missing `alignment_explanation` on interface ✅ RESOLVED

**Fix:** `useServiceDayAssignment.ts:16` adds `alignment_explanation: string | null` to the `ServiceDayAssignment` interface.

**Verification:**
- `ServiceDayOffer.tsx:96` now uses `assignment.alignment_explanation` directly (no `as any`).
- `ServiceDay.tsx:145` uses `assignment.alignment_explanation` directly (no `as any`).
- `OnboardingWizard.tsx:761` uses `assignment?.alignment_explanation` directly (no `as any`).
- All three `as any` casts from the original implementation are eliminated.

### D1.5-F3 (MEDIUM) — No CHECK on `must_be_home_window` ✅ RESOLVED

**Fix:** Migration `20260227033251_d27c1dc7-...sql` adds two CHECK constraints:

1. `must_be_home_window_check` — restricts to `NULL`, `'morning'`, or `'afternoon'`.
2. `must_be_home_window_consistency` — if `must_be_home = false`, window must be `NULL`.

**Verification:**
- Both constraints use standard SQL `CHECK` syntax on the correct table (`service_day_preferences`).
- The consistency constraint (`must_be_home = true OR must_be_home_window IS NULL`) correctly prevents orphaned window values.
- The UI code in `SchedulingPreferences.tsx:96` already clears window to `null` when toggling `must_be_home` off, so the constraint won't be violated by normal UI flow.
- The `handlePrefsChange` in `ServiceDay.tsx:76` also explicitly sends `null` when `must_be_home` is false. Belt-and-suspenders.

### D1.5-F4 (LOW) — Auto-create offer fires multiple times ✅ RESOLVED

**Fix:** Both `ServiceDay.tsx:82` and `OnboardingWizard.tsx:671` add a `useRef(false)` guard (`offerCreated`) that is set to `true` before calling `createOrRefreshOffer.mutate`.

**Verification:**
- `ServiceDay.tsx:86`: `!offerCreated.current` in the condition, then `offerCreated.current = true` before the mutation. Prevents re-fires on re-renders.
- `OnboardingWizard.tsx:675`: Same pattern. Prevents duplicate offer creation in the wizard.
- Both correctly import `useRef` from React.

---

## Residual Observations (informational only — no action needed)

1. **Query invalidation after preference save:** `ServiceDay.tsx` saves preferences via `savePreferences.mutate()` but doesn't invalidate the `["service_day_prefs", property?.id]` query key on success. This is fine because local state is already updated optimistically via `setPrefs(newPrefs)` — the query is only used for initial hydration.

2. **Onboarding wizard doesn't load saved prefs:** As noted in D1.5-F1 above, this is by design for first-time flow. If a user somehow reaches onboarding with existing preferences (e.g., re-onboarding after account reset), they'd see defaults. This is an acceptable edge case.

---

## Summary

| Finding | Severity | Status | Quality |
|---------|----------|--------|---------|
| D1.5-F1 | HIGH | ✅ Resolved | Clean `useQuery` + `useEffect` hydration pattern |
| D1.5-F2 | MEDIUM | ✅ Resolved | Interface updated, all 3 `as any` casts removed |
| D1.5-F3 | MEDIUM | ✅ Resolved | Two CHECK constraints covering value + consistency |
| D1.5-F4 | LOW | ✅ Resolved | `useRef` guard in both locations |

**Sprint D1.5 is now clear to proceed to D2 (Ratings & Reviews).**
