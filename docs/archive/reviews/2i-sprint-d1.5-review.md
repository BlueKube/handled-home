# Sprint D1.5 Review — Scheduling UX Polish

**Reviewer:** Claude
**Date:** 2026-02-27
**Commits:** `4e09c99` ("Scheduling UX polish implemented"), `51ce4f9` ("Fix onboarding as-any casts") on `origin/main`
**Migration reviewed:**
- `20260227031313` — `align_days_preference`, `must_be_home`, `must_be_home_window`, `updated_at` on `service_day_preferences`; `alignment_explanation` on `service_day_assignments`

**Frontend reviewed:**
- `src/components/customer/SchedulingPreferences.tsx` (new — scheduling preference toggles)
- `src/components/customer/ServiceDayOffer.tsx` (updated — efficiency framing, confidence badges)
- `src/pages/customer/OnboardingWizard.tsx` (ServiceDayStep upgraded with hooks + preferences)
- `src/pages/customer/ServiceDay.tsx` (standalone page with preferences)
- `src/hooks/useServiceDayActions.ts` (savePreferences expanded)
- `src/hooks/useOnboardingProgress.ts` (metadata cast improvement)

---

## Summary

Sprint D1.5 adds scheduling preference toggles ("align days" and "must be home" with time windows), efficiency framing on the service day offer card, and wires the onboarding wizard's step 5 to the real service day assignment system.

The `SchedulingPreferences` component is clean and well-designed. The efficiency framing in `ServiceDayOffer` with reason code templates and confidence badges is good UX. The migration is straightforward.

However, there is **1 high-severity bug** — the standalone ServiceDay page doesn't load previously saved preferences from the database, causing data loss when any toggle is changed.

---

## High Findings

### D1.5-F1 | HIGH | Preferences not loaded from DB — toggles reset on page load, causing silent data overwrite

**Files:** `src/pages/customer/ServiceDay.tsx:35-37`, `src/pages/customer/OnboardingWizard.tsx` (ServiceDayStep)

**Problem:** Both the standalone ServiceDay page and the onboarding wizard initialize scheduling preferences from hardcoded defaults:

```typescript
const [prefs, setPrefs] = useState<SchedulingPrefs>({
  align_days_preference: false,
  must_be_home: false,
  must_be_home_window: null,
});
```

There is no query to load the user's existing `service_day_preferences` row from the database. This creates a data-loss scenario on the standalone ServiceDay page:

1. User visits page → sets `align_days_preference = true` → saved to DB
2. User leaves, comes back → toggles show `false` (local state defaults)
3. User toggles `must_be_home = true` → `handlePrefsChange` fires
4. Mutation sends `{ alignDaysPreference: false, mustBeHome: true }` — overwrites the DB, silently resetting `align_days_preference` to `false`

**Impact:** Any toggle change on a return visit overwrites ALL preferences with local defaults. The user's previously saved `align_days_preference` is lost.

**Fix:** Add a query to load existing preferences on mount:

```typescript
const { data: savedPrefs } = useQuery({
  queryKey: ["service_day_prefs", property?.id],
  enabled: !!property?.id,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("service_day_preferences")
      .select("align_days_preference, must_be_home, must_be_home_window")
      .eq("property_id", property!.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
});

// Initialize local state from DB
useEffect(() => {
  if (savedPrefs) {
    setPrefs({
      align_days_preference: savedPrefs.align_days_preference,
      must_be_home: savedPrefs.must_be_home,
      must_be_home_window: savedPrefs.must_be_home_window,
    });
  }
}, [savedPrefs]);
```

For the onboarding wizard, this is lower priority since it's a one-time flow (no prior preferences exist).

---

## Medium Findings

### D1.5-F2 | MEDIUM | `ServiceDayAssignment` interface missing `alignment_explanation`

**File:** `src/hooks/useServiceDayAssignment.ts`

The D1.5 migration adds `alignment_explanation` to `service_day_assignments`, and the Supabase generated types include it. But the hand-written `ServiceDayAssignment` interface was not updated:

```typescript
export interface ServiceDayAssignment {
  id: string;
  customer_id: string;
  // ... other fields ...
  // alignment_explanation is MISSING
}
```

Three files use `(assignment as any).alignment_explanation` to work around this:
- `ServiceDayOffer.tsx:~100`
- `OnboardingWizard.tsx` (ServiceDayStep)
- `ServiceDay.tsx` (confirmed + pending states)

**Fix:** Add `alignment_explanation: string | null;` to the `ServiceDayAssignment` interface and remove the `as any` casts.

### D1.5-F3 | MEDIUM | No CHECK on `must_be_home_window`

**Migration:** `20260227031313`

```sql
ADD COLUMN IF NOT EXISTS must_be_home_window text DEFAULT NULL,
```

Valid values are `'morning'` and `'afternoon'` (from the `WINDOW_OPTIONS` in the frontend). No database-level constraint exists. Similar to D1-F9 (current_step validation).

**Fix (either):**

```sql
-- Option A: CHECK constraint
ALTER TABLE public.service_day_preferences
  ADD CONSTRAINT must_be_home_window_check
  CHECK (must_be_home_window IS NULL OR must_be_home_window IN ('morning', 'afternoon'));

-- Option B: Also enforce must_be_home consistency
ALTER TABLE public.service_day_preferences
  ADD CONSTRAINT must_be_home_window_check
  CHECK (must_be_home OR must_be_home_window IS NULL);
```

---

## Low Findings

### D1.5-F4 | LOW | Auto-create offer useEffect may fire multiple times

**File:** `src/pages/customer/OnboardingWizard.tsx` (ServiceDayStep)

```typescript
useEffect(() => {
  if (!assignLoading && property?.id && !assignment) {
    createOrRefreshOffer.mutate(property.id, { onSuccess: () => refetch() });
  }
}, [assignLoading, property?.id, assignment]);
```

The effect doesn't check `createOrRefreshOffer.isPending`. If the component re-renders while the mutation is in-flight (e.g., from `isPending` state change), the condition is still true (`assignment` is still null) and `mutate` fires again. The RPC is idempotent (create_or_refresh), so no data corruption, but unnecessary duplicate calls.

**Fix:** Add a ref guard:
```typescript
const offerCreated = useRef(false);
useEffect(() => {
  if (!assignLoading && property?.id && !assignment && !offerCreated.current) {
    offerCreated.current = true;
    createOrRefreshOffer.mutate(property.id, { onSuccess: () => refetch() });
  }
}, [assignLoading, property?.id, assignment]);
```

---

## Structural Assessment

### What's Working Well
1. **`SchedulingPreferences` component** — Clean, reusable design with controlled state. Toggle interactions are smooth (window selector auto-shows/hides, defaults to "morning" on enable).
2. **Efficiency framing** — `REASON_TEMPLATES` with dynamic day name interpolation. Confidence badges (`Stable day` / `Popular day`) based on capacity utilization thresholds are good UX.
3. **Migration is clean** — `IF NOT EXISTS` for idempotency. `set_updated_at` trigger properly reused.
4. **Service day step in wizard** — Correctly integrates with `useServiceDayAssignment` hooks, auto-creates offer, confirms on accept. The skip button correctly only advances the step without saving preferences.
5. **Metadata cast improvement** — `useOnboardingProgress` changed from `as Record<string, unknown> as any` to `as unknown as Json` — proper Supabase type instead of `any`.

### What Needs Fixing Before D2
1. **D1.5-F1** (HIGH) — Load saved preferences from DB on mount; otherwise returning users lose their settings.

---

## Final Finding Tracker

| ID | Severity | Status | Description |
|----|----------|--------|-------------|
| D1.5-F1 | HIGH | Open | Preferences not loaded from DB — toggle defaults overwrite saved values on page load |
| D1.5-F2 | MEDIUM | Open | `ServiceDayAssignment` interface missing `alignment_explanation` — 3 `as any` casts |
| D1.5-F3 | MEDIUM | Open | No CHECK on `must_be_home_window` — 'morning'/'afternoon' not enforced at DB level |
| D1.5-F4 | LOW | Open | Auto-create offer useEffect may fire multiple times while mutation is in-flight |

**Sprint D1.5 has 1 high finding that should be resolved before D2.**
