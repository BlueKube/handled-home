# Handled Home — AI Context Pack (Session Bootstrap)

> Purpose: a compact, high-signal context doc for new ChatGPT / Claude Code sessions.
> Keep this under ~250 lines so it fits comfortably in model context windows.

## 1) What this company is
Handled Home is a subscription home-services operating system, not a commodity lead marketplace.

Primary growth engine: increase services per household through one-tap bundle expansion.
Secondary engine: route density and operational reliability.
Profit engine: **subscription spread** — the delta between what customers pay per handle and what providers are paid per job. Handles abstraction hides margin from both sides. Density widens it automatically.

## 2) Non-negotiable product principles
1. OS feel over marketplace feel (routine-first, not open-calendar shopping).
2. One-click expansion without spam (relevance, suppression, explainability).
3. Standardized Levels and proof requirements.
4. Receipts as trust artifact and light upsell surface.
5. Constraints-first scaling (zones/capacity/provider curation).

## 3) Core roles and surfaces
- Customer: onboarding, routine builder, service day, receipts, billing, support.
- Provider: onboarding, assignments, execution with proof/checklist, earnings.
- Admin/Ops: zones, catalog, capacity, exceptions, support, billing/payout controls.

## 4) Current strategic priorities
1. Improve 2nd/3rd service adoption (attach rate and expansion velocity).
2. Reduce ops/support burden through deterministic + AI-assisted self-healing flows.
3. Improve provider ROI (earnings/hour, route density, predictable work).
4. Keep quality/trust high (proof compliance, low disputes, clear policy enforcement).
5. Shift UX from feature communication to **outcome storytelling** (show savings, show proof, show provider trust).
6. Make BYOC a primary acquisition channel (provider-driven growth at near-zero CAC).
7. Optimize subscription spread margin per zone through density flywheel.

## 5) Source-of-truth map
- Strategy: `docs/masterplan.md`
- Architecture/states/schema spine: `docs/global-system-architecture.md`
- Feature inventory: `docs/feature-list.md`, `docs/feature-list-by-role.md`
- Execution tracker: `docs/tasks.md`
- AI operating plan: `docs/ai-growth-operating-plan.md`

## 6) KPI scorecard (review weekly)
- Growth: ARR per household, services per household, referral share, 30/60/90 retention.
- Reliability: issues per 100 jobs, support minutes per job, proof compliance.
- Provider: earnings/hour, acceptance/completion rates, provider retention, BYOC activations.
- Automation: ticket auto-resolution %, billing self-recovery %, ops interventions/1k jobs.
- Financial: subscription spread margin by zone, contribution margin by market, payment failure rate, dispute loss rate.
- UX/Conversion: onboarding completion rate, first-service celebration engagement, bundle savings calculator views, referral milestone progression.

## 7) How to work in this repo
- Implement in small PRs with tests and explicit rollback/fallback notes.
- Keep docs synchronized with behavior changes (features/tasks/runbooks).
- Prefer deterministic policy engines for high-impact decisions; AI recommends, policy decides.

## 8) Standard prompt template for new AI sessions
Use this at the top of a new session:

"You are helping ship Handled Home, a home-services subscription OS. Read and follow:
1) docs/ai-context-pack.md
2) docs/masterplan.md
3) docs/global-system-architecture.md
4) docs/tasks.md (only relevant section)
5) the specific feature spec(s) for this task.

When proposing changes:
- optimize for services-per-household growth, provider ROI, and low ops/support overhead;
- preserve trust/safety and deterministic fallbacks;
- include tests, observability, and docs updates.

Return: (a) implementation plan, (b) risk list, (c) tests, (d) doc changes."

## 9) Maintenance owner checklist
Update this file when any of the following changes:
- primary strategic priorities,
- non-negotiable principles,
- source-of-truth document locations,
- KPI definitions,
- “standard prompt template” guidance.
