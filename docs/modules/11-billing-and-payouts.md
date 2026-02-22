# Module 11: Billing & Payouts

## Scope
Payment processing, receipts, provider payout calculations, tax exports.

## Tables
- `payments` — user_id, amount_cents, stripe_payment_id, status, created_at
- `provider_payouts` — org_id, amount_cents, period_start, period_end, status, paid_at
- `payout_line_items` — payout_id, job_id, amount_cents

## Key User Stories
- As a customer, I can view my payment history and receipts
- As a provider, I can see my earnings and payout schedule
- As an admin, I can process payouts and handle chargebacks

## Dependencies
- Module 05 (subscription engine)
- Module 09 (job execution)

## Acceptance Criteria
- [ ] Payment history with receipts
- [ ] Payout calculations correct
- [ ] Admin payout processing
- [ ] Tax form export for providers
