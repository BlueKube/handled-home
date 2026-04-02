# Round 26: Dunning, Plan Self-Service & Billing Automation

> **Round:** 26 of 61
> **Branch:** `claude/polish-round-12-auth-nlfDe`
> **Phase:** Single phase — Features 119–128, 233–237
> **Execution mode:** Quality

---

## Audit Findings & Fixes

| # | Issue | Severity | File | Fix |
|---|-------|----------|------|-----|
| 1 | DunningTracker STEP_LABELS days wrong (5/7/10 → 7/10/14) | MUST-FIX | DunningTracker.tsx | Fixed to match edge function stepDayMap |
| 2 | PayoutRolloverCard threshold $25 vs DB $50 | MUST-FIX | PayoutRolloverCard.tsx | Changed 2500→5000 to match run_payout_batch RPC |
| 3 | DUNNING_TIMELINE retry offsets wrong (3/7/10 → 1/3/7) | MUST-FIX | useDunningEvents.ts | Fixed to match edge function timing |
| 4 | DunningTracker missing error state | SHOULD-FIX | DunningTracker.tsx | Added QueryErrorCard |
| 5 | PayoutRolloverCard missing error state | SHOULD-FIX | PayoutRolloverCard.tsx | Added QueryErrorCard |
| 6 | FixPaymentPanel console.error | SHOULD-FIX | FixPaymentPanel.tsx | Removed |
| 7 | OpsBilling local formatCents | SHOULD-FIX | OpsBilling.tsx | Replaced with @/utils/format |
| 8 | OpsBilling missing error state | SHOULD-FIX | OpsBilling.tsx | Added QueryErrorCard |

### Already Solid
- PlanChangePanel (141 lines) — direction detection, pending change banner, cancel pending ✓
- SubscriptionStatusPanel (79 lines) — billing cycle, pending badge ✓
- CancellationFlow (195 lines) — reason survey, retention offer, confirm ✓
- PausePanel (176 lines) — visual timeline, auto-cancel warnings, frozen handles ✓
- HandlesExplainer (61 lines) ✓
- usePlanSelfService (116 lines) — all mutations clean ✓
- CustomerSubscription page (65 lines) — proper loading/empty/error flow ✓
- NotificationBanners (110 lines) — multi-type banners, dismissible ✓
- run-dunning edge function (201 lines) — idempotent, step timing correct ✓
- run-billing-automation edge function (94 lines) ✓

---

## Batch Breakdown

| Batch | Title | Size | Files | Status | Context |
|-------|-------|------|-------|--------|---------|
| B1 | Dunning + billing polish (all features) | M | 5 files | ✅ | |

---

## Session Handoff
- **Branch:** `claude/polish-round-12-auth-nlfDe`
- **Last completed:** Round 26 B1 (all batches complete)
- **Next up:** Round 27 — Service Day System (Features 59-67)
- **Context at exit:** ~45%
- **Blockers:** None
- **Round progress:** Phase 1 of 1 complete — round done
