

## Sprint C2: Processor + Push Proof — Implementation Plan

### Current State
- Sprint C0 (schema): Done — `notification_events`, `notification_delivery`, `notification_templates`, `notification_rate_limits`, `user_notification_preferences`, `user_device_tokens` all exist
- Sprint C1 (UI): Done except **2C-C1d** (preference toggles in Settings)
- `emit_notification_event()` RPC exists and is SECURITY DEFINER

### Tasks (3 items + 1 carryover)

---

**Task 1: 2C-C1d — Notification preference toggles** (carryover, S)

Add notification preference controls to customer and provider Settings pages:
- Read/upsert `user_notification_preferences` via existing `useNotificationPreferences` hook
- 3 toggles: Critical (locked on, disabled switch), Service Updates (default on), Marketing (default off)
- Quiet hours toggle + start/end time pickers
- Place in a "Notifications" section on both `src/pages/customer/Settings.tsx` and `src/pages/provider/Settings.tsx`

---

**Task 2: 2C-C2a — Build `process-notification-events` edge function** (XL)

Create `supabase/functions/process-notification-events/index.ts`:

1. **Claim events**: Query `notification_events` where `status = 'PENDING'` and `scheduled_for <= now()`, `FOR UPDATE SKIP LOCKED`, limit 50. Set status to `'PROCESSING'`.

2. **Resolve audience**: For each event:
   - `audience_user_id` set → single user
   - `audience_org_id` set → query `provider_members` for all user_ids in org
   - `audience_zone_id` set → query based on event type (admin users with role, or customers with properties in zone)

3. **Apply preferences**: For each resolved user_id:
   - Fetch `user_notification_preferences` (or use defaults if no row)
   - If priority is `CRITICAL` → always deliver
   - If priority is `SERVICE` → check `service_updates_enabled`
   - If priority is `MARKETING` → check `marketing_enabled`
   - Skip if preference disabled

4. **Apply quiet hours**: If `quiet_hours_enabled` and current user-local time is within quiet window and priority is not `CRITICAL`:
   - In-app notification still created (silent)
   - Push/email suppressed (delivery record with status `SUPPRESSED`)

5. **Apply rate limits**: Query `notification_rate_limits` for the priority+audience_type. Count today's deliveries for this user+priority. If exceeded → suppress push, still create in-app.

6. **Resolve template**: Look up `notification_templates` by `event_type`. Interpolate `payload` fields into `title_template` and `body_template` using simple `{{key}}` replacement. Fall back to raw payload `title`/`body` if no template found.

7. **Write notifications**: Insert into `notifications` table with all fields (priority, title, body, cta_label, cta_route, context_type, context_id, source_event_id).

8. **Write delivery records**: Insert into `notification_delivery` for each channel attempted. Push channel → status `QUEUED` (actual send deferred to C2c). Email → `QUEUED` (deferred to C5).

9. **Mark event**: Set status to `PROCESSED`, `processed_at = now()`. On error: increment `attempt_count`, set `last_error`. If `attempt_count >= 3` → set `DEADLETTER`.

10. **Idempotency**: Use `cron_run_log` for batch-level idempotency. Event-level idempotency via `source_event_id` uniqueness on notifications.

11. **Config**: Add to `supabase/config.toml` with `verify_jwt = false`.

---

**Task 3: 2C-C2b — Device token registration hook** (M)

Create `src/hooks/useDeviceToken.ts`:
- Uses Capacitor Push Notifications plugin to get token
- Upserts to `user_device_tokens` with platform detection (IOS/ANDROID/WEB)
- Sets `push_provider = 'FCM'`
- On logout: update token status to `DISABLED`
- Called from `AuthContext` on login/app resume

---

**Task 4: 2C-C2c — Test push pipe proof** (M)

Extend `process-notification-events` to attempt FCM send for `QUEUED` push deliveries:
- Read `FCM_SERVER_KEY` from secrets (will need to add via `add_secret`)
- For each user with active device tokens, POST to FCM HTTP v1 API
- Update `notification_delivery` status to `SENT` or `FAILED` with error details
- If no `FCM_SERVER_KEY` configured: log warning, leave delivery as `QUEUED`, don't fail the event

---

### Execution Order
1. Task 1 (preference toggles) — no dependencies, quick win
2. Task 2 (processor edge function) — core of the sprint
3. Task 3 (device token hook) — needed before push can work
4. Task 4 (FCM integration) — depends on Task 2 + 3 + secret

### Post-Implementation
- Run n8n code review workflow on the edge function
- Update `tasks.md` progress

