# PRD 75: Confusion Detector for Cadence Changes

> **Status:** NOT STARTED
> **Priority:** P2 Medium
> **Effort:** Small (1–2 days)

## What Exists Today

The routine builder includes a CadencePicker component -- a simple select dropdown that lets customers choose a cadence for each service: weekly, biweekly, or every 4 weeks (with optional monthly and quarterly for independent services). The component is entirely stateless: it fires an onChange callback and renders the current value. There is no tracking of how many times a customer changes a cadence selection, no history of previous values, and no contextual help triggered by user behavior.

The RoutineItemCard renders one CadencePicker per service in the routine. A customer can freely toggle cadences as many times as they want with zero friction or guidance, even if they are visibly going back and forth between the same two options.

## What's Missing

1. **Change-count tracking** -- A lightweight mechanism to count how many times a customer changes the cadence for a specific service within a single routine-building session.

2. **Confusion threshold detection** -- Logic to detect when a customer has changed a service's cadence 3 or more times, signaling they are likely confused about what the options mean or which is right for their situation.

3. **Contextual help intervention** -- An inline help experience that activates when the confusion threshold is reached, explaining what each cadence means in practical terms and offering a recommendation.

4. **Analytics event** -- An event emitted when confusion is detected, enabling the team to track how often this happens and which services trigger the most confusion.

## Why This Matters

### For the Business
- **Reduced churn risk:** Confused customers are more likely to pick the wrong cadence, receive service at a frequency that does not match their expectations, and cancel. Catching confusion early and guiding the customer to the right choice prevents this downstream dissatisfaction.
- **Lower support volume:** Cadence misunderstandings are a common support ticket category ("I thought biweekly meant twice a week" or "I didn't realize every 4 weeks meant once a month"). Proactive in-app guidance deflects these tickets.
- **Higher conversion in the routine builder:** If a customer is confused and gives up on the routine builder entirely, that is a lost subscription. A timely nudge keeps them moving forward with confidence.
- **Product intelligence:** Tracking which services cause the most cadence confusion reveals where the product's information architecture is weakest, guiding future UX improvements.

### For the User
- **Clarity without condescension:** The help appears only when the customer's behavior signals genuine confusion, not preemptively. This respects the customer's autonomy while offering a safety net.
- **Practical understanding:** Many customers do not intuitively know the difference between "biweekly" and "every 2 weeks" (they can mean different things in everyday language). Concrete examples ("Your lawn gets mowed on the 1st and 15th") make the choice obvious.
- **Confidence to commit:** After seeing the explanation and a recommendation, the customer can select their cadence with conviction rather than anxiety.

## User Flow

1. Customer is building their routine and selects a cadence for a service (e.g., lawn mowing set to "weekly").
2. Customer changes the cadence to "biweekly." The system internally increments the change count for this service to 1.
3. Customer changes the cadence back to "weekly." Change count goes to 2.
4. Customer changes the cadence again to "every 4 weeks." Change count hits 3 -- the confusion threshold.
5. A gentle help card animates into view directly below the CadencePicker for that specific service. The card includes:
   - A friendly heading: "Not sure which frequency is right?"
   - A brief explanation of each cadence option with real-world examples tailored to the service category
   - A system recommendation based on what most customers choose for this service type
   - A "Got it" button to dismiss the card
6. The customer reads the guidance, selects their preferred cadence, and taps "Got it" to dismiss the help card.
7. The help card does not reappear for this service during the current session, even if the customer makes additional changes.
8. A "cadence_confusion_detected" analytics event is emitted with the service type, the sequence of cadences the customer toggled through, and whether they ultimately selected the recommended option.

## UI/UX Design Recommendations

- **Inline card, not a modal:** The help should appear as an expandable card that slides in below the CadencePicker, pushing content down gently. Modals interrupt flow and feel punitive. An inline card feels like the app is being helpful, not blocking progress.
- **Warm, conversational tone:** Use language like "Picking the right frequency can be tricky -- here's a quick guide" rather than "You seem confused." The intervention should feel like a knowledgeable friend, not a system warning.
- **Visual cadence comparison:** Show a mini calendar strip (4 weeks) for each cadence option, with highlighted dots on the weeks the service would occur. This makes the difference between weekly (4 dots), biweekly (2 dots), and every 4 weeks (1 dot) immediately visual and intuitive.
- **Service-specific examples:** Tailor the explanation to the service category. For lawn care: "Weekly keeps your lawn pristine. Biweekly works great for slower-growing seasons. Every 4 weeks is best for minimal-maintenance yards." For cleaning: "Weekly is ideal for busy households. Biweekly keeps things fresh without the weekly commitment."
- **Subtle recommendation badge:** Below the comparison, show "Most customers choose [biweekly] for [lawn mowing]" with a small thumbs-up icon. This uses social proof to guide without dictating.
- **Smooth animation:** The card should animate in with a gentle slide-and-fade (200ms ease-out) to feel natural. Avoid jarring pop-ins.
- **Dismissal behavior:** After the customer taps "Got it," the card collapses with the reverse animation. A small "Need help choosing?" link remains below the CadencePicker as a re-entry point in case the customer wants to see the guidance again.
- **No visual clutter for decisive customers:** Customers who select a cadence and move on should never see this feature. It activates only on the 3rd change, which is a strong signal of genuine indecision.

## Acceptance Criteria

- The system tracks cadence change count per service per session within the routine builder
- When a customer changes a single service's cadence 3 or more times, a contextual help card appears below that service's CadencePicker
- The help card displays a plain-language explanation of each cadence option with service-appropriate examples
- The help card includes a recommendation based on common customer choices for that service type
- The help card includes a visual cadence comparison (e.g., dots on a 4-week strip)
- The customer can dismiss the help card with a "Got it" button
- Once dismissed, the help card does not reappear for that service during the current session
- A "Need help choosing?" text link remains after dismissal for optional re-access
- A "cadence_confusion_detected" analytics event fires when the threshold is reached, including service type and cadence change sequence
- The confusion detector does not interfere with normal cadence selection (customers making 1–2 changes see no intervention)
- The change count resets if the customer leaves and returns to the routine builder in a new session
