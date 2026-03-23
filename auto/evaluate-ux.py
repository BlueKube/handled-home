#!/usr/bin/env python3
"""
evaluate-ux.py — 5-Layer UX Scoring Harness for Handled Home screen-flows.md
=============================================================================

Analogous to Karpathy's prepare.py: this file is READ-ONLY for the agent.
It parses docs/screen-flows.md and scores it. HIGHER ux_score = better.

## 5 Scoring Layers

Layer 1 — NIELSEN'S 10 HEURISTICS (industry gold standard since 1994)
  H1. Visibility of system status      → loading states, progress, status badges
  H2. Match between system & real world → user language, not jargon
  H3. User control & freedom            → back buttons, undo, cancel, dismiss
  H4. Consistency & standards            → design tokens, component patterns
  H5. Error prevention                   → validation, confirmation, guard screens
  H6. Recognition rather than recall     → explicit CTAs, visible labels, navigation
  H7. Flexibility & efficiency           → shortcuts, skip options, personalization
  H8. Aesthetic & minimalist design      → density, no irrelevant info, hierarchy
  H9. Error recovery                     → error states with plain language + fix
  H10. Help & documentation              → explainers, tooltips, empty states guide

Layer 2 — PURE-STYLE SEVERITY WEIGHTING
  Each violation scored 1 (cosmetic) to 3 (blocks task / causes failure).
  Weighted sum produces friction-aware composite.

Layer 3 — COGNITIVE WALKTHROUGH (Spencer's Streamlined CW)
  For key task flows: at each step, checks two questions:
    Q1: Will the user know what to do? (CTA visible, label clear, action obvious)
    Q2: Will the user know it worked?  (feedback defined: success/progress/confirmation)

Layer 4 — ANTI-GAMING GUARDS (Goodhart's Law protection)
  - Uniqueness: penalize duplicate/boilerplate copy across screens
  - Relevance: trust signals only count on conversion screens
  - Diminishing returns: score gains taper for bulk additions
  - Simplicity bonus: shorter/cleaner specs that maintain score are rewarded

Layer 5 — LLM-AS-JUDGE STUB (periodic subjective scoring)
  - When --llm-judge flag is passed, sends sampled screens to an LLM
  - Scores brand tone, specificity, actionability (1-5 each)
  - Designed to run every 5-10 experiments, not every one

Output (grep-friendly):
  ux_score:          74.50
  max_possible:      100.00
  ...per-dimension scores...
  issues_found:      42
  screens_analyzed:  117
"""

import re
import sys
import json
import hashlib
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional
from collections import Counter, defaultdict


# ─── Configuration ───────────────────────────────────────────────────────────

SCREEN_FLOWS_PATH = Path(__file__).parent / "screen-flows.md"

# ─── Nielsen H2: Real-world language (positive / negative signals) ───────────

BRAND_VOICE_POSITIVE = [
    # Direct brand phrases
    "your home", "handled", "we'll", "you'll", "welcome", "your next",
    "your routine", "your service", "your provider", "your membership",
    "your schedule", "your activity", "your earnings", "your score",
    "your plan", "your account", "your team", "your zone", "your area",
    "your property", "your subscription", "your payout",
    # Calm/competent tone indicators
    "managed", "automatic", "easy", "simple", "clear", "peace of mind",
    "ready", "on track", "taken care of", "no worries",
    "effective next cycle", "browse available", "subscribe when",
    # Forward-looking / helpful language
    "will appear", "will be", "will show", "will receive", "will notify",
    "once scheduled", "once confirmed", "once completed", "once set up",
    "when available", "when ready",
    # Proof / trust language (the product's core value)
    "proof", "verified", "insured", "tracked", "recorded",
    "receipt", "photo", "checklist",
    # Calm operational language
    "update", "manage", "review", "adjust", "maintain",
    "keep", "stay", "track", "monitor",
    # Reassurance
    "cancel anytime", "no commitment", "free to",
    "safe", "secure", "trusted", "reliable",
    "we handle", "we manage", "we coordinate",
]

BRAND_VOICE_NEGATIVE = [
    "sorry", "unfortunately", "oops", "uh oh", "whoops",
    "can't", "won't", "impossible", "something went wrong",
    "buy now", "limited time", "act fast", "don't miss",
    "hurry", "last chance", "exclusive offer", "amazing",
    "incredible", "unbelievable",
]

# ─── Nielsen H6: Strong CTA verbs (Recognition > Recall) ────────────────────

STRONG_CTA_VERBS = [
    "view", "go to", "continue", "confirm", "save", "submit",
    "add", "start", "build", "review", "browse", "share",
    "create", "set up", "accept", "subscribe", "generate",
    "lock", "complete", "verify", "explore", "get started",
    "sign in", "sign up", "activate", "manage", "update",
    "report", "resolve", "fix", "change", "edit",
]

WEAK_CTA_PATTERNS = [
    r"^click here$", r"^learn more$", r"^see details$",
    r"^ok$", r"^done$", r"^submit$",
]

# ─── Trust signals (for conversion screens) ──────────────────────────────────

TRUST_SIGNALS = [
    "insured", "guarantee", "cancel anytime", "no commitment",
    "proof", "verified", "secure", "trusted", "curated",
    "satisfaction", "free to join", "shield", "free to",
    "no obligation", "risk-free", "money-back",
]

# ─── Cognitive Walkthrough: Key task flows to evaluate ───────────────────────

KEY_TASK_FLOWS = {
    "customer_onboarding": {
        "description": "New customer signs up and completes onboarding",
        "flow_numbers": ["1", "5"],
        "screens": ["1.1", "5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "5.9", "5.10"],
    },
    "byoc_activation": {
        "description": "Customer activates through provider BYOC invite",
        "flow_numbers": ["2", "6"],
        "screens": ["2.1"],
    },
    "browse_and_subscribe": {
        "description": "Customer browses plans and subscribes",
        "flow_numbers": ["8"],
        "screens": ["8.1", "8.2", "8.3"],
    },
    "routine_management": {
        "description": "Customer builds and confirms their routine",
        "flow_numbers": ["9"],
        "screens": ["9.1", "9.2", "9.3"],
    },
    "provider_job_execution": {
        "description": "Provider completes a job from queue to completion",
        "flow_numbers": ["19"],
        "screens": ["19.1", "19.2", "19.3", "19.4", "19.5"],
    },
    "provider_onboarding": {
        "description": "Provider enters invite code and completes onboarding",
        "flow_numbers": ["17"],
        "screens": ["17.1", "17.2", "17.3", "17.4", "17.5", "17.6", "17.7"],
    },
}

# ─── Conversion/onboarding screen identifiers (for trust signal relevance) ───

CONVERSION_KEYWORDS = [
    "onboarding", "subscribe", "checkout", "plan", "sign up",
    "activate", "invite", "membership", "confirm your",
]


# ─── Data Structures ─────────────────────────────────────────────────────────

@dataclass
class Issue:
    severity: int       # PURE scale: 1=cosmetic, 2=friction, 3=blocks/fails
    heuristic: str      # which Nielsen heuristic or layer
    screen: str         # which screen/flow
    message: str        # description


@dataclass
class Screen:
    flow_number: str
    screen_id: str
    title: str
    route: Optional[str] = None
    who: Optional[str] = None
    purpose: Optional[str] = None
    has_layout: bool = False
    sections: list = field(default_factory=list)
    has_empty_state: bool = False
    has_loading_state: bool = False
    has_error_state: bool = False
    has_primary_cta: bool = False
    cta_text: Optional[str] = None
    has_back_button: bool = False
    has_cancel_dismiss: bool = False
    has_undo: bool = False
    has_confirmation: bool = False
    has_validation: bool = False
    has_skip_option: bool = False
    has_progress_indicator: bool = False
    has_status_badge: bool = False
    has_feedback: bool = False  # success state, toast, confirmation
    has_explainer: bool = False  # tooltips, help text, education component
    section_count: int = 0
    raw_text: str = ""
    has_dynamic_data: bool = False
    is_conversion_screen: bool = False
    copy_strings: list = field(default_factory=list)
    empty_state_text: str = ""


@dataclass
class ScoreResult:
    ux_score: float
    max_possible: float
    # Layer 1: Nielsen's 10
    h1_visibility: float
    h2_real_world: float
    h3_user_control: float
    h4_consistency: float
    h5_error_prevention: float
    h6_recognition: float
    h7_flexibility: float
    h8_minimalist: float
    h9_error_recovery: float
    h10_help: float
    # Layer 3: Cognitive Walkthrough
    cw_score: float
    # Layer 4: Anti-gaming
    gaming_penalty: float
    simplicity_bonus: float
    # Metadata
    issues_found: int
    screens_analyzed: int
    total_friction: int
    issues: list = field(default_factory=list)


# ─── Parser ──────────────────────────────────────────────────────────────────

def parse_screen_flows(text: str) -> list[Screen]:
    """Parse screen-flows.md into a list of Screen objects."""
    screens = []
    current_flow = ""
    current_screen = None
    flow_purpose = ""

    lines = text.split("\n")
    i = 0

    while i < len(lines):
        line = lines[i].strip()

        # Detect flow headers
        flow_match = re.match(r'^#\s+FLOW\s+(\d+):', line)
        if flow_match:
            current_flow = flow_match.group(1)
            if current_screen:
                screens.append(current_screen)
                current_screen = None

        # Flow-level metadata (inheritable)
        if not current_screen:
            route_match = re.match(r'\*\*Route\*\*:\s*`(.+?)`', line)
            if route_match:
                flow_purpose = ""  # reset
            purpose_match = re.match(r'\*\*Purpose\*\*:\s*(.+)', line)
            if purpose_match:
                flow_purpose = purpose_match.group(1).strip()

        # Detect screen headers
        screen_match = re.match(r'^###\s+Screen\s+(\d+\.\d+):\s*(.+)', line)
        if screen_match:
            if current_screen:
                screens.append(current_screen)
            screen_id = screen_match.group(1)
            title = screen_match.group(2).strip()
            current_screen = Screen(
                flow_number=current_flow,
                screen_id=screen_id,
                title=title,
            )

        if current_screen:
            current_screen.raw_text += line + "\n"

            # ─── Structure parsing ───
            route_match = re.match(r'\*\*Route\*\*:\s*`(.+?)`', line)
            if route_match:
                current_screen.route = route_match.group(1)

            who_match = re.match(r'\*\*Who\*\*:\s*(.+)', line)
            if who_match:
                current_screen.who = who_match.group(1).strip()

            purpose_match = re.match(r'\*\*Purpose\*\*:\s*(.+)', line)
            if purpose_match:
                current_screen.purpose = purpose_match.group(1).strip()

            if re.match(r'\*\*Layout\*\*', line):
                current_screen.has_layout = True

            section_match = re.match(r'^\d+\.\s+\*\*(.+?)\*\*', line)
            if section_match:
                current_screen.sections.append(section_match.group(1))
                current_screen.section_count += 1

            # ─── H1: Visibility of system status ───
            if re.search(r'[Ll]oading|[Ss]keleton|[Ss]pinner|shimmer', line, re.IGNORECASE):
                current_screen.has_loading_state = True
            if re.search(r'[Pp]rogress\s*(bar|indicator|step|counter)', line, re.IGNORECASE):
                current_screen.has_progress_indicator = True
            if re.search(r'[Ss]tatus\s*[Bb]adge|StatusBadge|status\s*chip', line, re.IGNORECASE):
                current_screen.has_status_badge = True

            # ─── H3: User control & freedom ───
            if re.search(r'[Bb]ack\s*[Bb]utton|ChevronLeft|ArrowLeft|"←|← ', line):
                current_screen.has_back_button = True
            if re.search(r'[Cc]ancel|[Dd]ismiss|[Cc]lose|dismiss\s*X', line, re.IGNORECASE):
                current_screen.has_cancel_dismiss = True
            if re.search(r'[Uu]ndo|[Rr]evert|[Rr]estore', line, re.IGNORECASE):
                current_screen.has_undo = True

            # ─── H5: Error prevention ───
            if re.search(r'[Cc]onfirm|[Aa]re you sure|confirmation', line, re.IGNORECASE):
                current_screen.has_confirmation = True
            if re.search(r'[Vv]alidat|required|[Mm]ax\s*\d|[Mm]in\s*\d|pattern|constraint', line, re.IGNORECASE):
                current_screen.has_validation = True

            # ─── H7: Flexibility ───
            if re.search(r'[Ss]kip|optional|"Skip for now"|ghost.*skip', line, re.IGNORECASE):
                current_screen.has_skip_option = True

            # ─── H9: Error recovery ───
            if re.search(r'[Ee]rror|[Ff]ailed|[Dd]estructive|[Ww]arning|AlertTriangle', line, re.IGNORECASE):
                current_screen.has_error_state = True

            # ─── H10: Help & documentation ───
            if re.search(r'[Ee]xplainer|[Tt]ooltip|[Hh]elp\s*text|[Ee]ducation|[Hh]ow\s*it\s*works|info\s*tooltip', line, re.IGNORECASE):
                current_screen.has_explainer = True

            # ─── Empty states ───
            empty_match = re.search(r'[Ee]mpty\s*(?:[Ss]tate)?.*?:\s*(.+)', line)
            if empty_match:
                current_screen.has_empty_state = True
                current_screen.empty_state_text += empty_match.group(1).strip() + " "
            elif re.search(r'[Ee]mpty\s*[Ss]tate|[Ee]mpty:', line, re.IGNORECASE):
                current_screen.has_empty_state = True

            # ─── Feedback (success, toast, confirmation) ───
            if re.search(r'[Ss]uccess|[Tt]oast|"✓|[Cc]onfirmation|[Cc]elebrat|[Cc]omplete', line, re.IGNORECASE):
                current_screen.has_feedback = True

            # ─── Primary CTA ───
            cta_match = re.search(r'Button\s*\([^)]*\):\s*["\'\u201c]?(.+?)(?:["\'\u201d]|\s*\+|\s*$)', line)
            if not cta_match:
                cta_match = re.search(r'Button.*?:\s*["\'\u201c]?(.+?)(?:["\'\u201d]|\s*\+|\s*$)', line)
            if cta_match:
                current_screen.has_primary_cta = True
                if not current_screen.cta_text:
                    current_screen.cta_text = cta_match.group(1).strip().strip('"\'""')

            # ─── Dynamic data indicators ───
            if re.search(r'list|cards?\s*\(repeating\)|timeline|history|queue|tickets?|referrals?|earnings?|payouts?|members?|providers?|jobs?', line, re.IGNORECASE):
                current_screen.has_dynamic_data = True

            # ─── Copy strings (for voice analysis) ───
            for match in re.findall(r'["\u201c]([^"\u201d]{4,})["\u201d]', line):
                current_screen.copy_strings.append(match)

            # ─── Conversion screen detection ───
            title_and_purpose = (current_screen.title + " " + (current_screen.purpose or "")).lower()
            if any(kw in title_and_purpose for kw in CONVERSION_KEYWORDS):
                current_screen.is_conversion_screen = True

        i += 1

    if current_screen:
        screens.append(current_screen)

    return screens


# ─── Layer 1: Nielsen's 10 Heuristics ────────────────────────────────────────

def score_h1_visibility(screens: list[Screen]) -> tuple[float, list[Issue]]:
    """H1: Visibility of system status — loading, progress, status badges."""
    issues = []
    points = 0
    max_points = 0

    for s in screens:
        if s.section_count < 2:
            continue
        max_points += 3

        if s.has_loading_state:
            points += 1
        else:
            issues.append(Issue(1 if not s.has_dynamic_data else 2, "H1_visibility",
                                s.screen_id, f"'{s.title}' missing loading/skeleton state"))

        if s.has_progress_indicator or s.has_status_badge:
            points += 1
        elif s.has_dynamic_data:
            issues.append(Issue(1, "H1_visibility", s.screen_id,
                                f"'{s.title}' has dynamic data but no status indicator"))

        if s.has_feedback:
            points += 1
        elif s.has_primary_cta:
            issues.append(Issue(1, "H1_visibility", s.screen_id,
                                f"'{s.title}' has CTA but no feedback/success state defined"))

    score = (points / max_points * 10) if max_points > 0 else 5.0
    return min(score, 10.0), issues


def _is_real_copy(s: str) -> bool:
    """Filter out markdown artifacts that the regex accidentally captured."""
    # Skip if it contains markdown syntax
    if any(marker in s for marker in ['**', '`', '→', '<!--', '###', '|', '\n']):
        return False
    # Skip if it starts/ends with punctuation that suggests a fragment
    if s.startswith((',', '+', '-', ')', '(', '\n')):
        return False
    # Skip very long strings (likely captured a whole section)
    if len(s) > 200:
        return False
    return True


def score_h2_real_world(screens: list[Screen]) -> tuple[float, list[Issue]]:
    """H2: Match between system and real world — brand voice, user language.
    
    Scores two sub-dimensions:
      A) User-facing sentences (4+ words, real copy only): what % use
         language aligned with the brand voice?
      B) All copy: are there brand-negative violations?
    
    Short UI labels ("Email", "Password") and markdown artifacts are excluded
    from the positive ratio — they'd make H2 structurally capped.
    
    The brand-positive list covers both:
      - Explicit brand phrases ("your home", "handled", "your routine")
      - Tone indicators: calm, helpful, forward-looking language
    """
    issues = []
    all_copy = []
    for s in screens:
        all_copy.extend(s.copy_strings)

    # Filter to real user-facing copy (not markdown artifacts)
    real_copy = [c for c in all_copy if _is_real_copy(c)]

    if not real_copy:
        return 5.0, issues

    # Separate sentences from short labels
    sentences = [c for c in real_copy if len(c.split()) >= 4]
    
    positive_hits = 0
    negative_hits = 0

    # Score positive ratio only on sentences (not labels)
    for c in sentences:
        c_lower = c.lower()
        if any(phrase in c_lower for phrase in BRAND_VOICE_POSITIVE):
            positive_hits += 1

    # Score negative violations on ALL real copy
    for c in real_copy:
        c_lower = c.lower()
        if any(phrase in c_lower for phrase in BRAND_VOICE_NEGATIVE):
            negative_hits += 1
            issues.append(Issue(2, "H2_real_world", "global",
                                f"Brand voice violation: \"{c[:80]}\""))

    sentence_ratio = positive_hits / len(sentences) if sentences else 0
    negative_ratio = negative_hits / len(real_copy) if real_copy else 0

    # Score: sentence positive ratio drives the score up (full 0-10 range),
    # negative violations pull it down hard
    score = 4.0 + (sentence_ratio * 6.0) - (negative_ratio * 8.0)
    return max(min(score, 10.0), 0.0), issues


def score_h3_user_control(screens: list[Screen]) -> tuple[float, list[Issue]]:
    """H3: User control & freedom — back buttons, cancel, undo."""
    issues = []
    navigable = [s for s in screens if s.section_count >= 2]
    if not navigable:
        return 10.0, issues

    points = 0
    max_points = 0

    for s in navigable:
        # Sub-screens and detail pages need back buttons
        if s.route and ('/' in s.route[1:]):  # Has nested route
            max_points += 1
            if s.has_back_button:
                points += 1
            else:
                issues.append(Issue(2, "H3_user_control", s.screen_id,
                                    f"'{s.title}' is a sub-page but has no back button"))

        # Forms and action screens need cancel/dismiss
        if s.has_primary_cta and s.section_count >= 3:
            max_points += 1
            if s.has_cancel_dismiss or s.has_back_button or s.has_skip_option:
                points += 1
            else:
                issues.append(Issue(1, "H3_user_control", s.screen_id,
                                    f"'{s.title}' has actions but no cancel/back/skip exit"))

    score = (points / max_points * 10) if max_points > 0 else 7.0
    return min(score, 10.0), issues


def score_h4_consistency(text: str, screens: list[Screen]) -> tuple[float, list[Issue]]:
    """H4: Consistency & standards — design tokens, patterns, component naming."""
    issues = []
    score = 10.0

    # Raw hex colors instead of tokens
    raw_colors = re.findall(r'(?<!\w)#[0-9a-fA-F]{3,6}\b', text)
    if raw_colors:
        penalty = min(len(raw_colors) * 0.3, 2.0)
        score -= penalty
        issues.append(Issue(1, "H4_consistency", "global",
                            f"{len(raw_colors)} raw hex colors — use design tokens"))

    # Button specs without variant/size
    button_specs = re.findall(r'Button\s*\(([^)]*)\)', text)
    variant_keywords = ['full-width', 'sm', 'lg', 'xl', 'outline', 'ghost',
                        'accent', 'default', 'destructive', 'secondary', 'soft']
    incomplete = [b for b in button_specs
                  if not any(kw in b for kw in variant_keywords)]
    if incomplete:
        penalty = min(len(incomplete) * 0.15, 1.5)
        score -= penalty
        issues.append(Issue(1, "H4_consistency", "global",
                            f"{len(incomplete)} Button specs missing variant/size"))

    # Inconsistent heading patterns (H2 vs H3 for same-level content)
    # Check that screens at the same depth use consistent header levels

    # Navigation table present (bonus)
    if "## Bottom Tab Bar" in text or "## Navigation Reference" in text:
        score = min(score + 0.5, 10.0)

    return max(score, 0.0), issues


def score_h5_error_prevention(screens: list[Screen]) -> tuple[float, list[Issue]]:
    """H5: Error prevention — validation, confirmation, guards."""
    issues = []
    form_screens = [s for s in screens if s.has_validation or
                    any(kw in s.raw_text.lower() for kw in ['input', 'form', 'textarea', 'field'])]

    if not form_screens:
        return 7.0, issues

    points = 0
    max_points = 0

    for s in form_screens:
        max_points += 2
        if s.has_validation:
            points += 1
        else:
            issues.append(Issue(2, "H5_error_prevention", s.screen_id,
                                f"'{s.title}' has form inputs but no validation rules"))

        if s.has_confirmation or s.has_error_state:
            points += 1
        else:
            issues.append(Issue(1, "H5_error_prevention", s.screen_id,
                                f"'{s.title}' has inputs but no confirmation/error handling"))

    score = (points / max_points * 10) if max_points > 0 else 5.0
    return min(score, 10.0), issues


def score_h6_recognition(screens: list[Screen]) -> tuple[float, list[Issue]]:
    """H6: Recognition rather than recall — explicit CTAs, visible labels."""
    issues = []
    actionable = [s for s in screens if s.section_count >= 2]
    if not actionable:
        return 10.0, issues

    points = 0
    max_points = 0

    for s in actionable:
        max_points += 2

        # Has a clear primary CTA?
        if s.has_primary_cta:
            points += 1
            # CTA quality check
            if s.cta_text:
                cta_lower = s.cta_text.lower().strip()
                has_strong = any(v in cta_lower for v in STRONG_CTA_VERBS)
                is_weak = any(re.match(p, cta_lower) for p in WEAK_CTA_PATTERNS)
                if has_strong and not is_weak:
                    points += 1
                elif is_weak:
                    issues.append(Issue(2, "H6_recognition", s.screen_id,
                                        f"Weak CTA: '{s.cta_text}' — use an action verb"))
                else:
                    points += 0.5
        else:
            if s.section_count >= 3:  # Non-trivial screens should have CTAs
                issues.append(Issue(2, "H6_recognition", s.screen_id,
                                    f"'{s.title}' has no primary CTA"))

    score = (points / max_points * 10) if max_points > 0 else 5.0
    return min(score, 10.0), issues


def score_h7_flexibility(screens: list[Screen]) -> tuple[float, list[Issue]]:
    """H7: Flexibility & efficiency — skip, shortcuts, personalization."""
    issues = []
    # Focus on onboarding and multi-step flows
    multi_step = [s for s in screens if s.flow_number in
                  ["5", "6", "17"] or "step" in s.title.lower() or "wizard" in s.title.lower()]

    if not multi_step:
        return 7.0, issues

    with_skip = sum(1 for s in multi_step if s.has_skip_option)
    score = (with_skip / len(multi_step) * 10) if multi_step else 5.0

    for s in multi_step:
        if not s.has_skip_option:
            issues.append(Issue(1, "H7_flexibility", s.screen_id,
                                f"Multi-step screen '{s.title}' has no skip/shortcut option"))

    return min(score, 10.0), issues


def score_h8_minimalist(screens: list[Screen]) -> tuple[float, list[Issue]]:
    """H8: Aesthetic & minimalist design — appropriate density."""
    issues = []
    scored = [s for s in screens if s.section_count > 0]
    if not scored:
        return 5.0, issues

    good = 0
    for s in scored:
        if 3 <= s.section_count <= 12:
            good += 1
        elif s.section_count < 3:
            issues.append(Issue(1, "H8_minimalist", s.screen_id,
                                f"'{s.title}' sparse ({s.section_count} sections)"))
        else:
            issues.append(Issue(1, "H8_minimalist", s.screen_id,
                                f"'{s.title}' dense ({s.section_count} sections) — split or collapse"))

    score = (good / len(scored) * 10) if scored else 5.0
    return min(score, 10.0), issues


def score_h9_error_recovery(screens: list[Screen]) -> tuple[float, list[Issue]]:
    """H9: Help users recognize, diagnose, recover from errors."""
    issues = []
    interactive = [s for s in screens if s.has_dynamic_data or s.section_count >= 3]
    if not interactive:
        return 7.0, issues

    with_errors = sum(1 for s in interactive if s.has_error_state)
    score = (with_errors / len(interactive) * 10) if interactive else 5.0

    for s in interactive:
        if not s.has_error_state:
            severity = 2 if s.has_dynamic_data else 1
            issues.append(Issue(severity, "H9_error_recovery", s.screen_id,
                                f"'{s.title}' missing error/recovery state"))

    return min(score, 10.0), issues


def score_h10_help(screens: list[Screen]) -> tuple[float, list[Issue]]:
    """H10: Help & documentation — empty states, explainers, tooltips."""
    issues = []
    points = 0
    max_points = 0

    for s in screens:
        if not s.has_dynamic_data and s.section_count < 3:
            continue

        max_points += 2

        # Empty state for dynamic data screens
        if s.has_dynamic_data:
            if s.has_empty_state:
                points += 1
            else:
                issues.append(Issue(2, "H10_help", s.screen_id,
                                    f"'{s.title}' has dynamic data but no empty state"))

        # Explainer/help for complex screens
        if s.has_explainer:
            points += 1
        elif s.section_count >= 5:
            points += 0.5  # Partial credit — not every screen needs an explainer
        else:
            points += 0.5

    score = (points / max_points * 10) if max_points > 0 else 5.0
    return min(score, 10.0), issues


# ─── Layer 2: PURE Severity Weighting ────────────────────────────────────────

def calculate_friction(issues: list[Issue]) -> int:
    """Sum all issue severities (PURE-style total friction score)."""
    return sum(i.severity for i in issues)


# ─── Layer 3: Cognitive Walkthrough ──────────────────────────────────────────

def cognitive_walkthrough(screens: list[Screen]) -> tuple[float, list[Issue]]:
    """Spencer's Streamlined CW: for each step in key flows, check Q1 and Q2."""
    issues = []
    screen_map = {s.screen_id: s for s in screens}

    total_checks = 0
    passed_checks = 0

    for flow_name, flow_def in KEY_TASK_FLOWS.items():
        flow_screens = [screen_map[sid] for sid in flow_def["screens"]
                        if sid in screen_map]

        for idx, s in enumerate(flow_screens):
            total_checks += 2

            # Q1: Will the user know what to do at this step?
            q1_pass = False
            if s.has_primary_cta:
                q1_pass = True
            elif s.has_loading_state and idx < len(flow_screens) - 1:
                # Auto-advance screens are OK
                q1_pass = True
            elif s.section_count >= 1 and (s.has_back_button or s.has_skip_option):
                q1_pass = True

            if q1_pass:
                passed_checks += 1
            else:
                issues.append(Issue(3, "CW_learnability", s.screen_id,
                                    f"[{flow_name}] '{s.title}': user may not know what to do (no clear CTA/action)"))

            # Q2: Will the user know they did the right thing?
            q2_pass = False
            if s.has_feedback:
                q2_pass = True
            elif s.has_progress_indicator:
                q2_pass = True
            elif s.has_loading_state:  # Visual feedback that something is happening
                q2_pass = True
            elif idx < len(flow_screens) - 1:
                # If next screen exists and has a header, the transition itself is feedback
                next_s = flow_screens[idx + 1]
                if next_s.section_count >= 1:
                    q2_pass = True

            if q2_pass:
                passed_checks += 1
            else:
                issues.append(Issue(2, "CW_feedback", s.screen_id,
                                    f"[{flow_name}] '{s.title}': no feedback that action succeeded"))

    score = (passed_checks / total_checks * 10) if total_checks > 0 else 5.0
    return min(score, 10.0), issues


# ─── Layer 4: Anti-Gaming Guards ─────────────────────────────────────────────

def check_gaming(screens: list[Screen], text: str) -> tuple[float, float, list[Issue]]:
    """
    Returns (penalty, bonus, issues).
    Penalty subtracted from final score. Bonus added.
    """
    issues = []
    penalty = 0.0
    bonus = 0.0

    # ─── Guard 1: Duplicate empty state copy ───
    empty_texts = []
    for s in screens:
        if s.empty_state_text.strip():
            empty_texts.append(s.empty_state_text.strip().lower())

    if empty_texts:
        text_counter = Counter(empty_texts)
        duplicates = {t: c for t, c in text_counter.items() if c > 2}
        for dup_text, count in duplicates.items():
            penalty += min(count * 0.5, 3.0)
            issues.append(Issue(2, "GAMING_duplicate", "global",
                                f"Empty state copy duplicated {count}x: \"{dup_text[:60]}...\""))

    # ─── Guard 2: Generic/boilerplate copy detection ───
    boilerplate_patterns = [
        r"no data (yet|available|found)",
        r"nothing (here|to show|to display) yet",
        r"no results",
        r"no items",
        r"content will appear here",
        r"check back later",
    ]
    boilerplate_count = 0
    for s in screens:
        for copy in s.copy_strings:
            if any(re.search(pat, copy.lower()) for pat in boilerplate_patterns):
                boilerplate_count += 1
    if boilerplate_count > 5:
        penalty += min((boilerplate_count - 5) * 0.3, 2.0)
        issues.append(Issue(1, "GAMING_boilerplate", "global",
                            f"{boilerplate_count} screens use generic boilerplate copy"))

    # ─── Guard 3: Trust signals on non-conversion screens ───
    misplaced_trust = 0
    for s in screens:
        if not s.is_conversion_screen:
            trust_in_raw = sum(1 for sig in TRUST_SIGNALS if sig in s.raw_text.lower())
            if trust_in_raw >= 3:  # 3+ trust signals on a non-conversion screen is suspicious
                misplaced_trust += 1
    if misplaced_trust > 0:
        penalty += min(misplaced_trust * 0.5, 2.0)
        issues.append(Issue(1, "GAMING_misplaced_trust", "global",
                            f"{misplaced_trust} non-conversion screens stuffed with trust signals"))

    # ─── Guard 4: Semantic similarity across copy strings ───
    all_copy_hashes = defaultdict(int)
    for s in screens:
        for c in s.copy_strings:
            # Normalize and hash
            normalized = re.sub(r'\s+', ' ', c.lower().strip())
            if len(normalized) > 20:  # Only check substantial copy
                h = hashlib.md5(normalized.encode()).hexdigest()[:8]
                all_copy_hashes[h] += 1

    highly_duplicated = {h: c for h, c in all_copy_hashes.items() if c > 3}
    if highly_duplicated:
        penalty += min(len(highly_duplicated) * 0.3, 2.0)
        issues.append(Issue(1, "GAMING_copy_reuse", "global",
                            f"{len(highly_duplicated)} copy strings appear 4+ times across screens"))

    # ─── Bonus: Simplicity ───
    # Reward concise specs that score well
    total_lines = len(text.split("\n"))
    total_screens_with_sections = sum(1 for s in screens if s.section_count > 0)
    if total_screens_with_sections > 0:
        avg_lines_per_screen = total_lines / len(screens) if screens else 0
        # Sweet spot: 12-25 lines per screen. Penalize bloat, reward conciseness
        if 12 <= avg_lines_per_screen <= 25:
            bonus = 1.0
        elif avg_lines_per_screen < 12:
            bonus = 0.5  # Might be too sparse
        elif avg_lines_per_screen > 40:
            bonus = -0.5  # Getting bloated
            issues.append(Issue(1, "GAMING_bloat", "global",
                                f"Avg {avg_lines_per_screen:.0f} lines/screen — getting verbose"))

    return penalty, bonus, issues


# ─── Layer 5: LLM-as-Judge Stub ─────────────────────────────────────────────

def llm_judge_score(screens: list[Screen], sample_size: int = 5) -> tuple[float, list[Issue]]:
    """
    LLM-as-judge for subjective copy quality.
    Only runs when --llm-judge flag is passed.
    Returns (score 0-10, issues).

    Rubric sent to the LLM:
      - Brand tone (1-5): Does copy sound calm, competent, kind? Not hype, not blaming.
      - Specificity (1-5): Is copy specific to the screen context, or generic filler?
      - Actionability (1-5): Does the user know exactly what to do next?

    This is a STUB — prints instructions for manual or API integration.
    """
    issues = []

    # Sample screens with the most copy
    screens_with_copy = [(s, len(s.copy_strings)) for s in screens if s.copy_strings]
    screens_with_copy.sort(key=lambda x: -x[1])
    sampled = [s for s, _ in screens_with_copy[:sample_size]]

    if not sampled:
        return 5.0, issues

    # Build the prompt that would be sent
    rubric = """Rate each screen's copy on three dimensions (1-5 scale):

1. BRAND TONE (1=hype/blaming/aggressive, 3=neutral, 5=calm/competent/kind)
   Reference voice: "Your home, handled." — calm concierge, confident, kind, predictable.

2. SPECIFICITY (1=generic filler, 3=adequate, 5=specific to this exact screen and context)
   Bad: "No data yet." Good: "Your earnings will appear here after your first completed job."

3. ACTIONABILITY (1=dead end, 3=has a CTA, 5=user knows exactly what to do and why)
   Bad: "No results found." Good: "No upcoming visits — your next service will appear here once scheduled."

Score each dimension 1-5. Return JSON: {"brand_tone": N, "specificity": N, "actionability": N}
"""

    # For now, return neutral score and print the stub
    print(f"\n[LLM-JUDGE] Would evaluate {len(sampled)} screens:", file=sys.stderr)
    for s in sampled:
        print(f"  - {s.screen_id}: {s.title} ({len(s.copy_strings)} copy strings)", file=sys.stderr)
    print(f"[LLM-JUDGE] Rubric: brand_tone + specificity + actionability (1-5 each)", file=sys.stderr)
    print(f"[LLM-JUDGE] To enable: implement API call in llm_judge_score()", file=sys.stderr)

    return 5.0, issues  # Neutral until implemented


# ─── Main Evaluation ─────────────────────────────────────────────────────────

def evaluate(path: Optional[str] = None, use_llm: bool = False) -> ScoreResult:
    """Run full 5-layer evaluation."""
    filepath = Path(path) if path else SCREEN_FLOWS_PATH
    if not filepath.exists():
        print(f"ERROR: {filepath} not found", file=sys.stderr)
        sys.exit(1)

    text = filepath.read_text(encoding="utf-8")
    screens = parse_screen_flows(text)

    all_issues = []

    # ─── Layer 1: Nielsen's 10 Heuristics ───
    h1, issues = score_h1_visibility(screens)
    all_issues.extend(issues)

    h2, issues = score_h2_real_world(screens)
    all_issues.extend(issues)

    h3, issues = score_h3_user_control(screens)
    all_issues.extend(issues)

    h4, issues = score_h4_consistency(text, screens)
    all_issues.extend(issues)

    h5, issues = score_h5_error_prevention(screens)
    all_issues.extend(issues)

    h6, issues = score_h6_recognition(screens)
    all_issues.extend(issues)

    h7, issues = score_h7_flexibility(screens)
    all_issues.extend(issues)

    h8, issues = score_h8_minimalist(screens)
    all_issues.extend(issues)

    h9, issues = score_h9_error_recovery(screens)
    all_issues.extend(issues)

    h10, issues = score_h10_help(screens)
    all_issues.extend(issues)

    # ─── Layer 2: PURE severity weighting ───
    total_friction = calculate_friction(all_issues)

    # ─── Layer 3: Cognitive Walkthrough ───
    cw, issues = cognitive_walkthrough(screens)
    all_issues.extend(issues)

    # ─── Layer 4: Anti-gaming ───
    gaming_penalty, simplicity_bonus, issues = check_gaming(screens, text)
    all_issues.extend(issues)

    # ─── Layer 5: LLM judge (optional) ───
    llm_score = 5.0  # Neutral default
    if use_llm:
        llm_score, issues = llm_judge_score(screens)
        all_issues.extend(issues)

    # ─── Composite Score ───
    # Nielsen heuristics: 60% of total (6 points each, sum to 60)
    # Cognitive walkthrough: 20% of total
    # LLM judge: 10% of total
    # Anti-gaming adjustments: applied as modifier

    nielsen_scores = [h1, h2, h3, h4, h5, h6, h7, h8, h9, h10]
    nielsen_weights = [
        1.2,  # H1 Visibility — critical for trust
        1.0,  # H2 Real world — brand voice
        1.0,  # H3 User control — fundamental
        0.8,  # H4 Consistency — design system
        1.1,  # H5 Error prevention — saves users
        1.2,  # H6 Recognition — drives conversion
        0.7,  # H7 Flexibility — nice to have
        0.9,  # H8 Minimalist — layout quality
        1.0,  # H9 Error recovery — essential safety net
        1.1,  # H10 Help — empty states are huge for your app
    ]

    nielsen_weighted = sum(s * w for s, w in zip(nielsen_scores, nielsen_weights))
    nielsen_total_weight = sum(nielsen_weights)
    nielsen_composite = (nielsen_weighted / nielsen_total_weight)  # 0-10 scale

    # Friction adjustment: high friction lowers the score
    # Normalize friction: if every screen has a severity-2 issue, friction ~ 200
    friction_penalty = min(total_friction / (len(screens) * 2) * 2, 2.0)  # Max 2 point penalty

    # Final composite (0-100 scale)
    composite = (
        (nielsen_composite * 6.0)        # 60% from Nielsen (0-60)
        + (cw * 2.0)                     # 20% from CW (0-20)
        + (llm_score * 1.0)             # 10% from LLM (0-10)
        + (5.0)                          # 10% baseline (adjusted by gaming/simplicity)
        - gaming_penalty                 # Anti-gaming penalty
        + simplicity_bonus               # Simplicity bonus
        - friction_penalty               # PURE friction penalty
    )

    composite = max(min(composite, 100.0), 0.0)

    return ScoreResult(
        ux_score=round(composite, 2),
        max_possible=100.00,
        h1_visibility=round(h1, 2),
        h2_real_world=round(h2, 2),
        h3_user_control=round(h3, 2),
        h4_consistency=round(h4, 2),
        h5_error_prevention=round(h5, 2),
        h6_recognition=round(h6, 2),
        h7_flexibility=round(h7, 2),
        h8_minimalist=round(h8, 2),
        h9_error_recovery=round(h9, 2),
        h10_help=round(h10, 2),
        cw_score=round(cw, 2),
        gaming_penalty=round(gaming_penalty, 2),
        simplicity_bonus=round(simplicity_bonus, 2),
        issues_found=len(all_issues),
        screens_analyzed=len(screens),
        total_friction=total_friction,
        issues=all_issues,
    )


# ─── Output ──────────────────────────────────────────────────────────────────

def print_results(result: ScoreResult, verbose: bool = False):
    """Print results in grep-friendly format."""
    print("---")
    print(f"ux_score:            {result.ux_score:.2f}")
    print(f"max_possible:        {result.max_possible:.2f}")
    print(f"h1_visibility:       {result.h1_visibility:.2f}")
    print(f"h2_real_world:       {result.h2_real_world:.2f}")
    print(f"h3_user_control:     {result.h3_user_control:.2f}")
    print(f"h4_consistency:      {result.h4_consistency:.2f}")
    print(f"h5_error_prevention: {result.h5_error_prevention:.2f}")
    print(f"h6_recognition:      {result.h6_recognition:.2f}")
    print(f"h7_flexibility:      {result.h7_flexibility:.2f}")
    print(f"h8_minimalist:       {result.h8_minimalist:.2f}")
    print(f"h9_error_recovery:   {result.h9_error_recovery:.2f}")
    print(f"h10_help:            {result.h10_help:.2f}")
    print(f"cw_score:            {result.cw_score:.2f}")
    print(f"gaming_penalty:      {result.gaming_penalty:.2f}")
    print(f"simplicity_bonus:    {result.simplicity_bonus:.2f}")
    print(f"total_friction:      {result.total_friction}")
    print(f"issues_found:        {result.issues_found}")
    print(f"screens_analyzed:    {result.screens_analyzed}")
    print("---")

    if verbose:
        # ─── Severity breakdown ───
        sev_counts = Counter(i.severity for i in result.issues)
        print(f"\n## Severity Distribution")
        print(f"  Critical (3): {sev_counts.get(3, 0)}")
        print(f"  Friction (2): {sev_counts.get(2, 0)}")
        print(f"  Cosmetic (1): {sev_counts.get(1, 0)}")

        # ─── Issues by heuristic ───
        heuristic_counts = Counter(i.heuristic for i in result.issues)
        print(f"\n## Issues by Heuristic")
        for h, count in sorted(heuristic_counts.items(), key=lambda x: -x[1]):
            print(f"  {h:25s} {count:3d} issues")

        # ─── Top critical issues ───
        critical = [i for i in result.issues if i.severity == 3]
        if critical:
            print(f"\n## Critical Issues (severity 3) — {len(critical)} total")
            for issue in critical[:20]:
                print(f"  [{issue.heuristic}] {issue.screen}: {issue.message}")

        # ─── Top friction issues ───
        friction = [i for i in result.issues if i.severity == 2]
        if friction:
            print(f"\n## Friction Issues (severity 2) — {len(friction)} total")
            for issue in friction[:30]:
                print(f"  [{issue.heuristic}] {issue.screen}: {issue.message}")

        # ─── Score visualization ───
        print(f"\n## Score Breakdown")
        dimensions = [
            ("H1 Visibility", result.h1_visibility),
            ("H2 Real World", result.h2_real_world),
            ("H3 User Control", result.h3_user_control),
            ("H4 Consistency", result.h4_consistency),
            ("H5 Error Prevent", result.h5_error_prevention),
            ("H6 Recognition", result.h6_recognition),
            ("H7 Flexibility", result.h7_flexibility),
            ("H8 Minimalist", result.h8_minimalist),
            ("H9 Error Recover", result.h9_error_recovery),
            ("H10 Help/Docs", result.h10_help),
            ("CW Learnability", result.cw_score),
        ]
        for name, score in dimensions:
            filled = int(score)
            bar = "█" * filled + "░" * (10 - filled)
            print(f"  {name:20s} {bar} {score:.1f}/10")

        if result.gaming_penalty > 0:
            print(f"\n  Gaming penalty:    -{result.gaming_penalty:.1f}")
        if result.simplicity_bonus != 0:
            sign = "+" if result.simplicity_bonus > 0 else ""
            print(f"  Simplicity bonus:  {sign}{result.simplicity_bonus:.1f}")


if __name__ == "__main__":
    verbose = "--verbose" in sys.argv or "-v" in sys.argv
    use_llm = "--llm-judge" in sys.argv
    path = None
    for arg in sys.argv[1:]:
        if not arg.startswith("-"):
            path = arg
            break

    result = evaluate(path, use_llm=use_llm)
    print_results(result, verbose=verbose)
