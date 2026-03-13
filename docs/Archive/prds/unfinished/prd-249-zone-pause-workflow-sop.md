# PRD 249: Zone Pause Workflow SOP

> **Status:** PLACEHOLDER
> **Priority:** P2 Medium
> **Effort:** Medium (3–5 days)

## What Exists Today

The zone model supports status values including `active`, `paused`, `expansion_planned`, and `archived`. An admin can set a zone's status to `paused` through the admin console. The weather mode system handles weather-triggered job rescheduling with admin approval, including customer notifications.

A basic static SOP exists in the admin Playbooks page with a six-step outline: assess the situation, determine pause type (weather/capacity/full), execute the pause, notify stakeholders, monitor during the pause, and reactivate. The SOP mentions three pause types: weather pause (1-3 days), capacity pause (1-2 weeks), and full pause (indefinite). The Zone Launch Lifecycle PRD (PRD 24) describes a paused state with resume capability.

However, the existing SOP is a static text document with no system enforcement. When an admin pauses a zone today, the status changes but nothing else happens automatically. There is no automatic job rescheduling for non-weather pauses, no customer notification templates, no provider communication, no checklist enforcement, no resume readiness verification, and no post-pause recovery workflow. The weather mode system handles weather-specific pauses but non-weather pauses (provider shortage, local emergency, capacity overload) have no automation at all.

## What's Missing

1. **Pause reason taxonomy and templates** -- A structured set of pause reasons (severe weather, provider shortage, local emergency, capacity overload, seasonal, other) with pre-written customer and provider notification templates for each. Today, admins must compose messages from scratch every time.

2. **Automated job handling on pause** -- When a zone is paused, all scheduled jobs within the pause window should be automatically rescheduled or cancelled based on the pause type. Weather pauses should auto-reschedule to the next available service day. Capacity pauses should hold jobs until resume. Full pauses should cancel with proactive customer messaging. None of this happens automatically today for non-weather pauses.

3. **Structured customer communication** -- Affected customers should receive timely, reason-specific notifications when a pause begins, when the expected resume date changes, and when service resumes. Templates should cover each pause reason with appropriate tone (weather = empathetic, capacity = transparent, emergency = reassuring).

4. **Provider notification and hold management** -- Providers in the paused zone should be notified that their upcoming jobs are on hold, with clear guidance on whether they should plan to be available (short pause) or reschedule their time (long pause). Provider earnings for paused jobs should be handled according to policy.

5. **Resume readiness checklist** -- Before reactivating a zone, the system should verify: the root cause is resolved, provider capacity is sufficient, rescheduled jobs can be accommodated, and customer communication is ready. Today an admin can resume with a single click and no verification.

6. **Post-pause recovery procedures** -- After resuming, the system should handle catch-up: rescheduling deferred jobs, potentially doubling up service days to recover skipped visits, re-notifying customers of their updated schedule, and monitoring for elevated no-show or capacity issues in the first week back.

7. **Billing impact management** -- Depending on pause duration, customers may be owed credits or subscription adjustments. A short weather pause (skip one visit) may not warrant billing action. A multi-week capacity pause likely requires proactive credits. This logic should be policy-driven and tied to the pause type and duration.

8. **Interactive admin workflow** -- The SOP should be an executable checklist in the admin console, not a static document. Each step should be tracked, and the admin should not be able to skip critical steps (like customer notification) without an override.

## Why This Matters

### For the Business
- When something goes wrong in a zone, the response speed and consistency directly impact customer retention. An ad-hoc pause process means one admin sends customer emails while another forgets; one admin reschedules jobs while another leaves them hanging. Every inconsistency is a churn risk.
- A structured pause workflow turns zone emergencies into managed events. "We're pausing Zone X for weather" should be a three-click operation that triggers an entire chain of correct actions, not a thirty-minute scramble across multiple screens.
- Billing integrity during pauses is critical. Customers who pay for a service and don't receive it due to a zone pause will dispute charges. Proactive credits during pauses are dramatically cheaper than reactive chargebacks and cancellations afterward.

### For the User
- Customers should never be surprised by a missed service. If their zone is paused, they should know about it within minutes -- not discover it when no one shows up. The notification should explain why, how long, and what happens to their subscription. This transparency preserves trust even when service is disrupted.
- Providers in paused zones need clear guidance. "Should I plan to work tomorrow or not?" is a reasonable question that the system should answer immediately. Providers who plan their week around scheduled jobs and then get ghosted by the system will lose trust and potentially leave the platform.
- Admins need confidence that pausing a zone will not create downstream chaos. The workflow should handle everything: jobs, customers, providers, billing -- so the admin can focus on the root cause, not the operational fallout.

## User Flow

### Admin: Initiating a Zone Pause
1. Admin navigates to the zone detail page and taps "Pause Zone."
2. A structured pause modal appears with the following fields:
   - **Pause reason** (required): dropdown with options -- Severe Weather, Provider Shortage, Local Emergency, Capacity Overload, Seasonal Slowdown, Other (free text required).
   - **Expected duration** (required): date picker for expected resume date, plus a "Duration unknown" toggle for open-ended pauses.
   - **Pause scope** (required): All categories in this zone, or specific categories only (multi-select).
   - **Billing action** (required): No billing change (short pause, fewer than 3 days), Apply proactive credit (configurable tier), Extend subscription cycle (push next billing date by pause duration).
3. Before confirming, the modal shows an impact preview:
   - "X customers affected"
   - "Y jobs will be rescheduled"
   - "Z providers will be notified"
   - Preview of customer notification message (editable)
   - Preview of provider notification message (editable)
4. Admin reviews the impact and taps "Confirm Pause."
5. The system executes the pause workflow:
   - Zone status changes to `paused` with the pause reason and metadata logged.
   - All affected scheduled jobs are handled based on pause type: rescheduled to first available post-resume date (weather/capacity) or cancelled with credit (full/extended pause).
   - Customer notifications are sent immediately with the appropriate template.
   - Provider notifications are sent with clear guidance on their upcoming schedule.
   - If billing action was selected, credits or cycle extensions are applied automatically.
   - An audit log entry records the full pause action with admin ID, reason, scope, and all affected entities.

### Customers: Receiving Pause Notification
6. Customers in the paused zone receive a push notification and an in-app banner.
7. Weather pause example: "Due to severe weather in your area, your [Category] service scheduled for [Date] has been rescheduled to [New Date]. Your subscription is not affected. Stay safe!"
8. Capacity pause example: "We're temporarily pausing [Category] service in your area while we bring on additional providers. Your next service is now scheduled for [New Date]. We've applied a [$X] credit to your account for the inconvenience."
9. Emergency pause example: "Due to a local emergency, [Category] service in your area is temporarily paused. We'll notify you as soon as service resumes. Your subscription billing has been adjusted."
10. The customer's dashboard shows a banner: "Service in your area is temporarily paused. [Expected to resume: Date] or [We'll notify you when service resumes]."
11. If the expected resume date changes, customers receive an update notification.

### Providers: Receiving Pause Notification
12. Providers with assignments in the paused zone receive a notification: "Jobs in [Zone Name] are paused due to [Reason]. Your scheduled jobs on [dates] are on hold."
13. For short pauses (fewer than 7 days): "Please keep your schedule flexible. We'll confirm when jobs resume."
14. For longer pauses: "Jobs in [Zone Name] are paused until at least [Date]. Your other zone assignments are not affected."
15. The provider's schedule view grays out paused jobs with a "Paused" badge.

### Admin: Monitoring During Pause
16. The admin dashboard shows a persistent banner for any active zone pauses: "[X] zones currently paused."
17. Tapping the banner opens a Zone Pause Monitor showing: each paused zone, pause reason, duration so far, expected resume date, number of affected customers, and a "Check Resume Readiness" button.
18. If the pause duration exceeds the expected resume date, the system sends a reminder to the admin: "[Zone] was expected to resume today. Please update the expected resume date or initiate recovery."
19. For capacity pauses specifically, the monitor shows provider availability status: "Needed: 2 providers. Available: 1. Gap: 1." This connects to recruitment pipelines.

### Admin: Resuming a Zone
20. Admin taps "Resume Zone" on the paused zone.
21. A resume readiness checklist appears, auto-populated by the system:
    - Root cause resolved? (admin checkbox with note field)
    - Provider capacity sufficient? (system-checked: shows current provider count vs. minimum required)
    - Rescheduled jobs can be accommodated within the next cycle? (system-checked: shows capacity utilization after resume)
    - Customer notification ready? (preview of "service resumed" message)
22. If all checks pass, admin taps "Confirm Resume."
23. The system executes the resume workflow:
    - Zone status changes to `active`.
    - Deferred jobs are confirmed for their rescheduled dates (or new dates are generated if "first available" was used).
    - Customers receive a "service resumed" notification: "Great news! [Category] service in your area has resumed. Your next visit is scheduled for [Date]."
    - Providers receive confirmation of their upcoming jobs.
    - The system enters a 7-day "recovery monitoring" period where the zone is flagged for extra admin attention (higher alert sensitivity for no-shows, capacity issues, etc.).
24. The pause event is closed in the audit log with resume date, duration, and total impact metrics.

### Post-Pause Recovery (System + Admin)
25. During the 7-day recovery period, the system monitors the zone for anomalies: elevated no-show rates, capacity overflows from catch-up jobs, customer complaints about rescheduled dates.
26. If catch-up jobs are needed (e.g., customers missed a visit), the system suggests a catch-up schedule: "12 customers need a make-up visit. Suggested: add 4 extra jobs per day for 3 days."
27. Admin reviews and approves the catch-up plan, which auto-generates the additional jobs and notifies customers.
28. After the 7-day recovery period, the zone returns to normal monitoring. A summary report is generated: total pause duration, customers affected, jobs rescheduled, credits issued, and customer retention impact (did any customers cancel during or after the pause?).

## UI/UX Design Recommendations

- **Pause modal with impact preview:** The pause confirmation modal should be a multi-step flow (not a single overloaded form). Step 1: Reason and duration. Step 2: Scope and billing action. Step 3: Impact preview with notification previews and a "Confirm" button. Each step should be a clean card with minimal fields. The impact preview is the most important screen -- show the numbers prominently (customers affected, jobs rescheduled) and let the admin edit the notification messages before they go out.
- **Zone status visual treatment:** On the zone list and map views, paused zones should have a distinct visual treatment: a gray overlay with a pause icon and the pause reason as a subtitle. This makes paused zones impossible to miss during daily ops review. Use a subtle pulsing animation on the pause icon to draw attention without being obnoxious.
- **Customer pause banner:** On the customer's dashboard, show a full-width warm amber banner at the top with the pause message and expected resume date. The banner should feel temporary and reassuring, not alarming. Use a calendar icon and friendly language. Include a "Learn more" link that opens a short FAQ: "Will I be charged? No / When will service resume? [Date] / What if I need service sooner? Contact us."
- **Resume readiness checklist:** Style this as a pre-flight checklist with green checkmarks for system-verified items and empty checkboxes for admin-verified items. If any system check fails (e.g., not enough provider capacity), show it in red with a clear explanation and a suggested action ("Assign additional providers before resuming"). Do not block resume if the admin overrides with justification, but make the override clearly intentional.
- **Recovery monitoring dashboard:** During the 7-day recovery period, add a special section to the zone detail page: "Post-Pause Recovery" with key metrics: jobs completed vs. scheduled, customer satisfaction signals, provider on-time rate, and any exceptions. Show these as a daily sparkline so admins can see if recovery is going smoothly or if there are issues.
- **Pause history on zone detail:** Show a chronological list of all past pauses for each zone: date range, reason, duration, customers affected, and outcome. This helps admins identify patterns (e.g., a zone that pauses every winter for weather may need a seasonal schedule adjustment rather than repeated pauses).

## Acceptance Criteria

- Admins can pause a zone through a structured modal that requires a reason, expected duration, scope, and billing action
- The pause modal shows an impact preview: number of affected customers, jobs to be rescheduled, and providers to be notified before confirmation
- When a zone is paused, all affected scheduled jobs are automatically handled based on the pause type (rescheduled, deferred, or cancelled with credit)
- Customers in the paused zone receive an immediate notification with reason-specific messaging and expected resume date
- Providers in the paused zone receive a notification with clear guidance on their schedule impact
- Billing actions (credits, cycle extension) are applied automatically based on the selected policy
- The admin dashboard shows a persistent indicator for active zone pauses with a monitoring view
- If the pause exceeds the expected resume date, the system sends an admin reminder to update the timeline
- Before resuming, the system presents a readiness checklist that verifies provider capacity and job accommodation
- Customers and providers receive "service resumed" notifications when the zone is reactivated
- A 7-day post-pause recovery monitoring period flags anomalies in the resumed zone
- Every pause, resume, and duration change is audit-logged with admin ID, reason, and impact metrics
- Notification templates exist for each pause reason category (weather, capacity, emergency, seasonal, other) and are editable by admins before sending
- The zone detail page shows a history of all past pauses for pattern identification
- The pause workflow is available as an interactive checklist in the admin Playbooks page
