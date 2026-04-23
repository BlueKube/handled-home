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

**Status: live per-PR** via `.github/workflows/playwright-pr.yml`. Runs automatically on every non-draft PR touching `src/` or `e2e/`. The workflow resolves the Vercel preview URL dynamically, injects the `x-vercel-protection-bypass` header, runs `npm run test:e2e`, uploads Playwright report + test-results artifacts, and posts a summary comment back to the PR.

The Playwright setup is mature: `playwright.config.ts` reads `BASE_URL`, `auth.setup.ts` logs in customer + provider + admin test users into reusable storage states, 6 specs cover BYOC flows + screenshot catalog + AvatarDrawer.

**Local-run protocol** (when you need to iterate faster than CI):
```bash
BASE_URL="<preview-url>" \
VERCEL_AUTOMATION_BYPASS_SECRET="<bypass>" \
TEST_CUSTOMER_EMAIL=… TEST_CUSTOMER_PASSWORD=… \
TEST_PROVIDER_EMAIL=… TEST_PROVIDER_PASSWORD=… \
TEST_ADMIN_EMAIL=…    TEST_ADMIN_PASSWORD=…    \
npm run test:e2e
```

See **Appendix D — secrets inventory** for every variable the workflow expects, where to set it, and sensitivity tier.

### Tier 4 — New spec per new flow (feature batches)

**Status: active.** `e2e/avatar-drawer.spec.ts` (Batch 5.2 retro) is the first spec produced under this tier after PR #19. Each subsequent batch with a new user flow adds a spec per the table below and ships it in the same PR.

For every new user-facing flow, add a `.spec.ts` in `e2e/` before closing the batch. Examples:

| Flow | Spec name | Assertions |
|---|---|---|
| Snap submit (Batch 4.3) | `e2e/snap-submit.spec.ts` | Capture → describe → AI card appears within 10s → routing radio → submit → toast → `snap_requests` row exists (via Supabase MCP assertion) → `handle_transactions` row with correct `reference_id`. |
| Snap insufficient credits | `e2e/snap-insufficient.spec.ts` | Same flow as above but with a customer whose balance < hold amount → destructive toast, no row written. |
| Snap early-close cleanup | `e2e/snap-cleanup.spec.ts` | Get to step 3, close sheet, assert draft row + photo both gone. |

Keep specs **idempotent**: each spec resets state it depends on (via `test.beforeEach` that seeds or cleans). Use the Supabase MCP to set up / tear down server-side state rather than clicking through the UI.

### Tier 5 — Experiential (AI-as-judge)

**Status: live per-PR when `ANTHROPIC_API_KEY` is set.** Runs via the `ai-judge` matrix (3 parallel role jobs) in `.github/workflows/playwright-pr.yml`. The Sarah persona (`e2e/prompts/personas/busy-homeowner.md`) is the canonical judge. Not merge-blocking; a signal for polish rounds.

See Section 5 below. This is the frontier tier — takes 30 s to a few minutes, uses an LLM to evaluate the flow's clarity, friction, and affect against a rubric.

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

### 5.6 Persona — "Sarah, the busy mom" (canonical v1)

Every Tier 5 run uses this persona as the primary judge. Added variants can be tested later; this one is the ground truth for Handled Home today.

**Name:** Sarah
**Age:** 38
**Context:** Two kids (5 and 9), works a demanding full-time job, married, owns a single-family home. Has money; does not have time.
**Technical skill:** Low. Uses Facebook, Google, Amazon, Instacart, DoorDash, her bank's app. Anything more complex than those she treats as suspect ("why does this need to be so complicated?").
**Handiness:** None. Can't tell a socket wrench from a torque wrench. Doesn't know what a valve is. When something breaks in the house, her first move is to Google "how do I fix X" and the second move is to abandon the search and look for a service.
**What she wants:** The easiest path to "just make it work." A button that says "fix this" and then something visibly fixing it.
**What she fears:** Being taken advantage of by tradespeople. Committing to money without knowing what she's getting. Having to make a phone call. Getting stuck in a chatbot loop. Making the "wrong choice" on a confusing form.
**Trust reference points:** Amazon Prime's "just ship it" feel. DoorDash's photo-driven ordering. Instacart's substitution handling. Anything that feels thought-through.
**Friction reference points:** Airline check-in, health-insurance portals, DMV websites. She has a visceral reaction to anything that feels like those.
**How she reads a UI:** Skims. Looks for the obvious action. If the primary CTA isn't visible in 2–3 seconds, she's gone. If a form has more than 4 fields without explanation, she's gone. If a price isn't shown clearly before she commits, she's gone.

**Success signal:** She would tell her friend about the app — not because it's impressive, but because she can't stop talking about how it just worked.
**Failure signal:** She'd close the tab and not return. Most importantly: she doesn't complain in writing — she just leaves silently. Tier 5 exists to catch what she wouldn't bother telling us.

When running the AI judge with this persona, the score should reflect how Sarah — specifically — would react. If a step is technically correct but implicitly expects the user to know what "cadence" means or what "routing" does, the friction score should drop even if a power user would be unaffected.

### 5.7 Persona variants (future)

Once the Sarah rubric is calibrated, consider variants for stress-testing:

- **Skeptical-Sarah** — has been burned by home-service scams. Highest trust-signal sensitivity; any ambiguity reads as red flag.
- **Budget-Sarah** — same persona, minus the money. Tolerates one extra confirmation screen if it lets her double-check the price.
- **Returning-Sarah** — running the flow for the Nth time. Wants zero re-explanation; frustrated by tutorial overlays and "are you sure?" dialogs.

Disagreements between variants are signal. A flow that Sarah loves but Skeptical-Sarah hates is trading trust for polish — usually a mistake.

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
You are Sarah, a 38-year-old mom of two (5 and 9) with a demanding
full-time job and no spare time. You have money; you do not have
time. You own a single-family home. You are NOT handy — you don't
know what a valve is, can't tell a socket wrench from a torque
wrench, and when something breaks, your first reaction is to find
a service that will just take care of it.

Your technical reference points are Facebook, Google, Amazon,
Instacart, DoorDash, and your bank's app. Anything that feels
meaningfully harder than those is suspect. Airline check-in,
insurance portals, and DMV websites give you a visceral "nope"
reaction.

Your fears: being taken advantage of by tradespeople, committing to
money without knowing what you're getting, having to make a phone
call, getting stuck in a chatbot loop, making the "wrong" choice
on a confusing form.

How you read a UI: you skim. If the primary CTA isn't obvious in
2–3 seconds, you're gone. If a form has more than 4 fields without
a clear "why," you're gone. If a price isn't shown before you
commit, you're gone. You don't read paragraphs.

Success for you: the app did what you needed and you'd mention it
to a friend later. Failure: you closed the tab silently and won't
come back.

You are now reviewing a new flow in a home-services app you've
never used. For each step you'll see a screenshot and a short
description of what you just did.

Scoring per step (1 = bad, 5 = excellent), FROM SARAH'S POV:
- Clarity: can you tell what to do next without thinking? Is the
  primary action obvious in 2–3 seconds?
- Friction: how much work does this step demand of a tired,
  interruption-prone person? Every field that could be pre-filled
  but isn't costs a point.
- Affective tone: does the copy sound like a person wrote it, or
  like a lawyer / engineer / chatbot? Is the tone right for the
  moment (pre-commitment: explanatory; post-commitment: reassuring)?
- Trust signals: before money or a commitment, does the step make
  you feel safe, or does it feel like a trap? Specific numbers
  shown clearly? What happens next explained?
- Visual consistency: does it feel like a polished app (Amazon,
  Instacart) or like a health-insurance portal?

Also flag for each step:
- Drop-off risk: low / medium / high. Would YOU close this tab?

Be specific. If you can't tell what something does, say so — don't
guess. If copy is good, quote the specific phrase. If layout is
confusing, say which element.

At the end, summarize:
- Overall flow score (average of per-step clarity + friction +
  trust).
- Top 3 things that made you want to close the tab.
- Top 3 things that made you think "oh, this is nice."
- One sentence: would you tell a friend about this app? Why or
  why not? (Be honest — most apps are "eh, fine.")

USER (per step):
Step N: <action description>
<screenshot>

USER (final):
Summarize.
```

---

## Appendix C — Integration order

This is the recommended build-out sequence. Don't do all of this at once; each step should prove value before we add the next.

1. ✅ **Add `npm run lint` to the Tier 1 gate.** Scoped to changed files in PR #17 (Batch 5.1); repo-wide lint has ~902 pre-existing errors tracked as separate debt.
2. ✅ **Write Vitest for `src/lib/imageCompression.ts`.** Pre-existing; `src/lib/__tests__/initials.test.ts` added in PR #18 (Batch 5.2) as the second pure-helper exemplar.
3. ✅ **Set test-user credentials as secrets** — populated in GH Secrets 2026-04-22 (PR #19 / Batch T.1). Inventory in Appendix D.
4. ✅ **First Tier 3 run** against a real preview URL — PR #19's fix commit `88103e3` produced the first full-green Playwright run against a Vercel preview.
5. ✅ **First new Tier 4 spec — `e2e/avatar-drawer.spec.ts`** — shipped with PR #19 as retroactive coverage for Batch 5.2's drawer. The `snap-submit.spec.ts` originally planned for Batch 4.4 was deferred; follow-up tracked under Tier 4 section.
6. **Add `@axe-core/playwright`** to Tier 3 runs. Baseline the a11y issues; treat new ones as regressions. **← next open item.**
7. ✅ **Tier 5 walkthrough is operational, not prototype.** `scripts/generate-synthetic-ux-report.ts` + `generate-creative-director-audit.ts` + `generate-growth-audit.ts` ship per-PR via the `ai-judge` matrix in `.github/workflows/playwright-pr.yml`. Sarah persona at `e2e/prompts/personas/busy-homeowner.md`. (Originally thought to be pending as of the April 2026 strategy draft — actually built out.)
8. **Add Playwright MCP to `.mcp.json`** when the agent needs per-batch exploratory testing (interactive) rather than spec-file runs. Evaluate Chrome DevTools MCP at the first hard-to-diagnose failure.
9. **Start retro coverage** for the top-3 revenue flows (Billing, Subscribe, Credit pack).
10. **Quarterly review.** Update this doc.

**Parallel follow-up (not strictly ordered):** seed a property profile for the three persistent test users so Tier 4 specs can assert strict destination URLs (see `docs/upcoming/TODO.md`).

---

## Appendix D — Secrets inventory

Every secret referenced by the testing harness. Add to the repo via **Settings → Secrets and variables → Actions → Repository secrets** (unless noted).

| Secret name | Purpose | Where it's used | Sensitivity | Rotation cadence |
|---|---|---|---|---|
| `TEST_CUSTOMER_EMAIL` | Customer test-user email | `playwright-pr.yml`, `playwright.yml`, `e2e/auth.setup.ts` | Low (fixed test account) | Rotate when changing the test user's password |
| `TEST_CUSTOMER_PASSWORD` | Customer test-user password | same | Medium (account takeover if leaked) | Quarterly or on suspected leak |
| `TEST_PROVIDER_EMAIL` | Provider test-user email | same | Low | same as customer |
| `TEST_PROVIDER_PASSWORD` | Provider test-user password | same | Medium | same as customer |
| `TEST_ADMIN_EMAIL` | Admin test-user email | same | Low | same as customer |
| `TEST_ADMIN_PASSWORD` | Admin test-user password | same — **higher blast radius because admin** | **High** (admin access to prod data) | Monthly or after any suspected session exposure |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Bypasses Vercel Preview Protection so Playwright can reach the preview URL | `playwright-pr.yml` (and `playwright.config.ts` via env) | Medium (anyone with this can view any preview) | Rotate after first setup + on any suspected leak; regenerate in Vercel Dashboard → Project → Settings → Deployment Protection |
| `ANTHROPIC_API_KEY` | Tier 5 AI-judge (Sarah persona) API calls | `playwright-pr.yml` `ai-judge` matrix, `playwright.yml` `ai-reports` | High (paid usage, rate-limited) | Remove secret to kill all Tier 5 spend; rotate on suspected leak |
| `BASE_URL` | Static target for the manual `playwright.yml` (prod or a pinned preview) | `playwright.yml` only — the new PR workflow derives this per-PR | Low | Update when prod URL changes |
| `TEST_BYOC_TOKEN` | BYOC happy-path spec fixture token | `playwright-pr.yml` `e2e`, `playwright.yml` `e2e` | Low | As needed |

### Not stored as GH Secrets (local-only)

Populate in `.claude/settings.local.json` (gitignored) for local Claude Code runs:

- `SUPABASE_ACCESS_TOKEN` — management API for schema changes (see CLAUDE.md §12 Credential tiers)
- `VERCEL_TOKEN` — if running `vercel` CLI locally
- `SUPABASE_PROJECT_REF`, `SUPABASE_URL` — convenience for sandbox operations

### Hygiene notes

- **Never echo secrets in workflow logs.** The `Validate required secrets` step in `playwright-pr.yml` uses `[ -z "${!var}" ]` — this checks whether a var is empty without printing its value. Do NOT `echo "$SECRET"` anywhere for debugging.
- **Playwright traces may contain auth cookies.** `trace: "on-first-retry"` in `playwright.config.ts` captures network state on retries. Traces uploaded as artifacts are visible to anyone who can view the PR — don't expose PR access to untrusted parties.
- **Rotate test-user passwords after any public incident.** These accounts hold seeded demo data in prod; an attacker with the password can see but not meaningfully modify the platform. Still: rotate.

---

## Appendix E — CI / infrastructure gotchas

Tactical traps encountered while wiring the per-PR harness in Batch T.1 (PR #19). If one of these symptoms shows up in a future CI run, apply the documented fix instead of re-diagnosing.

### E.1 — `wait-for-vercel-preview` action fails under Preview Protection

**Symptom:** `patrickedqvist/wait-for-vercel-preview@v1.3.1` finds the preview URL via GitHub Deployments API, sets the `url` output, then times out on an internal HTTP check of that URL. Job conclusion: `failure`. Downstream `e2e` job skips because the default `needs:` semantics drop skip a dependent whose parent failed — regardless of the `if:` condition.

**Root cause:** the action's HTTP-check step calls the preview URL without sending `x-vercel-protection-bypass`, so Vercel returns 401 until the action gives up.

**Fix:** replace the action with an `actions/github-script@v7` block that polls Deployments API only — no HTTP check. Canonical implementation in `.github/workflows/playwright-pr.yml` job `wait-for-preview`. Additionally, set the dependent job's condition to `if: always() && needs.wait-for-preview.outputs.preview_url != ''` so a non-success status on the resolver doesn't skip the downstream job when the URL was actually set.

### E.2 — `x-vercel-set-bypass-cookie` forces a 307 redirect

**Symptom:** warm-up curl prints `Attempt N → HTTP 307` five times in a row. Bypass secret is correct; browser access via `?x-vercel-protection-bypass=<secret>` works (app renders).

**Root cause:** sending `x-vercel-set-bypass-cookie: samesitenone` asks Vercel to set a persistent bypass cookie, which it implements by redirecting (307) the request to the same URL so the cookie lands on the destination. `curl` without `-L` stops at 307.

**Fix:** send `x-vercel-protection-bypass` alone. `extraHTTPHeaders` on Playwright already re-sends it per-request, so cookie persistence is unnecessary. For one-off curl probes, just skip the second header. See `playwright.config.ts` + `playwright-pr.yml` `Warm up preview` step.

### E.3 — `bun install --frozen-lockfile` fails opaquely in CI

**Symptom:** `e2e` job completes in ~12 seconds, far too fast to have run Playwright. No clear error in the log — the `bun install` step exits non-zero with minimal output.

**Root cause:** bun's lockfile format drifts between minor bun releases. `--frozen-lockfile` treats any drift as a hard fail. `oven-sh/setup-bun@v2` with `bun-version: latest` can pick up a bun release that doesn't match the committed `bun.lock`.

**Fix:** when the repo ships a committed `package-lock.json`, switch the workflow to `actions/setup-node@v4` with `cache: npm` + `npm ci`. Deterministic, ~30s install, known-good lockfile path. The manual `playwright.yml` can stay on bun for continuity — don't change two things at once.

### E.4 — Use `GITHUB_STEP_SUMMARY` for CI failure diagnostics

**Symptom:** Playwright test fails in CI; the actual error is only in `test-results/error-context.md` inside the uploaded artifact. Diagnosing requires downloading + extracting the zip every iteration.

**Root cause:** Playwright writes rich failure data to `test-results/` but the console log only shows a summary. Artifacts upload per-PR but aren't rendered inline.

**Fix:** add an `if: failure()` step after the Playwright run that dumps `test-results/.last-run.json`, each `error-context.md`, stdout tails, and the screenshot inventory into `$GITHUB_STEP_SUMMARY`. Renders as markdown in the Actions UI Summary tab — no download cycle. Template in `playwright-pr.yml` "Print Playwright failure summary" step.

### E.5 — `paths-ignore` on `pull_request` doesn't reliably skip the workflow

**Symptom:** set `paths-ignore: ["docs/**", "**/*.md", ".gitignore"]` on a `pull_request` workflow, pushed a docs-only commit, and the workflow still queued and ran jobs.

**Root cause:** GitHub's path-filter semantics for `pull_request` events are less strict than for `push` events; multi-commit PRs and path-filter edge cases can cause the workflow to trigger despite all files matching the ignore list.

**Fix:** don't rely on `paths-ignore` as a cost-control gate. Either gate individual jobs with an `if:` that inspects `github.event.pull_request.changed_files` via `actions/github-script`, or accept the extra run cost for docs-only commits and let them pass quickly.

### E.6 — Un-onboarded test users trip `CustomerPropertyGate`

**Symptom:** Tier 4 spec clicks `AvatarDrawer` → "Credits" menu item; expected URL `/customer/credits`, actual URL `/customer/onboarding`. Every PropertyGate'd destination redirects to onboarding.

**Root cause:** the persistent test customer has no property profile seeded on Supabase Preview branches. `CustomerPropertyGate` correctly redirects authenticated users without a property.

**Fix (current):** write Tier 4 destination assertions as intent-based — `toHaveURL(/\/customer\/(credits|onboarding)/)` — and verify the drawer closed / navigation fired rather than the destination rendered.

**Fix (ideal, follow-up):** seed a property profile for the three persistent test users via migration OR a per-spec `test.beforeAll` that hits a Supabase RPC. Tracked in `docs/upcoming/TODO.md`.

### E.7 — `peter-evans/create-or-update-comment` creates duplicate comments without `comment-id`

**Symptom:** every PR push adds another `### Playwright PR run` status block to the PR — N commits produce N comments.

**Root cause:** `peter-evans/create-or-update-comment@v4` creates a new comment unless you pass a `comment-id`. Without one, it has nothing to update.

**Fix:** prepend `peter-evans/find-comment@v3` with `body-includes: "### Playwright PR run"`, then pass `comment-id: ${{ steps.find-comment.outputs.comment-id }}` and `edit-mode: replace` to the create-or-update step. Single status comment, updated in place. Canonical implementation in `playwright-pr.yml` `comment` job.

