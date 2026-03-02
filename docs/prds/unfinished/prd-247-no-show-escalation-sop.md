# PRD 247: No-Show Escalation SOP

> **Status:** PLACEHOLDER
> **Priority:** P1 High
> **Effort:** Small (1–2 days)

## What Exists Today

The no-show detection and immediate response system is fully automated. A `check-no-shows` edge function runs hourly, scanning for jobs where the scheduled start window has passed with no provider arrival recorded. When a no-show is detected, the system automatically:

- Finds backup providers for the affected zone-category, ordered by priority rank.
- Checks each backup's daily capacity before assigning.
- Reassigns the job to the first available backup provider.
- Notifies the customer ("We're sending a different pro to keep your Service Day on track").
- Notifies the original provider that the job was reassigned due to a no-show.
- Notifies the newly assigned backup provider of the incoming job.
- If no backup is available, flags the job for admin attention and sends an urgent admin alert.
- Logs every action in a job assignment log with explanations for customer, provider, and admin audiences.

A basic SOP document exists in the admin Playbooks page with high-level steps: detection, contact attempt, reassignment, customer notification, incident logging, and a brief accountability section mentioning 1st/2nd/3rd offense consequences. However, this SOP is a static outline, not an interactive workflow. There is no system enforcement of the escalation ladder, no tracking of repeat offenses over time, and no structured process for distinguishing legitimate emergencies from chronic no-shows.

## What's Missing

1. **Structured escalation ladder with system tracking** -- The current SOP mentions "1st no-show = warning, 2nd = score penalty, 3rd = probation review" but this is not enforced by the system. No-show history per provider is not aggregated or surfaced in a way that automatically triggers escalation levels.

2. **Rolling offense window** -- No-shows should be tracked within a rolling time window (e.g., 60 or 90 days). A provider who had one no-show 8 months ago should not be treated the same as a provider with three no-shows in the last month. The window should be configurable.

3. **Emergency/excuse classification** -- Not all no-shows are equal. A provider whose truck broke down on the way to a job is different from a provider who simply forgot. The system needs a way for providers to submit a no-show reason, and for admins to classify the no-show as "excused" (does not count toward the escalation ladder) or "unexcused."

4. **Automated escalation actions at each tier** -- When a provider hits the 2nd or 3rd offense threshold, the system should automatically trigger the appropriate action (score penalty, probation, suspension candidate flag) rather than relying on an admin to manually connect the dots.

5. **Interactive admin playbook** -- The current SOP is static text. Admins should have an interactive checklist workflow that guides them through each step, tracks completion, and logs the outcome. This ensures consistency across different admins handling no-shows.

6. **Provider no-show history view** -- Admins need a single place to see a provider's complete no-show history: dates, zones, whether each was excused or unexcused, what escalation action was taken, and any provider-submitted reasons.

7. **Customer recovery protocol** -- Beyond the automated reassignment notification, the SOP should include a customer recovery step for repeat no-shows: a proactive outreach or credit offer when a customer has experienced more than one no-show in a billing period, since this is the most damaging failure mode for customer trust.

## Why This Matters

### For the Business
- No-shows are the single most damaging provider failure. The customer cleared their schedule, expected service, and got nothing. Each no-show carries a high churn risk. A structured escalation ladder transforms no-shows from ad-hoc emergencies into a managed process with predictable outcomes.
- Without system-enforced escalation, admins handle each no-show independently. Admin A might give a warning; Admin B might not even notice the provider had two previous no-shows. Inconsistency creates both operational risk (chronic no-shows go unaddressed) and fairness risk (providers treated differently for the same behavior).
- Tracking no-show patterns over time reveals systemic issues: a provider who no-shows every other Friday might have a scheduling conflict that coaching could solve, while a provider with random no-shows might be overcommitted across platforms.

### For the User
- Customers get a consistent, professional response every time a no-show occurs. The immediate reassignment already handles the operational impact; the escalation ladder handles the systemic prevention. Customers who see the same provider no-show repeatedly lose trust, even if the system sends a backup each time.
- Providers receive fair, transparent consequences that escalate predictably. A first offense gets a warning with coaching; a chronic pattern results in suspension. This is more fair than either ignoring no-shows entirely or suspending on the first occurrence.
- Admins get an interactive playbook that eliminates guesswork. Instead of "what's the right thing to do here?", they follow a guided workflow that handles edge cases and ensures every step is documented.

## User Flow

### Automated Detection and Immediate Response (System -- Already Built)
1. Hourly check detects jobs past their start window with no provider arrival.
2. System attempts reassignment to backup provider.
3. Customer, original provider, and backup provider are all notified.
4. Job assignment log records the no-show event.

### Escalation Classification (Admin)
5. The no-show event appears in the admin's "No-Show Incidents" queue, which is a filtered view within the Exceptions or Dispatcher interface.
6. Each incident card shows: job details, provider name, no-show count (rolling window), current escalation tier, and whether the provider submitted a reason.
7. Admin reviews the incident and classifies it:
   - **Unexcused** (default) -- Counts toward the escalation ladder. Provider did not show up and did not provide a valid justification.
   - **Excused** -- Does not count toward the escalation ladder. Provider had a documented emergency (vehicle breakdown, medical, severe weather in transit, etc.). Admin must select a reason category and add a note.
8. If the provider submitted a reason through the app, the admin sees it inline and can accept (mark excused) or reject (keep unexcused).

### Automated Escalation Actions (System)
9. After classification, the system checks the provider's unexcused no-show count within the rolling window:
   - **1st unexcused no-show:** System sends a formal warning notification to the provider: "You missed a scheduled job on [date]. No-shows impact customers and your quality score. If you need to miss a job in the future, please notify us at least [X hours] in advance." The incident is logged on the provider's record.
   - **2nd unexcused no-show (within rolling window):** System applies a quality score penalty (configurable, default -15 points), sends a stronger warning: "This is your second missed job in [X days]. Your quality score has been adjusted. One more no-show may result in probation." The admin is notified that the provider has reached Tier 2.
   - **3rd unexcused no-show (within rolling window):** System automatically flags the provider for probation review (connects to PRD 248 Provider Probation Ladder). Provider receives notification: "Due to repeated missed jobs, your account is under probation review. An admin will contact you within 48 hours." The provider's assignment priority may be reduced pending review.
10. Each tier action is logged and visible in the provider's no-show history and overall performance timeline.

### Customer Recovery (Admin, for repeat impact)
11. If a customer has experienced 2+ no-shows within a billing cycle (even from different providers), the system flags the customer for proactive recovery.
12. Admin sees a "Customer Impact" alert: "[Customer Name] has been affected by [X] no-shows this cycle."
13. Admin can trigger a recovery action: a goodwill credit at a configured tier, a personal outreach message, or a priority reassignment to the zone's top-rated provider for future jobs.

### Provider: Submitting a No-Show Reason
14. After a no-show is detected, the provider receives a notification with a "Tell us what happened" prompt.
15. Provider taps through to a simple form: reason category (vehicle issue, medical emergency, family emergency, scheduling conflict, other) and an optional short note.
16. Submission is time-limited (within 24 hours of the no-show event).
17. The reason appears in the admin's incident review for classification.

## UI/UX Design Recommendations

- **No-Show Incidents Queue:** A dedicated tab or filtered view in the Exceptions area showing only no-show events. Each incident card should display: provider avatar and name, a large no-show counter badge ("2nd no-show"), the job date and zone, a status pill (Pending Review / Excused / Unexcused), and whether the provider submitted a reason (green "Reason submitted" tag or gray "No response"). Cards should be sorted with unclassified incidents first, then by severity (higher no-show count = higher priority).
- **Classification modal:** When the admin taps an incident, show a detail view with all context: job timeline (scheduled time, start window, no-show detection time), provider's recent no-show history as a compact timeline, the provider's submitted reason (if any), and two action buttons: "Mark Unexcused" (primary/red) and "Mark Excused" (secondary). "Mark Excused" should require selecting a reason category from a dropdown and adding a note.
- **Provider no-show history timeline:** On the provider detail page, add a "No-Show History" section showing a visual timeline: each incident as a dot on a horizontal line, color-coded (red for unexcused, amber for excused), with the rolling window highlighted. Hovering or tapping a dot shows the date, zone, classification, and any notes. The current escalation tier should be prominently displayed: "Tier 2 of 3 -- Next unexcused no-show triggers probation review."
- **Provider-facing reason form:** Keep it dead simple. One screen with a category picker (large tappable cards, not a dropdown), an optional text area, and a "Submit" button. Show a reassuring header: "We understand things happen. Let us know what went on and we'll take it into account." Include a subtle note about the 24-hour submission window.
- **Customer impact banner:** When viewing a customer profile, if they have been affected by multiple no-shows, show a warm amber banner: "This customer has experienced [X] service disruptions this cycle. Consider a goodwill gesture." With quick-action buttons for the configured credit tiers.
- **Interactive playbook integration:** The existing Playbooks page should gain an interactive mode for no-show escalation. Instead of static steps, each step should have a checkbox, and completing the checklist should log the workflow as "completed" with a timestamp and admin ID. This turns the SOP from a reference document into an executable workflow.

## Acceptance Criteria

- No-show events are surfaced in a dedicated admin incident queue with provider context and no-show count
- Admins can classify each no-show as "excused" (with reason category and note) or "unexcused"
- Unexcused no-shows are tracked per provider within a configurable rolling window (default 60 days)
- The system automatically triggers the correct escalation action based on the unexcused count: 1st = warning, 2nd = score penalty, 3rd = probation flag
- Each escalation action sends the appropriate notification to the provider with clear language about consequences
- Providers can submit a no-show reason through the app within a configurable time window (default 24 hours)
- Provider-submitted reasons are visible to admins inline during incident classification
- The provider detail page shows a complete no-show history with classification, dates, and escalation tier
- Customers affected by multiple no-shows within a billing cycle are flagged for proactive recovery
- Excused no-shows do not count toward the escalation ladder
- All classification decisions and escalation actions are audit-logged with admin ID, timestamp, and reason
- The escalation thresholds (number of offenses per tier) and the rolling window duration are configurable without code changes
- The no-show SOP is available as an interactive checklist in the admin Playbooks page
