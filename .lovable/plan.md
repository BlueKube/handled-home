

## Sprint C2/C3 Code Review Fixes

Claude Code's review is accurate across all 13 findings. No misunderstandings — every bug maps to real code.

### Fixes to implement now (F1–F8)

**F1 — CRITICAL** `resolveAudience` casing: Lines 387/395 compare `"admin"`/`"provider"` but DB stores `"ADMIN"`/`"PROVIDER"`. Fix to uppercase.

**F2 — CRITICAL** Device token status casing: `useDeviceToken.ts` line 51 writes `"active"`, processor line 508 queries `"active"`. DB constraint requires `"ACTIVE"`. Fix both sides.

**F3 — CRITICAL** Template seeding migration missing. Create migration inserting 18 templates from the expanded spec.

**F4 — HIGH** `check-no-shows` emits `CUSTOMER_SCHEDULE_CHANGED_WEATHER` for provider reassignment. Create `CUSTOMER_PROVIDER_REASSIGNED` event type and template.

**F5 — HIGH** `useDeviceToken` never mounted. Add call in `ProtectedRoute.tsx` or `AppLayout.tsx` (runs after auth).

**F6 — HIGH** `claim_notification_events` RPC missing. Create migration with `FOR UPDATE SKIP LOCKED`.

**F7 — HIGH** `max_per_hour` rate limit fetched but never checked. Add hourly count query after daily check.

**F8 — MEDIUM** Token not stored in ref for logout disable. Store token value in `useRef`, use it to update status on logout.

### Defer (as Claude Code recommends)

- **F9** (zone context in admin backlog) — nice-to-have, minor payload enrichment
- **F10** (payload validation) — log warning for missing template fields
- **F11** (FCM v1 migration) — tracked, not blocking MVP
- **F12** (PROVIDER_ROUTE_UPDATED) — Sprint C4 scope
- **F13** (timezone quiet hours) — Sprint C5 scope

### Implementation order

1. Migration: seed 18 templates + create `claim_notification_events` RPC (F3, F6)
2. Fix `process-notification-events/index.ts` — casing F1, status F2, hourly rate limit F7
3. Fix `useDeviceToken.ts` — status casing F2, ref storage F8
4. Fix `check-no-shows/index.ts` — event type F4
5. Mount `useDeviceToken` in app layout (F5)
6. Save review doc to `docs/` for reference
7. Update `tasks.md`

