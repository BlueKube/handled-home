# Batch B1 — Port Simulation Engine to src/lib/simulation/

> **Size:** S
> **Review:** Quality (Small: 1 combined reviewer + 1 synthesis)

---

## Goal

Copy the simulation engine (model.ts + simulate.ts types and logic) into `src/lib/simulation/` so it can run client-side in the admin console. No modifications to the original tools/ files.

## Deliverables

1. `src/lib/simulation/model.ts` — ModelAssumptions interface, default assumptions, bounds
2. `src/lib/simulation/simulate.ts` — simulate() function, MonthSnapshot/SimulationResult types
3. Remove CLI runner code (the `if (import.meta.url ...)` block) — browser-only

## Acceptance Criteria

- [ ] Both files created with correct types
- [ ] simulate() function works with default assumptions (no Node.js dependencies)
- [ ] No `process.argv` or Node-specific code
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

## Out of Scope

- Optimizer, multi-zone, validate-skus (stay in tools/)
- Admin page/UI (B2-B4)
