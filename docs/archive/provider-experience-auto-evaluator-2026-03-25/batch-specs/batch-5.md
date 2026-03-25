# Batch 5: D6 (BYOC Tools) + D7 (Cognitive Walkthroughs) scorers

## Phase
Phase 2 — D4–D7 + Anti-Gaming

## Why it matters
D6 evaluates provider-facing BYOC tools that drive organic growth. D7 evaluates end-to-end path completeness for critical provider journeys. Together they complete the 7-dimension scoring.

## Scope
- `score_d6_byoc_tools(flows, all_text)` with 5 sub-checks:
  1. Invite link creation — create link, form, category/zone selection
  2. Activation tracking — activations count, stats grid, event list
  3. Invite scripts — pre-written templates, copy buttons, tone badges
  4. Bonus framing — BYOC bonuses, incentive, earn more
  5. Rate limiting/compliance — daily limit, max links, compliance reminder
- `score_d7_cognitive_walkthroughs(flows, all_text)` with 5 sub-checks:
  1. First-week path — onboarding → dashboard → first job → complete → earnings
  2. Earnings-check path — dashboard → earnings tab → period → modifiers → payout
  3. Dispute-handling path — report issue, contact support, error states
  4. Empty-state coverage — all flows have empty states
  5. Error-state coverage — all flows have error states
- Wire D6 and D7 into evaluate() (replacing 0.0 placeholders)

## File targets
| Action | File |
|--------|------|
| Modify | `auto/evaluate-provider.py` |

## Acceptance criteria
- [ ] Both functions return `tuple[float, list[Issue]]` with 5 sub-checks each
- [ ] evaluate() wires D6 and D7 (no more 0.0 placeholders)
- [ ] `python3 auto/evaluate-provider.py -v` runs and shows all 7 dimensions scored
- [ ] No modifications to D1-D5 scorers

## Regression risks
- Must not modify D1-D5 scoring functions
