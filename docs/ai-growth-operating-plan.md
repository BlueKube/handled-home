# Handled Home — AI Growth Operating Plan

## Objective
Create a self-improving operating system for home services that:
1. Maximizes recurring customer value (multi-service household adoption, low churn, high trust).
2. Maximizes provider value (higher route density, better utilization, lower CAC from door-to-door).
3. Minimizes centralized ops/support burden via productized automation and user self-healing flows.

## Strategic guardrails
- Build a **dominant but compliant** market position by winning on customer and provider outcomes, not coercion.
- Preserve trust: transparent pricing, clear quality standards, fair dispute processes.
- Avoid brittle AI: every high-impact decision path has deterministic fallbacks and auditable logs.

## North-star outcomes
- Household side:
  - Increase average active services per household (1.0 → 2.0+ → 3.0+).
  - Decrease time-to-routine-completion and support tickets per active household.
  - Increase referral-driven growth share.
- Provider side:
  - Increase weekly utilization and route density.
  - Increase net provider earnings/hour and retention.
  - Increase provider-imported customer conversions.
- Platform side:
  - Reduce manual ops interventions per 1,000 jobs.
  - Reduce manual support touches per 1,000 active households.
  - Increase gross margin stability and payout/billing reliability.

## AI program structure

### Program A — Instrumentation & Ground Truth (2–3 weeks)
**Goal:** Ensure every growth/quality decision has reliable data.

- Build a canonical event taxonomy for growth funnel, job quality, support outcomes, and provider economics.
- Enforce event contracts in code (typed payloads, versioned schemas).
- Add quality gates:
  - Event completeness checks.
  - KPI drift monitors.
  - Backfill/reconciliation jobs.
- Create one shared “decision dataset” for product, growth, and ops AI workflows.

**Deliverables**
- Event dictionary + owner per event.
- Data reliability dashboard.
- Weekly audit report on missing/broken events.

### Program B — Full-app Validation Harness (2–4 weeks)
**Goal:** Move from ad-hoc QA to continuous confidence.

- Expand Playwright into a role-based full-funnel suite:
  - Customer onboarding → routine build → payment → service lifecycle → issue resolution.
  - Provider onboarding → assignment acceptance → job proof upload → payout lifecycle.
  - Admin operations: zone changes, exception handling, billing and support controls.
- Introduce golden-path + anti-path tests (invalid states, retries, stale sessions, race conditions).
- Generate a complete screenshot catalog by route/state/role and compare diffs each release.
- Add AI reviewers (UX and growth rubric-based) to score screenshots and critical flows.

**Deliverables**
- Coverage matrix mapping every core feature to at least one E2E test.
- Screenshot catalog with route-level ownership.
- Release gate that blocks deploy on critical regression.

### Program C — Self-healing Product Loops (4–8 weeks)
**Goal:** Reduce ops/support load through automation and guided resolution.

- Build triage copilots for:
  - Scheduling exceptions.
  - Billing failures and recovery.
  - Support ticket classification and recommended action.
- Implement deterministic runbooks + AI recommendation layer:
  - AI proposes; policy engine decides; human override for edge cases.
- Productize customer/provider self-serve flows:
  - Guided reschedule and service credits.
  - Smart issue intake with evidence checks.
  - Proactive alerts before failures become tickets.

**Deliverables**
- “No-human-needed” resolution rate dashboard.
- Top-10 recurring issue auto-resolution coverage.
- Ops intervention reduction milestone targets.

### Program D — Network Effects Engine (4–12 weeks)
**Goal:** Compound growth through referrals, multi-service expansion, and provider-sourced demand.

- Household expansion models:
  - “Next best service” recommendations using property profile, seasonality, and routine gaps.
  - Bundle recommendations optimized for convenience + credit utilization.
- Referral growth loops:
  - Trigger-based referral prompts at high-satisfaction moments.
  - Dynamic incentives tuned to local supply-demand balance.
- Provider bring-your-own-customers (BYOC) loops:
  - Frictionless invite/import flow.
  - Migration offers for provider customer books.
  - Visibility into provider-side ROI from platform migration.

**Deliverables**
- Multi-service adoption playbook by market maturity.
- Provider-import conversion funnel dashboard.
- Cohort retention analysis for referred and BYOC-origin customers.

### Program E — Profitability & Autopilot Controls (ongoing)
**Goal:** Make growth durable and margin-aware.

- AI-assisted pricing/payout recommendations with margin constraints.
- Zone-level expansion and throttle decisions using health scores and waitlist demand.
- SLA/risk forecasting for provider quality degradation and churn risk.
- Weekly “autopilot review” process:
  - What the system changed automatically.
  - What was escalated to humans and why.
  - Which policies to tighten/loosen.

**Deliverables**
- Market-level unit economics board.
- Automated policy change proposals with approval workflow.
- Exception budget with trend targets.

## Documentation cleanup plan

### 1) Source-of-truth consolidation
- Keep one canonical strategy doc, one architecture doc, one feature inventory, one operations runbook index.
- Mark all legacy/planning docs as active/archived/draft.

### 2) Feature inventory normalization
- Reconcile `docs/feature-list.md` and `docs/feature-list-by-role.md` into:
  - Feature ID
  - Role scope
  - Current status (live, partial, deprecated)
  - Test coverage ID(s)
  - KPI link(s)

### 3) “Vision alignment” annotations
- For each feature, add tags:
  - Growth driver, trust/safety driver, ops-reduction driver, provider-value driver.
- Remove or de-prioritize features with low strategic contribution.

### 4) Operational readiness annotations
- Add owner, SLA, and fallback behavior for every edge function and critical automation path.

## 90-day execution sequence

### Days 1–15
- Freeze net-new features except critical fixes.
- Complete instrumentation audit and E2E coverage map.
- Build initial screenshot catalog + visual review cadence.

### Days 16–45
- Close all critical flow/test gaps.
- Launch self-healing support and billing automations for top recurring issues.
- Deploy first wave of recommendation improvements for multi-service adoption.

### Days 46–90
- Roll out provider BYOC growth experiments market-by-market.
- Optimize referral and expansion incentives based on cohort outcomes.
- Establish weekly executive “autopilot health” operating review.

## AI tooling stack recommendation
- **Implementation/review AI:** Claude Code Opus for coding, refactoring, and commit reviews.
- **UX QA AI:** Screenshot-based synthetic UX audits with persona prompts.
- **Growth analytics AI:** Weekly narrative analysis of funnel, retention, and supply-demand imbalances.
- **Ops copilot AI:** Triage recommendation agents with policy constraints and audit logs.

## Governance and risk controls
- Never allow unbounded autonomous actions on billing, payouts, or refunds.
- Require explicit policy constraints and approval thresholds for financial-impacting automations.
- Maintain immutable event logs for all automated decisions.
- Run red-team tests for abuse vectors (referrals, credits, chargebacks, ticket gaming).

## Success scorecard (weekly)
- Product outcomes:
  - Activation rate, routine completion time, NPS/CSAT proxies, support contact rate.
- Growth outcomes:
  - Referrals per 100 active households, invite conversion, 30/60/90-day retention, service-per-home growth.
- Provider outcomes:
  - Acceptance rate, completion quality score, earnings/hour, retained providers.
- Automation outcomes:
  - % tickets auto-resolved, % billing issues self-recovered, ops interventions per 1k jobs.
- Financial outcomes:
  - Contribution margin by market, failed payment rate, payout failure rate, dispute loss rate.

## Immediate next actions (this week)
1. Build a feature-to-test-to-KPI traceability sheet from existing docs.
2. Define release quality gates (critical-path E2E + screenshot diff + KPI anomaly checks).
3. Prioritize top 10 manual ops/support pain points and design deterministic+AI self-healing flows.
4. Run first growth model review focused on 2nd and 3rd service adoption bottlenecks.
5. Establish weekly strategy review with one-page scorecard and decision log.
