# PRD 74: Bounded Swap Pattern for Biweekly Items

> **Status:** PLACEHOLDER
> **Priority:** P1 High
> **Effort:** Medium (3–5 days)

## What Exists Today

The routine builder includes a BiweeklyPatternToggle component that allows customers to switch between Pattern A (weeks 1 & 3) and Pattern B (weeks 2 & 4) for any service set to biweekly cadence. The toggle appears inline on the RoutineItemCard whenever the cadence is set to "biweekly." A star icon marks the recommended pattern.

A client-side biweekly optimizer hook already exists that queries all active biweekly routine items within the customer's zone, counts how many are on Pattern A versus Pattern B, and recommends whichever pattern has fewer stops. This recommendation is passed through to the toggle as a visual indicator.

Currently, tapping the swap button or selecting the alternate pattern fires the change immediately with no validation. The system does not check whether the target pattern can absorb the additional load, does not consider zone-level capacity constraints, and does not verify entitlement limits.

## What's Missing

1. **Feasibility check before swap** -- Before allowing a pattern change, the system needs to verify that the target pattern week(s) have capacity to absorb the additional stop without exceeding zone limits (max homes per day, max minutes per day, buffer percentage).

2. **Entitlement validation** -- If a customer's subscription plan caps the number of biweekly services or total weekly-equivalent visits, the swap should confirm that the new pattern does not cause an entitlement violation on any individual week.

3. **User-facing feedback on denial** -- When a swap is blocked, the customer needs a clear, non-technical explanation of why and what their alternatives are.

4. **Confirmation step for valid swaps** -- Even when a swap is feasible, the customer should see what is changing (which weeks their service will now land on) and confirm before it takes effect.

5. **Admin override capability** -- Ops admins should be able to force a swap even when the feasibility check would block it, with a logged reason.

## Why This Matters

### For the Business
- **Capacity protection:** Unvalidated swaps can silently overload a zone's schedule on certain weeks. If enough customers in a zone swap to the same pattern, providers get double-booked on weeks 1 & 3 while weeks 2 & 4 sit empty. This creates operational chaos that is expensive to untangle.
- **Optimizer integrity:** The biweekly optimizer recommends patterns based on current load balance. If customers can ignore the recommendation with no guardrails, the optimizer's value is undermined and zone health degrades over time.
- **Predictable scheduling:** Provider route density depends on evenly distributed stops across all weeks. Imbalanced patterns lead to inefficient routes, longer drive times, and higher labor costs.

### For the User
- **Service reliability:** When zones are overloaded on certain weeks, visits get delayed, shortened, or rescheduled. Preventing overload protects the customer's own service quality.
- **Informed choices:** Customers deserve to understand what Pattern A vs. Pattern B actually means for their schedule, not just an abstract "Wk 1 & 3" label.
- **Confidence:** A confirmation step with a clear preview of upcoming visit dates builds trust that the system is managing their home care thoughtfully.

## User Flow

1. Customer opens the routine builder and sees a service set to biweekly cadence.
2. The BiweeklyPatternToggle displays the current pattern (e.g., "Wk 1 & 3") with the recommended pattern marked by a star.
3. Customer taps the swap button or selects the alternate pattern.
4. The system runs a feasibility check in the background (brief loading indicator on the toggle).
5. **If the swap is feasible:** A confirmation sheet slides up showing:
   - The current pattern and the new pattern
   - The next 4 upcoming visit dates under the new pattern
   - A note if this differs from the recommended pattern ("This works, but Pattern A is recommended for the best balance in your area")
   - A "Confirm Swap" button
6. Customer confirms, the pattern updates, and a success toast appears: "Pattern updated -- your next visit is [date]."
7. **If the swap is not feasible:** An inline message replaces the toggle temporarily, explaining: "Your area is fully booked on weeks 2 & 4 right now. We recommend staying on your current pattern for the best service." The message includes a "Got it" dismissal and an optional "Notify me when available" action.
8. If the customer taps "Notify me when available," they are added to a waitlist for the desired pattern. When capacity opens up, they receive a notification with a one-tap swap option.

### Admin Override Flow

1. Admin opens a customer's routine in the admin panel.
2. Admin sees the same pattern toggle but with an additional "Force Swap" option.
3. Tapping "Force Swap" shows a modal requiring a reason (dropdown: capacity exception, customer request, scheduling conflict, other).
4. Admin confirms, the swap is applied regardless of capacity, and the override is logged in the audit trail.

## UI/UX Design Recommendations

- **Enhanced toggle with context:** Below the A/B toggle buttons, add a subtle line of text showing what the pattern means in real dates: "Next visits: Mar 7, Mar 21, Apr 4" -- making the abstract pattern concrete.
- **Loading state on the toggle:** When the feasibility check runs, replace the swap arrow icon with a small spinner. Keep the toggle non-interactive until the check completes (typically under 1 second).
- **Confirmation sheet:** Use a bottom sheet (consistent with other confirmation flows in the app) with a calendar-style mini preview showing the next 4 visit dates highlighted. Use green highlights for the new pattern dates.
- **Denial state:** Instead of a disruptive modal, show an inline warning card below the toggle with an amber border and a clear explanation. This keeps the customer in context and avoids the feeling of hitting a wall.
- **Recommended badge upgrade:** Replace the small star icon with a more prominent "Recommended" pill badge below the recommended pattern button, with a tooltip or tap-to-learn explaining why it is recommended ("Fewer homes in your zone are on this schedule, so you get more consistent service").
- **Waitlist confirmation:** If the customer opts into the waitlist, show a small "Watching" badge on the toggle so they know the request is tracked.

## Acceptance Criteria

- Tapping the swap button triggers a feasibility check before any pattern change is applied
- The feasibility check validates zone capacity for the target pattern's weeks (homes per day and minutes per day do not exceed limits minus buffer)
- A feasible swap shows a confirmation sheet with the next 4 upcoming visit dates under the new pattern before applying
- An infeasible swap shows an inline explanation with a "Notify me when available" option
- The customer can dismiss the denial message without any pattern change
- Customers who opt into the waitlist receive a notification when capacity opens on their desired pattern
- Admin users can force a swap with a logged reason, bypassing feasibility checks
- The biweekly optimizer recommendation remains visible and accurate after any swap
- Pattern swaps are reflected immediately in the routine preview and upcoming schedule
- All pattern changes (customer-initiated and admin-forced) are recorded in the audit trail with timestamp, old pattern, new pattern, and feasibility check result
