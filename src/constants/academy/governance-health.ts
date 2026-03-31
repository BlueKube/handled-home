import type { TrainingSection } from "@/components/academy/AcademySection";

export const governanceHealthSections: TrainingSection[] = [
  {
    id: "overview",
    title: "The Control Panel for the Control Panel",
    type: "overview",
    content: `Governance pages are your system health monitors. They answer: "Is the platform itself working correctly?" This is different from operational health (are customers happy?) — this is infrastructure health (are the automated systems running?).

Six pages make up Governance:

• Audit Log — Every admin action is recorded. Who changed what, when, and why.
• Cron Health — Are background jobs running? Billing, dunning, assignment, snapshots.
• Notification Health — Are emails, SMS, and push notifications actually being delivered?
• Feedback — Customer and provider feedback submissions.
• Test Toggles — Feature flags for A/B testing and gradual rollouts.
• Launch Readiness — Pre-launch checklist with automated pass/fail checks.

The morning health check routine: Cron Health → Notification Health → Audit Log (for overnight changes). This takes 2 minutes and catches 95% of infrastructure problems before they affect customers.`,
  },
  {
    id: "cron-health",
    title: "Cron Health — The Most Important Page You'll Forget About",
    type: "walkthrough",
    steps: [
      {
        title: "Check every morning before anything else",
        description: "If cron died overnight, six critical systems didn't run: billing cycle generation, dunning escalation, provider assignment, snapshot rollup, no-show detection, and earning hold release. You won't see errors in the Ops Cockpit because the cockpit relies on data that cron generates. A silent cron failure makes everything look normal while nothing is actually happening.",
        screenshot: { alt: "Cron Health page showing recent run status" },
      },
      {
        title: "Know which failures are safe to ignore",
        description: "Snapshot rollup failing is annoying but not urgent — it affects analytics, not operations. Billing cycle failing is a crisis — customers don't get invoiced, dunning doesn't start, revenue stops. Assignment failing means tomorrow's provider routes won't be generated. Prioritize by operational impact, not by failure count.",
        screenshot: { alt: "Cron Health with failure severity context" },
      },
      {
        title: "Check duration trends",
        description: "If billing cron usually takes 30 seconds but yesterday took 5 minutes, something changed — maybe your subscriber count grew, maybe a query is slow, maybe the database is under load. Duration creep is an early warning sign of future failures.",
        screenshot: { alt: "Cron run duration history" },
      },
      {
        title: "When cron fails — what to do",
        description: "If you see a failure: (1) Check which job failed — billing and assignment are P0 emergencies, snapshot rollup is P2. (2) For billing cron failure: escalate immediately to a senior operator or engineering. No billing means no invoices, no dunning, and no revenue recorded. (3) For assignment failure: tomorrow's routes won't generate. Check if it can be manually re-triggered; if not, escalate. (4) For payout cron failure on Friday: providers won't get paid. This needs same-day resolution. (5) For snapshot or analytics failures: note it, but don't panic — operations continue normally. Check again tomorrow. If it fails 2 days in a row, escalate.",
        screenshot: { alt: "Cron Health page showing a failed job with action steps" },
      },
    ],
  },
  {
    id: "audit-log",
    title: "The Audit Log — Your 'What Happened?' Tool",
    type: "text",
    content: `The audit log records every admin action: pricing changes, provider status changes, plan modifications, zone configuration updates, scheduling overrides. Every entry includes who did it, when, and the before/after state.

When to use the audit log:

"A customer says their price changed and they didn't authorize it" → Search the audit log for that customer's subscription. See exactly what changed and who changed it.

"A provider was suspended and is asking why" → Search for provider status changes. See who suspended them, when, and what the reason code was.

"Our zone capacity suddenly dropped" → Search for zone configuration changes. See if someone modified capacity limits.

The audit log is your defense against "nobody knows what happened." In operations, ambiguity is the enemy. The audit log eliminates it for every admin-initiated change.

Pro tip: when you're about to make a change and someone asks "why?" later, the audit reason field is your documentation. "Reducing zone capacity from 50 to 40 per recommendation from provider team — 2 providers on vacation this week" is infinitely better than an empty reason field.`,
  },
  {
    id: "feature-toggles",
    title: "Test Toggles — Feature Flag Discipline",
    type: "text",
    content: `Test toggles let you enable/disable features for specific users, zones, or percentages of traffic. They're powerful but dangerous without discipline.

RULES FOR TOGGLES:

1. Every toggle must have an owner and an expiration date. A toggle without a removal date becomes permanent dead code.

2. Never leave a toggle "on" in production for more than 30 days without either removing it (make the feature permanent) or turning it off (the experiment failed).

3. Toggles are for experiments, not for incomplete features. If a feature isn't ready, don't ship it behind a toggle — finish it first.

4. Document what each toggle does in its description field. "Enable new billing flow" tells the next operator nothing. "Routes checkout through Stripe's new Payment Element API instead of legacy Card Element — reduces payment failures by ~15% in testing" tells them everything.

5. Before turning on a toggle that affects billing or scheduling, check with a senior operator. These systems have downstream effects that aren't always obvious.

EXAMPLE: When we tested the new checkout flow, we created a toggle called "new-checkout-v2" with owner: ops team, expiration: 30 days, description: "Routes checkout through Stripe Payment Element API instead of legacy Card Element — reduces payment failures by ~15% in testing." We enabled it for 10% of Zone A customers first, watched conversion rates for a week, then expanded to 50%, then 100%. After 3 weeks of stable metrics, we removed the toggle and made the feature permanent. The whole lifecycle — create, test, expand, remove — took 25 days. That's what healthy toggle usage looks like.`,
  },
  {
    id: "launch-readiness",
    title: "Launch Readiness — Your Pre-Flight Checklist",
    type: "text",
    content: `The Launch Readiness page runs 9 automated checks that must all pass before a zone goes live:

1. Zones configured — At least 1 active zone exists
2. SKUs active — At least 5 active SKUs in the catalog
3. Plans active — At least 1 subscription plan is available
4. Stripe pricing — All active plans have Stripe price IDs (no checkout failures)
5. Providers onboarded — At least 3 active provider orgs (for density)
6. Payout accounts — At least 1 provider has a connected Stripe account (can actually get paid)
7. Cron jobs — At least 1 cron job ran in the last 24 hours (automation is alive)
8. BYOC invites — Invite system has entries (providers can bring customers)
9. Entitlement versions — Plans have entitlement versions (handle budgets are configured)

Green means pass. Red means fail. Amber means warning (not blocking but worth attention).

Don't launch with ANY red items. An amber item (like "only 1 BYOC invite created") is acceptable if you have a plan to address it. A red item ("no Stripe pricing configured") means checkout will fail on the first customer.`,
  },
  {
    id: "pro-tips",
    title: "Pro Tips from Veteran Operators",
    type: "pro-tips",
    proTips: [
      {
        text: "Check Cron Health every morning before anything else. If cron died overnight, billing didn't run, dunning didn't run, and assignment didn't run. You'll find out the hard way from customer complaints if you don't check proactively.",
        context: "This tip appears in the Ops Cockpit module too. It's repeated intentionally. It's that important.",
      },
      {
        text: "The audit log is your best friend during escalations. When a customer or provider says 'something changed and nobody told me,' the audit log has the answer. Search by entity, not by admin — you want to see everything that happened to this specific customer/provider/zone.",
      },
      {
        text: "Notification Health failures often correlate with delivery providers (SendGrid, Twilio), not with your code. Before investigating a notification failure, check the provider's status page. A 5-minute outage at SendGrid can generate 50 'failed delivery' entries.",
      },
      {
        text: "When you run Launch Readiness and see red items, fix them in order: Stripe pricing first (payments), then providers (fulfillment), then SKUs (catalog), then everything else. The order matters because downstream systems depend on upstream configuration.",
      },
    ],
  },
  {
    id: "watch-outs",
    title: "Watch Out For...",
    type: "watch-outs",
    watchOuts: [
      {
        text: "A 'healthy' Cron Health page with all green doesn't mean zero problems. It means the scheduled jobs RAN. It doesn't tell you if they produced correct results. If billing cron ran but generated zero invoices (because of a query bug), Cron Health shows green while revenue stops. Cross-reference cron status with the Ops Cockpit MONEY column.",
        severity: "critical",
      },
      {
        text: "Don't use test toggles as a way to give individual customers special treatment ('enable premium features for this one VIP customer'). That creates one-off configurations that nobody remembers 3 months later. Use plan entitlements for feature access, not toggles.",
        severity: "caution",
      },
      {
        text: "Notification Health shows delivery status, not read status. A notification 'delivered' to spam is 'delivered' from the system's perspective. If customers report not receiving emails, check spam folder guidance first.",
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
        text: "Audit log entries are generated automatically for every admin action. You don't need to manually log anything — the system records who, what, when, and before/after state.",
        type: "set-and-forget",
      },
      {
        text: "Cron Health page auto-refreshes data, but you need to actively check it. There's no 'cron failed' notification sent to admins (yet). This is your daily manual check.",
        type: "daily-check",
      },
      {
        text: "Launch Readiness checks run on page load — they query live data. There's no caching. Every time you visit the page, you see the current state.",
        type: "set-and-forget",
      },
    ],
  },
];
