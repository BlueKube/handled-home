import type { TrainingSection } from "@/components/academy/AcademySection";

export const providerPayoutsSections: TrainingSection[] = [
  {
    id: "overview",
    title: "How Provider Payouts Work (The Big Picture)",
    type: "overview",
    content: `Payouts are the economic engine of the platform. If billing is the contract with customers, payouts are the contract with providers. Providers don't care about your platform's features — they care about one thing: getting paid reliably on time, every time. When that breaks, they leave. And when providers leave, you can't service customers.

Here's how money moves from a completed job to a provider's bank account:

JOB COMPLETION — Provider completes the job and submits proof (photos, checklist). Without proof, the job is not considered verified and earnings don't release.

EARNING CREATED — Once proof is verified (automatically, or manually reviewed if flagged), an earning is created on the provider's account. The earning reflects the job payout amount.

HOLD PERIOD — New earnings enter a hold period (typically 48–72 hours). This is a fraud and dispute buffer. If a customer reports a serious issue in that window, the earning can be adjusted before it moves to payable status.

RELEASE — After the hold period, the earning moves to "releasable" status and is included in the next payout batch.

PAYOUT — Every Friday, the payout engine collects all releasable earnings for each provider and initiates a transfer to their Stripe Connect account. The provider sees the funds in 1–2 business days depending on their bank.

Providers need to understand this timeline. Most friction comes from providers who expect instant payment — they complete a job on Tuesday and wonder why they don't see money on Wednesday. The weekly Friday cadence is by design, not a limitation.

The second most common source of friction: held earnings that don't release on schedule. When this happens, something upstream broke — usually a missing proof submission or a flagged job that needs manual review. Your job is to catch these before Friday.`,
  },
  {
    id: "payout-schedule",
    title: "Payout Schedule and Timing",
    type: "walkthrough",
    steps: [
      {
        title: "Understand the weekly Friday cadence",
        description: "Payouts run every Friday. The payout engine collects all earnings in 'releasable' status as of Thursday night and batches them for transfer. Providers with Stripe Connect accounts in good standing receive funds in 1–2 business days — typically by Monday or Tuesday the following week. This is the standard cadence and should be communicated clearly to every onboarding provider.",
        screenshot: { alt: "Provider payout schedule showing Friday processing" },
      },
      {
        title: "Check the payout batch before it runs",
        description: "By Wednesday afternoon, navigate to Providers → Payouts → Pending Batch. This shows you every provider included in Friday's payout run, their total payable amount, and any flags. If a provider has $0 in the pending batch and they completed jobs last week, something is wrong upstream. Fix it before Friday — not after.",
        screenshot: { alt: "Pending payout batch view showing provider amounts" },
      },
      {
        title: "Review the processed batch after it runs",
        description: "Friday evening or Saturday morning, check the processed batch report. Each provider should show a SUCCEEDED or FAILED status. SUCCEEDED means the transfer initiated. FAILED means Stripe rejected the transfer — usually a Connect account issue (not onboarded, deauthorized, or missing banking info). Failed payouts need same-day attention because the provider is expecting money.",
        screenshot: { alt: "Processed payout batch with success and failure indicators" },
      },
      {
        title: "Confirm the payout cron ran",
        description: "Check Cron Health after the Friday payout window closes. If the payout cron didn't run, no transfers were initiated — and providers won't know until they check their bank on Monday. Don't wait for providers to call you; catch it proactively. A missed payout cron that you catch Friday evening can still be manually triggered. A missed payout you discover Monday morning means providers already started calling.",
        screenshot: { alt: "Cron Health page showing payout job status" },
      },
    ],
  },
  {
    id: "payout-holds",
    title: "Payout Holds — Why They Exist and When to Release",
    type: "walkthrough",
    steps: [
      {
        title: "Understand the two types of holds",
        description: "SYSTEM HOLDS are automatic — all new earnings start here. They release automatically after the hold period (48–72 hours) if no issues are flagged. MANUAL HOLDS are placed by an admin, usually during a dispute or investigation. Manual holds don't release automatically — a human has to release them. Confusing the two is a common mistake. Check the hold type before deciding what to do.",
        screenshot: { alt: "Provider earning with hold type indicator" },
      },
      {
        title: "Investigate why a system hold isn't releasing",
        description: "If a system hold is past its release window (earning is older than 72 hours and still 'held'), check: 1) Is proof submitted? If not, the hold won't release until proof is in. 2) Was the job flagged for review? Check the job record for a quality flag or dispute. 3) Is the customer account in dispute? A chargeback on the customer side can pause earnings release on the provider side for the same job.",
        screenshot: { alt: "Earning detail showing hold reason and flags" },
      },
      {
        title: "Release a manual hold",
        description: "Navigate to the provider's earning record → click the hold entry → Review Hold → confirm the issue is resolved → Release. Write a note explaining why the hold was released and what was resolved. If you're releasing a hold on a disputed job, make sure the dispute is actually closed first — releasing earnings on an open dispute creates a financial exposure if the customer wins the chargeback later.",
        screenshot: { alt: "Hold release confirmation dialog with note field" },
      },
      {
        title: "Check for cascade: one hold blocking multiple earnings",
        description: "A single flagged job can create a hold on that earning, but in some cases a provider account can be placed in a broader review that holds all pending earnings. If you see a provider with 5+ held earnings all created on different dates, check for an account-level hold flag — not job-level flags. Account holds require escalation to resolve, not individual earning releases.",
        screenshot: { alt: "Provider account showing multiple held earnings" },
      },
    ],
  },
  {
    id: "minimums-rollover",
    title: "Minimum Thresholds and Rollover",
    type: "text",
    content: `Providers with earnings below the minimum payout threshold don't receive a transfer on that Friday — their balance rolls over to the following week.

The current minimum payout threshold is $25. A provider with $18 in releasable earnings on Thursday night doesn't get paid Friday. Their $18 carries forward to next week's batch.

This matters for a few reasons:

PROVIDER COMMUNICATION — New providers who just completed their first job often have earnings below threshold. They'll be confused when Friday comes and there's no transfer. Set expectations upfront during onboarding: minimum $25, rollovers accumulate, you'll always see it eventually.

BALANCE MONITORING — A provider whose balance keeps rolling over week after week is a signal. Either they're doing very few jobs (low-volume provider), or their earnings are consistently being held (upstream issue). Check both before assuming it's normal.

ROLLOVER LOGIC — Rolled-over earnings don't expire. They accumulate until the total exceeds the threshold, then they're included in the next eligible Friday batch. A provider with 3 weeks of sub-threshold earnings will see a single larger payout once the total clears $25.

ONE EXCEPTION — When a provider requests account deactivation, any remaining balance (regardless of threshold) is paid out in the final settlement run. A provider shouldn't lose money because they're leaving the platform.

The threshold exists to reduce Stripe transfer fees on micro-transactions. Below $25, the transfer fees represent a meaningful percentage of the payout amount, which reduces platform margin on already thin per-job economics.`,
  },
  {
    id: "stripe-connect",
    title: "Provider Payout Accounts (Stripe Connect)",
    type: "walkthrough",
    steps: [
      {
        title: "Understand Stripe Connect account types",
        description: "Every provider needs a Stripe Connect account to receive payouts. We use Standard accounts, which means providers have their own Stripe dashboard and full visibility into their transfers. When a provider is onboarded, they go through Stripe's identity verification flow. Until that flow is complete, payouts are blocked — earnings accumulate but don't transfer. This is the #1 reason for 'I'm not getting paid' calls from new providers.",
        screenshot: { alt: "Provider Stripe Connect status on provider detail page" },
      },
      {
        title: "Check onboarding status for a new provider",
        description: "Go to Providers → select provider → Payout Settings. The system shows whether the payout account is READY (fully onboarded, payouts enabled) or not yet connected. If a provider's payout account isn't showing as READY, they either haven't started the Stripe onboarding flow, are partway through identity verification, or their account has a restriction. If a provider hasn't completed setup within 48 hours of approval, reach out directly with the onboarding link.",
        screenshot: { alt: "Provider Stripe Connect onboarding status" },
      },
      {
        title: "Handle a restricted or problematic Connect account",
        description: "If Stripe has placed a restriction on a provider's Connect account — usually due to identity verification failure, unusual activity, or banking info mismatch — you cannot fix this directly. The provider needs to resolve it with Stripe via their own Connect dashboard. Your role: tell the provider what's happening, share the Stripe support link, and set expectations that resolution can take 2–5 business days. Monitor the provider's payout account status in their detail page until it shows READY again.",
        screenshot: { alt: "Restricted Stripe Connect account detail" },
      },
    ],
  },
  {
    id: "investigate-payout-failure",
    title: "Investigating a Payout Failure (Step-by-Step)",
    type: "walkthrough",
    steps: [
      {
        title: "Confirm it actually failed vs. still processing",
        description: "Before investigating, confirm the failure. Check the payout batch report for the relevant Friday. SUCCEEDED entries are done — the transfer initiated. FAILED entries are actual failures. PROCESSING entries are normal — transfers take 1–2 business days. A provider calling on Saturday saying 'I don't have my money yet' may just be looking at a processing transfer. Check the status before escalating.",
        screenshot: { alt: "Payout batch report with status column" },
      },
      {
        title: "Check the failure reason code",
        description: "Stripe provides a failure reason for every failed transfer. Common reasons: account_closed (provider closed their bank account), invalid_routing_number (banking info entered incorrectly during onboarding), insufficient_funds (platform account balance issue — rare but serious), no_account (Connect account not properly linked). Each reason has a different fix. Don't ask the provider to 'check their bank' without knowing what actually failed.",
        screenshot: { alt: "Payout failure detail with Stripe reason code" },
      },
      {
        title: "Resolve the root cause and wait for the next batch",
        description: "Once the underlying issue is fixed (provider updated banking info, Connect account re-verified), the corrected payout will be included in the next Friday batch automatically. There is no manual retry button in the admin panel — payouts process through the weekly cron cycle. Tell the provider the issue is resolved and their payout will be included in the next Friday run. If the fix happens early in the week, they'll see funds the following Monday/Tuesday. If it's Thursday or later, it may roll to the week after.",
        screenshot: { alt: "Provider payout record showing resolved status" },
      },
      {
        title: "Check platform balance for platform-level failures",
        description: "If multiple providers fail payout in the same batch, the issue might be platform-side — specifically, the platform's Stripe account may not have sufficient balance to fund all the transfers. This is rare but catastrophic when it happens. Check Stripe dashboard → Balance to confirm available funds. If this is the issue, it's an executive-level emergency, not an ops ticket.",
        screenshot: { alt: "Platform Stripe balance check" },
      },
    ],
  },
  {
    id: "pro-tips",
    title: "Pro Tips from Veteran Operators",
    type: "pro-tips",
    proTips: [
      {
        text: "Payout day is Friday. By Wednesday, check for providers with held earnings — if holds aren't releasing, something upstream broke (usually a missing proof submission).",
        context: "Catching hold issues on Wednesday gives you 2 days to fix them before the batch runs. Catching them Friday means providers miss the week.",
      },
      {
        text: "When a provider says 'I'm not getting paid,' the first question is: did they submit proof on every job? Missing proof is the #1 reason earnings don't release. Check their job record before touching anything else.",
        context: "Most 'payment issues' are actually proof submission issues. Diagnosis before action.",
      },
      {
        text: "New providers almost always have sub-threshold earnings in their first 1–2 weeks. Set this expectation during onboarding — explicitly. 'Your first payout may roll over if you're under $25 for the week.' Providers who are surprised by this become upset. Providers who know upfront don't mind.",
        context: "Expectation management in onboarding eliminates a significant percentage of first-week support tickets.",
      },
      {
        text: "Don't manually release a hold on a disputed job until the dispute is fully closed. Releasing earnings prematurely means you've paid the provider for a job the customer may still win a chargeback on — and recovering that from the provider after the fact is a significant operational headache.",
        context: "The hold exists as a buffer for exactly this scenario. Respect the process.",
      },
    ],
  },
  {
    id: "watch-outs",
    title: "Watch Out For...",
    type: "watch-outs",
    watchOuts: [
      {
        text: "Never tell a provider their payout 'should have gone through' without actually checking the batch report. Assumption-based support calls erode provider trust faster than the actual payout failure did. Check the record, read the status, then call.",
        severity: "caution",
      },
      {
        text: "A provider with a RESTRICTED Stripe Connect account will have earnings accumulating that cannot be paid out until the account is resolved. If this goes unaddressed for multiple weeks, the provider has a large held balance — and eventually they'll be very upset. Monitor for RESTRICTED accounts weekly and proactively push providers to resolve them.",
        severity: "critical",
      },
      {
        text: "Platform-level Stripe balance issues are silent until they fail. Unlike customer billing failures, which generate a clear event, platform balance shortfalls may only surface when a batch partially fails. If you have a large payout week coming up (seasonal demand, new zone launch), verify the platform balance before Friday — not after.",
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
        text: "System holds on new earnings are automatic — they set when an earning is created and release automatically after the hold period if no flags exist. You do not need to manually release system holds unless something upstream is blocking them.",
        type: "set-and-forget",
      },
      {
        text: "The Friday payout batch runs automatically via cron. You do not trigger it. You verify it ran via Cron Health every Friday evening or Saturday morning.",
        type: "weekly-check",
      },
      {
        text: "Check the pending payout batch every Wednesday. Review for: providers with $0 pending who had completed jobs, providers with manual holds still active, and new providers who haven't completed Stripe onboarding. Wednesday gives you the runway to fix issues before Friday.",
        type: "weekly-check",
      },
      {
        text: "Proof verification is partially automated — the system checks for proof submission and runs basic completeness checks. But flagged jobs (quality issues, disputes, incomplete proof) require human review before the earning can release. Monitor the manual review queue daily during peak service periods.",
        type: "daily-check",
      },
    ],
  },
  {
    id: "real-world",
    title: "Real-World Context",
    type: "real-world",
    realWorldData: [
      {
        text: "Provider payout is the #1 economic lever. The $45–$65/job estimated range for lawn care provider payouts is where the negotiation happens. Providers who see consistent, predictable weekly payouts are significantly more likely to stay on the platform. Industry consensus: unpredictable or delayed payments are the #1 reason providers leave any gig platform.",
        source: "Industry benchmarks, internal provider economics modeling",
      },
      {
        text: "The average independent landscaper earns $37–$55/hour, but most small operators cite cash flow unpredictability as their top operational pain point — not the hourly rate. A platform that pays weekly and reliably is a competitive advantage, not just a hygiene feature. Emphasize payment reliability in provider recruitment.",
        source: "Bureau of Labor Statistics, Jobber contractor survey (2025)",
      },
      {
        text: "In gig economy platforms, payment delay is a leading cause of provider churn in the first 90 days. Providers who experience payment issues in their first month are substantially more likely to deactivate, even if the issue is resolved. First-payment experience is critical — new provider onboarding should include explicit payout timeline education.",
        source: "Gig economy platform retention research, internal benchmarking",
      },
    ],
  },
];
