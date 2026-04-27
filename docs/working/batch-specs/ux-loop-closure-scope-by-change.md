# UX-loop closure — scope ai-judge to changed surfaces

> **Branch:** `feat/ux-judge-loop-closure`
> **Type:** Between-rounds tooling sweep (modeled after DX.1)
> **Size:** Small · **Tier:** Quality

## Review: Quality

3 lanes (Spec + Bug + Lane 3 — recent history is relevant since this touches workflow files Round 64 already iterated on) + Lane 4 synthesis.

## Why

The Sarah persona judge has been measuring the same 7 avatar-drawer screens for the entire round, regardless of which surfaces a PR actually touches. Result: scores drift ±0.2 from AI noise, the 3-PR promotion rule fires on stale captures, and findings accumulate against pages no batch is changing. This batch makes Sarah measure only the captures whose source files appear in the PR's diff, and surfaces an actionable coverage-gap message when no captures match.

This closes the *measurement* end of the loop. Coverage expansion (new milestone specs for VisitDetail / BundleDetail / Snap sheet / etc.) is a separate follow-up batch dependent on the test-user property-seed TODO.

## Scope

### In

1. **Extend `e2e/milestone.ts`** — add `sourceFiles?: string[]` to `MilestoneMetadata`. Each entry lists the production source files this capture exercises (e.g., `src/components/customer/AvatarDrawer.tsx`, `src/components/customer/AppHeader.tsx`). Optional for backwards-compat with any milestone capture that hasn't been tagged yet.

2. **Backfill `sourceFiles` on existing captures** — `e2e/avatar-drawer.spec.ts` (6 captures), `e2e/byoc-happy-path.spec.ts` (multiple), `e2e/byoc-invalid-invite.spec.ts` (1). Each capture's `sourceFiles` array reflects the components actually rendered in that screenshot.

3. **Modify `scripts/generate-synthetic-ux-report.ts`** — read `process.env.UX_CHANGED_FILES` (newline-separated paths). When set, filter `getScreens()` to only the captures whose manifest `sourceFiles` field overlaps with the changed-files set. When unset or empty, behave as today (score all captures).

4. **Modify `.github/workflows/playwright-pr.yml`** — in the `ai-judge` job, compute `UX_CHANGED_FILES` via:
   ```
   git fetch origin main
   git diff origin/main...HEAD --name-only > /tmp/changed-files.txt
   ```
   Then pass the contents as `UX_CHANGED_FILES` env to the report-generation step.

5. **Coverage-gap signal in the comment** — modify the `comment` job's parse step to detect when a `ux-review-scores-*.json` has zero screens (because filtering excluded them all) versus zero screens because the harness was scaffolded. When a PR has changes touching `src/` but no captures matched, emit a clear advisory line:
   > ⚠️ **No milestone captures matched this PR's changes** — Sarah did not score any surfaces. To get coverage, add a Playwright spec that captures the changed surface(s) with appropriate `sourceFiles` metadata.

### Out (deferred to follow-up batches)

- New milestone capture specs (VisitDetail / BundleDetail / Snap sheet / Referrals / growth cards) — depends on the test-user property-seed TODO that has been deferred since Phase 4
- Score-delta vs. previous main merge — requires a persistent score-history store; needs its own design pass
- Per-persona breakdown in the comment — already supported in scoring, not surfaced; cosmetic, defer
- Multi-persona expansion — `getPersonas()` already loads all 7 personas in `e2e/prompts/personas/`; not actually a gap

## Files touched

```
e2e/milestone.ts                                 MODIFIED (add sourceFiles to type)
e2e/avatar-drawer.spec.ts                        MODIFIED (backfill sourceFiles)
e2e/byoc-happy-path.spec.ts                      MODIFIED (backfill sourceFiles)
e2e/byoc-invalid-invite.spec.ts                  MODIFIED (backfill sourceFiles)
scripts/generate-synthetic-ux-report.ts          MODIFIED (filter by UX_CHANGED_FILES)
.github/workflows/playwright-pr.yml              MODIFIED (compute + pass UX_CHANGED_FILES + coverage-gap line)
```

6 files. No new schema, no new migrations.

## Acceptance criteria

- [ ] `MilestoneMetadata.sourceFiles` is optional `string[]`.
- [ ] All existing milestone captures across `avatar-drawer.spec.ts` + `byoc-*.spec.ts` have non-empty `sourceFiles` arrays.
- [ ] `UX_CHANGED_FILES` unset → `generate-synthetic-ux-report.ts` scores all captures (current behavior).
- [ ] `UX_CHANGED_FILES` set with paths overlapping captures → only matching captures scored.
- [ ] `UX_CHANGED_FILES` set with paths NOT overlapping any capture → 0 captures scored, JSON output reflects that, comment surfaces the coverage-gap advisory.
- [ ] `npx tsc --noEmit` clean.
- [ ] Manual workflow run (`workflow_dispatch` on `playwright.yml`, the catalog runner) still scores all captures (because it doesn't set `UX_CHANGED_FILES`).
- [ ] Documentation: add a brief section to `docs/testing-strategy.md` (or a new `docs/testing-ai-judge-loop.md`) explaining the scoping behavior + coverage-gap signal.

## Testing tier

| T1 | T2 | T3 | T4 | T5 |
|----|----|----|----|----|
| ✅ | — | ✅ (this PR's own ai-judge run validates the loop end-to-end on real captures) | — | self-validating |

The PR's own CI run is the integration test — if Sarah measures captures relevant to *this PR's changes* (which touch the workflow + script + e2e files, but NOT the captured customer-facing source files), we should see either a coverage-gap signal OR scoping that matches a small subset (the captures pointing to e2e/script files won't exist).

## Blast radius

- Manual `playwright.yml` workflow runs unaffected (UX_CHANGED_FILES unset → score-all behavior preserved).
- Existing PRs already in flight unaffected — captures without `sourceFiles` continue to score (backwards-compat).
- The coverage-gap message could mask a real Sarah finding if a future PR touches a captured surface but the capture's `sourceFiles` is stale. Mitigation: keep `sourceFiles` lists conservative (don't overspecify — better to miss the filter than to silently score on the wrong screen).

## Branching

- Branch: `feat/ux-judge-loop-closure` (off `main` after PR #55 merge — Round 64 close).
- Self-merge per CLAUDE.md §11.
