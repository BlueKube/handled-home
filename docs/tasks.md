# Handled Home — Round 2 Task List

> **Source of truth for all implementation work.**  
> Round 1 completed all 14 module specs. Round 2 fills every gap, replaces every placeholder, and builds the automation + viral engine that makes this a billion-dollar self-running business.

**Legend:**  
- `[ ]` = To do  
- `[x]` = Done  
- **P0** = Must-have (blocks users or revenue)  
- **P1** = Should-have (blocks scale or automation)  
- **P2** = Nice-to-have (polish, future moats)  
- **Complexity:** S = hours, M = half-day, L = full day, XL = multi-day  

---

## Round 2A — Fix Placeholders & Complete Core Flows

> Replace all placeholder pages. Wire static shells to live data. No user should ever see "Coming Soon."

- [x] **2A-01** | P0 | M | Replace `provider/Dashboard` with live data (today's jobs count, est. time from `jobs` table, upcoming jobs list, earnings summary)
- [x] **2A-02** | P0 | L | Build `provider/Performance` — on-time %, redo rate, photo compliance %, avg time on site, SLA status from `provider_health_snapshots`
- [x] **2A-03** | P0 | L | Build `provider/Organization` — org profile edit, team member list (invite/remove), insurance status, licensing from `provider_orgs` + `provider_members` + `provider_compliance`
- [x] **2A-04** | P0 | L | Build `provider/Coverage` — zone coverage map, SKU authorization toggles, daily capacity settings from `provider_coverage` + `provider_capabilities`
- [x] **2A-05** | P0 | L | Build `provider/Earnings` — per-job earnings list, weekly/monthly summaries, payout history, hold status from `provider_earnings` + `provider_payouts`
- [x] **2A-06** | P0 | XL | Build `customer/Build` — redirects to existing Routine flow (full bundle builder already implemented)
- [x] **2A-07** | P0 | L | Build `admin/Scheduling` — manual overrides, reschedule customers, weather event mode toggle, capacity view, override log
- [x] **2A-08** | P0 | XL | Build `admin/Reports` — MRR chart, churn rate, subscription breakdown pie, revenue per zone bar, job completion trends
- [x] **2A-09** | P0 | S | Remove `PlaceholderPage` component — all usages eliminated, component deleted
- [x] **2A-10** | P1 | S | Extract reusable `SparklineChart` component at `src/components/SparklineChart.tsx`

### 2A Cleanup (Claude Review Follow-ups)
- [x] **2A-C1** | S | Wire `SparklineChart` into `OpsCockpit.tsx` and `OpsZones.tsx` — replaced inline SVG `Sparkline` functions
- [x] **2A-C2** | S | Add error state UI to Provider pages (Dashboard, Performance, Coverage, Earnings) — `QueryErrorCard` component with retry
- [x] **2A-C3** | S | Fix `any` types in `Coverage.tsx` — replaced with `CoverageRow` and `CapabilityRow` interfaces
- [x] **2A-C4** | S | Add form validation to `Organization.tsx` — name required, phone format, ZIP format with inline errors
- [x] **2A-C5** | S | Add `useMemo` for balance calculations in `Earnings.tsx`
- [x] **2A-C6** | S | Update `tasks.md` tracker to reflect full 2A completion + cleanup

---

## Round 2B — Automation Engine (Business Runs Itself)

> Every human touchpoint gets a system. This is what eliminates employees.
> **Expanded spec:** `docs/round-2b-expanded-spec.md` — Primary+Backup model (D1), per zone+category exclusivity (D4), competition slider (D3).
> **Cross-cutting patterns:** Every automation table has `explain_customer`, `explain_provider`, `explain_admin` columns. Every action emits to `notifications` table. All batch functions use idempotency keys via `cron_run_log`.

### Sprint 0: Infrastructure + Admin UX Foundation
- [x] **2B-00** | P0 | M | Infrastructure tables — `notifications`, `cron_run_log`, `zone_category_providers` (Primary/Backup per zone+category with computed `performance_score` + `formula_version` + `computed_at`), `job_assignment_log` (with explainability columns). RLS policies for all.
- [x] **2B-00b** | P0 | S | Service week consumption — add `service_weeks_used` + dunning columns to `subscriptions`, add `latest_start_by` + `route_order` to `jobs`. Create `increment_service_week_usage` RPC.
- [x] **2B-00c** | P0 | S | Zone Provider Assignments UI — rebuild `ZoneProvidersPanel` to be category-aware with Primary/Backup guardrails (only 1 Primary per zone+category), performance_score display, confirmation dialogs.

### Sprint 1: Job Assignment Engine
- [x] **2B-01** | P0 | XL | Auto-assign jobs to providers — `auto_assign_job` RPC (Primary-first → Backup fallback by priority_rank + performance_score), `assign-jobs` edge function with idempotency, assignment log with explainability, provider notifications.
- [x] **2B-03** | P1 | L | Overflow handling — when Primary at capacity and no Backup: check adjacent days → create overflow event → flag admin. Customer notification with explain_customer.
- [x] **2B-04** | P1 | M | Provider no-show detection — `check-no-shows` edge function (hourly), auto-reassign via Backup pool, calm customer notification, reliability impact to provider.

### Sprint 2: Quality Enforcement
- [x] **2B-05** | P0 | L | SLA enforcement automation — `provider_sla_status` table, `evaluate-provider-sla` edge function (daily), threshold ladder (GREEN/YELLOW/ORANGE/RED), auto-generate enforcement actions + provider notifications.
- [x] **2B-06** | P1 | L | Auto-flag low-quality providers — RED for 2+ weeks → suspend in `zone_category_providers`, auto-promote highest Backup, notify admin.
- [x] **2B-07** | P1 | M | Photo quality validation — `validate-photo-quality` edge function (file size, dimensions, duplicate hash), provider notification on fail.

### Sprint 3: Billing Automation
- [x] **2B-08** | P0 | L | Automated dunning sequence — `dunning_events` table, `run-dunning` edge function (daily, 5-step ladder), escalating customer notifications, subscription pause/cancel.
- [x] **2B-09** | P1 | M | Auto-apply earned referral credits to next invoice — modify invoice generation RPC, customer notification with explain_customer.
- [x] **2B-10** | P1 | M | Auto-release provider earning holds — enhance `run-billing-automation`, provider notification with countdown.

### Sprint 4: Weather & Scheduling
- [x] **2B-11** | P0 | L | Weather mode — `weather_events` table with explainability, admin approve/resolve RPCs, customer/provider notifications.
- [x] **2B-12** | P1 | L | Auto-weather detection — `check-weather` edge function with WeatherAPI.com, advisory vs severe thresholds, PENDING event for admin approval. Requires WEATHER_API_KEY secret.
- [x] **2B-13** | P1 | M | Holiday calendar — `holiday_calendar` table, pre-seeded US federal holidays 2026-2027, `is_holiday()` helper RPC, job generation skip support.

#### Sprint 4 Review Fixes (10 findings)
- [x] **S4-F1** | Consolidated duplicate weather_events SELECT policies into single authenticated policy
- [x] **S4-F2** | Removed dead 'approved' status — approval goes straight to 'active' (documented as design intent)
- [x] **S4-F3** | Switched approve_weather_event + check-weather to use emit_notification() consistently
- [x] **S4-F4** | Fixed notification title/body swap — title uses event title, body uses explain_customer/explain_provider
- [x] **S4-F5** | Added missing 2027 Columbus Day + Veterans Day holidays
- [x] **S4-F6** | (Noted) WeatherAPI.com only supports query param auth — unavoidable
- [x] **S4-F7** | check-weather returns 400 error if WEATHER_API_KEY not configured (no silent no-op)
- [x] **S4-F8** | check-weather updates cron_run_log to 'failed' with error_message in catch block
- [x] **S4-F9** | Added composite index idx_weather_events_zone_status_dates for is_weather_affected performance
- [x] **S4-F10** | Scoped admin holiday_calendar policy (public SELECT remains, admin ALL for writes)

#### Sprint 4 Review Fix Round 2 (4 findings from rewrite)
- [x] **S4-F11** | Restored `jsonb` return type on approve_weather_event (affected_jobs count returned)
- [x] **S4-F12** | Restored job-based notification targeting (only customers/providers with scheduled jobs in date range)
- [x] **S4-F13** | Restored affected job count query for admin feedback
- [x] **S4-F14** | Verified emit_notification param names match function signature (p_user_id, p_type, p_title, p_body, p_data) — no issue

### Sprint 5: Zone Expansion
- [x] **2B-14** | P1 | L | Capacity-based zone expansion triggers — `expansion_suggestions` table, `evaluate-zone-expansion` edge function (weekly), admin review RPC, expansion metrics (capacity util, waitlist, ticket rate). Hook: `useExpansionSuggestions`.
- [x] **2B-15** | P1 | M | Waitlist system — `waitlist_entries` table, public signup with zone auto-match, `get_waitlist_summary` RPC, `notify_waitlist_on_launch` RPC. Hook: `useWaitlist` (join, summary, notify).
- [x] **2B-16** | P2 | L | Auto-zone creation support — expansion suggestion type `split_zone` triggers admin review. `evaluate-zone-expansion` auto-detects when waitlist threshold + capacity pressure warrant new zone creation. Admin approves via `review_expansion_suggestion` RPC.

#### Sprint 5 Review Fixes (6 findings)
- [x] **S5-F1** | HIGH | Moved waitlist signup to `join-waitlist` edge function with rate limiting (5/hr per email); removed public INSERT RLS policy
- [x] **S5-F2** | MEDIUM | Moved zip→zone lookup server-side into edge function — no zone boundary data leaked to client
- [x] **S5-F3** | MEDIUM | Added comment + `email_delivery: pending_external_integration` to `notify_waitlist_on_launch` return payload acknowledging external email needed
- [x] **S5-F4** | MEDIUM | Added `has_role(auth.uid(), 'admin')` check to `review_expansion_suggestion`
- [x] **S5-F5** | MEDIUM | Added `p_decision IN ('approved', 'rejected')` validation to `review_expansion_suggestion`
- [x] **S5-F6** | MEDIUM | Added `has_role(auth.uid(), 'admin')` check to `notify_waitlist_on_launch` and `get_waitlist_summary`

### Sprint 6: Route Optimization
- [x] **2B-02** | P1 | XL | Route optimization — `optimize-routes` edge function (nearest-neighbor using geohash/lat-lng from properties), `reorder_provider_route` RPC (provider manual reorder with audit logging), provider UI with "Optimize Route" button + up/down reorder controls, jobs sorted by `route_order`, "Next" stop indicator. Logs to `cron_run_log` for observability.
- [x] **2B-02h** | P1 | S | Sprint 6 hardening — minimum-jobs guard (< 3 = skip optimization), IN_PROGRESS freeze (pinned jobs excluded from optimization + reorder), old_route_order logged in audit trail, reorder arrows disabled on in-progress jobs in UI.

## Round 2C — Notifications & Messaging

> Users can't love what they forget about. Every critical event needs a notification.
> **Expanded spec:** `docs/round-2c-expanded-spec.md` — Event bus architecture, priority tiers (Critical/Service/Marketing), quiet hours, rate limits, PII scrubbing.
> **Architecture:** `notification_events` table as async event bus → `process-notification-events` edge function → `notifications` inbox + channel delivery (Push/Email/SMS). All emitters use `emit_notification_event()` RPC with deterministic idempotency keys.

### Sprint C0: Schema Foundation
- [x] **2C-C0a** | P0 | L | Create `notification_events` table (event bus/queue) — idempotency_key unique, status state machine (PENDING→PROCESSING→PROCESSED/FAILED/DEADLETTER), priority tiers, audience targeting (user/org/zone), scheduled_for support. RLS: admin-only + SECURITY DEFINER RPCs.
- [x] **2C-C0b** | P0 | M | Enhance existing `notifications` table — add priority, cta_label, cta_route, context_type, context_id, expires_at, source_event_id FK. Enable realtime. Clean up duplicate INSERT policies.
- [x] **2C-C0c** | P0 | M | Create `notification_delivery` table — per-channel attempt tracking (PUSH/EMAIL/SMS), status (QUEUED/SENT/FAILED/SUPPRESSED), provider_message_id, error tracking. RLS: users read own via notification join.
- [x] **2C-C0d** | P0 | S | Create `user_notification_preferences` table — 3-tier toggles (critical always-on, service default-on, marketing default-off), quiet hours (21:00-08:00 default), timezone. RLS: users manage own.
- [x] **2C-C0e** | P0 | S | Create `user_device_tokens` table — platform (IOS/ANDROID/WEB), push_provider (FCM/APNS), token unique, status (ACTIVE/DISABLED). RLS: users manage own.
- [x] **2C-C0f** | P0 | S | Create `notification_rate_limits` config table — per priority+audience_type limits (max_per_day, max_per_hour). Seeded with defaults.
- [x] **2C-C0g** | P0 | S | Create `notification_templates` table — template_key unique, event_type mapping, title/body/cta templates, channels array, version. Template seeding deferred to C3.
- [x] **2C-C0h** | P0 | S | Create `emit_notification_event()` RPC — SECURITY DEFINER, idempotent via ON CONFLICT DO NOTHING, accepts all audience targeting params.
- [x] **2C-C0i** | P0 | S | Create PII scrubber utility (`src/lib/piiScrubber.ts`) — regex-based phone/email/URL detection + replacement. `scrubPii()` returns cleaned text + counts. `containsPii()` for boolean checks. 9 unit tests passing.

### Sprint C1: Notification Center UI
- [x] **2C-C1a** | P0 | M | Build `useNotifications` hook — fetch user's notifications with realtime subscription, unread count, mark-read mutation, mark-all-read. Server-side priority filter, error toasts on mutations.
- [x] **2C-C1b** | P0 | L | Build AppHeader bell icon with unread badge — slide-out panel with loading skeleton, "View all" link to full-screen inbox. Hook hoisted to Bell, passed as props to Panel (single realtime channel).
- [x] **2C-C1c** | P0 | M | Build `/notifications` full-screen inbox route — priority tabs with server-side filtering, CTA deep links, load-more pagination, "No notifications" empty state. Ungated for customers.
- [x] **2C-C1d** | P1 | S | Add notification preference toggles to customer + provider Settings pages.

#### Sprint C1 Review Fixes (9 findings — all resolved)
- [x] **C1-F1** | MEDIUM | Hoisted useNotifications to NotificationBell, passed as props to Panel — eliminated duplicate realtime subscriptions
- [x] **C1-F2** | MEDIUM | Removed CustomerPropertyGate from /customer/notifications route
- [x] **C1-F3** | MEDIUM | Moved priority filter server-side in useNotifications hook
- [x] **C1-F4** | LOW | Added loading skeleton to NotificationPanel
- [x] **C1-F5** | LOW | Added onError toast to markRead/markAllRead mutations
- [x] **C1-F6** | LOW | Replaced ChevronRight with Switch on dark mode toggle
- [x] **C1-F7** | LOW | Removed redundant Dashboard entry from provider MoreMenu
- [x] **C1-F8** | LOW | Fixed admin MoreMenu icons
- [x] **C1-F9** | LOW | Replaced <a href> with <Link to> on NotFound page

### Sprint C2: Processor + Push Proof
- [x] **2C-C2a** | P0 | XL | Build `process-notification-events` edge function — claim PENDING events (SKIP LOCKED), resolve audience, apply preferences + quiet hours + rate limits, write notifications + delivery records, mark events PROCESSED/FAILED, retry logic (max 3 attempts → DEADLETTER).
- [x] **2C-C2b** | P1 | M | Device token registration — `useDeviceToken` hook for Capacitor push registration, upsert to `user_device_tokens`, disable on logout.
- [x] **2C-C2c** | P1 | M | Test push pipe proof — minimal FCM send in processor (requires FCM_SERVER_KEY secret), delivery status tracking. Validates end-to-end push path.

### Sprint C3: Template Seeding + Critical Flows
- [x] **2C-C3a** | P0 | M | Seed notification templates — 18 MVP templates seeded (customer critical/service, provider critical/service, admin alerts) with premium concierge copy, CTA routes, channel config.
- [x] **2C-C3b** | P0 | L | Wire critical customer flows — CUSTOMER_PAYMENT_FAILED in run-dunning, CUSTOMER_SUBSCRIPTION_PAUSED at dunning step 3+, CUSTOMER_SCHEDULE_CHANGED_WEATHER in check-weather (severe only).
- [x] **2C-C3c** | P0 | M | Wire critical provider flows — PROVIDER_JOBS_ASSIGNED in assign-jobs (batched per org), PROVIDER_SLA_LEVEL_CHANGED in evaluate-provider-sla (ORANGE/RED only), PROVIDER_NO_SHOW_PING + PROVIDER_JOB_REASSIGNED in check-no-shows.
- [x] **2C-C3d** | P1 | M | Wire admin alerts — ADMIN_ZONE_ALERT_BACKLOG in assign-jobs (overflow≥3) + check-no-shows (no backup), ADMIN_WEATHER_PENDING in check-weather, ADMIN_DUNNING_SPIKE in run-dunning (≥5 events). All migrated from old emit_notification to emit_notification_event bus.

#### Sprint C2/C3 Review Fixes (10 findings — F1-F8 resolved round 1, F14-F15 resolved round 2, F9-F13 deferred)
- [x] **C23-F1** | CRITICAL | Fixed `resolveAudience` casing — compare `"ADMIN"`/`"PROVIDER"` (uppercase) to match DB values
- [x] **C23-F2** | CRITICAL | Fixed device token status — write `"ACTIVE"` not `"active"` in useDeviceToken + processor query
- [x] **C23-F3** | CRITICAL | Seeded 19 MVP notification templates via migration (including CUSTOMER_PROVIDER_REASSIGNED)
- [x] **C23-F4** | HIGH | check-no-shows now emits `CUSTOMER_PROVIDER_REASSIGNED` (not weather event) for reassignment
- [x] **C23-F5** | HIGH | Mounted `useDeviceToken` in `AppLayout.tsx` (runs after auth)
- [x] **C23-F6** | HIGH | Created `claim_notification_events` RPC with `FOR UPDATE SKIP LOCKED` + priority ordering
- [x] **C23-F7** | HIGH | Added `max_per_hour` enforcement in processor (hourly count query after daily check)
- [x] **C23-F8** | MEDIUM | Token stored in `useRef` for logout disable; marks token `DISABLED` on user logout
- [x] **C23-F14** | CRITICAL | Moved admin audience resolution outside `audience_zone_id` block — admin events with null zone_id now resolve all admin users
- [x] **C23-F15** | HIGH | Fixed 4 template placeholder mismatches: `{{failure_count}}`→`{{count}}`, `{{job_count}}`→`{{count}}`, weather body uses `{{zone_name}}`, check-no-shows lookups zone name instead of passing UUID

### Sprint C4: Service Update Flows
- [x] **2C-C4a** | P1 | M | Wire customer service updates — service_day_confirmed (confirm_service_day RPC), reminder_24h (send-reminders edge function), provider_en_route (DB trigger on jobs.arrived_at), job_started (start_job RPC), receipt_ready (complete_job RPC), issue_status_changed (admin_resolve_customer_issue RPC).
- [x] **2C-C4b** | P1 | M | Wire provider service updates — no_show_ping + job_reassigned (C3, check-no-shows), payout_posted (stripe-webhook transfer.paid), route_updated (optimize-routes). hold_released deferred (requires Stripe Connect account.updated → earnings flow, already emits status change but no dedicated notification).
- [x] **2C-C4c** | P1 | S | Banner surfaces — CustomerNotificationBanners (payment failure + weather reschedule) on customer dashboard, ProviderNotificationBanners (SLA orange/red) on provider dashboard. All tied to unread notification records.

### Sprint C4 Review Fixes
- [x] **C4-F1** | CRITICAL | Added missing `PROVIDER_ROUTE_UPDATED` template (was causing raw event name in notifications)
- [x] **C4-F2** | CRITICAL | Fixed payout payload: `amount_cents` → `amount` with dollar formatting `(total_cents / 100).toFixed(2)`
- [x] **C4-F3** | HIGH | Fixed issue CTA route template: `{{ticket_id}}` → `{{issue_id}}`
- [x] **C4-F4** | MEDIUM | Already fixed — `check-no-shows` correctly emits `CUSTOMER_PROVIDER_REASSIGNED` (reviewer had stale ref)
- [x] **C4-F7** | MEDIUM | Optimized en_route trigger with `WHEN` clause and `UPDATE OF arrived_at` column filter

### Sprint C5: Polish + Delivery Providers
- [x] **2C-C5a** | P2 | L | Email delivery infrastructure — `send-email` edge function with Resend integration (infrastructure-only: marks deliveries as SKIPPED when RESEND_API_KEY not configured, live sends when key present). Processor calls send-email for QUEUED EMAIL deliveries. Templates with `channels` including EMAIL will route through this pipe.
- [x] **2C-C5b** | P2 | M | Digest infrastructure — `digest_eligible` column on `notification_templates`, `notification_digests` table for per-user daily aggregation tracking. SERVICE-tier templates marked digest-eligible by default.
- [x] **2C-C5c** | P2 | S | Admin notification health view — `/admin/notification-health` page with: delivery stats (sent/failed/suppressed/queued last 24h), deadletter count, avg processing latency, 7-day delivery breakdown chart, deadletter investigation table. Backed by 3 database views (`notification_health_summary`, `notification_delivery_daily`, `notification_deadletters`).

#### Sprint C5 Review Fixes (6 findings resolved, 3 skipped)
- [x] **C5-F1** | CRITICAL | Added SKIPPED to notification_delivery status CHECK constraint
- [x] **C5-F2** | HIGH | Added escapeHtml helper, escape title/body in email HTML template
- [x] **C5-F3** | HIGH | Parallelized email lookups with Promise.all (was sequential for loop)
- [x] **C5-F4** | MEDIUM | Added fetch failure handling — marks deliveries FAILED on non-ok response or network error
- [x] **C5-F6** | MEDIUM | Added FK on notification_digests.user_id → profiles(id) ON DELETE CASCADE
- [x] **C5-F7** | MEDIUM | Filtered notification_delivery_daily view to exclude QUEUED rows
- [x] **C5-F5** | MEDIUM | Skipped — acceptable for MVP (single-worker processor)
- [x] **C5-F8** | LOW | Verified — recharts already in dependencies
- [x] **C5-F9** | LOW | Skipped — acceptable (views use security_invoker)

---

## Round 2D — Customer Experience Polish & Retention

> Make customers unable to imagine life without Handled Home.
> **Strategy doc:** `docs/round-2d-strategy.md` — Membership-first model, handles currency, contextual add-ons, Home Assistant category, density-first scheduling.
> **Key decisions:** Handles are the internal unit of value (simple usage bar UX). Plan changes default to next-cycle. Add-ons gated until after first completed visit. Ratings receipt-anchored.

### D-Pre: Plan Card & Handles UX Prototype
- [x] **2D-00pre** | P0 | S | Plan card + handles explanation prototype — design plan tier cards (Essential/Plus/Premium) with handles messaging ("Most homes use 10-13 handles/month", "Swap services anytime"). No backend, UX validation only. Components: `PlanCard` (redesigned with handles callout + tier highlights), `HandlesExplainer` (3-point education card), Plans page (membership-first copy), PlanDetail page (handles allowance + rollover cap + change policy).

### Sprint D0: Handles v0 (allowance + spend + expire + rollover)
- [x] **2D-00a** | P0 | L | Handles v0 schema — `plan_handles` (handles_per_cycle, rollover_cap, rollover_expiry_days per plan), `handle_transactions` ledger (type: grant/spend/expire/rollover/refund, amount, balance_after, reference columns). `handles_balance` on subscription as **cache only**, reconcilable from ledger via `recalc_handles_balance()` RPC. RPCs: `spend_handles` (at booking/confirmation), `grant_cycle_handles`, `expire_stale_handles`, `refund_handles` (preserves original expiry). No earn, no proration math.
- [x] **2D-00b** | P0 | M | Handles UI components — usage bar (Used/Remaining), per-SKU handle cost display ("Costs 3 handles"), handle balance on customer dashboard. All read from `get_handle_balance` RPC.
- [x] **2D-00c** | P0 | S | Plan tier handle configuration — admin sets handles_per_cycle, rollover_cap, rollover_expiry_days per plan. Display on plan cards.

#### Sprint D0 Review Fixes (7 findings — F1-F4/F6/F7 resolved, F5/F8/F9 acceptable/deferred)
- [x] **D0-F1** | CRITICAL | Fixed `expire_stale_handles` — now inserts 'expire' transactions (negative amounts) for expired grants instead of just recalculating
- [x] **D0-F2** | HIGH | Added auth check to `spend_handles` — caller must own subscription or be admin
- [x] **D0-F3** | HIGH | Added functional index `idx_handle_txn_idempotency` on `metadata->>'idempotency_key'`
- [x] **D0-F4** | MEDIUM | Added validation trigger `trg_validate_handle_txn_type` enforcing grant/spend/expire/rollover/refund
- [x] **D0-F5** | MEDIUM | Acceptable — `balance_after` concurrency mitigated by FOR UPDATE lock
- [x] **D0-F6** | MEDIUM | `HandleBalanceBar` now hidden when `handles_per_cycle === 0`
- [x] **D0-F7** | MEDIUM | Removed `as any` casts from `PlanHandlesEditor` insert/update
- [x] **D0-F8** | LOW | Acceptable — refund expiry lookup is best-effort heuristic with 60-day fallback
- [x] **D0-F9** | LOW | Deferred — cascade chain verified via subscription_id FK

### Sprint D1: Onboarding Wizard (membership-first)
- [x] **2D-01** | P0 | XL | Guided onboarding — property → zip/zone check (waitlist if unavailable) → plan selection (membership-first, handles explained simply) → subscribe → service day accept → build routine → confirmation. Progress bar, back nav.
- [x] **2D-02** | P0 | M | Zone availability check — zip lookup during onboarding, waitlist signup if no zone.
- [x] **2D-03** | P1 | M | Onboarding completion tracking — step tracking via `customer_onboarding_progress` table, persistent step state, auto-resume on return.

### Sprint D1 Review Fixes
- [x] **D1-F1** | CRITICAL | Wizard redirect only fires when onboarding is complete (currentStep=complete + routine completed), not just when subscription exists
- [x] **D1-F2** | HIGH | checkout=success polling — verifying loading state, refetchInterval on subscription query, auto-advance when sub appears
- [x] **D1-F3** | HIGH | CustomerPropertyGate only redirects truly new users (no property AND no sub history); churned customers access their account
- [x] **D1-F4** | MEDIUM | Steps 5-6 complete inline instead of navigating away from wizard
- [x] **D1-F5** | MEDIUM | Optimistic cache update in useOnboardingProgress prevents selectedPlanId null flash
- [x] **D1-F6** | MEDIUM | Removed unnecessary `as any` casts — uses proper type coercion for metadata Json field
- [x] **D1-F7** | MEDIUM | Added FK on user_id → auth.users(id) ON DELETE CASCADE
- [x] **D1-F8** | LOW | Removed misleading customer_id param from create-checkout-session call
- [x] **D1-F9** | LOW | Added validation trigger for current_step column values

### Sprint D1.5: Scheduling UX Polish (moved up — informs onboarding)
- [x] **2D-23** | P1 | M | System-recommended scheduling frame — service day assignment shows "Best for efficiency" default with "System Recommended" badge, efficiency-framed reason text. Optional "Try to align days" preference toggle with tradeoff messaging. When alignment isn't possible, shows server-provided `alignment_explanation`. Embedded in onboarding service-day step and standalone ServiceDay page. New `SchedulingPreferences` component. DB: `align_days_preference`, `must_be_home`, `must_be_home_window`, `updated_at` columns on `service_day_preferences`; `alignment_explanation` column on `service_day_assignments`.
- [x] **2D-24** | P2 | S | "Must be home" toggle — toggle with time window selector (morning/afternoon). When enabled, shows available windows. Notes potential handle cost increase in helper text. Persisted to `service_day_preferences` table. Available in onboarding wizard and standalone ServiceDay page.

### Sprint D2: Ratings & Reviews (receipt-anchored)
- [x] **2D-04** | P0 | L | Post-visit rating — prompt after customer views visit receipt/proof (not immediate post-job). 1-5 stars + optional comment. `visit_ratings` table. Receipt-anchored: rating card appears on VisitDetail page for COMPLETED jobs. `VisitRatingCard` component with 1-5 star selector, optional comment, word labels. `useVisitRating` hook with upsert. DB: `visit_ratings` table with unique(job_id, customer_id), CHECK(1-5), RLS (customer own + admin all), `provider_rating_summary` view (security_invoker).
- [x] **2D-05** | P1 | M | Rating summary on provider profile — average rating, total reviews, admin-visible. Added "Ratings" tab to admin ProviderDetail page showing avg_rating, total_reviews, positive (4-5★) and negative (1-2★) counts from `provider_rating_summary` view. `useProviderRatingSummary` hook.
- [x] **2D-06** | P2 | M | Smart rating prompts — suppress on first visit or if issue already reported. `useVisitRating` hook checks completed job count (≤1 = first visit) and customer_issues existence. Sets `is_suppressed = true` with `suppression_reason` ('first_visit' or 'issue_reported') on the visit_ratings row. Suppressed ratings excluded from `provider_rating_summary` view.

### Sprint D3: Property Health Score
- [x] **2D-07** | P1 | L | Health score algorithm — regularity, SKU coverage, seasonal adoption, issue frequency → 0-100. `compute_property_health_score` RPC (SECURITY DEFINER), `property_health_scores` table with RLS. Weighted: regularity 40%, coverage 25%, seasonal 15%, issue 20%.
- [x] **2D-08** | P1 | M | Dashboard widget with trend arrow. `PropertyHealthWidget` component with SVG score ring, color-coded labels (Excellent/Good/Fair/Needs Attention/Critical), sub-score breakdown, trend delta arrow. Auto-computes on load if stale >24h.
- [x] **2D-09** | P2 | M | Health score anxiety nudge on drop. `CUSTOMER_HEALTH_SCORE_DROP` notification template seeded. Nudge triggers via notification event bus when score drops.

### Sprint D4: Plan Self-Service (next-cycle default)
- [x] **2D-10** | P0 | L | Plan upgrade/downgrade — `schedule_plan_change` RPC with auth check, direction detection (upgrade/downgrade/lateral), `cancel_pending_plan_change` RPC. `PlanChangePanel` component with pending change banner.
- [x] **2D-11** | P0 | M | Cancellation flow — `cancel_subscription_with_reason` RPC with reason survey, 5-handle retention offer, `CancellationFlow` multi-step dialog (reason → offer → confirm).
- [x] **2D-12** | P1 | M | Subscription pause — `pause_subscription` / `resume_subscription` RPCs (1-4 weeks), `PausePanel` component with frozen handles messaging.

### Sprint D5a: Photo Storage (early — unblocks proof + ratings)
- [x] **2D-13** | P0 | L | Wire storage bucket — `job-photos` bucket already existed with RLS policies for provider upload (authenticated INSERT), customer/provider/admin SELECT via job ownership joins, signed URL display in customer gallery via `useCustomerVisitDetail`, provider upload via `useJobActions.uploadPhoto` with canvas compression. Validation via `validate-photo-quality` edge function.

### Sprint D5b: Photo Proof UI (after D2/D3 — ratings insights inform proof design)
- [x] **2D-14** | P1 | M | Before/after comparison view — `BeforeAfterSlider` component with pointer-drag slider, auto-detects `before`/`after` slot_key pairs from job photos. Integrated into `VisitDetail` page between photo gallery and work summary.
- [x] **2D-15** | P2 | M | Photo timeline — `usePropertyPhotoTimeline` hook fetches all UPLOADED photos across COMPLETED jobs for a property (limit 50), groups by visit date with SKU labels. `PhotoTimeline` component with grid thumbnails, full-screen viewer sheet. New `/customer/photos` route.

### Sprint D6: Contextual Add-ons
- [x] **2D-19** | P1 | L | Add-on catalog — SKUs flagged `is_addon`, contextual surfacing (season, weather, time-since-last), payable in $ or handles. "Need extra help?" card with 3-6 suggestions. **Gated:** only surfaced after first completed visit or user-initiated browse. DB: `is_addon` + `addon_triggers` columns on `service_skus`, `addon_orders` table with RLS. `useAddonSuggestions` hook with seasonal relevance scoring. `AddonSuggestionsCard` component on customer dashboard.
- [x] **2D-20** | P1 | M | Add-on checkout — one-tap purchase (deduct handles or charge card), creates one-off job. Refund hooks for system/provider cancellations (refund handles preserving original expiry). `purchase_addon` RPC (SECURITY DEFINER) with completed-visit gate, `refund_addon` RPC. `usePurchaseAddon` mutation hook. Bottom sheet purchase UI with handles/cash options.

### Sprint D7: Home Assistant Scaffolding
- [x] **2D-21** | P1 | L | Home Assistant SKU scaffolding — `provider_category = 'home_assistant'`, time-boxed SKUs (30/60/90 min), allowed/not-included checklists, customer prep requirements, privacy-safe proof rules. Members-only gate. DB: `provider_category`, `customer_prep`, `proof_rules`, `members_only` columns on `service_skus`. `home_assistant_windows` table with capacity tracking. `book_home_assistant` RPC. 5 starter SKUs seeded.
- [x] **2D-22** | P2 | M | Home Assistant booking — constrained to "next available 2-3 windows", time-boxed selection, member verification. No real-time dispatch. Premium feel, not Uber dispatch. `useHomeAssistant` hook suite. `HomeAssistantBooking` page at `/customer/home-assistant` with members-only gate, trust banner, window picker, handles/cash payment.

### Sprint D8: Private Customer Feedback + Provider Quality Score
> **PRD:** `docs/modules/15-private-feedback-provider-quality-score.md`
> Replaces original D8 (NPS/streaks/leaderboard). Two-channel feedback: immediate satisfaction check + delayed anonymous provider review. Provider Quality Score (rolling 28-day, weekly rollups). Admin full transparency. Provider-anonymous, admin-transparent.

- [x] **2D-16** | P0 | L | Quick satisfaction check — `visit_feedback_quick` table (GOOD/ISSUE outcome), receipt-anchored UI on VisitDetail page. "How did today's visit go?" with optional positive tags. ISSUE routes into existing issue flow. Admin sees immediately. `submit_quick_feedback` RPC (SECURITY DEFINER). `useQuickFeedback` hook. `QuickFeedbackCard` component.
- [x] **2D-17** | P0 | L | Delayed private provider review — `visit_ratings_private` table with scheduled_release_at (7-21 day randomized delay), privacy-first UI ("Providers won't know it's you"), 1-5 stars + tags + optional comment (public candidate after thresholds) + confidential note (admin only). One per job/customer. `submit_private_review` RPC. `usePrivateReview` hook. `PrivateReviewCard` component.
- [x] **2D-18** | P1 | L | Provider feedback rollups + Quality Score — `provider_feedback_rollups` (weekly aggregated, visibility gated by N_min=5), `provider_quality_score_snapshots` (rolling 28-day composite: rating 35%, issue rate 25%, photo compliance 20%, on-time 20%). `provider_quality_score_events` audit trail. Bands: GREEN 85-100, YELLOW 70-84, ORANGE 55-69, RED <55. Provider Quality Score page at `/provider/quality`. `useProviderQualityScore` hook.
- [x] **2D-19-new** | P1 | M | Admin feedback transparency — `/admin/feedback` page with full quick feedback + private ratings, confidential notes, issue counts. `useAdminFeedback` hook. 5 notification templates seeded (quick requested, review requested, issue flagged, rollup published, risk alert).

### Build Order
D-Pre → D0 → D1 → D1.5 → D4 → D5a → D2 → D3 → D5b → D6 → D7 → D8

---

## Round 2E — Provider Experience Polish (Supply Retention)

> Make it economically irrational for providers to leave.
> **PRDs:** `docs/prds/2e-*`

### Sprint E-01 — Provider Day Command Center
- [x] **2E-E01-01** | P0 | M | `provider_route_plans` table + `lock_provider_route` RPC — freezes route order, computes projected earnings/drive/work time. RLS for provider members + admin.
- [x] **2E-E01-02** | P0 | M | `useProviderRoutePlan` hook — fetches plan for today, exposes lock state, live stats fallback when unlocked.
- [x] **2E-E01-03** | P0 | M | Dashboard enhancements — projected earnings banner, est. drive/work time stats, "Start Route" lock button. Route locked indicator.
- [x] **2E-E01-04** | P0 | M | Jobs page — hide Optimize Route + reorder arrows when route is locked. Show "Locked" badge.
- [x] **2E-E01-F1** | Fix | `lock_provider_route` RPC — projected earnings now sums actual completed + (historical avg × remaining stops) instead of double-counting.
- [x] **2E-E01-F2** | Fix | `lock_provider_route` RPC — `total_stops` now counts all non-canceled jobs (including completed) for full-day picture.
- [ ] **2E-E01-F3** | P2 | Deferred | `unlock_provider_route` admin RPC for mid-day schedule changes — not urgent for E-01.

### Sprint E-02 — Earnings & Payout Trust
- [x] **2E-E02-01** | P0 | M | Day/week/month period selector on Earnings page with filtered queries
- [x] **2E-E02-02** | P1 | M | "At current pace" monthly projection card — remaining scheduled jobs × 30-day avg per job
- [x] **2E-E02-03** | P1 | M | Expandable earning cards with base/modifier/net breakdown, hold reason + release countdown
- [x] **2E-E02-F1** | Fix | Already resolved — provider_org_id filter added to earnings/payouts queries
- [x] **2E-E02-F2** | Fix | Monthly projection now uses dedicated MTD query, accurate regardless of period selector
- [x] **2E-E02-F3** | Fix | Balance query filters to unpaid statuses only (ELIGIBLE/HELD/HELD_UNTIL_READY) instead of all-time

### Sprint E-03 — Availability + Coverage
- [x] **2E-E03-01** | P0 | L | `provider_availability_blocks` table with RLS, validation trigger, calendar UI on Coverage page (create/cancel blocks with date pickers)
- [x] **2E-E03-02** | P0 | L | `auto_assign_job` RPC updated — skips providers with active DAY_OFF/VACATION blocks for job's scheduled_date (both PRIMARY and BACKUP loops)
- [x] **2E-E03-03** | P1 | M | Lead-time warnings — blocks starting within 48 hours flagged in UI with coverage confirmation message
- [x] **2E-E03-F1** | Fix | LIMITED_CAPACITY documented as informational-only with UI hint
- [x] **2E-E03-F2** | Fix | Added FK constraint on created_by_user_id → auth.users(id)
- [x] **2E-E03-F3** | Fix | Added gist exclusion constraint preventing overlapping active blocks
- [x] **2E-E03-F4** | Fix | cancelBlock adds provider_org_id guard + server-side updated_at trigger

### Sprint E-04 — BYOC / Founding Partner
- [x] **2E-E04-01** | P0 | L | `byoc_attributions` table + `byoc_bonus_ledger` + `provider_incentive_config` with RLS, unique constraints, FK references
- [x] **2E-E04-02** | P0 | XL | `compute_byoc_bonuses` RPC (weekly batch, admin-only), `activate_byoc_attribution` RPC (first-visit trigger), `admin_revoke_byoc_attribution` RPC
- [x] **2E-E04-03** | P1 | M | Provider "Founding Partner Program" UI — BYOC dashboard with active/pending counts, earned total, per-attribution progress bars, bonus window tracking

### Sprint E-05 — Tier System + Training Gates
- [x] **2E-E05-01** | P1 | L | `provider_tier_history` table + `evaluate_provider_tier` RPC (admin, SECURITY DEFINER). Tiers: gold (score ≥80, 2d hold, +2 priority), silver (60-79, 3d hold, +1), standard (<60, 5d hold, +0). `auto_assign_job` updated to factor tier modifier into backup ordering.
- [x] **2E-E05-02** | P1 | M | `provider_training_gates` table (provider_org_id + sku_id unique). Assignment engine skips providers with pending gates for job SKUs. Quality & Tier page shows tier badge, thresholds, pending/completed gates, and tier history.

---

## Round 2F — Growth Engine Activation (Viral Scaling)

> Every touchpoint is a growth opportunity. Viral by design.
> **Status: SKIPPED** — deferred to focus on Round 2G. Partial 2F work (2F-01 through 2F-04) was reverted.

### Neighborhood Social Proof
- [ ] **2F-01** | P1 | L | Neighborhood density widget — "X homes in your area use Handled Home" (zip-based density)
- [ ] **2F-02** | P1 | M | Post-job share prompt — after every completed job, with frequency cap + dismiss persistence
- [ ] **2F-03** | P2 | M | Neighborhood milestone notifications — tiered milestones (5/10/25/50/100)

### Viral Mechanics
- [ ] **2F-04** | P0 | M | Shareable proof cards — branded before/after with referral-embedded CTA
- [ ] **2F-05** | P1 | L | Referral compounding — multi-tier referral tracking. Cap at 2 levels
- [ ] **2F-06** | P1 | M | Provider customer acquisition bonus
- [ ] **2F-07** | P2 | M | Yard sign program

### Zone Launch Automation
- [ ] **2F-08** | P1 | XL | Automated zone launch playbook — when waitlist threshold hit: create zone → recruit providers → soft launch → ramp to open. Checklist-driven
- [ ] **2F-09** | P1 | L | Founding partner automation — founding partner providers get guaranteed income floor for first 90 days. Auto-calculate and pay difference if under floor
- [ ] **2F-10** | P1 | M | Launch zone marketing kit — auto-generate zone-specific landing page with: available services, pricing, founding member offer

### Referral Program Enhancements
- [ ] **2F-11** | P1 | M | Referral dashboard enhancements — show pending/earned/paid breakdown, referral tree visualization, total lifetime earnings from referrals
- [ ] **2F-12** | P2 | M | Seasonal referral campaigns — admin can create time-limited bonus multipliers on referral rewards
- [ ] **2F-13** | P2 | M | Corporate/HOA referral program — bulk invite with custom landing page, HOA-specific pricing tier

---

## Round 2G — Admin Controls / Ops Cockpit

> Admin sub-roles, dispatcher workstation, pricing/payout engine, governance/audit, decision traces, SOP playbooks.
> **Expanded spec:** `docs/2G/00-overview-and-ux.md`, `docs/2G/01-pricing-and-payout-engine.md`, `docs/2G/02-governance-audit-and-implementation.md`

### Sprint 2G-A — Access Control + Admin Shell
- [x] **2G-A1** | P0 | L | Create `admin_memberships` table (user_id PK, admin_role enum, is_active) + helper SQL functions (`is_admin_member`, `get_admin_role`, `has_admin_role`, `is_superuser`) + RLS policies (admin SELECT, superuser manage)
- [x] **2G-A2** | P0 | M | Gate all `/admin/*` routes by `admin_memberships` — created `useAdminMembership` hook with role checks (`isSuperuser`, `isOps`, `isDispatcher`, `isGrowthManager`, `hasAnyRole`)
- [x] **2G-A3** | P0 | L | Build `AdminShell` layout — desktop sidebar with 11 grouped nav sections (Cockpit, Execution, People, Markets, Catalog, Money, Growth, Support, Governance, Control Room, Playbooks), top command bar with search placeholder + ⌘K hint, responsive sidebar (collapsible icon mode)
- [x] **2G-A4** | P0 | M | Role-based nav and action gating — Control Room nav hidden for non-superusers, bottom tab bar hidden for admin (uses sidebar), admin routes use `AdminShell` instead of `AppLayout`

### Sprint 2G-B — Cockpit + Dispatcher Queues
- [x] **2G-B1** | P0 | XL | Upgrade Ops Cockpit to 4-column layout (Now/Money/Quality/Markets) with clickable drilldown tiles, sparklines, alert highlighting, dispatcher link badge
- [x] **2G-B2** | P0 | L | Build dispatcher queue page (`/admin/ops/dispatch`) — 6 tabbed queues (At Risk, Missing Proof, Unassigned, Coverage Gaps, Customer Issues, Provider Incidents) with counts, auto-refresh, job/issue rows
- [x] **2G-B3** | P1 | L | Dispatcher actions dialog — add internal note, mark needs-follow-up (updates job status + job_events), create support ticket (pulls customer_id from job). Hover "Action" button on queue rows
- [x] **2G-B4** | P1 | M | Universal search (⌘K command bar) — searches profiles (name/email/phone), provider_orgs (name), jobs (ID), subscriptions (ID). Grouped results with navigation. Wired into AdminShell command bar

### Sprint 2G-C — Governance + Explainability
- [x] **2G-C1** | P0 | L | Create `decision_traces` table + `log_admin_action` RPC — before/after state, reason, actor role. Standardized audit logging via SECURITY DEFINER RPC
- [x] **2G-C2** | P0 | L | Reusable `DecisionTraceCard` component — collapsible trace viewer showing inputs, candidates, scoring, outcome. Embedded in admin Job Detail (new "Trace" tab). Enhanced Audit page with before/after diff display
- [x] **2G-C3** | P1 | M | Wire `auto_assign_job` to emit decision traces — records all candidates (selected + rejected with reasons), scoring breakdown, and outcome at every decision point (primary, backup, overflow)

### Sprint 2G-D — Control Room (Superuser-Only)
- [x] **2G-D1** | P0 | XL | Zone pricing engine — `sku_pricing_base`, `sku_pricing_zone_overrides` tables with versioning. Admin UI for zone multipliers, bulk set, copy from zone, schedule effective dates, rollback. Superuser-only write RLS. Also created `provider_payout_base`, `provider_payout_zone_overrides`, `provider_org_contracts`, `payout_overtime_rules` tables + `get_effective_sku_price` / `get_effective_provider_payout` / `rollback_pricing_override` RPCs. **Review fixes:** D-F1/F2/F3/F4 (server-side RPCs with transactional safety, version incrementing, audit logging, reason enforcement), D-F5 (admin access check on effective price/payout RPCs), C-F3 (added `actor_admin_role` to audit log), D-F9 (fixed `rollback_pricing_override` to use new 7-arg `log_admin_action` signature)
- [x] **2G-D2** | P0 | XL | Provider payout engine UI — Admin UI for payout tables (base + zone overrides), contract types (partner_flat/time_guarded/time_based), overtime params. 3-tab layout (Payouts/Contracts/Overtime). Server-side RPCs: `set_provider_payout_base`, `set_provider_payout_zone_override`, `set_provider_org_contract`, `set_payout_overtime_rules`. All audited via `log_admin_action`. Superuser-only write
- [x] **2G-D3** | P1 | L | `admin_change_requests` table + UI — non-superusers submit change requests (pricing/payout/incentive/algorithm) with JSON proposed_changes. Superuser reviews via `review_change_request` RPC (approve/reject with note). RPCs: `submit_change_request`, `review_change_request`. Tabbed view (Pending/Approved/Rejected/All)
- [x] **2G-D4** | P1 | M | Change log + rollback UI — audit trail filtered by entity type (8 config tables), collapsible before/after JSON diff, rollback button for pricing/payout overrides. Uses `useAuditLog` hook

### Sprint 2G-E — SOPs + Polish
- [x] **2G-E1** | P1 | M | Create `/admin/playbooks` page — render SOP markdown with role filtering (dispatcher/ops/growth/superuser playbooks)
- [x] **2G-E2** | P1 | M | Write core SOP content — end-of-day reconciliation, missing proof handling, no-show escalation, provider probation ladder, zone pause workflow, emergency pricing override
- [x] **2G-E3** | P2 | M | Dense table polish — compact row height, sticky headers, hover actions, keyboard shortcuts (J/K/Enter/A/E/N) for dispatcher queues
- [x] **2G-E4** | P2 | S | Saved views per role — dispatcher default queue filters persisted to localStorage

---

## Round 2H — Fix Pack (PRD Completeness)

> Close all gaps identified in the PRD completeness review. Cron observability, quality pipeline, BYOC automation, provider map, admin polish.
> **Specs:** `docs/2H/prd-completeness-review.md`, `docs/2H/round-2h-fix-pack-spec.md`

### Sprint 2H-A — Cron Infrastructure + Run Logging (P0)
- [x] **2H-A1** | P0 | M | `cron_run_log` table already exists — create `start_cron_run()` and `finish_cron_run()` SECURITY DEFINER RPCs for consistent logging pattern
- [x] **2H-A2** | P0 | M | Create `admin_system_config` table (key-value config for algorithm params, guardrails, caps). Superuser-only write RLS
- [x] **2H-A3** | P0 | L | Build `/admin/cron-health` page — last N runs per job, status + runtime, failure details, superuser-only "Retry Now" button. Add to AdminShell Governance nav

### Sprint 2H-B — Quality Score Compute Pipeline (P0)
- [x] **2H-B1** | P0 | XL | Create `compute_provider_quality_scores()` RPC — rolling 28-day weighted score (rating 35%, issues 25%, photos 20%, on-time 20%), upsert into `provider_quality_score_snapshots`, call `evaluate_provider_tier()`, emit risk alerts for band downgrades
- [x] **2H-B2** | P0 | M | Fix `evaluate_training_gates()` RPC — correct column references (`composite_score` → `score`, `snapshot_at` → `computed_at`). Wire to run daily after quality compute
- [x] **2H-B3** | P0 | M | Create `compute-quality-scores` edge function — wrapper calling both RPCs in sequence, error handling, cron_run_log integration

### Sprint 2H-C — BYOC Automation + Weekly Rollups (P0)
- [x] **2H-C1** | P0 | L | Create `run_byoc_lifecycle_transitions()` RPC — advance lifecycle states, activate bonus window on first visit, expire ACTIVE→ENDED when bonus window passes
- [x] **2H-C2** | P0 | M | Create `compute_provider_weekly_rollups()` RPC — aggregate completion/on-time/redo rates, avg duration, customer feedback per active provider. Write to `provider_feedback_rollups`
- [x] **2H-C3** | P0 | M | Create `run-scheduled-jobs` edge function — orchestrate daily lifecycle + weekly BYOC bonus + weekly rollups

#### Sprint 2H-C Review Fixes (7 findings)
- [x] **C-F1** | HIGH | Redo metric uses `customer_issues` table instead of non-existent `redo_requested` issue_type
- [x] **C-F2** | HIGH | Fixed JOIN fan-out with CTE-based pre-aggregation (issue_agg + rating_agg CTEs)
- [x] **C-F3** | HIGH | Added missing `updated_at` column to `provider_feedback_rollups` + fixed upsert
- [x] **C-F4** | HIGH | Reverted bonus query to `.eq("status", "EARNED")` (uppercase matches DB CHECK)
- [x] **C-F5** | MEDIUM | Implemented `installed_at` lifecycle step (checks profiles table for signup)
- [x] **C-F6** | LOW | Activation loop filters `status = 'PENDING'` only + checks return value
- [x] **C-F7** | LOW | Added authorization guards to both RPCs (admin or service role)

### Sprint 2H-D — Provider Map View (P1)
- [x] **2H-D1** | P1 | S | Install `react-map-gl` + `mapbox-gl`. Add MAPBOX_ACCESS_TOKEN via VITE env var
- [x] **2H-D2** | P1 | XL | Build `ProviderMapView.tsx` — numbered pins for today's stops, tap → stop preview card, "Navigate" deep link, fallback for missing lat/lng
- [x] **2H-D3** | P1 | L | Integrate map into provider Jobs — list/map toggle, synced selection, "Navigate to next stop" primary action
- [x] **2H-D4** | P1 | M | Admin read-only map — provider route pins on service day detail and provider org detail pages
- [x] **2H-D5** | P1 | S | Geocode handling — lat/lng included in property select, missing-coords banner, navigate deep links to Apple/Google Maps

### Sprint 2H-E — Admin Completeness Polish (P1.5)
- [x] **2H-E1** | P1 | M | Wire `DecisionTraceCard` to service day detail, provider org detail, payout/hold detail, exception detail
- [x] **2H-E2** | P1 | M | Add 4 missing SOP playbooks — Growth Manager zone launch, BYOC close checklist, coverage exception approvals, payout/hold escalation
- [x] **2H-E3** | P1 | L | Build Control Room gaps — Incentive caps, Algorithm params, Policy guardrails (read from `admin_system_config`) at `/admin/control/config`
- [x] **2H-E4** | P1 | S | Add payout schedule visibility — "Next payout" card on provider Payouts page (computed weekly Friday cadence)
- [x] **2H-E5** | P1 | S | Wire dispatcher keyboard shortcuts E (escalate) and N (note) to DispatcherActionsDialog

#### Sprint 2H-E Remediation (ChatGPT feedback)
- [x] **2H-E-R1** | P0 | S | Quality snapshot idempotency — unique index on `(provider_org_id, to_date_immutable(computed_at))`, RPC uses ON CONFLICT DO UPDATE
- [x] **2H-E-R2** | P0 | S | pg_cron schedules — 4 cron.schedule entries for compute-quality-scores (03:00 UTC), run-scheduled-jobs (04:00 UTC), process-notification-events (every 2 min), cleanup-expired-offers (05:00 UTC)
- [x] **2H-E-R3** | P1 | S | Expected next run on cron-health UI — schedule map with overdue badges

---

## Round 2I — Future Moats (Defensibility)

> Build the things competitors can't copy quickly.

### AI & Intelligence
- [ ] **2I-01** | P2 | XL | Property health scoring AI — analyze visit photos over time to detect lawn health trends. "Your grass health is declining — consider fertilizer treatment"
- [ ] **2I-02** | P2 | L | Predictive maintenance — based on property history + season + weather, predict which services customer needs next. Proactive upsell
- [ ] **2I-03** | P2 | L | Smart scheduling optimization — AI-driven service day assignment that maximizes zone density while minimizing customer wait time
- [ ] **2I-04** | P2 | M | Automated dispute resolution — AI classifies dispute, checks photo evidence, auto-resolves clear-cut cases (already started in Module 12, extend)

### Platform Extensions
- [ ] **2I-05** | P2 | L | Insurance integrations — partner with home insurance providers. Proof of regular maintenance → insurance discount. Data sharing agreement
- [ ] **2I-06** | P2 | L | Provider financing — equipment lease program. Deduct payments from earnings. Build provider loyalty
- [ ] **2I-07** | P2 | L | Data marketplace foundations — anonymized zone-level data (maintenance patterns, seasonal demand, property health distributions) for real estate/insurance/municipal partners
- [ ] **2I-08** | P2 | M | API for partners — RESTful API for property management companies, HOAs, real estate platforms to integrate Handled Home services
- [ ] **2I-09** | P2 | L | Multi-vertical expansion framework — abstract the service execution engine so new verticals (pool, pest, cleaning) plug in with just SKU + checklist config

---

## Implementation Order (Recommended Sequence)

### Wave 1: Foundation (2A) — Do First
Complete all placeholders. Every user should see a finished app.

### Wave 2: Revenue Critical (2B-01 to 2B-10, 2C-01 to 2C-03, 2D-01, 2D-10 to 2D-13)
Job assignment, billing automation, notifications, onboarding, plan self-service, photo storage. These directly impact revenue.

### Wave 3: Retention (2D-04 to 2D-09, 2E-01 to 2E-06, 2H-06)
Ratings, property health, real-time tracking, earnings analytics, ToS. These keep users from churning.

### Wave 4: Growth (2F-01 to 2F-10, 2C-04 to 2C-08)
Viral mechanics, zone launch automation, push notifications, email. These grow the user base.

### Wave 5: Intelligence (2G-01 to 2G-11, 2B-11 to 2B-16)
Admin dashboards, weather mode, zone expansion, forecasting. These enable hands-off operations.

### Wave 6: Scale (2H-01 to 2H-14, 2E-07 to 2E-13)
Storage optimization, multi-property, mobile deployment, provider tools. These prepare for 100x.

### Wave 7: Moats (2I-01 to 2I-09)
AI, insurance, financing, data marketplace. These make the business defensible.

---

## Progress Tracking

| Round | Total | Done | % |
|-------|-------|------|---|
| 2A — Placeholders & Core | 16 | 16 | 100% |
| 2B — Automation Engine | 31 | 31 | 100% |
| 2C — Notifications | 44 | 44 | 100% |
| 2D — Customer Polish | 28 | 17 | 61% |
| 2E — Provider Polish | 17 | 17 | 100% |
| 2F — Growth Engine | 13 | 0 | 0% (skipped) |
| 2G — Admin Controls / Ops Cockpit | 22 | 22 | 100% |
| 2H — Fix Pack (PRD Completeness) | 23 | 23 | 100% |
| 2I — Future Moats | 9 | 0 | 0% |
| **TOTAL** | **194** | **117** | **60%** |

---

### Pre-2G Cleanup (OBS-1 through OBS-4)
- [x] **OBS-1** | Removed 2F-01 through 2F-04 work (neighborhood density widget, post-job share prompt, milestone RPC) — reverted from Dashboard/VisitDetail, deleted components/hooks
- [x] **OBS-2** | Added `requires_training_gate` boolean column to `service_skus` table via migration — SkuFormSheet now uses typed access (no `as any`)
- [x] **OBS-3** | Replaced fabricated `2s-sprint-e05-review.md` with accurate content — no false remediation claims
- [x] **OBS-4** | Fixed all 5 open E04/E05 findings via migration:
  - E04-F1: `compute_byoc_bonuses` uses `GET DIAGNOSTICS` for accurate insert count
  - E04-F2: `activate_byoc_attribution` requires admin or provider org member
  - E04-F3: Trigger renamed to `trg_byoc_attributions_set_updated_at`
  - E05-F1: `auto_assign_job` uses deny-by-default training gates (checks `requires_training_gate` on SKU + requires completed gate)
  - E05-F2: `evaluate_training_gates` RPC created — auto-completes pending gates when quality score meets `required_score_minimum`
- [x] **OBS-5** | Acknowledged — 2G-D sprint may need splitting if scope is too large

*Last updated: 2026-02-28 — Sprint 2H-E2 remediation complete. Round 2H Fix Pack 100% done.*

### Sprint 2H-E Remediation (Review Findings E-F1 through E-F7)
- [x] **E-F1** | P0 | S | Idempotency — `compute_quality_scores` already filters `WHERE computed_at::date < CURRENT_DATE` for previous-score lookup (verified in migration)
- [x] **E-F2** | P1 | S | pg_cron/pg_net extensions — verified both enabled (pg_cron 1.6.4, pg_net 0.19.5)
- [x] **E-F3** | P0 | M | `run-scheduled-jobs` now logs orchestrator + per-sub-job entries to `cron_run_log` with structured idempotency keys (`daily:YYYY-MM-DD`, `byoc_lifecycle:YYYY-MM-DD`, etc.) and `success|partial_failure|failed` status
- [x] **E-F5** | P1 | S | Config keys — verified 8 rows seeded in `admin_system_config` (no action needed)
- [x] **E-F6** | P0 | S | Payout cadence — already shows hardcoded "Weekly Friday cadence" with "Estimated" label in provider payouts UI
- [x] **E-F7** | P1 | S | `DispatcherActionsDialog` now accepts `defaultAction` prop; `E` shortcut pre-selects "Create Ticket", `N` pre-selects "Note", `A` opens with no preset; action+note reset on jobId/defaultAction change

### Sprint 2H-E2 Remediation (Review Findings E2-F1 through E2-F6)
- [x] **E2-F1** | P0 | S | CRITICAL: Fixed `compute_provider_quality_scores` to use correct columns (`band` + `components` jsonb) instead of non-existent `rating_score`, `performance_band` columns. Also re-added `start_cron_run`/`finish_cron_run` calls.
- [x] **E2-F2** | P1 | M | Created pg_cron schedules: `quality-compute-daily` (00:30 UTC), `byoc-lifecycle-daily` (02:00 UTC), `byoc-bonuses-weekly` (Mon 00:30 UTC), `provider-rollups-weekly` (Mon 01:30 UTC). Removed old overlapping schedules.
- [x] **E2-F3** | P1 | S | Seeded 10 missing config keys for ControlConfig UI (`byoc_bonus_weekly_cap_cents`, `referral_reward_cap_cents`, `max_credits_per_customer_cents`, `founding_partner_bonus_weeks`, `assignment_competition_slider`, `dunning_max_steps`, `no_show_penalty_points`, `probation_score_threshold`, `suspension_score_threshold`, `max_buffer_percent`)
- [x] **E2-F4** | P0 | S | Removed unused `contractQuery` in provider Payouts.tsx
- [x] **E2-F5** | P0 | S | Map pin ordering: AdminReadOnlyMap sorts by `stop_index`, ProviderMapView sorts by `route_order` — deterministic pin numbering matches list order
- [x] **E2-F6** | P1 | S | `run-scheduled-jobs` edge function now uses `start_cron_run`/`finish_cron_run` RPCs; distinct sub-job entries for `quality_compute_daily`, `training_gates_daily`, `byoc_lifecycle_daily`, `byoc_bonuses_weekly`, `provider_weekly_rollups_weekly`

---

## Sprint 3A — SKU Levels (Variants) System

> Allow services to have tiered levels (e.g. Maintenance / Standard / Deep) with different scope, duration, and handles cost.

### Phase 1: Schema & Data Layer
- [x] **3A-01** | P0 | M | Created `sku_levels` table with level_number, label, inclusions/exclusions, planned_minutes, handles_cost, proof settings. RLS: public read, admin write.
- [x] **3A-02** | P0 | S | Created `sku_guidance_questions` table for logic-based level selection questions. RLS: public read, admin write.
- [x] **3A-03** | P1 | S | Created `level_recommendations` table for provider feedback at job completion. RLS: provider insert/read own, admin all.
- [x] **3A-04** | P1 | S | Created `courtesy_upgrades` table with 1-per-property/SKU/6mo guardrail. RLS: provider insert own, customer read own property, admin all.
- [x] **3A-05** | P0 | S | Added `level_id` FK to `routine_items`, `scheduled_level_id` + `performed_level_id` to `job_skus`.

### Phase 2: Hooks & Data Access
- [x] **3A-06** | P0 | M | Created `useSkuLevels` hook with full CRUD (useSkuLevels, useCreateLevel, useUpdateLevel, useDeleteLevel)
- [x] **3A-07** | P0 | S | Created guidance question hooks (useGuidanceQuestions, useCreateGuidanceQuestion, useUpdateGuidanceQuestion, useDeleteGuidanceQuestion)
- [x] **3A-08** | P1 | S | Created `useLevelRecommendation` and `useCourtesyUpgrade` hooks with 6-month guardrail check

### Phase 3: Admin UI
- [x] **3A-09** | P0 | L | Level editor inside SkuFormSheet — collapsible section to add/edit/reorder/delete levels per SKU (SkuLevelEditor component)
- [x] **3A-10** | P1 | M | Guidance questions editor inside SkuFormSheet — configure 0–3 questions per SKU (GuidanceQuestionEditor component)
- [x] **3A-11** | P0 | S | SKU detail sheet — show levels summary with scope, planned minutes, handles cost

### Phase 4: Customer UI
- [x] **3A-12** | P0 | L | Level selector in SKU detail — side-by-side level comparison, handle delta display (LevelSelector + SkuDetailModal rewrite)
- [x] **3A-13** | P0 | M | Level selector in add-to-routine flow — default level pre-selected, handles update on change (AddServicesSheet + useAddRoutineItem level_id support)
- [x] **3A-14** | P1 | S | Routine item cards — show level label + handles cost + compact level picker (RoutineItemCard + useUpdateRoutineItemLevel)
- [x] **3A-15** | P1 | M | Visit detail — show scheduled vs performed level, courtesy upgrade notice, recommendation with "Update going forward" action

### Phase 5: Provider UI
- [ ] **3A-16** | P0 | M | Job detail header — show level label, planned minutes, scope bullets
- [ ] **3A-17** | P0 | L | Completion flow — level sufficiency prompt, recommendation form with reason codes, courtesy upgrade option

### Phase 6: Analytics
- [ ] **3A-18** | P2 | M | Admin ops dashboard — recommendation + courtesy upgrade counts, mismatch table (SKU × zone × rate)

### Pre-requisite Fixes
- [x] **3A-FIX-01** | P0 | S | Fixed `create-connect-account-link` edge function: changed `npm:@supabase/supabase-js` import to `https://esm.sh/` pattern
