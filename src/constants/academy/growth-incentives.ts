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

Healthy: This is slower by nature (weeks, not days). A healthy BYOP pipeline in a mature zone (50+ active customers) sees 5-10 recommendations per month. Starting targets for conversion: contact success rate (can you actually reach the recommended provider? aim for 60%+) and application-to-approval rate (of those who apply, how many pass screening? aim for 40-50%). These are guidelines — your actual numbers will depend on market density and provider supply.

When a BYOP recommendation arrives, it appears in the Growth page under the BYOP Recommendation Tracker — not in the provider Applications queue. Review it within 48 hours — the recommending customer is waiting to hear if their provider will join. Check: does the recommended provider's service area overlap with your active zones? Is the zone already at capacity? If the zone is saturated, you can still contact the provider for a future zone or waitlist.

Rejection criteria: geographic mismatch (provider is 45+ minutes from the zone), zone already at provider capacity, unverifiable credentials, or the provider indicates they're under an exclusivity agreement with a competing platform (this is self-reported — you can't verify it independently). When you reject, always close the loop with the customer who recommended them — a brief "thank you, we're not adding providers in that area right now" preserves the relationship.

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
        description: "Referral tiers are fully configurable via the Programs tab — admins set milestone triggers, reward types, and amounts. There are no hardcoded tier names or thresholds. When you set up a program, design tiers that reward progression (e.g., a small credit at an early milestone, a larger reward at a higher one). Once live, don't change tier thresholds frequently — customers track their progress and feel cheated if the goalposts move.",
        screenshot: { alt: "Referral program tiers configuration" },
      },
      {
        title: "Monitor fraud flags",
        description: "The Flags tab shows suspicious referral activity. Common patterns: same IP address for multiple referrals, referrals that sign up but never book a service, referral codes shared on coupon sites. The system flags these automatically. Your job is to review and decide: dismiss (false alarm) or review (actual gaming — flag for further investigation before taking action).",
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
    id: "provider-leads",
    title: "Provider Lead Pipeline",
    type: "text",
    content: `Beyond the three customer-facing growth engines, there is a dedicated provider lead pipeline that captures interest from providers who aren't ready to apply yet.

LEAD SOURCES
• Browse page (/providers) — Providers enter their email, phone (optional), ZIP, and service categories. Saved to the provider_leads table.
• Provider referrals — The "Know someone?" form on the post-application screen lets applicants refer other providers. Saved to provider_referrals.
• Manual entry — Admins can add leads manually.

ADMIN PIPELINE (Growth → Provider Leads)
The Provider Leads page at /admin/provider-leads has four tabs:
• Leads — Filterable table with status workflow: new → contacted → applied → declined → notified
• By ZIP — Lead counts per ZIP code. Includes a "Notify Zone Leads" button for manual zone launch notifications.
• Referrals — Provider-to-provider referrals with referrer email and status tracking
• Customers — Customer leads from the moving wizard and waitlist (source: moving/waitlist/referral)

IMPORTANT: Providers never see "closed" or "full" zone status. The messaging always frames the situation as an opportunity:
• Active zones → "Demand is growing fast near you"
• Launching zones → "We're launching in your area — Founding Partner status available"
• Pre-launch zones → "Help us launch in your area — refer providers you trust"
• Waitlisted → "We're building momentum in your area"

PHONE AS IDENTITY BRIDGE
Leads can include a phone number. The matching triggers use both email and phone, so a provider referred by phone number who signs up with their email will still be attributed correctly. Phone is collected on both the browse page lead form and the application flow (Step 2: Location).`,
  },
  {
    id: "referral-incentive",
    title: "Provider Referral Incentive",
    type: "text",
    content: `After applying, providers see a referral progress card: "Refer 3 providers to unlock priority review." This creates a viral loop where every applicant becomes a recruiter.

HOW IT WORKS
• Progress bar shows referral count toward the 3-referral target
• "Priority eligible" badge appears when target is reached
• The "Know someone?" form captures: name, contact (phone/email), service category, ZIP code
• Each referral is tracked in the provider_referrals table with the referrer's email

AUTOMATED ATTRIBUTION
When a referred provider eventually applies, the system automatically matches their email or phone against provider_referrals and updates the referral status to "applied." This happens via a database trigger — no manual linking needed.

WHAT ADMINS SEE
The Referrals tab on the Provider Leads page shows all referrals with their current status. You can see which referrers are most effective and which referrals have converted to applications.`,
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
      {
        text: "Provider lead-to-application linking is automatic. When a provider applies, matching leads are linked via email or phone and lead status updates to 'applied.' Check the Provider Leads page weekly for conversion rates.",
        type: "weekly-check",
      },
      {
        text: "Zone launch notifications are automatic. When a zone category transitions to SOFT_LAUNCH or OPEN, all matching provider leads AND customer leads in those ZIPs are auto-notified. Verify on the Provider Leads page that notifications went out after any zone launch.",
        type: "set-and-forget",
      },
    ],
  },
];
