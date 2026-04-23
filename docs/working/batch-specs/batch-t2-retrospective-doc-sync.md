# Batch T.2 — Retrospective doc sync after testing harness unlock

> **Round:** 64 · **Phase:** 5 (tooling sidebar, parallel to Batch 5.3) · **Size:** Small
> **Review:** Quality — 1 combined reviewer + 1 synthesis (sub-agent) per CLAUDE.md §5 Small tier.
> **Testing tiers:** T1 minimal (lint-markdown). No runtime changes.
> **Branch:** `feat/round-64-phase-5-t2-doc-sync`

---

## Problem

Batch T.1 unlocked Tier 3/5 testing per-PR but took 7 CI iterations to get green. Several tactical lessons came out of that work that are currently captured only in commit messages (easily missed by future sessions). Also, the main session start-of-T.1 mistake was treating `docs/testing-strategy.md` as the ground truth on what tooling existed — when in fact `.github/workflows/playwright.yml`, `scripts/generate-*.ts`, and `e2e/prompts/personas/` were already 2× more built out than the doc suggested. Future sessions should have a durable pointer that says "grep the filesystem before assuming X isn't built."

## Goals

- Future Claude sessions discover the testing infrastructure in one grep + one doc read.
- Six tactical CI/infra gotchas from T.1 are captured in `lessons-learned.md` so they can be grepped.
- `CLAUDE.md` §12 references the three AI-audit npm scripts that already exist.
- `docs/testing-strategy.md` Appendix C (integration order) reflects completed items; Appendix E captures the Vercel Protection + bypass-cookie + paths-ignore + bun-vs-npm traps with copy-paste fixes.

## Scope (files)

1. **`lessons-learned.md`**
   - Under `### Workflow & process`: add entry "Grep before assuming testing tiers aren't built."
   - Under `### Infrastructure` (Baseline) OR a new `### CI / testing infrastructure` section under `## Patterns`: add entries:
     - Vercel Preview Protection: `wait-for-vercel-preview` action fails; use `actions/github-script` polling Deployments API.
     - `x-vercel-set-bypass-cookie` triggers 307 redirect; drop it for one-off curl + stateless Playwright.
     - `bun install --frozen-lockfile` fails opaquely in CI; prefer `npm ci` when `package-lock.json` is committed.
     - `GITHUB_STEP_SUMMARY` beats artifact downloads for CI failure diagnostics.
     - `paths-ignore` on `pull_request` doesn't reliably skip the workflow — gate at job level with `if:`.
     - Un-onboarded test users trip `CustomerPropertyGate`; Tier 4 destination assertions need to accept `/customer/onboarding` until properties are seeded.

2. **`CLAUDE.md`**
   - §7 Session Resilience: add a new rule 6 — "Before assuming a tier is not operational, grep for existing `e2e/`, `.github/workflows/`, `scripts/generate-*`." Takes 10 seconds; prevents an hour of false-start work.
   - §12 Commands + Tooling → Local build + test: add `npm run ux-report` / `creative-audit` / `growth-report` (+ `:dry` variants) with one-line purposes.

3. **`docs/testing-strategy.md`**
   - Appendix C (Integration order): mark items 1-5 (lint gate, Vitest exemplar, test-user credentials, first Tier 3 run, first new Tier 4 spec) as done with the PR that delivered each. Item 6 (`@axe-core/playwright`) becomes the next open item.
   - New **Appendix E — CI/infra gotchas**: document the six traps in "trap → symptom → fix" form. ~80-100 lines.

4. **`docs/working/plan.md`**
   - Add T.2 row to the Phase 5 table.
   - Refresh Session Handoff.

## Out of scope (explicit)

- **Code changes.** This is pure documentation. No `src/`, no workflow edits, no test files.
- **WORKFLOW.md** — the procedure hasn't changed; no update needed.
- **DEPLOYMENT.md** — Vercel bypass secret is the only operational addition; it's already documented in `testing-strategy.md` Appendix D (secrets inventory). Duplicating it in DEPLOYMENT.md would violate "one fact, one owner."

## Acceptance criteria

1. `lessons-learned.md` gains ≥ 6 new entries, one per tactical lesson, each with a concept-first `####` heading and `_<date> · source_` footer, placed in the appropriate existing topic bucket.
2. `lessons-learned.md` includes an entry on the "grep filesystem before assuming tooling doesn't exist" pattern.
3. `CLAUDE.md` §7 contains a new rule that explicitly names this grep-before-assume pattern.
4. `CLAUDE.md` §12 Local build + test section references `ux-report`, `creative-audit`, `growth-report` scripts with purposes.
5. `docs/testing-strategy.md` Appendix C reflects completed items with PR references.
6. `docs/testing-strategy.md` gains Appendix E with **≥ 6 gotchas** in uniform trap/symptom/fix format. Scope was soft-extended to 7 during implementation to include `peter-evans/create-or-update-comment` duplicate-comments (E.7), which was a review finding in T.1 and matches an existing `lessons-learned.md` entry — keeping the two synchronized is worth one extra Appendix E section.
7. `docs/working/plan.md` has a T.2 row and an updated Session Handoff.
8. No `.ts`, `.tsx`, `.yml`, or `.json` files changed (verified by `git diff --stat`).

## Edge cases

- **Heading conflicts.** If a topic bucket already has a similar entry, extend it rather than duplicate. Confirmed during spec authoring that no existing bucket covers these specific CI/Vercel gotchas.
- **Lane 3 skip.** Docs-only batch, `[OVERRIDE: Lane 3 skipped — documentation-only, no prior review findings on these files]`. Applies per CLAUDE.md §10 override protocol.

## Testing notes

- **Tier 1:** Markdown-only, no tsc/build/vitest. Run `git grep -n "broken-link-candidate"` only if needed. Skip the full Tier 1 battery with `[OVERRIDE: doc-only batch, tsc/build/lint not applicable]`.
- **Tier 3–5:** N/A (per testing-strategy.md tier selection matrix, "Doc / config: Tier 1 lint only").

## Review-lane notes (Small tier)

- **Combined reviewer (Lane 1+2):** Confirm each AC 1–8 is satisfied. Also scan for factual inaccuracies in the gotchas (wrong CLI flag, mistyped Vercel header name, etc.). The review here is primarily about truthfulness of the new content vs. what actually happened, not about bug detection in code.
- **Lane 4 synthesis:** Run as a sub-agent per CLAUDE.md §7 rule 3. Cross-check the synthesis of lessons-learned entries against the commit history from PR #19 to verify they match what actually happened.
