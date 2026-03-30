import type { TrainingSection } from "@/components/academy/AcademySection";

export const marketLaunchSections: TrainingSection[] = [
  {
    id: "overview",
    title: "Market Launch & Provider Recruitment",
    type: "overview",
    content: `The other Academy modules teach you how to run the admin console. This module teaches you how to fill it with a real market — providers who show up, customers who stay, and a zone that generates revenue.

Launching a market is a sequence, not a checklist. Recruit providers first, because without supply you have nothing to sell. Calibrate your SKUs from provider interviews, because wrong durations cause cascading failures from day one. Size your zones from drive-time data, because geography determines provider economics. Then — and only then — start acquiring customers.

The most common launch failure mode is doing these steps out of order: signing up customers before you have providers, or drawing zone boundaries before you know how far providers can drive. Every section in this module follows the correct sequence. Don't skip ahead.`,
  },
  {
    id: "provider-targeting",
    title: "Provider Targeting — Who to Recruit First",
    type: "text",
    content: `Not all providers are equal at launch. You need the right providers in the right order. Recruit the wrong archetype first and you'll spend months fixing quality issues instead of growing.

ARCHETYPE A: MID-CAREER PROVIDERS (your primary target)

These are providers with 15-25 existing customers, 4+ star ratings on review platforms, 2-5 years in business, running solo or with a 2-3 person crew. They're good at their job but spending 20-30% of their week on sales and admin instead of doing the work they're actually skilled at. That admin burden is your value proposition — you're offering to eliminate it.

Where to find them:
• Thumbtack/Angi listings: Sort by rating. Target 4-4.5 stars, not 5. The 5-star providers with 200 reviews are booked solid — they don't need you. The 4.2-star provider with 30 reviews who responds quickly is your sweet spot.
• Google Maps reviews: Search "[service type] near [target ZIP]" and read the reviews. Providers who reply to reviews professionally are operator-minded — they care about reputation.
• Nextdoor recommendations: Look for providers who get recommended but aren't dominant in the area. They have social proof but room to grow.
• Local trade association directories: These providers take their business seriously enough to join a professional organization.
• Facebook groups for local service providers: Join groups like "[City] Landscapers" or "[City] Home Services." Observe for a week before recruiting — learn who's active, who's helpful, who's frustrated with their current setup.

QUALIFYING IN 10 MINUTES

Once you find a candidate, a short phone call tells you if they're worth pursuing. Three questions: "How many regular customers do you have right now?" (confirms archetype), "What's the worst part of running your business?" (reveals their pain — the answer should be admin, scheduling, or customer acquisition, not "I don't like the work"), and "If we could fill your open days with recurring jobs, would you take them?" (tests willingness). If they say their schedule is full and they're happy, they're Archetype C — thank them and move on. If they light up talking about eliminating admin work, they're your person.

ARCHETYPE B: NEW PROVIDERS (your backup bench)

Providers with 0-5 customers, high energy, still building their reputation. Your value prop to them: "Get customers from day one without cold-calling." Use Archetype B providers as backups, not primaries — their quality is untested. Pair each new provider with a veteran for the first 2 weeks so they learn your standards.

ARCHETYPE C: ESTABLISHED PROVIDERS WITH 40+ CUSTOMERS (not at launch)

Don't waste time recruiting them at launch. They have no pain you solve — their schedule is full, their reputation is built, and they don't need your platform. Convert them later via BYOC after you've proven that density-optimized routes meaningfully reduce their drive time. That's the only pitch that works for Archetype C — concrete data from your own zone showing how clustering jobs saves hours per week. If an Archetype C provider reaches out on their own during launch, add them to a "future provider" list with a note on their capacity and follow up at week 10 with the density pitch.`,
  },
  {
    id: "the-pitch",
    title: "The Pitch — Value Prop and Objection Handling",
    type: "text",
    content: `The pitch to a provider is not "join our platform." It's "stop doing the parts of your job you hate."

THE VALUE PROPOSITION

"We're building an app that fills your schedule with recurring customers — no more door-to-door selling, no more chasing payments, no more scheduling headaches. You keep your existing customers (bring them with you through our BYOC program and earn a bonus per active customer for 90 days). We handle the billing, scheduling, and customer communication. You show up, do great work, and get paid weekly."

This pitch works because it addresses the three things mid-career providers hate most: unpredictable income, wasted time on admin, and the constant need to sell. BYOC removes the biggest risk objection — they're not "giving up" their customers, they're upgrading their customers' experience.

THE FOUR OBJECTIONS YOU'LL HEAR EVERY TIME

"Why would I give you a cut?"
→ "You're not giving us a cut — you're trading admin time for paid work time. How many hours a week do you spend on invoicing, scheduling, and selling? We eliminate all of that. Your effective hourly rate goes up because you're spending more hours on billable work."

"What if you steal my customers?"
→ "BYOC customers are yours. They came through your invite link. If you leave, they can follow you. We're not a marketplace — we're your operating system." This is the most important objection to handle well. Providers who feel trapped churn. Providers who feel empowered stay.

"I already have enough customers."
→ "Great — then BYOC costs you nothing to try. Bring your customers onto the app so they get proof photos, easy scheduling, and automatic billing. If you want new customers too, we'll fill your open capacity." The goal here isn't to convince them they need more work — it's to get them using the tool with existing customers. Once they see the admin time savings, they stay.

"How much do I get paid?"
→ "We'll work with you to set fair rates based on your actual costs. You'll see your exact payout per job before you accept any work." Never promise a specific number in the pitch. Payout rates depend on the market, the service, and the job complexity. What you CAN promise: transparency and weekly payments. Those two things matter more to providers than the exact dollar amount.`,
  },
  {
    id: "pilot-launch",
    title: "Pilot Launch Checklist",
    type: "walkthrough",
    steps: [
      {
        title: "Pre-launch: 30 days before soft launch",
        description: `You need these before you accept a single customer:

• 8 pre-screened providers ready to activate on day one — not 8 in the pipeline, 8 who have completed background checks, signed agreements, and confirmed their availability. Start with 12-15 candidates to account for dropoff.
• A waitlist of at least 50 interested customers — use a landing page with a referral incentive to build this before launch. Why 50? At typical waitlist-to-activation conversion rates, 50 signups yields ~20 activated customers — enough to keep 8 providers partially busy while you work out operational issues. If you can't get to 50, your landing page copy or referral incentive needs work — fix that before you set a launch date.
• SKU catalog calibrated for this market — durations and levels validated from provider interviews (see the SKU Catalog module's Provider Interviews section).
• Pricing set against local competitive rates — check what Thumbtack/Angi providers charge in your target ZIP codes. Your subscription needs to feel like a deal compared to à la carte.
• First-week scheduling capacity blocked — reserve 25% buffer so you're not maxed out on day one.

If any of these are not ready, push the launch date. A bad launch is worse than a late one — early customers set the reputation for everything that follows.`,
        screenshot: { alt: "Pre-launch checklist in admin showing completion status" },
      },
      {
        title: "Soft launch: weeks 1-2",
        description: "Activate your waitlist first — these are your most motivated early customers and the ones most likely to refer. Cap acceptance at 75% of your provider capacity so you have a buffer for problems. Do NOT run paid acquisition yet. Your job in the first two weeks is to find the operational issues that planning didn't anticipate: scheduling conflicts specific to this market, customer expectations that differ from your assumptions, provider behaviors that need coaching. Personally follow up on the first 10 completed jobs. Get your NPS above 40 before you scale — anything below that means you're not ready for volume.",
        screenshot: { alt: "Soft launch dashboard showing early job metrics and NPS" },
      },
      {
        title: "Go-live graduation: the four criteria",
        description: "Flip the zone to Live status (Admin → Markets → Zones) when ALL four criteria are met: NPS above 40 over the last 30 days, issue rate below 8%, at least 8 active providers (completed at least 1 job each in the last 14 days), utilization between 60-80%. This unlocks paid acquisition campaigns. Brief your providers that volume will increase — manage their expectations so they're prepared, not overwhelmed. Missing even one criterion means you're not ready. See the Zones & Markets module for the full graduation workflow.",
        screenshot: { alt: "Zone status change modal with graduation criteria" },
      },
      {
        title: "The 12-week milestone map",
        description: `Week 1-2: Provider interviews (5-10 across your target categories). This is research, not recruitment — you're gathering data for SKU calibration and understanding the local market.
Week 3: SKU calibration from interview data. Enter provider-reported durations and costs into the calibration tool.
Week 4: Zone definition using the H3 builder and drive-time data from interviews.
Week 5: Provider onboarding. BYOC training, app walkthrough, expectations setting.
Week 6: Soft launch — providers bring 5-10 BYOC customers each. You're now live with real customers.
Week 7-8: Monitor. First service completions, proof photo compliance, billing receipts. Fix what breaks.
Week 9-10: Measure. Retention, add-on attach rate, provider satisfaction. Is the model working?
Week 11-12: Decide. Pull the five success metrics (see below) and match to one of three paths: If 60-day retention is above 70% AND gross margin is above 15%, you have a working model — expand to a second zone. If retention is above 70% but margin is below 15%, the customers like it but the economics are wrong — recalibrate pricing and payout rates. If retention is below 60%, the subscription isn't delivering enough value — investigate root cause before spending anything on growth.`,
        screenshot: { alt: "12-week pilot timeline with milestone markers" },
      },
    ],
  },
  {
    id: "success-metrics",
    title: "Success Metrics — What to Measure and When",
    type: "text",
    content: `After 12 weeks of a pilot launch, you need five data points to decide whether to expand, recalibrate, or stop. These aren't vanity metrics — each one tests a specific assumption about whether the business model works in this market.

BYOC ACTIVATION RATE
Of providers who joined, what percentage actually sent BYOC invites to their existing customers? Of invites sent, what percentage activated a subscription? Target: 60% of providers send invites, 30% of invites convert. If providers aren't sending invites, they don't trust the platform enough. If customers aren't converting, the subscription value prop isn't landing.

60-DAY CUSTOMER RETENTION
Of customers who subscribed in the first month, what percentage are still active at day 60? Target: above 70%. Below 60% means customers are trying it and deciding it's not worth the price. Between 60-70% is fixable — investigate whether it's service quality, pricing, or expectations mismatch. Above 70% proves the subscription delivers ongoing value.

PROVIDER UTILIZATION
What percentage of available provider capacity is filled with jobs? Target: above 50% by week 8. Below 40% means you don't have enough customers to keep providers busy — they'll churn for better income elsewhere. Above 60% at this stage is excellent.

SERVICE QUALITY (ISSUE RATE)
Issues reported per 100 completed jobs. Target: below 8% — this is the same threshold used for go-live graduation (see the Zones & Markets module). During the first 4 weeks of soft launch, you may see rates above 8% as you work out operational kinks — that's expected. But by the go-live graduation check, you need to be below 8% consistently. Above 15% at any point means a systemic quality problem: wrong providers, wrong SKU definitions, or mismatched customer expectations.

UNIT ECONOMICS (GROSS MARGIN)
Is the subscription spread positive per zone? Revenue minus provider payouts minus direct costs, divided by revenue. Target: above 15% gross margin by week 12. Don't panic at 10% in week 6 — density hasn't kicked in yet. But if you're below 10% at week 12, investigate pricing and payout rates. See the Zones & Markets module for how the 15% expansion threshold relates to the 25% mature-zone target.`,
  },
  {
    id: "pro-tips",
    title: "Pro Tips from Veteran Launchers",
    type: "pro-tips",
    proTips: [
      {
        text: "Your first provider sets the quality bar for every provider who follows. If your first provider submits blurry proof photos and skips edge work, that becomes 'normal' in the zone. If your first provider delivers immaculate work with clear before/after photos, every new provider compares themselves to that standard. Recruit your best Archetype A provider first, even if it takes longer.",
        context: "Quality culture is established in the first 2 weeks. It's almost impossible to raise later.",
      },
      {
        text: "A referral program that costs you $30 per customer acquisition is a steal if that customer stays 12+ months at $179/month. Don't panic about referral costs — panic about referral churn. If referred customers leave within 60 days, your referral program is attracting deal-seekers, not subscribers. Track referred-customer retention separately from organic.",
        context: "CAC payback period matters more than CAC amount.",
      },
      {
        text: "The provider value prop script is a starting point, not a script to memorize. Adapt it to the provider's specific situation. A solo landscaper who hates invoicing needs to hear about payment automation. A 3-person crew leader who can't find new customers needs to hear about demand generation. Listen for 5 minutes, then pitch for 2.",
        context: "Providers join for different reasons. Match the pitch to their pain.",
      },
      {
        text: "Before you launch in any market, spend a day as a customer of the existing services in that area. Book a lawn mow, a pest treatment, a cleaning. Experience the status quo firsthand — the scheduling friction, the no-communication, the variable quality. This grounds your launch in reality and gives you authentic language for your marketing.",
      },
    ],
  },
  {
    id: "watch-outs",
    title: "Watch Out For...",
    type: "watch-outs",
    watchOuts: [
      {
        text: "Signing up customers before you have providers is the fastest way to kill a market. Every customer who signs up, gets excited, and then waits 5+ days for their first service will churn AND tell their neighbors. You get one chance at a first impression in a neighborhood. Supply before demand, always.",
        severity: "critical",
      },
      {
        text: "Don't launch with one provider per category. If your only pest control provider gets sick, every pest customer in the zone misses their service. Minimum two providers per category you're selling, with one designated as backup. Three is better.",
        severity: "critical",
      },
      {
        text: "Providers who say 'yes' in the interview but don't complete onboarding within 2 weeks are unlikely to ever activate. Set a clear 14-day deadline for background checks and agreement signing. After that, move them to a 'passive interest' list and recruit someone else. The pipeline is not the same as supply.",
        severity: "caution",
      },
      {
        text: "Don't generalize success metrics from one zone to predict another. A zone in a high-income suburb will perform differently than one in a mixed-income area, even in the same metro. Each zone's first 6 weeks of data is specific to that zone. Use it for that zone's decisions, not as a template for all zones.",
        severity: "caution",
      },
    ],
  },
  {
    id: "automation",
    title: "What's Automated vs. What Needs Your Hands",
    type: "automation",
    automationNotes: [
      {
        text: "BYOC invite tracking is fully automated — the system tracks which providers sent invites, which customers activated, and the bonus payouts. You don't need to manually reconcile BYOC bonuses. Check the Growth dashboard to monitor BYOC funnel health (invite-to-activation conversion, active BYOC customers per provider).",
        type: "set-and-forget",
      },
      {
        text: "Provider recruitment is entirely manual at launch. There is no automated provider acquisition channel yet. Build a spreadsheet of 20-30 Archetype A candidates before you make your first call. Track status: contacted → interested → interviewing → onboarding → active.",
        type: "daily-check",
      },
      {
        text: "Zone health scoring activates automatically once you flip a zone to Soft Launch. From that point, utilization, NPS, issue rate, and response time are tracked without manual input. Review the zone health table daily during the first 4 weeks — weekly after that.",
        type: "daily-check",
      },
      {
        text: "The 12-week milestone review is not automated. Set calendar reminders at weeks 4, 8, and 12 to pull the five success metrics and make go/no-go decisions. The system gives you the data — you supply the judgment.",
        type: "weekly-check",
      },
    ],
  },
];
