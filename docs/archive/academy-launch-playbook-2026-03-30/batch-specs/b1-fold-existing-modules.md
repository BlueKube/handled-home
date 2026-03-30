# Batch B1 — Fold into Existing Modules (R1, R2)

> **Size:** M
> **Review:** Senior Editor + Fact Checker + Synthesis (3 lanes)

---

## R1: SKU Catalog — Provider Interview Methodology

Add a new section to `sku-catalog.ts` (after the calibration section, before pro-tips):

**Section: "Provider Interviews — Getting Real Calibration Data"** (type: walkthrough)
- Step 1: Who to interview (5-10 providers across target categories, mix of experience levels)
- Step 2: The key questions (duration per service level, equipment needed, property size impact, weather sensitivity, min/max stops per day, what makes a job take longer)
- Step 3: Map interview data to system parameters (the mapping table from the playbook: interview data point → system parameter → where it goes)
- Step 4: Validate with delta review (flag deltas >20% between seed data and provider-reported data)

Voice: Senior operator explaining "this is how you turn guesses into real numbers."

**Source content:** Launch Playbook Phase 1 (Interview Guide sections on Work Procedures, Service Levels & Duration) and Phase 2 (SKU Calibration Process, Interview Data → SKU Calibration mapping table).

## R2: Zones & Markets — Zone Sizing & Expansion

Add two new sections to `zones-markets.ts`:

**Section: "Zone Sizing — The Math Behind Good Boundaries"** (type: text)
- Core principle: drive-time-based, not geographic
- Zone sizing inputs table (drive time, population density, home ownership, median income, lot sizes, HOA density, competitor density, climate zone)
- Zone size heuristics table (dense suburban/standard suburban/exurban/rural with radius, stops/day, drive time budget)
- Viability formula: homes × ownership rate × income qualifying rate × conversion rate ≥ min_customers
- How this connects to the H3 hex grid builder already in the platform

**Section: "Expansion — When and How to Grow"** (type: text)
- Expansion decision criteria table (retention >70%, provider NPS >40, attach rate >25%, gross margin >15%, support minutes <5)
- Regional variation matrix (climate, lot size, income, density, competition, regulation)
- The principle: "turn on a new region with minimal human intervention" — what's automated vs what needs local knowledge

Voice: Senior operator who has launched multiple zones and knows which metrics actually predict success.

**Source content:** Launch Playbook Phase 3 (Zone Sizing Methodology) and Phase 5 (Regional Expansion Framework).

---

## Acceptance Criteria

- [ ] sku-catalog.ts has a provider interview walkthrough section with interview questions and data mapping
- [ ] zones-markets.ts has quantitative zone sizing section with viability formula
- [ ] zones-markets.ts has expansion criteria section with decision thresholds
- [ ] Cross-references: SKU calibration section references "see Market Launch module for the full interview guide" (anticipating B2)
- [ ] No type errors, build passes
