# Batch 3: Seasonal Revenue Modeling (PRD-017)

## Phase
Phase 3 — Simulation Enhancements

## Review: Quality

## Why it matters
Austin lawn care revenue drops ~40% in winter (Nov-Feb) while pest control stays steady. Without seasonal modeling, the simulation overstates winter revenue and understates summer peaks, leading to inaccurate break-even projections.

## Scope
- Add 12-month seasonal multiplier arrays to model.ts (lawn, pest, windows, pool)
- Apply seasonal multipliers in simulate.ts revenue calculation
- Add seasonal multiplier sliders to ui/index.html dashboard
- Update MonthSnapshot to include seasonal_adjustment field

## Non-goals
- Does NOT add per-category P&L (PRD-018)
- Does NOT change multi-zone.ts (seasonal applies equally to all zones)
- Does NOT add weather-event-level granularity

## File targets
| Action | File |
|--------|------|
| Modify | tools/market-simulation/model.ts |
| Modify | tools/market-simulation/simulate.ts |
| Modify | tools/market-simulation/ui/index.html |

## Acceptance criteria
- [ ] model.ts has seasonal multiplier arrays for 4 categories (lawn, pest, windows, pool)
- [ ] simulate.ts applies blended seasonal multiplier to revenue per month
- [ ] MonthSnapshot includes seasonal_multiplier field
- [ ] UI dashboard shows seasonal adjustment controls
- [ ] Default Austin multipliers: lawn drops to 0.6 Nov-Feb, pest steady at 1.0
- [ ] Build passes (npx tsc --noEmit on tools/)

## Regression risks
- Optimizer may need bounds for seasonal arrays
- Multi-zone simulation inherits seasonal from same model
