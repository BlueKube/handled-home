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

1. Word-count bell curve (3k–8k sweet spot, floor at 1.5k with gentle ramp)
2. Specificity requirement (actual values: px, ms, HSL, cubic-bezier)
3. Duplicate heading detection (Levenshtein >80%)
4. CSS coherence check (HSL token values vs index.css + gradient/shadow HSL validation)
5. Boilerplate detection (Jaccard >0.8 on 50+ word paragraphs)
6. Actionability ratio (sections <20% actionable lines capped at 50%)
7. Component cross-reference (screen-flows.md coverage, informational)

## v2 Changes (2026-03-24)

- D4: Component detection scoped to ## Components parent section + .tsx filename
  match. PascalCase-only fallback removed — eliminates false positives from
  non-component headings like "Spacing Scale" or "Dark Elevation Model".
- D4: Anatomy sub-check uses → chain patterns and "slot"/"anatomy" + structural
  terms instead of counting common English words (content, label, end, start).
- D5/Guard 4: Gradient and shadow hsl() values cross-checked against index.css
  known token values. Invented hsl() calls penalised 0.25 each (cap 2.0).
- Guard 1: Word-count floor lowered from 2,000 to 1,500 with gentler ramp curve.
  1,500–2,000 is a soft warning zone (0.5 penalty) instead of hard cliff.
- D12: "Consistent component template" sub-check now measures information
  consistency (do ≥60% of component specs include states, variants, usage?)
  rather than requiring H4 sub-heading nesting patterns.

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


# ─── Dimension 1: Token Architecture Depth (1.3×) ───────────────────────────

# Token categories we expect a mature design system to cover
TOKEN_CATEGORIES = [
    "color", "spacing", "typography", "elevation", "shadow",
    "radius", "opacity", "duration", "z-index",
]

# Terms indicating three-tier token architecture
TIER_PRIMITIVE = ["primitive", "base", "foundation", "raw", "core value"]
TIER_SEMANTIC = ["semantic", "alias", "purpose", "contextual", "role"]
TIER_COMPONENT = ["component", "specific", "override", "local"]


def score_d1_token_architecture(sections: list[Section], text: str) -> tuple[float, list[Issue]]:
    """D1: Token Architecture Depth — 3-tier hierarchy, categories, naming."""
    issues = []
    points = 0.0  # max 10 (5 sub-checks × 2 points each)
    text_lower = text.lower()

    # Sub-check 1: Three-tier structure (0-2 points)
    tiers_found = 0
    if any(t in text_lower for t in TIER_PRIMITIVE):
        tiers_found += 1
    if any(t in text_lower for t in TIER_SEMANTIC):
        tiers_found += 1
    if any(t in text_lower for t in TIER_COMPONENT):
        tiers_found += 1

    if tiers_found >= 3:
        points += 2.0
    elif tiers_found == 2:
        points += 1.2
    elif tiers_found == 1:
        points += 0.5
    else:
        issues.append(Issue("D1_tokens", "No three-tier token hierarchy (primitive/semantic/component)", 2))

    # Sub-check 2: Token category coverage (0-2 points)
    categories_covered = count_keyword_matches(text, TOKEN_CATEGORIES)
    cat_ratio = min(categories_covered / 8, 1.0)  # 8 categories = full marks
    points += cat_ratio * 2.0
    if categories_covered < 4:
        issues.append(Issue("D1_tokens", f"Only {categories_covered}/8 token categories covered", 2))

    # Sub-check 3: Dark mode column/section for tokens (0-2 points)
    # Look for dark mode values alongside token definitions
    has_dark_tokens = bool(re.search(
        r'dark|\.dark|dark\s*mode|dark\s*value|dark\s*theme', text_lower
    ))
    # Check for actual dark values in tables (| ... | dark ... |)
    dark_table_rows = count_pattern_matches(text, r'\|[^|]*dark[^|]*\|')
    if has_dark_tokens and dark_table_rows >= 3:
        points += 2.0
    elif has_dark_tokens:
        points += 1.0
    else:
        issues.append(Issue("D1_tokens", "No dark mode values alongside token definitions", 2))

    # Sub-check 4: Naming convention documented (0-2 points)
    naming_patterns = count_pattern_matches(text, r'--[a-z]+-[a-z]+-[a-z]+|naming\s*convention|naming\s*pattern|BEM|token\s*nam')
    if naming_patterns >= 3:
        points += 2.0
    elif naming_patterns >= 1:
        points += 1.0
    else:
        issues.append(Issue("D1_tokens", "No token naming convention documented", 1))

    # Sub-check 5: Individual token count (0-2 points)
    # Count table rows and list items in token-related sections
    token_defs = count_pattern_matches(text, r'^\s*\|[^|]+\|[^|]+\|')  # table rows
    token_defs += count_pattern_matches(text, r'^\s*--[a-z]')  # CSS custom property definitions
    token_sections = find_sections_matching(sections, ["token", "color", "spacing", "typography", "elevation", "shadow"])
    for s in token_sections:
        token_defs += len(re.findall(r'^\s*[-*]\s+', s.full_text, re.MULTILINE))

    # Deduplicate rough count — expect 40+ for full marks
    est_tokens = min(token_defs, 100)  # cap counting artifacts
    if est_tokens >= 40:
        points += 2.0
    elif est_tokens >= 25:
        points += 1.5
    elif est_tokens >= 15:
        points += 1.0
    elif est_tokens >= 5:
        points += 0.5
    else:
        issues.append(Issue("D1_tokens", f"Only ~{est_tokens} token definitions found (need 40+)", 2))

    return min(points, 10.0), issues


# ─── Dimension 2: Dark Mode Completeness (1.2×) ─────────────────────────────

def score_d2_dark_mode(sections: list[Section], text: str, css_tokens: CSSTokens) -> tuple[float, list[Issue]]:
    """D2: Dark Mode Completeness — every token has dark value, guidance, checklist."""
    issues = []
    points = 0.0
    text_lower = text.lower()

    # Sub-check 1: Dark value ratio — no placeholder dashes (0-2 points)
    # Look for token table rows with "---" or "—" in dark column
    placeholder_dashes = len(re.findall(r'\|\s*[—–-]{1,3}\s*\|', text))
    # Count total token table rows (rows with | token | light | dark | pattern)
    token_rows = len(re.findall(r'\|\s*`?--[a-z]', text))
    if token_rows == 0:
        # Fall back: count any table rows in color sections
        color_sections = find_sections_matching(sections, ["color", "dark", "theme"])
        for s in color_sections:
            token_rows += len(re.findall(r'\|.+\|.+\|', s.full_text))

    if token_rows > 0:
        if placeholder_dashes == 0:
            points += 2.0
        else:
            ratio = 1.0 - (placeholder_dashes / max(token_rows, 1))
            points += max(ratio * 2.0, 0.0)
            issues.append(Issue("D2_dark", f"{placeholder_dashes} tokens have placeholder '---' for dark values", 2))
    else:
        issues.append(Issue("D2_dark", "No token table with dark values found", 2))

    # Sub-check 2: Dark-mode image/illustration guidance (0-2 points)
    dark_sections = find_sections_matching(sections, ["dark"])
    dark_text = " ".join(s.full_text for s in dark_sections).lower()
    image_kws = ["image", "illustration", "photo", "dimm", "overlay", "brightness", "desaturat"]
    image_hits = count_keyword_matches(dark_text, image_kws)
    if image_hits >= 2:
        points += 2.0
    elif image_hits >= 1:
        points += 1.0
    else:
        issues.append(Issue("D2_dark", "No dark-mode image/illustration guidance", 1))

    # Sub-check 3: Dark-mode elevation guidance (0-2 points)
    elevation_kws = ["elevation", "shadow", "luminance", "surface", "lightness"]
    elevation_hits = count_keyword_matches(dark_text, elevation_kws)
    if elevation_hits >= 2:
        points += 2.0
    elif elevation_hits >= 1:
        points += 1.0
    else:
        issues.append(Issue("D2_dark", "No dark-mode elevation/shadow guidance", 1))

    # Sub-check 4: Component-specific dark overrides (0-2 points)
    # Look for component names mentioned in dark-mode context
    component_kws = ["button", "card", "input", "badge", "toast", "tab", "sheet", "dialog",
                     "navigation", "sidebar", "skeleton", "stat"]
    dark_component_hits = count_keyword_matches(dark_text, component_kws)
    if dark_component_hits >= 5:
        points += 2.0
    elif dark_component_hits >= 3:
        points += 1.5
    elif dark_component_hits >= 1:
        points += 0.5
    else:
        issues.append(Issue("D2_dark", "No component-specific dark mode overrides documented", 1))

    # Sub-check 5: Dark-mode testing checklist (0-2 points)
    testing_kws = ["test", "checklist", "verify", "check", "validate", "audit"]
    test_hits = count_keyword_matches(dark_text + text_lower, testing_kws)
    has_dark_checklist = bool(re.search(r'dark.*(?:checklist|test|verify)', text_lower))
    if has_dark_checklist:
        points += 2.0
    elif test_hits >= 2:
        points += 1.0
    else:
        issues.append(Issue("D2_dark", "No dark-mode testing/verification checklist", 1))

    return min(points, 10.0), issues


# ─── Dimension 3: Animation & Motion System (1.1×) ──────────────────────────

def score_d3_animation_motion(sections: list[Section], text: str) -> tuple[float, list[Issue]]:
    """D3: Animation & Motion — easing curves, duration scale, reduced-motion, pairs, micro."""
    issues = []
    points = 0.0
    text_lower = text.lower()

    # Sub-check 1: Easing curves with cubic-bezier values (0-2 points)
    cubic_beziers = re.findall(r'cubic-bezier\s*\(\s*[\d.]+', text)
    named_easings = count_keyword_matches(text_lower, ["ease-in", "ease-out", "ease-in-out", "linear", "spring"])
    distinct_curves = len(set(cubic_beziers)) + min(named_easings, 2)  # named easings count partially
    if distinct_curves >= 3:
        points += 2.0
    elif distinct_curves >= 2:
        points += 1.5
    elif distinct_curves >= 1:
        points += 0.8
    else:
        issues.append(Issue("D3_motion", "No easing curves defined (need cubic-bezier values)", 2))

    # Sub-check 2: Duration scale/system (0-2 points)
    duration_values = re.findall(r'(\d+)\s*ms', text)
    duration_tokens = count_keyword_matches(text_lower, [
        "duration-fast", "duration-normal", "duration-slow",
        "instant", "fast", "normal", "gentle", "slow",
    ])
    has_duration_table = bool(re.search(r'duration.*\|.*\d+\s*ms', text_lower))
    distinct_durations = len(set(duration_values))

    if has_duration_table or (duration_tokens >= 3 and distinct_durations >= 3):
        points += 2.0
    elif distinct_durations >= 3:
        points += 1.5
    elif distinct_durations >= 2:
        points += 0.8
    else:
        issues.append(Issue("D3_motion", "No duration scale defined (need 3+ tiers with ms values)", 2))

    # Sub-check 3: prefers-reduced-motion handling (0-2 points)
    has_reduced_motion = bool(re.search(r'prefers-reduced-motion|reduced.motion', text_lower))
    if has_reduced_motion:
        # Check for specific guidance (not just mention)
        motion_sections = find_sections_matching(sections, ["motion", "animation", "reduced"])
        motion_text = " ".join(s.full_text for s in motion_sections).lower()
        if "prefers-reduced-motion" in motion_text and any(
            kw in motion_text for kw in ["disable", "reduce", "remove", "opacity", "fade", "crossfade"]
        ):
            points += 2.0
        else:
            points += 1.0
    else:
        issues.append(Issue("D3_motion", "No prefers-reduced-motion guidance", 2))

    # Sub-check 4: Entry/exit animation pairs (0-2 points)
    entry_exit_kws = ["entry", "exit", "enter", "leave", "open", "close", "show", "hide",
                      "slide-up", "slide-down", "fade-in", "fade-out", "scale-in", "scale-out"]
    pair_types = ["sheet", "modal", "dialog", "toast", "popover", "drawer", "menu", "dropdown"]
    entry_hits = count_keyword_matches(text_lower, entry_exit_kws)
    pair_hits = count_keyword_matches(text_lower, pair_types)

    # Count actual pairs: look for components with both entry and exit defined
    animation_sections = find_sections_matching(sections, ["animation", "motion", "transition"])
    anim_text = " ".join(s.full_text for s in animation_sections).lower()
    paired = 0
    for pt in pair_types:
        if pt in anim_text:
            paired += 1

    if paired >= 4:
        points += 2.0
    elif paired >= 2:
        points += 1.2
    elif entry_hits >= 3:
        points += 0.8
    else:
        issues.append(Issue("D3_motion", "No entry/exit animation pairs for overlays (need 4+)", 1))

    # Sub-check 5: Micro-interaction specs (0-2 points)
    micro_kws = ["toggle", "switch", "checkbox", "progress", "ripple", "haptic",
                 "pull-to-refresh", "swipe", "press", "long-press", "drag"]
    micro_hits = count_keyword_matches(text_lower, micro_kws)
    if micro_hits >= 3:
        points += 2.0
    elif micro_hits >= 2:
        points += 1.2
    elif micro_hits >= 1:
        points += 0.5
    else:
        issues.append(Issue("D3_motion", "No micro-interaction specs (toggle, switch, progress, etc.)", 1))

    return min(points, 10.0), issues


# ─── Dimension 4: Component Spec Coverage (1.2×) ────────────────────────────

# States we expect documented per component
COMPONENT_STATES = ["hover", "active", "focus", "disabled", "loading", "error", "pressed", "selected"]

def _find_components_parent(sections: list[Section]) -> Optional[Section]:
    """Find the H2 'Components' section that scopes component detection."""
    for s in sections:
        if s.level == 2 and re.search(r'\bcomponents?\b', s.title, re.IGNORECASE):
            return s
    return None


def _is_component_heading(title: str, ui_components: list[str]) -> bool:
    """Determine if a heading names a real UI component.

    Two-pass strategy:
      1. Match against actual src/components/ui/*.tsx file names (high confidence).
      2. Match headings containing '.tsx' (explicit file reference).
    PascalCase alone is NOT sufficient — that was too greedy and matched
    non-component headings like 'Spacing Scale' or 'Dark Elevation Model'.
    """
    title_lower = title.lower().replace(" ", "").replace("-", "")

    # Pass 1: match against real component file stems
    for comp in ui_components:
        comp_norm = comp.replace("-", "")
        if comp_norm in title_lower:
            return True

    # Pass 2: explicit .tsx reference in heading (e.g. "Button (`button.tsx`)")
    if ".tsx" in title.lower():
        return True

    return False


def score_d4_component_specs(sections: list[Section], text: str, ui_components: list[str]) -> tuple[float, list[Issue]]:
    """D4: Component Spec Coverage — count, states, variants, anatomy, usage."""
    issues = []
    points = 0.0

    # Find component sections — scoped to the ## Components parent when it exists.
    # This prevents non-component H3s (e.g. "Spacing Scale", "Easing Curves") from
    # being counted as components and diluting coverage ratios.
    all_secs = get_all_sections(sections)
    components_parent = _find_components_parent(sections)

    component_sections = []

    if components_parent:
        # Only search within the Components section tree
        candidates = get_all_sections([components_parent])
    else:
        # Fallback: search all H3+ headings (backward-compat)
        candidates = [s for s in all_secs if s.level >= 3]

    for s in candidates:
        if s.level >= 3 and _is_component_heading(s.title, ui_components):
            component_sections.append(s)

    comp_count = len(component_sections)

    # Sub-check 1: Component heading count (0-2 points)
    if comp_count >= 20:
        points += 2.0
    elif comp_count >= 15:
        points += 1.5
    elif comp_count >= 10:
        points += 1.0
    elif comp_count >= 5:
        points += 0.5
    else:
        issues.append(Issue("D4_components", f"Only {comp_count} component specs (need 20+)", 2))

    # Sub-check 2: State coverage (0-2 points)
    comps_with_states = 0
    for s in component_sections:
        full = s.full_text.lower()
        states_found = sum(1 for st in COMPONENT_STATES if st in full)
        if states_found >= 3:
            comps_with_states += 1

    if comp_count > 0:
        state_ratio = comps_with_states / comp_count
        points += min(state_ratio * 2.5, 2.0)
        if state_ratio < 0.3:
            issues.append(Issue("D4_components",
                f"Only {comps_with_states}/{comp_count} components document 3+ states", 2))
    else:
        issues.append(Issue("D4_components", "No component sections found for state analysis", 2))

    # Sub-check 3: Variant/size documentation (0-2 points)
    comps_with_variants = 0
    for s in component_sections:
        full = s.full_text.lower()
        has_variants = bool(re.search(r'variant|size|sm|lg|xl|compact|default|outline|ghost', full))
        if has_variants:
            comps_with_variants += 1

    if comp_count > 0:
        variant_ratio = comps_with_variants / comp_count
        points += min(variant_ratio * 2.5, 2.0)
    else:
        pass  # already flagged above

    # Sub-check 4: Slot/anatomy documentation (0-2 points)
    # Improved: look for structured anatomy descriptions (→ chains like
    # "icon → label → badge", or explicit "anatomy"/"slot" keywords paired
    # with a structural pattern) rather than counting common English words
    # like "content", "label", "end" that produce false positives.
    comps_with_anatomy = 0
    for s in component_sections:
        full = s.full_text.lower()
        has_anatomy = False
        # Primary signal: → chain with 2+ arrows (e.g. "icon → label → badge")
        arrow_chains = re.findall(r'[a-z][\w\s]*→[a-z][\w\s]*→', full)
        if arrow_chains:
            has_anatomy = True
        # Secondary signal: explicit "slot" or "anatomy" keyword + at least one
        # structural term (leading/trailing/prefix/suffix/icon-left/icon-right)
        if not has_anatomy:
            has_slot_keyword = bool(re.search(r'\bslot\b|\banatomy\b', full))
            structural_terms = ["leading", "trailing", "prefix", "suffix",
                                "icon-left", "icon-right"]
            has_structural = any(t in full for t in structural_terms)
            if has_slot_keyword and has_structural:
                has_anatomy = True
        if has_anatomy:
            comps_with_anatomy += 1

    if comp_count > 0:
        anatomy_ratio = comps_with_anatomy / comp_count
        points += min(anatomy_ratio * 3.0, 2.0)  # Generous — anatomy is uncommon
        if comps_with_anatomy == 0:
            issues.append(Issue("D4_components", "No components document slot/anatomy structure", 1))

    # Sub-check 5: Usage guidance (0-2 points)
    usage_kws = ["when to use", "do not use", "don't use", "use when", "avoid",
                 "best for", "not for", "instead use", "prefer"]
    comps_with_usage = 0
    for s in component_sections:
        full = s.full_text.lower()
        if any(kw in full for kw in usage_kws):
            comps_with_usage += 1

    if comp_count > 0:
        usage_ratio = comps_with_usage / comp_count
        points += min(usage_ratio * 3.0, 2.0)
        if comps_with_usage == 0:
            issues.append(Issue("D4_components", "No components include usage guidance (when to use)", 1))

    return min(points, 10.0), issues

# ─── Dimension 5: Visual Richness & Depth (1.3×) ────────────────────────────

def score_d5_visual_richness(sections: list[Section], text: str) -> tuple[float, list[Issue]]:
    """D5: Visual Richness — gradients, shadows, surfaces, illustration, image treatment."""
    issues = []
    points = 0.0
    text_lower = text.lower()

    # Sub-check 1: Gradient definitions with color stops (0-2 points)
    gradient_defs = re.findall(
        r'(?:linear|radial|conic)-gradient\s*\(|gradient.*(?:from|to|stop|hsl|#[0-9a-f])',
        text_lower
    )
    gradient_mentions = count_keyword_matches(text_lower, ["gradient", "linear-gradient", "radial-gradient"])
    if len(gradient_defs) >= 3:
        points += 2.0
    elif len(gradient_defs) >= 1 or gradient_mentions >= 3:
        points += 1.0
    elif gradient_mentions >= 1:
        points += 0.5
    else:
        issues.append(Issue("D5_richness", "No gradient definitions (need 3+ with color stops)", 2))

    # Sub-check 2: Shadow/elevation scale with values (0-2 points)
    shadow_values = re.findall(
        r'(?:box-shadow|shadow).*?(?:\d+px\s+\d+px|\d+px\s+rgba|shadow-(?:sm|md|lg|xl|2xl|none))',
        text_lower
    )
    # Also count shadow token names
    shadow_levels = count_keyword_matches(text_lower, [
        "shadow-sm", "shadow-md", "shadow-lg", "shadow-xl", "shadow-2xl",
        "elevation-0", "elevation-1", "elevation-2", "elevation-3", "elevation-4",
        "shadow-none", "shadow-card", "shadow-elevated", "shadow-overlay",
    ])
    elevation_sections = find_sections_matching(sections, ["elevation", "shadow", "depth"])
    elev_text = " ".join(s.full_text for s in elevation_sections).lower()
    distinct_levels = len(set(re.findall(r'shadow-(?:sm|md|lg|xl|2xl|none)', text_lower)))
    distinct_levels += len(set(re.findall(r'elevation-\d', text_lower)))

    if distinct_levels >= 4 or (shadow_levels >= 4 and len(shadow_values) >= 2):
        points += 2.0
    elif distinct_levels >= 2 or shadow_levels >= 2:
        points += 1.0
    elif shadow_levels >= 1:
        points += 0.5
    else:
        issues.append(Issue("D5_richness", "No multi-level shadow/elevation scale (need 4+)", 2))

    # Sub-check 3: Surface treatment section (0-2 points)
    surface_kws = ["texture", "noise", "pattern", "glassmorphism", "blur", "backdrop",
                   "frosted", "glass", "surface", "material"]
    surface_hits = count_keyword_matches(text_lower, surface_kws)
    if surface_hits >= 3:
        points += 2.0
    elif surface_hits >= 2:
        points += 1.0
    elif surface_hits >= 1:
        points += 0.5
    else:
        issues.append(Issue("D5_richness", "No surface treatment guidance (glass, texture, blur)", 1))

    # Sub-check 4: Illustration/iconography style guide (0-2 points)
    illus_kws = ["illustration", "icon style", "line weight", "stroke width",
                 "filled", "outlined", "icon size", "icon container", "spot illustration"]
    illus_hits = count_keyword_matches(text_lower, illus_kws)
    if illus_hits >= 3:
        points += 2.0
    elif illus_hits >= 2:
        points += 1.2
    elif illus_hits >= 1:
        points += 0.5
    else:
        issues.append(Issue("D5_richness", "No illustration or iconography style guide", 1))

    # Sub-check 5: Image treatment rules (0-2 points)
    image_kws = ["aspect-ratio", "object-fit", "object-cover", "overlay", "placeholder",
                 "border-radius.*image", "image.*radius", "thumbnail", "avatar"]
    image_hits = count_keyword_matches(text_lower, image_kws)
    if image_hits >= 3:
        points += 2.0
    elif image_hits >= 2:
        points += 1.0
    elif image_hits >= 1:
        points += 0.5
    else:
        issues.append(Issue("D5_richness", "No image treatment rules (aspect-ratio, overlay, placeholder)", 1))

    return min(points, 10.0), issues


# ─── Dimension 6: Form & Input States (1.0×) ────────────────────────────────

FORM_FIELD_STATES = ["empty", "focused", "filled", "error", "disabled", "read-only", "readonly", "valid", "invalid"]
FORM_ELEMENT_TYPES = ["input", "textarea", "select", "checkbox", "radio", "toggle", "switch",
                      "date", "otp", "slider", "file", "search"]

def score_d6_form_states(sections: list[Section], text: str) -> tuple[float, list[Issue]]:
    """D6: Form & Input States — anatomy, states, element types, layout, multi-step."""
    issues = []
    points = 0.0
    text_lower = text.lower()

    # Sub-check 1: Form field states documented (0-2 points)
    states_found = count_keyword_matches(text_lower, FORM_FIELD_STATES)
    if states_found >= 5:
        points += 2.0
    elif states_found >= 3:
        points += 1.2
    elif states_found >= 1:
        points += 0.5
    else:
        issues.append(Issue("D6_forms", f"Only {states_found}/6+ form field states documented", 2))

    # Sub-check 2: Validation pattern section (0-2 points)
    validation_kws = ["validation", "inline", "on-submit", "error message", "helper text",
                      "required", "pattern", "constraint"]
    val_hits = count_keyword_matches(text_lower, validation_kws)
    if val_hits >= 3:
        points += 2.0
    elif val_hits >= 2:
        points += 1.0
    elif val_hits >= 1:
        points += 0.5
    else:
        issues.append(Issue("D6_forms", "No form validation pattern section", 2))

    # Sub-check 3: Form element types covered (0-2 points)
    types_found = count_keyword_matches(text_lower, FORM_ELEMENT_TYPES)
    if types_found >= 6:
        points += 2.0
    elif types_found >= 4:
        points += 1.2
    elif types_found >= 2:
        points += 0.5
    else:
        issues.append(Issue("D6_forms", f"Only {types_found}/6+ form element types documented", 1))

    # Sub-check 4: Form layout rules (0-2 points)
    layout_kws = ["form.*spacing", "form.*gap", "label.*position", "field.*gap",
                  "fieldset", "form.*layout", "stack", "form.*group"]
    layout_hits = sum(1 for kw in layout_kws if re.search(kw, text_lower))
    if layout_hits >= 3:
        points += 2.0
    elif layout_hits >= 1:
        points += 1.0
    else:
        issues.append(Issue("D6_forms", "No form layout rules (spacing between fields, label position)", 1))

    # Sub-check 5: Multi-step/wizard pattern (0-2 points)
    wizard_kws = ["step", "wizard", "progress", "multi-step", "stepper", "onboarding flow"]
    wizard_hits = count_keyword_matches(text_lower, wizard_kws)
    if wizard_hits >= 3:
        points += 2.0
    elif wizard_hits >= 1:
        points += 1.0
    else:
        issues.append(Issue("D6_forms", "No multi-step form/wizard pattern guidance", 1))

    return min(points, 10.0), issues


# ─── Dimension 7: Empty, Loading & Error State Patterns (1.0×) ──────────────

def score_d7_empty_loading_error(sections: list[Section], text: str) -> tuple[float, list[Issue]]:
    """D7: State Patterns — empty template, loading variants, error patterns, specs, transitions."""
    issues = []
    points = 0.0
    text_lower = text.lower()

    # Sub-check 1: Empty state template with required elements (0-2 points)
    empty_kws = ["empty state", "empty-state", "EmptyState"]
    has_empty_section = any(kw.lower() in text_lower for kw in empty_kws)
    empty_elements = count_keyword_matches(text_lower, ["icon", "title", "body", "cta", "action", "call to action"])

    if has_empty_section and empty_elements >= 3:
        points += 2.0
    elif has_empty_section and empty_elements >= 1:
        points += 1.0
    elif has_empty_section:
        points += 0.5
    else:
        issues.append(Issue("D7_states", "No empty state template with required elements (icon, title, body, CTA)", 2))

    # Sub-check 2: Loading pattern variants (0-2 points)
    loading_kws = ["skeleton", "spinner", "progress bar", "shimmer", "optimistic",
                   "pull-to-refresh", "inline loading", "page loading"]
    loading_hits = count_keyword_matches(text_lower, loading_kws)
    if loading_hits >= 3:
        points += 2.0
    elif loading_hits >= 2:
        points += 1.2
    elif loading_hits >= 1:
        points += 0.5
    else:
        issues.append(Issue("D7_states", "No loading state variants (need skeleton, spinner, progress)", 2))

    # Sub-check 3: Error state patterns (0-2 points)
    error_kws = ["network error", "network failure", "validation error", "permission",
                 "not found", "timeout", "retry", "offline", "error state"]
    error_hits = count_keyword_matches(text_lower, error_kws)
    if error_hits >= 3:
        points += 2.0
    elif error_hits >= 2:
        points += 1.2
    elif error_hits >= 1:
        points += 0.5
    else:
        issues.append(Issue("D7_states", "No error state patterns (network, validation, permission, retry)", 1))

    # Sub-check 4: Visual specs for states (concrete values, not just prose) (0-2 points)
    state_sections = find_sections_matching(sections, ["empty", "loading", "error", "state", "skeleton"])
    state_text = " ".join(s.full_text for s in state_sections)
    actionable, total = count_actionable_lines(state_text)
    if total > 0 and actionable >= 5:
        points += 2.0
    elif actionable >= 3:
        points += 1.0
    elif actionable >= 1:
        points += 0.5
    else:
        issues.append(Issue("D7_states", "State patterns lack concrete visual specs (dimensions, colors)", 1))

    # Sub-check 5: State transition guidance (0-2 points)
    transition_kws = ["transition", "animate", "fade", "replace", "swap", "crossfade",
                      "skeleton.*content", "loading.*loaded"]
    transition_hits = sum(1 for kw in transition_kws if re.search(kw, text_lower))
    if transition_hits >= 3:
        points += 2.0
    elif transition_hits >= 1:
        points += 1.0
    else:
        issues.append(Issue("D7_states", "No state transition guidance (how states animate between each other)", 1))

    return min(points, 10.0), issues


# ─── Dimension 8: Spacing & Layout System (0.9×) ────────────────────────────

def score_d8_spacing_layout(sections: list[Section], text: str) -> tuple[float, list[Issue]]:
    """D8: Spacing & Layout — scale, templates, z-index, density, scroll."""
    issues = []
    points = 0.0
    text_lower = text.lower()

    # Sub-check 1: Spacing scale with 8+ values (0-2 points)
    # Look for a series of spacing values (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
    spacing_values = set(re.findall(r'\b(4|8|12|16|20|24|32|40|48|64)\s*(?:px|pt)?\b', text))
    # Also check for Tailwind spacing tokens
    tw_spacing = set(re.findall(r'(?:p|m|gap|space)-(\d+)', text))
    total_spacing = len(spacing_values | tw_spacing)

    if total_spacing >= 8:
        points += 2.0
    elif total_spacing >= 5:
        points += 1.2
    elif total_spacing >= 3:
        points += 0.5
    else:
        issues.append(Issue("D8_spacing", f"Only {total_spacing} spacing values found (need 8+ scale)", 2))

    # Sub-check 2: Page template/layout composition rules (0-2 points)
    layout_kws = ["template", "layout", "composition", "page pattern",
                  "list page", "detail page", "form page", "dashboard"]
    layout_sections = find_sections_matching(sections, ["layout", "template", "page", "structure"])
    layout_hits = count_keyword_matches(text_lower, layout_kws)
    if layout_hits >= 3 or len(layout_sections) >= 2:
        points += 2.0
    elif layout_hits >= 1 or len(layout_sections) >= 1:
        points += 1.0
    else:
        issues.append(Issue("D8_spacing", "No page template or layout composition rules", 1))

    # Sub-check 3: Z-index scale (0-2 points)
    zindex_kws = ["z-index", "z-10", "z-20", "z-30", "z-40", "z-50",
                  "stacking", "layer order"]
    zindex_hits = count_keyword_matches(text_lower, zindex_kws)
    zindex_values = re.findall(r'z-(?:index)?\s*[:=]?\s*(\d+)', text)
    distinct_z = len(set(zindex_values))
    if distinct_z >= 4 or zindex_hits >= 4:
        points += 2.0
    elif distinct_z >= 2 or zindex_hits >= 2:
        points += 1.0
    elif zindex_hits >= 1:
        points += 0.5
    else:
        issues.append(Issue("D8_spacing", "No z-index scale defined (need 4+ named levels)", 1))

    # Sub-check 4: Content density guidance (0-2 points)
    density_kws = ["density", "compact", "comfortable", "spacious", "condensed",
                   "card padding", "list spacing", "section gap"]
    density_hits = count_keyword_matches(text_lower, density_kws)
    if density_hits >= 3:
        points += 2.0
    elif density_hits >= 1:
        points += 1.0
    else:
        issues.append(Issue("D8_spacing", "No content density guidance (compact/default/comfortable)", 1))

    # Sub-check 5: Scroll and overflow behavior (0-2 points)
    scroll_kws = ["scroll", "overflow", "sticky", "fixed", "snap", "pull-to-refresh",
                  "infinite scroll", "pagination"]
    scroll_hits = count_keyword_matches(text_lower, scroll_kws)
    if scroll_hits >= 3:
        points += 2.0
    elif scroll_hits >= 1:
        points += 1.0
    else:
        issues.append(Issue("D8_spacing", "No scroll/overflow behavior guidance", 1))

    return min(points, 10.0), issues

# ─── Dimension 9: Accessibility Beyond Contrast (0.9×) ──────────────────────

def score_d9_accessibility(sections: list[Section], text: str) -> tuple[float, list[Issue]]:
    """D9: Accessibility — focus management, screen reader, touch targets, color-blind, checklist."""
    issues = []
    points = 0.0
    text_lower = text.lower()

    # Sub-check 1: Focus management patterns (0-2 points)
    focus_kws = ["focus trap", "focus restore", "focus-visible", "focus ring",
                 "focus management", "focus lock", "tab order", "tabindex"]
    focus_hits = count_keyword_matches(text_lower, focus_kws)
    if focus_hits >= 2:
        points += 2.0
    elif focus_hits >= 1:
        points += 1.0
    else:
        issues.append(Issue("D9_a11y", "No focus management patterns (focus trap, restore, focus-visible)", 2))

    # Sub-check 2: Screen reader guidance (0-2 points)
    sr_kws = ["aria-label", "aria-live", "role", "landmark", "screen reader",
              "announce", "aria-describedby", "sr-only", "visually-hidden"]
    sr_hits = count_keyword_matches(text_lower, sr_kws)
    if sr_hits >= 3:
        points += 2.0
    elif sr_hits >= 1:
        points += 1.0
    else:
        issues.append(Issue("D9_a11y", "No screen reader guidance (aria-label, aria-live, landmarks)", 1))

    # Sub-check 3: Touch target exceptions documented (0-2 points)
    touch_kws = ["touch target", "tap target", "44px", "44×44", "48px",
                 "minimum.*target", "target.*size"]
    touch_hits = count_keyword_matches(text_lower, touch_kws)
    has_exceptions = bool(re.search(r'exception|except|inline.*link|smaller.*than', text_lower))
    if touch_hits >= 2 and has_exceptions:
        points += 2.0
    elif touch_hits >= 2:
        points += 1.5
    elif touch_hits >= 1:
        points += 0.8
    else:
        issues.append(Issue("D9_a11y", "Touch target rules incomplete (need min size + exceptions)", 1))

    # Sub-check 4: Color-independent information (0-2 points)
    color_blind_kws = ["color-blind", "colorblind", "icon", "pattern", "shape",
                       "not.*rely.*color.*alone", "color.*independent", "secondary indicator"]
    cb_hits = count_keyword_matches(text_lower, color_blind_kws)
    if cb_hits >= 2:
        points += 2.0
    elif cb_hits >= 1:
        points += 1.0
    else:
        issues.append(Issue("D9_a11y", "No color-independent information guidance", 1))

    # Sub-check 5: Accessibility testing checklist or tools (0-2 points)
    test_kws = ["axe", "lighthouse", "voiceover", "talkback", "checklist",
                "audit", "wcag", "a11y.*test", "accessibility.*test"]
    test_hits = count_keyword_matches(text_lower, test_kws)
    if test_hits >= 2:
        points += 2.0
    elif test_hits >= 1:
        points += 1.0
    else:
        issues.append(Issue("D9_a11y", "No accessibility testing tools or checklist mentioned", 1))

    return min(points, 10.0), issues


# ─── Dimension 10: Brand & Emotional Design Language (1.0×) ─────────────────

def score_d10_brand_emotional(sections: list[Section], text: str) -> tuple[float, list[Issue]]:
    """D10: Brand — personality→design mappings, UI copy, imagery, celebration, anti-patterns."""
    issues = []
    points = 0.0
    text_lower = text.lower()

    # Sub-check 1: Brand attributes mapped to visual decisions (0-2 points)
    # Look for patterns like "calm → slow easing" or "trustworthy → consistent radius"
    brand_kws = ["calm", "competent", "trustworthy", "confident", "kind", "premium"]
    design_kws = ["easing", "palette", "radius", "shadow", "spacing", "font", "animation", "color"]
    brand_sections = find_sections_matching(sections, ["brand", "emotional", "tone", "voice", "personality"])
    brand_text = " ".join(s.full_text for s in brand_sections).lower() if brand_sections else text_lower

    brand_hits = count_keyword_matches(brand_text, brand_kws)
    design_hits = count_keyword_matches(brand_text, design_kws)
    # Both brand + design terms in same section = mapping
    has_mapping = brand_hits >= 2 and design_hits >= 2
    mapping_arrows = len(re.findall(r'→|->|means|translates|therefore|so we', brand_text))

    if has_mapping and mapping_arrows >= 2:
        points += 2.0
    elif has_mapping:
        points += 1.2
    elif brand_hits >= 2:
        points += 0.5
    else:
        issues.append(Issue("D10_brand", "No brand personality mapped to visual decisions", 2))

    # Sub-check 2: UI copy tone examples (0-2 points)
    # Look for quoted example strings in brand/voice sections
    copy_examples = re.findall(r'["\u201c]([^"\u201d]{10,})["\u201d]', text)
    # Filter to likely UI copy examples (short, user-facing)
    ui_copy = [c for c in copy_examples if len(c) < 150 and len(c.split()) >= 3]

    # Look for labeled examples (success, error, empty, confirmation)
    example_labels = count_keyword_matches(text_lower, ["success", "error", "empty", "confirmation",
                                                         "toast", "notification", "message"])
    if len(ui_copy) >= 3 and example_labels >= 2:
        points += 2.0
    elif len(ui_copy) >= 2:
        points += 1.0
    elif len(ui_copy) >= 1:
        points += 0.5
    else:
        issues.append(Issue("D10_brand", "No UI copy tone examples (need success, error, empty messages)", 1))

    # Sub-check 3: Imagery/photography direction (0-2 points)
    imagery_kws = ["photo", "imagery", "illustration", "warm", "residential",
                   "natural", "stock", "icon style", "visual language"]
    imagery_hits = count_keyword_matches(text_lower, imagery_kws)
    if imagery_hits >= 3:
        points += 2.0
    elif imagery_hits >= 1:
        points += 1.0
    else:
        issues.append(Issue("D10_brand", "No imagery or photography direction", 1))

    # Sub-check 4: Celebration/delight moments (0-2 points)
    delight_kws = ["celebration", "delight", "milestone", "confetti", "success animation",
                   "completion", "reward", "achievement", "congratulat"]
    delight_hits = count_keyword_matches(text_lower, delight_kws)
    if delight_hits >= 3:
        points += 2.0
    elif delight_hits >= 1:
        points += 1.0
    else:
        issues.append(Issue("D10_brand", "No celebration or delight moments defined", 1))

    # Sub-check 5: Anti-patterns / "don't" list (0-2 points)
    anti_kws = ["avoid", "never", "don't", "do not", "anti-pattern", "not allowed"]
    # Look specifically in brand/tone sections
    anti_hits = sum(1 for kw in anti_kws if re.search(r'(?:^|\n).*' + re.escape(kw), brand_text))
    if anti_hits >= 3:
        points += 2.0
    elif anti_hits >= 1:
        points += 1.0
    else:
        issues.append(Issue("D10_brand", "No brand anti-patterns or 'don't' list", 1))

    return min(points, 10.0), issues


# ─── Dimension 11: Responsive & Adaptive Patterns (0.8×) ────────────────────

def score_d11_responsive_adaptive(sections: list[Section], text: str) -> tuple[float, list[Issue]]:
    """D11: Responsive — orientation, font scaling, device tiers, keyboard, capacitor."""
    issues = []
    points = 0.0
    text_lower = text.lower()

    # Sub-check 1: Orientation handling (0-2 points)
    orient_kws = ["landscape", "orientation", "portrait", "rotate"]
    orient_hits = count_keyword_matches(text_lower, orient_kws)
    if orient_hits >= 2:
        points += 2.0
    elif orient_hits >= 1:
        points += 1.0
    else:
        issues.append(Issue("D11_responsive", "No orientation handling guidance", 1))

    # Sub-check 2: Dynamic type / font scaling (0-2 points)
    type_kws = ["dynamic type", "font scal", "rem", "accessibility size",
                "text scaling", "font-size.*clamp", "responsive.*type"]
    type_hits = sum(1 for kw in type_kws if re.search(kw, text_lower))
    if type_hits >= 2:
        points += 2.0
    elif type_hits >= 1:
        points += 1.0
    else:
        issues.append(Issue("D11_responsive", "No dynamic type or font scaling guidance", 1))

    # Sub-check 3: Device-size tiers (0-2 points)
    device_kws = ["small screen", " se ", "compact", "regular", "max", "viewport",
                  "390", "375", "428", "320", "device.*tier"]
    device_hits = count_keyword_matches(text_lower, device_kws)
    if device_hits >= 3:
        points += 2.0
    elif device_hits >= 1:
        points += 1.0
    else:
        issues.append(Issue("D11_responsive", "No device-size tiers within mobile (SE/standard/Max)", 1))

    # Sub-check 4: Keyboard avoidance patterns (0-2 points)
    keyboard_kws = ["keyboard", "avoidance", "scroll into view", "input focus",
                    "keyboard.*dismiss", "keyboard.*height"]
    kb_hits = sum(1 for kw in keyboard_kws if re.search(kw, text_lower))
    if kb_hits >= 2:
        points += 2.0
    elif kb_hits >= 1:
        points += 1.0
    else:
        issues.append(Issue("D11_responsive", "No keyboard avoidance patterns documented", 1))

    # Sub-check 5: Capacitor/native guidance (0-2 points)
    native_kws = ["capacitor", "status bar", "splash screen", "native", "haptic",
                  "safe area", "safe-area", "home indicator", "notch"]
    native_hits = count_keyword_matches(text_lower, native_kws)
    if native_hits >= 3:
        points += 2.0
    elif native_hits >= 1:
        points += 1.0
    else:
        issues.append(Issue("D11_responsive", "No Capacitor/native platform guidance", 1))

    return min(points, 10.0), issues


# ─── Dimension 12: Documentation Structure & Navigability (0.7×) ────────────

def score_d12_doc_structure(sections: list[Section], text: str) -> tuple[float, list[Issue]]:
    """D12: Structure — heading depth, consistent template, cross-refs, tables, word count."""
    issues = []
    points = 0.0

    # Sub-check 1: Heading depth — uses H2, H3, H4 (0-2 points)
    h2_count = count_headings_at_level(text, 2)
    h3_count = count_headings_at_level(text, 3)
    h4_count = count_headings_at_level(text, 4)

    heading_score = 0.0
    if h2_count >= 8:
        heading_score += 1.0
    elif h2_count >= 5:
        heading_score += 0.5

    if h3_count >= 15:
        heading_score += 1.0
    elif h3_count >= 8:
        heading_score += 0.5
    elif h3_count >= 4:
        heading_score += 0.3

    points += min(heading_score, 2.0)
    if h2_count < 5:
        issues.append(Issue("D12_structure", f"Only {h2_count} H2 headings (need 8+)", 1))
    if h3_count < 8:
        issues.append(Issue("D12_structure", f"Only {h3_count} H3 headings (need 15+)", 1))

    # Sub-check 2: Consistent component information pattern (0-2 points)
    # Rather than requiring specific H4 sub-headings, check whether component
    # sections consistently provide the same categories of information:
    # states, variants/sizes, and usage guidance.  This rewards documents
    # that use a repeatable template regardless of formatting style (bullet
    # lists, tables, H4s, etc.).
    all_secs = get_all_sections(sections)
    ui_components = get_ui_component_names()
    components_parent = _find_components_parent(sections)

    if components_parent:
        comp_candidates = get_all_sections([components_parent])
    else:
        comp_candidates = [s for s in all_secs if s.level >= 3]

    comp_secs = [s for s in comp_candidates
                 if s.level >= 3 and _is_component_heading(s.title, ui_components)]

    if len(comp_secs) >= 5:
        # Count how many include each information category
        INFO_CATEGORIES = {
            "states": COMPONENT_STATES,  # hover, active, focus, disabled, ...
            "variants": ["variant", "size", "sm", "lg", "xl", "compact", "outline", "ghost"],
            "usage": ["when to use", "do not use", "don't use", "use when", "avoid",
                      "best for", "not for", "instead use", "prefer"],
        }
        category_counts = {cat: 0 for cat in INFO_CATEGORIES}
        for cs in comp_secs:
            full = cs.full_text.lower()
            for cat, kws in INFO_CATEGORIES.items():
                if cat == "states":
                    if sum(1 for st in kws if st in full) >= 3:
                        category_counts[cat] += 1
                elif cat == "usage":
                    if any(kw in full for kw in kws):
                        category_counts[cat] += 1
                else:
                    if any(kw in full for kw in kws):
                        category_counts[cat] += 1

        # Award points based on how many categories are consistently present
        # (appearing in ≥60% of component sections)
        threshold = len(comp_secs) * 0.6
        consistent_cats = sum(1 for c in category_counts.values() if c >= threshold)

        if consistent_cats >= 3:
            points += 2.0
        elif consistent_cats >= 2:
            points += 1.5
        elif consistent_cats >= 1:
            points += 1.0
    elif len(comp_secs) >= 2:
        points += 0.5
    else:
        issues.append(Issue("D12_structure", "Fewer than 5 component specs for consistency analysis", 1))

    # Sub-check 3: Cross-references to other docs (0-2 points)
    cross_refs = count_pattern_matches(text,
        r'screen-flows\.md|index\.css|masterplan\.md|operating-model\.md|feature-list\.md|app-flow')
    if cross_refs >= 3:
        points += 2.0
    elif cross_refs >= 1:
        points += 1.0
    else:
        issues.append(Issue("D12_structure", "No cross-references to other docs", 1))

    # Sub-check 4: Table usage (0-2 points)
    table_count = count_tables(text)
    if table_count >= 5:
        points += 2.0
    elif table_count >= 3:
        points += 1.0
    elif table_count >= 1:
        points += 0.5
    else:
        issues.append(Issue("D12_structure", f"Only {table_count} tables (need 5+ for structured data)", 1))

    # Sub-check 5: Word count in 3,000-8,000 range (0-2 points)
    wc = count_words(text)
    if 3000 <= wc <= 8000:
        points += 2.0
    elif 2000 <= wc < 3000 or 8000 < wc <= 10000:
        points += 1.0
    elif 1000 <= wc < 2000 or 10000 < wc <= 12000:
        points += 0.5
    else:
        issues.append(Issue("D12_structure", f"Word count {wc} outside 3k-8k sweet spot", 1))

    return min(points, 10.0), issues


# ─── Anti-Gaming Guards ──────────────────────────────────────────────────────

def calculate_gaming_penalty(sections: list[Section], text: str) -> tuple[float, list[Issue]]:
    """Anti-gaming guards 1, 3, 5, 6. Returns (penalty, issues)."""
    issues = []
    penalty = 0.0

    # ─── Guard 1: Word-count bell curve ───
    # Lowered floor from 2000→1500 with gentler ramp.  A concise 1500-word
    # doc that covers every dimension shouldn't be penalised as hard as one
    # that's genuinely too sparse (<800 words).
    wc = count_words(text)
    if wc < 1500:
        p = (1500 - wc) / 500 * 1.5  # Gentler: max ~4.5 for very short
        penalty += min(p, 5.0)
        issues.append(Issue("GAMING_wordcount", f"Word count {wc} below 1,500 minimum", 2))
    elif wc < 2000:
        # Soft warning zone — minor penalty
        penalty += 0.5
        issues.append(Issue("GAMING_wordcount", f"Word count {wc} is in 1,500–2,000 warning zone", 1))
    elif wc > 12000:
        p = (wc - 12000) / 2000 * 3.0  # Escalating penalty for bloat
        penalty += min(p, 10.0)
        issues.append(Issue("GAMING_wordcount", f"Word count {wc} exceeds 12,000 ceiling", 2))
    elif wc > 10000:
        penalty += 1.0
        issues.append(Issue("GAMING_wordcount", f"Word count {wc} approaching 12,000 ceiling", 1))

    # ─── Guard 3: Duplicate heading detection ───
    all_secs = get_all_sections(sections)
    h2_h3_titles = [(s.title, s.level) for s in all_secs if s.level in (2, 3)]
    dup_count = 0
    seen_pairs = set()
    for i, (title_a, _) in enumerate(h2_h3_titles):
        for j, (title_b, _) in enumerate(h2_h3_titles):
            if i >= j:
                continue
            pair_key = (min(i, j), max(i, j))
            if pair_key in seen_pairs:
                continue
            sim = heading_similarity(title_a, title_b)
            if sim > 0.8 and title_a.lower() != title_b.lower():
                # Allow exact duplicates at different levels (e.g., same name in different sections)
                dup_count += 1
                seen_pairs.add(pair_key)
                issues.append(Issue("GAMING_duplicate_heading",
                    f"Headings '{title_a}' and '{title_b}' are >80% similar", 1))
    penalty += dup_count * 1.0

    # ─── Guard 5: Boilerplate detection ───
    # Split into paragraphs (blocks of text separated by blank lines)
    paragraphs = re.split(r'\n\s*\n', text)
    long_paragraphs = [p.strip() for p in paragraphs if len(p.split()) >= 50]

    boilerplate_count = 0
    for i, para_a in enumerate(long_paragraphs):
        for j, para_b in enumerate(long_paragraphs):
            if i >= j:
                continue
            if jaccard_similarity(para_a, para_b) > 0.8:
                boilerplate_count += 1

    if boilerplate_count > 0:
        penalty += boilerplate_count * 0.5
        issues.append(Issue("GAMING_boilerplate",
            f"{boilerplate_count} near-duplicate paragraph pairs detected", 2))

    # ─── Guard 6: Actionability ratio ───
    # Check each H2 section for actionability ratio
    low_action_sections = 0
    for s in sections:  # Top-level H2 sections only
        if s.level != 2:
            continue
        actionable, total = count_actionable_lines(s.full_text)
        if total >= 5:  # Only check non-trivial sections
            ratio = actionable / total if total > 0 else 0
            if ratio < 0.2:
                low_action_sections += 1
                issues.append(Issue("GAMING_actionability",
                    f"Section '{s.title}' has low actionability ratio ({actionable}/{total} = {ratio:.0%})", 1))

    # We don't add to penalty here — actionability caps are applied per-dimension in evaluate()
    # But we flag it for visibility

    return penalty, issues


def calculate_css_penalty(text: str, css_tokens: CSSTokens) -> tuple[float, list[Issue]]:
    """Guard 4: CSS coherence check. HSL values in doc vs index.css.

    Also validates gradient and shadow HSL values — any hsl() call in the
    design guidelines whose H/S/L components don't correspond to a known
    token value in index.css is flagged (informational, lighter penalty).
    """
    issues = []
    penalty = 0.0

    if not css_tokens.light:
        return 0.0, []

    # ── Token HSL coherence (strict — 0.5 per mismatch) ────────────────────

    # Find HSL value claims in the design guidelines
    # Pattern: token name followed by HSL-like values
    # e.g., "`--primary` | 214 65% 14%" or "--background: 220 20% 97%"
    hsl_claims = re.findall(
        r'--([a-z-]+)[`\s|:]+\s*(\d+)\s+(\d+)%\s+(\d+)%',
        text
    )

    for token_name, h, s, l in hsl_claims:
        claimed = f"{h} {s}% {l}%"
        # Check against light mode
        if token_name in css_tokens.light:
            actual = css_tokens.light[token_name].strip()
            # Normalize whitespace
            actual_norm = re.sub(r'\s+', ' ', actual)
            claimed_norm = re.sub(r'\s+', ' ', claimed)
            if actual_norm != claimed_norm:
                penalty += 0.5
                issues.append(Issue("CSS_coherence",
                    f"--{token_name}: doc says '{claimed}' but index.css has '{actual}'", 2))

    # Also check dark mode claims
    dark_claims = re.findall(
        r'(?:dark|\.dark)[^|]*--([a-z-]+)[`\s|:]+\s*(\d+)\s+(\d+)%\s+(\d+)%',
        text, re.IGNORECASE
    )
    for token_name, h, s, l in dark_claims:
        claimed = f"{h} {s}% {l}%"
        if token_name in css_tokens.dark:
            actual = css_tokens.dark[token_name].strip()
            actual_norm = re.sub(r'\s+', ' ', actual)
            claimed_norm = re.sub(r'\s+', ' ', claimed)
            if actual_norm != claimed_norm:
                penalty += 0.5
                issues.append(Issue("CSS_coherence",
                    f"--{token_name} (dark): doc says '{claimed}' but index.css has '{actual}'", 2))

    # ── Gradient / shadow HSL coherence (softer — 0.25 per invented value) ─
    # Collect all known HSL value strings from index.css (both modes)
    known_hsl = set()
    for v in css_tokens.light.values():
        v_norm = re.sub(r'\s+', ' ', v.strip())
        if re.match(r'\d+\s+\d+%\s+\d+%', v_norm):
            known_hsl.add(v_norm)
    for v in css_tokens.dark.values():
        v_norm = re.sub(r'\s+', ' ', v.strip())
        if re.match(r'\d+\s+\d+%\s+\d+%', v_norm):
            known_hsl.add(v_norm)

    # Find hsl() calls in gradients / standalone specs (NOT in token tables,
    # which are already covered above).  Pattern: hsl(H S% L%)
    hsl_calls = re.findall(r'hsl\(\s*(\d+)\s+(\d+)%\s+(\d+)%\s*\)', text)
    invented_count = 0
    for h, s, l in hsl_calls:
        val = f"{h} {s}% {l}%"
        if val not in known_hsl:
            invented_count += 1
            if invented_count <= 5:  # limit noise
                issues.append(Issue("CSS_coherence",
                    f"hsl({val}) in doc does not match any index.css token value (invented?)", 1))

    if invented_count > 0:
        penalty += min(invented_count * 0.25, 2.0)  # cap at 2.0

    return penalty, issues


def calculate_actionability_caps(sections: list[Section]) -> tuple[int, dict]:
    """Guard 6: Per-section actionability ratio. Returns (cap_count, section_title->multiplier)."""
    caps = {}
    cap_count = 0

    for s in sections:
        if s.level != 2:
            continue
        actionable, total = count_actionable_lines(s.full_text)
        if total >= 5:
            ratio = actionable / total if total > 0 else 0
            if ratio < 0.2:
                caps[s.title] = 0.5  # Cap at 50%
                cap_count += 1
            else:
                caps[s.title] = 1.0
        else:
            caps[s.title] = 1.0  # Don't penalize short sections

    return cap_count, caps


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

    # Apply actionability caps: if sections have low actionability ratio,
    # reduce the overall score proportionally. Each capped section reduces
    # the total by a fraction based on how many H2 sections exist.
    total_h2 = max(len([s for s in sections if s.level == 2]), 1)
    actionability_multiplier = 1.0 - (actionability_caps * 0.5 / total_h2)
    actionability_multiplier = max(actionability_multiplier, 0.5)  # Floor at 50%

    # Scale to 0-100, apply penalties and caps
    composite = weighted_avg * 10.0 * actionability_multiplier - gaming_penalty - css_penalty
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
