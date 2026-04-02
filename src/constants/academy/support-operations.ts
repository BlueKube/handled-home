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
    id: "common-tickets",
    title: "Common Ticket Types and How to Handle Them",
    type: "text",
    content: `Not all tickets are created equal. The four types below account for the majority of your queue. Know the playbook for each cold — when a customer is upset is not the time to figure out the process.

**Service Quality Dispute**
The customer says work wasn't done properly. Before you respond, pull up the proof photos from that job. This single step changes your entire response.

If the photos show good work: share them directly with the customer. Walk through what was completed, reference the scope they purchased, and explain what was and wasn't included. Most complaints in this category are expectation gaps, not service failures — and photos close the gap instantly.

If the photos show an actual problem: don't hedge. Apologize clearly, issue a credit for the affected service, and schedule a redo. Customers who get a genuine "we got this wrong, here's how we're making it right" response almost never escalate further.

**Billing Complaint**
The customer is disputing a charge. Start by checking three things in order: the invoice details, their current subscription status, and whether a credit was already applied by a previous operator.

The two most common scenarios: the customer didn't realize their plan auto-renewed (show them the renewal date and the confirmation email they would have received), or they were charged after requesting a cancellation (check the cancellation request date vs. the charge date — if a charge hit after a valid cancellation request, issue a refund, not a credit). Always verify before assuming either direction.

**Cancellation Request**
The customer wants to cancel. Before you process anything, check their remaining contract terms — some plans have early-termination clauses that affect what you can offer.

Offer to address the underlying issue first. Most cancellation requests have a stated reason, and if you can solve that reason — wrong provider, wrong service day, billing issue — many customers will stay. Don't be pushy, but one genuine offer to fix the problem is the right move.

If they still want to cancel after your offer, process it without friction. Customers who are made to fight to leave leave angry and leave reviews. Customers who cancel cleanly sometimes come back.

One more thing: log the cancellation reason every time, not just when the system requires it. Cancellation reasons are your best product feedback. A pattern of "provider always late" is something the operations team needs to see — it won't surface unless you're recording it consistently.

**Provider Complaint**
The customer is unhappy with a specific provider. Before responding, pull the provider's recent quality scores and check whether other complaints have come in on the same provider.

If this looks like an isolated incident: apologize to the customer, offer to assign a different provider for their next service, and make a note on the provider's record. One bad day doesn't make a bad provider, but it should be documented.

If you see a pattern in the quality scores or a cluster of recent complaints: escalate to provider management for a performance review. Don't make promises to the customer about what will happen on the provider side — just confirm that you're taking it seriously and that their next service will be handled carefully.`,
  },
  {
    id: "macros-guide",
    title: "The Macro Library — Your Starting Templates",
    type: "text",
    content: `Macros exist to give you a consistent, well-worded starting point — not to replace judgment or human contact. Used correctly, they cut your average handle time in half while raising response quality. Used incorrectly (sent verbatim, without thought), they make customers feel like a ticket number.

**What categories exist in the macro library**

The library is organized into four buckets that cover the vast majority of support situations:

- *Service issue acknowledgment* — Opening responses to quality complaints. Sets the right tone, acknowledges the problem, and promises a specific follow-up.
- *Billing adjustment confirmation* — Used after you've applied a credit or issued a refund. Confirms the amount, where it applies, and when the customer will see it.
- *Scheduling change notification* — When a job is rescheduled, either proactively or as part of resolving a complaint. Always includes the new date and a contact path if the time doesn't work.
- *Cancellation confirmation* — Sent after a cancellation is processed. Clean, professional, no guilt-tripping. Includes what they'll no longer be charged for and when billing stops.

**The golden rule: never send a macro verbatim**

Every macro has gaps that require real information. At minimum, fill in the customer's name, the specific service being discussed, and the specific date. A macro that still says "[SERVICE_TYPE]" when it arrives in the customer's inbox is worse than no macro at all — it signals that you didn't read their ticket.

Go one step further when the situation calls for it. If a customer included a specific detail in their complaint — the provider's name, something they observed, a day they mentioned — acknowledge it. That acknowledgment is what makes a templated response feel like a human one.

**When to write a new macro**

If you find yourself typing the same response three or more times in a single week, that's a macro waiting to happen. Flag it to your team lead or draft it yourself and submit it for review. A macro written by someone actively handling tickets is better than one written in a vacuum — it reflects how customers actually describe the problem.

**Quarterly macro review**

Macros have a shelf life. Policies change. Product features get renamed or retired. A macro that was accurate six months ago might reference a fee structure that no longer exists or miss a new resolution option that would have been the right answer. Build a quarterly review into your calendar — even a 30-minute pass through the full library catches the worst offenders before they go out to customers.`,
  },
  {
    id: "provider-tickets",
    title: "Provider-Side Support",
    type: "text",
    content: `Customers aren't the only ones who need support. Providers run into problems too — and those problems, left unresolved, become customer problems within a day or two. Treat provider tickets with the same SLA urgency you give customer tickets.

**What providers typically bring to the queue**

- *Payout questions* — "I haven't received payment for last week's jobs." Before responding to any payout question, pull up the batch report for the relevant pay period. The answer is almost always in there — jobs completed, jobs excluded, adjustments applied. Never speculate on a payout figure. If the batch report shows something unexpected, document what you found and escalate with specifics. For a detailed walkthrough of how provider payouts are structured and calculated, reference the Provider Payouts module in this academy.
- *Route complaints* — Provider says their route is inefficient, too spread out, or includes a job they can't service. Route complaints require operations involvement. Acknowledge the complaint, log the details, and route (no pun intended) to the scheduling team. Don't promise route changes you can't make unilaterally.
- *Equipment and access problems* — Provider can't access a property (gate code changed, key not at lockbox), or a customer's equipment isn't where it should be. These are often time-sensitive — if the provider is in the field right now, this is a live operational issue. Check the job record for access notes, contact the customer if needed, and update the provider immediately.

**Providers are part of your operation**

The temptation is to deprioritize provider tickets when the customer queue is full. Resist it. A provider who doesn't get a timely response to a payout question starts the next week distracted or disengaged. A provider who can't get access instructions while they're standing at a property gate doesn't complete the job. Both of those outcomes land in your customer ticket queue within 24 hours anyway — it's faster to handle the provider issue now.`,
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
    id: "household-support",
    title: "Household Members & Moving Customers",
    type: "text",
    content: `Two features affect how you handle customer support interactions:

HOUSEHOLD MEMBERS
Multiple users can be linked to one property. When a household member contacts support:
• Check which property they're linked to via household_members (visible in the customer's account)
• Members can view services but can't modify billing — if they request billing changes, direct them to the property owner
• The owner is the primary contact for billing disputes and cancellations
• Membership roles: owner (full access) and member (view only)

MOVING CUSTOMERS
When a customer moves, they go through a 4-step moving wizard that captures:
• Move date and whether to keep services until then
• New ZIP code (checked against zone coverage)
• New homeowner contact info (for warm handoff)

Support scenarios you may encounter:
• "I'm moving and want to cancel" → Direct them to Settings → "I'm moving" instead of cancellation. The wizard handles plan transfer or lead capture.
• "I moved but I'm still being charged" → Check property_transitions for their move date. If move_date has passed and status is still 'planned,' the daily cron may not have run. Manually cancel or escalate.
• "The new homeowner at my old address wants to sign up" → Check property_transitions for a new_owner_email. If present, the handoff function may have already created a customer_lead for them.
• "I moved to a new area — do you serve there?" → Check their property_transition for new_zip_covered. If true, their plan should transfer. If false, they're saved as a customer_lead and will be notified on zone launch.`,
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
      {
        text: "Household invite acceptance is automatic on login — when a user signs in, pending invites matching their email are auto-accepted. No support action needed unless the invite isn't appearing.",
        type: "set-and-forget",
      },
      {
        text: "Subscription auto-cancel on move date runs daily via cron. If a customer reports post-move billing, check if the cron processed their transition. Manual cancel is the fallback.",
        type: "daily-check",
      },
    ],
  },
];
