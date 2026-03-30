# Batch Spec: B2 — Treatment/Seasonal Levels

> **PRD:** PRD-046 (SKU Level Definitions)
> **Size:** S
> **SKUs:** Weed Treatment (005), Fertilization (006), Mulch Application (007), Spring Prep (008), Fall Prep (00f)

---

## Scope

Append INSERT INTO sku_levels statements for 5 treatment/seasonal SKUs to the migration file `supabase/migrations/20260330000000_sku_catalog_overhaul.sql`. Each SKU gets 3 levels.

## Level Definitions

### Weed Treatment (005) — 3 levels
| Level | Label | Handles | Minutes | Photo Min |
|-------|-------|---------|---------|-----------|
| 1 | Spot Treatment | 5 | 20 | 1 |
| 2 | Full Lawn | 8 | 35 | 1 |
| 3 | Comprehensive | 13 | 55 | 2 |

- L1 inclusions: Spot spray visible weeds, mark treated areas
- L1 exclusions: Broadcast spray, pre-emergent, bed treatment, hardscape treatment
- L2 inclusions: Pre-emergent or post-emergent application, broadcast spray full lawn, spot treatment of visible weeds, post notification sign
- L2 exclusions: Hand weeding, bed weed barrier, invasive species removal, hardscape treatment
- L3 inclusions: Full lawn broadcast, targeted bed treatment, hardscape crack treatment, invasive species identification and treatment, post notification sign
- L3 exclusions: Hand weeding, bed weed barrier installation, tree/shrub root treatment

### Fertilization (006) — 3 levels
| Level | Label | Handles | Minutes | Photo Min |
|-------|-------|---------|---------|-----------|
| 1 | Basic Application | 5 | 20 | 1 |
| 2 | Standard Program | 8 | 30 | 1 |
| 3 | Premium Program | 13 | 45 | 2 |

- L1 inclusions: Granular fertilizer application, seasonal-appropriate blend, full turf coverage
- L1 exclusions: Soil testing, liquid application, spot treatment, lime/sulfur adjustment
- L2 inclusions: Granular or liquid application, seasonal NPK blend, full turf coverage, slow-release formula
- L2 exclusions: Soil testing, aeration, overseeding, lime/sulfur adjustment
- L3 inclusions: Custom NPK blend based on season, liquid + granular application, micronutrient supplement, full turf coverage, soil health notes provided
- L3 exclusions: Soil lab testing, aeration, overseeding

### Mulch Application (007) — 3 levels
| Level | Label | Handles | Minutes | Photo Min |
|-------|-------|---------|---------|-----------|
| 1 | Basic Spread | 13 | 90 | 2 |
| 2 | Edge & Spread | 22 | 180 | 2 |
| 3 | Full Refresh | 35 | 300 | 3 |

- L1 inclusions: Spread mulch at 2-3 inch depth, basic cleanup of spills
- L1 exclusions: Bed edging, weed barrier, old mulch removal, plant detailing
- L2 inclusions: Edge all beds, lay weed barrier where needed, spread mulch at 2-3 inch depth, detail around plants and features
- L2 exclusions: Old mulch removal, new bed creation, planting, soil amendment
- L3 inclusions: Remove old mulch top layer, edge all beds, install weed barrier, spread fresh mulch at 3 inch depth, detail around all plants and features, clean up all spills, haul away debris
- L3 exclusions: New bed creation, planting, soil amendment, hardscape repair

### Spring Prep (008) — 3 levels
| Level | Label | Handles | Minutes | Photo Min |
|-------|-------|---------|---------|-----------|
| 1 | Basic Cleanup | 13 | 120 | 2 |
| 2 | Standard Prep | 25 | 240 | 2 |
| 3 | Premium Prep | 44 | 420 | 3 |

- L1 inclusions: Rake/blow winter debris from lawn, cut back dead perennials, first mow of season
- L1 exclusions: Bed edging, pre-emergent, shrub pruning, mulch, aeration
- L2 inclusions: Rake/blow winter debris from lawn and beds, cut back dead perennials, edge all beds, pre-emergent weed treatment, prune dead/damaged shrub branches, first mow of season
- L2 exclusions: Mulch application, aeration, overseeding, fertilizer application, tree pruning above 10 feet
- L3 inclusions: Full debris removal from lawn, beds, and hardscapes, cut back all perennials, edge and redefine all beds, pre-emergent weed treatment, spot weed pulling, prune all shrubs, first mow with bagging, blow all hardscapes clean, plant health assessment
- L3 exclusions: Mulch application, aeration, overseeding, fertilizer application, tree pruning above 10 feet

### Fall Prep (00f) — 3 levels
| Level | Label | Handles | Minutes | Photo Min |
|-------|-------|---------|---------|-----------|
| 1 | Basic Cleanup | 13 | 120 | 2 |
| 2 | Standard Prep | 25 | 300 | 2 |
| 3 | Premium Prep | 44 | 480 | 3 |

- L1 inclusions: Single-pass leaf removal, final mow of season, blow beds and hardscapes
- L1 exclusions: Perennial cutback, winterizer, overseeding, gutter cleaning, shrub wrapping
- L2 inclusions: Full leaf removal (1-2 passes), final mow of season, cut back perennials, winterizer fertilizer application, blow out beds and hardscapes
- L2 exclusions: Gutter cleaning, irrigation blowout, shrub wrapping, aeration, mulch application
- L3 inclusions: Multi-pass leaf removal until clear, final mow with bagging, cut back all perennials, winterizer fertilizer, overseed bare spots, blow out all beds and hardscapes, protect tender plants, full property walkthrough
- L3 exclusions: Gutter cleaning, irrigation blowout, shrub wrapping, mulch application

## ID Pattern

`c2000000-0000-0000-XXXX-00000000000Y` where XXXX = SKU suffix (0005, 0006, 0007, 0008, 000f) and Y = level number.

## Acceptance Criteria

- [ ] 15 sku_levels rows inserted (5 SKUs × 3 levels each)
- [ ] Handle costs match the calibration plan
- [ ] Level numbers sequential (1, 2, 3) per SKU
- [ ] Inclusions/exclusions are non-empty arrays
- [ ] ON CONFLICT clause on each INSERT
- [ ] SQL appended after B1 lawn care levels section
