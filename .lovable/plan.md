
# Plan: Update Feature List and Reorganize PRD Files

## Summary
Update `docs/feature-list.md` with all features from PRD-300 (Routing & Scheduling Engine, Sprints 1-9) and PRD-301 (BYOC Onboarding Wizard), plus the Playwright E2E testing infrastructure. Also move PRD-300 and PRD-301 files from the `docs/prds/unfinished` folder to `docs/prds`.

---

## Phase 1: Move PRD Files

Move the following files from `docs/prds/unfinished/` to `docs/prds/`:

**PRD-300 Series (10 files):**
- `prd-300-routing-scheduling-overview.md`
- `prd-300-sprint-1-foundations.md`
- `prd-300-sprint-2-zone-builder.md`
- `PRD 300 - sprint_3_prd_market_zone_category_states_integration.md`
- `PRD 300 - sprint_4_prd_rolling_horizon_planner_14_day_plan_7_day_freeze.md`
- `PRD_300_sprint_5_provider_assignment_v1.md`
- `prd_300_sprint_6_route_sequencing_v_1_equipment_manifest.md`
- `prd_300_sprint_7_appointment_windows_v_1_home_required_services.md`
- `prd_300_sprint_8_exceptions_reschedules_and_ops_control_v_1.md`
- `prd_300_sprint_9_ops_user_manual.md`

**PRD-301 (1 file):**
- `PRD301-byoc-onboarding-wizard.md`

---

## Phase 2: Update Feature List

Add the following new sections to `docs/feature-list.md` (after Section XXXIX and before Section XL):

### Section XL — Routing & Scheduling Engine (PRD-300)

**Sprint 1 — Foundations:**
- Visit and task bundling data model supporting multi-category services per stop
- Scheduling state machine (Draft → Locked → Dispatched → In Progress → Complete → Exception Pending)
- Provider work profile with home base location, service categories, equipment kits, working hours, and capacity limits
- Property and provider geo-coordinate indexing for spatial queries
- Admin scheduling policy dials (appointment window length, ETA range display, arrival notification minutes)
- Customer-facing upcoming visits with status labels (Planning, Scheduled, Today, In Progress, Completed)

**Sprint 2 — Zone Builder v1:**
- H3 hex-grid geo cell infrastructure for scalable zone partitioning
- Automated zone generation from region boundaries with configurable dials
- Zone metrics computation (demand density, supply capacity, compactness, drive-time proxy)
- Cell scoring and seed selection strategies (demand-first, provider-first, auto-hybrid)
- Constrained region-growing algorithm with cost function optimization
- Admin Zone Builder wizard (select region → settings → preview → edit → commit)
- Property-to-zone resolution via H3 cell lookup with fallback ring expansion

**Sprint 3 — Market/Zone Category States Integration:**
- Zone × Category state matrix (Closed, Waitlist Only, Provider Recruiting, Soft Launch, Open, Protect Quality)
- State-based customer catalog gating and subscribe eligibility enforcement
- Category-level waitlist system with zone-specific demand capture
- Provider opportunity surfaces responding to recruiting states
- Nightly recommendation engine with hysteresis thresholds and anti-flap rules
- Admin approval-gated state transitions with confidence scoring
- Minimum time-in-state guardrails to prevent state thrashing

**Sprint 4 — Rolling Horizon Planner:**
- 14-day rolling planning horizon with 7-day LOCKED freeze window
- Nightly planning boundary for schedule promotion and state change application
- Customer routine changes effective only in DRAFT window (≥8 days out)
- Cadence-based task scheduling (weekly, biweekly, every 4 weeks) with stable offsets
- Visit bundling rules merging same-property tasks into single stops
- Stability rules minimizing DRAFT plan changes unless constraints change
- Admin planner health dashboard with run summaries and conflict flagging

**Sprint 5 — Provider Assignment v1:**
- Candidate selection with feasibility filters (skills, equipment, working hours, capacity, proximity)
- Assignment solver with objective function (minimize travel, balance workload, reward familiarity)
- Primary + Backup provider assignment per visit
- Familiarity scoring with configurable cap to balance relationship vs efficiency
- Assignment stability rules with freeze-window extra protection
- Explainability with confidence levels and top reasons per assignment
- Admin exceptions inbox with unassigned/fragile visit prioritization and manual override tools

**Sprint 6 — Route Sequencing v1 + Equipment Manifest:**
- Ordered daily route per provider using nearest-neighbor + 2-opt optimization
- Coarse customer-facing ETA ranges derived from stop sequence
- Daily equipment manifest generation per provider route
- Same-property task bundling with setup discount calculation
- Provider blocked windows and legacy commitment support with segment-based planning
- Provider pre-Start-Day route reorder with feasibility guardrails
- Running-late notification when predicted arrival exceeds ETA window end

**Sprint 7 — Appointment Windows v1 (Home-Required Services):**
- Scheduling profiles per SKU (Appointment Window, Day Commit, Service Week)
- Customer availability capture with 3–6 feasible window offers
- Time-window constraint enforcement in route sequencing (VRPTW feasibility)
- Mixed-profile bundle piggybacking with duration guardrails
- Service-week flexible work with due-soon/overdue queue and week-end deadlines
- Provider-placed flexible work via drag/drop with feasibility checks
- Window-at-risk exception flagging with local repair attempts

**Sprint 8 — Exceptions, Reschedules, and Ops Control v1:**
- Unified exceptions queue with severity/SLA/escalation timers
- Predictive exceptions from nightly planning (window-at-risk, service-week-at-risk, coverage break)
- Reactive exceptions from day-of events (provider unavailable, access failure, weather stop)
- Ops repair actions (reorder, move day, swap provider, cancel/credit) with feasibility checks
- Break-freeze policy with explicit requirements (reason code, customer notification, audit)
- Customer self-serve reschedules inside freeze from feasible options
- Access failure auto-hold with priority reschedule and soft hold expiration
- Ops action idempotency and undo support with reversal transactions
- Provider fairness rules (no-blame access failure, show-up credits)

**Sprint 9 — Ops User Manual:**
- Autopilot health indicators (GREEN/YELLOW/RED) based on configurable thresholds
- Provider-first self-healing with approve/notify/deny/escalate decision framework
- Daily and weekly ops rhythm checklists
- SKU discovery and continuous tuning workflow with provider interviews
- Launch SKU templates for Pool, Windows, and Pest categories
- Ops dashboard requirements with KPI tiles and zone health table
- Standard procedures for zone launch, category opening, planner runs, and call-outs
- Exception playbooks with severity levels and repair strategies

---

### Section XLI — BYOC Onboarding Wizard (PRD-301)

- 7-screen provider-referred customer onboarding flow (60–90 second target)
- Provider recognition screen preserving existing relationship trust
- Confirm existing service screen with editable cadence
- Property creation with address and home type
- Home setup with property signals (pool, trees, pets, garden, windows)
- Connecting provider spinner with activate-byoc-invite call
- Other services screen with zone-available categories (skip-friendly)
- Conditional Home Plan screen for bundled service pricing
- Success screen with provider connection summary
- Dashboard "Your Home Team" card showing connected providers and next visits
- Referral state handling (Existing Provider First Touch, future: Not First Touch, Cold Referral)
- Invite validation with fallback screen for expired/revoked/inactive tokens
- Already-activated 409 handling with dashboard redirect
- BYOC attribution tracking preserved separate from provider-customer relationship

---

### Section XLII — E2E Testing & Synthetic UX Review (Playwright)

- Playwright E2E test harness with Chromium mobile browser emulation
- Auth setup project saving storage state for authenticated tests
- BYOC happy-path test validating full wizard flow with milestone screenshots
- BYOC invalid-invite test validating fallback UI for bad tokens
- BYOC refresh-resilience test validating wizard state preservation on reload
- GitHub Actions CI workflow with artifact upload (reports, screenshots, traces)
- AI-powered synthetic UX review using 6 persona prompts and Claude Sonnet vision
- Per-screen/per-persona evaluation with clarity/trust/friction scores
- Aggregate UX summary report with top 5 friction points and fixes

---

### Update Metadata

- Update total feature count from 270 to ~330
- Update "Last updated" date to 2026-03-09

---

## Technical Details

**File operations:**
1. Delete files from `docs/prds/unfinished/` and recreate in `docs/prds/` (same content)
2. Edit `docs/feature-list.md` to append new sections before Section XL (Simplicity by Design) and renumber

**Renumbering:**
- Current Section XL (Simplicity by Design) becomes Section XLIII
- New features numbered 271–330 (approximately 60 new features)

