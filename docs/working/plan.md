# Plan: Phase 3 — Provider Accountability System

> **Branch:** claude/sku-calibration-validation-WFqgD
> **Mode:** Quality
> **Review:** Small batch config (1 combined reviewer + 1 synthesis)

---

## Approach

Build the missing provider accountability infrastructure: incident tracking, no-show escalation, probation system, and auto-suspend/promote. This phase creates the database schema and core UI — the automation wiring (cron jobs that auto-create incidents and probation entries) is a future enhancement.

## Batches

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| B1 | Migration: provider_incidents + provider_probation tables | S | ⬜ | |
| B2 | Hooks + types for incidents and probation | S | ⬜ | |
| B3 | Admin Provider Accountability page (incidents queue + probation status) | M | ⬜ | |
| B4 | Provider-facing probation status card on dashboard | S | ⬜ | |
| B5 | Doc sync + feature-list update | Micro | ⬜ | |

---

## Session Handoff
- **Branch:** claude/sku-calibration-validation-WFqgD
- **Last completed:** Phase 2 (Exception Management Unification) — all 4 batches ✅
- **Next up:** B1 — Migration for provider tables
- **Context at exit:** N/A (continuing)
- **Blockers:** None
- **Round progress:** Phase 2 of 7 complete, starting Phase 3
