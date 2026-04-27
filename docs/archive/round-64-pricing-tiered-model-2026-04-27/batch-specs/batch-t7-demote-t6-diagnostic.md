# Batch T.7 — Demote T.6 diagnostic after first green Tier 5 run

> **Round:** 64 · **Phase:** 5 (tooling sidebar) · **Size:** Micro
> **Review:** Quality — 1 combined reviewer (Micro tier per CLAUDE.md §5)
> **Testing tiers:** T1 yaml lint. T3 the workflow itself runs on this PR — that's the test (and doubles as the Anthropic-credit-refill verification).
> **Branch:** `feat/round-64-phase-5-t7-demote-t6-diagnostic`

---

## Problem

Batch T.6 shipped a verbose milestone-flow diagnostic that rendered 4 `<details>` blocks into every PR status comment via the `t6-diagnostic-*` artifact round-trip. The spec explicitly anticipated demoting this once a green Tier 5 run confirmed the flow works (lessons-learned + T.6 review tracked as SHOULD-FIX, deferred to this batch).

The Anthropic account credit balance is now topped up. The next PR that triggers `playwright-pr.yml` will be the first to produce real Sarah-persona scores on this repo. T.7 demotes the T.6 diagnostic to on-demand (failure OR `ACTIONS_STEP_DEBUG=true`) and keeps only a single "Tier 5 milestones: N captured" summary line in the always-on path. By shipping this on the *same* CI cycle that proves credits work, we get:

1. Tier 5 credit-refill validation (primary goal of this PR's CI run).
2. A cleaner comment going forward on all subsequent PRs.
3. Resolution of the T.6-follow-up TODO item.

## Goals

- On a passing CI run, the PR status comment has the Tier 5 scores table + advisory lines (if any), and NO `<details>` diagnostic blocks.
- On a failing run OR when `ACTIONS_STEP_DEBUG=true` is set on the workflow, the full T.6 diagnostic still renders into the comment body — same behavior as today.
- A single-line "Tier 5 milestones: N captured" summary stays in the always-on path so future regressions are obvious without enabling debug.
- Next CI run on this PR surfaces at least one non-`—` Sarah score (blocked only if Anthropic credits haven't actually propagated yet; logged as external-dependent per T.6 override precedent).

## Scope (files)

1. **`.github/workflows/playwright-pr.yml`** — edit three places:
   - `e2e` job: split the existing "Tier 5 milestone-flow diagnostic (post-Playwright)" step into two:
     - A tiny always-on summary step that writes `## Tier 5 milestones: N captured` to `$GITHUB_STEP_SUMMARY` based on `find test-results/milestones -name '*.png' | wc -l`.
     - The existing verbose block, gated with `if: failure() || env.ACTIONS_STEP_DEBUG == 'true'`.
   - Gate the corresponding `upload-artifact@v4 name: t6-diagnostic-e2e` step with the same condition.
   - `ai-judge` job (per matrix shard): same split for the post-download diagnostic step + artifact upload.
   - `comment` job: gate the `Download T.6 diagnostic artifacts` step and the `Collect T.6 diagnostic body` step with `if: needs.e2e.result == 'failure' || needs.ai-judge.result == 'failure' || env.ACTIONS_STEP_DEBUG == 'true'`. When gated off, `steps.t6-diag.outputs.body` is empty and the template interpolation cleanly omits the diagnostic section.

2. **`docs/working/plan.md`** — add T.7 row to batch table, update Session Handoff.

3. **`docs/upcoming/TODO.md`** — mark the T.6 demotion follow-up item ✅ resolved; mark the Anthropic credit item ✅ resolved (human confirmed topup).

No application code touched. No new Anthropic spend beyond the one legitimate customer-shard run.

## Acceptance criteria

- On this PR's CI run:
  - Tier 5 table row for `customer` shows a numeric avgClarity / avgTrust / avgFriction (from 49 persona×screen evaluations).
  - `provider` and `admin` rows remain `—` (no provider/admin-prefix milestones exist yet — future polish).
  - No `<details>` diagnostic blocks in the rendered comment body.
  - Step Summary tab shows "Tier 5 milestones: 7 captured" line from the always-on summary.
- `npx tsc --noEmit` clean (no source changes, but verify).
- Workflow yaml validates.

## Out of scope

- Adding more milestone captures. Those come with Batch 5.4.
- Changing the parse step or advisory thresholds.
- Changing the artifact retention / download patterns.

## Risk / blast radius

- Trivial. Worst case: one of the new `if:` conditions has a typo and the always-on summary doesn't emit — the PR comment is just slightly less informative. No security / data / behavior impact.
- If the Anthropic credit refill hasn't actually propagated yet, the 🛑 advisory line from T.6's error surface will still fire, and the comment will show a billing error (same as today). That's intended fallback.

## Review notes

Micro-tier batch — pure workflow-yaml edits + doc syncs. One reviewer pass per CLAUDE.md §5: combined Sonnet reviewer (spec + bugs). Skip Lane 3 (the T.6 PR establishes the full history; T.7 is a mechanical demotion). No synthesis.
