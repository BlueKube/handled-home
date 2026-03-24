# evaluate-design.py Build Plan

## Architecture

The harness reads `docs/design-guidelines.md`, parses it into sections, and scores it across 12 dimensions with anti-gaming guards. Output format matches evaluate-ux.py (grep-friendly key-value pairs + verbose mode).

## Phases

### Phase 1: Skeleton + Data Structures + Parser (~200 lines)
- Module docstring with dimension descriptions
- Imports (re, sys, json, pathlib, dataclasses, collections, difflib)
- Path constants for all reference files
- `@dataclass Section` — heading level, title, body text, subsections, tables, code blocks
- `@dataclass ScoreResult` — design_score, max_possible, d1 through d12, gaming_penalty, css_penalty, word_count, issues
- `@dataclass Issue` — dimension, message, severity
- `parse_design_guidelines(text) -> list[Section]` — split by H2/H3/H4, extract tables and code blocks
- `parse_index_css(text) -> dict` — extract CSS custom property names and HSL values from :root and .dark
- `count_words(text) -> int`
- `count_tables(text) -> int`
- `count_headings(text, level) -> int`

### Phase 2: Dimensions 1-4 (~300 lines)
- `score_d1_token_architecture(sections, text) -> (float, list[Issue])`
  - Sub-checks: three-tier terms, 8 token categories, dark mode column, naming convention, 40+ token definitions
- `score_d2_dark_mode(sections, text, css_tokens) -> (float, list[Issue])`
  - Sub-checks: dark value ratio (no ---), image guidance, elevation guidance, component dark notes, testing checklist
- `score_d3_animation_motion(sections, text) -> (float, list[Issue])`
  - Sub-checks: cubic-bezier curves (3+), duration scale, prefers-reduced-motion, entry/exit pairs (4+), micro-interactions (3+)
- `score_d4_component_specs(sections, text, ui_components) -> (float, list[Issue])`
  - Sub-checks: component heading count (20+), state coverage, variant/size docs, slot anatomy, usage guidance

### Phase 3: Dimensions 5-8 (~250 lines)
- `score_d5_visual_richness(sections, text) -> (float, list[Issue])`
  - Sub-checks: gradient definitions (3+), shadow levels (4+), surface treatment, illustration guide, image treatment
- `score_d6_form_states(sections, text) -> (float, list[Issue])`
  - Sub-checks: form field states (5+), validation patterns, form element types (6+), form layout rules, multi-step
- `score_d7_empty_loading_error(sections, text) -> (float, list[Issue])`
  - Sub-checks: empty state template, loading variants (3+), error patterns (3+), visual specs, state transitions
- `score_d8_spacing_layout(sections, text) -> (float, list[Issue])`
  - Sub-checks: spacing scale (8+), page templates, z-index scale (4+), density guidance, scroll behavior

### Phase 4: Dimensions 9-12 (~250 lines)
- `score_d9_accessibility(sections, text) -> (float, list[Issue])`
  - Sub-checks: focus management (2+), screen reader guidance, touch target exceptions, color-independent info, testing checklist
- `score_d10_brand_emotional(sections, text) -> (float, list[Issue])`
  - Sub-checks: personality-to-design mappings (3+), UI copy examples (3+), imagery direction, celebration moments, anti-patterns (3+)
- `score_d11_responsive_adaptive(sections, text) -> (float, list[Issue])`
  - Sub-checks: orientation, font scaling, device-size tiers, keyboard avoidance, capacitor/native
- `score_d12_doc_structure(sections, text) -> (float, list[Issue])`
  - Sub-checks: heading depth (H2 8+, H3 15+), consistent component template, cross-references (3+), tables (5+), word count 3k-8k

### Phase 5: Anti-Gaming Guards (~150 lines)
- `guard_word_count(text) -> float` — bell curve: 3k-8k full marks, <2k or >12k penalizes
- `guard_specificity(sections) -> dict` — per-section actionability ratio; cap sections below 0.2
- `guard_duplicate_headings(sections) -> float` — Levenshtein >80% on H2/H3 headings → -1 each
- `guard_css_coherence(text, css_tokens) -> float` — HSL values in doc vs index.css → -0.5 per contradiction
- `guard_boilerplate(text) -> float` — Jaccard >0.8 on 50+ word paragraphs → -0.5 each
- `guard_actionability_ratio(sections) -> dict[str, float]` — per-section cap multiplier

### Phase 6: Composite Scoring + Output (~150 lines)
- `evaluate(path, verbose) -> ScoreResult` — orchestrate all dimensions and guards
  - Read design-guidelines.md
  - Read index.css (for coherence check)
  - Parse both
  - Run D1-D12
  - Apply weights: D1=1.3, D2=1.2, D3=1.1, D4=1.2, D5=1.3, D6=1.0, D7=1.0, D8=0.9, D9=0.9, D10=1.0, D11=0.8, D12=0.7
  - Apply actionability ratio caps per section
  - Apply anti-gaming deductions
  - Compute weighted average → scale to 0-100
- `print_results(result, verbose)` — grep-friendly output matching evaluate-ux.py format
- `if __name__ == "__main__"` — CLI with --verbose flag

## Key Design Decisions

1. **Scoring formula**: weighted_avg = Σ(score_i × weight_i) / Σ(weight_i), then × 10 for 0-100 scale. Anti-gaming penalties deducted from final.
2. **Sub-check pattern**: Each dimension has 5 sub-checks worth 2 points each (0-10 per dimension). Some sub-checks are binary (0 or 2), others are graduated.
3. **Section matching**: Dimensions look for their content in any section (not hardcoded to specific H2 names). This allows flexible doc structure.
4. **Reference file paths**: Relative to the script's parent directory (`Path(__file__).parent`).
5. **CSS parsing**: Simple regex on `--token-name: H S% L%;` pattern from index.css :root and .dark blocks.

## Estimated total: ~1100-1300 lines
