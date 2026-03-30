import type { TrainingSection } from "@/components/academy/AcademySection";

export const providerLifecycleSections: TrainingSection[] = [
  {
    id: "overview",
    title: "The Provider Lifecycle (From Application to Exit)",
    type: "overview",
    content: `Providers are the product. Customers pay for lawn care — but what they're actually buying is your provider network. Everything else is logistics. If you internalize one thing as an operator, it's this: your job is to build and protect a reliable, high-quality provider roster.

Here's the full arc of a provider's time on the platform:

APPLICATION — A provider submits interest through the platform, or you recruit them directly. This is the top of the funnel. Most applicants won't make it through, and that's okay. You want people who show up reliably and do quality work, not just people who need income.

SCREENING — Background check, license verification (where required), reference check, equipment confirmation. This is your quality gate. Letting a weak candidate through here costs you 5x more in complaints, no-shows, and churn recovery later.

ONBOARDING — Document collection, Stripe Connect setup, territory assignment, app training, service standards walkthrough. A provider who isn't fully onboarded is a liability. Don't put them on the schedule until every box is checked.

ACTIVE — The provider is on the schedule, completing jobs, submitting proof, getting paid. This is the steady state. Your job shifts to performance monitoring: proof compliance, quality scores, customer feedback, schedule reliability.

PERFORMANCE MANAGEMENT — Ongoing coaching and feedback loop. Weekly metrics review, quality flag triage, customer complaint response. Good operators don't wait for problems to escalate — they catch signals early and course-correct.

PROBATION — Triggered by specific thresholds (2+ no-shows in 30 days, proof compliance below 80%, or a pattern of quality complaints). Probation is a formal intervention with a defined review window. It's not punitive — it's structured. Some providers turn it around. Some don't.

OFFBOARDING — Voluntary (provider leaves) or involuntary (deactivation). Voluntary exits get an exit interview and final payout settlement. Involuntary exits require documentation of the cause, admin deactivation of their account, and notification. Always document why. You will be asked.

The lifecycle is a pipeline. Your job is to keep quality providers moving through it productively, and to remove poor performers before they damage your customer relationships or your good providers' trust in the platform.`,
  },
  {
    id: "lifecycle-walkthrough",
    title: "The Provider Lifecycle: Application to Active (and Beyond)",
    type: "walkthrough",
    steps: [
      {
        title: "Application arrives — do your first pass",
        description:
          "When an application comes in, start with the basics before reading anything in detail: Is the service type something we need in their requested zone? Do we have capacity for another provider there? If the answer to either is no, you can decline immediately with a brief note. Don't waste 20 minutes evaluating someone for a zone that's already fully covered.",
        screenshot: { alt: "Applications page showing incoming applications" },
      },
      {
        title: "Evaluate the application — what to look for",
        description:
          "Look for three things in order: (1) Experience signal — how long have they been doing this work? Do they have their own equipment? Are they running a real small business or is this a side hustle experiment? (2) Zone fit — do they live or operate close enough to the zones they're requesting to have realistic route density? A provider who lives 40 minutes from their zone will eventually quit because the drive time kills their economics. (3) Communication quality — how did they fill out the application? Vague, incomplete answers are a red flag. A provider who can't describe their own services clearly will struggle to communicate with customers.",
        screenshot: { alt: "Provider application detail view" },
      },
      {
        title: "Red flags — know them cold",
        description:
          "Decline or investigate further if you see: no personal equipment (they'll be dependent on renting, which makes them unreliable), geographic mismatch between address and requested zones, application filled out in under 2 minutes (copy-paste or not taking it seriously), requesting zones in categories where we have low demand, or anything in the application that suggests they're already overcommitted with other work. The last one is subtle — a provider working 60 hours/week elsewhere is unlikely to give us reliable service.",
        screenshot: { alt: "Application red flag indicators" },
      },
      {
        title: "Approve the application and set zone coverage",
        description:
          "When you approve, you assign the specific zones the provider can service. Don't just approve everything they requested — be deliberate. If they requested 4 zones but you only have demand in 2, approve those 2 and note that expansion is possible once they're established. The zone coverage approval is a binding operational decision: the assignment engine will start sending them jobs in those zones immediately.",
        screenshot: { alt: "Zone coverage approval modal" },
      },
      {
        title: "Onboarding — what happens after approval",
        description:
          "After approval, the provider needs to complete onboarding before they go Active. This typically means connecting a payout account (Stripe Connect or equivalent), confirming availability windows, and acknowledging service standards. Until payout is connected, their status will show as 'Onboarding' — they cannot be assigned jobs. If a provider sits in Onboarding for more than 7 days, reach out. The most common blockers are confusion about the payout setup or a bank account they don't have immediate access to.",
        screenshot: { alt: "Provider detail showing Onboarding status" },
      },
      {
        title: "Active — normal operations",
        description:
          "Once a provider is Active, the assignment engine will route jobs to them based on their zones, availability, and capacity. Your job now shifts from evaluation to performance monitoring. Check their proof compliance rate and issue rate in the Provider Detail page. Most providers need 2–3 weeks to settle into a consistent pattern. Don't make judgments on the first week of data.",
        screenshot: { alt: "Provider detail showing Active status with performance metrics" },
      },
      {
        title: "Probation — when performance slips",
        description:
          "Probation is a formal status change you trigger manually from the Provider Detail page. It signals that the provider has a documented performance issue but we're not ready to suspend them yet. Probation limits new job assignments (they keep existing jobs, get fewer new ones), triggers more frequent check-ins, and creates a formal record. Before putting someone on probation, make sure you've had the conversation first. Surprise probation creates resentment. Probation after a conversation creates accountability.",
        screenshot: { alt: "Provider status change controls on detail page" },
      },
      {
        title: "Suspension — the last resort",
        description:
          "Suspension immediately prevents new job assignments and removes the provider from active routing. It does NOT automatically cancel their existing scheduled jobs — those need to be handled manually. Before suspending, always check active job count first (visible in Provider Detail). A provider with 15 jobs scheduled this week represents 15 customer disruptions if suspended abruptly. Suspension is appropriate for: no-show patterns that didn't resolve on probation, policy violations (not submitting proof, customer complaints about conduct), or a provider who has gone radio silent.",
        screenshot: { alt: "Suspension confirmation dialog with active job warning" },
      },
    ],
  },
  {
    id: "performance-metrics",
    title: "Reading Provider Performance Metrics",
    type: "walkthrough",
    steps: [
      {
        title: "Proof compliance rate — your first signal",
        description:
          "This is the percentage of completed jobs where the provider submitted required photo proof. Target is 95%+. A provider at 90% is slipping. A provider at 80% is a problem. Low proof compliance has a compounding effect: customers dispute jobs, you can't resolve disputes without proof, and you start losing money on legitimate service. This metric degrades gradually — watch for the trend, not just the snapshot.",
        screenshot: { alt: "Proof compliance rate on Provider Detail" },
      },
      {
        title: "Issue rate — quality signal",
        description:
          "Jobs with reported issues divided by total completed jobs. Target is under 3%. Above 5% warrants a conversation. Above 10% warrants probation consideration. Important: look at issue type, not just count. Equipment failure and customer disputes are very different problems. A provider with 3 customer complaints has a behavior issue. A provider with 3 equipment failures has a logistics issue. The fix is different for each.",
        screenshot: { alt: "Issue rate breakdown on Provider Detail" },
      },
      {
        title: "No-show and late rate — reliability signal",
        description:
          "This is the hardest metric for providers to recover from. A single no-show is noticed by the customer. Two no-shows in a month is a pattern. Check whether no-shows correlate with specific days of the week (suggests a scheduling conflict they haven't disclosed) or specific conditions. If a provider has zero no-shows for 6 months and then two in a week, something changed in their life — have the conversation before assuming bad intent.",
        screenshot: { alt: "Reliability metrics section on Provider Detail" },
      },
      {
        title: "Job volume and capacity utilization — load signal",
        description:
          "How many jobs per week is this provider completing? Are they at their self-reported capacity? A provider running at 120% of their stated capacity will eventually burn out or cut corners. A provider running at 40% of capacity might be available for more zone coverage or might be supplementing with outside work — either way, worth understanding.",
        screenshot: { alt: "Job volume chart on Provider Detail" },
      },
    ],
  },
  {
    id: "pro-tips",
    title: "Pro Tips from Veteran Operators",
    type: "pro-tips",
    proTips: [
      {
        text: "A provider with 95% proof compliance and 2% issue rate is worth more than one who completes jobs faster but skips photos. Speed is recoverable. Trust, once broken with a customer over an unverified job, is not.",
        context: "Proof compliance is the single best leading indicator of long-term provider reliability.",
      },
      {
        text: "Always read a provider's job history before having a performance conversation. If they've been excellent for 8 months and slipped in the last 3 weeks, that's a life circumstance conversation, not a disciplinary one. Coming in with context shows respect and usually produces a better outcome.",
        context: "The Provider Detail job history timeline is your cheat sheet before any difficult conversation.",
      },
      {
        text: "The BYOC (Bring Your Own Customer) invite system is your most powerful growth tool. When a provider invites existing customers, those customers arrive pre-sold on the provider, require no marketing spend, and have higher retention because the relationship predates the platform. Encourage every new provider to send BYOC invites in week one — don't leave this to chance.",
        context: "BYOC customers churn at roughly half the rate of cold-acquired customers in our model.",
      },
      {
        text: "When approving zone coverage, approve narrowly and expand later — not broadly and restrict later. It's easy to add zones to a performing provider. It's awkward and friction-heavy to remove zones from one who's struggling to cover what they were given.",
        context: "Providers feel zone removal as a demotion even when the reason is operational.",
      },
      {
        text: "Check payout account status separately from operational status in the Providers List. A provider can be Active but have an expired or disconnected payout account. They'll keep doing jobs, not get paid, get frustrated, and quit — and blame the platform. Catch this early with a weekly scan of payout status for all Active providers.",
        context: "Payout failures are silent until the provider notices, which is usually after several weeks.",
      },
      {
        text: "The probation conversation lands better when you lead with data, not judgment. 'Your proof compliance dropped from 96% to 78% over the last 4 weeks — can you help me understand what's happening?' works better than 'You haven't been submitting your photos.' Same information, very different reception.",
        context: "Providers are small business owners. They respond to business conversations, not employee management.",
      },
      {
        text: "New providers in their first 30 days need more attention than your established roster. Set a reminder to check their metrics weekly for the first month. Catching a bad habit at week 3 is a one-conversation fix. Catching it at month 6 is a potential offboarding.",
      },
    ],
  },
  {
    id: "watch-outs",
    title: "Watch Out For...",
    type: "watch-outs",
    watchOuts: [
      {
        text: "Never suspend a provider without checking their active job count first. Suspending a provider with 15 jobs scheduled this week means 15 homes don't get serviced. Always review the active job count in Provider Detail, reassign or cancel those jobs manually, then suspend. Skipping this step turns one provider problem into 15 customer problems in a single click.",
        severity: "critical",
      },
      {
        text: "Don't approve zone coverage based on provider requests alone. Check actual demand in those zones first. A provider approved for a zone with no customers is a provider who will do zero jobs, feel like the platform isn't working for them, and churn before they ever get traction. Set them up to succeed by matching their coverage to where demand actually exists.",
        severity: "caution",
      },
      {
        text: "Don't mistake 'quiet' for 'performing well.' A provider you haven't thought about in two months might be fine — or they might have a slowly degrading compliance rate you haven't noticed because they're not generating active incidents. The Provider Detail metrics are passive — they don't alert you unless you look. Build a habit of reviewing your bottom-quartile performers weekly, not just when something breaks.",
        severity: "caution",
      },
      {
        text: "BYOC invite links are provider-specific and expire. If a provider asks why their invites aren't working, check the link expiry first before assuming a platform bug. Regenerate from the Provider Detail BYOC section and resend. Providers who hit a broken invite link often give up and don't follow up — you lose the customer acquisition, not just the invite.",
        severity: "caution",
      },
    ],
  },
  {
    id: "automation",
    title: "What's Automated vs. What Needs Your Judgment",
    type: "automation",
    automationNotes: [
      {
        text: "No-show detection runs automatically after a job window closes without a provider check-in or proof submission. The system flags the job as a potential no-show and creates a dispatcher queue item. You still decide the outcome — the automation surfaces the problem, you resolve it.",
        type: "daily-check",
      },
      {
        text: "Payout processing runs on an automated schedule via the connected payout account. You don't trigger payouts manually. What you do check is whether payout accounts are connected and healthy — a broken payout account means completed work goes uncompensated until fixed.",
        type: "weekly-check",
      },
      {
        text: "BYOC invite tracking is automated — when a customer accepts a BYOC invite and creates an account, the system links them to the originating provider and attributes the acquisition. You don't need to track this manually. Review BYOC conversion rates in the Provider Detail monthly to identify which providers are actively using the system.",
        type: "weekly-check",
      },
      {
        text: "Status transitions from Active → Probation → Suspended are always manual. The platform will never automatically put a provider on probation or suspend them based on metrics. That decision requires human judgment — you own it entirely.",
        type: "daily-check",
      },
      {
        text: "Onboarding completion is tracked automatically. Once a provider connects their payout account and completes all required steps, their status transitions from Onboarding to Active without any admin action needed. You only intervene when a provider gets stuck in Onboarding for too long.",
        type: "set-and-forget",
      },
    ],
  },
  {
    id: "real-world",
    title: "Real-World Context — Know Your Provider Base",
    type: "real-world",
    realWorldData: [
      {
        text: "The U.S. landscaping industry is $188.8B (2025). Most providers are small businesses with 1-5 crews — not solo operators with one mower. When you're evaluating an application, you're often evaluating a small business owner who has been doing this for years. Treat them accordingly — they have leverage (they have other customers) and they have professional pride.",
        source: "IBISWorld landscaping market report (2025)",
      },
      {
        text: "Average lawn mowing costs $49–$203 per visit nationally, with a national average around $122. Provider economics are tight — drive time between jobs is unpaid dead time. This is why zone density matters so much for provider retention. A provider who can do 8 jobs within a 3-mile radius earns far more per hour than one who drives 15 minutes between each job.",
        source: "Angi, HomeAdvisor consumer cost guides (2025)",
      },
      {
        text: "Provider acquisition through BYOC (Bring Your Own Customer) is the primary growth strategy — providers bring existing customers into the platform, reducing cold-start risk for both the provider and the platform. A BYOC provider has immediate revenue on day one, which is the #1 factor in provider retention through the first 90 days. Providers who don't earn in their first 30 days churn at dramatically higher rates.",
        source: "Platform operating model, BYOC program design rationale",
      },
      {
        text: "The average home services provider churns from platforms within 12 months if they don't reach a sustainable weekly job volume. For lawn care, that threshold is roughly 8–10 jobs/week for a solo operator to cover costs and earn a reasonable hourly rate. When you evaluate a provider's performance, 'are they on track to hit sustainable volume?' should be a standing question.",
        source: "Marketplace platform retention research; internal operating model assumptions",
      },
    ],
  },
];
