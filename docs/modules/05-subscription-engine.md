# Module 05: Subscription Engine

## Scope
Plans, pricing, rollover logic, pause/cancel flows, Stripe integration.

## Tables
- `subscription_plans` — name, service_days_per_month, rollover_max, rollover_expiry_days, price_cents, status
- `customer_subscriptions` — user_id, plan_id, status, current_period_start, current_period_end, stripe_subscription_id, rollover_balance, paused_at, cancelled_at

## Key User Stories
- As a customer, I can subscribe to a plan
- As a customer, I can upgrade/downgrade/pause/cancel
- As the system, I enforce rollover caps and expiry
- As an admin, I can create/edit plans

## Dependencies
- Module 01 (auth & roles)
- Module 04 (SKU catalog — service pricing)

## Acceptance Criteria
- [ ] Stripe checkout creates subscription
- [ ] Rollover logic enforced per plan rules
- [ ] Pause/cancel flows work with save offer
- [ ] Admin can manage plans
