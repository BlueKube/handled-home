# Round 19: SKU System Core Polish

> **Round:** 19 of 61
> **Branch:** `claude/polish-round-12-auth-nlfDe`
> **Phase:** Single phase — SKU System Core (Features 27–35d)
> **Execution mode:** Quality

---

## Audit Findings

### Issues Found (Actionable)

| # | Issue | Severity | File | Feature |
|---|-------|----------|------|---------|
| 1 | SkuFormSheet.tsx is 425 lines — over 300 | MUST-FIX | SkuFormSheet.tsx | F27 |
| 2 | SkuLevelEditor.tsx is 365 lines — over 300 | MUST-FIX | SkuLevelEditor.tsx | F36 |

### Out of Scope
- Equipment UI for routing metadata — new feature
- Type safety refactors (as any casts) — working pattern
- Additional form validation — working as-is

### Already Solid
- All loading/error/empty states ✓
- Dark mode ✓
- Duplicate SKU action ✓
- Calibration page ✓
- Customer catalog with search ✓

---

## Batch Breakdown

| Batch | Title | Size | Files | Status | Context |
|-------|-------|------|-------|--------|---------|
| B1 | SkuFormSheet decomposition (425→<300) | M | 3 files | ⬜ | |
| B2 | SkuLevelEditor decomposition (365→<300) | S | 2 files | ⬜ | |

---

## Session Handoff
- **Branch:** `claude/polish-round-12-auth-nlfDe`
- **Last completed:** Round 18 complete. Starting Round 19.
- **Next up:** B1 — SkuFormSheet decomposition
- **Context at exit:** N/A
- **Blockers:** None
- **Round progress:** Phase 1 of 1 in progress
