# PRD 51: No-Rollover Policy (Service Week Expiry)

> **Status:** PLACEHOLDER
> **Priority:** P0 Critical
> **Effort:** Medium (3-5 days)

## What Exists Today

The Handles currency system is built and operational. Customers receive handles each billing cycle based on their plan tier. The ledger tracks all handle transactions with amounts, balances, transaction types, and reference links. Each transaction record has an `expires_at` field. The plan configuration includes `rollover_cap` and `rollover_expiry_days` settings per plan, indicating the system was designed with expiry in mind.

The subscription engine runs on a dual-clock model: a 28-day billing cycle for payments and a weekly operational rhythm for service delivery. The spec explicitly states that unused service weeks expire at billing cycle end with no carry-over between cycles. The `service_weeks_consumed_in_current_cycle` counter exists on subscriptions to track usage.

Handle transactions are created when handles are granted (cycle grants), spent (service bookings), and refunded. The `get_handle_balance` RPC computes the current balance. The customer dashboard shows current handle balance and recent transaction history.

## What's Missing

1. **Expiry enforcement job:** No automated process runs at billing cycle boundaries to expire unused handles. The `expires_at` field is populated on grant transactions but nothing reads it to zero out expired handles. Handles granted in a billing cycle that are not spent simply persist in the balance indefinitely.

2. **Expiry transaction creation:** When handles expire, a negative "expiry" transaction should be written to the ledger to reduce the balance. No such transaction type or creation logic exists today.

3. **Customer-facing expiry visibility:** Customers see their handle balance but have no indication of when handles expire. There is no "Use by [date]" messaging, no countdown, no urgency indicator. This means customers are surprised when (eventually, once enforcement is built) their handles disappear.

4. **Expiry warning notifications:** There are no proactive notifications before handles expire. Customers with unspent handles should receive a nudge: "You have 4 handles expiring in 3 days. Book a service to use them."

5. **Admin visibility into expiring handles:** The admin console shows handle balances and transactions but has no view of "handles about to expire across all customers" or "total handle liability." Ops cannot see how many handles will be forfeited at the next cycle boundary.

6. **Rollover cap enforcement:** The `rollover_cap` field exists on plan configuration but is not enforced. If a plan allows rolling over 2 handles to the next cycle, that logic does not run. All handles either persist forever (current behavior) or would all expire (once enforcement is built) without respecting the cap.

## Why This Matters

### For the Business
- **Business model integrity:** The no-rollover policy is fundamental to the Handled Home business model. Handles are designed to create urgency and predictable service demand within each billing cycle. Without enforcement, customers accumulate handles indefinitely, creating a growing liability on the books and unpredictable demand spikes when they eventually spend large balances.
- **Capacity planning reliability:** If every customer has a predictable handle budget per cycle that must be used or lost, ops can forecast demand with high accuracy. Without expiry, some customers sit on 50+ handles and suddenly book 10 services in one week, overwhelming provider capacity.
- **Revenue integrity:** Handles that never expire are effectively unlimited credit. The pricing model assumes a certain percentage of handles will go unused (breakage). Without enforcement, there is no breakage, and the economics of the plan tiers do not hold.
- **Plan tier differentiation:** Higher tiers offer more handles per cycle. If lower-tier customers can hoard handles over months to match higher-tier entitlements, the upgrade incentive disappears.

### For the User
- **Clear expectations:** Customers should understand from day one that handles are a "use it or lose it" benefit. This clarity prevents frustration later and encourages regular engagement with the service, which is better for the customer's home.
- **Motivation to use the service:** The expiry countdown is a gentle nudge to book services. Customers who regularly use their handles get more value from their subscription, leading to higher satisfaction and lower churn.
- **Fair and transparent:** When customers understand the rules upfront, expiry feels fair rather than punitive. Transparency about when handles expire and how many will roll over (if the plan allows partial rollover) builds trust.

## User Flow

### Customer: Understanding and Responding to Expiry

1. Customer opens their dashboard and sees their handle balance displayed prominently: "8 handles available."
2. Below the balance, a subtle line reads: "Cycle resets in 6 days" -- a persistent but non-alarming indicator of the billing cycle boundary.
3. When the cycle reset is 5 or fewer days away and the customer has unspent handles, the messaging becomes more prominent: "You have 4 unused handles expiring March 8. Book a service to use them."
4. Customer taps the expiry message and is taken to a quick-book flow showing services that fit within their remaining handles, sorted by "most popular" and "recommended for your home."
5. If the customer does not act, handles expire at the billing cycle boundary. The next time they open the app, their balance reflects the new cycle's grant minus any forfeited handles. A transaction history entry shows "4 handles expired" with the date.
6. If the customer's plan allows partial rollover (e.g., rollover_cap = 2), the expiry logic carries over up to 2 handles and expires the rest. The dashboard shows: "2 handles rolled over + 12 new = 14 available."

### Customer: Proactive Notifications

1. Three days before the billing cycle ends, customers with 3+ unspent handles receive a push notification: "Your 6 handles reset in 3 days. Book a service so they don't go to waste."
2. Tapping the notification opens the app to the quick-book flow.
3. One day before the billing cycle ends, a final reminder is sent: "Last chance -- 6 handles expire tomorrow."
4. Notifications respect the customer's notification preferences and can be muted.

### Admin: Monitoring Expiry Across the Platform

1. Admin opens the admin dashboard and sees a "Handle Health" widget showing: total handles outstanding across all customers, handles expiring in the next 7 days, average utilization rate per plan tier.
2. Admin can drill into a list of customers with high unspent handle balances, sorted by "handles about to expire."
3. This view helps ops identify customers who may need outreach (likely to churn due to low engagement) or zones with capacity headroom that could absorb more bookings.

## UI/UX Design Recommendations

- **Cycle countdown on dashboard:** Display a circular or linear progress indicator showing where the customer is in their current billing cycle. Use a calm neutral color when plenty of time remains. Shift to amber in the last 7 days. Shift to a warm red in the last 2 days. This creates urgency without anxiety.
- **Handle balance card redesign:** Enhance the existing balance display with two rows: "Available now: 8 handles" and "Expiring [date]: 4 handles." The expiring row appears only when relevant (last 7 days of cycle with unspent handles). Use an hourglass or clock icon next to the expiring count.
- **Quick-book shortcut:** When handles are about to expire, add a "Use My Handles" floating action button or banner on the dashboard that links directly to service booking. This shortcut removes friction between "I should book" and actually booking.
- **Transaction history clarity:** In the handle transaction list, expiry entries should use a distinct visual treatment -- a dimmed/grayed row with an hourglass icon and text like "4 handles expired (billing cycle reset)." Rollover entries should be green: "2 handles rolled over."
- **Onboarding education:** During the onboarding wizard (plan selection step), include a brief note in the plan card: "Your handles refresh every 4 weeks. Unused handles do not carry over." Keep this factual and brief -- it should set expectations without creating anxiety about loss.
- **Settings transparency:** In the customer's subscription settings page, show the rollover policy for their plan: "Your plan: 12 handles per cycle. Rollover: up to 2 handles carry forward." This is reference information, not a warning.
- **Admin expiry dashboard:** Use a bar chart showing "handles granted vs. used vs. expired" per billing cycle, trended over time. This gives leadership visibility into utilization rates and whether the handle economy is healthy.

## Acceptance Criteria

- An automated process runs at each billing cycle boundary and expires handles that have passed their `expires_at` date
- Expired handles generate a negative "expiry" transaction in the ledger that reduces the customer's balance
- If a plan's rollover_cap is greater than zero, up to rollover_cap handles carry over to the next cycle; the remainder expires
- Rolled-over handles receive a new `expires_at` set to the end of the next billing cycle
- The customer dashboard shows a "Cycle resets in X days" indicator that becomes more prominent when handles are about to expire
- Customers with unspent handles receive a push notification 3 days and 1 day before their billing cycle ends
- Tapping the expiry notification opens a quick-book flow showing bookable services within remaining handles
- The handle transaction history shows expiry entries with clear labeling and visual differentiation
- The admin dashboard includes a "Handle Health" widget showing total outstanding handles, handles expiring soon, and utilization rates
- Plan configuration rollover_cap and rollover_expiry_days settings are respected by the enforcement logic
- Handle balance returned by the balance RPC reflects expired handles (expired handles are not counted in available balance)
- The expiry process is idempotent -- running it multiple times for the same cycle boundary does not create duplicate expiry transactions
