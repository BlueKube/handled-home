# PRD-to-Production Workflow

A portable, repeatable workflow for taking a product idea from PRD through phased implementation to completion. Designed for Claude Code + human collaboration on any project.

---

## Overview

This workflow turns a Product Requirements Document (PRD) into shipped code through small, reviewed, documented batches. It prevents drift, maintains quality, and keeps documentation in sync with reality.

**The loop:** PRD → Plan → Phase → Batch → Review → Doc Sync → Next Batch → ... → Archive

---

## Phase 0: Idea → PRD

**Owner:** Human

1. Start with an idea — a feature, redesign, new system, or overhaul.
2. Write a PRD covering: problem statement, goals, scope, user stories, success criteria, constraints, and rough priority ordering.
3. The PRD does not need to be perfect. It needs to be specific enough that Claude can decompose it into phases.

### Execution mode

Each PRD should declare its execution mode:

- **Quality mode** (default) — Full 8-agent review system, full documentation sync. Production-ready.
- **Speed mode** — Reduced 4-agent review (Lanes 1 + 2 only, Sonnet tier only, no synthesis). Used for prototypes, validation builds, and low-risk changes. Max 2 fix passes then move on.

---

## Phase 1: PRD → Plan

**Owner:** Claude (with human approval)

1. **Read the PRD** thoroughly. Ask clarifying questions if anything is ambiguous.
2. **Decompose into phases** — each phase is a logical group of related work (e.g., "Customer pages", "Admin dashboard", "Growth features").
3. **Decompose phases into batches** — each batch is 1 theme across 1–3 screens or files. Keep them small enough for one focused implementation + one review cycle.
4. **Write the plan** as a structured markdown document:
   - Phase list with batch breakdown
   - Dependency order (what must come first)
   - Estimated size per batch (Small / Medium / Large)
   - Whether consecutive batches are combinable (same mechanical pattern)
   - Risk areas and deferred items
   - A **Session Handoff** section at the top (updated by every session before exit)
   - A **Progress Table** with batch status — this is the durable state machine that enables multi-session execution:
     - `✅` = complete and pushed
     - `🟡` = in progress (partial work pushed — note what's done)
     - `⬜` = not started
     - `❌` = blocked (note reason)
5. **Create the working folder:**
   ```
   docs/working/
   ├── prd.md              # The original PRD (copied here)
   ├── plan.md             # The phased implementation plan
   └── batch-specs/        # Individual batch specs (created as you go)
   ```
6. **Get human approval** on the plan before any coding begins.

---

## Phase 2: Batch Execution (repeat for each batch)

### Step 1: Re-anchor to the plan

Before starting any batch:
- **Read `docs/working/plan.md`** — re-read the full plan to stay aligned with phases, batches, dependencies, and progress
- State which phase and batch you're working on
- State what's already complete and what remains

At the **start of each phase** (i.e., the first batch of a new phase):
- **Read `docs/working/prd.md`** — re-read the full PRD to re-ground in the original requirements, goals, and success criteria before entering a new phase of work

### Step 2: Write the batch spec

Every batch gets a spec in `docs/working/batch-specs/` before coding starts:

```markdown
# Batch N: [Title]

## Phase
[Which phase this belongs to]

## Why it matters
[1–2 sentences on user/business impact]

## Scope
[Exact list of changes]

## Non-goals
[What this batch explicitly does NOT touch]

## File targets
| Action | File |
|--------|------|
| Create | path/to/new-file.tsx |
| Modify | path/to/existing-file.tsx |

## Acceptance criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Regression risks
- [What could break]

## Visual validation checklist
- [ ] Layout correct
- [ ] Dark mode works
- [ ] Empty states handled
- [ ] Touch targets adequate
```

### Step 3: Implement the spec

- Code only what the spec says. If you discover something out of scope, add it to a deferred items list — don't sneak it in.
- Commit with clear messages: `feat(<scope>): Batch N — {Description}`

### Step 4: Eight-agent code review

After each commit, run a multi-agent review. This is the quality gate that prevents bugs, drift, and regressions from compounding across batches.

**Every batch gets the same review.** There are no intensity tiers, no decision about whether to run fewer agents. The sub-agents use Sonnet and Haiku (inexpensive), run in parallel, and their output stays in sub-agent context — so the cost of always running the full review is negligible, while the cost of skipping it and missing something is high. Consistency matters more than micro-optimization here.

#### Architecture: 3 parallel lanes + 1 synthesis lane × 2 tiers = 8 agents

**Stage 1 — Parallel analysis (6 agents):** Launch Lanes 1–3 in parallel, each with a Sonnet (deep) and Haiku (fast) tier.

| Lane | What it checks | Deep tier | Fast tier |
|------|----------------|-----------|-----------|
| 1. Spec completeness audit | Does the implementation satisfy every requirement, acceptance criterion, and edge case in the batch spec? | Sonnet | Haiku |
| 2. Bug scan (diff only) | Bugs visible in the diff alone — no extra context, no codebase knowledge | Sonnet | Haiku |
| 3. Historical context & prior feedback | git blame / git log on changed files — did we break something intentional? Have these files had PR review comments before? Are we repeating past mistakes? | Sonnet | Haiku |

**Stage 2 — Synthesis (2 agents):** After Lanes 1–3 return, launch Lane 4 with all findings from the previous stage as input.

| Lane | What it checks | Deep tier | Fast tier |
|------|----------------|-----------|-----------|
| 4. Synthesis & cross-check | Cross-validate findings across lanes, resolve contradictions, catch inter-lane gaps, produce the final scored report | Sonnet | Haiku |

Lane 4 is the **only agent that sees other agents' output**. It serves as the communication bridge between lanes. This is critical because:
- Lane 1 might say "spec item X was implemented" while Lane 2 found a bug in that exact implementation — the synthesis agent connects those dots
- Lane 3 might say "this pattern was intentional per git history" while Lane 2 flagged it as a bug — the synthesis agent resolves the contradiction
- If all 3 lanes flag something in the same file, the synthesis agent elevates that file as high-risk
- Findings that fall between lane boundaries (not quite a bug, not quite a spec gap) get caught here

#### Model assignments

- **Sonnet agents (4):** Deep analysis tier. Lanes 1–3 get the diff + lane-specific context. Lane 4 (synthesis) gets all findings from the previous stage plus the diff and batch spec.
- **Haiku agents (4):** Fast second-opinion tier. Same inputs as their Sonnet counterparts. Haiku provides a quick sanity check that catches things Sonnet might frame differently or miss.

The two-tier approach works because different models catch different things. Sonnet tends to find architectural issues and subtle bugs; Haiku tends to catch obvious oversights and pattern violations that Sonnet sometimes rationalizes away.

#### What each agent receives

Every agent gets:
1. **The git diff** — `git diff HEAD~1...HEAD` (or branch diff for phase-level review)
2. **The batch spec** — acceptance criteria and scope from `docs/working/batch-specs/`
3. **Project rules** — relevant sections of CLAUDE.md (design system, conventions, consistency standards)

Additionally, per lane:
- **Lane 1:** The full batch spec from `docs/working/batch-specs/` — every requirement, acceptance criterion, scope item, and edge case. The agent cross-references each spec line against the diff and flags anything specified but not built, partially built, or built differently than specified. This is the lane that prevents "finished" batches from shipping incomplete.
- **Lane 2:** Diff only, no extra context (forces the agent to find bugs from code alone)
- **Lane 3:** `git blame`, `git log`, and PR review comments for every changed file. This lane combines historical context with prior feedback — in practice, these two concerns draw on the same source material (git history and past reviews) and rarely produce enough findings to justify separate agents.
- **Lane 4 (synthesis):** All findings from Lanes 1–3 (both tiers), the full diff, and the batch spec. The synthesis agent does not re-review the code — it cross-validates, de-duplicates, resolves contradictions, and produces the final scored report.

> **Why Lane 1 checks spec completeness instead of CLAUDE.md compliance:** CLAUDE.md conventions (semantic tokens, touch targets, padding, aria-labels) are already covered by the Bug Scan and Historical Context lanes — they naturally catch deviations from project patterns. What no other lane catches is *missing work* — requirements that were specified but never implemented. This gap caused an entire cleanup PRD after a previous implementation shipped "complete" with 7 unfinished items. The spec completeness audit closes that gap at the review stage.
>
> **Why Lane 4 is a synthesis lane instead of another parallel check:** Parallel lanes are fast but isolated — they can't see each other's findings, which means contradictions go unresolved, related findings across lanes stay disconnected, and inter-lane gaps slip through. The synthesis lane runs sequentially after Lanes 1–3, reads all their output, and produces a unified, cross-validated report. It's the only point in the review where findings from different perspectives are reconciled.
>
> **Why Lanes 3 and 4 (old) were combined:** Historical context (git blame/log) and prior feedback (past PR comments) draw on the same source material and consistently produced the fewest unique findings of any lane. Across multiple full plans, these two lanes combined produced ~1 unique actionable finding that no other lane caught. Combining them simplifies the review from 5 lanes to 4 without meaningful signal loss.

#### Agent prompts

Each agent prompt must include:
- Clear instruction to categorize findings as MUST-FIX / SHOULD-FIX / NICE-TO-HAVE
- File and line number references for every finding
- No access to implementation reasoning — the agent reviews the code on its own merits, as if it were a different developer

Example agent launch (Lane 1, Sonnet tier — Spec Completeness):
```
Agent tool:
  model: sonnet
  description: "Spec completeness audit — Sonnet"
  prompt: |
    You are a spec completeness auditor. Your job is to verify that
    every requirement in the batch spec was actually implemented.

    BATCH SPEC:
    [paste full batch spec]

    DIFF:
    [paste diff here]

    For each requirement/acceptance criterion in the spec:
    1. Check if the diff contains an implementation that satisfies it
    2. Check if partial implementations exist (built but incomplete)
    3. Check if the implementation diverges from what was specified

    Return findings as:
    - MUST-FIX (spec item → file:line): "X was specified but not implemented"
    - MUST-FIX (spec item → file:line): "X was partially implemented — missing Y"
    - SHOULD-FIX (spec item → file:line): "X was built differently than specified — spec says A, code does B"

    If every spec item is fully implemented, say "All spec items verified."
```

Example agent launch (Lane 2, Sonnet tier — Bug Scan):
```
Agent tool:
  model: sonnet
  description: "Bug scan lane — Sonnet"
  prompt: |
    You are a code reviewer. Review this diff for bugs only.
    You have NO context about why these changes were made.
    Evaluate the code purely on its own merits.

    DIFF:
    [paste diff here]

    ACCEPTANCE CRITERIA:
    [paste from batch spec]

    Return findings as:
    - MUST-FIX (file:line): description
    - SHOULD-FIX (file:line): description
    - NICE-TO-HAVE (file:line): description

    If no issues found, say "No issues found."
```

Example agent launch (Lane 4, Sonnet tier — Synthesis):
```
Agent tool:
  model: sonnet
  description: "Synthesis & cross-check — Sonnet"
  prompt: |
    You are a review synthesis agent. You did NOT review the code yourself.
    Your job is to cross-validate, de-duplicate, and score the findings
    from 3 independent review lanes.

    LANE 1 FINDINGS (Spec Completeness — Sonnet + Haiku):
    [paste findings]

    LANE 2 FINDINGS (Bug Scan — Sonnet + Haiku):
    [paste findings]

    LANE 3 FINDINGS (Historical Context & Prior Feedback — Sonnet + Haiku):
    [paste findings]

    BATCH SPEC:
    [paste batch spec]

    DIFF:
    [paste diff]

    Your tasks:
    1. De-duplicate findings that multiple lanes flagged
    2. Connect related findings (e.g., "spec says X implemented" + "bug in X")
    3. Resolve contradictions (e.g., "intentional per history" vs "flagged as bug")
    4. Flag anything that falls between lane boundaries
    5. Score each finding 0–100 using the confidence formula
    6. Categorize as MUST-FIX (75+), SHOULD-FIX (25–74), or DROP (0–24)

    Return the final unified report with scores and categories.
```

#### Merging findings (handled by Lane 4)

The synthesis lane produces the final report. Its job:

1. **De-duplicate** — if multiple lanes or tiers flagged the same issue, merge into one finding with higher confidence
2. **Cross-validate** — connect related findings across lanes (e.g., Lane 1 says "spec item implemented" + Lane 2 found a bug in that implementation = elevated priority)
3. **Resolve contradictions** — if Lane 3 says "this was intentional per history" but Lane 2 flagged it as a bug, make the call and explain the reasoning
4. **Score each finding 0–100:**
   - **Cross-tier agreement** (both Sonnet and Haiku flagged it): +30 confidence
   - **Cross-lane agreement** (multiple lanes flagged it): +20 per additional lane
   - **Severity of impact** (regression, security, data loss): +20–40
   - **Specificity** (exact file:line with clear explanation): +10
   - **Style-only** (formatting, naming preference): cap at 20

5. **Apply thresholds:**
   - **75–100 (MUST-FIX):** Bugs, regressions, security issues, missing spec items — **fix before proceeding**
   - **25–74 (SHOULD-FIX):** Inconsistencies, missing polish, non-critical issues — **fix in same batch when feasible**
   - **0–24 (DROP):** Style preferences, minor suggestions — log or ignore

#### Fix loop

Fix findings → re-commit → **lightweight re-review** → repeat until clean. **Maximum 3 passes.**

**Lightweight re-review (passes 2+):** On fix commits, only run Lanes 1–2 (spec completeness + bug scan) plus the synthesis lane — 6 agents instead of 8. Lane 3 (historical context & prior feedback) adds negligible value on a fix diff since the history hasn't meaningfully changed. This cuts re-review time without losing quality on the things that matter: "did we actually fix it?" and "did the fix introduce new bugs?"

If issues persist after 3 passes, escalate to the human for a decision rather than looping indefinitely.

### Step 5: Validate build

```bash
# TypeScript check (no emit)
npx tsc --noEmit

# Production build
npm run build
```

Both must pass before a batch is considered done.

### Step 6: Validate visually (when applicable)

- Screenshot key pages affected by the batch
- Check: layout, dark mode, empty states, touch targets, safe areas
- If screenshots show real issues, the batch is not done

### Step 7: Commit review fixes

Fix commits use: `fix(<scope>): resolve Batch N review findings`

### Step 8: Push

Push the batch to the feature branch.

---

## Override Protocol

This workflow is designed to be followed consistently. However, situations arise where strict adherence to a default rule produces worse outcomes than adapting. When that happens, the agent may deviate — but **deviations must be visible, not silent.**

### When you deviate from the workflow

If you skip a step, combine steps, or do something differently than described above, you MUST:

1. **Note the deviation** in the batch spec, commit message, or plan.md
2. **State which rule you're overriding** and why
3. **Tag it:** `[OVERRIDE: <rule-name> — <reason>]`

Examples:
- `[OVERRIDE: combined batches 10+11 — identical mechanical pattern, single find-replace across both]`
- `[OVERRIDE: skipped visual validation — batch is backend-only, no UI changes]`
- `[OVERRIDE: ran 6-agent re-review on initial review — fix commit from prior batch, not new code]`

### What this enables

- The human can grep for `[OVERRIDE` across plan.md and commit history to see every deviation
- Good judgment calls become visible and can be promoted into workflow defaults
- Bad judgment calls are caught and corrected, rather than silently compounding
- The workflow evolves based on real data, not assumptions

### What is never overridable

Some rules are **invariants** — they exist because violating them causes data loss, workflow corruption, or compounding errors. These cannot be overridden:

1. **Push after every commit** — unpushed work is unrecoverable if a session dies
2. **Write a batch spec before coding** — coding without a spec produces drift
3. **Run the code review after every batch** — the review is part of the definition of done
4. **Update Session Handoff before exiting** — the next session depends on this
5. **Update the progress table** — this is the durable state machine
6. **Never block on human input during autonomous execution** — make the call, document it, move on

Everything else in this workflow is a **default** — follow it unless you have a specific reason not to, and document the override when you don't.

---

## Phase 3: Documentation Sync (after each phase)

After completing a phase (group of related batches), sync all project documentation.

### The Six North Star Documents

Every product needs a small set of living documents that define what the product is, how it works, how it makes money, and how it's built. These six documents serve that purpose. They are the **institutional memory** of the project — the shared context that keeps every session, every contributor, and every AI agent aligned with the same reality.

These are not throwaway specs. They are not "nice to have." They are the difference between an AI that builds the right thing and an AI that builds something plausible but wrong. When a new session starts, Claude reads these to understand the full context. When a human onboards, they read these to get up to speed. **If these docs are stale, every subsequent decision is made on bad information.**

They are also **living documents** — they evolve as the product evolves. A feature ships and the feature list gets updated. A pricing model changes and the operating model gets revised. A new screen is added and the screen flows grow. The documents are never "done" because the product is never done.

---

#### 1. `docs/masterplan.md` — Business Plan, Vision & Value Proposition

**Scope:** This is the foundational "why" document. It defines the problem being solved, who it's being solved for, and why this solution wins.

**What it contains:**
- **Problem statement** — What pain exists in the market? Who feels it?
- **Value proposition** — What does this product offer that alternatives don't? Why would someone choose it?
- **Target users** — Who are the primary personas? What are their goals, frustrations, and decision criteria?
- **Business model** — How does the product generate revenue? What's the core transaction?
- **Competitive positioning** — What exists today? Where does this product sit in the landscape?
- **Growth strategy** — What are the primary acquisition channels? What creates organic growth? What are the flywheels?
- **Long-term vision** — Where is this headed at 1 year, 3 years, at scale?

**What it answers for Claude:**
- What problem does this code solve?
- Who are we building for, and what do they care about?
- When two implementation paths are equally valid, which one aligns better with the business model?
- What language and tone should the product use?

**When to update:** When the target market shifts, when the value proposition is refined based on user feedback, when new growth channels are validated, when competitive dynamics change.

**What NOT to change casually:** The core vision and mission should be stable across many phases. If you're rewriting the vision every sprint, the problem is upstream of the document.

**Benefit:** Without this document, Claude builds features in a vacuum. With it, Claude understands the business context behind every screen, every flow, every metric — and makes better trade-off decisions as a result.

---

#### 2. `docs/operating-model.md` — Revenue Model, Unit Economics & Operational Thresholds

**Scope:** This is the quantitative backbone of the business. Where the masterplan says "we make money by X," the operating model says "here's exactly how the math works."

**What it contains:**
- **Revenue model** — How money flows in. Subscription tiers, transaction fees, usage-based pricing, add-on revenue, or whatever the model is. Specific numbers, not hand-waving.
- **Cost structure** — What are the major cost drivers? Cost per user, cost per transaction, infrastructure costs, fulfillment costs, support costs.
- **Unit economics** — Revenue per unit minus cost per unit. What does profitable look like at the individual customer/transaction level?
- **Margin structure** — Gross margins, contribution margins, and what levers move them. Where does margin expand at scale?
- **Success metric thresholds** — The specific numbers that define healthy vs. unhealthy. Churn rate targets, retention benchmarks, conversion rate floors, engagement thresholds. These are the numbers that dashboards and alerts should be built against.
- **Risk triggers** — What conditions require intervention? What metric breaches trigger a review, a pause, or a rollback?
- **Operational rules** — Payment retry logic, dunning cascades, suspension policies, escalation procedures. The "if X then Y" rules that govern how the system behaves under stress.

**What it answers for Claude:**
- What thresholds should a health dashboard use for green/yellow/red indicators?
- When building a risk alert, what number constitutes "at risk"?
- When implementing billing logic, what are the retry windows and grace periods?
- When building admin tools, what metrics do operators need to see?

**When to update:** When pricing changes, when new metrics are added to dashboards, when threshold values are tuned based on real-world data, when the cost structure shifts.

**Benefit:** This document is the bridge between business strategy and code. Every gauge, alert, threshold, and financial calculation in the product should trace back to a specific number in this document. Without it, developers invent thresholds or hardcode assumptions that may not match the business reality.

---

#### 3. `docs/screen-flows.md` — Application Structure & Screen Specifications

**Scope:** This is the visual source of truth. It describes every screen in the application — what it contains, how it's laid out, what components it uses, and how users navigate between screens.

**What it contains:**
- **Screen inventory** — Every screen/page in the application, organized by user role or functional area
- **Layout specifications** — Header structure, content sections, footer/action bars, spacing, and hierarchy for each screen
- **Component usage** — Which shared components (cards, lists, forms, modals, drawers) each screen uses and how
- **Navigation behavior** — Where the back button goes, what tapping an item opens, how drill-downs work
- **Empty states** — What each screen shows when there's no data (icon, message, call to action)
- **Loading states** — Skeleton patterns and loading indicators per screen
- **User flows** — Multi-screen sequences (onboarding, checkout, setup wizards) described step by step

**What it answers for Claude:**
- When building a new screen, what pattern should it follow?
- When modifying an existing screen, what's the intended layout?
- What does the empty state look like for this view?
- How does this screen connect to the screens before and after it?

**When to update:** When screens are added, renamed, removed, or restructured. When navigation patterns change. When new shared components are introduced that affect multiple screens.

**Size note:** This file will grow large as the product grows. That's expected — it's the single place to understand the full UI. Don't split it prematurely; a large, searchable file is better than scattered fragments.

**Benefit:** Without this document, every new screen is a guess. With it, Claude can build screens that are consistent with the rest of the application — same patterns, same components, same navigation conventions — without having to reverse-engineer the intent from existing code.

---

#### 4. `docs/app-flow-pages-and-roles.md` — Routes, Pages & Access Control

**Scope:** This is the structural map of the application. It defines every URL, which page it renders, who can access it, and how users move through the product.

**What it contains:**
- **Route tree** — Every URL path in the application, organized hierarchically
- **Page inventory** — A count and list of all pages, broken down by user role or section
- **Role gates** — Which user roles can access which routes (authentication and authorization rules)
- **User journeys** — The primary paths users take through the product, described as numbered steps with specific route paths (e.g., "1. User lands on `/dashboard`, 2. Taps a job card to open `/jobs/:id`")
- **Navigation hierarchy** — Parent/child relationships between pages, breadcrumb structures, tab groups

**What it answers for Claude:**
- Where should a new page live in the route tree?
- What role gate should protect this route?
- When linking from page A to page B, what's the correct path?
- How many pages does each user role have access to?

**When to update:** When routes are added, renamed, or removed. When role gates change. When user journeys are modified. **Route drift is one of the most common doc-staleness problems** — a route gets renamed in code but the doc still shows the old path. This causes broken links in documentation and incorrect navigation assumptions.

**Benefit:** This document prevents Claude from creating orphan pages, using wrong route paths, or building navigation that doesn't match the actual application structure. It's also the fastest way to understand the scope and shape of the product — "143 pages across 3 roles" tells you immediately what you're working with.

---

#### 5. `docs/feature-list.md` — Feature Inventory & Delivery Status

**Scope:** This is the product's capability ledger. Every feature the product has (or will have), numbered, categorized, and status-tracked.

**What it contains:**
- **Numbered feature list** — Every feature, from #1 to #N, with a short description
- **Status labels** — Each feature marked as DONE, IN PROGRESS, PLANNED, or DEFERRED
- **Strategic tags** — Features tagged by business category (e.g., "growth-driver", "retention", "trust-builder", "margin-lever") to show how features connect to business goals
- **Grouping by area** — Features organized into logical sections (billing, onboarding, analytics, etc.)

**What it answers for Claude:**
- Has this feature already been built?
- What's the total feature count and how much is complete?
- Which features support which business goals?
- What's still planned vs. what's been deferred and why?

**When to update:** After every batch — mark newly shipped features as DONE, add any new features that were discovered during implementation, update status labels for anything that moved. This is the simplest doc to keep current and the easiest to let slip.

**Benefit:** This document is the definitive answer to "what does this product do?" It prevents duplicate work (building something that already exists), keeps the team honest about delivery status, and connects every feature back to a business reason. When a stakeholder asks "do we have X?", the answer is in this file.

---

#### 6. `docs/design-guidelines.md` — Design System, Patterns & Standards

**Scope:** This is the visual and interaction rulebook. It defines how the product looks and feels at the component level, ensuring consistency across every screen regardless of who or what builds it.

**What it contains:**
- **Color system** — Named color tokens (primary, accent, success, warning, destructive, muted), their values, and usage rules. How colors are applied in light mode and dark mode.
- **Typography scale** — Font families, size scale (headings, body, captions), weight usage, and line height conventions
- **Spacing system** — Padding and margin conventions, page-level spacing, card spacing, section gaps
- **Component specifications** — Standard dimensions and styles for buttons (heights, border radius, variants), inputs, cards, badges, modals, drawers, and other shared components
- **Icon system** — Which icon library is used, standard sizes, and usage conventions
- **Animation patterns** — Entry animations, transitions, loading patterns
- **Platform-specific rules** — Mobile vs. desktop conventions, safe area handling, touch target minimums, responsive breakpoints
- **Accessibility standards** — Minimum touch target sizes, ARIA label requirements, keyboard navigation patterns, color contrast rules

**What it answers for Claude:**
- What color token should this element use?
- How tall should a button be?
- What border radius do cards use?
- What's the minimum touch target size?
- How should this component animate in?

**When to update:** When new design patterns are introduced (new component types, new indicator styles), when token values change, when new component variants are added, when platform conventions evolve.

**Benefit:** This document is the difference between a product that feels cohesive and one that feels stitched together. Every screen Claude builds will use the right colors, the right spacing, the right component styles — not because Claude memorized the CSS, but because the rules are written down in one place.

---

### How the six documents work together

```
masterplan.md            → WHY we're building    (vision, value prop, business model)
operating-model.md       → HOW the business runs (revenue, costs, thresholds, rules)
screen-flows.md          → WHAT each screen is   (layouts, components, states)
app-flow-pages-roles.md  → WHERE users go        (routes, journeys, access control)
feature-list.md          → WHAT exists today      (inventory, status, progress)
design-guidelines.md     → HOW it looks and feels (design system, patterns, standards)
```

Together, these six documents form a complete context layer:
- The **masterplan** tells you what to build and why
- The **operating model** tells you what the numbers should be
- The **screen flows** tell you what each screen should contain
- The **app flow** tells you how screens connect and who can access them
- The **feature list** tells you what's done and what's left
- The **design guidelines** tell you how everything should look

Claude reads all six at the start of every session. This is **mandatory** — no exceptions. Together they provide full product context without needing to read every source file. When they're current, Claude makes informed decisions about where to put new code, what patterns to follow, and what the business expects. When they're stale, Claude makes decisions based on outdated assumptions — and stale assumptions compound silently across batches until the product drifts far from intent.

### Context reading cadence (summary)

| What to read | When |
|---|---|
| All 6 north star documents | Start of every session |
| `docs/working/prd.md` | Start of each phase (first batch of a new phase) |
| `docs/working/plan.md` | Start of each batch (re-anchor step) |

### Living document rules

1. **These docs are never "finished"** — they grow and evolve with the product. A feature list with 50 items today may have 200 in a year. That's success, not bloat.
2. **Update after every phase, not every batch** — batch-level updates create too much churn and interrupt flow. Phase-level syncs keep them current without constant maintenance overhead.
3. **Additions are easy, deletions are careful** — adding a new feature to the list or a new screen to the flows is routine. Removing or rewriting strategy sections, economic thresholds, or design tokens should be deliberate and discussed.
4. **The code is the truth, the docs are the map** — if the code and docs disagree, investigate which one is wrong before changing either. Sometimes the code drifted; sometimes the doc was aspirational. Both happen.
5. **New projects start with 2, grow to 6** — begin with `masterplan.md` (what are we building?) and `design-guidelines.md` (how should it look?). Add the others as the product reaches the complexity where they're needed. A 3-page app doesn't need a route tree doc; a 50-page app does.
6. **Consistency across docs matters** — if the masterplan says the product has 3 user roles, the app-flow doc should show 3 role sections, the feature list should tag features by those roles, and the screen flows should organize screens by those roles. Cross-document consistency is what makes the system trustworthy.

### What to check during sync

- **Completion status** — Are roadmap/batch tables in the masterplan and feature list current?
- **Page names and routes** — Did any page names or URL paths drift from what's documented in the app flow?
- **New components and modules** — Are newly created files, hooks, or components referenced where appropriate?
- **Feature status labels** — Are features marked DONE that were just shipped? Are any still marked PLANNED that have been built?
- **Strategy alignment** — Do strategy sections in the masterplan still describe features as they were actually built, or has the implementation diverged?
- **Design patterns** — Were new patterns introduced that should be added to the design guidelines?
- **Economic thresholds** — Do metrics, gauges, and alerts in the code match the thresholds defined in the operating model?
- **User journeys** — Do journey descriptions use the actual route paths from the code, not outdated paths from an earlier version?
- **Cross-document consistency** — Does a role/feature/page mentioned in one doc appear correctly in all the others?

### How to sync

Use subagents to parallelize the review across multiple documents. For each doc, the agent reads the current file, compares it against the code changes from the completed phase, and reports what's stale and what it should say. Then make the edits, commit, and push.

---

## Phase 4: Phase Transition

After a phase is complete and docs are synced:

1. **Reconcile** — Update `docs/working/plan.md` to mark the phase complete
2. **Consolidation check** — Before starting the next phase, scan for cleanup opportunities created by the batches just completed:
   - **Duplicated patterns** — Did multiple batches introduce similar components, hooks, or utilities that should be consolidated into one shared abstraction?
   - **Dead code** — Did any batch supersede or replace earlier work, leaving unused code behind?
   - **Overgrown files** — Did any file grow significantly across batches and now needs to be split?
   - **Deferred items** — Review the deferred list accumulated during the phase. Are any quick cleanup tasks (< 15 min) worth folding in now before they compound?

   If cleanup is needed, create a lightweight cleanup batch (no new features — only consolidation, deletion, and extraction). This batch follows the same spec → implement → review → push cycle. Commit as: `refactor(<scope>): consolidate after phase N`.

   If the codebase is clean, skip this and note "No consolidation needed" in the plan.
3. **Start a fresh session** — Phase transitions are natural context seams. Start a new session before beginning the next phase. The re-anchor step makes this cheap (~2-5K tokens to read plan.md).
4. **Restate the plan** — Summarize what's done and what's next
5. **Start the next phase** — Return to Phase 2, Step 1

---

## Phase 5: Plan Completion & Archive

When all phases in the plan are done:

1. **Final recap** — Review the entire plan against what was actually built
2. **Recommendations** — Surface any deferred items, tech debt, or follow-up work
3. **Final doc sync** — One last pass across all docs
4. **Archive** — Move the working folder contents to a uniquely-named archive folder:
   ```
   docs/archive/
   └── [kebab-case-prd-name]-[YYYY-MM-DD]/
       ├── prd.md
       ├── plan.md
       └── batch-specs/
   ```
   The folder name combines the PRD's short name (kebab-case) with the completion date. Examples:
   - `docs/archive/design-guidelines-conformance-2026-03-25/`
   - `docs/archive/push-notifications-2026-04-02/`
   - `docs/archive/provider-scheduling-2026-04-10/`
5. **Clean the working folder** — `docs/working/` should now be empty and ready for the next PRD. Remove `prd.md`, `plan.md`, and all files in `batch-specs/`.

---

## Phase 6: Next Feature (Manual or Scheduled)

Human brings the next PRD. Return to Phase 1.

**For automated scheduled execution**, Claude Code can pick up the next PRD from a queue folder. See "Scheduled Task Automation" below.

---

## Phase 7: Autoresearch (Optional, Between Rounds)

After a round of PRDs is complete, optionally run an analysis pass to find the next highest-impact work.

**Method:** Systematically evaluate the product against quality rubrics — UX friction scoring, performance audits, design guidelines conformance checks, accessibility audits, or business model gap analysis.

**Output:** New PRD files added to `docs/upcoming/`, numbered and ready for the scheduled task loop to pick up.

This phase feeds the continuous improvement loop: build → measure → analyze → generate PRDs → build again.

---

## Scheduled Task Automation

This workflow is designed to run autonomously via Claude Code Scheduled Tasks, executing batches continuously across sessions — potentially overnight or over multiple days.

### How it works

A scheduled task runs on a cron schedule (e.g., hourly). Each session:
1. Reads `docs/working/plan.md` to find the current state
2. Continues from the first incomplete (`⬜`) batch
3. Completes up to N batches (configurable)
4. Updates `plan.md` before exiting so the next session can resume

### Session handoff protocol

Every session MUST update the `## Session Handoff` section of `plan.md` before exiting:

```markdown
## Session Handoff
- **Last completed:** Batch N
- **Next up:** Batch N+1 — [title] (or "None — plan complete")
- **Blockers:** None (or describe)
- **PRD queue:** N files remaining in docs/upcoming/
```

A new session reads this section first (just the first ~10 lines) to know exactly where to resume, without needing to parse the full plan.

### PRD queue (`docs/upcoming/`)

For multi-PRD automation, place numbered PRD files in a queue folder:

```
docs/upcoming/
├── 001-push-notifications.md
├── 002-provider-scheduling.md
└── 003-analytics-dashboard.md
```

When a plan completes (all batches `✅`):
1. Archive `docs/working/` to `docs/archive/[feature-name]-[date]/`
2. Move the lowest-numbered PRD from `docs/upcoming/` to `docs/working/prd.md`
3. Decompose it into a new `plan.md`
4. Begin batch execution

### Scheduled task prompt template

```
Read docs/working/plan.md. Check the Session Handoff section first.

If all batches are ✅:
  - Check docs/upcoming/ for the next PRD (lowest number)
  - If found: archive docs/working/, move PRD to docs/working/prd.md,
    decompose into plan.md, begin batch execution
  - If empty: exit — nothing to do

If batches remain ⬜:
  - Continue from the first incomplete batch
  - Complete up to 4 batches this session
  - Follow the full workflow: spec → implement → commit → review → fix → push

Before exiting: update the Session Handoff section of plan.md.
```

### Batch cap per session

Cap at **3–4 batches per session** to stay within context limits. This is a guideline, not a hard rule — small batches (verification-only, mechanical sweeps) can be grouped, while complex batches may take a full session each.

### Combined batches

When consecutive batches follow an identical pattern (e.g., "remove max-w-lg from all customer pages" across Batches 16-18), they can be combined into a single implementation + single review cycle. The plan should note this possibility:

```markdown
### Batches 16-18: Customer Pages Sweep (combinable)
**Pattern:** Same mechanical fix across all customer page files
**Can combine:** Yes — single find-replace + single review
```

### Session resilience rules

1. **Push after every commit** — don't accumulate unpushed work. If a session dies with unpushed changes, they may be unrecoverable. The pattern is always: implement → commit → push → review → fix → commit → push.
2. **Start a fresh session at every phase boundary** — phase transitions are natural context seams. A fresh session starts clean with the full context budget, reads `plan.md` to re-anchor, and enters the new phase without carrying stale context from the previous one.
3. **All review lanes run as sub-agents** — review findings stay in sub-agent context windows, only the final scored report enters the main context. This keeps each batch to ~8-10K tokens in the main window, allowing 20+ batches per session when needed.
4. **Use `🟡` for partial progress** — if a session must stop mid-batch, mark it `🟡 4/7 files done, pushed` in the progress table with a note. The next session reads this and continues from exactly where work stopped.
5. **Never block on human input during autonomous execution** — if something is ambiguous, make the best judgment call based on the batch spec, commit with a note explaining the decision, and flag it for human review in `plan.md`.

### Failure recovery

If a session fails mid-batch (context limit, network error, build failure):
- The Session Handoff section tells the next session exactly where things stopped
- Git commits + pushes provide incremental checkpoints (every commit is pushed)
- `🟡` status in the progress table shows exactly what was completed
- Uncommitted work is lost, but batch specs make reimplementation straightforward
- The next session reads the handoff, sees the incomplete batch, and picks up from the spec

---

## Quick Reference: Batch Checklist

```
[ ] Re-anchor to plan (read Session Handoff section first)
[ ] Write batch spec
[ ] Implement spec (nothing more)
[ ] Commit and push
[ ] Code review via sub-agents (8 agents — same every batch)
[ ] Fix findings until clean (max 3 passes)
[ ] Validate build (tsc + build)
[ ] Validate visually (screenshots, if UI work)
[ ] Push fixes
[ ] Update Session Handoff in plan.md
[ ] (If last batch in phase) Consolidation check → fresh session → sync docs
```

## Quick Reference: Review Scoring

| Score | Category | Action |
|-------|----------|--------|
| 75–100 | MUST-FIX | Fix before proceeding |
| 25–74 | SHOULD-FIX | Fix in same batch |
| 0–24 | DROP | Log or ignore |

## Quick Reference: Commit Messages

```
feat(<scope>): Batch N — Description                # New features
fix(<scope>): resolve Batch N review findings       # Review fixes
refactor(<scope>): consolidate after phase N        # Phase-transition cleanup
docs: sync documentation after phase N              # Doc sync
```

## Quick Reference: Directory Structure

```
docs/
  masterplan.md
  operating-model.md
  screen-flows.md
  design-guidelines.md
  app-flow-pages-and-roles.md
  feature-list.md
  skills/
    prd-to-production-workflow.md    # This file
  upcoming/                          # PRDs queued for future work (numbered: 001-xxx.md)
  working/                           # Active PRD, plan, and batch specs
  archive/                           # Completed PRDs with specs and plans
```

## Quick Reference: PRD Lifecycle

```
docs/upcoming/001-feature.md          # 1. PRD starts in queue
        ↓
docs/working/prd.md                   # 2. Moved to working when active
docs/working/plan.md                  # 3. Plan created, batches executed
docs/working/batch-specs/             # 4. Specs written per batch
        ↓
docs/archive/feature-2026-03-25/      # 5. Archived on completion
  ├── prd.md
  ├── plan.md
  └── batch-specs/
docs/working/                         # 6. Working folder cleaned, ready for next PRD
```

## Adapting to Other Projects

This workflow is project-agnostic. To use it on a new project:

1. **Create your core docs** — Start with `CLAUDE.md` (project instructions) and `docs/masterplan.md` (what you're building and why). Add others as the project grows.
2. **Adjust review lanes** — The 5 review lanes work for most projects. Lane 1 (spec completeness) is the most important — it prevents incomplete work from shipping as "done." If your project has specific concerns (security, performance, i18n), swap a lane or add one.
3. **Adjust batch size** — For greenfield projects, batches can be larger. For mature codebases, keep them smaller.
4. **Skip visual validation** if you're building a CLI, API, or backend system. Replace with integration test validation.
5. **Speed mode for early stages** — When the product is pre-PMF, default to speed mode. Switch to quality mode when the product is being used by real users.
6. **The working folder structure is the constant** — PRD + Plan + Batch Specs, always in one place, always referenced.
