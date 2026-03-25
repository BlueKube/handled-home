#!/usr/bin/env python3
"""
evaluate-provider.py — 7-Dimension Provider Experience Scoring Harness
======================================================================

Parses docs/screen-flows.md (Flows 17–24, 34–35) and scores provider
experience quality across 7 dimensions. Follows the same architecture
as evaluate-design.py. Expected baseline: ~55–65.

## 7 Scoring Dimensions (weighted)

D1.  Earnings Transparency    (1.3×) — payout prediction, modifiers, projections, held earnings
D2.  Schedule Control         (1.2×) — route lock, queue, map/list, optimization, availability
D3.  Fairness Signals         (1.2×) — guaranteed payout, no-tip, density, transparent modifiers
D4.  Onboarding Friction      (1.1×) — step count, progressive disclosure, resume state, compliance
D5.  Retention Hooks          (1.0×) — milestones, performance feedback, growth, streaks, quality
D6.  BYOC Provider Tools      (1.0×) — invite mgmt, link creation, activation, scripts, bonuses
D7.  Cognitive Walkthroughs   (0.9×) — first week, earnings check, dispute — path completeness

## Anti-Gaming Guards

1. Word-count bell curve (4k–10k sweet spot)
2. Duplicate screen detection (>80% similar headings)
3. Boilerplate detection (Jaccard >0.8 on 50+ word blocks)
4. Masterplan coherence (provider promises vs flow content)
5. Flow completeness (all 10 expected flows present)

Output (grep-friendly):
  provider_score:      58.30
  max_possible:       100.00
  d1_earnings:          7.20
  ...
  issues_found:         12
"""

import re
import sys
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional
from difflib import SequenceMatcher
from collections import Counter


# ─── File Paths ──────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent

SCREEN_FLOWS_PATH = PROJECT_ROOT / "docs" / "screen-flows.md"
MASTERPLAN_PATH = PROJECT_ROOT / "docs" / "masterplan.md"
OPERATING_MODEL_PATH = PROJECT_ROOT / "docs" / "operating-model.md"


# ─── Provider Flow IDs ──────────────────────────────────────────────────────

PROVIDER_FLOW_IDS = [17, 18, 19, 20, 21, 22, 23, 24, 34, 35]


# ─── Dimension Weights ──────────────────────────────────────────────────────

DIMENSION_WEIGHTS = {
    "d1_earnings": 1.3,
    "d2_schedule": 1.2,
    "d3_fairness": 1.2,
    "d4_onboarding": 1.1,
    "d5_retention": 1.0,
    "d6_byoc": 1.0,
    "d7_walkthroughs": 0.9,
}


# ─── Data Structures ────────────────────────────────────────────────────────

@dataclass
class Issue:
    dimension: str
    message: str
    severity: int = 1  # 1=info, 2=notable, 3=critical


@dataclass
class ScreenSection:
    number: str       # e.g. "17.1", "17.2"
    title: str        # e.g. "Invite Code Entry"
    body: str         # raw text of the screen section
    line_start: int


@dataclass
class FlowSection:
    flow_id: int              # e.g. 17
    title: str                # e.g. "Provider Onboarding"
    body: str                 # text before first screen (route, who, purpose)
    full_text: str            # entire flow text including screens
    screens: list = field(default_factory=list)  # list[ScreenSection]
    line_start: int = 0


@dataclass
class ScoreResult:
    provider_score: float
    max_possible: float
    # Per-dimension scores (0-10 each)
    d1_earnings: float
    d2_schedule: float
    d3_fairness: float
    d4_onboarding: float
    d5_retention: float
    d6_byoc: float
    d7_walkthroughs: float
    # Anti-gaming
    gaming_penalty: float
    # Metadata
    word_count: int
    issues_found: int
    issues: list = field(default_factory=list)


# ─── Parser: Provider Flows ─────────────────────────────────────────────────

def parse_provider_flows(text: str) -> list[FlowSection]:
    """Parse screen-flows.md and extract provider flows (17–24, 34, 35).

    Splits on `# FLOW N:` headings, then extracts `### Screen N.X:` within each.
    """
    lines = text.split("\n")
    flow_re = re.compile(r'^# FLOW (\d+):\s*(.+)$')
    screen_re = re.compile(r'^### Screen (\d+\.\d+):\s*(.+)$')

    # First pass: find all flow boundaries
    flow_starts: list[tuple[int, int, str]] = []  # (line_idx, flow_id, title)
    for i, line in enumerate(lines):
        m = flow_re.match(line)
        if m:
            flow_id = int(m.group(1))
            flow_starts.append((i, flow_id, m.group(2).strip()))

    flows: list[FlowSection] = []

    for idx, (start_line, flow_id, title) in enumerate(flow_starts):
        if flow_id not in PROVIDER_FLOW_IDS:
            continue

        # Determine end of this flow (start of next flow or EOF)
        if idx + 1 < len(flow_starts):
            end_line = flow_starts[idx + 1][0]
        else:
            end_line = len(lines)

        flow_lines = lines[start_line + 1:end_line]
        full_text = "\n".join(flow_lines)

        # Extract screens within this flow
        screens: list[ScreenSection] = []
        screen_starts: list[tuple[int, str, str]] = []  # (relative_idx, number, title)

        for j, fline in enumerate(flow_lines):
            sm = screen_re.match(fline)
            if sm:
                screen_starts.append((j, sm.group(1), sm.group(2).strip()))

        for si, (s_start, s_number, s_title) in enumerate(screen_starts):
            if si + 1 < len(screen_starts):
                s_end = screen_starts[si + 1][0]
            else:
                s_end = len(flow_lines)

            screen_body = "\n".join(flow_lines[s_start + 1:s_end])
            screens.append(ScreenSection(
                number=s_number,
                title=s_title,
                body=screen_body,
                line_start=start_line + 1 + s_start,  # 1-indexed line of screen heading
            ))

        # Body = text before first screen
        if screen_starts:
            body = "\n".join(flow_lines[:screen_starts[0][0]])
        else:
            body = full_text

        flows.append(FlowSection(
            flow_id=flow_id,
            title=title,
            body=body,
            full_text=full_text,
            screens=screens,
            line_start=start_line + 1,  # 1-indexed line of flow heading
        ))

    return flows


def get_all_screens(flows: list[FlowSection]) -> list[ScreenSection]:
    """Flatten all screens from all flows into a single list."""
    result = []
    for f in flows:
        result.extend(f.screens)
    return result


# ─── Utility Functions ──────────────────────────────────────────────────────

def count_words(text: str) -> int:
    """Count words in text, excluding markdown syntax artifacts."""
    cleaned = re.sub(r'```[\s\S]*?```', '', text)
    cleaned = re.sub(r'\|[-:]+\|', '', cleaned)
    cleaned = re.sub(r'[#*\`|>_\[\]]', ' ', cleaned)
    return len(cleaned.split())


def heading_similarity(a: str, b: str) -> float:
    """SequenceMatcher-based similarity ratio between two heading strings."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def jaccard_similarity(a: str, b: str) -> float:
    """Word-level Jaccard similarity between two strings."""
    if not a or not b:
        return 0.0
    words_a = set(a.lower().split())
    words_b = set(b.lower().split())
    if not words_a and not words_b:
        return 1.0
    if not words_a or not words_b:
        return 0.0
    return len(words_a & words_b) / len(words_a | words_b)


def count_keyword_matches(text: str, keywords: list[str]) -> int:
    """Count how many of the keywords appear in text (case-insensitive). Returns distinct count."""
    text_lower = text.lower()
    return sum(1 for kw in keywords if kw.lower() in text_lower)


def count_pattern_matches(text: str, pattern: str) -> int:
    """Count regex matches in text."""
    return len(re.findall(pattern, text, re.IGNORECASE | re.MULTILINE))


def find_screens_matching(flows: list[FlowSection], keywords: list[str]) -> list[ScreenSection]:
    """Find screens whose title or body contains any of the keywords (case-insensitive)."""
    results = []
    for flow in flows:
        for screen in flow.screens:
            combined = (screen.title + " " + screen.body).lower()
            if any(kw.lower() in combined for kw in keywords):
                results.append(screen)
    return results
