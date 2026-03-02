# PRD 227: Auto-Flag and Suspend Low-Quality Providers

> **Status:** PLACEHOLDER
> **Priority:** P0 Critical
> **Effort:** Medium (3–5 days)

## What Exists Today

The SLA evaluation system is fully operational. A daily edge function iterates through every active provider assignment, calls an evaluation procedure that computes rolling 30-day metrics (on-time rate, completion rate, photo compliance, issue rate, redo rate), and maps results to a four-level quality band: GREEN (meets all standards), YELLOW (warning), ORANGE (probation zone), RED (critical). Each evaluation updates the provider's SLA status record including a `weeks_at_level` counter that tracks consecutive weeks at the same level.

An `enforce_sla_suspensions` procedure exists and is called at the end of each daily SLA run. It finds providers at RED for 2+ weeks, suspends their zone-category assignment, promotes the top backup, and sends notifications to the suspended provider, the promoted provider, and all admins. However, this procedure has significant gaps: there is no admin review gate before suspension executes, no grace period or improvement plan mechanism, no configurable thresholds (the 2-week trigger is hardcoded), no distinction between "auto-flagged for review" and "auto-suspended," and no admin override or appeal workflow.

The admin console shows provider SLA status with color-coded badges, but there is no dedicated queue for "suspension candidates" that need review, and no dashboard showing providers trending toward RED.

## What's Missing

1. **Pre-suspension flagging stage** -- Before auto-suspending, the system should flag RED providers as "suspension candidates" and surface them in a dedicated admin review queue. This gives admins a window to investigate before the hammer drops.

2. **Configurable suspension thresholds** -- The 2-week RED trigger should be configurable per category and zone, not hardcoded. Some categories may warrant faster action (safety-sensitive services) while others may tolerate a longer improvement window.

3. **Admin review and override workflow** -- Admins need the ability to defer a suspension (with a reason and a new review date), override the auto-suspension recommendation (with documented justification), or accelerate suspension for severe cases. Every decision must be audit-logged.

4. **Provider improvement plan notification** -- When a provider first enters RED, they should receive a structured improvement plan: specific metrics to improve, a clear deadline, and what happens if they don't improve. This is the "yellow card" before the "red card."

5. **Trending-toward-RED early warning** -- A dashboard widget or alert that identifies providers whose scores are declining week-over-week, even if they haven't hit RED yet. Early intervention is cheaper than suspension.

6. **Post-suspension communication flow** -- Clear provider-facing messaging explaining why they were suspended, what metrics caused it, and the exact steps to apply for reinstatement.

7. **Suspension audit trail and reporting** -- A complete history of every auto-flag, admin review, deferral, override, and suspension action for compliance and operational learning.

## Why This Matters

### For the Business
- Every additional visit from a RED provider is a customer churn risk. If a provider has been in RED for two weeks, that could represent 10-20+ sub-standard visits already delivered. Auto-flagging shortens the exposure window from "whenever an admin notices" to "the next daily SLA run."
- A defensible, documented suspension process protects the business legally. Ad hoc suspensions without clear criteria or documentation invite disputes and potential legal challenges from providers.
- The early warning system shifts the paradigm from reactive (suspend after damage) to proactive (intervene before RED). Coaching a YELLOW provider back to GREEN is far cheaper than replacing a suspended RED provider.

### For the User
- Customers receive consistent, high-quality service because providers who repeatedly fail to meet standards are systematically identified and removed from service. No more "luck of the draw" depending on whether an admin happened to notice.
- Providers benefit from clear, fair rules. Knowing exactly what triggers a flag, what the improvement window looks like, and what suspension means removes ambiguity and gives them agency to course-correct.
- Admins gain a focused review queue instead of scanning spreadsheets, letting them spend their time on judgment calls rather than detection.

## User Flow

### Automated Daily Flow (System)
1. The daily SLA enforcement run evaluates all active provider assignments and updates quality levels.
2. For any provider newly entering RED status, the system generates an "Improvement Plan Required" notification with specific metric targets and a deadline (configurable, default 14 days).
3. For any provider who has been in RED for the configured threshold period (default 2 weeks), the system auto-flags them as a "Suspension Candidate" and adds them to the admin review queue.
4. The system sends a push notification and email to the flagged provider: "Your performance requires immediate attention. An admin will review your account within 48 hours."
5. The system sends a notification to all ops-level admins: "X new suspension candidates require review."

### Admin Review Flow
6. Admin opens the Suspension Review Queue from the admin dashboard or a badge-count notification.
7. The queue shows each candidate as a card: provider name, zone, category, current score, weeks at RED, key failing metrics, and a mini-chart showing score trend over the last 8 weeks.
8. Admin taps a candidate to open the detail view: full metric breakdown, recent job history, any customer complaints, previous warnings, and the system's recommendation (suspend or extend review).
9. Admin chooses one of three actions:
   - **Approve Suspension** -- Provider is immediately suspended for this zone-category. Jobs are reassigned. Provider receives a suspension notification with reinstatement instructions.
   - **Defer Review** -- Admin sets a new review date (1-2 weeks out) and adds a note explaining why (e.g., "provider had a family emergency, extending window"). The provider stays active but monitored.
   - **Override (Keep Active)** -- Admin documents justification for keeping the provider active despite RED status. The flag is cleared, and the provider returns to normal monitoring. A new flag will trigger if they remain RED at the next threshold check.
10. Every action is logged with admin ID, timestamp, reason, and outcome.

### Provider Notification Flow
11. Suspended provider receives a detailed notification: which zone-category they are suspended from, the specific metrics that triggered it, and a link to the reinstatement request form.
12. Provider can submit a reinstatement request through the app after a minimum cooling-off period (configurable, default 30 days).

## UI/UX Design Recommendations

- **Suspension Review Queue:** A dedicated page accessible from the admin sidebar with a badge count showing pending reviews. Use a card-based layout where each card shows the provider photo/avatar, name, zone, category, a large quality score number with the RED badge, and a sparkline chart showing the 8-week score trend. The sparkline instantly communicates whether the provider is declining, flat, or recovering.
- **Metric breakdown cards:** Inside the detail view, show each SLA component (on-time, completion, photos, issues) as its own card with a circular progress indicator, the current percentage, and the target threshold. Cards in the failing range should use a warm red background; passing metrics should be muted. This makes it immediately obvious which specific areas are failing.
- **Three-button action bar:** At the bottom of the detail view, show three equally weighted buttons: "Suspend" (red), "Defer" (amber), "Override" (outlined/secondary). Each button opens a confirmation modal requiring a reason before executing. The "Suspend" modal should preview what will happen: "Provider will be removed from X active jobs. Backup provider Y will be promoted."
- **Trending Providers widget:** On the main ops dashboard, add a "Performance Watch" section showing providers whose scores dropped by 10+ points in the last two weeks, sorted by score. Use amber highlight for trending-toward-ORANGE and red for trending-toward-RED. This surfaces problems before they become suspension candidates.
- **Timeline view:** In the provider detail, show an audit timeline of all SLA events: level changes, warnings sent, admin reviews, deferrals, and any previous suspensions. This gives admins full historical context at a glance.
- **Provider-facing improvement plan:** When a provider enters RED, show a dedicated "Improvement Plan" card on their performance dashboard with specific targets ("Improve on-time rate from 65% to 80%"), a countdown timer to the review deadline, and progress bars showing where they stand against each target.

## Acceptance Criteria

- Providers entering RED status for the first time receive an automated improvement plan notification with specific metric targets and a deadline
- Providers remaining in RED beyond the configurable threshold (default 2 weeks) are automatically flagged as suspension candidates
- Flagged providers appear in a dedicated admin Suspension Review Queue with full metric context
- Admins can approve suspension, defer review with a new date and reason, or override the flag with documented justification
- Approved suspensions immediately update the provider's zone-category assignment status and trigger job reassignment
- Every flag, review, deferral, override, and suspension action is logged in an audit trail with admin ID, timestamp, and reason
- The suspension threshold (number of weeks at RED before flagging) is configurable per category without requiring a code change
- Suspended providers receive a notification explaining the suspension reason, affected zone-category, and reinstatement path
- A dashboard widget surfaces providers with declining quality scores before they reach RED status
- The provider-facing performance screen shows an improvement plan with specific targets when the provider is in RED
- Admin notifications are sent when new suspension candidates enter the review queue
- The system does not auto-suspend without first flagging for admin review (the current behavior of silent auto-suspension is replaced with a flag-then-review flow)
