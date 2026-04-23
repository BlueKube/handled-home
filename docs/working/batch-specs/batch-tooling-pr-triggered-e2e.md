# Batch — PR-triggered Tier 3/5 testing harness + AvatarDrawer Tier 4 spec

> **Round:** 64 · **Phase:** 5 (tooling sidebar, parallel to Batch 5.3) · **Size:** Medium
> **Review:** Quality — 3 lanes + Lane 4 synthesis (sub-agent). Lane 3 scope: prior review history on `.github/workflows/playwright.yml`, `playwright.config.ts`, `e2e/` specs.
> **Testing tiers:** T1 mandatory. This batch itself *is* the unlock for T3/T4/T5 on future PRs — its first live exercise happens on PR #19's own CI.
> **Branch:** `feat/round-64-phase-5-tooling-pr-triggered-e2e`

---

## Problem

`docs/testing-strategy.md` §3 declares Tier 3 (E2E against Vercel preview), Tier 4 (new spec per new flow), and Tier 5 (AI-as-judge) as part of the per-batch contract. In practice none have been exercised on recent PRs (#17, #18) because:

1. **Trigger gap.** `.github/workflows/playwright.yml` runs on `workflow_dispatch` only — no PR trigger. So the per-PR loop never calls it.
2. **Dynamic `BASE_URL` gap.** The existing workflow reads `BASE_URL` as a static secret. For PR runs we need the per-PR Vercel preview URL, not a static target.
3. **Missing GitHub Secrets.** The repository has zero Action secrets configured today.
4. **Vercel Preview Protection.** Previews require an `x-vercel-protection-bypass` header — Playwright isn't sending one.
5. **No Tier 4 spec for recently-shipped flows.** Batch 5.2 (AvatarDrawer) shipped without a dedicated `.spec.ts`, despite the tier-selection matrix marking new user flows as Tier 4-required.

This batch closes all five gaps in one PR without disturbing the existing manual workflow.

## Goals

- Every PR that changes `src/` or `e2e/` runs Tier 3 Playwright against its own Vercel preview.
- Tier 5 (AI judge / Sarah persona) runs per-PR across 3 role matrix jobs (customer, provider, admin) when `ANTHROPIC_API_KEY` is set; skips gracefully when not.
- Vercel Preview Protection is transparently handled via env-driven `extraHTTPHeaders`.
- Batch 5.2's AvatarDrawer flow gets a proper Tier 4 spec covering the three F1/F2/F3 fix surfaces + the core flow.
- `testing-strategy.md` is updated so future agents know the tier statuses match reality.
- A new Appendix D inventories every secret needed + where to set it.

## Scope (files)

1. **`.github/workflows/playwright-pr.yml`** (new) — PR-triggered companion to `playwright.yml`. Resolves the preview URL via `patrickedqvist/wait-for-vercel-preview@v1.3.1`, validates secrets, warms the preview, runs `npm run test:e2e`, runs the 3-role AI judge matrix, uploads artifacts, posts a summary comment. Concurrency-gated so new pushes cancel in-progress runs. Skips on draft PRs and on docs-only changes.
2. **`playwright.config.ts`** — inject `extraHTTPHeaders` with `x-vercel-protection-bypass` from `VERCEL_AUTOMATION_BYPASS_SECRET` env, plus `x-vercel-set-bypass-cookie=true` so the cookie sticks for subsequent requests.
3. **`e2e/avatar-drawer.spec.ts`** (new) — five tests covering: avatar renders + menu items present, menu-item navigation, `?drawer=true` auto-open + param strip, `/customer/more` redirect chain, and the F3 fix (AlertDialog cancel does not close the outer Sheet).
4. **`docs/testing-strategy.md`** — update §3 Tier 3/4/5 status blocks to reflect "live per-PR" once secrets are populated. Add Appendix D: secrets inventory (name, purpose, where to set, sensitivity tier, rotation cadence).
5. **`docs/working/plan.md`** — add this batch as a sidebar row in the Phase 5 table. Refresh Session Handoff.

## Out of scope (explicit)

- **Existing `playwright.yml` is NOT modified.** It remains the manual workflow for full-catalog / audit runs. Don't touch what's working.
- **Tier 2 additions.** No new `src/` logic; no new unit tests.
- **Batch 5.3 (Services + Visits pages).** Deliberately deferred for this sidebar.
- **Webkit / real-browser audit tooling expansion** (testing-strategy.md §4.1). Separate effort.
- **Cost telemetry / budget tripwires.** The user asked for later pullback; today we ship with the dial at "full" and rely on the `ANTHROPIC_API_KEY` secret as the on/off switch.

## Acceptance criteria

1. `.github/workflows/playwright-pr.yml` exists and triggers on `pull_request` types `opened`, `synchronize`, `reopened`, `ready_for_review`.
2. The workflow skips PRs in draft state.
3. The workflow skips when the diff is docs-only (`docs/**`, `**/*.md`, `.gitignore`).
4. The workflow resolves the Vercel preview URL dynamically via an `actions/github-script` block that polls the GitHub Deployments API for the PR's HEAD SHA and returns the `environment_url` of the first `Preview` deployment that reaches `state=success`. This replaces an earlier attempt using `patrickedqvist/wait-for-vercel-preview` that failed under Vercel Preview Protection because the action does its own HTTP check without the bypass header.
5. The `e2e` job validates 8 required secrets (test-user credentials + bypass secret + BYOC token) and fails fast with a clear `::error` annotation when any are missing.
6. The `e2e` job warms the preview URL with the bypass header before running Playwright.
7. `npm run test:e2e` runs against the resolved preview URL.
8. Playwright artifacts (`playwright-report/`, `test-results/`) upload on success and failure.
9. The `ai-judge` job matrix runs 3 parallel role-scoped AI report generations when `ANTHROPIC_API_KEY` is set; annotates and skips when not set.
10. A `comment` job posts a summary comment on the PR with per-tier status + preview URL + artifact link.
11. Concurrency is scoped to the PR number with `cancel-in-progress: true`.
12. `playwright.config.ts` adds `extraHTTPHeaders` populated from `VERCEL_AUTOMATION_BYPASS_SECRET` when present, `undefined` when not (local-friendly).
13. `e2e/avatar-drawer.spec.ts` contains 5 tests covering: (a) avatar + menu items + sign-out row visible, (b) menu-item navigation closes the drawer and lands on `/customer/credits`, (c) `?drawer=true` auto-opens and strips the param, (d) `/customer/more` redirects + drawer opens, (e) Sign Out AlertDialog cancel preserves the drawer (F3 fix).
14. `docs/testing-strategy.md` §3 Tier 3/4/5 status flipped to "live per-PR when secrets are populated".
15. `docs/testing-strategy.md` gains Appendix D: secrets inventory.
16. `docs/working/plan.md` adds this batch to the Phase 5 sidebar and refreshes Session Handoff.
17. `npx tsc --noEmit` clean.
18. `npx eslint` on changed `.ts` files clean.

## Data shape / schema changes

None.

## Edge cases

- **First-run fails on missing secrets.** Expected and documented — the `Validate required secrets` step emits `::error title=Missing secret::…` annotations naming each missing var. The user populates them via the Settings UI and re-runs (the workflow re-runs automatically on the next push).
- **`ANTHROPIC_API_KEY` missing.** `ai-judge` matrix jobs skip the AI call and emit a `::notice` annotation, then succeed trivially. The per-role artifact uploads empty but the job status is green.
- **Vercel deployment never goes to `Preview` state** (e.g. build failure, non-production branch config). `wait-for-vercel-preview` times out at 480s; the job fails with a clear timeout error. The `comment` job still runs (via `if: always()`) and reports `wait-for-preview.result == 'failure'`.
- **Bypass secret rotation.** Rotating the Vercel bypass secret requires updating both Vercel (under Deployment Protection) and the `VERCEL_AUTOMATION_BYPASS_SECRET` GitHub Secret. If only one is rotated, Playwright runs fail with 403 → documented in Appendix D.
- **Playwright config used for local dev.** When `VERCEL_AUTOMATION_BYPASS_SECRET` is unset (typical local run), `extraHTTPHeaders` resolves to `undefined` — no header injected — so local runs against `npm run dev` or prod work unchanged.
- **Concurrency races.** Two rapid pushes cancel the in-progress run cleanly per `concurrency.cancel-in-progress: true`. No artifact corruption because the older run's upload step is cancelled before it fires.

## Testing notes

- **Tier 1 (mandatory):** `npx tsc --noEmit`, `npx eslint` on changed files. `npm run build` is out of scope (no `src/` source changes).
- **Tier 2:** None.
- **Tier 3 first live run:** PR #19's own CI run IS the first Tier 3 exercise of this harness. The workflow is permitted to fail on secrets-missing for this PR if secrets aren't populated by merge time — document as `[OVERRIDE: first-run-secrets-missing expected; follow-up PR after user populates]` if so.
- **Tier 4:** The new `avatar-drawer.spec.ts` is this batch's Tier 4 contribution (retroactively for Batch 5.2).
- **Tier 5:** Runs on this PR when `ANTHROPIC_API_KEY` is set. First run is the calibration baseline for the Sarah persona against the current main.

## Risks

- **`wait-for-vercel-preview` action is third-party.** v1.3.1 is pinned (not floating). Risk: supply-chain compromise of that tag. Mitigation: the action has 200k+ monthly uses, maintained by patrickedqvist. Acceptable for CI-only usage; not touching production code path.
- **Bypass secret in chat.** The Vercel bypass secret was pasted in session chat (not great hygiene) but never committed to git. Mitigation: rotate after first successful run. Documented in Appendix D.
- **Matrix fan-out cost.** With `ANTHROPIC_API_KEY` set and 3 parallel roles, ~$0.30–$0.50 per PR in Anthropic usage. User approved for now; will review when aggregate approaches $50.
- **Playwright on PRs from forks.** `pull_request` does NOT pass secrets to workflows triggered from forks (by design). External contributors' PRs will fail the secret-validate step. Acceptable for a private-scope repo; revisit if the repo becomes open.

## Review-lane notes

- **Lane 1 (spec completeness):** Verify each AC 1–16 is implemented.
- **Lane 2 (bug scan):** Focus on workflow YAML correctness (indentation, syntax), secret-validation logic (no accidental echo of secret values), concurrency config, `if: always()` on the comment job, and Playwright config's undefined-header handling.
- **Lane 3 (historical context):** `git log` on `playwright.config.ts` + `.github/workflows/playwright.yml` + `e2e/`. Is there a prior pattern I'm diverging from without cause? Was there a previous attempt at PR-triggered Playwright that was abandoned for a specific reason?
- **Lane 4 (synthesis):** Run as a sub-agent. Cross-check that the new workflow doesn't duplicate or conflict with the existing `playwright.yml`. Confirm Appendix D documents every secret the YAML references.
