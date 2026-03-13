# Scenarios Test Plan — Manual (with Smoke Pack + Growth Pack)

> **Base:** 60 user scenarios across 3 roles — Customer, Provider, Admin.  
> **Update:** Adds (1) a daily “Smoke 15” subset, (2) a “Growth 10” subset for Modules 13.1–13.4, and (3) a lightweight seed-data checklist so manual testing is fast and repeatable.  
> **Source doc:** `Scenarios-Test.md` (original 60 scenarios). fileciteturn2file0

---

## How to use this test plan

### A) Daily while iterating (recommended)
Run:
- **Smoke 15**
- **Growth 10** (when touching Modules 13.x / share links / invites / auth)

### B) Before releases / demos
Run:
- **All 60 scenarios**
- **Growth 10**
- Any relevant “Edge Cases” you touched (expiry/revoke, closed market state, etc.)

### Pass/Fail rule
A scenario fails if:
- expected screen/state does not occur
- any unhandled console/runtime errors
- critical events (growth/support/billing) fail to record when called out below

---

## Seed Data (Manual Testing Kit)

Use a consistent staging dataset so scenarios are quick to run. The goal is *minimal* seed, not realism.

### Required entities
1) **Region + Zone**
- 1 Region (e.g., “SoCal”)
- 1 Zone (e.g., “Westlake”) with ZIPs populated
- Zone capacity configured (customers/day, jobs/day)
- Market state set per category (OPEN or WAITLIST)

2) **SKU Catalog**
Create SKUs for at least:
- Windows (requires after photo)
- Power wash (requires after photo)
- Pool (requires chemical proof if implemented)
- Pest (has “expectation card” copy if implemented)
- Dog poop

3) **Plans**
- 1 basic plan that entitles 1–2 SKUs
- 1 premium plan that entitles more SKUs (optional)

4) **Provider Org**
- 1 provider org with coverage for the test zone
- Provider authorized for at least windows + power wash
- Provider can receive assigned jobs

5) **Customer + Property**
- 1 customer with a property inside the zone ZIP(s)
- Property has access instructions

6) **At least one completed job**
- One completed job with photos + checklist so receipt & share flows can be tested

### Optional but helpful
- 1 “referred customer” cohort (from provider invite)
- 1 “share card” already created for expiry/revoke testing
- 1 “support ticket” created from a visit detail

---

## Smoke Pack (Daily) — Smoke 15

Run these 15 first. If anything fails, stop and fix before running deeper scenarios.

### Customer (6)
- **C-01** New Customer Signup fileciteturn2file0  
- **C-03** View Customer Dashboard fileciteturn2file0  
- **C-08** Subscribe to a Plan fileciteturn2file0  
- **C-10** View Service Day Assignment/Offer fileciteturn2file0  
- **C-17** View Visit Detail (Photos, Checklist) fileciteturn2file0  
- **C-18** Report an Issue from Visit Detail fileciteturn2file0  

### Provider (5)
- **P-03** Start Onboarding — Organization Setup fileciteturn2file0  
- **P-05** Onboarding — Select Capabilities/SKUs fileciteturn2file0  
- **P-09** View Jobs List fileciteturn2file0  
- **P-12** Upload Job Photos fileciteturn2file0  
- **P-13** Submit Job Completion fileciteturn2file0  

### Admin (4)
- **A-04** Create a New Zone with ZIP Codes fileciteturn2file0  
- **A-05** Configure Zone Capacity fileciteturn2file0  
- **A-07** Create/Edit SKU in Catalog fileciteturn2file0  
- **A-12** View Jobs List with Filters fileciteturn2file0  

---

## Growth Pack — Growth 10 (Modules 13.1–13.4)

These scenarios validate: share surfaces, landing pages, event emissions, expiry/revoke, market-state gating, weights/caps gating, and attribution continuity into signup.

> **Expected events (high level):**  
> `landing_viewed`, `prompt_shown`, `share_initiated`, `share_completed`, `store_clicked`, `signup_completed`

### G-01 — Share card creation from a completed receipt (after-only default)
| Field | Detail |
|------|--------|
| **Pre-req** | Completed job exists with after photo(s). Customer can view receipt/visit detail. |
| **Steps** | 1) Log in as customer 2) Open visit detail / receipt 3) Tap **Share the after photo** |
| **Expected** | Share sheet opens; default asset is **after-only**; before/after is optional toggle. `prompt_shown` and `share_initiated` record when appropriate. |

### G-02 — Share landing “wow” page loads (anonymous + micro-checklist)
| Field | Detail |
|------|--------|
| **Steps** | 1) From share sheet, copy link 2) Open link in incognito/private browser |
| **Expected** | Landing is **anonymous** by default; shows after photo; shows 1–3 bounded checklist bullets; primary CTA **Get Handled Home**; secondary **I’m a provider**. Records `landing_viewed`. |

### G-03 — Share link routes to WAITLIST when market closed/protect-quality
| Field | Detail |
|------|--------|
| **Pre-req** | Set zone/category state to WAITLIST or PROTECT_QUALITY |
| **Steps** | 1) Open share landing link |
| **Expected** | Landing page shows waitlist/availability message instead of pushing install. Records `landing_viewed` with market state in context. |

### G-04 — Share link expiry behavior (default 30 days)
| Field | Detail |
|------|--------|
| **Pre-req** | Create a share card and set it to expired (admin or DB update). |
| **Steps** | 1) Open expired share link |
| **Expected** | “Link expired” UX; safe CTA remains. Underlying image is not accessible directly. |

### G-05 — Share link revoke behavior
| Field | Detail |
|------|--------|
| **Pre-req** | Create share card, then revoke via customer “Disable shared link” or admin action. |
| **Steps** | 1) Open revoked share link |
| **Expected** | “Link unavailable” UX; image access blocked; no private data exposure. |

### G-06 — Invite landing `/invite/:code` records `landing_viewed`
| Field | Detail |
|------|--------|
| **Pre-req** | Provider referral code exists. |
| **Steps** | 1) Open `/invite/:code` in incognito |
| **Expected** | Records `landing_viewed` with `source_surface = provider_invite`. Copy does **not** promise credits when incentives are OFF. |

### G-07 — Incentives creep check (InviteLanding is neutral)
| Field | Detail |
|------|--------|
| **Steps** | 1) Open `/invite/:code` 2) Scan copy |
| **Expected** | No unconditional “welcome credit” promise. Copy focuses on non-incentive value props. |

### G-08 — Share → Auth preserves context and records `signup_completed`
| Field | Detail |
|------|--------|
| **Steps** | 1) From share landing, tap **Get Handled Home** 2) Complete signup |
| **Expected** | `signup_completed` recorded and includes share context (e.g., `share_code`). Attribution wiring remains intact. |

### G-09 — Surface weights gate prompts (weight=0 hides surface)
| Field | Detail |
|------|--------|
| **Pre-req** | Set surface weight to 0 for `receipt_share` or `cross_pollination`. |
| **Steps** | 1) Navigate to the UI where prompt would appear |
| **Expected** | Prompt/surface does not render. No prompt events fired. |

### G-10 — Frequency caps gate prompts (per job + weekly)
| Field | Detail |
|------|--------|
| **Pre-req** | Caps configured (e.g., share_per_job=1, reminder_per_week=1). |
| **Steps** | 1) Trigger share prompt once 2) Re-open receipt 3) Verify suppression 4) Trigger reminder once 5) Verify no second reminder that week |
| **Expected** | Prompts suppressed after cap reached. No extra prompt events. |

---

# Original 60 Scenarios (Customer, Provider, Admin)

The sections below are preserved from the original `Scenarios-Test.md`. fileciteturn2file0

---

# Scenarios Test Plan

> 60 user scenarios across 3 roles — Customer, Provider, Admin.  
> Each scenario includes steps to execute and expected outcome.

---

## Customer Scenarios (C-01 to C-20)

### C-01 — New Customer Signup
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/auth` 2. Enter new email + password 3. Click "Sign Up" |
| **Expected** | Account created, user redirected to customer dashboard (or email verification prompt). Profile and customer role auto-created via bootstrap. |

### C-02 — Login with Existing Credentials
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/auth` 2. Enter `test@handled.home` / `Test1234!` 3. Click "Sign In" |
| **Expected** | Successful login, redirected to `/customer` dashboard. No hanging or errors. |

### C-03 — View Customer Dashboard
| Field | Detail |
|-------|--------|
| **Steps** | 1. Log in as customer 2. Navigate to `/customer` |
| **Expected** | Dashboard loads with welcome message, next visit card, seasonal plan card, and week timeline. No console errors. |

### C-04 — View Property Profile
| Field | Detail |
|-------|--------|
| **Steps** | 1. Log in as customer 2. Navigate to `/customer/property` |
| **Expected** | Property page loads showing address, lot size, access instructions, pets, and gate code. If no property exists, shows "Add Property" prompt. |

### C-05 — Edit Property Profile Details
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/customer/property` 2. Click edit/update fields 3. Change a value (e.g., lot size) 4. Save |
| **Expected** | Property data updates successfully. Toast confirmation appears. Updated values persist on refresh. |

### C-06 — Browse Available Plans
| Field | Detail |
|-------|--------|
| **Steps** | 1. Log in as customer 2. Navigate to `/customer/plans` |
| **Expected** | Plans page loads showing available subscription plans with names, taglines, pricing, and entitlement summaries. |

### C-07 — View Plan Detail Page
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/customer/plans` 2. Tap on a plan card |
| **Expected** | Plan detail page loads at `/customer/plans/:id` showing full entitlement breakdown, included services, and subscribe CTA. |

### C-08 — Subscribe to a Plan
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to a plan detail page 2. Tap "Subscribe" / checkout CTA |
| **Expected** | Subscribe flow initiates (Stripe checkout or plan selection saved). Redirects to subscription confirmation or Stripe. |

### C-09 — View Current Subscription Status
| Field | Detail |
|-------|--------|
| **Steps** | 1. Log in as customer 2. Navigate to `/customer/subscription` |
| **Expected** | Subscription page shows current plan name, status (active/trialing/past_due), billing cycle dates, and manage options. |

### C-10 — View Service Day Assignment/Offer
| Field | Detail |
|-------|--------|
| **Steps** | 1. Log in as customer 2. Navigate to `/customer/service-day` |
| **Expected** | Service Day page loads showing assigned day or pending offer with accept/reject options. If no assignment, shows appropriate empty state. |

### C-11 — Accept a Service Day Offer
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/customer/service-day` 2. If an offer is shown, click "Accept" |
| **Expected** | Offer accepted, status changes to confirmed. Toast confirmation. Service day shown as locked. |

### C-12 — Reject Service Day and View Alternatives
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/customer/service-day` 2. If an offer is shown, click "Reject" or "See Alternatives" |
| **Expected** | Alternative service days displayed. User can pick a different day. |

### C-13 — Build a Routine (Select SKUs + Cadences)
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/customer/build` 2. Browse SKU catalog 3. Add SKUs to routine 4. Set cadence for each (weekly/biweekly/monthly) |
| **Expected** | Routine builder loads with available SKUs. Adding SKUs updates the draft. Cadence picker works for each item. Entitlement guardrails enforced. |

### C-14 — Review Routine with 4-Week Preview
| Field | Detail |
|-------|--------|
| **Steps** | 1. After building routine, navigate to `/customer/routine/review` |
| **Expected** | Review page shows all selected SKUs with cadences, 4-week preview timeline, and total summary. |

### C-15 — Confirm Routine
| Field | Detail |
|-------|--------|
| **Steps** | 1. On routine review page, click "Confirm" |
| **Expected** | Routine saved to database. Success screen shown. Redirected to routine page or dashboard. |

### C-16 — View Service History Timeline
| Field | Detail |
|-------|--------|
| **Steps** | 1. Log in as customer 2. Navigate to `/customer/history` |
| **Expected** | History page loads with chronological list of past visits/jobs. Each entry shows date, status, and services performed. |

### C-17 — View Visit Detail (Photos, Checklist)
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/customer/history` 2. Tap on a visit entry |
| **Expected** | Visit detail page loads at `/customer/visits/:id` showing photos, completed checklist items, provider notes, and timestamps. |

### C-18 — Report an Issue from Visit Detail
| Field | Detail |
|-------|--------|
| **Steps** | 1. Open a visit detail 2. Tap "Report Issue" 3. Select reason, add note, optionally attach photo 4. Submit |
| **Expected** | Issue created in database. Toast confirmation. Issue appears in customer issues list. |

### C-19 — View Billing Overview and Payment Status
| Field | Detail |
|-------|--------|
| **Steps** | 1. Log in as customer 2. Navigate to `/customer/billing` |
| **Expected** | Billing page loads showing current cycle amount, payment status, credits, and payment method summary. |

### C-20 — View Billing History and Receipts
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/customer/billing/history` |
| **Expected** | List of past invoices with dates, amounts, and status. Tapping an invoice shows receipt detail with line items. |

---

## Provider Scenarios (P-01 to P-20)

### P-01 — Provider Signup and Account Creation
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/auth` 2. Sign up with a new email 3. Ensure provider role is assigned |
| **Expected** | Account created. If provider invite code flow exists, it should be accessible. Otherwise, role assigned via admin or bootstrap. |

### P-02 — Provider Login
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/auth` 2. Log in with provider credentials |
| **Expected** | Successful login, redirected to `/provider` dashboard. |

### P-03 — Start Onboarding — Organization Setup
| Field | Detail |
|-------|--------|
| **Steps** | 1. Log in as provider 2. Navigate to `/provider/onboarding` or `/provider/onboarding/org` 3. Fill in org name, phone, website |
| **Expected** | Org setup form loads. Fields accept input. Can proceed to next step. |

### P-04 — Onboarding — Set Coverage Zones
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/provider/onboarding/coverage` 2. Select zones from available list |
| **Expected** | Zone list loads from database. Selecting zones updates coverage. Can proceed to next step. |

### P-05 — Onboarding — Select Capabilities/SKUs
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/provider/onboarding/capabilities` 2. Toggle SKUs the provider can perform |
| **Expected** | SKU list loads. Toggling capabilities saves selections. Can proceed. |

### P-06 — Onboarding — Upload Compliance Docs
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/provider/onboarding/compliance` 2. Attest insurance, tax form, background check |
| **Expected** | Compliance form loads with attestation checkboxes and optional file upload fields. |

### P-07 — Onboarding — Review and Submit
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/provider/onboarding/review` 2. Review all onboarding data 3. Click "Submit" |
| **Expected** | Summary of org, coverage, capabilities, compliance shown. Submit marks org for admin review. |

### P-08 — View Provider Dashboard
| Field | Detail |
|-------|--------|
| **Steps** | 1. Log in as provider 2. Navigate to `/provider` |
| **Expected** | Dashboard loads with today's jobs, upcoming schedule, earnings summary, and quick actions. |

### P-09 — View Jobs List
| Field | Detail |
|-------|--------|
| **Steps** | 1. Log in as provider 2. Navigate to `/provider/jobs` |
| **Expected** | Jobs list loads showing assigned jobs with dates, statuses, and property info. |

### P-10 — View Job Detail
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/provider/jobs` 2. Tap on a job |
| **Expected** | Job detail page loads at `/provider/jobs/:id` showing scope, property info, checklist, and photos section. |

### P-11 — Complete Job Checklist
| Field | Detail |
|-------|--------|
| **Steps** | 1. Open a job detail 2. Navigate to checklist 3. Mark items as done/skipped |
| **Expected** | Checklist items update status. Progress indicator reflects completion. |

### P-12 — Upload Job Photos
| Field | Detail |
|-------|--------|
| **Steps** | 1. Open a job 2. Navigate to photos section 3. Upload before/after photos |
| **Expected** | Photo upload interface loads. Files upload to storage. Photos appear in gallery. |

### P-13 — Submit Job Completion
| Field | Detail |
|-------|--------|
| **Steps** | 1. Complete checklist + photos 2. Click "Complete Job" or submit |
| **Expected** | Job status changes to completed. Earning created. Provider redirected to jobs list or dashboard. |

### P-14 — View Earnings/Payouts Overview
| Field | Detail |
|-------|--------|
| **Steps** | 1. Log in as provider 2. Navigate to `/provider/payouts` |
| **Expected** | Payouts page loads showing account status, pending/available balance, and payout account setup status. |

### P-15 — View Payout History
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/provider/payouts/history` |
| **Expected** | Payout history page loads with list of past payouts, amounts, dates, and statuses. |

### P-16 — Set Up Stripe Connect Payout Account
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/provider/payouts` 2. Click "Set up payouts" |
| **Expected** | Stripe Connect onboarding link generated. User redirected to Stripe Express onboarding. |

### P-17 — View Organization Settings
| Field | Detail |
|-------|--------|
| **Steps** | 1. Log in as provider 2. Navigate to `/provider/organization` |
| **Expected** | Organization page loads showing org name, contact info, members list, and edit options. |

### P-18 — Update Coverage and Capacity
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/provider/coverage` 2. Add/remove zone coverage |
| **Expected** | Coverage page loads with current zones. Can modify coverage selections. |

### P-19 — View Authorized SKUs
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/provider/skus` |
| **Expected** | SKU list loads showing all services the provider is authorized to perform. |

### P-20 — View Performance Metrics
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/provider/performance` |
| **Expected** | Performance page loads with job completion rate, on-time rate, photo compliance, and customer satisfaction metrics. |

---

## Admin Scenarios (A-01 to A-20)

### A-01 — Admin Login
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/auth` 2. Log in with admin credentials |
| **Expected** | Successful login, redirected to `/admin` dashboard. |

### A-02 — View Admin Dashboard
| Field | Detail |
|-------|--------|
| **Steps** | 1. Log in as admin 2. Navigate to `/admin` |
| **Expected** | Dashboard loads with key metrics: active subscriptions, jobs today, revenue, provider count, and alerts. |

### A-03 — Create a New Region
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/admin/zones` 2. Go to Regions tab 3. Click "Add Region" 4. Fill name + state 5. Save |
| **Expected** | Region created in database. Appears in regions list. Toast confirmation. |

### A-04 — Create a New Zone with ZIP Codes
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/admin/zones` 2. Go to Zones tab 3. Click "Add Zone" 4. Select region, add name, enter ZIP codes 5. Save |
| **Expected** | Zone created with associated ZIPs. Appears in zones list under selected region. |

### A-05 — Configure Zone Capacity
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/admin/capacity` or zone detail 2. Set max customers, max jobs per day |
| **Expected** | Capacity panel loads. Values save to database. Capacity constraints enforced. |

### A-06 — Configure Service Days for a Zone
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/admin/service-days` 2. Select a zone 3. Configure active days, time windows, overrides |
| **Expected** | Service day config loads for zone. Changes save. Override modal works for holidays/exceptions. |

### A-07 — Create/Edit SKU in Catalog
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/admin/skus` 2. Click "Add SKU" 3. Fill name, category, duration, checklist, photo reqs 4. Save |
| **Expected** | SKU created in service_skus table. Appears in catalog list. Edit updates existing SKU. |

### A-08 — Create/Edit Subscription Plan
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/admin/plans` 2. Click "Add Plan" 3. Fill name, price, entitlements 4. Save |
| **Expected** | Plan created in plans table. Entitlement version created. Appears in plans list. |

### A-09 — View Active Subscriptions List
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/admin/subscriptions` |
| **Expected** | Table of active subscriptions loads with customer name, plan, status, start date, and billing info. |

### A-10 — View Providers List
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/admin/providers` |
| **Expected** | Provider list loads with org names, statuses, coverage zones, and review flags. |

### A-11 — View Provider Detail
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/admin/providers` 2. Click on a provider |
| **Expected** | Provider detail page at `/admin/providers/:id` loads with org info, members, coverage, capabilities, compliance, risk flags, and enforcement actions. |

### A-12 — View Jobs List with Filters
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/admin/jobs` 2. Apply filters (status, zone, date) |
| **Expected** | Jobs list loads. Filters narrow results. Table shows job ID, customer, provider, date, status. |

### A-13 — View Job Detail (Timeline, Photos)
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/admin/jobs` 2. Click on a job |
| **Expected** | Job detail page at `/admin/jobs/:id` loads with timeline events, photos, checklist, issues, and admin actions. |

### A-14 — View Billing Overview
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/admin/billing` |
| **Expected** | Billing dashboard loads with collected today, failed payments, billing run status, and revenue metrics. |

### A-15 — View Customer Ledger
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/admin/billing/customer-ledger` |
| **Expected** | Customer ledger loads with per-customer invoice, credit, and refund history. |

### A-16 — View Payouts Overview
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/admin/payouts` |
| **Expected** | Payouts page loads with provider payout summary, pending amounts, and payout run history. |

### A-17 — View Provider Ledger
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/admin/payouts/provider-ledger` |
| **Expected** | Provider ledger loads with per-provider earnings, holds, and payout history. |

### A-18 — Triage Billing Exceptions
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/admin/exceptions` |
| **Expected** | Exception queue loads with severity-sorted items. Each shows type, entity, status, and action options. |

### A-19 — View Audit Logs
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/admin/audit` |
| **Expected** | Audit log page loads with chronological list of admin actions, entity changes, and actor info. |

### A-20 — View Admin Settings
| Field | Detail |
|-------|--------|
| **Steps** | 1. Navigate to `/admin/settings` |
| **Expected** | Admin settings page loads with system configuration options, role management, and platform settings. |
