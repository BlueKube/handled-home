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
2. **Decompose into phases** — each phase is a logical group of related work.
3. **Decompose phases into batches** — each batch is 1 theme across 1–3 screens or files.
4. **Write the plan** as a structured markdown document:
   - Phase list with batch breakdown
   - Dependency order
   - Estimated size per batch (Small / Medium / Large)
   - Whether consecutive batches are combinable
   - Risk areas and deferred items
   - A **Session Handoff** section at the top
   - A **Progress Table** with batch status
5. **Create the working folder:**
   ```
   docs/working/
   ├── prd.md
   ├── plan.md
   └── batch-specs/
   ```
6. **Get human approval** on the plan before any coding begins.

---

## Phase 2: Batch Execution (repeat for each batch)

### Step 1: Re-anchor to the plan

Before starting any batch:
- **Read `docs/working/plan.md`** — re-read the full plan to stay aligned
- State which phase and batch you're working on
- State what's already complete and what remains

At the **start of each phase**:
- **Read `docs/working/prd.md`** — re-read the full PRD to re-ground in original requirements

### Step 2: Write the batch spec

Every batch gets a spec in `docs/working/batch-specs/` before coding starts.

### Step 3: Implement the spec

- Code only what the spec says.
- Commit with clear messages: `feat(<scope>): Batch N — {Description}`

### Step 4: Eight-agent code review

#### Architecture: 3 parallel lanes + 1 synthesis lane × 2 tiers = 8 agents

**Stage 1 — Parallel analysis (6 agents):** Launch Lanes 1–3 in parallel, each with Sonnet (deep) and Haiku (fast) tier.

| Lane | What it checks |
|------|----------------|
| 1. Spec completeness audit | Does the implementation satisfy every requirement? |
| 2. Bug scan (diff only) | Bugs visible in the diff alone |
| 3. Historical context & prior feedback | git blame / git log on changed files |

**Stage 2 — Synthesis (2 agents):** After Lanes 1–3 return, launch Lane 4.

| Lane | What it checks |
|------|----------------|
| 4. Synthesis & cross-check | Cross-validate, de-duplicate, score findings |

#### Scoring

- **Cross-tier agreement**: +30 confidence
- **Cross-lane agreement**: +20 per additional lane
- **Severity of impact**: +20–40
- **Specificity**: +10
- **Style-only**: cap at 20

#### Thresholds

- **75–100 (MUST-FIX):** Fix before proceeding
- **25–74 (SHOULD-FIX):** Fix in same batch when feasible
- **0–24 (DROP):** Log or ignore

#### Fix loop

Fix findings → re-commit → lightweight re-review → repeat until clean. Maximum 3 passes.

### Step 5: Validate build

```bash
npx tsc --noEmit
npm run build
```

Both must pass before a batch is considered done.

### Step 6: Validate visually (when applicable)

### Step 7: Commit review fixes

Fix commits use: `fix(<scope>): resolve Batch N review findings`

### Step 8: Push

Push the batch to the feature branch.

### Step 9: Log suggestions (optional)

Append to `docs/suggestions.md` if anything stood out.

---

## Override Protocol

If you skip a step, combine steps, or do something differently:
1. Note the deviation
2. State which rule you're overriding and why
3. Tag it: `[OVERRIDE: <rule-name> — <reason>]`

### Invariants (never overridable)

1. Push after every commit
2. Write a batch spec before coding
3. Run the code review after every batch
4. Update Session Handoff before exiting
5. Update the progress table
6. Never block on human input during autonomous execution

---

## Phase 3: Documentation Sync (after each phase)

Sync all 6 north star documents after completing a phase.

### The Six North Star Documents

1. `docs/masterplan.md` — Business Plan, Vision & Value Proposition
2. `docs/operating-model.md` — Revenue Model, Unit Economics & Operational Thresholds
3. `docs/screen-flows.md` — Application Structure & Screen Specifications
4. `docs/app-flow-pages-and-roles.md` — Routes, Pages & Access Control
5. `docs/feature-list.md` — Feature Inventory & Delivery Status
6. `docs/design-guidelines.md` — Design System, Patterns & Standards

Together these form a complete context layer:
```
masterplan.md            → WHY we're building
operating-model.md       → HOW the business runs
screen-flows.md          → WHAT each screen is
app-flow-pages-roles.md  → WHERE users go
feature-list.md          → WHAT exists today
design-guidelines.md     → HOW it looks and feels
```

Claude reads all six at the start of every session. This is mandatory.

### Context reading cadence

| What to read | When |
|---|---|
| All 6 north star documents | Start of every session |
| `docs/working/prd.md` | Start of each phase |
| `docs/working/plan.md` | Start of each batch |

### Living document rules

1. These docs are never "finished"
2. Update after every phase, not every batch
3. Additions are easy, deletions are careful
4. The code is the truth, the docs are the map
5. New projects start with 2, grow to 6
6. Consistency across docs matters

---

## Phase 4: Phase Transition

1. **Reconcile** — Update plan.md to mark the phase complete
2. **Consolidation check** — Scan for duplicated patterns, dead code, overgrown files, deferred items
3. **Start a fresh session**
4. **Restate the plan**
5. **Start the next phase**

---

## Phase 5: Plan Completion & Archive

1. Final recap
2. Recommendations
3. Suggestion round
4. Final doc sync
5. Archive to `docs/archive/[kebab-case-prd-name]-[YYYY-MM-DD]/`
6. Clean the working folder

---

## Phase 6: Next Feature (Manual or Scheduled)

Human brings the next PRD. Return to Phase 1.

---

## Phase 7: Autoresearch (Optional, Between Rounds)

Review `docs/suggestions.md`, promote strongest to PRDs, look for additional opportunities.

---

## Scheduled Task Automation

### How it works

A scheduled task runs on a cron schedule. Each session:
1. Reads `docs/working/plan.md`
2. Continues from the first incomplete batch
3. Completes up to N batches
4. Updates `plan.md` before exiting

### Session handoff protocol

Every session MUST update the `## Session Handoff` section of `plan.md` before exiting.

### PRD queue (`docs/upcoming/`)

When a plan completes:
1. Archive `docs/working/`
2. Move lowest-numbered PRD from `docs/upcoming/` to `docs/working/prd.md`
3. Decompose into new `plan.md`
4. Begin batch execution

### Batch cap per session

Cap at 3–4 batches per session.

### Session resilience rules

1. Push after every commit
2. Start a fresh session at every phase boundary
3. All review lanes run as sub-agents
4. Use 🟡 for partial progress
5. Never block on human input during autonomous execution

---

## Quick Reference: Batch Checklist

```
[ ] Re-anchor to plan
[ ] Write batch spec
[ ] Implement spec
[ ] Commit and push
[ ] Code review via sub-agents (8 agents)
[ ] Fix findings until clean (max 3 passes)
[ ] Validate build (tsc + build)
[ ] Validate visually (if UI work)
[ ] Push fixes
[ ] Log suggestions
[ ] Update Session Handoff
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
feat(<scope>): Batch N — Description
fix(<scope>): resolve Batch N review findings
refactor(<scope>): consolidate after phase N
docs: sync documentation after phase N
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
  suggestions.md
  skills/
    prd-to-production-workflow.md
  upcoming/
  working/
  archive/
```

## Quick Reference: PRD Lifecycle

```
docs/upcoming/001-feature.md          # 1. PRD starts in queue
        ↓
docs/working/prd.md                   # 2. Moved to working when active
docs/working/plan.md                  # 3. Plan created, batches executed
docs/working/batch-specs/             # 4. Specs written per batch
        ↓
docs/archive/feature-YYYY-MM-DD/      # 5. Archived on completion
docs/working/                         # 6. Working folder cleaned
```

## Adapting to Other Projects

1. Create your core docs
2. Adjust review lanes
3. Adjust batch size
4. Skip visual validation for non-UI projects
5. Speed mode for early stages
6. The working folder structure is the constant
