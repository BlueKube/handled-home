# Batch B1 — Run Market Simulator Against New Handle Costs

> **Size:** S
> **Review:** Quality (2-lane Small: 1 combined reviewer + 1 synthesis)

---

## Goal

Validate the 23-SKU, 54-level handle cost catalog against the market simulator. Create a standalone validation script that:
1. Runs the existing 12-month simulator for baseline metrics
2. Performs per-SKU handle economics analysis (revenue vs cost per handle)
3. Models consumption scenarios (light/moderate/heavy users) to find break-even utilization
4. Flags any SKU/level combinations that are problematic

## Context

- Revenue per handle: Essential $7.07, Plus $5.68, Premium $4.98, weighted avg ~$6.03
- Cost per handle: ~$7.86 ($55 payout / 7 handles)
- The business model relies on handle underutilization — not all handles get consumed
- Licensed services (Weed Treatment, Fertilization, Pest Control) use cost-based anchoring, not time-based
- The existing simulator already works at the aggregate level; this batch adds per-SKU granularity

## Deliverables

1. **`tools/market-simulation/validate-skus.ts`** — standalone script that:
   - Imports the existing simulator and runs a baseline projection
   - Defines all 54 SKU/level handle costs (from the migration)
   - Computes per-SKU: revenue-per-handle, cost-per-handle, margin-per-handle at weighted avg
   - Models 3 consumption profiles (light 40%, moderate 65%, heavy 90% utilization)
   - Identifies the break-even utilization rate
   - Produces a formatted console report with tables and flags
   - Outputs a JSON summary for the reasoning report (B2) to reference

2. **Console output** with:
   - Baseline simulator results (12-month summary)
   - Per-SKU handle economics table
   - Consumption scenario comparison
   - Flagged issues (if any)

## Acceptance Criteria

- [ ] Script runs without errors: `npx tsx tools/market-simulation/validate-skus.ts`
- [ ] Baseline simulator output matches existing behavior
- [ ] All 54 SKU/level combinations included in the analysis
- [ ] Break-even utilization rate calculated
- [ ] Any negative-margin SKUs at weighted-avg revenue are flagged
- [ ] JSON summary written to `tools/market-simulation/sku-validation-results.json`

## Out of Scope

- Modifying the existing simulator engine (simulate.ts)
- Modifying model assumptions (model.ts)
- Creating the reasoning report (B2)
