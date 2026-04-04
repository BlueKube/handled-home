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

OPS CONSOLE (Execution → Ops Console (/admin/ops/exceptions))
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
        screenshot: { src: "/academy/exceptions-list.png", alt: "Exception list sorted by severity" },
      },
      {
        title: "Read the 'next best action' before doing anything",
        description: "Every exception includes a suggested next action. For missing proof: 'Request proof from provider.' For failed payment: 'Retry after dunning step 2.' For missed job: 'Reassign to backup provider.' These suggestions are based on the exception type and the entity's current state. They're right 80% of the time.",
        screenshot: { src: "/academy/ops-exceptions.png", alt: "Exception detail showing next best action" },
      },
      {
        title: "Check the decision trace for context",
        description: "The decision trace shows why this exception exists — what the system tried, what failed, and what state the entity was in when the exception was created. This saves you from investigating something the system already investigated. If the trace says 'attempted assignment to backup provider: none available,' you know the problem is provider coverage, not a scheduling bug.",
        screenshot: { src: "/academy/ops-exceptions.png", alt: "Decision trace expanded on an exception" },
      },
      {
        title: "Resolve or escalate — never leave exceptions in limbo",
        description: "Every exception should end in one of two states: Resolved (you fixed it or the automation fixed it) or Escalated (you pushed it to someone with more authority). An exception sitting in 'open' for 3+ days is a red flag — either nobody's looking at the queue or nobody knows what to do. Both are problems.",
        screenshot: { src: "/academy/ops-exceptions.png", alt: "Exception with resolve/escalate action buttons" },
      },
    ],
  },
  {
    id: "common-types",
    title: "Common Exception Types and What They Actually Mean",
    type: "text",
    content: `The platform uses the following exception types (these are the actual system values):

window_at_risk — A job's service window is in danger of being missed. Triage immediately: check if the provider is on their way, running late, or unreachable. This is a same-day fire.

service_week_at_risk — A customer's scheduled service for the week hasn't been completed and time is running short. Check if a reschedule is still feasible before the week closes.

provider_overload — A provider has been assigned more visits than their capacity allows. Review their schedule and redistribute before the day locks. Overloaded providers are a no-show risk.

coverage_break — A zone has a service gap: a day or period where no providers are available to cover demand. Requires either provider redistribution or customer notification.

provider_unavailable — A provider marked themselves unavailable (or the system detected unavailability) after jobs were already assigned. Triggers reassignment to backup provider.

access_failure — The provider couldn't access the property: locked gate, no-entry note, dog in yard, customer didn't answer. Check proof photos and customer notes, then decide: reschedule or contact customer for access instructions.

customer_reschedule — A customer requested a reschedule. Appears as an exception when the reschedule affects a locked-window job or creates a coverage conflict. Confirm the new time and update the provider's route.

weather_safety — Outdoor work was flagged unsafe due to weather conditions. Verify whether weather mode has been activated for the zone, and check if indoor components of the visit can still proceed.

quality_block — A job or provider has been flagged for quality review before the next service can proceed. Review the proof photos and any customer complaints before clearing. Don't let quality blocks age — they delay the next service cycle.

NOTE ON PAYMENT EXCEPTIONS: Failed payment exceptions (Stripe charge failures) are handled through the billing dunning flow, not the exception queue. Steps 1–2 (auto-retry + email on Day 0 and Day 3) are fully automated. Only intervene at step 3+ (Day 7) or if the customer reaches out directly.`,
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
    content: `The Exception Analytics page (at Admin → Ops → Exception Analytics, or via the Execution section in the sidebar) shows you trends over time. Note: the Ops Cockpit doesn't link directly to this page — navigate via the sidebar menu. This is where exception management turns from reactive firefighting into proactive process improvement.

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
