# PRD 248: Provider Probation Ladder SOP

> **Status:** PLACEHOLDER
> **Priority:** P1 High
> **Effort:** Medium (3–5 days)

## What Exists Today

The Quality Score system computes a rolling 28-day composite score for each provider per zone-category, combining customer ratings (35%), issue/redo rate (25%), photo compliance (20%), and on-time performance (20%). Scores map to four SLA bands: GREEN (85-100), YELLOW (70-84), ORANGE (55-69), RED (<55). The daily SLA enforcement edge function evaluates all active provider assignments and updates their levels. Providers receive notifications when their level changes (YELLOW = "Performance Notice", ORANGE = "Performance Warning", RED = "Critical Performance Alert").

A basic static SOP exists in the admin Playbooks page outlining a four-step ladder: verbal/written warning (score 50-70), formal probation (score <50), restricted service (no improvement after probation), and suspension (score <30 or severe incident). However, this SOP uses different thresholds than the actual SLA system (the SOP says <50 for probation, but the SLA system uses <55 for ORANGE and <55 as the RED boundary). The SOP is not connected to any system enforcement -- it is a text document that admins may or may not follow.

No structured probation period exists in the system. There is no "probation start date," no "improvement deadline," no "probation conditions" record, and no automated check that says "Provider X has been on probation for 30 days -- has their score improved?" There is no reinstatement path for suspended providers. And critically, providers have no visibility into where they stand on the ladder or what specifically they need to do to improve.

## What's Missing

1. **Formalized probation status tracking** -- A provider probation record that tracks: which provider, which zone-category, what triggered the probation, what the improvement targets are, when probation started, when it expires, and what the next step is if targets are not met. This is the core missing data structure.

2. **Aligned thresholds between SLA bands and the probation ladder** -- The SLA bands (GREEN/YELLOW/ORANGE/RED) should be the single source of truth that feeds into the probation ladder. YELLOW should trigger coaching, ORANGE should trigger formal probation with targets, and RED should trigger suspension candidacy. The current SOP and the actual system use different numbers.

3. **Automated probation lifecycle management** -- The system should automatically create probation records when a provider enters ORANGE, set improvement deadlines, check progress at the deadline, and escalate or de-escalate based on results. Admins should not need to manually track probation timelines.

4. **Improvement plan with specific, measurable targets** -- When a provider enters probation, they should see exactly what they need to achieve: "Improve on-time rate from 62% to 80% within 14 days." Vague messages like "your metrics need attention" are not actionable.

5. **Provider-facing probation dashboard** -- Providers on probation should see a dedicated view showing their current standing, their specific targets, their progress toward those targets, and their deadline. This is the "fair warning" that makes the system defensible.

6. **Reinstatement workflow** -- A clear path from suspended back to active: minimum cooling-off period, reinstatement application, admin review, gradual re-onboarding with limited assignment volume, and monitoring period.

7. **Admin probation management interface** -- A queue showing all providers currently on probation, their progress, upcoming deadlines, and recommended next actions. This replaces the current approach of admins trying to remember who is on probation and when to check back.

## Why This Matters

### For the Business
- A probation ladder is legally defensible documentation that the business gave providers fair warning, specific targets, and reasonable time to improve before taking adverse action. Without this paper trail, suspension decisions are vulnerable to challenge.
- The ladder creates a structured path from poor performance back to good standing. This is cheaper than replacing providers. Recruiting, vetting, and onboarding a new provider costs significantly more than coaching an existing one back to GREEN. The ladder makes rehabilitation the default path and suspension the last resort.
- Consistent enforcement across all admins eliminates favoritism concerns. When the system enforces timelines and thresholds, every provider gets the same treatment regardless of which admin is managing them.

### For the User
- Providers gain clarity and agency. "Your score is 62 (ORANGE)" means nothing without context. "You have 14 days to improve your on-time rate from 62% to 80%, or your assignments will be restricted" is clear, fair, and actionable. Providers who know the rules can choose to improve or choose to disengage, both of which are better outcomes than lingering in a gray zone.
- Customers benefit from a system that systematically improves provider quality over time. The probation ladder does not just remove bad providers -- it creates pressure for borderline providers to improve, raising the overall quality floor.
- Admins get a managed workflow instead of an open-ended judgment call. The system tells them "Provider X's probation expires in 3 days and their score improved from 58 to 72 -- recommend de-escalation" rather than expecting them to track timelines mentally.

## User Flow

### Automated Probation Entry (System)
1. During the daily SLA evaluation, a provider's quality band changes from YELLOW to ORANGE (or enters ORANGE directly from GREEN due to a sudden decline).
2. The system automatically creates a probation record: provider ID, zone-category, triggering metrics, target metrics, probation start date, and probation deadline (configurable, default 14 days for ORANGE).
3. Target metrics are calculated as the minimum values needed to return to YELLOW: e.g., "on-time rate must reach 80%" (the YELLOW threshold for each metric).
4. The provider receives a structured notification: "Your performance in [Zone] / [Category] has entered the Orange zone. You have 14 days to improve. Here are your targets: [list of specific metrics and their targets]. If you meet these targets, you'll return to good standing. If not, your assignments may be restricted."
5. The admin receives a notification: "[Provider] has entered probation for [Zone/Category]. Review deadline: [date]."

### Provider: Viewing Probation Status
6. Provider opens their Performance tab and sees a prominent "Probation" card replacing or overlaying their normal quality score display.
7. The card shows: current status ("On Probation"), the deadline ("7 days remaining"), and a list of improvement targets with progress bars.
8. Each target shows: metric name, current value, target value, and a visual indicator of whether they are trending in the right direction (up arrow in green) or wrong direction (down arrow in red).
9. Below the targets, a coaching section offers specific tips: "To improve your on-time rate, plan to arrive 10 minutes before your scheduled window." These tips are generated based on which metrics are failing.
10. The provider can see their weekly quality rollup alongside the probation view, showing how each week's performance contributed to their current score.

### Automated Progress Check (System)
11. At the probation deadline, the system re-evaluates the provider's metrics.
12. **If the provider improved to YELLOW or above:**
    - The probation record is closed with status "IMPROVED."
    - The provider receives a congratulatory notification: "Great work! You've improved your performance and your probation period has ended. Keep it up!"
    - The admin is notified of the successful outcome.
    - The provider enters a 30-day monitoring period. If they drop back to ORANGE during monitoring, the probation window is shorter (7 days instead of 14).
13. **If the provider remained in ORANGE (no improvement but not worse):**
    - The probation is extended for one additional period (configurable, default 14 more days).
    - The provider receives a notification: "Your probation has been extended. You still need to improve [specific metrics]. This is your final extension."
    - The admin is notified that an extension was granted.
    - Only one extension is allowed. If the provider fails the extension period, they escalate to the next tier.
14. **If the provider declined to RED:**
    - The probation escalates. The provider is flagged as a suspension candidate (connects to PRD 227 Auto-Suspend workflow).
    - The provider receives a notification: "Your performance has declined further. Your account is being reviewed for potential suspension."
    - The admin is notified of the escalation.

### Admin: Managing Probation Cases
15. Admin opens the "Provider Probation" queue, accessible from the admin sidebar or the ops dashboard.
16. The queue shows all active probation cases as cards, sorted by deadline (soonest first). Each card shows: provider name, zone-category, days remaining, current score vs. target, and a trend indicator.
17. Admin can filter by: expiring soon (next 3 days), extended probations, escalated cases, or all.
18. Tapping a card opens the full probation detail: timeline of score changes during probation, metric-by-metric progress, any notes from previous admin reviews, and the system's recommendation (extend, de-escalate, or escalate).
19. Admin can take manual actions:
    - **De-escalate early** (if provider shows dramatic improvement before deadline): Close probation with a positive note.
    - **Extend with custom deadline** (for edge cases): Set a new deadline and add a reason.
    - **Escalate immediately** (for severe incidents during probation): Skip the remaining probation window and flag for suspension.
    - **Override probation** (rare): Close probation with admin justification, resetting the provider to normal monitoring.
20. Every action is audit-logged.

### Reinstatement Flow (After Suspension)
21. After the minimum cooling-off period (configurable, default 30 days), a suspended provider can submit a reinstatement request through the app.
22. The request form asks: what they have done to address the issues, whether they can commit to the platform's quality standards, and optionally any supporting documentation.
23. The request appears in the admin reinstatement queue.
24. Admin reviews the request, the provider's historical performance data, and the suspension reason.
25. **If approved:** Provider is reinstated as BACKUP (not PRIMARY) for their original zone-category. They enter a 30-day probationary monitoring period with tighter thresholds. Assignment volume is limited (e.g., max 50% of normal) during the monitoring period. If they maintain YELLOW or above for 30 days, they return to normal assignment volume.
26. **If denied:** Provider receives a notification with the reason. They can re-apply after an additional cooling-off period.

## UI/UX Design Recommendations

- **Probation card (provider-facing):** A full-width card at the top of the provider's Performance screen with a warm amber background and a border accent. The card should feel serious but not punitive -- use language like "Improvement Period" rather than "Probation" in customer-visible contexts. Inside: a circular countdown (days remaining), metric target cards arranged in a grid, and a coaching tip section. Each metric card shows a mini progress bar colored by trajectory (green = improving, gray = flat, red = declining).
- **Probation queue (admin-facing):** A table or card list with smart sorting. Default sort by "deadline soonest." Each row shows: provider name with avatar, zone/category badge, a "days remaining" countdown with color coding (green = plenty of time, amber = expiring soon, red = overdue), current score as a number with band color, target score, and a trend sparkline for the probation period. The sparkline is the key visual -- admins can instantly see if a provider is improving, flat, or declining without opening the detail view.
- **Probation timeline (detail view):** A horizontal timeline showing the probation lifecycle: entry event, weekly checkpoints, extension (if applicable), and the deadline. Each checkpoint is a node showing the score at that point. This gives admins a narrative arc: "started at 58, improved to 63 after week 1, plateaued at 65 after week 2." Below the timeline, show the metric breakdown with before-and-during comparison.
- **Reinstatement request form (provider-facing):** Keep it dignified. A clean form with a header: "Request to Resume Service." Two text areas: "What steps have you taken to improve?" and "Is there anything else you'd like us to know?" Plus a checkbox: "I understand that reinstatement includes a 30-day monitoring period with limited assignments." Avoid making it feel like a punishment -- frame it as a fresh start.
- **Ladder visualization (both audiences):** On the provider's Performance screen and in the admin's provider detail, show a vertical "ladder" graphic with the four tiers: Good Standing (GREEN/YELLOW), Improvement Period (ORANGE), Under Review (RED), Suspended. Highlight the provider's current position. This makes the system transparent -- providers can see exactly where they are and what's above and below them.

## Acceptance Criteria

- When a provider's SLA level changes to ORANGE, a probation record is automatically created with specific metric targets and a deadline
- Improvement targets are calculated as the minimum values needed to return to YELLOW for each failing metric
- Providers on probation see a dedicated improvement dashboard with their targets, progress, deadline countdown, and coaching tips
- At the probation deadline, the system automatically evaluates whether the provider improved, stayed flat, or declined, and takes the appropriate action (close, extend, or escalate)
- Only one probation extension is allowed before escalation to suspension candidacy
- Providers who improve during probation enter a 30-day monitoring period with faster re-entry into probation if they decline again
- The admin Probation Queue shows all active cases sorted by deadline with trend indicators and recommended actions
- Admins can manually de-escalate, extend, escalate, or override probation cases with required justification
- Suspended providers can submit a reinstatement request after a configurable cooling-off period
- Reinstated providers start as BACKUP with limited assignment volume and a 30-day monitoring period
- Every probation entry, extension, closure, escalation, and reinstatement action is audit-logged
- Probation thresholds (duration, extension limits, monitoring period) are configurable per category without code changes
- The probation ladder is aligned with the existing SLA band thresholds (GREEN/YELLOW/ORANGE/RED) as the single source of truth
