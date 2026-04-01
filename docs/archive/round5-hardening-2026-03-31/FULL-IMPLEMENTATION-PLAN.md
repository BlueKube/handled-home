# Full Implementation Plan: Round 5 — Hardening & Launch Readiness

> **Created:** 2026-03-31
> **Purpose:** Close the gap between "works in demo" and "works in production." Focus on the automated systems that run without human intervention — exceptions, billing, provider accountability, and SOPs. Plus: bring the market simulator into the admin console.

---

## Context

The app has ~320 features, most rated 7-8/10. Round 1-4 built the foundation across auth, property profiles, zones, SKU catalog, subscriptions, handles, service days, routines, jobs, billing, payouts, notifications, referrals, growth, and scheduling. The weakest areas are:

- **Exception Management** (4/10) — two separate exception systems, no unified queue, no next-best-action automation
- **Provider Accountability** (5-7/10) — no-show detection works but has no escalation ladder; probation system is text-only; auto-suspend/promote are unimplemented
- **Billing Automation** (6-8/10) — cron jobs exist but admins have no visibility into dunning steps, payout rollover tracking, or generation audit trails
- **SOPs** (3/10) — 10 playbooks exist as static text cards; none are interactive workflows with system enforcement
- **Market Simulator** — standalone tool in `tools/market-simulation/` that admins can't access from the app

### What this round delivers

An admin who opens the app on day one of market launch should be able to:
1. Run business model simulations without leaving the admin console
2. See all exceptions (ops + billing) in one queue with suggested actions
3. Trust that no-shows, quality drops, and payment failures are automatically escalated
4. Follow interactive SOPs that track completion and alert on skips
5. See exactly what step a dunning sequence is on, and override if needed

---

## Phase 1: Market Simulator Admin Integration

**Problem:** The market simulator lives in `tools/market-simulation/` and can only be run locally via `npx tsx` or the standalone HTML UI. Admins can't access it from the app. Since it doesn't modify the database or affect the mobile app, it's safe to embed in the admin console.

**Goals:**
1. Create an admin page at `/admin/simulator` with the simulation dashboard
2. Port the simulation engine (model.ts, simulate.ts) to run client-side in the browser
3. Replicate the key UI from `tools/market-simulation/ui/index.html` as React components
4. Add to the admin sidebar under a new "Tools" navigation group
5. Support scenario save/compare (localStorage, not database)

**Scope:**
- New admin page: `src/pages/admin/Simulator.tsx`
- Port simulation engine to `src/lib/simulation/` (model + simulate only — not optimizer or multi-zone)
- Interactive sliders for key assumptions (pricing, plan mix, provider payout, growth rates)
- 12-month projection table + key metric cards
- Revenue vs Cost chart, Margin trend, Customer growth chart
- Scenario presets (current baseline, optimistic, conservative)
- Save/load scenarios to localStorage
- Seasonal profile selector (Austin, Phoenix, Denver, Charlotte)

**Out of scope:**
- Optimizer (autoresearch loop) — too compute-heavy for browser, stays as CLI tool
- Multi-zone analysis — stays as CLI tool
- Database persistence of scenarios — localStorage is sufficient for now
- SKU-level validation — stays as CLI tool (`validate-skus.ts`)

**Estimated batches:** 4-5 (S-M)

---

## Phase 2: Exception Management Unification

**Problem:** The app has two separate exception systems — `ops_exceptions` (9 types, full audit trail) and `billing_exceptions` (payments, disputes, payouts) — with different schemas and separate admin pages. Admins must check both. Feature 238-240 are at 4/10.

**Goals:**
1. Unify ops and billing exceptions into a single admin queue
2. Add computed next-best-action CTAs based on exception type and state
3. Add one-tap resolution actions (retry payment, reassign provider, issue credit, request proof)
4. Add SLA breach detection with visual countdown timers
5. Surface held-earnings exceptions automatically

**Scope:**
- Unified exception queue component that queries both tables
- Next-best-action engine: maps (exception_type, status, age) → suggested action
- Pre-configured quick-action buttons per exception type
- SLA timer display with approaching/breached visual indicators
- Auto-generate exceptions for: earnings held >48h, dunning step 3+, reconciliation mismatches
- Decision trace integration on Ops Exception detail panel

**Estimated batches:** 4-5 (M)

---

## Phase 3: Provider Accountability System

**Problem:** No-show detection works (hourly cron) but has no escalation ladder. Quality scores compute daily but trigger no automatic actions. Probation is text-only (3/10). Auto-suspend and auto-promote are unimplemented (5-6/10).

**Goals:**
1. Build the no-show escalation ladder with excused/unexcused classification and rolling window tracking
2. Build the provider probation system (table, auto-entry at ORANGE SLA, improvement targets, deadlines)
3. Wire SLA band transitions to automatic actions (YELLOW=warning, ORANGE=probation, RED=suspension)
4. Auto-promote highest-performing backup when primary is suspended
5. Provider-facing probation dashboard showing status, targets, and progress

**Scope:**
- New table: `provider_incidents` (no-shows, quality issues) with rolling window queries
- New table: `provider_probation` (status, entry_reason, targets, deadline, progress)
- No-show classification UI for admins (excused vs unexcused with reason codes)
- Provider reason submission for missed jobs
- Escalation ladder: Tier 1 (warning notification), Tier 2 (score penalty -15), Tier 3 (auto-probation)
- Probation entry automation when SLA enters ORANGE for 2+ consecutive evaluations
- Auto-suspension when probation improvement targets missed at deadline
- Auto-promote backup to primary when primary suspended
- Admin "Provider Accountability" queue showing incidents + probation status
- Provider-facing probation status card on their dashboard

**Dependencies:** Phase 2 (exceptions) — probation events should generate exceptions

**Estimated batches:** 5-6 (M-L)

---

## Phase 4: Billing & Payout Hardening

**Problem:** Billing cron jobs run but admins have no visibility into dunning step progression, payout rollover tracking, or invoice generation history. Features 233-237 range 6-8/10. Edge function integration tests are blocked by missing staging credentials (TODO.md item).

**Goals:**
1. Add dunning step visibility to admin billing UI (which step, when next retry, manual override)
2. Add invoice generation audit trail (when generated, idempotency status, errors)
3. Add payout rollover tracking (providers with sub-threshold earnings across multiple weeks)
4. Auto-generate billing exceptions at dunning step 3+ and payout failures
5. Provider communication for rollovers ("Your earnings are below the $25 minimum, rolling to next week")

**Scope:**
- Dunning step tracker component: shows step 1-5 timeline per failed payment, with manual advance/skip
- Invoice generation log: append-only table of generation attempts with status
- Payout rollover dashboard: providers with 2+ consecutive rollovers, total accumulated amount
- Provider notification for rollover (via notification event bus)
- Wire dunning step 3+ to auto-create billing exception
- Wire payout failure to auto-create billing exception

**Estimated batches:** 3-4 (S-M)

---

## Phase 5: SOP Automation

**Problem:** 10 SOPs exist as static text playbook cards (3/10). Admins must follow them manually. No tracking of whether an SOP was completed, no alerts if steps are skipped, no automated actions at specific steps.

**Goals:**
1. Convert static SOP cards into interactive checklists with step tracking
2. Add SOP run tracking: who started it, which steps completed, when finished
3. Add automated triggers that launch SOPs based on system events (e.g., 4+ hour missing proof → launch SOP 246)
4. Add skip alerts: if an SOP is triggered but not started within the SLA window, alert the ops team
5. Priority: No-Show Escalation (247), Missing Proof (246), EOD Reconciliation (245), Zone Pause (249)

**Scope:**
- Interactive SOP component with step-by-step checkoff, notes per step, and completion timestamp
- SOP run history table: `sop_runs` (sop_id, started_by, started_at, completed_at, steps_completed)
- Auto-trigger rules: configurable (event_type, condition) → (sop_id, priority)
- Skip alert: if SOP triggered but not started within N minutes, generate ops exception
- Connect to exception system: SOP completion can resolve the triggering exception
- 4 priority SOPs converted first: Missing Proof, No-Show Escalation, EOD Reconciliation, Zone Pause

**Dependencies:** Phase 2 (exceptions for auto-triggers), Phase 3 (no-show/probation data for SOPs)

**Estimated batches:** 4-5 (M)

---

## Phase 6: Support & Dispute Polish

**Problem:** Guided Resolver (7/10), policy engine (7/10), evidence replay (7/10), and chargeback intercept (6/10) all need work. Policy preview simulator is at 2/10.

**Goals:**
1. Build the policy preview simulator (test scenario inputs, see what resolution offers would be shown)
2. Improve chargeback intercept flow (proof + credits as off-ramps before Stripe dispute)
3. Polish Guided Resolver with better category flow and instant resolution confidence
4. Improve evidence replay presentation (before/after + checklist + time-on-site in a clean layout)

**Scope:**
- Policy preview simulator page: select exception type, input scenario values, see computed offers
- Chargeback intercept: when Stripe dispute webhook fires, auto-present proof package + credit offer before escalating
- Guided Resolver: improve category selection UX, add confidence badges on resolution offers
- Evidence replay: clean card layout combining photos, checklist results, and timestamps

**Estimated batches:** 3-4 (S-M)

---

## Phase 7: Accessibility & Admin Polish

**Problem:** WCAG AA is at 6/10. KPI definitions page is 5/10. Admin change request system is 5/10. Several admin pages need polish for production readiness.

**Goals:**
1. WCAG AA audit: keyboard navigation, screen reader labels, contrast ratios across all customer-facing pages
2. Complete KPI definitions page with formulas, data sources, and interpretation guidance
3. Polish admin change request workflow (currently 5/10)
4. Loss Leader review tab improvements (currently 6/10)
5. Icon consistency pass (ArrowLeft → ChevronLeft per TODO.md)

**Scope:**
- Automated accessibility audit using axe-core or similar
- Fix critical a11y issues: missing alt text, broken tab order, insufficient contrast
- KPI definitions: add formula cards for each metric on the definitions page
- Change request system: approval workflow with notification on request/approve/reject
- Loss Leader tab: per-plan profitability with cohort attach rate breakdown
- Icon swap: ArrowLeft → ChevronLeft across provider and onboarding pages

**Estimated batches:** 4-5 (S-M)

---

## Execution Order

1. **Phase 1** (Simulator) — standalone, no dependencies, good warm-up
2. **Phase 2** (Exceptions) — foundational for Phases 3 and 5
3. **Phase 3** (Provider Accountability) — depends on exception system
4. **Phase 4** (Billing) — independent, can overlap with Phase 3 if context allows
5. **Phase 5** (SOP Automation) — depends on Phases 2 and 3
6. **Phase 6** (Support) — independent
7. **Phase 7** (Accessibility) — best done last as a final polish pass

**Estimated total:** 27-34 batches across 7 phases

---

## Success Criteria

1. Exception Management features reach 8/10 (from 4/10)
2. Provider accountability features reach 8/10 (from 5-7/10)
3. Billing automation features reach 9/10 (from 6-8/10)
4. SOP features reach 7/10 (from 3/10)
5. Market simulator accessible from admin console
6. No customer-facing WCAG AA critical violations
7. All automated systems have admin visibility into their decision-making
