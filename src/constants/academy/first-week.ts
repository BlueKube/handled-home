import type { TrainingSection } from "@/components/academy/AcademySection";

export const firstWeekSections: TrainingSection[] = [
  {
    id: "welcome-overview",
    title: "Welcome to the Operations Team",
    type: "overview",
    content: `You made it. Welcome to the team.

This week isn't about memorizing a playbook — it's about building a mental model of how the operation actually runs. By Friday you'll be running the daily rhythm solo. That's not a distant goal; it's a reasonable outcome of five focused days.

Here's the learning philosophy we use here: Observe → Shadow → Do → Own.

Day 1, you watch. Day 2, you follow along. Day 3, you touch the controls with someone next to you. Day 4, you run it yourself with a safety net. Day 5, you own it.

Nobody expects perfection this week. What we do expect is that you ask questions when something doesn't make sense, that you don't click buttons you don't understand yet, and that you flag anything that looks off rather than hoping it resolves itself.

The operation moves fast, but it's not chaos — it just looks that way until you understand the rhythm. By Wednesday that rhythm will start to feel obvious. By Friday it'll feel like yours.

Let's get started.`,
  },

  {
    id: "day-1-setup",
    title: "Day 1 — Get Your Bearings (Observe Only)",
    type: "walkthrough",
    steps: [
      {
        title: "Complete your account setup",
        description:
          "Your manager will have sent you an invite. Accept it, set your password, and enable two-factor authentication before you do anything else. If the invite hasn't arrived, check your spam folder first, then ping your manager — don't try to work around it.",
        screenshot: { alt: "Account setup and 2FA configuration screen" },
      },
      {
        title: "Navigate the admin shell",
        description:
          "Log in and spend ten minutes just clicking around. Don't change anything — just orient yourself. Notice the main nav sections: Cockpit, Execution, People, Markets, Catalog, Money, Growth, Support, Governance, Control Room, Academy, and Tools. The sidebar organizes every admin page into these groups. When something feels unfamiliar later, ask yourself which group it belongs to.",
        screenshot: { alt: "Admin shell main navigation overview" },
      },
      {
        title: "Find the Ops Cockpit",
        description:
          "The Ops Cockpit is your home base. It's the first screen you open every morning and the last one you check before you log off. It surfaces zone health, active job counts, exception queues, and provider status in one view. You don't need to understand every number today — just know where it lives and what it's called.",
        screenshot: { alt: "Ops Cockpit dashboard with zone health and queue indicators" },
      },
      {
        title: "Watch the morning health check (don't touch anything yet)",
        description:
          "At the start of each morning, the operator on shift runs a health check: review zone statuses, scan open exceptions, confirm the Dispatcher Queues are draining normally. Today you watch someone else do this. Pay attention to the sequence — it's the same every day, which is intentional. Consistency is what lets you spot anomalies fast.",
        screenshot: { alt: "Morning health check checklist in the Ops Cockpit" },
      },
      {
        title: "Ask one question at the end of the day",
        description:
          "At the end of Day 1, write down the one thing that confused you most. Ask your supervisor before you leave. This habit — one clarifying question per day — compounds fast. By Friday you'll have resolved five things that would otherwise slow you down for weeks.",
      },
    ],
  },

  {
    id: "day-2-rhythm",
    title: "Day 2 — Shadow the Daily Rhythm",
    type: "walkthrough",
    steps: [
      {
        title: "Understand the three-beat daily rhythm",
        description:
          "Every ops day has the same three beats: morning check (start of day), mid-day triage (late morning / early afternoon), and EOD reconciliation (end of day). Today you shadow each one. The names describe exactly what they are — checking, triaging, reconciling. Internalize this structure and the rest of the job fits inside it naturally.",
      },
      {
        title: "Morning check — scan zone health and queue depth",
        description:
          "Open the Ops Cockpit. Scan zone health indicators top to bottom. Any zone showing yellow or red is the first thing you address. Then look at queue depth in Dispatcher Queues — is volume moving at the expected rate for this time of day? On a normal morning this takes under five minutes. If something looks off, it takes longer because you're already investigating.",
        screenshot: { alt: "Dispatcher Queues panel showing queue depth and drain rate" },
      },
      {
        title: "Learn to read the Dispatcher Queues",
        description:
          "The Dispatcher Queues show jobs moving through the system. Each queue represents a stage: Pending → Assigned → In Progress → Complete (and Exception for anything that fell out). A healthy queue has jobs flowing through without pooling in one stage. Pooling means something upstream isn't working. Today, have your supervisor narrate what they see as they read the queues — this context takes days to absorb from a manual alone.",
        screenshot: { alt: "Dispatcher Queue stages with job state flow diagram" },
      },
      {
        title: "Understand job states",
        description:
          "Every job in the system is in exactly one state at a time: Draft, Pending, Assigned, In Progress, Complete, Cancelled, or Exception. Most jobs move from Pending to Complete without you ever touching them — the system handles that. Your job is to catch the ones that don't. Today, find an Exception job and ask your supervisor to walk you through why it ended up there and what the resolution was.",
      },
      {
        title: "EOD reconciliation — confirm the books balance",
        description:
          "At end of day, you verify that all jobs that should have completed did complete, all open exceptions are either resolved or escalated, and tomorrow's queue looks healthy. This isn't an audit — it's a five-minute sanity check. The goal is that you sleep easy knowing you haven't left a hidden problem for the morning team to discover.",
      },
    ],
  },

  {
    id: "day-3-exceptions",
    title: "Day 3 — Handle Your First Exception (Supervised)",
    type: "walkthrough",
    steps: [
      {
        title: "Open the exception queue with your supervisor",
        description:
          "Today you handle your first exception — but with your supervisor next to you (or on a call). Pull up the exception queue in the Ops Cockpit. Pick the oldest unresolved exception that isn't flagged as critical. Read everything on the job record before you decide anything: job history, notes, provider assignment, customer details.",
        screenshot: { alt: "Exception queue sorted by age with severity indicators" },
      },
      {
        title: "Learn the exception triage flow",
        description:
          "Every exception gets the same first question: is this a provider issue, a data issue, or a system issue? Provider issue — provider didn't show, cancelled, or is unreachable. Data issue — the job has bad or missing information. System issue — something in the platform behaved unexpectedly. Your diagnosis determines your next action. Don't jump to a solution before you've named the cause.",
      },
      {
        title: "Reassign or escalate — don't do both",
        description:
          "Once you've diagnosed the exception, you either resolve it (reassign, correct the data, close with a note) or escalate it to tier-2 support. The mistake new operators make is trying to do both — partial resolution followed by escalation creates confusion about who owns the job. Pick one path and follow it to completion.",
      },
      {
        title: "Practice using macros for support tickets",
        description:
          "When a job requires a support ticket, use the macros library before writing anything from scratch. Macros exist for the twelve most common exception types. Using a macro isn't laziness — it ensures consistent customer communication and saves you three minutes per ticket. Find the macros under Support → Templates. Today, apply one macro to a real ticket (with supervisor sign-off before sending).",
        screenshot: { alt: "Support ticket macros library with exception type filters" },
      },
      {
        title: "Close the loop — log your resolution",
        description:
          "After resolving any exception, write a one-sentence internal note on the job record explaining what you found and what you did. 'Reassigned to Provider 42 — original provider unresponsive for 2+ hours' is perfect. This note protects you and helps the next person who touches the record understand what happened without re-investigating.",
      },
    ],
  },

  {
    id: "day-4-independence",
    title: "Day 4 — Run the Daily Rhythm Independently",
    type: "walkthrough",
    steps: [
      {
        title: "Run morning check on your own",
        description:
          "Today you run the full morning check without prompting. Open the Ops Cockpit, work through zone health, check queue depth, review any overnight exceptions. Your supervisor is available but you're the one making the calls. Trust your read from Days 2 and 3. If something looks off and you're not sure, it's fine to ask — but form your own hypothesis first.",
      },
      {
        title: "Monitor zone health throughout the day",
        description:
          "Zone health isn't just a morning-check metric — it's a live signal you're watching throughout the day. Set a reminder to glance at zone status every 90 minutes. Most of the time it'll be green and you'll move on in ten seconds. The discipline of checking consistently means you catch degradation while it's still small.",
        screenshot: { alt: "Zone health panel with real-time status indicators" },
      },
      {
        title: "Review provider performance",
        description:
          "Pull up the Provider Performance view and look at the last 7 days for your active zones. You're looking for providers with declining completion rates, rising exception rates, or unusually long job durations. You don't need to act on anything today — just build the habit of reading the numbers and noticing which providers are performing and which aren't.",
        screenshot: { alt: "Provider performance table with completion rate and exception rate columns" },
      },
      {
        title: "Start building your own patterns",
        description:
          "By Day 4 you'll notice you're developing instincts — a particular zone always spikes mid-afternoon, a specific provider tends to cancel on Thursdays, certain job types generate exceptions at higher rates. Write these observations down. Your personal pattern library is more valuable than any documentation because it's specific to this operation and your zones. Keep a running note somewhere you can add to it daily.",
      },
      {
        title: "EOD check-in with your supervisor",
        description:
          "End the day with a five-minute debrief with your supervisor. What did you handle independently? What made you hesitate? What would you do differently? This isn't a performance review — it's calibration. Day 4 is when most new operators discover the gap between 'I understand the concept' and 'I can execute it under real conditions.' That gap closes fast once you name it.",
      },
    ],
  },

  {
    id: "day-5-solo",
    title: "Day 5 — Full Day Solo (Safety Net Available)",
    type: "walkthrough",
    steps: [
      {
        title: "Run morning-to-EOD independently",
        description:
          "Today is yours. Run the full day — morning check, mid-day triage, exceptions, provider monitoring, EOD reconciliation — without prompting from your supervisor. They're available, but you're the operator on shift. This isn't a test; it's the first real day of your career on this team. Approach it that way.",
      },
      {
        title: "Use your judgment, document your calls",
        description:
          "When something comes up that you haven't seen before, use your judgment. You have enough context by now to make a reasonable call. What matters more than being right is that you document what you did and why — a one-sentence internal note on every non-routine action. This gives your supervisor the ability to review your decisions without having to ask, and gives you a record to learn from.",
      },
      {
        title: "Know your escalation triggers",
        description:
          "There are four situations where you escalate immediately rather than attempting to resolve yourself: (1) a customer-facing incident affecting more than one job in a zone, (2) a provider marking themselves unavailable mid-shift with open jobs, (3) any system behavior that doesn't match what you'd expect, (4) an exception you've attempted twice without resolution. When in doubt on trigger #4 — two attempts is the limit. Escalate and move on.",
      },
      {
        title: "Review the weekly rhythm",
        description:
          "The daily rhythm is what you've learned this week. But there's also a weekly rhythm: Monday sets the tone for zone staffing, Wednesday is the halfway check on the week's volume targets, Friday is the week-close review where you look at exceptions resolved, provider performance trends, and anything to hand off to the weekend team. You don't need to master the weekly rhythm today — just know it exists and ask your supervisor to walk you through the Friday close.",
      },
      {
        title: "Reflect and reset for Week 2",
        description:
          "At the end of Day 5, take fifteen minutes and write down: three things you're confident about, one thing you're still unsure about, and one question you want answered before Monday. Share this with your supervisor. The confidence inventory isn't just feedback for them — it's a useful snapshot for you of how far you've come in five days. Week 2 is where you start adding depth. Week 1 was about building the foundation.",
      },
    ],
  },

  {
    id: "first-week-pro-tips",
    title: "Pro Tips From the Team",
    type: "pro-tips",
    proTips: [
      {
        text: "The Ops Cockpit tells you what is happening. Your job is to understand why. Don't act on a number until you can explain what caused it.",
        context:
          "New operators often jump to resolution before diagnosis. Slow down for ten seconds to name the cause — it prevents fixing the symptom while the problem continues.",
      },
      {
        text: "Ask questions out loud, not in your head. The question you're embarrassed to ask is the one you most need answered.",
        context:
          "Every experienced operator on this team has a version of 'I wish I'd asked about that sooner.' The faster you close your knowledge gaps, the faster your judgment becomes reliable.",
      },
      {
        text: "Confidence comes from repetition, not from understanding everything. You don't need to know all the edge cases on Day 1 — you need to run the routine until the routine is automatic.",
        context:
          "The operators who struggle in their first month are usually the ones who avoid doing things until they feel fully prepared. The routine teaches you things the docs can't.",
      },
      {
        text: "When the queue looks weird, look at what changed in the last two hours before you investigate the queue itself.",
        context:
          "Queue anomalies are almost always downstream effects of something that happened upstream. A provider going offline, a zone configuration change, a spike in job volume — these are the causes. The queue is the symptom.",
      },
      {
        text: "Your first-week observations are the most valuable you'll ever have. Write them down before you stop noticing them.",
        context:
          "After a few weeks, confusing things start to feel normal. The things that confused you on Day 2 are often real friction points that experienced operators have stopped noticing. Your fresh perspective is a genuine asset — use it.",
      },
    ],
  },

  {
    id: "first-week-watch-outs",
    title: "Common First-Week Mistakes",
    type: "watch-outs",
    watchOuts: [
      {
        text: "Resolving an exception without reading the full job history first. The context in the history is usually the fastest path to the right resolution — skipping it means you often fix the wrong thing or duplicate work someone already did.",
        severity: "critical",
      },
      {
        text: "Clicking through confirmation dialogs without reading them. Some actions in the admin shell are irreversible — reassigning a job in progress, cancelling an active provider, overriding a zone setting. When a dialog asks you to confirm, read every word before you click OK.",
        severity: "critical",
      },
      {
        text: "Assuming silence means everything is fine. A quiet exception queue in the afternoon sometimes means exceptions are resolving on their own. It sometimes means the queue isn't surfacing them correctly. Until you have enough pattern recognition to tell the difference, a quiet queue is worth a quick active check, not just an absence of alerts.",
        severity: "caution",
      },
    ],
  },
];
