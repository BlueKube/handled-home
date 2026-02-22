# 11-billing-and-payouts.md  
**Handled Home — Module 11 PRD (Billing + Payouts + Exceptions)**  
**Mobile:** iOS + Android (Capacitor) — Customer + Provider  
**Admin Console:** Mobile-optimized, operationally usable  

**Primary Customer Routes:**  
- `/customer/billing`  
- `/customer/billing/methods`  
- `/customer/billing/history`  
- `/customer/billing/receipts/:invoice_id`  

**Primary Provider Routes:**  
- `/provider/payouts`  
- `/provider/payouts/onboarding`  
- `/provider/payouts/history`  
- `/provider/payouts/payouts/:payout_id`  
- `/provider/payouts/earnings/:earning_id` (optional details)  

**Primary Admin Routes:**  
- `/admin/billing`  
- `/admin/billing/customers`  
- `/admin/billing/customers/:customer_id`  
- `/admin/payouts`  
- `/admin/payouts/providers`  
- `/admin/payouts/providers/:provider_org_id`  
- `/admin/settings/payments`  
- `/admin/exceptions`  
- `/admin/issues` (support queue; linked from exceptions)  

**Last updated:** 2026-02-22  

---

## 0) Why this module exists

Handled Home monetizes through:
- subscription billing (4-week cycles; “monthly feel”)  
- one-time add-ons / seasonal upsells (Module 07 layer)  

…and pays providers based on completed jobs (Module 09).

Module 11 must:
- collect money reliably with minimal customer effort  
- pay providers accurately and predictably with minimal provider effort  
- give admin a clean ledger + exception queue  
- reduce disputes through transparency and auditability  

**It should be invisible when things work and crystal-clear when they don’t.**

---

## 1) North Star outcomes (Definition of Done)

1) Customer never thinks about billing: autopay works; receipts are clear; failures are handled calmly.  
2) Provider never thinks about payouts: earnings accrue automatically; payouts arrive predictably.  
3) Admin can answer “what happened?” from a single ledger trail (customer + provider), traceable to cycles, add-ons, and jobs.  
4) Billing and payout runs are idempotent and safe under retries, webhook duplication, and out-of-order delivery.  
5) Exceptions are rare, visible, and fast to resolve with minimal manual steps.

---

## 2) Strategic decisions (locked)

### 2.1 Customer billing visibility
- Customers see **subscription cycle totals** and **add-on purchases** as separate line items.  
- Customers do **not** see per-visit economics or provider payout detail.

### 2.2 Add-on billing timing
- Default: **bill add-ons immediately** at purchase (one-time charge).  
- Optional policy: allow “add to next bill” only under:
  - amount below threshold OR
  - explicit customer choice (policy controlled)

### 2.3 Provider payouts
- Default: **weekly payouts**.  
- Minimum payout threshold (policy): e.g., $50–$100.  
- Hold window before earnings become eligible (selective):
  - routine jobs: default 24h  
  - seasonal/high-risk: 48–72h  
  - probation providers: longer universal hold (e.g., 72h)

### 2.4 Provider compensation model (v1)
- **Base per-visit payout** + small set of rule-assigned modifiers.  
- Provider sees a simple total per job by default.

### 2.5 Issue impact on payouts
- Do **not** auto-hold on every complaint.  
- Auto-hold only for **high severity** issues (damage/safety/misconduct).  
- Minor issues default to credits/refunds and performance flags, not payout disruption.

### 2.6 Dispute resolution posture (v1)
- Manual through support initially.  
- Admin sees automation-assisted “suggested resolution” actions, but no auto-correction visits.

### 2.7 Credits policy (v1)
- Fixed credit tiers, auto-applied to next invoice by default.  
- Refunds are admin-only in v1.

---

## 3) Non-negotiable principles

- **Ledger-first accounting:** append-only events; balances derived, not edited.  
- **Webhook-driven truth:** processor webhooks settle final states.  
- **Idempotency everywhere:** invoice generation, payment attempts, payout runs, webhook processing.  
- **No surprise charges:** explicit “charged today” vs “added to next bill.”  
- **Separation of concerns:** customer and provider ledgers are distinct.  
- **No calendar coupling:** billing tied to cycle + add-ons, not appointment times.

---

## 4) Scope

### 4.1 In scope

**Customer**
- payment method management (tokenized)  
- subscription invoices (4-week cycles) + autopay  
- add-on charges (immediate by default)  
- billing history + receipts  
- dunning UX + automation  
- credits display + auto-application  

**Provider**
- payout onboarding (processor-hosted, minimal input)  
- earnings accrual on job completion  
- weekly payouts + threshold rollovers  
- payout history + earnings list  
- holds + “eligible on” transparency  

**Admin**
- billing overview + customer ledgers  
- payouts overview + provider ledgers  
- unified exception queue  
- policy configuration (retry cadence, thresholds, hold rules, credit tiers)  
- reconciliation surfaces  
- issue-driven payout hold/release workflow  

### 4.2 Out of scope
- multi-currency/FX  
- provider advances/loans  
- complex invoice customization  
- marketplace bid pricing  
- full automation of correction visits  

---

## 5) Payments processor abstraction (processor-agnostic)

Module 11 describes flows generically:
- payment method token  
- charge/payment intent  
- invoice (internal; may map to processor invoices)  
- connected account (provider)  
- transfer/payout  
- refund  
- dispute/chargeback  
- webhooks  

Requirement:
- Use a processor that supports **customer charges + connected payouts + webhooks**.

---

## 6) State machines (explicit)

### 6.1 Customer invoice state machine
States:
- `UPCOMING` → `DUE` → `PAID`  
- `DUE` → `FAILED` (then retries)  
- `UPCOMING/DUE` → `VOID` (admin only; rare)

Transitions:
- Invoice generation creates `UPCOMING` or `DUE` (policy).  
- Autopay attempt changes to `PAID` or `FAILED` based on webhook truth.  
- Credits adjust invoice total (line items); do not mutate ledger history.

### 6.2 Payment attempt state machine
States:
- `INITIATED` → `SUCCEEDED`  
- `INITIATED` → `FAILED` → (new attempt)  

Rules:
- Each retry is a new payment_attempt row with incremented attempt_number.  
- Final payment status is webhook-driven.

### 6.3 Subscription billing health state (customer-facing)
Derived from invoices + Module 05 subscription:
- `HEALTHY`  
- `ACTION_REQUIRED` (needs new payment method)  
- `PAST_DUE` (after N failures)  
- `SERVICE_PAUSED` (ops policy; blocks future obligations, not access to receipts/history)

### 6.4 Provider earning state machine
States:
- `EARNED` → `ELIGIBLE` → `PAID`  
- `EARNED` → `HELD` (high severity)  
- `EARNED` → `HELD_UNTIL_READY` (payout account not READY)  
- `ELIGIBLE` → `PAID` (via payout run + webhook)  
- `ELIGIBLE` → `HELD` (if new high-severity hold placed before payout)

### 6.5 Provider payout state machine
States:
- `INITIATED` → `PAID`  
- `INITIATED` → `FAILED` (exception queue)  

Rules:
- Payout runs are re-runnable idempotently.  
- Earnings can only be marked `PAID` on payout webhook confirmation.

---

## 7) Customer billing experience (premium, calm)

### 7.1 `/customer/billing` (overview)
Show:
- current plan name  
- next bill date (cycle boundary)  
- current cycle status:
  - “Paid” / “Due” / “Action needed”  
- default payment method (masked)  
- credits available (if any)

If action needed:
- one CTA: “Fix payment method”

### 7.2 Payment methods
Routes:
- `/customer/billing/methods`  
Must feel minimal:
- default method  
- add new method (processor-hosted flow if possible)  
- remove method (guarded: cannot remove last method if active subscription)

### 7.3 Billing history
Route:
- `/customer/billing/history`  
List invoices:
- date range  
- type badge: Subscription / Add-on / Adjustment  
- status pill: Paid / Failed / Due  
- amount  
Tap → receipt

### 7.4 Receipt view
Route:
- `/customer/billing/receipts/:invoice_id`  
Shows:
- plan + cycle period (if subscription invoice)  
- line items grouped:
  - Plan  
  - Add-ons  
  - Credits  
  - Taxes/fees (if applicable)  
- total  
- payment status and method (masked)  
- if failed: next retry time + “Fix payment” CTA

### 7.5 “No surprise charges” copy rules
Any add-on purchase confirmation must say one of:
- “Charged today: $X”  
- “Added to your next bill on {date}: $X”

---

## 8) Add-ons billing (immediate by default)

### 8.1 Immediate charge (default)
When add-on order is created (Module 07 seasonal/add-on layer):
- create an internal add-on invoice/charge record  
- attempt payment immediately  
- if successful: mark paid, emit receipt  
- if failed:
  - create exception item  
  - show customer banner: “Payment failed for add-on” with “Fix payment”

Idempotency key:
- `(customer_id, add_on_order_id, invoice_type=ADD_ON)`

### 8.2 “Add to next bill” (optional policy)
If allowed:
- create a pending line item attached to the next subscription invoice  
- do not attempt immediate charge  
- receipt makes it explicit:
  - “Added to next bill on {date}”

Guardrails:
- If next subscription invoice is already PAID:
  - attach to the following cycle  
- If customer cancels before next bill:
  - follow policy: cancel pending add-on or bill immediately (choose one policy and keep consistent)

---

## 9) Credits and refunds (automation-first)

### 9.1 Credit tiers (configurable)
- Tier 1: $10  
- Tier 2: $25  
- Tier 3: $50  
- Custom: admin-only

Rules:
- credits auto-apply to the **next** open invoice (default)  
- show credits as negative line items  
- max 1 automatic credit per cycle without escalation (policy)

### 9.2 Refunds (admin only in v1)
Refunds reserved for policy cases:
- duplicate charge  
- service unavailable after charge  
- chargeback prevention cases

Refund behavior:
- create refund ledger event  
- processor refund issued  
- webhook confirms final

---

## 10) Dunning (failed payment) — calm but firm

Goal: recover revenue without support-heavy loops.

### 10.1 Customer UX
- push/email (optional) + in-app banner:
  - “We couldn’t process your payment. Update your card to avoid interruption.”  
- one CTA: “Update payment method”  
- show next retry date/time

### 10.2 Retry schedule (policy-driven)
Example (configurable):
- +1 day, +3 days, +5 days  
After N failures:
- mark subscription billing state `PAST_DUE`  
- block creation of new operational obligations (future visits/jobs)  
- keep access to history and receipts intact

---

## 11) Provider payouts experience (invisible when healthy)

### 11.1 Provider payouts home
Route: `/provider/payouts`

Show:
- “Next payout: {date}” (if READY)  
- “Available soon” balance (eligible)  
- “On hold” balance (if any)  
- CTA if NOT_READY: “Set up payouts”

Tone:
- “You’re all set.” when healthy  
- only interrupt when action required

### 11.2 Onboarding (minimal input)
Route: `/provider/payouts/onboarding`
- processor-hosted onboarding recommended  
- show status:
  - NOT_READY / PENDING_VERIFICATION / READY / RESTRICTED  
- if RESTRICTED:
  - show “Action required” with processor link

### 11.3 Earnings list
Route: `/provider/payouts/history`
List earnings by job:
- date  
- property short label  
- total amount  
- status:
  - Earned (holding)  
  - Eligible on {date}  
  - Paid (payout id)

Optional detail route:
- `/provider/payouts/earnings/:earning_id`  
Shows base + modifiers (read-only) and hold reason category if held.

### 11.4 Payout detail
Route: `/provider/payouts/payouts/:payout_id`
Shows:
- payout total  
- payout date  
- included earnings list  
- status and processor reference (masked)

---

## 12) Earnings accrual + holds (event-driven)

### 12.1 Earning creation trigger
Trigger:
- Job COMPLETED via server-validated completion (Module 09)

Create provider earning:
- base amount + modifiers  
- `hold_until` computed by policy  
- status:
  - `EARNED` initially  
  - becomes `ELIGIBLE` after hold window  
  - or `HELD` if high-severity hold exists  
  - or `HELD_UNTIL_READY` if payout account not READY

### 12.2 Selective hold rules
Hold policy inputs:
- job tags (routine vs seasonal/high-risk)  
- provider org status (probation, suspended)  
- issue severity (HIGH triggers hold)

Anti-abuse:
- customer issue submission alone does not hold payouts unless severity HIGH.

---

## 13) Weekly payout runs + threshold (automation)

### 13.1 Payout run behavior (weekly)
On scheduled day:
- aggregate ELIGIBLE earnings per provider_org  
- if total < threshold:
  - rollover automatically (no action required)  
- if payout account not READY:
  - mark those earnings `HELD_UNTIL_READY` (or keep ELIGIBLE but not payable; choose one, consistent)  
- initiate payout batch to processor  
- mark payout `PAID` only on webhook confirmation  

Idempotency key:
- `(provider_org_id, payout_run_id)`  
- payout_line_items unique by earning_id

### 13.2 Failed payout handling
- payout status becomes FAILED on webhook  
- exception created with next action:
  - “Provider payout method required” or “Processor error”  
- provider sees calm banner:
  - “Payout delayed — action required” with onboarding link (if applicable)

---

## 14) Issues and payout holds (severity-based)

### 14.1 Severity assignment
Inputs:
- issue_type (damage/safety/misconduct are HIGH by default)  
- provider history flags (optional)  
- admin override possible

Hold rules:
- LOW: no hold  
- MED: optional soft hold for 24–48h (policy)  
- HIGH: automatic hard hold on that job’s earning + exception queue item

### 14.2 Provider context submission (bounded, no chat)
For HELD earnings:
- provider sees “Under review” + category  
- one-time “Add context” form:
  - choose a reason category  
  - optional 200-char note  
  - optional photo upload  
- one submission per held earning by default

Admin sees context inline to resolve faster.

---

## 15) Admin operations (exception-first, one-click resolutions)

### 15.1 Unified exception queue
Route: `/admin/exceptions`

Includes:
- failed subscription payments  
- failed add-on charges  
- disputes/chargebacks  
- payout failures  
- providers not payout-ready with held earnings  
- high-severity issue holds  
- reconciliation mismatches  

Each exception card shows:
- type + severity  
- impacted entity (customer/provider)  
- “next best action” CTA  
- audit trail link  

### 15.2 Billing overview
Route: `/admin/billing`
Shows:
- collected today/week  
- failed payments + past_due count  
- credits/refunds issued  
- disputes count  
- top exceptions  

### 15.3 Customer billing ledger
Route: `/admin/billing/customers/:customer_id`
Shows:
- subscription status and cycle boundaries  
- invoices + line items  
- credits/refunds with reasons  
- dunning attempts + next retry  
- traceability section:
  - jobs completed in each cycle (read-only reference)  

Admin actions (reason required):
- retry payment  
- apply credit (tier pick)  
- issue refund (policy gated)  
- pause/cancel subscription (Module 05 ties)

### 15.4 Payout overview + provider ledger
Route: `/admin/payouts/providers/:provider_org_id`
Shows:
- onboarding status  
- earnings ledger per job (base + modifiers)  
- holds + provider context  
- payout runs and failures  

Admin actions (reason required):
- release hold  
- mark issue resolved  
- apply adjustment (rare; heavy confirm)  
- suspend payouts

### 15.5 Suggested resolutions (assisted, not automatic)
In issue/exception views:
- “Issue credit $10 / $25 / $50”  
- “Release hold”  
- “Escalate damage review”  
- “Request more info” (internal note/task)  
- “Offer redo (manual scheduling)” (creates support task; does not auto-schedule)

---

## 16) Data model (ledger-first)

> Append-only events are the source of truth. Balances are derived.

### 16.1 Customer tables
- `customer_payment_methods`
- `customer_invoices`
- `customer_invoice_line_items`
- `customer_payments`
- `customer_ledger_events`

### 16.2 Provider tables
- `provider_payout_accounts`
- `provider_earnings`
- `provider_payouts`
- `provider_payout_line_items`
- `provider_holds`
- `provider_hold_context` (optional)
- `provider_ledger_events`

### 16.3 Shared/system tables
- `payment_webhook_events`
- `billing_runs`
- `payout_runs`
- `admin_adjustments`

(See the seed spec for full field lists; implement those shapes as written.)

---

## 17) Webhooks + reconciliation (robust)

- Store every webhook raw payload.  
- Deduplicate by processor_event_id.  
- Idempotent processing and safe under out-of-order delivery.  
- Reconciliation compares internal vs processor totals; mismatches create exceptions.

---

## 18) Idempotency requirements (explicit)

- Subscription invoice generation: `(customer_id, cycle_start_at)`  
- Add-on charge: `(customer_id, add_on_order_id)`  
- Dunning retry: `(invoice_id, attempt_number)`  
- Earning creation: `(provider_org_id, job_id)`  
- Payout run: `(provider_org_id, payout_run_id)`  
- Webhook processing: `processor_event_id`

---

## 19) Security & RLS boundaries

Customers:
- read own invoices/receipts and masked methods  
- update own payment method refs  
- never see raw payment method data  
- no access to provider ledgers  

Providers:
- read own earnings/payouts  
- cannot see other providers or customer billing  

Admins:
- read all ledgers  
- privileged actions require reason + audit logging  

Sensitive:
- no raw card/bank details stored; only processor refs + masks.

---

## 20) Edge cases

Customer:
- payment failures, card replacement  
- chargebacks/disputes  
- add-on cancellation/unavailability (credit/refund)  
- past due pauses service obligations but not history  

Provider:
- NOT_READY payout account holds earnings until READY  
- payout failures create exceptions  
- issues after payout: avoid clawbacks in v1; prefer credits/holds for future earnings  

System:
- webhook duplication/out-of-order  
- payout run retry safety  
- reconciliation mismatches

---

## 21) Acceptance tests

1) Subscription invoice generated each 4-week cycle; payment attempted and recorded via webhook.  
2) Failed payment triggers dunning; customer sees one CTA; service pauses after N failures.  
3) Add-on purchase charges immediately by default; “next bill” works when enabled; no duplicates.  
4) Job completion creates provider earning; hold_until computed correctly.  
5) Weekly payout run aggregates eligible earnings, respects threshold, pays provider; webhook confirms paid.  
6) Provider NOT_READY: earnings accrue but held; once READY, next run pays out.  
7) High severity issue triggers hold; provider can submit context; admin can release hold and issue credit tier.  
8) Admin can trace invoice ↔ cycle ↔ jobs ↔ provider earnings.  
9) Webhook processing is idempotent under duplicates/out-of-order.

---

## 22) Deliverables

- Customer billing screens + receipts  
- Provider payouts screens + onboarding  
- Admin billing/payout ledgers + exception queue + settings  
- Webhook event store + idempotent processors + reconciliation surfaces  
- Scheduled runs: invoice generation, dunning retries, payout runs  
- Audit logging for overrides/adjustments  
