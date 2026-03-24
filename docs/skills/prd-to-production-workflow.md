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
   - Risk areas and deferred items
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
- State which phase and batch you're working on
- State what's already complete and what remains
- Reference `docs/working/plan.md` to stay aligned

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

### Step 4: Ten-agent code review

After each commit, run a multi-agent review. This is the quality gate that prevents bugs, drift, and regressions from compounding across batches.

#### Architecture: 5 lanes × 2 tiers = 10 agents

Launch all 10 agents **in parallel** using the Agent tool. Each lane gets two agents running simultaneously — a deep-analysis tier and a fast second-opinion tier.

| Lane | What it checks | Deep tier | Fast tier |
|------|----------------|-----------|-----------|
| 1. Project rules compliance | Does the diff follow CLAUDE.md / project conventions? | Sonnet | Haiku |
| 2. Bug scan (diff only) | Bugs visible in the diff alone — no extra context, no codebase knowledge | Sonnet | Haiku |
| 3. Historical context | git blame / git log on changed files — did we break something intentional? | Sonnet | Haiku |
| 4. Prior feedback | Have these files had PR review comments before? Are we repeating past mistakes? | Sonnet | Haiku |
| 5. Code comment compliance | Do comments match what the code does? Stale comments? Missing comments on complex logic? | Sonnet | Haiku |

#### Model assignments

- **Sonnet agents (5):** Deep analysis tier. Each gets the full diff + lane-specific context (e.g., git blame output for lane 3, PR comments for lane 4). Sonnet provides thorough, nuanced analysis.
- **Haiku agents (5):** Fast second-opinion tier. Each gets the same diff + lane-specific context. Haiku provides a quick sanity check that catches things the Sonnet agent might frame differently or miss.

The two-tier approach works because different models catch different things. Sonnet tends to find architectural issues and subtle bugs; Haiku tends to catch obvious oversights and pattern violations that Sonnet sometimes rationalizes away.

#### What each agent receives

Every agent gets:
1. **The git diff** — `git diff HEAD~1...HEAD` (or branch diff for phase-level review)
2. **The batch spec** — acceptance criteria and scope from `docs/working/batch-specs/`
3. **Project rules** — relevant sections of CLAUDE.md (design system, conventions, consistency standards)

Additionally, per lane:
- **Lane 1:** Full CLAUDE.md + design-guidelines.md
- **Lane 2:** Diff only, no extra context (forces the agent to find bugs from code alone)
- **Lane 3:** `git blame` and `git log` output for every changed file
- **Lane 4:** PR review comments from previous PRs touching the same files (via `gh api`)
- **Lane 5:** The full content of every changed file (not just the diff), so the agent can check comments against surrounding code

#### Agent prompts

Each agent prompt must include:
- Clear instruction to categorize findings as MUST-FIX / SHOULD-FIX / NICE-TO-HAVE
- File and line number references for every finding
- No access to implementation reasoning — the agent reviews the code on its own merits, as if it were a different developer

Example agent launch (Lane 2, Sonnet tier):
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

#### Merging findings

After all 10 agents return:
1. Collect all findings across all lanes and tiers
2. De-duplicate — if both Sonnet and Haiku in the same lane flag the same issue, that's one finding with higher confidence
3. Score each finding 0–100:
   - **Cross-tier agreement** (both Sonnet and Haiku flagged it): +30 confidence
   - **Cross-lane agreement** (multiple lanes flagged it): +20 per additional lane
   - **Severity of impact** (regression, security, data loss): +20–40
   - **Specificity** (exact file:line with clear explanation): +10
   - **Style-only** (formatting, naming preference): cap at 20

4. Apply thresholds:
   - **75–100 (MUST-FIX):** Bugs, regressions, security issues, accessibility violations — **fix before proceeding**
   - **25–74 (SHOULD-FIX):** Inconsistencies, missing polish, non-critical issues — **fix in same batch when feasible**
   - **0–24 (DROP):** Style preferences, minor suggestions — log or ignore

#### Fix loop

Fix findings → re-commit → re-run review → repeat until clean. **Maximum 3 passes.** If issues persist after 3 passes, escalate to the human for a decision rather than looping indefinitely.

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

Claude reads all six at the start of a session. Together they provide full product context without needing to read every source file. When they're current, Claude makes informed decisions about where to put new code, what patterns to follow, and what the business expects. When they're stale, Claude makes decisions based on outdated assumptions — and stale assumptions compound silently across batches until the product drifts far from intent.

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
2. **Restate the plan** — Summarize what's done and what's next
3. **Start the next phase** — Return to Phase 2, Step 1

---

## Phase 5: Plan Completion & Archive

When all phases in the plan are done:

1. **Final recap** — Review the entire plan against what was actually built
2. **Recommendations** — Surface any deferred items, tech debt, or follow-up work
3. **Final doc sync** — One last pass across all docs
4. **Archive** — Move the working folder contents to an archive:
   ```
   docs/archive/
   └── [feature-name]-[date]/
       ├── prd.md
       ├── plan.md
       └── batch-specs/
   ```
5. **Clean the working folder** — `docs/working/` is now empty and ready for the next PRD

---

## Phase 6: Next Feature

Human brings the next PRD. Return to Phase 1.

---

## Quick Reference: Batch Checklist

```
[ ] Re-anchor to plan
[ ] Write batch spec
[ ] Implement spec (nothing more)
[ ] Commit
[ ] 10-agent code review (5 lanes × 2 tiers)
[ ] Fix findings until clean
[ ] Validate build (tsc + build)
[ ] Validate visually (screenshots)
[ ] Push
[ ] (If last batch in phase) Sync docs
```

## Quick Reference: Review Scoring

| Score | Category | Action |
|-------|----------|--------|
| 75–100 | MUST-FIX | Fix before proceeding |
| 25–74 | SHOULD-FIX | Fix in same batch |
| 0–24 | DROP | Log or ignore |

## Quick Reference: Commit Messages

```
feat(<scope>): Batch N — Description       # New features
fix(<scope>): resolve Batch N review findings  # Review fixes
docs: sync documentation after phase N      # Doc sync
```

## Adapting to Other Projects

This workflow is project-agnostic. To use it on a new project:

1. **Create your core docs** — You don't need all 7 docs from day one. Start with `CLAUDE.md` (project instructions) and `docs/masterplan.md` (what you're building and why). Add others as the project grows.
2. **Adjust review lanes** — The 5 review lanes work for most projects. If your project has specific concerns (security, performance, i18n), swap a lane or add one.
3. **Adjust batch size** — For greenfield projects, batches can be larger. For mature codebases, keep them smaller.
4. **Skip visual validation** if you're building a CLI, API, or backend system. Replace with integration test validation.
5. **The working folder structure is the constant** — PRD + Plan + Batch Specs, always in one place, always referenced.
