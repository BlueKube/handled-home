# tasks.md — Handled Home Implementation Roadmap

> **Generated:** 2026-02-25
> **Codebase health:** ~92% structurally complete
> **Stripe:** Fully integrated (checkout, Connect, webhooks, payouts)
> **Edge Functions:** 11 deployed and operational
> **Hooks:** 59 custom hooks (6,524 lines)
> **Placeholder Pages:** 10 remaining
> **Capacitor:** Configured but no native builds yet
> **Push Notifications:** Not implemented

---

## How to read this document

- **Phases** are ordered by dependency chain and business impact
- **Tasks** within each phase can often be parallelized
- Each task references the source PRD in `docs/modules/`
- `[PLACEHOLDER]` = currently showing "Coming Soon" via `PlaceholderPage.tsx`
- `[MISSING]` = no code exists at all
- `[PARTIAL]` = some code exists but incomplete vs PRD
- `[INFRA]` = infrastructure/plumbing needed by multiple modules

---

## Phase 0: Infrastructure & Plumbing

> These unblock everything else. Without push notifications, the "Your home is handled" promise breaks. Without cron jobs, billing/payouts don't run automatically. Without native mobile builds, there's no app store presence.

### 0.1 — Push Notification System `[MISSING]` `[INFRA]`

**Why:** Every module needs this — job completion alerts, payment failure warnings, Service Day offers, support ticket updates, payout confirmations. Without push, the entire "handled" brand promise collapses into "check the app manually."

**PRD refs:** Module 09 §6.1 (customer receipt notification), Module 10 §13 (completion push + en-route push), Module 06 §5 (Service Day offer banner), Module 11 §10.1 (dunning push), Module 12 §6.1 (support resolution)

**Scope:**
- [ ] Capacitor push notification plugin setup (FCM for Android, APNs for iOS)
- [ ] Device token registration on login (store in `user_device_tokens` table)
- [ ] Supabase Edge Function: `send-push-notification` (accepts user_id, title, body, deep_link, data payload)
- [ ] Database table: `notifications` (id, user_id, title, body, deep_link, read_at, created_at)
- [ ] In-app notification center (bell icon → list of recent notifications)
- [ ] Hook into existing events:
  - Job completed → push to customer with deep link to `/customer/visits/:job_id`
  - Payment failed → push to customer with deep link to `/customer/billing`
  - Service Day offer created → push to customer
  - Support ticket resolved → push to customer
  - Payout posted → push to provider
  - New job assigned → push to provider
- [ ] RLS: users read only their own notifications
- [ ] Rate limiting: max 1 push per event type per user per hour

**Files to create:**
- `supabase/functions/send-push-notification/index.ts`
- `supabase/migrations/XXXXXX_create_notifications_table.sql`
- `src/hooks/useNotifications.ts`
- `src/components/NotificationCenter.tsx`

**Estimated complexity:** Medium-high (Capacitor plugin config + edge function + database + UI)

---

### 0.2 — Scheduled Job Automation (Cron) `[MISSING]` `[INFRA]`

**Why:** Billing runs, payout runs, dunning retries, TTL cleanup, and snapshot rollup all need automated scheduling. Currently only `snapshot-rollup` exists but isn't formally scheduled via pg_cron.

**PRD refs:** Module 11 §13.1 (weekly payout runs), Module 11 §10.2 (dunning retry schedule), Module 06 §7.4 (TTL cleanup for unconfirmed offers), Module 14 (daily snapshot rollup)

**Scope:**
- [ ] Enable `pg_cron` + `pg_net` extensions in Supabase
- [ ] Create migration with cron schedule entries:
  - `snapshot-rollup`: daily at 02:00 UTC
  - `run-billing-automation`: daily at 06:00 UTC (invoice generation + dunning retries)
  - `process-payout`: weekly on Mondays at 08:00 UTC (aggregate eligible earnings, initiate payouts)
  - `cleanup-expired-offers`: hourly (TTL cleanup for unconfirmed Service Day offers)
- [ ] Add idempotency guards to each function (safe to re-run)
- [ ] Add `cron_run_log` table for observability (function_name, started_at, completed_at, status, error)
- [ ] Admin UI: simple cron status page showing last run times and any failures

**Files to create:**
- `supabase/migrations/XXXXXX_setup_cron_schedules.sql`
- `supabase/migrations/XXXXXX_create_cron_run_log.sql`

**Files to modify:**
- `supabase/functions/run-billing-automation/index.ts` (add idempotency key logging)
- `supabase/functions/process-payout/index.ts` (add idempotency key logging)
- `supabase/functions/cleanup-expired-offers/index.ts` (add idempotency key logging)

**Estimated complexity:** Medium (SQL migrations + idempotency checks)

---

### 0.3 — Capacitor Native Mobile Builds `[PARTIAL]` `[INFRA]`

**Why:** This is a mobile-first app (design guidelines: "No desktop breakpoints"). `capacitor.config.ts` exists but no iOS/Android project directories, no native builds, no app store deployment pipeline.

**PRD refs:** Masterplan §Tech Stack (Capacitor for iOS/Android), Design Guidelines §Platform ("Mobile-first iOS & Android app via Capacitor")

**Scope:**
- [ ] Initialize iOS and Android projects (`npx cap add ios`, `npx cap add android`)
- [ ] Configure app icons and splash screens per design guidelines
- [ ] Set up deep linking scheme (`handledhome://` for internal links)
- [ ] Configure camera access permissions (required for photo proof in Module 09)
- [ ] Configure location permissions (optional, for bounded GPS tracking in Module 09 §13)
- [ ] Configure safe area insets per design guidelines (`env(safe-area-inset-top/bottom)`)
- [ ] Test build on iOS simulator and Android emulator
- [ ] Set up CI/CD for native builds (Fastlane or EAS Build recommended)
- [ ] TestFlight / Play Store internal testing track setup

**Files to create:**
- `ios/` directory (Capacitor iOS project)
- `android/` directory (Capacitor Android project)
- `fastlane/Fastfile` or equivalent CI config

**Estimated complexity:** Medium (standard Capacitor setup, but camera/location permissions need testing)

---

## Phase 1: Complete the Customer Core Loop

> A customer signs up → subscribes → gets a Service Day → builds their routine → receives service → sees proof. The Bundle Builder (07) is the missing piece that lets customers choose what services they get.

### 1.1 — Bundle Builder `[PLACEHOLDER]` — `/customer/build`

**Why:** This is how customers select and customize their service routine. Without it, the "Build My Routine" step in the signup flow is broken. The 4-week preview (Module 10) has nothing to preview. This is the single most important customer-facing feature gap.

**PRD ref:** `docs/modules/07-bundle-builder.md`

**Current state:** `src/pages/customer/Build.tsx` renders `PlaceholderPage` with module="07 — Bundle Builder"

**Scope:**
- [ ] SKU selection grid: show available SKUs for the customer's zone + plan entitlements
  - Category cards (Exterior, Interior, Seasonal, etc.)
  - SKU cards within each category with scope description, photo requirement indicator, price
  - Toggle to add/remove from routine
- [ ] Cadence picker per SKU: weekly / biweekly / monthly / one-time (seasonal)
- [ ] 4-week preview: render a week-by-week view of what will happen based on selections
  - Show which SKUs execute in which weeks
  - Show total estimated cost per cycle
- [ ] Bundle confirmation flow:
  - Summary of selected SKUs + cadences
  - Total cycle cost
  - "Confirm Routine" CTA
  - "Changes take effect next cycle" messaging
- [ ] Seasonal boost add-ons:
  - Separate section for one-time seasonal services
  - "Add to next Service Day" or "Schedule for specific cycle week"
- [ ] Routine versioning: create new `routine_version` + `routine_items` rows on confirm
- [ ] Entitlement enforcement: only show SKUs the customer's plan entitles
- [ ] Server-side validation: RPC to validate bundle against plan entitlements + zone availability

**Database tables involved** (all should exist from Module 07 migrations):
- `routines`, `routine_versions`, `routine_items`
- `service_skus`, `plans`, `plan_entitlement_versions`, `plan_entitlement_sku_rules`
- `customer_seasonal_selections`

**Files to create/modify:**
- `src/pages/customer/Build.tsx` (replace placeholder)
- `src/hooks/useBundleBuilder.ts` (new)
- `src/hooks/useRoutine.ts` (new or extend existing)
- `src/components/customer/SkuSelectionGrid.tsx` (new)
- `src/components/customer/CadencePicker.tsx` (new)
- `src/components/customer/BundlePreview.tsx` (new)
- `src/components/customer/BundleConfirmation.tsx` (new)

**Estimated complexity:** High (multi-step UI with entitlement logic, cadence math, preview rendering)

---

### 1.2 — Customer Account Settings `[PLACEHOLDER]` — `/customer/settings`

**Why:** Customers need to update their profile, change password, manage notification preferences, and view their property details. Basic account management.

**PRD ref:** Module 01 — Auth & Roles, `docs/modules/01-auth-and-roles.md`

**Current state:** `src/pages/customer/Settings.tsx` renders `PlaceholderPage`

**Scope:**
- [ ] Profile section: display name, email (read-only), phone
- [ ] Password change (Supabase Auth `updateUser`)
- [ ] Notification preferences (push on/off per category — ties to Phase 0.1)
- [ ] Property link (deep link to existing property profile page)
- [ ] Subscription summary card (plan name, next bill date, deep link to billing)
- [ ] Sign out
- [ ] Delete account request (soft delete → support ticket)

**Files to modify:**
- `src/pages/customer/Settings.tsx` (replace placeholder)

**Files to create:**
- `src/components/customer/ProfileForm.tsx`
- `src/components/customer/NotificationPreferences.tsx`

**Estimated complexity:** Low-medium

---

## Phase 2: Complete the Provider Operational Loop

> Providers onboard (already built) → execute jobs (already built) → but can't manage their organization, see their earnings, view their performance metrics, or adjust their coverage. These 5 placeholder pages block the provider experience from being complete.

### 2.1 — Provider Earnings `[PLACEHOLDER]` — `/provider/earnings`

**Why:** Providers can't see how much they've earned or when they'll get paid. This is the #1 provider retention feature — "show me the money." The payout infrastructure exists (Stripe Connect, `process-payout` edge function, webhook handler) but the UI doesn't.

**PRD ref:** `docs/modules/11-billing-and-payouts.md` §11 (Provider payouts experience)

**Current state:** `src/pages/provider/Earnings.tsx` renders `PlaceholderPage`

**Scope:**
- [ ] Earnings overview card:
  - "Next payout: {date}" (if payout account READY)
  - "Available soon" balance (ELIGIBLE earnings)
  - "On hold" balance (HELD earnings with reason categories)
  - CTA: "Set up payouts" if NOT_READY
- [ ] Earnings list (by job):
  - Date, property label, total amount, status (Earned / Eligible on {date} / Paid)
  - Tap → earnings detail (base + modifiers, hold reason if held)
- [ ] Payout history:
  - Payout date, total, included earnings count, status (Paid / Failed)
  - Tap → payout detail (included earnings list, processor reference)
- [ ] Payout onboarding status:
  - NOT_READY / PENDING_VERIFICATION / READY / RESTRICTED
  - If RESTRICTED: "Action required" with Stripe Connect link (use existing `create-connect-account-link` edge function)

**Database tables involved:**
- `provider_earnings`, `provider_payouts`, `provider_payout_line_items`
- `provider_holds`, `provider_hold_context`
- `provider_payout_accounts`

**Files to modify:**
- `src/pages/provider/Earnings.tsx` (replace placeholder)

**Files to create:**
- `src/hooks/useProviderEarnings.ts`
- `src/hooks/useProviderPayouts.ts`
- `src/components/provider/EarningsOverview.tsx`
- `src/components/provider/EarningsList.tsx`
- `src/components/provider/PayoutHistory.tsx`

**Estimated complexity:** Medium (reads from existing tables, links to existing Stripe Connect functions)

---

### 2.2 — Provider Organization Management `[PLACEHOLDER]` — `/provider/organization`

**Why:** After onboarding, providers need to update their org profile, manage team members (future), view insurance/compliance status, and update contact info.

**PRD ref:** `docs/modules/08-provider-onboarding.md` §Provider Dashboard Gate, §Data Model

**Current state:** `src/pages/provider/Organization.tsx` renders `PlaceholderPage`

**Scope:**
- [ ] Org profile display + edit: name, contact phone, home base ZIP, website, logo
- [ ] Accountable Owner display (name, phone, email — read-only for non-admin)
- [ ] Compliance status section:
  - Insurance attestation status + expiry
  - Tax form status
  - Background check consent
  - Document upload/re-upload capability
  - Risk flags (visible as warnings)
- [ ] Team members list (read-only in MVP — data model supports members, no management UI yet)
- [ ] Org status badge (ACTIVE / PROBATION with reason / SUSPENDED with reason + support CTA)

**Database tables involved:**
- `provider_orgs`, `provider_members`, `provider_compliance`
- `provider_risk_flags`, `provider_enforcement_actions`

**Files to modify:**
- `src/pages/provider/Organization.tsx` (replace placeholder)

**Files to create:**
- `src/hooks/useProviderOrg.ts`
- `src/components/provider/OrgProfile.tsx`
- `src/components/provider/ComplianceStatus.tsx`

**Estimated complexity:** Medium

---

### 2.3 — Provider Coverage & Capacity `[PLACEHOLDER]` — `/provider/coverage`

**Why:** Providers need to see which zones they're approved for, request new zones, and view their capacity/availability.

**PRD ref:** `docs/modules/08-provider-onboarding.md` §Step 2 — Coverage

**Current state:** `src/pages/provider/Coverage.tsx` renders `PlaceholderPage`

**Scope:**
- [ ] Approved zones list with status badges (APPROVED / REQUESTED / DENIED)
- [ ] Zone details: zone name, service days active, capacity indicators
- [ ] Coverage type per zone (PRIMARY / SECONDARY) if captured
- [ ] Max travel preference display
- [ ] Request new zone coverage (if invite allows additional zones)
- [ ] SKU authorization summary per zone (which services they're approved to perform)

**Database tables involved:**
- `provider_coverage`, `zones`, `provider_capabilities`, `service_skus`

**Files to modify:**
- `src/pages/provider/Coverage.tsx` (replace placeholder)

**Files to create:**
- `src/hooks/useProviderCoverage.ts`
- `src/components/provider/CoverageZoneList.tsx`
- `src/components/provider/SkuAuthorizationSummary.tsx`

**Estimated complexity:** Medium

---

### 2.4 — Provider Performance Dashboard `[PLACEHOLDER]` — `/provider/performance`

**Why:** Providers need visibility into their quality metrics to maintain ACTIVE status and avoid PROBATION. This creates a self-improvement loop.

**PRD ref:** `docs/modules/09-job-execution.md` §Admin routes (lightweight performance), Masterplan §Launch Scoreboard

**Current state:** `src/pages/provider/Performance.tsx` renders `PlaceholderPage`

**Scope:**
- [ ] Key metrics cards:
  - On-time completion % (target: ≥90%)
  - Photo compliance % (target: ≥95%)
  - Redo rate (baseline TBD)
  - Customer rating average (if ratings implemented)
  - SLA status (Green / Yellow / Red)
- [ ] Trend sparklines (last 4 weeks)
- [ ] Job completion history summary (completed / issues / partial)
- [ ] Probation/warning banner if applicable
- [ ] Tips/coaching section (static content initially, AI-driven later)

**Database tables involved:**
- `jobs`, `job_photos`, `job_checklist_items`, `job_issues`
- `provider_enforcement_actions` (for probation context)
- `provider_health_snapshots` (from snapshot-rollup)

**Files to modify:**
- `src/pages/provider/Performance.tsx` (replace placeholder)

**Files to create:**
- `src/hooks/useProviderPerformance.ts`
- `src/components/provider/PerformanceMetrics.tsx`
- `src/components/provider/PerformanceTrend.tsx`

**Estimated complexity:** Medium (aggregation queries, reuse existing Sparkline component)

---

### 2.5 — Provider Account Settings `[PLACEHOLDER]` — `/provider/settings`

**Why:** Basic account management — password change, notification preferences, sign out.

**PRD ref:** Module 01 — Auth & Roles

**Current state:** `src/pages/provider/Settings.tsx` renders `PlaceholderPage`

**Scope:**
- [ ] Profile: display name, email (read-only), phone
- [ ] Password change
- [ ] Notification preferences (push categories — ties to Phase 0.1)
- [ ] Deep link to Organization page
- [ ] Deep link to Earnings/Payouts page
- [ ] Sign out

**Files to modify:**
- `src/pages/provider/Settings.tsx` (replace placeholder)

**Estimated complexity:** Low (reuse patterns from customer settings)

---

## Phase 3: Admin Operational Tools

> The admin console has a strong Ops Cockpit, zone management, job management, billing overview, support dashboard, and provider management. Missing: scheduling operations and advanced reporting.

### 3.1 — Admin Scheduling Operations `[PLACEHOLDER]` — `/admin/scheduling`

**Why:** Admins need manual override tools for when automation isn't enough — reschedule a customer, split jobs, handle weather mode, manage capacity exceptions.

**PRD ref:** `docs/modules/06-service-day-system.md` §8 (Admin experience)

**Current state:** `src/pages/admin/Scheduling.tsx` renders `PlaceholderPage`

**Scope:**
- [ ] Service Day utilization overview:
  - Zone list with assigned/limit per day-of-week
  - Mon–Sun counts with utilization bars
  - Stability indicator (Stable / Tight / Risk)
- [ ] Assignment list per zone/day:
  - Customer name, assigned day/window, status
  - Search/filter
- [ ] Manual override tools:
  - Reassign customer to different day (requires reason, warns on capacity, audit logged)
  - "Force anyway" with typed confirmation for capacity override
  - Bulk operations: "Move all Zone X Monday → Tuesday" (rare, heavily confirmed)
- [ ] Service Day offer management:
  - View pending/expired offers
  - Manually create offer for customer
  - Cancel/refresh expired offer

**Database tables involved:**
- `service_day_assignments`, `service_day_offers`, `zone_service_day_capacity`
- `service_day_override_log` (or `admin_audit_log`)

**Files to modify:**
- `src/pages/admin/Scheduling.tsx` (replace placeholder)

**Files to create:**
- `src/hooks/useSchedulingOps.ts`
- `src/components/admin/SchedulingUtilization.tsx`
- `src/components/admin/AssignmentOverride.tsx`

**Estimated complexity:** High (complex state management, capacity math, audit logging)

---

### 3.2 — Admin Reports (Advanced Analytics) `[PLACEHOLDER]` — `/admin/reports`

**Why:** The Ops Cockpit shows real-time operational health. Reports shows business analytics — MRR trends, churn cohorts, retention curves, revenue per zone, unit economics.

**PRD ref:** `docs/modules/14-reporting-and-analytics.md`

**Current state:** `src/pages/admin/Reports.tsx` renders `PlaceholderPage`. The Ops Cockpit (`OpsCockpit.tsx`, `OpsBilling.tsx`, `OpsJobs.tsx`, `OpsZones.tsx`, `OpsProviders.tsx`) IS fully built.

**Scope:**
- [ ] MRR dashboard:
  - Current MRR, MRR growth rate, MRR by zone
  - New MRR vs churned MRR vs expansion MRR
  - Trend chart (last 12 weeks)
- [ ] Churn & retention:
  - Retention cohort matrix (by signup month)
  - Churn rate by zone, by plan, by acquisition source
  - At-risk customer list (missed payments, declining engagement)
- [ ] Revenue per zone:
  - Revenue, cost (provider payouts), gross margin per zone per week
  - Density metrics: stops/day trending, minutes/stop trending
- [ ] Unit economics:
  - Gross margin per Service Day
  - Support cost per job
  - Customer acquisition cost by channel (ties to Module 13 attribution)
  - LTV estimates by cohort
- [ ] Export capability: CSV download for any report

**Data sources:**
- `ops_kpi_snapshots_daily` (from snapshot-rollup)
- `customer_invoices`, `customer_payments` (revenue)
- `provider_earnings`, `provider_payouts` (costs)
- `subscriptions` (churn/retention)
- `support_tickets` (support cost)
- `referrals` (acquisition source)

**Files to modify:**
- `src/pages/admin/Reports.tsx` (replace placeholder)

**Files to create:**
- `src/hooks/useReports.ts`
- `src/components/admin/MrrDashboard.tsx`
- `src/components/admin/RetentionCohorts.tsx`
- `src/components/admin/RevenueByZone.tsx`
- `src/components/admin/UnitEconomics.tsx`

**Estimated complexity:** High (complex aggregation queries, charting, cohort analysis)

---

### 3.3 — Admin Settings `[PLACEHOLDER]` — `/admin/settings`

**Why:** System-wide configuration — role management, platform settings, policy defaults.

**PRD ref:** Module 01 — Auth & Roles

**Current state:** `src/pages/admin/Settings.tsx` renders `PlaceholderPage`

**Scope:**
- [ ] Role management: view/assign user roles
- [ ] Platform settings:
  - Default hold windows (routine jobs: 24h, seasonal: 48-72h, probation: 72h)
  - Payout threshold ($50-$100 configurable)
  - Dunning retry schedule (+1d, +3d, +5d)
  - Credit tier amounts ($10, $25, $50)
  - Max auto credits per customer per cycle
- [ ] Zone configuration quick links
- [ ] Audit log viewer (recent admin actions across all modules)
- [ ] System health indicators (cron job statuses, edge function health)

**Files to modify:**
- `src/pages/admin/Settings.tsx` (replace placeholder)

**Files to create:**
- `src/hooks/useAdminSettings.ts`
- `src/components/admin/PolicyConfiguration.tsx`
- `src/components/admin/AuditLogViewer.tsx`

**Estimated complexity:** Medium

---

## Phase 4: Growth Engine

> Growth is what makes this "as big as Uber." The referral rails (Module 13.1) are built. The Growth Autopilot concept (13.3) has data model support. What's missing is the provider-facing growth hub, market launch automation, and viral sharing surfaces.

### 4.1 — Provider Growth Hub (Founding Partner Flow) `[PARTIAL]`

**Why:** This is the Uber driver-referral equivalent. Providers bring their existing customer lists in exchange for Founding Partner status, priority activation, and milestone-based bonuses. This is the fastest path to density.

**PRD ref:** `docs/modules/13.2-founding-partner-provider-growth.md`

**Current state:** `/provider/referrals` exists with basic referral history. Missing: application flow, eligibility messaging, invite tools, progress tracking, Founding Partner status display.

**Scope:**
- [ ] Provider Growth Hub (`/provider/referrals` enhancement):
  - Founding Partner status card (badge, tier, activation window)
  - "Invite customers" primary CTA → invite tools
  - Progress tracker: invites sent → installs → subs → first visits → bonuses
  - "Next best action" prompt
- [ ] Eligibility messaging by zone/category state:
  - "Open now" / "Soft launch" / "Waitlist" / "Not supported"
  - Non-open states show launch path: "Invite 10 customers to unlock priority activation"
- [ ] Invite customer tools (`/provider/referrals/invite-customers`):
  - Copy magic link (one tap)
  - SMS script templates (tap-to-copy): short / friendly / professional
  - QR code display (optional)
- [ ] Invite other providers (optional):
  - Share link for provider-to-provider recruiting
  - Bonus after referred provider completes first job + brings N customers
- [ ] Provider application states: DRAFT → SUBMITTED → APPROVED / WAITLISTED / REJECTED

**Database tables involved:**
- `referral_programs`, `referral_codes`, `referrals`, `referral_milestones`, `referral_rewards`
- `market_zone_category_state` (from 13.3)

**Files to create:**
- `src/components/provider/GrowthHub.tsx`
- `src/components/provider/InviteCustomerTools.tsx`
- `src/components/provider/FoundingPartnerStatus.tsx`
- `src/components/provider/LaunchPathProgress.tsx`

**Estimated complexity:** High (multi-state UI, milestone tracking, copy generation)

---

### 4.2 — Growth Autopilot (Market Launch OS) `[PARTIAL]`

**Why:** Prevents viral growth from breaking quality. Automatically opens/closes markets by zone/category based on health scoring. Without this, you either over-grow and break quality or under-grow and miss density.

**PRD ref:** `docs/modules/13.3-growth-autopilot-market-launch-os.md`

**Current state:** `market_cohorts` table exists, `useAutopilotActions` hook exists (33 lines, basic query). Missing: health scoring, state machine, admin growth console, automated actions.

**Scope:**
- [ ] Zone/category state machine implementation:
  - States: CLOSED → SOFT_LAUNCH → OPEN → PROTECT_QUALITY
  - Transition rules based on health scores
  - All transitions logged + admin-overridable
- [ ] Health scoring model:
  - Supply readiness (providers ready, capacity utilization)
  - Demand readiness (interest, conversion rate)
  - Quality risk (issues/credits/redo/overrides)
  - Compute sub-scores + overall health_score
  - Label: stable / tight / risk
- [ ] Autopilot actions (gating + incentive dials):
  - Open/close provider applications per category/zone
  - Open/close customer waitlists
  - Enable/disable Founding Partner slots
  - Adjust provider bonus tiers (within caps)
  - Adjust customer credits (within caps)
- [ ] Admin Growth Console (`/admin/growth`):
  - Zone/category matrix with states and health scores
  - Referral velocity chart
  - Capacity pressure indicators
  - "Next best actions" recommendations
  - Override controls: force state, lock state, adjust thresholds
- [ ] Edge function: `compute-market-health` (scheduled daily, computes scores and triggers transitions)

**Database tables involved:**
- `market_cohorts`, `market_zone_category_state`, `market_health_snapshots`
- `growth_autopilot_actions`

**Files to create:**
- `supabase/functions/compute-market-health/index.ts`
- `src/pages/admin/Growth.tsx`
- `src/hooks/useMarketHealth.ts`
- `src/hooks/useGrowthConsole.ts`
- `src/components/admin/MarketStateMatrix.tsx`
- `src/components/admin/HealthScoreCard.tsx`

**Estimated complexity:** High (state machine logic, health scoring, admin console)

---

### 4.3 — Viral Surfaces & Receipt Share Cards `[MISSING]`

**Why:** "Look what just happened to my house" photos are inherently shareable. This is the Instagram moment for home services. Organic proof-led sharing is more valuable than incentive-led sharing.

**PRD ref:** `docs/modules/13.4-viral-surfaces-and-growth-event-bus.md`

**Current state:** Zero implementation. No growth events table, no share card generation, no landing pages.

**Scope:**

**Surface A — Receipt Share Cards (Primary):**
- [ ] After job completion, show "Share the after photo" CTA on receipt
- [ ] Generate share card: best after photo + "Handled" stamp + date + category
- [ ] Privacy controls: toggle before/after, toggle first name, toggle neighborhood
- [ ] Photo quality gate: suppress prompt if photos are low quality
- [ ] Share via native share sheet (SMS, WhatsApp, copy link)
- [ ] Frequency cap: max 1 share prompt per job, max 1 reminder per week

**Surface B — Provider Milestone Share (Secondary):**
- [ ] On payout posted / bonus earned / progress threshold → show "Invite customers" CTA
- [ ] State-aware scripts (OPEN: "We're live now…" / WAITLIST: "Launching soon…")

**Surface C — Cross-Pollination (Customer):**
- [ ] After subscription activation or first visit → "Invite your other pro" prompt
- [ ] Pick another category → prewritten SMS to invite their pro

**Growth Event Bus:**
- [ ] Create `growth_events` table (append-only, idempotent)
- [ ] Event types: prompt_shown, share_initiated, share_completed, landing_viewed, store_clicked, signup_completed, etc.
- [ ] Create `growth_surface_stats_daily` materialized view (aggregates per zone/category/surface)

**Share Landing Pages (separate lightweight site):**
- [ ] Host at `share.handledhome.com` or similar
- [ ] Wow page: full-width after photo + "Handled." + category + CTA
- [ ] Anonymous by default, optional first-name opt-in
- [ ] Link expiry: 30 days default, revocable by customer
- [ ] Asset access expires with link

**Files to create:**
- `supabase/migrations/XXXXXX_create_growth_events.sql`
- `src/components/customer/ReceiptShareCard.tsx`
- `src/components/customer/ShareControls.tsx`
- `src/components/provider/MilestoneSharePrompt.tsx`
- `src/components/customer/CrossPollinationPrompt.tsx`
- `src/hooks/useGrowthEvents.ts`
- `src/hooks/useShareCard.ts`
- Share landing page (separate project or Supabase Edge Function serving HTML)

**Estimated complexity:** Very high (image processing, share card generation, separate landing site, event bus, privacy controls)

---

## Phase 5: Seasonal Services & Advanced Features

> These features increase ARPU and operational sophistication. They build on the completed core loop.

### 5.1 — Seasonal Service Scheduling `[MISSING]`

**Why:** Seasonal boosts (power washing, gutter cleaning, etc.) are an ARPU lever. The data model supports them but no scheduling flow exists.

**PRD ref:** `docs/modules/06.1-service-day-engine-addendum.md`, Module 07 §seasonal

**Scope:**
- [ ] Seasonal service templates (admin-managed per zone/season)
- [ ] Customer seasonal selection flow (part of Bundle Builder):
  - Browse available seasonal services for current/upcoming season
  - Select preferred execution window (early/mid/late month — NOT date-level)
  - Immediate billing on purchase (Module 11 add-on flow)
- [ ] Seasonal job generation: create jobs from seasonal selections in appropriate service weeks
- [ ] Seasonal-specific hold windows for provider earnings (48-72h vs 24h for routine)

**Database tables involved:**
- `seasonal_service_templates`, `customer_seasonal_selections`
- `jobs` (seasonal jobs), `customer_invoices` (add-on charges)

**Estimated complexity:** Medium-high

---

### 5.2 — Weather Mode `[MISSING]`

**Why:** Weather disruptions are inevitable for outdoor home services. Without weather mode, every rain day becomes a manual support scramble.

**PRD ref:** Masterplan §Risks ("Weather volatility → weather mode"), Module 06 §2.2 ("No weather-mode rescheduling — later")

**Scope:**
- [ ] Admin trigger: "Activate weather mode for Zone X on Date Y"
- [ ] Affected jobs automatically marked RESCHEDULED
- [ ] Customer notification: "Weather update — your visit is being rescheduled"
- [ ] Auto-reschedule to next available service week (no date picking by customer)
- [ ] Provider notification: "Today's jobs in Zone X cancelled due to weather"
- [ ] Audit log entry for every weather-mode activation
- [ ] Dashboard truth banner: "Service delayed due to weather in your area"

**Estimated complexity:** Medium (state transitions, notifications, admin UI)

---

### 5.3 — Service Week Consumption Tracking `[PARTIAL]`

**Why:** The subscription model charges per cycle with no rollover. Need to track which service weeks have been consumed to enforce "unused weeks expire."

**PRD ref:** Module 05 §no-rollover policy, Global Architecture §7 ("no-rollover enforcement")

**Current state:** `service_weeks_consumed_in_current_cycle` column exists but is never incremented by job completion.

**Scope:**
- [ ] On job completion (Module 09 webhook/event): increment `service_weeks_consumed_in_current_cycle`
- [ ] On cycle boundary (billing run): reset counter to 0
- [ ] Customer dashboard: show "X of Y service weeks used this cycle"
- [ ] No rollover enforcement: unused weeks expire silently at cycle end

**Estimated complexity:** Low (counter increment on existing events)

---

## Phase 6: Polish, Optimization & Scale Prep

> These are non-blocking improvements that increase quality, reduce tech debt, and prepare for multi-city expansion.

### 6.1 — Extract Shared Sparkline Component `[PARTIAL]`

**Why:** `Sparkline` component is copy-pasted between `OpsCockpit.tsx` and `OpsZones.tsx`.

**PRD ref:** `docs/reviews/14-reporting-and-analytics-review.md` line 140

**Scope:**
- [ ] Extract to `src/components/ui/Sparkline.tsx`
- [ ] Update imports in `OpsCockpit.tsx` and `OpsZones.tsx`
- [ ] Reuse in Provider Performance dashboard (Phase 2.4)

**Estimated complexity:** Low

---

### 6.2 — Batch Sequential Upserts in Snapshot Rollup `[PARTIAL]`

**Why:** Zone/provider snapshot loops use sequential `await`. Could batch with `Promise.all` for lower latency.

**PRD ref:** `docs/reviews/14-reporting-and-analytics-review.md` line 141

**Scope:**
- [ ] Refactor `snapshot-rollup/index.ts` zone upsert loop to use `Promise.all`
- [ ] Refactor provider upsert loop to use `Promise.all`
- [ ] Add error handling for partial batch failures

**Estimated complexity:** Low

---

### 6.3 — Cron Schedule in Migration `[MISSING]`

**Why:** Snapshot rollup cron is configured via Supabase dashboard, not in a migration. Would need manual re-creation on new deployment.

**PRD ref:** `docs/reviews/14-reporting-and-analytics-review.md` line 142

**Scope:**
- [ ] Create migration that sets up pg_cron schedules (covered by Phase 0.2)

**Estimated complexity:** Low (part of Phase 0.2)

---

### 6.4 — Offline Photo Queue Resilience `[PARTIAL]`

**Why:** Module 09 PRD requires offline photo capture with automatic queue and retry. Current implementation may not handle poor-signal scenarios gracefully.

**PRD ref:** `docs/modules/09-job-execution.md` §5.4 (Photo proof flow — resilient), §12 (Reliability requirements)

**Scope:**
- [ ] Audit current photo upload flow for offline support
- [ ] Implement local queue with retry states (Pending upload / Uploaded / Failed-Retry)
- [ ] "Uploads pending" banner on job detail when photos queued
- [ ] Block completion until required photos confirmed uploaded server-side
- [ ] Image compression for performance (reduce upload size on mobile)

**Estimated complexity:** Medium (Capacitor filesystem + upload queue logic)

---

### 6.5 — Server-Side Pagination for Admin Tables `[PARTIAL]`

**Why:** `useAdminJobs` uses `.limit(100)` with client-side pagination. At scale, misses jobs beyond 100th.

**PRD ref:** `.lovable/plan.md` Item 5

**Scope:**
- [ ] `useAdminJobs.ts`: accept `page`/`pageSize`, use `.range()`, return `totalCount`
- [ ] `OpsJobs.tsx`: pass pagination params, use server total for controls
- [ ] Apply same pattern to other admin list views (providers, subscriptions, support tickets)

**Estimated complexity:** Low-medium

---

## Phase 7: V2 — Multi-City & Advanced Features

> These are explicitly deferred to V2 per the masterplan. Listed here for completeness and dependency awareness.

### 7.1 — Dispatcher/Ops RLS Differentiation (V2)

**Why:** Currently no `dispatcher` or `ops` role. All admins see everything.

**PRD ref:** `.lovable/plan.md` Item 6 (deferred), `docs/modules/14-reporting-and-analytics.md` §21

**Scope:**
- [ ] Add `admin_scope` column to `user_roles` table
- [ ] Create `has_admin_scope()` RLS helper function
- [ ] Scope ops cockpit access by admin scope
- [ ] Create dispatcher role with limited permissions

**Status:** Deferred to V2. No current users require scoped admin access.

---

### 7.2 — Polygon Zones (V2)

**Why:** Current zones are ZIP-code based. Polygon zones allow more precise geographic targeting.

**PRD ref:** Masterplan §V2 ("Polygon zones")

---

### 7.3 — Multi-City Expansion (V2)

**Why:** Prove unit economics in 1 city, then expand zone-by-zone to 3-5 cities.

**PRD ref:** Masterplan §Hybrid Scaling Path

---

### 7.4 — Additional Verticals (V2)

**Why:** Pest, pool, and other recurring home service categories.

**PRD ref:** Masterplan §V2 ("Additional verticals — pest, pool")

---

## Dependency Graph (Simplified)

```
Phase 0 (Infrastructure)
├── 0.1 Push Notifications ─────────────────────┐
├── 0.2 Cron Automation ────────────────────────┤
└── 0.3 Capacitor Native ──────────────────────┤
                                                 │
Phase 1 (Customer Core)                          │
├── 1.1 Bundle Builder ◄── (no deps)            │
└── 1.2 Customer Settings ◄── (0.1 for notif prefs)
                                                 │
Phase 2 (Provider Loop)                          │
├── 2.1 Earnings ◄── (no deps, reads existing)  │
├── 2.2 Organization ◄── (no deps)              │
├── 2.3 Coverage ◄── (no deps)                  │
├── 2.4 Performance ◄── (no deps)               │
└── 2.5 Provider Settings ◄── (0.1 for notif prefs)
                                                 │
Phase 3 (Admin Tools)                            │
├── 3.1 Scheduling Ops ◄── (no deps)            │
├── 3.2 Reports ◄── (0.2 for snapshot data)     │
└── 3.3 Admin Settings ◄── (0.2 for cron status)│
                                                 │
Phase 4 (Growth Engine)    ◄─────────────────────┘
├── 4.1 Provider Growth Hub ◄── (0.1 for push)
├── 4.2 Growth Autopilot ◄── (0.2 for scheduled health)
└── 4.3 Viral Surfaces ◄── (0.3 for native share)

Phase 5 (Advanced Features)
├── 5.1 Seasonal Services ◄── (1.1 Bundle Builder)
├── 5.2 Weather Mode ◄── (0.1 for notifications)
└── 5.3 Service Week Tracking ◄── (0.2 for cycle reset)

Phase 6 (Polish)
└── All items are independent
```

---

## Priority Matrix

| Task | Business Impact | Complexity | Dependency Blocker? |
|------|----------------|------------|---------------------|
| **1.1 Bundle Builder** | CRITICAL | High | Yes — blocks customer routine selection |
| **2.1 Provider Earnings** | CRITICAL | Medium | Yes — blocks provider retention |
| **0.1 Push Notifications** | HIGH | Medium-High | Yes — blocks "handled" brand promise |
| **0.2 Cron Automation** | HIGH | Medium | Yes — blocks automated billing/payouts |
| **4.1 Provider Growth Hub** | HIGH | High | No — but fastest path to density |
| **3.1 Scheduling Ops** | HIGH | High | No — but blocks admin manual overrides |
| **3.2 Reports** | HIGH | High | No — but blocks scaling decisions |
| **0.3 Capacitor Native** | HIGH | Medium | Yes — blocks app store presence |
| **2.2 Provider Org** | MEDIUM | Medium | No |
| **2.3 Provider Coverage** | MEDIUM | Medium | No |
| **2.4 Provider Performance** | MEDIUM | Medium | No |
| **4.2 Growth Autopilot** | MEDIUM | High | No — but prevents growth from breaking quality |
| **4.3 Viral Surfaces** | MEDIUM | Very High | No — but key growth lever |
| **5.1 Seasonal Services** | MEDIUM | Medium-High | Blocked by 1.1 |
| **5.2 Weather Mode** | MEDIUM | Medium | Blocked by 0.1 |
| **1.2 Customer Settings** | LOW | Low-Medium | No |
| **2.5 Provider Settings** | LOW | Low | No |
| **3.3 Admin Settings** | LOW | Medium | No |
| **5.3 Service Week Tracking** | LOW | Low | Blocked by 0.2 |
| **6.1–6.5 Polish** | LOW | Low-Medium | No |

---

## Recommended Build Order (Parallel Tracks)

**Sprint 1–2: Foundation + Critical Path**
- Track A: 0.1 Push Notifications + 0.2 Cron Automation
- Track B: 1.1 Bundle Builder
- Track C: 2.1 Provider Earnings

**Sprint 3–4: Provider + Admin Completeness**
- Track A: 2.2 Organization + 2.3 Coverage + 2.4 Performance + 2.5 Settings
- Track B: 3.1 Scheduling Operations
- Track C: 0.3 Capacitor Native Builds

**Sprint 5–6: Growth + Analytics**
- Track A: 4.1 Provider Growth Hub
- Track B: 3.2 Reports (Advanced Analytics)
- Track C: 3.3 Admin Settings + 1.2 Customer Settings

**Sprint 7–8: Viral Growth + Seasonal**
- Track A: 4.2 Growth Autopilot
- Track B: 4.3 Viral Surfaces (Receipt Share Cards first)
- Track C: 5.1 Seasonal Services + 5.2 Weather Mode

**Sprint 9+: Polish + Scale Prep**
- All Phase 6 items
- 5.3 Service Week Tracking
- V2 planning
