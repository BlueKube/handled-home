# Batch Spec: B4 — New SKU Levels + Home Assistant Levels

> **PRD:** PRD-046 (SKU Level Definitions)
> **Size:** S
> **SKUs:** Gutter Cleaning (00e), Trash Can Cleaning (010), Grill Cleaning (011), Dryer Vent Cleaning (012), Kitchen Reset, Laundry Folding Sprint, Quick Tidy Sprint, Post-Party Reset, Bed + Bath Reset

---

## Scope

Append INSERT INTO sku_levels for 4 new outdoor SKUs + 5 Home Assistant SKUs.

## Level Definitions

### Gutter Cleaning (00e) — 3 levels
| Level | Label | Handles | Minutes | Photo Min |
|-------|-------|---------|---------|-----------|
| 1 | Standard Clean | 10 | 75 | 2 |
| 2 | Full Service | 15 | 120 | 2 |
| 3 | Premium | 22 | 150 | 3 |

- L1: Clear gutters and downspouts, flush with water, basic debris removal. Excludes guard install, fascia repair, roof debris.
- L2: Clear all gutters, flush downspouts, minor gutter sealing, roof edge debris removal, ground cleanup. Excludes guard install, fascia/soffit repair, roof work.
- L3: Full gutter system service — clear, flush, seal joints, check hangers, clean ground splash zones, full roof edge cleanup, photo documentation of condition. Excludes guard install, structural repair, roof work beyond edge.

### Trash Can Cleaning (010) — 1 level
| Level | Label | Handles | Minutes | Photo Min |
|-------|-------|---------|---------|-----------|
| 1 | Monthly Wash | 3 | 10 | 1 |

- L1: Power rinse interior and exterior, deodorize, set upright to dry. Excludes trash removal, liner replacement, pest treatment.

### Grill Cleaning (011) — 2 levels
| Level | Label | Handles | Minutes | Photo Min |
|-------|-------|---------|---------|-----------|
| 1 | Quick Clean | 6 | 40 | 1 |
| 2 | Deep Clean | 13 | 75 | 2 |

- L1: Scrape grates, brush interior, wipe exterior, empty grease trap. Excludes part removal, gas line check, cover cleaning.
- L2: Full disassembly of removable parts, soak and scrub grates/heat plates, degrease interior, clean exterior, empty and clean grease management system, reassemble. Excludes gas line work, igniter replacement, structural repair.

### Dryer Vent Cleaning (012) — 2 levels
| Level | Label | Handles | Minutes | Photo Min |
|-------|-------|---------|---------|-----------|
| 1 | Standard Clean | 8 | 40 | 1 |
| 2 | Clean + Inspect | 11 | 60 | 2 |

- L1: Disconnect, brush and vacuum full vent run, reconnect, test airflow. Excludes booster fan service, vent rerouting, dryer service.
- L2: Full vent cleaning plus exterior vent cap inspection, lint trap deep clean, airflow measurement before/after, condition report with photos. Excludes vent replacement, dryer repair, booster fan install.

### Home Assistant SKUs — 1 level each (5 SKUs)

These use auto-generated UUIDs, so INSERT will use subquery for sku_id lookup.

| SKU | Label | Handles | Minutes | Photo Min |
|-----|-------|---------|---------|-----------|
| Kitchen Reset | Kitchen Reset | 4 | 60 | 1 |
| Laundry Folding Sprint | Laundry Sprint | 2 | 30 | 1 |
| Quick Tidy Sprint | Quick Tidy | 2 | 30 | 1 |
| Post-Party Reset | Party Reset | 6 | 90 | 1 |
| Bed + Bath Reset | Bed & Bath | 4 | 60 | 1 |

Inclusions/exclusions pulled from existing SKU data in migration 20260227.

## ID Pattern

- Outdoor new SKUs: `c2000000-0000-0000-XXXX-00000000000Y` where XXXX = 000e, 0010, 0011, 0012
- Home Assistant: deterministic UUIDs `c2000000-0000-0000-00ha-00000000000Y` where Y=1-5

## Acceptance Criteria

- [ ] 13 sku_levels rows total (3+1+2+2+5)
- [ ] Handle costs match calibration plan
- [ ] Home Assistant uses name-based subquery for sku_id
- [ ] ON CONFLICT clause on each INSERT
