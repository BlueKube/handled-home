#!/usr/bin/env python3
"""
evaluate-design.py — 12-Dimension Design System Scoring Harness
================================================================

Analogous to evaluate-ux.py: this file is READ-ONLY for the agent.
It parses docs/design-guidelines.md and scores it. HIGHER design_score = better.

## 12 Scoring Dimensions (weighted)

D1.  Token Architecture Depth         (1.3×) — 3-tier hierarchy, 8 categories, 40+ tokens
D2.  Dark Mode Completeness           (1.2×) — every token has dark value, guidance, checklist
D3.  Animation & Motion System        (1.1×) — easing curves, duration scale, reduced-motion
D4.  Component Spec Coverage           (1.2×) — 20+ components, states, anatomy, usage
D5.  Visual Richness & Depth          (1.3×) — gradients, shadows, surfaces, illustration
D6.  Form & Input States              (1.0×) — field anatomy, validation, element types
D7.  Empty/Loading/Error Patterns     (1.0×) — state templates, variants, transitions
D8.  Spacing & Layout System          (0.9×) — scale, templates, z-index, density
D9.  Accessibility Beyond Contrast    (0.9×) — focus mgmt, screen reader, touch targets
D10. Brand & Emotional Design         (1.0×) — personality→design maps, copy, delight
D11. Responsive & Adaptive            (0.8×) — orientation, font scale, capacitor
D12. Doc Structure & Navigability     (0.7×) — heading hierarchy, tables, cross-refs

## Anti-Gaming Guards

1. Word-count bell curve (3k–8k sweet spot)
2. Specificity requirement (actual values: px, ms, HSL, cubic-bezier)
3. Duplicate heading detection (Levenshtein >80%)
4. CSS coherence check (HSL values vs index.css)
5. Boilerplate detection (Jaccard >0.8 on 50+ word paragraphs)
6. Actionability ratio (sections <20% actionable lines capped at 50%)
7. Component cross-reference (screen-flows.md coverage, informational)

Output (grep-friendly):
  design_score:        42.50
  max_possible:       100.00
  d1_tokens:            6.20
  ...
  issues_found:         18
"""

import re
import sys
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional
from collections import Counter
from difflib import SequenceMatcher


# ─── File Paths ──────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent

DESIGN_GUIDELINES_PATH = PROJECT_ROOT / "docs" / "design-guidelines.md"
INDEX_CSS_PATH = PROJECT_ROOT / "src" / "index.css"
SCREEN_FLOWS_PATH = PROJECT_ROOT / "docs" / "screen-flows.md"
MASTERPLAN_PATH = PROJECT_ROOT / "docs" / "masterplan.md"
UI_COMPONENTS_DIR = PROJECT_ROOT / "src" / "components" / "ui"


# ─── Dimension Weights ───────────────────────────────────────────────────────

DIMENSION_WEIGHTS = {
    "d1_tokens": 1.3,
    "d2_dark": 1.2,
    "d3_motion": 1.1,
    "d4_components": 1.2,
    "d5_richness": 1.3,
    "d6_forms": 1.0,
    "d7_states": 1.0,
    "d8_spacing": 0.9,
    "d9_a11y": 0.9,
    "d10_brand": 1.0,
    "d11_responsive": 0.8,
    "d12_structure": 0.7,
}


# ─── Data Structures ─────────────────────────────────────────────────────────

@dataclass
class Issue:
    dimension: str
    message: str
    severity: int = 1  # 1=info, 2=notable, 3=critical


@dataclass
class Section:
    level: int          # 2=H2, 3=H3, 4=H4
    title: str
    body: str           # raw text of the section (excluding subsections)
    full_text: str      # raw text including subsections
    line_start: int
    subsections: list = field(default_factory=list)  # list[Section]


@dataclass
class CSSTokens:
    light: dict = field(default_factory=dict)  # name -> "H S% L%" string
    dark: dict = field(default_factory=dict)


@dataclass
class ScoreResult:
    design_score: float
    max_possible: float
    # Per-dimension scores (0-10 each)
    d1_tokens: float
    d2_dark: float
    d3_motion: float
    d4_components: float
    d5_richness: float
    d6_forms: float
    d7_states: float
    d8_spacing: float
    d9_a11y: float
    d10_brand: float
    d11_responsive: float
    d12_structure: float
    # Anti-gaming
    gaming_penalty: float
    css_penalty: float
    actionability_caps: int  # number of sections capped
    # Metadata
    word_count: int
    issues_found: int
    issues: list = field(default_factory=list)


# ─── Parser: Design Guidelines ──────────────────────────────────────────────

def parse_design_guidelines(text: str) -> list[Section]:
    """Parse design-guidelines.md into a tree of Section objects by heading level."""
    lines = text.split("\n")
    sections: list[Section] = []
    stack: list[Section] = []  # current nesting stack

    heading_re = re.compile(r'^(#{2,4})\s+(.+)$')

    i = 0
    while i < len(lines):
        match = heading_re.match(lines[i])
        if match:
            level = len(match.group(1))
            title = match.group(2).strip()

            # Collect body text until next heading of same or higher level
            body_lines = []
            full_lines = []
            j = i + 1
            while j < len(lines):
                next_match = heading_re.match(lines[j])
                if next_match and len(next_match.group(1)) <= level:
                    break
                full_lines.append(lines[j])
                # Body = lines before any sub-heading
                if not next_match:
                    body_lines.append(lines[j])
                elif next_match and len(next_match.group(1)) > level:
                    # Stop collecting body, but keep collecting full_text
                    body_lines = body_lines  # freeze body here
                j += 1

            # Re-collect body properly: only lines before first sub-heading
            body_lines = []
            for k in range(i + 1, j):
                sub_match = heading_re.match(lines[k])
                if sub_match and len(sub_match.group(1)) > level:
                    break
                body_lines.append(lines[k])

            section = Section(
                level=level,
                title=title,
                body="\n".join(body_lines),
                full_text="\n".join(full_lines),
                line_start=i + 1,
            )

            # Place in tree
            while stack and stack[-1].level >= level:
                stack.pop()

            if stack:
                stack[-1].subsections.append(section)
            else:
                sections.append(section)

            stack.append(section)

        i += 1

    return sections


def get_all_sections(sections: list[Section]) -> list[Section]:
    """Flatten section tree into a list."""
    result = []
    for s in sections:
        result.append(s)
        result.extend(get_all_sections(s.subsections))
    return result


# ─── Parser: index.css ──────────────────────────────────────────────────────

def parse_index_css(css_text: str) -> CSSTokens:
    """Extract CSS custom properties and their HSL values from index.css."""
    tokens = CSSTokens()

    # Split into :root and .dark blocks
    root_match = re.search(r':root\s*\{([^}]+)\}', css_text, re.DOTALL)
    dark_match = re.search(r'\.dark\s*\{([^}]+)\}', css_text, re.DOTALL)

    token_re = re.compile(r'--([a-z-]+):\s*(.+?);')

    if root_match:
        for m in token_re.finditer(root_match.group(1)):
            tokens.light[m.group(1)] = m.group(2).strip()

    if dark_match:
        for m in token_re.finditer(dark_match.group(1)):
            tokens.dark[m.group(1)] = m.group(2).strip()

    return tokens


# ─── Parser: UI Component file list ─────────────────────────────────────────

def get_ui_component_names() -> list[str]:
    """List actual component file names from src/components/ui/."""
    if not UI_COMPONENTS_DIR.exists():
        return []
    names = []
    for f in sorted(UI_COMPONENTS_DIR.glob("*.tsx")):
        # e.g., "button.tsx" -> "button", "alert-dialog.tsx" -> "alert-dialog"
        names.append(f.stem)
    return names


# ─── Utility Functions ───────────────────────────────────────────────────────

def count_words(text: str) -> int:
    """Count words in text, excluding markdown syntax artifacts."""
    # Remove code blocks
    cleaned = re.sub(r'```[\s\S]*?```', '', text)
    # Remove table separators
    cleaned = re.sub(r'\|[-:]+\|', '', cleaned)
    # Remove markdown syntax
    cleaned = re.sub(r'[#*`|>_\[\]]', ' ', cleaned)
    return len(cleaned.split())


def count_tables(text: str) -> int:
    """Count markdown tables (sequences of lines with | delimiters)."""
    table_count = 0
    in_table = False
    for line in text.split("\n"):
        is_table_line = bool(re.match(r'\s*\|.+\|', line))
        if is_table_line and not in_table:
            table_count += 1
            in_table = True
        elif not is_table_line:
            in_table = False
    return table_count


def count_headings_at_level(text: str, level: int) -> int:
    """Count headings at a specific level (2=##, 3=###, 4=####)."""
    pattern = r'^' + '#' * level + r'\s+.+'
    return len(re.findall(pattern, text, re.MULTILINE))


def count_actionable_lines(text: str) -> tuple[int, int]:
    """Count lines with concrete values vs total non-empty lines.

    Returns (actionable_count, total_count).
    Actionable = contains px, ms, rem, HSL, hex color, cubic-bezier, rgba,
                 class name (.text-*, .animate-*, etc), or component name.
    """
    actionable_re = re.compile(
        r'\d+px|\d+ms|\d+rem|'
        r'hsl\(|#[0-9a-fA-F]{3,8}\b|cubic-bezier|rgba?\(|'
        r'\.\w+[-\w]*|'  # class names like .text-h1, .glass
        r'rounded-|shadow-|bg-|text-|border-|p-|m-|gap-|w-|h-|'
        r'scale-\[|duration-|ease-|opacity-'
    )
    total = 0
    actionable = 0
    for line in text.split("\n"):
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            continue
        total += 1
        if actionable_re.search(stripped):
            actionable += 1
    return actionable, total


def heading_similarity(a: str, b: str) -> float:
    """Levenshtein-based similarity ratio between two heading strings."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def jaccard_similarity(a: str, b: str) -> float:
    """Word-level Jaccard similarity between two strings."""
    words_a = set(a.lower().split())
    words_b = set(b.lower().split())
    if not words_a or not words_b:
        return 0.0
    return len(words_a & words_b) / len(words_a | words_b)


def find_sections_matching(sections: list[Section], keywords: list[str]) -> list[Section]:
    """Find sections whose title or body contains any of the keywords (case-insensitive)."""
    results = []
    all_secs = get_all_sections(sections)
    for s in all_secs:
        combined = (s.title + " " + s.full_text).lower()
        if any(kw.lower() in combined for kw in keywords):
            results.append(s)
    return results


def count_keyword_matches(text: str, keywords: list[str]) -> int:
    """Count how many of the keywords appear in text (case-insensitive). Returns distinct count."""
    text_lower = text.lower()
    return sum(1 for kw in keywords if kw.lower() in text_lower)


def count_pattern_matches(text: str, pattern: str) -> int:
    """Count regex matches in text."""
    return len(re.findall(pattern, text, re.IGNORECASE | re.MULTILINE))


# ─── Placeholder: Dimensions D1-D12 (Phase 2-4) ─────────────────────────────

def score_d1_token_architecture(sections, text):
    return 0.0, []

def score_d2_dark_mode(sections, text, css_tokens):
    return 0.0, []

def score_d3_animation_motion(sections, text):
    return 0.0, []

def score_d4_component_specs(sections, text, ui_components):
    return 0.0, []

def score_d5_visual_richness(sections, text):
    return 0.0, []

def score_d6_form_states(sections, text):
    return 0.0, []

def score_d7_empty_loading_error(sections, text):
    return 0.0, []

def score_d8_spacing_layout(sections, text):
    return 0.0, []

def score_d9_accessibility(sections, text):
    return 0.0, []

def score_d10_brand_emotional(sections, text):
    return 0.0, []

def score_d11_responsive_adaptive(sections, text):
    return 0.0, []

def score_d12_doc_structure(sections, text):
    return 0.0, []


# ─── Placeholder: Anti-Gaming Guards (Phase 5) ──────────────────────────────

def calculate_gaming_penalty(sections, text):
    return 0.0, []

def calculate_css_penalty(text, css_tokens):
    return 0.0, []

def calculate_actionability_caps(sections):
    return 0, {}


# ─── Main Evaluation (Phase 6 will flesh out) ───────────────────────────────

def evaluate(path: Optional[str] = None, verbose: bool = False) -> ScoreResult:
    """Run full 12-dimension evaluation."""
    filepath = Path(path) if path else DESIGN_GUIDELINES_PATH
    if not filepath.exists():
        print(f"ERROR: {filepath} not found", file=sys.stderr)
        sys.exit(1)

    text = filepath.read_text(encoding="utf-8")
    sections = parse_design_guidelines(text)

    # Load reference files
    css_tokens = CSSTokens()
    if INDEX_CSS_PATH.exists():
        css_tokens = parse_index_css(INDEX_CSS_PATH.read_text(encoding="utf-8"))

    ui_components = get_ui_component_names()

    all_issues = []

    # ─── D1-D12 Scoring ───
    d1, issues = score_d1_token_architecture(sections, text)
    all_issues.extend(issues)

    d2, issues = score_d2_dark_mode(sections, text, css_tokens)
    all_issues.extend(issues)

    d3, issues = score_d3_animation_motion(sections, text)
    all_issues.extend(issues)

    d4, issues = score_d4_component_specs(sections, text, ui_components)
    all_issues.extend(issues)

    d5, issues = score_d5_visual_richness(sections, text)
    all_issues.extend(issues)

    d6, issues = score_d6_form_states(sections, text)
    all_issues.extend(issues)

    d7, issues = score_d7_empty_loading_error(sections, text)
    all_issues.extend(issues)

    d8, issues = score_d8_spacing_layout(sections, text)
    all_issues.extend(issues)

    d9, issues = score_d9_accessibility(sections, text)
    all_issues.extend(issues)

    d10, issues = score_d10_brand_emotional(sections, text)
    all_issues.extend(issues)

    d11, issues = score_d11_responsive_adaptive(sections, text)
    all_issues.extend(issues)

    d12, issues = score_d12_doc_structure(sections, text)
    all_issues.extend(issues)

    # ─── Anti-Gaming ───
    gaming_penalty, g_issues = calculate_gaming_penalty(sections, text)
    all_issues.extend(g_issues)

    css_penalty, c_issues = calculate_css_penalty(text, css_tokens)
    all_issues.extend(c_issues)

    actionability_caps, cap_map = calculate_actionability_caps(sections)

    # ─── Composite Score ───
    scores = {
        "d1_tokens": d1, "d2_dark": d2, "d3_motion": d3, "d4_components": d4,
        "d5_richness": d5, "d6_forms": d6, "d7_states": d7, "d8_spacing": d8,
        "d9_a11y": d9, "d10_brand": d10, "d11_responsive": d11, "d12_structure": d12,
    }

    weighted_sum = sum(scores[k] * DIMENSION_WEIGHTS[k] for k in scores)
    total_weight = sum(DIMENSION_WEIGHTS.values())
    weighted_avg = weighted_sum / total_weight  # 0-10

    # Scale to 0-100, apply penalties
    composite = weighted_avg * 10.0 - gaming_penalty - css_penalty
    composite = max(min(composite, 100.0), 0.0)

    return ScoreResult(
        design_score=round(composite, 2),
        max_possible=100.0,
        d1_tokens=round(d1, 2),
        d2_dark=round(d2, 2),
        d3_motion=round(d3, 2),
        d4_components=round(d4, 2),
        d5_richness=round(d5, 2),
        d6_forms=round(d6, 2),
        d7_states=round(d7, 2),
        d8_spacing=round(d8, 2),
        d9_a11y=round(d9, 2),
        d10_brand=round(d10, 2),
        d11_responsive=round(d11, 2),
        d12_structure=round(d12, 2),
        gaming_penalty=round(gaming_penalty, 2),
        css_penalty=round(css_penalty, 2),
        actionability_caps=actionability_caps,
        word_count=count_words(text),
        issues_found=len(all_issues),
        issues=all_issues,
    )


# ─── Output ──────────────────────────────────────────────────────────────────

def print_results(result: ScoreResult, verbose: bool = False):
    """Print results in grep-friendly format."""
    print("---")
    print(f"design_score:        {result.design_score:.2f}")
    print(f"max_possible:        {result.max_possible:.2f}")
    print(f"d1_tokens:           {result.d1_tokens:.2f}")
    print(f"d2_dark:             {result.d2_dark:.2f}")
    print(f"d3_motion:           {result.d3_motion:.2f}")
    print(f"d4_components:       {result.d4_components:.2f}")
    print(f"d5_richness:         {result.d5_richness:.2f}")
    print(f"d6_forms:            {result.d6_forms:.2f}")
    print(f"d7_states:           {result.d7_states:.2f}")
    print(f"d8_spacing:          {result.d8_spacing:.2f}")
    print(f"d9_a11y:             {result.d9_a11y:.2f}")
    print(f"d10_brand:           {result.d10_brand:.2f}")
    print(f"d11_responsive:      {result.d11_responsive:.2f}")
    print(f"d12_structure:       {result.d12_structure:.2f}")
    print(f"gaming_penalty:      {result.gaming_penalty:.2f}")
    print(f"css_penalty:         {result.css_penalty:.2f}")
    print(f"actionability_caps:  {result.actionability_caps}")
    print(f"word_count:          {result.word_count}")
    print(f"issues_found:        {result.issues_found}")
    print("---")

    if verbose:
        # Dimension breakdown with bar chart
        print(f"\n## Score Breakdown")
        dimensions = [
            ("D1  Tokens", result.d1_tokens, 1.3),
            ("D2  Dark Mode", result.d2_dark, 1.2),
            ("D3  Motion", result.d3_motion, 1.1),
            ("D4  Components", result.d4_components, 1.2),
            ("D5  Richness", result.d5_richness, 1.3),
            ("D6  Forms", result.d6_forms, 1.0),
            ("D7  States", result.d7_states, 1.0),
            ("D8  Spacing", result.d8_spacing, 0.9),
            ("D9  A11y", result.d9_a11y, 0.9),
            ("D10 Brand", result.d10_brand, 1.0),
            ("D11 Responsive", result.d11_responsive, 0.8),
            ("D12 Structure", result.d12_structure, 0.7),
        ]
        for name, score, weight in dimensions:
            filled = int(score)
            bar = "█" * filled + "░" * (10 - filled)
            print(f"  {name:18s} {bar} {score:.1f}/10  (×{weight})")

        if result.gaming_penalty > 0:
            print(f"\n  Gaming penalty:    -{result.gaming_penalty:.1f}")
        if result.css_penalty > 0:
            print(f"  CSS penalty:       -{result.css_penalty:.1f}")
        if result.actionability_caps > 0:
            print(f"  Sections capped:   {result.actionability_caps}")

        print(f"\n  Word count:        {result.word_count}")

        # Issues
        if result.issues:
            by_dim = Counter(i.dimension for i in result.issues)
            print(f"\n## Issues by Dimension")
            for dim, count in sorted(by_dim.items(), key=lambda x: -x[1]):
                print(f"  {dim:25s} {count:3d}")

            notable = [i for i in result.issues if i.severity >= 2]
            if notable:
                print(f"\n## Notable Issues (severity 2+) — {len(notable)} total")
                for issue in notable[:30]:
                    print(f"  [{issue.dimension}] {issue.message}")


if __name__ == "__main__":
    verbose = "--verbose" in sys.argv or "-v" in sys.argv
    path = None
    for arg in sys.argv[1:]:
        if not arg.startswith("-"):
            path = arg
            break

    result = evaluate(path, verbose=verbose)
    print_results(result, verbose=verbose)
