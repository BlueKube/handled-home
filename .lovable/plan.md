

# Module 11 — Code Review Fixes

Addressing all issues from the code review, organized by priority.

---

## MUST FIX (6 issues)

### S1: run_payout_batch marks earnings PAID before webhook confirmation

**Problem**: Lines 188-189 of the RPC immediately set earnings to `PAID` when the batch is created, before the Stripe transfer succeeds. If the transfer fails, earnings are incorrectly marked PAID.

**Fix**: Change the RPC to set earnings to `IN_PAYOUT` (new intermediate status) instead of `PAID`. Only the `transfer.paid` webhook handler should transition earnings from `IN_PAYOUT` to `PAID`. The `transfer.failed` webhook should revert them to `ELIGIBLE`.

**Changes**:
- Migration: `ALTER` the `run_payout_batch` RPC to use `IN_PAYOUT` status
- `stripe-webhook/index.ts`: In `transfer.paid` handler, also update `provider_earnings` linked to the payout from `IN_PAYOUT` to `PAID`. In `transfer.failed`, revert them to `ELIGIBLE`.

---

### S2: generate_subscription_invoice always creates $0 invoices

**Problem**: Line 396 hardcodes `v_total_cents := 0`. Every invoice has zero amount.

**Fix**: Parse the plan's `display_price_text` (e.g., "$49/mo") to extract cents, or look up the Stripe price via `stripe_price_id` on the `plans` table. Since we can't call Stripe from a PL/pgSQL function, we'll parse `display_price_text`:
- Extract numeric value from `display_price_text` using regex
- Multiply by 100 for cents
- Fall back to 0 if unparsable (with a warning in the result)

**Changes**: Migration to replace `generate_subscription_invoice` RPC.

---

### E1: process-payout join query will fail at runtime

**Problem**: Line 53 tries `.select("*, provider_payout_accounts!inner(processor_account_id)")` but there's no FK from `provider_payouts` to `provider_payout_accounts`. Both reference `provider_orgs` independently.

**Fix**: Query in two steps:
1. Fetch the payout by ID
2. Separately query `provider_payout_accounts` by `provider_org_id` from the payout

**Changes**: `supabase/functions/process-payout/index.ts`

---

### E2: invoice.payment_failed inserts null invoice_id into NOT NULL column

**Problem**: Line 273 uses `invoice_id: null as any` but `customer_payments.invoice_id` is `NOT NULL`.

**Fix**: Look up the internal invoice by `processor_invoice_id` or `subscription_id + status`. If no matching internal invoice exists, skip the payment record insertion (the exception is still created).

**Changes**: `supabase/functions/stripe-webhook/index.ts` — `invoice.payment_failed` case

---

### A1: No automatic earning creation on job completion

**Problem**: `create_provider_earning` RPC exists but is never called from `complete_job` or `admin_override_complete_job`.

**Fix**: Add `PERFORM create_provider_earning(p_job_id)` at the end of both `complete_job` (after the COMPLETED update) and `admin_override_complete_job`. Wrap in a BEGIN/EXCEPTION block so earning creation failure doesn't block job completion.

**Changes**: Migration to replace both RPCs with the earning call added.

---

### E4: No account.updated webhook handler

**Problem**: When providers complete Stripe Connect onboarding, the `account.updated` event fires. Without handling it, `provider_payout_accounts.status` is never updated to `READY`.

**Fix**: Add `account.updated` case to the webhook handler:
- Check `account.charges_enabled` and `account.payouts_enabled`
- If both true: update status to `READY`
- If `account.requirements.currently_due` has items: `RESTRICTED`
- Otherwise: `PENDING_VERIFICATION`
- Also transition any `HELD_UNTIL_READY` earnings to `EARNED` (with hold_until set) when status becomes READY

**Changes**: `supabase/functions/stripe-webhook/index.ts`

---

## SHOULD FIX (8 issues)

### D1: Missing provider_ledger_events table

**Fix**: Create `provider_ledger_events` table mirroring `customer_ledger_events` structure with `provider_org_id`, `event_type`, `earning_id`, `payout_id`, `amount_cents`, `balance_after_cents`, `metadata`, `created_at`. RLS: providers read own, admins read all, no direct inserts (RPCs only). Then update `run_payout_batch` and `admin_release_hold` RPCs to write ledger events.

**Changes**: New migration for table + RLS + RPC updates.

---

### D4: Missing UNIQUE(customer_id, processor_ref) on customer_payment_methods

**Fix**: Add unique constraint so the webhook upsert on `onConflict: "customer_id,processor_ref"` works.

**Changes**: Migration: `ALTER TABLE public.customer_payment_methods ADD CONSTRAINT customer_payment_methods_customer_processor_unique UNIQUE (customer_id, processor_ref);`

---

### S3: create_provider_earning not called from complete_job

Covered by A1 fix above.

---

### E3: invoice.payment_succeeded marks ALL DUE invoices as PAID

**Fix**: Match by `processor_invoice_id` instead of just `customer_id + status`. First try to find invoice by `processor_invoice_id`, then fall back to most recent DUE invoice for the customer (not all of them).

**Changes**: `supabase/functions/stripe-webhook/index.ts` — `invoice.payment_succeeded` case

---

### S4: generate_subscription_invoice burns all credits regardless of need

**Fix**: In the RPC, accumulate credits only up to the invoice total. Stop the loop once `v_credits_cents >= v_total_cents`. Only mark credits as APPLIED that were actually consumed.

**Changes**: Part of the `generate_subscription_invoice` RPC rewrite.

---

### P11: No admin customer billing ledger page

**Fix**: Create `/admin/billing/customers/:customerId` page showing:
- Customer name, subscription status
- Invoice history with line items
- Credits and refunds
- Admin action buttons: Apply Credit, Issue Refund, Void Invoice, Retry Payment

**Changes**: New file `src/pages/admin/CustomerLedger.tsx`, route in `App.tsx`, hook `useAdminCustomerLedger`.

---

### P12: No admin provider ledger page

**Fix**: Create `/admin/payouts/providers/:providerOrgId` page showing:
- Provider org name, payout account status
- Earnings list with job links
- Holds with provider context
- Admin actions: Release Hold

**Changes**: New file `src/pages/admin/ProviderLedger.tsx`, route in `App.tsx`, hook `useAdminProviderLedger`.

---

### A2-A4: No scheduling/automation

These require cron jobs. We'll create a single `run-billing-automation` edge function that handles:
- `transition_eligible_earnings()` — move EARNED to ELIGIBLE
- Invoice generation for subscriptions approaching cycle end

And wire it up with a `pg_cron` SQL insert (via the insert tool, not migration).

**Changes**: New edge function `supabase/functions/run-billing-automation/index.ts`, `supabase/config.toml` update, cron SQL.

---

## NICE TO HAVE (deferred)

The following are acknowledged but deferred to keep this fix focused:
- D2/D3: CHECK constraints on status columns (low risk, text works)
- P1/P2: Remove payment method + guard (stub exists)
- P3/P4: Receipt payment method display + retry timing
- P5/P6: Provider payout date display + RESTRICTED handling
- P7-P9: Earnings property label, eligible date, payout detail route
- P10: Admin stats for credits/disputes
- P13-P15: Exception queue action CTAs
- A5: Add-on billing flow
- E5: Dispute handler entity linking
- E6: Webhook signature enforcement (deployment config concern)

---

## Summary of All Changes

| File | Change |
|------|--------|
| New migration SQL | S1: `run_payout_batch` uses `IN_PAYOUT` instead of `PAID` |
| New migration SQL | S2+S4: `generate_subscription_invoice` parses price, caps credits |
| New migration SQL | A1+S3: `complete_job` and `admin_override_complete_job` call `create_provider_earning` |
| New migration SQL | D1: Create `provider_ledger_events` table + RLS |
| New migration SQL | D4: Add UNIQUE(customer_id, processor_ref) on payment methods |
| `supabase/functions/process-payout/index.ts` | E1: Two-step query instead of broken join |
| `supabase/functions/stripe-webhook/index.ts` | E2: Skip payment record if no matching invoice |
| `supabase/functions/stripe-webhook/index.ts` | E3: Match by processor_invoice_id |
| `supabase/functions/stripe-webhook/index.ts` | E4: Add `account.updated` handler |
| `supabase/functions/stripe-webhook/index.ts` | S1: `transfer.paid`/`failed` update earnings status |
| `src/pages/admin/CustomerLedger.tsx` | P11: Admin customer billing detail page |
| `src/pages/admin/ProviderLedger.tsx` | P12: Admin provider ledger detail page |
| `src/hooks/useAdminCustomerLedger.ts` | Hook for customer ledger data |
| `src/hooks/useAdminProviderLedger.ts` | Hook for provider ledger data |
| `src/App.tsx` | New routes for customer + provider ledger pages |
| `supabase/functions/run-billing-automation/index.ts` | A2-A4: Scheduled automation function |
| `supabase/config.toml` | Register new edge function |

