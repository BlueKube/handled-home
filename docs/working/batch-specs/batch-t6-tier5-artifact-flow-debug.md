# Batch T.6 — Tier 5 milestone artifact-flow debug

> **Round:** 64 · **Phase:** 5 (tooling sidebar) · **Size:** Micro → Small `[OVERRIDE: Micro → Small — stale model-ID fix + error-surface hardening added logic beyond pure diagnostic; documented at reviewer's request]`
> **Review:** Quality — Small tier: 1 combined reviewer, no synthesis (single input lane)
> **Testing tiers:** T1 yaml lint (workflow validates). T3 the workflow itself runs on this PR — that *is* the test.
> **Branch:** `feat/round-64-phase-5-t6-tier5-artifact-flow-debug`

---

## Problem

Batch T.4 added `MilestoneTracker.capture()` calls to `e2e/avatar-drawer.spec.ts`. PR #23's CI all-green: e2e success in ~2.5min, three `ai-judge` matrix jobs success in ~30s each. But the status comment shows `—` across all roles with the "no milestone screenshots captured" advisory — same scaffold-mode output as before T.4.

The 30-second ai-judge runtime is the smoking gun: if `npm run ux-report` were actually evaluating screens with Claude (15s rate-limit delay × N screens, multiplied by personas), each role job would take many minutes, not 30 seconds. So the script is finding zero matching `.png` files at runtime and exiting cleanly.

Four candidate causes (TODO.md):

1. **Playwright outputDir cleaning.** `playwright.config.ts:21` sets `outputDir: "test-results"`. Playwright cleans that directory at the start of a run. `test.beforeAll(ensureMilestonesDir)` *should* recreate `test-results/milestones/` before the first capture, but if Playwright cleans between projects (auth-setup → chromium-mobile) or if there's an ordering quirk we'd lose the screenshots.
2. **`upload-artifact` path scope.** `path: test-results/` should preserve the `milestones/` subdirectory, but a `.gitignore`-style exclusion or v4 path-pattern quirk could drop it.
3. **`download-artifact` extracts to a different path than expected.** With `name: test-results` + `path: test-results/` the contents should land at `test-results/milestones/...`, but a single-artifact-by-name vs. matrix collision could shift it.
4. **`generate-synthetic-ux-report.ts:147` filter rejects the files.** Matrix passes `UX_ROLE_FILTER=customer,byoc,public` (for the `customer` row). Avatar-drawer screenshots all start with `customer-` so should match. But the filter walks `MILESTONES_DIR` first — if the directory doesn't exist, `getScreenshots()` returns `[]` and the script silently exits.

The diagnostic plan from `docs/upcoming/TODO.md`: add a one-step `ls -R test-results/` block to **both** the e2e job (after Playwright runs, before upload) and the ai-judge job (after download, before `npm run ux-report`). Output lands in `$GITHUB_STEP_SUMMARY` (not just stdout), making it readable in the Actions UI summary tab without artifact downloads — same pattern T.1 established for the Playwright failure summary (lessons-learned.md line 417–419).

## Goals

- See exactly what's in `test-results/` immediately after Playwright runs (e2e job).
- See exactly what's in `test-results/` after the artifact download (ai-judge job).
- The diagnostic output must be visible in the Actions UI summary tab, not buried in stdout.
- If the diagnostic surfaces an obvious fix (e.g. `milestones/` missing entirely vs. present-but-filtered), apply the fix in the same PR.
- Once a green run produces real Sarah scores in the PR comment, the diagnostic blocks stay (small, cheap, useful for future debugging) but get demoted to `if: failure() || env.ACTIONS_STEP_DEBUG == 'true'` so they only fire on demand. Keep one short summary line ("milestones present: yes / N files") in the always-on path so future regressions are obvious from the comment.

## Scope (files)

1. **`.github/workflows/playwright-pr.yml`** — add diagnostic steps:
   - In `e2e` job, after "Run E2E tests" step (which exits non-zero if tests fail; we want this to run regardless), add a step `if: always()` that:
     - `find test-results -type d | head -50`
     - `find test-results -type f -name '*.png' | wc -l` and head -20 of the list
     - If `test-results/milestones/manifest.json` exists, cat it
     - Append all of the above into `$GITHUB_STEP_SUMMARY`
   - In `ai-judge` job, after "Download test results from e2e job", add the same diagnostic step (so we can compare what existed at upload vs. what arrived at download).
2. **`docs/working/plan.md`** — sync the batch table:
   - Mark T.5 ✅ (PR #24 merged 996c014).
   - Add T.6 row (Micro, in progress).
   - Update Session Handoff.
3. **`docs/upcoming/TODO.md`** — once the diagnostic returns and a fix is applied, mark the T.4 follow-up resolved (or update with what we found and what to do next).

No application code touched. No migrations. No new Anthropic API spend if the workflow runs again — just one extra ~3s shell step.

## Acceptance criteria

- The new diagnostic steps run on every PR (until demoted), exit 0, and produce a clearly-labeled section in the Actions UI summary tab. ✅ MET
- After this PR's first CI run, the workflow log + summary tells us *exactly* which of the four hypotheses is correct. ✅ MET — diagnostic showed milestones round-tripping intact (7 PNGs all 3 matrix shards); none of the four original hypotheses was correct; the real cause was a stale model ID (new hypothesis 5).
- If the fix is a 1-line change (path glob, env var, etc.), apply in same PR. If it requires app-code or rewiring at the Playwright config level (e.g. dedicated outputDir for milestones), spin off as Batch T.7. ✅ MET — model ID fix applied in same PR (commit 0eba41f).
- The status comment on this PR's final CI run shows real numeric scores in at least one role row (i.e. the loop is closed end-to-end). 🟡 **[OVERRIDE: blocked by external Anthropic account — credit balance exhausted; CI run 24859813878 surfaces this cleanly via the new 🛑 advisory banner. The T.6 code fix is verified working — any new silent failure now lands as a visible PR comment line. Logged as human action item in docs/upcoming/TODO.md. Merging T.6 unblocks the next PR to produce real scores immediately after the human tops up credits.]**

## Out of scope

- Adding new milestone captures to other specs (T.4-style work for other flows). Wait until artifact flow proven.
- Changing `generate-synthetic-ux-report.ts` parsing logic.
- Touching the manual `playwright.yml` workflow.
- Any change to e2e test specs themselves.

## Risk / blast radius

- Trivial. Worst case: the diagnostic step fails (e.g. `find` typo), `$GITHUB_STEP_SUMMARY` write fails, the workflow continues. The diagnostic is `if: always()` so a failing main step doesn't gate it.
- No production-facing code paths touched.

## Review notes

Micro-tier batch — single workflow file edit + 2 doc syncs. One reviewer pass per CLAUDE.md §5: combined Sonnet reviewer (spec + bugs). No Lane 3 (no git history on the new diagnostic block to compare against). No synthesis (one input lane).

If the fix grows the PR beyond a workflow edit + doc sync (e.g. requires Playwright config changes + script logic tweaks), promote to Small tier (1 reviewer + synthesis) and document `[OVERRIDE]` in commit.
