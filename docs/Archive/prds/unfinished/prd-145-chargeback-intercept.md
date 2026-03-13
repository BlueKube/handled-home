# PRD 145: Chargeback Intercept System

> **Status:** PLACEHOLDER
> **Priority:** P0 Critical
> **Effort:** Large (1–2 weeks)

## What Exists Today
The support system can classify tickets with AI (including a risk score 0-100 from the `support-ai-classify` function), auto-resolve low-risk issues with credits up to $50, and allow admins to present resolution offers (credit, redo, refund, plan change, add-on). The Support Dashboard has a "Chargeback risk" queue filter for triaging tickets. Admins can view repeat claimers (customers with 3+ tickets in 30 days) in the OpsSupport health page. The AI classification system flags `is_repeat_offender` and tracks risk scores per ticket. Resolution offers can be accepted by customers through the ticket detail page.

However, there is no proactive chargeback prevention. The system is reactive: it waits for customers to file issues and then resolves them. There is no scoring of which unresolved issues are likely to escalate to chargebacks, no automated outreach to at-risk customers, no pre-escalation offer logic, and no tracking of actual chargeback outcomes to feed back into risk models.

## What's Missing
- **Chargeback risk scoring model.** A composite risk score that evaluates unresolved tickets based on multiple signals: issue severity, time since submission without resolution, number of failed contact attempts, customer history (prior chargebacks, dispute frequency), dollar amount at stake, and whether the customer has engaged with offered resolutions.
- **At-risk ticket identification and queue.** An automated process that periodically evaluates open tickets and flags those with high chargeback probability, surfacing them in a dedicated "Intercept Queue" for immediate attention.
- **Proactive outreach automation.** When a ticket crosses a risk threshold, the system should automatically send the customer a proactive message with a generous resolution offer -- before the customer decides to dispute with their bank.
- **Pre-escalation offer engine.** Logic to generate appropriate intercept offers that are more generous than standard resolution (since the cost of a chargeback exceeds the cost of a generous credit). The offer amount should factor in the chargeback cost (processor fee + lost revenue) to determine the maximum economically rational offer.
- **Chargeback outcome tracking.** When a chargeback does occur, the system should link it to the originating ticket (if any) to track intercept success/failure rates and improve the risk model over time.
- **Chargeback rate monitoring dashboard.** A view for ops to monitor overall chargeback rate, intercept success rate, and cost savings from prevented chargebacks.

## Why This Matters
### For the Business
Chargebacks cost 3-5x more than direct resolution. A single chargeback incurs $15-25 in processor fees, the full refunded amount, and damage to the company's chargeback ratio. Payment processors suspend merchant accounts when chargeback rates exceed ~1% of transactions. A proactive $50 credit that prevents a chargeback is dramatically cheaper than the $75-125 total cost of a chargeback (fee + refund + operational cost + processor relationship damage). At scale, even preventing 10 chargebacks per month could save $750-1,250 in direct costs, plus protecting the payment processing relationship that the entire business depends on. This is pure margin protection and existential risk mitigation.

### For the User
Customers who file chargebacks are often frustrated customers who felt the platform didn't resolve their issue. A proactive, generous outreach demonstrates that the company cares and is willing to make things right. This recovers relationships that would otherwise be permanently lost. Many chargeback-filing customers don't actually want a bank dispute -- they want their problem solved. Proactive intercept gives them that solution before they reach for the nuclear option.

## User Flow
### Automated Risk Scoring
1. A background process runs periodically (e.g., every hour or triggered by ticket state changes) and evaluates all open and recently-resolved tickets.
2. For each ticket, the system calculates a chargeback risk score based on weighted signals: HIGH severity issue (+30), unresolved for more than 48 hours (+20), customer has prior chargebacks (+25), customer has 3+ tickets in 30 days (+15), no response to offered resolution for 24+ hours (+15), dollar amount above $75 (+10).
3. Tickets crossing the intercept threshold (e.g., risk score >= 60) are flagged and added to the Intercept Queue.

### Proactive Intercept Flow
4. When a ticket enters the Intercept Queue, the system automatically generates a pre-escalation offer. The offer amount is calculated based on the potential chargeback cost: typically 1.5-2x the standard resolution offer, capped at the estimated chargeback cost (processor fee + original charge amount).
5. The customer receives an in-app notification and email with a tone of "We noticed your recent issue hasn't been fully resolved. We want to make this right." The message presents the generous resolution offer.
6. The customer can accept the offer with one tap, which resolves the ticket and applies the credit/refund immediately.
7. If the customer does not respond within 24 hours, the system sends a follow-up with an even more prominent notification.
8. If the customer still doesn't respond within 48 hours, the ticket is escalated to a human admin for personal outreach.

### Admin Intercept Queue
9. Admin navigates to a new "Intercept Queue" view (accessible from the Support Dashboard or Ops dashboard).
10. The queue shows at-risk tickets sorted by chargeback probability, with key signals displayed: risk score, days open, customer history flag, offer status.
11. Admin can see the auto-generated intercept offer and either approve it, adjust it, or craft a custom response.
12. Admin can also call the customer directly and record the outcome in the ticket.

### Outcome Tracking
13. When a chargeback occurs (via Stripe webhook), the system attempts to match it to an existing ticket by customer and charge amount.
14. If matched, the ticket is updated with "chargeback filed" status, and the intercept is marked as failed.
15. A Chargeback Metrics dashboard shows: total chargebacks (30d), intercept attempts, intercept success rate, estimated savings from prevented chargebacks, and current chargeback rate as a percentage of transactions.

## UI/UX Design Recommendations
- **Intercept Queue — urgency-focused design.** The intercept queue should feel different from the regular support queue. Use a warm amber/orange color scheme to convey urgency without alarm. Each ticket card should show a prominent risk score badge, key risk signals as compact tags (e.g., "48h unresolved", "Prior chargeback", "High severity"), and the auto-generated offer amount.
- **Risk score visualization.** Display the chargeback risk score as a small gauge or colored bar (green 0-30, yellow 30-60, red 60-100). On the ticket card, show the top contributing risk signals as labeled chips so the admin immediately understands why this ticket is high risk.
- **One-tap intercept action.** The admin should be able to approve and send the auto-generated intercept offer with a single tap. A large, prominent "Send Intercept Offer" button on each card. More complex actions (adjust amount, custom message) available via expansion.
- **Customer intercept notification.** The customer-facing notification should be warm and apologetic in tone, not transactional. Design it as a prominent in-app card (not just a banner) with the offer front and center, a clear "Accept" button, and a secondary "Talk to someone" option for customers who want human contact.
- **Chargeback metrics dashboard.** A clean, executive-summary-style dashboard. Key metrics in stat cards across the top: Chargeback Rate (with red/green indicator relative to 1% threshold), Intercepts Sent (30d), Intercept Success Rate, Estimated Savings. Below, a chart showing chargebacks over time with the intercept program launch date annotated, so the team can see the program's impact.
- **Chargeback-to-ticket linking.** When a chargeback arrives via webhook, if it matches an existing ticket, show a prominent red "Chargeback Filed" badge on the ticket detail. If no ticket exists, auto-create a high-priority ticket linked to the charge.
- **Cost calculator insight.** On the metrics dashboard, include a "Cost Comparison" card: "Avg chargeback cost: $X. Avg intercept offer: $Y. Net savings per prevented chargeback: $Z." This makes the ROI immediately tangible for ops leadership.

## Acceptance Criteria
- Background process calculates chargeback risk scores for open and recently-resolved tickets using weighted signal factors
- Tickets crossing the risk threshold are automatically flagged and added to the Intercept Queue
- System auto-generates pre-escalation offers with amounts calibrated to chargeback cost economics
- Customers receive proactive in-app and email notifications with intercept offers
- Customers can accept intercept offers with a single tap
- Follow-up notifications send at 24 and 48 hours if no response
- Unresponded intercept tickets escalate to human admin after 48 hours
- Admin Intercept Queue shows at-risk tickets sorted by risk score with key signal indicators
- Admins can approve, adjust, or customize intercept offers
- Stripe webhook chargebacks are matched to existing tickets when possible
- Chargeback-matched tickets display a "Chargeback Filed" status badge
- Chargeback metrics dashboard shows rate, intercept success rate, and estimated savings
- Chargeback rate is tracked relative to the 1% processor threshold with visual warning
- All intercept actions are logged in the ticket event timeline for audit
