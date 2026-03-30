# Full Implementation Plan — Session 3: Admin Academy Training Center

> **Created:** 2026-03-30
> **Context:** Sessions 1–2 built the full admin console (62+ pages across 12 nav groups). The platform is feature-complete for pilot launch. The missing piece: no admin knows how to use it. The Academy fills this gap with interactive, screenshot-annotated training guides written in the voice of a senior operator mentoring a new hire.
> **Branch:** claude/add-feature-maturity-ratings-tMeen

---

## Strategic Context

Handled Home's admin console is powerful but dense. A new operator logging in for the first time sees 12 nav groups, 40+ pages, and hundreds of configuration dials. Without training, they'll either avoid critical tools (letting cron failures go unnoticed) or misconfigure sensitive ones (pricing overrides without audit reasons).

**The Academy is not documentation — it's operator training.** The difference:
- Documentation says "Click Pricing & Margin to set prices."
- Training says "Before you touch pricing, check the Change Log first. The last person who changed lawn care pricing without checking the log accidentally reverted a zone-specific override that took 3 support tickets to diagnose."

Every guide is written from the perspective of a senior operator who has made the mistakes, found the shortcuts, and knows which metrics actually matter vs. which ones are noise.

### Design Approach: CSS-Annotated Screenshots

Since we can't edit images programmatically, each guide uses **CSS overlay annotations** on screenshots:
- Positioned highlight boxes with colored borders around key UI areas
- Pulsing dot indicators for "click here" callouts
- Arrow SVGs pointing from annotation labels to UI elements
- Numbered step markers overlaid on screenshots

This keeps annotations maintainable in code — when the UI changes, update the screenshot and the overlay positions, not a Photoshop file.

### Content Voice

Every guide follows this pattern:
1. **What this page does** — 2 sentences max
2. **When you'll use it** — Real scenarios, not abstract descriptions
3. **The walkthrough** — Step-by-step with annotated screenshots
4. **Pro tips** — What a senior operator would tell you over coffee
5. **Watch out for** — Common mistakes and how to avoid them
6. **Automation opportunities** — Things you can set-and-forget vs. things that need daily eyes

---

## PRD Sequence

### Phase 1: Academy Foundation & Daily Operations (The pages you'll use every day)

These are the pages a new operator needs on Day 1. If they learn nothing else, they need to know how to run the daily ops rhythm.

| PRD | Title | Scope | Size | Est. Time |
|-----|-------|-------|------|-----------|
| 027 | Academy Page Shell & Navigation | Create `/admin/academy` page with module navigation, progress tracking, search, and the CSS annotation overlay system (reusable `AnnotatedScreenshot` component). Add nav item to AdminShell. This is the container — no training content yet. | L | 3-4 hrs |
| 028 | Module: Ops Cockpit & Daily Rhythm | Training guide for Ops Cockpit + Dispatcher Queues. Covers: morning check-in routine, reading the 4-column layout, understanding health gauges, when to act on alerts vs. when to watch, dispatcher keyboard shortcuts, the "end-of-day reconciliation" flow. Pro tips on which metrics are leading vs. lagging indicators. | L | 3-4 hrs |
| 029 | Module: Jobs & Scheduling Operations | Training guide for Jobs, Service Days, Scheduling, Scheduling Policy, Planner Dashboard, Assignments, Assignment Config, Window Templates, and Scheduling Exceptions. Covers: how the 14-day rolling horizon works, what "LOCKED" vs "DRAFT" means for operators, when to run the planner manually, how to handle weather mode, assignment engine tuning (and why you shouldn't touch it without data), window template best practices. | L | 4-5 hrs |
| 030 | Module: Exception Management | Training guide for Job Exceptions, Ops Console (Ops Exceptions), and Exception Analytics. Covers: triage priority (severity + age), the "next best action" pattern, when to escalate vs. resolve locally, common exception types and their root causes, the difference between billing exceptions and job exceptions. Pro tip: "If you see the same exception type 3 times in a week, you have a process problem, not a job problem." | M | 2-3 hrs |

### Phase 2: People & Market Management (The pages you'll use weekly)

These require more judgment. A new operator should shadow someone before making changes here.

| PRD | Title | Scope | Size | Est. Time |
|-----|-------|-------|------|-----------|
| 031 | Module: Provider Lifecycle | Training guide for Providers list, Provider Detail, Applications, and Application Detail. Covers: the provider lifecycle (application → approval → onboarding → active → probation → suspension), how to evaluate applications (what to look for, red flags), zone coverage approval workflow, reading provider performance metrics, when to put someone on probation vs. having a conversation, the BYOC invite system. Pro tip: "A provider with 95% proof compliance and 2% issue rate is worth more than one who completes jobs faster but skips photos." | L | 3-4 hrs |
| 032 | Module: Customer Billing & Ledgers | Training guide for Customer Billing dashboard, Customer Ledger, Ops Billing. Covers: subscription lifecycle (trial → active → past due → paused → canceled), reading the billing dashboard, investigating a past-due account, when to issue credits vs. refunds, the dunning ladder (what happens automatically vs. what needs manual intervention), understanding the ledger entries. Pro tip: "Never issue a credit without checking the customer's service history first. If they've had 3 issues in 2 months, the problem isn't billing — it's service quality." | M | 2-3 hrs |
| 033 | Module: Provider Payouts & Money | Training guide for Payouts, Provider Ledger, and the Money section of Ops Cockpit. Covers: payout schedule and timing, how payout holds work, investigating payout failures, the relationship between job completion → earning → hold release → payout, minimum thresholds and rollover. Pro tip: "Payout day is Friday. By Wednesday, check for providers with held earnings — if holds aren't releasing, something upstream broke (usually a missing proof submission)." | M | 2-3 hrs |
| 034 | Module: Zones, Capacity & Market Launch | Training guide for Zones, Zone Builder, Ops Zones, Ops Zone Detail, and Capacity. Covers: zone lifecycle (planning → recruiting → soft launch → live), the H3 hex grid system (and why it matters for density), reading zone health scores, when to expand vs. when to pause, the zone × category state matrix, capacity planning. Pro tip: "Don't launch a zone until you have at least 3 active providers covering lawn. One provider sick day shouldn't mean an entire neighborhood misses service." | L | 3-4 hrs |

### Phase 3: Catalog & Plans (The pages you'll configure during setup, then revisit quarterly)

These pages are high-leverage but low-frequency. Getting them right at setup prevents months of downstream issues.

| PRD | Title | Scope | Size | Est. Time |
|-----|-------|-------|------|-----------|
| 035 | Module: SKU Catalog Management | Training guide for SKUs, SKU Calibration, and Level Analytics. Covers: SKU design principles (inclusions/exclusions matter more than you think), the calibration workflow (seed data → provider interviews → delta review → apply), level variants and when to add them, proof requirements (why "before + after" is non-negotiable for lawn), duration accuracy and why it matters for scheduling. Pro tip: "Every 10 minutes of duration error compounds across a provider's daily route. If lawn mowing is set to 45 min but takes 60, by the 5th job they're running 75 minutes late." | M | 2-3 hrs |
| 036 | Module: Plans, Bundles & Entitlements | Training guide for Plans, Bundles, and the entitlement system. Covers: plan design philosophy (why fewer plans is better), entitlement versioning (what happens when you change a plan's included services), zone availability (why plans should vary by market), the handle economy (subscription spread model), bundle mechanics. Pro tip: "Resist the urge to create a plan for every possible combination. Three plans (Good/Better/Best) with add-ons covers 90% of households. Every additional plan doubles your support complexity." | M | 2-3 hrs |

### Phase 4: Support & Growth (The pages you'll use reactively)

Support is reactive by nature, but growth should be proactive. These guides teach the difference.

| PRD | Title | Scope | Size | Est. Time |
|-----|-------|-------|------|-----------|
| 037 | Module: Support Operations | Training guide for Support Tickets, Support Policies, Support Macros, and Ticket Detail. Covers: ticket triage (priority matrix), SLA timers and what happens when they breach, macro best practices (templates should feel human, not robotic), when to escalate to a supervisor, the relationship between support tickets and job exceptions. Pro tip: "Read the customer's service history before replying to their ticket. Half the time, the answer to their complaint is visible in their last 3 completed jobs." | M | 2-3 hrs |
| 038 | Module: Growth & Incentives | Training guide for Growth dashboard, Incentives (Programs/Rewards/Flags), and Reports. Covers: referral program mechanics, fraud flag detection (how to spot gaming), BYOC/BYOP funnel reading, when referral economics are working vs. burning money, the K-factor and what it means for zone health. Pro tip: "A referral program that costs you $30/customer is a steal if that customer stays 12+ months at $179/mo. Don't panic about referral costs — panic about referral churn." | M | 2-3 hrs |

### Phase 5: Governance & Control Room (The pages only senior operators and superusers touch)

These are power tools. Misconfiguration here has immediate financial impact.

| PRD | Title | Scope | Size | Est. Time |
|-----|-------|-------|------|-----------|
| 039 | Module: Governance & System Health | Training guide for Audit Log, Cron Health, Notification Health, Feedback, Test Toggles, and Launch Readiness. Covers: daily health check routine (cron → notifications → audit), how to read cron failures (and which ones are safe to ignore), the audit log as your "what happened" tool, test toggle discipline (never leave a toggle on in production without a removal date), launch readiness as a pre-launch gate. Pro tip: "Check Cron Health every morning before anything else. If cron died overnight, billing didn't run, dunning didn't run, and assignment didn't run. You'll find out the hard way from customer complaints if you don't check proactively." | M | 2-3 hrs |
| 040 | Module: Control Room (Superuser) | Training guide for Pricing & Margin, Payout Rules, Change Requests, Change Log, and Control Config. Covers: the change request workflow (why every pricing change needs a reviewer), zone-specific pricing overrides (when to use multipliers vs. absolute prices), payout rule configuration, the rollback process, reading the change log to understand what happened and why. Pro tip: "The Control Room exists because a single pricing mistake affects every customer in a zone within 24 hours. The change request workflow isn't bureaucracy — it's the only thing between you and a mass billing error." | M | 2-3 hrs |

### Phase 6: Playbooks & Putting It All Together

| PRD | Title | Scope | Size | Est. Time |
|-----|-------|-------|------|-----------|
| 041 | Module: SOPs & Playbooks | Training guide for the Playbooks page and how SOPs connect to daily operations. Covers: when to follow the playbook vs. when to escalate, the relationship between SOPs and the exception queue, how to suggest playbook improvements. Links each SOP to the relevant Academy module. | S | 1-2 hrs |
| 042 | Module: First Week Onboarding Path | A guided "your first week" experience that sequences the other modules into a 5-day learning plan: Day 1 (Cockpit + Daily Rhythm), Day 2 (Jobs + Scheduling), Day 3 (Providers + Billing), Day 4 (Zones + Catalog), Day 5 (Support + Governance). Includes a "graduation checklist" of tasks to complete. | M | 2-3 hrs |

---

## Dependency Graph

```
PRD-027 (Academy Shell) ──┬──→ All other PRDs depend on this
                          │
PRD-028 (Ops Cockpit) ────┤
PRD-029 (Scheduling) ─────┤── Phase 1: Can run in parallel after shell
PRD-030 (Exceptions) ─────┘

PRD-031 (Providers) ──────┤
PRD-032 (Billing) ────────┤── Phase 2: Independent of each other
PRD-033 (Payouts) ────────┤
PRD-034 (Zones) ──────────┘

PRD-035 (SKUs) ───────────┤── Phase 3: Independent of each other
PRD-036 (Plans) ──────────┘

PRD-037 (Support) ────────┤── Phase 4: Independent of each other
PRD-038 (Growth) ─────────┘

PRD-039 (Governance) ─────┤── Phase 5: Independent of each other
PRD-040 (Control Room) ───┘

PRD-041 (Playbooks) ──────┤── Phase 6: Depends on all prior modules
PRD-042 (Onboarding) ─────┘   (references them)
```

### Parallelization Opportunities

Within each phase, all PRDs are independent and can run in parallel. Only PRD-027 (shell) is a hard blocker for everything else. PRDs 041–042 reference other modules, so they should run last.

---

## Estimated Session Plan

| Block | PRDs | Time | Notes |
|-------|------|------|-------|
| **Start** | Read plan, re-anchor | 10 min | |
| **Block 1** | 027 (Academy Shell) | 3-4 hrs | Foundation — must complete first |
| **Block 2** | 028 + 029 + 030 | 4-5 hrs | Daily ops training (parallel where possible) |
| **Block 3** | 031 + 032 + 033 + 034 | 4-5 hrs | People & markets (parallel) |
| **Block 4** | 035 + 036 | 2-3 hrs | Catalog & plans (parallel) |
| **Block 5** | 037 + 038 | 2-3 hrs | Support & growth (parallel) |
| **Block 6** | 039 + 040 | 2-3 hrs | Governance & control (parallel) |
| **Block 7** | 041 + 042 | 2-3 hrs | Playbooks & onboarding path |
| **Cleanup** | Archive, doc sync | 30 min | |
| **Total** | 16 PRDs | ~22-30 hrs | |

If context runs low, prioritize: 027 → 028 → 029 → 031 → 034 → 039 → 042

This priority order ensures: the shell exists, the daily rhythm is covered, providers and zones (the two most complex areas) are trained, governance is explained, and a structured onboarding path ties it together.

---

## Technical Architecture

### AnnotatedScreenshot Component

Reusable component that renders a screenshot with CSS overlays:

```tsx
<AnnotatedScreenshot
  src="/academy/ops-cockpit-overview.png"
  alt="Ops Cockpit main view"
  annotations={[
    { type: "box", x: 10, y: 15, w: 22, h: 30, label: "NOW column", color: "blue" },
    { type: "arrow", from: { x: 50, y: 10 }, to: { x: 35, y: 25 }, label: "Click here" },
    { type: "pulse", x: 80, y: 45, label: "Health gauge" },
    { type: "step", x: 60, y: 70, number: 3, label: "Check alerts last" },
  ]}
/>
```

All positions are percentage-based so annotations scale with the image. The component handles responsive sizing.

### Screenshot Capture Pipeline

Screenshots are captured via headless Chromium and stored in `public/academy/`:

```bash
# Capture at consistent viewport
chrome --headless --no-sandbox --window-size=1280,800 \
  --virtual-time-budget=8000 \
  --screenshot=/path/to/public/academy/page-name.png \
  http://127.0.0.1:5173/admin/page-name
```

Each PRD includes screenshot capture as a batch step.

### Academy Data Structure

Training modules are defined as typed data, not hardcoded JSX:

```tsx
interface AcademyModule {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  estimatedMinutes: number;
  sections: AcademySection[];
  proTips: ProTip[];
  watchOuts: WatchOut[];
}
```

This allows the First Week Onboarding Path (PRD-042) to reference and sequence modules programmatically.

---

## Success Criteria

This plan is complete when:

1. `/admin/academy` page exists with module navigation and search
2. All 12 admin nav groups have corresponding training modules
3. Each module includes annotated screenshots with CSS overlays
4. Pro tips and watch-outs are present in every module
5. A structured 5-day onboarding path exists for new operators
6. The First Week module includes a graduation checklist
7. Build passes (`npx tsc --noEmit && npm run build`)

### Quality Bar

A training module is "done" when a new operator with zero Handled Home experience could:
- Complete the daily ops rhythm without asking for help
- Know which pages to check first in a crisis
- Understand the consequences of misconfiguring a control room setting
- Know when to act vs. when to escalate

---

## What This Plan Does NOT Cover

- **Video tutorials** — Text + annotated screenshots only for V1
- **Interactive simulations** — No sandbox/practice mode (future enhancement)
- **Customer/provider training** — Admin-only for now
- **Certification/testing** — No quizzes or assessments (future)
- **Localization** — English only
- **Mobile-optimized Academy** — Admin console is desktop-focused; Academy follows suit

---

## Content Philosophy

### Why "Senior Operator" Voice?

Generic documentation fails for operations tools because:
1. It describes *what* without explaining *when* and *why*
2. It treats all features equally, when in practice 20% of features handle 80% of daily work
3. It never warns you about the mistakes that are easy to make
4. It doesn't teach judgment — which is the actual skill of operations

The senior operator voice fixes all four. Every guide prioritizes the scenarios a new hire will actually encounter, warns about the mistakes that veterans have made, and teaches the judgment calls that separate a competent operator from one who's just clicking buttons.

### The Three Questions Every Section Answers

1. **What does this page/feature do?** (Factual, 2 sentences max)
2. **When would a competent operator use this?** (Scenario-driven)
3. **What would a veteran tell a new hire about this?** (Judgment, shortcuts, warnings)

If a section can't answer all three, it's documentation, not training.
