# Batch 4: D4 (Onboarding Friction) + D5 (Retention Hooks) scorers

## Phase
Phase 2 — D4–D7 + Anti-Gaming

## Why it matters
D4 measures how frictionless the onboarding flow is (fewer steps = better). D5 measures retention features that keep providers engaged long-term.

## Scope
- `score_d4_onboarding_friction(flows, all_text)` with 5 sub-checks:
  1. Step count — how many steps to first job (6 currently specified)
  2. Progressive disclosure — skip options, "complete later" patterns
  3. Resume/draft state — ability to resume incomplete onboarding
  4. Compliance UX — clear compliance steps, status badges
  5. Invite code flow — code entry, validation, error states
- `score_d5_retention_hooks(flows, all_text)` with 5 sub-checks:
  1. Celebration screens — job complete celebration, party popper, trophy
  2. Performance/quality score — quality rating, feedback, metrics
  3. Insights/coaching — business insights, growth recommendations
  4. Growth path signals — capacity %, fill schedule, earn more
  5. Capacity/streak gamification — route progress, streaks, milestones

## File targets
| Action | File |
|--------|------|
| Modify | `auto/evaluate-provider.py` |

## Acceptance criteria
- [ ] Both functions return `tuple[float, list[Issue]]` with 5 sub-checks each
- [ ] evaluate() wires D4 and D5 (replacing 0.0 placeholders)
- [ ] `python3 auto/evaluate-provider.py -v` runs and shows D4/D5 scores
- [ ] No modifications to D1-D3 scorers

## Regression risks
- Must not modify D1-D3 scoring functions
