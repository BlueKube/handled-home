# Plan — PRD-044: Academy — Launch Playbook Integration

> **Branch:** `claude/add-feature-maturity-ratings-tMeen`
> **Execution mode:** Quality
> **Phase:** 1 (single phase)

---

## Batches

| Batch | Title | Size | Files | Status | Context |
|-------|-------|------|-------|--------|---------|
| B1 | Fold into existing modules (R1, R2) | M | sku-catalog.ts, zones-markets.ts | ✅ | |
| B2 | New Market Launch module (R3) | M | market-launch.ts, academy-modules.ts | ⬜ | |

---

## Review Configuration

Custom lanes for content review (same as PRD-043):

**Lane A — Senior Editor (Sonnet)**
Focus: Voice quality, pedagogical effectiveness, senior-operator tone. Does the new content match the quality bar of the best existing Academy content?

**Lane B — Fact Checker (Sonnet)**
Focus: Cross-reference new content against the launch playbook source document and the codebase. Are facts accurate? Do cross-module references agree?

**Lane C — Synthesis (Sonnet)**
Combines Lane A + B findings, de-duplicates, scores.

---

## Session Handoff
- **Branch:** claude/add-feature-maturity-ratings-tMeen
- **Last completed:** None — starting fresh
- **Next up:** B1 — Fold into existing modules
- **Context at exit:** —
- **Blockers:** None
