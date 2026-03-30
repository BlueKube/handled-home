import type { TrainingSection } from "@/components/academy/AcademySection";

export const growthIncentivesSections: TrainingSection[] = [
  {
    id: "overview",
    title: "Growth in a Density-First Business",
    type: "overview",
    content: `Growth in Handled Home is different from growth in a marketplace. We don't want every customer everywhere — we want dense clusters of customers in specific zones. A single customer in a ZIP code where we have no other customers costs us money (drive time, idle time). Ten customers in the same ZIP code are profitable.

This means growth strategy is tied to zone health. The Growth dashboard, Incentives page, and Reports page work together to show you whether growth is happening in the right places.

Three growth engines power customer acquisition:

• BYOC (Bring Your Own Customer) — Providers bring their existing customers to the platform. This is the primary engine. It solves cold-start because the provider-customer relationship already exists.
• BYOP (Bring Your Own Provider) — Customers recommend trusted providers for review. This fills supply gaps.
• Referrals — Existing customers refer friends/neighbors. Proximity-based referrals naturally cluster in zones.

The admin pages:
• Growth — Dashboard with funnel metrics for all three engines plus trend data
• Incentives — Manage referral programs, rewards, and fraud flags
• Reports — Analytical reports for deeper analysis`,
  },
  {
    id: "funnels",
    title: "Reading the Growth Funnels",
    type: "text",
    content: `Each growth engine has a funnel. Your job is to know what a healthy funnel looks like and spot when one is broken.

BYOC FUNNEL
Provider creates invite link → Customer clicks link → Customer completes onboarding → Customer activates subscription → Customer books first service

Healthy: 60%+ of invited customers complete onboarding. Below 40% means your BYOC wizard has friction or providers aren't explaining the value proposition.

REFERRAL FUNNEL
Customer refers friend → Friend receives link → Friend signs up → Friend activates subscription → Referrer gets reward

Healthy: 20-30% of referral links convert to signups, and 50%+ of signups become subscribers. If link-to-signup is below 15%, the referral landing page needs work. If signup-to-subscribe is below 30%, the onboarding flow is losing people.

BYOP FUNNEL
Customer recommends provider → Admin reviews recommendation → Provider is contacted → Provider applies → Provider is approved

Healthy: This is slower by nature (weeks, not days). A healthy BYOP pipeline sees 5-10 recommendations per month per active zone. Track two conversion metrics: contact success rate (can you actually reach the recommended provider? target: 60%+) and application-to-approval rate (of those who apply, how many pass screening? target: 40-50%).

When a BYOP recommendation arrives, it appears in the Applications queue tagged as "Customer Referred." Review it within 48 hours — the recommending customer is waiting to hear if their provider will join. Check: does the recommended provider's service area overlap with your active zones? Is the zone already at capacity? If the zone is saturated, you can still contact the provider for a future zone or waitlist.

Rejection criteria: geographic mismatch (provider is 45+ minutes from the zone), zone already at provider capacity, unverifiable credentials, or the provider is already on a competing platform with an exclusivity clause. When you reject, always close the loop with the customer who recommended them — a brief "thank you, we're not adding providers in that area right now" preserves the relationship.

Key difference from BYOC: BYOC is provider-initiated (they bring existing customers). BYOP is customer-initiated (they recommend a provider they trust). BYOP fills supply gaps in zones where you need more providers, while BYOC fills demand gaps in zones where you need more customers. Both are valuable, but they solve different problems.

K-FACTOR
The K-factor measures viral growth: average referrals per customer × referral conversion rate. A K-factor above 0.3 means each customer brings in roughly one new customer per 3 customers. Above 1.0 means organic viral growth (rare in home services). Track this monthly — it tells you if your referral program is actually working or just giving away credits.`,
  },
  {
    id: "incentives",
    title: "Managing Incentive Programs",
    type: "walkthrough",
    steps: [
      {
        title: "Understand the referral tier system",
        description: "Referral milestones are tiered: Starter ($30 credit at 3 referrals), Ambassador (free month at 5), Champion (VIP status at 10). Each tier is designed to reward progression. Don't change tier thresholds frequently — customers track their progress and feel cheated if the goalposts move.",
        screenshot: { alt: "Referral program tiers configuration" },
      },
      {
        title: "Monitor fraud flags",
        description: "The Flags tab shows suspicious referral activity. Common patterns: same IP address for multiple referrals, referrals that sign up but never book a service, referral codes shared on coupon sites. The system flags these automatically. Your job is to review and decide: dismiss (false alarm) or void (actual gaming).",
        screenshot: { alt: "Incentive fraud flags tab" },
      },
      {
        title: "Check reward economics monthly",
        description: "In the Rewards tab, look at total credits issued vs. revenue from referred customers. If you're paying $30/referral and the average referred customer stays 8 months at $179/month, that's $1,432 in revenue for $30. Excellent. If the average referred customer cancels after 2 months, you're paying $30 for $358 — still profitable but watch the trend.",
        screenshot: { alt: "Rewards tab showing credits issued vs. revenue impact" },
      },
    ],
  },
  {
    id: "pro-tips",
    title: "Pro Tips from Veteran Operators",
    type: "pro-tips",
    proTips: [
      {
        text: "A referral program that costs you $30/customer is a steal if that customer stays 12+ months at $179/mo. Don't panic about referral costs — panic about referral churn. The cost of acquisition is irrelevant if the customer doesn't stay.",
        context: "LTV math: $30 acquisition cost vs. $2,148 in first-year revenue at $179/mo. Even at 30% margin, that's $644 gross profit.",
      },
      {
        text: "BYOC is your secret weapon for cold-start. A provider with 30 existing lawn care customers can onboard 15-20 of them in a week via invite links. That's an instant zone with density. No cold marketing, no paid ads, no uncertainty.",
        context: "This is why provider acquisition matters even more than customer acquisition at launch.",
      },
      {
        text: "Referral fraud is annoying but usually small-dollar. Don't build Fort Knox around it. A simple flag + review process catches 90% of gaming. The 10% that slips through costs less than the engineering time to prevent it.",
      },
      {
        text: "Track referrals by zone, not just by total. 50 referrals in zones where you have capacity is growth. 50 referrals in zones where you're already at 95% utilization is a waiting list. Make sure incentives are driving growth where you need it.",
      },
    ],
  },
  {
    id: "watch-outs",
    title: "Watch Out For...",
    type: "watch-outs",
    watchOuts: [
      {
        text: "Don't run referral promotions ('Refer a friend, get a free month!') without checking zone capacity first. A viral referral campaign in a zone with 95% utilization creates customers you can't serve — which is worse than not acquiring them at all.",
        severity: "critical",
      },
      {
        text: "BYOC rate limits exist for a reason: max 10 active links per provider, max 10 new links per day. Without these, an enthusiastic provider could create hundreds of links and overwhelm your onboarding capacity. Don't increase limits without checking fulfillment capacity.",
        severity: "caution",
      },
      {
        text: "Voiding a referral reward after it's been applied to a customer's account creates a negative experience. Only void if you have clear evidence of fraud — not just suspicion. False accusations damage trust more than a $30 credit costs.",
        severity: "caution",
      },
    ],
  },
  {
    id: "real-world",
    title: "Real-World Growth Context",
    type: "real-world",
    realWorldData: [
      {
        text: "The home services market is $500B+ annually in the U.S. but extremely fragmented. No single company owns more than 1% of any major category. This fragmentation is the opportunity — customers don't have a 'home maintenance provider,' they have 5-8 separate vendor relationships. Each one is an acquisition opportunity.",
        source: "Harvard Joint Center for Housing Studies, IBISWorld (2025-2026)",
      },
      {
        text: "Landscaping alone is $188.8B (2025) with thousands of small operators. Most independent landscapers spend 20-30% of their work week on non-billable activities: quoting, invoicing, scheduling, driving between scattered jobs. BYOC addresses this directly — providers join the platform to eliminate admin overhead, and bring their customers along.",
        source: "IBISWorld, industry operator interviews",
      },
    ],
  },
  {
    id: "automation",
    title: "What's Automated vs. What Needs Your Eyes",
    type: "automation",
    automationNotes: [
      {
        text: "Referral credit application is automatic. When a referred customer completes their first month, the referrer receives their reward credit on the next billing cycle. No manual intervention needed.",
        type: "set-and-forget",
      },
      {
        text: "Fraud flags are generated automatically based on patterns (same IP, rapid signups, no bookings). But the review decision is always manual — the system flags, you decide.",
        type: "daily-check",
      },
      {
        text: "BYOC invite link generation and tracking is automatic. Providers create links from their dashboard. You see activity in the Growth console. Monitor weekly for any provider generating unusual link volume.",
        type: "weekly-check",
      },
    ],
  },
];
