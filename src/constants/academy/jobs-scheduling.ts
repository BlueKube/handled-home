import type { TrainingSection } from "@/components/academy/AcademySection";

export const jobsSchedulingSections: TrainingSection[] = [
  {
    id: "overview",
    title: "How Scheduling Works (The Big Picture)",
    type: "overview",
    content: `Scheduling is the engine that turns customer routines into provider routes. It's the most complex part of the platform, but you don't need to understand all the internals — you need to understand the 14-day horizon model and what your role is within it.

Here's the mental model:

DAYS 1-7 (LOCKED) — These days are frozen. Providers have their routes. Customers have been notified. You can only make changes here with an explicit override (and it gets logged). Think of this as "the schedule is published."

DAYS 8-14 (DRAFT) — This is the planning window. The nightly planner generates visits here based on customer routines, cadences, and availability. Changes are easy and expected. This is where you catch problems before they're locked.

BEYOND 14 DAYS — Not planned yet. Customer routine changes here are just stored preferences — they'll become visits when the window advances.

The planner runs every night and does three things:
1. Advances the window (yesterday's locked day falls off, a new draft day appears)
2. Generates visits based on routines (weekly lawn → visit on Tuesday, biweekly cleaning → visit on alternating Mondays)
3. Applies any pending changes (cadence updates, cancellations, address changes)

After the planner runs, the assignment engine runs and assigns providers to visits. Then routes are sequenced for optimal drive time. By morning, providers see their route for the day.`,
  },
  {
    id: "jobs-page",
    title: "The Jobs Page — Your Job Tracker",
    type: "walkthrough",
    steps: [
      {
        title: "Filter by status to find what matters",
        description: "NOT_STARTED shows today's upcoming work. IN_PROGRESS means a provider is on-site. ISSUE_REPORTED is your action queue — something went wrong. COMPLETED is your audit trail. Use the zone filter to narrow to a specific area. Date range filter lets you look backward at completed work.",
        screenshot: { alt: "Jobs page with status filters" },
      },
      {
        title: "Click into a job for the full story",
        description: "Job Detail shows everything: the customer, property, assigned provider (primary + backup), services included, proof photos, timeline of events, and the decision trace (why the system made the choices it did). The decision trace is your debugging tool — it answers 'why was this provider assigned?' or 'why was this job rescheduled?'",
        screenshot: { alt: "Job Detail page showing timeline and proof" },
      },
      {
        title: "Use date range to audit last week",
        description: "Every Friday afternoon, filter to the last 7 days and sort by issues. This is your weekly quality audit. How many issues? Were they resolved? Any patterns? This 15-minute habit catches trends before they become crises.",
        screenshot: { alt: "Jobs filtered by last 7 days with issue highlights" },
      },
    ],
  },
  {
    id: "service-days",
    title: "Service Days — The Capacity Grid",
    type: "walkthrough",
    steps: [
      {
        title: "Read the capacity status first",
        description: "Each zone card shows a capacity status: Stable (green, under 80%), Tight (yellow, 80-90%), or Risk (red, over 90%). A zone showing Risk on a specific day means you're one provider absence away from missed jobs on that day. Either redistribute or recruit.",
        screenshot: { alt: "Service Days grid with zone capacity cards" },
      },
      {
        title: "Check the day-of-week breakdown",
        description: "Most zones have uneven demand. Mondays and Fridays are typically heavy (customers want their home clean before or after the weekend). Mid-week is lighter. If Tuesday shows 3/10 assigned but Friday shows 9/10, your capacity isn't the problem — your distribution is. The scheduling policy dials can help spread load.",
        screenshot: { alt: "Service day Mon-Sun breakdown for a zone" },
      },
    ],
  },
  {
    id: "planner",
    title: "The Planner Dashboard — Your Planning Engine",
    type: "walkthrough",
    steps: [
      {
        title: "Check planner run status every morning",
        description: "The planner should show 'Completed' with a green status for last night's run. If it shows 'Failed,' check the error details and escalate — a failed planner run means no new visits were generated for the draft window. Today's locked jobs are fine, but tomorrow's assignments could be missing.",
        screenshot: { alt: "Planner Dashboard with recent run history" },
      },
      {
        title: "Use 'Rebuild DRAFT' when you need a do-over",
        description: "Sometimes you make a change (new provider, zone capacity update) and want the draft window regenerated without waiting for tonight's nightly run. 'Rebuild DRAFT' only touches days 8-14 — it never changes locked days. Safe to run anytime during the day.",
        screenshot: { alt: "Planner Dashboard rebuild DRAFT button" },
      },
      {
        title: "Watch for conflicts",
        description: "The planner surfaces conflicts: no_service_day (property in a zone without a service day defined for that weekday), no_routine (customer has no active routine), capacity_exceeded (more visits than the zone can handle on that day). Each conflict tells you what to fix upstream.",
        screenshot: { alt: "Planner conflicts table" },
      },
    ],
  },
  {
    id: "assignment-engine",
    title: "The Assignment Engine — Matching Providers to Jobs",
    type: "walkthrough",
    steps: [
      {
        title: "Understanding what the engine optimizes",
        description: "The assignment engine balances four objectives: minimize drive time between stops, balance workload across providers, reward familiarity (same provider returning to same home), and respect capacity limits. It runs after the planner and assigns a Primary + Backup provider to each visit.",
        screenshot: { alt: "Assignment Dashboard with run stats" },
      },
      {
        title: "Check '% assigned primary' and '% with backup'",
        description: "Target is 95%+ assigned primary and 80%+ with backup. If primary assignment drops below 90%, check for capacity issues or provider availability blocks. If backup drops below 70%, you may need more providers in the zone — backups prevent cascading failures when primaries are unavailable.",
        screenshot: { alt: "Assignment stats showing primary and backup percentages" },
      },
      {
        title: "Don't touch assignment dials without data",
        description: "Assignment Config has ~30 dials (weights, thresholds, timing). The defaults are tuned based on typical zone density. Changing them without understanding the tradeoffs can cause wild swings — like over-weighting familiarity until a single provider gets assigned every job in a zone. If you think tuning is needed, discuss with a senior operator first.",
        screenshot: { alt: "Assignment Config dial interface" },
      },
    ],
  },
  {
    id: "scheduling-policy",
    title: "Scheduling Policy — The Platform-Wide Dials",
    type: "text",
    content: `Scheduling Policy sets platform-wide rules that affect every customer and provider:

APPOINTMENT WINDOW LENGTH (60-240 min)
How wide is the arrival window customers see? A 120-min window (e.g., "between 10am and noon") gives providers more flexibility but frustrates customers who want precision. A 60-min window delights customers but causes more late arrivals.

Start at 120 minutes. Tighten to 90 when your route sequencing proves reliable. Never go below 60 unless you have real-time tracking working perfectly.

CUSTOMER PROMISE DISPLAY
"Day + ETA Range" shows "Tuesday, 10am–12pm." "Day Only" shows "Tuesday." "Exact Time" shows "Tuesday at 10:30am." Start with "Day + ETA Range" — it sets realistic expectations without over-promising.

ARRIVAL NOTIFICATION TIMING
How many minutes before the provider arrives do you notify the customer? 30 minutes is the sweet spot for most home services — enough time to put the dog away or unlock the gate, not so early that they forget by the time the provider actually arrives.

PREFERENCE PRICING
Should popular time slots cost more? "Scarcity-based" charges a premium for high-demand windows (like Saturday morning). "Flat" means all windows cost the same. "Disabled" means no preference pricing. Leave this disabled until you have 6+ months of demand data to know which windows are actually scarce.

Every change to scheduling policy requires an audit reason. This isn't bureaucracy — it's because a policy change affects every customer immediately, and the last thing you want is someone changing the window length on a Friday afternoon without anyone knowing why.`,
  },
  {
    id: "weather-mode",
    title: "Weather Mode — Handling the Unplannable",
    type: "text",
    content: `Weather mode is your "this week is a wash" button. When activated for a zone:

1. All outdoor jobs in the zone get rescheduled to the next available day
2. Customers receive a notification explaining the reschedule
3. Providers see updated routes (indoor jobs may still proceed)
4. The planner respects weather mode when generating the next draft window

When to activate: Sustained rain (2+ days), extreme heat (110°F+), ice storms, or any condition where outdoor work is unsafe or pointless. Don't activate for a single rainy morning — providers are adults and can handle light weather.

When NOT to activate: Snow removal is weather-dependent by nature — don't cancel snow services because of snow. Pest control is indoor-outdoor mixed — most treatments can proceed in light rain. When in doubt, ask your most experienced provider: "Would you work in this?"

After weather clears, check the rescheduling queue. Weather mode creates a backlog that can take 2-3 days to clear. If you activated weather mode for 2 days, expect the following week to be 15-20% heavier than normal as rescheduled jobs stack up.`,
  },
  {
    id: "window-templates",
    title: "Window Templates — Shaping When Work Happens",
    type: "text",
    content: `Window Templates define the appointment windows available for each service type in each zone. They're one of the most powerful and underused scheduling tools.

A window template specifies: the time blocks customers can choose from (e.g., 8am–12pm, 12pm–4pm), the duration of each window, and which SKUs or zones the template applies to. Different service types naturally need different windows:

• Lawn care: wide windows work (8am–12pm morning block). The customer doesn't need to be home. Provider flexibility is more important than precision.
• Pest treatment: narrow windows are better (10am–12pm, 2pm–4pm). The homeowner often needs to be present for interior treatment, so a tighter window reduces their waiting time.
• Pool service: morning-only windows (7am–11am) work best. Chemical treatments need sun exposure time. More importantly, customers want their pool usable by afternoon — so they actively prefer morning service.

You'll find Window Templates at Admin → Scheduling → Window Templates. Each template shows the service types it applies to, the zones it covers, and the time blocks configured.

WHEN TO MODIFY: When you see a pattern of under-booked afternoon slots with overbooked morning slots, the fix isn't more providers — it's better window design. Staggering windows (8–10am, 9–11am, 10am–12pm) instead of a single 8am–12pm block creates more bookable slots without adding capacity.

CAUTION: Window template changes affect all future bookings in the affected zones/SKUs immediately. Existing locked jobs keep their original windows. Make changes Monday–Wednesday so you can observe the impact before the weekend.`,
  },
  {
    id: "pro-tips",
    title: "Pro Tips from Veteran Operators",
    type: "pro-tips",
    proTips: [
      {
        text: "The planner and assignment engine run in sequence every night — planner first, then assignment. If you want assignment to pick up a new provider you just onboarded, the fastest path is: add the provider → wait for tonight's run, or manually trigger 'Rebuild DRAFT' → then trigger assignment.",
        context: "The nightly automation handles this automatically. Manual triggers are for 'I need this today' situations.",
      },
      {
        text: "Providers care more about consistency than optimization. A provider who always visits the same 8 homes on Tuesday will build relationships that reduce complaints and increase tips. Don't over-optimize routes at the expense of familiarity — the familiarity weight in assignment config exists for this reason.",
        context: "Provider satisfaction directly impacts service quality. Happy providers → happy customers.",
      },
      {
        text: "When a customer changes their routine cadence (weekly → biweekly), the change only takes effect in the DRAFT window (days 8-14). This week's locked jobs are unchanged. Tell the customer: 'Your new schedule starts next week.' Not understanding this leads to confused customers expecting immediate changes.",
      },
      {
        text: "Friday afternoon is the worst time to make scheduling policy changes. Changes take effect immediately, and you won't have a full team to monitor the impact over the weekend. Make policy changes Monday-Wednesday so you have 3 business days to observe the effects.",
      },
      {
        text: "The Window Templates page is quietly one of the most powerful tools. A zone where all morning windows are full but afternoon windows are empty doesn't need more providers — it needs better window design. Stagger windows (8-10, 9-11, 10-12) instead of a single 8-12 block to increase capacity without adding headcount.",
      },
    ],
  },
  {
    id: "watch-outs",
    title: "Watch Out For...",
    type: "watch-outs",
    watchOuts: [
      {
        text: "Never manually override a locked job (days 1-7) without documenting why. Overrides bypass the scheduling engine's constraints and create audit entries. If you're overriding more than 2-3 jobs per week, the schedule itself has a problem — fix the root cause instead of patching individual jobs.",
        severity: "critical",
      },
      {
        text: "The assignment engine's 'capacity hotspots' section shows providers who are at or over capacity. If you see the same provider in hotspots for 3+ consecutive days, they're being overworked. Either reduce their assigned visits or onboard another provider for that zone. Burnt-out providers quit — and losing a provider in a tight zone cascades into weeks of disruption.",
        severity: "caution",
      },
      {
        text: "Weather mode cancels ALL outdoor jobs in a zone. If you have a zone that does both outdoor (lawn) and indoor (cleaning) work, you'll also reschedule the indoor cleaning visits that were bundled with outdoor tasks. Review the reschedule list after activating weather mode to make sure indoor-only visits weren't accidentally caught.",
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
        text: "The planner runs every night automatically. You never need to trigger it unless you want an immediate DRAFT rebuild after a mid-day change. Check its run status each morning.",
        type: "daily-check",
      },
      {
        text: "Assignment runs after the planner automatically. Primary + Backup providers are assigned without manual intervention. Check unassigned count each morning — if it's above zero, investigate.",
        type: "daily-check",
      },
      {
        text: "Route sequencing (stop order optimization) runs automatically after assignment. Providers see their optimized route each morning. You don't need to review routes unless a provider complains about drive time.",
        type: "set-and-forget",
      },
      {
        text: "Customer arrival notifications are sent automatically based on the scheduling policy timing (default: 30 min before). No manual action needed.",
        type: "set-and-forget",
      },
      {
        text: "Review scheduling exceptions weekly. Unbooked home-required visits, window infeasibility, and overdue service-week items accumulate slowly — a weekly review catches them before customers notice.",
        type: "weekly-check",
      },
    ],
  },
];
