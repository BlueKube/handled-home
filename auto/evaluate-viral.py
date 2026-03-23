#!/usr/bin/env python3
"""
evaluate-viral.py — Viral Growth Readiness Scoring Harness for Handled Home
=============================================================================

Analogous to Karpathy's prepare.py: this file is READ-ONLY for the agent.
It parses screen-flows.md (and reference docs) and scores viral growth
readiness. HIGHER viral_score = better. Max 100.

## The 5 Viral Loops Evaluated

Loop 1 — BYOC (Bring Your Own Customer)
  Provider creates invite link → customer lands → signs up → activates
  Flows: 2 (landing), 6 (BYOC onboarding), 20 (provider BYOC center)

Loop 2 — BYOP (Bring Your Own Provider)
  Customer recommends trusted provider → platform reviews → provider onboards →
  customer and provider reconnect on platform
  Flows: NONE yet (big penalty)

Loop 3 — Customer Referrals
  Customer gets code → shares → friend lands → friend signs up → credits earned
  Flows: 3 (invite landing), 15 (referral hub), 37 (milestones)

Loop 4 — Shareable Receipts
  Service complete → customer sees receipt → shares → recipient lands → signs up
  Flows: 4 (share landing), Screen 11.3 (receipt with share CTA)

Loop 5 — First Service Celebration
  First service → full-screen overlay → share CTA → recipient signs up
  Flow: 32 (celebration overlay)

## 10 Scoring Dimensions

V1  Loop Completeness      (weight 1.3)
V2  Friction Per Loop      (weight 1.2)
V3  Invite Clarity         (weight 1.1)
V4  Share Artifacts        (weight 1.1)
V5  Incentive Structure    (weight 1.0)
V6  Trigger Placement      (weight 1.0)
V7  Viral Loop Measurement (weight 0.9)
V8  Network Effect Articulation (weight 0.9)
V9  Anti-Spam / Trust      (weight 0.8)
V10 Multi-Loop Synergy     (weight 0.8)

Output (grep-friendly):
  ---
  viral_score:         52.00
  max_possible:        100.00
  v1_loop_completeness:  6.00
  ...
  ---
"""

import re
import sys
import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

# ─── CLI & File Discovery ─────────────────────────────────────────────────────

def find_file(candidates: list[Path]) -> Optional[Path]:
    for p in candidates:
        if p.exists():
            return p
    return None

def parse_args():
    import argparse
    parser = argparse.ArgumentParser(
        description="Viral growth readiness scoring harness for Handled Home screen-flows.md"
    )
    parser.add_argument(
        "screen_flows",
        nargs="?",
        help="Path to screen-flows.md (the mutable viral UX spec)"
    )
    parser.add_argument(
        "--masterplan",
        help="Path to masterplan.md (frozen reference)"
    )
    parser.add_argument(
        "--ops",
        help="Path to operating-model.md (frozen reference)"
    )
    parser.add_argument(
        "--growth",
        help="Path to ai-growth-operating-plan.md (frozen reference)"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print detailed per-dimension findings"
    )
    return parser.parse_args()

def resolve_paths(args):
    base = Path(__file__).parent

    # screen-flows.md (mutable)
    sf_path = None
    if args.screen_flows:
        sf_path = Path(args.screen_flows)
    else:
        sf_path = find_file([
            base / "screen-flows-final.md",
            base / "screen-flows.md",
            base / "docs" / "screen-flows.md",
        ])
    if sf_path is None or not sf_path.exists():
        print("ERROR: Could not find screen-flows.md. Pass as first argument.", file=sys.stderr)
        sys.exit(1)

    # masterplan.md (frozen)
    mp_env = os.environ.get("VIRAL_MASTERPLAN_PATH")
    mp_path = None
    if args.masterplan:
        mp_path = Path(args.masterplan)
    elif mp_env:
        mp_path = Path(mp_env)
    else:
        mp_path = find_file([
            base / "masterplan.md",
            base / "docs" / "masterplan.md",
        ])

    # operating-model.md (frozen)
    ops_env = os.environ.get("VIRAL_OPS_PATH")
    ops_path = None
    if args.ops:
        ops_path = Path(args.ops)
    elif ops_env:
        ops_path = Path(ops_env)
    else:
        ops_path = find_file([
            base / "operating-model-final.md",
            base / "operating-model.md",
            base / "docs" / "operating-model.md",
        ])

    # ai-growth-operating-plan.md (frozen)
    growth_env = os.environ.get("VIRAL_GROWTH_PATH")
    growth_path = None
    if args.growth:
        growth_path = Path(args.growth)
    elif growth_env:
        growth_path = Path(growth_env)
    else:
        growth_path = find_file([
            base / "ai-growth-operating-plan.md",
            base / "docs" / "ai-growth-operating-plan.md",
        ])

    return sf_path, mp_path, ops_path, growth_path

# ─── Text Loading ─────────────────────────────────────────────────────────────

def load_text(path: Optional[Path]) -> str:
    if path is None or not path.exists():
        return ""
    return path.read_text(encoding="utf-8")

# ─── Flow Extraction ──────────────────────────────────────────────────────────

def extract_flow(text: str, flow_num: int) -> str:
    """Extract the full text of a numbered FLOW from screen-flows.md."""
    pattern = rf"^#\s+FLOW\s+{flow_num}[:\s]"
    next_pattern = r"^#\s+FLOW\s+\d+"
    lines = text.splitlines()
    start = -1
    end = len(lines)
    for i, line in enumerate(lines):
        if start == -1 and re.match(pattern, line, re.IGNORECASE):
            start = i
        elif start != -1 and re.match(next_pattern, line, re.IGNORECASE):
            end = i
            break
    if start == -1:
        return ""
    return "\n".join(lines[start:end])

def extract_screen(text: str, screen_id: str) -> str:
    """Extract a specific screen section (e.g., '11.3') from screen-flows.md."""
    pattern = rf"###\s+Screen\s+{re.escape(screen_id)}[:\s]"
    lines = text.splitlines()
    start = -1
    end = len(lines)
    for i, line in enumerate(lines):
        if start == -1 and re.match(pattern, line, re.IGNORECASE):
            start = i
        elif start != -1 and re.match(r"^###?\s+", line) and i > start:
            end = i
            break
    if start == -1:
        return ""
    return "\n".join(lines[start:end])

# ─── Issue Tracking ───────────────────────────────────────────────────────────

@dataclass
class Issue:
    dimension: str
    severity: int  # 1=note, 2=warning, 3=critical
    message: str
    loop: Optional[str] = None

issues: list[Issue] = []

def add_issue(dimension: str, severity: int, message: str, loop: Optional[str] = None):
    issues.append(Issue(dimension=dimension, severity=severity, message=message, loop=loop))

# ─── V1: Loop Completeness (weight 1.3) ───────────────────────────────────────

def score_v1_loop_completeness(sf_text: str, verbose: bool) -> tuple[float, int, int]:
    """
    For each of the 5 loops, assess whether the full cycle is documented.
    Returns (score 0-10, loops_found, loops_complete)
    """
    loop_scores = {}
    loop_credits = {}

    # --- Loop 1: BYOC (Flows 2, 6, 20) ---
    f2 = extract_flow(sf_text, 2)
    f6 = extract_flow(sf_text, 6)
    f20 = extract_flow(sf_text, 20)

    byoc_credit = 0.0
    byoc_found = False
    if f2:
        byoc_found = True
        byoc_credit += 0.25  # landing page exists
        if re.search(r"sign.?up|activate|cta", f2, re.IGNORECASE):
            byoc_credit += 0.15
        if re.search(r"provider\s+(card|name|info|context)", f2, re.IGNORECASE):
            byoc_credit += 0.10
    if f6:
        byoc_credit += 0.25  # BYOC-specific onboarding exists
        # Check if it's actually specced or just a stub
        if len(f6.strip().splitlines()) > 5:
            byoc_credit += 0.10
        else:
            add_issue("V1", 2, "Flow 6 (BYOC onboarding) is a stub — full steps not specced", "BYOC")
    else:
        add_issue("V1", 3, "Flow 6 (BYOC customer onboarding) missing entirely", "BYOC")
    if f20:
        byoc_credit += 0.10
        s201 = extract_screen(sf_text, "20.1")
        s202 = extract_screen(sf_text, "20.2")
        if s201 and re.search(r"stats|activations|active.?links", s201, re.IGNORECASE):
            byoc_credit += 0.05  # activation stats visible
    loop_credits["BYOC"] = min(byoc_credit, 1.0)
    loop_scores["BYOC"] = byoc_found

    # --- Loop 2: BYOP (no dedicated flow) ---
    byop_mentioned_sf = bool(re.search(r"BYOP|bring.?your.?own.?provider", sf_text, re.IGNORECASE))
    byop_credit = 0.0
    if byop_mentioned_sf:
        byop_credit += 0.10
        add_issue("V1", 2, "BYOP mentioned in screen-flows.md but no dedicated screens/flows", "BYOP")
    else:
        add_issue("V1", 3, "BYOP loop entirely absent from screen-flows.md — no screens, no flows", "BYOP")
    # Check for any BYOP-adjacent screens (e.g., recommend-a-provider, switch kit)
    if re.search(r"recommend.?provider|switch.?kit|incumbent|byop", sf_text, re.IGNORECASE):
        byop_credit += 0.05
    loop_credits["BYOP"] = min(byop_credit, 1.0)
    loop_scores["BYOP"] = byop_mentioned_sf

    # --- Loop 3: Customer Referrals (Flows 3, 15, 37) ---
    f3 = extract_flow(sf_text, 3)
    f15 = extract_flow(sf_text, 15)
    f37 = extract_flow(sf_text, 37)

    ref_credit = 0.0
    ref_found = False
    if f3:
        ref_found = True
        ref_credit += 0.20  # landing page exists
        if re.search(r"referral|invite|code|friend", f3, re.IGNORECASE):
            ref_credit += 0.10
    else:
        add_issue("V1", 3, "Flow 3 (referral invite landing) missing", "Referrals")
    if f15:
        ref_credit += 0.25  # referral hub exists
        if re.search(r"credit|earned|pending", f15, re.IGNORECASE):
            ref_credit += 0.10  # credits visible
        if re.search(r"referral.?code|copy|share", f15, re.IGNORECASE):
            ref_credit += 0.10
    else:
        add_issue("V1", 2, "Flow 15 (referral hub) missing", "Referrals")
    if f37:
        ref_credit += 0.20  # milestones exist
        if re.search(r"starter|ambassador|champion|tier", f37, re.IGNORECASE):
            ref_credit += 0.05  # tiers defined
    else:
        add_issue("V1", 2, "Flow 37 (referral milestones) missing", "Referrals")
    # Check loop closure: does friend signing up via Flow 3 flow into a conversion event?
    if f3 and re.search(r"sign.?up|subscribe|get.?started|auth", f3, re.IGNORECASE):
        ref_credit += 0.05
    loop_credits["Referrals"] = min(ref_credit, 1.0)
    loop_scores["Referrals"] = ref_found

    # --- Loop 4: Shareable Receipts (Flow 4, Screen 11.3) ---
    f4 = extract_flow(sf_text, 4)
    s113 = extract_screen(sf_text, "11.3")

    receipt_credit = 0.0
    receipt_found = False
    if f4:
        receipt_found = True
        receipt_credit += 0.25
        if re.search(r"get.?handled|sign.?up|cta|arrowRight", f4, re.IGNORECASE):
            receipt_credit += 0.15  # has conversion CTA
        if re.search(r"photo|checklist|proof|service.?type|category", f4, re.IGNORECASE):
            receipt_credit += 0.10  # shows proof elements
        if re.search(r"provider", f4, re.IGNORECASE):
            receipt_credit += 0.05
    else:
        add_issue("V1", 3, "Flow 4 (share receipt landing) missing", "Receipts")
    if s113:
        receipt_credit += 0.25
        if re.search(r"share.?cta|share.*photo|Share2|shareCardSheet", s113, re.IGNORECASE):
            receipt_credit += 0.15  # share CTA on receipt
        else:
            add_issue("V1", 2, "Screen 11.3: no share CTA detected on receipt", "Receipts")
    else:
        add_issue("V1", 2, "Screen 11.3 (visit receipt) not found", "Receipts")
    loop_credits["Receipts"] = min(receipt_credit, 1.0)
    loop_scores["Receipts"] = receipt_found

    # --- Loop 5: First Service Celebration (Flow 32) ---
    f32 = extract_flow(sf_text, 32)

    celeb_credit = 0.0
    celeb_found = False
    if f32:
        celeb_found = True
        celeb_credit += 0.35
        if re.search(r"share|Share2|secondary.?cta", f32, re.IGNORECASE):
            celeb_credit += 0.20  # share CTA present
        else:
            add_issue("V1", 2, "Flow 32 (celebration): no share CTA detected", "Celebration")
        if re.search(r"receipt|proof|service", f32, re.IGNORECASE):
            celeb_credit += 0.10
        # Check loop closure — does share lead anywhere?
        if re.search(r"share.*news|share.*receipt|recipient|sign.?up", f32, re.IGNORECASE):
            celeb_credit += 0.10
        else:
            add_issue("V1", 1, "Flow 32: share destination not specified (where does shared content go?)", "Celebration")
    else:
        add_issue("V1", 3, "Flow 32 (first service celebration) missing entirely", "Celebration")
    loop_credits["Celebration"] = min(celeb_credit, 1.0)
    loop_scores["Celebration"] = celeb_found

    # Tally
    loops_found = sum(1 for v in loop_scores.values() if v)
    total_credit = sum(loop_credits.values())
    # Score = weighted average across 5 loops, mapped to 0-10
    # Full credit (5.0) → 10. Each loop max 1.0.
    # BYOP missing entirely is a big penalty — already baked into low credit.
    raw = (total_credit / 5.0) * 10.0

    # Loops "complete" = credit >= 0.7 (reasonably well specced)
    loops_complete = sum(1 for c in loop_credits.values() if c >= 0.70)

    if verbose:
        print("\n[V1 Loop Completeness]")
        for loop, credit in loop_credits.items():
            status = "COMPLETE" if credit >= 0.70 else ("PARTIAL" if credit > 0.0 else "MISSING")
            print(f"  {loop:20s}: {credit:.2f} [{status}]")
        print(f"  Score: {raw:.2f}/10")

    return min(raw, 10.0), loops_found, loops_complete

# ─── V2: Friction Per Loop (weight 1.2) ──────────────────────────────────────

def score_v2_friction(sf_text: str, verbose: bool) -> tuple[float, int]:
    """
    Count steps from trigger → new user activated for each loop.
    Lower = better. Benchmark: <4 is great, 4-6 OK, >6 too much friction.
    Also checks: skip options, sign-up-before-value gating.
    Returns (score 0-10, total_friction_count)
    """
    loop_frictions = {}

    # --- Loop 1: BYOC ---
    # Trigger: provider shares link → customer lands (Screen 2.1) →
    # signs up → Flow 6 onboarding → activates
    f2 = extract_flow(sf_text, 2)
    f6 = extract_flow(sf_text, 6)
    byoc_steps = 0
    if f2:
        byoc_steps += 1  # landing page
        # Check: does value show before sign-up?
        if re.search(r"provider.?card|service.?details|benefits.?card", f2, re.IGNORECASE):
            pass  # value shown before CTA — good
        else:
            add_issue("V2", 2, "BYOC landing (2.1): value not clearly shown before sign-up CTA", "BYOC")
    if f6:
        # Count steps in BYOC onboarding
        step_matches = re.findall(r"step\s+\d+", f6, re.IGNORECASE)
        screen_matches = re.findall(r"^###\s+Screen", f6, re.MULTILINE)
        byoc_onboard_steps = max(len(step_matches), len(screen_matches))
        if byoc_onboard_steps == 0:
            byoc_onboard_steps = 3  # stub — assume 3 steps minimum
            add_issue("V2", 2, "Flow 6 is a stub — step count unknown, assumed 3", "BYOC")
        byoc_steps += byoc_onboard_steps
    else:
        byoc_steps += 3  # unknown stub penalty
    loop_frictions["BYOC"] = byoc_steps

    # --- Loop 2: BYOP ---
    # No flow defined → friction unmeasurable → assign penalty score
    loop_frictions["BYOP"] = 99  # undefined = maximum friction
    add_issue("V2", 3, "BYOP loop undefined — friction cannot be measured", "BYOP")

    # --- Loop 3: Customer Referrals ---
    # Trigger: customer shares code → friend lands (Screen 3.1) →
    # signs up → subscribes → customer earns credits
    f3 = extract_flow(sf_text, 3)
    ref_steps = 0
    if f3:
        ref_steps += 1  # invite landing
        if re.search(r"get.?started|sign.?up|auth", f3, re.IGNORECASE):
            ref_steps += 1  # auth step
        # Does the friend see value before signing up?
        if not re.search(r"feature.?card|benefit|proof|value", f3, re.IGNORECASE):
            add_issue("V2", 2, "Flow 3 invite landing: limited value prop before sign-up CTA", "Referrals")
    ref_steps += 2  # onboarding + subscribe (assumed from Flow 5)
    ref_steps += 1  # first service → credit earned
    loop_frictions["Referrals"] = ref_steps

    # --- Loop 4: Shareable Receipts ---
    # Trigger: receipt → share → landing (Flow 4.1) → sign up → activate
    s113 = extract_screen(sf_text, "11.3")
    f4 = extract_flow(sf_text, 4)
    receipt_steps = 0
    if s113:
        receipt_steps += 1  # receipt visible
        if re.search(r"share.?cta|Share2|shareCardSheet|share.*photo", s113, re.IGNORECASE):
            receipt_steps += 1  # tap share
        else:
            add_issue("V2", 2, "Screen 11.3: share action not explicitly specced — friction unclear", "Receipts")
    if f4:
        receipt_steps += 1  # share landing
        if re.search(r"get.?handled|sign.?up|arrowRight|cta", f4, re.IGNORECASE):
            receipt_steps += 1  # conversion CTA
    receipt_steps += 2  # auth + subscribe
    loop_frictions["Receipts"] = receipt_steps

    # --- Loop 5: First Service Celebration ---
    # Trigger: overlay → tap share → recipient sees → signs up
    f32 = extract_flow(sf_text, 32)
    celeb_steps = 0
    if f32:
        celeb_steps += 1  # celebration overlay
        if re.search(r"share.*news|Share2|secondary.?cta", f32, re.IGNORECASE):
            celeb_steps += 1  # share tap
        # Where does the share go? If no destination flow, add friction penalty
        if not re.search(r"flow.?4|/share/|share.*landing|receipt.*page", f32, re.IGNORECASE):
            add_issue("V2", 1, "Flow 32: share destination not linked (which page does recipient land on?)", "Celebration")
            celeb_steps += 2  # unknown destination = friction
    celeb_steps += 3  # recipient lands, signs up, subscribes
    loop_frictions["Celebration"] = celeb_steps

    # Score friction
    # BYOP excluded from friction calc (loop undefined — penalty handled in V1)
    defined_loops = {k: v for k, v in loop_frictions.items() if k != "BYOP"}
    total_friction = sum(defined_loops.values())
    avg_friction = total_friction / len(defined_loops) if defined_loops else 10

    # Benchmark: avg <4 → 10, avg 4-6 → 7-9, avg 6-8 → 4-6, avg >8 → 0-3
    if avg_friction < 4:
        score = 10.0
    elif avg_friction < 5:
        score = 9.0
    elif avg_friction < 6:
        score = 7.5
    elif avg_friction < 7:
        score = 6.0
    elif avg_friction < 8:
        score = 4.5
    elif avg_friction < 10:
        score = 3.0
    else:
        score = 1.0

    # Skip options bonus
    skip_count = len(re.findall(r"skip.*option|skip.?for.?now|button.*ghost.*skip|dismiss", sf_text, re.IGNORECASE))
    if skip_count >= 5:
        score = min(score + 0.5, 10.0)

    # Sign-up-before-value penalty
    gated_before_value = 0
    for flow_num in [2, 3, 4]:
        flow_text = extract_flow(sf_text, flow_num)
        if flow_text:
            # If sign-up CTA appears before any value elements, penalize
            cta_pos = flow_text.lower().find("sign up")
            value_pos = min(
                (flow_text.lower().find(kw) for kw in ["benefit", "feature", "proof", "photo", "service detail", "provider card", "value"]
                 if flow_text.lower().find(kw) != -1),
                default=9999
            )
            if cta_pos != -1 and cta_pos < value_pos and cta_pos < 300:
                gated_before_value += 1
    if gated_before_value > 0:
        score = max(score - gated_before_value * 0.5, 0.0)
        add_issue("V2", 2, f"{gated_before_value} viral landing page(s) may gate value behind sign-up too early")

    if verbose:
        print("\n[V2 Friction Per Loop]")
        for loop, steps in loop_frictions.items():
            marker = "⚠" if steps > 6 else ("✓" if steps < 4 else "~")
            print(f"  {loop:20s}: {steps} steps [{marker}]")
        print(f"  Avg friction (excl BYOP): {avg_friction:.1f} | Score: {score:.2f}/10")

    return min(score, 10.0), total_friction + loop_frictions.get("BYOP", 0)

# ─── V3: Invite Clarity (weight 1.1) ─────────────────────────────────────────

def score_v3_invite_clarity(sf_text: str, verbose: bool) -> float:
    """
    On viral landing pages, does the invited person immediately understand:
    - Who invited them?
    - What they're getting?
    - Why they should care?
    """
    score = 0.0
    checks = []

    # BYOC landing (Screen 2.1)
    f2 = extract_flow(sf_text, 2)
    if f2:
        # Who invited them?
        if re.search(r"provider.?card|provider.?name|avatar.*provider|provider.*avatar", f2, re.IGNORECASE):
            score += 1.5
            checks.append(("BYOC: Provider identity visible", True))
        else:
            checks.append(("BYOC: Provider identity visible", False))
            add_issue("V3", 2, "BYOC landing (2.1): provider identity not clearly surfaced", "BYOC")

        # What are they getting?
        if re.search(r"service.?details|category|service.*name|how.?often|cadence|frequency", f2, re.IGNORECASE):
            score += 1.0
            checks.append(("BYOC: Service details shown", True))
        else:
            checks.append(("BYOC: Service details shown", False))
            add_issue("V3", 2, "BYOC landing (2.1): service details not shown before sign-up", "BYOC")

        # Why care?
        if re.search(r"benefit|shield|camera|sparkle|proof|guarantee|manage", f2, re.IGNORECASE):
            score += 0.75
            checks.append(("BYOC: Benefits/value prop shown", True))
        else:
            checks.append(("BYOC: Benefits/value prop shown", False))
            add_issue("V3", 1, "BYOC landing (2.1): benefits section weak or missing", "BYOC")

        # Fine print / trust
        if re.search(r"free.?to.?join|cancel.?anytime|pricing.?set", f2, re.IGNORECASE):
            score += 0.5
            checks.append(("BYOC: Trust fine print present", True))
        else:
            checks.append(("BYOC: Trust fine print present", False))

    # Referral landing (Screen 3.1)
    f3 = extract_flow(sf_text, 3)
    if f3:
        # Who invited them (friend context)?
        if re.search(r"friend|your.?pro|referral|invited.?by|from\s+\w", f3, re.IGNORECASE):
            score += 1.0
            checks.append(("Referral: Inviter context present", True))
        else:
            checks.append(("Referral: Inviter context present", False))
            add_issue("V3", 2, "Referral landing (3.1): no context about who invited the recipient", "Referrals")

        # Value prop?
        if re.search(r"feature.?card|track|manage|proof.?photo|service.*visit|benefit", f3, re.IGNORECASE):
            score += 0.75
            checks.append(("Referral: Value prop visible", True))
        else:
            checks.append(("Referral: Value prop visible", False))
            add_issue("V3", 2, "Referral landing (3.1): value proposition not clearly stated", "Referrals")

        # Referral reward shown on landing?
        if re.search(r"credit|reward|earn|welcome.?offer|welcome.?bonus", f3, re.IGNORECASE):
            score += 0.75
            checks.append(("Referral: Reward/offer shown on landing", True))
        else:
            checks.append(("Referral: Reward/offer shown on landing", False))
            add_issue("V3", 2, "Referral landing (3.1): no referral reward or welcome offer shown to new user", "Referrals")

        # Fine print
        if re.search(r"free.?to.?join|no.?commitment|cancel", f3, re.IGNORECASE):
            score += 0.25
            checks.append(("Referral: Fine print present", True))
        else:
            checks.append(("Referral: Fine print present", False))

    # Share receipt landing (Screen 4.1)
    f4 = extract_flow(sf_text, 4)
    if f4:
        # Social proof (whose home, what service)
        if re.search(r"firstName.*home|neighborhood|category|date|checklist", f4, re.IGNORECASE):
            score += 0.75
            checks.append(("Receipt Share: Social proof context", True))
        else:
            checks.append(("Receipt Share: Social proof context", False))

        # CTA clarity
        if re.search(r"get.?handled.?home|arrowRight|sign.?up|provider.?cta", f4, re.IGNORECASE):
            score += 0.5
            checks.append(("Receipt Share: CTA clarity", True))
        else:
            checks.append(("Receipt Share: CTA clarity", False))
            add_issue("V3", 2, "Share landing (4.1): sign-up CTA not clearly specced", "Receipts")

    # BYOP landing — not specced → penalty
    byop_landing = bool(re.search(r"BYOP.*landing|recommend.*provider.*page|/byop/", sf_text, re.IGNORECASE))
    if not byop_landing:
        add_issue("V3", 3, "BYOP loop has no invite/landing page — clarity undefined", "BYOP")
        score += 0.0  # no credit
    else:
        score += 1.0

    # Normalize to 0-10
    max_possible = 9.25  # sum of all checks above
    normalized = (score / max_possible) * 10.0

    if verbose:
        print("\n[V3 Invite Clarity]")
        for label, passed in checks:
            print(f"  {'✓' if passed else '✗'} {label}")
        print(f"  Raw: {score:.2f}/{max_possible:.2f} | Score: {normalized:.2f}/10")

    return min(normalized, 10.0)

# ─── V4: Share Artifacts (weight 1.1) ────────────────────────────────────────

def score_v4_share_artifacts(sf_text: str, verbose: bool) -> float:
    """
    When content is shared outside the app, is the shared artifact compelling?
    Check each viral sharing surface for: content richness, provider info,
    proof elements, brand stamp, clear CTA.
    """
    score = 0.0
    checks = []

    # Receipt share artifact (Flow 4.1 — the destination when receipt is shared)
    f4 = extract_flow(sf_text, 4)
    if f4:
        # Photos
        if re.search(r"photo|hero.?photo|4:3|image", f4, re.IGNORECASE):
            score += 1.0
            checks.append(("Receipt artifact: Photos present", True))
        else:
            checks.append(("Receipt artifact: Photos present", False))
            add_issue("V4", 2, "Share landing (4.1): no photo element in shared artifact", "Receipts")

        # Checklist/proof
        if re.search(r"checklist|checkCircle|proof|items", f4, re.IGNORECASE):
            score += 0.75
            checks.append(("Receipt artifact: Checklist/proof items", True))
        else:
            checks.append(("Receipt artifact: Checklist/proof items", False))
            add_issue("V4", 2, "Share landing (4.1): no checklist/proof elements in artifact", "Receipts")

        # Brand stamp
        if re.search(r"handled\.|brand.?stamp|primary.?bg.*white|pill.*handled", f4, re.IGNORECASE):
            score += 0.5
            checks.append(("Receipt artifact: Brand stamp", True))
        else:
            checks.append(("Receipt artifact: Brand stamp", False))
            add_issue("V4", 1, "Share landing (4.1): brand stamp not defined on shared artifact", "Receipts")

        # Service type / category
        if re.search(r"category|badge.*category|lawn|service.?type", f4, re.IGNORECASE):
            score += 0.5
            checks.append(("Receipt artifact: Service type shown", True))
        else:
            checks.append(("Receipt artifact: Service type shown", False))

        # CTA on artifact
        if re.search(r"get.?handled|sign.?up|arrowRight|provider.*button|i'm.?a.?provider", f4, re.IGNORECASE):
            score += 0.75
            checks.append(("Receipt artifact: CTA present", True))
        else:
            checks.append(("Receipt artifact: CTA present", False))
            add_issue("V4", 3, "Share landing (4.1): no conversion CTA on shared receipt artifact", "Receipts")

    # Referral invite artifact (Flow 3 landing page)
    f3 = extract_flow(sf_text, 3)
    if f3:
        if re.search(r"feature.?card|benefit|proof|manage|track", f3, re.IGNORECASE):
            score += 0.75
            checks.append(("Referral artifact: Value elements", True))
        else:
            checks.append(("Referral artifact: Value elements", False))
            add_issue("V4", 2, "Referral landing (3.1): artifact lacks compelling value elements", "Referrals")

        if re.search(r"get.?started|cta|button.*large|sign.?up", f3, re.IGNORECASE):
            score += 0.5
            checks.append(("Referral artifact: CTA present", True))
        else:
            checks.append(("Referral artifact: CTA present", False))
            add_issue("V4", 2, "Referral landing (3.1): no clear CTA on invite artifact", "Referrals")

    # BYOC invite artifact (Flow 2 landing page)
    f2 = extract_flow(sf_text, 2)
    if f2:
        if re.search(r"provider.?card|provider.?name|service.?details|frequency", f2, re.IGNORECASE):
            score += 0.75
            checks.append(("BYOC artifact: Service/provider context", True))
        else:
            checks.append(("BYOC artifact: Service/provider context", False))

        if re.search(r"benefit|shield|camera|sparkle|guarantee", f2, re.IGNORECASE):
            score += 0.5
            checks.append(("BYOC artifact: Benefits listed", True))
        else:
            checks.append(("BYOC artifact: Benefits listed", False))

        if re.search(r"sign.?up.?to.?activate|button.*large|arrowRight", f2, re.IGNORECASE):
            score += 0.5
            checks.append(("BYOC artifact: CTA present", True))
        else:
            checks.append(("BYOC artifact: CTA present", False))

    # Celebration share artifact — where does the shared content go?
    f32 = extract_flow(sf_text, 32)
    if f32 and re.search(r"share.*news|Share2|secondary.?cta", f32, re.IGNORECASE):
        # Does it reference a destination artifact (Flow 4 / share page)?
        if re.search(r"flow.?4|/share/|share.?receipt|share.*landing", f32, re.IGNORECASE):
            score += 0.5
            checks.append(("Celebration artifact: Links to share landing", True))
        else:
            checks.append(("Celebration artifact: Links to share landing", False))
            add_issue("V4", 2, "Flow 32: share action exists but destination artifact not defined", "Celebration")
    else:
        checks.append(("Celebration artifact: Share CTA defined", False))

    # Normalize
    max_possible = 7.5
    normalized = (score / max_possible) * 10.0

    if verbose:
        print("\n[V4 Share Artifacts]")
        for label, passed in checks:
            print(f"  {'✓' if passed else '✗'} {label}")
        print(f"  Raw: {score:.2f}/{max_possible:.2f} | Score: {normalized:.2f}/10")

    return min(normalized, 10.0)

# ─── V5: Incentive Structure (weight 1.0) ────────────────────────────────────

def score_v5_incentives(sf_text: str, mp_text: str, ops_text: str, verbose: bool) -> float:
    """
    Are incentives clearly defined and visible?
    Cross-check with masterplan.md and operating-model.md for consistency.
    """
    score = 0.0
    checks = []

    # Referral rewards defined with amounts?
    f15 = extract_flow(sf_text, 15)
    f37 = extract_flow(sf_text, 37)

    if f37 and re.search(r"\$30|free.?month|VIP|starter|ambassador|champion", f37, re.IGNORECASE):
        score += 2.0
        checks.append(("Referral tiers with reward amounts defined", True))
        # Cross-check: are these amounts grounded in operating-model or masterplan?
        if ops_text and re.search(r"\$30|free.?month|referral.*credit|referral.*reward", ops_text, re.IGNORECASE):
            score += 0.5
            checks.append(("Referral rewards anchored to operating model", True))
        elif mp_text and re.search(r"referral.*milestone|starter.*ambassador.*champion|\$30|free.?month", mp_text, re.IGNORECASE):
            score += 0.5
            checks.append(("Referral rewards anchored to masterplan", True))
        else:
            checks.append(("Referral rewards anchored to reference docs", False))
            add_issue("V5", 2, "Referral reward amounts ($30, Free month, VIP) not found in operating-model.md or masterplan.md — need anchoring", "Referrals")
    else:
        checks.append(("Referral tiers with reward amounts defined", False))
        add_issue("V5", 2, "Flow 37 referral tiers or reward amounts not clearly defined", "Referrals")

    # Credits summary visible in referral hub?
    if f15 and re.search(r"credit|earned|pending|gift.?icon", f15, re.IGNORECASE):
        score += 1.0
        checks.append(("Referral credits visible in hub (Flow 15)", True))
    else:
        checks.append(("Referral credits visible in hub (Flow 15)", False))
        add_issue("V5", 2, "Flow 15: referral credits earned/pending not visible", "Referrals")

    # BYOC bonuses defined?
    f20 = extract_flow(sf_text, 20)
    if f20 and re.search(r"bonus|earn.*byoc|byoc.*earn|incentive|bonus.?income", f20, re.IGNORECASE):
        score += 1.5
        checks.append(("BYOC provider bonuses mentioned (Flow 20)", True))
        # Is bonus amount specified?
        if re.search(r"\$\d+|\d+%|amount|payout.*byoc", f20, re.IGNORECASE):
            score += 0.5
            checks.append(("BYOC bonus amount specified", True))
        else:
            checks.append(("BYOC bonus amount specified", False))
            add_issue("V5", 1, "Flow 20 mentions BYOC bonuses but doesn't specify amounts — consider linking to admin incentive config", "BYOC")
    else:
        checks.append(("BYOC provider bonuses mentioned (Flow 20)", False))
        add_issue("V5", 2, "Flow 20 BYOC Center: provider bonus incentives not clearly defined", "BYOC")

    # BYOC bonuses cross-referenced in operating model?
    if ops_text and re.search(r"BYOC.?bonus|bonus.?BYOC|migration.*incentive|byoc.*incentive", ops_text, re.IGNORECASE):
        score += 0.5
        checks.append(("BYOC bonuses referenced in operating model", True))
    else:
        checks.append(("BYOC bonuses referenced in operating model", False))

    # BYOC banner incentive visible on provider dashboard?
    byoc_banner = extract_flow(sf_text, 35)
    if byoc_banner and re.search(r"earn.*bonus|bonus.*income|guaranteed.*route.*pay", byoc_banner, re.IGNORECASE):
        score += 0.75
        checks.append(("BYOC banner shows bonus incentive (Flow 35)", True))
    else:
        checks.append(("BYOC banner shows bonus incentive (Flow 35)", False))
        add_issue("V5", 1, "Flow 35 (BYOC banner): incentive messaging could be stronger", "BYOC")

    # First service celebration — any share incentive?
    f32 = extract_flow(sf_text, 32)
    if f32 and re.search(r"credit|reward|earn|incentive|bonus", f32, re.IGNORECASE):
        score += 0.5
        checks.append(("First service celebration: share incentive present", True))
    else:
        checks.append(("First service celebration: share incentive present", False))
        add_issue("V5", 1, "Flow 32 celebration: no share incentive (credit for sharing?)", "Celebration")

    # BYOP incentives?
    byop_incentive = bool(re.search(r"BYOP.*credit|recommend.*reward|byop.*bonus|switch.?kit.*incentive", sf_text, re.IGNORECASE))
    if byop_incentive:
        score += 0.5
        checks.append(("BYOP incentive defined", True))
    else:
        checks.append(("BYOP incentive defined", False))
        add_issue("V5", 2, "No customer incentive defined for BYOP (why would a customer recommend their provider?)", "BYOP")

    # Normalize
    max_possible = 7.25
    normalized = (score / max_possible) * 10.0

    if verbose:
        print("\n[V5 Incentive Structure]")
        for label, passed in checks:
            print(f"  {'✓' if passed else '✗'} {label}")
        print(f"  Raw: {score:.2f}/{max_possible:.2f} | Score: {normalized:.2f}/10")

    return min(normalized, 10.0)

# ─── V6: Trigger Placement (weight 1.0) ──────────────────────────────────────

def score_v6_trigger_placement(sf_text: str, verbose: bool) -> float:
    """
    Are share/invite triggers at high-satisfaction moments?
    Check: receipt, celebration, earnings page, provider dashboard.
    """
    score = 0.0
    checks = []

    # Share trigger on receipt (Screen 11.3)
    s113 = extract_screen(sf_text, "11.3")
    if s113 and re.search(r"share.?cta|Share2|share.*photo|shareCardSheet", s113, re.IGNORECASE):
        score += 2.0
        checks.append(("Share CTA on receipt page (Screen 11.3)", True))
    else:
        checks.append(("Share CTA on receipt page (Screen 11.3)", False))
        add_issue("V6", 2, "Screen 11.3: no share trigger on receipt (highest-satisfaction moment)", "Receipts")

    # First service celebration has share (Flow 32)
    f32 = extract_flow(sf_text, 32)
    if f32 and re.search(r"share.*news|Share2|secondary.?cta", f32, re.IGNORECASE):
        score += 2.0
        checks.append(("Share CTA on celebration overlay (Flow 32)", True))
    else:
        checks.append(("Share CTA on celebration overlay (Flow 32)", False))
        add_issue("V6", 2, "Flow 32: no share CTA on first service celebration overlay", "Celebration")

    # BYOC trigger on provider dashboard (Flow 35 / Screen 18.1)
    byoc_banner_flow = extract_flow(sf_text, 35)
    byoc_on_dash = False
    # Check if BYOC banner is referenced in provider dashboard
    if byoc_banner_flow:
        byoc_on_dash = True
        score += 1.5
        checks.append(("BYOC trigger on provider dashboard (Flow 35)", True))
    else:
        # Check for inline BYOC reference in dashboard
        f18_content = extract_flow(sf_text, 18)
        if f18_content and re.search(r"byoc|bring.?your.?own", f18_content, re.IGNORECASE):
            byoc_on_dash = True
            score += 1.0
            checks.append(("BYOC trigger on provider dashboard (inline)", True))
        else:
            checks.append(("BYOC trigger on provider dashboard", False))
            add_issue("V6", 2, "No BYOC invite trigger found on provider dashboard", "BYOC")

    # BYOC trigger also in Growth menu (Flow 24)
    f24 = extract_flow(sf_text, 24)
    if f24 and re.search(r"byoc|growth.*menu|growth.*center", f24, re.IGNORECASE):
        score += 0.75
        checks.append(("BYOC in Growth menu (Flow 24)", True))
    else:
        checks.append(("BYOC in Growth menu (Flow 24)", False))

    # Referral trigger on customer More menu / community section
    f16 = extract_flow(sf_text, 16)
    if f16 and re.search(r"referral|community.*referral|referrals.*users", f16, re.IGNORECASE):
        score += 1.0
        checks.append(("Referral link in customer More menu (Flow 16)", True))
    else:
        checks.append(("Referral link in customer More menu (Flow 16)", False))
        add_issue("V6", 1, "Referral link not visible in customer More menu", "Referrals")

    # Anti-spam: triggers NOT on non-completion screens
    # Check if share CTAs appear on inappropriate screens (settings, billing, etc.)
    inappropriate_share = bool(re.search(
        r"(settings|billing|payment|password|cancel|subscription.?management).*share.?cta|"
        r"share.?cta.*(settings|billing|payment|password|cancel)",
        sf_text, re.IGNORECASE
    ))
    if not inappropriate_share:
        score += 0.5
        checks.append(("Share CTAs not on inappropriate screens", True))
    else:
        checks.append(("Share CTAs not on inappropriate screens", False))
        add_issue("V6", 2, "Share CTAs detected on non-completion screens — check placement logic")

    # Normalize
    max_possible = 7.75
    normalized = (score / max_possible) * 10.0

    if verbose:
        print("\n[V6 Trigger Placement]")
        for label, passed in checks:
            print(f"  {'✓' if passed else '✗'} {label}")
        print(f"  Raw: {score:.2f}/{max_possible:.2f} | Score: {normalized:.2f}/10")

    return min(normalized, 10.0)

# ─── V7: Viral Loop Measurement (weight 0.9) ─────────────────────────────────

def score_v7_measurement(sf_text: str, growth_text: str, verbose: bool) -> float:
    """
    Is each loop instrumentable?
    Check for: stats grids, conversion events, admin growth views,
    K-factor components (invites sent, conversion rate).
    Cross-check with ai-growth-operating-plan.md Program D deliverables.
    """
    score = 0.0
    checks = []

    # BYOC stats grid (Screen 20.1)
    s201 = extract_screen(sf_text, "20.1")
    if s201 and re.search(r"stats.*grid|activations|active.?links|recent.?events", s201, re.IGNORECASE):
        score += 1.5
        checks.append(("BYOC activation stats grid (Screen 20.1)", True))
    else:
        checks.append(("BYOC activation stats grid (Screen 20.1)", False))
        add_issue("V7", 2, "Screen 20.1: BYOC stats grid missing or underspecced", "BYOC")

    # Referral count visible in referral hub
    f15 = extract_flow(sf_text, 15)
    if f15 and re.search(r"uses.?count|X referrals used|referral.?count|referral.?list", f15, re.IGNORECASE):
        score += 1.0
        checks.append(("Referral conversion count visible (Flow 15)", True))
    else:
        checks.append(("Referral conversion count visible (Flow 15)", False))
        add_issue("V7", 2, "Flow 15: referral conversion count not visible", "Referrals")

    # Referral status pipeline (funnel events)
    if f15 and re.search(r"signed.?up|subscribed|first.?visit|paid.?cycle|status.?badge", f15, re.IGNORECASE):
        score += 1.0
        checks.append(("Referral pipeline statuses defined (Flow 15)", True))
    else:
        checks.append(("Referral pipeline statuses defined (Flow 15)", False))
        add_issue("V7", 2, "Flow 15: no referral pipeline states (Signed up → Subscribed → First visit → Paid cycle)", "Referrals")

    # Admin growth console (Screen 30.5)
    s305 = extract_screen(sf_text, "30.5")
    if s305 and re.search(r"viral.*loop|byoc.*performance|referral.*conversion|growth.*metric", s305, re.IGNORECASE):
        score += 1.5
        checks.append(("Admin growth console tracks viral metrics (Screen 30.5)", True))
    else:
        checks.append(("Admin growth console tracks viral metrics (Screen 30.5)", False))
        add_issue("V7", 2, "Screen 30.5 (Growth Console): viral loop metrics not explicitly specced", "Admin")

    # Admin incentive programs (Screen 30.9)
    s309 = extract_screen(sf_text, "30.9")
    if s309:
        score += 0.5
        checks.append(("Admin incentive programs screen exists (Screen 30.9)", True))
    else:
        checks.append(("Admin incentive programs screen exists (Screen 30.9)", False))
        add_issue("V7", 1, "Screen 30.9 (Admin Incentive Programs) not found or very sparse", "Admin")

    # K-factor components: invites sent + conversion rate per loop
    # Check if any screen tracks "invites sent" alongside "activations"
    k_factor_signal = bool(re.search(
        r"invites?\s+sent|link.?count|activation.?rate|conversion.?rate|k.?factor",
        sf_text, re.IGNORECASE
    ))
    if k_factor_signal:
        score += 1.0
        checks.append(("K-factor components measurable (invites sent + conversion)", True))
    else:
        checks.append(("K-factor components measurable (invites sent + conversion)", False))
        add_issue("V7", 2, "No K-factor tracking signal found — need invites-sent AND conversion-rate per loop", "Admin")

    # Cross-check: Program D deliverables in ai-growth-operating-plan.md
    if growth_text:
        # Extract Program D section without DOTALL (use line-by-line)
        prog_d_lines = []
        in_prog_d = False
        for line in growth_text.splitlines():
            if re.match(r'###\s+Program D', line):
                in_prog_d = True
            elif in_prog_d and re.match(r'###\s+Program [^D]', line):
                break
            if in_prog_d:
                prog_d_lines.append(line)
        prog_d_text = "\n".join(prog_d_lines)
        if prog_d_text:
            # Check if screen-flows.md covers Program D deliverables
            if re.search(r"provider.?import.*funnel|byoc.*conversion.*funnel", prog_d_text, re.IGNORECASE):
                if re.search(r"byoc.*funnel|provider.*import.*dashboard|activation.*funnel", sf_text, re.IGNORECASE):
                    score += 0.5
                    checks.append(("Program D: provider-import funnel dashboard covered", True))
                else:
                    checks.append(("Program D: provider-import funnel dashboard covered", False))
                    add_issue("V7", 1, "Program D requires 'Provider-import conversion funnel dashboard' — not found in screen-flows.md", "Admin")

    # BYOP measurement — no loop, so no measurement
    if not re.search(r"BYOP.*metric|recommend.*provider.*track|byop.*conversion", sf_text, re.IGNORECASE):
        add_issue("V7", 2, "BYOP loop has no measurement surface — no way to track provider recommendation conversions", "BYOP")

    # Normalize
    max_possible = 7.0
    normalized = (score / max_possible) * 10.0

    if verbose:
        print("\n[V7 Viral Loop Measurement]")
        for label, passed in checks:
            print(f"  {'✓' if passed else '✗'} {label}")
        print(f"  Raw: {score:.2f}/{max_possible:.2f} | Score: {normalized:.2f}/10")

    return min(normalized, 10.0)

# ─── V8: Network Effect Articulation (weight 0.9) ────────────────────────────

def score_v8_network_effects(sf_text: str, mp_text: str, verbose: bool) -> float:
    """
    Does the spec connect viral loops to the broader growth strategy?
    Check: density language, neighborhood references, flywheel copy.
    """
    score = 0.0
    checks = []

    # "More neighbors = better service" language in viral surfaces
    density_in_viral = bool(re.search(
        r"neighborhood|dense.*route|route.*density|more.*neighbor|zone.*density|"
        r"more.*service.*better|more.*providers.*near|coverage.*area",
        sf_text, re.IGNORECASE
    ))
    if density_in_viral:
        score += 1.5
        checks.append(("Density/neighborhood language in viral surfaces", True))
    else:
        checks.append(("Density/neighborhood language in viral surfaces", False))
        add_issue("V8", 2, "Viral flows don't reference density/neighborhood benefits — missing growth narrative", "General")

    # BYOC landing references managed system benefit (not just provider continuity)
    f2 = extract_flow(sf_text, 2)
    if f2 and re.search(r"managed|better.?experience|scheduling.*billing.*quality|"
                         r"app.*manage|one.?place|proof.*every|service.*guarantee", f2, re.IGNORECASE):
        score += 1.0
        checks.append(("BYOC landing: managed platform benefit clear (not just provider continuity)", True))
    else:
        checks.append(("BYOC landing: managed platform benefit clear", False))
        add_issue("V8", 2, "BYOC landing (2.1) focuses on provider continuity but undersells the managed platform value", "BYOC")

    # Service celebration connects to subscription value (not just one-time win)
    f32 = extract_flow(sf_text, 32)
    if f32 and re.search(r"subscription.*working|membership|recurring|plan|routine", f32, re.IGNORECASE):
        score += 1.0
        checks.append(("Celebration: connects to subscription/membership value", True))
    else:
        checks.append(("Celebration: connects to subscription/membership value", False))
        add_issue("V8", 1, "Flow 32 celebration could reinforce subscription value more explicitly", "Celebration")

    # Receipt share references home history / proof-as-trust-moat
    f4 = extract_flow(sf_text, 4)
    if f4 and re.search(r"proof|handled\.|verified|checklist|photo", f4, re.IGNORECASE):
        score += 1.0
        checks.append(("Receipt share: proof-as-trust-moat visible to recipient", True))
    else:
        checks.append(("Receipt share: proof-as-trust-moat visible", False))

    # Referral invite communicates managed recurring system (not one-time transaction)
    f3 = extract_flow(sf_text, 3)
    if f3 and re.search(r"manage|recurring|service.*visit|track|app.*home|one.?place", f3, re.IGNORECASE):
        score += 0.75
        checks.append(("Referral invite: managed recurring system communicated", True))
    else:
        checks.append(("Referral invite: managed recurring system communicated", False))
        add_issue("V8", 1, "Referral landing (3.1) doesn't strongly communicate the recurring managed model", "Referrals")

    # BYOP connects to customer retention strategy
    if mp_text and re.search(r"BYOP.*friction|incumbent.*loyalty|switching.?friction", mp_text, re.IGNORECASE):
        if re.search(r"byop|recommend.*provider|switch.?kit", sf_text, re.IGNORECASE):
            score += 0.5
            checks.append(("BYOP: switching friction strategy visible in UX", True))
        else:
            checks.append(("BYOP: switching friction strategy visible in UX", False))
            add_issue("V8", 2, "Masterplan BYOP strategy (reduce switching friction) has no UX implementation", "BYOP")

    # Flywheel language on provider growth surfaces
    byoc_banner = extract_flow(sf_text, 35)
    if byoc_banner and re.search(r"route.*pay|guaranteed.*route|dense.*route|more.*earning", byoc_banner, re.IGNORECASE):
        score += 0.5
        checks.append(("Provider BYOC banner: flywheel/density language", True))
    else:
        checks.append(("Provider BYOC banner: flywheel/density language", False))

    # Normalize
    max_possible = 6.25
    normalized = (score / max_possible) * 10.0

    if verbose:
        print("\n[V8 Network Effect Articulation]")
        for label, passed in checks:
            print(f"  {'✓' if passed else '✗'} {label}")
        print(f"  Raw: {score:.2f}/{max_possible:.2f} | Score: {normalized:.2f}/10")

    return min(normalized, 10.0)

# ─── V9: Anti-Spam / Trust (weight 0.8) ──────────────────────────────────────

def score_v9_anti_spam(sf_text: str, ops_text: str, growth_text: str, verbose: bool) -> float:
    """
    Are safeguards against viral abuse defined?
    Check: fraud prevention, compliance reminders, rate limiting, trust signals.
    """
    score = 0.0
    checks = []

    # BYOC compliance reminder (operating-model.md explicitly says "do not promise permanent pricing")
    f20 = extract_flow(sf_text, 20)
    if f20 and re.search(r"do not promise|permanent pricing|pricing.?set.?by|transition.?credit|compliance", f20, re.IGNORECASE):
        score += 2.0
        checks.append(("BYOC compliance reminder present (Flow 20.1)", True))
    else:
        checks.append(("BYOC compliance reminder present (Flow 20.1)", False))
        add_issue("V9", 3, "Flow 20.1: BYOC compliance reminder missing — providers must not promise permanent pricing (per operating-model.md)", "BYOC")

    # Referral fraud prevention (duplicate detection, limits)
    ref_fraud = bool(re.search(
        r"duplicate|fraud|limit.*referral|referral.*limit|already.?used|used.?already|"
        r"one.?per|single.?use|code.*invalid|referral.*expir",
        sf_text, re.IGNORECASE
    ))
    if ref_fraud:
        score += 1.5
        checks.append(("Referral fraud prevention signals present", True))
    else:
        checks.append(("Referral fraud prevention signals present", False))
        add_issue("V9", 2, "No referral fraud prevention signals found (duplicate detection, limits, self-use prevention)", "Referrals")

    # Rate limiting on invites
    rate_limit = bool(re.search(
        r"rate.?limit|max.*link|link.*max|daily.*limit|invite.*limit|deactivate.*link",
        sf_text, re.IGNORECASE
    ))
    if rate_limit:
        score += 1.0
        checks.append(("Rate limiting on invite creation", True))
    else:
        checks.append(("Rate limiting on invite creation", False))
        add_issue("V9", 2, "No rate limiting on BYOC invite link creation or referral code sharing", "BYOC")

    # Trust signals on viral landing pages
    # BYOC landing trust
    f2 = extract_flow(sf_text, 2)
    f2_trust = f2 and bool(re.search(r"verified|insured|cancel.?anytime|guarantee|free.?to.?join", f2, re.IGNORECASE))
    if f2_trust:
        score += 0.75
        checks.append(("Trust signals on BYOC landing (Flow 2)", True))
    else:
        checks.append(("Trust signals on BYOC landing (Flow 2)", False))
        add_issue("V9", 1, "BYOC landing (2.1) could use stronger trust signals for new users", "BYOC")

    # Referral landing trust
    f3 = extract_flow(sf_text, 3)
    f3_trust = f3 and bool(re.search(r"free.?to.?join|no.?commitment|cancel|insured|guarantee", f3, re.IGNORECASE))
    if f3_trust:
        score += 0.75
        checks.append(("Trust signals on referral landing (Flow 3)", True))
    else:
        checks.append(("Trust signals on referral landing (Flow 3)", False))
        add_issue("V9", 1, "Referral landing (3.1) trust signals weak or missing", "Referrals")

    # Share landing trust
    f4 = extract_flow(sf_text, 4)
    f4_trust = f4 and bool(re.search(r"handled\.|verified|insured|proof|brand.?stamp", f4, re.IGNORECASE))
    if f4_trust:
        score += 0.5
        checks.append(("Trust / brand signal on receipt share landing (Flow 4)", True))
    else:
        checks.append(("Trust / brand signal on receipt share landing (Flow 4)", False))

    # Governance cross-check with ai-growth-operating-plan.md
    if growth_text and re.search(r"red.?team|abuse.?vector|referral.*credit.*gaming|fraud", growth_text, re.IGNORECASE):
        # Check if screen-flows.md reflects governance thinking
        if re.search(r"abuse|fraud|duplicate|limit|compliance", sf_text, re.IGNORECASE):
            score += 0.5
            checks.append(("Growth plan governance reflected in screen specs", True))
        else:
            checks.append(("Growth plan governance reflected in screen specs", False))
            add_issue("V9", 2, "ai-growth-operating-plan.md flags abuse vectors for referrals — screen specs should reflect guardrails", "Admin")

    # Normalize
    max_possible = 7.0
    normalized = (score / max_possible) * 10.0

    if verbose:
        print("\n[V9 Anti-Spam / Trust]")
        for label, passed in checks:
            print(f"  {'✓' if passed else '✗'} {label}")
        print(f"  Raw: {score:.2f}/{max_possible:.2f} | Score: {normalized:.2f}/10")

    return min(normalized, 10.0)

# ─── V10: Multi-Loop Synergy (weight 0.8) ────────────────────────────────────

def score_v10_synergy(sf_text: str, verbose: bool) -> float:
    """
    Do the loops reinforce each other?
    Check: receipt share → referral code, BYOC → referral, celebration → referral,
    growth hub, cross-loop connections.
    """
    score = 0.0
    checks = []

    # Does receipt share page have a referral code?
    s113 = extract_screen(sf_text, "11.3")
    if s113 and re.search(r"referral|referral.*code|share.*code|growth.*surface", s113, re.IGNORECASE):
        score += 1.5
        checks.append(("Receipt page: referral code or cross-loop growth surface", True))
    else:
        checks.append(("Receipt page: referral code cross-sell", False))
        add_issue("V10", 2, "Screen 11.3 receipt page has no referral code cross-sell — missed synergy opportunity", "Receipts")

    # Does BYOC flow reference customer referrals?
    f20 = extract_flow(sf_text, 20)
    if f20 and re.search(r"referral|customer.*refer|refer.*customer", f20, re.IGNORECASE):
        score += 1.0
        checks.append(("BYOC Center: cross-references referral program", True))
    else:
        checks.append(("BYOC Center: cross-references referral program", False))
        add_issue("V10", 1, "Flow 20 BYOC Center doesn't cross-reference the customer referral program", "BYOC")

    # Does celebration overlay connect to referral program?
    f32 = extract_flow(sf_text, 32)
    if f32 and re.search(r"referral|code|earn.*credit|share.*earn", f32, re.IGNORECASE):
        score += 1.5
        checks.append(("Celebration overlay: connects to referral program", True))
    else:
        checks.append(("Celebration overlay: connects to referral program", False))
        add_issue("V10", 2, "Flow 32 celebration: no connection to referral program — missed moment to start referral loop", "Celebration")

    # Is there a growth hub that shows viral tools together?
    growth_hub = bool(re.search(
        r"growth.?hub|growth.*menu|BYOC.*referral.*together|viral.*tools|"
        r"Growth\s+\|\s+BYOC|Growth.*BYOC.*Referral",
        sf_text, re.IGNORECASE
    ))
    if growth_hub:
        score += 2.0
        checks.append(("Growth hub / viral tools co-located", True))
    else:
        checks.append(("Growth hub / viral tools co-located", False))
        add_issue("V10", 2, "No growth hub where all viral tools are co-located — loops operate in silos", "General")

    # Provider referrals page (Screen 24.4) — does it link to BYOC?
    s244 = extract_screen(sf_text, "24.4")
    if s244 and re.search(r"byoc|bring.?your.?own|growth.?hub", s244, re.IGNORECASE):
        score += 0.75
        checks.append(("Provider referrals page: links to BYOC (Screen 24.4)", True))
    else:
        checks.append(("Provider referrals page: links to BYOC (Screen 24.4)", False))
        add_issue("V10", 1, "Screen 24.4 (Provider Referrals/Growth Hub) doesn't cross-link to BYOC", "BYOC")

    # Does the referral invite landing (Flow 3) set up the new user for more loops?
    f3 = extract_flow(sf_text, 3)
    if f3 and re.search(r"provider|byoc|referral.*your|onboard", f3, re.IGNORECASE):
        score += 0.5
        checks.append(("Referral landing: seeds new user into broader loop ecosystem", True))
    else:
        checks.append(("Referral landing: seeds new user into broader loop ecosystem", False))

    # Normalize
    max_possible = 7.25
    normalized = (score / max_possible) * 10.0

    if verbose:
        print("\n[V10 Multi-Loop Synergy]")
        for label, passed in checks:
            print(f"  {'✓' if passed else '✗'} {label}")
        print(f"  Raw: {score:.2f}/{max_possible:.2f} | Score: {normalized:.2f}/10")

    return min(normalized, 10.0)

# ─── Anti-Gaming Guards ───────────────────────────────────────────────────────

def check_anti_gaming(sf_text: str, verbose: bool) -> float:
    """
    Detect and penalize gaming patterns. Returns penalty (0.0 = clean, higher = worse).
    """
    penalty = 0.0
    gaming_issues = []

    # 1. Duplicate share CTAs on unrelated screens (non-completion screens)
    # Search line-by-line for share CTAs in non-completion contexts
    lines = sf_text.splitlines()
    in_non_completion = False
    non_completion_headers = re.compile(
        r"(settings|billing|password|plans|subscription.management)", re.IGNORECASE
    )
    share_cta_pattern = re.compile(r"Share2|share.cta", re.IGNORECASE)
    generic_share_spam = 0
    for line in lines:
        if re.match(r"^###\s+Screen", line):
            in_non_completion = bool(non_completion_headers.search(line))
        elif re.match(r"^#{1,2}\s+", line):
            in_non_completion = bool(non_completion_headers.search(line))
        if in_non_completion and share_cta_pattern.search(line):
            generic_share_spam += 1
    if generic_share_spam > 0:
        penalty += generic_share_spam * 1.0
        gaming_issues.append(f"Share CTAs on non-completion screens: {generic_share_spam} instances")

    # 2. Incentive amounts without operating-model anchoring
    # Amounts in viral flows that aren't in ops doc
    incentive_amounts_in_sf = re.findall(r'\$\d+|\d+%\s+(?:off|bonus|discount)', sf_text, re.IGNORECASE)
    # $30, Free month, VIP are the defined ones in Flow 37 — those are expected
    # Penalize if there are many more novel amounts not in the spec
    expected_amounts = {"$30"}  # defined in Flow 37
    novel_amounts = [a for a in incentive_amounts_in_sf if a.lower() not in {e.lower() for e in expected_amounts}]
    if len(novel_amounts) > 5:
        penalty += 1.0
        gaming_issues.append(f"Many novel incentive amounts ({len(novel_amounts)}) — check anchoring in operating-model.md")

    # 3. Boilerplate "Share now!" copy
    pushy_share_copy = len(re.findall(
        r"share now!|share today!|share this!|go viral|tell everyone|spread the word",
        sf_text, re.IGNORECASE
    ))
    if pushy_share_copy > 0:
        penalty += pushy_share_copy * 0.5
        gaming_issues.append(f"Pushy share copy ({pushy_share_copy} instances) — doesn't match calm brand voice")

    # 4. Speculative viral features not grounded in docs
    speculative = len(re.findall(
        r"viral coefficient|growth hack|k-factor display|leaderboard|viral loop widget",
        sf_text, re.IGNORECASE
    ))
    if speculative > 0:
        penalty += speculative * 0.75
        gaming_issues.append(f"Speculative viral features ({speculative}) not grounded in masterplan/operating-model")

    # Simplicity bonus: rewarded for tightening existing flows
    # Check if BYOP (missing loop) was filled in tightly
    byop_flow = bool(re.search(r"^#\s+FLOW\s+2B", sf_text, re.MULTILINE) or
                     re.search(r"BYOP.*Flow|byop.*screen|recommend.*provider.*screen", sf_text, re.IGNORECASE))
    simplicity_bonus = 0.0
    if byop_flow:
        simplicity_bonus += 1.0  # rewarded for adding the missing loop

    if verbose and (gaming_issues or simplicity_bonus > 0):
        print("\n[Anti-Gaming Guards]")
        for issue in gaming_issues:
            print(f"  ⚠ {issue}")
        if simplicity_bonus > 0:
            print(f"  ✓ Simplicity bonus: +{simplicity_bonus:.2f} (BYOP loop added)")

    return penalty, simplicity_bonus

# ─── Composite Score ──────────────────────────────────────────────────────────

WEIGHTS = {
    "v1": 1.3,
    "v2": 1.2,
    "v3": 1.1,
    "v4": 1.1,
    "v5": 1.0,
    "v6": 1.0,
    "v7": 0.9,
    "v8": 0.9,
    "v9": 0.8,
    "v10": 0.8,
}

def compute_composite(scores: dict[str, float]) -> float:
    """
    Weighted composite score, normalized to 0-100.
    Each dimension is 0-10. Weights sum to 10.0.
    """
    total_weight = sum(WEIGHTS.values())  # = 10.0
    weighted_sum = sum(scores[k] * WEIGHTS[k] for k in WEIGHTS)
    return (weighted_sum / total_weight)  # already 0-10 scale → multiply by 10 for 0-100
    # Wait: weighted_sum / total_weight → 0-10 range (since each score is 0-10)
    # Multiply by 10 to get 0-100
    # But we'll do it in main to avoid confusion

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    args = parse_args()
    sf_path, mp_path, ops_path, growth_path = resolve_paths(args)

    sf_text = load_text(sf_path)
    mp_text = load_text(mp_path)
    ops_text = load_text(ops_path)
    growth_text = load_text(growth_path)

    verbose = args.verbose

    if verbose:
        print(f"\nEvaluating: {sf_path}")
        print(f"Masterplan: {mp_path or '(not found)'}")
        print(f"Ops model:  {ops_path or '(not found)'}")
        print(f"Growth plan:{growth_path or '(not found)'}")
        print()

    # Score all 10 dimensions
    v1, loops_found, loops_complete = score_v1_loop_completeness(sf_text, verbose)
    v2, total_friction = score_v2_friction(sf_text, verbose)
    v3 = score_v3_invite_clarity(sf_text, verbose)
    v4 = score_v4_share_artifacts(sf_text, verbose)
    v5 = score_v5_incentives(sf_text, mp_text, ops_text, verbose)
    v6 = score_v6_trigger_placement(sf_text, verbose)
    v7 = score_v7_measurement(sf_text, growth_text, verbose)
    v8 = score_v8_network_effects(sf_text, mp_text, verbose)
    v9 = score_v9_anti_spam(sf_text, ops_text, growth_text, verbose)
    v10 = score_v10_synergy(sf_text, verbose)

    scores = {"v1": v1, "v2": v2, "v3": v3, "v4": v4, "v5": v5,
              "v6": v6, "v7": v7, "v8": v8, "v9": v9, "v10": v10}

    # Anti-gaming
    gaming_penalty, simplicity_bonus = check_anti_gaming(sf_text, verbose)

    # Composite
    total_weight = sum(WEIGHTS.values())
    weighted_sum = sum(scores[k] * WEIGHTS[k] for k in WEIGHTS)
    raw_score = (weighted_sum / total_weight) * 10.0  # → 0-100

    # Apply gaming penalty and simplicity bonus
    viral_score = raw_score - gaming_penalty + simplicity_bonus
    viral_score = max(0.0, min(100.0, viral_score))

    issues_found = len(issues)

    if verbose:
        print("\n" + "="*60)
        print("ISSUES FOUND:")
        for iss in sorted(issues, key=lambda x: -x.severity):
            loop_tag = f" [{iss.loop}]" if iss.loop else ""
            severity_label = {3: "CRITICAL", 2: "WARNING", 1: "NOTE"}[iss.severity]
            print(f"  [{iss.dimension}] [{severity_label}]{loop_tag} {iss.message}")
        print("="*60)

    # ─── Output ───────────────────────────────────────────────────────────────
    print("---")
    print(f"viral_score:         {viral_score:.2f}")
    print(f"max_possible:        100.00")
    print(f"v1_loop_completeness:  {v1:.2f}")
    print(f"v2_friction:           {v2:.2f}")
    print(f"v3_invite_clarity:     {v3:.2f}")
    print(f"v4_share_artifacts:    {v4:.2f}")
    print(f"v5_incentives:         {v5:.2f}")
    print(f"v6_trigger_placement:  {v6:.2f}")
    print(f"v7_measurement:        {v7:.2f}")
    print(f"v8_network_effects:    {v8:.2f}")
    print(f"v9_anti_spam:          {v9:.2f}")
    print(f"v10_synergy:           {v10:.2f}")
    print(f"loops_found:           {loops_found}")
    print(f"loops_complete:        {loops_complete}")
    print(f"gaming_penalty:        {gaming_penalty:.2f}")
    print(f"simplicity_bonus:      {simplicity_bonus:.2f}")
    print(f"total_friction:        {total_friction}")
    print(f"issues_found:          {issues_found}")
    print("---")

if __name__ == "__main__":
    main()
