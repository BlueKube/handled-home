# app-flow-pages-and-roles.md

> **Last updated:** 2026-04-01 — Full route audit against App.tsx. Added missing customer, provider, and admin routes. Corrected provider onboarding steps (6, not 5). Added admin control, scheduling, ops, and provider application routes.

## Public Routes

| Route | Page | Notes |
|-------|------|-------|
| `/auth` | AuthPage | Login / signup |
| `/browse` | Browse | Customer browse-first experience |
| `/providers` | ProviderBrowse | Provider acquisition landing page with lead capture |
| `/invite/:code` | InviteLanding | Referral invite deep link |
| `/share/:shareCode` | ShareLanding | Share card deep link |
| `/byoc/activate/:token` | BYOC Invite Landing | Provider's invite link for existing customers |

---

## Customer App Pages

| Route | Page | Gate |
|-------|------|------|
| `/customer` | Dashboard (Home tab) | PropertyGate |
| `/customer/schedule` | **Schedule (tab)** — Calendar + upcoming visits | PropertyGate |
| `/customer/activity` | **Activity (tab)** — Completed services timeline | PropertyGate |
| `/customer/routine` | Build Routine (tab) | PropertyGate |
| `/customer/routine/review` | Routine Review (4-week preview) | PropertyGate |
| `/customer/routine/confirm` | Routine Confirmation | PropertyGate |
| `/customer/property` | Property Profile | — |
| `/customer/property-sizing` | Property Sizing | — |
| `/customer/plans` | Plans & Subscription (via More) | — |
| `/customer/plans/:planId` | Plan Detail | — |
| `/customer/subscribe` | Checkout | — |
| `/customer/service-day` | Service Day Assignment | PropertyGate |
| `/customer/build` | Build (redirects to Routine) | PropertyGate |
| `/customer/visits` | → Redirects to `/customer/schedule` | PropertyGate |
| `/customer/visits/:jobId` | Visit Detail | PropertyGate |
| `/customer/history` | → Redirects to `/customer/activity` | PropertyGate |
| `/customer/timeline` | → Redirects to `/customer/activity` | PropertyGate |
| `/customer/upcoming` | Upcoming Visits | PropertyGate |
| `/customer/appointment/:visitId` | Appointment Window Picker | PropertyGate |
| `/customer/reschedule/:visitId` | Visit Rescheduling | PropertyGate |
| `/customer/issues` | Submitted Issues | PropertyGate |
| `/customer/subscription` | Current Subscription | PropertyGate |
| `/customer/billing` | Billing Overview | PropertyGate |
| `/customer/billing/methods` | Payment Methods | PropertyGate |
| `/customer/billing/history` | Invoice History | PropertyGate |
| `/customer/billing/receipts/:invoiceId` | Receipt Detail | PropertyGate |
| `/customer/photos` | Photo Gallery | PropertyGate |
| `/customer/coverage-map` | Coverage Map | PropertyGate |
| `/customer/home-assistant` | Home Assistant | PropertyGate |
| `/customer/referrals` | Referrals | PropertyGate |
| `/customer/recommend-provider` | Recommend a Provider (BYOP) | PropertyGate |
| `/customer/recommend-provider/status` | Provider Recommendations Tracker | PropertyGate |
| `/customer/services` | Service Catalog | PropertyGate |
| `/customer/onboarding` | Customer Onboarding | — |
| `/customer/onboarding/byoc/:token` | BYOC Customer Onboarding | — |
| `/customer/support` | Support Home | PropertyGate |
| `/customer/support/new` | New Ticket | PropertyGate |
| `/customer/support/tickets` | Ticket List | PropertyGate |
| `/customer/support/tickets/:ticketId` | Ticket Detail | PropertyGate |
| `/customer/settings` | Account Settings | PropertyGate |
| `/customer/more` | More Menu (tab) | PropertyGate |
| `/customer/notifications` | Notification Inbox | — |

**Bottom Tab Bar**: Home | Schedule | Routine | Activity | More

---

## Provider App Pages

| Route | Page |
|-------|------|
| `/provider` | **Dashboard (Home tab)** |
| `/provider/jobs` | **Job List (Jobs tab)** |
| `/provider/earnings` | **Earnings Center (Earn tab)** — merged earnings + payouts |
| `/provider/performance` | **Score (Score tab)** — performance metrics + gamification |
| `/provider/more` | **More Menu (tab)** |
| `/provider/onboarding` | Onboarding Hub |
| `/provider/onboarding/org` | Step 1: Org Setup |
| `/provider/onboarding/coverage` | Step 2: Zone Coverage |
| `/provider/onboarding/capabilities` | Step 3: SKU Authorization |
| `/provider/onboarding/compliance` | Step 4: Insurance/Tax/Background |
| `/provider/onboarding/agreement` | Step 5: Service Agreement |
| `/provider/onboarding/review` | Step 6: Final Review |
| `/provider/jobs/:jobId` | Job Detail |
| `/provider/jobs/:jobId/checklist` | Job Checklist |
| `/provider/jobs/:jobId/photos` | Job Photos |
| `/provider/jobs/:jobId/complete` | Job Complete |
| `/provider/history` | Job History |
| `/provider/skus` | Service Catalog |
| `/provider/payouts` | Payout Status (also via Earn tab) |
| `/provider/payouts/history` | Payout History |
| `/provider/quality` | Quality & Tier |
| `/provider/organization` | Org Management (via More) |
| `/provider/coverage` | Coverage & Capacity (via More) |
| `/provider/availability` | Availability Management (via More) |
| `/provider/work-setup` | Work Setup / Preferences (via More) |
| `/provider/settings` | Account Settings (via More) |
| `/provider/support` | Support (via More) |
| `/provider/support/tickets/:ticketId` | Ticket Detail |
| `/provider/insights` | My Performance |
| `/provider/insights/history` | Weekly Trends |
| `/provider/byoc` | BYOC Center (via More → Growth) |
| `/provider/byoc/create-link` | Create BYOC Invite Link |
| `/provider/referrals` | Growth Hub (via More → Growth) |
| `/provider/referrals/invite-customers` | Invite Customers |
| `/provider/apply` | Provider Application |
| `/provider/notifications` | Notification Inbox |

**Bottom Tab Bar**: Home | Jobs | Earn | Score | More

---

## Admin Console Pages

| Route | Page |
|-------|------|
| `/admin` | Admin Console |
| `/admin/zones` | Regions & Zones |
| `/admin/zones/builder` | Zone Builder |
| `/admin/capacity` | *(redirect → /admin/zones)* |
| `/admin/skus` | SKU Catalog |
| `/admin/plans` | Subscription Plans |
| `/admin/subscriptions` | Subscriptions |
| `/admin/providers` | Providers |
| `/admin/providers/:id` | *(dynamic: org name)* |
| `/admin/providers/applications` | Applications |
| `/admin/providers/applications/:id` | *(dynamic: applicant name)* |
| `/admin/jobs` | Jobs |
| `/admin/jobs/:jobId` | Job Detail |
| `/admin/scheduling` | Scheduling Operations |
| `/admin/scheduling/planner` | Planner |
| `/admin/scheduling/policy` | Scheduling Policy |
| `/admin/scheduling/windows` | Window Templates |
| `/admin/scheduling/exceptions` | Scheduling Exceptions |
| `/admin/assignments` | Assignments |
| `/admin/assignments/config` | Assignment Tuning Dials |
| `/admin/service-days` | Service Days |
| `/admin/bundles` | Bundles / Routines |
| `/admin/support` | Support Console |
| `/admin/support/tickets/:ticketId` | *(dynamic: ticket subject)* |
| `/admin/support/policies` | Support Policies |
| `/admin/support/macros` | Support Macros |
| `/admin/incentives` | Incentives |
| `/admin/growth` | Growth Console |
| `/admin/provider-leads` | Provider Lead Pipeline — leads, ZIP aggregation, referrals |
| `/admin/feedback` | Customer Feedback |
| `/admin/playbooks` | Playbooks & SOPs |
| `/admin/control/pricing` | Pricing & Margin |
| `/admin/control/payouts` | Provider Payout Engine |
| `/admin/control/config` | System Configuration |
| `/admin/control/change-requests` | Change Requests |
| `/admin/control/change-log` | Change Log |
| `/admin/exceptions` | Exceptions |
| `/admin/billing` | Billing |
| `/admin/billing/customers/:customerId` | *(dynamic: customer name)* |
| `/admin/payouts` | Payouts |
| `/admin/payouts/providers/:providerOrgId` | *(dynamic: provider name)* |
| `/admin/ops` | Ops Cockpit |
| `/admin/ops/zones` | Zone Health |
| `/admin/ops/zones/:zoneId` | *(dynamic: zone name)* |
| `/admin/ops/service-days` | Service Day Health |
| `/admin/ops/jobs` | Jobs & Proof Health |
| `/admin/ops/billing` | Billing Health |
| `/admin/ops/support` | Support Health |
| `/admin/ops/growth` | Growth Health |
| `/admin/ops/definitions` | KPI Definitions |
| `/admin/ops/dispatch` | Dispatcher Queues |
| `/admin/ops/exceptions` | Ops Exceptions |
| `/admin/ops/exception-analytics` | Exception Analytics |
| `/admin/ops/levels` | Level Analytics |
| `/admin/reports` | Reporting & Analytics |
| `/admin/audit` | Audit Logs |
| `/admin/cron-health` | Cron Health |
| `/admin/notification-health` | Notification Health |
| `/admin/test-toggles` | Test Toggles |
| `/admin/settings` | Admin Settings |
| `/admin/more` | More Menu |
| `/admin/notifications` | Notification Inbox |

---

## Route Counts

| Role | Pages |
|------|-------|
| Public | 6 |
| Customer | 42 |
| Provider | 36 |
| Admin | 62 |
| **Total** | **143** |

---

## User Roles

Customer: Primary / Household Member  
Provider: Owner / Dispatcher / Technician  
Admin: Super Admin / Operations / Support / Finance  

---

## Primary Journeys

Customer Signup:
1. Create account
2. Add property
3. Select plan + subscribe
4. Assigned Service Day → accept or pick alternative
5. Build routine (select SKUs + cadences)
6. Confirm → first service week scheduled

Customer Weekly Loop:
1. Home tab → see "Thursday service" card → feel assured
2. Schedule tab → calendar shows dot on Thursday → see service details
3. After service → Activity tab → see receipt + photos → feel satisfied
4. Optionally: Home suggestion → Routine tab → add service → expand subscription

Build Routine:
1. Select SKUs from catalog
2. Set cadence per SKU (weekly, biweekly, monthly)
3. Add seasonal boosts (optional)
4. Review 4-week preview
5. Confirm routine

Provider Daily Workflow:
1. Home tab → see today's jobs count + projected earnings + route progress
2. Lock route → Jobs tab → map view → drive to first stop
3. Job detail → breadcrumb shows "Stop X of Y" → checklist → photos → complete → earning toast
4. Completion screen shows route progress → "Next Stop" button → continue
5. Repeat through day
6. Earn tab → see daily running total → feel productive
7. Score tab (weekly) → review metrics + streak

Provider Job Completion:
1. View today's jobs (route progress card on dashboard)
2. Open job → review checklist + property notes (sticky action bar always visible)
3. Complete checklist items
4. Upload required photos (before/after per SKU)
5. Submit completion → server validates → earning toast
6. Route progress shows next stop → navigate directly

Provider Onboarding:
1. Apply → application reviewed by admin
2. Onboarding Hub → 6-step wizard
3. Org Setup → Coverage → Capabilities → Compliance → Agreement → Review
4. Admin approves → provider goes live

Customer Billing Fix:
1. Dashboard shows "Payment failed" alert
2. Tap → Billing Overview with "Fix" CTA
3. Fix → Payment Methods → add/update card
4. Retry payment

Provider Payout Onboarding:
1. Payouts page shows "Set up payouts"
2. Tap → Stripe Connect Express onboarding (external)
3. Return → account.updated webhook fires
4. Status transitions to READY
5. Next payout run includes eligible earnings

BYOC (Bring Your Own Customers):
1. Provider navigates to `/provider/byoc` (via More → Growth)
2. Creates invite link at `/provider/byoc/create-link`
3. Shares link with existing customers
4. Customer activates at `/byoc/activate/:token` → `/customer/onboarding/byoc/:token`
5. Customer onboarded into Handled Home with provider connection preserved

BYOP (Bring Your Own Provider):
1. Customer navigates to `/customer/recommend-provider` (via More → Community or in-app prompt)
2. Submits provider recommendation: name, service category, contact info, optional note
3. Admin reviews nomination via `/admin/providers/applications` — decides to invite, reject, or flag duplicate
4. If invited: provider receives Handled Home onboarding invite (standard provider onboarding flow)
5. Customer sees nomination status updates at `/customer/recommend-provider/status`
6. If provider joins and is approved: admin can assign them to the customer's zone/route

Admin Exception Triage:
1. Exceptions page shows queue (severity-sorted)
2. Review exception type + entity context
3. Take action (retry payment, release hold, void invoice, apply credit)
4. Exception resolved + audit logged
