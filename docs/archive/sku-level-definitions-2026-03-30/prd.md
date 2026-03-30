# PRD-046: SKU Level Definitions — Create All Levels

> **Date:** 2026-03-30
> **Mode:** Quality
> **Parent Plan:** FULL-IMPLEMENTATION-PLAN-SKU-CALIBRATION.md

---

## Problem

Zero sku_levels rows exist in the database. Every service is a flat single-tier offering. Customers can't choose between service levels (e.g., basic mow vs. premium mow), and the platform can't assign different handle costs or durations per level.

## Requirements

### R1: Create sku_levels for lawn/yard services (SKUs 001-008 + Fall Prep)
Each SKU gets 2-3 levels with: label, short_description, inclusions, exclusions, planned_minutes, proof_photo_min, handles_cost, proof_checklist_template.

### R2: Create sku_levels for specialty services (SKUs 009-00d + Gutter, Trash, Grill, Dryer Vent)
Same structure. Some SKUs have only 1-2 levels (Trash Can, Dog Poop).

### R3: Create sku_levels for home assistant SKUs (5 existing)
Single-level entries to establish the pattern.

### R4: Update seed files
Mirror all level data in seed-rich-metro.sql.

## Level Design (from FULL-IMPLEMENTATION-PLAN)

See the Handle Cost Table in FULL-IMPLEMENTATION-PLAN-SKU-CALIBRATION.md for the complete level matrix.

## Acceptance Criteria

- [ ] Every active SKU has at least 1 sku_level row
- [ ] Handle costs are consistent with the 7-handle anchor
- [ ] Level numbers are sequential (1, 2, 3)
- [ ] Inclusions/exclusions are non-empty arrays
- [ ] Migration SQL executes cleanly
- [ ] `npm run build` passes
