

# Module 11 — Billing and Payouts: Full Implementation Plan

This is a large module spanning customer billing, provider payouts, admin operations, and Stripe integration. It will be implemented in 8 phases.

---

## Phase 1: Replace spec document and create database schema

**Spec file:** Replace `docs/modules/11-billing-and-payouts.md` with the full PRD.

**Database migration** creating all tables from section 16 of the PRD:

### Customer tables
- `customer_payment_methods` — customer_id, processor_ref, brand, last4, exp_month, exp_year, is_default, status, created_at
- `customer_invoices` — customer_id, subscription_id, invoice_type (SUBSCRIPTION / ADD_ON / ADJUSTMENT), cycle_start_at, cycle_end_at, subtotal_cents, credits_applied_cents, total_cents, status (UPCOMING / DUE / PAID / FAILED / VOID), processor_invoice_id, idempotency_key (UNIQUE), due_at, paid_at, created_at
- `customer_invoice_line_items` — invoice_id, label, type (PLAN / ADD_ON / CREDIT / TAX), amount_cents, metadata (jsonb)
- `customer_payments` — invoice_id, customer_id, amount_cents, processor_payment_id, status (INITIATED / SUCCEEDED / FAILED), attempt_number, idempotency_key, created_at
- `customer_ledger_events` — customer_id, event_type, invoice_id, amount_cents, balance_after_cents, metadata, created_at (append-only)
- `customer_credits` — customer_id, amount_cents, reason, issued_by_admin_user_id, applied_to_invoice_id, status (AVAILABLE / APPLIED / EXPIRED), created_at

### Provider tables
- `provider_payout_accounts` — provider_org_id, processor_account_id, status (NOT_READY / PENDING_VERIFICATION / READY / RESTRICTED), onboarding_url, created_at, updated_at
- `provider_earnings` — provider_org_id, job_id, base_amount_cents, modifier_cents, total_cents, hold_until, status (EARNED / ELIGIBLE / HELD / HELD_UNTIL_READY / PAID), payout_id, hold_reason, idempotency_key (UNIQUE on provider_org_id + job_id), created_at
- `provider_payouts` — provider_org_id, payout_run_id, total_cents, status (INITIATED / PAID / FAILED), processor_payout_id, paid_at, created_at
- `provider_payout_line_items` — payout_id, earning_id (UNIQUE), amount_cents
- `provider_holds` — provider_org_id, earning_id, hold_type (AUTO / MANUAL), severity, reason_category, status (ACTIVE / RELEASED / EXPIRED), released_by_admin_user_id, released_at, created_at
- `provider_hold_context` — hold_id, provider_org_id, reason_category, note (max 200 chars), photo_storage_path, created_at

### System tables
- `payment_webhook_events` — processor_event_id (UNIQUE), event_type, payload (jsonb), processed, processed_at, created_at
- `billing_runs` — id, run_type, status, started_at, completed_at, metadata
- `payout_runs` — id, status, started_at, completed_at, earnings_count, total_cents
- `admin_adjustments` — admin_user_id, entity_type, entity_id, adjustment_type, amount_cents, reason, metadata, created_at
- `billing_exceptions` — type, severity, entity_type, entity_id, customer_id, provider_org_id, status (OPEN / RESOLVED / DISMISSED), next_action, resolved_by_admin_user_id, resolved_at, created_at

### RLS policies
- Customers: read own invoices, payments, credits, payment methods; insert/update own payment methods
- Providers: read own earnings, payouts, holds; insert hold_context for own org
- Admins: full access to all billing/payout tables
- webhook_events: no direct user access (service role only)

---

## Phase 2: Database functions (RPCs)

- `create_provider_earning(p_job_id uuid)` — SECURITY DEFINER; called after job completion; computes base + modifiers, sets hold_until based on policy, creates earning with idempotency key
- `transition_eligible_earnings()` — marks EARNED earnings as ELIGIBLE when hold_until has passed and no active holds
- `run_payout_batch(p_payout_run_id uuid)` — aggregates ELIGIBLE earnings per provider, checks threshold, creates payout + line items, returns summary
- `admin_release_hold(p_hold_id uuid, p_reason text)` — releases a hold and re-evaluates earning status
- `admin_apply_credit(p_customer_id uuid, p_tier text, p_reason text)` — creates credit record, auto-applies to next open invoice
- `admin_issue_refund(p_invoice_id uuid, p_amount_cents int, p_reason text)` — creates refund ledger event
- `admin_void_invoice(p_invoice_id uuid, p_reason text)` — voids an invoice (UPCOMING/DUE only)
- `admin_retry_payment(p_invoice_id uuid)` — creates a new payment attempt
- `generate_subscription_invoice(p_subscription_id uuid)` — generates cycle invoice with idempotency

---

## Phase 3: Edge functions (Stripe integration)

### Update existing `stripe-webhook` function
- Store raw payload in `payment_webhook_events` with deduplication by `processor_event_id`
- Handle new event types:
  - `invoice.created`, `invoice.paid`, `invoice.payment_failed` -- update `customer_invoices` and `customer_payments`
  - `transfer.paid`, `transfer.failed` -- update `provider_payouts`
  - `charge.dispute.created` -- create billing exception

### New: `create-setup-intent` edge function
- Creates a Stripe SetupIntent for adding payment methods
- Returns client_secret for frontend to collect card details

### New: `create-connect-account` edge function
- Creates a Stripe Connect account for provider orgs
- Generates onboarding link
- Stores account info in `provider_payout_accounts`

### New: `create-connect-account-link` edge function
- Generates a new Stripe Connect onboarding/dashboard link for providers

### New: `process-payout` edge function
- Called by admin or scheduled run
- Creates Stripe Transfer to connected account
- Records payout in database

---

## Phase 4: React hooks

- `useCustomerBilling()` — fetches invoices, payment methods, credits, billing health state
- `useCustomerPaymentMethods()` — CRUD for payment methods via setup intents
- `useCustomerInvoices()` — list invoices with filters
- `useProviderEarnings()` — list earnings with status filters
- `useProviderPayouts()` — list payouts
- `useProviderPayoutAccount()` — payout account status + onboarding
- `useAdminBilling()` — overview stats, customer ledgers
- `useAdminPayouts()` — overview stats, provider ledgers, exception queue
- `useBillingExceptions()` — fetch and manage exceptions
- `useAdminBillingActions()` — mutations for credit, refund, void, retry, hold release

---

## Phase 5: Customer billing UI

### `/customer/billing` (overview page)
- Current plan name + next bill date
- Cycle status badge (Paid / Due / Action needed)
- Default payment method (masked card)
- Credits available
- "Fix payment method" CTA when action needed
- Links to methods and history

### `/customer/billing/methods` (payment methods page)
- List saved payment methods with default badge
- Add new method (Stripe SetupIntent flow)
- Remove method (guarded: cannot remove last if active subscription)
- Set default

### `/customer/billing/history` (invoice list)
- List of invoices: date range, type badge, status pill, amount
- Tap to view receipt

### `/customer/billing/receipts/:invoiceId` (receipt detail)
- Plan + cycle period
- Line items grouped: Plan, Add-ons, Credits, Taxes
- Total, payment status, masked method
- If failed: next retry + "Fix payment" CTA

---

## Phase 6: Provider payouts UI

### `/provider/payouts` (overview page -- replaces Earnings placeholder)
- Next payout date (if READY)
- Available balance (eligible)
- On hold balance
- CTA if NOT_READY: "Set up payouts"
- "You're all set" when healthy

### `/provider/payouts/onboarding`
- Processor-hosted onboarding redirect
- Status display: NOT_READY / PENDING_VERIFICATION / READY / RESTRICTED
- If RESTRICTED: "Action required" with processor link

### `/provider/payouts/history` (earnings + payouts list)
- Earnings by job: date, property label, amount, status
- Payouts list: date, total, status

### `/provider/payouts/payouts/:payoutId` (payout detail)
- Total, date, included earnings, status

### Hold context submission
- "Under review" indicator on held earnings
- One-time "Add context" form: reason category, 200-char note, optional photo

---

## Phase 7: Admin billing and payouts UI

### `/admin/billing` (overview dashboard)
- Collected today/week, failed payments count, credits/refunds issued, disputes count

### `/admin/billing/customers/:customerId` (customer ledger)
- Subscription status, cycle boundaries
- Invoice list with line items
- Credits/refunds with reasons
- Dunning attempts, next retry
- Admin actions: retry payment, apply credit, issue refund, pause/cancel subscription

### `/admin/payouts` (overview + provider list)
- Payout stats, pending payouts, held earnings count

### `/admin/payouts/providers/:providerOrgId` (provider ledger)
- Onboarding status
- Earnings ledger per job
- Holds + provider context
- Admin actions: release hold, apply adjustment, suspend payouts

### `/admin/exceptions` (unified exception queue)
- Failed payments, disputes, payout failures, holds
- Each card: type, severity, impacted entity, "next best action" CTA
- Suggested resolutions: credit tiers, release hold, escalate

### `/admin/settings/payments` (policy configuration -- optional/placeholder)
- Retry cadence, thresholds, hold rules, credit tiers

---

## Phase 8: Routing, navigation, and wiring

### App.tsx routing updates
- Add customer routes: `/customer/billing/methods`, `/customer/billing/history`, `/customer/billing/receipts/:invoiceId`
- Replace provider earnings route with payouts routes: `/provider/payouts`, `/provider/payouts/onboarding`, `/provider/payouts/history`, `/provider/payouts/payouts/:payoutId`
- Add admin routes: `/admin/billing`, `/admin/billing/customers/:customerId`, `/admin/payouts`, `/admin/payouts/providers/:providerOrgId`, `/admin/exceptions`

### Sidebar updates
- Customer: "Billing" link already present (keep as-is, points to `/customer/billing`)
- Provider: Change "Earnings" to "Payouts" pointing to `/provider/payouts`
- Admin: Add "Billing", "Payouts", "Exceptions" nav items

### Bottom tab bar / More menu updates
- Provider: update "Earnings" tab label to "Payouts" with updated path
- Admin More menu: add Billing, Payouts, Exceptions

---

## Technical notes

- All amounts in cents (integer) -- no floating point
- Idempotency keys on all financial operations (UNIQUE constraints)
- Append-only ledger_events tables -- never update/delete rows
- Webhook deduplication by processor_event_id
- Stripe API version: `2025-08-27.basil` for new edge functions
- Provider payouts use Stripe Connect (Express accounts)
- Payment methods use Stripe SetupIntents (not raw card data)
- RLS strictly scoped: customers see only own data, providers see only own org data
- All admin actions require reason and produce audit log entries

