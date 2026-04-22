# Testing Strategy

> **Last updated:** 2026-04-22 · **Next review:** 2026-07-22 (or when any Tier 4/5 tool ships a major version)
> **Owner:** Implementation Agent + Human (review cadence below)
> **Status:** Living document — expected to change as the tooling landscape shifts (sometimes weekly)

---

## 1. Purpose

Ship features with confidence that they actually work — without making the human the bottleneck.

Today the "Test plan" checklist on every PR is aspirational: the human doesn't have time to run each item, and the Implementation Agent has been gating on `tsc --noEmit` + `npm run build` only. That leaves a meaningful class of regressions invisible until a user hits them. This document defines a **tiered** self-testing protocol that the agent executes on every batch, plus a forward-looking experiential tier that uses AI as a proxy user — the thing humans do that automation hasn't yet.

## 2. What we test (and what we don't)

### In scope
- **Correctness.** Does the code do what the spec says? TypeScript checks, unit tests, integration tests, E2E flows.
- **Regression.** Does this change break something already shipped?
- **Cross-cutting concerns.** Accessibility (axe), responsive behavior (mobile viewport), dark mode (semantic tokens), auth boundaries (unauthenticated → null, RLS isolation).
- **Visual fidelity.** Screenshots at key states, optionally diffed against baselines.
- **User experience.** Emerging — AI-as-judge on flow screenshots, scoring clarity / friction / delight against a rubric.
- **Performance regressions.** Bundle size (size-limit), Lighthouse score deltas on the Vercel preview.

### Out of scope (today)
- **Real browser compat beyond Chromium-mobile.** We already use iPhone 15 viewport; WebKit / Firefox / real devices require additional runners. Revisit when we have real users on a browser we haven't tested.
- **Load / soak.** No synthetic load yet; Vercel preview-URL rate limits preclude hammering.
- **Cross-device touch/haptic quality.** Needs real devices.
- **Security penetration.** We have RLS + auth boundary checks; full pentest is a quarterly specialist engagement, not per-PR.
- **Localization.** English-only today.

Tests should **fail closed** — an assertion we can't evaluate (e.g. AI judge times out) is a warning, not a pass.

---

## 3. The Five Tiers

Each batch runs some subset of these. The tier is picked from the batch size (already in CLAUDE.md §5) + whether the batch touches user-facing surfaces.

### Tier 1 — Static (mandatory, every batch)

| Check | Command | Blocks merge |
|---|---|---|
| Type safety | `npx tsc --noEmit` | Yes |
| Production build | `npm run build` | Yes |
| Linting | `npm run lint` | Yes |
| Unit tests | `npm test` (Vitest) | Yes if any exist for changed files; otherwise soft-warn |

Runs in < 90 s on this codebase today. No external dependencies. `npm run lint` currently isn't in my gate — it should be. One-line add to the pre-merge checklist.

### Tier 2 — Unit & integration (feature batches)

For every new pure function, hook, or utility: add a Vitest file under the same directory.

Minimum coverage targets (per new file, not per PR):
- **Pure utilities** (`src/lib/*.ts`): 100% branch coverage. Example: `src/lib/imageCompression.ts` → `src/lib/__tests__/imageCompression.test.ts`.
- **Hooks** (`src/hooks/*.ts`): happy path + at least one error path + invalidation/rollback behavior. Use `@testing-library/react`'s `renderHook` with a `QueryClientProvider` wrapper.
- **Components** (`src/components/*.tsx`): at least one render test per public prop surface; focus on state transitions, not layout.

When to skip:
- Migration-only batches.
- Doc / config-only batches.
- 3rd-party UI primitives (`src/components/ui/*`) — already tested upstream.

### Tier 3 — E2E against the Vercel preview (UI batches)

The Playwright setup is already mature: `playwright.config.ts` reads `BASE_URL`, `auth.setup.ts` logs in customer + provider + admin test users into reusable storage states, 5 specs cover BYOC flows + screenshot catalog.

Per-batch protocol:
1. After PR opens + Vercel Preview goes ✅, extract the preview URL from the Vercel bot comment (first line of the comment body).
2. Run the relevant spec subset:
   ```bash
   BASE_URL="<preview-url>" \
   CUSTOMER_EMAIL=customer@test.com CUSTOMER_PASSWORD=... \
   PROVIDER_EMAIL=provider@test.com PROVIDER_PASSWORD=... \
   ADMIN_EMAIL=admin@test.com ADMIN_PASSWORD=... \
   npm run test:e2e
   ```
3. Attach the `test-results/html-report/` index + any failure screenshots to the PR as a comment.

**Blockers to unlock this tier (asks for the human):**
- Set test-user passwords as Vercel preview env vars OR hand me the credentials once for `.claude/settings.local.json`. Without them, Playwright fails at auth-setup.
- Confirm the three test users exist on every Supabase Preview branch. They should, per `20260322000000_fix_test_users_and_seed_metro.sql`.

### Tier 4 — New spec per new flow (feature batches)

For every new user-facing flow, add a `.spec.ts` in `e2e/` before closing the batch. Examples:

| Flow | Spec name | Assertions |
|---|---|---|
| Snap submit (Batch 4.3) | `e2e/snap-submit.spec.ts` | Capture → describe → AI card appears within 10s → routing radio → submit → toast → `snap_requests` row exists (via Supabase MCP assertion) → `handle_transactions` row with correct `reference_id`. |
| Snap insufficient credits | `e2e/snap-insufficient.spec.ts` | Same flow as above but with a customer whose balance < hold amount → destructive toast, no row written. |
| Snap early-close cleanup | `e2e/snap-cleanup.spec.ts` | Get to step 3, close sheet, assert draft row + photo both gone. |

Keep specs **idempotent**: each spec resets state it depends on (via `test.beforeEach` that seeds or cleans). Use the Supabase MCP to set up / tear down server-side state rather than clicking through the UI.

### Tier 5 — Experiential (AI-as-judge)

See Section 5 below. This is the frontier tier — takes 30 s to a few minutes, uses an LLM to evaluate the flow's clarity, friction, and affect against a rubric. Not a blocker for merge today; a signal for polish rounds.

---

### Tier selection matrix

| Batch type | T1 | T2 | T3 | T4 | T5 |
|---|---|---|---|---|---|
| Migration-only | ✅ | — | — | — | — |
| Pure hook / util | ✅ | ✅ | — | — | — |
| Component, no new flow | ✅ | ✅ | ✅ (smoke) | — | Optional |
| New user flow | ✅ | ✅ | ✅ | ✅ | ✅ (recommended) |
| Copy / layout only | ✅ | — | ✅ (smoke + screenshot) | — | ✅ |
| Edge function | ✅ | ✅ (integration stub) | ✅ (if called by UI) | ✅ (if new UI flow) | — |
| Doc / config | ✅ (lint only) | — | — | — | — |

---

## 4. Tool landscape

Maturity rating scale:
- **Stable** — production-ready, widely adopted, used in this repo or a strong candidate.
- **Emerging** — 2025-era, promising, early adopters reporting wins.
- **Experimental** — research-grade or recently released; evaluate before committing.

### 4.1 Browser automation

| Tool | Maturity | Notes |
|---|---|---|
| Playwright | Stable | **In use.** `@playwright/test` v1.58. CDP under the hood. Fast, deterministic, multi-browser. |
| Playwright MCP (`@playwright/mcp`) | Emerging | Microsoft's MCP wrapper. Exposes snapshot-based browsing (accessibility tree, not pixels) to LLM agents so the agent can drive a real browser inside a Claude session without writing full spec files. Good fit for exploratory testing and self-generated tests. **Propose adding to `.mcp.json` after Tier 3 is proven.** |
| Chrome DevTools MCP (`chrome-devtools-mcp`) | Emerging | Google's newer MCP server. Richer than Playwright MCP — full DevTools Protocol (network panel, perf traces, memory snapshots, console, JS debugging, CSS inspection). Better for deep diagnostics when an E2E fails mysteriously. Consider pairing with Playwright MCP: PW-MCP for flow, CDT-MCP for root-cause. |
| Stagehand (Browserbase) | Emerging | Natural-language Playwright. "Click the submit button" → deterministic call. Falls back to AI only when the selector-based approach fails. Reduces spec-maintenance friction. Costs $$ per run. |
| browser-use | Emerging | Python framework, fully agentic. LLM plans + executes browser actions end-to-end from a goal. Good for generative testing ("book a lawn service"). Less deterministic than Playwright for regression use. |
| Anthropic Computer Use | Experimental | Pixel-level control. Overkill for DOM-based apps; interesting for visual/graphical apps. Expensive. |
| Puppeteer / Puppeteer MCP | Stable / Emerging | Older sibling to Playwright. No compelling reason to adopt given Playwright already in use. |
| WebDriver BiDi | Stable | W3C spec replacing CDP. Playwright will adopt transparently; no direct action needed. |

**Decision today:** stay on Playwright via npm scripts. Evaluate Playwright MCP when the agent needs to do per-batch exploratory testing that's easier interactively than as a spec file. Evaluate Chrome DevTools MCP the first time we can't root-cause a failure from test output alone.

### 4.2 Visual regression

| Tool | Maturity | Notes |
|---|---|---|
| Playwright `toHaveScreenshot()` | Stable | In-repo PNG baselines, pixel diff tolerance. No cloud dependency. **Recommended starting point.** |
| Chromatic (Storybook) | Stable | Component-level. Needs Storybook setup (not in repo today). Strong if we invest in Storybook. |
| Percy (BrowserStack) | Stable | Hosted diffs, cross-browser. Paid. |
| Argos CI | Stable | OSS with cloud, GitHub integration. Paid tier for private repos. |
| Lost Pixel | Stable | OSS, self-hostable. |
| Applitools Visual AI | Emerging | AI-driven visual diffs — ignores "noise" (anti-aliasing, date stamps) that pixel diffs catch. Paid. |

**Decision today:** start with in-repo Playwright screenshots for critical flows (Snap sheet steps, credit ring, etc.). Reassess Chromatic if we adopt Storybook.

### 4.3 Unit & component

| Tool | Maturity | Notes |
|---|---|---|
| Vitest | Stable | **In use.** |
| Testing Library (`@testing-library/react`, `jest-dom`) | Stable | **In use.** |
| MSW (Mock Service Worker) | Stable | Mock Supabase + Anthropic at the network boundary for reliable hook tests. Not yet in repo. **Recommended add.** |
| Storybook | Stable | Component isolation + play functions. Not in repo. Consider when UI complexity grows (Phase 5+). |

### 4.4 Accessibility

| Tool | Maturity | Notes |
|---|---|---|
| axe-core + `@axe-core/playwright` | Stable | Run axe on every page during E2E. Catches ~60% of a11y issues automatically. **Recommended add to Tier 3.** |
| Pa11y | Stable | CLI alternative. |
| Lighthouse CI | Stable | All-in-one (a11y + perf + SEO + best practices). Run against Vercel preview per PR. |

### 4.5 Performance

| Tool | Maturity | Notes |
|---|---|---|
| Lighthouse CI | Stable | PR-level Core Web Vitals + score deltas. Runs against Vercel preview. |
| `size-limit` | Stable | Bundle budget enforcement. We have a 500 kB+ warning today — `size-limit` makes it a hard budget. |
| Vercel Speed Insights | Stable | Real-user metrics in prod (not PR-time). |
| Chrome DevTools Performance traces | Stable | Via CDT MCP for deep dives. |

### 4.6 Database / migration

| Tool | Maturity | Notes |
|---|---|---|
| Supabase Preview branches | Stable | **In use.** Fresh branch DB per PR. Catches FK / RLS regressions at CI time. |
| Supabase MCP `execute_sql` | Stable | **In use.** Agent-driven DB assertions (e.g. "after snap submit, does a row exist?"). |
| pgTAP / pg_prove | Stable | TAP-style SQL tests. Consider for complex RLS policies. |
| Snaplet | Stable | DB seeding + snapshot. Alternative to manual seed migrations. |

### 4.7 AI-driven experiential (the frontier)

| Tool / Pattern | Maturity | Notes |
|---|---|---|
| Playwright + Claude/GPT-4V judge | Emerging | Capture per-step screenshots, feed to LLM with a UX rubric. **The pattern we'll prototype first.** Fully in-house, no vendor lock-in. |
| Meticulous | Emerging | Records real user sessions + replays against new code to detect behavioral regressions. Paid. |
| Midscene.js | Experimental | OSS vision+DOM hybrid agent. Active dev. |
| Sprig / PostHog AI | Emerging | Product analytics with AI summarization. Not test-time; post-launch signal. |
| Multi-agent swarms | Experimental | One agent plays "user persona" (skeptical retiree, tech-savvy millennial, etc.), another observes + scores. Emerging research, not production-ready. |

### 4.8 Test generation & maintenance

| Tool / Pattern | Maturity | Notes |
|---|---|---|
| Claude / GPT generating specs from stories | Emerging | Useful for boilerplate; human still reviews. **We already do this ad-hoc — formalize it.** |
| auto-playwright | Emerging | Runtime NL → PW actions. Good for exploration, fragile for regression. |
| Keploy | Emerging | Captures real HTTP traffic + generates tests. |

### 4.9 Continuous discovery

New tools ship constantly. Track via:
- [Awesome MCP Servers](https://github.com/modelcontextprotocol/servers) — MCP ecosystem catalog.
- [Playwright Release Notes](https://github.com/microsoft/playwright/releases).
- [Anthropic Cookbook](https://github.com/anthropics/anthropic-cookbook) — evaluation patterns.
- Weekly or bi-weekly scan of Hacker News / Twitter around terms: "LLM testing", "agentic browser", "visual AI".
- Quarterly review of this document (see §7).

---

## 5. Experiential testing — walking through the app like a human

This is the thing you (the human) do that nothing else in the pipeline does: you open the feature, click through it, and form a judgment — "confusing," "frictionless," "delightful," "I'd drop off here." Most of our Test Plan checkboxes implicitly depend on that judgment.

LLMs with vision can now do a credible version of this for a meaningful subset of UX questions. Not perfectly. Not for every feature. But enough to make every PR's checklist auditable instead of aspirational.

### 5.1 The pattern

Three components:

1. **A scripted walkthrough** (Playwright spec) that navigates the flow and captures a screenshot after every meaningful step. Saved to `test-results/walkthrough/<spec-name>/step-NN.png` with a JSON manifest describing what happened (`click Continue`, `type description`, `wait for AI card`).
2. **An AI judge** (Anthropic Claude 3.5 Sonnet vision, or Haiku 4.5 for cheaper runs) that reads the screenshots + manifest and scores the flow against a rubric.
3. **A rubric** — explicit criteria + scoring scale — so the judge's output is comparable across runs and reviewable by the human.

### 5.2 Concrete implementation (prototype plan)

```
scripts/experiential-review.ts
  1. Read manifest at test-results/walkthrough/<run>/manifest.json
  2. Load step-NN.png for each step
  3. Assemble a multi-turn message to Claude:
       - System: UX reviewer role + rubric
       - User: per-step screenshot + action description
       - Final: "Summarize the flow and score."
  4. Write report to test-results/walkthrough/<run>/review.md
  5. If any category scores < threshold, exit non-zero
```

The agent runs this as:
```bash
npm run test:walkthrough -- --spec=snap-submit
npm run test:walkthrough:review
```

### 5.3 Rubric (v1 — expect to iterate)

For each step, the judge scores 1–5 on:

| Dimension | What the judge checks | Fail threshold |
|---|---|---|
| **Clarity** | Can a first-time user tell what to do next? Is the primary action obvious? | < 3 |
| **Friction** | How much cognitive load does this step impose? Are inputs pre-filled where possible? | < 3 |
| **Affective tone** | Is the copy warm, blunt, alarming, cold? Appropriate to the moment? | < 2 (i.e. allows blunt-but-appropriate) |
| **Trust signals** | Does the step explain what will happen, especially before a commitment (credits, money, submission)? | < 3 on any commitment step |
| **Visual consistency** | Dark mode integrity, spacing, alignment, token use? Any raw light-only colors? | < 4 |
| **Drop-off risk** | Standing in for a skeptical user — would they quit here? | `high` → flag |

And for the flow overall:

| Dimension | Notes |
|---|---|
| **Narrative coherence** | Does the sequence tell a single coherent story? |
| **Surprise budget** | Are unexpected moments positive surprises (delight) or negative (confusion)? |
| **Recovery** | What happens if the user messes up or the AI is wrong? Does the UI recover gracefully? |

### 5.4 Prompt template (starting point — to be tuned)

See Appendix B for the full prompt. Abridged:

```
You are an experienced product designer reviewing a new user flow.
You've never seen this app before and you're looking at it the way a
first-time user would.

For each step, score 1–5 on: clarity, friction, affective tone, trust
signals, visual consistency. Flag high drop-off risk.

Be specific. If you can't tell what something does, say so — don't
guess. If the copy is good, say *why* (specific phrase). If it's
confusing, say *which word or layout element*.

At the end: overall flow score, top-3 frictions, top-3 delights.
```

### 5.5 Limitations — be honest with ourselves

- **Aesthetic judgment drifts.** The same model on the same screenshots will not always return the same score. Treat AI judgment as a **detector for problems**, not a quality metric. If it flags a step as confusing and a human disagrees, record the disagreement in `docs/testing-disagreements.md` and tune the rubric or prompt.
- **Cultural / demographic blind spots.** The judge reflects its training. Flows targeting a specific demographic (seniors managing lawn care) may need persona-conditioned prompts.
- **Affect is shallow.** "How does this make me feel?" is a gesture toward the right question. The model can identify friction; identifying delight is harder.
- **Emerging capability.** This is the least mature tier. Run it, collect outputs, but don't block merges on it until we've calibrated.

### 5.6 Persona variants (future)

Once the baseline rubric stabilizes, run the flow through 2–4 persona-conditioned judges:

- **First-time user** — highest drop-off sensitivity.
- **Skeptical retiree** — distrusts automation, wants reassurance before committing.
- **Power user** — tolerant of friction if speed is high; intolerant of gratuitous confirmation dialogs.
- **Returning user mid-commitment** — running flow for the Nth time, wants minimal re-explanation.

Disagreements between personas are signal — a flow that satisfies the first-time user but frustrates the power user may need progressive disclosure.

### 5.7 Budget

| Run | Approximate cost (Claude Sonnet 4.5 vision) |
|---|---|
| 10-step flow, 1 judge, per PR | $0.05–$0.15 |
| 10-step flow, 4 personas, quarterly regression sweep across all flows | $5–$20 |

Cheap enough to run on every Tier 4/5 batch. Very cheap to run as a nightly sweep against main to catch drift.

---

## 6. Retroactive application — testing older PRs with the new strategy

Once Tiers 3/4/5 are operational, older PRs can be retro-validated. The purpose isn't to catch bugs that shipped — those would already be symptomatic if live — it's to build the regression suite so the next change doesn't silently break the old one.

### 6.1 Protocol

For each target PR (pick by priority: highest-traffic features first):

1. **Identify user flows touched by the PR.** Read the PR description, the batch spec if present, the diff. List every user-visible flow the PR introduced or meaningfully changed.
2. **Write a spec per flow** under `e2e/retro/<pr-number>-<slug>.spec.ts`.
   - Use the current test-user accounts (they're seeded on every Supabase preview branch).
   - Assert the flow completes against *current `main`* — not against the PR's pre-merge state. Main reflects all shipped behavior.
   - If the flow fails, that's either a genuine regression (file an issue) or drift (the spec needs adjustment for intended changes).
3. **Run the new walkthrough + experiential judge** once per retro flow. File the `review.md` output as `docs/testing-reviews/retro/<pr>-<flow>.md` so we have a baseline for future diffs.
4. **Mark the PR as retro-covered** in a tracking file `docs/testing-coverage.md`:
   ```markdown
   | PR | Flow | Spec | Retro review | Date |
   |----|------|------|-------------|------|
   | #6 | Snap schema | — (migration) | — | 2026-04-22 |
   | #8 | Snap capture | e2e/retro/8-snap-capture.spec.ts | docs/testing-reviews/retro/8-snap-capture.md | 2026-04-22 |
   ```

### 6.2 Prioritization

Not every PR needs retro coverage. Priority order:

1. **Revenue path.** Billing, subscriptions, credit packs, Stripe webhooks. Any regression here costs real money.
2. **Onboarding.** The first 5 minutes a new user spends. Drop-off here is permanent.
3. **Core daily use.** Snap submit, Credits page, Schedule/Visit Detail.
4. **Admin ops.** Zone builder, provider onboarding, SKU calibration — regressions slow us down but don't hurt users directly.
5. **Growth surfaces.** BYOC, referrals, share cards — nice-to-have coverage.

### 6.3 When retro testing finds a regression

1. Reproduce locally against main.
2. Open an issue with the steps + the offending PR + the retro spec.
3. Fix in a new batch — never silently patch a retro spec to make it pass.

---

## 7. Keeping the strategy current

### 7.1 Review cadence

- **Monthly** — Implementation Agent scans release notes for Playwright, Vitest, MCP ecosystem; updates §4 table if any tool ships a material change.
- **Quarterly** — Human + Implementation Agent review this whole document. Questions to answer:
  - Did any flagged regression get caught by a tier? If so, is the tier working as intended?
  - Did any regression slip through all tiers? What tier would have caught it? Should that tier be promoted to mandatory?
  - Are Tier 5 (AI judge) findings actionable, or are they noise?
  - Are the thresholds in §5.3 calibrated?
- **On landscape shift** — if a new tool category appears (e.g. a breakthrough agentic browser framework), add it to §4 and decide whether to re-plan.

Set a reminder: the `Next review` date at the top of this doc. When that date passes, the next agent session should prompt for a review.

### 7.2 Signals that the strategy needs updating sooner

- **A bug ships to production that would have been caught by a tier we're not running yet.** Promote the tier.
- **A tier runs but produces false positives > 50% of the time.** Tune it or deprecate it.
- **A new MCP server or tool obviates a whole category.** Rewrite the affected section.
- **The human reports that a particular feature "still feels off" despite passing all tiers.** That's a Tier 5 rubric gap; iterate on the prompt.

### 7.3 When *not* to update

- Don't add a tool just because it was announced on Hacker News. Wait for: (a) > 2 weeks of usage signal from production teams, (b) clear delta over what's already in the strategy, (c) concrete integration path for this repo.
- Don't remove a tier because it was quiet for a month. Regressions arrive in clusters.

---

## Appendix A — Per-batch decision flow

```
Start batch
   │
   ▼
Migration or doc-only?  ──YES──▶  Tier 1 only.  ──▶  Done.
   │
   NO
   │
   ▼
New pure function or hook?  ──YES──▶  Write Vitest alongside (Tier 2).
   │
   ▼
New component or UI state?  ──YES──▶  Add Testing Library render test (Tier 2).
   │
   ▼
New user-facing flow?  ──YES──▶  Write new .spec.ts (Tier 4) + run walkthrough (Tier 5).
   │
   NO
   │
   ▼
Changed existing flow?  ──YES──▶  Update affected spec (Tier 3 + Tier 4).
   │
   ▼
Visual or copy change?  ──YES──▶  Capture screenshots + run Tier 5 judge.
   │
   ▼
Run all selected tiers.  ──▶  Fix failures.  ──▶  Commit.  ──▶  Open PR.
```

---

## Appendix B — AI-judge prompt (v1)

```
SYSTEM:
You are an experienced product designer reviewing a new user flow in
a home-services mobile app. You've never seen this app before and
you're looking at it the way a first-time user would.

For each step of the flow, you'll receive a screenshot and a short
description of what the user just did. At the end you'll write a
summary report.

Scoring per step (1 = bad, 5 = excellent):
- Clarity: Can a first-time user tell what to do next? Is the
  primary action obvious?
- Friction: How much cognitive load does this step impose? Are
  inputs pre-filled where possible?
- Affective tone: Is the copy warm, blunt, alarming, cold? Is the
  tone appropriate for the moment (pre-commitment: explanatory;
  post-commitment: celebratory)?
- Trust signals: Does the step explain what will happen, especially
  before a commitment (credits, money, submission)?
- Visual consistency: Dark mode integrity, spacing, alignment,
  semantic token use. Any raw light-only colors that shouldn't be
  there?

Also flag for each step:
- Drop-off risk: low / medium / high. Would a skeptical user quit
  here?

Be specific. If you can't tell what something does, say so — don't
guess. If copy is good, quote the specific phrase. If layout is
confusing, say which element.

At the end, summarize:
- Overall flow score (average of per-step clarity + friction +
  trust).
- Top 3 frictions.
- Top 3 delights.
- One sentence: would you recommend this flow to a friend? Why or
  why not?

USER (per step):
Step N: <action description>
<screenshot>

USER (final):
Summarize.
```

---

## Appendix C — Integration order

This is the recommended build-out sequence. Don't do all of this at once; each step should prove value before we add the next.

1. **Add `npm run lint` to the Tier 1 gate.** (Trivial, do today.)
2. **Write Vitest for `src/lib/imageCompression.ts`.** (Pattern exemplar.)
3. **Set test-user passwords as Vercel preview env vars** — unlocks Tier 3 runs. (Human ask.)
4. **First Tier 3 run** against a real preview URL — the Batch 4.4 PR is a natural candidate. Capture learnings.
5. **First new Tier 4 spec — `e2e/snap-submit.spec.ts`** during Batch 4.4.
6. **Add `@axe-core/playwright`** to Tier 3 runs. Baseline the a11y issues; treat new ones as regressions.
7. **Prototype Tier 5 walkthrough script** — one flow, one judge, rubric v1, read output, iterate. No merge-blocking yet.
8. **Add Playwright MCP to `.mcp.json`** when the agent needs per-batch exploratory testing (interactive) rather than spec-file runs. Evaluate Chrome DevTools MCP at the first hard-to-diagnose failure.
9. **Start retro coverage** for the top-3 revenue flows (Billing, Subscribe, Credit pack).
10. **Quarterly review.** Update this doc.




