# app-flow-pages-and-roles.md

## Customer App Pages

- Dashboard
- Service Day (assignment/offer/accept/reject flow)
- Build My Routine (SKU selection + cadence picker)
- Routine Review (4-week preview + confirmation)
- Routine Confirm (success + next steps)
- Service History (visit timeline)
- Visit Detail (photos, checklist, issue reporting)
- Plans (browse available plans)
- Plan Detail
- Subscribe (checkout flow)
- Subscription (current plan + status)
- Property Profile
- Billing Overview (current cycle, payment status, credits)
- Payment Methods (add/manage cards via Stripe)
- Billing History (invoice list)
- Receipt Detail (line items, status, fix payment CTA)
- Issues (submitted issue list)
- Referrals
- Support
- Account Settings

---

## Provider App Pages

- Dashboard (today's jobs, upcoming)
- Jobs List (assigned jobs)
- Job Detail (scope, property, checklist)
- Job Checklist (item-by-item completion)
- Job Photos (proof-of-work capture)
- Job Complete (summary + submit)
- Onboarding — Org Setup
- Onboarding — Coverage (zone selection)
- Onboarding — Capabilities (SKU authorization)
- Onboarding — Compliance (insurance, tax, background)
- Onboarding — Review (final submission)
- Organization Settings
- Coverage & Capacity
- SKUs (authorized services)
- Payouts Overview (account status, balances)
- Payout History (earnings + payouts)
- Performance
- Account Settings

---

## Admin Console Pages

- Overview Dashboard
- Regions & Zones (region CRUD, zone CRUD, zip management)
- Service Days (zone service day config, overrides)
- Capacity (zone capacity panel)
- SKU Catalog (CRUD, checklists, photo requirements)
- Subscription Plans (plan + entitlement management)
- Subscriptions (active subscription list)
- Bundles (routine management)
- Providers (list, detail, enforcement)
- Provider Detail (org info, coverage, capabilities, compliance, risk)
- Scheduling Operations
- Jobs (job list, filters)
- Job Detail (timeline, photos, issues, admin actions)
- Billing (collected today, failed payments, overview)
- Customer Ledger (per-customer invoice/credit/refund history)
- Payouts (provider payout overview)
- Provider Ledger (per-provider earnings/holds/payout history)
- Exceptions (billing + payout exception queue)
- Support Console
- Incentives
- Reporting & Analytics
- Audit Logs
- Admin Settings

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
