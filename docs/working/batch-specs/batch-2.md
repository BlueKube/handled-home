# Batch 2: D1 (Earnings Transparency) + D2 (Schedule Control) scorers

## Phase
Phase 1 — Core Infrastructure + D1–D3

## Why it matters
D1 and D2 are the two highest-weighted dimensions (1.3× and 1.2×). Earnings transparency and schedule control are the core provider value props — getting these scoring functions right anchors the evaluator's ability to detect quality.

## Scope
- `score_d1_earnings_transparency(flows, text)` with 5 sub-checks (2 points each, max 10):
  1. Payout prediction speed — can provider see next payout in 3 seconds? (projection card, stats grid, period selector)
  2. Modifier explanations — human-readable labels on modifiers (quality tier, rush, adjustment)
  3. Projection cards — capacity %, estimated monthly earnings, growth CTA
  4. Held earnings detail — expandable held section with hold reasons, estimated release
  5. Payout account status — ready/not-set-up states, setup CTA
- `score_d2_schedule_control(flows, text)` with 5 sub-checks (2 points each, max 10):
  1. Route lock UX — lock/unlock banner, stop count, projected earnings
  2. Queue breadcrumb — "Stop X of Y" with prev/next navigation
  3. Route optimization — optimize button, reorder, tooltip
  4. Availability management — coverage zones, capacity, availability section
  5. Job list views — map/list toggle, tabs (Today/Week/All), job cards

## Non-goals
- No D3–D7 scorers
- No evaluate() or print_results() changes
- No anti-gaming guards

## File targets
| Action | File |
|--------|------|
| Modify | `auto/evaluate-provider.py` |

## Acceptance criteria
- [ ] `score_d1_earnings_transparency()` returns `tuple[float, list[Issue]]`
- [ ] D1 has 5 sub-checks, each worth 0–2 points
- [ ] `score_d2_schedule_control()` returns `tuple[float, list[Issue]]`
- [ ] D2 has 5 sub-checks, each worth 0–2 points
- [ ] Both functions use `count_keyword_matches`, `count_pattern_matches`, `find_screens_matching` utilities
- [ ] Issues are reported with dimension name and descriptive message
- [ ] Functions compile: `python3 -m py_compile auto/evaluate-provider.py` passes

## Regression risks
- Must not modify existing parser, data structures, or utility functions
