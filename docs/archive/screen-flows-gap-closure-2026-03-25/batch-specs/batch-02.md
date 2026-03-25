# Batch 2: Dashboard Rollover Badge + Plan Detail Fixed CTA + Routine Cost Breakdown

## Phase
Phase 1: Critical Bugs & Blocking UX (HIGH priority, customer-facing)

## Why it matters
- Rollover handles are a key value prop ("your handles don't expire") but the badge is missing, so customers don't see them
- Plan Detail lacks a fixed bottom CTA, so the subscribe action scrolls off screen on long plan pages
- Routine Review has no cost breakdown, so customers can't see what's included vs extras before confirming

## Scope
1. **F7 HandleBalanceBar rollover badge** — Show "+X rolled over" accent badge when balance > perCycle
2. **F8 Plan Detail fixed bottom CTA** — Replace inline buttons with a fixed bottom bar: "Subscribe to This Plan" (accent, xl, full-width) with blur bg
3. **F9 Routine Review cost breakdown** — Add cost breakdown section with included credits used, extras cost, total per cycle, and "Within Budget"/"Over Limit" status badge

## Non-goals
- Changing Dashboard layout or other components
- Modifying plan data fetching
- Adding help tooltips (separate batch)

## File targets
| Action | File |
|--------|------|
| Modify | src/components/customer/HandleBalanceBar.tsx |
| Modify | src/pages/customer/PlanDetail.tsx |
| Modify | src/pages/customer/RoutineReview.tsx |

## Acceptance criteria
- [ ] HandleBalanceBar shows "+X rolled over" badge (accent, small) when balance > perCycle
- [ ] HandleBalanceBar accepts optional `rollover` prop for explicit rollover count
- [ ] Plan Detail has fixed bottom CTA bar with blur bg, accent xl button "Subscribe to This Plan"
- [ ] Plan Detail inline buttons replaced by fixed bar
- [ ] Plan Detail "Build Routine" moved to inline position above fixed bar or into fixed bar
- [ ] Routine Review has a Cost Breakdown card between service cards and week preview
- [ ] Cost breakdown shows: included credits line, extras line, total line
- [ ] Cost breakdown shows "Within Budget" or "Over Limit" status badge
- [ ] `npm run build` passes

## Regression risks
- HandleBalanceBar rollover calculation: if balance includes both fresh + rolled over, we need to differentiate. Simplest: rollover = max(0, balance - perCycle)
- Fixed CTA on Plan Detail must not overlap with bottom tab bar (needs proper z-index + bottom offset)

## Visual validation checklist
- [ ] Rollover badge visible when balance exceeds per-cycle
- [ ] Plan Detail CTA fixed at bottom, not scrolling
- [ ] Cost breakdown shows correct line items
- [ ] Dark mode renders correctly
