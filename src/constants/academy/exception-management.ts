import type { TrainingSection } from "@/components/academy/AcademySection";

export const exceptionManagementSections: TrainingSection[] = [
  {
    id: "overview",
    title: "What Are Exceptions?",
    type: "overview",
    content: `Exceptions are the things that didn't go according to plan. A missed job, a failed payment, a customer complaint, a provider who didn't submit proof photos. Every operation generates exceptions — the question is how fast you catch and resolve them.

Handled Home surfaces exceptions in two places:

JOB EXCEPTIONS (Execution → Job Exceptions)
These are operational problems: missed jobs, partial completions, missing proof, customer-reported issues, provider incidents. They're generated automatically when the system detects something didn't go right.

OPS CONSOLE (Execution → Ops Console)
This is the power-user version of exceptions. Split-pane view, filtering, batch actions. If Job Exceptions is the inbox, Ops Console is the email client.

Both show the same data — use whichever matches your workflow. Most operators start with Job Exceptions for simplicity and graduate to Ops Console as they get faster.

The key principle: exceptions have severity levels and "next best actions." The system tells you what's wrong AND suggests what to do about it. Your job is to validate the suggestion and execute it (or escalate if the suggestion doesn't fit).`,
  },
  {
    id: "triage",
    title: "How to Triage Exceptions",
    type: "walkthrough",
    steps: [
      {
        title: "Sort by severity, not by age",
        description: "A HIGH severity exception from 2 hours ago is more important than a LOW severity exception from yesterday. The severity is assigned based on customer impact: HIGH means a customer is affected right now (missed job, failed payment on a first bill). LOW means it needs attention but isn't time-sensitive (missing proof from a completed job).",
        screenshot: { alt: "Exception list sorted by severity" },
      },
      {
        title: "Read the 'next best action' before doing anything",
        description: "Every exception includes a suggested next action. For missing proof: 'Request proof from provider.' For failed payment: 'Retry after dunning step 2.' For missed job: 'Reassign to backup provider.' These suggestions are based on the exception type and the entity's current state. They're right 80% of the time.",
        screenshot: { alt: "Exception detail showing next best action" },
      },
      {
        title: "Check the decision trace for context",
        description: "The decision trace shows why this exception exists — what the system tried, what failed, and what state the entity was in when the exception was created. This saves you from investigating something the system already investigated. If the trace says 'attempted assignment to backup provider: none available,' you know the problem is provider coverage, not a scheduling bug.",
        screenshot: { alt: "Decision trace expanded on an exception" },
      },
      {
        title: "Resolve or escalate — never leave exceptions in limbo",
        description: "Every exception should end in one of two states: Resolved (you fixed it or the automation fixed it) or Escalated (you pushed it to someone with more authority). An exception sitting in 'open' for 3+ days is a red flag — either nobody's looking at the queue or nobody knows what to do. Both are problems.",
        screenshot: { alt: "Exception with resolve/escalate action buttons" },
      },
    ],
  },
  {
    id: "common-types",
    title: "Common Exception Types and What They Actually Mean",
    type: "text",
    content: `MISSING PROOF (most common)
A provider marked a job complete but didn't upload the required photos. This is usually forgetfulness, not malice. The first time, send a reminder. The second time, add a note to their file. The third time, it's a training issue — they need to understand that proof protects them as much as it protects us. Without proof, a customer can dispute the job and we have nothing to show.

MISSED JOB
The scheduled visit didn't happen. Check: was the provider assigned? Did they check in? Did the customer report them as a no-show, or did nobody notice? Missed jobs that get caught by the system (provider didn't check in by end of day) are better than ones caught by the customer calling to complain. Fix: assign to backup provider for tomorrow if possible, notify the customer either way.

FAILED PAYMENT
Stripe couldn't charge the customer's card. Before you panic, check the dunning step. Step 1 (immediate auto-retry on Day 0) and step 2 (second retry + email on Day 3) are handled automatically. Only intervene at step 3+ (Day 7) or if the customer reaches out. Common causes: expired card, insufficient funds, bank fraud hold. The solution is almost always "update your card" — make it easy for the customer to do that.

CUSTOMER-REPORTED ISSUE
The customer said something was wrong with the service. Severity depends on the issue type: "my lawn wasn't edged" is different from "the provider never showed up." Always check the proof photos before responding — in 30% of cases, the photos show the work was actually done and the customer missed it (they were at work, checked the wrong area, etc.).

PROVIDER INCIDENT
Something happened to the provider during the job: vehicle breakdown, equipment failure, safety concern, access denied by the customer. These need fast triage because the provider is often on-site waiting for guidance. The priority is: is the provider safe? If yes, can they finish the job? If no, reassign.

BILLING EXCEPTION
A mismatch between what was billed and what should have been billed. These are usually generated by edge cases: mid-cycle plan changes, credits applied after an invoice was already sent, or Stripe webhook delays. Most billing exceptions resolve themselves within 24 hours as the system catches up. Only investigate if the exception is 48+ hours old.`,
  },
  {
    id: "pro-tips",
    title: "Pro Tips from Veteran Operators",
    type: "pro-tips",
    proTips: [
      {
        text: "If you see the same exception type 3 times in a week, you have a process problem, not a job problem. Three 'missing proof' exceptions from the same provider means they need training. Three 'failed payment' exceptions from the same billing cycle means something broke upstream.",
        context: "Pattern recognition is the highest-leverage skill in exception management.",
      },
      {
        text: "Never issue a refund or credit from the exception queue without checking the customer's full service history. A customer complaining about a missed lawn mowing who has had 11 out of 12 successful visits deserves a sincere apology and a rush reschedule. A customer who complains every month might be gaming the system.",
        context: "Context matters more than the individual exception.",
      },
      {
        text: "The fastest way to clear a backlog of missing-proof exceptions: send a batch notification to all providers with outstanding proof, with a 24-hour deadline. Most will upload within 2 hours. The ones who don't after 24 hours are the ones who need a phone call.",
        context: "Batch actions beat individual follow-ups 10:1 for common exception types.",
      },
      {
        text: "Keep a mental (or written) tally of exceptions by zone. A zone generating 3x the exceptions of other zones isn't just unlucky — it has a structural problem. Maybe it's over-capacity, maybe it has an underperforming provider, maybe its SKU durations are wrong. The exception queue is a symptom; the zone configuration is the cause.",
      },
    ],
  },
  {
    id: "watch-outs",
    title: "Watch Out For...",
    type: "watch-outs",
    watchOuts: [
      {
        text: "Don't resolve exceptions just to clear the queue. An exception marked 'resolved' without actually fixing the underlying problem will regenerate as a new exception in the next cycle. You didn't solve anything — you just reset the clock.",
        severity: "critical",
      },
      {
        text: "Customer-reported issues have a tight SLA. The customer is watching the clock from the moment they report it. Even if you can't fix it immediately, acknowledge within 1 hour. 'We're looking into this and will have an update by end of day' is infinitely better than silence.",
        severity: "caution",
      },
      {
        text: "Billing exceptions near the 1st of the month are often false alarms. The billing cycle runs overnight on the 1st, and Stripe webhooks can be delayed by minutes to hours. Wait 24 hours before investigating billing exceptions generated on cycle day.",
        severity: "caution",
      },
    ],
  },
  {
    id: "analytics",
    title: "Exception Analytics — Finding Patterns",
    type: "text",
    content: `The Exception Analytics page (accessed from Ops Cockpit or Execution menu) shows you trends over time. This is where exception management turns from reactive firefighting into proactive process improvement.

Key things to look for:

EXCEPTION VOLUME TREND
Is the total exception count per week growing, stable, or shrinking? Growing means your operation is scaling faster than your processes. Stable is normal. Shrinking means your preventive measures are working.

TOP EXCEPTION TYPES
Which types dominate? If 60% of your exceptions are "missing proof," the fix isn't better exception handling — it's better proof requirements or provider onboarding. If 40% are "failed payments," it's time to check your payment flow and dunning configuration.

EXCEPTIONS BY ZONE
Some zones will always generate more exceptions than others (more customers = more opportunities for things to go wrong). Normalize by dividing exceptions by total jobs. A zone with 50 exceptions on 500 jobs (10%) has a bigger problem than a zone with 100 exceptions on 5000 jobs (2%).

MEAN TIME TO RESOLUTION (MTTR)
How long from exception creation to resolution? Under 4 hours is excellent. Under 24 hours is good. Over 48 hours means exceptions are being ignored. Track this weekly and set a team target.`,
  },
  {
    id: "automation",
    title: "What's Automated vs. What Needs Your Eyes",
    type: "automation",
    automationNotes: [
      {
        text: "Exception detection is fully automated — the system generates exceptions based on rules (missed check-in, missing proof after 24 hours, failed payment webhook). You don't need to manually create exceptions.",
        type: "set-and-forget",
      },
      {
        text: "Dunning (payment retry) handles steps 1-2 automatically. Only exceptions that reach step 3+ need human intervention — by then the customer needs a personal touch.",
        type: "set-and-forget",
      },
      {
        text: "Provider no-show detection runs hourly via cron. If a provider was assigned a job and hasn't checked in by the end of the day, an exception is auto-generated and the backup provider is notified.",
        type: "set-and-forget",
      },
      {
        text: "Review the exception queue twice daily — morning (catch overnight exceptions) and mid-afternoon (catch same-day issues before end of business). This cadence catches 95% of issues before customers complain.",
        type: "daily-check",
      },
    ],
  },
];
