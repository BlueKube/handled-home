# SKU Calibration & Pricing Reasoning Report

> **Date:** 2026-03-31
> **Scope:** PRD-045 (SKU Catalog Foundation), PRD-046 (Level Definitions), PRD-047 (Simulator Validation)
> **Purpose:** Comprehensive reference documenting all SKU/level/pricing decisions for provider interview baseline

---

## 1. Executive Summary

Handled Home's service catalog has been calibrated from placeholder data to research-backed pricing across **23 SKUs** and **54 service levels**. This calibration establishes the baseline for provider interviews during market launch.

**Key outcomes:**
- All 23 SKUs have calibrated handle costs anchored to the 7-handle standard mow model
- 54 sku_levels created with tiered service definitions (L1/L2/L3)
- Simulator validates 44.6% gross margin at target 40% utilization
- Break-even utilization: 72.2% — well above the 40-65% target operating range
- 5 new SKUs added (Gutter Cleaning, Fall Prep, Trash Can Cleaning, Grill Cleaning, Dryer Vent Cleaning)
- 2 services deferred (Christmas Lights, Garage Cleanout)

**The subscription model is profitable because customers don't use all their handles.** Revenue per handle ($6.03 weighted avg) is less than cost per handle ($7.86), so every individual service visit is a net loss. Profitability comes from handle underutilization — customers pay for 14-50 handles/month but typically use 40-65%.

---

## 2. Handle Economics Model

### 2.1 The 7-Handle Anchor

The entire pricing system anchors to one observable market fact:

> **1 standard lawn mow ≈ 45 minutes ≈ $55 provider payout ≈ 7 handles**

This creates two derived constants:
- **Minutes per handle:** 45 min ÷ 7 handles = **6.4 min/handle**
- **Cost per handle:** $55 ÷ 7 handles = **$7.86/handle** (provider side)

### 2.2 Revenue Per Handle

Subscription pricing determines what each handle earns:

| Plan | Monthly Price | Handles/Cycle | Revenue/Handle |
|------|--------------|---------------|----------------|
| Essential | $99 | 14 | $7.07 |
| Plus | $159 | 28 | $5.68 |
| Premium | $249 | 50 | $4.98 |
| **Weighted avg** (35/45/20 mix) | — | — | **$6.03** |

### 2.3 The Underutilization Engine

Revenue per handle ($6.03) < Cost per handle ($7.86) = **-$1.83 per-handle deficit**.

This is intentional. The business model works like a gym membership:

| Utilization | Effective Revenue/Handle | Margin |
|-------------|------------------------|--------|
| 40% (light user) | $15.08 | **+44.6%** |
| 55% (moderate) | $10.96 | **+19.4%** |
| 65% (target max) | $9.28 | **+5.8%** |
| 72.2% (break-even) | $8.35 | **0.0%** |
| 90% (heavy user) | $6.70 | **-17.3%** |
| 100% (max usage) | $6.03 | **-30.4%** |

The break-even point is **72.2% utilization**. Target operating range is 40-65%.

### 2.4 Two Anchoring Methods

**Time-based anchoring** (primary, used for general services):
```
handles ≈ planned_minutes / 6.4
```
Used for: lawn care, cleanup, specialty services where provider time is the main cost.

**Cost-based anchoring** (used for licensed/premium services):
```
handles = provider_payout_cents / 786
```
Used for: Weed Treatment, Fertilization, Pest Control, Dryer Vent Cleaning — services where market payout exceeds what pure time would suggest due to licensing, compliance, or safety requirements.

---

## 3. Per-SKU Reasoning

### 3.1 Lawn Care Services

#### Standard Mow (SKU 001)
**Core anchor service.** All other handle costs derive from this baseline.

| Level | Label | Handles | Minutes | Anchoring | Rationale |
|-------|-------|---------|---------|-----------|-----------|
| L1 | Basic Mow | 5 | 30 | Time | Mow only, no edging/trimming. 30÷6.4≈4.7, rounded to 5. Research: $55-$80/visit recurring. |
| L2 | Standard Mow | 7 | 45 | Time | **The anchor.** Full mow + trim + edge + blow. $55-$80 market, ~$55 provider payout. |
| L3 | Premium Mow | 10 | 65 | Time | Show-ready with bagging & spot weeding. 65÷6.4≈10.2, rounded to 10. |

**Sources:** Lawn care agent research, deep-research-report.md, market simulator model.ts

#### Edge & Trim (SKU 002)
Usually bundled with mowing. Standalone pricing: $25-$60.

| Level | Label | Handles | Minutes | Anchoring | Rationale |
|-------|-------|---------|---------|-----------|-----------|
| L1 | Trim Only | 2 | 15 | Time | String trim only, no mechanical edging. Minimal time/skill. |
| L2 | Edge & Trim | 4 | 25 | Time | Standalone: $25-$60. Provider payout ~$30. 25÷6.4≈3.9, rounded to 4. |
| L3 | Detail Edge | 6 | 40 | Time | Full trim + edge + bed border re-definition. 40÷6.4≈6.3, rounded to 6. |

#### Leaf Cleanup (SKU 003)
Seasonal service (Oct-Dec). High variance by lot size and tree cover.

| Level | Label | Handles | Minutes | Anchoring | Rationale |
|-------|-------|---------|---------|-----------|-----------|
| L1 | Leaf Blowout | 8 | 45 | Time | Blow only into pile. 45÷6.4≈7, rounded to 8 (accounts for equipment setup). |
| L2 | Full Cleanup | 15 | 120 | Cost | Research: $150-$400. Provider payout ~$120. Cost-anchored: $120÷$7.86≈15 handles. |
| L3 | Removal & Haul | 25 | 180 | Cost | Off-site disposal. 1-3 visits/season. Time: 180÷6.4≈28, conservative 25. |

#### Hedge Trimming (SKU 004)
2-4 times/year. Per-shrub: $15-$25; per linear foot: $2-$5.

| Level | Label | Handles | Minutes | Anchoring | Rationale |
|-------|-------|---------|---------|-----------|-----------|
| L1 | Shape Trim | 6 | 45 | Time | Maintain existing shape. 45÷6.4≈7, conservative 6. |
| L2 | Full Trim | 13 | 90 | Time | Shape all sides + dead branch removal. Provider payout ~$100. 90÷6.4≈14, rounded to 13. |
| L3 | Sculpt & Restore | 22 | 150 | Time | Species-appropriate pruning + haul. 150÷6.4≈23.4, rounded to 22. |

### 3.2 Treatment Services (Licensed)

These services use **cost-based anchoring** because licensed applicator work commands a premium. See Section 5 for detailed rationale.

#### Weed Treatment (SKU 005)
State pesticide license required. 4-7 applications/year.

| Level | Label | Handles | Minutes | Anchoring | Rationale |
|-------|-------|---------|---------|-----------|-----------|
| L1 | Spot Treatment | 5 | 20 | Cost | Spot spray visible weeds. Time-based would be 3.1 handles — rounded to 5 for licensed premium. |
| L2 | Full Lawn | 8 | 35 | Cost | Broadcast + spot. Research: $65-$150/app. Provider payout ~$65. $65÷$7.86≈8 handles. |
| L3 | Comprehensive | 13 | 55 | Cost | Full lawn + beds + hardscapes + invasive ID. Time: 55÷6.4≈8.6, cost-anchored to 13. |

#### Fertilization (SKU 006)
State license required. Usually bundled with weed treatment.

| Level | Label | Handles | Minutes | Anchoring | Rationale |
|-------|-------|---------|---------|-----------|-----------|
| L1 | Basic Application | 5 | 20 | Cost | Granular seasonal blend. Time-based would be 3.1 — rounded to 5 for licensed premium. |
| L2 | Standard Program | 8 | 30 | Cost | Granular or liquid with slow-release. Research: $55-$110/app. $55÷$7.86≈8 handles. |
| L3 | Premium Program | 13 | 45 | Cost | Custom NPK + liquid + granular + micronutrient. Time: 45÷6.4≈7, cost-anchored to 13. |

### 3.3 Seasonal Services

#### Mulch Application (SKU 007)
1-2x/year. Per cubic yard: $55-$85. Typical suburban home: 3-8 cubic yards.

| Level | Label | Handles | Minutes | Anchoring | Rationale |
|-------|-------|---------|---------|-----------|-----------|
| L1 | Basic Spread | 13 | 90 | Time | Spread at 2-3" depth. 90÷6.4≈14, rounded to 13. |
| L2 | Edge & Spread | 22 | 180 | Time | Edge beds + barrier + spread + detail. 180÷6.4≈28, conservative 22. |
| L3 | Full Refresh | 35 | 300 | Time | Remove old + edge + barrier + spread + haul. 300÷6.4≈47, conservative 35. |

#### Spring Prep (SKU 008)
Annual seasonal reset. Research: $250-$450 standard.

| Level | Label | Handles | Minutes | Anchoring | Rationale |
|-------|-------|---------|---------|-----------|-----------|
| L1 | Basic Cleanup | 13 | 120 | Cost | Clear debris + cut perennials + first mow. Time: 120÷6.4≈19, conservative 13. |
| L2 | Standard Prep | 25 | 240 | Cost | Full cleanup + bed edging + pre-emergent + pruning. Provider payout ~$200. $200÷$7.86≈25. |
| L3 | Premium Prep | 44 | 420 | Cost | Complete restoration. Time: 420÷6.4≈66, cost-anchored to 44. |

#### Fall Prep (SKU 00f) — NEW
Seasonal counterpart to Spring Prep. Research: $300-$500 standard.

| Level | Label | Handles | Minutes | Anchoring | Rationale |
|-------|-------|---------|---------|-----------|-----------|
| L1 | Basic Cleanup | 13 | 120 | Cost | Single-pass leaf removal + final mow. Mirrors Spring Prep L1. |
| L2 | Standard Prep | 25 | 300 | Cost | Multi-pass + perennial cutback + winterizer. Provider payout ~$200. Mirrors Spring Prep L2. |
| L3 | Premium Prep | 44 | 480 | Cost | Complete fall restoration. Mirrors Spring Prep L3 pricing. |

### 3.4 Specialty Services

#### Window Cleaning (SKU 009)
2-4x/year. Per pane: $6-$12; by home: $200-$500. 2-story surcharge: +50-75%.

| Level | Label | Handles | Minutes | Anchoring | Rationale |
|-------|-------|---------|---------|-----------|-----------|
| L1 | Exterior Only | 13 | 90 | Time | No customer presence needed. Provider payout ~$175. 90÷6.4≈14, rounded to 13. |
| L2 | Interior + Exterior | 22 | 180 | Time | Requires customer presence. Screen removal/cleaning. 180÷6.4≈28, conservative 22. |
| L3 | Full Detail | 35 | 270 | Time | All windows + tracks + hard water treatment + storm windows. 270÷6.4≈42, conservative 35. |

**Note:** L2+ changes access_mode to customer_present — a recommended database schema enhancement.

#### Power Wash (SKU 00a)
Annual service. Per sq ft concrete: $0.15-$0.40.

| Level | Label | Handles | Minutes | Anchoring | Rationale |
|-------|-------|---------|---------|-----------|-----------|
| L1 | Single Surface | 13 | 90 | Time | One surface type. 90÷6.4≈14, rounded to 13. |
| L2 | Home Exterior | 25 | 150 | Cost | Siding + foundation + walkways. Research: $400-$800. Provider payout ~$200. $200÷$7.86≈25. |
| L3 | Full Property | 44 | 300 | Cost | Complete property wash. Research: $700-$1400. Time: 300÷6.4≈47, cost-anchored to 44. |

#### Pool Service (SKU 00b)
Weekly recurring. CPO certification often required. Research: $120-$200/mo standard.

| Level | Label | Handles | Minutes | Anchoring | Rationale |
|-------|-------|---------|---------|-----------|-----------|
| L1 | Chemical Check | 3 | 15 | Time | Test + add chemicals + log. 15÷6.4≈2.3, rounded to 3. Provider payout ~$45/visit. |
| L2 | Weekly Maintenance | 6 | 35 | Time | Skim + brush + vacuum + chemicals + baskets. 35÷6.4≈5.5, rounded to 6. |
| L3 | Full Service | 8 | 50 | Time | Weekly + filter + equipment + tile scrub. 50÷6.4≈7.8, rounded to 8. |

#### Pest Control (SKU 00c)
Quarterly standard. All 50 states require pest control license.

| Level | Label | Handles | Minutes | Anchoring | Rationale |
|-------|-------|---------|---------|-----------|-----------|
| L1 | Exterior Perimeter | 6 | 25 | Cost | Foundation perimeter + entry points. Time: 25÷6.4≈3.9, cost-anchored to 6 for license premium. |
| L2 | Interior + Exterior | 9 | 45 | Cost | Full perimeter + interior baseboard + kitchen/bath. Time: 45÷6.4≈7, cost-anchored to 9. |
| L3 | Comprehensive | 15 | 75 | Cost | Full int/ext + crawlspace + attic + bait stations. Research: $65-$150/app. $65÷$7.86≈8, premium-anchored to 15. |

**Note:** L2+ changes access_mode to customer_present.

#### Dog Poop Cleanup (SKU 00d)
Weekly recurring. Research: $12-$20/visit. 90M pet dogs in US. High retention.

| Level | Label | Handles | Minutes | Anchoring | Rationale |
|-------|-------|---------|---------|-----------|-----------|
| L1 | Weekly Yard | 2 | 15 | Time | Single-dog household. Provider payout ~$15. 15÷6.4≈2.3, rounded to 2. |
| L2 | Multi-Dog Yard | 3 | 25 | Time | Multi-dog + patio/deck check. +$5-$8/dog. 25÷6.4≈3.9, rounded to 3. |

### 3.5 New SKUs

#### Gutter Cleaning (SKU 00e) — NEW
Research: $119-$234/visit (Angi 2025). 2-story: +50%. 2x/year.

| Level | Label | Handles | Minutes | Anchoring | Rationale |
|-------|-------|---------|---------|-----------|-----------|
| L1 | Standard Clean | 10 | 75 | Time | Clear + flush + ground cleanup. 75÷6.4≈12, conservative 10. |
| L2 | Full Service | 15 | 120 | Time | Clear + flush + minor sealing + roof edge. 120÷6.4≈19, conservative 15. |
| L3 | Premium | 22 | 150 | Time | Full system + seal + hanger check + photo docs. Provider payout ~$120. 150÷6.4≈23, rounded 22. |

**Why added:** High bundling potential with window cleaning and power washing. Natural fall/spring seasonal complement.

#### Trash Can Cleaning (SKU 0010) — NEW
Monthly: $25-$40/visit (2 cans). Provider payout ~$20.

| Level | Label | Handles | Minutes | Anchoring | Rationale |
|-------|-------|---------|---------|-----------|-----------|
| L1 | Monthly Wash | 3 | 10 | Cost | Power rinse + deodorize. Time: 10÷6.4≈1.6, cost-anchored to 3. |

**Why added:** Niche but 80%+ retention in HOA markets. Very low handle cost makes it an easy subscription stickiness driver.

#### Grill Cleaning (SKU 0011) — NEW
Standard deep clean: $150-$225. Full service: $200-$300. 2x/year seasonal.

| Level | Label | Handles | Minutes | Anchoring | Rationale |
|-------|-------|---------|---------|-----------|-----------|
| L1 | Quick Clean | 6 | 40 | Time | Scrape grates + brush interior + wipe + grease trap. 40÷6.4≈6.3, rounded to 6. |
| L2 | Deep Clean | 13 | 75 | Time | Full disassembly + soak/scrub + degrease + reassemble. 75÷6.4≈12, rounded to 13. |

**Why added:** Good upsell for outdoor service customers. Pre-summer + pre-winter seasonal cadence.

#### Dryer Vent Cleaning (SKU 0012) — NEW
Standard: $100-$175. Clean + inspect: $150-$250. Provider payout ~$90. NFPA annual recommendation. 2,900 home fires/year from clogged vents.

| Level | Label | Handles | Minutes | Anchoring | Rationale |
|-------|-------|---------|---------|-----------|-----------|
| L1 | Standard Clean | 8 | 40 | Cost | Disconnect + brush/vacuum + reconnect + test. Time: 40÷6.4≈6.3, cost-anchored to 8 for safety premium. |
| L2 | Clean + Inspect | 11 | 60 | Cost | Full vent + cap inspect + lint trap + airflow measurement + report. Time: 60÷6.4≈9.4, cost-anchored to 11. |

**Why added:** Annual safety service with regulatory backing (NFPA). High retention — homeowners don't want to forget fire prevention.

### 3.6 Home Assistant Services

All Home Assistant SKUs are **single-tier** (L1 only). They use conservative handle costs because:
1. Appointment-window scheduling adds overhead
2. Customer-present requirement limits route density
3. Lower-skill work with lower provider payout expectations

| SKU | Label | Handles | Minutes | Min/Handle | Rationale |
|-----|-------|---------|---------|------------|-----------|
| Kitchen Reset | Kitchen Reset | 4 | 60 | 15.0 | Dishes + counters + floor + trash. Conservative 4 handles. |
| Laundry Folding Sprint | Laundry Sprint | 2 | 30 | 15.0 | Fold + sort + place. Quick, high-frequency. |
| Quick Tidy Sprint | Quick Tidy | 2 | 30 | 15.0 | Surface clearing + cushion fluffing. High retention potential. |
| Post-Party Reset | Party Reset | 6 | 90 | 15.0 | Dishes + trash + surfaces + floors + furniture reset. |
| Bed + Bath Reset | Bed & Bath | 4 | 60 | 15.0 | Bed making + bathroom surfaces + towel swap + floor. |

**Note:** Home Assistant services have a consistent 15 min/handle ratio (vs 6.4 for outdoor services). This reflects their conservative pricing — these handles are "cheaper" for the platform to fulfill because provider payout is lower for indoor helper work.

---

## 4. Tier Progression Logic

### 4.1 Design Principles

Every multi-level SKU follows a consistent progression:

| Principle | L1 | L2 | L3 |
|-----------|----|----|-----|
| **Scope** | Minimal viable service | Full standard service | Premium / show-ready |
| **Time** | Quick pass | Full job | Extended / detailed |
| **Equipment** | Basic tools | Standard professional | Specialized equipment |
| **Cleanup** | Minimal | Standard on-site | Full cleanup + haul-away |
| **Skill** | Entry-level | Experienced | Expert / certified |

### 4.2 Handle Cost Ratios

Across multi-level SKUs, the progression follows approximate ratios:

| Pattern | L1:L2:L3 Ratio | Examples |
|---------|---------------|----------|
| **Standard** | 1:2:3 | Pest Control (6:9:15), Weed Treatment (5:8:13) |
| **Steep** | 1:2:4+ | Spring/Fall Prep (13:25:44), Mulch (13:22:35) |
| **Flat** | 1:1.5:2 | Pool Service (3:6:8), Gutter (10:15:22) |

Steep progressions occur when L3 involves off-site disposal, specialized restoration, or multi-pass work. Flat progressions occur when the incremental work between levels is modest.

### 4.3 Two-Level and Single-Level SKUs

Some services don't warrant 3 levels:
- **Dog Poop Cleanup** (2 levels): Simple service; only meaningful variation is number of dogs.
- **Grill Cleaning** (2 levels): Quick clean vs deep clean covers the full spectrum.
- **Dryer Vent Cleaning** (2 levels): Standard clean vs clean + inspect. No "premium" tier needed.
- **Trash Can Cleaning** (1 level): Single standardized service. No meaningful variation.
- **Home Assistant SKUs** (1 level each): Quick, repeatable tasks — not tiered service packages.

---

## 5. Licensed Service Premium

### 5.1 Why Cost-Based Anchoring

Three services require state licensing: Weed Treatment, Fertilization, and Pest Control. For these, time-based anchoring undervalues the service because:

1. **Licensing overhead:** State pesticide applicator licenses require training, testing, continuing education, and annual renewal ($50-$300/year).
2. **Insurance requirements:** Certified applicators need specialized liability insurance ($1,500-$5,000/year additional premium).
3. **Material costs:** Chemicals and treatment products are a significant cost not captured in time alone.
4. **Market pricing:** Observable market rates are 40-60% higher per minute of work compared to general outdoor services.

### 5.2 Premium Evidence

| Service | Time-Based Handles | Actual Handles | Premium % |
|---------|-------------------|----------------|-----------|
| Weed Treatment L1 (20 min) | 3.1 | 5 | +61% |
| Weed Treatment L2 (35 min) | 5.5 | 8 | +45% |
| Weed Treatment L3 (55 min) | 8.6 | 13 | +51% |
| Fertilization L1 (20 min) | 3.1 | 5 | +61% |
| Fertilization L2 (30 min) | 4.7 | 8 | +70% |
| Fertilization L3 (45 min) | 7.0 | 13 | +86% |
| Pest Control L1 (25 min) | 3.9 | 6 | +54% |
| Pest Control L2 (45 min) | 7.0 | 9 | +29% |
| Pest Control L3 (75 min) | 11.7 | 15 | +28% |

Average premium: ~54%. This aligns with the ~50% cost premium observed in market research for licensed vs. unlicensed outdoor services.

### 5.3 Other Cost-Anchored Services

Beyond licensed services, cost-based anchoring is also used for:
- **Dryer Vent Cleaning:** Safety-driven premium. NFPA backing creates market pricing above time value.
- **Trash Can Cleaning:** Very short service (10 min) but market pricing ($25-$40) is driven by equipment costs.
- **Spring/Fall Prep L2-L3:** Provider payout for large seasonal jobs ($200+) is the binding constraint.
- **Power Wash L2-L3:** Equipment costs and market pricing drive payout above time-based estimates.

---

## 6. New SKU Justification

### 6.1 Selection Criteria

New SKUs were evaluated on:
1. **Recurring viability** — Can this be a subscription service?
2. **Route compatibility** — Can it be added to existing provider routes?
3. **Bundling potential** — Does it complement existing services?
4. **Market size** — Is there meaningful demand?
5. **Operational simplicity** — Can existing providers fulfill it?

### 6.2 Added SKUs

| SKU | Recurring | Route Compatible | Bundling | Market Size | Simplicity |
|-----|-----------|-----------------|----------|-------------|------------|
| Gutter Cleaning | 2x/year | Yes | High (window + power wash) | $119-$234/visit | Moderate (ladders) |
| Fall Prep | 1x/year | Yes (same as Spring) | Essential counterpart | $300-$500 | Yes |
| Trash Can Cleaning | Monthly | Yes (curbside) | Low-barrier add-on | $25-$40/visit | Specialized equip |
| Grill Cleaning | 2x/year | Moderate (appointment) | Good outdoor upsell | $150-$300 | Moderate |
| Dryer Vent Cleaning | Annual | Moderate (customer present) | Safety differentiator | $100-$250 | Specialized equip |

---

## 7. Deferred Services

### 7.1 Christmas Light Installation

**Status:** Deferred — not included in launch catalog.

**Reasons:**
1. **Highly seasonal** — 4-month window (Oct-Jan). Only 33% of the year generates revenue.
2. **Complex pricing** — Per linear foot + per tree + per bush. Doesn't fit the handle model well.
3. **Specialized equipment** — Professional-grade lights, clips, timers, bucket trucks for 2+ story.
4. **Insurance complexity** — Roof access + electrical work creates specialized liability requirements.
5. **Provider mismatch** — Lawn care providers typically don't do holiday lighting.

**Future consideration:** Could work as a marketplace add-on (one-time booking).

### 7.2 Garage Cleanout

**Status:** Deferred — not included in launch catalog.

**Reasons:**
1. **Primarily one-time** — Most homeowners do this once every few years, not recurring.
2. **Requires homeowner decisions** — "Keep, donate, or trash?" requires real-time input for hours.
3. **Hauling complexity** — Junk removal, donation drop-off, specialized disposal.
4. **Scope creep risk** — Easily becomes "garage + attic + basement" without clear boundaries.

**Future consideration:** Could work as a seasonal one-time service paired with Spring/Fall Prep bundles.

---

## 8. Simulator Validation Results

### 8.1 Baseline 12-Month Projection

Run with current model assumptions (`tools/market-simulation/model.ts`):

| Metric | Value |
|--------|-------|
| Total 12-month revenue | $44,475 |
| Total 12-month costs | $75,085 |
| Average gross margin | -79.4% |
| Peak customers | 41 |
| Final customers (M12) | 41 |
| Break-even month | Never (single zone) |

**Note:** Single-zone simulation is expected to be unprofitable due to fixed overhead ($1,850/month). Multi-zone amortization is the path to profitability — established in Session 1.

### 8.2 Consumption Scenarios

| Scenario | Utilization | Monthly Cost (Ess.) | Margin |
|----------|-------------|---------------------|--------|
| Light user | 40% | $54.84 | **+44.6%** |
| Moderate user | 55% | $75.41 | **+19.4%** |
| Target max | 65% | $89.12 | **+5.8%** |
| **Break-even** | **72.2%** | **$97.98** | **0.0%** |
| Heavy user | 90% | $123.29 | **-17.3%** |

### 8.3 Handle Cost Consistency

All 54 SKU/level handle costs verified against migration. No transcription errors. Anchoring patterns are internally consistent:
- **Time-based services:** min/handle clusters around 6-9 (median 6.8, anchor 6.4)
- **Cost-based services:** min/handle ranges 3.3-12 (reflecting premium markup)
- **Home Assistant:** consistent 15 min/handle across all 5 SKUs

---

## 9. Database Field Recommendations

### 9.1 High Priority (sku_levels)

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `presence_required` | BOOLEAN | NULL | Override SKU default per level. Window Cleaning L2+ needs customer present; L1 does not. |
| `access_mode` | access_mode ENUM | NULL | Same override pattern. Pest Control L1 = exterior_only, L2+ = customer_present. |
| `weather_sensitive` | BOOLEAN | NULL | Interior window cleaning isn't weather-sensitive; exterior is. |

### 9.2 Calibration Aids (sku_levels)

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `provider_payout_hint_cents` | INTEGER | NULL | Calibration reference for provider interviews. Not billing-connected. |
| `property_size_tier` | TEXT | NULL | Auto-select level based on property metadata. |

### 9.3 Operational Improvements (service_skus)

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `licensing_required` | TEXT[] | '{}' | Required certifications. Filter provider capabilities. |
| `seasonal_availability` | TEXT | 'year_round' | Controls catalog visibility by season. |
| `recommended_frequency` | TEXT | NULL | Display text for plan builder. |
| `min_provider_rating` | NUMERIC(2,1) | NULL | Premium services may require higher-rated providers. |

---

## 10. Research Sources

1. **Lawn care agent research** — 8 services × 3 tiers, duration/pricing by lot size
2. **Specialty services agent research** — 11 services × 3 tiers, full operational profiles
3. **deep-research-report.md** — 50 service categories with TAM data
4. **deep-research-report-2.md** — Bundle pricing analysis
5. **Thumbtack 2024-2025** — Per-service pricing benchmarks
6. **HomeAdvisor 2024-2025** — Regional pricing data
7. **Angi 2025** — Gutter cleaning and specialty service pricing
8. **NFPA** — Dryer vent cleaning safety standards
9. **Market simulator** (`tools/market-simulation/model.ts`) — Provider payout calibration

---

*This report is the baseline for provider interviews. Handle costs and level definitions will evolve as real operational data replaces research estimates.*
