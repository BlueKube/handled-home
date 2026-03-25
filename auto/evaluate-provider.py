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
                line_start=start_line + 1 + s_start + 1,  # 1-indexed line of screen heading
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


# ─── Dimension 1: Earnings Transparency (1.3×) ─────────────────────────────

# Keywords for earnings-related sub-checks
PAYOUT_PREDICTION_KEYWORDS = [
    "projection", "projected", "at current pace", "est.", "estimated",
    "per job", "avg", "this week", "today",
    "stats grid", "period selector",
]

MODIFIER_KEYWORDS = [
    "modifier", "quality tier", "rush", "high-demand", "bonus",
    "adjustment", "base pay", "net breakdown", "breakdown", "expandable",
    "human-readable", "modifier explanation",
]

PROJECTION_KEYWORDS = [
    "capacity", "earnings projection", "estimated monthly",
    "growth cta", "fill your schedule", "at current pace",
    "earning potential", "zone", "dense routes",
]

HELD_EARNINGS_KEYWORDS = [
    "held", "hold", "on hold", "hold reason", "release",
    "review period", "under review", "payout account setup",
    "estimated release", "how it works",
]

PAYOUT_STATUS_KEYWORDS = [
    "payout account", "ready", "not set up", "set up payout",
    "deposited", "on schedule", "checkcircle", "pausecircle",
]


def score_d1_earnings_transparency(flows: list[FlowSection], all_text: str) -> tuple[float, list[Issue]]:
    """D1: Earnings Transparency — can provider predict next payout in 3 seconds?"""
    issues: list[Issue] = []
    points = 0.0  # max 10 (5 sub-checks × 2 points each)

    # Sub-check 1: Payout prediction speed (0-2 points)
    # Can provider see next payout at a glance? Stats grid, period selector, projection
    pred_matches = count_keyword_matches(all_text, PAYOUT_PREDICTION_KEYWORDS)
    if pred_matches >= 6:
        points += 2.0
    elif pred_matches >= 3:
        points += 1.0
    elif pred_matches >= 1:
        points += 0.5
    else:
        issues.append(Issue("D1_earnings", "No payout prediction elements found (stats grid, projection, period selector)", 3))

    # Sub-check 2: Modifier explanations (0-2 points)
    # Human-readable labels on modifiers with reasons
    mod_matches = count_keyword_matches(all_text, MODIFIER_KEYWORDS)
    has_modifier_labels = bool(count_pattern_matches(all_text, r'modifier\s+explanation|human-readable\s+reason|quality\s+tier\s+bonus|rush.*bonus|adjustment'))
    if mod_matches >= 6 and has_modifier_labels:
        points += 2.0
    elif mod_matches >= 4:
        points += 1.5
    elif mod_matches >= 2:
        points += 1.0
    elif mod_matches >= 1:
        points += 0.5
    else:
        issues.append(Issue("D1_earnings", "No modifier explanation labels found", 2))

    # Sub-check 3: Projection cards (0-2 points)
    # Capacity %, estimated monthly earnings, growth CTA
    proj_matches = count_keyword_matches(all_text, PROJECTION_KEYWORDS)
    proj_screens = find_screens_matching(flows, ["projection", "capacity", "earnings potential"])
    if proj_matches >= 5 and len(proj_screens) >= 1:
        points += 2.0
    elif proj_matches >= 3:
        points += 1.5
    elif proj_matches >= 2:
        points += 1.0
    elif proj_matches >= 1:
        points += 0.5
    else:
        issues.append(Issue("D1_earnings", "No earnings projection cards found", 2))

    # Sub-check 4: Held earnings detail (0-2 points)
    # Expandable section with hold reasons, estimated release
    held_matches = count_keyword_matches(all_text, HELD_EARNINGS_KEYWORDS)
    has_hold_reasons = bool(count_pattern_matches(all_text, r'hold\s+reason|new\s+provider\s+review|under\s+review|payout\s+account\s+setup'))
    if held_matches >= 5 and has_hold_reasons:
        points += 2.0
    elif held_matches >= 3:
        points += 1.5
    elif held_matches >= 1:
        points += 0.5
    else:
        issues.append(Issue("D1_earnings", "No held earnings detail or hold reasons found", 2))

    # Sub-check 5: Payout account status (0-2 points)
    # Ready/not-set-up states, setup CTA
    payout_matches = count_keyword_matches(all_text, PAYOUT_STATUS_KEYWORDS)
    has_dual_states = bool(count_pattern_matches(all_text, r'payout\s+account\s+ready|payout\s+account\s+not\s+set'))
    if payout_matches >= 4 and has_dual_states:
        points += 2.0
    elif payout_matches >= 2:
        points += 1.0
    elif payout_matches >= 1:
        points += 0.5
    else:
        issues.append(Issue("D1_earnings", "No payout account status section found", 2))

    return min(points, 10.0), issues


# ─── Dimension 2: Schedule Control (1.2×) ──────────────────────────────────

ROUTE_LOCK_KEYWORDS = [
    "route lock", "lock your route", "start route", "route locked",
    "lock icon", "stops", "projected earnings", "begin your day",
]

QUEUE_BREADCRUMB_KEYWORDS = [
    "stop x of y", "breadcrumb", "prev/next", "navigation arrows",
    "chevronleft", "chevronright", "queue breadcrumb",
]

ROUTE_OPTIMIZATION_KEYWORDS = [
    "optimize route", "route optimization", "reorder",
    "shortest drive", "drive time", "optimize",
]

AVAILABILITY_KEYWORDS = [
    "availability", "coverage", "zone selection", "capacity",
    "sku capabilities", "coverage & capacity",
]

JOB_LIST_KEYWORDS = [
    "map/list", "view toggle", "segmented control",
    "today", "this week", "all", "tabs",
    "job cards", "rank", "status badge",
]


def score_d2_schedule_control(flows: list[FlowSection], all_text: str) -> tuple[float, list[Issue]]:
    """D2: Schedule Control — route lock, queue, optimization, availability, job views."""
    issues: list[Issue] = []
    points = 0.0  # max 10 (5 sub-checks × 2 points each)

    # Sub-check 1: Route lock UX (0-2 points)
    lock_matches = count_keyword_matches(all_text, ROUTE_LOCK_KEYWORDS)
    has_lock_states = bool(count_pattern_matches(all_text, r'not\s+locked|route\s+locked'))
    if lock_matches >= 4 and has_lock_states:
        points += 2.0
    elif lock_matches >= 2:
        points += 1.0
    elif lock_matches >= 1:
        points += 0.5
    else:
        issues.append(Issue("D2_schedule", "No route lock UX found", 2))

    # Sub-check 2: Queue breadcrumb (0-2 points)
    bread_matches = count_keyword_matches(all_text, QUEUE_BREADCRUMB_KEYWORDS)
    has_breadcrumb = bool(count_pattern_matches(all_text, r'stop\s+\w+\s+of\s+\w+|queue\s+breadcrumb'))
    if bread_matches >= 4 and has_breadcrumb:
        points += 2.0
    elif bread_matches >= 2:
        points += 1.0
    elif bread_matches >= 1:
        points += 0.5
    else:
        issues.append(Issue("D2_schedule", "No queue breadcrumb (Stop X of Y) found", 2))

    # Sub-check 3: Route optimization (0-2 points)
    opt_matches = count_keyword_matches(all_text, ROUTE_OPTIMIZATION_KEYWORDS)
    has_optimize_button = bool(count_pattern_matches(all_text, r'optimize\s+route|shortest\s+drive'))
    if opt_matches >= 3 and has_optimize_button:
        points += 2.0
    elif opt_matches >= 2:
        points += 1.5
    elif opt_matches >= 1:
        points += 1.0
    else:
        issues.append(Issue("D2_schedule", "No route optimization controls found", 2))

    # Sub-check 4: Availability management (0-2 points)
    avail_matches = count_keyword_matches(all_text, AVAILABILITY_KEYWORDS)
    avail_screens = find_screens_matching(flows, ["coverage", "availability", "capacity"])
    if avail_matches >= 3 and len(avail_screens) >= 1:
        points += 2.0
    elif avail_matches >= 2:
        points += 1.0
    elif avail_matches >= 1:
        points += 0.5
    else:
        issues.append(Issue("D2_schedule", "No availability/coverage management found", 2))

    # Sub-check 5: Job list views (0-2 points)
    view_matches = count_keyword_matches(all_text, JOB_LIST_KEYWORDS)
    has_toggle = bool(count_pattern_matches(all_text, r'map/list|view\s+toggle|segmented\s+control'))
    has_tabs = bool(count_pattern_matches(all_text, r'today\s*\|\s*this\s*week|tabs'))
    if view_matches >= 5 and has_toggle and has_tabs:
        points += 2.0
    elif view_matches >= 3:
        points += 1.5
    elif view_matches >= 1:
        points += 0.5
    else:
        issues.append(Issue("D2_schedule", "No job list view controls (map/list, tabs) found", 2))

    return min(points, 10.0), issues


# ─── Dimension 3: Fairness Signals (1.2×) ──────────────────────────────────

GUARANTEED_PAYOUT_KEYWORDS = [
    "guaranteed", "predictable", "per-job", "set by sku",
    "guaranteed payout", "payout per job", "no surprise",
]

NO_TIP_KEYWORDS = [
    "no-tip", "no tip", "tip dependency", "tip-dependency",
    "no surprise adjustments", "never see customer pricing",
]

DENSITY_KEYWORDS = [
    "route density", "dense routes", "denser routes",
    "less driving", "more earning", "density",
    "more stops", "better earnings", "flywheel",
]

TRANSPARENT_MODIFIER_KEYWORDS = [
    "modifier breakdown", "quality tier", "rush bonus",
    "adjustment reason", "transparent modifier", "base pay",
    "modifier explanation", "human-readable reason",
]

MINIMUM_EARNINGS_KEYWORDS = [
    "minimum", "floor", "guaranteed minimum", "base pay",
    "minimum earnings", "guaranteed route pay",
]


def score_d3_fairness_signals(flows: list[FlowSection], all_text: str) -> tuple[float, list[Issue]]:
    """D3: Fairness Signals — guaranteed payout, no-tip, density, transparent modifiers."""
    issues: list[Issue] = []
    points = 0.0  # max 10 (5 sub-checks × 2 points each)

    # Sub-check 1: Guaranteed payout framing (0-2 points)
    guar_matches = count_keyword_matches(all_text, GUARANTEED_PAYOUT_KEYWORDS)
    if guar_matches >= 4:
        points += 2.0
    elif guar_matches >= 2:
        points += 1.5
    elif guar_matches >= 1:
        points += 1.0
    else:
        issues.append(Issue("D3_fairness", "No guaranteed payout framing found", 3))

    # Sub-check 2: No-tip language (0-2 points)
    tip_matches = count_keyword_matches(all_text, NO_TIP_KEYWORDS)
    if tip_matches >= 3:
        points += 2.0
    elif tip_matches >= 2:
        points += 1.5
    elif tip_matches >= 1:
        points += 1.0
    else:
        issues.append(Issue("D3_fairness", "No tip-independence language found", 2))

    # Sub-check 3: Density messaging (0-2 points)
    density_matches = count_keyword_matches(all_text, DENSITY_KEYWORDS)
    if density_matches >= 4:
        points += 2.0
    elif density_matches >= 2:
        points += 1.5
    elif density_matches >= 1:
        points += 1.0
    else:
        issues.append(Issue("D3_fairness", "No route density messaging found", 2))

    # Sub-check 4: Transparent modifiers (0-2 points)
    mod_matches = count_keyword_matches(all_text, TRANSPARENT_MODIFIER_KEYWORDS)
    if mod_matches >= 4:
        points += 2.0
    elif mod_matches >= 2:
        points += 1.5
    elif mod_matches >= 1:
        points += 1.0
    else:
        issues.append(Issue("D3_fairness", "No transparent modifier breakdown found", 2))

    # Sub-check 5: Minimum earnings signals (0-2 points)
    min_matches = count_keyword_matches(all_text, MINIMUM_EARNINGS_KEYWORDS)
    if min_matches >= 3:
        points += 2.0
    elif min_matches >= 2:
        points += 1.5
    elif min_matches >= 1:
        points += 1.0
    else:
        issues.append(Issue("D3_fairness", "No minimum earnings signals found", 2))

    return min(points, 10.0), issues


# ─── Dimension 4: Onboarding Friction (1.1×) ───────────────────────────────

STEP_COUNT_KEYWORDS = [
    "step 1", "step 2", "step 3", "step 4", "step 5", "step 6",
    "progress bar", "progress indicator", "of 6",
]

PROGRESSIVE_DISCLOSURE_KEYWORDS = [
    "skip for now", "complete later", "skip option",
    "skip", "optional", "ghost",
]

RESUME_STATE_KEYWORDS = [
    "resume", "draft", "continue your application",
    "continue application", "next incomplete step",
    "your data is saved",
]

COMPLIANCE_UX_KEYWORDS = [
    "compliance", "insurance", "tax document", "w-9",
    "upload", "file upload", "accepted formats",
    "compliance documents", "compliance status",
]

INVITE_CODE_KEYWORDS = [
    "invite code", "verify code", "code entry",
    "handled-", "invalid", "error text", "validation",
    "format status", "code format",
]


def score_d4_onboarding_friction(flows: list[FlowSection], all_text: str) -> tuple[float, list[Issue]]:
    """D4: Onboarding Friction — steps to first job, progressive disclosure, resume state."""
    issues: list[Issue] = []
    points = 0.0

    # Sub-check 1: Step count (0-2 points)
    # How many steps to first job? 6 steps specified, each should be documented
    step_matches = count_keyword_matches(all_text, STEP_COUNT_KEYWORDS)
    has_progress = bool(count_pattern_matches(all_text, r'step\s+\d+\s+of\s+\d+|progress\s+bar'))
    if step_matches >= 5 and has_progress:
        points += 2.0
    elif step_matches >= 3:
        points += 1.5
    elif step_matches >= 1:
        points += 1.0
    else:
        issues.append(Issue("D4_onboarding", "No step count or progress indicators found", 2))

    # Sub-check 2: Progressive disclosure (0-2 points)
    skip_matches = count_keyword_matches(all_text, PROGRESSIVE_DISCLOSURE_KEYWORDS)
    skip_screens = find_screens_matching(flows, ["skip for now", "complete later"])
    if skip_matches >= 4 and len(skip_screens) >= 2:
        points += 2.0
    elif skip_matches >= 2:
        points += 1.5
    elif skip_matches >= 1:
        points += 1.0
    else:
        issues.append(Issue("D4_onboarding", "No progressive disclosure (skip/complete later) found", 2))

    # Sub-check 3: Resume/draft state (0-2 points)
    resume_matches = count_keyword_matches(all_text, RESUME_STATE_KEYWORDS)
    has_resume = bool(count_pattern_matches(all_text, r'continue\s+your\s+application|draft|resume'))
    if resume_matches >= 3 and has_resume:
        points += 2.0
    elif resume_matches >= 2:
        points += 1.5
    elif resume_matches >= 1:
        points += 1.0
    else:
        issues.append(Issue("D4_onboarding", "No resume/draft state for incomplete onboarding", 2))

    # Sub-check 4: Compliance UX (0-2 points)
    comp_matches = count_keyword_matches(all_text, COMPLIANCE_UX_KEYWORDS)
    if comp_matches >= 5:
        points += 2.0
    elif comp_matches >= 3:
        points += 1.5
    elif comp_matches >= 1:
        points += 1.0
    else:
        issues.append(Issue("D4_onboarding", "No compliance document UX found", 2))

    # Sub-check 5: Invite code flow (0-2 points)
    invite_matches = count_keyword_matches(all_text, INVITE_CODE_KEYWORDS)
    has_validation = bool(count_pattern_matches(all_text, r'invite\s+code|verify\s+code|code\s+format'))
    if invite_matches >= 4 and has_validation:
        points += 2.0
    elif invite_matches >= 2:
        points += 1.5
    elif invite_matches >= 1:
        points += 1.0
    else:
        issues.append(Issue("D4_onboarding", "No invite code flow found", 2))

    return min(points, 10.0), issues


# ─── Dimension 5: Retention Hooks (1.0×) ───────────────────────────────────

CELEBRATION_KEYWORDS = [
    "celebration", "job complete", "party popper", "partypopper",
    "trophy", "great work", "all stops finished",
]

PERFORMANCE_KEYWORDS = [
    "quality score", "quality rating", "performance",
    "feedback", "rating breakdown", "first three completed",
]

INSIGHTS_KEYWORDS = [
    "insights", "coaching", "recommendations",
    "growth recommendations", "trends", "lightbulb",
]

GROWTH_PATH_KEYWORDS = [
    "capacity", "fill your schedule", "earn more",
    "growth cta", "at current pace", "earnings potential",
]

GAMIFICATION_KEYWORDS = [
    "route progress", "streak", "milestone",
    "stops complete", "progress bar", "capacity meter",
    "segmented progress",
]


def score_d5_retention_hooks(flows: list[FlowSection], all_text: str) -> tuple[float, list[Issue]]:
    """D5: Retention Hooks — celebrations, performance, insights, growth, gamification."""
    issues: list[Issue] = []
    points = 0.0

    # Sub-check 1: Celebration screens (0-2 points)
    celeb_matches = count_keyword_matches(all_text, CELEBRATION_KEYWORDS)
    celeb_screens = find_screens_matching(flows, ["complete", "celebration", "trophy"])
    if celeb_matches >= 4 and len(celeb_screens) >= 1:
        points += 2.0
    elif celeb_matches >= 2:
        points += 1.5
    elif celeb_matches >= 1:
        points += 1.0
    else:
        issues.append(Issue("D5_retention", "No celebration/completion screens found", 2))

    # Sub-check 2: Performance/quality score (0-2 points)
    perf_matches = count_keyword_matches(all_text, PERFORMANCE_KEYWORDS)
    perf_screens = find_screens_matching(flows, ["quality", "performance"])
    if perf_matches >= 3 and len(perf_screens) >= 1:
        points += 2.0
    elif perf_matches >= 2:
        points += 1.5
    elif perf_matches >= 1:
        points += 1.0
    else:
        issues.append(Issue("D5_retention", "No performance/quality score screens found", 2))

    # Sub-check 3: Insights/coaching (0-2 points)
    insight_matches = count_keyword_matches(all_text, INSIGHTS_KEYWORDS)
    insight_screens = find_screens_matching(flows, ["insights", "coaching"])
    if insight_matches >= 3 and len(insight_screens) >= 1:
        points += 2.0
    elif insight_matches >= 2:
        points += 1.5
    elif insight_matches >= 1:
        points += 1.0
    else:
        issues.append(Issue("D5_retention", "No insights or coaching features found", 2))

    # Sub-check 4: Growth path signals (0-2 points)
    growth_matches = count_keyword_matches(all_text, GROWTH_PATH_KEYWORDS)
    if growth_matches >= 4:
        points += 2.0
    elif growth_matches >= 2:
        points += 1.5
    elif growth_matches >= 1:
        points += 1.0
    else:
        issues.append(Issue("D5_retention", "No growth path signals found", 2))

    # Sub-check 5: Capacity/streak gamification (0-2 points)
    gam_matches = count_keyword_matches(all_text, GAMIFICATION_KEYWORDS)
    if gam_matches >= 4:
        points += 2.0
    elif gam_matches >= 2:
        points += 1.5
    elif gam_matches >= 1:
        points += 1.0
    else:
        issues.append(Issue("D5_retention", "No gamification elements (streaks, progress, milestones) found", 2))

    return min(points, 10.0), issues


# ─── Evaluate ───────────────────────────────────────────────────────────────

def evaluate(path: Optional[str] = None, verbose: bool = False) -> ScoreResult:
    """Run 7-dimension provider experience evaluation."""
    filepath = Path(path) if path else SCREEN_FLOWS_PATH
    if not filepath.exists():
        print(f"ERROR: {filepath} not found", file=sys.stderr)
        sys.exit(1)

    text = filepath.read_text(encoding="utf-8")
    flows = parse_provider_flows(text)

    if not flows:
        print("ERROR: No provider flows found in document", file=sys.stderr)
        sys.exit(1)

    all_text = "\n".join(f.full_text for f in flows)
    all_issues: list[Issue] = []

    # ─── D1-D3 Scoring ───
    d1, issues = score_d1_earnings_transparency(flows, all_text)
    all_issues.extend(issues)

    d2, issues = score_d2_schedule_control(flows, all_text)
    all_issues.extend(issues)

    d3, issues = score_d3_fairness_signals(flows, all_text)
    all_issues.extend(issues)

    # ─── D4-D5 Scoring ───
    d4, issues = score_d4_onboarding_friction(flows, all_text)
    all_issues.extend(issues)

    d5, issues = score_d5_retention_hooks(flows, all_text)
    all_issues.extend(issues)

    # ─── D6-D7 Placeholders (implemented in Batch 5) ───
    d6 = 0.0
    d7 = 0.0

    # ─── Anti-Gaming Placeholder (implemented in Batch 6) ───
    gaming_penalty = 0.0

    # ─── Composite Score ───
    scores = {
        "d1_earnings": d1, "d2_schedule": d2, "d3_fairness": d3,
        "d4_onboarding": d4, "d5_retention": d5, "d6_byoc": d6,
        "d7_walkthroughs": d7,
    }

    weighted_sum = sum(scores[k] * DIMENSION_WEIGHTS[k] for k in scores)
    total_weight = sum(DIMENSION_WEIGHTS.values())
    weighted_avg = weighted_sum / total_weight  # 0-10

    composite = weighted_avg * 10.0 - gaming_penalty
    composite = max(min(composite, 100.0), 0.0)

    return ScoreResult(
        provider_score=round(composite, 2),
        max_possible=100.0,
        d1_earnings=round(d1, 2),
        d2_schedule=round(d2, 2),
        d3_fairness=round(d3, 2),
        d4_onboarding=round(d4, 2),
        d5_retention=round(d5, 2),
        d6_byoc=round(d6, 2),
        d7_walkthroughs=round(d7, 2),
        gaming_penalty=round(gaming_penalty, 2),
        word_count=count_words(all_text),
        issues_found=len(all_issues),
        issues=all_issues,
    )


# ─── Output ──────────────────────────────────────────────────────────────────

def print_results(result: ScoreResult, verbose: bool = False):
    """Print results in grep-friendly format."""
    print("---")
    print(f"provider_score:      {result.provider_score:.2f}")
    print(f"max_possible:        {result.max_possible:.2f}")
    print(f"d1_earnings:         {result.d1_earnings:.2f}")
    print(f"d2_schedule:         {result.d2_schedule:.2f}")
    print(f"d3_fairness:         {result.d3_fairness:.2f}")
    print(f"d4_onboarding:       {result.d4_onboarding:.2f}")
    print(f"d5_retention:        {result.d5_retention:.2f}")
    print(f"d6_byoc:             {result.d6_byoc:.2f}")
    print(f"d7_walkthroughs:     {result.d7_walkthroughs:.2f}")
    print(f"gaming_penalty:      {result.gaming_penalty:.2f}")
    print(f"word_count:          {result.word_count}")
    print(f"issues_found:        {result.issues_found}")
    print("---")

    if verbose:
        print(f"\n## Score Breakdown")
        dimensions = [
            ("D1  Earnings", result.d1_earnings, 1.3),
            ("D2  Schedule", result.d2_schedule, 1.2),
            ("D3  Fairness", result.d3_fairness, 1.2),
            ("D4  Onboarding", result.d4_onboarding, 1.1),
            ("D5  Retention", result.d5_retention, 1.0),
            ("D6  BYOC", result.d6_byoc, 1.0),
            ("D7  Walkthroughs", result.d7_walkthroughs, 0.9),
        ]
        for name, score, weight in dimensions:
            filled = round(score)
            bar = "█" * filled + "░" * (10 - filled)
            print(f"  {name:18s} {bar} {score:.1f}/10  (×{weight})")

        if result.gaming_penalty > 0:
            print(f"\n  Gaming penalty:    -{result.gaming_penalty:.1f}")

        print(f"\n  Word count:        {result.word_count}")

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
