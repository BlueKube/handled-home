import type { TrainingSection } from "@/components/academy/AcademySection";

export const controlRoomSections: TrainingSection[] = [
  {
    id: "overview",
    title: "The Control Room — Power Tools with Guardrails",
    type: "overview",
    content: `The Control Room is restricted to superuser role for a reason: changes here have immediate, broad financial impact. A pricing change affects every customer in a zone within 24 hours. A payout rule change affects every provider's next paycheck. There are no undo buttons — only rollbacks via the change request system.

Five pages make up the Control Room:

• Pricing & Margin — Base SKU pricing, zone-specific overrides, multipliers
• Payout Rules — Provider payout schedules, minimum thresholds, per-type rules
• Change Requests — Review and approve/reject pending control room changes
• Change Log — Immutable audit trail of every control room action
• System Configuration — Incentive caps, algorithm parameters (quality score weights, assignment competition), and policy guardrails (dunning max steps, probation/suspension score thresholds)

The change request workflow is the guardrail. Any pricing or payout change can require a second reviewer before it takes effect. This isn't bureaucracy — it's the only thing between you and a mass billing error.`,
  },
  {
    id: "pricing",
    title: "Pricing & Margin — Where the Money Math Lives",
    type: "walkthrough",
    steps: [
      {
        title: "Understand the pricing hierarchy",
        description: "Base price (per SKU, platform-wide) → Zone override (specific to a zone, either absolute price or multiplier) → Effective price (what the customer actually pays). If a zone has no override, the base price applies. If it has a 1.15x multiplier, everything in that zone costs 15% more. This lets you charge more in high-cost markets without changing base prices.",
        screenshot: { alt: "Pricing hierarchy showing base → zone override → effective" },
      },
      {
        title: "Check the Change Log before making any change",
        description: "Before you touch pricing, check what was changed recently. The last person who changed lawn care pricing without checking the log accidentally reverted a zone-specific override that took 3 support tickets to diagnose. 30 seconds of checking prevents hours of cleanup.",
        screenshot: { alt: "Change Log showing recent pricing modifications" },
      },
      {
        title: "Use multipliers over absolute overrides when possible",
        description: "If you raise the base price by 5%, every zone with a multiplier automatically adjusts. But zones with absolute overrides don't change — they're frozen at whatever was set. This means a mix of multipliers and absolutes creates pricing drift over time. Prefer multipliers for regional cost adjustments; use absolutes only when a zone needs a completely different price point.",
        screenshot: { alt: "Zone override configuration showing multiplier vs absolute" },
      },
      {
        title: "Always include an audit reason",
        description: "Every pricing change requires a reason. 'Adjusting for market conditions' is useless. 'Increasing lawn base price from $45 to $52 to maintain 30% margin after provider rate increase effective April 1' is what the next person needs to understand your change. Write reasons for the person who has to reverse your change at 2am.",
        screenshot: { alt: "Pricing change form with audit reason field" },
      },
    ],
  },
  {
    id: "payouts",
    title: "Payout Rules — Provider Economics",
    type: "text",
    content: `Payout rules determine how and when providers get paid. The system supports:

PAYOUT SCHEDULE
Default is weekly (Fridays). This means: job completed Monday → earning recorded → hold period → hold released → included in Friday's payout run. The entire cycle is typically 5-10 days from job completion to payment.

MINIMUM THRESHOLD
The minimum amount before a payout is issued. Default is typically $25-50. Below the threshold, the balance rolls over to the next payout cycle. This prevents $2 payouts that cost more in transaction fees than they're worth.

HOLD PERIOD
Earnings from completed jobs are held for a configurable period (typically 48-72 hours) before being released for payout. This gives you time to catch quality issues, customer disputes, or proof compliance problems before money leaves the platform.

WHY PAYOUT CONFIGURATION MATTERS

Provider payout is the #1 economic lever. The $45–$65/job provider payout range for lawn care (not the customer-facing price, which is higher) is where the negotiation happens. Too low and providers leave. Too high and your margin disappears. The right number depends on your market: a provider in Austin ($45/job) has lower cost of living than one in San Francisco (where $65 might be the floor).

Providers who see consistent, predictable weekly payouts are significantly more likely to stay on the platform. Unpredictable or delayed payments are the #1 reason providers leave any gig platform. The payout configuration should prioritize reliability over optimization.`,
  },
  {
    id: "change-requests",
    title: "The Change Request Workflow",
    type: "text",
    content: `When enabled, control room changes go through a request → review → approve/reject workflow:

1. An admin proposes a change (e.g., "increase base lawn price from $45 to $52")
2. The change enters 'pending' state — it does NOT take effect yet
3. A different admin (the reviewer) sees the pending request with full details
4. The reviewer approves (change takes effect immediately) or rejects (with reason)

WHEN TO USE CHANGE REQUESTS
- Any pricing change in a live zone
- Any payout rule change
- Any change that affects more than 10 customers

WHEN YOU CAN SKIP (direct change)
- Initial zone setup before launch
- Correcting an obvious error within 1 hour of the original change
- Emergency pricing correction with documented justification

The Change Log records everything regardless of whether the change request workflow was used. This is your immutable audit trail — even direct changes are logged.`,
  },
  {
    id: "pro-tips",
    title: "Pro Tips from Veteran Operators",
    type: "pro-tips",
    proTips: [
      {
        text: "The Control Room exists because a single pricing mistake affects every customer in a zone within 24 hours. The change request workflow isn't bureaucracy — it's the only thing between you and a mass billing error.",
        context: "One wrong decimal point on a price change can generate hundreds of incorrect invoices overnight.",
      },
      {
        text: "When adjusting pricing, change one variable at a time. Don't increase the base price AND add a zone multiplier in the same session. If something goes wrong, you won't know which change caused it.",
        context: "Controlled experiments work in pricing just like they do in science.",
      },
      {
        text: "Review the Change Log weekly even if you didn't make any changes. Other admins might have made changes you should know about. The log is the source of truth for 'what's our current pricing configuration?'",
      },
      {
        text: "Provider payout rules should be communicated to providers BEFORE they take effect. A provider who discovers their per-job rate changed via their payout statement has already lost trust. An email a week in advance ('Starting April 1, we're adjusting the lawn care rate to reflect market conditions') preserves the relationship.",
      },
    ],
  },
  {
    id: "watch-outs",
    title: "Watch Out For...",
    type: "watch-outs",
    watchOuts: [
      {
        text: "Never make pricing changes on a Friday. Changes take effect immediately, and billing runs overnight. A Friday afternoon change means Saturday morning invoices reflect the new price — with no one in the office to handle complaints. Make pricing changes Monday-Wednesday.",
        severity: "critical",
      },
      {
        text: "Zone-specific absolute price overrides don't change when you update the base price. If Zone A has a $55 absolute override and you increase the base from $45 to $52, Zone A stays at $55. Over time, this creates pricing inconsistencies that are hard to audit. Prefer multipliers.",
        severity: "caution",
      },
      {
        text: "The rollback feature reverses a specific change, but it doesn't undo cascading effects. If you changed pricing on Monday and billing ran Tuesday-Thursday, rolling back on Friday changes future billing but doesn't refund the 3 days of incorrect charges. Those need manual adjustment.",
        severity: "critical",
      },
    ],
  },
  {
    id: "automation",
    title: "What's Automated vs. What Needs Your Eyes",
    type: "automation",
    automationNotes: [
      {
        text: "Price changes take effect immediately once approved. The next billing cycle uses the new price. No manual activation needed.",
        type: "set-and-forget",
      },
      {
        text: "Change request notifications are sent to reviewers automatically when a new request is submitted. But there's no deadline enforcement — check pending requests daily.",
        type: "daily-check",
      },
      {
        text: "The Change Log is append-only and cannot be modified or deleted. Every change is permanently recorded. Review it weekly to maintain awareness of all control room activity.",
        type: "weekly-check",
      },
    ],
  },
];
