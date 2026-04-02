# Round 23: Handles Currency Polish

> **Round:** 23 of 61
> **Branch:** `claude/polish-round-12-auth-nlfDe`
> **Phase:** Single phase — Handles Currency (Features 52–58)
> **Execution mode:** Quality

---

## Audit Findings

### Issues Found (Actionable)

| # | Issue | Severity | File | Feature |
|---|-------|----------|------|---------|
| 1 | `useHandleTransactions` defined but never used anywhere | SHOULD-FIX | useHandles.ts | F53 |
| 2 | HandleBalanceBar `pct` can exceed 100% when balance > perCycle (rollover) | MUST-FIX | HandleBalanceBar.tsx | F52 |
| 3 | HomeAssistant loading shows plain text instead of skeleton | SHOULD-FIX | HomeAssistant.tsx | F52 |
| 4 | AddonSuggestionsCard returns null during loading (no skeleton) | SHOULD-FIX | AddonSuggestionsCard.tsx | F55 |
| 5 | SuggestionCard hide button uses hover-only opacity (invisible on mobile) | SHOULD-FIX | SuggestionCard.tsx | F55 |

### Already Solid
- Handle balance RPC and caching ✓
- Plan handles config per plan ✓
- Rollover cap and expiry days configurable ✓
- PlanCard handles per cycle display ✓
- HandlesExplainer collapsible card ✓
- ThisCycleSummary rollover display ✓
- CycleStatsRow handles stat pill ✓
- Addon purchase flow with handle/cash dual payment ✓
- Home Assistant booking with handle/cash payment ✓
- Idempotency key indexing on transactions ✓
- Refund with original expiry preservation ✓

---

## Batch Breakdown

| Batch | Title | Size | Files | Status | Context |
|-------|-------|------|-------|--------|---------|
| B1 | Handle balance overflow + dead code + loading/mobile fixes | S | 5 files | ⬜ | |

---

## Session Handoff
- **Branch:** `claude/polish-round-12-auth-nlfDe`
- **Last completed:** Round 22 B2 (all batches complete)
- **Next up:** Round 23 B1 — handle balance overflow + polish fixes
- **Context at exit:** ~15%
- **Blockers:** None
- **Round progress:** Phase 1 of 1 — B1 pending
