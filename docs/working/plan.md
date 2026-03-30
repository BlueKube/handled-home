# Plan: PRD-046 — SKU Level Definitions

> **Branch:** claude/add-feature-maturity-ratings-tMeen
> **Mode:** Quality
> **Review:** 2-lane (Small batch: 1 combined reviewer + 1 synthesis)

---

## Phase 1: SKU Level Definitions (5 batches)

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| B1 | Lawn care levels: Mow, Edge, Leaf, Hedge (001-004) | S | ✅ | 18% |
| B2 | Treatment/seasonal levels: Weed, Fert, Mulch, Spring, Fall (005-008, 00f) | S | ✅ | 25% |
| B3 | Specialty levels: Window, Power Wash, Pool, Pest, Poop (009-00d) | S | ✅ | 32% |
| B4 | New SKU levels: Gutter, Trash, Grill, Dryer Vent + Home Assistant (00e-012) | S | ✅ | 38% |
| B5 | Update seed files + verify build + review | M | ✅ | 45% |

---

## Review Summary

All batches reviewed with 2-lane configuration (combined spec+bug + synthesis):
- **B1:** No MUST-FIX (completed in prior session)
- **B2:** No MUST-FIX. SHOULD-FIX: handle cost anchoring for licensed services (documented in calibration plan as cost-based, not time-based)
- **B3:** No MUST-FIX. NICE-TO-HAVE: "Second surface types" → "Additional surface types" (cosmetic)
- **B4:** No issues found
- **B5:** Build verification — tsc and build both pass clean

---

## Session Handoff
- **Branch:** claude/add-feature-maturity-ratings-tMeen
- **Last completed:** PRD-046 B5 (all batches complete)
- **Next up:** PRD-047 — Simulator Validation & Reasoning Report
- **Context at exit:** 45%
- **Blockers:** None
- **PRD queue:** PRD-047 (simulator validation), PRD-048 (schema enhancements)
