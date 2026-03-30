# PRD-045: SKU Catalog Foundation — Fix Existing + Add New SKUs

> **Date:** 2026-03-30
> **Mode:** Quality
> **Parent Plan:** FULL-IMPLEMENTATION-PLAN-SKU-CALIBRATION.md

---

## Problem

The current seed data has 13 outdoor SKUs with:
- All 8 original SKUs miscategorized as "mowing" (weed treatment, fertilization, mulch, etc. should be in their correct categories)
- Default routing fields that don't match service reality (a dryer vent cleaning shouldn't default to exterior_only/day_commit)
- Minimal descriptions, empty inclusions/exclusions, missing checklists
- Handle costs all set to default of 1
- 5 viable service categories missing from the catalog

## Requirements

### R1: Fix existing outdoor SKU metadata
Update all 13 outdoor SKUs with:
- Correct category (matching src/lib/serviceCategories.ts)
- Accurate descriptions, inclusions, exclusions
- Correct routing fields (scheduling_profile, access_mode, fulfillment_mode)
- Correct presence_required, weather_sensitive
- Calibrated handle_cost (using 7 handles = standard mow anchor)
- Realistic duration_minutes and base_price_cents
- Proof requirements (required_photos) and checklists

### R2: Add 5 new SKUs
- Gutter Cleaning (cleanup)
- Fall Prep (cleanup)
- Trash Can Cleaning (cleanup)
- Grill Cleaning (cleanup)
- Dryer Vent Cleaning (home_assistant)

### R3: Update seed-rich-metro.sql
- Update the main INSERT INTO service_skus statement with all corrections
- Add new SKU inserts
- Ensure all v_sku_ variable references remain valid
- Update the migration file (20260322) to match

### R4: Update serviceCategories.ts if needed
- Verify all categories used in SKUs exist in the serviceCategories constant

## Acceptance Criteria

- [ ] All 13 existing outdoor SKUs have correct categories
- [ ] All SKUs have non-empty inclusions and exclusions arrays
- [ ] All SKUs have correct routing fields
- [ ] Handle costs are internally consistent (7 handles = standard mow)
- [ ] 5 new SKUs added with complete metadata
- [ ] Seed data SQL executes without errors
- [ ] No duplicate SKU IDs
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes
