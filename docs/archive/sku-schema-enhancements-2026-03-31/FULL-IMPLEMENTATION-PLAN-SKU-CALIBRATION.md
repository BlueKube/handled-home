# Full Implementation Plan: SKU Catalog Overhaul & Level Calibration

> **Created:** 2026-03-30
> **Purpose:** Research-backed seed data for all service SKUs and levels, replacing placeholder data with calibrated durations, handle costs, routing fields, and level definitions.

---

## Context

The platform currently has 13 outdoor/specialty SKUs and 5 home assistant SKUs in the database. However:
- **Zero sku_levels rows exist** — every service is a flat single-tier offering
- The first 8 SKUs are all categorized as "mowing" (incorrect for weed treatment, fertilization, etc.)
- Routing fields (scheduling_profile, access_mode, fulfillment_mode) use defaults, not service-appropriate values
- Descriptions, inclusions, exclusions, and checklists are minimal or missing
- Handle costs are all set to the default of 1 (meaningless)
- Several viable service categories are missing from the catalog entirely

This plan builds research-backed seed data that serves as the **baseline for provider interviews** during market launch. Providers will validate and calibrate these numbers; the goal is to start from informed estimates rather than guesses.

---

## Research Sources

Data synthesized from:
1. **Lawn care agent research** — 8 services with 3 tiers each, duration/pricing by lot size, equipment, licensing, seasonality
2. **Specialty services agent research** — 11 services with 3 tiers each, full operational profiles
3. **docs/archive/legacy-docs/deep-research-report.md** — 50 service categories with TAM data, 5-level tier definitions for 10 anchor services
4. **docs/archive/legacy-docs/deep-research-report-2.md** — Bundle pricing analysis confirming handles model viability
5. **Academy content** — SKU Calibration module, Market Launch module, provider interview methodology

---

## Handle Economics Model

**Anchor:** 7 handles = 1 standard lawn mow (from market simulator model.ts)

**Plan allocations (per 28-day cycle):**
| Plan | Handles | Price | $/Handle |
|------|---------|-------|----------|
| Essential | 14 | $99 | $7.07 |
| Plus | 28 | $159 | $5.68 |
| Premium | 50 | $249 | $4.98 |
| Weighted avg | — | — | ~$6.03 |

**Provider payout baseline:** $55/job average → $7.86/handle at 7 handles/job

**Handle cost formula:** `handles = round(provider_payout_cents / 786)` where 786 = cost-per-handle in cents at the 7-handle baseline.

Cross-check: `handles ≈ planned_minutes / 6.4` (since 45 min standard mow / 7 handles ≈ 6.4 min/handle).

The model works because subscription revenue is fixed regardless of handle usage, and typical customers use 60-80% of their allocated handles.

---

## SKU Inventory: Current + New

### Existing SKUs (18 total)

**Outdoor (13):**
| ID | Name | Current Category | Correct Category | Levels Needed |
|----|------|-----------------|-----------------|---------------|
| 001 | Standard Mow | mowing | mowing | 3 (Basic/Standard/Premium) |
| 002 | Edge & Trim | mowing | trimming | 3 (Trim/Edge & Trim/Detail Edge) |
| 003 | Leaf Cleanup | mowing | cleanup | 3 (Blowout/Full Cleanup/Removal) |
| 004 | Hedge Trimming | mowing | trimming | 3 (Shape/Full Trim/Sculpt) |
| 005 | Weed Treatment | mowing | treatment | 3 (Spot/Full Lawn/Comprehensive) |
| 006 | Fertilization | mowing | treatment | 3 (Basic/Standard/Premium) |
| 007 | Mulch Application | mowing | cleanup | 3 (Spread/Standard/Premium) |
| 008 | Spring Prep | mowing | cleanup | 3 (Basic/Standard/Premium) |
| 009 | Window Cleaning | windows | windows | 3 (Exterior/Int+Ext/Full Detail) |
| 00a | Power Wash | power_wash | power_wash | 3 (Single Surface/Home Exterior/Full Property) |
| 00b | Pool Service | pool | pool | 3 (Chemical/Maintenance/Full Service) |
| 00c | Pest Control | pest | pest | 3 (Exterior/Int+Ext/Comprehensive) |
| 00d | Dog Poop Cleanup | pet_waste | pet_waste | 2 (Weekly/Multi-Dog) |

**Home Assistant (5) — already well-configured:**
| ID | Name | Category | Levels Needed |
|----|------|----------|---------------|
| (auto) | Kitchen Reset | home_assistant | 1 (single tier) |
| (auto) | Laundry Folding Sprint | home_assistant | 1 (single tier) |
| (auto) | Quick Tidy Sprint | home_assistant | 1 (single tier) |
| (auto) | Post-Party Reset | home_assistant | 1 (single tier) |
| (auto) | Bed + Bath Reset | home_assistant | 1 (single tier) |

### New SKUs to Add (5)

| Name | Category | Levels | Rationale |
|------|----------|--------|-----------|
| Gutter Cleaning | cleanup | 3 | $119-$234/visit, 2x/year, high bundling potential with window cleaning and pressure washing |
| Fall Prep | cleanup | 3 | Seasonal counterpart to Spring Prep — leaf removal, winterizer, aeration |
| Trash Can Cleaning | cleanup | 1 | Niche but real market in HOA-dense suburbs, $25-$40/month, curbside service |
| Grill Cleaning | cleanup | 2 | 2x/year seasonal, $150-$225/visit, good upsell for outdoor service customers |
| Dryer Vent Cleaning | home_assistant | 2 | Annual safety service, $100-$175/visit, NFPA recommended, high retention |

**Not adding at launch (deferred):**
- Christmas Light Installation — highly seasonal (4-month window), requires specialized equipment/insurance, complex pricing model (per linear foot + trees). Better as a marketplace add-on later.
- Garage Cleanout — primarily one-time, low recurring viability, requires homeowner decision-making on-site. Not subscription-friendly.

---

## Level Design Summary

### Handle Cost Table (all SKUs)

| SKU | L1 Label | L1 Handles | L1 Min | L2 Label | L2 Handles | L2 Min | L3 Label | L3 Handles | L3 Min |
|-----|----------|-----------|--------|----------|-----------|--------|----------|-----------|--------|
| Standard Mow | Basic Mow | 5 | 30 | Standard Mow | 7 | 45 | Premium Mow | 10 | 65 |
| Edge & Trim | Trim Only | 2 | 15 | Edge & Trim | 4 | 25 | Detail Edge | 6 | 40 |
| Leaf Cleanup | Leaf Blowout | 8 | 45 | Full Cleanup | 15 | 120 | Removal & Haul | 25 | 180 |
| Hedge Trimming | Shape Trim | 6 | 45 | Full Trim | 13 | 90 | Sculpt & Restore | 22 | 150 |
| Weed Treatment | Spot Treatment | 5 | 20 | Full Lawn | 8 | 35 | Comprehensive | 13 | 55 |
| Fertilization | Basic Application | 5 | 20 | Standard Program | 8 | 30 | Premium Program | 13 | 45 |
| Mulch Application | Basic Spread | 13 | 90 | Edge & Spread | 22 | 180 | Full Refresh | 35 | 300 |
| Spring Prep | Basic Cleanup | 13 | 120 | Standard Prep | 25 | 240 | Premium Prep | 44 | 420 |
| Fall Prep (NEW) | Basic Cleanup | 13 | 120 | Standard Prep | 25 | 300 | Premium Prep | 44 | 480 |
| Window Cleaning | Exterior Only | 13 | 90 | Interior + Exterior | 22 | 180 | Full Detail | 35 | 270 |
| Power Wash | Single Surface | 13 | 90 | Home Exterior | 25 | 150 | Full Property | 44 | 300 |
| Pool Service | Chemical Check | 3 | 15 | Weekly Maintenance | 6 | 35 | Full Service | 8 | 50 |
| Pest Control | Exterior Perimeter | 6 | 25 | Interior + Exterior | 9 | 45 | Comprehensive | 15 | 75 |
| Dog Poop Cleanup | Weekly Yard | 2 | 15 | Multi-Dog Yard | 3 | 25 | — | — | — |
| Gutter Cleaning (NEW) | Standard Clean | 10 | 75 | Full Service | 15 | 120 | Premium | 22 | 150 |
| Trash Can Cleaning (NEW) | Monthly Wash | 3 | 10 | — | — | — | — | — | — |
| Grill Cleaning (NEW) | Quick Clean | 6 | 40 | Deep Clean | 13 | 75 | — | — | — |
| Dryer Vent Cleaning (NEW) | Standard Clean | 8 | 40 | Clean + Inspect | 11 | 60 | — | — | — |
| Kitchen Reset | Kitchen Reset | 4 | 60 | — | — | — | — | — | — |
| Laundry Folding Sprint | Laundry Sprint | 2 | 30 | — | — | — | — | — | — |
| Quick Tidy Sprint | Quick Tidy | 2 | 30 | — | — | — | — | — | — |
| Post-Party Reset | Party Reset | 6 | 90 | — | — | — | — | — | — |
| Bed + Bath Reset | Bed & Bath | 4 | 60 | — | — | — | — | — | — |

### Routing Configuration (per SKU)

| SKU | scheduling_profile | access_mode | fulfillment_mode | presence_required | weather_sensitive |
|-----|-------------------|-------------|-----------------|-------------------|-------------------|
| Standard Mow | day_commit | exterior_only | same_day_preferred | false | true |
| Edge & Trim | day_commit | exterior_only | same_day_preferred | false | false |
| Leaf Cleanup | day_commit | exterior_only | same_week_allowed | false | true |
| Hedge Trimming | day_commit | exterior_only | same_week_allowed | false | false |
| Weed Treatment | day_commit | exterior_only | independent_cadence | false | true |
| Fertilization | day_commit | exterior_only | independent_cadence | false | true |
| Mulch Application | day_commit | exterior_only | same_week_allowed | false | false |
| Spring Prep | day_commit | exterior_only | same_week_allowed | false | true |
| Fall Prep | day_commit | exterior_only | same_week_allowed | false | true |
| Window Cleaning (ext) | appointment_window | exterior_only | same_week_allowed | false | true |
| Window Cleaning (int) | appointment_window | customer_present | same_week_allowed | true | false |
| Power Wash | day_commit | exterior_only | same_week_allowed | false | true |
| Pool Service | day_commit | provider_access | same_day_preferred | false | false |
| Pest Control (ext) | day_commit | exterior_only | independent_cadence | false | true |
| Pest Control (int) | appointment_window | customer_present | independent_cadence | true | false |
| Dog Poop Cleanup | day_commit | provider_access | same_day_preferred | false | false |
| Gutter Cleaning | day_commit | exterior_only | same_week_allowed | false | true |
| Trash Can Cleaning | day_commit | exterior_only | same_day_preferred | false | false |
| Grill Cleaning | appointment_window | exterior_only | same_week_allowed | false | false |
| Dryer Vent Cleaning | appointment_window | customer_present | window_booking | true | false |
| Home Assistant (all) | appointment_window | customer_present | window_booking | true | false |

**Note on Window Cleaning and Pest Control:** These SKUs have levels that change the access_mode. Level 1 (exterior only) doesn't need homeowner present; Level 2+ (interior) does. The routing fields on service_skus represent the default, and sku_levels should indicate when presence_required changes. This is a **database recommendation** — sku_levels currently lacks presence_required and access_mode overrides. See "Database Field Recommendations" section.

---

## Database Field Recommendations

### Recommended additions to sku_levels:

1. **`presence_required BOOLEAN DEFAULT NULL`** — Override the SKU-level default when a specific level changes the requirement (e.g., Window Cleaning L2 requires presence, L1 does not). NULL = inherit from SKU.

2. **`access_mode access_mode DEFAULT NULL`** — Same pattern. Window Cleaning L1 = exterior_only, L2+ = customer_present. NULL = inherit from SKU.

3. **`weather_sensitive BOOLEAN DEFAULT NULL`** — Override per level. Interior window cleaning is not weather-sensitive; exterior is. NULL = inherit from SKU.

4. **`provider_payout_hint_cents INTEGER DEFAULT NULL`** — Calibration reference: what providers should expect to earn for this level. Used by the SKU Calibration page and Control Room pricing. Not billing-system-connected — purely advisory.

5. **`property_size_tier TEXT DEFAULT NULL`** — Values: 'small', 'medium', 'large', 'xl'. When set, this level auto-selects based on property metadata. Supports the "duration by property size" calibration data from provider interviews.

### Recommended additions to service_skus:

6. **`licensing_required TEXT[] DEFAULT '{}'`** — Array of required certifications/licenses (e.g., ['pesticide_applicator', 'cpo']). Used to filter provider capabilities and flag compliance during onboarding.

7. **`seasonal_availability TEXT DEFAULT 'year_round'`** — Enum: 'year_round', 'spring_summer', 'fall_winter', 'seasonal_custom'. Controls catalog visibility and scheduling availability by season.

8. **`recommended_frequency TEXT DEFAULT NULL`** — Display text: 'weekly', 'biweekly', 'monthly', 'quarterly', '2x_yearly', 'annually'. Used in customer-facing plan builder to suggest appropriate scheduling.

9. **`min_provider_rating NUMERIC(2,1) DEFAULT NULL`** — Minimum provider star rating to be assigned this SKU. Premium/specialty services may require higher-rated providers.

---

## PRD Breakdown

### PRD-045: SKU Catalog Foundation — Fix Existing + Add New SKUs
**Scope:** Update all 13 existing outdoor SKUs with correct categories, descriptions, inclusions/exclusions, routing fields, and handle costs. Add 5 new SKUs. Update seed-rich-metro.sql.
**Batches:** ~6 small batches
**Mode:** Quality

### PRD-046: SKU Level Definitions — Create All Levels
**Scope:** Create sku_levels rows for all 18+ outdoor/specialty SKUs. Each level gets: label, short_description, inclusions, exclusions, planned_minutes, proof_photo_min, handles_cost, proof_checklist_template.
**Batches:** ~6 small batches (grouped by service category)
**Mode:** Quality

### PRD-047: Home Assistant SKU Levels + Simulator Validation
**Scope:** Create sku_levels for 5 home assistant SKUs. Run market simulator with real handle costs to validate economics. Generate reasoning report.
**Batches:** ~4 small batches
**Mode:** Quality

### PRD-048: Database Schema Enhancements (Optional)
**Scope:** Add recommended fields to sku_levels and service_skus tables. Create migration. Update admin UI components if needed.
**Batches:** ~3 small batches
**Mode:** Quality
**Decision:** Human decides whether to execute now or defer to after provider interviews.

---

## Execution Order

1. PRD-045 first — establishes the SKU foundation everything else depends on
2. PRD-046 second — levels are the core deliverable of this project
3. PRD-047 third — validates the economics and generates the reasoning report
4. PRD-048 optional — schema enhancements, human decides

---

## Success Criteria

1. Every active SKU has at least 1 level (most have 2-3)
2. Handle costs are internally consistent (7 handles = standard mow anchor)
3. Routing fields match service reality (presence_required, access_mode, etc.)
4. Seed data runs cleanly against current schema
5. Market simulator validates 15%+ gross margin with real handle costs
6. Reasoning report documents every pricing/duration decision with source data
