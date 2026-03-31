# Workflow — Implementation Plan to Production

> **Last updated:** 2026-03-31

A portable, repeatable workflow for taking a product idea through phased implementation to completion. Designed for Claude Code + human collaboration on any project.

---

## Overview

This workflow turns a `FULL-IMPLEMENTATION-PLAN.md` into shipped code through small, reviewed, documented batches. It prevents drift, maintains quality, and keeps documentation in sync with reality.

**Key concepts:**

- **Round** — One complete execution of a `FULL-IMPLEMENTATION-PLAN.md`. A top-to-bottom build or refresh of the app. Round 1 builds the foundation. Subsequent rounds polish, harden, add features, and improve. Rounds are large-scope — they run for hours or days.
- **Phase** — A logical group of related work within a round. Each phase is a self-contained PRD (problem, goals, scope, deliverables) defined as a section in the implementation plan.
- **Batch** — A small unit of work within a phase. 1 theme, 1–3 files. Gets a spec, implementation, and review cycle.

**The loop:** Phase → Plan → Batch → Review → Doc Sync → Next Batch → Next Phase → Archive

---

## Step 0: Idea → Implementation Plan

**Owner:** Human

1. Start with an idea — a feature set, redesign, new system, or overhaul.
2. Write a `FULL-IMPLEMENTATION-PLAN.md` covering the full round scope. Break it into **phase sections**, where each phase section is a self-contained PRD with: problem statement, goals, scope, deliverables, and rough batch estimates.
3. The plan does not need to be perfect. Each phase section needs to be specific enough that Claude can decompose it into batches.
4. Place the plan at `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md`.

### Why phases live in one document (not separate PRD files)

The implementation plan already contains the per-phase scoping. Splitting each phase into a separate numbered PRD file (`001-xxx.md`, `002-xxx.md`) creates redundancy — the PRD restates what the implementation plan already defines, then gets restated again in `plan.md`. One document with phase sections eliminates two layers of copy.

### Execution mode

Each phase should declare its execution mode:

- **Quality mode** (default) — Tiered review system (1–5 agents sized to batch risk), full documentation sync. Production-ready.
- **Speed mode** — Reduced 2-agent review (1 combined reviewer + 1 synthesis, no Lane 3). Used for prototypes, validation builds, and low-risk changes. Max 2 fix passes then move on.

---

## Step 1: Decompose Phase into Batches

**Owner:** Claude (with human approval)

1. **Read the current phase section** from `FULL-IMPLEMENTATION-PLAN.md` thoroughly. Ask clarifying questions if anything is ambiguous.
2. **Decompose the phase into batches** — each batch is 1 theme across 1–3 screens or files. Keep them small enough for one focused implementation + one review cycle.
3. **Write the plan** as `docs/working/plan.md`:
   - Batch breakdown for the current phase
   - Dependency order (what must come first)
   - Estimated size per batch (Small / Medium / Large / Micro)
   - Whether consecutive batches are combinable (same mechanical pattern)
   - Risk areas and deferred items
   - A **Session Handoff** section (updated by every session before exit)
   - A **Progress Table** with batch status — this is the durable state machine that enables multi-session execution:
     - `✅` = complete and pushed
     - `🟡` = in progress (partial work pushed — note what's done)
     - `⬜` = not started
     - `❌` = blocked (note reason)
4. **Create the working folder:**
   ```
   docs/working/
   ├── plan.md             # Current phase batches + session handoff
   └── batch-specs/        # Individual batch specs (created as you go)
   ```
5. **Create the feature branch** (if not already on one): `git checkout -b feat/[round-name-kebab]` from main. Record the branch name in the Session Handoff section of `plan.md`. All work for this round happens on this branch.
6. **Get human approval** on the plan before any coding begins.

---

## Step 2: Batch Execution (repeat for each batch)

### 2.1: Re-anchor to the plan

Before starting any batch:
- **Read `docs/working/plan.md`** — re-read the plan to stay aligned with batches, dependencies, and progress
- State which batch you're working on
- State what's already complete and what remains

At the **start of each phase** (i.e., the first batch of a new phase):
- **Read the current phase section from `FULL-IMPLEMENTATION-PLAN.md`** — re-ground in the problem, goals, and scope before entering a new phase of work

### 2.2: Write the batch spec

Every batch gets a spec in `docs/working/batch-specs/` before coding starts:

```markdown
# Batch N: [Title]

## Phase
[Which phase this belongs to]

## Review: Quality
[Quality or Speed — must be declared explicitly]

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

### 2.3: Implement the spec

- Code only what the spec says. If you discover something out of scope, add it to a deferred items list — don't sneak it in.
- Commit with clear messages: `feat(<scope>): Batch N — {Description}`
- **If the batch creates database migrations**, apply them immediately or document them as blocked in `docs/upcoming/TODO.md`. Never leave migrations unapplied — downstream tools (Lovable) will stub all database-dependent code if tables don't exist.
- **If the batch changes UI**, take a screenshot after the commit to verify visually. Use the raw Chromium binary with `--virtual-time-budget=8000` if Playwright CLI fails.
- **If a component exceeds 300 lines** after your changes, extract sections into separate files in the same batch.

### 2.4: Tiered code review

After each commit, run a multi-agent review. This is the quality gate that prevents bugs, drift, and regressions from compounding across batches.

**Review intensity scales with batch risk.** Running 8 agents on a config-only change wastes context; running 2 agents on a new integration misses bugs. Size the review to the batch.

#### Architecture: 3 parallel lanes + 1 synthesis lane (Sonnet-only default)

**Review tiers** — choose based on batch size declared in the plan:

| Batch Size | Agents | Configuration |
|------------|--------|---------------|
| **Large** (new integrations, multi-file refactors) | 5 | 3 parallel Sonnet lanes + 1 Sonnet synthesis + 1 Haiku synthesis |
| **Medium** (typical feature batch) | 4 | 3 parallel Sonnet lanes + 1 Sonnet synthesis |
| **Small** (templates, config, minor changes) | 2 | 1 combined Sonnet reviewer (spec + bugs) + 1 Sonnet synthesis |
| **Micro** (type defs, doc syncs, config-only) | 1 | 1 combined Sonnet reviewer (spec + bugs), no synthesis |

**Stage 1 — Parallel analysis (3 Sonnet agents for Medium/Large):** Launch Lanes 1–3 in parallel.

| Lane | What it checks |
|------|----------------|
| 1. Spec completeness audit | Does the implementation satisfy every requirement, acceptance criterion, and edge case in the batch spec? |
| 2. Bug scan (diff only) | Bugs visible in the diff alone — no extra context, no codebase knowledge |
| 3. Historical context & prior feedback | git blame / git log on changed files — did we break something intentional? Are we repeating past mistakes? |

**Stage 2 — Synthesis (1 Sonnet agent, +1 Haiku for Large only):** After Lanes 1–3 return, launch synthesis with all findings as input.

| Lane | What it checks |
|------|----------------|
| 4. Synthesis & cross-check | Cross-validate findings across lanes, resolve contradictions, catch inter-lane gaps, produce the final scored report |

Lane 4 is the **only agent that sees other agents' output**. It serves as the communication bridge between lanes.

**Lane 3 skip rule:** If the batch is the first in a phase, or there are no prior review findings to reference, Lane 3 may be skipped — reducing the review to 2 parallel lanes + synthesis (3 agents total for Medium batches).

#### Why Sonnet-only is the default (Haiku tier removed)

The original design used Sonnet + Haiku tiers per lane (8 agents total). After running this across Batches 5–10, the Haiku tier was dropped for all but Large batches:

- **Haiku never produced a unique finding that Sonnet missed** across 6 consecutive batches
- The "cross-tier agreement" scoring (+30 confidence) inflated scores without adding real signal
- Dropping Haiku cuts agent count from 8 → 4 with no measurable quality loss

For Large batches, a single Haiku synthesis agent is retained as a fast second opinion on the final scored report.

#### What each agent receives

Every agent gets:
1. **The git diff** — `git diff HEAD~1...HEAD` (or branch diff for phase-level review)
2. **The batch spec** — acceptance criteria and scope from `docs/working/batch-specs/`
3. **Project rules** — relevant sections of CLAUDE.md (design system, conventions, consistency standards)

Additionally, per lane:
- **Lane 1:** The full batch spec — every requirement, acceptance criterion, scope item, and edge case
- **Lane 2:** Diff only, no extra context (forces the agent to find bugs from code alone)
- **Lane 3:** `git blame`, `git log`, and PR review comments for every changed file
- **Lane 4 (synthesis):** All findings from Lanes 1–3, the full diff, and the batch spec

#### Agent prompts

Each agent prompt must include:
- Clear instruction to categorize findings as MUST-FIX / SHOULD-FIX / NICE-TO-HAVE
- File and line number references for every finding
- No access to implementation reasoning — the agent reviews the code on its own merits

#### Merging findings (handled by Lane 4)

The synthesis lane produces the final report. Its job:

1. **De-duplicate** — if multiple lanes flagged the same issue, merge into one finding with higher confidence
2. **Cross-validate** — connect related findings across lanes
3. **Resolve contradictions** — if Lane 3 says "this was intentional per history" but Lane 2 flagged it as a bug, make the call and explain the reasoning
4. **Score each finding 0–100:**
   - **Cross-lane agreement** (multiple lanes flagged it): +25 per additional lane
   - **Severity of impact** (regression, security, data loss): +20–40
   - **Specificity** (exact file:line with clear explanation): +10
   - **Style-only** (formatting, naming preference): cap at 20

5. **Apply thresholds:**
   - **75–100 (MUST-FIX):** Bugs, regressions, security issues, missing spec items — **fix before proceeding**
   - **25–74 (SHOULD-FIX):** Inconsistencies, missing polish, non-critical issues — **fix in same batch when feasible**
   - **0–24 (DROP):** Style preferences, minor suggestions — log or ignore

#### Fix loop

Fix findings → re-commit → **lightweight re-review** → repeat until clean. **Maximum 3 passes.**

**Lightweight re-review (passes 2+):** On fix commits, only run Lanes 1–2 (spec completeness + bug scan) plus the synthesis lane — 3 agents. Lane 3 adds negligible value on a fix diff since the history hasn't meaningfully changed.

If issues persist after 3 passes, escalate to the human for a decision rather than looping indefinitely.

### 2.5: Validate build

```bash
# TypeScript check (no emit)
npx tsc --noEmit

# Production build
npm run build
```

Both must pass before a batch is considered done.

### 2.6: Validate visually (when applicable)

- Screenshot key pages affected by the batch
- Check: layout, dark mode, empty states, touch targets, safe areas
- If screenshots show real issues, the batch is not done

### 2.7: Commit review fixes

Fix commits use: `fix(<scope>): resolve Batch N review findings`

### 2.8: Push

Push the batch to the feature branch.

### 2.9: Log suggestions and agent signals (optional)

Append observations to `lessons-learned.md` (Suggestions section). Two types:

- **Agent Signals** (about the workflow/process): Lane effectiveness, false positive rates, context consumption patterns, spec quality issues, scoring calibration. Include specific numbers.
- **Product Suggestions** (about the product): Feature ideas, UX gaps, optimization opportunities noticed during implementation.

Format: `### YYYY-MM-DD — [Agent Role] (Batch N)` followed by 1-2 sentences per observation.

Keep entries brief. Do not stop work to research suggestions — this is a 30-second append, not a research task. Skip this step if nothing stood out.

### 2.10: Doc sync and cleanup (after each phase completes)

When all batches in a phase are `✅`:

1. **Update `docs/feature-list.md`** — mark all features touched by this phase with current status and maturity rating.
2. **Update `docs/working/plan.md`** — mark all batches `✅` and update the Session Handoff section with the next phase.
3. **Archive batch specs** — move `docs/working/` to `docs/archive/[phase-name]-[YYYY-MM-DD]/`.
4. **Append to `docs/upcoming/TODO.md`** — any human action items discovered during this phase.

When all phases in a round are `✅`, perform the **Round Cleanup** (see CLAUDE.md):
- Archive `docs/working/` to `docs/archive/[name]-[YYYY-MM-DD]/`
- Final doc sync across all north star documents
- Report context level

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

## Step 3: Documentation Sync (after each phase)

After completing a phase (group of related batches), sync all project documentation.

### The Six North Star Documents

Every product needs a small set of living documents that define what the product is, how it works, how it makes money, and how it's built. These six documents serve that purpose. They are the **institutional memory** of the project — the shared context that keeps every session, every contributor, and every AI agent aligned with the same reality.

These are not throwaway specs. They are not "nice to have." They are the difference between an AI that builds the right thing and an AI that builds something plausible but wrong.

They are also **living documents** — they evolve as the product evolves. A feature ships and the feature list gets updated. A pricing model changes and the operating model gets revised. The documents are never "done" because the product is never done.

**Required documents (3):** `masterplan.md`, `feature-list.md`, `screen-flows.md`

**Optional documents (3):** `operating-model.md`, `app-flow-pages-and-roles.md`, `design-guidelines.md`

New projects start with the 3 required documents. Add the optional documents as the project reaches the complexity where they're needed.

---

#### 1. `docs/masterplan.md` — Business Plan, Vision & Value Proposition

**Scope:** This is the foundational "why" document. It defines the problem being solved, who it's being solved for, and why this solution wins.

**What it contains:**
- **Problem statement** — What pain exists in the market? Who feels it?
- **Value proposition** — What does this product offer that alternatives don't?
- **Target users** — Who are the primary personas?
- **Business model** — How does the product generate revenue?
- **Competitive positioning** — What exists today? Where does this product sit?
- **Growth strategy** — Primary acquisition channels and flywheels
- **Long-term vision** — Where is this headed at 1 year, 3 years, at scale?

**What it answers for Claude:**
- What problem does this code solve?
- Who are we building for, and what do they care about?
- When two implementation paths are equally valid, which aligns better with the business model?

**When to update:** When the target market shifts, value proposition is refined, or competitive dynamics change.

---

#### 2. `docs/operating-model.md` — Revenue Model, Unit Economics & Operational Thresholds *(optional)*

**Scope:** The quantitative backbone of the business.

**What it contains:**
- **Revenue model** — How money flows in. Subscription tiers, transaction fees, usage-based pricing.
- **Cost structure** — Major cost drivers per user/transaction.
- **Unit economics** — Revenue per unit minus cost per unit.
- **Success metric thresholds** — Specific numbers for healthy vs. unhealthy (churn, retention, conversion).
- **Risk triggers** — Conditions requiring intervention.
- **Operational rules** — Payment retry logic, dunning cascades, suspension policies.

**What it answers for Claude:**
- What thresholds should a health dashboard use?
- When building billing logic, what are the retry windows and grace periods?
- When building admin tools, what metrics do operators need?

---

#### 3. `docs/screen-flows.md` — Application Structure & Screen Specifications

**Scope:** The visual source of truth.

**What it contains:**
- **Screen inventory** — Every screen/page organized by role or area
- **Layout specifications** — Header, content, footer for each screen
- **Component usage** — Which shared components each screen uses
- **Navigation behavior** — Back button destinations, drill-downs
- **Empty states** — What each screen shows when there's no data
- **Loading states** — Skeleton patterns per screen
- **User flows** — Multi-screen sequences step by step

---

#### 4. `docs/app-flow-pages-and-roles.md` — Routes, Pages & Access Control *(optional)*

**Scope:** The structural map of the application.

**What it contains:**
- **Route tree** — Every URL path, organized hierarchically
- **Page inventory** — Count and list by role/section
- **Role gates** — Which roles access which routes
- **User journeys** — Primary paths with specific route paths
- **Navigation hierarchy** — Parent/child relationships, breadcrumbs

---

#### 5. `docs/feature-list.md` — Feature Inventory & Delivery Status

**Scope:** The product's capability ledger.

**What it contains:**
- **Numbered feature list** — Every feature from #1 to #N
- **Status labels** — DONE, IN PROGRESS, PLANNED, DEFERRED
- **Strategic tags** — Features tagged by business category
- **Grouping by area** — Organized into logical sections

---

#### 6. `docs/design-guidelines.md` — Design System, Patterns & Standards *(optional)*

**Scope:** The visual and interaction rulebook.

**What it contains:**
- **Color system** — Named color tokens, light/dark mode rules
- **Typography scale** — Font families, sizes, weights
- **Spacing system** — Padding/margin conventions
- **Component specifications** — Button heights, border radius, variants
- **Icon system** — Library, sizes, conventions
- **Animation patterns** — Entry animations, transitions
- **Accessibility standards** — Touch targets, ARIA labels, contrast

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

Together, these six documents form a complete context layer. Claude reads all six at the start of every session. When they're current, Claude makes informed decisions. When they're stale, decisions are made on outdated assumptions that compound silently across batches.

### Living document rules

1. **These docs are never "finished"** — they grow and evolve with the product
2. **Update after every phase, not every batch** — batch-level updates create too much churn
3. **Additions are easy, deletions are careful** — removing strategy sections should be deliberate
4. **The code is the truth, the docs are the map** — investigate before changing either
5. **Start with 3, grow to 6** — add optional docs as complexity warrants
6. **Consistency across docs matters** — roles, features, and pages should appear correctly in all docs

### What to check during sync

- **Completion status** — Are roadmap/batch tables current?
- **Page names and routes** — Did any drift from what's documented?
- **New components and modules** — Are newly created files referenced?
- **Feature status labels** — Are shipped features marked DONE?
- **Strategy alignment** — Do strategy sections match what was built?
- **Design patterns** — Were new patterns introduced that need documenting?
- **Economic thresholds** — Do metrics match the operating model?
- **User journeys** — Do journey descriptions use actual route paths?
- **Cross-document consistency** — Does a role/feature/page appear correctly in all docs?

### How to sync

Use subagents to parallelize the review across multiple documents. For each doc, the agent reads the current file, compares it against the code changes from the completed phase, and reports what's stale and what it should say. Then make the edits, commit, and push.

---

## Step 4: Phase Transition

After a phase is complete and docs are synced:

1. **Reconcile** — Update `docs/working/plan.md` to mark the phase complete
2. **Consolidation check** — Before starting the next phase, scan for cleanup opportunities:
   - **Duplicated patterns** — Did multiple batches introduce similar components that should be consolidated?
   - **Dead code** — Did any batch supersede earlier work, leaving unused code?
   - **Overgrown files** — Did any file grow significantly and need splitting?
   - **Deferred items** — Review the deferred list. Are any quick cleanup tasks worth folding in?

   If cleanup is needed, create a lightweight cleanup batch (no new features — only consolidation). Commit as: `refactor(<scope>): consolidate after phase N`.

   If the codebase is clean, skip this and note "No consolidation needed" in the plan.
3. **Check context capacity** — If under 60%, continue to the next phase. If over 60%, update Session Handoff and start a fresh session.
4. **Read the next phase section** from `FULL-IMPLEMENTATION-PLAN.md`
5. **Decompose into a new plan.md** — Return to Step 1 for the new phase

---

## Step 5: Phase Completion & Archive

When all batches in a phase are done:

1. **Final recap** — Review the phase plan against what was actually built
2. **Suggestion round** — Add entries to `lessons-learned.md` (Suggestions section) — both Agent Signals and Product Suggestions.
3. **Update TODO.md** — Append any human action items discovered during this phase.
4. **Doc sync** — Update `docs/feature-list.md` and other north star docs as needed.
5. **Archive** — Move the working folder contents to a uniquely-named archive folder:
   ```
   docs/archive/
   └── [kebab-case-phase-name]-[YYYY-MM-DD]/
       ├── plan.md
       └── batch-specs/
   ```
6. **Clean the working folder** — `docs/working/` should now be empty and ready for the next phase.
7. **Continue or complete** — If more phases remain in the round, return to Step 1 with the next phase section. If the round is complete, proceed to Step 6 (Round Cleanup).

---

## Step 6: Round Cleanup (after last phase in a FULL-IMPLEMENTATION-PLAN)

A **Round** is the execution of an entire `FULL-IMPLEMENTATION-PLAN.md` — all phases from first to last. Each round is a top-to-bottom build or refresh of the app. When the final phase in a round completes, perform these additional cleanup steps:

1. **Open a PR** — Create a pull request from the feature branch into main. Do not merge — the human reviews and merges.
2. **Archive the working folder** — Same as Step 5 item 5, if not already done.
3. **Final TODO.md sweep** — Review all phases in the completed round for any missed human action items. Append to `docs/upcoming/TODO.md`.
4. **Final doc sync** — Update `docs/feature-list.md` with final statuses. Verify cross-document consistency.
5. **Report context level** — Run `/context` and report the result to the user. Log the percentage in the final plan or commit message.

### Why this step exists
Without round cleanup, stale files accumulate — working folders contain orphaned specs and human action items get lost. This step ensures the repo is clean and ready for the next round.

### What comes next
After a round completes, the human reviews what was built, identifies areas needing polish, hardening, new features, or updates, and writes a new `FULL-IMPLEMENTATION-PLAN.md` for the next round. Each subsequent round is a full top-to-bottom refresh that builds on the previous round's work.

---

## Step 7: Next Round (Manual or Scheduled)

Human writes the next `FULL-IMPLEMENTATION-PLAN.md` for the next round. Return to Step 0.

**For automated scheduled execution within a round**, Claude Code picks up the next phase from the implementation plan automatically. See "Scheduled Task Automation" below.

---

## Step 8: Autoresearch (Optional, Between Rounds)

After a round of PRDs is complete, optionally run analysis passes to find and execute improvements. Three modes:

### Mode A — PRD Discovery (find the next best thing to build)

**Input:** Review `lessons-learned.md` (Suggestions section) — both Agent Signals and Product Suggestions accumulated during development.

**Method:** Systematically evaluate the product against quality rubrics — UX friction scoring, performance audits, design guidelines conformance checks, accessibility audits, or business model gap analysis. Cross-reference against the north star docs to identify gaps between what the product does and what the business plan says it should do.

**Output:**
- New PRD files added to `docs/upcoming/`, numbered and ready for the scheduled task loop to pick up
- `lessons-learned.md` Suggestions cleaned up — promoted items moved to the "Promoted" section, weak ideas moved to "Dismissed"

### Mode B — Optimization Loops (improve what's already built)

For improvements with **objective, numeric scoring** (Lighthouse, bundle size, test coverage, accessibility score), use an autonomous optimization loop inspired by Karpathy's autoresearch pattern.

The loop:
1. Measure current score (the baseline)
2. Make a targeted code change
3. Re-measure
4. If score improved: keep the change (git commit)
5. If score worsened or stayed the same: revert (git reset)
6. Log the result to `results.tsv`
7. Repeat until interrupted or out of ideas

**Key properties:**
- **One file or concern per loop** — keep the scope narrow
- **Fixed measurement** — the scoring command never changes during the loop
- **Autonomous** — the agent runs unattended, trying ~12 experiments per hour
- **Separate branch** — run on a dedicated branch (e.g., `optimize/lighthouse-2026-03-26`)
- **Human reviews the branch** — the agent doesn't merge; the human reviews `results.tsv` and the final diff

**Good candidates:** Lighthouse scores, Core Web Vitals, bundle size, TypeScript strict compliance, test coverage, accessibility audit score.

**Not suitable for:** UX quality, design polish, feature completeness, business logic — these can't be scored numerically.

### Mode C — Workflow Health Audit (improve the process itself)

After every 3-5 completed plans, run a workflow audit using the Agent Signals accumulated in `lessons-learned.md`.

**Compute aggregate metrics from the archives:**

```
Across the last N plans:
- Average review passes per batch: X (target: <2)
- Lane 3 unique finding rate: X% (target: >10% — if consistently 0%, consider removing)
- False positive rate in Lane 1: X% (target: <10%)
- Average context capacity at session end: X%
- OVERRIDE count: N (most common reasons → candidates for new defaults)
- Scoring threshold accuracy: are SHOULD-FIX items actually worth fixing?
```

**Output:** Concrete recommendations for workflow changes — lane configuration, scoring thresholds, batch spec templates, review tier defaults.

---

## Scheduled Task Automation

This workflow is designed to run autonomously via Claude Code Scheduled Tasks, executing batches continuously across sessions.

### How it works

A scheduled task runs on a cron schedule (e.g., hourly). Each session:
1. Reads `docs/working/plan.md` to find the current state
2. Continues from the first incomplete (`⬜`) batch
3. Completes batches until context capacity reaches 60%
4. Updates `plan.md` before exiting so the next session can resume

### Session handoff protocol

Every session MUST update the `## Session Handoff` section of `plan.md` before exiting:

```markdown
## Session Handoff
- **Branch:** feat/[round-name-kebab]
- **Last completed:** Batch N (Phase: [phase name])
- **Next up:** Batch N+1 — [title] (or "Phase complete — next phase: [name]")
- **Context at exit:** N%
- **Blockers:** None (or describe)
- **Round progress:** Phase X of Y complete
```

### Phase transitions within a round

When a phase completes (all batches `✅`):
1. Archive `docs/working/` to `docs/archive/[phase-name]-[date]/`
2. Read the next phase section from `FULL-IMPLEMENTATION-PLAN.md`
3. Decompose it into a new `plan.md`
4. Begin batch execution

### Dynamic session management

Do not use a fixed batch cap. Instead, **check context capacity after each batch** by running `/context`.

- **Under 60% capacity:** Continue to the next batch (even across phase boundaries).
- **Over 60% capacity:** Finish the current batch, update Session Handoff, start a new session.
- **At a round boundary:** Always start a new session regardless of capacity.

With the 1M token context window, sessions can typically handle 1-3 full rounds before reaching 60%, or 8-10+ batches within a single round.

### Combined batches

When consecutive batches follow an identical pattern (e.g., "remove max-w-lg from all customer pages" across Batches 16-18), they can be combined into a single implementation + single review cycle.

### Session resilience rules

1. **Push after every commit** — don't accumulate unpushed work
2. **Start a fresh session at every round boundary** (within a round, continue across phases if context allows)
3. **All review lanes run as sub-agents** — keeps each batch to ~8-10K tokens in the main window
4. **Use `🟡` for partial progress** — enables precise mid-batch handoff
5. **Never block on human input during autonomous execution**

### Failure recovery

If a session fails mid-batch:
- The Session Handoff section tells the next session exactly where things stopped
- Git commits + pushes provide incremental checkpoints
- `🟡` status shows exactly what was completed
- Batch specs make reimplementation straightforward

---

## Quick Reference: Batch Checklist

```
[ ] Re-anchor to plan (read Session Handoff section first)
[ ] Write batch spec
[ ] Implement spec (nothing more)
[ ] Commit and push
[ ] Code review via sub-agents (sized to batch: 1, 2, 4, or 5 agents)
[ ] Fix findings until clean (max 3 passes)
[ ] Validate build (tsc + build)
[ ] Validate visually (screenshots, if UI work)
[ ] Push fixes
[ ] Check context capacity with /context — log % in progress table
[ ] Log suggestions/signals to lessons-learned.md (if any noticed)
[ ] Append human action items to docs/upcoming/TODO.md (if any discovered)
[ ] If over 60% context: update Session Handoff, start new session
[ ] Update Session Handoff in plan.md
[ ] (If last batch in phase) Consolidation check → archive → sync docs → next phase
[ ] (If last phase in round) Round Cleanup — archive, sync docs, open PR, report /context
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
/
├── CLAUDE.md                           # Universal project instructions for AI agents
├── WORKFLOW.md                         # This file — portable workflow reference
├── DEPLOYMENT.md                       # Deployment guide (env vars, migrations, Edge Functions)
├── lessons-learned.md                  # Lessons learned + suggestions (read every session)
├── README.md                           # Human onboarding guide
├── .claude/
│   ├── settings.json
│   └── hooks/
│       └── stop-check.sh              # Post-response validation hook
├── docs/
│   ├── masterplan.md                   # REQUIRED — product blueprint
│   ├── feature-list.md                 # REQUIRED — capability inventory
│   ├── screen-flows.md                 # REQUIRED — user flows and screen specs
│   ├── operating-model.md              # OPTIONAL — add when biz model defined
│   ├── app-flow-pages-and-roles.md     # OPTIONAL — add when 10+ pages
│   ├── design-guidelines.md            # OPTIONAL — add when design system solidifies
│   ├── templates/                      # Reusable templates (optimization loops, etc.)
│   ├── upcoming/                       # Round scope + persistent operational docs
│   │   ├── TODO.md                     # Human action items (persistent across rounds)
│   │   └── FULL-IMPLEMENTATION-PLAN.md # Round scope — phases (PRDs) + deliverables
│   ├── working/                        # Active plan + batch specs
│   │   ├── plan.md                     # Current phase batches + session handoff
│   │   └── batch-specs/
│   └── archive/                        # Completed phases
└── src/                                # Application source code
```

## Quick Reference: Round Lifecycle

```
FULL-IMPLEMENTATION-PLAN.md               # 1. Human writes round scope with phase sections
        ↓
Phase section = self-contained PRD        # 2. Each phase has problem/goals/scope/deliverables
        ↓
docs/working/plan.md                      # 3. Agent decomposes current phase into batches
docs/working/batch-specs/                 # 4. Specs written per batch, executed + reviewed
        ↓
docs/archive/phase-name-YYYY-MM-DD/       # 5. Archived on phase completion
  ├── plan.md
  └── batch-specs/
        ↓
(repeat for next phase)                   # 6. Read next phase section, decompose, execute
        ↓
Round complete → PR + Round Cleanup       # 7. Open PR, archive, sync docs, report /context
docs/upcoming/TODO.md                     # 8. Human action items appended throughout
```

## Adapting to Other Projects

This workflow is project-agnostic. To use it on a new project:

1. **Create your core docs** — Start with `CLAUDE.md`, `docs/masterplan.md`, `docs/feature-list.md`, and `docs/screen-flows.md`.
2. **Adjust review lanes** — The 3 parallel lanes + synthesis work for most projects. Lane 1 (spec completeness) is the most important.
3. **Adjust batch size** — For greenfield projects, batches can be larger. For mature codebases, keep them smaller.
4. **Skip visual validation** if you're building a CLI, API, or backend system. Replace with integration test validation.
5. **Speed mode for early stages** — When the product is pre-PMF, default to speed mode.
6. **The working folder structure is the constant** — Plan + Batch Specs, always in one place.
7. **Create `docs/upcoming/TODO.md`** — Start with the template from this repo. Human action items accumulate here across phases and persist across rounds.
8. **Round Cleanup is the final step** — Archive, sync docs, report. Don't skip it — stale files compound across rounds.