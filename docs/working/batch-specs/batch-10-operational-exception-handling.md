# Batch 10: P2-1 — Operational Exception Handling

## Phase
Phase 2: Backend Rules & Edge Cases

## Why it matters
Pause duration is limited to 4 weeks (should be up to 60 days), has no visual timeline, and no auto-cancel warning. Dunning has no step/action enums or timeline computation. FixPaymentPanel is minimal with no retry history or grace period countdown.

## Scope
1. **PausePanel.tsx** — Extend dropdown to 8 weeks, add visual timeline, add 60-day auto-cancel warnings
2. **useDunningEvents.ts** — Add DunningStep type, DUNNING_TIMELINE constant, computeDunningTimeline() function
3. **FixPaymentPanel.tsx** — Integrate dunning events, show retry timeline, grace period countdown, suspension warning

## File targets
| Action | File |
|--------|------|
| Modify | `src/components/plans/PausePanel.tsx` |
| Modify | `src/hooks/useDunningEvents.ts` |
| Modify | `src/components/plans/FixPaymentPanel.tsx` |
