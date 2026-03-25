# Batch 1: File scaffolding, parser, data structures, utilities

## Phase
Phase 1 — Core Infrastructure + D1–D3

## Why it matters
The evaluator needs a solid foundation — parser, data model, and utilities — before any scoring dimensions can be built. This batch establishes the architecture following the same proven pattern as `evaluate-design.py`.

## Scope
- Create `auto/evaluate-provider.py` with shebang, module docstring, imports
- File path constants: `screen-flows.md`, `masterplan.md`, `operating-model.md`
- Dimension weights dict (7 dimensions with specified weights)
- Data classes: `Issue`, `FlowSection`, `ScoreResult`
- Parser: `parse_provider_flows()` — extract flows 17–24, 34, 35 from screen-flows.md by `# FLOW N:` headings; extract screens by `### Screen N.X:` headings within each flow
- Utility functions: `count_words`, `heading_similarity`, `jaccard_similarity`, `count_keyword_matches`, `count_pattern_matches`, `find_screens_matching`

## Non-goals
- No scoring dimensions (D1–D7) — those come in Batches 2–5
- No anti-gaming guards — Batch 6
- No `evaluate()` or `print_results()` — Batch 3
- No CLI entry point — Batch 3

## File targets
| Action | File |
|--------|------|
| Create | `auto/evaluate-provider.py` |

## Acceptance criteria
- [ ] File is executable (`#!/usr/bin/env python3`)
- [ ] `PROVIDER_FLOW_IDS = [17, 18, 19, 20, 21, 22, 23, 24, 34, 35]` constant defined
- [ ] `DIMENSION_WEIGHTS` dict has 7 entries matching plan weights
- [ ] `Issue` dataclass has `dimension`, `message`, `severity` fields
- [ ] `FlowSection` dataclass captures flow number, title, screens (list), body text, full_text
- [ ] `ScoreResult` dataclass has `provider_score`, `max_possible`, 7 dimension scores (d1–d7), `gaming_penalty`, `word_count`, `issues_found`, `issues`
- [ ] `parse_provider_flows(text)` returns list of FlowSection, correctly parsing `# FLOW N:` and `### Screen N.X:` headings
- [ ] All 6 utility functions implemented following evaluate-design.py patterns
- [ ] File imports cleanly: `python3 -c "import auto.evaluate_provider"` or direct import succeeds
- [ ] No syntax errors: `python3 -m py_compile auto/evaluate-provider.py` passes

## Regression risks
- None (new file, no existing code modified)
