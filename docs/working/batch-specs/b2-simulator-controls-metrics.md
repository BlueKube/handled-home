# Batch B2 — Simulator Page: Controls Panel + Metric Cards

> **Size:** S
> **Review:** Quality (Small: 1 combined reviewer + 1 synthesis)

---

## Goal

Create the admin Simulator page with the left-side controls panel and top metric cards. The page runs the simulation on every slider change and displays key metrics in real-time.

## Deliverables

1. `src/pages/admin/Simulator.tsx` — main page with two-column layout
2. `src/components/admin/simulator/SimulatorControls.tsx` — slider groups for all key assumptions
3. `src/components/admin/simulator/SimulatorMetricCards.tsx` — 6 KPI cards
4. Route added at `/admin/simulator`

## Controls (slider groups)

- **Zone**: homes_in_zone, home_ownership_rate, income_qualifying_rate
- **Pricing**: essential_price, plus_price, premium_price, plan_mix_essential, plan_mix_plus
- **Provider**: providers_at_launch, provider_payout, provider_stops_per_day
- **BYOC**: byoc_customers_per_provider, byoc_invite_send_rate, byoc_activation_rate, byoc_bonus_weekly, byoc_bonus_weeks
- **Retention**: month_1_churn, steady_churn, attach_rate_90d
- **Overhead**: monthly_ops_overhead, monthly_tech_overhead

## Metric Cards (6)

1. Gross Margin % (avg) — green/red coloring
2. Final Customers (M12)
3. Break-Even Month
4. Total Revenue (12mo)
5. Provider Utilization % (avg)
6. Composite Score

## Acceptance Criteria

- [ ] Page renders at /admin/simulator
- [ ] All slider groups functional with real-time simulation updates
- [ ] 6 metric cards display correct values from SimulationResult
- [ ] Slider values map correctly to ModelAssumptions (cents conversion where needed)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

## Out of Scope

- Charts (B3)
- Monthly projection table (B3)
- Scenario presets and save/load (B4)
- Admin sidebar navigation entry (B4)
