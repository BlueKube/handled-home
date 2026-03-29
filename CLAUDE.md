# CLAUDE.md

> **Last updated:** 2026-03-28

Universal instructions for AI agents working in this repo. No project-specific content lives here — all project context lives in the canonical documents below.

---

## 1. Project Context

Do not look here for what this project is. Look here:

| Question | Document |
|---|---|
| What are we building and why? | `docs/masterplan.md` |
| What features exist and what's shipped? | `docs/feature-list.md` |
| What do the screens look like? | `docs/screen-flows.md` |
| How do we build it? | `WORKFLOW.md` |
| How does the business run? | `docs/operating-model.md` *(add when model is defined)* |
| What routes and roles exist? | `docs/app-flow-pages-and-roles.md` *(add when 10+ pages)* |
| What are the design standards? | `docs/design-guidelines.md` *(add when design system solidifies)* |

Read `docs/masterplan.md` at the start of every session. It is the foundational "why" document.

---

## 2. Canonical Documents

### Required (must exist before any coding begins)

| Document | Owner | What it owns |
|---|---|---|
| `docs/masterplan.md` | Human (Define Agent) | Product vision, problem statement, value prop, business model, target users |
| `docs/feature-list.md` | Human + Implementation Agent | Numbered capability inventory with DONE / IN PROGRESS / PLANNED / DEFERRED status |
| `docs/screen-flows.md` | Human (Define Agent) | Every screen's layout, components, navigation, empty states, loading states |

### Optional (add as the project matures)

| Document | When to add | What it owns |
|---|---|---|
| `docs/operating-model.md` | When business model is defined | Revenue model, unit economics, cost structure, metric thresholds, operational rules |
| `docs/app-flow-pages-and-roles.md` | When the app reaches 10+ pages | Route tree, page inventory, role gates, user journeys, navigation hierarchy |
| `docs/design-guidelines.md` | When the design system solidifies | Color tokens, typography scale, spacing system, component specs, accessibility standards |

### Working documents (active PRD cycle only)

| Document | Owner | What it owns |
|---|---|---|
| `docs/working/prd.md` | Human | Current PRD being executed |
| `docs/working/plan.md` | Planning Agent | Phased plan, batch breakdown, progress table, Session Handoff |
| `docs/working/batch-specs/` | Implementation Agent | One spec file per batch, written before coding |

### Persistent operational documents

| Document | Owner | What it owns |
|---|---|---|
| `docs/upcoming/TODO.md` | Human + Agent | Human action items that agents cannot do (API keys, external config, decisions). Agents append items during execution; human resolves them between sessions. |
| `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` | Human | Master PRD roadmap across a full pass (all PRDs in sequence) |

---

## 3. Source-of-Truth Rules

**One fact, one owner. Never duplicate.**

| Fact type | Lives in |
|---|---|
| Product strategy and vision | `docs/masterplan.md` |
| Feature inventory and status | `docs/feature-list.md` |
| Screen layouts and user flows | `docs/screen-flows.md` |
| Revenue model and thresholds | `docs/operating-model.md` |
| Route tree and access control | `docs/app-flow-pages-and-roles.md` |
| Design system and patterns | `docs/design-guidelines.md` |
| Workflow procedure | `WORKFLOW.md` |
| Repo and agent instructions | `CLAUDE.md` (this file) |
| Active plan and batch progress | `docs/working/plan.md` |
| Human action items (API keys, config, decisions) | `docs/upcoming/TODO.md` |

If a fact appears in two documents, one of them is wrong. Investigate before editing either.

If the code and docs disagree, investigate which is correct — sometimes the code drifted, sometimes the doc was aspirational.

---

## 4. Workflow (Non-Negotiable)

The full implementation procedure lives in `WORKFLOW.md`. Read it before executing any PRD.

The loop: **PRD → Plan → Phase → Batch → Review → Doc Sync → Next Batch → Archive**

Each PRD declares an execution mode:
- **Quality mode** (default) — Tiered review (2–5 agents sized to batch risk), full doc sync. Production-ready.
- **Speed mode** — Reduced 2-agent review (1 combined reviewer + 1 synthesis, no Lane 3). Max 2 fix passes. For prototypes and low-risk changes.

The mandatory code review procedure is inlined in Section 5 below, so it survives context compression if `WORKFLOW.md` is dropped from context.

---

## 5. Mandatory Code Review (Non-Negotiable)

Run after every batch commit. This is part of the definition of done — it is not optional.

### Architecture: 3 parallel lanes + 1 synthesis lane, Sonnet-only default

**Review tiers — choose based on batch size declared in `docs/working/plan.md`:**

| Batch Size | Agent Count | Configuration |
|---|---|---|
| **Large** — new integrations, multi-file refactors | 5 | 3 parallel Sonnet lanes + 1 Sonnet synthesis + 1 Haiku synthesis |
| **Medium** — typical feature batch | 4 | 3 parallel Sonnet lanes + 1 Sonnet synthesis |
| **Small** — templates, config, minor changes | 2 | 1 combined Sonnet reviewer (spec + bugs) + 1 Sonnet synthesis |

### Stage 1 — Parallel analysis (Lanes 1–3, Medium/Large only)

Launch Lanes 1–3 in parallel. They do not see each other's output.

| Lane | Focus |
|---|---|
| **Lane 1 — Spec Completeness** | Does every requirement, acceptance criterion, and edge case in the batch spec have a corresponding implementation in the diff? |
| **Lane 2 — Bug Scan** | Bugs visible in the diff alone — no extra context, no codebase knowledge |
| **Lane 3 — Historical Context & Prior Feedback** | `git blame` / `git log` on changed files — are we breaking something intentional? Repeating a past mistake? |

### Stage 2 — Synthesis (Lane 4, runs after Lanes 1–3)

Lane 4 is the **only agent that sees the other lanes' output**. It cross-validates, de-duplicates, resolves contradictions, and produces the final scored report.

For **Large batches only**: add a second Haiku synthesis agent as a fast second opinion on the final scored report.

### Lane 3 skip rule

Skip Lane 3 if:
- This is the first batch in a phase (no prior review findings to compare against), OR
- There are no prior review findings on the changed files

When Lane 3 is skipped, Medium batches run as: 2 parallel lanes + synthesis = 3 agents total.

Lane 3's value is regression detection. Without history to compare against, it produces generic pattern-checking that Lane 2 already covers.

### What each agent receives

Every agent receives:
1. The git diff: `git diff HEAD~1...HEAD`
2. The batch spec from `docs/working/batch-specs/`
3. Relevant sections of `CLAUDE.md` (conventions, consistency standards)

Additionally per lane:
- **Lane 1:** Full batch spec — every requirement, acceptance criterion, scope item, and edge case
- **Lane 2:** Diff only, no extra context (forces bug-finding from code alone)
- **Lane 3:** `git blame`, `git log`, and any prior review comments for every changed file
- **Lane 4:** All findings from Lanes 1–3, the full diff, and the batch spec

### Agent prompt templates

**Lane 1 — Spec Completeness (Sonnet):**
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

**Lane 2 — Bug Scan (Sonnet):**
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

**Lane 3 — Historical Context & Prior Feedback (Sonnet):**
```
Agent tool:
  model: sonnet
  description: "Historical context & prior feedback — Sonnet"
  prompt: |
    You are a code historian. Your job is to determine whether
    changes in this diff break something that was intentional,
    or repeat a mistake that was previously corrected.

    GIT LOG (changed files):
    [paste git log --oneline -20 for each changed file]

    GIT BLAME (changed sections):
    [paste git blame output for changed line ranges]

    PRIOR REVIEW FINDINGS (if any):
    [paste any review findings from previous batches that touched these files]

    DIFF:
    [paste diff here]

    For each changed section:
    1. Check if the prior history shows this pattern was intentional
    2. Check if prior review findings flagged this area before
    3. Check if the change reverts a previous fix

    Return findings as:
    - MUST-FIX (file:line): "This reverts a fix from [commit] — [original issue]"
    - SHOULD-FIX (file:line): "Prior review flagged this pattern in [batch N] — [issue]"
    - INFO (file:line): "This pattern was established intentionally per [commit] — no action needed"

    If no historical concerns found, say "No historical concerns."
```

**Lane 4 — Synthesis & Cross-Check (Sonnet):**
```
Agent tool:
  model: sonnet
  description: "Synthesis & cross-check — Sonnet"
  prompt: |
    You are a review synthesis agent. You did NOT review the code yourself.
    Your job is to cross-validate, de-duplicate, and score the findings
    from 3 independent review lanes.

    LANE 1 FINDINGS (Spec Completeness):
    [paste findings]

    LANE 2 FINDINGS (Bug Scan):
    [paste findings]

    LANE 3 FINDINGS (Historical Context & Prior Feedback):
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

### Scoring formula (used by Lane 4)

| Factor | Points |
|---|---|
| Cross-lane agreement — each additional lane that flagged the same issue | +25 |
| Severity — regression, security issue, or data loss risk | +20–40 |
| Specificity — exact file:line reference with clear explanation | +10 |
| Style-only finding (formatting, naming preference) | cap total at 20 |

### Action thresholds

| Score | Category | Action |
|---|---|---|
| 75–100 | **MUST-FIX** | Fix before proceeding to next batch |
| 25–74 | **SHOULD-FIX** | Fix in same batch when feasible |
| 0–24 | **DROP** | Log or ignore |

### Fix loop

Fix MUST-FIX findings → commit → **lightweight re-review** → repeat until clean.

**Maximum 3 passes.**

**Lightweight re-review (passes 2+):** Run only Lanes 1–2 + synthesis (3 agents). Lane 3 adds negligible value on a fix diff — git history hasn't meaningfully changed.

If issues persist after 3 passes, escalate to the human for a decision. Do not loop indefinitely.

### Why Lane 1 checks spec completeness (not CLAUDE.md compliance)

CLAUDE.md conventions are already caught by the Bug Scan and Historical Context lanes — they naturally flag deviations from project patterns. What no other lane catches is *missing work* — requirements that were specified but never implemented. This gap has caused entire cleanup PRDs after batches shipped "complete" with unfinished items. The spec completeness audit closes that gap at review time.

### Why Lane 4 is synthesis, not another parallel check

Parallel lanes are fast but isolated — they can't see each other's findings. Contradictions go unresolved, related findings stay disconnected, inter-lane gaps slip through. Lane 4 runs after Lanes 1–3, reads all their output, and produces a unified cross-validated report. It's the only point where findings from different perspectives are reconciled.

### Visual verification after UI batches

After any batch that changes UI (new pages, layout changes, styling), take a screenshot to verify. Light-mode colors on dark backgrounds, mobile text truncation, and CTA mismatches are invisible without visual checks. Use the raw Chromium binary if Playwright CLI fails:

```bash
# Find the binary
find / -name "chrome" 2>/dev/null | grep -v node_modules

# Capture with enough render time for React SPAs
/path/to/chrome --headless --no-sandbox --disable-gpu \
  --window-size=1280,800 --virtual-time-budget=8000 \
  --screenshot=/tmp/page.png http://127.0.0.1:5173/
```

### CTA and navigation consistency

When changing a primary CTA or user flow entry point, grep for all links to the old target across the entire codebase. Orphaned links to legacy pages create split user flows where different entry points send users to different forms or tables.

---

## 6. Working Folder Structure

```
/
├── CLAUDE.md                           # This file — universal agent instructions
├── WORKFLOW.md                         # Portable PRD-to-Production workflow reference
├── README.md                           # Human onboarding guide
├── .claude/
│   ├── settings.json                   # Claude Code settings
│   └── commands/
│       └── code-review.md              # /code-review slash command
├── docs/
│   ├── masterplan.md                   # REQUIRED — product blueprint
│   ├── feature-list.md                 # REQUIRED — capability inventory
│   ├── screen-flows.md                 # REQUIRED — user flows and screen specs
│   ├── operating-model.md              # OPTIONAL — add when business model defined
│   ├── app-flow-pages-and-roles.md     # OPTIONAL — add when 10+ pages
│   ├── design-guidelines.md            # OPTIONAL — add when design system solidifies
│   ├── suggestions.md                  # Inter-agent signal file + product ideas
│   ├── working/                        # Active PRD + plan + batch specs
│   │   ├── prd.md
│   │   ├── plan.md
│   │   └── batch-specs/
│   ├── upcoming/                       # PRD queue (numbered: 001-xxx.md)
│   │   ├── TODO.md                     # Human action items (persistent across PRDs)
│   │   └── FULL-IMPLEMENTATION-PLAN.md # Master PRD roadmap for a full pass
│   └── archive/                        # Completed PRDs (kebab-name-YYYY-MM-DD/)
└── src/                                # Application source code
```

---

## 7. Session Resilience

These rules prevent data loss and enable reliable multi-session execution.

1. **Push after every commit.** The pattern is always: implement → commit → push → review → fix → commit → push. Unpushed commits are unrecoverable if a session dies.

2. **Start a fresh session at every phase boundary.** Phase transitions are natural context seams. A fresh session starts with the full context budget, reads `plan.md` to re-anchor, and enters the new phase without stale context.

3. **All review lanes run as sub-agents.** Review findings stay in sub-agent context windows — only the final scored report enters the main context. This keeps each batch to ~8–10K tokens in the main window, enabling 20+ batches per session when needed.

4. **Use `🟡` for partial progress.** If a session must stop mid-batch, mark it `🟡 4/7 files done, pushed` in the progress table. The next session reads this and continues from exactly where work stopped.

5. **Never block on human input during autonomous execution.** If something is ambiguous, make the best judgment call based on the batch spec, commit with a note explaining the decision, and flag it for human review in `plan.md`.

**Failure recovery:** The Session Handoff section tells the next session where things stopped. Git commits + pushes provide incremental checkpoints. `🟡` status shows exactly what was completed. Uncommitted work is lost, but batch specs make reimplementation fast.

---

## 8. Scheduled Task / Multi-Session Automation

### Session handoff protocol

Every session MUST update the `## Session Handoff` section of `docs/working/plan.md` before exiting:

```markdown
## Session Handoff
- **Branch:** feat/[prd-name-kebab]
- **Last completed:** Batch N
- **Next up:** Batch N+1 — [title] (or "None — plan complete")
- **Context at exit:** N%
- **Blockers:** None (or describe)
- **PRD queue:** N files remaining in docs/upcoming/
```

A new session reads this section first (~10 lines) to know exactly where to resume.

### PRD queue

For multi-PRD automation, place numbered PRD files in `docs/upcoming/`:

```
docs/upcoming/
├── 001-feature-name.md
├── 002-next-feature.md
└── 003-another-feature.md
```

When a plan completes (all batches `✅`):
1. Archive `docs/working/` to `docs/archive/[feature-name]-[YYYY-MM-DD]/`
2. Move the lowest-numbered PRD from `docs/upcoming/` to `docs/working/prd.md`
3. Decompose it into a new `plan.md`
4. Begin batch execution

### Dynamic session management

Do not use a fixed batch cap. Instead, **check context capacity after each batch** by running `/context`.

- **Under 60% capacity:** Continue to the next batch.
- **Over 60% capacity:** Finish the current batch, update Session Handoff, start a new session.
- **At a full pass boundary:** Always start a new session regardless of capacity. A full pass is the completion of an entire `FULL-IMPLEMENTATION-PLAN.md` — all PRDs from start to finish.

Log the context capacity percentage in the progress table after each batch (see Section 9).

### Scheduled task prompt template

```
Read docs/working/plan.md. Check the Session Handoff section first.

BRANCH RULE: The Session Handoff specifies the feature branch.
If that branch exists on origin: git fetch && git checkout [branch]
If it does not exist: git checkout -b [branch]

If all batches are ✅:
  - Open a PR from the feature branch into main (do not merge)
  - Archive docs/working/
  - Check docs/upcoming/ for the next PRD (lowest number)
  - If found: create a new feature branch, move PRD to docs/working/prd.md,
    decompose into plan.md, begin batch execution
  - If empty: exit — nothing to do

If batches remain ⬜:
  - Continue from the first incomplete batch
  - After each batch, check context capacity with /context
  - If under 60%: continue to next batch
  - If over 60%: push and update Session Handoff, exit for a fresh session
  - Follow the full workflow: spec → implement → commit → review → fix → push

Before exiting: push all commits and update the Session Handoff section of plan.md.
```

---

## 9. Progress Tracker Status Key

Used in `docs/working/plan.md` progress tables.

| Symbol | Meaning |
|---|---|
| `✅` | Complete and pushed |
| `🟡` | In progress — partial work pushed (note what's done and what remains) |
| `⬜` | Not started |
| `❌` | Blocked (note the reason) |

Example:
```markdown
| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| B1 | Auth flow | M | ✅ | 18% |
| B2 | Dashboard | L | ✅ | 34% |
| B3 | Chart components | M | ✅ | 47% |
| B4 | Alert config | S | ✅ | 52% |
| B5 | Settings page | M | 🟡 3/5 files done | 61% → new session |
| B6 | Reports | M | ⬜ | |
| B7 | Admin tools | L | ❌ blocked: API spec | |
```

The **Context** column records capacity after each batch (from `/context`). This data helps the Orchestration Agent tune session management and identify which batch types consume the most context.

---

## 10. Override Protocol

This workflow is designed to be followed consistently. Deviations are allowed when strict adherence produces worse outcomes — but **deviations must be visible, not silent.**

### When deviating from the workflow

If you skip a step, combine steps, or do something differently than described:

1. Note the deviation in the batch spec, commit message, or `plan.md`
2. State which rule you're overriding and why
3. Tag it: `[OVERRIDE: <rule-name> — <reason>]`

Examples:
- `[OVERRIDE: combined batches 10+11 — identical mechanical pattern, single find-replace across both]`
- `[OVERRIDE: skipped visual validation — batch is backend-only, no UI changes]`
- `[OVERRIDE: skipped Lane 3 — first batch in phase, no prior review history]`

The human can grep for `[OVERRIDE` across `plan.md` and commit history to see every deviation. Good judgment calls become visible and can be promoted into workflow defaults.

### What is never overridable

These are invariants. Violating them causes data loss, workflow corruption, or compounding errors:

1. **Push after every commit** — unpushed work is unrecoverable if a session dies
2. **Write a batch spec before coding** — coding without a spec produces drift
3. **Run the code review after every batch** — the review is part of the definition of done. Never skip, never defer, never run retroactively in bulk.
4. **Update Session Handoff before exiting** — the next session depends on this
5. **Update the progress table** — this is the durable state machine
6. **Never block on human input during autonomous execution** — make the call, document it, move on
7. **Apply or document migrations before moving on** — unappplied migrations cause downstream tools (Lovable) to stub working code
8. **Always pass actual diffs to review agents** — pseudocode summaries produce false positives. Use `git diff HEAD~1...HEAD`, not a written description of the changes.

Everything else is a **default** — follow it unless you have a specific reason not to, and document the override when you don't.

---

## 11. Git Workflow

### Branch strategy

Work on feature branches. Push to the feature branch after every commit. Do not accumulate unpushed commits.

### Commit message formats

```
feat(<scope>): Batch N — Description           # New features / batch implementation
fix(<scope>): resolve Batch N review findings  # Review fix commits
refactor(<scope>): consolidate after phase N   # Phase-transition cleanup
docs: sync documentation after phase N         # Documentation sync
```

`<scope>` is a short area identifier (e.g., `auth`, `dashboard`, `billing`).

Every commit message should be self-contained — a future agent reading `git log` should understand what was done without opening the diff.

---

## 12. Commands

```bash
# Development server
npm run dev

# Production build (must pass before batch is done)
npm run build

# TypeScript type check without emit (must pass before batch is done)
npx tsc --noEmit

# Run tests
npm test
```

Both `npm run build` and `npx tsc --noEmit` must pass before a batch is considered complete.

---

## 13. Conventions

Generic patterns used across this codebase. For project-specific conventions, see `docs/design-guidelines.md`.

- **Pages** live in `src/pages/`
- **Components** live in `src/components/`
- **Hooks** live in `src/hooks/` — data fetching uses custom hooks
- **Utilities** live in `src/lib/` or `src/utils/`
- **Types** live in `src/types/`
- **Constants** live in `src/constants/` — never duplicate a constant across files. If it's used in 2+ places, extract immediately.
- One component per file
- **Decompose at 300 lines.** If a component grows past 300 lines in a batch, extract sections in the same batch — not a future PRD.
- No inline business logic in JSX — extract to hooks or utilities
- Commit only what the batch spec says; out-of-scope discoveries go to `docs/suggestions.md`, not into the diff
- **Never put API keys in `VITE_` variables.** Client-side env vars are bundled into the browser. Any third-party API call with a secret goes in an Edge Function.
- **Dark mode colors:** Never use light-mode Tailwind colors (`bg-green-100`, `text-green-600`) in a dark-first theme. Use dark variants (`bg-green-900/40`, `text-green-400`).
- **Default unauthenticated users to `null`**, never to a permissioned role like "operator".

---

## 14. Suggestions & Agent Signals

`docs/suggestions.md` serves two purposes: inter-agent communication about the workflow, and product improvement ideas.

### Structure

```markdown
# Suggestions

## Agent Signals
<!-- Observations about the workflow, review system, or process.
     Written by: Any agent during execution.
     Read by: Orchestration Agent, Human, future agents. -->

### YYYY-MM-DD — [Agent Role] (Batch N)
- [Observation with specific data]

## Product Suggestions
<!-- Ideas for features, UX improvements, optimizations.
     Written by: Implementation Agent during batch work.
     Read by: Define Agent, Human, Orchestration Agent. -->

### YYYY-MM-DD — [Agent Role] (Batch N)
- [Idea with context]
```

### What to log as Agent Signals

- Review lane effectiveness: "Lane 3 produced 0 unique findings in Batches 1-7 — all duplicated Lane 2."
- Spec quality issues: "Lane 1 flagged 3 false positives because deferred items weren't listed in the batch spec."
- Context consumption patterns: "Batch 5 (Large) consumed 18% context due to 3-pass review fix loop."
- Workflow friction: "Batch specs averaging 45 lines — non-goals section adds no value on Small batches."
- Scoring calibration: "5 SHOULD-FIX findings scored 26-30 were all style-only — threshold may be too low."

### Rules

- **Keep entries brief** — 1-2 sentences with specific data. This is a 30-second append, not a report.
- **Always include the date, agent role, and batch number** for traceability.
- **Do not stop work to write suggestions** — append at the end of a batch, during the suggestion step.
- **Agent Signals are data, not opinions** — include numbers, counts, and specific examples.

---

## Context Reading Cadence

| What to read | When |
|---|---|
| `docs/masterplan.md` + all available north star docs | Start of every session |
| `lessons-learned.md` | Start of every session |

| `docs/working/prd.md` | Start of each phase (first batch of a new phase) |
| `docs/working/plan.md` (Session Handoff section first) | Start of each batch |
| Batch spec from `docs/working/batch-specs/` | Before coding each batch |

When north star docs are current, Claude makes informed decisions. When they're stale, decisions are made on bad information that compounds silently across batches.

---

## Full Pass Cleanup (Non-Negotiable)

A "Full Pass" is the execution of an entire `FULL-IMPLEMENTATION-PLAN.md` file — all PRDs from start to finish. When the last PRD in a full pass completes, perform these cleanup steps before closing out:

### 1. Archive the working folder
Move `docs/working/prd.md`, `docs/working/plan.md`, and `docs/working/batch-specs/*` to `docs/archive/[kebab-name]-[YYYY-MM-DD]/`. The working folder should be empty after this step.

### 2. Clean up `docs/upcoming/`
Remove any executed PRD files (e.g., `001-xxx.md` through `NNN-xxx.md`) that were already completed. Only `TODO.md`, `FULL-IMPLEMENTATION-PLAN.md`, and any future unexecuted PRDs should remain.

### 3. Update `docs/upcoming/TODO.md`
Append any human action items discovered during execution — API keys, external service setup, manual configuration, deployment steps, or decisions the agent could not make autonomously. Use the format defined in `TODO.md`.

### 4. Final doc sync
Update `docs/feature-list.md` with final statuses for all features touched during the full pass. Verify consistency across north star docs.

### 5. Report context level
Run `/context` and report the result to the user. This helps calibrate session management and context consumption patterns across full passes.

### Why this matters
Without cleanup, stale files accumulate across passes — executed PRDs linger in `docs/upcoming/`, working folders contain orphaned specs, and human action items get lost. The cleanup step ensures the repo is ready for the next pass or the next project.

---

## Human Action Items (`docs/upcoming/TODO.md`)

### Purpose
Agents encounter work during execution that requires human involvement — API keys, external service configuration, deployment steps, business decisions. Rather than blocking or silently skipping these, agents append items to `docs/upcoming/TODO.md`.

### Rules
1. **Append, don't block.** If you encounter something that needs human action, add it to `TODO.md` and continue execution.
2. **Be specific.** Include what needs to be done, why, and what is blocked until it's resolved.
3. **Include the source.** Tag each item with the PRD or batch it came from.
4. **Never delete items.** Only the human moves items to the "Resolved" section.
5. **Read at session start.** Check `TODO.md` at the start of each session to see if any blockers have been resolved.

### Format
```markdown
### YYYY-MM-DD — [Source PRD or Context]
- [ ] Action item description
  - **Why:** Brief explanation
  - **Blocked:** What is blocked (or "Nothing blocked")
```