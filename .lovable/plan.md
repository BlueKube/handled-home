

# Sprint C5 Review — Fix Plan

## Findings to Fix

| ID | Severity | Action |
|----|----------|--------|
| C5-F1 | CRITICAL | Add `SKIPPED` to delivery status CHECK constraint |
| C5-F2 | HIGH | Add `escapeHtml` helper, escape title/body in email HTML |
| C5-F3 | HIGH | Parallelize email lookups with `Promise.all` |
| C5-F4 | MEDIUM | Add fetch failure handling in processor |
| C5-F6 | MEDIUM | Add FK on `notification_digests.user_id` → `profiles(id)` |
| C5-F7 | MEDIUM | Filter `notification_delivery_daily` view to exclude QUEUED rows |
| C5-F5 | MEDIUM | Acceptable for MVP — skip |
| C5-F8 | LOW | Verify recharts — already in dependencies (confirmed) |
| C5-F9 | LOW | Acceptable — skip |

## Implementation

### 1. Migration (C5-F1, C5-F6, C5-F7)

Single migration file:

```sql
-- C5-F1: Add SKIPPED to delivery status constraint
ALTER TABLE notification_delivery DROP CONSTRAINT notification_delivery_status_check;
ALTER TABLE notification_delivery ADD CONSTRAINT notification_delivery_status_check
  CHECK (status IN ('QUEUED','SENT','FAILED','SUPPRESSED','SKIPPED'));

-- C5-F6: Add FK on notification_digests.user_id
ALTER TABLE notification_digests
  ADD CONSTRAINT notification_digests_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- C5-F7: Fix daily view to exclude unprocessed rows
CREATE OR REPLACE VIEW notification_delivery_daily
WITH (security_invoker = true) AS
SELECT
  date_trunc('day', attempted_at)::date AS delivery_date,
  channel,
  status,
  count(*)::int AS count
FROM notification_delivery
WHERE attempted_at >= now() - interval '7 days'
  AND status != 'QUEUED'
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 2, 3;
```

### 2. Edge Function Update — `process-notification-events/index.ts` (C5-F2, C5-F3, C5-F4)

**C5-F2:** Add `escapeHtml` function, wrap `notif.title` and `notif.body` in the HTML template.

**C5-F3:** Replace sequential `for` loop with `Promise.all`:
```typescript
await Promise.all(userIds.map(async (uid) => {
  const { data } = await supabase.auth.admin.getUserById(uid);
  if (data?.user?.email) emailMap.set(uid, data.user.email);
}));
```

**C5-F4:** Add failure handling after `fetch`:
```typescript
if (!res.ok) {
  const ids = deliveries.map(d => d.delivery_id);
  await supabase
    .from("notification_delivery")
    .update({ status: "FAILED", error_message: `send-email returned ${res.status}` })
    .in("id", ids);
}
```

### 3. Documentation

- Save review to `docs/2e-sprint-c5-review.md`
- Update `docs/tasks.md` marking C5 findings resolved

