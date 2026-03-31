# PRD-047 — Simulator Validation & Reasoning Report

> **Date:** 2026-03-30
> **Mode:** Quality
> **Parent Plan:** FULL-IMPLEMENTATION-PLAN-SKU-CALIBRATION.md

---

## Problem

We have 54 sku_levels with calibrated handle costs across 23 SKUs. These costs were derived from research and the 7-handle anchor model, but they haven't been validated against the market simulator. We also need a comprehensive reasoning report documenting why each SKU/level/pricing decision was made — this report will be the baseline reference for provider interviews.

## Goals

1. Run the market simulator (`tools/market-simulation/`) with the new handle cost data to validate profitability across all subscription tiers
2. Identify any SKUs where handle economics don't work (provider payout exceeds revenue per handle)
3. Generate a comprehensive reasoning report explaining all decisions
4. Document any recommended database schema enhancements discovered during calibration

## Deliverables

### D1: Simulator Validation
- Update simulator model assumptions if needed to reflect the 23-SKU catalog
- Run 12-month projection for each subscription tier (Essential/Plus/Premium)
- Flag any SKU/level combinations where the platform loses money
- Produce a summary table of revenue vs cost per handle by SKU

### D2: Reasoning Report
A markdown document (`docs/sku-calibration-report.md`) covering:
- **Handle economics model** — the 7-handle anchor, time-based vs cost-based formulas
- **Per-SKU reasoning** — why each handle cost was chosen, what research informed it
- **Tier progression logic** — how L1→L2→L3 inclusions/exclusions were designed
- **Licensed service premium** — why Weed Treatment, Fertilization, Pest Control use cost-based anchoring
- **New SKU justification** — why Gutter, Trash Can, Grill, Dryer Vent, Fall Prep were added
- **What was deferred** — Christmas Lights, Garage Cleanout, and why
- **Database field recommendations** — presence_required, access_mode overrides on sku_levels

### D3: Schema Enhancement Recommendations (optional)
- Document recommended new columns for sku_levels table
- If time permits, create migration to add them

## Acceptance Criteria

- [ ] Simulator runs clean with current handle costs
- [ ] No SKU/level combination produces negative margin at weighted-average revenue
- [ ] Reasoning report committed to docs/
- [ ] Feature-list.md updated with report status
