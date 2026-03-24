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

After each commit, run a multi-agent review. Launch **10 agents in parallel** across 5 review lanes, each with 2 tiers:

| Lane | What it checks |
|------|----------------|
| 1. Project rules compliance | Does the diff follow CLAUDE.md / project conventions? |
| 2. Bug scan (diff only) | Bugs visible in the diff alone, no extra context |
| 3. Historical context | git blame / history — did we break something that was intentional? |
| 4. Prior feedback | Have these files had PR feedback before? Are we repeating mistakes? |
| 5. Code comment compliance | Do comments match what the code does? Stale comments? |

**Each lane gets:**
- One deep-analysis agent (thorough review)
- One fast second-opinion agent (quick sanity check)

**Scoring:** Merge findings from both tiers per lane. Score each finding 0–100 for confidence:
- **75+ (MUST-FIX):** Bugs, regressions, security issues, accessibility violations — fix before proceeding
- **25–74 (SHOULD-FIX):** Inconsistencies, missing polish, non-critical issues — fix in same batch when feasible
- **<25 (DROP):** Style preferences, suggestions — log or ignore

**Fix loop:** Fix findings → re-commit → re-review → repeat until clean (max 3 passes).

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

### Documents to review

Every project should maintain these core docs (adapt names to your project):

| Doc | Purpose |
|-----|---------|
| `CLAUDE.md` | Project instructions, completion status, conventions |
| `docs/masterplan.md` | Business model, vision, product strategy |
| `docs/operating-model.md` | Unit economics, pricing, margin levers |
| `docs/screen-flows.md` | Screen layouts, flows, component specs |
| `docs/app-flow-pages-and-roles.md` | Route tree, page names, role gates |
| `docs/feature-list.md` | Feature inventory with status labels |
| `docs/design-guidelines.md` | Design tokens, component patterns |

### What to check

- **Completion status** — Are roadmap/batch tables current?
- **Page names and routes** — Did any names drift from what's documented?
- **New hooks/components** — Are newly created files listed?
- **Feature status labels** — Are features marked DONE that were just shipped?
- **Strategy sections** — Do they describe features as they were actually built?
- **Design patterns** — Were new patterns introduced that should be documented?

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
