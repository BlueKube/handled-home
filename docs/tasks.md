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
- [x] **3A-16** | P0 | M | Job detail header — show level label, planned minutes, scope bullets, proof requirements per SKU
- [x] **3A-17** | P0 | L | Completion flow — level sufficiency prompt per SKU, recommendation form with reason codes, courtesy upgrade option with guardrail

### Phase 6: Analytics
- [x] **3A-18** | P2 | M | Admin ops dashboard — recommendation + courtesy upgrade counts, mismatch table (SKU × zone × rate), outlier provider detection

### Pre-requisite Fixes
- [x] **3A-FIX-01** | P0 | S | Fixed `create-connect-account-link` edge function: changed `npm:@supabase/supabase-js` import to `https://esm.sh/` pattern

---

## Sprint 3B — Coverage Map + Property Sizing + Personalization Signals

> Household intelligence layer: coverage map, property sizing tiers, personalization signals for smarter defaults + suggestions.

### Phase 1: Schema & RLS
- [x] **3B-01** | P0 | M | Created `property_coverage` table (property_id + category_key unique, coverage_status SELF/PROVIDER/NONE/NA, switch_intent OPEN_NOW/OPEN_LATER/NOT_OPEN). Validation trigger, RLS: customer own-property, admin all.
- [x] **3B-02** | P0 | M | Created `property_signals` table (property_id PK, home_sqft_tier, yard_tier, windows_tier, stories_tier, signals_version). Validation trigger for tier enums, RLS: customer own, admin all.
- [x] **3B-03** | P1 | S | Created `personalization_events` table (append-only analytics, property_id FK, event_type, payload jsonb). RLS: customer insert+read own, admin all.

### Phase 2: Customer UI — Coverage Map
- [x] **3B-04** | P0 | L | Coverage Map screen with ~10 categories and segmented controls, inline switch intent sub-question. Hook: `usePropertyCoverage`. Route: `/customer/coverage-map`.
- [x] **3B-05** | P0 | M | Integrate coverage map + property sizing into onboarding flow — added `home_setup` step after zone_check with inline coverage map (10 categories) and sizing (4 tiers) in a 2-phase flow. Skippable.

### Phase 3: Customer UI — Property Sizing
- [x] **3B-06** | P0 | M | Property Sizing screen with tier selectors (sqft, yard, windows, stories). Hook: `usePropertySignals`. Route: `/customer/property-sizing`.
- [x] **3B-07** | P1 | S | Progressive "Complete Home Setup" prompt card on dashboard — `HomeSetupCard` component with coverage + sizing completion tracking.

### Phase 4: Edit & Settings
- [x] **3B-08** | P0 | M | More → Property → Home Setup edit screens for coverage + sizing — added Home Setup section to Property page with coverage map + sizing links, checkmarks for completed sections, "Why we ask" tooltips.
- [x] **3B-09** | P1 | S | Event logging for setup completion/updates — coverage and sizing hooks now emit `coverage_map_completed`/`coverage_map_updated` and `property_sizing_completed`/`property_sizing_updated` with completion percentages.

### Phase 5: Personalization API + Level Integration
- [x] **3B-10** | P0 | L | `get_property_profile_context` RPC — SECURITY DEFINER, returns coverage map, sizing signals, computed eligibility (eligible/suppressed categories, switch candidates, high-confidence upsells). Hook: `usePropertyProfileContext`.
- [x] **3B-11** | P1 | M | Level-default selection using sizing signals — `useLevelDefault` hook with deterministic per-category rules (windows, gutters, mowing, power_wash) that bump level based on sqft/yard/stories/windows tiers. Returns `default_level_id`, `default_level_reason`, `confidence`.
- [x] **3B-12** | P1 | M | Category eligibility checks — `useCategoryEligibility` hook wrapping profile context. AddServicesSheet filters SKUs using `eligible_categories` as allowlist when coverage data exists (not just `suppressed_categories` blocklist). Correctly handles SELF/non-high-pain and PROVIDER/NOT_OPEN filtering.

### Phase 6: Admin Visibility
- [x] **3B-13** | P1 | M | Property detail section showing coverage map + sizing tiers — `AdminPropertyProfileCard` component with `useAdminPropertyProfile` hook. Integrated into admin JobDetail overview tab. Shows coverage categories with status badges, switch intents, and sizing tiers.

---

## Sprint 3C — Growth Surfaces + Add Service Drawer + Home Restructure

> Turn the Home tab into an active growth engine with smart suggestions, one-tap add, and the Add Service Drawer.

### Phase 1: Suggestion Engine Schema + RPC
- [x] **3C-01** | P0 | M | Created `suggestion_suppressions`, `suggestion_impressions`, `suggestion_actions` tables with RLS policies, indexes, and validation constraints.
- [x] **3C-02** | P0 | L | Created `get_service_suggestions` RPC — SECURITY DEFINER, SET search_path = public. Scoring: coverage status (NONE=10, SELF high-pain=7, SELF=3, PROVIDER open=2), seasonality boost (+5 in-season), home sizing boost (+3 large). Filters: existing routine exclusion, active suppressions, impression throttling (≥2 in 14 days), NA exclusion. Returns top 4 (home) or 6 (drawer) with default level info.

### Phase 2: Frontend Hooks + SuggestionCard
- [x] **3C-03** | P0 | M | `useSuggestions` hook (calls RPC, 5-min stale time), `useSuggestionActions` hook (recordImpression, hideSuggestion, recordAdd mutations), `SuggestionCard` component (name, level label, handles cost, reason, Add button, hide with reason popover, auto-impression on mount).

### Phase 3: Add Service Drawer + FAB
- [x] **3C-04** | P0 | L | `AddServiceDrawer` (Sheet) — Best Next section (up to 4), Seasonal section (up to 2), Browse All CTA, empty state. `FloatingAddButton` (FAB) with framer-motion entrance animation. One-tap add with success toast + 10-second undo.

### Phase 4: Home Tab Restructure
- [x] **3C-05** | P0 | L | Dashboard.tsx restructured — Section A: Next Up (NextVisitCard + truth banners + start-routine CTA), Section B: This Cycle summary (service pills + handles bar), Section C: Suggested for Your Home (HomeSuggestions), Section D: Recent Receipt (last completed visit or placeholder). Removed redundant stat cards, added FAB + drawer.

### Phase 5: Routine + Receipt Surfaces
- [x] **3C-06** | P1 | M | Routine page — `RoutineSuggestion` component shows 1 adjacent/best_next suggestion at bottom of routine item list, before seasonal boosts
- [x] **3C-07** | P1 | M | Receipt growth surface — `ReceiptSuggestions` component shows 1-2 category-related suggestion cards at bottom of VisitDetail for completed visits ("While we're here next time")

### Phase 6: Instrumentation
- [ ] **3C-08** | P2 | S | Growth event tracking wired through useSuggestionActions (impressions, adds, hides all tracked via Phase 2 hooks)

### Review Fixes (M-1 and M-2)
- [x] **3C-R1** | S | Removed unused `surface` prop from `SuggestionCard` and all call sites
- [x] **3C-R2** | S | Removed dead `recordDrawerOpen` no-op mutation from `useSuggestionActions`

*Last updated: 2026-03-01 — Sprint 3C Phase 1-5 complete. Phase 6 deferred (instrumentation polish).*

---

## Sprint 3D — AI Intelligence Layer

> Predictive service recommendations + smart dispute resolution.
> **Spec:** `docs/sprint-3d-spec.md`

### 3D-B: Predictive Service Recommendations
- [x] **3D-B2** | P0 | M | `property_service_predictions` table with RLS (customer own-property read, admin all, service_role write), unique (property_id, sku_id), 7-day TTL
- [x] **3D-B1** | P0 | L | `predict-services` edge function — gathers property signals, coverage, visit history, health score; calls Lovable AI (gemini-3-flash-preview) with structured tool calling; upserts predictions; logs to ai_inference_runs
- [x] **3D-B3** | P0 | M | Updated `get_service_suggestions` RPC — joins `property_service_predictions`, adds `predicted` suggestion_type with confidence-based scoring (confidence/10), AI-generated reason text. Predicted SKUs bypass category eligibility filter
- [x] **3D-B4** | P1 | S | Wire `predict-services` into `run-scheduled-jobs` weekly automation — runs every Monday, fetches active subscription property IDs, calls predict-services in batches of 5, logs success/failure counts

### 3D-C: Smart Dispute Resolution
- [x] **3D-C1** | P0 | L | Enhanced `support-ai-classify` — added `auto_resolvable`, `suggested_credit_cents`, `resolution_explanation`, `photo_analysis` to AI tool output. Includes job photo count + customer issue photo context in prompt. Guard criteria: auto_resolvable AND evidence≥75 AND risk<30
- [x] **3D-C2** | P0 | L | `auto-resolve-dispute` edge function — validates guard criteria, applies credit (capped at $50), resolves ticket, emits CUSTOMER_ISSUE_AUTO_RESOLVED notification, logs to ai_inference_runs
- [x] **3D-C3** | P1 | M | Admin AI insights card on ticket detail — classification reasoning, evidence/risk scores, photo analysis, "Apply AI suggestion" button with credit override. Replaces old AI summary section
- [x] **3D-C4** | P1 | M | Customer issue auto-classification on insert — `useSubmitCustomerIssue` auto-creates support ticket from issue context and fires AI classification (fire-and-forget)

### Schema Changes
- `property_service_predictions` table (new)
- `ai_inference_runs.ticket_id` made nullable, added `entity_type` + `entity_id` columns for non-ticket AI usage

### Review Fixes (Sprint 3D — Round 1)
- [x] **3D-H1** | HIGH | Fixed credit status in auto-resolve-dispute: `"active"` → `"AVAILABLE"` to match billing flows
- [x] **3D-H2** | HIGH | Added mandatory auth to predict-services: verifies property owner, admin, or service_role
- [x] **3D-H3** | HIGH | Added mandatory auth to auto-resolve-dispute: restricted to service_role or admin only
- [x] **3D-M1** | MEDIUM | Fixed support-ai-classify auth bypass: Authorization header now mandatory (no more skip-if-missing)

### Review Fixes (Sprint 3D — Round 2: C3/C4 Review)
- [x] **3D-R2-H1** | HIGH | Fixed credit override ignored: auto-resolve-dispute now destructures and uses `credit_override_cents` from request body
- [x] **3D-R2-H2** | HIGH | Chained classify → auto-resolve server-side: support-ai-classify now calls auto-resolve-dispute internally when criteria met
- [x] **3D-R2-M1** | MEDIUM | Added "ai_reviewing" status on ticket insert; classify sets to "open" or "resolved" after completion
- [x] **3D-R2-M2** | MEDIUM | Added `support_ticket_id` FK column to customer_issues; C4 flow links the two records
- [x] **3D-R2-M3** | MEDIUM | RLS note: support_tickets insert uses `as any` casts; verify INSERT policy exists for customers (flagged for next review)
- [x] **3D-R2-L1** | LOW | Added NaN guard on credit override parseFloat in AiInsightsCard
- [x] **3D-R2-L2** | LOW | Removed unused `customer_id` prop from AiInsightsCardProps
- [x] **3D-R2-L3** | LOW | Extended useSupportAiClassify return type with auto_resolvable, suggested_credit_cents, photo_analysis, should_auto_resolve, auto_resolve_result

### Deferred Items
- [x] **3D-M2** | MEDIUM | Surface differentiation — AddServiceDrawer now shows "AI Picks for You" section for predicted suggestions; SuggestionCard shows "AI pick" badge with Brain icon and primary accent border for predicted type
- [x] **3D-L1** | LOW | Stale prediction cleanup — `cleanup_stale_predictions` RPC deletes rows expired >30 days, wired into weekly Monday automation
- [x] **3D-L2** | LOW | Photo analysis — support-ai-classify generates signed URLs (up to 4 job photos + 2 issue photos, 10-min expiry) and includes them as multimodal image_url content parts for Gemini visual analysis

*Last updated: 2026-03-01 — Sprint 3D 100% complete. All deferred items resolved.*

---

## Sprint PRD-300 — Scheduling & Logistics Foundations

> Data model + geo index + schedule states + admin dials + provider work setup + customer upcoming.

### Phase 1: Schema Foundation (visits, visit_tasks, provider_work_profiles, scheduling states)
- [x] **PRD300-P1** | P0 | L | Created `visits`, `visit_tasks`, `provider_work_profiles` tables with RLS, indexes, triggers

### Phase 1 Remediation (8 code review findings)
- [x] **PRD300-P1-R1** | P0 | S | Seeded 4 scheduling config keys into admin_system_config
- [x] **PRD300-P1-R2** | P0 | S | Admin FOR ALL on provider_work_profiles
- [x] **PRD300-P1-R3** | P0 | S | Added service_categories column to provider_work_profiles
- [x] **PRD300-P1-R4** | P0 | S | Added h3_index columns to properties + provider_work_profiles
- [x] **PRD300-P1-R5** | P0 | S | Added updated_at + trigger to visit_tasks
- [x] **PRD300-P1-R6** | P0 | S | Natural language policy names + WITH CHECK cleanup
- [x] **PRD300-P1-R7** | P0 | S | Reverted provider work profile RLS to SELECT+INSERT+UPDATE (no DELETE)

### Phase 2: Admin Scheduling Policy UI
- [x] **PRD300-P2** | P0 | M | SchedulingPolicy page at /admin/scheduling/policy with 4 dials, AuditReasonModal, useSchedulingPolicy hook

### Phase 3: Provider Work Setup Page
- [x] **PRD300-P3-01** | P0 | M | Created `useProviderWorkProfile` hook (query + upsert)
- [x] **PRD300-P3-02** | P0 | L | Built `/provider/work-setup` — 3-step stepper (Location → Services → Schedule) with home base, category multi-select, equipment toggles, weekly hours, max jobs/day
- [x] **PRD300-P3-03** | P0 | S | Wired route in App.tsx + "Work Setup" link in provider More menu
- [x] **PRD300-P3-04** | P0 | S | Fixed working_hours day-key mismatch (normalizer maps mon→monday on read) + aligned max_jobs default to 12

### Phase 4: Customer Upcoming Visits
- [x] **PRD300-P4-01** | P0 | M | Created `useUpcomingVisits` hook — queries visits table with visit_tasks join, filters by upcoming schedule states, includes SKU names
- [x] **PRD300-P4-02** | P0 | L | Built `/customer/upcoming` page — visit cards with calm scheduling labels (Planning/Scheduled/Today/In Progress/Needs Attention), ETA windows, task pills, presence-required indicators, exception + dispatched contextual hints
- [x] **PRD300-P4-03** | P0 | S | Wired route in App.tsx, added "View all upcoming →" link on Dashboard next to NextVisitCard

*Last updated: 2026-03-03 — Phase 4 complete.*

---

## Sprint 3F/3G — Provider Onboarding + BYOC

> Provider acquisition funnel: application, agreement, compliance, BYOC invite links, customer activation, admin review.

### Phase 1 — Schema Foundation
- [x] **3FG-P1-01** | P0 | M | Add `under_review` and `approved_conditional` to `provider_application_status` enum
- [x] **3FG-P1-02** | P0 | M | Add new columns to `provider_applications` (requested_categories, requested_zone_ids, byoc_estimate_json, pitch_variant_seen, compliance_json, submitted_at, reviewed_at, decision_reason)
- [x] **3FG-P1-03** | P0 | M | Create `provider_agreement_acceptance` table with RLS + indexes
- [x] **3FG-P1-04** | P0 | M | Create `category_requirements` config table with RLS + seed CA v1 defaults (10 categories, Tier 0-3)
- [x] **3FG-P1-05** | P0 | M | Create `provider_compliance_documents` table with RLS + indexes
- [x] **3FG-P1-06** | P0 | M | Create `byoc_invite_links`, `byoc_invite_events`, `byoc_activations` tables with RLS + indexes
- [x] **3FG-P1-07** | P1 | S | Add `founding_partner_slots_total` / `founding_partner_slots_filled` to `market_zone_category_state`

### Phase 2 — Clause-by-Clause Agreement Flow
- [x] **3FG-P2-01** | P0 | M | Create `useProviderAgreement` hook (query accepted clauses, insert acceptance)
- [x] **3FG-P2-02** | P0 | L | Build `/provider/onboarding/agreement` page with ClauseCard component (12 clauses, progress indicator)
- [x] **3FG-P2-03** | P1 | S | Define clause content as static config array (12 clause keys from spec Part B)
- [x] **3FG-P2-04** | P1 | S | Update OnboardingReview to check all required clauses accepted before submit

### Phase 2 Review — Fixes
- [x] **3FG-P2-R1** | P0 | S | Fix step counters across all onboarding pages (was "of 5", now "of 6")
- [x] **3FG-P2-R2** | P1 | S | Add CHECK constraint on clause_key column (only 12 valid values)
- [x] **3FG-P2-R3** | P1 | S | DraftResumeScreen checks agreement status — routes to /review when all 12 accepted

### Phase 3 — Enhanced Application + Opportunity Banners
- [x] **3FG-P3-01** | P0 | L | Rewrite `Apply.tsx` for multi-category selection + home base ZIP + service ZIPs
- [x] **3FG-P3-02** | P0 | L | Build `OpportunityBanner` component (5 variants: EARLY/OPEN/EARLY_2/WAITLIST/CLOSED)
- [x] **3FG-P3-03** | P1 | M | Implement banner decision algorithm (`mapStateToBannerVariant` maps zone state → variant)
- [x] **3FG-P3-04** | P1 | M | Add BYOC intake step (estimated count, willingness, relationship type, willing to invite)
- [x] **3FG-P3-05** | P1 | S | Update `useProviderApplication` for multi-category, byoc_estimate_json, pitch_variant_seen

### Phase 3 Review — Fixes
- [x] **3FG-P3-R1** | P1 | S | Fix post-submit navigation — use mutateAsync + navigate on success
- [x] **3FG-P3-R2** | P1 | S | Fix draft application re-entry — skip status screen for draft status
- [x] **3FG-P3-R3** | P2 | S | Add loading spinner while application query resolves
- [x] **3FG-P3-R4** | P1 | S | Add try/catch + error toast around checkReadiness
- [x] **3FG-P3-R5** | P1 | S | Add TODO comments for hasFoundingSlots/categoriesFilled (needs RPC update)
- [x] **3FG-P3-R6** | P2 | S | Consolidate duplicate approved/approved_conditional CTA buttons

### Phase 4 — Category-Driven Compliance
- [x] **3FG-P4-01** | P0 | M | Create `useCategoryRequirements` hook — fetches category_requirements, merges max risk tier + all requirement flags
- [x] **3FG-P4-02** | P0 | L | Build `DynamicComplianceRenderer` component (insurance, license, background check fields by risk tier)
- [x] **3FG-P4-03** | P1 | M | Add COI upload to `provider_compliance_documents` — upsert with doc_type, storage_path, status
- [x] **3FG-P4-04** | P1 | M | Add CSLB license fields for Tier 3 categories — license number + state inputs, license doc upload
- [x] **3FG-P4-05** | P1 | S | Replace static OnboardingCompliance with dynamic version — driven by application's requested_categories

### Phase 4 Review — Fixes
- [x] **3FG-P4-R1** | P1 | S | Add UNIQUE(org_id, doc_type) constraint on provider_compliance_documents for upsert support
- [x] **3FG-P4-R2** | P1 | S | Fix .limit(1) on UPDATE — use application.data.id instead of user_id + order + limit
- [x] **3FG-P4-R3** | P1 | S | Add application.isLoading to loading guard in OnboardingCompliance
- [x] **3FG-P4-R4** | P1 | S | Add UPDATE RLS policy for providers on provider_compliance_documents

### Phase 5 — BYOC Center + Invite Links
- [x] **3FG-P5-01** | P0 | L | Build `/provider/byoc` page (incentives summary, copy scripts, share link, invite stats)
- [x] **3FG-P5-02** | P1 | M | Build `/provider/byoc/create-link` (category picker, SKU+Level+cadence, generate link)
- [x] **3FG-P5-03** | P1 | M | Create `useByocInviteLinks` hook (CRUD for invite links, query events)
- [x] **3FG-P5-04** | P1 | S | Wire invite scripts from `invite_scripts` table into copy buttons
- [x] **3FG-P5-05** | P1 | S | Gate BYOC Center access to approved provider orgs only

### Phase 5 Review — Fixes
- [x] **3FG-P5-R1** | P0 | S | Fix `category_key` → `capability_key` in ByocCreateLink (categories were always empty)
- [x] **3FG-P5-R2** | P0 | S | Fix `sku_name` → `service_skus?.name` in ByocCreateLink (SKU names showed UUIDs)
- [x] **3FG-P5-R3** | P1 | S | Add UPDATE RLS policy on `byoc_invite_links` (deactivation was silently failing)
- [x] **3FG-P5-R4** | P2 | S | Fix zone picker to use `zones?.name` instead of UUID
- [x] **3FG-P5-R5** | P2 | S | Add "ONCE" cadence option to invite link creation
- [x] **3FG-P5-R6** | P2 | S | Add "How BYOC Works" explainer card to ByocCenter
- [x] **3FG-P5-R7** | P2 | S | Add compliance reminder alert to ByocCenter
- [x] **3FG-P5-R8** | P3 | S | Render recent events as collapsible activity feed in ByocCenter
- [x] **3FG-P5-R9** | P3 | S | Fix `text-success` → `text-green-500` in InviteLinkCard

### Phase 6 — Customer BYOC Activation
- [x] **3FG-P6-01** | P0 | L | Build `/byoc/activate/:token` page (ProviderIntroCard, service summary, cadence picker, activate CTA, auth redirect)
- [x] **3FG-P6-02** | P0 | L | Create `activate-byoc-invite` edge function (validate token, dedupe check, create activation, link provider)
- [x] **3FG-P6-03** | P1 | S | Track activation events in `byoc_invite_events` (activated + link_used events logged by edge function)

### Phase 7 — Admin Application Review Queue
- [x] **3FG-P7-01** | P0 | L | Build `/admin/providers/applications` with ApplicationsTable (filters by status, category, actionable count badge)
- [x] **3FG-P7-02** | P0 | XL | Build `/admin/providers/applications/:id` (full detail view, BYOC estimate, agreement clause checklist, compliance docs, decision buttons with confirmation dialog)
- [x] **3FG-P7-03** | P0 | L | Create `review_provider_application` RPC (SECURITY DEFINER, admin-only, validates transitions, creates org on approval, adds owner member, emits notification, audit logs)
- [x] **3FG-P7-04** | P1 | S | Wire notifications to provider on decision (via emit_notification_event in RPC — APPROVED/CONDITIONAL/REJECTED/WAITLISTED events)

### Phase 1 Review — Findings & Fixes
- [x] **3FG-P1-R1** | S | Add 4 missing composite indexes (byoc_invite_events, byoc_activations, provider_compliance_documents, provider_coverage)
- [x] **3FG-P1-R2** | S | Verify support-ai-classify bucket bug — confirmed already fixed (uses job-photos, single issuePhotoContext)
- [x] **3FG-P1-R3** | S | Document provider systems reconciliation (Flow A: application → Flow B: invite-code onboarding) in claude-implementation-notes.md

---

## PRD-300 Sprint 2 — Zone Builder v1

> **Plan:** `docs/plans/prd-300-sprint-2-zone-builder-plan.md`
> **Complexity:** XL (5 phases)

### Phase 1: Schema + H3 Geo Infrastructure
- [x] **S2-P1-01** | P0 | M | Create `zone_builder_runs` table (region_id, config JSONB, status enum, created_by, committed_at). RLS: admin only.
- [x] **S2-P1-02** | P0 | M | Create `zone_cells` table (h3_index PK, zone_id FK, demand/supply aggregates, category JSONB). RLS: admin read.
- [x] **S2-P1-03** | P0 | M | Create `zone_builder_results` table (run_id FK, zone_label, cell_indices, metrics, warnings, neighbors). RLS: admin only.
- [x] **S2-P1-04** | P0 | S | Install `h3-js`. Create `src/lib/h3Utils.ts` — wrappers for latLngToCell, cellToLatLng, cellToBoundary, gridDisk, gridDistance, cellArea.
- [x] **S2-P1-05** | P0 | M | Create `src/lib/zoneScoringUtils.ts` — scoreCellDemand, scoreCellSupply, computeSeedScore (0.55·D + 0.35·S + 0.10·W), computeZoneMetrics, checkFeasibility, selectSeeds.
- [x] **S2-P1-06** | P0 | S | Create `src/lib/driveTimeProxy.ts` — Mode 1: haversine × 1.4 city multiplier. Mode 2: TravelTimeProvider interface stub.

### Phase 2: Zone Generation Algorithm — Edge Function
- [x] **S2-P2-01** | P0 | M | Create `generate-zones` edge function — accepts region_id + config dials, creates run row.
- [x] **S2-P2-02** | P0 | L | Cell aggregation — query properties + provider_work_profiles → H3 cells → demand/supply per cell.
- [x] **S2-P2-03** | P0 | M | Cell scoring + seed selection via zoneScoringUtils.
- [x] **S2-P2-04** | P0 | XL | Region-growing algorithm — constrained growth loop with cost function.
- [x] **S2-P2-05** | P0 | M | Feasibility constraints — flag zones, compute per-zone metrics.
- [x] **S2-P2-06** | P1 | L | Refinement pass — boundary swaps, merge tiny, split oversized.
- [x] **S2-P2-07** | P0 | S | Write results to zone_builder_results, update run status to preview.

### Phase 3: Admin Wizard UI — Screens 1–3
- [x] **S2-P3-01** | P0 | M | ZoneBuilderWizard route + stepper component.
- [x] **S2-P3-02** | P0 | M | Screen 1 — Region Selection with map preview.
- [x] **S2-P3-03** | P0 | M | Screen 2 — Generation Settings (dials, seed strategy).
- [x] **S2-P3-04** | P0 | L | Screen 3 — Zone Preview (Mapbox + metrics sidebar).
- [x] **S2-P3-05** | P0 | M | useZoneBuilderRun hook.

### Phase 2 Review Fixes
- [x] **S2-P2-F1** | LOW | Removed unused routine_items + service_skus queries.
- [x] **S2-P2-F3** | LOW | Added auth guard — rejects unauthenticated requests with 401.

### Phase 4: Editing Tools + Commit — Screens 4–5
- [x] **S2-P4-01** | P0 | L | Screen 4 — Editing Tools (rename inline, merge selection with neighbor validation).
- [x] **S2-P4-02** | P0 | L | commit-zones edge function (auth guard, zip derivation from properties, round-robin service days, writes to operational zones table, marks run committed).
- [x] **S2-P4-03** | P0 | M | Screen 5 — Commit Confirmation (summary card, zone list with service day badges, warning count, confirmation dialog).
- [x] **S2-P4-04** | P1 | S | Zone Builder button already in ZonesTab (Phase 3).

### Phase 5: Property Resolution + Debug Surfaces
- [x] **S2-P5-01** | P0 | M | resolve_property_zone + resolve_zone_by_h3 RPCs (SECURITY DEFINER, H3 cell → zone_cells lookup, zip fallback, ring expansion via client h3-js).
- [x] **S2-P5-02** | P1 | M | Address Lookup tool on admin Zones page (Mapbox geocode → H3 → zone_cells → ring expansion → zip fallback).
- [x] **S2-P5-03** | P1 | M | backfill-property-zones edge function (compute missing h3_index, resolve zones via zone_cells + ring + zip, idempotent via cron_run_log).
- [x] **S2-P5-04** | P2 | S | Zone Builder History collapsible section on ZonesTab (past runs with region, zone count, status, date).

*Last updated: 2026-03-03 — Sprint 2 Phase 5 complete. Zone Builder v1 fully operational.*

---

## PRD-300 Sprint 3 — Market Zone Category States Integration

> **PRD:** `docs/prds/unfinished/PRD 300 - sprint_3_prd_market_zone_category_states_integration.md`
> **Goal:** Wire operational market states at (zone, category) level into product for safe scaling.
> **Complexity:** XL (5 phases)

### Phase 1: Schema + Enum Expansion
- [x] **S3-P1-01** | P0 | M | Expand `market_zone_category_status` enum: add WAITLIST_ONLY, PROVIDER_RECRUITING
- [x] **S3-P1-02** | P0 | M | Expand `zone_launch_status` enum: add closed, provider_recruiting, protect_quality
- [x] **S3-P1-03** | P0 | S | Add tracking columns to `market_zone_category_state`: last_state_change_at, last_state_change_by, previous_status
- [x] **S3-P1-04** | P0 | L | Create `zone_state_recommendations` table (approval-gated, pending/approved/rejected/snoozed/superseded, confidence, reasons, metrics_snapshot). RLS: admin only.
- [x] **S3-P1-05** | P0 | M | Create `zone_state_threshold_configs` table (admin-editable dials). Seed 10 defaults (min_providers, utilization thresholds, coverage risk, time-in-state, intake caps).
- [x] **S3-P1-06** | P0 | M | Create `zone_state_change_log` table (audit trail: change_source manual/approved_recommendation/system_emergency, reason_codes, metrics_snapshot). RLS: admin only.
- [x] **S3-P1-07** | P0 | M | Enhanced `admin_override_zone_state` RPC — returns jsonb, supersedes pending recommendations, logs to zone_state_change_log + growth_autopilot_actions + admin_audit_log.
- [x] **S3-P1-08** | P0 | M | Create `approve_zone_state_recommendation`, `reject_zone_state_recommendation`, `snooze_zone_state_recommendation` RPCs (SECURITY DEFINER, admin-only, audit logged).
- [x] **S3-P1-09** | P0 | M | Update `check_zone_readiness` RPC to use `market_zone_category_state` instead of `market_cohorts`. 6-state hierarchy: OPEN > SOFT_LAUNCH > WAITLIST_ONLY > PROVIDER_RECRUITING > PROTECT_QUALITY > CLOSED.
- [x] **S3-P1-10** | P0 | S | Create hooks: `useZoneStateRecommendations`, `useZoneStateThresholds`, `useZoneStateChangeLog`. Update `useMarketZoneState` with new type + jsonb return.

### Phase 2: Recommendation Engine (Edge Function)
- [x] **S3-P2-01** | P0 | L | Create `compute-zone-state-recommendations` edge function — nightly compute of DemandMinutes, SupplyMinutes, Utilization, QualifiedProviderCount, CoverageRisk per (zone, category).
- [x] **S3-P2-02** | P0 | M | Implement deterministic recommendation logic (PRD §9 thresholds) with hysteresis + min time-in-state.
- [x] **S3-P2-03** | P0 | S | Confidence scoring (high/medium/low based on distance from thresholds + data density).
- [x] **S3-P2-04** | P0 | S | Idempotency via cron_run_log + idempotency_key on recommendations.

### Phase 3: Admin UI — Matrix + Recommendations Inbox
- [x] **S3-P3-01** | P0 | XL | Zone × Category Matrix — enhanced ZoneMatrixTab with all 6 states, recommendation badges (→ recommended state), clickable cells opening detail panel.
- [x] **S3-P3-02** | P0 | L | Cell detail side panel (`ZoneCategoryDetailPanel`) — current state + lock info, pending recommendations with approve/reject/snooze, manual override form, change history audit log.
- [x] **S3-P3-03** | P0 | L | Recommendations Inbox tab (`RecommendationsInbox`) — filterable by status/confidence/category, urgency-sorted, bulk snooze, per-card approve/reject/snooze with rejection notes.
- [x] **S3-P3-04** | P1 | M | Threshold Dials tab (`ThresholdDials`) — grouped by utilization/coverage/general, percent-aware input, save per threshold, last-updated timestamps.

### Phase 4: Customer Gating + Category Waitlist
- [x] **S3-P4-01** | P0 | L | Catalog gating — `useZoneCategoryGating` hook resolves customer zone → fetches `market_zone_category_state` → maps to purchasable/waitlist/hidden. Wired into `AddServicesSheet`: purchasable categories render normally, waitlisted show "Coming Soon" section with waitlist CTA, CLOSED hidden entirely.
- [x] **S3-P4-02** | P0 | M | Subscribe eligibility check — `RoutineConfirm` resolves sku_id→category via `useSkuCategories`, checks each against `isPurchasable()`. Blocked categories show destructive alert with per-category waitlist buttons. Confirm button disabled when blocked.
- [x] **S3-P4-03** | P0 | L | Category-level waitlist flow — `CategoryWaitlistSheet` bottom sheet: category icon+gradient header, state-specific messaging, address confirmation from property, email (pre-filled from auth), optional name, priority preference chips (Reliability/Familiar provider/Lowest price/Earliest launch). Submits to existing `join-waitlist` edge function with `source: category_waitlist_{category}`. Success state with checkmark animation.
- [x] **S3-P4-04** | P1 | M | Customer messaging by state — `src/lib/categoryStateMessaging.ts` provides `getStateMessage(rawState, category)` returning headline/subtext/badge/ctaLabel per PRD §4D. Used in AddServicesSheet waitlist cards and CategoryWaitlistSheet header.

### Phase 5: Provider Surfaces
- [x] **S3-P5-01** | P1 | M | Market heat signals on provider dashboard — `MarketHeatBanner` component queries `market_zone_category_state` for PROVIDER_RECRUITING in provider's covered zones. Shows opportunity badges grouped by category with zone counts. Links to coverage page.
- [x] **S3-P5-02** | P1 | M | Provider onboarding tie-in — `OnboardingRecruitingSignals` component shows high-demand category chips on DraftResumeScreen when PROVIDER_RECRUITING states exist in the provider's allowed zones.
- [x] **S3-P5-03** | P2 | S | Analytics events — `emitStateAnalyticsEvent()` utility emits to `growth_events` table. Wired into: recommendation approve/reject/snooze (admin), waitlist_joined (customer), subscribe_blocked_by_state (customer). Fire-and-forget with timestamp-based idempotency keys.

*Last updated: 2026-03-03 — Sprint 3 Phase 5 complete. Market Zone Category States Integration fully operational.*

---

## PRD-300 Sprint 4 — Rolling Horizon Planner (14-Day Plan + 7-Day Freeze)

> **PRD:** `docs/prds/unfinished/PRD 300 - sprint_4_prd_rolling_horizon_planner_14_day_plan_7_day_freeze.md`
> **Goal:** Nightly planner maintaining a stable 14-day schedule with 7-day freeze + customer effective date policy.
> **Complexity:** XL (5 phases)

### Phase 1: Schema Foundation
- [x] **S4-P1-01** | P0 | M | Create `plan_runs` table (status, triggered_by, run_date, summary jsonb, conflicts jsonb, idempotency_key unique). RLS: admin only.
- [x] **S4-P1-02** | P0 | S | Create `plan_window` enum (locked, draft). Add `plan_window` + `plan_run_id` FK to `visits`.
- [x] **S4-P1-03** | P0 | S | Add `cadence_anchor_date` to `routines` (stable offset for cadence math).
- [x] **S4-P1-04** | P0 | S | Add `effective_date` to `routine_versions` (when changes take effect in plan).
- [x] **S4-P1-05** | P0 | S | Indexes: `(property_id, scheduled_date)` on visits, `(status)` on plan_runs, `(plan_window)` filtered.
- [x] **S4-P1-06** | P0 | S | Auto-complete trigger on plan_runs (sets completed_at when status transitions to completed/failed).

### Phase 2: Nightly Planner Edge Function
- [x] **S4-P2-01** | P0 | XL | Create `run-nightly-planner` edge function — Steps A–F from PRD §6.
- [x] **S4-P2-02** | P0 | L | Step A: Parallel data loading (subscriptions, service days, routines, existing visits, market states, SKU categories).
- [x] **S4-P2-03** | P0 | L | Steps C+D: Service day date generation, cadence math (k mod N occurrence-based), zone/category gating filter.
- [x] **S4-P2-04** | P0 | M | Step E: LOCKED preservation — existing locked visits untouched, window classification update only.
- [x] **S4-P2-05** | P0 | M | Stability: DRAFT diff-based updates (add new tasks, remove stale, preserve unchanged).
- [x] **S4-P2-06** | P0 | S | Bundling: all due tasks per property/date → single visit with additive duration.
- [x] **S4-P2-07** | P0 | S | Idempotency: daily key `planner:YYYY-MM-DD:mode`, skip if already completed. cron_run_log integration.
- [x] **S4-P2-08** | P0 | S | Plan run summary (locked/draft counts, tasks created/removed, properties processed/skipped) + conflict tracking.

### Phase 3: Customer UX — Effective Date + Visit Labels
- [x] **S4-P3-01** | P0 | M | RoutineConfirm shows "Changes take effect on {T0+7}" badge with accent styling.
- [x] **S4-P3-02** | P0 | M | `useUpcomingVisits` updated to fetch `plan_window`. New `getVisitLabel()` and `getVisitStyle()` helpers.
- [x] **S4-P3-03** | P0 | S | UpcomingVisits page uses plan_window-aware labels: LOCKED planning → "Scheduled", DRAFT planning → "Planned".

### Phase 4: Admin Planner Dashboard
- [x] **S4-P4-01** | P0 | L | `/admin/scheduling/planner` page — plan runs list with status badges, trigger info, delta counts.
- [x] **S4-P4-02** | P0 | M | Run detail panel — summary stats grid, duration, conflict list with property IDs.
- [x] **S4-P4-03** | P0 | M | "Run Planner" (full) + "Rebuild DRAFT" (draft_only) manual controls with confirmation dialogs.
- [x] **S4-P4-04** | P0 | S | Planner link added to AdminShell sidebar (Operations → Planner, superuser/ops only).

### Phase 5: Hooks + Wiring
- [x] **S4-P5-01** | P0 | M | `usePlanRuns` hook (list query, detail query, trigger mutation).
- [x] **S4-P5-02** | P0 | S | Route added to App.tsx, import wired.

*Last updated: 2026-03-03 — Sprint 4 complete. Rolling Horizon Planner operational.*

---

## PRD-300 Sprint 5 — Provider Assignment v1 (Clustered, Capacity-Constrained)

> **PRD:** `docs/prds/unfinished/PRD_300_sprint_5_provider_assignment_v1.md`
> **Goal:** Assign Primary + Backup provider to each visit using a greedy clustered solver.
> **Complexity:** XL (4 phases)

### Phase 1: Schema & Config Foundation
- [x] **S5-P1-01** | P0 | M | Add 7 assignment columns to `visits` (backup_provider_org_id, assignment_confidence, assignment_reasons, assignment_locked, assignment_run_id, assignment_score, unassigned_reason). FK for backup_provider_org_id → provider_orgs.
- [x] **S5-P1-02** | P0 | M | Create `assignment_runs` table (status, triggered_by, run_date, summary, idempotency_key). RLS: admin + service role.
- [x] **S5-P1-03** | P0 | M | Create `assignment_config` table (config_key, config_value, description). Seeded with 13 tuning dials. RLS: admin full + service role read.
- [x] **S5-P1-04** | P0 | M | Create `visit_assignment_log` table (visit_id, provider_org_id, action, reason, score_breakdown, candidates_considered). RLS: admin + service role.
- [x] **S5-P1-05** | P0 | S | Indexes on assignment_run_id, backup_provider_org_id, assignment_locked, visit_assignment_log (run_date, status, visit_id, created_at).

### Phase 2: Assignment Engine (Edge Function)
- [x] **S5-P2-01** | P0 | XL | `assign-visits` edge function — greedy most-constrained-first solver with 14-day horizon. Hard constraints (skills, working day, capacity, geographic feasibility). Soft scoring (w_distance × GeoCost + w_balance + w_spread − w_familiarity − w_zone_affinity). Backup assignment. Stability rules (2× threshold in freeze window). Audit logging to visit_assignment_log. Notification emission (best-effort try/catch).

#### Phase 2 Review Fixes
- [x] **S5-F1** | BUG | Dashboard summary key mismatch — reads `assigned_primary`/`assigned_backup` (was `assigned`/`with_backup`)
- [x] **S5-F2** | MINOR | Replaced non-existent "Near Capacity" card with "Locked (Skipped)" using actual `locked_skipped` data
- [x] **S5-F5** | MINOR | Notification emission wrapped in try/catch — failure no longer marks entire run as failed

### Phase 3: Admin UX (Dashboard + Config)
- [x] **S5-P3-01** | P0 | L | `/admin/assignments` dashboard — run history list, detail panel with summary stats (total, assigned primary %, backup %, unassigned, long drive, locked skipped), manual trigger with confirmation dialog.
- [x] **S5-P3-02** | P0 | M | `/admin/assignments/config` — slider-based dial editing for 13 tuning dials (weights/thresholds/capacity), dirty detection, per-dial save/reset.
- [x] **S5-P3-03** | P0 | S | Hooks: `useAssignmentRuns`, `useAssignmentConfig`, `useVisitAssignmentLog`. Routes + AdminShell nav links with role gating.

### Phase 4: Provider & Customer UX Updates
- [x] **S5-P4-01** | P0 | M | Customer UpcomingVisits: assignment context messaging — "Your pro is scheduled" (locked) vs "We're planning your visit" (draft) vs "We're matching the best pro" (unassigned). Hides provider identity for draft visits.
- [x] **S5-P4-02** | P0 | M | Provider Jobs: Scheduled/Planned labels (≤7 days = Scheduled, >7 = Planned), "Primary" badge, expected minutes from job_skus.

*Last updated: 2026-03-03 — Sprint 5 complete. Provider Assignment v1 operational.*

---

## PRD-300 Sprint 6 — Route Sequencing v1 + Equipment Manifest

> **PRD:** `docs/prds/unfinished/prd_300_sprint_6_route_sequencing_v_1_equipment_manifest.md`
> **Goal:** Ordered daily routes per provider, coarse customer ETA ranges, equipment manifests, bundling rules.
> **Complexity:** XL (5 phases)

### Phase 1: Schema + Config Foundation
- [x] **S6-P1-01** | P0 | M | Add route sequencing columns to `visits` (route_order, stop_duration_minutes, planned_arrival_time, eta_range_start, eta_range_end, equipment_required, route_sequence_run_id). Create `route_sequence_runs` table. Indexes.
- [x] **S6-P1-02** | P0 | S | Create `provider_blocked_windows` table (recurring DOW or one-off, optional location, label). RLS: providers manage own org's windows.
- [x] **S6-P1-03** | P0 | S | Seed 20 `assignment_config` dials for Sprint 6 (bundling, sequencing, ETA, availability, anchored, late grace).

### Phase 2: Route Sequencing Edge Function
- [x] **S6-P2-01** | P0 | XL | Create `route-sequence` edge function — bundling (setup discount formula), nearest-neighbor + 2-opt sequencing, ETA range generation, equipment manifest, feasibility check with infeasible notification, audit logging to `route_sequence_runs`.

### Phase 3: Provider Availability & Blocked Windows
- [x] **S6-P3-01** | P0 | M | `useProviderBlockedWindows` hook — CRUD for blocked windows scoped to provider org.
- [x] **S6-P3-02** | P0 | L | `/provider/availability` page — availability health meter (config-driven thresholds), weekly schedule summary, blocked windows management (recurring/one-off), vacation display, fragmentation warnings.
- [x] **S6-P3-03** | P0 | S | RLS fix: authenticated SELECT on `assignment_config` so providers can read config dials (N2 review finding).

### Phase 4: Provider Equipment Manifest & Day View
- [x] **S6-P4-01** | P0 | M | `useProviderDayPlan` hook — aggregates visits + tasks for a provider's day with equipment union, total service minutes.
- [x] **S6-P4-02** | P0 | M | `DayPlanComponents` — TodayLoadout (collapsible equipment checklist with packed state), DayPlanStopCard (ETA, bundling, equipment per stop), DayPlanSummary (compact stat bar).
- [x] **S6-P4-03** | P0 | S | Integrate loadout + summary into provider Jobs page Today tab.

### Phase 5: Customer ETA Display
- [x] **S6-P5-01** | P0 | M | Customer UpcomingVisits ETA enhancements — Scheduled/locked visits show precise ETA range, Planned/draft visits show coarse AM/PM block (e.g., "Wed (AM)"), microcopy: "Planned visits may shift nightly until they become Scheduled."

*Last updated: 2026-03-04 — Sprint 6 Phase 5 complete. Route Sequencing v1 fully operational.*

---

## PRD-300 Sprint 7 — Appointment Windows v1 (Home-Required Services)

> **PRD:** `docs/prds/unfinished/prd_300_sprint_7_appointment_windows_v_1_home_required_services.md`
> **Goal:** Time-window scheduling for home-required services, feasibility-filtered window offering, route integration, service-week relief valve.
> **Complexity:** XL (5 phases)

### Phase 1: Schema + Config Foundation
- [x] **S7-P1-01** | P0 | M | Create `scheduling_profile` enum (appointment_window, day_commit, service_week) and `access_mode` enum (customer_present, provider_access, exterior_only). Add both columns to `service_skus`.
- [x] **S7-P1-02** | P0 | M | Add visit-level columns: `scheduling_profile`, `service_week_start`, `service_week_end`, `due_status`, `customer_window_preference`, `piggybacked_onto_visit_id` FK.
- [x] **S7-P1-03** | P0 | M | Create `appointment_window_templates` table (zone + category + time slots). RLS: admin write, authenticated read.
- [x] **S7-P1-04** | P0 | S | Seed 11 Sprint 7 `assignment_config` dials (window offering, piggybacking, service-week relief valve).
- [x] **S7-P1-05** | P0 | S | Indexes on scheduling_profile, service_week, piggybacked, templates.

### Phase 2: Window Offering Engine
- [x] **S7-P2-01** | P0 | XL | `offer-appointment-windows` edge function — generate 3–6 feasible windows from templates, filter by provider supply/availability/blocked windows, respect caps, AM/PM fallback.

### Phase 3: Customer UX — Window Picker + Visit Display
- [x] **S7-P3-01** | P0 | L | Appointment picker flow for home-required services (offered windows, confirmation).
- [x] **S7-P3-02** | P0 | M | Visit display updates (appointment badge, "Scheduled this week", due-soon/overdue badges, piggybacking disclosure).

### Phase 4: Route Feasibility + Sequencing Update
- [x] **S7-P4-01** | P0 | XL | Update `route-sequence` with VRPTW feasibility, windowed-first sequencing, piggybacking, infeasibility repair.

### Phase 5: Provider + Admin UX
- [x] **S7-P5-01** | P0 | L | Provider: time window badges, reorder constraints, week view with due-this-week queue. New `useProviderVisits` hook (queries visits table with visit_tasks + service_skus join). `VisitJobCard` component with time window badges (appointment time, "This week", due-soon/overdue, presence-required, bundled/piggybacked). `WeekDueQueue` component (overdue-first priority queue). "This Week" tab on provider Jobs page with date-grouped visits + due queue.
- [x] **S7-P5-02** | P0 | M | Admin: SKU scheduling profile/access mode management (added to SkuFormSheet — dropdowns with enum values + helper text), window template CRUD (`/admin/scheduling/windows` — zone filter, category grouping, create/edit/delete sheets), scheduling exceptions dashboard (`/admin/scheduling/exceptions` — unbooked home-required, window infeasible, overdue service-week). Both pages wired into AdminShell sidebar.

### Phase 4 → Phase 5 Carryover Fix
- [x] **S7-P4-FIX** | P2 | S | Fixed `piggybackAdjacencyValid` to support multiple children per parent — prev can be parent OR sibling piggybacked onto same parent.

*Last updated: 2026-03-04 — Sprint 7 Phase 5 complete. Provider + Admin UX operational.*

---

## PRD-300 Sprint 8 — Exceptions, Reschedules & Ops Control v1

> **PRD:** `docs/prds/unfinished/prd_300_sprint_8_exceptions_reschedules_and_ops_control_v_1.md`
> **Goal:** Unified exceptions queue, repair actions, provider issue reporting, customer reschedule flows, freeze override policy.
> **Complexity:** XL (6 phases)

### Phase 1: Schema & Config Foundation
- [x] **S8-P1-01** | P0 | M | Create `ops_exception_type`, `ops_exception_severity`, `ops_exception_status` enums. Create `ops_exceptions`, `ops_exception_actions`, `ops_exception_attachments`, `customer_reschedule_holds` tables with RLS, triggers, partial unique index.
- [x] **S8-P1-02** | P0 | S | Seed 13 config dials into `assignment_config` (SLA targets, repair weights, freeze/hold params).
- [x] **S8-P1-03** | P0 | S | Seed 6 `notification_templates` for exception events.
- [x] **S8-P1-04** | P1 | S | CHECK constraints on `customer_reschedule_holds` (hold_type, status), `ops_exception_actions` (action_type), `ops_exceptions` (resolution_type). Provider attachment SELECT RLS. `idx_ops_exceptions_customer` index.

### Phase 2: Exception Generation Engine (Predictive)
- [x] **S8-P2-01** | P0 | L | Integrated predictive exception detection into `route-sequence` edge function — window-at-risk, provider overload, coverage break, service-week-at-risk.
- [x] **S8-P2-02** | P0 | M | Severity/SLA computation + auto-escalation routine.
- [x] **S8-P2-03** | P0 | S | Idempotent upsert via `idempotency_key` + `ignoreDuplicates`.

#### Phase 2 Review Fixes
- [x] **S8-P2-F1** | P1 | S | Fixed provider overload double-count — split into `isPureInfeasibility` (non-window) vs `isOvertimeOnly` (feasible but overtime). Window violations no longer generate both `window_at_risk` and `provider_overload`.
- [x] **S8-P2-F2** | P2 | S | Added `due_soon` to service-week-at-risk detection — `due_soon` generates exception at `soon` severity (was only catching `overdue`).
- [x] **S8-P2-F3** | P2 | S | Fixed `exceptionsCreated` counter — uses `.select("id")` + length check to distinguish truly new from duplicate-skipped. Added `exceptionsSkipped` counter.
- [x] **S8-P2-F4** | P3 | S | Coverage break excludes repair-dropped visits — filters out `exception_pending` visits with `unassigned_reason` set.

### Phase 3: Reactive Exception Flows
- [x] **S8-P3-01** | P0 | L | `report_provider_issue` RPC — provider reports access_failure/unavailable/weather/quality_block. Creates reactive `ops_exception`. For access_failure: marks visit `exception_pending`, auto-creates `customer_reschedule_holds` with configurable TTL, emits `CUSTOMER_ACCESS_FAILURE_HOLD` notification.
- [x] **S8-P3-02** | P0 | M | `request_customer_reschedule` RPC — customer-initiated, creates `customer_reschedule` exception with severity based on lead time.
- [x] **S8-P3-03** | P0 | M | `confirm_reschedule_hold` RPC — customer confirms or releases auto-held slot. On confirm: reschedules visit, resolves exception, notifies.
- [x] **S8-P3-04** | P0 | M | `apply_customer_reschedule` RPC — customer picks new date from offered options. Releases any active holds.
- [x] **S8-P3-05** | P0 | S | `expire_stale_holds` RPC — expires holds past TTL. Wired into `run-scheduled-jobs` daily.
- [x] **S8-P3-06** | P0 | S | Seeded 2 notification templates (`ADMIN_EXCEPTION_CREATED`, `CUSTOMER_ACCESS_FAILURE_HOLD`).

### Phase 4: Ops Console UX (Admin)
- [x] **S8-P4-01** | P0 | L | `/admin/ops/exceptions` page — exceptions queue with severity/type/status filters, SLA countdown, affected customer/provider info. `useOpsExceptions` hook with 30s polling, zone/provider/visit joins. `OpsExceptionQueue` component with severity icons, SLA countdown, filter bar.
- [x] **S8-P4-02** | P0 | L | Exception detail panel — context cards (visit, zone, provider, customer), reason details JSON, repair suggestions (per exception type), SLA bar, decision traces integration. Status transition buttons (acknowledge, start work, escalate, resolve). Actions history timeline.
- [x] **S8-P4-03** | P0 | M | Ops actions dialog — 10 action types (reorder, move day, swap provider, convert profile, cancel, credit, contact, redo, note), 8 reason codes, freeze override toggle, 10-min undo window. `OpsActionDialog` component. `useRecordOpsAction` mutation. Sidebar nav with exception count badge (`useOpsExceptionCount` with 30s polling).

### Phase 5: Customer + Provider UX
- [x] **S8-P5-01** | P0 | L | Customer reschedule flow — `/customer/reschedule/:visitId` page. Access failure hold (confirm/choose-another with auto-held slot display + expiry countdown). Customer-initiated reschedule (reason + feasible window picker via `offer-appointment-windows`). `useCustomerReschedule` hook with `useRescheduleHold`, `useConfirmRescheduleHold`, `useRequestReschedule`, `useApplyReschedule`. UpcomingVisits `exception_pending` state now shows "Reschedule Visit" CTA.
- [x] **S8-P5-02** | P0 | M | Provider issue reporting UI — `ProviderReportIssueSheet` with PRD reason codes (access_failure, unavailable, weather, quality_block) + sub-reason codes (gate_locked, customer_not_home, sick, etc.). Wired to `report_provider_issue` RPC via `useReportProviderIssue` hook. JobDetail resolves visit_id via property+date+provider lookup, with fallback to legacy `report_job_issue`. Access failure note explains no reliability penalty.

### Phase 6: Analytics + Stale Cleanup
- [x] **S8-P6-01** | P1 | M | Auto-resolve stale exceptions — `auto_resolve_stale_exceptions` RPC (SECURITY DEFINER, service_role only). Resolves exceptions where visit is completed/canceled/skipped, visit deleted, or predictive exception for past date. Sets `resolution_type = 'auto_stale'` with descriptive note.
- [x] **S8-P6-02** | P1 | M | Exception analytics dashboard — `get_exception_analytics` RPC returns aggregate metrics (total/resolved/open, resolution rate, avg resolve hours, break-freeze count, by type/zone/severity/resolution_type). `/admin/ops/exception-analytics` page with KPI cards, bar chart by type, severity pie, resolution type pie, zone table, time-to-resolve breakdown. Period selector (7/14/30/90 days). `useExceptionAnalytics` hook. Nav link added.

*Last updated: 2026-03-07 — Sprint 8 Phase 6 complete. Auto-resolve stale exceptions + exception analytics dashboard operational.*

---

## PRD-300 Sprint 9 — Ops Dashboard v2 (Autopilot Health + Configurable Thresholds)

> **PRD:** `docs/prds/unfinished/prd_300_sprint_9_ops_user_manual.md`
> **Goal:** Autopilot status banner (G/Y/R), zone health table (rolling 7d), configurable thresholds, alerting behavior.
> **Complexity:** L (3 phases)

### Phase 1: Autopilot Status Banner + KPI Tiles
- [x] **S9-P1-01** | P0 | M | `useAutopilotHealth` hook — computes GREEN/YELLOW/RED from existing metrics (jobs at risk, exceptions backlog, failed payments, proof missing, issue rate, capacity, past due, redo intents). Returns status, reasons array, KPI snapshot.
- [x] **S9-P1-02** | P0 | M | `AutopilotBanner` component — collapsible card with status icon/color, reason count badge, expandable "Why not green?" breakdown sorted by severity. Integrated at top of OpsCockpit.

### Phase 2: Zone Health Table (Rolling 7-Day)
- [x] **S9-P2-01** | P0 | M | `get_zone_health_rolling` RPC — per-zone rolling 7-day metrics: jobs today, unassigned today, reschedule rate (LOCKED), avg drive minutes/route, proof missing rate, dispute rate. Admin-guarded via `admin_memberships` check.
- [x] **S9-P2-02** | P0 | M | `ZoneHealthTable` component — sortable table with drilldowns (click zone → underlying jobs/providers). `useZoneHealthRolling` hook. Integrated into OpsCockpit below KPI grid.

### Phase 3: Configurable Thresholds + Alerting
- [x] **S9-P3-01** | P0 | S | Seed 9 threshold dials into `assignment_config` (autopilot_max_unassigned_locked, autopilot_sla_risk_threshold, autopilot_max_proof_missing_rate, autopilot_max_reschedule_rate_locked, autopilot_max_provider_callouts_day, autopilot_max_avg_drive_minutes, autopilot_max_open_exceptions, autopilot_max_issue_rate_7d, autopilot_max_redo_intents_7d).
- [x] **S9-P3-02** | P0 | M | `AutopilotThresholdsDialog` — admin-editable threshold dials with save/reset. Accessible from OpsCockpit header "Thresholds" button.
- [x] **S9-P3-03** | P0 | M | Wire thresholds into `useAutopilotHealth` — reads config dials from `assignment_config`, falls back to hardcoded defaults. Threshold values shown in reason detail strings.

*Last updated: 2026-03-07 — Sprint 9 Phases 1–3 complete. Autopilot health banner, zone health table, configurable thresholds operational.*
