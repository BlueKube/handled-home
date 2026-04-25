# Lessons Learned & Suggestions

> **Last updated:** 2026-04-22
> **Format:** Topic-bucketed for AI lookup. Concept-first headings (no date prefixes) so `grep` and section-jump work. Dates + sources live in italic footers under each entry. Older chronological session-blocks were re-bucketed into the topic sections below; original entry text preserved verbatim.

---

## How to use this file

1. **Search by concept in `####` headings** — they're written as the rule or the trigger condition.
2. **Each entry is self-contained** — read only what you need; no implicit ordering.
3. **`_Source:_` footer** is for verification; ignore unless the entry's claim doesn't match what you're seeing.
4. **Two append-only sections at the bottom** — `Suggestions (open)` and `Dismissed`.

### Adding new entries

Pick the right topic bucket (one of the seven `### Topic` sections under `## Patterns`). Use a concept-first heading, body in 1–3 sentences, single italic footer:

```markdown
#### <Concept-first rule or trigger>
<1–3 sentences. State the rule, then briefly the evidence.>
_<YYYY-MM-DD> · <round/batch/source>_
```

For suggestions, append to `## Suggestions (open)` with the same shape plus an `Impact:` and `Effort:` line. When a suggestion is implemented, append `✅ Resolved: <commit/PR>` to its footer (don't delete).

---

## Rules (unconditional)

1. Every batch spec must declare `## Review: Quality` or `## Review: Speed`.
2. Every migration must be applied or documented as blocked before the next batch.
3. Never put third-party API keys in `VITE_` variables — use Edge Functions.
4. Decompose components at 300 lines, not after they hit 1,000 (extract in the same batch).
5. Take a screenshot after every UI-changing batch.
6. Pull and review the full diff before starting work on a branch you didn't author.
7. Default unauthenticated users to `null`, never to a permissioned role.
8. Create `DEPLOYMENT.md` and a real `README` in the first full pass.
9. Run code reviews on every batch — never skip, never defer.
10. Always pass actual diffs to reviewers, not pseudocode summaries.
11. Grep for all links to old targets when changing primary CTAs.
12. Audit dark-mode colors explicitly — light-mode values are invisible on dark backgrounds.
13. Make hooks resilient to external type removal with `as any` + error fallback.
14. Restart sessions at round boundaries, not phase boundaries.
15. Round Cleanup gets skipped even when documented — use a post-round verification step.

---

## Baseline conventions (cross-project, pre-Handled-Home)

### Workflow
- **Never skip code reviews.** Retroactive reviews found MUST-FIX security bugs every time. Every review pass caught at least one real issue.
- **Apply migrations immediately.** Unapplied migrations cause downstream tooling to stub working code. Apply or document as blocked in TODO.md before the next batch.
- **Declare review mode in the batch spec.** No implicit assumptions about Quality vs Speed mode.
- **Take screenshots after every UI batch.** Light-mode colors, text truncation, and wrong CTAs accumulate silently without visual verification.
- **Hardening passes are as valuable as feature passes.** Dedicated code-health and ship-readiness passes find security bugs and fix infrastructure gaps.
- **The first pass should include `DEPLOYMENT.md`, `README`, and `.env.example`.** Don't wait until the end.
- **Restart sessions at round boundaries, not phase boundaries.** Sessions can span 1–2 rounds before context becomes a concern.

### Code review
- **Reviews found real bugs every single time.** RBAC bypass, missing role gates, XSS in emails, orphaned nav links, missing event handlers — all caught by the review system.
- **Synthesis agents (Lane 4) correctly downgrade false positives.** Lane 2 findings scored 80+ get dropped to 10–15 when synthesis adds context.
- **Always pass actual diffs to reviewers, not pseudocode summaries.** Summaries produce false positives.
- **Retroactive reviews are expensive.** Reviewing skipped PRDs in bulk consumes ~15% context at once. Better to review per-batch.
- **Sub-agent reviews save main context.** Each review lane runs as a sub-agent — only the final report enters the main window.

### Lovable coordination (legacy — superseded by self-host since Round 64.5)
- **Lovable stubs working code when tables don't exist.** Apply migrations before Lovable touches the codebase.
- **Lovable regenerates `types.ts` and removes manually added tables.** Make hooks resilient with `as any` + error fallbacks.
- **Tell Lovable explicitly what not to change.** Be specific and direct — vague instructions get ignored.
- **Pull and review the full diff after Lovable changes,** not individual commits. Lovable often makes 5+ small commits for one logical change.
- **Not all Lovable changes are destructive.** Evaluate each diff on its merits.

### Architecture
- **Decompose components at 300 lines, not 1,000.** Extract in the same batch, not a future PRD.
- **Consolidate constants from first use.** New shared values go in `src/constants/` immediately.
- **`as any` is a signal, not a solution.** Fix the types when possible. When external regen keeps removing them, use `as any` + error fallback and document why.

### Security
- **Never put API keys in `VITE_` variables.** Client-side env vars are bundled into the browser. Any third-party API call with a secret goes in an Edge Function.
- **Default unauthenticated users to null, not a permissioned role.** Returning a permissioned role for no-session users bypasses role gates.
- **Escape user-supplied content in email templates.** Never interpolate user input directly into HTML.

### Testing
- **Pure-logic tests are high-value and low-effort.** No mocking needed, catches real bugs.
- **Create a `src/test/mocks/` directory upfront** with standard mocks for Supabase client, hooks, etc.
- **E2E tests need env vars documented.** Don't discover this when tests fail.

### Screenshots
- **Playwright CLI often fails in sandboxed environments.** Use the raw Chromium binary with `--headless --no-sandbox --virtual-time-budget=8000`.
- **React SPAs need `--virtual-time-budget` flag** to give JavaScript time to render before capture.
- **Supabase env vars must be set** or React won't mount (the Supabase client constructor fails silently).

### UX / Visual
- **Hero CTA must match the primary user action.** All CTAs must point to the same primary action.
- **Dark-mode colors need explicit audit.** Light-mode Tailwind values are invisible on dark backgrounds.
- **Mobile text truncation happens at large font sizes on small screens.** Use responsive text sizing.
- **Orphaned legacy pages cause split user flows.** When you change the primary CTA, grep for all links to the old target.

### Infrastructure
- **Supabase Edge Functions for any API key.** All third-party API calls with secrets go server-side.
- **Realtime subscriptions need status callbacks.** Handle SUBSCRIBED, CLOSED, CHANNEL_ERROR, TIMED_OUT.

### Cleanup
- **Round Cleanup gets skipped even when documented.** Use a post-round verification step: "ls docs/working/batch-specs/ — if files exist, archive them."

### Context management
- **65% actual context at session end is ideal.** Reported figures in Claude Code overestimate by ~2× — use `/context`, not self-estimate.
- **5 rounds in one project is viable** when each round has a clear theme.

---

## Patterns

Project-specific lessons, bucketed by topic. Originally written across multiple sessions (2026-03-29 through 2026-04-22).

### Workflow & process

#### Investigate before implementing
Reading the actual code before writing PRD fixes saved ~5 PRDs' worth of unnecessary work. One audit said "rebuild Activity screen" — the code already had it built correctly. Always scope the change against the codebase, not against the audit report.
_2026-03-29 · Session 1 (Security + Core Loops)_

#### Document overrides inline with `[OVERRIDE: reason]`
Tagging skipped PRDs / deviations with `[OVERRIDE: …]` in commit messages creates a clear audit trail of scope decisions. `grep -r "\[OVERRIDE" .` across plan.md + commit history surfaces every deliberate deviation.
_2026-03-29 · Session 1_

#### Screenshot-based audits need a data-validation pass first
~5 of 12 "critical" UI/UX findings from a screenshot audit were data-state artifacts (empty seed), not code deficiencies. Photo Timeline, Activity screen, Provider Dashboard, Performance screen, and Cancel button were all correctly implemented. Always distinguish "code is missing this" from "test data doesn't populate this" before scoping fixes.
_2026-03-29 · Session 1_

#### Standalone validation tools benefit from review just like production code
Tool output that generates reports drives business decisions, so misleading output is production-grade risk. PRD-047 B1 review found 2 SHOULD-FIX issues in a `tools/` script — display logic that silently suppressed warnings, and hardcoded values that would go stale.
_2026-03-31 · PRD-047 B1_

#### Workflow glossary: round > phase > batch > step
Eliminated separate PRD files; each phase section in `FULL-IMPLEMENTATION-PLAN.md` is now a self-contained PRD. Renamed "full pass" → "round". Renamed workflow procedure headings "Phase 0–7" → "Step 0–8" to avoid collision with implementation phases. Added "micro" review tier (1 agent) for mechanical batches and fact-checker lane for business-critical documents.
_2026-03-31 · Round 5 retrospective_

#### Tautological health checks are worse than no checks
A `>= 0` condition on a count field always passes, giving operators false confidence. Review caught it at score 75 (MUST-FIX). Every health check must be capable of failing — review thresholds when authoring.
_2026-03-30 · PRD-026 Lane 1+2 cross-validated_

#### Silent data bugs are the highest-value finds in polish rounds
4 of the top 10 bugs in one polish session were silent data issues — queries returning 0 rows or wrong fields with no error, leaving the UI looking empty/broken. Invisible without reading the code and cross-referencing DB schema. Any Supabase query with an `as any` cast should be verified against `src/integrations/supabase/types.ts`.
_2026-04-02 · Photo validation case mismatch, OpsJobs sentinel filters, PayoutRolloverCard wrong columns, HomeTimeline field names_

#### Browse-level functional verification catches fake UX
The public Browse page's ZIP coverage check was a no-op that always set `zipChecked = true` with no actual zone lookup. In-market users entering valid ZIPs were told "we're expanding" — potentially deterring signups. Fix queried `zone_zips`. Public-facing pages need functional verification, not just visual audits.
_2026-04-02 · Round 55 audit_

#### npm run build gate is redundant on schema-only / TS-only batches
`npx tsc --noEmit` takes ~5s; `npm run build` takes ~30s and produces a bundle that gets thrown away. For batches that change only migrations or only hook types (no new Vite entries, no routing, no dynamic imports), `tsc` is sufficient. Reserve full build for batches that change `src/App.tsx` routes, lazy imports, vite config, or new components consumed via dynamic import. Document skips as `[OVERRIDE: skipped npm run build — TS-only batch]` in commits.
_2026-04-20 · Round 64 Phase 1_

#### Claude.ai Connectors ≠ Claude Code MCP
The "Connectors" in claude.ai Settings (Vercel, Supabase, GitHub, Gmail, etc.) run in Anthropic's infrastructure and only apply to web/desktop claude.ai conversations. Claude Code in the terminal does NOT see them. Claude Code's equivalent is MCP servers declared in `.mcp.json` (project-scoped) or `~/.claude.json` (user-scoped). Future sessions needing tool access should check `.mcp.json` first, not assume a Claude.ai Connector carries over.
_2026-04-21 · Round 64.5 user clarification_

#### Lovable-driven migrations is obsolete — self-host GitHub→Supabase auto-applies
~~Lovable owns Supabase migrations~~ — superseded 2026-04-21 by Round 64.5 self-host migration. Current state: migrations auto-apply via the GitHub↔Supabase integration on push to main. TS types regen via `mcp__supabase__generate_typescript_types` or `supabase gen types typescript --project-id …`. No external actor gatekeeps migration application any more.
_2026-04-20 (obsoleted 2026-04-21) · Round 64 Phase 1 + Round 64.5_

#### Copy sweeps need a final project-wide grep, not spec enumeration
The Batch 3.5 spec enumerated exact files + line numbers for "handles → credits". Review's Lane 1 grep across `src/pages/customer/**/*.tsx src/components/customer/**/*.tsx src/components/plans/**/*.tsx` caught `AddonSuggestionsCard.tsx:158` — a CTA label not in the spec's list. Treat the spec's file list as a starting inventory, run the grep when you think you're done, and let the grep generate the final fix list. Make the grep part of the batch's acceptance criteria so review runs it too.
_2026-04-22 · Batch 3.5 Lane 1 MUST-FIX_

#### Static marketing data with a TODO escape hatch is pragmatic, not debt
`/browse` is public/unauthenticated but the `plans` RLS requires auth — so live plan data can't flow through. Two options: add a public RLS policy + flip draft variants to active, or hardcode `FAMILY_SUMMARIES` with a TODO entry. Chose the hardcode: the RLS change is product-level and shouldn't happen in a frontend batch, and drift risk is bounded. Rule: static fallbacks with a visible TODO entry are acceptable when the "make it live" decision is cross-cutting — drop an inline code comment next to the fallback linking the TODO item.
_2026-04-22 · Batch 2.3 Browse.tsx_

#### Actively poll GitHub check_runs after push — don't wait on silent success-webhooks
After `git push`, silent CI successes arrive late or not at all; only *failures* are reliably webhooked. Polling `mcp__github__pull_request_read` with `method: "get_check_runs"` immediately after opening the PR returned terminal status in seconds for 9 consecutive PRs in Round 64 Phase 4. The habit of "push, wait for a webhook" adds 5–15 minutes per merge and encourages context-switching. Adopt active polling as the default; reserve webhooks for failure notifications you didn't initiate.
_2026-04-22 · Round 64 Phase 4 PRs #6–#14_

#### Pre-merge checklist + self-merge authority — shorter feedback loop, still gated
Round 64 Phase 4 formalized a 7-item pre-merge checklist (CLAUDE.md §11) that the agent runs after CI turns green and before calling `merge_pull_request`. Self-merge authority applies when every item passes, for doc-only, tooling, and batch-spec'd feature PRs. Escalate for auth/payment/RLS changes, ambiguous MUST-FIX findings, or spec drift. Practical effect: 9 PRs merged by the agent in one session without human intervention, with zero revert-required issues. The checklist lives in CLAUDE.md rather than WORKFLOW.md because it's an *agent behavior rule*, not a workflow step.
_2026-04-22 · Round 64 Phase 4 workflow evolution_

#### Bundle multiple trivial PRs into a dependency chain, not parallel branches
Four small PRs (#11 migration, #12 smoke scripts, #13 env docs, #14 handoff) were all logically sequential — each referenced the prior merge's artifact. Creating them serially (each off main, pushed + self-merged before the next) kept `git log` linear and let Supabase Preview's migration bootstrap-chain validate correctly. Creating them as parallel branches would have forced rebases and risked chain breaks. Rule: when PRs build on each other's artifacts, serialize them; only parallelize when the diffs are truly independent.
_2026-04-22 · Round 64 Phase 4 closeout PRs_

#### Five-tier testing protocol established — pointer to docs/testing-strategy.md
Round 64 Phase 4 produced the first explicit testing strategy for this repo: Tier 1 static (tsc + build + lint + vitest), Tier 2 unit/integration (vitest on changed files), Tier 3 contract/API (smoke scripts), Tier 4 E2E (Playwright against the Vercel Preview), Tier 5 experiential (AI-as-judge using the "Sarah, 38-year-old busy mom" canonical persona). Per-batch tier selection lives in the batch spec. The "Test plan" section of every PR template should cite which tiers ran. Full protocol + persona in `docs/testing-strategy.md`.
_2026-04-22 · Round 64 Phase 4 Batch 4.5_

#### Grep the filesystem before assuming tooling isn't built
Starting Batch T.1, I read `docs/testing-strategy.md` and treated its "blockers to unlock this tier" language as current state — then spent the first 20% of the batch re-authoring a workflow before discovering `.github/workflows/playwright.yml`, `scripts/generate-synthetic-ux-report.ts`, `scripts/generate-creative-director-audit.ts`, `scripts/generate-growth-audit.ts`, and seven persona prompt files in `e2e/prompts/personas/` already existed. Docs lag reality; the filesystem is truth. Session start now runs `ls .github/workflows/ scripts/ e2e/ e2e/prompts/ 2>/dev/null` and `grep -l "ANTHROPIC" scripts/ .github/workflows/` as a 10-second sanity check before scoping any testing / tooling batch. Applies equally to any "we should add X" impulse — check if X was already added and forgotten.
_2026-04-22 · Round 64 Phase 5 Batch T.1_

#### PR-triggered Tier 3/5 harness is live — see `.github/workflows/playwright-pr.yml`
After T.1 merged, every non-draft PR touching `src/` or `e2e/` auto-runs: (1) `wait-for-preview` (github-script polls GitHub Deployments API — does NOT hit the URL so Preview Protection is transparent), (2) `e2e` runs Playwright against the resolved preview URL with `x-vercel-protection-bypass` header, (3) `ai-judge` matrix runs the Sarah persona against customer/provider/admin screens if `ANTHROPIC_API_KEY` is set (remove the secret to kill Tier 5 spend), (4) `comment` posts an idempotent status comment via `peter-evans/find-comment` + `create-or-update-comment` with `edit-mode: replace`. The existing manual `playwright.yml` is untouched and remains the full-catalog audit runner. Budget: ~$0.30-0.50/PR with the AI judge on.
_2026-04-22 · Round 64 Phase 5 Batch T.1_

#### Silent try/catch on AI model call hides a dead model ID — surface errors, don't scaffold
Batch T.4 shipped milestone captures that reached `ai-judge` intact (T.6 diagnostic confirmed 7 PNGs + manifest.json round-tripped through upload/download). But the PR comment still showed `—` across every role. Cause: `scripts/generate-synthetic-ux-report.ts` defaulted to `claude-sonnet-4-20250514` (Sonnet 4.0, May 2025), which 404'd on every call; the script's blanket `catch (aiError)` silently fell back to scaffold mode that doesn't write `ux-review-scores-*.json`. The existing comment had one footnote for the scaffold state — "no milestone screenshots captured" — and it fires equally for "genuinely zero screens" and "AI crashed", so the error never surfaced. Two-part lesson: (1) any script that wraps a critical external call in try/catch must also persist + surface the error (error.json + visible banner in the PR body); (2) model defaults drift — match the repo's canonical model helper. `supabase/functions/_shared/anthropic.ts` uses `claude-haiku-4-5-20251001`; align the UX-judge scripts to the same ID. Cost: ~4 CI cycles across T.4 and T.6 to identify (artifact-flow diagnostic was wasted motion because the milestones were always fine).
_2026-04-23 · Round 64 Phase 5 Batch T.6_

#### `paths-ignore` on `pull_request` — workflow-file edits DO trigger even when other paths match the ignore list
Pushed T.6 with `.github/workflows/playwright-pr.yml` edited plus `docs/working/plan.md` + a new `docs/working/batch-specs/*.md` file. The workflow's own `paths-ignore: ["docs/**", "**/*.md", ".gitignore"]` includes two of the three files — but GitHub uses OR semantics, not AND. A PR triggers the workflow if **any** changed file is NOT in paths-ignore. The workflow-file edit itself isn't in paths-ignore, so the workflow ran as expected on every push. Good to know: you can safely ship a workflow change in the same PR as docs-only changes without gating the run. Separate from the earlier lesson (which observed docs-only PRs sometimes running anyway — that's about false-run triggers; this is about expected-run triggers).
_2026-04-23 · Round 64 Phase 5 Batch T.6_

#### Edit-in-place PR comments emit `issue_comment.edited`, which the agent webhook subscription misses
`peter-evans/create-or-update-comment@v4` with `edit-mode: replace` creates the comment on first run and edits it on subsequent runs. The `.edited` event is not in the current webhook subscription set (only `.created` arrives). Result: the agent receives one webhook for the first CI-complete status comment and zero webhooks for every subsequent re-run, even though CI genuinely transitioned. Workaround that actually works: poll `mcp__github__pull_request_read get_check_runs` every few minutes after each push — per CLAUDE.md §11 "actively poll, don't wait on silent success webhooks". Longer-term fix options: (a) have the workflow post a fresh short-lived comment per run in addition to editing the main one, (b) subscribe to `issue_comment.edited` if the platform allows. For now, poll.
_2026-04-23 · Round 64 Phase 5 Batch T.6_

#### Diagnostic CI output can't reach the agent via logs or step-summary — route it into the PR comment body
`$GITHUB_STEP_SUMMARY` renders beautifully in the Actions UI but isn't exposed via REST, so an agent running outside the browser is blind to it. Job logs ARE in REST but gated by auth — anonymous curl returned 403. Fastest working path for T.6: write the diagnostic text to a tiny dedicated file inside a job, `upload-artifact` it under a unique name, `download-artifact` the whole pattern in the downstream `comment` job, concatenate the files into a step output, and inject that output into the PR status comment body. `get_comments` on the PR returns the comment text via MCP — no auth issues. One full round-trip, ~30 extra lines of yaml, and the diagnostic is permanently scannable from any agent/human with PR read access. Pattern will stay in this workflow as a low-cost always-on milestone inventory even after T.6 resolves.
_2026-04-23 · Round 64 Phase 5 Batch T.6_

#### Upstream gap: no MCP tool exposes GitHub Actions job logs — workaround is artifact → PR-comment plumbing
The MCP github server (`@modelcontextprotocol/server-github` and friends) covers PRs / commits / branches / search but not workflow-run logs. Direct `curl` to `api.github.com/repos/.../actions/jobs/$id/logs` returns 403 from sandbox / agent contexts (auth-walled even for public repos). Net effect: when CI surfaces useful debug-only output via stdout or `$GITHUB_STEP_SUMMARY`, the agent can't read it. T.6 spent 3 CI cycles building the artifact-upload → comment-download workaround. Until upstream ships an MCP equivalent, encode any agent-relevant CI diagnostic into the PR comment body or an artifact the comment job can render — never assume job logs are reachable.
_2026-04-25 · Batch DX.1 retrospective_

#### Upstream gap: `peter-evans/create-or-update-comment@v4` with `edit-mode: replace` emits `issue_comment.edited`, not `.created`
The Anthropic agent webhook subscription (as observed during Round 64 Phase 5) only fires on `issue_comment.created` events. A workflow that creates a status comment on first run and edits it on subsequent runs (the canonical pattern for keeping a PR thread tidy) only delivers ONE webhook to the agent — the very first one. Every re-run of CI is silent. Workaround that worked: actively poll `mcp__github__pull_request_read get_check_runs` after every push per CLAUDE.md §11. Long-term fix is upstream — either subscribe to `.edited` events too, or have the workflow post a fresh ephemeral comment per run as a notification trigger.
_2026-04-25 · Batch DX.1 retrospective_

### Workflow tooling shipped in DX.1

#### `bash scripts/pre-pr-check.sh` runs Tier 1 + 2 gates in parallel — invoke before opening any feature PR
Replaces the manual `tsc + build + vitest` cycle that recurred 7+ times in a session. Ships with `PRE_PR_SKIP_BUILD=1` (TS-only / docs-only changes per CLAUDE.md §13) and `PRE_PR_SKIP_VITEST=1` (when no test files touched) escape hatches. Prints a per-gate ✅/❌ table and tails the failing gate's last 40 lines. Slash command: `/pre-pr`.
_2026-04-25 · Batch DX.1_

#### `bash scripts/check-migration-chain.sh` validates the bootstrap-chain header on uncommitted migrations
Defaults to `--uncommitted` mode (staged + unstaged + untracked). Catches the orphan-chain trap (lessons-learned entry "Migrations must declare `-- Previous migration: …`") before push. Pass `--all` for an audit run that flags 200+ historical violations from before the rule was mandatory. Add to your pre-push routine on any batch that touches `supabase/migrations/`.
_2026-04-25 · Batch DX.1_

#### `/closeout` slash command — post-merge sync-and-PR loop
Runbook for the docs-only PR that follows every feature merge: sync `main`, branch, update `plan.md` Session Handoff + sarah-backlog (apply §5.9 promotion rule if 3-strikes triggered), commit, PR, self-merge per CLAUDE.md §11. Replaces the manual closeout flow (5×/session in Round 64 Phase 5).
_2026-04-25 · Batch DX.1_

#### `.github/workflows/regen-types.yml` — auto-regen Supabase types after migrations land on main
Ships dormant: the regenerate step skips when `SUPABASE_ACCESS_TOKEN` is unset and emits a `$GITHUB_STEP_SUMMARY` activation guide. Once the secret lands (logged in `docs/upcoming/TODO.md`), every push-to-main touching `supabase/migrations/**` opens a PR with a refreshed `src/integrations/supabase/types.ts`. Closes the recurring `as any` carry-over loop documented across Round 64 Phases 1–5 (Snap, Plan Variants, Credits, customer_issues.category).
_2026-04-25 · Batch DX.1_

### Code review

#### Inline synthesis cuts the Lane 4 corner — always spawn the synthesis sub-agent
CLAUDE.md §5 + §7 rule 3 are explicit: Lanes 1–3 run as sub-agents, and a Lane 4 sub-agent is the **only** place the three lane outputs cross-validate. Doing synthesis inline in the main context defeats both goals — lane noise floods the main context (~3× expected token load for a Medium batch), and no independent cross-reading catches contradictions or inter-lane gaps. A retroactive Lane 4 run on Batch 4.2 confirmed all 7 MUST/high-value fixes were correct, but caught one missed SHOULD-FIX (score 30): `spend_handles` returns `new_balance` yet `onSuccess` didn't seed `["handle_balance"]` cache, causing a stale-balance flash on CreditsRing. Required cross-reading the RPC return shape against the onSuccess handler — neither lane could spot it alone. Lesson: never skip Lane 4, and tag any deviation with `[OVERRIDE: ...]` so `git log` grep surfaces the corner.
_2026-04-22 · Round 64 Phase 4 Batch 4.2_

#### Multi-agent audits produce high volume but need synthesis
4 UI/UX agents + 5 gstack agents = 9 reports; without a Lane 4 synthesis step, duplicate and contradictory findings pile up. The gstack framework (6 Forcing Questions, CEO Review scope analysis, CSO audit) all produce actionable findings — CSO caught 3 genuine critical vulnerabilities that needed immediate fixing.
_2026-03-29 · Session 1_

#### Custom review lanes work well for non-code content
Replacing standard code-review lanes (Spec Completeness / Bug Scan / Historical) with content-appropriate ones (Senior Editor / Fact Checker / Synthesis) produced higher-quality findings. Fact Checker caught 5 of 8 issues by cross-referencing training content against the actual codebase — something standard Bug Scan wouldn't attempt on `.ts` content files.
_2026-03-30 · PRD-043 review configuration_

#### Content work benefits from structured review even more than code does
15 Academy training modules written in one continuous session (skipping PRD → Plan → Batch → Review) — two post-hoc reviews caught 8 SHOULD-FIX issues that would have actively misled operators: nonexistent UI buttons, factual contradictions between modules, wrong navigation paths, incorrect Stripe Connect status labels, thin modules. Factual errors in training content are higher-cost than in code because operators internalize them as truth. Always run structured reviews on training content.
_2026-03-30 · PRD-043_

#### Fact-check any document that informs business decisions
B2 fact-check review found 2 MUST-FIX issues: 4 of 6 margin percentages in a pricing report were wrong (mixed formulas), and the report had a fabricated 55% scenario not present in simulator output. At 90% utilization the loss was understated by 7.4 points (-17.3% vs -24.7%). Any document driving pricing decisions gets a dedicated fact-checker lane cross-referencing every claim against actual data sources.
_2026-03-31 · PRD-047 B2 review_

#### Cross-reference training content against the codebase
Top impactful errors found in an academy audit: dunning ladder had wrong day numbers (operators would tell customers "day 21" vs actual day 14), zone health table described 5 columns that don't exist in code, payout threshold was $25 in training but $50 in code, first-week module described a sidebar ("Dispatch, Providers, Zones, Reports, Settings") bearing no resemblance to the actual nav. Always cross-reference training against the codebase.
_2026-04-03 · Round 62 academy audit_

#### Lane 3 skip rule works for first-batch-in-phase
Skipping Lane 3 (historical context) when there's no prior review history on changed files saved an agent without losing signal. Lane 2 already covers pattern detection. Across Session 2, 6 reviews ran with Lane 3 skipped: all found real issues, zero false-positive MUST-FIX findings. Documented as `[OVERRIDE: first batch in phase]` in commits.
_2026-03-30 · PRD-026 review setup_

#### Review agents catch bugs even on migration-only + DB-only batches
B7 reviewer caught `select("id", { count: "exact", head: true })` returning `null` for `data` (count is on a separate response field); `data?.length` silently returned 0 for all users, which would have shipped a referral progress bar permanently stuck at zero. Database-only batches still benefit from review when they include any UI consumer.
_2026-04-01 · Round 9 Phase 4 B7_

#### Review agents catch query-key mismatches that cause stale UI
`useHouseholdInvites` invalidated `["household-members"]` but PropertyGate's query key was `["isHouseholdMember"]`. New household members would pass the RPC acceptance but still be redirected to onboarding until manual refresh. Query-key alignment across hooks that affect the same state is a recurring review-surface area.
_2026-04-02 · Round 10 Phase 2 B4+B5_

#### Parallel audit agents are the most efficient polish pattern
Launching 2–3 Sonnet audit agents in parallel per batch of features, processing results sequentially, achieved ~220 features audited in one session at 55% context. Each agent costs ~0.5–1% main context (result notification only). The key efficiency: agents find the bugs, main thread just applies fixes and pushes. Follow-up session (Rounds 51–60) confirmed: 4–5 audit agents in parallel (edge functions, platform infra, testing/legal, design/UX) produced maximum throughput, with `isError` the single most common finding.
_2026-04-02 · Rounds 30–48 + Rounds 51–60_

#### Large-batch 5-agent review can be overridden when 3-lane findings are unambiguous
Large batches normally run 3 parallel lanes + Sonnet synthesis + Haiku second-opinion = 5 agents. Override Lanes 4+5 only when the 3-lane output meets all three: (a) no contradictions between lanes, (b) every finding has file:line specificity, (c) no finding straddles lane boundaries needing synthesis mediation. Document as `[OVERRIDE]` in the fix commit with reasoning. When any condition fails (contradictions, ambiguity, cross-cutting issues), run the full 5 — synthesis is exactly for reconciling those.
_2026-04-22 · Batches 2.3 + 3.3_

#### Background agents unlock parallel review + forward work
Launched Batch 3.4's combined review as `run_in_background: true`, then started Batch 3.5 implementation immediately (different files, disjoint scope). When 3.4's review returned, the 3.5 impl was ~60% done; I applied the 3.4 fix (`AutopaySection` `useEffect` resync), then continued 3.5. Saved ~10 minutes serial latency. Rule: when two adjacent batches are file-disjoint, run the earlier review in background and start the next impl; when files overlap, stay serial.
_2026-04-22 · Batches 3.4 + 3.5_

### Frontend patterns

#### `previewRole` must never persist in localStorage
In-memory only prevents XSS escalation. Any UI-level role override must be session-scoped, never persisted.
_2026-03-29 · Session 1 Security_

#### React.lazy code splitting is a one-line-per-import change with outsized impact
145 imports converted, Vite handles chunking automatically. Worth doing early — converting after bundle growth is routine instead of remarkable.
_2026-03-29 · Session 1_

#### QueryClient `staleTime: 0` (the default) re-fetches everything on every navigation
Setting `staleTime: 60_000` dramatically reduces DB load with negligible UX impact. Set at the `QueryClient` level, then override per-query only where you genuinely need fresh data.
_2026-03-29 · Session 1_

#### Porting `tools/` code to `src/` for admin UI is clean
Copying the simulation engine from `tools/market-simulation/` to `src/lib/simulation/` with Node.js code stripped worked cleanly. Key moves: strip CLI runners, use `Record<string, …>` instead of `Record<keyof, …>` for bounds (needed for slider iteration), add seasonal presets inline.
_2026-03-31 · Round 5 Phase 1_

#### `isError` is the most common missing state across the codebase
Across 22+ polish rounds the single most common finding was missing `isError` handling on `useQuery` results — pages showed infinite loading skeletons or misleading empty states on network failure. Grep gate: `grep -rl "isLoading" src/pages/ | while read f; do grep -q "isError" "$f" || echo "$f"; done`.
_2026-04-02 · Rounds 30–60 polish_

#### Dark-mode violations cluster in admin pages and status badges
Customer-facing pages consistently use semantic tokens (`text-success`, `text-destructive`). Admin pages more often use raw Tailwind (`text-green-600`, `text-amber-600`, `bg-green-100`) because they were built faster with less design review. Grep for `text-green-|text-red-|text-amber-|bg-green-|bg-red-` in `src/pages/admin/`.
_2026-04-02 · 8 dark-mode fixes (CronHealth, OpsJobs, AiInsightsCard, ProviderAccountability, Apply, ApplicationDetail, OpsExceptionQueue, OpsExceptionDetailPanel)_

#### Tailwind token typos don't fail the build — silent no-op classes
`bg-warn/10 text-warn` rendered with no background and no foreground color. Tailwind's JIT silently drops unknown class names rather than erroring. The project uses `warning`, not `warn`. `npm run build` passes either way. Visual-regression screenshots are the only reliable catch; a grep for `bg-[a-z]+/\d+` cross-checked against `tailwind.config.ts` tokens is a cheap pre-commit check.
_2026-04-20 · Round 64 Batch 1.3_

#### Radix Select + null state needs a sentinel, not empty string
Radix UI's Select rejects `""` as a SelectItem value but will accept it on the root Select (triggering placeholder render). Standardize on `__none__` sentinel across nullable enum-selects: reserve the string, map it to null in the onChange handler. Inconsistency (one select using `__none__`, another using `""`) works but drifts — align to `__none__` everywhere.
_2026-04-20 · Round 64 Batch 1.3_

#### `parseInt(price.replace(/[^0-9]/g, ""), 10)` eats all digits including the cycle suffix
`BundleSavingsCard` parsed `"$149/4 weeks"` as `1494` because `[^0-9]` strips ALL non-digits. Fix with a capture group: `/\$(\d+)/` match on the price prefix. Any price-parsing code should be reviewed for multi-digit format strings.
_2026-04-02 · Round 57 audit_

#### Shared react-query keys cross-contaminate silently when Map shapes drift
Three screens (`PlanStep.tsx`, `Plans.tsx`, `PlanActivateStep.tsx`) all used `queryKey: ["plan_handles_all"]` but populated the Map with different value shapes (full row / partial row / bare number). react-query shares the cache across screens — whichever loaded first won, the second crashed on `.handles_per_cycle` against a number or got stripped objects. Build passes in isolation; crash only appears on navigation. When multiple files share a query key, the queryFn return shape is a public contract. Either align all producers to the richest shape, or narrow the key (e.g., `["plan_handles_all", "numbers"]`). Grep for shared query keys at review time.
_2026-04-22 · Batch 2.2 Lane 2 MUST-FIX_

#### Local state derived from a TanStack query needs explicit `useEffect` resync
`useState({ enabled: settings?.enabled ?? false, … })` runs once on mount — when the query resolves later and `settings` flips from `null` → `{enabled: true, …}`, local state stays on the defaults. Fix: `useEffect(() => setLocal({...settings}), [settings?.enabled, …])`. Alternative is to derive directly from `settings` without local state, but that's messier with optimistic form changes. Watch for `useState(() => query.data?.foo ?? default)` — almost always needs a resync effect.
_2026-04-22 · Batch 3.4 Lane 2 SHOULD-FIX — AutopaySection_

#### Vite env var precedence: shell env > `.env.*` files
Vite loads `.env` via `dotenv`, and dotenv does not overwrite already-set environment variables. Vercel's injected env vars always beat whatever's committed. The committed `.env` is a fallback, not a source of truth — production can target a different Supabase project and nothing warns you. When cutting over projects, keep the committed `.env` aligned with Vercel's Production vars as hygiene.
_2026-04-21 · Round 64.5 Phase D-3 / F_

#### `?redirect=` on ProtectedRoute preserves query params through the auth bounce
`ProtectedRoute.tsx` encodes the full `pathname + search + hash` into `/auth?redirect=...`, and `AuthPage.tsx` consumes it post-login. So a deep link like `/customer/more?drawer=true` does survive the unauthenticated flow intact — the user lands back at the original URL, which React Router then redirects (Batch 5.1) to `/customer?drawer=true`, and `AvatarDrawer` (Batch 5.2) reads the param and auto-opens. Do NOT reach for sessionStorage stash patterns before verifying whether `ProtectedRoute`'s `?redirect=` already covers the case — a prior Batch 5.1 Lane 4 synthesis flagged this as a gap and it was a false positive. If you add a new auth-guarded route, double-check that it goes through `ProtectedRoute` (not a bespoke bounce) and you inherit this behavior for free.
_2026-04-22 · Round 64 Phase 5 Batch 5.2 investigation (supersedes Batch 5.1 entry above)_

### Backend / DB / RPCs / Edge functions

#### Edge Functions with `verify_jwt = false` need explicit auth guards
19 functions were publicly callable. The `_shared/auth.ts` pattern (`requireCronSecret`, `requireServiceRole`, `requireUserJwt`, `requireAdminJwt`, `requireAdminOrCron`) standardizes auth across all functions. Any new function must declare its mode from one of these five.
_2026-03-29 · Session 1 Security_

#### `requireCronSecret` must sit inside `try/catch`
If it throws outside the catch block, the error becomes a generic 500 instead of a meaningful 401. Apply to all auth helpers — wrap the assertion so the caller sees the intended status code.
_2026-03-29 · Session 1 reviewer catch_

#### Supabase joins via PostgREST hint syntax
`select("*, provider_orgs:provider_org_id(name)")` enriches payouts with provider names in a single query. Use embedded-resource syntax to avoid N+1 client roundtrips.
_2026-03-29 · Session 1_

#### Deno tests for edge functions only reach auth guards without staging credentials
Without valid service role keys, Deno tests can only verify CORS and auth rejection — business-logic coverage requires a staging Supabase instance. Plan for staging creds in CI setup; don't discover this when writing the tests.
_2026-03-30 · PRD-023_

#### NULL-inheritance columns are clean + safe for level-specific overrides
Adding nullable override columns to `sku_levels` (`presence_required`, `access_mode`, `weather_sensitive`) with `NULL = "inherit from parent SKU"` avoids duplicating data while supporting per-level differences. Only 4 of 54 levels needed overrides (Window Cleaning L2/L3, Pest Control L2/L3), validating that the inheritance default handles 93% of cases.
_2026-03-31 · PRD-048 B1_

#### Per-handle margin is always negative by design
Revenue per handle ($6.03) < cost per handle ($7.86) means every individual service visit is a net loss; the subscription model profits from handle underutilization (break-even at 72.2%). Validation scripts that flag "negative margin" on every SKU are correct but misleading — flag logic must account for the underutilization model, not treat each negative-margin SKU as a bug.
_2026-03-31 · PRD-047 B1_

#### RLS self-referencing policies cause infinite recursion in Postgres
A SELECT policy on `household_members` that queries `household_members` to check membership raises `ERROR: infinite recursion detected in policy`. Fix: `SECURITY DEFINER` helper functions (e.g., `get_user_household_property_ids`, `is_household_owner`) that bypass RLS. Known Supabase multi-tenant pattern. Any table where RLS needs to self-reference requires a helper.
_2026-04-02 · Round 10 Phase 2 B3_

#### Status-enum mismatches silently break whole feature chains
`apply_referral_credits_to_invoice` filtered `status = 'PENDING'` but `generate_subscription_invoice` creates invoices as `'DUE'`. Credits were NEVER auto-applied — the entire credit system was silently broken. One SQL change (accept `DUE`) unblocked customer credits + referral rewards. Rule: any function filtering by a status enum must be verified against every caller that sets that status.
_2026-04-03 · Round 62 Batch 8_

#### Cron registration is the most commonly forgotten infrastructure step
7 automation engine functions (assign-visits, check-no-shows, check-weather, evaluate-provider-sla, run-billing-automation, run-dunning, weekly-payout) were fully implemented + deployed but had zero `cron.schedule()` calls — none would have run autonomously. Deploying a function is not the same as scheduling it. Add cron registration to the deploy checklist.
_2026-04-03 · Round 62 Batches 5–7_

#### jsonb metadata bags need shallow-merge semantics, not replace
`customer_onboarding_progress.metadata` is jsonb — flexible, with multiple steps over time stashing their own fields (`plan_variant_selection`, later `autopay_credits`, etc.). Replacing wholesale clobbers every other writer the moment a second writer appears. Fix: `{ ...(existing.metadata ?? {}), ...updates.metadata }` in the mutation. Any hook writing to a jsonb bag should default to shallow-merge. Grep signal: `metadata: (updates.metadata ?? existing.metadata)` — likely needs fixing.
_2026-04-22 · Batch 2.2 useOnboardingProgress_

#### `.env` tracked in git from project import — gitignore after initial commit has no effect
`.env` was in `.gitignore` but also in `git ls-files .env` because the initial Lovable import included it. Gitignore only applies to UNTRACKED files — once tracked it keeps tracking. Not a live leak in this case (publishable keys only) but worth a `git rm --cached .env` + recommit. For any project imported from another platform, run `git ls-files | xargs git check-ignore 2>/dev/null` to surface drift.
_2026-04-21 · Round 64.5 Phase F pre-flight_

#### `[object Object]` error messages come from `JSON.stringify(err)` on Error instances
Error instances serialize to `"[object Object]"` because their enumerable properties are empty. Needs `err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err))`. Classic pattern worth a codebase-wide grep + fix sweep; every catch block with this pattern loses useful diagnostics on real errors.
_2026-04-21 · check-weather cron smoke test_

#### Supabase Cloud locks `ALTER DATABASE` from the postgres role — use Vault for cron secrets
`ALTER DATABASE postgres SET app.settings.service_role_key = …` returns `ERROR 42501: permission denied` from both Management API AND dashboard SQL editor — the `postgres` role lost this privilege in 2024–2025. Working pattern: `vault.create_secret(<key>, 'service_role_key')` + `SECURITY DEFINER` helper (`cron_private.invoke_edge_function`) that reads from `vault.decrypted_secrets` at cron execution time. Any cron job registered today should go through the helper, not inline `current_setting('app.settings.*')`.
_2026-04-21 · Round 64.5 Phase C-6_

### Stripe & payments

#### Stripe webhook must fail closed
The original code accepted unsigned events as fallback. Always throw if `STRIPE_WEBHOOK_SECRET` is not configured; never serve a signature-verification bypass for "dev" convenience.
_2026-03-29 · Session 1 Security_

#### Stripe's 2025 API retired `transfer.paid` + `transfer.failed` — use `transfer.created` + `transfer.reversed`
On API version `2025-08-27.basil` and later, transfers to connected accounts are atomic — old `transfer.paid` / `transfer.failed` events are gone. `transfer.created` carries the same terminal semantic as old paid; `transfer.reversed` replaces failed. Handlers listening on retired names never fire. When Stripe's event picker shows fewer events than your handler expects, check the changelog before assuming a UI bug.
_2026-04-21 · Round 64.5 webhook destination setup_

#### Stripe webhook branching must require BOTH `mode` AND `metadata.origin`
`checkout.session.completed` fires for both subscription-create (`mode: 'subscription'`) and credit-pack top-up (`mode: 'payment'` + `metadata.origin: 'credit_pack_topup'`). Branching only on `mode` is fragile — a future `mode: 'payment'` flow (gift cards, one-off service add-ons) would silently route through the topup handler. Require both. Every new payment path gets a unique `origin` string so the handler can't be mistaken. Also: for off-session PaymentIntents, check `pi.status !== 'succeeded'` explicitly rather than assuming non-error = success (SCA challenges land as `requires_action`).
_2026-04-22 · Batch 3.3 + Batch 3.4_

#### Stripe webhook dedupe pre-commits the event → paid-but-no-credits is real
`stripe-webhook/index.ts` inserts `payment_webhook_events` with `processed: false` *before* the switch runs. If the switch fails mid-case (RPC error, malformed metadata), Stripe retries — but the retry's insert hits `23505` on `processor_event_id` and returns `{duplicate: true}` status 200. Customer charged, no credits granted, no retry possible. Fix: every terminal failure in a money-moving branch writes a `billing_exceptions` row (severity=HIGH) with a specific `type` tag so ops can reconcile manually. Fundamental fix would be making dedupe transactional with side effects, but a webhook-wide rewrite; billing_exceptions escape valve is cheaper and equally safe.
_2026-04-22 · Batch 3.3 Lane 2 synthesis_

#### Reuse Stripe customer id from the subscription row; don't look up by email
Looking up by email (`stripe.customers.list({ email, limit: 1 })`) cross-links distinct Supabase users who share an email address to the same Stripe customer — and therefore the same saved payment methods. Canonical link is `subscriptions.stripe_customer_id`, pinned at subscription creation. Fix order: `subscription.stripe_customer_id ?? emailLookup ?? stripe.customers.create(...)`. General principle: if a local FK is present, use it; email-as-key is a last-resort bootstrap.
_2026-04-22 · Batch 3.3 Lane 2 MUST-FIX_

### Supabase & infrastructure

#### Supabase pooler is blocked from the sandbox — Management API is the end-run
`supabase db push` requires a live connection to the session pooler on port 5432/6543. The sandbox allowlist permits `api.supabase.com` (HTTPS) but blocks `aws-*.pooler.supabase.com`. Workaround: POST SQL to `https://api.supabase.com/v1/projects/$REF/database/query` — accepts arbitrary DDL + seed inserts, returns structured results. If the CLI hangs on a network error, don't debug — pivot to the REST endpoint or Supabase MCP `apply_migration`, both HTTPS. Same applies to `pg_dump` from legacy projects.
_2026-04-21 · Round 64.5 Phase C-1_

#### Sandbox network allowlist is narrow — plan tooling around it
Confirmed reachable from sandbox: `api.supabase.com`, `api.anthropic.com`, `api.github.com` (via MCP). Confirmed blocked: `api.vercel.com`, `*.vercel.app`, `handledhome.app` (resolves to Vercel), `api.weatherapi.com`. Tokens for blocked hosts still get saved for local Claude Code use but fail `HTTP 403 Host not in allowlist` in the sandbox. Treat Vercel-side ops (env vars, redeploys, logs) as user-escalated by default. Supabase-side ops are fully autonomous. Lean on GitHub↔Vercel auto-deploy — pushing to `main` = triggering a deploy.
_2026-04-21 · Round 64.5 Phase E_

#### Supabase MCP > curl for structured ops; CLI is the escape hatch for weird ops
Added `@supabase/mcp-server-supabase` to `.mcp.json` mid-round. MCP tools (`execute_sql`, `apply_migration`, `get_advisors`) eliminated ~6 JSON-escape dances around `curl -d '{"query": ...}'`. CLI stays useful for `functions deploy --use-api` (CLI handles multi-file `_shared/` uploads more reliably) and `secrets set` with many keys at once. Install the MCP as soon as you have a known project-ref; keep the CLI for bulk ops.
_2026-04-21 · Round 64.5 MCP install_

#### Google Cloud "Authorized domains" ≠ OAuth Client "Authorized redirect URIs"
The OAuth Consent Screen's **Authorized domains** field is for "top private domains" you control — `supabase.co` is rejected because you don't own it. The Supabase auth callback (`https://<ref>.supabase.co/auth/v1/callback`) goes in the OAuth Client's **Authorized redirect URIs**, a separate page. Two fields, two purposes, same-looking UI. Consent screen gets only your owned domains (e.g., `handledhome.app`); client gets localhost + prod + prod-www as JavaScript origins and Supabase callback as redirect URI.
_2026-04-21 · Round 64.5 Google OAuth setup_

#### Resend (and most modern SaaS) API keys are revealed only at creation
Resend's dashboard and API both hard-refuse to return stored key values once the creation modal closes. If the key wasn't saved immediately, the only path is delete + create new. Standard for Stripe live keys, Twilio auth tokens, etc. Plan to capture keys at creation into a password manager or secrets file, and put that instruction into the user-facing TODO when asking for any API key.
_2026-04-21 · Round 64.5 Phase C-4_

#### Migrations must declare `-- Previous migration: …` or Supabase Preview blocks every PR
The Supabase↔GitHub integration refuses to build a preview branch if any migration in the diff has no declared parent — and it blocks the *entire PR's* Supabase Preview check, not just the orphan. PR #6 in Round 64 Phase 4 shipped two unchained migrations which silently gated every subsequent PR's preview for hours until PR #7 backfilled the chain comments. First line of every new `20YYMMDDHHMMSS_slug.sql` must be `-- Previous migration: <filename>` pointing at the most recent migration already on `main`. When merging a branch whose first migration predates `main` HEAD, re-point the chain during merge. Documented in DEPLOYMENT.md §2 "Migration bootstrap-chain rule."
_2026-04-22 · Round 64 Phase 4 PR #7 bootstrap fix_

#### Three persistent test users are provisioned — use them for Tier 3+ testing
`bkennington+{customer,provider,admin}@bluekube.com` exist in prod with role assignments pinned via migration `20260422210000`. Passwords live in `.claude/settings.local.json` (gitignored) and are placeholders in `.claude/settings.local.example.json`. Two smoke scripts verify: `scripts/smoke-auth-roles.sh` hits the DB-level view `bkennington_profile_roles`; `scripts/smoke-auth.mjs` logs in via the JS SDK and asserts the role. New Tier 3/4 tests should reuse these accounts rather than provisioning per-test users.
_2026-04-22 · Round 64 Phase 4 PRs #11–#12_

#### Vercel Preview Protection requires the bypass header — and `wait-for-vercel-preview` can't send it
`patrickedqvist/wait-for-vercel-preview@v1.3.1` resolves the preview URL via GitHub Deployments API (correct) but then does its own HTTP probe *without* the `x-vercel-protection-bypass` header. Under Preview Protection the probe returns 401 forever and the action times out — even though the URL output was set mid-run. Fix: replace the action with an `actions/github-script@v7` block that polls Deployments API (`listDeployments({ sha })` → `listDeploymentStatuses` → first `state=success` with `environment_url`) and skips the HTTP check entirely. Canonical implementation in `.github/workflows/playwright-pr.yml` job `wait-for-preview`.
_2026-04-22 · Round 64 Phase 5 Batch T.1_

#### `x-vercel-set-bypass-cookie` triggers a 307 redirect — drop it for stateless automation
Vercel's bypass header pair is two separate knobs: `x-vercel-protection-bypass: <secret>` authenticates the request; `x-vercel-set-bypass-cookie: samesitenone` *additionally* asks Vercel to set a persistent cookie — which Vercel implements via a 307 redirect to the destination. `curl` without `-L` sees the 307 and aborts; Playwright follows the redirect but pays a round-trip per navigation. Neither case needs cookie persistence — extraHTTPHeaders re-sends the auth header on every request. Send `x-vercel-protection-bypass` alone. Cost T.1 four CI iterations to diagnose.
_2026-04-22 · Round 64 Phase 5 Batch T.1_

#### Prefer `npm ci` over `bun install --frozen-lockfile` in CI when `package-lock.json` is committed
Three CI iterations on PR #19 failed in ~12 seconds at `bun install --frozen-lockfile`, too early for `npx playwright install` to even start and too opaque to diagnose without downloading artifacts. Switching to `actions/setup-node@v4` + `cache: npm` + `npm ci` worked on the first attempt. bun's lockfile format can drift between minor releases; `npm ci` with committed `package-lock.json` is the reliable fallback. The manual `playwright.yml` is still on bun — don't change two things at once.
_2026-04-22 · Round 64 Phase 5 Batch T.1_

#### Use `GITHUB_STEP_SUMMARY` for CI failure diagnostics — beats artifact downloads
Playwright's html-report artifact is the gold-standard debugger but requires downloading a zip and opening locally. A one-step `if: failure()` block that dumps `test-results/.last-run.json`, each `error-context.md`, tails of `stdout.txt`, and the screenshot inventory into `$GITHUB_STEP_SUMMARY` renders in the Actions UI summary tab immediately — no download cycle. Pattern in `.github/workflows/playwright-pr.yml` "Print Playwright failure summary" step. Apply to any long-running CI job where diagnosis currently requires artifact downloads.
_2026-04-22 · Round 64 Phase 5 Batch T.1_

#### `paths-ignore` on `pull_request` doesn't reliably skip the workflow
Set `paths-ignore: ["docs/**", "**/*.md", ".gitignore"]` on a `pull_request` workflow and pushed a docs-only commit — expected the workflow to skip entirely. It still queued and ran `wait-for-preview`. GitHub's path-filter semantics for `pull_request` events are inconsistent with `push` events; don't rely on `paths-ignore` as a cost-control gate. Gate at the job level with an explicit `if: !contains(github.event.pull_request.changed_files.*.filename, 'docs/')` or check the diff via `actions/github-script` in a precondition step.
_2026-04-22 · Round 64 Phase 5 Batch T.1_

#### Un-onboarded test users trip `CustomerPropertyGate` — Tier 4 assertions must allow `/customer/onboarding`
The persistent test customer has no property profile on Supabase Preview branches. `CustomerPropertyGate` redirects authenticated users without a property to `/customer/onboarding`, so every gated destination (Plans, Billing, Credits, Settings, Referrals, Support) lands on /onboarding during Tier 4 runs. Don't assert exact destination URLs in drawer/nav specs — accept either the intended destination OR `/customer/onboarding` via regex. Long-term fix (logged in `docs/upcoming/TODO.md`): seed a property via migration or per-spec `beforeAll` RPC. Until then, keep assertions intent-based: "click fires navigate + drawer closes" rather than "destination page rendered."
_2026-04-22 · Round 64 Phase 5 Batch T.1_

### Agent calibration & signals

#### Context usage reported in Claude Code UI overestimates by ~2×
CLAUDE.md §8b flags this. Verified during Round 64 Phase 1: I felt near capacity but `/context` showed 48% actual; after another batch + review agents it was 53%. Tentative calibration: when I self-estimate "~65% reported," actual is closer to 30–35%. Rely on `/context`, not self-assessment. Pitfall: large user pastes (~100k tokens each) feel small mid-turn but dominate the total.
_2026-04-20 · Round 64 Phase 1 session tracking_

#### Stream idle timeouts hit on single Write calls over ~400 lines
A single `Write` producing ~500+ lines of content hit `Stream idle timeout - partial response received` twice. Chunking into an initial Write (~80 lines) + 7 sequential `Edit` passes with unique trailing-context sentinels succeeded every time. For any output expected to exceed 300 lines, plan for an append pattern (Write skeleton → Edit sentinel → Edit sentinel → …). Saves a retry loop and avoids partial-file states between a failed stream and a fresh attempt.
_2026-04-20 · Round 64 FULL-IMPLEMENTATION-PLAN.md authoring_

#### 7 phases in one session achievable at ~50% context with small batches
Completed 22 batches across 7 phases in one session, reaching ~55% context. Small batches (S/Micro) with focused scope average ~2–3% context each. Reviews run as background agents and cost effectively zero main context. 60% threshold is conservative — 55% is a safe stopping point with room for doc sync.
_2026-03-31 · Round 5 execution (Phases 1–7)_

#### Two rounds in one session achievable at ~72% context
Completed Round 8 (10 batches, 5 phases) + Round 9 (9 batches, 6 phases) in one session, ~72% context. 19 batches, 11 phases, 25 features added (454 total). Background review agents are effectively free — main context only grows from implementation.
_2026-04-01 · Rounds 8–9_

#### Four rounds in one session at ~41% reported (actual lower)
4 rounds, 34 batches, 53 features, 482 total in one session. `/context` showed 41% reported, actual ~36%. Small batches + background review agents are extremely context-efficient. Product-design conversations between rounds don't consume meaningful context.
_2026-04-02 · Rounds 8–11_

#### Single zones don't break even; multi-zone amortization is the path to profitability
Fixed overhead (~$1850/month) dominates revenue at <40 customers. Optimized configuration: $129/$179/$279 pricing + $45/job payout + 4 zones → −4% margin by month 12, break-even ~month 14; total launch investment ~$21K. The autoresearch loop (100 experiments in <30s) surfaces which assumptions matter most — pricing sensitivity was the top finding.
_2026-03-29 · Session 1 Market Simulation_

#### Handle-limited vs unlimited job calculations produce wildly different economics
Assuming 4 jobs/customer/month (unlimited) produces dramatically different economics than handle-limited consumption (~2–7 jobs depending on tier). Any simulator output that feeds business decisions should verify which consumption model it uses.
_2026-03-29 · Session 1 Market Simulation_

#### Provider payout is the #1 economic lever
The spread between subscription price and provider payout determines everything. At $55/job with the original $99 Essential plan the spread was negative. Any pricing exercise should start by locking the payout line, then solve for the subscription tiers.
_2026-03-29 · Session 1 Market Simulation_



---

## Suggestions (open)

#### Screenshot-based audits need data validation step
_2026-03-29 · Session 1 post-implementation_
**Type:** Workflow · **Impact:** Prevents wasted implementation effort on data artifacts · **Effort:** Small

#### Add social proof counter ("X neighbors in your area")
_2026-03-29 · Growth audit, PRD-010 (deferred)_
**Type:** Product · **Impact:** Most powerful trust signal for neighborhood-density home services · **Effort:** Medium (needs backend zone density query)

#### Services catalog needs plan context badges
_2026-03-29 · Design audit, PRD-007 (deferred) · ✅ Resolved in PRD-021 (Session 2, 2026-03-30)_
**Type:** Product · **Impact:** Differentiates from marketplace feel, shows subscription value · **Effort:** Medium (needs `useSkus` → subscription data join)

---

## Dismissed

_None yet._
