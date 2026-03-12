# app-flow-pages-and-roles.md

> **Last updated:** 2026-03-11 — Updated navigation structure (Schedule/Activity tabs for Customer, Home/Earn/Score tabs for Provider).

## Public Routes

| Route | Page | Notes |
|-------|------|-------|
| `/auth` | AuthPage | Login / signup |
| `/invite/:code` | InviteLanding | Referral invite deep link |
| `/share/:shareCode` | ShareLanding | Share card deep link |

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
| `/customer/plans` | Plans & Subscription (via More) | — |
| `/customer/plans/:planId` | Plan Detail | — |
| `/customer/subscribe` | Checkout | — |
| `/customer/service-day` | Service Day Assignment | PropertyGate |
| `/customer/build` | Build (redirects to Routine) | PropertyGate |
| `/customer/visits` | → Redirects to `/customer/schedule` | PropertyGate |
| `/customer/history` | → Redirects to `/customer/activity` | PropertyGate |
| `/customer/timeline` | → Redirects to `/customer/activity` | PropertyGate |
| `/customer/visits/:jobId` | Visit Detail | PropertyGate |
| `/customer/issues` | Submitted Issues | PropertyGate |
| `/customer/subscription` | Current Subscription | PropertyGate |
| `/customer/billing` | Billing Overview | PropertyGate |
| `/customer/billing/methods` | Payment Methods | PropertyGate |
| `/customer/billing/history` | Invoice History | PropertyGate |
| `/customer/billing/receipts/:invoiceId` | Receipt Detail | PropertyGate |
| `/customer/referrals` | Referrals | PropertyGate |
| `/customer/support` | Support Home | PropertyGate |
| `/customer/support/new` | New Ticket | PropertyGate |
| `/customer/support/tickets` | Ticket List | PropertyGate |
| `/customer/support/tickets/:ticketId` | Ticket Detail | PropertyGate |
| `/customer/settings` | Account Settings | PropertyGate |
| `/customer/services` | Service Catalog | PropertyGate |
| `/customer/more` | More Menu (tab) | PropertyGate |
| `/customer/notifications` | Notification Inbox | — |

**Bottom Tab Bar**: Home | Schedule | Routine | Activity | More

---

## Provider App Pages

| Route | Page |
|-------|------|
| `/provider` | **Dashboard (Home tab)** | |
| `/provider/jobs` | **Job List (Jobs tab)** | |
| `/provider/earnings` | **Earnings Center (Earn tab)** — merged earnings + payouts | |
| `/provider/performance` | **Score (Score tab)** — performance + gamification | |
| `/provider/more` | **More Menu (tab)** | |
| `/provider/onboarding` | Onboarding Hub | |
| `/provider/onboarding/org` | Step 1: Org Setup | |
| `/provider/onboarding/coverage` | Step 2: Zone Coverage | |
| `/provider/onboarding/capabilities` | Step 3: SKU Authorization | |
| `/provider/onboarding/compliance` | Step 4: Insurance/Tax/Background | |
| `/provider/onboarding/review` | Step 5: Final Review | |
| `/provider/jobs/:jobId` | Job Detail | |
| `/provider/jobs/:jobId/checklist` | Job Checklist | |
| `/provider/jobs/:jobId/photos` | Job Photos | |
| `/provider/jobs/:jobId/complete` | Job Complete | |
| `/provider/history` | Job History | |
| `/provider/skus` | Authorized SKUs | |
| `/provider/payouts` | Payout Status (also via Earn tab) | |
| `/provider/payouts/history` | Payout History | |
| `/provider/organization` | Org Management (via More) | |
| `/provider/coverage` | Coverage & Availability (via More) | |
| `/provider/settings` | Account Settings (via More) | |
| `/provider/support` | Support (via More) | |
| `/provider/support/tickets/:ticketId` | Ticket Detail | |
| `/provider/referrals` | Referrals (via More → Growth) | |
| `/provider/referrals/invite-customers` | Invite Customers | |
| `/provider/insights` | Growth Insights | |
| `/provider/insights/history` | Insights History | |
| `/provider/apply` | Provider Application | |
| `/provider/notifications` | Notification Inbox | |

**Bottom Tab Bar**: Home | Jobs | Earn | Score | More

---

## Admin Console Pages

| Route | Page |
|-------|------|
| `/admin` | Overview Dashboard |
| `/admin/zones` | Regions & Zones |
| `/admin/capacity` | Zone Capacity |
| `/admin/skus` | SKU Catalog |
| `/admin/plans` | Subscription Plans |
| `/admin/subscriptions` | Active Subscriptions |
| `/admin/providers` | Provider List |
| `/admin/providers/:id` | Provider Detail |
| `/admin/jobs` | Job List |
| `/admin/jobs/:jobId` | Job Detail |
| `/admin/scheduling` | Scheduling Operations |
| `/admin/service-days` | Service Day Config |
| `/admin/bundles` | Routine/Bundle Management |
| `/admin/support` | Support Console |
| `/admin/support/tickets/:ticketId` | Ticket Detail |
| `/admin/support/policies` | Support Policies |
| `/admin/support/macros` | Response Macros |
| `/admin/incentives` | Incentive Programs |
| `/admin/growth` | Growth Dashboard |
| `/admin/test-toggles` | Test Toggles |
| `/admin/ops` | Ops Cockpit |
| `/admin/ops/zones` | Ops: Zone Health |
| `/admin/ops/zones/:zoneId` | Ops: Zone Detail |
| `/admin/ops/service-days` | Ops: Service Days |
| `/admin/ops/jobs` | Ops: Jobs |
| `/admin/ops/billing` | Ops: Billing |
| `/admin/ops/support` | Ops: Support |
| `/admin/ops/growth` | Ops: Growth |
| `/admin/ops/definitions` | Ops: Definitions |
| `/admin/reports` | Reporting & Analytics |
| `/admin/audit` | Audit Logs |
| `/admin/billing` | Billing Overview |
| `/admin/billing/customers/:customerId` | Customer Ledger |
| `/admin/payouts` | Payout Overview |
| `/admin/payouts/providers/:providerOrgId` | Provider Ledger |
| `/admin/exceptions` | Exception Queue |
| `/admin/settings` | Admin Settings |
| `/admin/more` | More Menu |
| `/admin/notifications` | Notification Inbox |

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
1. Home tab → see today's jobs count + projected earnings
2. Lock route → Jobs tab → map view → drive to first stop
3. Job detail → checklist → photos → complete → earning toast
4. Repeat through day
5. Earn tab → see daily running total → feel productive
6. Score tab (weekly) → review metrics + streak

Provider Job Completion:
1. View today's jobs
2. Open job → review checklist + property notes
3. Complete checklist items
4. Upload required photos (before/after per SKU)
5. Submit completion → server validates
6. Earning created automatically

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

Admin Exception Triage:
1. Exceptions page shows queue (severity-sorted)
2. Review exception type + entity context
3. Take action (retry payment, release hold, void invoice, apply credit)
4. Exception resolved + audit logged
