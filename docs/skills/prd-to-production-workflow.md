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

Every project should maintain six core documents in a `docs/` folder. These are **living documents** — they evolve as features are built — but they serve as the North Star that prevents drift across phases, sessions, and contributors.

These are not throwaway specs. They are the institutional memory of the project. When a new session starts, Claude reads these to understand the full context. When a human onboards, they read these to get up to speed. **If these docs are stale, every subsequent decision is made on bad information.**

#### 1. `docs/masterplan.md` — Vision & Strategy

**What it contains:** Business model, product vision, target users, competitive positioning, growth strategy, and long-term roadmap. This is the "why" behind everything.

**What it answers:**
- What are we building and for whom?
- What's the business model?
- What are the growth levers?
- What's the product vision at 1 year, 3 years?

**When to update:** When new features change the product strategy, when growth assumptions are validated or invalidated, when the business model evolves.

**What NOT to change:** The core vision and mission should be stable. If you're rewriting the vision every phase, something is wrong upstream.

#### 2. `docs/operating-model.md` — Unit Economics & Thresholds

**What it contains:** Pricing mechanics, margin structure, cost drivers, success metric thresholds, risk triggers, and operational rules. The quantitative backbone of the business.

**What it answers:**
- What does healthy look like in numbers?
- What thresholds trigger action? (e.g., churn > 2%, attach rate < 1.5)
- How does money flow through the system?
- What are the margin levers?

**When to update:** When pricing changes, when new metrics are surfaced in the product, when threshold values are tuned based on real data.

**Why it matters for code:** Every dashboard gauge, risk alert, and business health indicator should trace back to a specific number in this document. If the code shows a threshold that isn't in the operating model, either the code or the doc is wrong.

#### 3. `docs/screen-flows.md` — Screen Layouts & Component Specs

**What it contains:** Every screen in the app — its layout, header structure, key components, navigation behavior, and user flow. The visual source of truth.

**What it answers:**
- What does each screen look like?
- What components does it use?
- Where does the back button go?
- What's the empty state?

**When to update:** When screens are added, renamed, or restructured. When navigation patterns change. When new shared components are introduced.

**Size warning:** This file grows large (50KB+). That's fine — it's the single source of truth for UI. Don't split it unless it becomes genuinely unmanageable.

#### 4. `docs/app-flow-pages-and-roles.md` — Routes, Pages & Access Control

**What it contains:** The complete route tree, page inventory, role gates (which users can access what), and primary user journeys described as step-by-step flows.

**What it answers:**
- What URL maps to what page?
- Which role can access which routes?
- What are the key user journeys (onboarding, purchasing, provider workflow)?
- How many pages does each role have?

**When to update:** When routes are added or renamed, when role gates change, when user journeys are modified. **Route drift is one of the most common doc-staleness problems** — a route gets renamed in code but the doc still shows the old path.

#### 5. `docs/feature-list.md` — Feature Inventory & Status

**What it contains:** Every feature in the product, numbered, with a status label (DONE, IN PROGRESS, PLANNED, DEFERRED) and tagged by strategic category.

**What it answers:**
- What features exist?
- What's their current status?
- How do features map to business strategy?
- What's the total feature count?

**When to update:** After every batch — mark newly shipped features as DONE, add any new features that were discovered during implementation. This is the simplest doc to keep current and the easiest to let slip.

#### 6. `docs/design-guidelines.md` — Design System & Tokens

**What it contains:** Color tokens, typography scale, spacing system, component specs (buttons, cards, inputs, badges), icon system, animation patterns, and platform-specific rules.

**What it answers:**
- What are the design tokens (colors, fonts, spacing)?
- What do standard components look like?
- What are the accessibility requirements?
- What patterns are used for mobile vs. desktop?

**When to update:** When new design patterns are introduced (e.g., gauge indicators, risk alert cards), when token values change, when new component variants are added to the UI library.

### How these docs work together

```
masterplan.md          → WHY we're building (vision, strategy)
operating-model.md     → HOW the business works (economics, thresholds)
screen-flows.md        → WHAT each screen looks like (layouts, components)
app-flow-pages-and-roles.md → WHERE users go (routes, journeys, access)
feature-list.md        → WHAT exists and its status (inventory)
design-guidelines.md   → HOW it looks and feels (design system)
```

Claude reads all six at the start of a session. Together they provide full context without needing to read every source file. When they're current, Claude can make informed decisions about where to put new code, what patterns to follow, and what the business expects. When they're stale, Claude makes decisions based on outdated assumptions.

### Living document rules

1. **These docs are never "finished"** — they grow and evolve with the product
2. **Update after every phase, not every batch** — batch-level updates create too much churn; phase-level keeps them current without constant maintenance
3. **Additions are easy, deletions are careful** — adding a new feature to the list is straightforward; removing or changing strategy sections should be deliberate
4. **The code is the truth, the docs are the map** — if the code and docs disagree, investigate which one is wrong before changing either
5. **New projects start with 2, grow to 6** — begin with `masterplan.md` and `design-guidelines.md`; add the others as the project reaches the point where they're needed

### What to check during sync

- **Completion status** — Are roadmap/batch tables current?
- **Page names and routes** — Did any names drift from what's documented?
- **New hooks/components** — Are newly created files listed?
- **Feature status labels** — Are features marked DONE that were just shipped?
- **Strategy sections** — Do they describe features as they were actually built?
- **Design patterns** — Were new patterns introduced that should be documented?
- **Threshold values** — Do dashboard gauges match operating-model.md thresholds?
- **Route paths** — Do user journey descriptions use the actual route paths from the code?

### How to sync

Use subagents to parallelize the review across multiple documents. For each doc, the agent reports what's stale and what it should say. Then make the edits, commit, and push.

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
