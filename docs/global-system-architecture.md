# global-system-architecture.md
**Handled Home — Global System Architecture Spec (Modules 01–14)**  
**Platform:** Mobile-only (iOS + Android) via Capacitor  
**Backend baseline:** Supabase (Auth + Postgres + Storage + Edge Functions)  
**Last updated:** 2026-02-22

---

## 0) Purpose
This document is the **single source of truth** for how modules 01–14 stay consistent.

It defines:
- canonical domain language
- shared schema "spine"
- global enums + state machines
- routing + role gating
- rules engine boundaries
- security + audit standards
- PRD template contract

---

## 1) Product truths (do not violate)
- Subscription logistics platform (not marketplace).
- Customers never browse free-form calendars.
- Zone-assigned recurring **Service Day** is the customer promise.
- Standardized SKUs + proof-of-work are the quality moat.
- Capacity guardrails are required for stability.

---

## 2) App surfaces and routing (mobile-only)

### Route roots
- `/auth/*`
- `/customer/*`
- `/provider/*`
- `/admin/*`

### Routing rules
- Not authenticated → `/auth/login`
- Authenticated + no roles → Account Not Configured
- Role mismatch → redirect to active role root
- Never mount mixed role trees at once

---

## 3) Roles and access

### Roles (enum)
- `customer`
- `provider`
- `admin`

### Ownership keys (canonical)
Use consistent ownership columns for RLS:
- `household_id`
- `property_id`
- `provider_org_id`
- `assigned_provider_member_id`

Rule: client role storage does not grant access; RLS does.

---

## 4) Canonical glossary (use these terms everywhere)
Household, Household member, Property, Region, Zone, Service Day, Cycle, Bundle, SKU, Job, Proof-of-work, Exception, Support ticket.

---

## 5) Global enums and state machines

### Job status
ASSIGNED → CONFIRMED → (EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED)  
Exception paths: BLOCKED, RESCHEDULED, PARTIALLY_REFUNDED, REFUNDED

Values (canonical):
- ASSIGNED
- CONFIRMED
- REJECTED
- ALTERNATE_ASSIGNED
- EN_ROUTE
- ARRIVED
- IN_PROGRESS
- COMPLETED
- BLOCKED
- RESCHEDULED
- PARTIALLY_REFUNDED
- REFUNDED

### Provider status
- PENDING
- ACTIVE
- PROBATION
- SUSPENDED

### Service Day status
- SCHEDULED
- REJECTED
- ALTERNATE_OFFERED
- LOCKED

### Ticket status
- OPEN
- IN_REVIEW
- RESOLVED
- CLOSED

### Invoice status
UPCOMING → DUE → PAID / FAILED / VOID

### Payment status
INITIATED → SUCCEEDED / FAILED

### Earning status
EARNED → ELIGIBLE → IN_PAYOUT → PAID  
Hold branches: HELD (manual hold) / HELD_UNTIL_READY (payout account not ready)

### Payout status
INITIATED → PAID / FAILED

### Hold status
ACTIVE → RELEASED / EXPIRED

Rule: every state change writes an immutable event row (e.g., `job_events`, `ticket_events`, `customer_ledger_events`, `provider_ledger_events`).

---

## 6) Canonical schema spine (shared backend)

### Identity & access
- profiles
- user_roles
- admin_audit_log

### Customer
- properties

### Ops
- regions
- zones
- zone_zip_codes
- zone_service_week_configs
- zone_ops_configs
- service_day_assignments
- service_day_offers
- seasonal_service_templates

### Catalog
- service_skus
- sku_checklist_templates
- plans
- plan_entitlement_versions
- plan_entitlement_sku_rules
- plan_zone_availability

### Subscription & scheduling
- subscriptions
- customer_plan_selections
- customer_seasonal_selections
- routines
- routine_versions
- routine_items

### Execution
- jobs
- job_skus
- job_events
- job_checklist_items
- job_photos
- job_issues

### Provider
- provider_orgs
- provider_members
- provider_invites
- provider_coverage
- provider_capabilities
- provider_compliance
- provider_risk_flags
- provider_enforcement_actions

### Financial — Customer
- customer_payment_methods
- customer_invoices
- customer_invoice_line_items
- customer_payments
- customer_ledger_events
- customer_credits

### Financial — Provider
- provider_payout_accounts
- provider_earnings
- provider_payouts
- provider_payout_line_items
- provider_holds
- provider_hold_context
- provider_ledger_events

### Financial — System
- payment_webhook_events
- billing_runs
- payout_runs
- admin_adjustments
- billing_exceptions

### Support
- customer_issues
- support_tickets (Module 12)
- ticket_events (Module 12)
- dispute_records (Module 12)

### Growth
- referrals (Module 13)
- incentive_campaigns (Module 13)

### Analytics
- event_log (Module 14)
- daily_metrics_rollups (Module 14)

Rule: modules may extend schema, but must not rename these concepts.

---

## 7) Rules engine boundary (prevents drift)

UI must never compute:
- allowed alternative dates
- capacity acceptance
- fees or cutoffs
- rollover validity
- weather rescheduling outcomes
- provider reassignment outcomes
- SLA enforcement triggers
- invoice amounts or credit application
- earning eligibility or hold transitions
- payout thresholds

Rules engine owns:
- Service Day assignment
- controlled alternatives (2–3)
- capacity checks (minutes + stops)
- bundle lock/cutoff
- no-rollover enforcement (unused service weeks expire at billing cycle end)
- reschedule cutoffs/fees
- weather mode
- SLA enforcement ladders
- Invoice generation (cycle-based, idempotent via idempotency_key)
- Dunning retry schedule (+1d, +3d, +5d; pause after N failures)
- Earning hold/release logic (severity-based, admin-releasable)
- Payout threshold + eligibility transition (EARNED → ELIGIBLE after hold window)
- Credit application (capped to invoice total, oldest-first)

Implementation options:
- Postgres RPC functions
- Supabase Edge Functions
- scheduled jobs (pg_cron or edge function cron)

Rule: one interface, used by all modules.

---

## 8) Security and audit standards

### RLS principles
- default deny
- explicit allow per table
- consistent ownership keys
- providers see only assigned jobs
- admin actions are auditable
- customers never see raw payment data — only masked references

### Audit logging (required)
Log any change affecting:
- money (refunds, fee overrides, payouts, credits, adjustments)
- access (roles, impersonation)
- scheduling (overrides, reschedules, capacity edits)
- governance (SKU/plan rules, provider enforcement)
- billing (invoice voids, manual retries, hold releases)

Rule: if it changes money, access, or scheduling → audit log row.

---

## 9) Media (photo proof) standards
- Store photos in Supabase Storage
- Create DB rows in `job_photos` for each required slot
- Use signed URLs
- Required proof blocks completion
- Define retention policy globally and follow it

---

## 10) Observability and analytics

### Canonical events (noun_verb)
Examples:
- auth_signed_in
- service_day_rejected
- bundle_confirmed
- job_completed
- ticket_created
- invoice_generated
- payment_failed
- earning_created
- payout_initiated
- hold_released

### Canonical KPIs
- Service Day acceptance
- SKUs per cycle (attach rate)
- On-time %
- Redo rate
- Photo compliance %
- Provider utilization
- Density (stops per zone/day)
- Churn + retention cohorts
- Gross margin per zone/day
- Support minutes per job
- Offer expiry rate

Rule: don't invent new names for existing KPIs/events.

---

## 11) UI consistency rules (mobile-only)
- No desktop patterns.
- Proof-of-work UI is consistent across modules.
- Status timelines use consistent wording and ordering.
- Copy is calm, competent, kind.

---

## 12) Required PRD template contract
Every module must include (same order):
1) Goal
2) In scope / Out of scope
3) User stories (by role)
4) Data model impacts (tables + ownership + RLS notes)
5) Business rules (engine-owned vs UI-owned)
6) Screens (mobile-only)
7) Routing (protected paths + entry points)
8) State transitions + events
9) Error + empty states
10) Security & audit notes
11) Acceptance tests
12) File impact map

---

## 13) Global "don't break this" list
- No free-form calendar scheduling anywhere.
- No SKU scope outside SKU catalog.
- No bypass of capacity validation.
- No money changes without audit logs.
- No cross-role route bleed.
- No provider access to non-assigned customer data.
- No optional proof-of-work on governed SKUs.
- No direct status changes — all transitions go through RPCs or edge functions.
- No client-side invoice/earning calculations — server computes, client displays.
