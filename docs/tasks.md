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
- [ ] **2C-C4a** | P1 | M | Wire customer service updates — service_day_confirmed, reminder_24h, provider_en_route, job_started, receipt_ready, issue_status_changed.
- [ ] **2C-C4b** | P1 | M | Wire provider service updates — no_show_ping, job_reassigned, payout_posted, hold_released.
- [ ] **2C-C4c** | P1 | S | Banner surfaces — payment failure banner, weather reschedule banner, provider SLA banner tied to notification records.

### Sprint C5: Polish + Delivery Providers
- [ ] **2C-C5a** | P2 | L | Email delivery integration — transactional email provider setup, template rendering, critical-only emails (payment failed, receipt, security).
- [ ] **2C-C5b** | P2 | M | Digest behavior — combine multiple non-critical events into daily summary, suppress extra pushes beyond rate limit.
- [ ] **2C-C5c** | P2 | S | Admin notification health view — failed sends, deadletters, processing latency dashboard.

---

## Round 2D — Customer Experience Polish (Retention)

> Make customers unable to imagine life without Handled Home.

### Onboarding Wizard
- [ ] **2D-01** | P0 | XL | Guided onboarding flow — single wizard: property → zone check → plan selection → subscribe → service day accept → build routine → confirmation. Progress bar, back navigation, skip-ability
- [ ] **2D-02** | P0 | M | Zone availability check during onboarding — after property entered, check zip against zones. If no zone: show waitlist signup. If zone exists: continue flow
- [ ] **2D-03** | P1 | M | Onboarding completion tracking — track which steps completed. Re-engage incomplete signups with notification/email

### Ratings & Reviews
- [ ] **2D-04** | P0 | L | Post-visit rating — after job completed, prompt customer to rate (1-5 stars) + optional comment. Per-SKU or per-visit. Store in `visit_ratings` table
- [ ] **2D-05** | P1 | M | Rating summary on provider profile — average rating, total reviews, displayed to admin
- [ ] **2D-06** | P2 | M | Smart rating prompts — only prompt after 2nd+ visit (first visit = learning curve). Suppress if issue already reported

### Property Health Score
- [ ] **2D-07** | P1 | L | Property health score algorithm — composite of: service regularity, SKU coverage, seasonal service adoption, issue frequency. 0-100 scale
- [ ] **2D-08** | P1 | M | Property health dashboard widget — show score on customer dashboard with trend arrow. "Your home health: 87/100 ↑"
- [ ] **2D-09** | P2 | M | Health score anxiety loop — if score drops (missed services, skipped seasons), show gentle nudge: "Your lawn health dropped 12 points this month"

### Plan Self-Service
- [ ] **2D-10** | P0 | L | Plan upgrade/downgrade flow — customer can switch plans. Pro-rate billing. Update entitlements immediately. Confirm via modal
- [ ] **2D-11** | P0 | M | Subscription cancellation flow — cancel with reason survey, retention offer (discount or credit), confirm cancellation, grace period
- [ ] **2D-12** | P1 | M | Subscription pause — pause for 1-4 weeks (configurable). Auto-resume. Jobs skipped during pause

### Photo & Proof Experience
- [ ] **2D-13** | P0 | L | Wire Supabase Storage for visit photos — create bucket, upload from provider app, signed URL display in customer gallery
- [ ] **2D-14** | P1 | M | Before/after photo comparison view — side-by-side or swipe slider for customer visit detail
- [ ] **2D-15** | P2 | M | Photo timeline — chronological property photo history across all visits. "See your yard over time"

### Customer Engagement
- [ ] **2D-16** | P2 | M | NPS survey — trigger at day 30, 90, 180. Simple 0-10 + comment. Track in `nps_responses` table
- [ ] **2D-17** | P2 | M | Customer streak rewards — "12 consecutive service weeks!" Badge on dashboard. Milestone notifications
- [ ] **2D-18** | P2 | L | Neighborhood leaderboard — "Your neighborhood: 14 homes handled. You're one of the first!" Social proof widget

---

## Round 2E — Provider Experience Polish (Supply Retention)

> Make it economically irrational for providers to leave.

### Real-Time Job Tracking
- [ ] **2E-01** | P0 | L | Job status flow UI — en route → arrived → in progress → completed. Status buttons in job detail. GPS timestamp on arrive/depart
- [ ] **2E-02** | P1 | M | Live job status for customers — "Your provider is on the way" / "Service in progress" on customer dashboard
- [ ] **2E-03** | P1 | M | Estimated arrival time — based on job order + avg time per job in route

### Earnings Analytics
- [ ] **2E-04** | P0 | L | Earnings dashboard — daily/weekly/monthly breakdown. Per-job earnings with SKU detail. Graphs showing earnings trend
- [ ] **2E-05** | P1 | M | Earnings projections — "At current pace, you'll earn $X this month" based on scheduled jobs
- [ ] **2E-06** | P1 | M | Bonus/modifier transparency — show why earning was adjusted (quality bonus, rush fee, hold reason)

### Provider Tools
- [ ] **2E-07** | P1 | L | Provider training/certification — required video/content before SKU authorization. Track completion in `provider_certifications` table
- [ ] **2E-08** | P2 | M | Equipment recommendations — per-SKU equipment list. "Recommended for Standard Mow: Honda HRX217"
- [ ] **2E-09** | P2 | L | Tax document generation — annual 1099 summary. Download as PDF. Based on `provider_earnings` aggregation
- [ ] **2E-10** | P2 | M | Provider availability calendar — set days off, vacation blocks. System respects during job assignment

### Provider Gamification
- [ ] **2E-11** | P1 | M | Provider leaderboard — top earners, highest rated, most consistent. Zone-level and platform-level
- [ ] **2E-12** | P2 | M | Achievement badges — "100 jobs completed", "30-day perfect score", "5-star streak". Display on provider profile
- [ ] **2E-13** | P2 | M | Tier system — Bronze/Silver/Gold/Platinum based on performance. Higher tiers get priority assignment + lower hold periods

---

## Round 2F — Growth Engine Activation (Viral Scaling)

> Every touchpoint is a growth opportunity. Viral by design.

### Neighborhood Social Proof
- [ ] **2F-01** | P1 | L | Neighborhood density widget — "X homes on your street use Handled Home" (based on zip/geohash proximity)
- [ ] **2F-02** | P1 | M | Post-job share prompt — after every completed job, prompt: "Share your results with neighbors?" → generate share card
- [ ] **2F-03** | P2 | M | Neighborhood milestone notifications — "Your neighborhood just hit 25 homes! 🎉" Celebrate density milestones

### Viral Mechanics
- [ ] **2F-04** | P0 | M | Shareable proof cards — auto-generate branded before/after card from job photos. Shareable link with referral code embedded
- [ ] **2F-05** | P1 | L | Referral compounding — multi-tier referral tracking. Referrer gets credit when their referral also refers. Cap at 2 levels
- [ ] **2F-06** | P1 | M | Provider customer acquisition bonus — providers earn bonus for customers they bring to the platform (tracked via provider invite code)
- [ ] **2F-07** | P2 | M | Yard sign program — customer opts in to physical yard sign after service. Track sign-ups. Discount incentive for participation

### Zone Launch Automation
- [ ] **2F-08** | P1 | XL | Automated zone launch playbook — when waitlist threshold hit: create zone → recruit providers → soft launch → ramp to open. Checklist-driven
- [ ] **2F-09** | P1 | L | Founding partner automation — founding partner providers get guaranteed income floor for first 90 days. Auto-calculate and pay difference if under floor
- [ ] **2F-10** | P1 | M | Launch zone marketing kit — auto-generate zone-specific landing page with: available services, pricing, founding member offer

### Referral Program Enhancements
- [ ] **2F-11** | P1 | M | Referral dashboard enhancements — show pending/earned/paid breakdown, referral tree visualization, total lifetime earnings from referrals
- [ ] **2F-12** | P2 | M | Seasonal referral campaigns — admin can create time-limited bonus multipliers on referral rewards
- [ ] **2F-13** | P2 | M | Corporate/HOA referral program — bulk invite with custom landing page, HOA-specific pricing tier

---

## Round 2G — Admin Intelligence (Operational Leverage)

> Admins should manage by exception, not by process.

### Advanced Analytics
- [ ] **2G-01** | P0 | XL | Unit economics dashboard — CAC, LTV, LTV:CAC ratio, payback period, gross margin per job, per zone, per plan tier. Cohort analysis by signup month
- [ ] **2G-02** | P1 | L | Churn analysis — churn by reason, by zone, by plan, by tenure. Predictive churn score per customer
- [ ] **2G-03** | P1 | L | Provider utilization dashboard — jobs/day per provider, capacity utilization %, idle time, geographic coverage efficiency
- [ ] **2G-04** | P1 | M | Revenue forecasting — next 30/60/90 day MRR projection based on current subscribers + churn rate + pipeline

### Admin Tools
- [ ] **2G-05** | P1 | L | Admin impersonation mode — "View as Customer X" to see exactly what they see. Read-only. Audit logged
- [ ] **2G-06** | P1 | M | Bulk operations — bulk reassign jobs, bulk notify customers, bulk apply credits. For zone-wide operations
- [ ] **2G-07** | P1 | M | Admin notification queue — real-time feed of events requiring attention: failed payments, SLA breaches, capacity warnings, new provider applications
- [ ] **2G-08** | P2 | M | Automated pricing optimization — suggest price adjustments based on zone density, demand elasticity, provider cost

### Zone Health
- [ ] **2G-09** | P0 | M | Zone health alerting — real-time alerts when zone metrics degrade: capacity >90%, provider churn, customer churn spike, photo compliance drop
- [ ] **2G-10** | P1 | M | Zone comparison dashboard — side-by-side zone metrics for identifying best/worst performers
- [ ] **2G-11** | P2 | L | Automated zone health reports — weekly email digest to admin with zone-by-zone scorecard

---

## Round 2H — Platform Hardening (Scale Readiness)

> Build for 100x the current load. No technical debt at scale.

### Data & Storage
- [ ] **2H-01** | P0 | L | Photo storage optimization — image compression on upload, thumbnail generation, CDN-backed signed URLs, cleanup of orphaned uploads
- [ ] **2H-02** | P1 | M | Database query optimization — add missing indexes, query plan analysis for slow queries, connection pooling review
- [ ] **2H-03** | P1 | M | Data archival strategy — move jobs/invoices older than 2 years to archive tables. Keep aggregates accessible

### Multi-Property
- [ ] **2H-04** | P1 | L | Multi-property support — customer can manage 2+ properties. Each property has own zone, service day, routine. Property switcher in app
- [ ] **2H-05** | P1 | M | Per-property billing — each property can be on different plan. Consolidated or separate invoices (customer choice)

### Security & Compliance
- [ ] **2H-06** | P0 | M | Terms of Service acceptance flow — require ToS + Privacy Policy acceptance at signup. Track version + timestamp. Re-prompt on policy updates
- [ ] **2H-07** | P0 | M | Rate limiting — API rate limits on auth endpoints, edge functions. Prevent abuse
- [ ] **2H-08** | P1 | M | Error monitoring — structured error logging, edge function error tracking, client-side error boundary reporting
- [ ] **2H-09** | P1 | M | RLS policy audit — review all tables for proper row-level security. Ensure no data leaks between customers/providers
- [ ] **2H-10** | P2 | M | GDPR/CCPA compliance — data export (customer can download their data), data deletion request flow, consent tracking

### Mobile & Deployment
- [ ] **2H-11** | P1 | L | App store deployment pipeline — Capacitor build scripts, iOS/Android signing, app store metadata, screenshots, review submission checklist
- [ ] **2H-12** | P1 | M | Deep linking — app links for share cards, referral invites, notification taps. Handle both web and native
- [ ] **2H-13** | P1 | L | Offline photo queue resilience — Capacitor filesystem cache for photos, retry queue with exponential backoff, sync indicator UI
- [ ] **2H-14** | P2 | M | Accessibility audit — WCAG AA compliance check, screen reader testing, keyboard navigation, color contrast verification
- [ ] **2H-15** | P1 | M | Server-side pagination for admin tables — replace client-side `.limit(100)` with cursor-based pagination for jobs, subscriptions, providers, invoices

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
| 2C — Notifications | 35 | 29 | 83% |
| 2D — Customer Polish | 18 | 0 | 0% |
| 2E — Provider Polish | 13 | 0 | 0% |
| 2F — Growth Engine | 13 | 0 | 0% |
| 2G — Admin Intelligence | 11 | 0 | 0% |
| 2H — Platform Hardening | 15 | 0 | 0% |
| 2I — Future Moats | 9 | 0 | 0% |
| **TOTAL** | **161** | **76** | **47%** |

---

*Last updated: 2026-02-26 — Sprint C3 complete (18 templates seeded, 5 edge functions wired to event bus)*
