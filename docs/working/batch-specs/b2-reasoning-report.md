# Batch B2 — SKU Calibration Reasoning Report

> **Size:** M
> **Review:** Quality (2-lane Small: 1 combined reviewer + 1 synthesis)

---

## Goal

Generate a comprehensive reasoning report documenting all SKU/level/pricing decisions made during the calibration process (PRDs 045-047). This report serves as the baseline reference for provider interviews and future pricing adjustments.

## Deliverables

1. **`docs/sku-calibration-report.md`** covering:
   - Handle economics model (7-handle anchor, time-based vs cost-based formulas)
   - Per-SKU reasoning with market research citations
   - Tier progression logic (L1→L2→L3 design principles)
   - Licensed service premium rationale
   - New SKU justification (Gutter, Trash Can, Grill, Dryer Vent, Fall Prep)
   - Home Assistant SKU design rationale
   - What was deferred (Christmas Lights, Garage Cleanout) and why
   - Simulator validation results summary
   - Database field recommendations for future schema work

## Acceptance Criteria

- [ ] Report committed to `docs/sku-calibration-report.md`
- [ ] All 23 SKUs and 54 levels covered
- [ ] Market research sources cited
- [ ] Simulator validation findings referenced
- [ ] Deferred items documented with rationale

## Out of Scope

- Modifying any code or migrations
- Running the simulator (B1 already did this)
- Creating database migrations (B3)
