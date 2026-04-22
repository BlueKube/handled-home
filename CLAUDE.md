# CLAUDE.md

> **Last updated:** 2026-04-21

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
| How do we verify it works? | `docs/testing-strategy.md` |
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
| `docs/testing-strategy.md` | Implementation Agent + Human | Five-tier testing protocol (static → unit → integration → E2E → AI-as-judge), canonical personas, per-batch tier selection, pre-merge checklist |

### Optional (add as the project matures)

| Document | When to add | What it owns |
|---|---|---|
| `docs/operating-model.md` | When business model is defined | Revenue model, unit economics, cost structure, metric thresholds, operational rules |
| `docs/app-flow-pages-and-roles.md` | When the app reaches 10+ pages | Route tree, page inventory, role gates, user journeys, navigation hierarchy |
| `docs/design-guidelines.md` | When the design system solidifies | Color tokens, typography scale, spacing system, component specs, accessibility standards |

### Working documents (active execution only)

| Document | Owner | What it owns |
|---|---|---|
| `docs/working/plan.md` | Planning Agent | Current phase batches, progress table, Session Handoff |
| `docs/working/batch-specs/` | Implementation Agent | One spec file per batch, written before coding |

### Persistent operational documents

| Document | Owner | What it owns |
|---|---|---|
| `docs/upcoming/TODO.md` | Human + Agent | Human action items that agents cannot do (API keys, external config, decisions). Agents append items during execution; human resolves them between sessions. |
| `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` | Human | Round scope — all phases with problem, goals, and scope per phase. Each phase section is a self-contained PRD. |

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
| Testing tiers, personas, pre-merge checklist | `docs/testing-strategy.md` |
| Repo and agent instructions | `CLAUDE.md` (this file) |
| Active phase plan and batch progress | `docs/working/plan.md` |
| Round scope, phase definitions (PRDs) | `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` |
| Human action items (API keys, config, decisions) | `docs/upcoming/TODO.md` |

If a fact appears in two documents, one of them is wrong. Investigate before editing either.

If the code and docs disagree, investigate which is correct — sometimes the code drifted, sometimes the doc was aspirational.

---

## 4. Workflow (Non-Negotiable)

The full implementation procedure lives in `WORKFLOW.md`. Read it before executing any phase.

The loop: **Phase → Plan → Batch → Review → Doc Sync → Next Batch → Next Phase → Archive**

### Glossary

| Term | What it means |
|------|--------------|
| **Round** | One complete execution of a `FULL-IMPLEMENTATION-PLAN.md` — a top-to-bottom build or refresh of the app. Round 1 builds the foundation. Subsequent rounds polish, harden, add features, and improve. Large-scope: runs for hours or days. "Let's brainstorm a new round" = review what exists, identify what needs work, write a new implementation plan. |
| **Phase** | A logical group of related work within a round. Each phase is a self-contained PRD (problem, goals, scope, deliverables) written as a section in the implementation plan. |
| **Batch** | The smallest unit of work. 1 theme, 1–3 files. Gets a spec, implementation, and review cycle. |
| **Step** | A procedure in `WORKFLOW.md` (Step 0–8). Describes *how* to execute, not *what* to build. |

Each phase declares an execution mode:
- **Quality mode** (default) — Tiered review (1–5 agents sized to batch risk), full doc sync. Production-ready.
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
| **Micro** — type defs, doc syncs, config-only | 1 | 1 combined Sonnet reviewer (spec + bugs), no synthesis |

**Micro tier:** Use when the batch is a mechanical transcription of already-specified data — type definition updates, documentation syncs, config changes with no logic. The single reviewer confirms correctness. Synthesis adds nothing when there's only one input lane.

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

### Fact-checker lane (for business-critical documents)

When a batch produces a document that will inform business decisions (pricing reports, operating model changes, reasoning reports, training content), replace Lane 2 (Bug Scan) with a **Fact Checker** lane:

- Cross-reference every claim against actual data sources (simulator output, migration files, model.ts constants)
- Verify all numbers, percentages, and dollar amounts
- Flag any claim that cannot be traced to a specific source

This lane caught margin calculation errors in the SKU calibration reasoning report that would have understated losses by 7.4 percentage points at 90% utilization. Standard Bug Scan would not have caught this.

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
├── DEPLOYMENT.md                       # Deployment guide (env vars, migrations, Edge Functions)
├── lessons-learned.md                  # Lessons learned + suggestions (read every session)
├── README.md                           # Human onboarding guide
├── .env                                # Committed Vite defaults (publishable keys only — no secrets)
├── .mcp.json                           # Project-scoped MCP servers (Supabase, Stitch)
├── vercel.json                         # SPA rewrite for BrowserRouter deep links
├── .claude/
│   ├── settings.json                   # Claude Code settings (hooks, permissions)
│   ├── settings.local.json             # Gitignored personal overrides
│   ├── agents/                         # Reusable sub-agent prompts
│   ├── commands/                       # Slash commands
│   └── hooks/
│       └── stop-check.sh              # Post-response validation hook
├── docs/
│   ├── masterplan.md                   # REQUIRED — product blueprint
│   ├── feature-list.md                 # REQUIRED — capability inventory
│   ├── screen-flows.md                 # REQUIRED — user flows and screen specs
│   ├── operating-model.md              # OPTIONAL — add when business model defined
│   ├── app-flow-pages-and-roles.md     # OPTIONAL — add when 10+ pages
│   ├── design-guidelines.md            # OPTIONAL — add when design system solidifies
│   ├── working/                        # Active plan + batch specs
│   │   ├── plan.md                     # Current phase batches + session handoff
│   │   └── batch-specs/                # One spec per batch
│   ├── upcoming/                       # Round scope + human action items
│   │   ├── TODO.md                     # Human action items (persistent across rounds)
│   │   └── FULL-IMPLEMENTATION-PLAN.md # Round scope — phases (PRDs) + deliverables
│   └── archive/                        # Completed phases (kebab-name-YYYY-MM-DD/)
├── supabase/
│   ├── migrations/                     # SQL migrations (auto-applied via GitHub integration on push to main)
│   ├── functions/                      # Edge Functions (39+)
│   │   └── _shared/
│   │       ├── anthropic.ts            # Anthropic API helper (claude-haiku-4-5-20251001)
│   │       ├── auth.ts                 # requireCronSecret / requireServiceRole / requireUserJwt helpers
│   │       ├── cors.ts
│   │       └── deps.ts
│   └── config.toml                     # CLI config — project_id here targets the active Supabase project
└── src/                                # Application source code
```

---

## 7. Session Resilience

These rules prevent data loss and enable reliable multi-session execution.

1. **Push after every commit.** The pattern is always: implement → commit → push → review → fix → commit → push. Unpushed commits are unrecoverable if a session dies.

2. **Start a fresh session at every round boundary.** Round transitions (completing a full `FULL-IMPLEMENTATION-PLAN.md`) are natural context seams. Within a round, continue across phase boundaries if context allows — check capacity with `/context` and start a new session when over 60%.

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
- **Branch:** feat/[round-name-kebab]
- **Last completed:** Batch N (Phase: [phase name])
- **Next up:** Batch N+1 — [title] (or "Phase complete — next phase: [name]")
- **Context at exit:** N%
- **Blockers:** None (or describe)
- **Round progress:** Phase X of Y complete
```

A new session reads this section first (~10 lines) to know exactly where to resume.

### Phase transitions

When a plan completes (all batches in the current phase are `✅`):
1. Archive `docs/working/` to `docs/archive/[phase-name]-[YYYY-MM-DD]/`
2. Read the next phase section from `FULL-IMPLEMENTATION-PLAN.md`
3. Decompose it into a new `plan.md` with batch breakdown
4. Begin batch execution

### Dynamic session management

Do not use a fixed batch cap. Instead, **check context capacity after each batch** by running `/context`.

- **Under 60% capacity:** Continue to the next batch.
- **Over 60% capacity:** Finish the current batch, update Session Handoff, start a new session.
- **At a round boundary:** Always start a new session regardless of capacity. A round is the completion of an entire `FULL-IMPLEMENTATION-PLAN.md` — all phases from start to finish.

Log the context capacity percentage in the progress table after each batch (see Section 9).

### Scheduled task prompt template

```
Read docs/working/plan.md. Check the Session Handoff section first.

BRANCH RULE: The Session Handoff specifies the feature branch.
If that branch exists on origin: git fetch && git checkout [branch]
If it does not exist: git checkout -b [branch]

If all batches are ✅ (current phase complete):
  - Archive docs/working/ to docs/archive/
  - Read FULL-IMPLEMENTATION-PLAN.md for the next phase
  - If next phase exists: decompose into new plan.md, begin batch execution
  - If no more phases (round complete): open a PR, run Round Cleanup, exit

If batches remain ⬜:
  - Continue from the first incomplete batch
  - After each batch, check context capacity with /context
  - If under 60%: continue to next batch
  - If over 60%: push and update Session Handoff, exit for a fresh session
  - Follow the full workflow: spec → implement → commit → review → fix → push

Before exiting: push all commits and update the Session Handoff section of plan.md.
```

---

## 8b. Active Multi-Session Plan: Feature Polish (Rounds 12–61)

> **Status:** ACTIVE — 50 rounds of feature polish, 10 features per round.
> **Plan:** `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md`
> **Goal:** Bring all 482 features from 8/10 to 9/10 or 10/10 maturity.

### Branch Naming & Chaining
Branches are numbered sequentially and **chain off each other** (not main):
```
polish/round-12-auth-identity       ← from current HEAD
polish/round-13-phone-identity      ← from round-12 branch
polish/round-14-property-profiles   ← from round-13 branch
...
polish/round-61-final-sweep         ← from round-60 branch
```

**At session start:**
1. Read `docs/working/plan.md` → Session Handoff section
2. Find the branch for the current or most recently completed round
3. `git fetch origin && git checkout <branch> && git pull`
4. If starting a new round: `git checkout -b polish/round-<N>-<name>`

### Context Management — CRITICAL
The Claude Code agent consistently **overestimates** its context usage by ~2×. A reported "72%" is actually ~36%.
- **Always use `/context` command** to check actual context — do NOT estimate.
- Continue working until `/context` reports **actual usage over 60%** (which may correspond to a reported ~80-90% estimate).
- When actual context hits 60%: finish current batch, push, update Session Handoff, exit.

### What This Plan Does NOT Do
- Does NOT add new features
- Does NOT refactor working patterns into different patterns
- Does NOT change database schema unless fixing a real bug
- Does NOT touch files outside the current round's scope

### Per-Feature Polish Checklist
For each feature in the round, verify:
- [ ] Implementation matches feature description
- [ ] Error states (network failure, empty data, auth failure)
- [ ] Loading states (skeleton or spinner)
- [ ] Empty states (icon + message)
- [ ] Dark-mode colors correct
- [ ] No dead code, unused imports, stale comments
- [ ] Component under 300 lines
- [ ] Math/calculations verified
- [ ] Consistent with similar patterns
- [ ] Mobile-responsive

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
7. **Apply or document migrations before moving on** — unapplied migrations cause downstream tools (Lovable) to stub working code
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

### Pull request flow

Every batch ships as a PR — the push-then-PR loop is the default for all feature branches.

1. **Push the feature branch** — `git push -u origin <branch>`.
2. **Open a PR against `main`** as ready-for-review (not draft). Body = summary + test plan + session link, per the template in this file's "Creating pull requests" section.
3. **Wait for CI by polling, not by assuming.** Call `mcp__github__pull_request_read` with `method: "get_check_runs"`. Do not assume success just because no failure webhook arrived — silent passes are common.
4. **Run the pre-merge checklist** (below) before merging.
5. **Merge** — self-merge authority applies (see below), or request human review if the checklist flags ambiguity.
6. **Sync main locally** — `git checkout main && git pull origin main` so the next branch starts from the merged state.

### Pre-merge checklist

Run through this list *after* CI returns green and *before* calling `merge_pull_request`. The Implementation Agent has self-merge authority once every box is true.

- [ ] **CI check_runs all terminal.** No `queued` / `in_progress`. Vercel Preview = `success` (or `skipped` with a documented reason). Supabase Preview = `success` or `skipped` (skips when the diff touches no `supabase/` files).
- [ ] **Tier 1 gates pass locally** — `npx tsc --noEmit`, `npm run build`, `npm run lint`, `npm test` (if tests changed). See `docs/testing-strategy.md` for the full tier map.
- [ ] **Review protocol complete** — Sized per CLAUDE.md §5. Lane 4 synthesis ran as a sub-agent, not inline. All MUST-FIX findings resolved or explicitly deferred with `[OVERRIDE: ...]` in the commit.
- [ ] **Doc sync current** — `docs/working/plan.md` progress table reflects this batch. `docs/feature-list.md` updated if a feature moved state. North-star docs still truthful.
- [ ] **Migrations applied or documented** — If the PR touches `supabase/migrations/`, either the GitHub↔Supabase integration will apply on merge (verify the preview check didn't skip), or the PR body explicitly documents manual apply steps.
- [ ] **No unresolved review threads.** Check `mcp__github__pull_request_read` with `method: "get_review_comments"` before merging. Bot-only comments (Vercel / Supabase status echoes) don't count.
- [ ] **Blast radius understood** — Read the diff one more time. A PR that seemed "docs-only" but touches `.github/workflows/`, `vercel.json`, `supabase/config.toml`, or `.mcp.json` is not docs-only; escalate if you're not sure.

If any box is false, fix first or ask the human. Never green-light a merge on a passing-but-incomplete checklist.

### Self-merge authority

The Implementation Agent may merge its own PRs when every pre-merge box is checked. No second human approval is required for:

- Doc-only PRs (changes under `docs/`, `CLAUDE.md`, `WORKFLOW.md`, `DEPLOYMENT.md`, `README.md`, `lessons-learned.md`).
- Test, scaffolding, and tooling changes under `scripts/`, `.claude/`, `supabase/functions/_shared/`, test files.
- Batch-level feature PRs that passed the review protocol and have a decomposed spec in `docs/working/batch-specs/`.

Escalate to the human instead of self-merging when:

- The PR touches auth boundaries, payment flows, RLS policies, or destructive SQL (DROP, DELETE without WHERE, TRUNCATE).
- A review lane flagged a MUST-FIX that can't be resolved without product-level input.
- The diff drifts from the batch spec and the drift isn't a pure find-and-replace.
- CI is red and you can't see a narrow, safe fix.

Always prefer `merge_method: "merge"` unless the repo convention says otherwise. Squash-merges destroy the batch-level `git log` history that Lane 3 relies on.

### Actively poll CI, don't wait on webhooks

Webhooks announce *failures* reliably; silent *successes* arrive late or not at all. After pushing, call `mcp__github__pull_request_read` with `method: "get_check_runs"` directly. This shaved 5–15 minutes per PR across the 9 merged in Round 64 Phase 4.

---

## 12. Commands + Tooling

### Local build + test

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

### Infrastructure access (from Claude Code)

| Tool | How to reach it | Reliability from sandbox |
|---|---|---|
| **Supabase MCP server** (`@supabase/mcp-server-supabase`) | Configured in `.mcp.json`; tools prefixed `mcp__supabase__*` | ✅ Works — uses `api.supabase.com` (allowlisted) |
| **Supabase CLI** (`/usr/local/bin/supabase`) | Direct invoke | ✅ Works for Management API paths (secrets, functions deploy, gen types) |
| **Supabase Management API** (curl) | `https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query` | ✅ Works — fallback when `supabase db push` can't reach the pooler |
| **Supabase Postgres pooler** (port 5432/6543) | Direct libpq / pg_dump | ❌ Blocked from sandbox allowlist — use Management API instead |
| **Anthropic API** (for edge function work) | `https://api.anthropic.com` | ✅ Works — allowlisted |
| **Vercel API / CLI** | `vercel` CLI + `VERCEL_TOKEN` | ❌ Blocked — `*.vercel.com` not on sandbox allowlist. Token saved for local use only. |
| **GitHub** | `gh` CLI / GitHub MCP tools | ✅ Works via MCP |

When the sandbox can't reach a service, escalate to the human for a dashboard action rather than looping on network errors.

### Supabase MCP tools (prefer over CLI when structured output matters)

- `mcp__supabase__execute_sql` — run any SQL, typed rows back
- `mcp__supabase__apply_migration` — applies + records in `schema_migrations` atomically
- `mcp__supabase__list_migrations`, `list_tables`, `list_extensions`, `list_edge_functions`
- `mcp__supabase__deploy_edge_function`
- `mcp__supabase__get_logs` — function logs (much cleaner than screenshotting the dashboard)
- `mcp__supabase__generate_typescript_types` — piped straight to `src/integrations/supabase/types.ts`
- `mcp__supabase__get_advisors` — security + performance lints; re-run after migrations

CLI is the escape hatch for ops the MCP doesn't expose (multi-file function uploads via `--use-api`, one-off shell piping).

### Credential tiers

Three tiers, matched to risk:

| Tier | Where it lives | What belongs here |
|---|---|---|
| 1 — Committed | Git (never) | **Nothing.** All refs to secrets in `.mcp.json`, `config.toml` etc. use `${VAR}` expansion. |
| 2 — Developer machine | `.claude/settings.local.json` (gitignored) | `SUPABASE_ACCESS_TOKEN` (PAT), `VERCEL_TOKEN` (PAT), `SUPABASE_PROJECT_REF`, `SUPABASE_URL`. Revocable, scoped to your own account. |
| 3 — Platform secret store | Supabase Edge Function Secrets, Vercel Env Vars | `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `WEATHER_API_KEY`, `CRON_SECRET`, `ANTHROPIC_API_KEY`, `GOOGLE_OAUTH_CLIENT_SECRET`. Production-privileged; never on dev machines. |

`.claude/settings.local.json`'s `env` block populates Claude Code's process env at startup and is inherited by every tool, MCP server, Bash call, and hook. The template is `.claude/settings.local.example.json` (committed).

### Session-start checklist

1. **Locally (persistent):** `.claude/settings.local.json` is already populated — tools read from it automatically.
2. **In the web sandbox (ephemeral):** the sandbox filesystem resets each session, so `.claude/settings.local.json` doesn't survive. Paste credentials once per new sandbox — either re-create `.claude/settings.local.json` or `export` in a shell. Same friction either way; web sandboxes don't persist user state.
3. Verify Supabase CLI exists at `/usr/local/bin/supabase` — if missing, `npm install -g supabase`.
4. Read `docs/working/plan.md` → Session Handoff section.
5. If a tier-3 secret is needed ephemerally (one-time rotation, smoke test), source a scratch file and delete after use. Never add tier-3 secrets to `.claude/settings.local.json`.

### Slash Commands (`.claude/commands/`)

Use these to automate repetitive workflow steps. They work in both terminal and web sessions.

| Command | When to use |
|---------|-------------|
| `/start-round` | **Entry point for every polish session.** Reads context, sets up branch, creates plan, begins feature audits. |
| `/polish-feature` | **Core inner loop.** Audits one feature against 10-point checklist, fixes issues, commits. |
| `/new-batch` | Creates a batch spec from template for the next incomplete batch. |
| `/review-batch` | Runs the standard code review on the last commit per Section 5. |
| `/commit-push` | Pre-computes git context, stages, commits with proper message, pushes. |

**Usage pattern for polish rounds:**
1. Start session → `/start-round`
2. For each feature → `/polish-feature <number> "<description>"`
3. After fixes → `/commit-push`
4. After commit → `/review-batch`
5. Repeat until context reaches 60%

### Sub-Agents (`.claude/agents/`)

Reusable agent definitions that can be spawned automatically or manually. Prefer these over writing ad-hoc review prompts.

| Agent | Purpose |
|-------|---------|
| `batch-reviewer` | Standardized review (spec + bugs). Has **known-patterns section** to reduce false positives on `as any` casts, cancel pattern, SECURITY DEFINER. |
| `build-validator` | Runs `tsc --noEmit` + `npm run build`, reports errors. |
| `code-simplifier` | Post-implementation sweep for dead code, over-engineering, extraction opportunities. |
| `polish-auditor` | Full 10-point feature maturity checklist audit. |

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
- Commit only what the batch spec says; out-of-scope discoveries go to `lessons-learned.md` (Suggestions section), not into the diff
- **Never put API keys in `VITE_` variables.** Client-side env vars are bundled into the browser. Any third-party API call with a secret goes in an Edge Function.
- **Dark mode colors:** Never use light-mode Tailwind colors (`bg-green-100`, `text-green-600`) in a dark-first theme. Use dark variants (`bg-green-900/40`, `text-green-400`).
- **Default unauthenticated users to `null`**, never to a permissioned role like "operator".

---

## 14. Suggestions & Agent Signals

Suggestions and agent signals are logged in `lessons-learned.md` (Suggestions section at the bottom). This file lives at the project root.

### What to log

- **Product suggestions** — Feature ideas, UX gaps, optimization opportunities noticed during implementation.
- **Workflow suggestions** — Process improvements, review system changes, tooling ideas.
- **Agent Signals** — Observations about lane effectiveness, scoring calibration, context consumption. Include specific numbers.

### Rules

- **Keep entries brief** — 1-2 sentences with specific data. This is a 30-second append, not a report.
- **Always include the date and source** for traceability.
- **Do not stop work to write suggestions** — append at the end of a batch, during the suggestion step.
- **Agent Signals are data, not opinions** — include numbers, counts, and specific examples.

---

## Context Reading Cadence

| What to read | When |
|---|---|
| `docs/masterplan.md` + all available north star docs | Start of every session |
| `lessons-learned.md` | Start of every session |

| Current phase section from `FULL-IMPLEMENTATION-PLAN.md` | Start of each phase (first batch of a new phase) |
| `docs/working/plan.md` (Session Handoff section first) | Start of each batch |
| Batch spec from `docs/working/batch-specs/` | Before coding each batch |

When north star docs are current, Claude makes informed decisions. When they're stale, decisions are made on bad information that compounds silently across batches.

---

## Round Cleanup (Non-Negotiable)

A **Round** is the execution of an entire `FULL-IMPLEMENTATION-PLAN.md` file — all phases from start to finish. Each round is a top-to-bottom build or refresh of the app: the first round builds the foundation, subsequent rounds polish, harden, add features, and improve what was built. Rounds are designed to be large-scope, running for hours or days if needed.

When the last phase in a round completes, perform these cleanup steps before closing out:

### 1. Archive the working folder
Move `docs/working/plan.md` and `docs/working/batch-specs/*` to `docs/archive/[kebab-name]-[YYYY-MM-DD]/`. The working folder should be empty after this step.

### 2. Clean up `docs/upcoming/`
Only `TODO.md` and `FULL-IMPLEMENTATION-PLAN.md` should remain. The implementation plan stays as a record of what was executed.

### 3. Update `docs/upcoming/TODO.md`
Append any human action items discovered during execution — API keys, external service setup, manual configuration, deployment steps, or decisions the agent could not make autonomously. Use the format defined in `TODO.md`.

### 4. Final doc sync
Update `docs/feature-list.md` with final statuses for all features touched during the round. Verify consistency across north star docs.

### 5. Report context level
Run `/context` and report the result to the user. This helps calibrate session management and context consumption patterns across rounds.

### Why this matters
Without cleanup, stale files accumulate across rounds — working folders contain orphaned specs and human action items get lost. The cleanup step ensures the repo is ready for the next round.

---

## Human Action Items (`docs/upcoming/TODO.md`)

### Purpose
Agents encounter work during execution that requires human involvement — API keys, external service configuration, deployment steps, business decisions. Rather than blocking or silently skipping these, agents append items to `docs/upcoming/TODO.md`. Items persist across phases and rounds.

### Rules
1. **Append, don't block.** If you encounter something that needs human action, add it to `TODO.md` and continue execution.
2. **Be specific.** Include what needs to be done, why, and what is blocked until it's resolved.
3. **Include the source.** Tag each item with the phase/batch it came from.
4. **Never delete items.** Only the human moves items to the "Resolved" section.
5. **Read at session start.** Check `TODO.md` at the start of each session to see if any blockers have been resolved.

### Format
```markdown
### YYYY-MM-DD — [Source Phase/Batch or Context]
- [ ] Action item description
  - **Why:** Brief explanation
  - **Blocked:** What is blocked (or "Nothing blocked")
```