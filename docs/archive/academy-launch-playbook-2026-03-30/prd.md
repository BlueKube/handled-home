# PRD-044: Academy — Launch Playbook Integration

> **Execution mode:** Quality
> **Priority:** High — operators need this knowledge before pilot launch

---

## Problem Statement

The Launch Playbook (`docs/upcoming/launch-playbook-2026-03-29.md`) contains critical operational knowledge for pilot launch: provider recruitment strategy, SKU calibration from provider interviews, zone sizing methodology with viability formulas, and a 12-week pilot timeline. None of this content is in the Academy.

The existing Academy modules cover "how to use the admin console" but not "how to launch and grow a market." An operator following the Academy today would know how to manage providers in the system but not how to recruit them; how to edit SKUs but not how to calibrate them from real provider data; how to monitor zone health but not how to size a zone for viability.

---

## Requirements

### R1: Fold provider interview methodology into SKU Catalog module
- Add a section to `sku-catalog.ts` covering: how to conduct provider interviews for calibration data, the interview-to-system-parameter mapping table, and validation guidance
- Source: Launch Playbook Phase 1 (Interview Guide, Interview Data → SKU Calibration) and Phase 2

### R2: Fold zone sizing methodology into Zones & Markets module
- Add sections to `zones-markets.ts` covering: drive-time-based sizing methodology, zone viability formula (homes × ownership × income × conversion ≥ min_customers), zone size heuristics table, and regional expansion decision criteria
- Source: Launch Playbook Phase 3 and Phase 5

### R3: Create new module — Market Launch & Provider Recruitment
- New file `src/constants/academy/market-launch.ts`
- Covers: provider targeting (archetypes A/B/C), sourcing channels, value prop script, objection handlers, pilot launch checklist (12-week timeline), success metrics, expansion framework
- Register in `academy-modules.ts` under a suitable category
- Source: Launch Playbook Phase 1 (recruitment), Phase 4 (pilot), Phase 5 (expansion)

---

## Acceptance Criteria

- SKU Catalog module includes provider interview methodology and data mapping
- Zones & Markets module includes quantitative zone sizing formulas and expansion criteria
- New Market Launch module exists with recruitment playbook, pilot plan, and expansion framework
- New module registered in academy-modules.ts
- No type errors (`npx tsc --noEmit`)
- Build passes (`npm run build`)
- Cross-module references are consistent (e.g., SKU calibration references interview guide in Market Launch module)

---

## Out of Scope

- Market simulation tool (Phase 6 of playbook — separate tooling, not Academy content)
- Austin-specific details (generalize for any market)
- Changes to non-Academy code
