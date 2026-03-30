# Plan — PRD-043: Academy Content Cleanup & Consistency Pass

> **Branch:** `claude/add-feature-maturity-ratings-tMeen`
> **Execution mode:** Quality
> **Phase:** 1 (single phase)

---

## Batches

| Batch | Title | Size | Files | Status | Context |
|-------|-------|------|-------|--------|---------|
| B1 | Content gap fixes (R1.1, R1.2) | S | growth-incentives.ts, jobs-scheduling.ts | ✅ | 35% |
| B2 | Cross-module consistency (R2.1–R2.4) | M | provider-lifecycle.ts, control-room.ts, ops-cockpit.ts, exception-management.ts | ✅ | 55% |
| B3 | Process documentation (R3.1, R3.2) | S | lessons-learned.md, docs/archive/ move | ✅ | |

---

## Review Configuration

Custom lanes for content review (not standard code review):

**Lane A — Senior Editor (Sonnet)**
Focus: Voice quality, pedagogical effectiveness, completeness of the specific fix. Does the new content match the quality bar of the best existing content?

**Lane B — Fact Checker (Sonnet)**
Focus: Cross-reference new content against the codebase and other modules. Are the facts accurate? Do cross-module references now agree?

**Lane C — Synthesis (Sonnet)**
Combines Lane A + B findings, de-duplicates, scores.

B1 and B2 get full 3-lane review. B3 (docs only) gets a lightweight check.

---

## Session Handoff
- **Branch:** claude/add-feature-maturity-ratings-tMeen
- **Last completed:** B3 — Process documentation (all batches complete)
- **Next up:** None — PRD-043 complete. Archive docs/working/ and check docs/upcoming/ for next PRD.
- **Context at exit:** —
- **Blockers:** None
