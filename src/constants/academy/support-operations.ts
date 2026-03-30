import type { TrainingSection } from "@/components/academy/AcademySection";

export const supportOperationsSections: TrainingSection[] = [
  {
    id: "overview",
    title: "How Support Works in Handled Home",
    type: "overview",
    content: `Support isn't a department — it's a feedback loop. Every ticket is data about what's working and what isn't. The three support pages work together:

• Tickets — Your inbox. Browse, triage, and respond to customer and provider issues.
• Policies — SLA definitions and escalation rules. How fast you must respond, and what happens when you don't.
• Macros — Template responses for common situations. They save time and ensure consistency.

The most important thing to understand: support tickets and job exceptions are related but different. A job exception is system-detected ("provider didn't check in"). A support ticket is human-initiated ("I'd like to report a problem"). Sometimes a customer creates a ticket about an issue that's already in the exception queue. Check both before responding.`,
  },
  {
    id: "triage",
    title: "Ticket Triage — The Priority Matrix",
    type: "walkthrough",
    steps: [
      {
        title: "Check the SLA timer first",
        description: "Every ticket has an SLA based on its priority. High priority: respond within 1 hour. Medium: 4 hours. Low: 24 hours. The timer starts when the customer submits. If you're near a breach, that ticket jumps the queue regardless of everything else. SLA breaches are tracked and affect operational metrics.",
        screenshot: { alt: "Ticket list with SLA timers showing time remaining" },
      },
      {
        title: "Read the customer's service history BEFORE replying",
        description: "This is non-negotiable. Click through to the customer's profile and check their last 5 completed jobs. Half the time, the answer to their complaint is visible in the proof photos from their last service. A customer saying 'my lawn wasn't mowed' when you have before/after photos from yesterday changes your response entirely.",
        screenshot: { alt: "Customer service history showing recent completed jobs" },
      },
      {
        title: "Apply a macro, then personalize",
        description: "Macros give you a solid starting point. But never send a macro verbatim without personalizing it. Add the customer's name, reference the specific service, acknowledge the specific issue. A template that says 'We're sorry for the inconvenience' is generic. 'We're sorry your Tuesday lawn mowing didn't include edging, Sarah' is human.",
        screenshot: { alt: "Macro selection with personalization" },
      },
      {
        title: "Resolve with a clear next action",
        description: "Every ticket resolution should include what you did and what happens next. 'I've credited your account $15 and scheduled a follow-up mowing for Friday' is a resolution. 'We'll look into it' is not.",
        screenshot: { alt: "Ticket resolution with action taken" },
      },
    ],
  },
  {
    id: "pro-tips",
    title: "Pro Tips from Veteran Operators",
    type: "pro-tips",
    proTips: [
      {
        text: "Read the customer's service history before replying to their ticket. Half the time, the answer to their complaint is visible in their last 3 completed jobs.",
        context: "Context is king in support. A 2-minute history check saves a 20-minute investigation.",
      },
      {
        text: "Macros should feel human, not robotic. The best macros have [brackets] where you insert specific details. A macro that reads like a form letter damages trust more than a late response.",
        context: "Customers can smell a canned response from a mile away.",
      },
      {
        text: "When a customer is angry, match their urgency but not their emotion. 'I understand this is frustrating — let me fix this right now' is better than either 'I'm so sorry!' (too emotional) or 'Per our policy...' (too cold).",
      },
      {
        text: "Track repeat callers. A customer who opens a ticket every month has a systemic problem — maybe their provider is consistently underperforming, or their property needs a higher service level. Solving the root cause eliminates future tickets.",
      },
      {
        text: "Support macros should have a review date. Revisit every macro quarterly. Policies change, product features change, and a macro written 6 months ago might reference things that no longer exist or miss new options that would help the customer.",
      },
    ],
  },
  {
    id: "watch-outs",
    title: "Watch Out For...",
    type: "watch-outs",
    watchOuts: [
      {
        text: "Never promise a specific provider or time slot in a support response. 'We'll send the same provider tomorrow at 10am' might be impossible if that provider is fully booked. Promise outcomes: 'We'll have your lawn mowed by end of day Friday.' Let scheduling handle the logistics.",
        severity: "critical",
      },
      {
        text: "Escalating a ticket doesn't resolve it — it reassigns responsibility. If you escalate, include all the context you gathered so the next person doesn't start from scratch. A bare escalation wastes more time than handling it yourself.",
        severity: "caution",
      },
      {
        text: "Credits and refunds are not the same thing. A credit applies to the customer's next invoice. A refund returns money to their payment method. Credits are reversible; refunds are not. Default to credits unless the customer specifically requests a refund or is canceling.",
        severity: "caution",
      },
    ],
  },
  {
    id: "automation",
    title: "What's Automated vs. What Needs Your Eyes",
    type: "automation",
    automationNotes: [
      {
        text: "SLA timers start automatically when a ticket is created. Breach notifications are automatic. But the actual response is always manual — there's no auto-reply. Customers deserve a human response.",
        type: "daily-check",
      },
      {
        text: "Ticket assignment is manual (claim-based). When you claim a ticket, it's yours. Other operators see it's claimed and move on. Don't claim tickets you can't handle today.",
        type: "daily-check",
      },
      {
        text: "Support policy SLA thresholds are configured once and enforce automatically. Review them quarterly to ensure they still match your team's capacity.",
        type: "weekly-check",
      },
    ],
  },
];
