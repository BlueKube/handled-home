# Plan: Phase 2 — Exception Management Unification

> **Branch:** claude/sku-calibration-validation-WFqgD
> **Mode:** Quality
> **Review:** Small batch config (1 combined reviewer + 1 synthesis)

---

## Approach

The ops_exceptions system is mature (6 statuses, SLA tracking, action history, assignment, rich filtering). The billing_exceptions system is minimal (OPEN/RESOLVED, no SLA, no actions). Rather than building a third unified system, we'll:

1. Add billing exception types to the ops_exceptions enum
2. Create a migration that adds billing-related exception types
3. Build a unified hook that queries ops_exceptions (which now contains both)
4. Update the Exceptions page to use the unified ops queue
5. Add next-best-action suggestions per exception type

## Batches

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| B1 | Migration: add billing exception types to ops_exceptions enum | S | ✅ | |
| B2 | Unified exception hook + update Exceptions page to use ops queue | S | ✅ | |
| B3 | Next-best-action engine + one-tap resolution actions | M | ✅ | |
| B4 | Doc sync + feature-list update | Micro | ✅ | |

---

## Session Handoff
- **Branch:** claude/sku-calibration-validation-WFqgD
- **Last completed:** B4 (Phase 2 complete)
- **Next up:** Phase 3 — Provider Accountability System
- **Context at exit:** ~50%
- **Blockers:** None
- **Round progress:** Phase 2 of 7 complete
