# Handled Home — Launch Playbook

> **Created:** 2026-03-29
> **Purpose:** Strategic framework for pilot launch, provider acquisition, SKU calibration, zone sizing, and regional expansion
> **Companion tool:** `tools/market-simulation/` (to be built in Option A follow-up)

---

## Phase 1: Provider Acquisition Strategy

### Who to Target First

**Primary target: Mid-career providers who are good but underbooked (Archetype A)**

| Attribute | Why it matters |
|-----------|---------------|
| 15-25 existing customers | Enough skill to deliver quality, enough hunger to adopt new tools |
| 4+ star rating on Thumbtack/Angi | Proven quality, but not so established they don't need you |
| Spending 20-30% of week on sales/admin | The admin burden reduction value prop resonates |
| Solo operator or 2-3 person crew | Small enough to onboard quickly, large enough to serve a zone |
| 2-5 years in business | Past the survival phase, in the growth phase |

**Where to find them:**
- Thumbtack/Angi listings sorted by rating (4-4.5 stars, not 5 — the 5-star providers are full)
- Google Maps reviews in the target ZIP codes
- Nextdoor recommendations (providers who respond but aren't dominant)
- Local trade association directories
- Facebook groups for local service providers

**Secondary target: New providers just starting out (Archetype B)**
- 0-5 customers, high energy
- Value prop: "Get customers from day one"
- Use as backup providers, not primaries — quality is untested

**Do NOT target initially: Established providers with 40+ customers (Archetype C)**
- They have no pain you solve at launch
- Convert them later via BYOC after you've proven density works

### The Provider Value Proposition Script

> "We're building an app that fills your schedule with recurring customers — no more door-to-door selling, no more chasing payments, no more scheduling headaches. You keep your existing customers (bring them with you through our BYOC program and earn $10/week per active customer for 90 days). We handle the billing, scheduling, and customer communication. You show up, do great work, and get paid weekly."

**Key objection handlers:**

| Objection | Response |
|-----------|----------|
| "Why would I give you a cut?" | "You're not giving us a cut — you're trading admin time for paid work time. How many hours a week do you spend on invoicing, scheduling, and selling? We eliminate all of that." |
| "What if you steal my customers?" | "BYOC customers are yours. They came through your invite link. If you leave, they can follow you. We're not a marketplace — we're your operating system." |
| "I already have enough customers" | "Great — then BYOC costs you nothing to try. Bring your customers onto the app so they get proof photos and easy scheduling. If you want new customers too, we'll fill your open capacity." |
| "How much do I get paid?" | "We'll work with you to set fair rates based on your actual costs. You'll see your exact payout per job before you accept any work." |

### Provider Interview Guide

Interview 5-10 providers across these categories:

**Target categories for Austin pilot:**
1. Lawn Care (highest density, most recurring)
2. Pest Control (recurring, low variability)
3. Window Cleaning (recurring, easy to standardize)
4. Gutter Cleaning (seasonal, pairs with lawn)
5. Pool Care (if market supports it)

**Interview questions (60 minutes each):**

#### Work Procedures
- Walk me through a typical day from first stop to last
- How do you decide what order to visit customers?
- What does "done" look like for each service type?
- What's different between a basic visit and a deep/thorough visit?
- How do you handle rain days or extreme heat?

#### Service Levels & Duration
- For a typical 2000sqft home with a standard yard:
  - How long does a basic mow take? Edge and trim? Full service?
  - What equipment do you bring?
  - What does the homeowner need to do before you arrive?
- For a 4000sqft home? For a small townhome?
- What makes a job take longer than expected?

#### Economics
- What do you currently charge per visit for [service]?
- What's your minimum to make a trip worthwhile?
- How many stops per day is ideal? Maximum?
- What's your drive time between stops on a good day? Bad day?
- What would you need to earn per job on our platform to say yes?
- What's your monthly overhead (truck, equipment, insurance, gas)?

#### Pain Points
- What's the worst part of running your business?
- How do you currently get new customers?
- How much time per week do you spend on non-service work?
- What's your biggest cost that isn't labor or materials?
- If you could change one thing about how you operate, what would it be?

#### Growth
- How many customers can you handle solo? With one helper?
- What stops you from growing right now?
- Would you take a slightly lower per-job rate for a guaranteed full schedule?
- What would make you recommend this app to another provider in your trade?

### Interview Data → SKU Calibration

Map each interview response to system parameters:

| Interview Data Point | System Parameter | Where It Goes |
|---------------------|-----------------|--------------|
| Basic service duration | `sku_levels.planned_minutes` | SKU Levels table |
| Equipment needed | `provider_capabilities.equipment_kits` | Provider work profile |
| Per-visit price expectation | `provider_payout_rates.base_cents` | Payout engine |
| Min stops to justify trip | `zones.min_jobs_per_day` | Zone capacity settings |
| Max stops per day | `zones.max_homes_per_day` | Zone capacity settings |
| Drive time between stops | `zones` boundary sizing input | Zone builder |
| Weather sensitivity | `service_skus.weather_sensitive` | SKU flags |
| Property size impact | `sku_levels` by tier | Level auto-selection |
| Seasonal patterns | `seasonal_service_templates` | Seasonal calendar |

---

## Phase 2: SKU & Level Calibration Process

### Current State

SKU data is seed data — educated guesses. The system has:
- 20+ active SKUs across multiple categories
- Multi-level variants per SKU (Maintenance/Standard/Deep)
- Duration, handle cost, proof requirements, checklists per level
- Weather sensitivity flags

### What Needs Calibrating

For each SKU, validate with real providers:

```
SKU: Standard Mow
├── Maintenance Level
│   ├── Duration: seed says 30 min → provider says ___?
│   ├── Inclusions: mow + blow → correct? missing anything?
│   ├── Handle cost: 3 handles → fair for customer? fair for provider payout?
│   └── Proof: 1 after photo → sufficient?
├── Standard Level
│   ├── Duration: seed says 45 min → provider says ___?
│   ├── Inclusions: mow + edge + blow → correct?
│   └── ...
└── Deep Level
    ├── Duration: seed says 60 min → provider says ___?
    └── ...
```

### Admin Feature Needed: SKU Calibration Tool

The admin SKU editor already exists. What's needed is a **calibration workflow**:

1. Admin selects a SKU + Level
2. System shows current values (duration, cost, inclusions)
3. Admin enters provider-reported values from interviews
4. System highlights deltas > 20% as "needs review"
5. Admin approves calibrated values
6. Changes take effect next billing cycle

This is an admin UX enhancement, not a new system — the data layer already supports it.

---

## Phase 3: Zone Sizing Methodology

### Core Principle: Drive-Time-Based, Not Geographic

A zone is defined by: **a provider should complete 6-8 stops per day with no more than 15 minutes drive time between any two stops.**

### Zone Sizing Inputs

| Input | Source | Impact |
|-------|--------|--------|
| **Drive time between stops** | Provider interviews + Google Maps API | Primary zone boundary determinant |
| **Population density** | Census data / ACS | Demand potential per sq mile |
| **Home ownership rate** | Census data | % of population that can be customers |
| **Median household income** | Census data / ACS | Willingness to pay for subscription |
| **Lot sizes** | Zillow / county records | Service duration variation |
| **HOA density** | Local knowledge | Uniform service requirements = efficiency |
| **Competitor density** | Thumbtack/Angi listings | Existing provider supply |
| **Climate zone** | USDA / weather data | Seasonal cadence patterns |

### Zone Size Heuristics

| Environment | Approximate Zone Radius | Stops/Day | Drive Time Budget |
|-------------|------------------------|-----------|-------------------|
| Dense suburban (houses < 0.25 acre) | 3-5 miles | 8-10 | 60-90 min total |
| Standard suburban (0.25-0.5 acre) | 5-8 miles | 6-8 | 90-120 min total |
| Exurban (0.5-2 acres) | 8-12 miles | 4-6 | 120-150 min total |
| Rural (2+ acres) | Not viable at launch | — | — |

### Zone Viability Threshold

A zone is viable for launch when:

```
homes_in_zone × home_ownership_rate × income_qualifying_rate × conversion_rate ≥ min_customers

Where:
- homes_in_zone: from Census block data
- home_ownership_rate: from ACS data (target > 60%)
- income_qualifying_rate: % with HHI > $75K (target > 40%)
- conversion_rate: conservative 1-2% at launch
- min_customers: 15 per zone for provider economics to work
```

### The H3 Hex Grid Advantage

The app already uses H3 hex-grid geo cells (feature 267). This means zone boundaries can be computationally optimized:

1. Start with provider home base as seed
2. Grow zone by adding adjacent H3 cells
3. Score each candidate cell: `demand_density × accessibility - drive_time_cost`
4. Stop when zone reaches capacity target or drive-time limit
5. The zone builder wizard already supports this (features 268-273)

---

## Phase 4: Pilot Launch Plan (Austin, TX)

### Why Austin

- Large, growing metro with high home ownership in suburbs
- Strong service provider ecosystem (year-round lawn care, pest control)
- Tech-savvy population willing to try app-based services
- Multiple distinct suburban zones (Round Rock, Cedar Park, Pflugerville, Bee Cave)
- Enough density for meaningful test without needing hundreds of providers

### Pilot Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Zones | 3-4 | Enough for density testing, small enough to manage |
| Categories | 3 (Lawn, Pest, Windows) | High-recurring, easy to standardize |
| Providers per zone | 2-3 (1 primary + 1-2 backup) | Tests primary/backup model |
| Target customers per zone | 15-25 | Minimum for provider economics |
| Pilot duration | 12 weeks (3 billing cycles) | Enough for retention signal |
| Success metric | 60-day retention > 70% | Proves subscription value |

### Pilot Timeline

```
Week 1-2:  Provider interviews (5-10 across 3 categories)
Week 3:    SKU calibration from interview data
Week 4:    Zone definition using H3 builder + drive-time data
Week 5:    Provider onboarding (BYOC training, app walkthrough)
Week 6:    Soft launch — providers bring 5-10 BYOC customers each
Week 7-8:  Monitor: first service completions, proof photos, receipts
Week 9-10: Measure: retention, add-on attach rate, provider satisfaction
Week 11-12: Decide: expand zones or recalibrate
```

### What Success Looks Like

After 12 weeks, you need these 5 data points:

1. **BYOC activation rate:** Of providers who joined, what % actually sent invites? Of invites sent, what % activated? (Target: 60% send, 30% activate)
2. **60-day customer retention:** Of customers who subscribed, what % are still active at day 60? (Target: > 70%)
3. **Provider utilization:** What % of provider capacity is filled? (Target: > 50% by week 8)
4. **Service quality:** Issues per 100 jobs. (Target: < 10%)
5. **Unit economics:** Is the subscription spread positive per zone? (Target: > 15% gross margin by week 12)

---

## Phase 5: Regional Expansion Framework

### Expansion Decision Criteria

A region is ready to expand when the pilot zone demonstrates:

| Metric | Threshold | Why |
|--------|-----------|-----|
| 60-day retention | > 70% | Subscription value proven |
| Provider NPS | > 40 | Providers will refer other providers |
| Attach rate (2nd service) | > 25% within 60 days | Bundle expansion working |
| Gross margin per zone | > 15% | Unit economics viable |
| Support minutes per job | < 5 min | Ops scalable |

### Auto-Expansion Model

The goal: **turn on a new region and have it start growing with minimal human intervention.**

Inputs the system needs per new region:

| Input | Source | Automation Level |
|-------|--------|-----------------|
| ZIP code boundaries | Census TIGER files | Fully automated |
| Population / income / ownership | ACS 5-year estimates | Fully automated |
| Climate zone + seasonal patterns | NOAA / USDA | Template-based |
| Provider supply | Thumbtack/Angi scrape or manual | Semi-automated |
| Zone boundaries | H3 builder with drive-time API | Semi-automated |
| SKU calibration | Regional provider interviews | Manual first, then templated |
| Pricing | Zone multiplier from income data | Algorithmic with admin approval |

### Regional Variation Matrix

| Factor | How It Varies | System Impact |
|--------|--------------|---------------|
| Climate | Snow states need different seasonal calendar | Seasonal templates per climate zone |
| Lot size | Northeast yards are smaller than Texas | Duration and handle cost per level |
| Income | Higher income = higher willingness to pay | Zone pricing multiplier |
| Density | Urban vs suburban vs exurban | Zone radius and stops/day target |
| Competition | Saturated vs underserved markets | Provider acquisition difficulty |
| Regulation | Some states require licensing for pest/tree | Compliance requirements per category |

---

## Phase 6: Market Simulation (Option A — Next Session)

### Autoresearch-Inspired Optimization Loop

Build a simulation tool in `tools/market-simulation/` that follows the Karpathy autoresearch pattern:

**The loop:**
1. Define a `model.ts` with all assumptions (zone size, pricing, provider economics, growth rates)
2. Run a simulation that projects 12 months of operations
3. Score the output: composite of gross margin, retention, provider utilization, time-to-density
4. The AI agent modifies one assumption in `model.ts`
5. Re-run simulation
6. If score improved: keep the change, log to `results.tsv`
7. If score worsened: revert
8. Repeat ~12 experiments per hour

**What the simulation models:**
- Customer acquisition via BYOC (provider invite → activation → subscription)
- Service delivery (jobs per day per provider, drive time, completion rate)
- Financial flows (subscription revenue → handle allocation → provider payout → margin)
- Growth dynamics (referral loops, density improvements, attach rate progression)
- Failure modes (provider churn, customer churn, zone underutilization)

**What it optimizes:**
- Zone radius for maximum provider utilization
- Pricing tiers for maximum retention × margin
- BYOC bonus structure for maximum provider participation
- Handle allocation per plan for maximum perceived value
- Cadence defaults for maximum route efficiency

**Scoring function:**
```
score = (
  gross_margin_pct × 30 +           // Must be profitable
  retention_60d_pct × 25 +           // Must retain customers
  provider_utilization_pct × 20 +    // Must fill provider schedules
  attach_rate_pct × 15 +             // Must expand bundles
  time_to_15_customers_weeks × -10   // Must reach density fast
)
```

**Output:** `results.tsv` with columns:
```
experiment_id | assumption_changed | old_value | new_value | score | delta | kept
```

After 100+ experiments overnight, review `results.tsv` to see which assumptions matter most and what optimal values look like.

---

## Appendix: The Uncomfortable Question — Answered

> "Who is the first provider who will migrate their best customers into your platform, and why would they?"

**Answer:** The first provider is a mid-career landscaper in Round Rock, TX with 20 customers, a 4.3-star rating on Thumbtack, who spends every Monday morning doing invoicing and every Tuesday driving to neighborhoods to hand out flyers. They're good at their job but frustrated that growing means more selling, not more mowing.

They join because:
1. **Immediate income:** $10/week per active BYOC customer for 90 days = $200/week if they bring 20 customers
2. **Schedule density:** We fill their open Tuesday/Thursday gaps with platform customers in their zone
3. **Admin elimination:** No more invoicing, no more chasing payments, no more scheduling texts
4. **Growth without selling:** New customers show up on their route without a single flyer

They stay because after 6 months:
- Their income is 30% higher (fuller schedule + add-on services)
- They haven't knocked on a single door
- Their customers are happier (proof photos, easy scheduling, one app)
- Leaving means rebuilding the invoicing/scheduling infrastructure they no longer have

**The test:** Can you find this specific person in Austin and get them to say yes in a 30-minute conversation? If yes, the business works. If no, iterate the value prop until it does.
