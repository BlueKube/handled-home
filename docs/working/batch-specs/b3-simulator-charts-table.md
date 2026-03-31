# Batch B3 — Simulator: Charts + Monthly Projection Table

> **Size:** S
> **Review:** Quality (Small: 1 combined reviewer + 1 synthesis)

---

## Goal

Add charts and the monthly projection table to the simulator page's right panel. Uses recharts (already in package.json).

## Deliverables

1. `src/components/admin/simulator/SimulatorCharts.tsx` — 3 charts:
   - Revenue vs Costs (area chart, 12 months)
   - Gross Margin % trend (line chart)
   - Customer Growth (stacked area: BYOC, referral, organic)
2. `src/components/admin/simulator/SimulatorProjectionTable.tsx` — 12-row monthly table with:
   - Month, Customers, Jobs, Revenue, Provider Pay, Overhead, Margin, Margin %, Utilization %
3. Update `Simulator.tsx` to render charts + table in the right panel

## Acceptance Criteria

- [ ] 3 charts render with correct data from SimulationResult
- [ ] Monthly table shows all 12 months with formatted values
- [ ] Charts update in real-time when sliders change
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
