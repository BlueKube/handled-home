# app-flow-pages-and-roles.md

> **Last updated:** 2026-02-26 — Synced with `App.tsx` route tree.

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
| `/customer` | Dashboard | PropertyGate |
| `/customer/property` | Property Profile | — |
| `/customer/plans` | Browse Plans | — |
| `/customer/plans/:planId` | Plan Detail | — |
| `/customer/subscribe` | Checkout | — |
| `/customer/routine` | Build Routine | PropertyGate |
| `/customer/routine/review` | Routine Review (4-week preview) | PropertyGate |
| `/customer/routine/confirm` | Routine Confirmation | PropertyGate |
| `/customer/service-day` | Service Day Assignment | PropertyGate |
| `/customer/build` | Build (redirects to Routine) | PropertyGate |
| `/customer/history` | Service History | PropertyGate |
| `/customer/visits` | Visit Timeline (alias) | PropertyGate |
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
| `/customer/more` | More Menu | PropertyGate |
| `/customer/notifications` | Notification Inbox | — |

---

## Provider App Pages

| Route | Page |
|-------|------|
| `/provider` | Dashboard |
| `/provider/onboarding` | Onboarding Hub |
| `/provider/onboarding/org` | Step 1: Org Setup |
| `/provider/onboarding/coverage` | Step 2: Zone Coverage |
| `/provider/onboarding/capabilities` | Step 3: SKU Authorization |
| `/provider/onboarding/compliance` | Step 4: Insurance/Tax/Background |
| `/provider/onboarding/review` | Step 5: Final Review |
| `/provider/jobs` | Job List |
| `/provider/jobs/:jobId` | Job Detail |
| `/provider/jobs/:jobId/checklist` | Job Checklist |
| `/provider/jobs/:jobId/photos` | Job Photos |
| `/provider/jobs/:jobId/complete` | Job Complete |
| `/provider/history` | Job History |
| `/provider/skus` | Authorized SKUs |
| `/provider/earnings` | Earnings Overview |
| `/provider/payouts` | Payout Status |
| `/provider/payouts/history` | Payout History |
| `/provider/performance` | Performance Metrics |
| `/provider/organization` | Org Management |
| `/provider/coverage` | Coverage & Capacity |
| `/provider/settings` | Account Settings |
| `/provider/support` | Support |
| `/provider/support/tickets/:ticketId` | Ticket Detail |
| `/provider/referrals` | Referrals |
| `/provider/referrals/invite-customers` | Invite Customers |
| `/provider/insights` | Growth Insights |
| `/provider/insights/history` | Insights History |
| `/provider/apply` | Provider Application |
| `/provider/more` | More Menu |
| `/provider/notifications` | Notification Inbox |

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

Build Routine:
1. Select SKUs from catalog
2. Set cadence per SKU (weekly, biweekly, monthly)
3. Add seasonal boosts (optional)
4. Review 4-week preview
5. Confirm routine

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
