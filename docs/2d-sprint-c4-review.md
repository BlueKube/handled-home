# Sprint C4 Review — Service Update Events & Banner Surfaces

**Reviewer:** Claude
**Date:** 2026-02-26
**Commit:** `d3aa6d7` ("Wire notifications C4 updates") on `origin/main`
**Migrations reviewed:**
- `20260226214133` — RPC rewrites (confirm_service_day, start_job, complete_job, admin_resolve_customer_issue)
- `20260226214152` — en_route trigger on jobs.arrived_at

**Edge functions reviewed:**
- `send-reminders/index.ts` (new)
- `stripe-webhook/index.ts` (transfer.paid handler updated)
- `optimize-routes/index.ts` (PROVIDER_ROUTE_UPDATED added)

**Frontend reviewed:**
- `src/components/customer/NotificationBanners.tsx` (new)
- `src/components/provider/NotificationBanners.tsx` (new)
- `src/pages/customer/Dashboard.tsx` (banner mounted)
- `src/pages/provider/Dashboard.tsx` (banner mounted)

---

## Summary

Sprint C4 wires 6 customer-facing and 2 provider-facing notification events into the existing event bus, adds a `send-reminders` cron-ready edge function, adds a DB trigger for en_route detection, and mounts banner components on both dashboards.

The wiring is structurally sound — the correct RPCs emit events at the right lifecycle moments. However, there are **3 payload/template mismatches** that will produce broken notification copy, **1 missing template**, and **1 carry-over bug** from C2 that was never actually fixed.

---

## Critical Findings

### C4-F1 | CRITICAL | `PROVIDER_ROUTE_UPDATED` has no template — silent notification failure

**Emitter:** `optimize-routes/index.ts`
**Event type emitted:** `PROVIDER_ROUTE_UPDATED`

**Problem:** The optimize-routes edge function emits `PROVIDER_ROUTE_UPDATED`, but no template row exists in migration `20260226211454` (the template seed). The seed has 18 templates; `PROVIDER_ROUTE_UPDATED` is not among them.

The processor will fall back to using the raw event type as the title (`PROVIDER_ROUTE_UPDATED`) and an empty body. Providers will receive a notification with a machine-readable event name as the title.

**Fix:** Add a template row to the seed migration or a new migration:
```sql
INSERT INTO notification_templates (template_key, event_type, audience_type, priority, title_template, body_template, cta_label_template, cta_route_template, channels, enabled, version)
VALUES ('provider_route_updated', 'PROVIDER_ROUTE_UPDATED', 'PROVIDER', 'SERVICE',
  'Your route has been optimized',
  'Your route for {{date}} has been updated with {{job_count}} stops.',
  'View route', '/provider/jobs',
  ARRAY['IN_APP','PUSH'], true, 1)
ON CONFLICT (template_key) DO NOTHING;
```

---

### C4-F2 | CRITICAL | `PROVIDER_PAYOUT_POSTED` template expects `{{amount}}` but payload sends `amount_cents`

**Emitter:** `stripe-webhook/index.ts`, `transfer.paid` handler
**Template:** `provider_payout_posted` (seed migration `20260226211454`)

**Template body:**
```
Your payout of ${{amount}} has been initiated. It should arrive in 1-2 business days.
```

**Payload emitted:**
```typescript
p_payload: {
  payout_id: payout.id,
  amount_cents: payoutRow.total_cents,
}
```

**Problem:** The template placeholder `{{amount}}` does not match the payload key `amount_cents`. The interpolator leaves unmatched placeholders as-is, so the notification body will render as:
> "Your payout of ${{amount}} has been initiated."

Additionally, even if the key matched, the value is in cents (e.g., `15000`) not formatted dollars (e.g., `$150.00`). The notification would say "Your payout of $15000."

**Fix (either):**
- **Option A (payload side):** Change `amount_cents` to `amount` in the payload and format it as dollars: `amount: (payoutRow.total_cents / 100).toFixed(2)`
- **Option B (template side):** Change `{{amount}}` to `{{amount_cents}}` (but then the display would show raw cents)

Recommend Option A.

---

### C4-F3 | HIGH | `CUSTOMER_ISSUE_STATUS_CHANGED` CTA route uses `{{ticket_id}}` but payload sends `issue_id`

**Emitter:** `admin_resolve_customer_issue` RPC (migration `20260226214133`)
**Template:** `customer_issue_status_changed` (seed migration `20260226211454`)

**Template CTA route:**
```
/customer/support/tickets/{{ticket_id}}
```

**Payload emitted:**
```sql
jsonb_build_object(
  'issue_id', p_issue_id,
  'job_id', v_issue.job_id,
  'new_status', 'resolved',
  'resolution_note', p_resolution_note
)
```

**Problem:** The CTA route uses `{{ticket_id}}` but the payload has `issue_id`. The rendered CTA route will be the literal string `/customer/support/tickets/{{ticket_id}}`, which is a 404.

**Fix:** Either:
- Change the template CTA to `/customer/support/tickets/{{issue_id}}`
- Or add `ticket_id` to the payload (aliasing `issue_id`)

---

## Medium Findings

### C4-F4 | MEDIUM | `check-no-shows` still emits `CUSTOMER_SCHEDULE_CHANGED_WEATHER` for provider reassignment (C2-F4 not fixed)

**File:** `supabase/functions/check-no-shows/index.ts:134`

**Problem:** C2-F4 was marked FIXED in the C2/C3 review, and a `CUSTOMER_PROVIDER_REASSIGNED` template was added in the seed migration. However, the actual edge function code was never updated — it still emits `CUSTOMER_SCHEDULE_CHANGED_WEATHER`:

```typescript
p_event_type: "CUSTOMER_SCHEDULE_CHANGED_WEATHER",  // ← should be CUSTOMER_PROVIDER_REASSIGNED
```

**Impact:** When a provider no-shows, the customer receives a weather-related notification instead of a reassignment notification. The `customer_provider_reassigned` template with copy "We're sending a different pro" is never used.

**Fix:** Change the event type in `check-no-shows/index.ts:134`:
```typescript
p_event_type: "CUSTOMER_PROVIDER_REASSIGNED",
```

---

### C4-F5 | MEDIUM | `send-reminders` edge function has no auth protection

**File:** `supabase/functions/send-reminders/index.ts`

**Problem:** The function has no authorization check. Any caller can invoke it (it only uses the service role key internally). The idempotency guard prevents double-sends within the same day, but an unauthorized caller could trigger the function on demand.

Unlike `optimize-routes` (which checks auth + org membership), `send-reminders` is completely open.

**Impact:** Low risk since:
- The function is idempotent (won't re-send if already ran today)
- It's intended to be called by a cron job (which wouldn't have auth headers)

**Recommendation:** If this will only be invoked by Supabase cron (pg_cron calling `net.http_post`), the lack of auth is acceptable. If it's exposed as a public endpoint, add service-role-key validation or a shared secret header check.

---

### C4-F6 | MEDIUM | `send-reminders` writes to `cron_run_log` but this table may not exist

**File:** `supabase/functions/send-reminders/index.ts:39-45`

**Problem:** The function inserts into `cron_run_log`, but this table is only referenced in `optimize-routes` and `send-reminders`. I cannot find a migration that creates this table.

**Impact:** If the table doesn't exist, the INSERT will fail silently (or throw), and the error handler will return a 500. However, the `optimize-routes` function already writes to this table and presumably works, so it may have been created in the live DB.

**Fix:** Verify the table exists or add `CREATE TABLE IF NOT EXISTS` in a migration.

---

### C4-F7 | MEDIUM | en_route trigger fires on ANY `arrived_at` update, not just provider arrival

**File:** Migration `20260226214152`

**Trigger:**
```sql
CREATE TRIGGER trg_notify_en_route
  AFTER UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION notify_customer_provider_en_route();
```

The function correctly checks `OLD.arrived_at IS NULL AND NEW.arrived_at IS NOT NULL`, which is good. However, the trigger fires on every UPDATE to the jobs table, adding overhead. A `WHEN` clause would be more efficient:

```sql
CREATE TRIGGER trg_notify_en_route
  AFTER UPDATE OF arrived_at ON jobs
  FOR EACH ROW
  WHEN (OLD.arrived_at IS NULL AND NEW.arrived_at IS NOT NULL)
  EXECUTE FUNCTION notify_customer_provider_en_route();
```

**Impact:** Minor performance concern — the function will be called on every job UPDATE (status changes, route_order changes, etc.) but will no-op unless `arrived_at` changes. In a system with frequent job updates, this adds unnecessary trigger overhead.

---

## Low Findings

### C4-F8 | LOW | Banner queries don't filter by notification age

**Files:** `CustomerNotificationBanners.tsx`, `ProviderNotificationBanners.tsx`

Both banner components query all unread notifications of the matching types with no age filter. If a user never dismisses a notification, it will show as a banner indefinitely (or until `read_at` is set).

Consider adding a `created_at > now() - interval '7 days'` filter or equivalent `.gt("created_at", sevenDaysAgo)` on the query.

---

### C4-F9 | LOW | Provider banner reads `n.data` but column may be `metadata` or `payload`

**File:** `ProviderNotificationBanners.tsx:38`

```typescript
const slaData = n.data as Record<string, unknown> | null;
```

The query selects `data` from the notifications table. The processor writes `data: payload` (the raw event payload) into the notifications table. This should work if the notifications table has a `data` column. Verify this matches the actual column name in the schema — the processor writes it as `data: payload` in the insert.

---

## Payload ↔ Template Cross-Reference (All C4 Events)

| Event Type | Template Key | Template Placeholders | Payload Keys | Match? |
|---|---|---|---|---|
| `CUSTOMER_SERVICE_CONFIRMED` | `customer_service_confirmed` | `{{day_of_week}}` | `day_of_week`, `service_window` | ✅ |
| `CUSTOMER_SERVICE_REMINDER_24H` | `customer_reminder_24h` | *(none in body)* | `job_id`, `scheduled_date` | ✅ |
| `CUSTOMER_PROVIDER_EN_ROUTE` | `customer_provider_en_route` | *(none in body)* | `job_id`, `scheduled_date` | ✅ |
| `CUSTOMER_JOB_STARTED` | `customer_job_started` | *(none in body)* | `job_id`, `address` | ✅ |
| `CUSTOMER_RECEIPT_READY` | `customer_receipt_ready` | *(none in body)* | `job_id`, `completed_at` | ✅ |
| `CUSTOMER_ISSUE_STATUS_CHANGED` | `customer_issue_status_changed` | `{{new_status}}`, CTA: `{{ticket_id}}` | `issue_id`, `job_id`, `new_status`, `resolution_note` | ❌ CTA `{{ticket_id}}` unresolved |
| `PROVIDER_PAYOUT_POSTED` | `provider_payout_posted` | `{{amount}}` | `payout_id`, `amount_cents` | ❌ `{{amount}}` unresolved |
| `PROVIDER_ROUTE_UPDATED` | *(missing)* | N/A | `date`, `job_count` | ❌ No template |

---

## Structural Assessment

### What's Working Well
1. **RPC emit pattern is correct** — Events are emitted inside the same transaction as the state change, ensuring consistency
2. **Idempotency keys are unique per entity** — `receipt_ready:job_id`, `job_started:job_id`, etc.
3. **en_route via trigger is the right choice** — Since `arrived_at` is set from the frontend, a trigger avoids the need for the frontend to call a service-role-only RPC
4. **send-reminders is cron-ready** — Idempotent, logs runs, handles empty job sets
5. **Banner components are clean** — Optimistic dismiss, 60s polling, proper empty-state handling
6. **Dashboard integration is minimal and correct** — Banners placed above content, no logic leakage

### What Needs Fixing Before C5
1. **C4-F1** (CRITICAL) — Add `PROVIDER_ROUTE_UPDATED` template
2. **C4-F2** (CRITICAL) — Fix `amount_cents` → `amount` in payout payload
3. **C4-F3** (HIGH) — Fix `ticket_id` → `issue_id` in CTA route template
4. **C4-F4** (MEDIUM) — Fix `check-no-shows` to emit `CUSTOMER_PROVIDER_REASSIGNED`

---

## Updated Finding Tracker (Cumulative)

| ID | Severity | Status | Description |
|----|----------|--------|-------------|
| C4-F1 | CRITICAL | Open | PROVIDER_ROUTE_UPDATED template missing |
| C4-F2 | CRITICAL | Open | Payout notification: `{{amount}}` vs `amount_cents` mismatch |
| C4-F3 | HIGH | Open | Issue CTA: `{{ticket_id}}` vs `issue_id` mismatch |
| C4-F4 | MEDIUM | Open | check-no-shows still uses wrong event type (C2-F4 regression) |
| C4-F5 | MEDIUM | Acceptable | send-reminders has no auth (OK for cron-only) |
| C4-F6 | MEDIUM | Open | cron_run_log table may not exist in migrations |
| C4-F7 | MEDIUM | Open | en_route trigger should use WHEN clause for efficiency |
| C4-F8 | LOW | Open (minor) | Banners have no age filter |
| C4-F9 | LOW | Open (minor) | Provider banner `n.data` column name needs verification |

**Recommended next step:** Have Lovable fix C4-F1 through C4-F4 (the 2 criticals, 1 high, and 1 medium regression), then proceed to Sprint C5.
