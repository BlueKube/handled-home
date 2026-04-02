# Round 28: Routine & Bundle Builder

> **Round:** 28 of 61
> **Branch:** `claude/polish-round-12-auth-nlfDe`
> **Phase:** Single phase — Features 68–77
> **Execution mode:** Quality

---

## Audit Findings

### Issues Found (Actionable)

| # | Feature | Issue | Fix |
|---|---------|-------|-----|
| 1 | F68 | RoutineReview skuDetails query silently fails | Added isError + inline "scope unavailable" message |
| 2 | F68 | navigate() called during render (anti-pattern) | Moved to useEffect in RoutineReview + RoutineConfirm |
| 3 | F69 | Touch targets below 44px on cadence controls | Increased remove button h-8→h-10, pattern buttons min-h-[44px] |
| 4 | F70 | No error state when routine data fails to load | Added QueryErrorCard with retry |
| 5 | F71 | Duplicate MODEL_LABELS across 3 files | Exported from useEntitlements, removed duplicates |
| 6 | F71 | Routine.tsx over 300 lines | Extracted PopularServicesPreview component (283 lines now) |
| 7 | F71 | Fixed bottom bars missing safe-area insets | Added pb-[max(1rem,env(safe-area-inset-bottom))] |
| 8 | F72 | Auto-fit button has no loading spinner | Added Loader2 + "Fitting..." label |
| 9 | F72 | Auto-fit button touch target too small | Added min-h-[44px] |
| 10 | F73 | Supabase errors silently swallowed | Added error capture + throw on all 3 queries |
| 11 | F73 | Fake "A" recommendation when no zone data | Return null instead |
| 12 | F74 | Swap button 40px, below 44px minimum | Bumped to h-11 w-11 (44px) |
| 13 | F76 | Effective date hardcoded T0+7 | Use subscription.billing_cycle_end_at |
| 14 | F76 | Copy says "7 days" but varies by cycle | Changed to "current cycle's schedule" |
| 15 | F77 | grid-cols-2 overflow on narrow screens | Changed to flex flex-wrap |

### Already Solid (9/10+)
- F68: 3-step flow — all 3 pages, routing, navigation ✓
- F69: Cadence picker — all options, CadencePicker component ✓
- F70: 4-week preview — WeekPreviewTimeline, useRoutinePreview ✓

### Unchanged (not polishable)
- F73: geo clustering part unimplemented (deferred, not polish scope)
- F74: feasibility check unimplemented (new feature, not polish scope)
- F75: rated 1/10 — entire feature unimplemented, skip

---

## Batch Breakdown

| Batch | Title | Size | Files | Status | Context |
|-------|-------|------|-------|--------|---------|
| B1 | Routine polish — all features | S | 10 files | ✅ | |

---

## Session Handoff
- **Branch:** `claude/polish-round-12-auth-nlfDe`
- **Last completed:** Round 28 B1 (all batches complete)
- **Next up:** Round 29
- **Context at exit:** ~50%
- **Blockers:** None
- **Round progress:** Phase 1 of 1 complete — round done
