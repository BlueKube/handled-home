

# Module 06/06.1 Gap Remediation Plan

Based on the Claude Code review, this plan addresses all 13 identified gaps organized by priority.

---

## High Priority (3 items)

### H1: Fix primary offer when default day is full (Issue #1)

The `create_or_refresh_service_day_offer` RPC currently creates an assignment on the full default day without reserving capacity. If the customer confirms this primary offer, they confirm a day with no capacity reserved.

**Fix:** Modify the RPC so that when the default day is full, the primary offer points to the best available alternative day (with capacity reserved), not the full default day. The default day is still shown as context ("Your zone's default day is full") but the confirmable primary offer is the best-capacity day.

**Migration SQL change:**
- In the "default day full" branch: find the first day with capacity, reserve it, use that as the assignment's `day_of_week`. The "primary" offer row points to this available day. Alternatives are generated from remaining days with capacity.

### H2: Implement `alternative_strategy` in RPCs (Issue #2)

The `alternative_strategy` column (`window_first` / `day_first`) exists on zones but is never read. Both `create_or_refresh_service_day_offer` and `reject_service_day_once` iterate Monday-Sunday regardless.

**Fix:** Add a branch in both RPCs that reads `v_zone.alternative_strategy` and orders the day iteration accordingly:
- `window_first` (default): iterate days in Monday-Sunday order (current behavior, optimizes for route density)
- `day_first`: iterate days nearest to the default day first (e.g., if default is Wednesday, try Thu, Tue, Fri, Mon, Sat, Sun)

### H3: Configure cron trigger for cleanup (Issue #3)

The `cleanup-expired-offers` edge function exists but nothing triggers it. Expired offers never release capacity automatically.

**Fix:** Set up `pg_cron` + `pg_net` to call the edge function hourly. This requires a one-time SQL insert (not a migration, since it contains project-specific URLs/keys).

---

## Medium Priority (5 items)

### M4: Add expiry detection and calm messaging (Issue #4)

When a customer's offer expires and they revisit `/customer/service-day`, the page just shows a loading spinner and silently creates a new offer. No explanation is given.

**Fix:** In `useServiceDayAssignment`, also query for the most recent `superseded` assignment. If one exists and no active assignment exists, pass an `expiredPrevious` flag. In `CustomerServiceDay`, show a brief message: "Your previous offer expired, so we refreshed your options." before the new offer appears.

### M5: Add capacity warning in override modal (Issue #5)

The admin override modal doesn't warn when the target day is already at or over capacity.

**Fix:** Pass `capacities` data from `useServiceDayCapacity` into the override modal. When the admin selects a new day, check if `assigned_count >= effective_max` for that day and show a yellow warning banner: "This day is at capacity. Override will exceed the limit."

### M6: Display override logs in zone detail (Issue #6)

`useServiceDayAdmin` fetches `overrideLogs` but `ServiceDayZoneDetail` never renders them.

**Fix:** Add a collapsible "Override History" section at the bottom of `ServiceDayZoneDetail` showing recent overrides with timestamp, reason, before/after days, and notes.

### M7: Add Service Day to customer sidebar (Issue #7)

Customers can only reach `/customer/service-day` via the dashboard banner. Once confirmed, there's no way to review it.

**Fix:** Add a "Service Day" entry to `customerNav` in `AppSidebar.tsx`, positioned after "Plans" and before "Build Routine". Icon: `CalendarDays` (or a distinct icon like `CalendarCheck`).

### M8: Add Service Days to admin sidebar (Issue #8)

`/admin/service-days` is only in the "More" menu. It's operationally critical and should be prominent.

**Fix:** Add "Service Days" to `adminNav` in `AppSidebar.tsx`, positioned after "Plans" and before "Subscriptions".

---

## Low Priority (5 items)

### L9: Render reason code templates (Issue #9)

The `reason_code` field stores values like `default_day_available` and `default_day_full` but only a generic message is shown.

**Fix:** Create a `REASON_TEMPLATES` map in `ServiceDayOffer.tsx`:
- `default_day_available`: "We chose {day} because it matches your neighborhood route and keeps service reliable."
- `default_day_full`: "Your zone's default day is at capacity. We've matched you to the next best route day."
- fallback: "We've matched you to the best available route."

### L10: Add offer confidence badge (Issue #10)

06.1 section 6.2 suggests "Stable day" / "Popular day" badges on the customer offer card.

**Fix:** In `ServiceDayOfferCard`, fetch or receive capacity utilization for the offered day. If utilization < 70%, show a "Stable day" badge. If 70-90%, show "Popular day". Simple visual cue, no logic change.

### L11: Add Mon-Sun column counts to admin zone list (Issue #11)

The zone list only shows total assigned/limit. Spec says show Mon-Sun counts.

**Fix:** In the `ZoneCard` component within `ServiceDays.tsx`, add a compact row of 7 day abbreviations with their assigned counts beneath the zone name.

### L12: Remove `as any` casts from hooks (Issue #12)

All RPC calls in `useServiceDayActions` and `useServiceDayAdmin` use `as any` casts. The RPCs now exist in generated types.

**Fix:** Remove all `as any` casts and use proper typed RPC calls. This improves type safety and catches errors at build time.

### L13: Add secret-based auth to cleanup edge function (Issue #13)

The cleanup function is callable without authentication by anyone who discovers the URL.

**Fix:** Add a shared secret check. Read a `CRON_SECRET` from environment. The cron job sends it as `Authorization: Bearer <CRON_SECRET>`. The edge function rejects requests without the correct secret.

---

## Files Impacted

**Database migrations (new):**
- Fix `create_or_refresh_service_day_offer` RPC (H1 + H2)
- Fix `reject_service_day_once` RPC (H2)

**SQL insert (not migration):**
- pg_cron schedule for cleanup (H3)

**Edge function:**
- `supabase/functions/cleanup-expired-offers/index.ts` (L13)

**React hooks:**
- `src/hooks/useServiceDayAssignment.ts` (M4)
- `src/hooks/useServiceDayActions.ts` (L12)
- `src/hooks/useServiceDayAdmin.ts` (L12)

**Components:**
- `src/components/customer/ServiceDayOffer.tsx` (L9, L10)
- `src/components/admin/ServiceDayZoneDetail.tsx` (M6)
- `src/components/admin/ServiceDayOverrideModal.tsx` (M5)
- `src/pages/admin/ServiceDays.tsx` (L11)
- `src/pages/customer/ServiceDay.tsx` (M4)
- `src/components/AppSidebar.tsx` (M7, M8)

---

## Implementation Order

1. **Database first**: H1 + H2 in a single migration (RPC rewrites)
2. **Cron setup**: H3 (pg_cron insert)
3. **Edge function hardening**: L13 (secret check)
4. **Hooks**: M4 (expiry detection), L12 (remove `as any`)
5. **Customer UI**: L9 (reason templates), L10 (confidence badge), M4 (expiry message)
6. **Admin UI**: M5 (capacity warning), M6 (override logs), L11 (Mon-Sun counts)
7. **Navigation**: M7 + M8 (sidebar entries)

