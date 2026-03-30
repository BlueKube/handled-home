import type { TrainingSection } from "@/components/academy/AcademySection";

export const sopsPlaybooksSections: TrainingSection[] = [
  {
    id: "overview",
    title: "What Are SOPs and When Do You Follow Them?",
    type: "overview",
    content: `SOPs (Standard Operating Procedures) are your playbook for predictable situations. When a provider no-shows, when a customer disputes a charge, when you need to pause a zone for weather — there's a procedure. The Playbooks page organizes these by role: dispatcher, ops, and superuser.

The value of SOPs isn't that they tell you exactly what to do in every situation. It's that they give you a starting point so you're not making it up as you go. A dispatcher handling their first no-show at 3pm on a Friday doesn't need to think from first principles — they need a checklist.

Key principle: follow the SOP until it stops making sense, then escalate. SOPs handle the 90% case. The 10% that doesn't fit the playbook is why you have senior operators and supervisors.`,
  },
  {
    id: "daily-rhythm",
    title: "The Daily and Weekly Rhythm",
    type: "walkthrough",
    steps: [
      {
        title: "Morning check-in (daily, 10 min)",
        description: "Cron Health → Ops Cockpit → Dispatcher Queues (At Risk tab) → Assignment status. This is your 'is everything running?' check. If all green, move on with your day. If something's red, triage before doing anything else.",
        screenshot: { alt: "Morning check-in sequence across pages" },
      },
      {
        title: "Mid-day triage (daily, 15 min)",
        description: "Dispatcher Queues (all tabs) → Exception queue → Support tickets nearing SLA breach. This catches same-day issues before they cascade into customer complaints. The mid-day check is especially important because morning issues have had time to develop.",
        screenshot: { alt: "Mid-day triage checklist" },
      },
      {
        title: "End-of-day reconciliation (daily, 10 min)",
        description: "Jobs page (today, filter by ISSUE_REPORTED) → Provider proof compliance → Any open exceptions from today. This is your 'did everything that was supposed to happen actually happen?' check. Unresolved items get flagged for tomorrow morning.",
        screenshot: { alt: "End-of-day reconciliation view" },
      },
      {
        title: "Weekly review (Friday, 30 min)",
        description: "Zone health table (trends, not just today) → Exception Analytics (patterns, not individual items) → Provider performance summary → Support ticket volume trends. This is your 'what's the story of this week?' check. Write a brief summary for the team.",
        screenshot: { alt: "Weekly review dashboard combination" },
      },
    ],
  },
  {
    id: "common-sops",
    title: "Common SOPs and When They Apply",
    type: "text",
    content: `PROVIDER NO-SHOW
Trigger: Provider didn't check in by end of scheduled window
Steps: (1) Check if provider communicated absence, (2) Attempt contact, (3) Assign to backup if available, (4) Notify customer with ETA for replacement, (5) Log incident on provider record, (6) Review pattern — 2+ no-shows in 30 days triggers probation discussion

CUSTOMER DISPUTE
Trigger: Customer reports service wasn't performed or was substandard
Steps: (1) Check proof photos, (2) Check provider check-in/check-out times, (3) If proof shows service was done: share photos with customer, explain scope, (4) If proof is missing or shows issues: apologize, issue credit, schedule redo, (5) Log on provider record if provider fault

ZONE PAUSE (WEATHER)
Trigger: Sustained severe weather (2+ day forecast)
Steps: (1) Activate weather mode for affected zone(s), (2) Verify reschedule queue generated correctly, (3) Send proactive customer notification, (4) When weather clears: deactivate weather mode, (5) Monitor reschedule backlog for 2-3 days post-weather

EMERGENCY PRICING CORRECTION
Trigger: Pricing error discovered after billing ran
Steps: (1) Identify scope (how many customers affected, which zones), (2) Correct pricing in Control Room, (3) Calculate affected invoices, (4) Issue credits for overcharges, (5) Send customer communication, (6) Log in Change Log with full explanation

END-OF-DAY RECONCILIATION
Trigger: Daily at end of business
Steps: (1) Check all jobs scheduled for today reached terminal state, (2) Flag jobs stuck in IN_PROGRESS (provider forgot to check out?), (3) Check proof submission rate for today, (4) Note any unresolved exceptions for tomorrow`,
  },
  {
    id: "pro-tips",
    title: "Pro Tips from Veteran Operators",
    type: "pro-tips",
    proTips: [
      {
        text: "Follow the SOP for the first 3 months, even if you think you know a better way. After 3 months, you'll have enough context to know which shortcuts actually save time and which ones create debt. Suggest improvements to the SOP — don't silently deviate.",
        context: "SOPs encode institutional knowledge. Ignoring them means repeating mistakes that were already solved.",
      },
      {
        text: "The daily rhythm (morning check → mid-day triage → EOD reconciliation) is the most important habit you'll build. It's only 35 minutes total. Skip it three days in a row and you'll spend 3 hours on Friday cleaning up the mess.",
      },
      {
        text: "When an SOP says 'escalate to senior operator,' it doesn't mean 'fail.' It means the situation is outside the scope of standard procedures and needs someone with more authority or context. Escalating early is a sign of good judgment, not weakness.",
      },
    ],
  },
  {
    id: "watch-outs",
    title: "Watch Out For...",
    type: "watch-outs",
    watchOuts: [
      {
        text: "SOPs are a starting point, not a rulebook for every possible situation. A customer who lost their home in a fire doesn't need the standard dispute resolution SOP — they need human empathy and a manual account adjustment. Know when to go off-script.",
        severity: "caution",
      },
      {
        text: "Don't skip the end-of-day reconciliation because 'it was a quiet day.' Quiet days are when small problems hide. A single unresolved job stuck in IN_PROGRESS will become tomorrow's missing-proof exception which becomes next week's customer complaint.",
        severity: "caution",
      },
    ],
  },
];
