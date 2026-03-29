# PRD 48: Soft Onboarding (Browse Before Paying)

> **Status:** PARTIALLY COMPLETE
> **Priority:** P0 Critical
> **Effort:** Large (1-2 weeks)

## What Exists Today

The onboarding wizard is built and functional with an 8-step flow: Property > Zone Check > Home Setup > Plan Selection > Subscribe > Service Day > Routine > Complete. The wizard has a polished UI with a progress bar, back navigation, step labels, and per-step completion tracking stored in a dedicated onboarding progress record per user.

Key pieces that support soft onboarding are already in place:

- **Plan browsing before checkout:** The Plan Selection step shows all available plans with pricing, handles-per-cycle info, tier highlights, and zone availability checks. Customers can see what they are getting before subscribing.
- **Draft routine infrastructure:** A draft routine system exists via the `customer_plan_selections` mechanism. Customers can save a draft routine (list of SKU selections with quantities) linked to a selected plan, property, and zone. The draft persists across sessions.
- **Handles explainer:** The HandlesExplainer component educates customers about the handles currency model during plan selection.
- **Zone coverage check:** The onboarding flow checks if the customer's ZIP is in an active zone and offers a waitlist if not.
- **Home Setup step:** Customers can specify their current service coverage (who handles what today) and property sizing (sq ft, yard size, windows, stories) to power personalized recommendations.

However, the current flow requires payment (Subscribe step) before reaching the Service Day and Routine steps. Customers cannot build or preview their routine until after they have entered payment information and activated a subscription.

## What's Missing

1. **Routine preview before payment:** The Routine step currently sits after the Subscribe step. Customers should be able to build a draft routine as part of the "explore value" phase, seeing exactly what their first service week would look like before they commit to paying. The draft routine builder should be moved (or duplicated) to appear before the Subscribe step.

2. **"Your First Week" preview:** After a customer selects a plan and builds a draft routine, there is no summary view showing "Here's what your first week looks like" -- a concrete visualization of services, estimated times, and handles usage. This is the "aha moment" that drives conversion.

3. **Service exploration in plan context:** When browsing plans, customers cannot see which specific services are included, which cost extra handles, and which are blocked at their tier. The plan cards show highlights (e.g., "Weekly mow + edge trim") but not the full service entitlement matrix in a browsable way.

4. **Routine builder inline in onboarding:** The RoutineStep in the wizard is currently a stub -- it shows a message about building a routine and a "Continue" button but does not embed the actual routine builder. The real routine builder lives at `/customer/routine` but is not integrated into the onboarding flow.

5. **Conversion nudge at checkout:** The Subscribe step shows the plan name, tagline, and price but does not reference the routine the customer just built. There is no "You selected 4 services worth 12 handles -- subscribe to start" framing that connects the value preview to the payment ask.

6. **Save and return:** If a customer builds a draft routine but abandons before subscribing, there is no re-engagement flow. The draft is saved in the database but there is no "Welcome back -- your routine is waiting" experience when they return.

## Why This Matters

### For the Business
- **Higher conversion rates:** Subscription businesses that let customers explore value before payment see 20-40% higher conversion rates. Showing a concrete "first week" preview transforms the value proposition from abstract ("handles per cycle") to tangible ("mow, edge, blow, pool skim -- all handled this Tuesday").
- **Reduced churn from mismatched expectations:** When customers subscribe without understanding what they are getting, early churn is high. A draft routine ensures customers know exactly what to expect, leading to longer retention.
- **Lower acquisition cost:** Every percentage point of conversion improvement reduces effective cost per acquisition. If the onboarding funnel converts 15% today, moving to 20% is a 33% reduction in CAC.
- **Abandoned cart recovery:** Draft routines create a re-engagement opportunity. "Your routine is ready -- subscribe to activate it" is a highly personalized winback message that outperforms generic marketing.

### For the User
- **Confidence before commitment:** Entering a credit card is the highest-friction moment in any subscription funnel. Letting customers see exactly what they are buying -- not just a plan name and price, but a concrete list of services on a specific day -- gives them the confidence to commit.
- **Personalization preview:** After completing the Home Setup step (coverage map + property sizing), the routine builder can pre-populate suggested services based on their home profile. The customer feels "this is tailored for me" rather than "this is a generic plan."
- **No pressure exploration:** Customers who are not ready to pay can still engage deeply with the product. They leave with a mental model of the service ("I know what I would get") that makes returning and converting much more likely than a customer who bounced at a paywall.

## User Flow

### New Customer: Full Soft Onboarding

1. Customer begins onboarding and completes Property, Zone Check, and Home Setup steps as they work today.
2. On the **Plan Selection** step, customer selects a plan. Each plan card now shows a "See What's Included" expandable section listing all services available at that tier with handles cost per service.
3. After selecting a plan, the customer advances to a new **Build Your Routine** step (moved before Subscribe).
4. The routine builder appears inline, showing all services available on the selected plan. Services are grouped by category with visual indicators: "Included" (green badge, no extra cost), "Add-on" (amber badge, costs X extra handles), or "Not Available" (grayed out with upgrade prompt).
5. Customer taps services to add them. A running total shows: "8 of 12 handles used" with a visual progress ring. If they exceed their plan's handles, a gentle nudge appears: "You've built a great routine! Consider upgrading to the Plus plan for more handles."
6. Customer taps "Preview My First Week." A summary screen shows their selected services arranged on their service day (e.g., "Tuesday"), with estimated duration, handles cost, and a visual timeline of what the provider will do.
7. Customer taps "Looks Good -- Let's Subscribe" to advance to the Subscribe step.
8. The Subscribe step now shows a condensed version of their routine alongside the plan price: "Your Essential Plan -- $X/4 weeks -- 4 services, 8 handles." This connects the value they just configured to the price they are about to pay.
9. Customer completes Stripe checkout. After payment confirmation, they advance to Service Day and Complete steps.
10. Their draft routine is automatically converted to an active routine upon subscription activation.

### Returning Customer: Abandoned Draft Recovery

1. Customer who previously built a draft routine but did not subscribe returns to the app (via email link, organic return, or push notification).
2. They are taken to the onboarding wizard, which detects their saved progress and draft routine.
3. A "Welcome Back" screen shows: "Your routine is ready. You selected [X services]. Subscribe to get started."
4. Customer taps "Review My Routine" to see and optionally modify their draft, or "Subscribe Now" to go directly to checkout.

## UI/UX Design Recommendations

- **Routine builder in onboarding:** Reuse the existing routine builder component but embed it in a simplified view optimized for first-time users. Remove advanced features (reorder, frequency customization) and focus on "tap to add" simplicity. Show a maximum of 6-8 services initially with a "Show All" expander.
- **Handles budget ring:** Display a circular progress indicator showing handles used vs. available (e.g., "8/12 handles"). Use green when under budget, amber at 80%+, and red when over. This gamification element makes budget management intuitive and even fun.
- **"First Week" preview card:** Design a single tall card that looks like a mini day-planner. Show the service day name, each service stacked vertically with its icon, estimated time, and handles cost. End with a total: "Total: 3h 15m estimated, 8 handles." This makes the abstract concrete.
- **Plan comparison during routine building:** If the customer exceeds their plan's handles, show a non-intrusive inline comparison: "Your routine needs 16 handles. Essential gives you 12. Plus gives you 20." with a "Switch to Plus" button. Make the upsell feel helpful, not pushy.
- **Subscribe step enhancement:** Split the Subscribe step into two sections. Left/top: a condensed "Your Routine" summary showing 3-4 service icons with names. Right/bottom: the plan price and "Subscribe Now" button. This visual pairing reinforces value at the moment of truth.
- **Save and exit affordance:** Add a clear "Save & Finish Later" button on the routine builder step. When tapped, show a confirmation: "Your routine is saved. We'll send you a reminder." Collect notification preference (email/push) for the re-engagement flow.
- **Progress persistence indicator:** Throughout the wizard, show a subtle "Your progress is saved" label near the progress bar. This reduces anxiety about losing work if the customer navigates away.

## Acceptance Criteria

- The routine builder step appears in the onboarding wizard before the Subscribe step
- Customers can browse all services available on their selected plan and add them to a draft routine without subscribing
- Each service in the routine builder shows its handles cost and whether it is included, an add-on, or unavailable at the selected tier
- A handles budget indicator shows how many handles are used vs. available on the selected plan
- If the customer's draft routine exceeds the plan's handles, a non-blocking upgrade suggestion appears
- A "Preview My First Week" summary shows all selected services arranged on the customer's service day with duration estimates and total handles usage
- The Subscribe step displays a condensed version of the customer's draft routine alongside the plan price
- Draft routines persist across sessions -- a customer who leaves and returns sees their saved routine
- Upon subscription activation, the draft routine automatically converts to an active routine
- Returning customers with saved draft routines see a "Welcome Back" experience that surfaces their draft
- The onboarding progress tracker correctly reflects the new step order
- Customers who do not build a routine can skip the step and proceed to subscribe without a draft
