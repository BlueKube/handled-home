import type { TrainingSection } from "@/components/academy/AcademySection";

export const customerBillingSections: TrainingSection[] = [
  {
    id: "overview",
    title: "How Customer Billing Works (The Big Picture)",
    type: "overview",
    content: `Billing is the financial contract between you and the customer. It runs automatically, but it breaks in predictable ways — and when it breaks, customers notice immediately. Your job is not to run billing; your job is to catch failures before customers do and resolve them fast.

Every customer account moves through a lifecycle:

TRIAL — New customers start here. No charge yet. They're evaluating whether the service is worth keeping. Your activation rate out of trial is a key metric.

ACTIVE — Billing is running. Subscription renews on their cycle (monthly or annual). This is the healthy state.

PAST DUE — A payment attempt failed. The dunning ladder has started. The customer may or may not know yet. Every day in past-due increases churn risk.

PAUSED — Customer-requested or system-generated pause. Service is suspended. No charges running. A pause is better than a cancellation — it means the customer intends to come back.

CANCELED — Subscription ended. Service stops. Once canceled, reactivation requires the customer to go through the full signup flow again.

The billing engine runs nightly. Renewals, dunning retries, and status transitions all happen overnight. By morning, the dashboard reflects last night's run. The first thing you should check any morning is: did billing run? (Cron Health tells you this.)

Understanding the ledger is the other half. Every credit, refund, charge, and adjustment is a ledger entry. The ledger doesn't lie — when you have a billing dispute, the ledger is the ground truth.`,
  },
  {
    id: "billing-dashboard",
    title: "Reading the Billing Dashboard",
    type: "walkthrough",
    steps: [
      {
        title: "Check the top-line revenue numbers first",
        description: "Revenue Today, Revenue MTD, and Revenue Rolling 30 tell you if billing is running. If Revenue Today is $0 on any day except Sunday and you're past 8am, billing didn't run — go to Cron Health immediately. MTD vs. last month comparison tells you if you're growing or shrinking. Don't mistake a weekend dip for a problem.",
        screenshot: { alt: "Billing dashboard top-line revenue metrics" },
      },
      {
        title: "Look at failed payments and past-due accounts",
        description: "Failed Payments shows today's retry failures. Past Due Accounts shows the total count in the dunning ladder. If Failed Payments spikes suddenly (10+ in one day), check Stripe's status page before investigating individual accounts — a Stripe outage can fail 50+ payments simultaneously. That's one infrastructure problem, not 50 customer problems.",
        screenshot: { alt: "Billing dashboard failed payments and past-due metrics" },
      },
      {
        title: "Read the subscription distribution chart",
        description: "This chart shows how your subscriber base is distributed across plan tiers (Essential, Standard, Premium). The distribution tells you about your revenue concentration risk. If 60% of revenue is in one tier, a price sensitivity issue in that tier is a company-wide problem. Healthy spread means a single pricing decision doesn't crater the whole book.",
        screenshot: { alt: "Subscription distribution chart by tier" },
      },
      {
        title: "Check the billing cycle health indicator",
        description: "The billing cycle health indicator shows the last successful cron run, next scheduled run, and any failure flags. Green = last run succeeded. Yellow = run succeeded but with warnings (partial failures). Red = run failed entirely. If you see red, everything downstream — dunning, status transitions, revenue reporting — is stale.",
        screenshot: { alt: "Billing cycle health indicator" },
      },
      {
        title: "Review the MRR trend",
        description: "Monthly Recurring Revenue trend over the last 90 days is your business health chart. Consistent upward slope is the goal. A flat line means churn is eating your new activations. A dip means churn accelerated or you paused growth. Investigate the cause before you try to fix the symptom.",
        screenshot: { alt: "MRR trend chart on billing dashboard" },
      },
    ],
  },
  {
    id: "investigate-past-due",
    title: "Investigating a Past-Due Account (Step-by-Step)",
    type: "walkthrough",
    steps: [
      {
        title: "Open the customer's billing ledger",
        description: "Go to Customers → find the account → click Billing tab. The ledger shows every charge attempt, success, failure, credit, and refund in reverse chronological order. The first entry tells you when billing started failing. How long have they been past due? 2 days is recoverable. 14 days with no response means they're likely churned already.",
        screenshot: { alt: "Customer billing ledger showing charge history" },
      },
      {
        title: "Check the dunning step",
        description: "The dunning ladder shows which step this account is on (1–5). Step 1 = first retry. Step 2 = second retry + email sent. Step 3 = third retry + email + SMS. Step 4 = fourth retry + escalation email. Step 5 = final notice before cancellation. If you're looking at a Step 3 or 4 account, the system has already been working on this — don't call the customer and ask them to 'check their card' if two emails and an SMS already went out.",
        screenshot: { alt: "Dunning step indicator on customer billing page" },
      },
      {
        title: "Check the payment method on file",
        description: "Look at the card details — is it expired? Wrong zip? Stripe often provides a decline code (insufficient_funds, do_not_honor, expired_card, etc.). These codes tell you whether it's a card problem the customer can fix, or a bank-level block that needs a different payment method entirely. 'Insufficient funds' is sensitive — don't reference it explicitly if you call the customer.",
        screenshot: { alt: "Payment method details with Stripe decline code" },
      },
      {
        title: "Check the customer's service history before acting",
        description: "Before you issue any credits or make accommodation calls, look at the customer's service record. How long have they been a customer? Any recent complaints? Any recent jobs that didn't go well? A customer with 3 support issues in 60 days who is now past-due may be engineering a billing dispute. A customer with 2 years of clean history and one missed payment almost certainly had a banking issue. These situations require completely different responses.",
        screenshot: { alt: "Customer service history and issue log" },
      },
      {
        title: "Decide on the appropriate intervention",
        description: "If it's a card issue they can fix: update the payment method in Stripe and trigger a manual retry. If it's a hardship case (long-time customer, good history): consider a short pause. If it's a dispute pattern: escalate for review before any financial accommodation. If it's a Stripe-side technical failure: file it as an ops incident and retry immediately — no customer contact needed.",
        screenshot: { alt: "Billing intervention options on customer account" },
      },
    ],
  },
  {
    id: "credits-vs-refunds",
    title: "When to Issue Credits vs. Refunds",
    type: "text",
    content: `Credits and refunds are not the same thing. Using the wrong one creates accounting problems and sets bad precedent.

CREDITS — Apply against future charges. The money stays with the platform. Use credits when:
• A job had a quality issue and the customer is staying (service recovery)
• You over-billed due to a system error and the customer is on an active subscription
• You're offering a goodwill gesture for an inconvenience (provider ran late, had to reschedule)
• The customer has unused service they couldn't use due to a platform issue

Credits are generally preferred for active customers because they keep the revenue cycle intact while resolving the immediate complaint.

REFUNDS — Return cash to the customer's payment method. Use refunds when:
• A job was charged but never completed (no-show, provider canceled)
• A customer was double-charged (billing error)
• A customer is canceling and there's a prepaid balance with no service rendered
• A customer requests a refund by name and has legitimate grounds

Refunds take 5–10 business days to appear on the customer's statement. Always tell them the timeline. A customer who doesn't know when to expect the refund will call back twice.

NEVER issue either without:
1. Confirming the underlying issue actually occurred (check the job record, the proof, the logs)
2. Documenting the reason in the ledger note field
3. Checking the customer's history first (see the pro tip below)

One more thing: credits and refunds are irreversible once processed. Double-check the amount before you confirm. A $29 credit issued as $290 is a problem.`,
  },
  {
    id: "dunning-ladder",
    title: "The Dunning Ladder — 5-Step Automatic Escalation",
    type: "text",
    content: `The dunning ladder is the automated system that handles failed payments without human intervention for the first four steps. Here's exactly what happens and when.

STEP 1 — Immediate retry (Day 0)
Payment fails → system retries within 24 hours using a different payment processor routing. No customer notification yet. Most recoverable failures (temporary bank holds, network issues) clear here.

STEP 2 — Second retry + email (Day 3)
Second retry attempt. If it fails, the system sends an automated email: "We had trouble processing your payment — please update your payment method." Friendly tone, no alarm. Includes a direct link to update the card.

STEP 3 — Third retry + email + SMS (Day 7)
Third retry. If failed, email + SMS go out. Tone escalates slightly: "Your account is past due — service may be paused." At this point the customer has been notified three times. If they haven't responded, they either don't want to pay or can't access their account.

STEP 4 — Fourth retry + escalation email (Day 14)
Fourth retry. Escalation email: "Final notice — your account will be canceled in 7 days without payment." This is the last automated escalation before termination. Some customers respond here because the cancellation threat is credible.

STEP 5 — Final retry + cancellation trigger (Day 21)
Fifth and final retry. If it fails, the account transitions to CANCELED automatically. Service stops. The system logs the cancellation reason as "non-payment."

Human involvement is appropriate starting at Step 3 — particularly for high-value accounts (annual plans, Premium tier, long-tenure customers). A single personal email or call at Step 3 recovers 30-40% of accounts that the automation alone would lose.

Do not manually intervene at Steps 1-2. The automation is handling it. Interrupting the dunning flow with an uncoordinated manual outreach confuses customers and creates parallel communication threads.`,
  },
  {
    id: "ledger-deep-dive",
    title: "Customer Ledger Deep Dive",
    type: "walkthrough",
    steps: [
      {
        title: "Understand ledger entry types",
        description: "Every row is one of: CHARGE (subscription renewal), RETRY (dunning attempt), CREDIT (issued by admin), REFUND (returned to card), ADJUSTMENT (admin correction), or DISPUTE (Stripe chargeback). The type column tells you what happened. The amount column tells you the financial impact. Negative amounts are money leaving the platform.",
        screenshot: { alt: "Customer ledger with entry types labeled" },
      },
      {
        title: "Read the timeline to understand what happened",
        description: "Sort the ledger oldest-to-newest when debugging a specific issue. You want to see the sequence: successful charge → retry → retry → credit? Or: charge → dispute? The sequence tells you the story. A dispute right after a service issue usually means a customer bypassed you and went straight to their bank — that's a relationship failure as much as a billing failure.",
        screenshot: { alt: "Customer ledger sorted chronologically" },
      },
      {
        title: "Look at the note field on credits and adjustments",
        description: "Every credit and adjustment should have an admin note explaining why it was issued. If you're looking at a credit with no note, someone on the team issued it without documentation. This is a process failure. You can't evaluate whether the credit was justified without knowing the reason — and you can't hold the line on policy if there's no accountability trail.",
        screenshot: { alt: "Ledger credit entry with admin note field" },
      },
      {
        title: "Flag chargebacks immediately",
        description: "A DISPUTE entry means the customer filed a chargeback with their bank. You have a narrow window to respond to Stripe with evidence — typically 7–21 days depending on card network and dispute type, but always treat the Stripe notification date as day zero and act within the first 7 days to be safe. Pull the job record, proof photos, communication history, and service log. Document everything. Uncontested chargebacks cost you the dispute amount plus a Stripe dispute fee (~$15). More importantly, a pattern of chargebacks can trigger Stripe account review.",
        screenshot: { alt: "Dispute entry in ledger with response deadline" },
      },
    ],
  },
  {
    id: "pro-tips",
    title: "Pro Tips from Veteran Operators",
    type: "pro-tips",
    proTips: [
      {
        text: "Never issue a credit without checking the customer's service history first. If they've had 3 issues in 2 months, the problem isn't billing — it's service quality.",
        context: "Credits issued without root cause analysis don't fix anything. They just delay the churn and add cost.",
      },
      {
        text: "When Failed Payments spikes in the dashboard, check Stripe's status page before you start investigating individual accounts. A single Stripe incident can fail 50 payments at once — that's one infrastructure problem, not 50 customer calls.",
        context: "stripe.com/status — bookmark it. Takes 5 seconds to rule out a platform-wide issue.",
      },
      {
        text: "The dunning ladder steps 1–2 are fully automated. Do not call customers about a payment failure until they're at Step 3 or higher. Uncoordinated early outreach confuses customers who are about to get an automated email and creates two parallel communication threads.",
        context: "Let the system work. Human time is expensive. Reserve it for accounts that automation couldn't recover.",
      },
      {
        text: "Annual plan customers who hit past-due status need immediate personal outreach — don't let them sit in the dunning ladder. They paid for a full year, they have a relationship with the platform. A 2-minute personal email recovers more annual customers than three automated dunning steps.",
        context: "The lifetime value of an annual customer is 3-4x a monthly customer. They deserve faster, higher-touch handling.",
      },
      {
        text: "A credit issued with no ledger note is worthless for future ops. You won't remember why you issued it in 30 days. Your teammate won't know if the reason was legitimate. Always write the reason — even one sentence. 'Provider no-show on 3/12, customer requested credit' is enough.",
        context: "The ledger is your audit trail. Undocumented credits create compliance and policy enforcement problems.",
      },
    ],
  },
  {
    id: "watch-outs",
    title: "Watch Out For...",
    type: "watch-outs",
    watchOuts: [
      {
        text: "Don't confuse a 'paused' account with a resolved past-due account. A pause stops service but doesn't clear the outstanding balance. When the account resumes, the past-due amount is still owed. Check both the pause status and the ledger balance before considering a billing issue resolved.",
        severity: "caution",
      },
      {
        text: "Chargebacks are time-sensitive. A DISPUTE entry in the ledger triggers a 7-day response window with Stripe. If you see a dispute and do nothing, you automatically lose the amount plus the $15 dispute fee. Build a habit of checking the billing dashboard for dispute entries every morning — not weekly.",
        severity: "critical",
      },
      {
        text: "Refunds on annual subscriptions require careful calculation. If a customer cancels mid-year on an annual plan, the refundable amount depends on your refund policy and how many months of service they consumed. Issuing a full refund on a 10-month-used annual plan is an expensive mistake. Always calculate the pro-rated amount before processing.",
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
        text: "Billing cycle runs nightly via cron — monthly and annual renewals are charged automatically. You don't trigger it. You verify it ran via Cron Health every morning.",
        type: "daily-check",
      },
      {
        text: "Dunning retries (Steps 1–4) run automatically on their scheduled cadence. Customer emails and SMS at each step are automated. You do not need to manually trigger retries — but you should monitor Step 3+ accounts for high-value customers who need personal outreach.",
        type: "set-and-forget",
      },
      {
        text: "Subscription status transitions (active → past due → canceled) happen automatically based on dunning outcomes. A Step 5 failure automatically cancels the account. Review canceled accounts weekly to identify reactivation opportunities.",
        type: "weekly-check",
      },
      {
        text: "Credits and refunds are never automated — they always require a human decision. If you see an unexpected credit in a ledger, someone on your team issued it. Track down the reason. Unexplained credits are a sign of a process breakdown.",
        type: "daily-check",
      },
    ],
  },
  {
    id: "household-members",
    title: "Household Members",
    type: "text",
    content: `Customers can invite household members (spouses, partners, family) to share access to their property's services.

HOW IT WORKS
• The property owner invites members by email via Settings → Household
• A pending row is created in the household_members table
• When the invitee logs in or signs up, the system auto-accepts the invite (matching by email)
• Members can view services, schedule, and service history
• Only the owner can manage billing, cancel subscriptions, or manage other members

WHAT ADMINS SHOULD KNOW
• Household membership doesn't create a separate subscription — members share the owner's subscription
• If a household member contacts support, check which property they're linked to via household_members
• Removing a member only soft-deletes (status → 'removed') — the history is preserved
• The owner row is auto-created when a property is added and cannot be removed`,
  },
  {
    id: "moving-wizard",
    title: "Customer Moving & Address Transfers",
    type: "text",
    content: `When a customer moves, the system guides them through a 4-step moving wizard instead of a simple cancellation. This is designed to retain customers and capture new homeowner leads.

THE MOVING WIZARD (/customer/moving)
• Step 1: Move date + "Keep services until move date?" toggle
• Step 2: New address + ZIP → automatic zone coverage check
• Step 3: Coverage result — if covered, "We'll transfer your plan!" If not, "We'll notify you when we launch"
• Step 4: "Know who's buying your home?" — captures new homeowner contact info

CANCEL FLOW INTERCEPT
When a customer selects "Moving to a new area" as their cancel reason, they're redirected to the moving wizard instead of the cancellation flow. There's also an "I'm moving" card in Settings.

AUTO-CANCEL ON MOVE DATE
A daily cron function (process_move_date_transitions) checks for transitions where move_date has arrived and automatically sets the subscription to cancel_at_period_end. The customer isn't billed after their move date.

NEW HOMEOWNER HANDOFF
When a customer provides the new homeowner's contact info, the system creates a customer_lead with source='referral' for the new homeowner. The process-new-homeowner-handoff edge function processes these. This is the highest-value lead type — it's a specific person at a known address with an existing service history.

CUSTOMER LEADS FOR UNCOVERED ZONES
If the customer's new ZIP isn't in an active zone, they're saved as a customer_lead with notify_on_launch=true. When that zone eventually launches, they're auto-notified — same trigger pattern as provider leads.`,
  },
  {
    id: "real-world",
    title: "Real-World Context",
    type: "real-world",
    realWorldData: [
      {
        text: "Average house cleaning costs $175/visit nationally ($118–$237 range). Bi-weekly cleaning represents $350–$474/month in value. Bundled subscription pricing at $129–$279/month represents genuine savings while covering provider costs. The subscription spread model means the difference between what customers pay monthly and what providers earn per job is your margin.",
        source: "Angi, This Old House consumer cost guides (2025)",
      },
      {
        text: "In subscription businesses, failed payment recovery is one of the highest-ROI operations activities. Industry benchmarks show that companies with active dunning strategies recover 20–40% of failed payments that would otherwise churn. The difference between a 2-step and 5-step dunning ladder can be 15–20 additional customers retained per 100 failures.",
        source: "Paddle, Chargebee dunning benchmarks (2025)",
      },
      {
        text: "Chargeback rates above 0.9% trigger Stripe's monitoring program. Above 1.5% risks account suspension. For context, most healthy subscription businesses run at 0.1–0.3%. A single wave of uncontested chargebacks — especially from customers who were in the dunning ladder — can push you into Stripe's warning zone quickly.",
        source: "Stripe chargeback documentation, Visa dispute thresholds (2025)",
      },
    ],
  },
];
