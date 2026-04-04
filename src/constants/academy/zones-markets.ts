import type { TrainingSection } from "@/components/academy/AcademySection";

export const zonesMarketsSections: TrainingSection[] = [
  {
    id: "overview",
    title: "What Are Zones and Why Do They Matter?",
    type: "overview",
    content: `A zone is the fundamental unit of your market. It's not just a geographic boundary — it's the container for all your density economics. Every provider you onboard, every customer you acquire, and every job you schedule lives inside a zone. Get the zones wrong and nothing else works well.

We use an H3 hex grid system. Hexagons tile perfectly without gaps or overlaps, and every hex at the same resolution has the same area — so when you compare utilization across zones, you're comparing apples to apples. Don't try to draw irregular shapes to match city limits or zip codes. Align to the hex grid and let the math work.

Why does density matter? Because home services is a proximity business. When a provider's next job is 5 minutes away instead of 35, they can fit more jobs in a day, earn more per hour, and they churn less. When customers see providers who know their neighborhood, they convert faster and stay longer. Density is the engine — everything else is just levers.

The zone lifecycle has four stages:

• Planning — You've identified demand signals (referral traffic, waitlist signups, inbound provider interest) but haven't launched. The zone exists in the system as a draft. You're deciding boundaries, doing capacity planning, and building your pre-launch provider bench.

• Soft Launch — You have at least 5 active providers and have begun accepting customers, but you're not yet running paid acquisition. This is a validation phase. You're confirming that the demand is real, that providers can handle the job mix, and that your NPS is strong enough to justify scaling.

• Live — The zone is fully operational. You're running acquisition, monitoring health weekly, and managing capacity proactively. This is where most of your operational time goes.

• Paused / Sunset — Demand dried up, a competitor moved in, or provider supply collapsed and you couldn't rebuild it. Pausing is reversible; sunsetting is not. Don't sunset a zone without a 90-day recovery attempt first — markets can be rebuilt if you're patient.`,
  },
  {
    id: "zone-design",
    title: "Zone Design: Drawing Boundaries That Work",
    type: "walkthrough",
    steps: [
      {
        title: "Start with the demand signal, not the map",
        description:
          "Before you draw a single boundary, pull your referral traffic heatmap and your inbound provider applications. Where are customers already searching? Where are providers already living? The best zone design follows existing density signals — you're formalizing what's already happening, not trying to create demand from scratch. If you don't have data yet, use US Census tract population density as a proxy: target areas with 3,000+ households per square mile as your initial anchor.",
        screenshot: { src: "/academy/zone-builder.png", alt: "Referral traffic heatmap overlaid on H3 hex grid" },
      },
      {
        title: "Draw the boundary at the natural density break",
        description:
          "Look for the edges where the heatmap cools off — that's where your zone boundary belongs. Don't try to include a neighborhood 'just in case' if the signal is weak there. A tight zone with strong density outperforms a large zone with thin coverage every single time. As a rule of thumb: launch zones should cover 15,000–40,000 households. Below 15K you won't generate enough job volume to retain providers. Above 40K you'll have drive-time problems before you have the provider count to solve them.",
        screenshot: { src: "/academy/zone-builder.png", alt: "Zone boundary drawn at density break with household count overlay" },
      },
      {
        title: "Set provider density requirements before you open the zone",
        description:
          "Minimum viable zone requires 5 active providers across at least 3 different service categories. 'Active' means they've completed at least 1 job in the last 30 days — not just onboarded. Ideal launch density is 8–12 providers. Below 5, you'll have unacceptable response times and customers will churn before you can fix it. Above 15, you'll have underutilized providers who will churn for the same reason. The sweet spot is sustainable density, not maximum density.",
        screenshot: { src: "/academy/zone-builder.png", alt: "Provider density map showing active providers within zone boundary" },
      },
      {
        title: "Set customer density thresholds for zone viability",
        description:
          "A zone becomes self-sustaining when it reaches 200 active subscribers. Below 100, providers are doing too much dead-driving and the economics don't work for them. Between 100–200, you're in the fragile zone — keep monitoring weekly. Above 200, the flywheel starts: providers are busy, response times are short, referrals compound. Your target steady state is 300–500 customers per zone before you consider splitting.",
        screenshot: { src: "/academy/zones-list.png", alt: "Zone customer density chart showing viability thresholds" },
      },
      {
        title: "Configure the zone in the system",
        description:
          "In Admin → Markets → Zones, create the zone record with the H3 hex IDs that define the boundary, the zone name, target launch date, assigned Zone Manager (if applicable), and minimum/maximum provider counts. Set the capacity thresholds here — the system uses these to trigger health alerts. Save as Draft until you're ready to move into soft launch. You can't accept customers in a Draft zone.",
        screenshot: { src: "/academy/zones-list.png", alt: "Zone configuration form in Admin Markets panel" },
      },
    ],
  },
  {
    id: "zone-health",
    title: "Zone Health Monitoring",
    type: "text",
    content: `The Zone Health table lives at the bottom of the Ops Cockpit. It's a real-time operational view for every active zone. Check it as part of your morning routine — most days it's all green and takes 30 seconds. When numbers look off, that's your signal to dig in before it becomes a customer or provider churn event.

Each zone row shows these columns:

• Zone — zone name and region
• Jobs Today — total jobs scheduled for the current day in this zone
• Unassigned (Locked) — jobs in the locked planning window that have no provider assigned. This should be 0 in healthy zones. Any unassigned locked jobs need immediate attention.
• Reschedule % — percentage of jobs that were rescheduled in the rolling window. High rescheduling suggests capacity or reliability issues.
• Proof Missing % — percentage of completed jobs without uploaded photo proof. Target: below 10%. Configurable via autopilot thresholds (default max_proof_missing_rate: 10%).
• Issues (7d) — count of reported issues in the last 7 days for this zone.
• Open Exceptions — count of unresolved operational exceptions (window_at_risk, coverage_break, etc.).

When a zone shows high numbers in Unassigned or Proof Missing: read the specific metrics to diagnose the problem, then address that problem — don't try to "improve the zone" generically. High unassigned? You have a capacity or assignment problem. High proof missing? You have a compliance problem — contact providers directly.

Note: Business Health gauges (attach rate, churn, margin) are tracked separately in the Ops Cockpit's top-level gauge cards, not in the zone table.`,
  },
  {
    id: "capacity-planning",
    title: "Capacity Planning: Under, Over, Split, Merge",
    type: "walkthrough",
    steps: [
      {
        title: "Diagnosing an undercapacity zone",
        description:
          "Signs: utilization above 85%, response time above 6 hours, providers declining jobs, customer churn ticking up. Root cause is almost always a provider supply problem — either you don't have enough providers, or the providers you have aren't working enough hours. First check: is the issue supply (not enough providers) or availability (providers are onboarded but not taking jobs)? Pull the Provider Availability report. If providers are available but not accepting, you have a matching or pricing problem. If they're simply not online, you have a retention or engagement problem.",
        screenshot: { src: "/academy/ops-zones.png", alt: "Provider Availability report showing online hours vs accepted jobs" },
      },
      {
        title: "Diagnosing an overcapacity zone",
        description:
          "Signs: utilization below 55%, providers completing fewer than 8 jobs per week, provider churn spiking as they seek more reliable income. You have too many providers for the demand. Short-term fix: pause provider recruitment and run a customer acquisition push. Medium-term fix: assess whether the zone's demand ceiling is genuinely low, or whether you simply haven't grown into the potential. If demand has plateaued after 90 days of acquisition effort, consider a zone merge.",
        screenshot: { src: "/academy/ops-zones.png", alt: "Zone utilization trend chart showing overcapacity indicators" },
      },
      {
        title: "When to split a zone",
        description:
          "Split triggers: zone has 500+ active customers, provider count is above 20, and response time is starting to creep up despite adequate provider count. What's happening is geographic sprawl — the zone has grown large enough that providers are driving across it rather than clustering. Before you split, make sure your new zones each have at least 8 providers who live or operate in that sub-area. A clean split creates two healthy zones. A premature split creates two fragile zones. Don't split below 400 customers total.",
        screenshot: { src: "/academy/ops-zones.png", alt: "Zone split wizard showing proposed sub-zone boundaries and provider distribution" },
      },
      {
        title: "When to merge zones",
        description:
          "Merge triggers: two adjacent zones are both below 150 customers, both have fewer than 6 active providers, and neither has shown growth in 60 days. The combined zone needs to clear 8 providers and 200 customers post-merge to be viable — if it won't, you're merging two failing zones into one, which just delays the decision. Merges require customer communication (some customers will see a new Zone Manager or slightly different response times) and provider communication (territory expectations may change).",
        screenshot: { src: "/academy/ops-zones.png", alt: "Zone merge confirmation screen showing combined metrics projection" },
      },
    ],
  },
  {
    id: "market-launch",
    title: "Launching a New Market: From Zero to Multi-Zone",
    type: "walkthrough",
    steps: [
      {
        title: "Pre-launch checklist (30 days before soft launch)",
        description:
          "You need 8 pre-screened providers ready to activate on day one — not 8 in the pipeline, 8 who have completed background checks, signed agreements, and confirmed their availability. You need a waitlist of at least 50 interested customers (use a landing page + referral incentive to build this before launch). You need your SKU catalog configured for this market's job types, your pricing set against local competitive rates, and your first-week scheduling capacity blocked. If any of these are not ready, push the launch date — a bad launch is worse than a late one.",
        screenshot: { src: "/academy/governance-launch.png", alt: "Pre-launch checklist in Admin Markets showing completion status" },
      },
      {
        title: "Soft launch: the first 2 weeks",
        description:
          "Activate your waitlist first — these are your most motivated early customers and the ones most likely to refer. Cap acceptance at 75% of your provider capacity so you have a buffer for problems. Do not run paid acquisition yet. Your job in the first two weeks is to find the operational issues that your planning didn't anticipate: scheduling conflicts specific to this market, customer expectations that differ from your other markets, provider behaviors that need coaching. Get your NPS above 40 before you scale.",
        screenshot: { src: "/academy/governance-launch.png", alt: "Soft launch dashboard showing waitlist activation and early job metrics" },
      },
      {
        title: "Graduating from soft launch to live",
        description:
          "Criteria to go live: NPS above 40 over the last 30 days, issue rate below 8%, at least 8 active providers (completed at least 1 job each in the last 14 days), utilization between 60–80%. When all four are met, flip the zone status to Live in Admin → Markets → Zones. This unlocks paid acquisition campaigns. Brief your providers that volume will increase — manage their expectations so they're prepared, not overwhelmed.",
        screenshot: { src: "/academy/governance-launch.png", alt: "Zone status change modal with graduation criteria checklist" },
      },
      {
        title: "Scaling from 1 zone to multi-zone",
        description:
          "Don't open Zone 2 until Zone 1 is healthy (green health score, stable for 60+ days). The temptation to expand while Zone 1 is still 'mostly working' is the most common mistake in market expansion. Zone 2 will pull your operational attention. If Zone 1 is fragile when that happens, it will deteriorate faster than you can manage both. The rule is: your first zone is your proof of concept. Your second zone is your proof that you can replicate it. Only expand when you can genuinely afford to split your attention.",
        screenshot: { src: "/academy/zones-list.png", alt: "Multi-zone market map showing Zone 1 health before Zone 2 launch" },
      },
    ],
  },
  {
    id: "zone-sizing",
    title: "Zone Sizing — The Math Behind Good Boundaries",
    type: "text",
    content: `The rules of thumb in the Zone Design section above will get you started, but when you're committing real money to a market launch, you need actual math. Zone sizing is drive-time-based, not geographic — a zone's value is determined by how many jobs a provider can complete in a day, which is entirely a function of drive time between stops.

ZONE SIZING INPUTS

Before drawing boundaries, gather these data points for your target area:

• Drive time between stops — From provider interviews and Google Maps API. This is the primary zone boundary determinant. Target: no more than 15 minutes between any two stops within the zone.
• Population density — From Census data / ACS (American Community Survey). Tells you demand potential per square mile.
• Home ownership rate — From Census data. Renters rarely purchase home services subscriptions. Target areas with >60% ownership.
• Median household income — From Census / ACS. Willingness to pay for subscription services. Target areas where >40% of households have HHI above $75K.
• Lot sizes — From Zillow or county records. Directly impacts service duration variation across properties.
• HOA density — From local knowledge. HOA neighborhoods have uniform service requirements, which means more efficient routes.
• Competitor density — From Thumbtack/Angi listings in target ZIP codes. High density means existing provider supply you can recruit from; it also means customers already buy these services.
• Climate zone — From USDA / NOAA data. Determines seasonal cadence patterns (year-round lawn care in Texas vs. April-October in Minnesota).

ZONE SIZE HEURISTICS BY ENVIRONMENT

Dense suburban (lots under 1/4 acre): 3-5 mile radius, 8-10 stops/day, 60-90 min total drive time budget.
Standard suburban (1/4 to 1/2 acre): 5-8 mile radius, 6-8 stops/day, 90-120 min total drive time budget.
Exurban (1/2 to 2 acres): 8-12 mile radius, 4-6 stops/day, 120-150 min total drive time budget.
Rural (2+ acres): Not viable at launch. Drive time kills the economics.

THE VIABILITY FORMULA

A zone is viable when:

homes_in_zone × home_ownership_rate × income_qualifying_rate × conversion_rate ≥ min_customers

Where:
• homes_in_zone: from Census block data for the hex cells in your zone
• home_ownership_rate: from ACS data (target >60%)
• income_qualifying_rate: % of households with HHI >$75K (target >40%)
• conversion_rate: conservative 1-2% at launch (proven markets may hit 3-5%)
• min_customers: 15 — this is the mathematical floor to justify drawing the boundary at all (enough jobs for providers to cover gas and time). It is NOT the operational launch target. The capacity section above defines the real thresholds: 50 waitlisted customers before soft launch, 100 before the zone stops being fragile, 200 before the flywheel is self-sustaining.

Example: A zone with 25,000 homes, 70% ownership, 45% income-qualifying, at 1.5% conversion = 25,000 × 0.70 × 0.45 × 0.015 = 118 customers. That clears the 15-customer viability floor and puts you in the 100-200 range where the zone is growing but still needs active management before reaching the 200 self-sustaining threshold.

HOW THIS CONNECTS TO THE H3 HEX GRID

The platform uses H3 hex-grid geo cells (the Zone Builder wizard). This means boundaries can be computationally optimized:
1. Start with provider home base locations as seed points
2. Grow the zone by adding adjacent H3 cells
3. Score each candidate cell: demand_density × accessibility - drive_time_cost
4. Stop when the zone reaches the capacity target or the drive-time limit
5. The Zone Builder wizard already supports this workflow

The hex grid advantage: every hex at the same resolution has the same area, so utilization comparisons across zones are apples-to-apples. Don't fight the grid by trying to match city limits or ZIP codes.`,
  },
  {
    id: "expansion",
    title: "Expansion — When and How to Grow",
    type: "text",
    content: `Expansion is the most expensive mistake you can make if you do it too early, and the most expensive opportunity you miss if you do it too late. The data will tell you when — but only if you're watching the right metrics.

EXPANSION DECISION CRITERIA

A zone is ready to expand (add a second zone in the same metro, or replicate the model in a new metro) when ALL of these thresholds are met:

• 60-day customer retention: >70% — Proves the subscription delivers enough value that customers stay.
• Provider NPS: >40 — Proves providers will recommend the platform. Below 40, you'll struggle to recruit in a new zone via word-of-mouth.
• Attach rate (2nd service within 60 days): >25% — Proves bundle expansion is working, not just single-service adoption.
• Gross margin per zone: >15% — Proves unit economics are viable at launch scale. Below 15%, expansion just multiplies losses. (The mature-zone operating target is 25%+ — see the Ops Cockpit health gauges. 15% is the minimum to prove the model works before density improvements push margin higher.)
• Support minutes per job: <5 min — Proves ops are scalable. Above 5 min/job, you'll drown in tickets when volume doubles.

If any metric is below threshold, fix it in the existing zone before opening a new one. There is no partial credit — a zone at 14% margin is not "almost ready to expand," it's a margin problem that will be worse in a new market where you have zero operational efficiency gains. Expansion amplifies both your strengths and your weaknesses.

REGIONAL VARIATION — WHAT CHANGES MARKET TO MARKET

When expanding to a new metro or region, these factors vary and need local calibration:

• Climate: Snow states need a different seasonal calendar than Sun Belt markets. Lawn care is 12 months/year in Austin but 7-8 months in Minneapolis. This changes your revenue model, provider utilization patterns, and which service categories anchor the subscription.
• Lot size: Northeast yards are smaller than Texas yards. This impacts service duration per level, handle cost per job, and stops-per-day targets.
• Income: Higher income markets support higher subscription prices. Use zone pricing multipliers (set in the Control Room) rather than changing base prices.
• Density: Urban vs. suburban vs. exurban changes zone radius, stops-per-day targets, and the minimum provider count needed for acceptable response times.
• Competition: Saturated markets have abundant provider supply to recruit from but face customer acquisition headwinds. Underserved markets have the opposite profile.
• Regulation: Check this first — it's the one that can block you entirely. Some states require licensing for pest control, tree trimming, or pressure washing. A licensing requirement can make an entire service category non-viable in a new state, which changes your plan and bundle composition before you recruit a single provider. Map compliance requirements per category before doing anything else in a new market.

THE GOAL: REPLICABLE MARKET LAUNCH

The long-term goal is to turn on a new region with minimal human intervention. The system already automates: ZIP code boundaries (Census TIGER files), population/income/ownership data (ACS), and zone boundary suggestions (H3 builder with drive-time API). What still requires human judgment: local provider recruitment, regional SKU calibration from provider interviews (see the SKU Catalog module), competitive positioning, and pricing strategy. Each new market launch should be faster than the last — template what worked, investigate what didn't.

For the full pilot launch playbook — including the 12-week timeline, provider recruitment strategy, and success metrics — see the Market Launch & Provider Recruitment module.`,
  },
  {
    id: "pro-tips",
    title: "Pro Tips: What Experience Actually Teaches You",
    type: "pro-tips",
    proTips: [
      {
        text: "Design zones around provider commute patterns, not customer distribution.",
        context:
          "Customers are distributed based on housing density — you can't control that. But you can choose zone boundaries that cluster providers near where they already live and work. A provider who drives 8 minutes to their first job instead of 28 minutes will complete 20–30% more jobs per day and churn at half the rate. Check the zip code distribution of your provider applicants before you finalize any boundary.",
      },
      {
        text: "Your first 50 customers in a zone set the quality bar for everything that follows.",
        context:
          "Early customers give more detailed reviews, refer more aggressively (in both directions), and set the word-of-mouth reputation for the zone. Assign your best providers to early customers. Personally follow up on the first 10 jobs in any new zone. The cost of one bad early impression is disproportionate — it shapes the review signal that determines whether the zone builds momentum or stalls.",
      },
      {
        text: "Utilization at 70% feels inefficient but it's actually optimal — don't push for 90%.",
        context:
          "At 90% utilization, you have zero buffer for sick providers, last-minute cancellations, or unexpected demand spikes. One provider calling out sick can cascade into 5 customer reschedules in a densely booked zone. At 70%, you absorb that without drama. The revenue difference between 70% and 90% utilization is real, but the churn cost of over-scheduling providers is larger. Run your zone like an airline that sells 78% of seats, not 99%.",
      },
      {
        text: "A zone's health score lags reality by about 3 weeks — watch leading indicators, not the composite.",
        context:
          "The composite health score is a trailing metric — it reflects what happened, not what's happening. The leading indicators are: provider availability hours booked next week (drops first when providers are disengaging), referral conversion rate (drops 2–3 weeks before NPS shows it), and job cancellation rate (spikes before utilization moves). Build the habit of watching these raw metrics daily in healthy zones, not just when the composite turns yellow.",
      },
    ],
  },
  {
    id: "watch-outs",
    title: "Watch-Outs: The Mistakes That Cost Real Money",
    type: "watch-outs",
    watchOuts: [
      {
        text: "Expanding to a second zone before your first zone is genuinely stable will break both. The operational attention required to rescue a struggling zone is enormous — if Zone 2 launches while Zone 1 is still fragile, you will not have the bandwidth to save either. The correct move is always: stabilize first, expand second. Never expand under pressure of excitement or investor timelines if the unit economics aren't proven.",
        severity: "critical",
      },
      {
        text: "Ignoring provider density thresholds because you're 'close enough' creates a cascading failure. Five providers at 80% utilization looks fine until one goes on vacation, one gets sick, and one churns in the same week. You're now at two providers serving a zone built for five — customers wait days, complaints spike, remaining providers get overwhelmed and churn too. There is no safe version of under-provisioning. The minimum threshold exists because we learned what happens when you fall below it.",
        severity: "critical",
      },
      {
        text: "Drawing zone boundaries to match political or administrative boundaries (zip codes, city limits, county lines) rather than density patterns creates misshapen zones where providers spend more time driving than working. A zone that follows a zip code boundary might be long and thin, routing providers back and forth across it all day. Follow the hex grid and the density heatmap. Administrative boundaries are convenient for paperwork — they're bad for operations.",
        severity: "caution",
      },
    ],
  },
  {
    id: "real-world",
    title: "Real-World Context: The Market You're Operating In",
    type: "real-world",
    realWorldData: [
      {
        text: "The US home services market exceeds $500 billion annually and remains highly fragmented — the largest national players capture only low single-digit percentage points of total spend. The vast majority of spending still goes to local, unbranded providers. This means the opportunity for a platform that aggregates quality providers and delivers a reliable customer experience is genuinely large, but the competition is local and relationship-driven, not just price-driven. Zone density strategy matters because the winning advantage in this market is trust at the neighborhood level, not scale at the national level.",
        source: "IBISWorld Home Services Industry Report; HomeAdvisor / Angi market sizing data",
      },
      {
        text: "Route density directly determines provider economics: when jobs are geographically clustered, providers reduce drive time by 30–40% compared to scattered bookings. The average US household spends $6,000–$9,000 per year on home maintenance and repair. A provider covering a dense 20,000-household zone can realistically complete 6–8 jobs per day with tight routing, versus 3–4 jobs in a sprawling low-density zone. That difference compounds into a 40–60% income gap, which is why providers in dense zones churn at a fraction of the rate of providers in thin zones.",
        source: "Harvard Joint Center for Housing Studies (household maintenance spend); internal route optimization benchmarks",
      },
    ],
  },
  {
    id: "zone-launch-notifications",
    title: "Zone Launch Notifications",
    type: "text",
    content: `When a zone category transitions to SOFT_LAUNCH or OPEN, the system automatically notifies all matching leads.

TWO NOTIFICATION TRIGGERS
1. Provider leads — provider_leads where zip_code matches the zone's ZIPs and status is 'new'. Only leads whose categories include the launched category (or leads with no category preference) are notified.
2. Customer leads — customer_leads where zip_code matches and notify_on_launch is true. These are customers from the moving wizard who moved to an uncovered zone.

Both triggers fire automatically via database triggers on market_zone_category_state status changes. No manual action needed.

MANUAL OVERRIDE
Admins can also manually trigger provider lead notifications from the Provider Leads page → By ZIP tab → select zone → click "Notify." This is useful for re-notifying or targeting specific zones.

ZONE STATUS LABELS FOR PROVIDERS
Providers never see internal zone statuses. The mapping is:
• CLOSED → "Building"
• WAITLIST_ONLY → "Building"
• PROVIDER_RECRUITING → "Recruiting"
• SOFT_LAUNCH → "Launching soon"
• OPEN → "Active"
• PROTECT_QUALITY → "Building"

This means providers always see opportunity, never rejection.`,
  },
  {
    id: "automation",
    title: "What the System Does For You (and What It Doesn't)",
    type: "automation",
    automationNotes: [
      {
        text: "Zone health data updates in real time via React Query (1-minute stale time). The Ops Cockpit zone table always shows current data when you load the page. If a zone's metrics cross configured thresholds (e.g., proof missing rate > 10%, open exceptions > 5), a Risk Alert is automatically surfaced in the Ops Cockpit. You just need to check the cockpit — the system will tell you when something needs attention.",
        type: "set-and-forget",
      },
      {
        text: "Zone launch lead notifications are automatic. When a zone category goes to SOFT_LAUNCH or OPEN, provider and customer leads in matching ZIPs are notified. Verify on the Provider Leads page after any zone launch.",
        type: "set-and-forget",
      },
      {
        text: "Check provider count and utilization in every active zone at the start of each day. The automated health score catches threshold breaches, but it does not catch slow trends — a zone that's been at 67% utilization for three weeks is technically green but directionally concerning. Eyeballing the trend is a human judgment the system won't make for you. Takes 90 seconds; do it every morning before you look at anything else.",
        type: "daily-check",
      },
      {
        text: "Review the Zone Growth table every Monday: customers added, providers added, NPS trend, and referral conversion rate versus the prior week. This is your market expansion intelligence — it tells you which zones are building momentum (candidates for a split in 60–90 days) and which are stalling (candidates for a capacity intervention or a merge decision). The system surfaces raw metrics; you supply the strategic interpretation.",
        type: "weekly-check",
      },
    ],
  },
];
