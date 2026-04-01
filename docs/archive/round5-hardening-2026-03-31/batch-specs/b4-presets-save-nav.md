# Batch B4 — Scenario Presets, Save/Load, Admin Nav

> **Size:** S
> **Review:** Quality (Micro: 1 combined reviewer, no synthesis)

---

## Goal

Add scenario presets, localStorage save/load, seasonal market profiles, and the admin sidebar navigation entry.

## Deliverables

1. `src/components/admin/simulator/SimulatorPresets.tsx` — preset buttons + seasonal selector + save/load
2. Update `Simulator.tsx` to include presets component
3. Update `AdminShell.tsx` to add "Tools > Market Simulator" nav entry

## Acceptance Criteria

- [ ] 3 scenario presets (Baseline, Optimistic, Conservative) load correctly
- [ ] 4 seasonal profiles (Austin, Phoenix, Denver, Charlotte) switch correctly
- [ ] Save scenario to localStorage with custom name
- [ ] Load saved scenarios from localStorage
- [ ] "Tools > Market Simulator" appears in admin sidebar
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
