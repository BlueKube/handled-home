# Round 2C — Notifications & Messaging System (Expanded Spec)

**Purpose:** Make Handled Home feel *alive*, trustworthy, and self-running by delivering the right information to the right person at the right time—without creating support load or enabling off-platform leakage.

This spec is intentionally **automation-first**, **backend-truth**, and **audit-ready** so it scales to “Uber-like” reliability across cities.

---

## Round 2C Decisions (Source of Truth)

### C1) Source of truth
- **Backend is the source of truth** for notification creation and delivery state.
- Frontend may *request* actions, but backend writes notification records (consistent + retryable).

### C2) Architecture approach
- Implement a **lightweight event bus** now (not an overbuilt distributed system):
  - `notification_events` table as the canonical queue
  - A single processor edge function `process-notification-events`
  - Idempotency keys to prevent duplicates

### C3) Channels in MVP
- **MVP:** In-app + Push
- **Also included:** Email for critical items (payments/dunning, security, legal acceptance, receipt link fallback)
- **Optional / later:** SMS only for high-urgency scenarios (off by default)

### C4) Preferences model
- **3 broad user toggles:**
  - **Critical** (cannot disable): security, payment failures, subscription paused/canceled, major schedule changes
  - **Service Updates** (default on): reminders, “on the way,” receipt ready, issue updates
  - **Marketing & Referrals** (default off; recommended for early trust)
- Quiet hours default 9pm–8am local, except Critical.

### C5) No direct customer↔provider chat in Round 2C
- Do **not** ship free-form chat (privacy risk, support load, disintermediation).
- Use structured issue flows and system updates instead.

### C6) Anti-disintermediation
- Basic detection/redaction of phone/email/links on any provider/customer message surfaces that exist (e.g., issue notes).
- Keep communications anchored to receipts and policy-based issue handling.

### C7) “En route” communications
- Yes, but **coarse** and **state-based**, not GPS live tracking:
  - `EN_ROUTE` → “On the way”
  - `ARRIVED` / `STARTED` → “Started”
  - `COMPLETED` → “Receipt ready”

### C8) Rate limits + digest
- Rate limit non-critical notifications per user per day and per type.
- If exceeded, convert to **digest** (in-app) and suppress push.

### C9) Tone
- **Premium concierge** tone: calm, confident, short, action-oriented.
- Always include a clear CTA when relevant.

### C10) Marketing/referral nudges in Round 2C
- **Include the plumbing** (channel + templates + preferences), but ship only **light-touch** marketing notifications initially.
- Keep early focus on operational trust; marketing expands once receipts feel “flex-worthy.”

---

## Goals & Non-Goals

### Goals
- Make customers feel “my home is handled” via timely updates.
- Reduce inbound support by pre-answering questions.
- Keep providers on track and reduce missed jobs with smart prompts.
- Give admins only exception alerts (not noise).
- Ensure every automation-triggered change is explainable in one sentence.

### Non-goals (explicitly excluded in Round 2C)
- Real-time GPS tracking feed
- Open customer-provider chat
- Complex segmentation/personalization engines
- Full marketing automation suite

---

## System Overview

### Concepts
- **Notification Event**: A queued “thing that happened” that should notify someone (e.g., job assigned, payment failed).
- **Notification**: A user-visible record (in-app inbox item) that may also trigger push/email.
- **Delivery Attempt**: A channel attempt (push/email), with status and error tracking.

### Data flow (high-level)
1. Module automation or user action emits `notification_events` row
2. `process-notification-events` picks it up
3. Processor evaluates:
   - audience + template
   - preferences + quiet hours
   - rate limits + dedupe
4. Processor writes `notifications` row
5. Processor triggers channel sends:
   - Push provider (FCM/APNs via provider)
   - Email provider (provider)
6. Processor records results in `notification_delivery` and marks event processed

---

## Database Schema (Proposed)

### 1) `notification_events` (queue / event bus)
- `id` uuid pk
- `idempotency_key` text unique (required)
- `event_type` text (enum-like)
- `audience_type` text: `CUSTOMER | PROVIDER | ADMIN`
- `audience_user_id` uuid nullable (when targeting a single user)
- `audience_org_id` uuid nullable (provider org targeting)
- `audience_zone_id` uuid nullable (admin alerts by zone)
- `priority` text: `CRITICAL | SERVICE | MARKETING`
- `payload` jsonb (event-specific data)
- `scheduled_for` timestamptz (default now)
- `status` text: `PENDING | PROCESSING | PROCESSED | FAILED | DEADLETTER`
- `attempt_count` int default 0
- `last_error` text nullable
- `created_at` timestamptz default now
- `processed_at` timestamptz nullable

**Idempotency rule:** every upstream emitter must compute deterministic keys, e.g.:
- `job_assigned:{job_id}:{provider_org_id}:{assignment_version}`
- `receipt_ready:{job_id}`
- `dunning_step:{subscription_id}:{step}`

### 2) `notifications` (in-app inbox)
- `id` uuid pk
- `user_id` uuid (target user)
- `priority` text: `CRITICAL | SERVICE | MARKETING`
- `title` text
- `body` text
- `cta_label` text nullable
- `cta_route` text nullable (in-app deep link route)
- `image_url` text nullable (future)
- `context_type` text nullable (e.g., `JOB`, `SUBSCRIPTION`, `ISSUE`)
- `context_id` uuid nullable
- `read_at` timestamptz nullable
- `created_at` timestamptz default now
- `expires_at` timestamptz nullable
- `source_event_id` uuid fk → `notification_events.id`

### 3) `notification_delivery` (per channel attempt)
- `id` uuid pk
- `notification_id` uuid fk → `notifications.id`
- `channel` text: `PUSH | EMAIL | SMS`
- `status` text: `QUEUED | SENT | FAILED | SUPPRESSED`
- `provider_message_id` text nullable
- `error_code` text nullable
- `error_message` text nullable
- `attempted_at` timestamptz default now

### 4) `user_notification_preferences`
- `user_id` uuid pk
- `critical_enabled` bool default true (cannot be disabled in UI)
- `service_updates_enabled` bool default true
- `marketing_enabled` bool default false
- `quiet_hours_enabled` bool default true
- `quiet_hours_start` time default '21:00'
- `quiet_hours_end` time default '08:00'
- `timezone` text nullable
- `updated_at` timestamptz default now

### 5) `user_device_tokens`
- `id` uuid pk
- `user_id` uuid
- `platform` text: `IOS | ANDROID`
- `push_provider` text: `FCM | APNS`
- `token` text unique
- `status` text: `ACTIVE | DISABLED`
- `last_seen_at` timestamptz nullable
- `created_at` timestamptz default now

### 6) `notification_rate_limits` (optional config table)
- `priority` text
- `max_per_day` int
- `max_per_hour` int
- `updated_at` timestamptz

### 7) `notification_templates` (optional, recommended)
- `id` uuid pk
- `template_key` text unique
- `priority` text
- `audience_type` text
- `title_template` text
- `body_template` text
- `cta_label_template` text nullable
- `cta_route_template` text nullable
- `enabled` bool default true
- `updated_at` timestamptz

---

## Edge Functions / RPCs (Proposed)

### Core processor: `process-notification-events`
- Runs on cron (every 1–5 minutes) and supports manual admin trigger.
- Claims due PENDING events with SKIP LOCKED.
- Validates payload schema per event_type.
- Resolves audience → one or more user_ids.
- Applies preferences, quiet hours, and rate limits.
- Writes `notifications` rows (in-app inbox).
- Sends push/email when applicable.
- Records outcomes in `notification_delivery`.
- Marks events PROCESSED/FAILED with retries; DEADLETTER after max attempts.

### Device + preferences
- `register-device-token(user_id, platform, token)` upserts and sets ACTIVE.
- `update-notification-preferences(user_id, ...)` validates quiet hours and saves toggles.

### Admin utility
- `admin-trigger-notification(event_type, payload, audience)` writes an event with idempotency key prefix `admin:`.

### Standard emitters (examples)
- `emit_job_assigned(job_id, provider_org_id)`
- `emit_job_status_changed(job_id, new_status)`
- `emit_receipt_ready(job_id)`
- `emit_weather_event_created(weather_event_id)`
- `emit_dunning_step(subscription_id, step)`
- `emit_sla_level_changed(provider_org_id, zone_id, category, new_level)`

**Rule:** emitters must always provide deterministic idempotency keys.

---

## Notification Catalog (MVP)

### Customer — Critical
- Payment failed → CTA “Update payment”
- Subscription paused/canceled → CTA “Fix payment” / “Reactivate”
- Service day changed by weather/admin → CTA “View schedule”
- Security/account changes → CTA “Review security”

### Customer — Service Updates
- Service day confirmed → CTA “View plan”
- Reminder T-24h → CTA “View service details”
- Provider on the way (EN_ROUTE) → CTA “View visit”
- Job started → CTA “View visit”
- Receipt ready → CTA “View receipt”
- Issue update → CTA “View issue”

### Customer — Marketing (light-touch)
- “Invite neighbors” after 3 successful visits → CTA “Share” (optional, can be gated)

### Provider — Critical
- Today’s route changed (reassign/weather) → CTA “View jobs”
- Account restricted / SLA orange/red → CTA “View performance”

### Provider — Service Updates
- New jobs assigned → CTA “View jobs”
- No-show risk ping → CTA “Confirm status”
- Job reassigned away → CTA “View details”
- Payout posted / hold released → CTA “View earnings”

### Admin — Critical
- Zone backlog/unassigned spike → CTA “Open scheduling”
- SLA red providers in zone/category → CTA “Review providers”

### Admin — Service Updates
- Weather event pending approval → CTA “Review weather mode”
- Dunning spike/payment processor issue → CTA “Open billing ops”

---

## Templates & Copy Guidelines (Premium Concierge)

### Rules
- Calm, confident, short.
- Avoid shame wording.
- Always include a next step CTA.
- Never mention internal systems.

### Example templates
**Payment failed**
- Title: Action needed to keep your Service Day active
- Body: We couldn’t process your payment. Update your card to keep everything running smoothly.
- CTA: Update payment → `/customer/billing`

**Receipt ready**
- Title: Your home is handled
- Body: Your visit is complete. Your receipt and photos are ready.
- CTA: View receipt → `/customer/receipts/{job_id}`

**Provider new jobs**
- Title: New jobs added to your route
- Body: You’ve got {n} new stops on {date}. We kept them near your existing route.
- CTA: View jobs → `/provider/jobs`

---

## Preferences, Quiet Hours, Rate Limits

### Quiet hours
- Default 9pm–8am local.
- Critical ignores quiet hours.
- Service updates during quiet hours become in-app only or queued for morning.

### Rate limits (recommended)
- Customer Service: max 3 push/day; unlimited in-app.
- Customer Marketing: max 1/week.
- Provider Service: max 10 push/day (tune later).
- Admin Alerts: max 20/day; collapse into digest if exceeded.

### Digest behavior
- Combine multiple non-critical events into one in-app “Daily summary” notification and suppress extra pushes.

---

## Security & Abuse Controls

- Rate limit and captcha for anonymous endpoints that emit notifications (e.g., waitlist).
- Token invalidation handling and device unregister on logout (optional).
- PII redaction on any text fields where users can type notes (issue notes, etc.).

---

## Delivery Providers (Implementation Options)

### Push
- Use a provider supporting iOS + Android (commonly FCM).
- Store device tokens per user and platform.
- Separate dev/prod credentials to avoid test spam.

### Email
- Transactional provider for critical/fallback messages.
- Keep email content minimal; deep link into app.

### SMS (defer)
- Only for high-urgency exceptions with explicit opt-in.

---

## UI Requirements

### Customer/Provider Notification Center
- Inbox list: unread indicator, title/body, timestamp, CTA.
- Filters: All / Critical / Service / Marketing.
- Mark all read; pull to refresh; “You’re all set” empty state.

### Admin Alerts Center
- Similar inbox with zone/category tags and severity.

### Banner surfaces
- Payment failure banner
- Weather reschedule banner
- Provider SLA banner
**Rule:** banners should correspond to a notification record so state is consistent.

---

## Observability & Audit

- Log every event processed with outcomes (created/suppressed/failed).
- Log every delivery attempt with provider message ids and error messages.
- Admin “Notification health” view: failed sends, deadletters, processing latency.

---

## Acceptance Criteria (Definition of Done)

### System
- No duplicate notifications for same idempotency key.
- Processor is retry-safe (idempotent).
- Quiet hours and rate limits enforced.
- Delivery status is visible and debuggable.

### Customer
- Always informed about schedule, progress (coarse), receipt, and payment issues.
- No spam.

### Provider
- Always informed about job changes and required actions (SLA, route changes).
- Minimal noise.

### Admin
- Alerts only for exceptions requiring action.

---

## Implementation Sequencing (Suggested)

**Sprint C1 — Core data + inbox**
- Create tables: events, notifications, delivery, preferences, device tokens
- Build inbox UIs (customer/provider/admin)
- Device token registration

**Sprint C2 — Processor + push delivery**
- Implement `process-notification-events`
- Push integration + rate limits + quiet hours

**Sprint C3 — Critical flows**
- Payment failed/dunning, schedule changes, receipt ready

**Sprint C4 — Provider ops flows**
- Job assigned, route updated, no-show pings, SLA changes, payouts

**Sprint C5 — Light marketing hooks**
- Minimal “invite neighbors” gated after trust milestone

---

## Appendix: Starter Event Types
- CUSTOMER_SERVICE_CONFIRMED
- CUSTOMER_SERVICE_REMINDER_24H
- CUSTOMER_PROVIDER_EN_ROUTE
- CUSTOMER_JOB_STARTED
- CUSTOMER_RECEIPT_READY
- CUSTOMER_ISSUE_STATUS_CHANGED
- CUSTOMER_PAYMENT_FAILED
- CUSTOMER_SUBSCRIPTION_PAUSED
- CUSTOMER_SCHEDULE_CHANGED_WEATHER
- PROVIDER_JOBS_ASSIGNED
- PROVIDER_ROUTE_UPDATED
- PROVIDER_NO_SHOW_PING
- PROVIDER_SLA_LEVEL_CHANGED
- PROVIDER_PAYOUT_POSTED
- ADMIN_ZONE_ALERT_BACKLOG
- ADMIN_WEATHER_PENDING
- ADMIN_DUNNING_SPIKE
