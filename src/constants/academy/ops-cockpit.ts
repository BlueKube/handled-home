import type { TrainingSection } from "@/components/academy/AcademySection";

export const opsCockpitSections: TrainingSection[] = [
  {
    id: "overview",
    title: "What is the Ops Cockpit?",
    type: "overview",
    content: `The Ops Cockpit is your command center. It's the first page you should see every morning and the last page you check before you leave. Everything on this page is designed to answer one question: "Is anything broken right now that I need to act on?"

The cockpit is organized into four columns that mirror the four things that matter most in a home services operation:

• NOW — Reliability. Are jobs happening? Are providers showing up? Is anything at risk today?
• MONEY — Cash flow. Did billing run? How much revenue came in? Are there past-due accounts?
• QUALITY — Service quality. What's the issue rate? Are providers submitting proof? Any disputes?
• MARKETS — Growth. Are referrals converting? Are provider applications coming in? Is any zone struggling?

Think of it like the dashboard of a car. You don't stare at the RPM gauge all day, but when the engine light comes on, you notice immediately. The cockpit works the same way — most days everything is green. When something turns yellow or red, that's your cue to investigate.`,
  },
  {
    id: "daily-rhythm",
    title: "The Morning Check-In (Your Daily Rhythm)",
    type: "walkthrough",
    steps: [
      {
        title: "Start with Cron Health (before the cockpit)",
        description: "Navigate to Governance → Cron Health first. If cron died overnight, half the cockpit numbers will be stale — billing didn't run, dunning didn't run, assignments didn't generate. You'll find out the hard way from customer complaints if you skip this. Takes 10 seconds. Make it muscle memory.",
        screenshot: { src: "/academy/ops-cron-health.png", alt: "Cron Health page showing recent successful runs" },
      },
      {
        title: "Scan the NOW column (left side)",
        description: "Look at jobs at risk, missing proof, and provider utilization. If jobs at risk is above zero, click through to Dispatcher Queues immediately. These are today's fires. If provider utilization is below 80%, that's a warning — check if assignment ran successfully. Below 60% is critical and means you likely have idle providers.",
        screenshot: {
          src: "/academy/ops-cockpit-dashboard.png",
          alt: "Ops Cockpit NOW column",
          annotations: [
            { type: "box", x: 0, y: 15, w: 23, h: 45, label: "NOW column", color: "blue" },
            { type: "pulse", x: 12, y: 25, label: "Jobs at risk", color: "red" },
          ],
        },
      },
      {
        title: "Check the MONEY column",
        description: "Revenue today and past due accounts. If failed payments are climbing, check if Stripe is having an outage before you start investigating individual accounts. A single Stripe incident can make 50 payments fail at once — that's not 50 customer problems, it's one infrastructure problem.",
        screenshot: { src: "/academy/ops-cockpit-dashboard.png", alt: "Ops Cockpit MONEY column" },
      },
      {
        title: "Glance at QUALITY and MARKETS",
        description: "Issue rate trending up? Check if it's concentrated in one zone or one provider — that changes your response entirely. A platform-wide uptick means a process problem. A single-zone spike means one provider is struggling. Markets column is your leading indicator — if referrals drop to zero for a week, investigate before it becomes a retention problem.",
        screenshot: { src: "/academy/ops-cockpit-dashboard.png", alt: "Ops Cockpit QUALITY and MARKETS columns" },
      },
      {
        title: "Check the Zone Health table (bottom)",
        description: "This table is your zone-by-zone report card. Green/Yellow/Red health scores. Sort by the worst-performing zone and ask: what's dragging it down? Capacity? Quality? Demand? Each one has a different fix. Don't try to fix all three at once.",
        screenshot: { src: "/academy/ops-cockpit-dashboard.png", alt: "Zone Health table at bottom of Ops Cockpit" },
      },
      {
        title: "Review Risk Alerts card",
        description: "Risk alerts surface operating model threshold violations — like 90-day cohort attach rate dropping below target or a zone's issue rate breaching the critical threshold. These are your early warning system. A yellow alert means 'watch this.' A red alert means 'fix this today.'",
        screenshot: { src: "/academy/ops-cockpit-dashboard.png", alt: "Risk Alerts card on Ops Cockpit" },
      },
    ],
  },
  {
    id: "dispatcher-queues",
    title: "Dispatcher Queues — Your Triage Station",
    type: "walkthrough",
    steps: [
      {
        title: "Understand the six queue tabs",
        description: "At Risk (jobs that might not get done today), Missing Proof (completed but unverified), Unassigned (no provider assigned), Coverage Gaps (zone capacity issues), Customer Issues (tickets from customers), Provider Incidents (provider-reported problems). Work them in this order — At Risk first because those affect today's customers.",
        screenshot: { src: "/academy/ops-dispatcher-queues.png", alt: "Dispatcher Queues with six tabs" },
      },
      {
        title: "Learn the keyboard shortcuts",
        description: "J/K moves between items. Enter opens detail. E escalates. N adds a note. R refreshes. These save enormous time when you're triaging 20+ items. A dispatcher who uses the mouse to click each item individually will take 3x longer than one using keyboard shortcuts.",
        screenshot: { src: "/academy/ops-dispatcher-queues.png", alt: "Dispatcher Queues keyboard shortcut overlay" },
      },
      {
        title: "Triage by severity, not by order",
        description: "The queue sorts by severity and age automatically, but you should still scan visually. A 2-hour-old 'At Risk' job for a first-time customer is more urgent than a 6-hour-old missing proof for a recurring customer. First impressions are irreplaceable in home services.",
        screenshot: { src: "/academy/ops-dispatcher-queues.png", alt: "Dispatcher queue items sorted by severity" },
      },
    ],
  },
  {
    id: "health-gauges",
    title: "Reading Health Gauges (What the Numbers Actually Mean)",
    type: "text",
    content: `The cockpit shows several gauges with green/yellow/red thresholds. Here's what actually matters:

PROVIDER UTILIZATION (target: ≥80%)
This measures how much of your provider capacity is actually being used. Below 80% is a warning — either assignment isn't running optimally or you don't have enough customers in the zone to fill routes. Below 60% is critical: you have idle providers and something needs immediate attention. Above 95% means you're running hot — one sick day causes cascading missed jobs.

The sweet spot is 80-90%. Enough slack to handle surprises, enough density to make routes efficient.

GROSS MARGIN (target: ≥25%)
Revenue minus provider payouts divided by revenue. If this drops below 25%, you're either paying providers too much per job or pricing subscriptions too low. Don't panic at 20% in a new zone — density hasn't kicked in yet. But if a mature zone (6+ months) is below 25%, investigate pricing.

For context, the U.S. landscaping industry operates at $188.8B annually with thousands of small operators. Most independent landscapers charge $49–$203 per lawn mowing visit (customer-facing price) depending on lot size, and operating margins vary wildly (15%–40%) based on route density. Our model works because density-optimized routes cut drive time, which is the #1 margin killer.

ISSUE RATE (platform-wide target: <3%)
Jobs with reported issues divided by total completed jobs. Above 5% means something systemic is wrong. Check if it's one provider dragging the average up. One provider with a 15% issue rate in a zone of 5 providers will make the zone average look bad even if the other 4 are at 1%. Note: zone-level thresholds are higher (under 8% for launch readiness) because individual zones have smaller sample sizes and more variance. The <3% target is the platform-wide aggregate.`,
  },
  {
    id: "pro-tips",
    title: "Pro Tips from Veteran Operators",
    type: "pro-tips",
    proTips: [
      {
        text: "Check Cron Health every morning before anything else. If cron died overnight, billing didn't run, dunning didn't run, and assignment didn't run. You'll find out the hard way from customer complaints if you don't check proactively.",
        context: "This is the #1 lesson every new operator learns the hard way. It takes 10 seconds to check.",
      },
      {
        text: "The MONEY column lies on Mondays. Weekend billing catches up Monday morning, so 'revenue today' will look abnormally high. Don't celebrate (or panic) until Tuesday numbers stabilize.",
        context: "Billing automation runs on a daily cycle. Weekend backlog creates a Monday spike.",
      },
      {
        text: "When issue rate spikes, check ONE provider first. In 70% of cases, a sudden quality drop is one provider having a bad week — personal issues, equipment problems, or rushing because they took on too much work outside the platform.",
        context: "System-wide quality issues are rare. Provider-specific issues are common.",
      },
      {
        text: "A zone with 95%+ utilization isn't healthy — it's fragile. One provider calling in sick means 10-15 homes don't get serviced. Keep a 10-15% buffer by recruiting backup providers before you hit 90%.",
        context: "The difference between a great week and a disaster week is one phone call.",
      },
      {
        text: "The Dispatcher Queues 'At Risk' tab is your fire alarm. If it's empty, you're having a good day. If it has 5+ items, cancel your morning coffee — you're triaging now.",
      },
    ],
  },
  {
    id: "watch-outs",
    title: "Watch Out For...",
    type: "watch-outs",
    watchOuts: [
      {
        text: "Don't refresh the Ops Cockpit every 5 minutes expecting real-time updates. Most metrics update hourly or daily. Refreshing obsessively wastes your attention and trains you to ignore the numbers because 'they never change.'",
        severity: "caution",
      },
      {
        text: "A 'healthy' cockpit with zero alerts doesn't mean zero problems. It means zero DETECTED problems. If cron health hasn't run, if proof requirements aren't configured on your SKUs, or if you don't have assignment running nightly, the cockpit will show green while your operation is actually broken. Trust but verify.",
        severity: "critical",
      },
      {
        text: "Zone health scores can be misleading for new zones. A zone with 2 providers and 5 customers will show 'green' on capacity but that's because there's almost nothing happening. Look at absolute numbers (total jobs, total customers) alongside the health score.",
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
        text: "Billing cycle runs automatically every night via cron. You don't need to trigger it. But you DO need to check that it ran — Cron Health page is your verification.",
        type: "daily-check",
      },
      {
        text: "Assignment engine runs nightly and assigns providers to visits for the next planning window. If it fails, tomorrow's jobs won't have providers assigned. Check assignment run status daily.",
        type: "daily-check",
      },
      {
        text: "Dunning (payment retry) follows a 5-step escalation ladder automatically. Don't manually chase past-due accounts until they've reached step 3 — the automation handles steps 1-2 (retry + email reminder).",
        type: "set-and-forget",
      },
      {
        text: "Zone health scores recalculate automatically. You don't need to refresh them. Review the zone health table weekly to catch slow-moving trends that daily checks miss.",
        type: "weekly-check",
      },
    ],
  },
  {
    id: "real-world",
    title: "Real-World Context",
    type: "real-world",
    realWorldData: [
      {
        text: "The U.S. landscaping services industry is $188.8B (2025). Most operators are small businesses with 1-5 crews. The average lawn mowing visit costs $49–$203 (customer-facing price) depending on lot size, with a national average around $122. Route density is the #1 factor in profitability — an operator who can do 8 jobs in a ZIP code beats one doing 8 jobs across a city.",
        source: "IBISWorld, Angi consumer cost guides (2025)",
      },
      {
        text: "Professional pest control is a $29.7B market (2026) and one of the most subscription-friendly home service categories. Quarterly treatments are standard, and customer retention rates in pest control are among the highest in home services — once a customer starts, they rarely stop voluntarily.",
        source: "IBISWorld market research (2026)",
      },
      {
        text: "The average professional house cleaning costs $175 per visit nationally ($118–$237 range). This means a customer on a bi-weekly cleaning plan is consuming $350–$474/month in cleaning value alone. This is why bundled subscription pricing at $129–$279/month represents genuine savings to the customer while still covering provider costs.",
        source: "Angi, This Old House consumer cost guides (2025)",
      },
    ],
  },
];
