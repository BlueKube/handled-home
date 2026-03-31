import type { TrainingSection } from "@/components/academy/AcademySection";

export const sopsPlaybooksSections: TrainingSection[] = [
  {
    id: "overview",
    title: "What Are SOPs and When Do You Follow Them?",
    type: "overview",
    content: `SOPs (Standard Operating Procedures) are your playbook for predictable situations. When a provider no-shows, when a customer disputes a charge, when you need to pause a zone for weather — there's a procedure. The Playbooks page organizes these by role: dispatcher, ops, and superuser.

The value of SOPs isn't that they tell you exactly what to do in every situation. It's that they give you a starting point so you're not making it up as you go. A dispatcher handling their first no-show at 3pm on a Friday doesn't need to think from first principles — they need a checklist.

Key principle: follow the SOP until it stops making sense, then escalate. SOPs handle the 90% case. The 10% that doesn't fit the playbook is why you have senior operators and supervisors.`,
  },
  {
    id: "daily-rhythm",
    title: "The Daily and Weekly Rhythm",
    type: "walkthrough",
    steps: [
      {
        title: "Morning check-in (daily, 10 min)",
        description: "Cron Health → Notification Health → Ops Cockpit → Dispatcher Queues (At Risk tab) → Assignment status. This is your 'is everything running?' check. Notification Health takes 10 seconds — if email delivery is failing, customers aren't getting service confirmations and you won't know until they complain. If all green, move on with your day. If something's red, triage before doing anything else.",
        screenshot: { alt: "Morning check-in sequence across pages" },
      },
      {
        title: "Mid-day triage (daily, 15 min)",
        description: "Dispatcher Queues (all tabs) → Exception queue → Support tickets nearing SLA breach. This catches same-day issues before they cascade into customer complaints. The mid-day check is especially important because morning issues have had time to develop.",
        screenshot: { alt: "Mid-day triage checklist" },
      },
      {
        title: "End-of-day reconciliation (daily, 10 min)",
        description: "Jobs page (today, filter by ISSUE_REPORTED) → Provider proof compliance → Any open exceptions from today. This is your 'did everything that was supposed to happen actually happen?' check. Unresolved items get flagged for tomorrow morning.",
        screenshot: { alt: "End-of-day reconciliation view" },
      },
      {
        title: "Weekly review (Friday, 30 min)",
        description: "Zone health table (trends, not just today) → Exception Analytics (patterns, not individual items) → Provider performance summary → Support ticket volume trends. This is your 'what's the story of this week?' check. Write a brief summary for the team.",
        screenshot: { alt: "Weekly review dashboard combination" },
      },
    ],
  },
  {
    id: "common-sops",
    title: "Common SOPs and When They Apply",
    type: "text",
    content: `PROVIDER NO-SHOW
Trigger: Provider didn't check in by end of scheduled window
Steps: (1) Check if provider communicated absence in advance. → If yes: treat as a scheduling failure, not a conduct issue. Assign backup, notify customer. → If no: treat as an unexcused no-show — attempt contact before drawing that conclusion, but document the silence. (2) Attempt contact (call, then SMS) — give 15 minutes for a response. (3) Assign to backup if available; if no backup, notify customer honestly with a realistic ETA, not a false reassurance. (4) Notify customer with ETA for replacement or next-available window. (5) Log incident on provider record with timestamps and contact attempts. (6) Review pattern: → First occurrence: log and monitor. → Second no-show within 30 days: schedule a direct conversation. → Third no-show within 60 days: escalate to probation review — this is now a reliability problem, not a one-off.

CUSTOMER DISPUTE
Trigger: Customer reports service wasn't performed or was substandard
Steps: (1) Pull proof photos and check provider check-in/check-out timestamps before saying anything to the customer. Don't commit to a resolution before you know what happened. (2) Evaluate the proof. → Proof clearly shows service was completed: share the photos with the customer, walk through what was done, and explain the scope of the service. Don't be defensive — be informative. Sometimes customers forget what's included. → Proof is missing or shows clear issues: don't make the customer argue for a resolution. Apologize, issue a service credit or schedule a redo (customer's choice), then address the provider-side failure separately. → Proof is ambiguous (partial, unclear angle, timing gap): use judgment. When in doubt, side with the customer on the resolution and investigate the provider separately. (3) Log the outcome on the provider record if the issue was provider-caused. One dispute isn't a pattern. Three in 60 days is.

ZONE PAUSE (WEATHER)
Trigger: Sustained severe weather (2+ day forecast)
Steps: (1) Activate weather mode for affected zone(s), (2) Verify reschedule queue generated correctly, (3) Send proactive customer notification, (4) When weather clears: deactivate weather mode, (5) Monitor reschedule backlog for 2-3 days post-weather

EMERGENCY PRICING CORRECTION
Trigger: Pricing error discovered after billing ran
Important: Pricing changes in Control Room require a submitted change request before edits are applied. If you correct pricing without logging a change request first, the Control Room audit trail will show an unexplained edit — which creates compliance risk and confusion for anyone reviewing the Change Log later. Submit the change request, get acknowledgment, then proceed.
Steps: (1) Identify scope (how many customers affected, which zones, which billing period). (2) Submit a change request in Control Room describing the error, the correct pricing, and the affected records — do this before touching anything. (3) Correct pricing in Control Room once the change request is on record. (4) Calculate affected invoices and issue credits for overcharges. (5) Send customer communication — be direct about what happened and what was corrected. (6) Log in Change Log with full explanation, referencing the change request ID.

END-OF-DAY RECONCILIATION
Trigger: Daily at end of business
Steps: (1) Check all jobs scheduled for today reached terminal state, (2) Flag jobs stuck in IN_PROGRESS (provider forgot to check out?), (3) Check proof submission rate for today, (4) Note any unresolved exceptions for tomorrow

BILLING CRON FAILED
Trigger: Cron Health dashboard shows billing job failed (red status or missed execution)
Steps: (1) Open the failed job entry and read the error details in full — "billing failed" is not enough information. Note the error type, timestamp, and any affected record IDs. (2) Determine if the failure is recoverable without engineering involvement. Safe to self-resolve: transient timeouts, temporary DB lock. Escalate immediately: data corruption errors, partial write failures, unknown error codes. (3) If escalating: page the on-call engineer with the job ID, error message, and timestamp. Do not attempt a manual re-trigger before engineering has assessed whether a partial run occurred — re-triggering a partially-completed billing job can cause double charges. (4) Communicate to affected teams (finance, customer support) that billing for the affected period may be delayed. Be specific about scope if you know it. (5) If engineering confirms the job is safe to re-run: trigger manually and monitor Cron Health for successful completion. Document the failure, the root cause, and the resolution in the Change Log.

CHARGEBACK RESPONSE
Trigger: Customer initiates a chargeback through their bank or card issuer
Steps: (1) The clock starts immediately. Stripe gives a 7-day window to submit a dispute response — missing it means automatic loss. Check the chargeback date in Stripe and note the deadline in your calendar before doing anything else. (2) Gather evidence: proof photos from the job, provider check-in/check-out timestamps, service records, and any communication logs between your team and the customer (support tickets, emails, SMS). The stronger the paper trail, the better. (3) Write and submit the dispute response via Stripe. The response should be factual and documented — not argumentative. State what service was provided, when, with what verification. Attach all evidence. (4) Note the chargeback, dispute submission, and evidence summary on the customer record. This creates context for whoever handles the outcome follow-up. (5) Track the outcome. Stripe typically resolves disputes in 60–90 days. If the dispute is lost: review whether the underlying service failure or communication gap that led to it can be addressed operationally. If won: close the record note with the resolution date.

PROVIDER STRIPE ACCOUNT RESTRICTED
Trigger: Provider's Stripe Connect account status changes to RESTRICTED (visible in provider profile or payment dashboard)
Steps: (1) Notify the provider immediately — do not wait to see if it resolves on its own. A restricted account means they cannot receive payouts, and they may not know yet. Be direct but not alarming: tell them their Stripe account has a restriction, what that means for payouts, and what they need to do next. (2) Share the Stripe support link with them: https://support.stripe.com — they will need to work directly with Stripe to resolve the restriction. You cannot resolve it on their behalf. (3) Log the restriction date on the provider record and track resolution progress. Follow up every 2 business days if the status hasn't changed. (4) If the account is still restricted after 5 business days: escalate to an earnings review. Work with finance to determine whether earnings accrued during the restriction period need to be held, re-routed, or processed once the account is restored. Do not hold earnings indefinitely without a documented decision.`,
  },
  {
    id: "pro-tips",
    title: "Pro Tips from Veteran Operators",
    type: "pro-tips",
    proTips: [
      {
        text: "Follow the SOP for the first 3 months, even if you think you know a better way. After 3 months, you'll have enough context to know which shortcuts actually save time and which ones create debt. Suggest improvements to the SOP — don't silently deviate.",
        context: "SOPs encode institutional knowledge. Ignoring them means repeating mistakes that were already solved.",
      },
      {
        text: "The daily rhythm (morning check → mid-day triage → EOD reconciliation) is the most important habit you'll build. It's only 35 minutes total. Skip it three days in a row and you'll spend 3 hours on Friday cleaning up the mess.",
      },
      {
        text: "When an SOP says 'escalate to senior operator,' it doesn't mean 'fail.' It means the situation is outside the scope of standard procedures and needs someone with more authority or context. Escalating early is a sign of good judgment, not weakness.",
      },
    ],
  },
  {
    id: "watch-outs",
    title: "Watch Out For...",
    type: "watch-outs",
    watchOuts: [
      {
        text: "SOPs are a starting point, not a rulebook for every possible situation. A customer who lost their home in a fire doesn't need the standard dispute resolution SOP — they need human empathy and a manual account adjustment. Know when to go off-script.",
        severity: "caution",
      },
      {
        text: "Don't skip the end-of-day reconciliation because 'it was a quiet day.' Quiet days are when small problems hide. A single unresolved job stuck in IN_PROGRESS will become tomorrow's missing-proof exception which becomes next week's customer complaint.",
        severity: "caution",
      },
    ],
  },
];
