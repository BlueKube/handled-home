# Batch Spec: B3 — Specialty Service Levels

> **PRD:** PRD-046 (SKU Level Definitions)
> **Size:** S
> **SKUs:** Window Cleaning (009), Power Wash (00a), Pool Service (00b), Pest Control (00c), Dog Poop Cleanup (00d)

---

## Scope

Append INSERT INTO sku_levels statements for 5 specialty SKUs to the migration file. Window/Power Wash/Pest get 3 levels, Pool gets 3 levels, Dog Poop gets 2 levels. Total: 14 levels.

## Level Definitions

### Window Cleaning (009) — 3 levels
| Level | Label | Handles | Minutes | Photo Min |
|-------|-------|---------|---------|-----------|
| 1 | Exterior Only | 13 | 90 | 2 |
| 2 | Interior + Exterior | 22 | 180 | 2 |
| 3 | Full Detail | 35 | 270 | 3 |

- L1: Exterior windows only, squeegee and rinse, screen wipe, sill wipe. Excludes interior, storm windows, skylights, hard water removal.
- L2: Both sides all accessible windows, screen removal and cleaning, sill and track cleaning. Excludes skylights, hard water stain removal, storm window disassembly.
- L3: All windows interior and exterior, screen removal/cleaning/reinstall, track and sill detailing, hard water stain treatment, storm window cleaning. Excludes skylight access requiring specialized equipment.

### Power Wash (00a) — 3 levels
| Level | Label | Handles | Minutes | Photo Min |
|-------|-------|---------|---------|-----------|
| 1 | Single Surface | 13 | 90 | 2 |
| 2 | Home Exterior | 25 | 150 | 2 |
| 3 | Full Property | 44 | 300 | 3 |

- L1: One surface type (driveway OR patio OR deck OR walkway), pre-treat stains, pressure wash, blow dry edges. Excludes second surfaces, house siding, roof, chemical treatment.
- L2: House siding, foundation, all walkways and patios, pre-treat mildew/algae. Excludes roof, fencing, deck, chemical sealing.
- L3: Complete property — siding, foundation, all hardscapes, deck, fencing, driveway, outdoor furniture, pre-treat all surfaces, post-wash inspection. Excludes roof washing, paint stripping, sealing/staining.

### Pool Service (00b) — 3 levels
| Level | Label | Handles | Minutes | Photo Min |
|-------|-------|---------|---------|-----------|
| 1 | Chemical Check | 3 | 15 | 1 |
| 2 | Weekly Maintenance | 6 | 35 | 2 |
| 3 | Full Service | 8 | 50 | 2 |

- L1: Test water chemistry, add chemicals as needed, log readings. Excludes skimming, brushing, vacuuming, equipment check.
- L2: Skim surface, brush walls and tile line, vacuum floor, test and adjust chemicals, empty skimmer baskets. Excludes filter cleaning, equipment repair, drain clearing.
- L3: All weekly maintenance plus check pump/filter pressure, backwash or clean filter, inspect equipment, clean pump strainer basket, tile line scrub. Excludes equipment repair/replacement, acid wash, drain and refill.

### Pest Control (00c) — 3 levels
| Level | Label | Handles | Minutes | Photo Min |
|-------|-------|---------|---------|-----------|
| 1 | Exterior Perimeter | 6 | 25 | 1 |
| 2 | Interior + Exterior | 9 | 45 | 2 |
| 3 | Comprehensive | 15 | 75 | 2 |

- L1: Perimeter spray around foundation, entry point treatment (doors/windows/utility), web removal from exterior. Excludes interior treatment, baiting, crawlspace, attic.
- L2: Full exterior perimeter plus interior baseboard spray, kitchen/bath treatment, crack and crevice application. Excludes crawlspace, attic, baiting systems, wildlife.
- L3: Full interior and exterior, crawlspace and accessible attic inspection, bait station placement, targeted treatment by pest type, detailed service report. Excludes wildlife removal, structural repair, fumigation.

### Dog Poop Cleanup (00d) — 2 levels
| Level | Label | Handles | Minutes | Photo Min |
|-------|-------|---------|---------|-----------|
| 1 | Weekly Yard | 2 | 15 | 1 |
| 2 | Multi-Dog Yard | 3 | 25 | 1 |

- L1: Walk full yard, pick up and bag all waste, tie and dispose in bin. For 1-dog households. Excludes deodorizing, sanitizing, patio/deck areas.
- L2: Full yard walk for multi-dog households, pick up and bag all waste, check patio/deck areas, dispose in bin. Excludes deodorizing, sanitizing, kennels/runs.

## ID Pattern

`c2000000-0000-0000-XXXX-00000000000Y` where XXXX = SKU suffix (0009, 000a, 000b, 000c, 000d) and Y = level number.

## Acceptance Criteria

- [ ] 14 sku_levels rows inserted (3+3+3+3+2)
- [ ] Handle costs match the calibration plan
- [ ] Level numbers sequential per SKU
- [ ] Inclusions/exclusions are non-empty arrays
- [ ] ON CONFLICT clause on each INSERT
- [ ] Pest Control L1 stays exterior_only (matches base SKU scoping fix from PRD-045)
