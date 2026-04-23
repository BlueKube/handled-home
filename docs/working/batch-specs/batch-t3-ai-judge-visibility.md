# Batch T.3 — Tier 5 visibility + advisory threshold check

> **Round:** 64 · **Phase:** 5 (tooling sidebar) · **Size:** Small
> **Review:** Quality — 1 combined reviewer + 1 synthesis sub-agent (CLAUDE.md §5 Small tier).
> **Testing tiers:** T1 workflow-yaml validation. T3 auto-runs.
> **Branch:** `feat/round-64-phase-5-t3-ai-judge-visibility`

---

## Problem

T.1 wired Tier 5 (Sarah-persona AI judge) to run on every PR via `playwright-pr.yml`. T.2 documented the harness. But the judge's *content* is invisible — reports are uploaded as artifacts (`ai-report-{role}`) that require download + unzip to read. The PR review loop sees "Tier 5 ✅ Pass" with no insight into what Sarah thought. This largely defeats the value: the human (and me-as-PM) can't react to findings without artifact plumbing.

This batch is **Layer 1 of the convergence architecture** we discussed:
- Inline top-line scores + top frictions into the PR status comment so findings are visible.
- Add an **absolute-threshold check** (advisory, not merge-blocking for first 3-5 PRs of calibration).
- Sketch the dismissed-findings file (Layer 2 stub) so the next batch can build on it.

Layers 2–4 (dismiss-list filtering, PM triage, convergence caps) are deferred to T.4 or a later round once we have calibration data.

## Goals

- Reading a PR's status comment reveals Sarah's verdict per role (clarity / trust / friction / screens flagged) without downloading artifacts.
- Comment includes top frictions per role when the judge flagged any screen below threshold.
- Workflow surfaces a ⚠️ advisory when any role's `avgFriction`, `avgClarity`, or `avgTrust` across all screens dips below 3.0.
- `docs/testing-acceptable-findings.md` exists as an empty-but-structured stub so T.4 can populate it.
- `docs/testing-strategy.md` Section 5 gains a "Convergence architecture" block documenting the 4 layers + current status.
- Zero code behavior change in the app itself.

## Scope (files)

1. **`.github/workflows/playwright-pr.yml`** — enhance the `comment` job:
   - Download each role's `ai-report-{role}` artifact into `ai-reports/` via `actions/download-artifact@v4`.
   - Add a "Parse Tier 5 summaries" step that extracts per-role top-line scores from `ux-review-scores-{role}.json` (customer/provider/admin) and top 3 findings from the markdown report.
   - Build the comment body to include a scores table + per-role top frictions + advisory-threshold annotation.
   - Keep the existing find-comment → create-or-update-comment chain.
2. **`docs/testing-acceptable-findings.md`** (new) — structured stub:
   - Header + format documentation.
   - Section for "Dismissed findings (with rationale)" — empty for now.
   - Explicit "how to use this file" instructions for T.4.
3. **`docs/testing-strategy.md`** — add **Section 5.8 — Convergence architecture** documenting the 4-layer model:
   - Layer 1: baseline / absolute thresholds (status: T.3 ships absolute; baseline in T.4)
   - Layer 2: dismissed-findings filter (status: stub shipped T.3; logic in T.4)
   - Layer 3: PM triage loop (status: manual for now; semi-automated in T.4)
   - Layer 4: convergence caps (status: deferred)

## Out of scope (explicit)

- **Baseline-anchored comparison.** Absolute thresholds only this batch. Baseline requires committing a reference scores file which we don't have yet; deferred to T.4 once 3-5 PRs of data accumulate.
- **Dismissed-findings CI filter.** File exists but is not yet wired into the threshold logic. T.4.
- **Merge-blocking.** Threshold is advisory (adds ⚠️ to comment but doesn't fail CI) for the first 3-5 PRs. Flip to blocking only after we've confirmed the thresholds don't false-positive.
- **Feature-flag-per-PR labels.** Any blocking behavior is controlled globally by a constant in the workflow, not per-PR labels. Simpler for v1.
- **PM-as-me writing fix batches.** Reading the findings and proposing fix batches is the T.4 loop, not this batch.

## Acceptance criteria

1. On a PR with Tier 5 green, the status comment includes a markdown table with `| Role | Clarity | Trust | Friction | Screens Flagged |` rows for customer / provider / admin.
2. When a role's `avgFriction`, `avgClarity`, or `avgTrust` is < 3.0, the comment includes a ⚠️ line naming the breaching score.
3. When a role's JSON scores file exists + has non-empty `screens`, the comment includes the "Top 3 frictions" for that role extracted from the markdown report's "Top 5 UX Fixes" section.
4. When a role's artifact is missing (e.g. ai-judge skipped because `ANTHROPIC_API_KEY` unset), the comment gracefully shows `—` for that role's row.
5. The advisory does NOT fail the CI check (exit 0 at the comment job level regardless of threshold state).
6. `docs/testing-acceptable-findings.md` is committed with the header, format docs, and an empty "Dismissed findings" section.
7. `docs/testing-strategy.md` §5.8 (new) documents the 4-layer convergence architecture + current implementation status per layer.
8. No changes to `src/`, `e2e/`, `scripts/`, `playwright.config.ts`, `package.json`, `supabase/`, or any runtime code.
9. `npx tsc --noEmit` clean (should be a no-op since no `.ts`/`.tsx` changes).

## Edge cases

- **All artifacts missing.** If `ai-report-*` artifacts don't exist (e.g. the `ai-judge` job was skipped because of missing secret), the comment falls back to the existing plain status matrix. No scores table, no advisory. Handled with `continue-on-error: true` on the download step + `if [ -d ai-reports/ai-report-customer ]` guards.
- **Malformed JSON.** If a role's `ux-review-scores-{role}.json` is malformed, parse fails silently, that role shows `—` in the table. Other roles still render.
- **Markdown format drift.** If the "Top 5 UX Fixes" section heading changes in the script, the parse falls back to showing "(top frictions unavailable)".
- **Comment body > 65k bytes.** GitHub's comment character limit is 65k. With 3 roles × ~1k per role's summary the comment stays well under. If future iterations add more rubric dimensions, truncate per role.

## Testing notes

- **Tier 1:** `npx tsc --noEmit` (should pass; no `.ts` changes). Targeted `npx eslint` on changed files (only `.yml` + `.md`; eslint doesn't touch them, so trivially green).
- **Tier 3/5:** Both run automatically via the harness. The existing tests + ai-judge matrix will validate that the enhanced comment job still succeeds end-to-end. First PR with the enhanced comment = PR #22 itself.
- **Manual verification:** after merging, the PR's own comment will show the new format. If something's off, we iterate on a follow-up.

## Risks

- **Workflow syntax errors.** The new parsing steps rely on bash + jq. A typo would fail the comment job silently (no comment posted). Mitigation: the `comment` job uses `if: always()` so it tries to post even if parsing fails; add a defensive fallback that posts the old plain status format if parsing throws.
- **Advisory noise.** First 3-5 PRs may flag many ⚠️ advisories if the absolute-3.0 threshold turns out to be too aggressive. Acceptable for calibration; we'll tune after seeing real data. If it's clearly wrong, flip threshold via a follow-up one-line change.
- **Threshold flip to blocking.** Explicitly deferred. Do not make this blocking in T.3.

## Review-lane notes (Small tier)

- **Combined reviewer (Lane 1+2):** Verify AC 1–9. Look for YAML syntax issues, bash quoting errors, missing guards for absent artifacts, comment body length overflow risk. Factually confirm that the scores-JSON shape matches what the script actually writes (`ScreenScores` + `PersonaScores` interfaces in `generate-synthetic-ux-report.ts:95-116`).
- **Lane 4 synthesis (sub-agent):** Cross-check that the comment's advisory annotation is genuinely advisory (doesn't `exit 1`). Confirm the 4-layer architecture description matches what's actually implemented (Layer 1 shipped, Layer 2 stub, Layer 3-4 deferred). Flag any drift between the spec and the code.
