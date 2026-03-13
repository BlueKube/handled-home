# PRD 237: Weekly Payout Batch Runs

> **Status:** PLACEHOLDER
> **Priority:** P1 High
> **Effort:** Medium (3–5 days)

## What Exists Today

The individual payout processing pipeline works end-to-end. A `process-payout` edge function accepts a payout ID, verifies the provider has a connected payment account in READY status, creates a transfer through the payment processor (Stripe Connect), and records the processor reference. The function requires admin authentication and handles a single payout at a time.

On the earnings side, providers accrue earnings when jobs are completed. Each earning record tracks the amount, a hold period (`hold_until`), and a status that transitions from EARNED to ELIGIBLE (after the hold window expires) to PAID (after payout confirmation). A nightly job auto-releases holds that have passed their hold window, moving earnings from EARNED to ELIGIBLE.

The billing and payouts module documents a complete payout run specification: weekly cadence, minimum payout threshold ($50-$100 configurable), rollover of sub-threshold amounts, and idempotency requirements. However, no batch orchestrator implements this specification. Today, payouts are either triggered manually by an admin (one at a time through the admin console) or not triggered at all. There is no scheduled weekly job that collects all eligible earnings, enforces the threshold, creates batch payout records, and processes them through the payment processor.

The `cron_run_log` table and the scheduled jobs orchestrator exist and could host the weekly payout batch as a sub-job, following the same idempotency and logging patterns used by other scheduled tasks like SLA evaluation and no-show detection.

## What's Missing

1. **Weekly batch orchestrator** -- A scheduled job that runs on a configurable day/time (e.g., every Monday at 6 AM UTC), queries all providers with ELIGIBLE earnings, aggregates their totals, and creates payout batch records. This is the core missing piece.

2. **Minimum payout threshold enforcement** -- Logic that compares each provider's total eligible earnings against the configurable minimum threshold. If a provider's total is below threshold, their earnings roll over to the next week automatically with no action required from the provider.

3. **Batch payout creation** -- For each provider above threshold, the orchestrator should create a payout record that aggregates all eligible earnings, with line items linking each individual earning to the payout for audit traceability.

4. **Batch processing with retry logic** -- The orchestrator should process all payouts in the batch, handle individual failures gracefully (one provider's payment failure should not block others), and create exception queue items for failed payouts that admins can investigate and retry.

5. **Payout account readiness checks** -- Before attempting a payout, verify the provider's payment account is in READY status. If not, hold their earnings as HELD_UNTIL_READY and create an exception prompting the provider to complete their payout setup.

6. **Summary reporting and admin dashboard** -- After each batch run, generate a summary: total providers paid, total amount disbursed, number of threshold rollovers, number of failures, and any exceptions. Surface this in the admin payouts dashboard.

7. **Provider-facing payout schedule visibility** -- Providers should see when their next payout will arrive, whether they've met the minimum threshold, and how much will roll over if they haven't.

8. **Configurable payout schedule** -- The payout day, time, and minimum threshold should be configurable through admin settings without code changes. Some markets may need different schedules.

## Why This Matters

### For the Business
- Processing payouts one-at-a-time through admin manual action does not scale. At 50 providers, it is a minor inconvenience. At 500 providers, it is a full-time job. Batch automation is essential infrastructure for growth.
- Consolidated weekly payouts reduce payment processor fees compared to individual per-job transfers. A single $500 weekly transfer costs one transaction fee instead of twenty $25 per-job fees. At scale, this is a significant cost savings.
- Threshold enforcement prevents micro-payouts (e.g., $3.50) that cost more in processing fees than the payout itself. Rolling sub-threshold amounts to the next week is standard industry practice and expected by providers.
- Predictable weekly payouts on a known schedule build provider trust and reduce support inquiries ("where's my money?"). Providers who trust the payout system are more likely to stay on the platform.

### For the User
- Providers get paid reliably on the same day every week without needing to request payouts or wonder when money will arrive. This is the table-stakes expectation for any gig platform in 2026.
- Providers can see their payout timeline in advance: "You've earned $340 this week. Your next payout of $340 will be processed Monday." This transparency eliminates anxiety and builds trust.
- When a payout does fail (rare but inevitable -- expired cards, bank changes), the provider sees a clear message and a single action to fix it, rather than discovering the problem weeks later.
- Admins get a clean weekly report instead of chasing individual payouts. They can focus on exceptions (failures, holds) rather than routine processing.

## User Flow

### Automated Weekly Batch (System)
1. On the configured payout day (default: Monday at 6:00 AM UTC), the batch orchestrator starts a new payout run.
2. The system creates a run log entry with an idempotency key based on the payout period (e.g., week ending Sunday).
3. The orchestrator queries all provider earnings in ELIGIBLE status.
4. For each provider, it aggregates all eligible earnings into a total amount.
5. **If total >= minimum threshold:**
   - Creates a payout record with status INITIATED, linking all included earnings as line items.
   - Verifies the provider's payment account is READY.
   - If READY: submits the payout to the payment processor.
   - If NOT READY: marks earnings as HELD_UNTIL_READY and creates an exception for the provider ("Complete your payout setup to receive $X").
6. **If total < minimum threshold:**
   - Earnings remain in ELIGIBLE status and roll over to the next payout run.
   - No notification is sent for routine rollovers (to avoid notification fatigue).
   - If a provider has been rolling over for 3+ consecutive weeks, send a one-time informational notification: "Your earnings are accumulating. Once your balance reaches $[threshold], you'll receive a payout."
7. The orchestrator processes all payouts, logging each success or failure individually.
8. Payment processor webhooks confirm each transfer, updating payout status from INITIATED to PAID and each included earning from ELIGIBLE to PAID.
9. Failed payouts generate exception queue items for admin review.
10. The orchestrator completes the run and records a summary.

### Admin: Reviewing Payout Runs
11. Admin opens the Payouts Dashboard and sees a summary of the most recent batch run: total providers paid, total disbursed, rollovers, failures.
12. A "Batch History" tab shows past payout runs as a chronological list, each expandable to show per-provider results.
13. The "Exceptions" tab filters to payout-related exceptions: failed transfers, providers not READY, threshold edge cases.
14. For failed payouts, admin can tap "Retry" to re-attempt the transfer or "Investigate" to view provider details.

### Provider: Viewing Payout Schedule
15. Provider opens their Payouts tab and sees a summary card: "Next payout: Monday, [Date]" with the estimated amount based on current eligible earnings.
16. Below the card, a simple breakdown: "Earned this week: $X / Threshold: $Y / Status: [On track for payout / Rolling over]."
17. Past payouts are listed chronologically with amount, date processed, and status.
18. If the provider's payout account is not READY, a prominent banner appears: "Set up your payout account to start receiving payments" with a single setup button.

## UI/UX Design Recommendations

- **Admin Payouts Dashboard redesign:** The top section should show a "Last Payout Run" summary card with four key numbers in a 2x2 grid: Providers Paid, Total Disbursed, Rollovers, and Failures. Each number should be tappable to drill into the relevant list. Use green for the successful metrics and amber/red badges for failures. Below, show a timeline chart of weekly payout totals over the last 12 weeks to visualize trends.
- **Batch run detail view:** When an admin taps into a specific batch run, show a scrollable list of every provider included in that run. Each row shows: provider name, payout amount, status pill (PAID in green, FAILED in red, ROLLED OVER in gray, HELD in amber). Failed rows should have a prominent "Retry" button. Support filtering by status to quickly find all failures.
- **Provider payout countdown:** On the provider's payouts home, show a visual countdown or progress element indicating days until next payout. Something as simple as "Payout in 3 days" with a subtle progress bar reinforces the predictability. If earnings are below threshold, show the progress toward threshold: "You need $15 more to reach the $50 minimum payout."
- **Rollover transparency:** When a provider's earnings roll over, do not hide it. Show a small note on their next payout preview: "Includes $30 carried over from last week." This builds trust by showing the system is tracking everything.
- **Failure recovery flow:** When a payout fails, the provider should see a warm but clear banner: "Your payout of $X couldn't be processed. This is usually a quick fix." With a single CTA: "Update payment info." After updating, show: "All set! Your payout will be retried in the next batch run."
- **Admin settings page:** Add a "Payout Schedule" section to admin settings showing: payout day of week (dropdown), payout time (time picker), minimum threshold (dollar input), and hold durations by job type. Changes should require confirmation and take effect on the next run, not retroactively.

## Acceptance Criteria

- A weekly batch orchestrator runs automatically on the configured day and time, processing all eligible provider earnings
- The batch run uses an idempotency key to prevent duplicate processing if triggered multiple times
- Each provider's eligible earnings are aggregated and compared against the configurable minimum payout threshold
- Providers above threshold receive a payout; providers below threshold have their earnings rolled over to the next cycle
- Each payout record links to all included earnings as line items for audit traceability
- Provider payment account status is verified before attempting each payout; NOT READY accounts result in held earnings and a provider-facing exception
- Individual payout failures do not block processing of other providers in the same batch
- Failed payouts create exception queue items visible to admins with retry capability
- Payment processor webhooks confirm payout completion and update earning statuses to PAID
- The admin Payouts Dashboard shows a summary of each batch run: providers paid, total disbursed, rollovers, and failures
- Providers can see their estimated next payout date and amount on their payouts screen
- Providers who have been rolling over for 3+ consecutive weeks receive a one-time informational notification
- The payout day, time, and minimum threshold are configurable through admin settings
- The batch run records a detailed log in the cron run system with a complete result summary
