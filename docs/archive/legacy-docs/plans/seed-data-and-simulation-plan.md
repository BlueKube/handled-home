# Seed Data Expansion & Market Simulation Plan

## Purpose

Expand the current demo seed data (282 lines, ~1 customer, ~1 provider, ~6 jobs) into a realistic "live metro" dataset that populates **all 110 screens** with believable data. Then build a market simulation framework to model viral growth, zone density, and unit economics over time.

**Two deliverables:**
1. **Rich seed data** — makes every screenshot look like a launched product with real customers and providers
2. **Growth simulation engine** — models zone expansion, BYOC viral loops, and density-driven margin improvement

---

## Current State

### What exists today (`supabase/seed-demo-data.sql`)
- **1 customer** (7cfa1714...), 1 property (123 Main St, Austin)
- **1 provider org** (Austin Pro Services), 1 member
- **1 zone** (Austin Central, b1000000...)
- **6 jobs** total (1 bootstrap + 3 completed + 1 upcoming + 1 in-progress)
- **3 invoices** (2 paid, 1 open)
- **1 routine** with 3 items
- **10 notifications**, 3 ops exceptions, 2 applications, 2 credits
- **10 SKUs** in the catalog

### What's missing
| Area | Gap |
|------|-----|
| **Scale** | 1 customer, 1 provider — screens like Ops Cockpit, Growth, Providers list look empty |
| **Multi-zone** | Only 1 zone — zone comparison, capacity heatmaps, zone builder are blank |
| **Provider variety** | 1 org — Providers list, assignment dashboards, zone providers panels empty |
| **Earnings depth** | No provider_earnings rows — Earnings, Payouts, Payout History screens blank |
| **Financial breadth** | No customer_payments, no billing_runs, no payout_runs — admin financial dashboards empty |
| **Quality signals** | No provider_rating_summary, quality_scores, job_issues — Performance/Quality screens empty |
| **Support** | No support_tickets — Support pages show empty state |
| **BYOC/Referrals** | No byoc_invite_links, byoc_activations, referral_codes — BYOC Center, Referrals empty |
| **Scheduling** | No scheduling_policy, assignment_config, window templates — Scheduling admin pages empty |
| **Audit/Control** | No admin_audit_log, admin_change_requests — Governance screens empty |
| **Capacity** | No zone_category_providers with multiple providers — capacity views trivial |
| **Trends** | All data is point-in-time — no 7/14/30-day trend data for dashboards |

---

## Phase 1: Rich Seed Data (Priority — do first)

### 1.1 Data Model Target

Create a "Day 90 Austin Metro" scenario:

| Entity | Current | Target | Notes |
|--------|---------|--------|-------|
| Zones | 1 | 5 | Austin Central, Austin South, Austin East, Round Rock, Cedar Park |
| Regions | 0 | 1 | "Austin Metro" region grouping |
| Customers | 1 | 25 | 5 per zone, varying plan tiers |
| Properties | 1 | 25 | Realistic Austin addresses per zone |
| Providers | 1 | 8 | Mix of single-operator and 2-3 person crews |
| Provider Members | 1 | 12 | OWNER + OPERATOR roles |
| Subscriptions | 1 | 25 | Mix: 20 active, 2 trialing, 2 past_due, 1 paused |
| Plans | 1 | 3 | Basic ($49), Standard ($85), Premium ($149) |
| Jobs | 6 | 120+ | 30 days × ~4/day, various statuses |
| Job Photos | 1 | 30+ | Before/after pairs on completed jobs |
| Invoices | 3 | 50+ | 2 months × 25 customers |
| Routines | 1 | 25 | Varying service mixes per customer |
| Provider Earnings | 0 | 100+ | Matching completed jobs, mix of ELIGIBLE/HELD/PAID |
| Provider Payouts | 0 | 16 | 2 months × 8 providers, weekly cadence |
| Support Tickets | 0 | 8 | Mix: 3 open, 5 resolved |
| BYOC Invite Links | 0 | 6 | From 3 providers |
| BYOC Activations | 0 | 4 | 4 of 6 invites activated |
| Referral Codes | 0 | 10 | Customer referral codes |
| Quality Scores | 0 | 8 | Per provider org |
| Job Issues | 0 | 5 | 2 open, 3 resolved |
| Notifications | 10 | 40+ | Spread across all roles |
| Ops Exceptions | 3 | 8 | Mix of types and severities |
| Applications | 2 | 6 | Various statuses (submitted, reviewing, approved, rejected) |
| Credits | 2 | 10 | Mix of referral, quality, promotional |
| Billing Runs | 0 | 2 | Monthly billing cycle records |
| Payout Runs | 0 | 8 | Weekly payout batches |
| Audit Log | 0 | 15 | Config changes, overrides, approvals |
| Change Requests | 0 | 4 | 1 pending, 2 approved, 1 rejected |
| Scheduling Policy | 0 | 1 | Active policy with weights |
| Assignment Config | 0 | 1 | Capacity and matching rules |
| Window Templates | 0 | 3 | Morning (8-11), Midday (11-2), Afternoon (2-5) |
| Zone Category State | 1 | 15 | 5 zones × 3 categories (mowing, windows, pest) |
| Cron Run Log | 0 | 10 | Recent cron executions |
| Notification Health | 0 | 5 | Delivery stats per channel |

### 1.2 File Structure

```
supabase/
├── seed-demo-data.sql          # Keep existing (backward compat)
├── seed-rich-metro.sql         # NEW — Phase 1 rich seed (main file)
├── seed-simulation.sql         # NEW — Phase 2 simulation data
└── migrations/
    └── 20260315080000_seed_rich_metro.sql  # Migration version
```

### 1.3 Implementation Approach

**Single SQL file** (`seed-rich-metro.sql`) structured in dependency order:

```sql
-- ============================================================
-- Rich Metro Seed — "Day 90 Austin Metro" scenario
-- Populates 5 zones, 25 customers, 8 providers, 120+ jobs
-- for realistic screenshots across all 110 app screens.
--
-- IDEMPOTENT: ON CONFLICT DO NOTHING on all inserts.
-- REQUIRES: bootstrap migration (SKUs, auth.users)
-- ============================================================

DO $$
DECLARE
  -- ... user ID resolution (same pattern as existing seed)
BEGIN
  -- ── PHASE A: Geography ──
  -- 1. Region: Austin Metro
  -- 2. Zones: 5 zones with realistic zip codes, capacity settings
  -- 3. Zone launch status: 3 live, 1 soft_launch, 1 recruiting
  -- 4. Zone category state: open/waitlist per zone+category
  -- 5. Window templates: 3 appointment windows

  -- ── PHASE B: Plans & Pricing ──
  -- 6. Plans: Basic ($49), Standard ($85), Premium ($149)
  -- 7. Plan entitlements: services per tier
  -- 8. Scheduling policy + assignment config

  -- ── PHASE C: Providers ──
  -- 9.  Provider orgs: 8 providers (mix of status: 6 ACTIVE, 1 PROBATION, 1 PENDING)
  -- 10. Provider members: 12 total (owners + operators)
  -- 11. Provider coverage: zone assignments (PRIMARY/SECONDARY)
  -- 12. Provider capabilities: SKUs each provider can do
  -- 13. Provider payout accounts: 7 ready, 1 pending
  -- 14. Zone category providers: assignment matrix
  -- 15. Quality scores: per provider (excellent, good, fair, probation)
  -- 16. Rating summaries: per provider

  -- ── PHASE D: Customers ──
  -- 17. Properties: 25 properties across 5 zones (real Austin addresses)
  -- 18. Subscriptions: 25 (mix of plans and statuses)
  -- 19. Routines + versions + items: 25 unique service mixes
  -- 20. Service day assignments: spread across weekdays
  -- 21. Property health scores: 25 scores (range 55-95)
  -- 22. Customer payment methods: 20 (some customers have 2)
  -- 23. Customer credits: 10 credits across 8 customers

  -- ── PHASE E: Jobs & Work History ──
  -- 24. Historical jobs (past 30 days): ~90 completed
  --     - Spread across providers, zones, customers
  --     - Realistic time windows (8am-5pm)
  --     - Provider summaries on completed jobs
  -- 25. Today's jobs: ~8 (3 completed, 3 in-progress, 2 confirmed)
  -- 26. Upcoming jobs: ~20 (next 7 days)
  -- 27. Job SKUs: 1-3 services per job
  -- 28. Job checklist items: on today's jobs
  -- 29. Job photos: 30+ on completed jobs (signed URL placeholders)
  -- 30. Job events: state transitions for audit trail
  -- 31. Job issues: 5 (2 OPEN, 3 RESOLVED)

  -- ── PHASE F: Financial ──
  -- 32. Provider earnings: 100+ rows matching completed jobs
  --     - Mix: 70 PAID, 20 ELIGIBLE, 5 HELD (various reasons), 5 HELD_UNTIL_READY
  -- 33. Provider payouts: 16 (8 providers × 2 months, weekly)
  -- 34. Customer invoices: 50+ (25 customers × 2 months)
  -- 35. Invoice line items: matching routine items
  -- 36. Billing runs: 2 monthly cycles
  -- 37. Payout runs: 8 weekly batches
  -- 38. Billing exceptions: 3 (past_due, failed_payment, credit_applied)

  -- ── PHASE G: Support & Operations ──
  -- 39. Support tickets: 8 (3 open, 5 resolved, mix of customer/provider)
  -- 40. Ops exceptions: 8 (expand existing 3, add 5 more)
  -- 41. Provider applications: 6 (submitted, reviewing, approved, rejected)

  -- ── PHASE H: Growth & Viral ──
  -- 42. BYOC invite links: 6 from 3 providers
  -- 43. BYOC activations: 4 activated
  -- 44. BYOC attributions: matching activations
  -- 45. Referral codes: 10 customer codes
  -- 46. Referral programs: 2 active programs
  -- 47. Growth surface config: per zone

  -- ── PHASE I: Admin & Governance ──
  -- 48. Admin audit log: 15 entries (config changes, overrides, etc.)
  -- 49. Admin change requests: 4 (1 pending, 2 approved, 1 rejected)
  -- 50. Admin system config: 10 key-value pairs
  -- 51. Cron run log: 10 recent runs (billing, assignment, notification)
  -- 52. Notification health: 5 channel summaries
  -- 53. Notification delivery: 30 delivery records

  -- ── PHASE J: Notifications ──
  -- 54. Expand to 40+ notifications across all roles
  --     - Customer: visit complete, upcoming, invoice, health, referral activated
  --     - Provider: job assigned, payout, BYOC, quality alert, earnings held
  --     - Admin: exception, application, KPI, billing alert, capacity warning
END $$;
```

### 1.4 UUID Convention

Extend existing deterministic prefix scheme:

| Prefix | Entity |
|--------|--------|
| `b1000000-*` | Zones (existing: 001, add 002-005) |
| `b2000000-*` | Regions |
| `c1000000-*` | SKUs (existing) |
| `d1000000-*` | Plans (existing: 001, add 002-003) |
| `d3000000-*` | Rich metro seed batch (all new entities) |
| `e1000000-*` | Entitlements (existing) |
| `f1000000-*` | Provider org 1 (existing) |
| `f2000000-*` | Provider orgs 2-8 |
| `f3000000-*` | Provider members (new) |

Jobs, invoices, earnings use sequential d3-prefix UUIDs grouped by section.

### 1.5 Realistic Address Data

Use real Austin-area addresses per zone:

```
Austin Central (78701-78703): 612 Congress Ave, 1401 Lavaca St, 900 W 5th St, ...
Austin South (78745-78748):   5001 W Slaughter Ln, 8800 S 1st St, ...
Austin East (78721-78723):    2100 E MLK Blvd, 5300 E Riverside Dr, ...
Round Rock (78664-78665):     1401 S AW Grimes Blvd, 2701 Parker Rd, ...
Cedar Park (78613):           1890 Ranch Shopping Ctr, 401 Cypress Creek Rd, ...
```

### 1.6 Screen Coverage Validation

After seeding, every screen group should show data:

| Screen Group | Key Data Needed | Tables |
|---|---|---|
| **Customer Dashboard** | Next visit, health score, routine summary | jobs, property_health_scores, routines |
| **Customer Billing** | Current invoice, payment methods, history, credits | customer_invoices, customer_payment_methods, customer_credits |
| **Customer History** | Completed jobs with photos | jobs, job_photos |
| **Customer Routine** | Active routine with 3+ items | routines, routine_versions, routine_items |
| **Provider Dashboard** | Today's queue, earnings preview, route progress | jobs (today), provider_earnings |
| **Provider Jobs** | Today (3+), upcoming (5+), history (20+) | jobs with various statuses |
| **Provider Earnings** | Period earnings, held amounts, projections | provider_earnings, provider_payouts |
| **Provider Performance** | Quality tier, rating, streaks | quality_scores, provider_rating_summary |
| **Provider BYOC** | Invite links, activation stats | byoc_invite_links, byoc_activations |
| **Admin Ops Cockpit** | All 16 drill tiles populated | jobs, ops_exceptions, invoices, referrals, applications |
| **Admin Dashboard** | KPIs, trends, alerts, growth snapshot | All aggregate queries |
| **Admin Providers** | Provider list with status badges | provider_orgs, quality_scores |
| **Admin Billing** | Ledger, billing runs, exceptions | customer_invoices, billing_runs, billing_exceptions |
| **Admin Scheduling** | Policy, windows, assignments | scheduling_policy, window_templates, assignment_config |
| **Admin Control** | Config, change requests, audit log | admin_system_config, admin_change_requests, admin_audit_log |
| **Admin Growth** | Referrals, applications, zone expansion | referral_programs, provider_applications, zone_launch_status |
| **Admin Zones** | 5 zones with varying health | zones, zone_category_providers, capacity metrics |
| **Admin Support** | Ticket list with status mix | support_tickets |
| **Admin Governance** | Playbooks, audit trail | admin_audit_log, admin_change_requests_log |
| **Admin Health** | Cron status, notification delivery | cron_run_log, notification_health_summary |

### 1.7 Temporal Data Distribution

All time-based data should follow this pattern to create realistic trends:

```
Day  1-10  (60-90 days ago): Ramp-up — 2-3 jobs/day, first invoices
Day 11-20  (30-60 days ago): Growth  — 4-5 jobs/day, more providers active
Day 21-30  (0-30 days ago):  Steady  — 6-8 jobs/day, full provider roster
Today:                        Peak    — 8 active jobs across 5 zones
Next 7 days:                  Booked  — 20 upcoming confirmed jobs
```

This creates meaningful 7-day and 30-day trend data for admin dashboards.

---

## Phase 2: Growth Simulation Engine

### 2.1 Purpose

Model what happens when Handled launches in a new metro: how customers and providers grow zone by zone, how BYOC drives viral spread, and how density affects unit economics.

### 2.2 Architecture

```
scripts/
├── simulation/
│   ├── run-simulation.ts        # Entry point — orchestrates simulation
│   ├── config.ts                # Simulation parameters (knobs)
│   ├── models/
│   │   ├── zone-model.ts        # Zone capacity, density, health scoring
│   │   ├── customer-model.ts    # Customer acquisition, churn, expansion
│   │   ├── provider-model.ts    # Provider onboarding, capacity, routing
│   │   ├── growth-model.ts      # BYOC, referrals, viral coefficient
│   │   ├── financial-model.ts   # Revenue, costs, margin by zone
│   │   └── scheduling-model.ts  # Job creation, assignment, density effects
│   ├── generators/
│   │   ├── seed-generator.ts    # Converts simulation state → SQL seed data
│   │   └── snapshot-generator.ts # Creates point-in-time DB snapshots
│   └── reporters/
│       ├── console-reporter.ts  # CLI summary output
│       └── json-reporter.ts     # Machine-readable results
└── package.json                 # Add tsx as dev dependency
```

### 2.3 Simulation Parameters (`config.ts`)

```typescript
export interface SimulationConfig {
  // Geography
  metro: string;                    // "Austin"
  initialZones: number;             // 1 (start with beachhead)
  maxZones: number;                 // 8
  zoneExpansionThreshold: number;   // 15 customers triggers adjacent zone opening

  // Time
  durationDays: number;             // 180 (6 months)
  snapshotDays: number[];           // [30, 60, 90, 120, 180] — generate seed data at these points

  // Customer Acquisition
  organicSignupsPerDay: number;     // 0.5 (slow organic in beachhead)
  byocConversionRate: number;       // 0.65 (65% of BYOC invites convert)
  referralRate: number;             // 0.08 (8% of customers refer per month)
  churnRateMonthly: number;         // 0.04 (4% monthly churn)

  // Provider Supply
  initialProviders: number;         // 2 (founding partners)
  providerApplicationRate: number;  // 1.5 per week once zone is live
  providerApprovalRate: number;     // 0.6 (60% approved)
  maxStopsPerProviderDay: number;   // 12
  avgJobDurationMinutes: number;    // 45

  // BYOC Mechanics (from founding partner program)
  byocBonusPerWeek: number;         // 1000 ($10.00 per completed service week)
  byocBonusDurationDays: number;    // 90
  byocInvitesPerProvider: number;   // 8 avg existing customers brought in

  // Pricing & Economics (from operating-model.md)
  avgSubscriptionCents: number;     // 8500 ($85/month)
  avgProviderPayoutCents: number;   // 5500 ($55/job base)
  densityMarginBoost: {             // Margin improvement from density
    phase1: number;                 // 0.0 (1-14 customers/zone)
    phase2: number;                 // 0.15 (15-24 customers/zone, 15% improvement)
    phase3: number;                 // 0.30 (25+ customers/zone, 30% improvement)
  };

  // Service Expansion
  avgServicesPerCustomer: number;   // 1.5 at signup
  serviceExpansionRate: number;     // 0.10 (10% add service per month)
  maxServicesPerCustomer: number;   // 5

  // Quality & Exceptions
  issueRatePerJob: number;          // 0.03 (3% of jobs have issues)
  exceptionRatePerDay: number;      // 0.15 (15% of days have an ops exception)
  weatherExceptionRate: number;     // 0.05 (5% of days)
}
```

### 2.4 Simulation Loop

```
For each day in simulation:
  1. Process organic signups (Poisson distribution)
  2. Process BYOC invites sent by active providers
  3. Process BYOC conversions (with lag)
  4. Process customer referrals
  5. Process churn (customers leaving)
  6. Process provider applications and approvals
  7. Generate daily jobs from active routines
  8. Assign jobs to providers (capacity-aware)
  9. Complete jobs (quality model determines issues)
  10. Generate earnings + invoices
  11. Check zone expansion triggers
  12. If snapshot day: emit SQL seed data
```

### 2.5 Key Models

#### Zone Model
- Tracks: customer count, provider count, density (customers/km²), capacity utilization
- Zone health scoring using existing `zoneScoringUtils.ts` logic (55% demand + 35% supply + 10% walkability)
- Expansion trigger: when a zone hits 15+ customers and adjacent zip codes show 3+ organic signups
- Launch lifecycle: planning → recruiting → soft_launch → live

#### Customer Model
- Acquisition sources: organic, BYOC, referral (tracked for attribution)
- Lifecycle: trialing → active → (past_due | paused | canceling) → churned
- Service expansion: starts with 1-2 services, probability of adding more each month
- Plan distribution: 40% Basic, 45% Standard, 15% Premium

#### Provider Model
- Onboarding: application → review (3-5 day lag) → approval/rejection
- Capacity: max stops/day × available days/week
- Multi-zone: 60% single zone, 30% two zones, 10% three zones
- Quality tiers: start at "good", earn "excellent" after 50+ jobs with <2% issue rate

#### Growth Model (Viral Mechanics)
- **BYOC loop**: Provider joins → imports 8 existing customers → each converts at 65% → 5.2 customers per provider
- **Referral loop**: Happy customer → 8% refer per month → referral converts at 30% → R₀ ≈ 0.024/month
- **Compound density**: More customers → shorter routes → better provider margin → more providers apply → more BYOC
- **Viral coefficient** = (BYOC customers/provider × provider join rate) + (referral rate × conversion rate)

#### Financial Model
- Revenue = Σ(customer subscriptions) — credits
- Provider cost = Σ(job payouts) + BYOC bonuses
- Gross margin = Revenue - Provider cost
- Density effect: as customers/zone increases, cost/job decreases (fewer drive minutes)
- Tracks: CAC, LTV, payback period, contribution margin by zone

### 2.6 Output: Seed SQL Generation

The simulation produces SQL at each snapshot day:

```typescript
// snapshot-generator.ts
export function generateSeedSQL(state: SimulationState, day: number): string {
  // Generates idempotent SQL following existing seed-demo-data.sql patterns
  // Uses d4000000-* prefix for simulation-generated data
  // Includes all entities: zones, customers, providers, jobs, earnings, etc.
  return sql;
}
```

Each snapshot creates a self-contained seed file:
- `seed-simulation-day030.sql` — Early stage (1-2 zones, 15 customers, 3 providers)
- `seed-simulation-day060.sql` — Growing (3 zones, 40 customers, 6 providers)
- `seed-simulation-day090.sql` — Established (4 zones, 70 customers, 8 providers)
- `seed-simulation-day120.sql` — Scaling (5 zones, 100 customers, 10 providers)
- `seed-simulation-day180.sql` — Mature (6+ zones, 150+ customers, 15 providers)

### 2.7 Playwright Integration

Add a `--seed-scenario` flag to the screenshot catalog:

```typescript
// e2e/screenshot-catalog.spec.ts addition
const SEED_SCENARIO = process.env.SEED_SCENARIO || 'rich-metro'; // rich-metro | sim-day030 | sim-day090 | sim-day180

test.beforeAll(async () => {
  // Optionally run seed SQL before capturing
  if (process.env.RUN_SEED === 'true') {
    await executeSeedSQL(`supabase/seed-${SEED_SCENARIO}.sql`);
  }
});
```

### 2.8 npm Scripts

```json
{
  "seed:demo": "supabase db execute --file supabase/seed-demo-data.sql",
  "seed:metro": "supabase db execute --file supabase/seed-rich-metro.sql",
  "seed:simulate": "tsx scripts/simulation/run-simulation.ts",
  "seed:simulate:day90": "tsx scripts/simulation/run-simulation.ts --snapshot 90",
  "test:catalog:metro": "SEED_SCENARIO=rich-metro npm run test:catalog",
  "test:catalog:sim90": "SEED_SCENARIO=sim-day090 npm run test:catalog"
}
```

---

## Phase 3: Workflow Update

### 3.1 GitHub Actions Update

Update `playwright.yml` to support seed scenario selection:

```yaml
run_catalog:
  description: "Run screenshot catalog"
  type: boolean
seed_scenario:
  description: "Seed scenario for screenshots"
  type: choice
  options: ["rich-metro", "sim-day030", "sim-day090", "sim-day180"]
  default: "rich-metro"
```

### 3.2 Screenshot Comparison

After capturing with rich data, compare against current empty-state screenshots:
1. Run catalog with current seed → save as `baseline/`
2. Run catalog with rich seed → save as `rich/`
3. Side-by-side diff to verify all screens are populated

---

## Implementation Order

### Batch 1: Rich Metro Seed (estimated: 1 session)
1. Create `supabase/seed-rich-metro.sql` with all Phase 1 data
2. Add migration version
3. Test: run seed, verify via Supabase dashboard
4. Run screenshot catalog, verify all 110 screens show data
5. Update `playwright.yml` with scenario support

### Batch 2: Simulation Framework (estimated: 1-2 sessions)
1. Create `scripts/simulation/` directory structure
2. Implement config.ts + core models (zone, customer, provider)
3. Implement growth model (BYOC + referral loops)
4. Implement financial model
5. Implement seed SQL generator
6. Test: run simulation, verify output SQL is valid

### Batch 3: Simulation Integration (estimated: 1 session)
1. Connect simulation output to Playwright catalog
2. Add npm scripts for various scenarios
3. Run screenshot catalog at day-30, day-90, day-180 snapshots
4. Generate comparison report
5. Update GitHub Actions workflow

### Batch 4: Analysis & Reporting (estimated: 1 session)
1. Build console reporter (CLI summary of simulation results)
2. Build JSON reporter (machine-readable for dashboards)
3. Add growth curve visualization (viral coefficient over time)
4. Add unit economics dashboard (margin by zone over time)
5. Document findings and calibrate parameters

---

## Key Files to Read Before Implementation

| File | Why |
|------|-----|
| `supabase/seed-demo-data.sql` | Current seed patterns, ID conventions, ON CONFLICT approach |
| `supabase/migrations/20260223032019_*.sql` | Bootstrap data (SKUs, provider org, zone) |
| `src/integrations/supabase/types.ts` | Full database schema (~10K lines) |
| `e2e/screenshot-catalog.spec.ts` | All 110 screen definitions |
| `docs/operating-model.md` | Unit economics, density thresholds, margin mechanics |
| `docs/masterplan.md` | Growth strategy, BYOC/BYOP model, viral loops |
| `docs/ai-growth-operating-plan.md` | Growth automation programs |
| `src/lib/zoneScoringUtils.ts` | Zone health scoring algorithm |
| `src/lib/h3Utils.ts` | H3 hexagonal geospatial logic |
| `docs/Archive/prds/2e-01-founding-partner-program-byoc.md` | BYOC economics ($10/week for 90 days) |
| `docs/Archive/modules/13.1-referral-attribution-core.md` | Referral mechanics |
| `docs/Archive/modules/13.2-founding-partner-provider-growth.md` | Founding partner program |

---

## Success Criteria

### Phase 1 (Rich Seed)
- [ ] All 110 screenshot catalog screens render with populated data (no empty states on list/dashboard screens)
- [ ] Data is temporally realistic (30-day history, 7-day forecast)
- [ ] Financial data is internally consistent (invoices match subscriptions, earnings match jobs)
- [ ] Seed is idempotent (can run multiple times safely)
- [ ] Existing test user (customer@test.com) still works correctly
- [ ] Build passes (`npx tsc --noEmit && npm run build`)

### Phase 2 (Simulation)
- [ ] Simulation runs for 180 days without errors
- [ ] Generates valid SQL at each snapshot point
- [ ] BYOC viral loop produces realistic customer growth curves
- [ ] Zone expansion triggers at correct density thresholds
- [ ] Unit economics match operating-model.md projections
- [ ] Multiple scenario runs produce different but statistically reasonable outcomes

### Phase 3 (Integration)
- [ ] Screenshot catalog can run with any seed scenario
- [ ] GitHub Actions workflow supports scenario selection
- [ ] Side-by-side comparison shows meaningful data density improvement
- [ ] UX report (AI review) identifies fewer "empty state" findings

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Foreign key violations | Build seed in strict dependency order; validate with `SET session_replication_role = 'replica'` if needed |
| Existing seed conflicts | Use new UUID prefixes (d3, f2, f3); ON CONFLICT DO NOTHING |
| Time-dependent data goes stale | Use `now() - interval 'X days'` patterns (same as existing seed) |
| Simulation too complex for 1 session | Phase 1 (rich seed) is standalone and delivers immediate value |
| Schema changes break seed | Pin seed to known table columns; add comments noting schema version |
| Auth user mismatch | Resolve IDs from auth.users by email (same pattern as existing seed) |

---

## Notes for the Implementation Session

1. **Start with Phase 1** — The rich metro seed delivers immediate value for screenshots
2. **Read `types.ts` carefully** — The schema has ~90 tables; only seed tables that hooks actually query
3. **Match existing patterns** — Use same SQL style, ID conventions, and temporal patterns as `seed-demo-data.sql`
4. **Test incrementally** — After each phase (A through J), verify the seed runs without errors
5. **Provider earnings are critical** — This is the biggest gap; the Earnings/Payouts/Performance screens are completely empty today
6. **Admin screens need aggregate data** — Ops Cockpit queries run counts across many tables; need breadth more than depth
7. **BYOC data enables the growth story** — BYOC Center, Referrals, and Growth screens tell the viral acquisition narrative
