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

PROBATION — Driven by the quality score system (visible in the Playbooks page). Score 50–70 triggers a written warning. Below 50 triggers formal probation. Below 30 triggers suspension review. The score is affected by no-shows (3 within 30 days triggers a probation review), proof compliance, and customer complaints. Probation is a formal intervention with a defined review window. It's not punitive — it's structured. Some providers turn it around. Some don't.

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
        description: "Until the provider completes Stripe identity verification, payouts are blocked. From the provider record → Payout Settings, send them the Stripe Connect onboarding link. Follow up after 48 hours if they haven't completed it. New providers are often confused by the identity verification steps — they may need reassurance that it's standard. Important: the system does not prevent job assignment for providers without active payout accounts — this is a manual discipline you must enforce. Do not activate the provider for scheduling until their payout account shows READY status. If you skip this check, the provider will complete jobs, accumulate earnings, and discover they can't get paid — which destroys the relationship immediately.",
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
        text: "The single most powerful retention tool is predictability. Providers don't need to love the platform — they need to trust it. Consistent job flow, consistent communication, consistent payouts. When any of those three break down, providers leave before they even tell you something's wrong.",
        context: "Retention strategy starts at onboarding, not at the point of churn. Set expectations clearly, then deliver on them consistently. The providers who stay the longest are the ones whose first 30 days went smoothly.",
      },
      {
        text: "Learn to read the difference between a provider having a bad week versus a provider with a structural problem. One missed job in a month during a provider's first kid's soccer season is different from a provider who's averaging 2 late arrivals a week for the past six weeks. Respond to patterns, not events.",
        context: "Over-correcting on isolated incidents burns out good providers. Under-correcting on patterns lets problems compound until a customer relationship is damaged. The skill is distinguishing between the two.",
      },
      {
        text: "When you're deciding whether to coach or cut, ask one question: if this provider performs at exactly the level they've performed for the past 30 days, can you grow your business with them? If the answer is yes, coach. If the answer is no, the coaching conversation is just delaying an inevitable deactivation — and every week you delay costs you customer relationships.",
        context: "Operators who hold onto underperformers too long do so because the labor market is tight. That's real. But a provider who generates more complaints than revenue is worse than no provider. The labor gap is temporary. Customer trust damage is harder to recover.",
      },
      {
        text: "Your best providers will receive recruiting calls from competitors. The countermeasure isn't matching offers — it's being the platform they don't want to leave. That means: solving their problems quickly, recognizing good work explicitly, and never making them chase you for answers on pay or scheduling.",
        context: "Provider retention is a relationship, not a transaction. The operators who keep their best providers for years treat them like the business partners they are — not like warm bodies filling a schedule slot.",
      },
      {
        text: "Do an exit interview every time a provider leaves voluntarily, even if it's just two questions: what worked, and what didn't. Aggregate these over time. When 8 out of 10 voluntary exits cite the same friction point, that's not a provider problem — that's a platform or ops problem. The exit data is your product feedback loop.",
        context: "Most platforms skip exit interviews because the person is already leaving. That's backwards. Voluntary exits are your most honest informants — they have no incentive to tell you what you want to hear.",
      },
    ],
  },
  {
    id: "watch-outs",
    title: "Watch Out For...",
    type: "watch-outs",
    watchOuts: [
      {
        text: "Never activate a provider for scheduling before their Stripe Connect onboarding is ACTIVE and their background check is cleared. A provider who completes jobs before their background check returns creates legal and insurance exposure if the check comes back with disqualifying results. The temptation to onboard fast during high demand is real — resist it. The liability isn't worth a single week of capacity.",
        severity: "critical",
      },
      {
        text: "Be extremely careful about letting a provider accumulate no-shows without triggering the formal process. Three no-shows within 30 days triggers a probation review via the quality score system (see Playbooks page). Don't override the system with 'we'll give it one more chance.' The probation trigger exists because informal warnings don't create accountability. Providers who've tested the system and found no real consequence will continue the behavior. Apply the thresholds consistently across your entire roster.",
        severity: "critical",
      },
      {
        text: "Don't conflate a provider being likable or communicative with being a strong performer. The providers who respond quickly to messages and sound great on the phone are often the same ones generating the most quality complaints. Run the metrics. Personality and performance are not correlated. The data tells the truth; your gut tells you what you want to hear.",
        severity: "caution",
      },
    ],
  },
  {
    id: "real-world",
    title: "Real-World Context",
    type: "real-world",
    realWorldData: [
      {
        text: "Independent landscapers and solo home service operators spend 20–30% of their work week on administrative overhead: scheduling, invoicing, customer communication, and chasing payments. A platform that handles all of that is a genuine value proposition — but only if providers trust the platform to execute reliably. Every time the platform fails on scheduling, payment, or communication, it erodes the core reason a provider chose it over operating independently.",
        source: "Jobber small business survey, landscaping segment (2025)",
      },
      {
        text: "The home services labor market runs at 40–60% annual turnover, making provider retention the single hardest operational challenge for gig platforms. Platforms that manage to hold their best providers for 12+ months do so primarily through operational reliability and responsive admin support — not higher pay rates. Pay matters, but providers will leave a higher-paying platform that's chaotic for a lower-paying one that runs smoothly.",
        source: "HomeAdvisor industry workforce analysis; Angi platform retention benchmarks (2024–2025)",
      },
    ],
  },
  {
    id: "automation",
    title: "What's Automated vs. What Needs Your Eyes",
    type: "automation",
    automationNotes: [
      {
        text: "Probation triggers are automatically flagged in the system when thresholds are breached (2+ no-shows in 30 days, proof compliance below 80%, quality score below 3.5 for two consecutive weeks). The flag appears in your Providers → Flags queue marked as a probation trigger. The flag does not automatically place the provider on probation — that requires a human decision. Review and act on probation trigger flags within 48 hours. Flags that age past 72 hours without action send the implicit message that the threshold is not enforced.",
        type: "daily-check",
      },
      {
        text: "Weekly performance reports generate automatically every Monday morning and are available in Providers → Reports → Weekly Performance. You do not need to pull this manually or set a reminder — the report is always current as of Sunday night. Your job is to actually read it every Monday, sort by quality score ascending, and action anyone below threshold. The report is only useful if someone reads it.",
        type: "weekly-check",
      },
      {
        text: "Background check requests are automatically submitted when you advance an applicant from the screening stage. Results are returned to the provider record by the vendor within 2–3 business days and marked CLEARED, FLAGGED FOR REVIEW, or DISQUALIFIED. CLEARED is automatic — no action needed. FLAGGED FOR REVIEW requires you to read the details and make a judgment call. DISQUALIFIED locks the applicant from advancing and sends them an automated decline notification. Review flagged background checks within 24 hours — applicants are waiting.",
        type: "set-and-forget",
      },
    ],
  },
];
