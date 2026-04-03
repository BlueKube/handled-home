import type { TrainingSection } from "@/components/academy/AcademySection";

export const plansBundlesSections: TrainingSection[] = [
  {
    id: "overview",
    title: "How Plans and Bundles Work",
    type: "overview",
    content: `Plans are what customers subscribe to. Bundles (routines) are what customers actually receive. Entitlements define what's included. Understanding this three-layer system is essential because it's where pricing, delivery, and customer expectations intersect.

PLANS → The subscription tier (e.g., tier names like "Essential," "Plus," or "Premium" configured in the admin Plans page — actual names and prices are stored in the database, not hardcoded)
ENTITLEMENTS → What each plan includes (e.g., "Premium includes: lawn weekly, pest quarterly, window cleaning 2x/year, plus 5 handles/month for add-ons")
BUNDLES (ROUTINES) → The actual schedule of services for a specific customer (e.g., "John Smith's routine: lawn mowing every Tuesday, pest treatment quarterly starting March")

The handle economy ties this together. Each plan includes a monthly handle budget. Some services are "included" (no handles consumed). Others cost handles. Handles are the internal currency that gives customers flexibility to add services beyond their plan's base inclusions. Handles are a conceptual unit — the database tracks entitlements via included_credits, included_count, included_minutes, and included_service_weeks_per_billing_cycle. When you see "handles" in the UI, those fields are what's actually being configured and consumed under the hood.

The admin pages:
• Plans — Design and manage subscription plans, set entitlements, configure zone availability
• Bundles — View active customer routines (what they're actually scheduled for)`,
  },
  {
    id: "plan-design",
    title: "Plan Design Philosophy",
    type: "text",
    content: `THE FEWER PLANS, THE BETTER

This is the hardest lesson in subscription services. The instinct is to create a plan for every possible combination: "Lawn Only," "Lawn + Pest," "Lawn + Cleaning," "Full Service," "Full Service without Pool," etc. Don't. Every plan you add doubles your support complexity, halves your ability to communicate pricing clearly, and creates migration headaches when you inevitably restructure.

Three plans (Good / Better / Best) with add-on handles covers 90% of households. The remaining 10% can customize via handles. If a customer wants something unusual, handles are the escape valve — not a custom plan.

ENTITLEMENT VERSIONING

When you change what a plan includes (adding a service, removing one, changing the handle budget), you're creating a new entitlement version. Existing subscribers stay on their version until they take an action (upgrade, renewal, etc.). New subscribers get the latest version.

This is critical: if you add "window cleaning 2x/year" to the Premium plan, existing Premium subscribers DON'T automatically get it. Only new subscribers do. To give it to existing subscribers, you'd need to migrate them to the new version — which is a business decision, not a technical operation.

ZONE AVAILABILITY

Not every plan should be available in every zone. A "Complete" plan that includes pool cleaning shouldn't be offered in zones where you don't have pool cleaning providers. The Plans page lets you configure zone availability per plan. Check this after launching a new zone — a new zone inherits nothing by default.

THE HANDLE ECONOMY

Handles are the subscription spread model. The customer pays a monthly subscription (e.g., $179). The included services cost some amount to deliver (e.g., $140 in provider payouts). The difference ($39) is your margin. Handles represent the flexibility layer — extra services the customer can add that consume from their monthly budget.

Think of handles like cell phone data: you get an allocation, and overages cost extra. A customer who never uses extra handles is highly profitable. A customer who maxes them out every month might be margin-neutral. This is by design — the mix averages out across your subscriber base.`,
  },
  {
    id: "walkthrough",
    title: "Creating and Managing Plans",
    type: "walkthrough",
    steps: [
      {
        title: "Start with a draft",
        description: "All new plans start in 'draft' status. This lets you configure everything — pricing text, entitlements, zone availability — without affecting live customers. Only activate when you're confident the plan is ready.",
        screenshot: { alt: "Plans page showing draft plan being configured" },
      },
      {
        title: "Configure entitlements carefully",
        description: "For each SKU, decide: is it 'included' (no handles), 'extra_allowed' (costs handles), or 'blocked' (not available on this plan)? 'Available' means it's in the catalog but not part of the plan. This distinction is what customers see on their service cards — the entitlement badges.",
        screenshot: { alt: "Plan entitlement configuration showing SKU rules" },
      },
      {
        title: "Set zone availability",
        description: "Toggle which zones can offer this plan. A plan available in a zone where you can't fulfill its included services is worse than no plan at all — it's a broken promise.",
        screenshot: { alt: "Zone availability toggles on plan editor" },
      },
      {
        title: "Use 'Duplicate' for variations",
        description: "When creating a new tier, duplicate an existing plan and modify it. This preserves entitlement structure and zone settings as a starting point, reducing configuration errors. Much safer than building from scratch.",
        screenshot: { alt: "Plan duplicate action" },
      },
    ],
  },
  {
    id: "pro-tips",
    title: "Pro Tips from Veteran Operators",
    type: "pro-tips",
    proTips: [
      {
        text: "Resist the urge to create a plan for every possible combination. Three plans (Good/Better/Best) with add-ons covers 90% of households. Every additional plan doubles your support complexity.",
        context: "The companies that struggle most with subscription services are the ones with 12 plans and nobody can explain the difference between them.",
      },
      {
        text: "Name your plans for the customer's aspiration, not for the features. 'Complete Home Care' sells better than 'Lawn + Pest + Windows Bundle.' The plan name is marketing — the entitlements are operations.",
        context: "Customers buy outcomes, not feature lists.",
      },
      {
        text: "When a customer asks for something not in their plan, the answer is almost never 'upgrade your plan.' It's 'use your handles' or 'add it as a one-time service.' Plan upgrades are for customers who consistently want more — not for one-off requests.",
      },
      {
        text: "Review bundle (routine) data monthly. If 80% of your 'Premium' subscribers are only using the lawn mowing inclusion and ignoring everything else, your Premium plan isn't delivering value — it's overpriced lawn care. Either add engagement prompts or restructure the tier.",
        context: "Unused entitlements are invisible churn risk. Customers who don't use what they pay for eventually realize it.",
      },
      {
        text: "The Stripe price ID on each plan connects your plan to actual billing. If a plan is missing its Stripe price ID, the checkout flow will fail. The Launch Readiness page checks this automatically — but don't wait for launch day to discover it.",
      },
    ],
  },
  {
    id: "watch-outs",
    title: "Watch Out For...",
    type: "watch-outs",
    watchOuts: [
      {
        text: "Changing entitlements on an active plan does NOT retroactively change what existing subscribers get. It only affects new subscribers. If you want to give existing subscribers new benefits, you need to version-migrate them — and that's a deliberate operation that should be communicated.",
        severity: "critical",
      },
      {
        text: "Retiring a plan doesn't cancel existing subscriptions on that plan. Existing subscribers keep their service. But no new customers can subscribe to it. If you need to force-migrate subscribers to a new plan, that's a support + billing coordination effort — not just a retire click.",
        severity: "caution",
      },
      {
        text: "Handle budgets reset monthly. A customer who didn't use their 5 handles this month doesn't get 10 next month. Make sure support knows this — it's a common customer question.",
        severity: "caution",
      },
    ],
  },
  {
    id: "real-world",
    title: "Real-World Bundle Pricing",
    type: "real-world",
    realWorldData: [
      {
        text: "Research shows a viable Essential plan ($349–$499/month) includes: 12 standard cleans/year (monthly), ~20 mowing visits/year (bi-weekly seasonal), 2 gutter cleanings/year, and quarterly HVAC filter delivery. This matches real cadence expectations from consumer maintenance guides.",
        source: "Deep research report — Three Tier Bundles (2026)",
      },
      {
        text: "A Premium plan ($599–$899/month) adds: bi-weekly cleaning (26/year), weekly mowing during growing season (~32/year), quarterly gutters, and an annual deep clean. The deep clean alone runs $250–$400 nationally, making the annual inclusion a strong perceived-value anchor.",
        source: "Deep research report — Three Tier Bundles, Angi pricing data (2026)",
      },
      {
        text: "Handled Home uses a membership-plus-credits model, not all-inclusive bundles. Actual plan prices are configured in the admin Plans page and vary by zone and operator. The core principle: at typical subscription price points, you can't include every service at full retail cadence — the math doesn't close. Instead, each tier includes a handle budget that covers a defined scope of services. Customers who need more can add services at member rates. Industry research suggests all-inclusive home maintenance bundles require $349–$499/month minimum to be viable, which is why our model uses managed entitlements rather than unlimited access.",
        source: "Handled Home simulation model; deep-research-report-2.md bundle analysis",
      },
    ],
  },
  {
    id: "automation",
    title: "What's Automated vs. What Needs Your Eyes",
    type: "automation",
    automationNotes: [
      {
        text: "Entitlement badge display on customer service cards is automatic. When a customer opens the services catalog, the system checks their plan's entitlements and shows 'Included,' 'Extra Allowed,' or 'Blocked' badges. No manual intervention needed.",
        type: "set-and-forget",
      },
      {
        text: "Handle budget reset happens automatically at the start of each billing cycle. No manual action required.",
        type: "set-and-forget",
      },
      {
        text: "Review plan performance quarterly: subscriber counts per plan, handle utilization rates, upgrade/downgrade trends. This tells you if your tier structure is working or if customers are gravitating to one plan and ignoring the others.",
        type: "set-and-forget",
      },
    ],
  },
];
