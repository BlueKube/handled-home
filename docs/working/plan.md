# Plan: Provider Experience Auto-Evaluator

## Session Handoff

**Last updated:** 2026-03-25
**Status:** Starting Phase 1, Batch 1
**Next action:** Write batch-spec for Batch 1, then implement scaffolding + parser + utilities
**Branch:** `claude/implement-plan-workflow-qVflr`

## Progress Table

| Batch | Phase | Description | Size | Review | Status |
|-------|-------|-------------|------|--------|--------|
| 1 | Phase 1 | File scaffolding, parser, data structures, utilities | Medium | `review: full` | ⬜ |
| 2 | Phase 1 | D1 (Earnings Transparency) + D2 (Schedule Control) | Medium | `review: full` | ⬜ |
| 3 | Phase 1 | D3 (Fairness Signals) + evaluate() shell + output | Medium | `review: full` | ⬜ |
| 4 | Phase 2 | D4 (Onboarding Friction) + D5 (Retention Hooks) | Medium | `review: full` | ⬜ |
| 5 | Phase 2 | D6 (BYOC Tools) + D7 (Cognitive Walkthroughs) | Medium | `review: full` | ⬜ |
| 6 | Phase 2 | Anti-gaming guards + evaluate() completion + validation | Large | `review: full` | ⬜ |
| 7 | Phase 3 | Documentation sync | Small | `review: verify` | ⬜ |

## Goal

Build `auto/evaluate-provider.py` — a 7-dimension scoring harness that evaluates provider experience quality in `docs/screen-flows.md` (Flows 17–24, 34–35). Follows the same architecture as `evaluate-design.py`. Expected baseline: ~55–65.

## 7 Scoring Dimensions

| Dim | Name | Weight | What It Checks |
|-----|------|--------|----------------|
| D1 | Earnings Transparency | 1.3× | Can provider predict next payout in 3 seconds? Modifier explanations, projection cards, held earnings detail, payout status |
| D2 | Schedule Control | 1.2× | Route lock, queue breadcrumb, map/list toggle, route optimization, stop tracking, availability management |
| D3 | Fairness Signals | 1.2× | Route density messaging, guaranteed payout framing, no-tip-dependency language, transparent modifiers, minimum earnings signals |
| D4 | Onboarding Friction | 1.1× | Steps to first job (currently 6), progressive disclosure, resume state, compliance UX, invite code flow |
| D5 | Retention Hooks | 1.0× | Milestone celebrations, performance feedback, growth path, streaks, capacity meter, quality score, insights |
| D6 | BYOC Provider Tools | 1.0× | Invite management, link creation, activation tracking, scripts/templates, bonus framing, rate limiting |
| D7 | Cognitive Walkthroughs | 0.9× | First week journey, checking earnings journey, handling dispute journey — end-to-end path completeness |

## Anti-Gaming Guards

1. **Word-count bell curve** — Provider flows should be 4k–10k words (sweet spot)
2. **Duplicate screen detection** — Screen headings >80% similar
3. **Boilerplate detection** — Jaccard >0.8 on 50+ word blocks
4. **Masterplan coherence** — Cross-reference provider promises in masterplan.md against flow content
5. **Flow completeness** — All 10 expected flows (17–24, 34, 35) must be present

## Phase 1: Core Infrastructure + D1–D3 (3 batches)

### Batch 1: File scaffolding, parser, data structures, utilities
- Shebang, docstring, imports
- File paths (screen-flows.md, masterplan.md, operating-model.md)
- Dimension weights dict
- Data classes: `Issue`, `FlowSection`, `ScoreResult`
- Parser: extract provider flows (17–24, 34, 35) from screen-flows.md by `# FLOW N:` and `### Screen N.X:` headings
- Utility functions: `count_words`, `heading_similarity`, `jaccard_similarity`, `count_keyword_matches`, `count_pattern_matches`, `find_screens_matching`

### Batch 2: D1 (Earnings Transparency) + D2 (Schedule Control) scorers
- D1: 5 sub-checks — payout prediction speed, modifier explanations, projection cards, held earnings detail, payout account status
- D2: 5 sub-checks — route lock UX, queue breadcrumb, route optimization, availability management, job list views (map/list/tabs)

### Batch 3: D3 (Fairness Signals) scorer + evaluate() shell + output
- D3: 5 sub-checks — guaranteed payout framing, no-tip language, density messaging, transparent modifiers, minimum earnings signals
- `evaluate()` function (scoring D1–D3 only, other dims return 0.0 placeholder)
- `print_results()` with YAML header + verbose bar chart + issues
- CLI entry point (`__main__`)
- Validate: `python3 auto/evaluate-provider.py -v` runs and produces baseline

## Phase 2: D4–D7 + Anti-Gaming (3 batches)

### Batch 4: D4 (Onboarding Friction) + D5 (Retention Hooks) scorers
- D4: 5 sub-checks — step count, progressive disclosure, resume/draft state, compliance UX, invite code flow clarity
- D5: 5 sub-checks — celebration screens, performance/quality score, insights/coaching, growth path signals, capacity/streak gamification

### Batch 5: D6 (BYOC Tools) + D7 (Cognitive Walkthroughs) scorers
- D6: 5 sub-checks — invite link creation, activation tracking, invite scripts, bonus framing, rate limiting/compliance
- D7: 5 sub-checks — first-week path completeness, earnings-check path, dispute-handling path, empty-state coverage, error-state coverage

### Batch 6: Anti-gaming guards + evaluate() completion + final validation
- All 5 guards implemented
- `evaluate()` wired to all 7 dimensions + guards
- Run baseline, confirm score 55–65
- Fix any calibration issues

## Phase 3: Documentation Sync
- Update feature-list.md with new evaluator
- No other docs affected (this is tooling, not product)
