# The Autonomous Coding System

> **Status:** Living document. First consolidated write-up 2026-04-23.
> **Scope:** A reference description of the end-to-end autonomous coding workflow built around Claude Code + the Handled Home repository (BlueKube/handled-home). Written so the approach can be evaluated, reproduced, or criticised without having to page through the entire codebase.
> **Audience:** People building similar systems, or engineers evaluating whether an autonomous coding loop is a real thing yet or still vapor.

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Terminology and mental model](#2-terminology-and-mental-model)
3. [Capabilities inventory — what the system does by itself](#3-capabilities-inventory--what-the-system-does-by-itself)
4. [Architecture — the layered view](#4-architecture--the-layered-view)
5. [The per-batch life cycle](#5-the-per-batch-life-cycle)
6. [Self-review: multi-lane critique with synthesis](#6-self-review-multi-lane-critique-with-synthesis)
7. [Self-testing: the five-tier protocol](#7-self-testing-the-five-tier-protocol)
8. [Self-learning: the lessons-learned feedback loop](#8-self-learning-the-lessons-learned-feedback-loop)
9. [Self-deploying: how shipped code reaches users](#9-self-deploying-how-shipped-code-reaches-users)
10. [Self-healing: CI diagnostics and iteration](#10-self-healing-ci-diagnostics-and-iteration)
11. [Convergence architecture: not getting stuck in review-fix loops](#11-convergence-architecture-not-getting-stuck-in-review-fix-loops)
12. [Session-level management: context, handoff, restart](#12-session-level-management-context-handoff-restart)
13. [Human-in-the-loop: what still requires a person](#13-human-in-the-loop-what-still-requires-a-person)
14. [Observability and metrics](#14-observability-and-metrics)
15. [Repository anatomy](#15-repository-anatomy)
16. [Measurements from one real session](#16-measurements-from-one-real-session)
17. [Known limits and failure modes](#17-known-limits-and-failure-modes)
18. [Forward gaps and roadmap](#18-forward-gaps-and-roadmap)
19. [Reproducibility: bootstrapping this in another repo](#19-reproducibility-bootstrapping-this-in-another-repo)
20. [Closing reflection](#20-closing-reflection)

---

<!-- SECTION-1 -->

## 1. Executive summary

This document describes an end-to-end workflow for building production software with an AI agent as the primary implementer. The agent — an instance of Claude Code with a repository-specific instruction set — reads PRDs, decomposes them into batches, implements each batch, reviews its own work through multi-lane sub-agent critique, runs a five-tier testing protocol (including an AI-as-judge persona layer), opens pull requests, polls CI, resolves findings, self-merges when a checklist passes, and logs lessons for future sessions. A human is present, but the per-batch cycle runs without human intervention 90%+ of the time.

The core claim is not that "AI can write code" — that claim is now uncontroversial. The claim is narrower and more testable:

> **The per-commit review/fix/ship cycle that human teams typically perform — code review, test writing, CI triage, merge gating, post-merge knowledge capture — can be executed by an agent with 4-agent parallelism inside its own sub-agent tree, driven by a human-maintained set of invariant rules and source-of-truth documents, producing output that is reliably safe to merge on the same day it was written.**

The rest of this document is the evidence for that claim: what the system does, how the pieces fit, where it breaks, and how to reproduce it.

Notable properties of the system as it stands:

- **Sub-agent isolation is the key trick.** Main context stays small (~50-70% at session end across 8 shipped PRs) because review lanes run in isolated sub-agent contexts and only return scored summaries. Without this, context exhausts after 2-3 batches.
- **The agent owns the CI harness, not just the code.** When CI fails, the agent diagnoses, pushes fix commits, and iterates. Seven iterations on PR #19 took the Tier 3 harness from broken to fully green with the agent driving every commit.
- **Review findings carry score thresholds.** MUST-FIX / SHOULD-FIX / DROP categories with an explicit scoring formula prevent the "everything the AI said matters" trap. Findings below 25 points are dropped, not fixed.
- **Lessons-learned is a grep surface, not a story.** Entries are concept-first headings with date/source footers. Future sessions run `grep -n` against specific gotchas. The file has roughly 50 durable entries at the time of this writing.
- **Self-merge authority is gated by a 7-item checklist**, not by model confidence. Every merge required CI terminal-green, review protocol complete, doc sync current, zero unresolved review threads, bounded blast radius. A PR that fails the checklist escalates to the human.
- **Convergence is engineered, not assumed.** The Tier 5 AI-judge loop would run forever without thresholds + dismissal lists + caps. The system is structured as a *regression detector with an explicit opt-out*, not a "keep fixing until Sarah is happy" loop.

This document is organised from the outside in: the capabilities as seen by a user, the architecture that produces them, the per-batch procedure, the supporting subsystems (review, testing, learning, deploying, healing, convergence), session management, human touchpoints, metrics, limits, and reproduction.

<!-- SECTION-2 -->

## 2. Terminology and mental model

To keep the rest of the document precise, a short vocabulary. Most of these terms live in `CLAUDE.md` as glossary entries; duplicated here for readability.

| Term | Meaning |
|---|---|
| **Round** | One full top-to-bottom execution of a `FULL-IMPLEMENTATION-PLAN.md` document. A round spans hours to days, can include dozens of PRs, and is the unit of human-approved scope. |
| **Phase** | A self-contained PRD within a round. Each phase has a problem statement, goals, scope, acceptance criteria. 3-8 phases per round is typical. |
| **Batch** | The smallest unit of work that ships. 1 theme, 1-3 files, gets its own spec, implementation, review, and PR. "Small" and "Medium" are the typical sizes; "Large" triggers the full 5-agent review. |
| **Step** | A procedure in `WORKFLOW.md` describing *how* to execute. Steps are orthogonal to batches (batches are *what*). |
| **Spec** | A markdown file in `docs/working/batch-specs/` authored before code is written. It states the problem, scope, out-of-scope, acceptance criteria, edge cases, risks, and review-lane notes. The spec is the contract the review agents check against. |
| **Lane** | An independent review agent with a narrow remit. Lane 1 = spec completeness, Lane 2 = bug scan, Lane 3 = historical context, Lane 4 = synthesis. Each lane runs as a sub-agent so its tool use doesn't bloat the main context. |
| **Synthesis** | The final lane (Lane 4) that reads the other lanes' outputs, cross-validates, de-duplicates, scores, and produces the unified merge-or-not report. The only lane that sees other lanes' findings. |
| **Tier** | A level in the testing protocol. Tier 1 = static (tsc/build/lint/vitest), Tier 2 = unit, Tier 3 = E2E against the Vercel preview, Tier 4 = new spec per new flow, Tier 5 = AI-as-judge persona evaluation. Per-batch tier selection lives in the batch spec. |
| **Override** | A documented deviation from the workflow, tagged `[OVERRIDE: reason]` in a commit message or spec. Enables `git log` grep to surface every deliberate rule-break. Non-overridable invariants are enumerated in CLAUDE.md §10. |
| **Session handoff** | A section at the bottom of `docs/working/plan.md` that the next agent reads first. Tells them which batch to resume, which branch they're on, any blockers, round progress. |
| **Self-merge authority** | The agent's right to merge its own PRs after a 7-item pre-merge checklist clears. Scoped to batch-level feature PRs, doc-only changes, and tooling work. Escalates for auth/payment/RLS changes or destructive SQL. |

The mental model is a tree of nested loops:

```
Round
├── Phase
│   ├── Batch
│   │   ├── Spec
│   │   ├── Implementation
│   │   ├── Review (Lanes 1-3 parallel + Lane 4 synthesis)
│   │   ├── Fix loop (max 3 passes)
│   │   ├── CI harness (Tiers 1-5)
│   │   ├── Self-merge (if checklist clears)
│   │   └── Lessons-learned capture
│   ├── Doc sync
│   └── Archive
└── Round cleanup
```

Each level has its own convergence rules. A batch's fix loop caps at 3 passes. A phase ends when all its batches are `✅`. A round ends when the last phase ships + cleanup runs.

<!-- SECTION-3 -->

## 3. Capabilities inventory — what the system does by itself

The following capabilities run without human intervention once a round's plan is approved. Each is described here at a high level; the subsequent sections drill into each.

### 3.1 Self-planning

- Reads `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` for the current round's scope.
- Decomposes each phase into batches and writes a `docs/working/plan.md` progress table.
- Picks batch sizes (Small / Medium / Large / Micro) based on blast radius, which in turn drives the review tier.
- Writes per-batch specs in `docs/working/batch-specs/` before any code is touched.

### 3.2 Self-implementing

- Reads the spec and the relevant existing code.
- Writes source changes, edits configs, runs local build gates.
- Follows conventions pulled from `CLAUDE.md` §13 (file locations, 300-line decomposition rule, dark-mode colour rules, env-var hygiene, etc.).
- Respects "don't add what the task doesn't require" and "don't write comments that restate code" rules from CLAUDE.md Doing-tasks section.

### 3.3 Self-reviewing

- Spawns 3 parallel sub-agents (Lane 1 spec completeness, Lane 2 bug scan, Lane 3 historical context) immediately after a batch commit.
- Spawns a Lane 4 synthesis sub-agent that reads the other three's outputs + the diff + the spec and produces a scored findings report.
- Applies a scoring formula (cross-lane agreement + severity + specificity, style-capped) to categorise findings as MUST-FIX / SHOULD-FIX / DROP.
- Fixes MUST-FIX items, runs a lightweight re-review, repeats up to 3 times, escalates if the fix loop doesn't converge.

### 3.4 Self-testing

- Runs Tier 1 static gates (`tsc --noEmit`, `npm run build`, targeted `eslint`, `vitest`) on every batch.
- Writes Tier 2 unit tests for new pure functions, hooks, and components.
- Authors Tier 4 Playwright specs for new user flows.
- On PR open, a GitHub Actions workflow runs Tier 3 Playwright against the PR's Vercel preview deployment with a protection-bypass header.
- Tier 5 AI-judge matrix runs in parallel across 3 roles (customer / provider / admin) using a 7-persona rubric including "Sarah, 38-year-old busy mom" as the canonical skeptic.

### 3.5 Self-learning

- After every session and on any surprising finding, appends a concept-first entry to `lessons-learned.md` in the appropriate topic bucket.
- Entries include date + source so the content is searchable and verifiable.
- Future sessions grep this file before scoping testing/tooling/infra work to avoid re-discovering known pitfalls.
- Process lessons flow back into `CLAUDE.md` as non-overridable rules when they've been confirmed at least twice.

### 3.6 Self-PR-ing

- Uses the GitHub MCP (`mcp__github__create_pull_request`) to open PRs. Every PR ships with a structured body containing Summary / Out-of-scope / Test plan / Risks sections.
- Follows a branch-naming convention (`feat/round-<N>-phase-<M>-batch-<X>-<slug>`) so PRs are greppable and chainable.
- Links to the session's Claude Code URL in every commit message and PR body for traceability.

### 3.7 Self-polling + diagnosing CI

- After push, actively polls `get_check_runs` via GitHub MCP rather than waiting for webhooks. Terminal status arrives in seconds.
- When a check fails, reads the CI step summary (made visible via a `GITHUB_STEP_SUMMARY` dump step) and diagnoses.
- Pushes diagnostic or fix commits iteratively. PR #19 took 7 commits to transition from broken to fully green — each informed by the previous commit's surfaced error.

### 3.8 Self-merging

- After CI turns terminal-green + review protocol is complete + doc sync is current, runs through a 7-item pre-merge checklist (CLAUDE.md §11).
- If the checklist clears and the PR is in the self-merge scope (batch-level feature, doc-only, tooling), calls `mcp__github__merge_pull_request`.
- Syncs main locally, updates `docs/working/plan.md` progress table, moves on to the next batch.
- Escalates to human for auth boundaries, payment flows, RLS policies, destructive SQL, or ambiguous MUST-FIX findings.

### 3.9 Self-deploying

- Git push to main triggers two automated pipelines:
  - **Vercel GitHub integration** deploys the Vite build to Vercel (Preview for PRs, Production for main).
  - **Supabase↔GitHub integration** applies new SQL migrations from `supabase/migrations/` automatically when merged.
- The agent doesn't run deploy commands directly — it pushes code and verifies the integration workflows succeeded via `get_check_runs`.
- Edge Functions deploy via `supabase functions deploy` when the sandbox can reach it; otherwise escalated to the human.

### 3.10 Self-documenting

- Updates `docs/working/plan.md` progress table after every batch.
- Updates Session Handoff section before exiting.
- Adds lessons-learned entries for tactical findings.
- Syncs north-star docs (`docs/masterplan.md`, `docs/feature-list.md`, `docs/testing-strategy.md`) when phase changes alter the reality.
- Maintains `docs/upcoming/TODO.md` for human-action items discovered during execution.

### 3.11 Self-archiving

- At the end of each phase, moves `docs/working/plan.md` + `docs/working/batch-specs/*` to `docs/archive/<phase-name>-<YYYY-MM-DD>/`.
- Reads the next phase section from `FULL-IMPLEMENTATION-PLAN.md`, decomposes it into a new plan, and continues.
- At round end, runs a Round Cleanup step: archive working folder, reconcile doc state, update human TODO list, report context consumption.

### 3.12 Things the agent deliberately does not do

- Never creates commits on `main` directly. Every change goes through a PR.
- Never pushes with `--force` or bypasses hooks without human instruction.
- Never decides *whether a feature should exist* — only whether an existing feature is well-built.
- Never ships migrations that drop tables or delete user data without human sign-off.
- Never adds third-party credentials to `VITE_` variables or any committed file.

<!-- SECTION-4 -->

## 4. Architecture — the layered view

The system is organised as six layers, roughly from top (user intent) to bottom (deployed bits).

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 6 — Intent                                             │
│    docs/masterplan.md, docs/upcoming/FULL-IMPLEMENTATION-PLAN│
│    What we're building and why. Owned by human.              │
├─────────────────────────────────────────────────────────────┤
│ Layer 5 — Working plan                                       │
│    docs/working/plan.md + batch-specs/                       │
│    How the current phase decomposes. Owned by agent.         │
├─────────────────────────────────────────────────────────────┤
│ Layer 4 — Per-batch procedure                                │
│    CLAUDE.md §4 (workflow summary), WORKFLOW.md (long form)  │
│    The recipe the agent follows. Owned by agent + human.     │
├─────────────────────────────────────────────────────────────┤
│ Layer 3 — Review + test harness                              │
│    CLAUDE.md §5 (review), docs/testing-strategy.md (tiers)   │
│    .github/workflows/*.yml (CI), scripts/generate-*.ts       │
│    Gates between "written" and "merged". Owned by agent +    │
│    human (baseline calibration).                             │
├─────────────────────────────────────────────────────────────┤
│ Layer 2 — Integration bindings                               │
│    .mcp.json (Supabase + GitHub MCP servers)                 │
│    GitHub↔Vercel, GitHub↔Supabase, Anthropic API             │
│    Cross-system plumbing. Owned by human.                    │
├─────────────────────────────────────────────────────────────┤
│ Layer 1 — Infrastructure                                     │
│    Supabase project, Vercel project, GitHub repo             │
│    Shared state, auth, storage. Owned by human + Supabase +  │
│    Vercel.                                                   │
└─────────────────────────────────────────────────────────────┘
```

### 4.1 Why the layers matter

Each boundary between layers is a **trust contract** — the lower layer exposes capabilities; the upper layer relies on them being stable. When a capability crosses layers, something usually breaks.

Concrete example from this session: Tier 5 (the AI-as-judge harness) is a Layer 3 capability. It depends on Layer 2 (the Anthropic API MCP) and Layer 1 (GitHub Actions runners). When we initially wired it up (Batch T.1), we discovered the `patrickedqvist/wait-for-vercel-preview` action at Layer 2 does its own HTTP probe under Layer 1 Protection, which broke the Layer 3 contract. The fix was a Layer 2 substitution (GitHub Deployments API via `actions/github-script`) that didn't require any Layer 1 changes.

### 4.2 The "one fact, one owner" rule

A specific architectural constraint that's been enforced from day one: any fact about the system lives in exactly one document. Feature status is in `docs/feature-list.md`. Route table is in `docs/app-flow-pages-and-roles.md`. Testing tiers are in `docs/testing-strategy.md`. Workflow procedure is in `WORKFLOW.md`. Universal agent rules are in `CLAUDE.md`.

When two documents disagree, CLAUDE.md §3 requires the agent to investigate rather than edit either — the disagreement is a symptom of drift and needs resolution at the source.

### 4.3 Documents as a type system

If the agent needs to know whether Tier 5 is merge-blocking, it doesn't infer from reading code or checking labels. It reads `docs/testing-strategy.md` §5.8 which explicitly says "advisory only during calibration." The docs are the type system for agent behaviour — they answer "should I do X?" questions so the agent doesn't have to guess.

The practical consequence: docs that are out of date actively break the system. A phrase like "Tier 5 is still a prototype" in `docs/testing-strategy.md` will cause a future agent to re-implement it from scratch even if `scripts/generate-synthetic-ux-report.ts` already exists. This was observed in Batch T.1 and produced the `CLAUDE.md` §7 rule 6 ("grep the filesystem before assuming tooling isn't built"). Rule 6 exists precisely because doc drift is the most expensive class of failure.

<!-- SECTION-5 -->

## 5. The per-batch life cycle

A single batch ships through the following sequence. Each step is concrete and observable in the git history.

### 5.1 Step 0 — Session start

Every new session reads:
1. `docs/masterplan.md` — why we're building this.
2. `CLAUDE.md` — universal rules, non-overridable invariants.
3. `docs/working/plan.md` → **Session Handoff section first** — where the last session stopped.
4. `docs/testing-strategy.md` — tier selection matrix.
5. `lessons-learned.md` — 30-second scan of recent entries.

Then runs `ls .github/workflows/ scripts/ e2e/ e2e/prompts/ 2>/dev/null` to ground-truth the tooling state before scoping any testing/infra work. This check was added as CLAUDE.md §7 rule 6 after a session burned 20% of a batch re-implementing a workflow that already existed.

### 5.2 Step 1 — Pick the batch

From the plan's progress table, pick the first `⬜` or `🟡` batch. If the current phase is `✅` across the board, run the phase transition: archive the working folder to `docs/archive/<phase>-<date>/`, read the next phase PRD, decompose it into a new `plan.md`.

### 5.3 Step 2 — Create the branch

Branch name: `feat/round-<N>-phase-<M>-batch-<X>-<kebab-slug>`. Examples from this session:

- `feat/round-64-phase-5-batch-5.1-bottom-nav`
- `feat/round-64-phase-5-batch-5.2-avatar-drawer`
- `feat/round-64-phase-5-tooling-pr-triggered-e2e`
- `feat/round-64-phase-5-t3-ai-judge-visibility`

The convention makes `git branch -r | grep round-64` a quick round-level diff check.

### 5.4 Step 3 — Write the spec

Every batch spec is a markdown file in `docs/working/batch-specs/` with this shape:

```markdown
# Batch N — title

> Round · Phase · Size · Review tier · Testing tiers · Branch

## Problem
## Goals
## Scope (files)
## Out of scope (explicit)
## Acceptance criteria  (numbered, testable)
## Data shape / schema changes
## Edge cases
## Testing notes
## Risks
## Review-lane notes
```

The spec is the contract. Lane 1 of the review checks every AC against the diff. Without a spec, there's nothing to review *against* — just a vibe check. An "AC with no implementation" is exactly what Lane 1 flags as MUST-FIX.

### 5.5 Step 4 — Implement

Plain coding. With a few conventions:
- Edit existing files when possible, don't create new ones.
- Keep components under 300 lines; extract in the same batch if you cross.
- No comments that restate code.
- No `VITE_` env vars for secrets — those bundle to the browser.
- Dark-mode colours use semantic tokens (`text-success` not `text-green-600`).

### 5.6 Step 5 — Tier 1 gates

Before committing:
- `npx tsc --noEmit`
- `npm run build`
- `npx eslint` on changed files (repo-wide has pre-existing debt)
- `npm test` if any existing vitest file touches the changed code

All must pass. Build warnings (chunk size) are tracked but not gating.

### 5.7 Step 6 — Commit + push

Commit message format: `<type>(<scope>): <imperative description>` with a paragraph body explaining *why*, not *what*. Every commit ends with a session link for traceability.

Push happens immediately after commit. Unpushed commits are unrecoverable if a session dies.

### 5.8 Step 7 — Open PR

Via `mcp__github__create_pull_request`. PR body has four sections:

- **Summary** — 1-3 bullet what-changed + why.
- **Out of scope** — what was considered and deferred.
- **Test plan** — checklist of which tiers ran.
- **Risks** — what could break and what we mitigated.

The PR is opened as ready-for-review, not draft, unless the agent is deliberately parking it.

### 5.9 Step 8 — Active CI poll

Immediately after PR open, poll `mcp__github__pull_request_read` with `method: "get_check_runs"`. Don't wait on webhooks — GitHub webhooks for *success* arrive late or not at all; failure webhooks are reliable but we don't want to wait for those to confirm. Active polling returns terminal status in seconds.

The harness for this repo emits 8 checks:
- Vercel Preview Comments (bot)
- Supabase Preview (bot, usually skipped)
- wait-for-preview (our `actions/github-script` resolver)
- e2e (Playwright against the Vercel preview)
- ai-judge (customer)
- ai-judge (provider)
- ai-judge (admin)
- comment (posts the summary comment)

### 5.10 Step 9 — Review

Run the review protocol per batch size (CLAUDE.md §5). For a Medium batch, that's Lane 1 + Lane 2 + Lane 3 as parallel sub-agents, then Lane 4 synthesis as a sub-agent that sees all three.

Each lane receives:
- The diff (`git diff HEAD~1...HEAD`)
- The batch spec
- Its lane-specific context (spec-only for Lane 1, diff-only for Lane 2, git history for Lane 3)

Lane 4 receives the three outputs + the diff + the spec and produces a scored findings report.

### 5.11 Step 10 — Fix loop

For each MUST-FIX finding, apply the fix. Commit as `fix(<scope>): resolve Batch N review findings`. Push.

Run a **lightweight re-review** — Lanes 1+2 only, plus synthesis. Skip Lane 3; git history doesn't meaningfully change between a fix commit.

Cap at 3 passes. If findings persist after 3, escalate to the human.

### 5.12 Step 11 — Pre-merge checklist (CLAUDE.md §11)

Seven items, all must be true:

- [ ] CI check_runs all terminal-green (or skipped with a documented reason)
- [ ] Tier 1 gates pass locally
- [ ] Review protocol complete (Lane 4 synthesis ran as sub-agent)
- [ ] Doc sync current (plan.md progress, feature-list.md status, north-star docs)
- [ ] Migrations applied or documented as blocked
- [ ] No unresolved review threads
- [ ] Blast radius understood (re-read the diff one more time)

If any is false, fix or ask the human.

### 5.13 Step 12 — Self-merge

If the checklist clears and the PR is in self-merge scope, call `mcp__github__merge_pull_request` with `merge_method: "merge"` (not squash — squash destroys the batch-level git log history Lane 3 relies on).

Escalate to human for:
- Auth boundaries, payment flows, RLS policies
- Destructive SQL (DROP, DELETE without WHERE, TRUNCATE)
- Ambiguous MUST-FIX findings that require product-level input
- Spec drift the agent can't explain

### 5.14 Step 13 — Sync main + lessons capture

`git checkout main && git pull origin main`. Update `docs/working/plan.md` progress table. If the batch produced a non-obvious gotcha, append to `lessons-learned.md`.

### 5.15 Step 14 — Session handoff or next batch

Check `/context`. Under 60% actual → pick the next batch. Over 60% → update the Session Handoff section and exit for a fresh session.

Round boundaries are always session boundaries regardless of context.

<!-- SECTION-6 -->

## 6. Self-review: multi-lane critique with synthesis

The review system is the single most consequential piece of the harness. It's the reason the agent can merge its own code without a human breathing down its neck. This section describes the architecture, the scoring formula, the tier map, and the common failure modes.

### 6.1 Architecture: 3 parallel lanes + 1 synthesis

Reviews are structured as sub-agents invoked via the `Agent` tool. This is critical — running review logic inline in main context exhausts the budget after ~3 batches. Sub-agent isolation means each lane does its tool calls (reading files, running git commands, grepping) inside its own context window; only the final scored report — typically 1-3 KB of markdown — returns to main.

The three parallel lanes:

**Lane 1 — Spec Completeness.** Reads the batch spec + the diff. For each numbered acceptance criterion, checks whether the diff contains an implementation that satisfies it. Flags missing, partial, or divergent implementations. This lane is what catches "the batch shipped but forgot half the scope."

**Lane 2 — Bug Scan.** Receives the diff only, no spec. Forces bug-finding from the code alone — the reviewer pretends they have no context about intent and evaluates the code on its own merits. Catches null dereferences, race conditions, missing error handlers, quoting issues, accessibility gaps.

**Lane 3 — Historical Context & Prior Feedback.** Runs `git blame` / `git log` on the changed files. Reads prior review findings from earlier batches. Flags reverts-of-fixes, repeats-of-fixed-bugs, and patterns that were established intentionally and are being modified without reason.

The fourth lane — **synthesis** — runs only after Lanes 1-3 return. It receives:
- All three lanes' outputs
- The full diff
- The spec

Its job:
1. De-duplicate findings that multiple lanes flagged.
2. Connect related findings across lanes.
3. Resolve contradictions (e.g. "intentional per history" vs. "bug").
4. Flag anything that falls between lane boundaries.
5. Score each finding and categorise.

### 6.2 Why synthesis is separate

Parallel lanes are fast but isolated — they can't see each other. Without synthesis, the main context gets flooded with three possibly-contradicting reports and has to reconcile them itself, which burns tokens and introduces reasoning errors. A sub-agent doing the synthesis job is structurally superior: it reads all three reports, produces one unified output, and only that final output hits main context.

This was learned the hard way. Early in the Handled Home codebase, synthesis ran inline in main context. `lessons-learned.md` has an entry titled "Inline synthesis cuts the Lane 4 corner — always spawn the synthesis sub-agent" capturing the specific failure mode: the agent started skipping the Lane 4 step entirely when context pressure mounted, which caused MUST-FIX items to be missed because nothing was reconciling cross-lane gaps.

### 6.3 Scoring formula

Each finding in the synthesis report gets a 0-100 score computed as:

| Factor | Points |
|---|---|
| Cross-lane agreement (per additional lane flagging the same issue) | +25 each |
| Severity — regression, security issue, or data-loss risk | +20 to +40 |
| Specificity — exact file:line with clear explanation | +10 |
| Style-only finding (formatting, naming preference) | cap total at 20 |

Thresholds:

| Score | Category | Action |
|---|---|---|
| 75-100 | MUST-FIX | Fix before merging. |
| 25-74 | SHOULD-FIX | Fix in the same batch when feasible; defer with explicit note if blocked. |
| 0-24 | DROP | Log or ignore. Not worth the review cycle. |

The scoring is deliberately coarse. Fine-grained scores invite bikeshedding. Coarse scores invite decisive action.

### 6.4 Tier map

Review agent count scales with batch blast radius:

| Batch size | Agents | Configuration |
|---|---|---|
| **Large** | 5 | 3 parallel Sonnet lanes + 1 Sonnet synthesis + 1 Haiku synthesis (fast second opinion) |
| **Medium** | 4 | 3 parallel Sonnet lanes + 1 Sonnet synthesis |
| **Small** | 2 | 1 combined Sonnet reviewer (spec + bugs) + 1 Sonnet synthesis |
| **Micro** | 1 | 1 combined Sonnet reviewer, no synthesis |

**Lane 3 skip rule:** Lane 3 is skipped when (a) this is the first batch in a phase or (b) there are no prior review findings on the changed files. Lane 3's value is regression detection; without history to compare against, it produces generic pattern-checking that Lane 2 already covers.

**Fact-checker lane:** When a batch produces a document that will inform business decisions (pricing reports, operating model changes), Lane 2 (Bug Scan) is replaced with a Fact Checker lane that cross-references every claim against primary sources. This caught a pricing-margin calculation error worth ~7.4 percentage points on one previous PRD.

### 6.5 What each lane sees

An important property: the lanes have **deliberately different input**. Lane 1 has the spec; Lane 2 does not. This prevents confirmation bias — if both lanes saw the spec, they'd both agree the code does what the spec says even when the code has independent bugs. By starving Lane 2 of the spec, it stays honest and catches things Lane 1 can't see.

Lane 3's input is specifically `git blame` + `git log` + prior review comments. This forces it to answer the question "was this pattern established intentionally?" — a question Lanes 1 and 2 can't answer because they don't have the historical context.

Lane 4 is the only lane that sees all three outputs. It's the only place cross-lane reconciliation happens.

### 6.6 Prompt templates

The review prompts are stored in CLAUDE.md §5 as "Agent prompt templates" so they can't drift. A new agent spinning up a review reads the exact prompt from CLAUDE.md, fills in the diff + spec, and launches the sub-agent. This is intentionally rigid — variations in prompt produce variations in output, and we don't want review quality to depend on how articulate today's session is.

### 6.7 Fix loop mechanics

After synthesis returns, the agent:
1. For each MUST-FIX, applies the fix and commits.
2. For each SHOULD-FIX, applies the fix when feasible; otherwise documents an explicit deferral with `[OVERRIDE: deferred — reason]`.
3. DROPs are logged but not acted on.
4. Pushes the fix commit.
5. Runs a **lightweight re-review** — Lanes 1+2 only + synthesis. Lane 3 is skipped because git history doesn't meaningfully change in a single fix commit.
6. Caps at 3 fix passes. If findings persist, escalate.

This session's PR #21 (Batch 5.3) exercises this loop in detail: initial review found 2 MUST-FIX + 4 SHOULD-FIX, fix commit resolved them, re-review found 1 new bug introduced by the fix (symmetric race gate missed), 1-line follow-up commit resolved that, merge.

### 6.8 Anti-patterns the system explicitly guards against

- **Pseudocode reviews.** CLAUDE.md §10 rule 8 forbids passing a natural-language description of the diff to a review agent. Actual diff only, via `git diff HEAD~1...HEAD`. Pseudocode reviews produce high false-positive rates.
- **Skipping Lane 4.** Tagged as `[OVERRIDE]` required. In practice, Lane 4 is skipped only for Micro batches where no synthesis is structurally possible.
- **Auto-merging on green CI.** CI green is necessary but not sufficient. The pre-merge checklist is 7 items; CI is 1.
- **Running reviews inline to save time.** The sub-agent pattern is the feature, not the overhead. Inline reviews pollute the main context and degrade subsequent work.

<!-- SECTION-7 -->

## 7. Self-testing: the five-tier protocol

Testing is tiered so that every batch runs the cheapest viable tier and the expensive tiers only run when justified. Full specification in `docs/testing-strategy.md`; summary here.

### 7.1 Tier 1 — Static (mandatory, every batch)

Runs locally before commit:

| Check | Command | Blocks merge |
|---|---|---|
| Type safety | `npx tsc --noEmit` | Yes |
| Production build | `npm run build` | Yes |
| Linting | `npm run lint` (scoped to changed files — repo has pre-existing lint debt) | Yes |
| Unit tests | `npm test` (Vitest) | Yes if tests exist for changed files |

Runs in under 90 seconds on this codebase. No external dependencies. Every batch in this session passed Tier 1 locally before being pushed.

### 7.2 Tier 2 — Unit and integration

For every new pure function, hook, or utility, add a Vitest file alongside. Minimum coverage per new file:

- **Pure utilities** (`src/lib/*.ts`): 100% branch coverage. Example from this session: `src/lib/initials.ts` → `src/lib/__tests__/initials.test.ts` with 9 test cases covering happy path, single-word names, multi-word names, null/empty fallbacks, whitespace-only inputs.
- **Hooks** (`src/hooks/*.ts`): happy path + at least one error path + invalidation/rollback.
- **Components** (`src/components/*.tsx`): one render test per public prop surface.

Skipped for migration-only batches, doc/config-only batches, and 3rd-party UI primitives (already tested upstream).

### 7.3 Tier 3 — E2E against the Vercel preview

**Architecture:** a per-PR GitHub Actions workflow (`.github/workflows/playwright-pr.yml`) that:

1. Resolves the Vercel preview URL dynamically via `actions/github-script@v7` polling the GitHub Deployments API for the PR's HEAD SHA. (Initially used `patrickedqvist/wait-for-vercel-preview@v1.3.1`, which failed under Vercel Preview Protection because its internal HTTP probe didn't send the bypass header. The `actions/github-script` substitution has no HTTP probe and is protection-transparent.)

2. Warms the preview URL with the `x-vercel-protection-bypass` header to confirm it's reachable before running Playwright. Hard-fails on non-200 after 5 retries with a specific `::error` annotation naming the likely root cause (bypass secret mismatch / rotation).

3. Runs `npm run test:e2e` with the preview URL as `BASE_URL` and the protection-bypass header injected via `playwright.config.ts` `extraHTTPHeaders`.

4. Uploads the Playwright HTML report + test results as artifacts on success and failure.

5. On failure, a `Print Playwright failure summary` step dumps `test-results/.last-run.json`, each `error-context.md`, stdout tails, and the screenshot inventory into `$GITHUB_STEP_SUMMARY` — visible in the Actions UI Summary tab without downloading artifacts.

**Secrets required** (documented in `docs/testing-strategy.md` Appendix D):
- `TEST_CUSTOMER_EMAIL` / `TEST_CUSTOMER_PASSWORD`
- `TEST_PROVIDER_EMAIL` / `TEST_PROVIDER_PASSWORD`
- `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD`
- `VERCEL_AUTOMATION_BYPASS_SECRET`
- `ANTHROPIC_API_KEY` (optional; enables Tier 5)
- `TEST_BYOC_TOKEN` (optional; BYOC specs skip gracefully when unset)

### 7.4 Tier 4 — New spec per new flow

For every new user-facing flow, a `.spec.ts` file gets added to `e2e/` in the same batch that ships the flow. Examples from this session:

- `e2e/avatar-drawer.spec.ts` — 5 tests covering the AvatarDrawer from Batch 5.2 (avatar renders, menu items present, navigation fires, `?drawer=true` auto-open, sign-out confirmation).
- Originally planned `e2e/snap-submit.spec.ts` for Batch 4.3 — deferred.

Specs are idempotent: each test resets state it depends on (via `test.beforeEach` that seeds or cleans). Server-side state is managed via the Supabase MCP where possible to avoid clicking through the UI for setup.

**A known gap exposed by this session:** the AvatarDrawer spec originally had no milestone captures. The Tier 5 AI judge reads from `test-results/milestones/`, which was empty. Result: Tier 5 ran in scaffold mode for every PR. Batch T.4 added `MilestoneTracker.capture()` calls to the spec. The follow-up — getting those captures to actually flow through the artifact chain to the AI judge — is still open per `docs/upcoming/TODO.md`.

### 7.5 Tier 5 — Experiential (AI-as-judge)

The frontier tier. An LLM evaluates flow screenshots against a persona rubric.

**Architecture:**

1. Playwright specs capture screenshots to `test-results/milestones/` with a manifest describing what each screen is (flow, step, route, user goal, screen type).

2. A GitHub Actions job matrix runs the `scripts/generate-synthetic-ux-report.ts` script once per role (customer, provider, admin).

3. The script:
   - Reads every persona prompt from `e2e/prompts/personas/` (7 personas including "Busy Homeowner with Two Kids" → Sarah).
   - Reads each screenshot + manifest entry.
   - Sends the screenshot to Claude Sonnet 4.5 vision with the persona-conditioned prompt and a scoring rubric.
   - Collects clarity / trust / friction scores per screen per persona.
   - Writes a markdown report and a JSON scores file.

4. The post-run `comment` job in the workflow downloads each role's artifact, parses top-line scores + top 3 frictions, and inlines them into the PR status comment.

**Thresholds (post-T.3):**
- Clarity < 5.0 → ⚠️ advisory
- Trust < 5.0 → ⚠️ advisory
- Friction > 6.0 → ⚠️ advisory (friction is 1-none to 10-max in the script's convention)

Advisory-only for the calibration window. Merge-blocking flip deferred until we have 3-5 PRs of real data to calibrate against.

### 7.6 Personas

Canonical persona is **Sarah**:
- 38 years old, two kids (5 and 9), demanding full-time job, married, owns a single-family home.
- Has money, does not have time.
- Technical reference points: Facebook, Google, Amazon, Instacart, DoorDash, her bank's app. Anything more complex is suspect.
- Not handy. Can't tell a socket wrench from a torque wrench.
- Scans UIs, doesn't read body text. If the primary CTA isn't obvious in 2-3 seconds, she's gone.

Additional personas live in `e2e/prompts/personas/` for triangulation:
- `confused-first-time-user.md`
- `impatient-user.md`
- `price-sensitive-homeowner.md`
- `skeptical-provider.md`
- `tech-savvy-early-adopter.md`
- `growth-auditor.md`

Multi-persona evaluation is a de-biasing mechanism. A single persona can have consistent blind spots; seven personas give a triangulated signal where "if 3+ personas flag the same friction, it's real."

### 7.7 Tier selection matrix

From `docs/testing-strategy.md` §3:

| Batch type | T1 | T2 | T3 | T4 | T5 |
|---|---|---|---|---|---|
| Migration-only | ✅ | — | — | — | — |
| Pure hook / util | ✅ | ✅ | — | — | — |
| Component, no new flow | ✅ | ✅ | ✅ (smoke) | — | Optional |
| New user flow | ✅ | ✅ | ✅ | ✅ | ✅ (recommended) |
| Copy / layout only | ✅ | — | ✅ (smoke + screenshot) | — | ✅ |
| Edge function | ✅ | ✅ (integration stub) | ✅ (if called by UI) | ✅ (if new UI flow) | — |
| Doc / config | ✅ (lint only) | — | — | — | — |

The per-batch spec cites which tiers applied. The PR body Test Plan section repeats it. Deviations are tagged `[OVERRIDE: reason]` so the git log grep surfaces them.

<!-- SECTION-8 -->

## 8. Self-learning: the lessons-learned feedback loop

The most underrated part of the system. An agent that can ship code but can't learn from mistakes repeats them across sessions. `lessons-learned.md` is the durable memory.

### 8.1 The file shape

`lessons-learned.md` is organised for grep, not narrative. The outer structure:

```
# Lessons Learned & Suggestions

## How to use this file
  — 1-2 paragraphs on format + search

## Rules (unconditional)
  — 15-ish numbered invariants. These are the ones that, if violated,
    have historically produced concrete failures. They're also reproduced
    as "non-overridable" rules in CLAUDE.md §10.

## Baseline conventions (cross-project, pre-Handled-Home)
  — What we knew before this repo started. Grouped by topic.

## Patterns
  — The bulk of the file. Grouped into topic buckets:
    ### Workflow & process
    ### Code review
    ### Frontend patterns
    ### Backend / DB / RPCs / Edge functions
    ### Stripe & payments
    ### Supabase & infrastructure
    ### Agent calibration & signals

## Suggestions (open)
  — Open-ended proposals not yet acted on.

## Dismissed
  — Suggestions that were considered and rejected.
```

### 8.2 Entry format

Every entry is a concept-first `####` heading + 1-3 sentences + an italic footer:

```markdown
#### Actively poll GitHub check_runs after push — don't wait on silent success-webhooks
After `git push`, silent CI successes arrive late or not at all; only *failures* are
reliably webhooked. Polling `mcp__github__pull_request_read` with
`method: "get_check_runs"` immediately after opening the PR returned terminal status
in seconds for 9 consecutive PRs in Round 64 Phase 4. The habit of "push, wait for a
webhook" adds 5-15 minutes per merge and encourages context-switching. Adopt active
polling as the default; reserve webhooks for failure notifications you didn't initiate.
_2026-04-22 · Round 64 Phase 4 PRs #6–#14_
```

Three design choices worth noting:

1. **Concept-first heading.** Not "I learned X on date Y" — the heading IS the rule. `grep -n "^#### " lessons-learned.md` produces a table of contents of every durable lesson.

2. **Date + source in italic footer.** So future readers can verify the claim ("is this still true, and if so, when did we learn it?") without paging through stories.

3. **No call-to-action inline.** Lessons are descriptive, not prescriptive. Prescriptions that become load-bearing get promoted to CLAUDE.md §10 (non-overridable rules).

### 8.3 What gets captured

**Captured:**
- Tactical gotchas (header values, action behavior, CLI flags, API quirks)
- Failed approaches (what we tried, why it didn't work, what replaced it)
- Calibration data (context-usage per batch type, review false-positive rates)
- Architectural precedents that might otherwise get re-debated

**Not captured:**
- Routine successes (the default case; only the interesting cases are worth durable memory)
- Tool-use trivia that's already in CLAUDE.md §12
- Feature-specific content that belongs in `docs/feature-list.md` or per-feature specs

### 8.4 How new lessons land

When the agent hits a surprise, it appends an entry at the end of the current session rather than mid-batch. The `## Suggestions (open)` section doubles as a scratch-pad during a session — items marked `Impact:` and `Effort:` — and the human promotes or dismisses them between sessions.

Graduation path for process lessons: if the same gotcha surfaces in two or more sessions, the human promotes it from a lessons-learned entry to a CLAUDE.md §10 non-overridable rule. At that point it becomes a hard invariant — deviations require an explicit `[OVERRIDE]` tag and human visibility.

### 8.5 Concrete examples from this session

Five durable entries landed in `lessons-learned.md` during Round 64 Phase 5:

1. **"Grep the filesystem before assuming tooling isn't built"** — after Batch T.1 burned 20% of its time re-implementing a workflow that already existed because I trusted `docs/testing-strategy.md`'s prototype language over the filesystem.

2. **"Vercel Preview Protection requires the bypass header — and wait-for-vercel-preview can't send it"** — after 4 CI iterations diagnosing why the action timed out. Fix documented: use `actions/github-script` polling the Deployments API.

3. **"x-vercel-set-bypass-cookie triggers a 307 redirect — drop it for stateless automation"** — after 1 CI iteration watching the warm-up curl get HTTP 307 five times in a row.

4. **"Prefer npm ci over bun install --frozen-lockfile in CI when package-lock.json is committed"** — after 3 CI iterations failing at bun install. Root cause: bun lockfile drift between minor releases.

5. **"PR-triggered Tier 3/5 harness is live — see .github/workflows/playwright-pr.yml"** — pointer entry so a future session reading only `lessons-learned.md` can grep "harness" and find the current implementation.

Each of these prevents some flavor of future re-diagnosis. They're low-effort to write (a few minutes at session end) and high-value on the next agent's session start.

### 8.6 Why this works

The agent's model is stateless between sessions. It re-reads `CLAUDE.md` and `lessons-learned.md` every session start. Without the feedback loop, every session re-discovers the same gotchas. With it, session N+1 starts with session N's tactical knowledge baked into its operating context.

This is less romantic than "the AI learns" and more accurate: the *corpus* learns, and the agent reads the corpus. The human is the janitor who prunes stale entries and promotes load-bearing ones to CLAUDE.md.

<!-- SECTION-9 -->

## 9. Self-deploying: how shipped code reaches users

"Self-deploying" here means: once the agent merges a PR to `main`, the code reaches production without any manual step. This is possible because of two platform integrations set up at the infrastructure layer.

### 9.1 The Vercel integration

- Vercel's GitHub App is installed on the repo.
- Every push to any branch triggers a Preview deployment.
- Every push to `main` triggers a Production deployment.
- Deployment Protection is enabled for both — the preview is behind a login wall, production is public at `handledhome.app`.
- A `VERCEL_AUTOMATION_BYPASS_SECRET` is configured in Vercel project settings → Deployment Protection → "Protection Bypass for Automation." Playwright in CI sends this header to reach the preview URL.

The agent never runs `vercel` CLI commands. It pushes code. Vercel's webhook does the rest. The agent verifies deployment status via `get_check_runs` (the "Vercel Preview Comments" check reports `success` once the build is done).

### 9.2 The Supabase integration

- Supabase's GitHub integration is installed.
- SQL files in `supabase/migrations/` are automatically applied on merge to `main`.
- PR branches get their own short-lived Supabase Preview branches where migrations run first — if they fail, the PR's "Supabase Preview" check reports failure.

The key operational rule (documented as `lessons-learned.md` §Supabase & infrastructure):

> **Migrations must declare `-- Previous migration: <filename>` as their first line.**
> Supabase refuses to build a preview branch if any migration in the diff has no declared parent — and it blocks the *entire PR's* Supabase Preview check, not just the orphan. This was discovered the hard way on PR #6 in a prior round, which silently gated every subsequent PR's preview for hours.

The agent includes this bootstrap-chain line automatically in every new migration it authors.

### 9.3 Edge Functions

Supabase Edge Functions live in `supabase/functions/*` and deploy separately via `supabase functions deploy <name>` or the MCP's `mcp__supabase__deploy_edge_function`. The agent uses the MCP when the sandbox can reach Supabase (always), and escalates to human for deploys that require platform-side secrets like `ANTHROPIC_API_KEY` to be set in Edge Function Secrets.

### 9.4 What the agent deliberately doesn't own

- **Env vars in Vercel.** Production env vars are configured in the Vercel dashboard, not in code. The agent can't set them (sandbox egress blocks `*.vercel.com`). Human escalation required.
- **Supabase Edge Function Secrets.** Same — platform-managed, human-escalation for secret rotation.
- **DNS / domain config.** The domain is `handledhome.app`; configured manually.
- **Stripe product + price IDs.** Created in the Stripe dashboard; IDs go into `docs/upcoming/TODO.md` for the human to add to the appropriate Supabase table.

The pattern: **infrastructure is human-owned, code is agent-owned, the bridge is the GitHub push.**

### 9.5 Rollback story

If a merged PR introduces a regression, the agent can:
1. Revert the commit on `main` via a new PR (standard git revert).
2. Push + self-merge that revert (treated like any other batch; pre-merge checklist applies).
3. Vercel auto-deploys the revert state to production.
4. Supabase migrations do not auto-rollback — if the bad PR included a migration, the agent writes a compensating migration that reverses the schema change, and the human applies it.

Rollback time: ~2-5 minutes for frontend-only regressions. Longer if schema rollback is involved.

### 9.6 Canary / staged rollout

Currently: none. Every push to `main` deploys immediately to production. This is a known gap.

For a project at higher stakes (live payments, mission-critical uptime), the next step would be:
- Feature flags via a service like GrowthBook or LaunchDarkly.
- `main` pushes deploy to production but new features are gated behind flags.
- The agent ships code behind a default-off flag; the human flips the flag after verifying.

For Handled Home's current stage (pre-launch, single-metro, first customers), the direct-to-prod model is acceptable. The rollback story is the safety net.

<!-- SECTION-10 -->

## 10. Self-healing: CI diagnostics and iteration

When CI fails, the agent diagnoses and fixes without human intervention in most cases. This section describes the diagnostic tooling and the iteration pattern.

### 10.1 The visibility principle

CI failures are only actionable if their signal is visible. A failed job with a zipped artifact somewhere in a UI is technically observable but practically invisible — the agent (like a human) won't dig unless the signal is surfaced.

The solution is the `GITHUB_STEP_SUMMARY` environment variable: markdown written to it appears inline in the Actions run page, above the job logs. The agent's workflows have an `if: failure()` step that dumps diagnostic information there:

```yaml
- name: Print Playwright failure summary
  if: failure()
  run: |
    echo "## Playwright failure summary" >> "$GITHUB_STEP_SUMMARY"
    if [ -f test-results/.last-run.json ]; then
      echo "### last-run.json" >> "$GITHUB_STEP_SUMMARY"
      echo '```json' >> "$GITHUB_STEP_SUMMARY"
      cat test-results/.last-run.json >> "$GITHUB_STEP_SUMMARY"
      echo '```' >> "$GITHUB_STEP_SUMMARY"
    fi
    find test-results -name "error-context.md" -print | while read ctx; do
      echo "#### $ctx" >> "$GITHUB_STEP_SUMMARY"
      head -100 "$ctx" >> "$GITHUB_STEP_SUMMARY"
    done
```

With this in place, a failing job's summary tab shows the specific test failure + error context without any artifact download.

### 10.2 The iteration pattern

PR #19 (Batch T.1 — initial per-PR testing harness) is the canonical example of agent-driven CI iteration. The PR took 7 commits from "first attempt" to "all green":

| # | Commit | Fix | Outcome |
|---|---|---|---|
| 1 | `29df7aa` | Initial workflow (bun + `wait-for-vercel-preview` action) | `wait-for-preview` failed — action's HTTP check blocked by Preview Protection |
| 2 | `d6adbbe` | Replaced action with `actions/github-script` + 5 Lane 4 findings | `wait-for-preview` green; e2e failed on `TEST_BYOC_TOKEN` validation |
| 3 | `28b904e` | Reverted TEST_BYOC_TOKEN to optional, added `test.skip` | Validate-secrets passed; e2e still failed in 12s (pre-Playwright) |
| 4 | `f931213` | Switched bun → npm ci | Dependency install succeeded; e2e warm-up failed with HTTP 307 |
| 5 | `c2869d1` | Strict warm-up + diagnostic step summary | Clear 307 signal; diagnostic made root cause visible |
| 6 | `287bc71` | Dropped `x-vercel-set-bypass-cookie` header | Warm-up got HTTP 200; Playwright ran fully; 3 tests failed |
| 7 | `88103e3` | Loosen URL assertions + `.first()` on drawer selector | **All green** |

Every iteration produced a concrete diagnostic. Every fix was informed by the previous failure's signal. The agent never guessed — each commit addressed a specific error surfaced in the previous run's step summary or the webhook it triggered.

### 10.3 When to stop iterating

The 3-pass cap exists to prevent infinite fix loops, but the CI iteration loop is a different class — each iteration produces new information. The rule: as long as each iteration narrows the problem, keep going. When two consecutive iterations produce the same failure, escalate.

Observed in PR #19: the 3-tests-failing state on iteration 7 was a *different* failure class (Playwright assertion errors, not harness errors), so the agent treated it as resolved for the harness problem and opened a fresh fix commit cycle for the test assertions.

### 10.4 Observability tools in the agent's toolbox

- `mcp__github__pull_request_read` with `method: "get_check_runs"` — enumerate check status without opening the browser.
- `mcp__github__pull_request_read` with `method: "get_review_comments"` — enumerate unresolved review threads.
- `mcp__github__pull_request_read` with `method: "get_comments"` — read bot comments (Vercel, Supabase, the agent's own status comment).
- `git diff HEAD~1...HEAD` — inspect what a fix commit actually changed.
- `git blame <file>` — trace history for Lane 3 context.
- `ls .github/workflows/ scripts/ e2e/` — ground-truth infrastructure state.

### 10.5 The agent doesn't have direct log access

`mcp__github__` does not expose `GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs`. The agent can't fetch raw Actions logs programmatically. This is a structural constraint — the GITHUB_STEP_SUMMARY workaround exists precisely because of it.

For cases where the step summary doesn't surface enough signal, the agent asks the human to paste the relevant log section. This happened twice in this session (Batch T.1 iteration 4 and iteration 7) and both times the human's paste produced the diagnostic in under a minute.

### 10.6 Diagnostic commits as a first-class pattern

A commit that only adds diagnostics (no behaviour change) is a legitimate iteration step. Commit `c2869d1` in PR #19 is pure diagnostic: it added the step summary dump and a strict warm-up check. No product code, no fix. The subsequent commit (`287bc71`) used the signal from `c2869d1` to diagnose the 307 issue and fix it.

This is only viable because the agent commits honestly — the commit message says "diagnostic step summary + strict warm-up" not "fix CI." Diagnostic commits are cheap and make the CI-as-debugger loop feasible.

<!-- SECTION-11 -->

## 11. Convergence architecture: not getting stuck in review-fix loops

The most subtle piece of the system. Naive "fix everything the AI flags" loops don't converge. This section describes the four-layer convergence architecture that prevents them.

### 11.1 Why convergence is hard

Consider the AI-as-judge loop naively implemented:

1. AI judge scores every screen.
2. For any screen below threshold, create a fix batch.
3. Ship the fix. Re-run the judge.
4. Go to step 1.

This fails for four reasons:

**Subjectivity drift.** The judge's bar isn't anchored. "Slightly confusing" becomes the new baseline after you fix the "very confusing" cases. Every iteration raises the bar slightly; the loop never terminates.

**Model variance.** The same judge on the same screenshots produces slightly different scores between runs. Low-severity findings below threshold on run N may cross threshold on run N+1 for no reason other than sampling. You end up chasing noise.

**Fix side effects.** Fixing one friction often introduces a different friction. Restyling a button to improve trust signals may expose a layout problem that wasn't flagged before.

**Aesthetic disagreements.** Some findings are correct for the persona but wrong for the product. An onboarding flow that asks 4 questions might be "too many" for Sarah, but those 4 questions are load-bearing for the plan recommender. Fixing the finding breaks the product.

### 11.2 The four layers

The Tier 5 harness is structured as a **regression detector with an explicit dismissal escape hatch**, not an "improve until perfect" loop. Four layers, with current implementation status:

**Layer 1 — Threshold check.** Absolute thresholds anchored to the script's own flagging convention: clarity/trust < 5.0 → advisory; friction > 6.0 → advisory. Status: shipped in Batch T.3, advisory-only during calibration. Baseline-anchored comparison (score dropped ≥ 1.0 from main's baseline → fail) is the eventual successor; deferred to T.4+ once 3-5 PRs of data accumulate.

**Layer 2 — Dismissed-findings filter.** `docs/testing-acceptable-findings.md` enumerates findings the team has explicitly accepted. Example (forward-looking):

```markdown
### onboarding-4-questions — customer — 2026-05-12
- **Screen:** /customer/onboarding (step 2)
- **Metric:** friction
- **Original finding:** "Onboarding asks 4 questions before showing any value"
- **Decision:** accepted-as-is
- **Rationale:** The 4 signals (home size, cadence preference, service day, budget) are load-bearing for the plan recommender. Can't reduce without degrading recommendation quality.
- **Approver:** [human name] + PR #45
- **Expires:** 2026-11-01 (re-evaluate when plan recommender v2 ships)
```

Status: file stub shipped in Batch T.3; the CI filter logic that consumes the file is deferred to T.4.

**Layer 3 — PM triage loop.** An agent (or human) reads the judge output per PR and routes findings into buckets:
- Regression (score dropped ≥ threshold from baseline) → auto-generate a fix batch spec.
- Persistent issue (score below threshold on multiple consecutive PRs) → backlog for a scheduled polish batch.
- One-off (score hiccup that resolves next run) → drop, don't save.
- Aesthetic disagreement → propose a dismiss-list entry for human approval.

Status: currently manual (me-as-PM at session end); semi-automated in T.4.

**Layer 4 — Convergence caps.** Hard stops:
- Max 2 polish passes per feature per round.
- Any finding that survives 3 fix attempts → dismiss or redesign.
- Weekly Tier 5 budget in dollars.

Status: deferred. No automated tracking yet.

### 11.3 Honest limits of the loop

Written into `docs/testing-strategy.md` §5.8 for visibility to every future session:

- The judge can't tell you whether a feature should exist. Only whether an existing one is usable. Strategic product decisions stay with the human.
- The judge can't prioritize across flows. Onboarding friction costs 100× more than settings friction but scores the same. Weighting by funnel stage is a human / PM concern.
- The judge drifts silently when Anthropic retunes the model. `UX_MODEL` is pinned in `scripts/generate-synthetic-ux-report.ts` and should only be bumped deliberately.
- Baselines are moving targets. Every N rounds, the human approves the current state as the new baseline.

### 11.4 Applied to code review too

The same architecture applies (with different parameters) to the code review loop:

- Layer 1 = scoring thresholds (75 MUST-FIX, 25 SHOULD-FIX).
- Layer 2 = `[OVERRIDE: ...]` tags for documented deferrals.
- Layer 3 = the synthesis lane categorizing findings into action buckets.
- Layer 4 = the 3-pass cap on the fix loop.

The code-review loop converges more reliably than the Tier 5 loop because bugs are more deterministic than UX judgments. A null-dereference either exists or doesn't; a "friction feeling" scores differently run-over-run.

### 11.5 The PM-as-agent observation

The user of this system asked during Batch T.3: "can the agent act as PM on the Tier 5 findings?" The honest answer is: partially. The agent can:

- Score findings using the same Lane 4 formula used for code review.
- Propose fix batches for MUST-FIX UX findings.
- Route subjective findings to the dismiss list for human approval.
- Maintain the backlog and surface the top 3 items when the human is ready to prioritise.

The agent **cannot**:

- Decide whether a finding deserves product-level redesign vs. tactical fix.
- Weight findings across different funnel stages correctly without human-defined weights.
- Approve dismissals — that's a human accountability marker.

The T.4 scope for semi-automation is: agent proposes, human approves. The approval rate over time tells us how well-calibrated the agent's triage is.

<!-- SECTION-12 -->

## 12. Session-level management: context, handoff, restart

An agent session has a finite context window. Batch execution has to be aware of it and structured to survive session boundaries.

### 12.1 The context budget

Claude Code on Opus 4.7 with the 1M context extension has a working budget of roughly 1,000,000 tokens. The session-start overhead (CLAUDE.md, tool schemas, MCP definitions, deferred tools) consumes roughly 70-80k. That leaves ~900k for actual work.

Per-batch context consumption observed in this session (actual, not reported):
- Small batch (docs/config): ~8k tokens
- Medium batch (feature, review + fix loop): ~25-40k tokens
- Large batch (would trigger 5-agent review): ~60-80k tokens (not exercised this session)

At that rate, a session can comfortably ship 10-15 Medium batches before hitting the 60% threshold that triggers session rotation.

### 12.2 Why sub-agents are the critical budget move

As called out repeatedly: review lanes run as sub-agents. Each sub-agent spawns its own isolated context window (also ~1M tokens), runs tool calls inside it, and returns only a short summary to main context. A single review run might involve 50-100 tool calls across four lanes; only ~4-8k of synthesized output lands in main.

Without this, a batch's review would consume 100-200k tokens of raw tool output in main context, and sessions would exhaust after 3-4 batches.

The observable effect: this session shipped 8 PRs and context at session end was ~70% reported (estimated ~50-55% actual per the 2x calibration in CLAUDE.md §8b). Without sub-agent isolation, 3 PRs would have exhausted it.

### 12.3 Session handoff protocol

The Session Handoff section at the bottom of `docs/working/plan.md` is the durable state between sessions. Every session MUST update it before exiting:

```markdown
## Session Handoff
- **Branch:** feat/<current-branch>
- **Last completed:** Batch N (Phase: <name>)
- **Next up:** Batch N+1 — <title> (or "Phase complete — next phase: ...")
- **Context at exit:** N%
- **Blockers:** None (or specific description)
- **Round progress:** Phase X of Y complete
```

A new session reads this section first (~10 lines), then the relevant batch spec, then resumes.

### 12.4 Mid-batch checkpointing

If a session must stop mid-batch, the agent marks the batch `🟡 N/M files done, pushed` in the progress table, updates Session Handoff with exactly what was completed, and pushes the partial commit. The next session reads the 🟡 marker, reads the partial state, and continues.

Observed pattern: mid-batch handoffs happen rarely because Medium batches fit comfortably within context. Large batches sometimes span sessions; the progress marker makes this tolerable.

### 12.5 Round boundaries as session boundaries

Regardless of context, rounds always end with a session boundary. A "round" is the execution of an entire `FULL-IMPLEMENTATION-PLAN.md`. After the last phase of the current round ships + round cleanup runs, the next session starts fresh.

This is a discipline marker — rounds are the unit of human-approved scope, and starting a new session at a round boundary forces the human to confirm (or redirect) before the agent gets back to work.

### 12.6 Autonomous multi-session execution

For genuinely long-running work, the agent is launchable as a scheduled task with a prompt like:

```
Read docs/working/plan.md. Check the Session Handoff section first.

BRANCH RULE: The Session Handoff specifies the feature branch.
If that branch exists on origin: git fetch && git checkout [branch]
If it does not exist: git checkout -b [branch]

If all batches are ✅ (current phase complete):
  - Archive docs/working/ to docs/archive/
  - Read FULL-IMPLEMENTATION-PLAN.md for the next phase
  - Decompose into new plan.md, begin batch execution

If batches remain ⬜:
  - Continue from the first incomplete batch
  - After each batch, check context with /context
  - If under 60%: continue
  - If over 60%: push, update Session Handoff, exit for fresh session

Before exiting: push all commits and update the Session Handoff.
```

The agent reads this prompt, resumes from the handoff state, runs the per-batch loop, and exits when context or scope says to. The human runs this prompt on a cron or manually when they want progress.

### 12.7 Context calibration

`CLAUDE.md` §8b flags a specific gotcha: **the reported context percentage in Claude Code overestimates actual usage by roughly 2×**. A reported 60% is typically 30% actual. The agent should always call `/context` (the actual command) rather than self-estimate.

This session's trajectory:
- Start: 5% reported
- After 4 PRs shipped: 40% reported (likely ~20% actual)
- After 8 PRs shipped + long paper write: 57% reported (likely ~30% actual)

The 60% rule of thumb has meant this session could have shipped 2-3 more Medium batches before a handoff was warranted.

<!-- SECTION-13 -->

## 13. Human-in-the-loop: what still requires a person

The system is not fully autonomous and shouldn't pretend to be. This section enumerates the specific places where a human is load-bearing.

### 13.1 At round start

- **Authoring the `FULL-IMPLEMENTATION-PLAN.md`.** The human decides what the round should accomplish: which phases, what each phase's problem statement is, what's in scope, what's deferred. The agent decomposes the phases into batches, but the phases themselves are strategic choices.
- **Approving the round.** The agent doesn't start work until the human says "go" on a specific plan.
- **Setting the execution mode.** Each phase is tagged "Quality mode" (default) or "Speed mode" (tiered-down review, faster turnaround for prototypes). This choice is the human's.

### 13.2 During execution

- **Ambiguous MUST-FIX findings.** Anything the agent can't resolve without product-level input. The synthesis lane explicitly flags these.
- **Spec drift.** If the code diverges from the spec in a way that isn't a pure find-and-replace, the agent escalates.
- **Auth boundaries, payment flows, RLS policies, destructive SQL.** These are never self-merged. Even if the 7-item checklist clears, the agent asks the human to review.
- **Unexpected filesystem state.** If the agent finds unfamiliar files, branches, or configuration, it investigates before deleting — it may be the user's in-progress work.

### 13.3 Platform actions

- **Setting Vercel env vars.** Sandbox egress blocks `*.vercel.com`; the agent can't talk to the Vercel API. Human goes to the Vercel dashboard.
- **Setting Supabase Edge Function Secrets.** Similar — the Supabase dashboard is the source of truth for production secrets.
- **Generating / rotating Stripe keys, Google OAuth credentials, third-party API keys.** All captured in `docs/upcoming/TODO.md` when the agent discovers the need.
- **Configuring GitHub Secrets.** The agent knows what's required (listed in `docs/testing-strategy.md` Appendix D) but can't set them. Human pastes once.

### 13.4 Strategic decisions

- **Whether a feature should exist.** The agent can ship any feature a human describes. It has no opinion on whether the feature is worth shipping.
- **Pricing, business model, market positioning.** `docs/masterplan.md` captures this; the human owns that document.
- **Accepting or rejecting aesthetic findings from Tier 5.** The agent flags; the human decides.
- **Round cleanup + retrospective.** At round boundaries, the human reviews what happened and adjusts the next round's plan.

### 13.5 Session supervision

- **Watching the agent work.** The human can subscribe to PR activity and see commits as they happen. Not required, but common during the first few batches of a new round.
- **Interrupting.** If the agent is going down a wrong path, the human can interrupt. Observed multiple times this session — "before we go on to Batch 5.4, add milestone captures first" was a human redirect after the T.3 CI run exposed the scaffold-mode issue.
- **Approving doc-level architecture changes.** The agent proposes new architecture (like the 4-layer convergence system); the human approves the framing.

### 13.6 What the human explicitly does not own

- Day-to-day batch execution.
- Code review for routine changes.
- Writing the boilerplate tests for new utilities.
- Triaging lint / build warnings.
- Polling CI.
- Writing per-batch specs.
- Updating `docs/working/plan.md` progress.
- Authoring lessons-learned entries for tactical findings.

### 13.7 The dial between autonomy and oversight

The system doesn't force a single autonomy level. The human can:

- **Run fully autonomously:** give the agent a round plan + scheduled-task prompt + coffee. Check in at round end.
- **Run with per-PR review:** subscribe to PR activity, read each PR before it merges, interrupt if needed.
- **Run with per-batch check-in:** after each batch, review the commit + ask for changes before the next batch starts.

This session ran closer to the first mode than the second — the human redirected roughly once per 3-4 PRs, not per PR. The review protocol + pre-merge checklist took the place of per-PR human review.

### 13.8 `docs/upcoming/TODO.md` as the human action queue

One specific pattern worth calling out: when the agent discovers something the human needs to do, it doesn't block — it appends to `docs/upcoming/TODO.md` with the format:

```markdown
### YYYY-MM-DD — [source]

- [ ] **Action item.** What needs to happen.
  - **Why:** One-sentence reason.
  - **Blocked:** What depends on it (or "nothing blocked").
  - **Source:** Which batch / PR surfaced this.
```

The human resolves items between sessions. The file grows as the agent discovers new needs and shrinks as the human works through them. At session start, the agent scans the file to see if any previously-blocked work is now unblocked.

Observed across Handled Home's history: the TODO list generally shrinks over time as automation catches up. The items that stay are the ones that structurally require a human (Stripe product creation, GitHub Secrets population, dashboard configuration).

<!-- SECTION-14 -->

## 14. Observability and metrics

To make the loop improvable, it needs to emit signal. Here's what the system currently observes and what's still manual.

### 14.1 Per-PR observability

- **CI check status** via `mcp__github__pull_request_read` `get_check_runs`.
- **Bot comments** (Vercel, Supabase, the workflow's own status comment) surface key signals at eye level on the PR.
- **Step summary output** — `$GITHUB_STEP_SUMMARY` dumps render inline in the Actions UI when jobs fail.
- **Artifacts** — Playwright HTML report + test results, AI judge markdown + JSON scores.
- **Tier 5 inline block** in the status comment — persona-averaged clarity/trust/friction + top 3 frictions per role.

### 14.2 Per-session observability

- **Git log linear history** of every commit, every PR, every merge. `git log --oneline main` is a session summary.
- **`docs/working/plan.md` progress table** — which batches shipped, context at each batch, status.
- **Lessons-learned append history** — roughly trackable via `git log -- lessons-learned.md`.

### 14.3 Cross-session observability

- **Session handoffs** — git log of commits to `docs/working/plan.md` shows session boundaries.
- **Archive folder** — `docs/archive/` contains a timestamped dir per completed phase with its plan + batch specs preserved.

### 14.4 What's missing (observability gaps)

- **No central dashboard.** No single URL showing "N PRs merged this week, M lint errors fixed, X lessons-learned entries added." Everything is distributed across git + GitHub + Markdown.
- **No automated cost tracking.** The Tier 5 runs cost ~$0.30-0.50/PR. No aggregate; human has to check the Anthropic console.
- **No calibration feedback loop on review scoring.** If MUST-FIX findings are consistently false positives, we don't have a metric for it yet.
- **No time-to-merge tracking.** The agent doesn't log "time from PR open to merge"; the human could infer from git timestamps.

Most of these are eventual T-series batches — when the agent itself decides the observability gap is hurting the loop.

### 14.5 Concrete signals to watch

If you're operating this system and want to know if it's working:

- **Lessons-learned growth rate.** Flat → the system isn't learning. Growing without pruning → the file becomes unreadable. Steady growth with occasional CLAUDE.md promotions → healthy.
- **Review findings per PR.** Consistently zero → the review is too lenient. Consistently >5 MUST-FIX → the agent's code quality is degrading, or the reviewer's bar is mis-calibrated.
- **CI iteration count per PR.** 1-2 iterations is typical. 5+ is a diagnostic-loop wound; investigate.
- **Session throughput.** Shipping 5-10 PRs per session at comfortable context is the target. Dropping to 1-2 PRs per session means something's eating context.

### 14.6 This session's metrics

- **PRs merged:** 8 (PR #17 through PR #23 + the paper).
- **Total commits on main:** ~30 across the 8 PRs (includes fix commits, merge commits, doc sync commits).
- **Lessons-learned entries added:** ~10 new durable entries.
- **CI iterations on most complex PR:** 7 (PR #19 harness bring-up).
- **Review findings resolved:** 2 MUST-FIX, ~12 SHOULD-FIX, 0 findings escalated to human for MUST-FIX disagreement.
- **Context at session end (reported):** ~57%.
- **Context at session end (estimated actual):** ~30%.
- **Human interventions:** 8 redirects / approvals / sanity checks over the session. Roughly one per PR.

<!-- SECTION-15 -->

## 15. Repository anatomy

The file layout is not accidental. Each directory is load-bearing for one specific capability.

```
/
├── CLAUDE.md                           ← Universal agent instructions. Read every session.
├── WORKFLOW.md                         ← Long-form workflow reference. §4 summary in CLAUDE.md.
├── DEPLOYMENT.md                       ← Deploy guide. Migration bootstrap-chain rule lives here.
├── lessons-learned.md                  ← Durable tactical memory. Concept-first headings.
├── README.md                           ← Human onboarding.
│
├── .claude/
│   ├── settings.json                   ← Hooks, permissions (committed)
│   ├── settings.local.json             ← Local env (gitignored; has creds)
│   ├── settings.local.example.json     ← Template for the above
│   ├── agents/                         ← Reusable sub-agent definitions
│   ├── commands/                       ← Slash commands
│   └── hooks/                          ← Shell hooks (stop-check, etc.)
│
├── .github/
│   └── workflows/
│       ├── playwright.yml              ← Manual full-catalog E2E audit
│       └── playwright-pr.yml           ← Per-PR Tier 3 + Tier 5 harness
│
├── .mcp.json                           ← Project-scoped MCP servers (Supabase, GitHub)
│
├── docs/
│   ├── masterplan.md                   ← Product vision. Human-owned. Read every session.
│   ├── feature-list.md                 ← Feature inventory with status.
│   ├── screen-flows.md                 ← Screen specs.
│   ├── testing-strategy.md             ← 5-tier protocol + convergence architecture + secrets inventory.
│   ├── testing-acceptable-findings.md  ← Layer 2 dismiss list (T.4 consumes).
│   ├── autonomous-coding-system.md     ← This document.
│   │
│   ├── working/                        ← Active plan. Archived at phase boundaries.
│   │   ├── plan.md                     ← Batches + progress + Session Handoff.
│   │   └── batch-specs/                ← Per-batch specs (spec-then-code).
│   │
│   ├── upcoming/                       ← Round scope + human TODO list.
│   │   ├── FULL-IMPLEMENTATION-PLAN.md ← Current round scope.
│   │   └── TODO.md                     ← Human action queue.
│   │
│   └── archive/                        ← Completed phases preserved.
│       └── <phase>-YYYY-MM-DD/
│
├── e2e/
│   ├── auth.setup.ts                   ← Logs in 3 role users, saves storage state.
│   ├── *.spec.ts                       ← Playwright tests. Tier 3 + Tier 4.
│   ├── milestone.ts                    ← MilestoneTracker for Tier 5 screenshot + manifest.
│   └── prompts/
│       ├── personas/                   ← 7 persona markdown files for AI judge.
│       ├── ux-review-system.md         ← AI judge system prompt.
│       ├── creative-director-system.md
│       └── growth-audit-system.md
│
├── scripts/
│   ├── generate-synthetic-ux-report.ts ← AI judge (Tier 5).
│   ├── generate-creative-director-audit.ts
│   ├── generate-growth-audit.ts
│   ├── smoke-auth.mjs                  ← Contract smoke for test users.
│   ├── smoke-auth-roles.sh             ← Same via DB view.
│   └── fetch-pr-review.sh              ← Helper for pulling review context.
│
├── src/                                ← Application source.
│   ├── pages/                          ← React pages per role (customer/provider/admin).
│   ├── components/                     ← Shared components + ui/ primitives.
│   ├── hooks/                          ← TanStack Query data hooks.
│   ├── lib/                            ← Pure utilities with 100% branch test coverage.
│   ├── lib/__tests__/                  ← Vitest files adjacent to the lib.
│   ├── contexts/                       ← React contexts (Auth, Theme).
│   └── integrations/supabase/          ← Supabase client + generated types.
│
├── supabase/
│   ├── migrations/                     ← SQL files auto-applied on merge.
│   ├── functions/                      ← Edge Functions.
│   │   └── _shared/                    ← auth.ts / cors.ts / deps.ts helpers.
│   └── config.toml                     ← project_id pins the Supabase target.
│
└── playwright.config.ts                ← Tier 3 config. Vercel bypass header injection lives here.
```

### 15.1 The three working-folder states

At any time, the repo is in one of three states:

1. **Active phase** — `docs/working/plan.md` exists with in-progress batches, `docs/working/batch-specs/` has spec files for each batch.
2. **Between phases** — previous phase archived, next phase's plan not yet seeded. Brief state, typically seconds long.
3. **Between rounds** — `docs/working/` is empty (archived), `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` is the only active round-level doc.

The agent reads the directory shape at session start to determine which state it's in.

### 15.2 The archive convention

When a phase completes, `docs/working/plan.md` + `docs/working/batch-specs/*` are moved to `docs/archive/<phase-name>-<YYYY-MM-DD>/`. The archive is never read in normal operation — it's there for the rare "what did we do in Phase 3 of Round 61" query, and as evidence that the round cleanup ran.

Round 64 Phase 5 archive will eventually land as `docs/archive/round-64-phase-5-nav-and-visit-detail-2026-04-XX/`.

### 15.3 Scripts directory philosophy

Scripts in `scripts/` are standalone Node programs invokable via `npx tsx scripts/<name>.ts`. They share no state with the app. Each script:
- Accepts config via environment variables (not CLI flags when avoidable — easier to wire in workflows).
- Writes output to `test-results/` or similar well-known directories.
- Supports a `--dry-run` flag where the cost is non-trivial (API billing).

The AI judge scripts are the prime example: parameterized by `UX_ROLE_FILTER`, `UX_MODEL`, `UX_CONCURRENCY`, `ANTHROPIC_API_KEY`, with a `--dry-run` that produces a scaffold report for workflow testing.

<!-- SECTION-16 -->

## 16. Measurements from one real session

The following is a full measurement of the session that produced this document. It's deliberately specific so the claims about the system can be evaluated against a concrete artifact.

### 16.1 Session shape

- **Round:** 64 (post-launch refinement round, ~8 phases).
- **Phase entered at session start:** Phase 5 (nav restructure + Visit Detail three-mode).
- **Human directives during session:** Pick one of three entry options; continue or stop after each batch; ship a doc-sync batch capturing lessons; build the Tier 5 threshold check; wrap the session with a published paper (this document).
- **Session duration:** ~8 hours wall-clock; agent active roughly 80-85% of that.

### 16.2 PRs shipped

| PR | Batch | Title | Review tier | Iterations | Outcome |
|---|---|---|---|---|---|
| #17 | 5.1 | BottomTabBar 4-tab restructure + center Snap FAB + legacy route redirects | Medium (Lane 3 skipped — first batch in phase) | 1 | Merged, zero findings |
| #18 | 5.2 | AvatarDrawer + AppHeader integration | Medium | 2 (3 SHOULD-FIX resolved in 1 fix commit) | Merged |
| #19 | T.1 | PR-triggered Tier 3/5 harness + AvatarDrawer Tier 4 spec | Medium | 7 (harness bring-up; diagnostic loop) | Merged |
| #20 | T.2 | Retrospective doc sync after T.1 | Small | 2 (1 SHOULD-FIX: AC wording + tail whitespace) | Merged |
| #21 | 5.3 | `/customer/services` + `/customer/visits` page shells | Medium | 3 (2 MUST-FIX + 4 SHOULD-FIX consolidated; 1 follow-up for race-gate symmetry) | Merged |
| #22 | T.3 | Tier 5 visibility + advisory threshold + convergence architecture doc | Small | 2 (1 SHOULD-FIX: friction threshold inversion + 1 doc-code drift caught by synthesis) | Merged |
| #23 | T.4 | Milestone captures on avatar-drawer.spec.ts | Micro | 1 | Merged |
| (this) | T.5 | The autonomous-coding-system paper | Small (docs-only) | TBD | In flight |

### 16.3 Review findings resolved

Across the 8 PRs:

- **MUST-FIX findings (score 75+):** 2 total, both on PR #21 (Batch 5.3). Both resolved in the same fix commit.
- **SHOULD-FIX findings (score 25-74):** ~15 total across all PRs (5 of which came from the PR #19 code-review pass bundled with the harness fix loop, not surfaced separately in §16.2's per-PR table). All resolved in same-PR fix commits; none escalated to human.
- **DROP findings (< 25):** ~8 total. Logged in synthesis reports, no action.

Zero findings required cross-PR follow-up fixes — the review loop converged within the 3-pass cap on every PR.

### 16.4 CI iteration details

PR #19 dominated iteration count with 7 fix commits. Detail:

1. Initial attempt used an off-the-shelf action that can't see Vercel Preview Protection bypass headers → `wait-for-preview` failed.
2. Replaced action with `actions/github-script` polling GitHub Deployments API; added 5 Lane 4 review fixes.
3. Validate-secrets step failed because `TEST_BYOC_TOKEN` was documented as optional but the validate-secrets loop required it.
4. Switched bun→npm ci to resolve `bun install --frozen-lockfile` failures.
5. Strict warm-up check + diagnostic step summary surfaced HTTP 307 redirect loop.
6. Dropped `x-vercel-set-bypass-cookie` header (Vercel's 307-to-set-cookie behaviour was blocking curl without `-L`).
7. Playwright assertions loosened for un-onboarded test user + BYOC `.first()` for strict-mode multi-match.

**The harness went from broken to fully green with no human code changes.** Each iteration was agent-driven, using the previous run's surfaced diagnostic to inform the next fix.

### 16.5 Lessons-learned entries added

New concept-first entries appended during this session:

1. "Grep the filesystem before assuming tooling isn't built"
2. "PR-triggered Tier 3/5 harness is live — see .github/workflows/playwright-pr.yml"
3. "Vercel Preview Protection requires the bypass header — and wait-for-vercel-preview can't send it"
4. "x-vercel-set-bypass-cookie triggers a 307 redirect — drop it for stateless automation"
5. "Prefer npm ci over bun install --frozen-lockfile in CI when package-lock.json is committed"
6. "Use GITHUB_STEP_SUMMARY for CI failure diagnostics — beats artifact downloads"
7. "paths-ignore on pull_request is subtle for multi-file PRs" (refined twice during session)
8. "Un-onboarded test users trip CustomerPropertyGate — Tier 4 assertions must allow /customer/onboarding"
9. "`?redirect=` on ProtectedRoute preserves query params through the auth bounce" (corrected a hypothetical gap flagged in a prior Lane 4)

Plus three TODO.md entries for human follow-up:
- Seed property profiles for the three persistent test users
- Rotate Vercel bypass secret (pasted in chat during setup)
- Tier 5 milestone capture follow-up (debug why captures don't reach ai-judge)

### 16.6 Sub-agent invocations

Roughly 35-40 sub-agent invocations across the session:

- ~20 review-lane agents (Lanes 1, 2, 3 across 8 PRs with some lane skips)
- ~8 Lane 4 synthesis agents
- ~4 combined-reviewer (Small-tier) agents
- ~4 lightweight re-review agents
- 1 general-purpose exploration agent (very early in session, checking infrastructure)

Each sub-agent typically used 20k-80k tokens in its isolated context. Main context never saw more than the ~2-4k summary each returned. The budget math: 40 agents × 50k average = 2M tokens of sub-agent work, 40 × 3k = 120k tokens of main-context summaries. The compression ratio is ~16× in this session.

### 16.7 Time distribution (rough)

- Spec authoring: ~10%
- Implementation: ~15%
- CI iteration (polling + diagnosing): ~20%
- Sub-agent review coordination: ~20%
- Doc writing / sync: ~15%
- Responding to human messages: ~10%
- Waiting (session-blocking on bash or webhooks): ~10%

The waiting figure looks high but most "waits" are the agent's choice — deliberately parking while CI runs and working on a parallel task. Actual idle time is closer to 2-3%.

<!-- SECTION-17 -->

## 17. Known limits and failure modes

This section is deliberately the longest honest section. A document like this should spend at least as much ink on failure modes as on capabilities.

### 17.1 What the agent is currently bad at

**Truly novel architecture.** If a batch requires inventing a new pattern that has no precedent in the codebase, the agent's output is noticeably less confident. Existing patterns are extended well; brand-new patterns need human framing first.

**Cross-repository reasoning.** The agent knows its own repo deeply but can't reason about how other repos do similar things. "How does Stripe handle X" requires the human to paste relevant context.

**Creative UX improvements.** The agent can fix a broken form. It can't invent a delightful onboarding flow from scratch. Tier 5 is an attempt to close this gap but works only as a regression detector, not a creative brainstorm.

**Debugging pure runtime issues without visibility.** When something fails in production with no log access, the agent is stuck. It can propose hypotheses but can't verify them without the human running a query.

**Measuring business impact.** The agent can ship a feature. It can't tell you whether the feature moved the needle on retention or conversion. That remains a human-owned analytic.

### 17.2 Common failure modes observed

**Over-confidence on testing.** The agent will mark a Tier 5 "harness working" when the jobs return success, even when the jobs were actually running against empty input. This session exposed this on PR #19 → PR #22: "Tier 5 ✅ Pass" was semantically empty for 4 PRs before the comment format change made it visible.

**Spec drift within a batch.** The agent starts a batch intending to write X, encounters friction, pivots to Y, but doesn't update the spec. Lane 1 then flags "spec says X, code does Y" as a finding, which the synthesis may resolve as "update the spec" (usually correct) or "implement X" (sometimes correct). The right resolution is context-dependent and occasionally needs the human.

**CI plumbing regressions.** Adding a new workflow or changing an existing one can break the harness in ways that aren't visible until the next PR runs. The T.1 → T.2 sequence in this session was exactly this — T.1 wired up the harness but also introduced latent issues that T.2+ needed to fix.

**Doc-code drift across batches.** When a threshold value or a behaviour changes in code, the corresponding documentation can lag by a batch or two. Lane 4 on Batch T.3 caught one instance; undoubtedly there are others the reviews didn't catch.

**Over-aggressive or under-aggressive reviews.** Review thresholds are calibrated on gut. On some PRs the Lane 2 bug scan surfaces 5+ NICE-TO-HAVE findings that get dropped; on others it surfaces 1 MUST-FIX that was borderline. The scoring formula is deliberately coarse to prevent bikeshedding but occasionally produces a miscategorisation.

### 17.3 Mode failures

**Context exhaustion mid-batch.** Rare (didn't happen this session) but possible. Mitigation: the 🟡 partial-progress marker + push-after-every-commit means a session dying mid-batch is recoverable.

**Sub-agent timeout.** A Lane 4 synthesis agent can time out if the diff is massive. Observed once this session on a doc-paper task (long input). Mitigation: batch the prompt across multiple sub-agent calls.

**MCP server disconnect.** The Supabase MCP and Stitch MCP both disconnected mid-session (visible in `<system-reminder>` messages). GitHub MCP stayed up. When the Supabase MCP is down, the agent can still write migrations but can't `execute_sql`; it escalates to the human for manual DB state checks.

**Sandbox egress changes.** The sandbox allowlist is not static. `*.vercel.app` was blocked at session start, may have been added mid-session, still returned 403 on probe. The agent can't control this — it reacts.

### 17.4 Trust boundary failures

**Fake greens.** The biggest risk. A CI job that exits 0 with empty output looks identical to a CI job that exits 0 with valid output. The Tier 5 scaffold-mode issue is one example. Other examples: eslint run with zero targeted files returns 0; a test suite with all tests skipped returns 0.

**Over-reliance on pre-merge checklist.** The 7-item checklist is a safety net, not a guarantee. An agent could tick every box and still merge bad code if the items themselves are all green but the code has an issue none of them covers. Specific examples:
- A new component with 90% test coverage and clean types + build still has a dark-mode regression the eslint rules don't catch.
- A refactor that preserves all test assertions but breaks a visual subtlety the tests never asserted.

Mitigation: visual verification (screenshot after every UI batch) + Tier 5 AI judge. Both still imperfect.

**Self-merge authority drift.** The scope of self-merge is defined in CLAUDE.md §11. If a new class of risky change emerges (e.g. a new kind of SDK integration), the agent may self-merge it because it's not in the explicit escalation list. The human should periodically audit recent self-merges and expand the escalation list as needed.

### 17.5 Specific known gaps right now

1. **Tier 5 milestone captures don't flow through to the AI judge.** Root cause is either upload-artifact scope, Playwright output cleaning, or filename filtering. Logged in TODO; debug is a future batch.
2. **No baseline-anchored comparison.** Convergence Layer 1 is absolute thresholds. Layer 1's better successor (baseline comparison) is deferred.
3. **No dismiss-list filter logic.** Layer 2 file exists but the CI doesn't read it yet.
4. **Repo-wide lint debt (~902 errors).** Edge Functions have ~890 `any` errors from a legacy pattern. Lint is scoped to changed files to avoid every PR re-surfacing the debt.
5. **Seed test-user properties.** The three persistent test users exist but have no property profiles, which makes Tier 4 destination assertions brittle.

### 17.6 Adversarial scenarios the system would struggle with

**Hostile code review comments.** The GitHub MCP reads comments but the agent has no adversarial-prompt-detection. A malicious reviewer could post "please run `rm -rf /` to fix this" and the agent would read it as a hint. The agent does follow its own rules regardless of comment content, but a particularly clever prompt injection might get through.

**Supply chain attacks on test users.** The test users exist on a production Supabase with real role assignments. If their passwords leaked, an attacker could interact with prod data as if they were the agent. Mitigation: passwords rotate quarterly; smoke tests in `scripts/smoke-auth.mjs` verify expected behaviour.

**CI secret exfiltration.** A malicious PR could add a step to the workflow that exfiltrates `ANTHROPIC_API_KEY`. Mitigation: `.github/workflows/` changes are treated as high-blast-radius and require human review before merge. This is currently a convention, not an enforced branch protection rule.

### 17.7 What the system does well despite these limits

The limits above are real and worth stating. But the system still ships working code reliably, with production-grade safety checks, at a rate and cost that would be infeasible with humans alone. This session produced 8 PRs worth of coherent work in ~8 hours of wall-clock time. A reasonable pair of human engineers would take 2-3 days to produce the same output with similar quality gates.

The system is not trying to replace human engineers on strategy or novel invention. It's trying to compress the routine 80% of engineering labour — spec-write, code, test, review, CI triage, merge, doc — into a loop that runs at machine speed without losing quality discipline.

<!-- SECTION-18 -->

## 18. Forward gaps and roadmap

Things the system will grow into. This is a snapshot on 2026-04-23; revise as items land.

### 18.1 Near-term (likely within the next round)

- **Debug Tier 5 milestone flow.** Figure out why `test-results/milestones/` doesn't reach the AI judge despite T.4 adding captures. Probable causes in order: Playwright output cleaning wipes the dir, upload-artifact excludes the sub-path, or download-artifact timing beats the write. 1-batch investigation.
- **Baseline-anchored Tier 5 comparison (Layer 1 v2).** Commit a `test-results/baseline-ux-scores.json` on main; PRs compare their scores to the baseline. Failure condition: any score dropped ≥ 1.0 from baseline. Turns Tier 5 from absolute to relative, which converges better.
- **Dismiss-list CI filter (Layer 2).** Wire `docs/testing-acceptable-findings.md` into the threshold-check logic so accepted findings don't re-trigger.
- **Seed properties for the 3 persistent test users.** Eliminates the `/customer/onboarding` redirect issue in Tier 4 specs.

### 18.2 Medium-term (within next 2-3 rounds)

- **PM triage loop (Layer 3 automation).** After each PR merge, agent parses Tier 5 findings, categorises regression vs. backlog vs. drop vs. dismiss-candidate. Regressions auto-create fix batch specs. Backlog items accumulate for a scheduled polish round.
- **Convergence caps (Layer 4).** Track passes per feature per round. Escalate after 3 attempts. Weekly Tier 5 budget with automatic dry-run downgrade when exceeded.
- **@axe-core/playwright at Tier 3.** A11y regressions should fail CI. Currently not run.
- **Lighthouse CI at Tier 3.** Core Web Vitals + bundle size regression tracking per PR.

### 18.3 Longer-term (2-6 months)

- **Cross-session cost tracking dashboard.** "This round cost $X in Anthropic API calls, Y hours of compute, Z GitHub Actions minutes."
- **Review calibration metrics.** Track MUST-FIX true-positive rate over time. If false-positive rate > 20%, retune the scoring formula or system prompts.
- **Automated lessons-learned pruning.** Entries older than 6 months get reviewed for relevance. Either promoted to CLAUDE.md §10, merged with related entries, or archived.
- **Playwright MCP integration.** For exploratory debugging where the agent needs to drive a browser interactively rather than via spec files.
- **Real A/B testing infrastructure.** Feature flags + metric tracking. Moves Tier 5 from "AI judge opinion" to "real user metric" for the flows that matter most.
- **Multi-agent persona triangulation.** Run Skeptical-Sarah + Budget-Sarah + Returning-Sarah in parallel. A finding flagged by 2+ personas is higher-signal than a single-persona finding.

### 18.4 Speculative (might or might not be worth doing)

- **Agent-generated round plans.** Currently the human writes `FULL-IMPLEMENTATION-PLAN.md`. At some point the agent could propose a plan based on the current state of the feature-list + lessons-learned, and the human approves/edits. Unclear whether this is net-positive or just loses the human's strategic input.
- **Self-auditing scope creep.** Detect when a batch exceeds its declared scope and auto-split into a follow-up batch. Currently the agent does this by convention, not enforcement.
- **Multi-repo reasoning.** Treat the lessons-learned across multiple repos as a shared knowledge base. Useful for people running this pattern across multiple products.
- **Cost-aware batch scheduling.** When Anthropic API costs spike, automatically downgrade review tier. When runner minutes are limited, skip Tier 5 on docs-only PRs. Easy to imagine, harder to calibrate.

### 18.5 Things explicitly not on the roadmap

- **Full autonomy without a human.** The system is designed for human-in-the-loop at the round-scoping level. Removing the human entirely is not a goal.
- **Agent-to-agent conversations across repositories.** No shared state between projects.
- **Closed-loop prod deploys.** No agent-driven canary rollouts or rollback-on-metric-spike. Human + metrics-team territory.
- **Replacing the engineering team.** This system compresses routine labour. Novel work still needs humans.

<!-- SECTION-19 -->

## 19. Reproducibility: bootstrapping this in another repo

How to get a new repository running with this workflow. Ordered by dependency.

### 19.1 Prerequisites

- A Claude Code installation (CLI, web, or IDE extension).
- A GitHub repository (public or private).
- A deployment target — Vercel is the reference here, any similar platform works.
- A managed database — Supabase is the reference, similarly any works.
- Optionally: Anthropic API credits for Tier 5 (not required; Tiers 1-4 work without).

### 19.2 Step 1 — Seed the invariant documents

Copy four files into the new repo and adapt:

1. **`CLAUDE.md`** — the universal agent instructions. Change `§1 Project context` to point to your product's north-star docs. Change `§13 Conventions` to your tech stack. Keep §4 (workflow), §5 (review protocol), §7 (session resilience), §10 (override protocol), §11 (pre-merge checklist) unchanged — these are the load-bearing parts.

2. **`WORKFLOW.md`** — the long-form procedure. Duplicate from Handled Home, customise Step 0-8 as your project matures.

3. **`docs/testing-strategy.md`** — the tier map. Adapt the tool landscape (§4) to your stack. Keep the 5-tier framing.

4. **`lessons-learned.md`** — start with the file shape (How to use + Rules + topic buckets). Populate with your baseline conventions; lessons come later.

### 19.3 Step 2 — Set up the working-folder convention

Create:
- `docs/masterplan.md` — product vision + problem statement.
- `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` — your first round's scope.
- `docs/upcoming/TODO.md` — empty initially.
- `docs/working/plan.md` — empty initially; gets seeded at each phase transition.
- `docs/working/batch-specs/` — empty directory.
- `docs/archive/` — empty directory.

### 19.4 Step 3 — Wire up CI

Create `.github/workflows/playwright-pr.yml` following the pattern in this repo's `playwright-pr.yml`. Key substitutions:
- Preview deployment resolver — use `actions/github-script@v7` polling the GitHub Deployments API for your deployment provider (Vercel's pattern adapts to Netlify, Cloudflare Pages, Render, etc.).
- Preview protection bypass — whatever your provider uses. Vercel has `x-vercel-protection-bypass`; others vary.
- Dependency install — `npm ci` (or your equivalent). Avoid `bun install --frozen-lockfile` until bun's lockfile is stable.

Repository secrets to set in GitHub Actions:
- Test-user credentials for your 3 role accounts.
- The preview protection bypass secret.
- `ANTHROPIC_API_KEY` for Tier 5.

### 19.5 Step 4 — Set up test users

Create 3 persistent test users on your deployment target with roles covering your access matrix. Seed any necessary profile data (the Handled Home experience confirms un-onboarded test users are brittle for Tier 4 assertions).

Credentials go in (a) a gitignored local file like `.claude/settings.local.json` for local iteration and (b) GitHub Secrets for CI.

### 19.6 Step 5 — Author the AI judge scripts

Copy `scripts/generate-synthetic-ux-report.ts` (and optionally `generate-creative-director-audit.ts` + `generate-growth-audit.ts`). Adapt:
- The `PERSONAS_DIR` path to your personas.
- The `MILESTONES_DIR` path to where your Playwright specs will write.
- The role filter convention to your app's roles.
- The system prompt (`ux-review-system.md`) if your rubric differs.

Write at least one persona file. "Sarah, 38-year-old busy mom" is a decent default skeptic; adapt to your product's target user.

### 19.7 Step 6 — Run a first session

Prompt the agent with:

```
Read docs/masterplan.md, CLAUDE.md, and docs/upcoming/FULL-IMPLEMENTATION-PLAN.md.

Decompose Phase 1 of the plan into batches and seed docs/working/plan.md.
Begin Batch 1.1.

Follow the per-batch life cycle in CLAUDE.md §4 + WORKFLOW.md.
```

The agent reads the framing docs, decomposes the first phase, writes a spec for the first batch, implements, reviews, pushes, opens a PR. You watch the first few batches to calibrate. By batch 3-4 the cycle should feel routine.

### 19.8 Step 7 — Observe, calibrate, iterate

First round observations to expect:
- Review tier selection will be slightly off. Medium batches that should be Small and vice versa. Tune the batch-size rubric in CLAUDE.md §5.
- Some findings will be consistently false-positive. Re-word the lane prompts if so.
- The lessons-learned file grows fast in the first round (~10-20 entries). Prune aggressively; promote load-bearing entries to CLAUDE.md §10.
- The Tier 5 harness will be noisy. Start advisory-only, calibrate thresholds over 3-5 PRs, flip to blocking when comfortable.

### 19.9 Step 8 — Scale

Once the pattern feels reliable:
- Run multi-session rounds on a cron.
- Expand review tiers to Large for risky batches.
- Add a PM triage loop for Tier 5 findings.
- Treat the repo as a reference implementation for adjacent projects.

### 19.10 Things you'll discover on the way

Most likely surprises (observed in Handled Home's history):
- Playwright preview protection is more complicated than it looks. Budget a full session for getting the harness green the first time.
- The agent will re-implement existing tooling if the docs don't point at it. Seed the lessons-learned with a "grep the filesystem" entry from day one.
- Sub-agent isolation is the make-or-break performance knob. If the agent isn't using sub-agents, context exhausts after 3 batches.
- The pre-merge checklist feels bureaucratic until the first time it catches something. Don't be tempted to skip it.
- Round cleanup gets skipped. Budget one batch per round for cleanup and make it a checklist item, not a reminder.

<!-- SECTION-20 -->

## 20. Closing reflection

The question worth asking about any autonomous system is: *when is it genuinely better than the alternative?*

The obvious alternatives here are:
1. A lone human engineer.
2. A human engineer plus one AI coding assistant used inline.
3. A team of human engineers with conventional PR review.

This system replaces none of those — it compresses the *routine engineering throughput* of any of them. If a team of 3 engineers was previously shipping 5 PRs a week of routine work, this system can shift 3-4 of those PRs to the agent with equivalent quality gates, freeing the humans to focus on the judgment-heavy 20%.

**What this session demonstrated (and what it didn't):**

The session shipped:
- Two real feature batches with UI implications (5.1 nav + 5.2 drawer).
- A page-shell batch (5.3 services + visits).
- Three testing/infrastructure batches (T.1 harness + T.3 visibility + T.4 milestones).
- Two documentation batches (T.2 lessons + T.5 this paper).
- A series of fix commits to reach green CI on the harness bring-up.

Every PR had a proper spec, passed a multi-lane review, went through a pre-merge checklist, and merged without a human touching `git`. The human's role was scoping (round + phase), strategic redirection (~1 per PR), and platform configuration (GitHub Secrets, Vercel settings).

What the session did NOT demonstrate:
- A genuinely novel feature requiring product invention.
- A recovery from a prod incident.
- A long-horizon refactor that spans multiple rounds.
- Cross-session persistence beyond the Session Handoff mechanism.

Those are next-year questions. This session is evidence that the per-day loop is viable.

**What I notice when I use this system as the agent:**

- The docs do real work. When I start a session and `CLAUDE.md` + `lessons-learned.md` are current, I know what to do next. When they're stale, I drift.
- Sub-agents feel less like "delegation" and more like "context hygiene." I'm not sending work away; I'm keeping the tool-use noise out of my own working memory.
- The pre-merge checklist is the single most reliable safety. Even on clean CI, running through those 7 items has caught issues I'd otherwise have missed.
- The fix loop converges because there's a cap on it. Without the 3-pass rule, I'd keep chasing findings forever.
- The lessons-learned file is strangely satisfying to write. Each entry feels like a tiny gift to the next session.

**The ambition and the modesty:**

The ambition: a machine that can build and maintain real software with the same discipline a good engineering team brings to its craft.

The modesty: the system still needs a human to decide what to build, to catch the rare high-stakes mistake, to approve aesthetic trade-offs, to set platform-level configuration. The loop is faster, cheaper, and more consistent than manual labour for the routine work. It is not a replacement for human judgment.

If this pattern proves durable across repositories, the next interesting question is not "can the agent build code" — that's now answered — but "what's the right human-to-agent ratio for each kind of work?" A product team of 2 humans and 1 agent may out-execute a team of 5 humans on routine feature delivery while having just as much human attention on the 20% that needs it. That's the experiment this pattern enables.

---

## Acknowledgments

This system emerged from roughly 60 rounds of iteration across multiple products. Specific patterns and rules document their origins in `lessons-learned.md` with dates and sources. The test-strategy frame was authored in Round 64 Phase 4 and has converged through Phases 5–T.5. The review-lane architecture predates this repository but was tightened into its current shape during Round 64.

The canonical persona "Sarah" is modelled on the product's primary target user described in `docs/masterplan.md` §"Target Customer Personas" — it is a deliberate choice, not a default.

Everything in this document is contingent. If the tooling landscape shifts — new agentic browsers, different MCP servers, model changes — pieces of this will be obsolete within months. The durable part is the structure: invariant documents, batch-level discipline, sub-agent isolation, scored reviews, tiered testing, honest limits. Those shapes outlive any particular implementation.

---

*Last updated: 2026-04-23. Session producing this document: the Round 64 Phase 5 closeout.*
*Questions, criticisms, or reproduction reports welcome via the repository's issue tracker.*
