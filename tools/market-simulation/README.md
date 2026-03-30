# Market Simulation Tool

An autoresearch-inspired optimization loop for testing Handled Home's business model assumptions before real-world pilot.

## How It Works

1. `model.ts` contains all business assumptions (zone size, pricing, provider economics, growth rates)
2. `simulate.ts` runs a 12-month simulation and produces a scored output
3. `optimize.ts` runs the autoresearch loop: mutate one assumption → simulate → keep/discard → repeat
4. Results are logged to `results.tsv` for analysis

## Quick Start

```bash
# Run a single simulation with current assumptions
npx tsx tools/market-simulation/simulate.ts

# Run the optimization loop (100 experiments)
npx tsx tools/market-simulation/optimize.ts

# Run with custom experiment count
EXPERIMENTS=200 npx tsx tools/market-simulation/optimize.ts
```

## Files

- `model.ts` — All business assumptions (the only file the optimizer mutates)
- `simulate.ts` — The simulation engine (fixed, never modified by optimizer)
- `optimize.ts` — The autoresearch loop (mutate → simulate → score → keep/discard)
- `results.tsv` — Experiment log (auto-generated)
- `README.md` — This file

## Scoring Function

```
score = (
  gross_margin_pct × 30 +
  retention_60d_pct × 25 +
  provider_utilization_pct × 20 +
  attach_rate_pct × 15 +
  time_to_15_customers_weeks × -10
)
```

Higher is better. The optimizer tries to maximize this composite score by adjusting assumptions.

## Not Part of the App

This tool lives in `tools/` and is never included in the Capacitor/Vite build. It's a standalone analysis tool for business planning.
