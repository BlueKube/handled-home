# Round 2C — Sprint C2 + C3 Code Review

> **Reviewer:** Claude (automated spec-vs-code audit)
> **Scope:** Commits `14ff4d9` through `a4ae1e9` on `main` — Sprint C2 (Processor + Push Proof) and Sprint C3 (Template Seeding + Critical Flows)
> **Date:** 2026-02-26

---

## Summary

Sprints C2 and C3 deliver the notification processor edge function, device token hook, FCM push proof, and wire five edge functions to the event bus. The architectural structure is solid — idempotency, batch processing, retry/deadletter, audience resolution, and preference filtering are all present. However, there are **3 critical bugs that will cause runtime failures**, plus several high and medium issues.

---

## Critical Findings (Runtime Failures)

### C2-F1 | CRITICAL | `audience_type` case mismatch in processor breaks admin + provider zone routing

**File:** `supabase/functions/process-notification-events/index.ts` — `resolveAudience()` function

**Problem:** The `resolveAudience` function compares `event.audience_type` against lowercase strings:
```ts
if (event.audience_type === "admin") {   // line ~387
if (event.audience_type === "provider") { // line ~395
```

But the DB CHECK constraint enforces uppercase values: `audience_type IN ('CUSTOMER','PROVIDER','ADMIN')`, and all emitters correctly pass uppercase (e.g., `p_audience_type: "ADMIN"`).

**Impact:** Every admin alert (ADMIN_ZONE_ALERT_BACKLOG, ADMIN_WEATHER_PENDING, ADMIN_DUNNING_SPIKE) and every provider zone-targeted notification that goes through the zone resolution path will silently return 0 user IDs and get marked PROCESSED with no notifications created. **Admins will never see zone alerts. This is the most critical bug.**

**Fix:** Change to uppercase comparisons:
```ts
if (event.audience_type === "ADMIN") {
if (event.audience_type === "PROVIDER") {
```

---

### C2-F2 | CRITICAL | `useDeviceToken` writes lowercase `status: "active"` — DB constraint requires `"ACTIVE"`

**File:** `src/hooks/useDeviceToken.ts` — line ~50

**Problem:** The upsert passes `status: "active"` but the `user_device_tokens` table has:
```sql
CONSTRAINT user_device_tokens_status_check CHECK (status IN ('ACTIVE','DISABLED'))
```

**Impact:** Every device token registration will fail with a CHECK constraint violation. No push tokens will ever be stored. Push delivery is dead on arrival.

**Additionally:** The processor at `process-notification-events/index.ts` queries `.eq("status", "active")` (lowercase) on the same table, which would return 0 rows even if tokens existed. This is a secondary failure on the read side.

**Fix:**
- `useDeviceToken.ts`: Change `status: "active"` → `status: "ACTIVE"`
- `process-notification-events/index.ts`: Change `.eq("status", "active")` → `.eq("status", "ACTIVE")` (appears at lines ~381, ~399, ~405, ~508)

---

### C2-F3 | CRITICAL | No template seeding migration — `notification_templates` table is empty

**Problem:** Task 2C-C3a claims "18 notification templates inserted" and is marked `[x]` in tasks.md. However, **no migration file exists** that INSERTs rows into `notification_templates`. The commit `d51a0be` ("Seed templates and wire events") only modified edge function files and tasks.md — no SQL migration was included.

The table was created in migration `20260225072206` with the comment `-- seeded in C3`, but the C3 seeding never happened.

**Impact:** The processor falls back to using raw `event.event_type` as the notification title (e.g., "CUSTOMER_PAYMENT_FAILED" instead of "Action needed to keep your Service Day active"). All premium concierge copy, CTA routes, and channel configs are missing. Notifications will have ugly machine-readable titles and no CTAs.

**Fix:** Create a new migration that seeds the 18 templates. Use the copy from the expanded spec (`docs/round-2c-expanded-spec.md`). Example:
```sql
INSERT INTO notification_templates (template_key, event_type, priority, audience_type, title_template, body_template, cta_label_template, cta_route_template, channels, enabled)
VALUES
  ('customer_payment_failed', 'CUSTOMER_PAYMENT_FAILED', 'CRITICAL', 'CUSTOMER',
   'Action needed to keep your Service Day active',
   'We couldn''t process your payment. Update your card to keep everything running smoothly.',
   'Update payment', '/customer/billing',
   ARRAY['IN_APP','PUSH','EMAIL'], true),
  -- ... remaining 17 templates
;
```

---

## High Findings (Incorrect Behavior)

### C2-F4 | HIGH | `check-no-shows` uses wrong event type `CUSTOMER_SCHEDULE_CHANGED_WEATHER` for provider reassignment

**File:** `supabase/functions/check-no-shows/index.ts` — line ~104

**Problem:** When a provider no-shows and the job gets reassigned to a backup, the customer notification uses:
```ts
p_event_type: "CUSTOMER_SCHEDULE_CHANGED_WEATHER"
```

This is the weather schedule change event. A customer whose provider just didn't show up will receive a weather-related notification (once templates are seeded, the copy would reference severe weather alerts).

**Impact:** Confusing/incorrect customer notification copy. Undermines trust.

**Fix:** Use a dedicated event type. Options:
- Create `CUSTOMER_PROVIDER_REASSIGNED` event type and corresponding template
- Or use a generic `CUSTOMER_SCHEDULE_CHANGED` event type with payload-driven copy
- At minimum, the payload already has `event: "Provider reassignment"` which the template could use

---

### C2-F5 | HIGH | `useDeviceToken` hook is never mounted — dead code

**File:** `src/hooks/useDeviceToken.ts`

**Problem:** The hook is defined but never imported or called anywhere in the app. Grep for `useDeviceToken` across all `.tsx` and `.ts` files (excluding its own definition) returns zero results.

**Impact:** Even after fixing F2, device tokens would never be registered because the hook isn't executed. Push notifications cannot work.

**Fix:** Import and call `useDeviceToken()` in a top-level component that runs after authentication. Typical pattern:
```tsx
// In App.tsx or a top-level AuthenticatedApp wrapper
import { useDeviceToken } from "@/hooks/useDeviceToken";

function App() {
  useDeviceToken(); // registers token when user is logged in
  // ...
}
```

---

### C2-F6 | HIGH | `claim_notification_events` RPC does not exist — no `SKIP LOCKED` semantics

**Problem:** The processor calls `supabase.rpc("claim_notification_events", { batch_limit: BATCH_SIZE })` but this RPC was never created in any migration. The fallback path (SELECT + separate UPDATE) works but has a TOCTOU race condition: between the SELECT and UPDATE, a concurrent invocation could claim the same events.

**Impact:** If the processor is triggered twice in rapid succession (overlapping cron invocations), the same events could be processed twice, leading to duplicate notifications. The idempotency on the notification insert (via `source_event_id` unique constraint, if it exists) may catch some but not all duplicates.

**Fix:** Create the RPC in a migration:
```sql
CREATE OR REPLACE FUNCTION public.claim_notification_events(batch_limit int DEFAULT 50)
RETURNS SETOF notification_events
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  UPDATE notification_events
  SET status = 'PROCESSING'
  WHERE id IN (
    SELECT id FROM notification_events
    WHERE status = 'PENDING'
      AND scheduled_for <= now()
    ORDER BY created_at ASC
    LIMIT batch_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$;
```

---

### C2-F7 | HIGH | `max_per_hour` rate limit is fetched but never checked

**File:** `supabase/functions/process-notification-events/index.ts` — lines 232-246

**Problem:** The processor fetches `max_per_hour` from `notification_rate_limits` and stores it in the map, but only checks `max_per_day`:
```ts
if ((count ?? 0) >= rateLimit.max_per_day) {
  rateLimited = true;
}
```
No hourly check exists. The spec explicitly calls for hourly rate limits.

**Impact:** Users can receive all their daily push notifications in a single hour, creating a spam-like experience. Per-hour limits in the config table are ignored.

**Fix:** Add hourly check:
```ts
if ((count ?? 0) >= rateLimit.max_per_day) {
  rateLimited = true;
} else {
  // Check hourly limit
  const hourAgo = new Date(Date.now() - 3600000).toISOString();
  const { count: hourlyCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("priority", priority)
    .gte("created_at", hourAgo);
  if ((hourlyCount ?? 0) >= rateLimit.max_per_hour) {
    rateLimited = true;
  }
}
```

---

## Medium Findings (Spec Gaps / Suboptimal)

### C2-F8 | MEDIUM | Token disable on logout is explicitly a no-op

**File:** `src/hooks/useDeviceToken.ts` — lines 83-88

The second `useEffect` for logout says:
```ts
// We can't know which token was ours without storing it, so this is a no-op
```

The token value should be stored in a `useRef` after successful registration so it can be marked `DISABLED` on logout.

---

### C2-F9 | MEDIUM | `ADMIN_ZONE_ALERT_BACKLOG` from `assign-jobs` missing zone context

**File:** `supabase/functions/assign-jobs/index.ts` — line ~97

The admin backlog alert doesn't include `p_audience_zone_id`. Since overflow jobs may span multiple zones, this makes the alert less actionable. The spec says admin alerts should have zone/category tags and severity.

Consider either: (a) emitting per-zone alerts by tracking overflow per zone_id, or (b) including a list of affected zone_ids in the payload.

---

### C2-F10 | MEDIUM | Processor does not validate payload schema per event_type

The spec explicitly states: "Validates payload schema per event_type." The processor does zero payload validation — any malformed or missing payload fields silently produce `{{placeholder}}` in interpolated text.

Recommendation: Add at minimum a warning log when required template fields are missing from payload.

---

### C2-F11 | MEDIUM | FCM legacy HTTP API is deprecated

**File:** `supabase/functions/process-notification-events/index.ts` — `attemptPushDelivery()`

The processor uses `https://fcm.googleapis.com/fcm/send` (legacy FCM HTTP API). Google deprecated this in 2023. Acceptable for proof-of-concept but should be tracked for migration to FCM v1 API before production.

---

### C2-F12 | MEDIUM | `PROVIDER_ROUTE_UPDATED` event type from spec is not wired

The expanded spec lists `PROVIDER_ROUTE_UPDATED` as a starter event type, but no edge function emits it. This should be wired in Sprint C4 (or documented as deferred).

---

### C2-F13 | LOW | `isInQuietHours` ignores user timezone

The function uses `getUTCHours()` with a comment noting timezone is deferred. This means quiet hours (default 9pm-8am) will be enforced in UTC, not local time. A user in US Eastern (UTC-5) will have quiet hours 4pm-3pm local — essentially backwards.

Not blocking for MVP if all early users are in a known timezone, but should be an early C5 fix.

---

## Corrective Action Summary

| ID | Severity | Fix Effort | Description |
|----|----------|-----------|-------------|
| C2-F1 | CRITICAL | S (5 min) | Fix `resolveAudience` casing: `"admin"` → `"ADMIN"`, `"provider"` → `"PROVIDER"` |
| C2-F2 | CRITICAL | S (5 min) | Fix `status` casing in useDeviceToken (`"active"` → `"ACTIVE"`) and processor queries |
| C2-F3 | CRITICAL | M (30 min) | Create template seeding migration with 18 templates |
| C2-F4 | HIGH | S (10 min) | Fix check-no-shows to use correct event type for customer reassignment |
| C2-F5 | HIGH | S (5 min) | Mount `useDeviceToken()` in App.tsx or top-level authenticated wrapper |
| C2-F6 | HIGH | S (15 min) | Create `claim_notification_events` RPC with SKIP LOCKED |
| C2-F7 | HIGH | S (10 min) | Add hourly rate limit check in processor |
| C2-F8 | MEDIUM | S (10 min) | Store token in ref, mark DISABLED on logout |
| C2-F9 | MEDIUM | S (10 min) | Add zone context to admin backlog alert |
| C2-F10 | MEDIUM | M (20 min) | Add payload validation warnings |
| C2-F11 | MEDIUM | Deferred | Track FCM v1 migration |
| C2-F12 | MEDIUM | Deferred to C4 | Wire PROVIDER_ROUTE_UPDATED |
| C2-F13 | LOW | Deferred to C5 | Timezone-aware quiet hours |

**Recommended priority:** Fix F1, F2, F3 immediately (they make the entire notification system non-functional). Then F4, F5, F6 before proceeding to Sprint C4.
