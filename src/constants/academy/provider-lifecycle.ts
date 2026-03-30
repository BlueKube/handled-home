import type { TrainingSection } from "@/components/academy/AcademySection";

export const providerLifecycleSections: TrainingSection[] = [
  {
    id: "overview",
    title: "The People Behind the Platform",
    type: "overview",
    content: `Providers are the business. Every customer experience is delivered by a provider — their quality, reliability, and professionalism ARE your brand. The admin panel gives you tools to manage the full provider lifecycle, but tools don't replace judgment.

The lifecycle looks like this:

APPLICATION → A provider applies or is recommended via BYOP. You see their application in the Providers page.

SCREENING → Background check, document verification, insurance confirmation. Some of this is automated; some requires your eyes.

ONBOARDING → Territory assignment, training completion, Stripe Connect setup, first job assignment. This is where most providers drop off — not because they don't want to work, but because the process has friction.

ACTIVE → The provider is live, taking jobs, earning money. Your job shifts from setup to performance monitoring.

PERFORMANCE MANAGEMENT → Quality scores, proof compliance, customer feedback, schedule reliability. This is ongoing — not a one-time check.

PROBATION → Triggered by specific thresholds (2+ no-shows in 30 days, quality score below 3.5, proof compliance below 80%). Probation is a structured improvement period, not a punishment.

OFFBOARDING → Voluntary departure or involuntary removal. Either way, there's a process to protect customers and settle earnings.

The most important thing to understand: providers are not interchangeable. A great provider in Zone A who knows every customer by name is worth 5 average providers. Treat retention as your #1 priority after safety.`,
  },
  {
    id: "onboarding-walkthrough",
    title: "Provider Onboarding — Getting Them to Active",
    type: "walkthrough",
    steps: [
      {
        title: "Review the application within 48 hours",
        description: "Navigate to Providers → Applications tab. Every application has a timestamp. A provider who applies and hears nothing for a week has already moved on to another platform. Aim for 48-hour first response. Check: service area matches your active zones, services offered match your SKU catalog, availability aligns with your scheduling needs.",
        screenshot: { alt: "Provider applications queue with timestamp and status" },
      },
      {
        title: "Verify documents and insurance",
        description: "The Documents tab shows uploaded credentials: business license, insurance certificates, vehicle registration. Check expiration dates — an insurance certificate that expires next month will create a compliance gap. Flag documents that need renewal and set a calendar reminder. Don't approve a provider whose insurance lapses before their first scheduled job.",
        screenshot: { alt: "Provider document verification checklist" },
      },
      {
        title: "Assign territory and confirm Stripe Connect",
        description: "Territory assignment connects the provider to specific zones. Assign zones where you need capacity, not where the provider 'prefers' — though overlap is ideal. Then confirm Stripe Connect status. If it's NOT STARTED or IN PROGRESS, the provider cannot receive payouts. Don't assign jobs until Stripe is ACTIVE. Nothing kills a new provider relationship faster than completing work and not getting paid.",
        screenshot: { alt: "Provider territory assignment and Stripe Connect status" },
      },
      {
        title: "Schedule the first job carefully",
        description: "The first job sets the tone. Assign something straightforward in a zone the provider knows. Don't throw a new provider into your hardest customer's property on day one. Check the customer's history — a customer who has complained about the last 3 providers is not a good first assignment. Set the provider up to succeed.",
        screenshot: { alt: "First job assignment with customer history context" },
      },
      {
        title: "Follow up after the first week",
        description: "After 5 completed jobs, check: proof submission rate (should be 100% — habits form early), customer feedback (any complaints?), check-in/check-out times (reasonable for the job scope?). A quick message to the provider — 'How's the first week going? Any questions?' — goes further than any automated onboarding email.",
        screenshot: { alt: "New provider first-week performance summary" },
      },
    ],
  },
  {
    id: "performance-management",
    title: "Performance Management — What to Watch",
    type: "text",
    content: `Performance isn't a single number. It's a pattern across multiple dimensions:

QUALITY SCORE (target: 4.0+ out of 5.0)
Aggregated from customer feedback after each service. A provider consistently at 3.5 isn't bad — they're average. But average in home services means customers start looking for alternatives. Investigate providers who drop below 4.0 for more than 2 consecutive weeks.

PROOF COMPLIANCE (target: 95%+)
Percentage of completed jobs with required proof photos submitted. Proof protects everyone — the provider (evidence work was done), the customer (transparency), and the platform (dispute resolution). A provider at 80% compliance isn't forgetful — they're not following the process. Address it directly.

SCHEDULE RELIABILITY (target: 95%+)
Percentage of assigned jobs completed within the scheduled window. This includes check-in time accuracy. A provider who's consistently 30 minutes late isn't "running behind" — they're over-committed or poorly routed. Check their job density before assuming it's a behavior problem.

NO-SHOW RATE (target: <2% monthly)
The nuclear metric. A no-show means a customer expected service and got nothing. Two no-shows in 30 days triggers a probation conversation. Three in 30 days may trigger removal. But investigate the reason — a provider who no-showed because of a family emergency is different from one who overslept.

CUSTOMER RETENTION CORRELATION
Track which providers' customers stay vs. churn. Some providers have 95% customer retention. Others hover at 70%. The difference is usually communication and consistency, not technical skill. When a high-retention provider asks for a raise, consider the full economic picture before saying no.`,
  },
  {
    id: "managing-issues",
    title: "Managing Provider Issues",
    type: "text",
    content: `QUALITY COMPLAINTS
When a customer complains about quality: (1) Check proof photos — sometimes the customer's expectations don't match the service scope, (2) Check if this is a pattern or a one-off, (3) If it's a pattern, have a direct conversation with the provider, (4) If it's a one-off, resolve for the customer and note it on the provider record.

The conversation matters more than the note. "Hey, your last 3 jobs in Zone B had customer feedback below 3.5 — is something going on?" opens dialogue. "Your quality score is 3.2 and needs to improve" shuts it down.

SCHEDULE ISSUES
Late arrivals and missed windows are usually a routing or capacity problem, not a motivation problem. Before talking to the provider: (1) Check their job density for that day — were they over-scheduled? (2) Check drive times between jobs — is the route realistic? (3) Check if other providers in the same zone have the same issue. If it's systemic, the fix is in scheduling, not in a performance conversation.

COMMUNICATION PROBLEMS
A provider who doesn't respond to messages within 4 hours during business hours needs attention. But first check: are they getting the notifications? Notification Health (Governance) shows delivery status. A provider who "never responds" might have SMS delivery failures you didn't know about.

THE PROBATION CONVERSATION
Probation isn't a surprise — it's the formalization of conversations that should have already happened. If a provider is shocked to learn they're on probation, you failed at the earlier steps. The probation meeting should cover: (1) Specific metrics that triggered probation, (2) What improvement looks like (specific, measurable), (3) Timeline (typically 30 days), (4) Support available (training, lighter schedule, different zones).`,
  },
  {
    id: "pro-tips",
    title: "Pro Tips from Veteran Operators",
    type: "pro-tips",
    proTips: [
      {
        text: "The best predictor of long-term provider success is proof compliance in week 1. Providers who submit 100% proof in their first week almost always maintain high performance. Providers who start at 60% rarely improve without intervention. Set the expectation on day one.",
        context: "Habits form in the first week. It's easier to establish good habits than to correct bad ones.",
      },
      {
        text: "Provider retention is cheaper than provider recruitment. The cost of recruiting, screening, and onboarding a new provider is 3-5x the cost of retaining an existing one. Before you let a decent provider walk over a minor issue, do the math.",
        context: "A provider who's been with you 6 months knows your customers, your zones, and your expectations. That institutional knowledge is irreplaceable.",
      },
      {
        text: "When you have a performance conversation, lead with data, not judgment. 'Your last 10 jobs averaged 3.4 quality — let's look at what's happening' is different from 'customers are complaining about your work.' The first opens problem-solving. The second triggers defensiveness.",
      },
      {
        text: "Providers talk to each other. How you treat one provider in a market affects your reputation with all providers in that market. Word travels fast in the landscaping community. Be fair, be consistent, and follow through on what you promise.",
      },
      {
        text: "Don't over-schedule your best providers to 'make up for' underperforming ones. Burnout is the #1 reason good providers leave. If a top performer is doing 8 jobs/day while the average is 5, you have a capacity problem — not a productivity win.",
      },
    ],
  },
  {
    id: "watch-outs",
    title: "Watch Out For...",
    type: "watch-outs",
    watchOuts: [
      {
        text: "Never approve a provider application without confirming their Stripe Connect account is active. A provider who completes jobs without an active payout account will accumulate earnings they can't receive — leading to frustration, support tickets, and potential legal exposure if the situation drags on.",
        severity: "critical",
      },
      {
        text: "Don't skip the probation process and jump straight to removal unless there's a safety issue. Removing a provider without following the probation SOP creates legal risk and damages your reputation with other providers in the market. Follow the process.",
        severity: "critical",
      },
      {
        text: "A provider whose quality dropped suddenly (from 4.5 to 3.0 in a week) isn't 'getting lazy.' Something changed — personal circumstances, equipment issues, or a route change that added stress. Investigate before you discipline. The answer usually isn't what you expect.",
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
        text: "The home services labor market is extremely tight, with annual turnover rates of 40-60% across landscaping, cleaning, and maintenance categories. Most independent operators cite cash flow unpredictability and administrative overhead (quoting, invoicing, scheduling) as their top two pain points — not the hourly rate. A platform that solves admin overhead and pays reliably has a genuine retention advantage.",
        source: "Bureau of Labor Statistics, Jobber contractor survey, HomeAdvisor provider economics (2025)",
      },
      {
        text: "Independent landscapers spend 20-30% of their work week on non-billable activities: quoting, invoicing, scheduling, and driving between scattered jobs. BYOC (Bring Your Own Customer) directly addresses this — providers join the platform to eliminate admin overhead and bring their existing customers along. The value proposition isn't 'we'll find you customers,' it's 'we'll handle everything except the actual service.'",
        source: "IBISWorld, industry operator interviews (2025-2026)",
      },
    ],
  },
  {
    id: "automation",
    title: "What's Automated vs. What Needs Your Eyes",
    type: "automation",
    automationNotes: [
      {
        text: "Application notifications are automatic — when a provider applies, the ops team is notified. But the review decision is always manual. Auto-approve is not enabled and should not be. Every provider represents your brand to customers.",
        type: "daily-check",
      },
      {
        text: "Performance metrics (quality score, proof compliance, schedule reliability) are calculated automatically from job data. You don't need to compute anything manually. But interpreting the metrics and deciding on action is always human judgment.",
        type: "weekly-check",
      },
      {
        text: "Probation triggers are flagged automatically when thresholds are breached (2+ no-shows in 30 days, quality below 3.5, proof compliance below 80%). The flag appears on the provider record. But initiating the probation conversation and managing the improvement plan is manual — the system flags, you act.",
        type: "weekly-check",
      },
    ],
  },
];
