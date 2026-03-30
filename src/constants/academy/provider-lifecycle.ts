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
    id: "onboarding-walkthrough",
    title: "Provider Onboarding — Step by Step",
    type: "walkthrough",
    steps: [
      {
        title: "Review the application and initial screening",
        description: "Navigate to Providers → Applications → Pending. Review each application for completeness: years of experience, equipment owned, service types offered, and coverage area. Flag any applications with vague answers or no equipment listed — follow up before advancing. Applicants who can't describe their own equipment are a red flag. Reject outright if the coverage area doesn't match any open zones.",
        screenshot: { alt: "Provider application review screen with status filters" },
      },
      {
        title: "Initiate and track the background check",
        description: "For every applicant you advance, initiate a background check from the application record. The check runs through our integrated vendor and returns within 2–3 business days. You're looking for: no felony convictions in the past 7 years, no fraud-related offenses, no violence on record. Minor infractions (old traffic violations, misdemeanors 10+ years ago) are judgment calls — escalate to your manager if unsure. Never approve a provider without a completed, cleared background check.",
        screenshot: { alt: "Background check initiation and status tracker" },
      },
      {
        title: "Verify documents and equipment",
        description: "Required documents vary by state, but the baseline is: government-issued ID, proof of equipment ownership or rental, and liability insurance certificate (minimum $1M general liability). Upload all documents to the provider record under the Documents tab. Mark each one as verified manually — the system won't do it for you. A provider with unverified docs should not be activated. If insurance is expired or the coverage amount is insufficient, request an updated certificate before advancing.",
        screenshot: { alt: "Provider document upload and verification checklist" },
      },
      {
        title: "Assign territory and service types",
        description: "Go to the provider record → Territory tab. Assign them to one or more service zones based on their stated coverage area and current zone demand. Don't over-assign zones to a new provider — start with their primary area and expand after they've shown reliability. Then set their service types (mowing, trimming, cleanup, etc.) — only assign what they confirmed they can actually perform. Wrong service type assignments lead to job mismatches and immediate quality complaints.",
        screenshot: { alt: "Provider territory and service type assignment interface" },
      },
      {
        title: "Complete Stripe Connect onboarding",
        description: "Until the provider completes Stripe identity verification, payouts are blocked. From the provider record → Payout Settings, send them the Stripe Connect onboarding link. Follow up after 48 hours if they haven't completed it. New providers are often confused by the identity verification steps — they may need reassurance that it's standard. Do not activate the provider for scheduling until Stripe onboarding shows ACTIVE status.",
        screenshot: { alt: "Provider Stripe Connect status in payout settings" },
      },
      {
        title: "Complete the training and standards walkthrough",
        description: "Every new provider completes a standards walkthrough before their first job. This covers: photo proof requirements (before, during, and after photos per job), how to use the provider app, communication standards with customers, cancellation and reschedule policy, and what triggers a quality flag. Providers who skip this step generate more complaints in their first 30 days. Log the training completion date in the provider record.",
        screenshot: { alt: "Provider training completion checklist in onboarding record" },
      },
      {
        title: "First job review",
        description: "Personally review the proof submission from a new provider's first job. Did they submit before/during/after photos? Are the photos actually of the property (not blurry, not just grass with no identifiable landmarks)? Is the quality visibly acceptable? New providers who understand the proof standard in week one perform measurably better at 60 days. If the first proof submission is weak, reach out immediately with specific feedback — not a form message. Name what's missing.",
        screenshot: { alt: "Job proof review showing photo grid for first-job audit" },
      },
    ],
  },
  {
    id: "performance-management",
    title: "Provider Performance Management",
    type: "walkthrough",
    steps: [
      {
        title: "Understand the metrics that matter",
        description: "The platform tracks six key performance indicators for every provider: (1) Job Completion Rate — percentage of accepted jobs completed vs. cancelled or no-showed; (2) On-Time Rate — arrivals within the service window; (3) Quality Score — composite from customer ratings and admin quality flags; (4) Proof Compliance Rate — percentage of jobs with proof submitted within 2 hours of completion; (5) Communication Score — response time to platform messages and customer contacts; (6) Callback Rate — percentage of jobs that generate a customer callback or complaint. Review these weekly for your active roster.",
        screenshot: { alt: "Provider performance dashboard with six KPI summary tiles" },
      },
      {
        title: "Run the weekly performance review",
        description: "Every Monday morning, pull the provider performance report for the prior week (Providers → Reports → Weekly Performance). Sort by Quality Score ascending — your lowest performers are at the top. Anyone below 3.8/5.0 on quality or below 90% on completion rate gets a personal review. Check what jobs generated the flags, read the customer comments, look at the proof photos. This is your early warning system — catch problems in week 2, not week 8.",
        screenshot: { alt: "Weekly provider performance report sorted by quality score" },
      },
      {
        title: "Review quality flags and customer feedback",
        description: "Quality flags are generated automatically when: a customer submits a complaint, an admin reviews proof and marks it insufficient, or a job receives a rating below 3 stars. Navigate to Providers → Flags → Open to see every unresolved flag. For each flag: read the customer's exact words, look at the proof photos, check if this provider has prior flags for similar issues. Flags that aren't reviewed and closed within 48 hours age out of your working queue — don't let them pile up.",
        screenshot: { alt: "Quality flag queue showing open flags with age and provider" },
      },
      {
        title: "Manage photo proof compliance",
        description: "Proof compliance threshold is 90% — providers must submit compliant proof on at least 9 of every 10 jobs. 'Compliant proof' means: at least one before photo, at least one after photo, photos submitted within 2 hours of job completion. Drop below 90% for two consecutive weeks, and the provider gets a formal warning. Drop below 80% and it triggers a probation review. You can see compliance by provider at Providers → select provider → Performance tab → Proof Compliance.",
        screenshot: { alt: "Provider proof compliance history chart with threshold markers" },
      },
      {
        title: "Close the customer feedback loop",
        description: "When a customer rates a job below 4 stars or submits a written complaint, the feedback must touch the provider. Not as a passive notification — as a direct message with specific coaching. 'A customer mentioned the edging on the sidewalk was missed' is useful. 'Customer wasn't happy' is not. Providers who receive specific, actionable feedback on quality complaints show measurably better performance in the following 4 weeks. Close the loop within 24 hours of the feedback arriving.",
        screenshot: { alt: "Customer feedback detail linked to provider coaching message thread" },
      },
    ],
  },
  {
    id: "managing-issues",
    title: "Managing Provider Issues",
    type: "walkthrough",
    steps: [
      {
        title: "Handle a no-show",
        description: "A no-show is a provider who accepted a job and didn't complete it without cancelling in advance. First step: reach out to the provider immediately to understand what happened. Genuine emergencies happen — document them. Then: reassign the job to another provider (or manually reschedule with the customer), and flag the no-show in the provider record. No-shows are cumulative: 1 no-show in 30 days = documented warning. 2 no-shows in 30 days = automatic probation trigger. 3 no-shows in any 60-day window = deactivation review.",
        screenshot: { alt: "No-show incident logging form with reason and reassignment status" },
      },
      {
        title: "Handle a quality complaint",
        description: "A quality complaint is when a customer explicitly reports dissatisfaction with the work performed. Start with the proof photos — does the work look acceptable in the photos? If yes, the complaint may be a perception or expectation mismatch (worth noting, not necessarily the provider's fault). If the photos show poor work, the complaint is valid. Either way: contact the provider within 24 hours. If the complaint is valid, document it in the provider record and send a coaching message. If two or more valid quality complaints arrive in a 30-day window, escalate to a formal performance review.",
        screenshot: { alt: "Quality complaint intake linked to job record and proof photos" },
      },
      {
        title: "Address schedule reliability issues",
        description: "A provider who consistently arrives late (outside the service window) or who frequently requests reschedules creates downstream problems: customer dissatisfaction, routing disruption, and lost revenue. Review the on-time rate for any provider flagged for lateness. If on-time rate drops below 85% in any 2-week period, initiate a coaching call. Often there's a structural issue — the provider took on too many zones, or they're working another job that creates conflicts. Solve the root cause, not just the symptom.",
        screenshot: { alt: "Provider on-time rate trend with service window compliance chart" },
      },
      {
        title: "Handle communication problems",
        description: "Providers who don't respond to platform messages, ignore customer contact requests, or go silent for extended periods create compounding problems. The platform logs all message delivery and read receipts. If a provider hasn't responded to platform messages within 24 hours on two or more occasions in a month, trigger a direct outreach (phone call, not message). If they're non-responsive by phone, place their availability on hold until contact is made. A provider you can't reach is a liability. Don't assign jobs to unreachable providers.",
        screenshot: { alt: "Provider communication log with message read receipts and response times" },
      },
      {
        title: "Initiate formal probation",
        description: "Probation is triggered by: 2+ no-shows in 30 days, proof compliance below 80% for two consecutive weeks, quality score below 3.5 for two consecutive weeks, or two or more valid quality complaints in 30 days. Navigate to the provider record → Status → Place on Probation. Set the review window (standard is 30 days). Document the trigger clearly in the probation record — specific dates, specific incidents, specific metrics. Send the provider a clear written summary of what triggered probation, what the performance expectations are during the review window, and what the outcome criteria are. No surprises.",
        screenshot: { alt: "Probation initiation form with trigger documentation and review window" },
      },
      {
        title: "Conduct the probation review",
        description: "At the end of the probation window, pull the performance data for the review period. Compare it to the criteria you set at the start. Did the provider meet the benchmarks? If yes: close probation, update status to Active, send a positive note. If no: escalate to deactivation review. If partial improvement: use judgment — is there genuine trajectory? Have they demonstrated effort? Document your decision and the reasoning either way. Probation reviews that aren't conducted on schedule send the message that standards are negotiable.",
        screenshot: { alt: "Probation review summary comparing trigger metrics to review period performance" },
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
