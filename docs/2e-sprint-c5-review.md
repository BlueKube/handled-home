# Sprint C5 Review — Email Infrastructure, Digest Schema, Admin Health Dashboard

**Reviewer:** Claude
**Date:** 2026-02-26
**Commits:** `3567c7e` ("C5: Implement email infra") on `origin/main`
**Migrations reviewed:**
- `20260226231654` — digest_eligible column, notification_digests table, 3 admin health views
- `20260226231708` — security_invoker fix for views

**Edge functions reviewed:**
- `send-email/index.ts` (new)
- `process-notification-events/index.ts` (email delivery wiring added)

**Frontend reviewed:**
- `src/pages/admin/NotificationHealth.tsx` (new)
- `src/hooks/useNotificationHealth.ts` (new)
- `src/App.tsx` (route added)

---

## Summary

Sprint C5 adds email delivery infrastructure (Resend integration with graceful degradation), digest schema groundwork, and an admin notification health dashboard. The architecture is sound — the send-email function correctly handles the "no API key" case, the processor correctly creates EMAIL delivery rows, and the health dashboard provides useful operational visibility.

However, there is **1 critical bug** that will cause runtime failures, **1 high security concern** in the email HTML generation, and several medium issues.

---

## Critical Findings

### C5-F1 | CRITICAL | `SKIPPED` status violates `notification_delivery` CHECK constraint

**Emitter:** `send-email/index.ts:51`
**Constraint:** `notification_delivery_status_check CHECK (status IN ('QUEUED','SENT','FAILED','SUPPRESSED'))` (migration `20260225072206`)

**Problem:** When `RESEND_API_KEY` is not configured, the send-email function marks deliveries as `SKIPPED`:
```typescript
await supabase
  .from("notification_delivery")
  .update({ status: "SKIPPED", ... })
  .in("id", ids);
```

But the table's CHECK constraint only allows `QUEUED`, `SENT`, `FAILED`, `SUPPRESSED`. The UPDATE will fail with a CHECK constraint violation. Email deliveries will remain `QUEUED` forever, and the next processor run will re-attempt them, calling send-email again in an infinite loop.

**Fix (either):**
- **Option A:** Add `SKIPPED` to the constraint:
  ```sql
  ALTER TABLE notification_delivery DROP CONSTRAINT notification_delivery_status_check;
  ALTER TABLE notification_delivery ADD CONSTRAINT notification_delivery_status_check
    CHECK (status IN ('QUEUED','SENT','FAILED','SUPPRESSED','SKIPPED'));
  ```
- **Option B:** Use `SUPPRESSED` instead of `SKIPPED` (semantically close enough for "intentionally not sent"):
  ```typescript
  .update({ status: "SUPPRESSED", error_message: "RESEND_API_KEY not configured..." })
  ```

Recommend Option A for clarity, but Option B works without a migration.

---

## High Findings

### C5-F2 | HIGH | Email HTML body is vulnerable to HTML injection

**File:** `process-notification-events/index.ts` (attemptEmailDelivery function)

**Problem:** Notification title and body are interpolated directly into HTML without escaping:
```typescript
html_body: `<div>
  <h2>${notif.title}</h2>
  <p>${notif.body}</p>
</div>`
```

The `title` and `body` come from template interpolation, where payload values are substituted. If a payload value contains HTML (e.g., a user-submitted `resolution_note` from `admin_resolve_customer_issue`), it will render as HTML in the email.

Example attack: An admin enters `resolution_note: "<script>alert('xss')</script>"` — this gets interpolated into the `customer_issue_status_changed` body template via `{{resolution_note}}` (if it were in the body), then rendered as raw HTML in the email.

Currently, only `{{new_status}}` is in the body template (not `resolution_note`), so the immediate risk is low. But as more templates are added with user-supplied values, this becomes exploitable.

**Fix:** HTML-escape the title and body before inserting into the HTML template:
```typescript
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

html_body: `<div>
  <h2>${escapeHtml(notif.title)}</h2>
  <p>${escapeHtml(notif.body)}</p>
</div>`
```

---

### C5-F3 | HIGH | N+1 query pattern for user email lookups in attemptEmailDelivery

**File:** `process-notification-events/index.ts` (attemptEmailDelivery)

**Problem:** Each unique user's email is fetched individually:
```typescript
for (const uid of userIds) {
  const { data: userData } = await supabase.auth.admin.getUserById(uid);
  if (userData?.user?.email) {
    emailMap.set(uid, userData.user.email);
  }
}
```

For 100 queued email deliveries from 50 users, this makes 50 sequential API calls. In production with many notifications, this will cause significant latency in the processor cron job.

**Fix:** Use `supabase.auth.admin.listUsers()` with a filter, or better, add an `email` column to the `profiles` table and query it in batch:
```typescript
const { data: profiles } = await supabase
  .from("profiles")
  .select("id, email")
  .in("id", userIds);
```

Or at minimum, use `Promise.all` to parallelize the individual calls.

---

## Medium Findings

### C5-F4 | MEDIUM | Email delivery results not tracked per-delivery in processor

**File:** `process-notification-events/index.ts` (attemptEmailDelivery)

**Problem:** The processor calls send-email with a batch of deliveries but doesn't use the response to update individual delivery statuses:
```typescript
const result = await res.json();
console.log("[process-notification-events] Email delivery result:", JSON.stringify(result));
// No per-delivery status update
```

The send-email function already handles status updates internally, so this isn't a data loss issue — but the processor has no visibility into which emails succeeded or failed. If the send-email call itself fails (network error), all deliveries remain `QUEUED` with no error tracking.

**Fix:** Add error handling for the fetch failure case:
```typescript
if (!res.ok) {
  // Mark all deliveries as FAILED
  const ids = deliveries.map(d => d.delivery_id);
  await supabase
    .from("notification_delivery")
    .update({ status: "FAILED", error_message: `send-email returned ${res.status}` })
    .in("id", ids);
}
```

---

### C5-F5 | MEDIUM | Health summary view performance — 9 sequential subqueries

**Migration:** `20260226231654`

The `notification_health_summary` view runs 9 independent COUNT subqueries. Each one does a full scan of `notification_delivery` or `notification_events` (filtered by index). On a busy system, this view could be slow.

Not blocking for MVP, but consider:
- Adding a partial index on `notification_delivery(status, attempted_at)` where `attempted_at > now() - interval '24 hours'`
- Or materializing the view as a materialized view with periodic refresh

---

### C5-F6 | MEDIUM | `notification_digests` table has no foreign key on `user_id`

**Migration:** `20260226231654`

```sql
CREATE TABLE IF NOT EXISTS public.notification_digests (
  user_id uuid NOT NULL,  -- no REFERENCES auth.users(id)
  ...
);
```

Missing `REFERENCES auth.users(id)` or `REFERENCES profiles(id)`. Orphaned digest records can accumulate if a user is deleted.

---

### C5-F7 | MEDIUM | `notification_delivery_daily` view uses `attempted_at` but SKIPPED/future-QUEUED rows have stale `attempted_at`

The `notification_delivery_daily` view groups by `attempted_at`. For QUEUED rows (waiting to be processed), `attempted_at` defaults to `now()` at insertion time — this means unprocessed deliveries are counted in the daily chart as if they were attempted today, mixing pending and completed data.

---

## Low Findings

### C5-F8 | LOW | Recharts dependency may not be installed

The `NotificationHealth.tsx` page imports from `recharts`:
```typescript
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
```

Verify `recharts` is in `package.json` dependencies.

### C5-F9 | LOW | `useNotificationHealth` uses `as any` type casts for view queries

The hook casts view table names with `as any` since Supabase TypeScript types don't include views:
```typescript
.from("notification_health_summary" as any)
```

This is expected for views and not a bug, but loses type safety. Acceptable for now.

---

## Structural Assessment

### What's Working Well
1. **Graceful degradation** — send-email correctly handles missing RESEND_API_KEY by logging and marking deliveries (once the status constraint is fixed)
2. **Internal-only edge function** — send-email is called by the processor with service role auth, not exposed to end users
3. **Health dashboard design** — 8 stat cards, 7-day chart, deadletter table is a comprehensive operational view
4. **Digest schema is forward-compatible** — `digest_eligible` flag on templates + `notification_digests` table sets up for future digest processor
5. **security_invoker = true** on all views — properly delegates RLS checks to the calling user
6. **Admin route protection** — Page is inside `ProtectedRoute requiredRole="admin"` guard

### What Needs Fixing Before Closing Round 2C
1. **C5-F1** (CRITICAL) — Add `SKIPPED` to the delivery status constraint (or use `SUPPRESSED`)
2. **C5-F2** (HIGH) — HTML-escape title/body in email template
3. **C5-F3** (HIGH) — Fix N+1 email lookup (at minimum, parallelize with Promise.all)

---

## Finding Tracker

| ID | Severity | Status | Description |
|----|----------|--------|-------------|
| C5-F1 | CRITICAL | Open | `SKIPPED` status violates CHECK constraint — email deliveries stuck in QUEUED loop |
| C5-F2 | HIGH | Open | Email HTML body vulnerable to injection via payload values |
| C5-F3 | HIGH | Open | N+1 user email lookups — sequential API calls per user |
| C5-F4 | MEDIUM | Open | Processor doesn't handle send-email call failures |
| C5-F5 | MEDIUM | Acceptable (MVP) | Health view runs 9 subqueries — slow on large data |
| C5-F6 | MEDIUM | Open | notification_digests missing FK on user_id |
| C5-F7 | MEDIUM | Open | Daily chart mixes QUEUED and attempted deliveries |
| C5-F8 | LOW | Verify | Recharts dependency needs to be in package.json |
| C5-F9 | LOW | Acceptable | `as any` casts for view queries — expected |

**Recommended next step:** Fix C5-F1 (constraint), C5-F2 (HTML escaping), and C5-F3 (email lookups), then Round 2C is truly complete.
