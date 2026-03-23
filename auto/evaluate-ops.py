#!/usr/bin/env python3
"""
evaluate-ops.py — Handled Home Operating Model Scoring Harness
Scores docs/operating-model.md on 10 business-quality dimensions.
Higher score = better document. Max 100.

Usage:
    python evaluate-ops.py [--verbose] [--doc PATH] [--masterplan PATH] [--arch PATH]

Environment overrides:
    OPS_DOC_PATH, OPS_MASTERPLAN_PATH, OPS_ARCH_PATH
"""

import re
import sys
import os
import argparse
from pathlib import Path
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).parent

def _find(env_key: str, *candidates: str) -> Optional[Path]:
    """Return first path that exists, checking env override first."""
    if env_key in os.environ:
        p = Path(os.environ[env_key])
        if p.exists():
            return p
    for c in candidates:
        p = Path(c)
        if p.exists():
            return p
        p = SCRIPT_DIR / c
        if p.exists():
            return p
    return None

DEFAULT_DOC       = _find("OPS_DOC_PATH",
    "docs/operating-model.md",
    "../docs/operating-model.md",
    "operating-model.md")

DEFAULT_MASTERPLAN = _find("OPS_MASTERPLAN_PATH",
    "masterplan.md",
    "docs/masterplan.md",
    "../docs/masterplan.md")

DEFAULT_ARCH       = _find("OPS_ARCH_PATH",
    "global-system-architecture.md",
    "docs/global-system-architecture.md",
    "../docs/global-system-architecture.md")

# ---------------------------------------------------------------------------
# Issue container
# ---------------------------------------------------------------------------

@dataclass
class Issue:
    dimension: str          # D1–D10
    severity: int           # 1=cosmetic, 2=friction, 3=critical
    description: str
    evidence: str = ""      # snippet or section name

SEVERITY_LABEL = {3: "Critical", 2: "Friction", 1: "Cosmetic"}

# ---------------------------------------------------------------------------
# Text helpers
# ---------------------------------------------------------------------------

def load(path: Optional[Path]) -> str:
    if path is None or not path.exists():
        return ""
    return path.read_text(encoding="utf-8")

def sections(text: str) -> dict[str, str]:
    """Return {heading: body} mapping. H2/H3 headings are keys."""
    result: dict[str, str] = {}
    current_heading = "__preamble__"
    buf: list[str] = []
    for line in text.splitlines():
        if re.match(r"^#{2,3} ", line):
            result[current_heading] = "\n".join(buf)
            current_heading = line.strip("# ").strip()
            buf = []
        else:
            buf.append(line)
    result[current_heading] = "\n".join(buf)
    return result

def word_count(text: str) -> int:
    return len(text.split())

def has_number(text: str) -> bool:
    return bool(re.search(r"\d", text))

def vague_words(text: str) -> list[str]:
    """Return list of vague quantifiers found in text (without numbers nearby)."""
    pattern = re.compile(
        r"\b(some|many|several|various|significant|meaningful|often|frequently|"
        r"periodically|regularly|eventually|generally|typically|mostly|largely|"
        r"usually|commonly|appropriate|reasonable|sufficient|adequate|robust|"
        r"strong|competitive|attractive|healthy|growing|improving)\b",
        re.IGNORECASE
    )
    matches = []
    for m in pattern.finditer(text):
        start = max(0, m.start() - 60)
        end   = min(len(text), m.end() + 60)
        context_snip = text[start:end]
        if not re.search(r"\d", context_snip):
            matches.append(m.group())
    return matches

def count_tables(text: str) -> int:
    return len(re.findall(r"^\|", text, re.MULTILINE))

def count_headers(text: str) -> int:
    return len(re.findall(r"^#{2,3} ", text, re.MULTILINE))

def sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"[.!?]+", text) if len(s.strip()) > 20]

# Baseline word count for simplicity bonus/penalty
BASELINE_WORD_COUNT = 3500  # approximate for the initial operating-model.md

# ---------------------------------------------------------------------------
# D1 — Definitional Completeness  (weight 1.2)
# ---------------------------------------------------------------------------

def score_d1(doc: str, issues: list[Issue]) -> float:
    """
    Every business concept must be fully defined:
    - Pricing terms need a formula/mechanism
    - Each tier must have positioning, inclusions, differentiation
    - Each strategy must have definition, criteria, metrics, exit criteria
    """
    score = 10.0

    # --- Pricing term: subscription spread ---
    if "subscription spread" in doc.lower():
        # Must have explicit delta/formula language
        if not re.search(r"(plan price minus|minus.*payout|delta between|spread.*=|price minus)", doc, re.IGNORECASE):
            issues.append(Issue("D1", 2, "'subscription spread' lacks explicit delta formula (plan price − provider payout)", "Revenue Engine"))
            score -= 0.8

    # --- Tier: Essential ---
    essential_body = ""
    for line in doc.splitlines():
        if re.match(r"^#{2,3}\s+Essential", line):
            break
    # Extract essential section
    m = re.search(r"###\s*Essential\s*\n(.*?)(?=\n###|\n##|\Z)", doc, re.DOTALL | re.IGNORECASE)
    if m:
        essential_body = m.group(1)
    else:
        issues.append(Issue("D1", 3, "Essential tier section not found", "Plan Tier Structure"))
        score -= 1.5

    if essential_body:
        if "position" not in essential_body.lower() and "positioning" not in essential_body.lower() and "*" not in essential_body:
            issues.append(Issue("D1", 2, "Essential tier missing explicit positioning statement", "Plan Tier Structure"))
            score -= 0.5
        if "differentiat" not in essential_body.lower():
            # Check for comparative language
            if not re.search(r"(vs\.|versus|compared to|unlike|only|not|basic|core)", essential_body, re.IGNORECASE):
                issues.append(Issue("D1", 1, "Essential tier has no explicit differentiation from Plus/Premium", "Plan Tier Structure"))
                score -= 0.3

    # --- Tier: Plus ---
    m = re.search(r"###\s*Plus\s*\n(.*?)(?=\n###|\n##|\Z)", doc, re.DOTALL | re.IGNORECASE)
    plus_body = m.group(1) if m else ""
    if not plus_body:
        issues.append(Issue("D1", 3, "Plus tier section not found", "Plan Tier Structure"))
        score -= 1.5
    else:
        if not re.search(r"position", plus_body, re.IGNORECASE) and "*" not in plus_body:
            issues.append(Issue("D1", 2, "Plus tier missing positioning statement", "Plan Tier Structure"))
            score -= 0.5

    # --- Tier: Premium ---
    m = re.search(r"###\s*Premium\s*\n(.*?)(?=\n###|\n##|\Z)", doc, re.DOTALL | re.IGNORECASE)
    premium_body = m.group(1) if m else ""
    if not premium_body:
        issues.append(Issue("D1", 3, "Premium tier section not found", "Plan Tier Structure"))
        score -= 1.5
    else:
        if not re.search(r"position", premium_body, re.IGNORECASE) and "*" not in premium_body:
            issues.append(Issue("D1", 2, "Premium tier missing positioning statement", "Plan Tier Structure"))
            score -= 0.5

    # --- Strategy: Loss Leader ---
    m = re.search(r"##\s*Loss Leader Strategy\s*\n(.*?)(?=\n##|\Z)", doc, re.DOTALL | re.IGNORECASE)
    ll_body = m.group(1) if m else ""
    if not ll_body:
        issues.append(Issue("D1", 3, "Loss Leader Strategy section not found", "Document"))
        score -= 1.5
    else:
        checks = {
            "qualifying criteria": r"(qualif|criteria|makes a good|when it)",
            "success metrics": r"(metric|success|attach rate|conversion|measure|improve)",
            "exit criteria": r"(kill|exit|discard|review|re-evaluat|abandon|remove|drop|not remain)",
        }
        for label, pattern in checks.items():
            if not re.search(pattern, ll_body, re.IGNORECASE):
                issues.append(Issue("D1", 2, f"Loss Leader strategy missing {label}", "Loss Leader Strategy"))
                score -= 0.4

    # --- Strategy: BYOC ---
    m = re.search(r"###\s*BYOC.*?\n(.*?)(?=\n###|\n##|\Z)", doc, re.DOTALL | re.IGNORECASE)
    byoc_body = m.group(1) if m else ""
    if not byoc_body:
        issues.append(Issue("D1", 2, "BYOC section body not found", "Document"))
        score -= 0.8
    else:
        if not re.search(r"(definition|when a provider|provider.*customer|customer.*provider|migrat|transition)", byoc_body, re.IGNORECASE):
            issues.append(Issue("D1", 2, "BYOC definition is unclear or missing mechanism", "BYOC"))
            score -= 0.5
        if not re.search(r"(success|metric|profitable|contribut|result)", byoc_body, re.IGNORECASE):
            issues.append(Issue("D1", 1, "BYOC section lacks success measurement language", "BYOC"))
            score -= 0.3

    # --- Strategy: BYOP ---
    m = re.search(r"###\s*BYOP.*?\n(.*?)(?=\n###|\n##|\Z)", doc, re.DOTALL | re.IGNORECASE)
    byop_body = m.group(1) if m else ""
    if not byop_body:
        issues.append(Issue("D1", 2, "BYOP section body not found", "Document"))
        score -= 0.8
    else:
        if not re.search(r"(success|metric|profitable|contribut|result|path)", byop_body, re.IGNORECASE):
            issues.append(Issue("D1", 1, "BYOP section lacks success measurement language", "BYOP"))
            score -= 0.3

    # --- Household contribution margin formula ---
    if "household contribution margin" in doc.lower():
        if not re.search(r"(=|minus|subtract|formula|revenue minus|payout minus|total.*minus|spread.*minus)", doc, re.IGNORECASE):
            issues.append(Issue("D1", 2, "'household contribution margin' mentioned but formula not provided (should be: plan revenue − provider payout − ops − payment overhead)", "Revenue Engine"))
            score -= 0.7

    # --- Handles abstraction ---
    if re.search(r"\bhandles\b", doc, re.IGNORECASE):
        if not re.search(r"(handle.*=|handles.*=|handle.*allowance|allowance.*handle)", doc, re.IGNORECASE):
            issues.append(Issue("D1", 1, "'Handles' referenced but not defined as an abstraction unit (allowance of X per cycle)", "Revenue Engine"))
            score -= 0.3

    return max(0.0, round(score, 2))

# ---------------------------------------------------------------------------
# D2 — Numeric Specificity  (weight 1.1)
# ---------------------------------------------------------------------------

def score_d2(doc: str, issues: list[Issue]) -> float:
    score = 10.0

    # --- Density thresholds ---
    if not re.search(r"\d+[–\-]\d+\s*(households|customers)/zone", doc, re.IGNORECASE):
        issues.append(Issue("D2", 2, "Density thresholds lack numeric households-per-zone ranges (e.g. 15–25 households/zone)", "Zone & Density Mechanics"))
        score -= 1.0
    else:
        # Verify each phase has a number
        if not re.search(r"5[–\-]10\s*(households|customers)", doc, re.IGNORECASE):
            issues.append(Issue("D2", 1, "Minimum viable route threshold (5–10 households) not stated", "Zone & Density Mechanics"))
            score -= 0.3

    # --- Margin targets (en-dash, hyphen, or close sequence between 30 and 40) ---
    if not re.search(r"30.{0,3}40.{0,4}%|gross margins.{0,20}30|30.{0,5}40.{0,10}margin", doc, re.IGNORECASE):
        issues.append(Issue("D2", 2, "Gross margin targets not stated (e.g. 30–40%)", "Profit progression"))
        score -= 0.9

    # --- Cost-per-stop improvement ---
    if not re.search(r"(\d+[–\-]\d+\s*%|cost.per.stop drops \d)", doc, re.IGNORECASE):
        issues.append(Issue("D2", 2, "Provider cost-per-stop improvement not quantified (e.g. 'drops 15–20%')", "Zone & Density Mechanics"))
        score -= 0.8

    # --- Review cadence ---
    cadence_ok = re.search(r"(quarterly|annually|monthly|90.day|30.day|60.day|semi.annual)", doc, re.IGNORECASE)
    if not cadence_ok:
        issues.append(Issue("D2", 2, "No review cadences specified (quarterly, 90-day, etc.)", "Key Pricing Principles"))
        score -= 0.8

    # --- Timeframes for loss leaders ---
    if not re.search(r"90.day", doc, re.IGNORECASE):
        issues.append(Issue("D2", 2, "Loss-leader review window not specified in days (e.g. '90-day attach window')", "Loss Leader Strategy"))
        score -= 0.7

    # --- Pricing example ---
    if not re.search(r"\$\d+", doc):
        issues.append(Issue("D2", 2, "No concrete price examples (e.g. $159/mo plan) in document", "Example Unit Economics"))
        score -= 0.8

    # --- Provider payout example ---
    if not re.search(r"\$\d+.*(payout|job|per.job|rate)", doc, re.IGNORECASE):
        issues.append(Issue("D2", 2, "No concrete provider payout examples (e.g. '$38/job')", "Provider Payout Logic"))
        score -= 0.7

    # --- Attach window quantified ---
    if not re.search(r"(30|60|90).day.*attach|attach.*within.*(30|60|90)", doc, re.IGNORECASE):
        issues.append(Issue("D2", 2, "Attach-rate monitoring window not quantified (e.g. '2nd service within 30/60/90 days')", "Loss Leader Strategy"))
        score -= 0.5

    # --- Vague language scan ---
    vague = vague_words(doc)
    vague_count = len(vague)
    if vague_count >= 10:
        issues.append(Issue("D2", 2, f"{vague_count} vague quantifiers without numbers (e.g. {', '.join(set(vague[:5]))})", "General"))
        score -= min(1.5, vague_count * 0.1)
    elif vague_count >= 5:
        issues.append(Issue("D2", 1, f"{vague_count} vague quantifiers without numbers nearby", "General"))
        score -= min(0.7, vague_count * 0.07)

    # --- Handle rollover cap ---
    if "1.5" not in doc and "150%" not in doc:
        issues.append(Issue("D2", 1, "Rollover cap multiplier (1.5×) not present — unclear if this is defined in this doc vs. elsewhere", "Key Pricing Principles"))
        score -= 0.3

    return max(0.0, round(score, 2))

# ---------------------------------------------------------------------------
# D3 — Edge Case Coverage  (weight 1.3)
# ---------------------------------------------------------------------------

def score_d3(doc: str, issues: list[Issue]) -> float:
    score = 10.0
    dl = doc.lower()

    edge_cases = [
        # (label, pattern, severity, section_hint, deduction)
        ("customer downgrade mid-cycle",
         r"(downgrade|down.grade|reduce.*plan|plan.*reduc)", 2, "Plan Tier / Subscription", 0.8),
        ("customer plan pause",
         r"(paus|suspend.*subscri|subscri.*suspend|hold.*plan|plan.*hold)", 2, "Subscription lifecycle", 0.8),
        ("customer cancel mid-cycle / refund policy",
         r"(cancel.*mid|mid.*cancel|partial.*refund|refund.*cancel|pro.rat)", 2, "Cancellation / Billing", 0.9),
        ("failed payment / dunning",
         r"(fail.*payment|payment.*fail|dunning|past.due|invoice.*fail|billing.*fail)", 2, "Financial / Billing", 0.9),
        ("provider leaves or exits network",
         r"(provider.*leav|leav.*provider|provider.*exit|exit.*provider|provider.*off.board)", 3, "Provider lifecycle", 1.0),
        ("provider suspended / PROBATION / SUSPENDED state",
         r"(suspend|probation|provider.*suspend|suspend.*provider)", 2, "Provider lifecycle", 0.7),
        ("provider dispute or quality issue",
         r"(dispute|provider.*quality|quality.*issue|provider.*fail|fail.*provider)", 2, "Provider quality", 0.6),
        ("zone with too few providers (coverage gap)",
         r"(coverage gap|under.serv|too few provider|no provider|provider.*short|short.*provider|provider.recruit)", 3, "Zone & Density Mechanics", 1.0),
        ("zone oversaturated / too many customers",
         r"(oversatur|capacity.*exceed|over.capacity|over.sell|waitlist|cap.*full)", 2, "Zone & Density Mechanics", 0.7),
        ("loss leader no attach after 90 days",
         r"(no attach|does not.*attach|fail.*attach|attach.*fail|kill.*loss|re.evaluat.*loss)", 2, "Loss Leader Strategy", 0.5),
        ("BYOC customer churns after migration",
         r"(byoc.*churn|churn.*byoc|migrat.*churn|churn.*migrat|migrat.*leave)", 2, "BYOC / BYOP", 0.8),
        ("BYOP provider declines or becomes unavailable",
         r"(byop.*declin|declin.*byop|byop.*unavail|unavail.*byop|provider.*declin)", 2, "BYOC / BYOP", 0.7),
        ("zone never reaches density threshold",
         r"(density.*never|never.*density|fail.*density|density.*fail|zone.*not.*reach|not.*reach.*threshold)", 3, "Zone & Density Mechanics", 1.0),
        ("pricing exception becomes permanent",
         r"(exception.*permanent|permanent.*exception|exception.*not.*standard|exception.*expire|expir.*exception|time.bound|volume.bound)", 1, "Pricing & Negotiation Policy", 0.4),
        ("provider sees customer pricing (abstraction break)",
         r"(provider.*never see|never.*see.*customer pricing|abstraction|hides the spread)", 1, "Key Pricing Principles", 0.3),
    ]

    for label, pattern, sev, section, deduct in edge_cases:
        if not re.search(pattern, dl, re.IGNORECASE):
            issues.append(Issue("D3", sev, f"Edge case not addressed: {label}", section))
            score -= deduct

    # Partial credit: loss leader 90-day rule IS there per spec
    if re.search(r"(90.day|90 day)", dl, re.IGNORECASE):
        score += 0.3  # reward for having this

    return max(0.0, round(score, 2))

# ---------------------------------------------------------------------------
# D4 — Internal Consistency  (weight 1.1)
# ---------------------------------------------------------------------------

def score_d4(doc: str, issues: list[Issue]) -> float:
    score = 10.0

    # --- Revenue Engine vs Plan Tier vs Key Pricing Principles ---
    # "subscription spread" definition should be consistent
    spread_definitions = re.findall(
        r"subscription spread[^.]*?(delta|minus|difference|spread)[^.]*?\.",
        doc, re.IGNORECASE
    )

    # Check that payout description is consistent
    payout_desc_re = re.compile(r"(per job|per.job|payout per job)", re.IGNORECASE)
    payout_matches = payout_desc_re.findall(doc)
    if len(payout_matches) == 0:
        issues.append(Issue("D4", 2, "Payout unit never described as 'per job' — ambiguous payout structure", "Provider Payout Logic"))
        score -= 0.7

    # --- Margin claim consistency ---
    # Phase 3 gross margin: "30-40%"
    margin_claims = re.findall(r"(\d+)[–\-]?(\d+)%\s*(gross margin|margin)", doc, re.IGNORECASE)
    margin_numbers = set()
    for m in margin_claims:
        margin_numbers.add(f"{m[0]}-{m[1]}")
    if len(margin_numbers) > 1:
        issues.append(Issue("D4", 2, f"Conflicting margin range claims in document: {margin_numbers}", "Profit progression"))
        score -= 0.8

    # --- Pricing abstraction consistency ---
    # Key claim: providers never see customer pricing
    provider_no_see = re.search(r"providers.*never see.*customer pric|never.*customer.*pric.*provider", doc, re.IGNORECASE)
    if provider_no_see:
        # Verify no section contradicts this — exclude lines where 'never' negates the verb
        contradiction_found = False
        for m_obj in re.finditer(r"provider.{0,20}see.{0,30}customer pric|show.{0,20}provider.{0,20}customer pric", doc, re.IGNORECASE):
            start_ln = doc.rfind("\\n", 0, m_obj.start()) + 1
            end_ln   = doc.find("\\n", m_obj.end())
            line_txt = doc[start_ln:end_ln if end_ln != -1 else len(doc)]
            if "never" not in line_txt.lower():
                contradiction_found = True
                break
        if contradiction_found:
            issues.append(Issue("D4", 3, "Contradiction: document claims providers never see customer pricing but also suggests showing them", "Provider Payout"))
            score -= 1.5
    else:
        issues.append(Issue("D4", 1, "Abstraction invariant (providers never see customer pricing) not stated clearly enough", "Key Pricing Principles"))
        score -= 0.3

    # --- Loss leader review cadence consistency ---
    ll_review = re.findall(r"(quarterly|90.day|semi.annual|annual|periodically)\s*(review|assess|evaluat)", doc, re.IGNORECASE)
    if len(set([l[0].lower() for l in ll_review])) > 1:
        issues.append(Issue("D4", 2, f"Inconsistent loss-leader review cadences: {[l[0] for l in ll_review]}", "Loss Leader Strategy"))
        score -= 0.5

    # --- BYOC entry margin consistency ---
    # "thin margin at entry" should be consistent across BYOC + example sections
    thin_margin = len(re.findall(r"thin margin", doc, re.IGNORECASE))
    if thin_margin == 0:
        issues.append(Issue("D4", 1, "Thin-margin-at-entry principle stated in one section but not cross-referenced consistently", "BYOC / BYOP"))
        score -= 0.2

    # --- Exception rules consistency ---
    # Exceptions described in "When exceptions are allowed" should be consistent with "Exception rules"
    exceptions_section = re.search(
        r"###\s*Exception rules\s*\n(.*?)(?=\n###|\n##|\Z)", doc, re.DOTALL | re.IGNORECASE
    )
    when_exceptions = re.search(
        r"###\s*When exceptions are allowed\s*\n(.*?)(?=\n###|\n##|\Z)", doc, re.DOTALL | re.IGNORECASE
    )
    if exceptions_section and when_exceptions:
        # Both exist — check expiration is mentioned in exception rules
        exc_body = exceptions_section.group(1)
        if not re.search(r"(expir|time.bound|limited|document)", exc_body, re.IGNORECASE):
            issues.append(Issue("D4", 2, "Exception rules section doesn't reinforce expiration/time-bound requirements from 'When exceptions are allowed'", "Pricing & Negotiation Policy"))
            score -= 0.5
    elif not exceptions_section:
        issues.append(Issue("D4", 2, "Exception rules section missing — 'When exceptions are allowed' has no enforcement counterpart", "Pricing & Negotiation Policy"))
        score -= 0.8

    # --- Density thresholds consistency across sections ---
    # Density thresholds table vs profit progression table
    density_numbers_profit = re.findall(r"\b(5|10|15|25|40|50)\s*[+–\-]?\s*(household|customer)", doc, re.IGNORECASE)
    density_numbers_zone   = re.findall(r"\b(5|10|15|25|40|50)\s*[+–\-]?\s*(household|customer)", doc, re.IGNORECASE)
    # Just check thresholds table exists and aligns with profit progression
    if "15–25" in doc and "15-25" not in doc:
        pass  # consistent use of en-dash is fine
    # Check for contradictory density numbers
    all_density = re.findall(r"(\d+)[–\-](\d+)\s*(?:households|customers)/zone", doc, re.IGNORECASE)
    if len(all_density) > 1:
        # Verify ranges don't overlap weirdly
        ranges = [(int(a), int(b)) for a, b in all_density]
        for i, (a1, b1) in enumerate(ranges):
            for j, (a2, b2) in enumerate(ranges):
                if i < j and a1 == a2 and b1 != b2:
                    issues.append(Issue("D4", 2, f"Same density lower bound ({a1}) mapped to different upper bounds across sections", "Zone & Density"))
                    score -= 0.5

    return max(0.0, round(score, 2))

# ---------------------------------------------------------------------------
# D5 — Cross-Document Alignment  (weight 1.0)
# ---------------------------------------------------------------------------

def score_d5(doc: str, masterplan: str, arch: str, issues: list[Issue]) -> float:
    score = 10.0
    dl = doc.lower()
    ml = masterplan.lower()
    al = arch.lower()

    if not masterplan:
        issues.append(Issue("D5", 2, "masterplan.md not found — cross-doc alignment check partially skipped", "Setup"))
        score -= 2.0
    if not arch:
        issues.append(Issue("D5", 2, "global-system-architecture.md not found — cross-doc alignment check partially skipped", "Setup"))
        score -= 2.0

    # --- Canonical glossary terms (global-system-architecture.md Section 4) ---
    canonical_terms = [
        "household", "property", "region", "zone", "service day",
        "cycle", "bundle", "sku", "job", "proof-of-work"
    ]
    for term in canonical_terms:
        if term in al and term not in dl:
            issues.append(Issue("D5", 1, f"Canonical term '{term}' (from global-system-architecture §4) not used in operating-model.md", "Canonical Glossary"))
            score -= 0.2

    # --- Revenue model alignment with masterplan ---
    # masterplan defines "subscription spread model"
    if "subscription spread" in ml and "subscription spread" not in dl:
        issues.append(Issue("D5", 3, "masterplan.md defines 'subscription spread' but operating-model.md doesn't use this term", "Revenue Model"))
        score -= 1.5

    # Revenue streams must align
    mp_streams = ["subscription spread", "bundle expansion", "tier upgrade", "add-on"]
    for stream in mp_streams:
        if stream in ml and stream not in dl:
            issues.append(Issue("D5", 2, f"Revenue stream '{stream}' in masterplan.md not reflected in operating-model.md", "Revenue Streams"))
            score -= 0.4

    # --- Flywheels ---
    if "flywheel" in ml and "flywheel" not in dl:
        issues.append(Issue("D5", 2, "masterplan.md describes flywheel mechanics but operating-model.md doesn't reference flywheel dynamics", "Flywheel"))
        score -= 0.6

    # --- KPIs — global-system-architecture.md Section 10 ---
    arch_kpis = [
        "attach rate", "on-time", "photo compliance", "provider utilization",
        "density", "churn", "gross margin", "support minutes"
    ]
    doc_kpi_count = sum(1 for kpi in arch_kpis if kpi in dl)
    if doc_kpi_count < 2:
        issues.append(Issue("D5", 2, f"Operating-model.md references only {doc_kpi_count} of {len(arch_kpis)} canonical KPIs from global-system-architecture §10", "KPIs"))
        score -= 0.8

    # --- Schema references ---
    # operating-model.md should reference admin controls; arch has zone_ops_configs, plans, subscriptions
    arch_tables = ["zone_ops_configs", "provider_earnings", "billing_runs", "plans", "subscriptions"]
    if arch:
        referenced_tables = sum(1 for t in arch_tables if t in dl)
        if referenced_tables == 0:
            issues.append(Issue("D5", 1, "Operating-model.md doesn't reference any schema table names from global-system-architecture §6 (zone_ops_configs, plans, provider_earnings, etc.)", "Schema Alignment"))
            score -= 0.4

    # --- State machine enums ---
    # Provider states: PENDING, ACTIVE, PROBATION, SUSPENDED
    arch_enums = ["probation", "suspended", "assigned", "completed"]
    if arch:
        referenced_enums = sum(1 for e in arch_enums if e in dl)
        if referenced_enums == 0:
            issues.append(Issue("D5", 1, "Operating-model.md doesn't use any canonical state enum values (PROBATION, SUSPENDED, etc.) from global-system-architecture §5", "State Machines"))
            score -= 0.3

    # --- Rules engine boundary ---
    # Arch defines rules engine owns: payout threshold, earning eligibility, invoice amounts
    # Operating model should not claim UI computes these
    if re.search(r"(ui|client|front.end|app).*(calculat|comput|determin).*(payout|price|margin|earning)", dl, re.IGNORECASE):
        issues.append(Issue("D5", 3, "Operating-model.md implies UI computes pricing/payout, violating rules-engine boundary in global-system-architecture §7", "Rules Engine Boundary"))
        score -= 1.5

    # --- BYOC / BYOP consistency ---
    # Both docs should describe BYOC as provider brings customers
    byoc_mp = "provider" in ml[ml.find("byoc"):ml.find("byoc")+200] if "byoc" in ml else False
    byoc_op = "provider" in dl[dl.find("byoc"):dl.find("byoc")+200] if "byoc" in dl else False
    if "byoc" in ml and "byoc" not in dl:
        issues.append(Issue("D5", 2, "BYOC defined in masterplan.md but not discussed in operating-model.md", "BYOC"))
        score -= 0.7

    # --- Density numbers alignment ---
    # Both docs mention 15-25 and 50+ for density phases
    if "15" in ml and "25" in ml:
        if not re.search(r"15[–\-]25", doc):
            issues.append(Issue("D5", 1, "Density thresholds in masterplan.md use '15–25' range but operating-model.md doesn't match", "Density Thresholds"))
            score -= 0.3

    return max(0.0, round(score, 2))

# ---------------------------------------------------------------------------
# D6 — Actionability  (weight 1.0)
# ---------------------------------------------------------------------------

def score_d6(doc: str, issues: list[Issue]) -> float:
    score = 10.0
    dl = doc.lower()

    # --- Admin controls specificity ---
    admin_controls = [
        ("customer price multipliers", r"customer price multiplier|price multiplier"),
        ("provider payout rates by SKU/zone", r"sku.*zone|zone.*sku|payout.*sku|sku.*payout"),
        ("capacity caps", r"capacity cap|cap.*prevent|oversell"),
        ("service day patterns", r"service day pattern|service day"),
    ]
    for label, pattern in admin_controls:
        if not re.search(pattern, dl, re.IGNORECASE):
            issues.append(Issue("D6", 2, f"Admin control not specified with enough detail to implement: {label}", "Zone & Density Mechanics"))
            score -= 0.6

    # --- Decision criteria specificity ---
    good_criteria = [
        ("kill loss leaders", r"(kill|remove|discontinue|drop|exit).*loss.*leader|loss.*leader.*(kill|remove|review|evaluat)"),
        ("exception expiration", r"(expir|time.bound|volume.bound|not permanent)"),
        ("quarterly review cadence", r"(quarterly|90.day)"),
    ]
    for label, pattern in good_criteria:
        if not re.search(pattern, dl, re.IGNORECASE):
            issues.append(Issue("D6", 2, f"Decision criterion not specific enough to act on: '{label}'", "Key Pricing Principles"))
            score -= 0.5

    # --- Formulas implementable ---
    if "household contribution margin" in dl:
        if not re.search(r"(=|minus|subtract|formula|revenue.*minus.*payout|plan.*minus.*provider|total.*minus)", dl, re.IGNORECASE):
            issues.append(Issue("D6", 3, "Household contribution margin mentioned but formula is not implementable (missing: plan revenue − payout − ops − platform overhead)", "Revenue Engine"))
            score -= 1.0

    # --- Zone multiplier mechanics ---
    if not re.search(r"(multiplier|zone.*pric|pric.*zone|zone.*adjust)", dl, re.IGNORECASE):
        issues.append(Issue("D6", 2, "Zone pricing multiplier mechanism described but not specific enough to implement (missing: multiplier range, apply-to logic)", "Zone & Density Mechanics"))
        score -= 0.7

    # --- Review cadence specificity ---
    if re.search(r"(review periodically|periodically review|regularly review|review regularly)", dl, re.IGNORECASE):
        issues.append(Issue("D6", 2, "Vague review cadence 'periodically' should be 'quarterly' or specific timeframe", "Key Pricing Principles"))
        score -= 0.5

    # --- Exception documentation process ---
    if "exception" in dl:
        if not re.search(r"(reason code|reason_code|admin.*record|document.*exception|exception.*document)", dl, re.IGNORECASE):
            issues.append(Issue("D6", 2, "Pricing exceptions must be documented but no system/mechanism described (admin field, reason code, etc.)", "Pricing & Negotiation Policy"))
            score -= 0.6

    # --- Payout reviewed 'periodically' is vague ---
    if re.search(r"payout.*review.*periodically|periodically.*review.*payout", dl, re.IGNORECASE):
        issues.append(Issue("D6", 2, "Provider payout review cadence is 'periodically' — not implementable; should specify quarterly or semi-annual", "Provider Payout Logic"))
        score -= 0.5

    return max(0.0, round(score, 2))

# ---------------------------------------------------------------------------
# D7 — Risk Acknowledgment  (weight 0.9)
# ---------------------------------------------------------------------------

def score_d7(doc: str, masterplan: str, issues: list[Issue]) -> float:
    score = 10.0
    dl = doc.lower()

    risks = [
        ("provider undersupply / zone coverage gap",
         r"(under.supply|coverage gap|provider.*scarce|scarcity|supply.*insufficient|not enough provider|hard.to.fill)",
         2, 0.9),
        ("loss leader doesn't convert — risk acknowledged",
         r"(loss.*leader.*not.*convert|fail.*convert|loss.*leader.*risk|unprofitable.*stay|stay.*unprofitable)",
         2, 0.7),
        ("BYOC/BYOP thin margin risk — acknowledged",
         r"(thin margin.*risk|risk.*thin margin|byoc.*risk|byop.*risk|risk.*byoc|risk.*byop|entry.*risk|risk.*entry)",
         2, 0.7),
        ("provider churn risk",
         r"(provider.*churn|churn.*provider|provider.*leave|provider.*exit|provider.*attrition)",
         2, 0.8),
        ("density failure / zone can't reach threshold",
         r"(density.*fail|fail.*density|never.*reach.*threshold|zone.*stall|zone.*underperform)",
         3, 1.0),
        ("pricing exception abuse / exceptions normalized",
         r"(exception.*abuse|exception.*norm|exception.*permanent|permanent.*exception|exception.*standard)",
         2, 0.6),
        ("margin compression over time",
         r"(margin.*compress|compress.*margin|margin.*squeeze|squeeze.*margin|margin.*erode|erode.*margin)",
         2, 0.7),
        ("mitigation for each risk",
         r"(mitigat|prevent|guard|safeguard|address|avoid|limit|cap|monitor)",
         1, 0.4),
    ]

    for label, pattern, sev, deduct in risks:
        if not re.search(pattern, dl, re.IGNORECASE):
            issues.append(Issue("D7", sev, f"Risk not acknowledged: {label}", "Risk Acknowledgment"))
            score -= deduct

    # Check if masterplan risks are cross-referenced
    if masterplan:
        mp_risks = re.search(r"##\s*Risks.*?Mitigations\s*\n(.*?)(?=\n##|\Z)", masterplan, re.DOTALL | re.IGNORECASE)
        if mp_risks:
            if "risks" not in dl and "risk" not in dl:
                issues.append(Issue("D7", 2, "masterplan.md has a Risks & Mitigations section but operating-model.md has no risk acknowledgment", "Cross-Doc Risk"))
                score -= 0.8

    return max(0.0, round(score, 2))

# ---------------------------------------------------------------------------
# D8 — Flywheel Clarity  (weight 0.9)
# ---------------------------------------------------------------------------

def score_d8(doc: str, issues: list[Issue]) -> float:
    score = 10.0
    dl = doc.lower()

    # --- Flywheel present ---
    if "flywheel" not in dl:
        issues.append(Issue("D8", 2, "No flywheel section in operating-model.md — compounding margin dynamics not articulated as a cycle", "Flywheel"))
        score -= 2.0
        # Still check for flywheel-like language
        if not re.search(r"(density.*margin.*density|margin.*density|loop|cycle|compound|reinforce)", dl, re.IGNORECASE):
            issues.append(Issue("D8", 3, "No feedback loop / compounding mechanism described anywhere in document", "Revenue Engine"))
            score -= 1.5
        return max(0.0, round(score, 2))

    # --- Density flywheel ---
    density_fly = re.search(
        r"(provider.*economics.*flywheel|density.*flywheel|flywheel.*density|provider.*flywheel)",
        dl, re.IGNORECASE
    )
    if not density_fly:
        issues.append(Issue("D8", 2, "Density flywheel not labeled as a flywheel cycle — it appears as prose without explicit loop structure", "Provider Economics Flywheel"))
        score -= 0.7

    # --- Causal chain completeness ---
    flywheel_body = ""
    m = re.search(r"flywheel\s*\n(.*?)(?=\n##|\n###|\Z)", doc, re.DOTALL | re.IGNORECASE)
    if m:
        flywheel_body = m.group(1).lower()

    # Check causal chain has: density → cost → margin → pricing → customers → density
    causal_links = [
        ("density → cost reduction", r"density.*cost|cost.*density|stops.*drop|drop.*stops"),
        ("cost reduction → margin improvement", r"cost.*margin|margin.*cost|margin.*widen|spread.*widen"),
        ("margin improvement feeds back", r"(margin.*more|more.*margin|retention.*density|density.*retention)"),
    ]
    for label, pattern in causal_links:
        if not re.search(pattern, doc, re.IGNORECASE):
            issues.append(Issue("D8", 2, f"Flywheel causal link missing: {label}", "Provider Economics Flywheel"))
            score -= 0.5

    # --- Bundle expansion flywheel ---
    if not re.search(r"(bundle.*flywheel|attach.*flywheel|flywheel.*attach|flywheel.*bundle|expand.*flywheel)", dl, re.IGNORECASE):
        issues.append(Issue("D8", 2, "Bundle expansion flywheel not articulated as a named loop (should mirror density flywheel structure)", "Bundle Design"))
        score -= 0.8

    # --- Flywheel breakpoints ---
    if not re.search(r"(stall|break|breakpoint|fail.*flywheel|flywheel.*fail|if.*density.*not|does not.*reach|never.*reach)", dl, re.IGNORECASE):
        issues.append(Issue("D8", 2, "Flywheel breakpoints not identified — where does each flywheel stall if a link fails?", "Flywheel"))
        score -= 0.9

    # --- Step-by-step articulation ---
    flywheel_steps = re.findall(r"→|→\s|\d+\)\s+.*(?:density|margin|cost|route|provider|customer)", doc)
    if len(flywheel_steps) < 3:
        issues.append(Issue("D8", 1, "Flywheel loop described as prose rather than numbered steps with → connectors", "Flywheel"))
        score -= 0.4

    return max(0.0, round(score, 2))

# ---------------------------------------------------------------------------
# D9 — Measurement Framework  (weight 0.8)
# ---------------------------------------------------------------------------

def score_d9(doc: str, arch: str, issues: list[Issue]) -> float:
    score = 10.0
    dl = doc.lower()

    # --- KPIs defined for major claims ---
    major_claims_kpis = [
        ("household contribution margin KPI", r"(household.*margin.*kpi|kpi.*household.*margin|track.*household.*margin|measure.*household.*margin|contribution margin.*track)"),
        ("attach rate KPI / target", r"(attach rate|attach.*%|%.*attach|\d+.*attach|attach.*\d+)"),
        ("churn rate KPI / target", r"(churn.*%|%.*churn|churn.*rate|retention.*%|%.*retention|\d+.*churn)"),
        ("density KPI / threshold", r"(density.*kpi|kpi.*density|\d+.*stops|stops.*\d+|stop.*per|per.*stop)"),
        ("provider cost-per-stop KPI", r"(cost.per.stop|cost per stop|stop.*cost)"),
    ]
    for label, pattern in major_claims_kpis:
        if not re.search(pattern, dl, re.IGNORECASE):
            issues.append(Issue("D9", 2, f"No KPI/target defined for: {label}", "Measurement Framework"))
            score -= 0.7

    # --- Thresholds set (not just "track") ---
    threshold_patterns = [
        ("gross margin target", r"30.{0,3}40.{0,4}%|gross margins.{0,20}30|30.{0,5}40.{0,10}margin"),
        ("attach rate target", r"attach.*rate.*(target|goal|aim|should be|\d+%)"),
        ("density threshold", r"(\d+)[–\-](\d+)\s*(households|customers)/zone"),
    ]
    for label, pattern in threshold_patterns:
        if not re.search(pattern, doc, re.IGNORECASE):
            issues.append(Issue("D9", 2, f"Threshold not set (only 'track' language): {label}", "Measurement Framework"))
            score -= 0.5

    # --- Leading indicators ---
    leading_indicators = [
        "attach rate",  # leads to revenue
        "density",      # leads to margin
        "byoc",         # leads to CAC reduction
    ]
    for li in leading_indicators:
        if li not in dl:
            issues.append(Issue("D9", 1, f"Leading indicator '{li}' not present in document", "Measurement Framework"))
            score -= 0.3

    # --- Cross-reference with canonical KPIs from global-system-architecture §10 ---
    if arch:
        arch_kpis_canonical = [
            ("service day acceptance", r"service day.*accept|accept.*service day"),
            ("sku per cycle / attach rate", r"(sku.*cycle|attach rate|attach.*sku|sku.*attach)"),
            ("on-time %", r"on.time"),
            ("redo rate", r"redo rate"),
            ("photo compliance %", r"photo compliance"),
            ("provider utilization", r"provider.*utiliz|utiliz.*provider"),
            ("gross margin per zone", r"gross margin.*zone|zone.*gross margin"),
        ]
        kpi_matched = sum(
            1 for _, pattern in arch_kpis_canonical
            if re.search(pattern, dl, re.IGNORECASE)
        )
        if kpi_matched < 2:
            issues.append(Issue("D9", 2, f"Only {kpi_matched}/{len(arch_kpis_canonical)} canonical KPIs from global-system-architecture §10 referenced in operating-model.md", "Canonical KPIs"))
            score -= 0.8

    # --- Success definition ---
    if not re.search(r"(success.*look|what.*success|when.*succeed|success.*when|success.*defin)", dl, re.IGNORECASE):
        issues.append(Issue("D9", 1, "No explicit success definition for overall operating model (what does 'healthy' look like?)", "Measurement Framework"))
        score -= 0.4

    return max(0.0, round(score, 2))

# ---------------------------------------------------------------------------
# D10 — Document Structure  (weight 0.7)
# ---------------------------------------------------------------------------

def score_d10(doc: str, issues: list[Issue]) -> float:
    score = 10.0

    headers = count_headers(doc)
    tables  = count_tables(doc)
    lines   = doc.splitlines()
    total_lines = len(lines)

    # --- Minimum headers ---
    if headers < 8:
        issues.append(Issue("D10", 2, f"Only {headers} section headers — document needs more structure (expected 10+)", "Structure"))
        score -= 0.8
    elif headers < 5:
        issues.append(Issue("D10", 3, f"Only {headers} section headers — document is nearly unnavigable", "Structure"))
        score -= 2.0

    # --- Tables for structured data ---
    if tables < 5:
        issues.append(Issue("D10", 2, f"Only {tables} table rows found — structured data (tiers, thresholds, streams) should use tables", "Structure"))
        score -= 0.7

    # --- Summary / principles section ---
    if not re.search(r"##.*?(summary|principle|key.*principle|summary.*principle|principle.*summary)", doc, re.IGNORECASE):
        issues.append(Issue("D10", 1, "No summary/principles section at bottom of document for quick reference", "Structure"))
        score -= 0.3

    # --- Cross-references explicit ---
    if not re.search(r"(masterplan\.md|global-system-architecture\.md|`masterplan`|`global-system-architecture`)", doc, re.IGNORECASE):
        issues.append(Issue("D10", 2, "No explicit cross-references to masterplan.md or global-system-architecture.md", "Cross-References"))
        score -= 0.6

    # --- Repetition detection ---
    # Check for same substantial phrase (5+ words) repeated more than twice
    phrases = re.findall(r"(?:[A-Za-z]+\s){4}[A-Za-z]+", doc)
    phrase_counts: dict[str, int] = defaultdict(int)
    for p in phrases:
        phrase_counts[p.lower().strip()] += 1
    repeated = [(p, c) for p, c in phrase_counts.items() if c >= 3 and len(p) > 30]
    if len(repeated) > 3:
        issues.append(Issue("D10", 1, f"{len(repeated)} phrases repeated 3+ times — potential unnecessary repetition between sections", "Structure"))
        score -= 0.3

    # --- Section ordering ---
    expected_order = ["revenue", "bundle", "plan tier", "loss leader", "pricing", "byoc", "example", "zone", "provider payout", "key pricing"]
    positions = []
    for term in expected_order:
        m = re.search(term, doc, re.IGNORECASE)
        if m:
            positions.append((term, m.start()))
    if positions:
        out_of_order = sum(1 for i in range(1, len(positions)) if positions[i][1] < positions[i-1][1])
        if out_of_order >= 2:
            issues.append(Issue("D10", 1, f"{out_of_order} sections appear out of logical order (should flow: revenue → bundle → tiers → loss leader → pricing → BYOC → examples → zones → payout)", "Structure"))
            score -= 0.2

    # --- Related docs table ---
    if not re.search(r"##.*?(related|other doc|document.*relation|how.*relates)", doc, re.IGNORECASE):
        issues.append(Issue("D10", 1, "No 'How This Document Relates' section for navigation context", "Structure"))
        score -= 0.2

    return max(0.0, round(score, 2))

# ---------------------------------------------------------------------------
# Anti-gaming guards
# ---------------------------------------------------------------------------

def gaming_penalty(doc: str, issues: list[Issue]) -> float:
    penalty = 0.0
    dl = doc.lower()

    # --- Boilerplate / copy-paste risk/mitigation ---
    risk_sentences = re.findall(r"[Rr]isk[^.]{0,100}\.", doc)
    if len(risk_sentences) > 2:
        uniq_risk = set(s.strip().lower() for s in risk_sentences)
        if len(uniq_risk) < len(risk_sentences) * 0.7:
            issues.append(Issue("D10", 1, f"Boilerplate risk language: {len(risk_sentences) - len(uniq_risk)} duplicate risk sentences", "Anti-Gaming"))
            penalty += 0.5

    # --- Filler sentences (long sentences with low information density) ---
    long_sentences = [s for s in sentences(doc) if len(s.split()) > 40]
    if len(long_sentences) > 5:
        issues.append(Issue("D10", 1, f"{len(long_sentences)} sentences over 40 words — likely filler; trim to increase signal density", "Anti-Gaming"))
        penalty += min(1.0, len(long_sentences) * 0.1)

    # --- Contradictions introduced ---
    # Provider pricing abstraction: check for lines where provider 'sees' customer pricing WITHOUT 'never' negating it
    provider_violation = False
    for m_obj in re.finditer(r"providers?\s+see\s+customer pric", dl, re.IGNORECASE):
        start_ln = dl.rfind("\n", 0, m_obj.start()) + 1
        end_ln   = dl.find("\n", m_obj.end())
        line_txt = dl[start_ln:end_ln if end_ln != -1 else len(dl)]
        if "never" not in line_txt.lower():
            provider_violation = True
            break
    if provider_violation and re.search(r"providers.*never.*see.*customer|never.*see.*customer.*pric", dl, re.IGNORECASE):
        issues.append(Issue("D4", 3, "Contradiction detected: 'providers never see customer pricing' — document states both the rule and its violation", "Anti-Gaming"))
        penalty += 1.5
    # Exception permanence contradiction
    if re.search(r"exception.*permanent", dl, re.IGNORECASE) and re.search(r"exception.*time.bound|exception.*expir|exception.*limited", dl, re.IGNORECASE):
        issues.append(Issue("D4", 3, "Contradiction detected: 'exceptions are time-bound' — document states both rule and violation", "Anti-Gaming"))
        penalty += 1.5

    # --- Bloat penalty ---
    wc = word_count(doc)
    if wc > BASELINE_WORD_COUNT * 1.5:
        overage = (wc - BASELINE_WORD_COUNT * 1.5) / BASELINE_WORD_COUNT
        bloat_penalty = round(min(3.0, overage * 5), 2)
        issues.append(Issue("D10", 1, f"Document is {wc} words — {round((wc/BASELINE_WORD_COUNT-1)*100)}% above baseline without proportional substance improvement. Bloat penalty: {bloat_penalty}", "Anti-Gaming"))
        penalty += bloat_penalty

    # --- Repeated generic language ---
    generic_phrases = [
        "this is important",
        "this is critical",
        "it is worth noting",
        "it is important to note",
        "as mentioned above",
        "as discussed above",
        "it should be noted",
        "needless to say",
    ]
    generic_hits = sum(dl.count(p) for p in generic_phrases)
    if generic_hits >= 3:
        issues.append(Issue("D10", 1, f"{generic_hits} generic filler phrases detected — these add length without substance", "Anti-Gaming"))
        penalty += min(0.5, generic_hits * 0.1)

    return round(penalty, 2)

# ---------------------------------------------------------------------------
# Simplicity bonus
# ---------------------------------------------------------------------------

def simplicity_bonus(doc: str) -> float:
    wc = word_count(doc)
    if wc < BASELINE_WORD_COUNT * 0.9:
        return 1.0  # tighter than baseline — reward conciseness
    if wc <= BASELINE_WORD_COUNT * 1.05:
        return 0.5  # roughly same size — small reward
    return 0.0

# ---------------------------------------------------------------------------
# Weighted composite score
# ---------------------------------------------------------------------------

WEIGHTS = {
    "D1": 1.2,
    "D2": 1.1,
    "D3": 1.3,
    "D4": 1.1,
    "D5": 1.0,
    "D6": 1.0,
    "D7": 0.9,
    "D8": 0.9,
    "D9": 0.8,
    "D10": 0.7,
}

WEIGHT_SUM = sum(WEIGHTS.values())  # 10.0

def composite(scores: dict[str, float]) -> float:
    """Weighted average, normalized to 0–100."""
    raw = sum(scores[d] * WEIGHTS[d] for d in WEIGHTS)
    return round(raw / WEIGHT_SUM * 10, 2)  # *10 to scale 0-100

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run(doc_path: Path, masterplan_path: Optional[Path], arch_path: Optional[Path],
        verbose: bool = False) -> dict:

    doc       = load(doc_path)
    masterplan = load(masterplan_path)
    arch       = load(arch_path)

    if not doc:
        print(f"ERROR: Cannot read document at {doc_path}", file=sys.stderr)
        sys.exit(1)

    issues: list[Issue] = []

    d1  = score_d1(doc, issues)
    d2  = score_d2(doc, issues)
    d3  = score_d3(doc, issues)
    d4  = score_d4(doc, issues)
    d5  = score_d5(doc, masterplan, arch, issues)
    d6  = score_d6(doc, issues)
    d7  = score_d7(doc, masterplan, issues)
    d8  = score_d8(doc, issues)
    d9  = score_d9(doc, arch, issues)
    d10 = score_d10(doc, issues)

    scores = {"D1": d1, "D2": d2, "D3": d3, "D4": d4, "D5": d5,
              "D6": d6, "D7": d7, "D8": d8, "D9": d9, "D10": d10}

    gp  = gaming_penalty(doc, issues)
    sb  = simplicity_bonus(doc)

    base_score = composite(scores)
    total = round(max(0.0, min(100.0, base_score - gp + sb)), 2)

    total_friction = sum(i.severity for i in issues)
    issues_count   = len(issues)

    result = {
        "ops_score":       total,
        "max_possible":    100.00,
        "d1_completeness": d1,
        "d2_specificity":  d2,
        "d3_edge_cases":   d3,
        "d4_consistency":  d4,
        "d5_cross_doc":    d5,
        "d6_actionability":d6,
        "d7_risk":         d7,
        "d8_flywheel":     d8,
        "d9_measurement":  d9,
        "d10_structure":   d10,
        "gaming_penalty":  gp,
        "simplicity_bonus":sb,
        "total_friction":  total_friction,
        "issues_found":    issues_count,
        "issues":          issues,
    }
    return result


def print_results(result: dict, verbose: bool) -> None:
    print("---")
    print(f"ops_score:           {result['ops_score']:.2f}")
    print(f"max_possible:        {result['max_possible']:.2f}")
    print(f"d1_completeness:     {result['d1_completeness']:.2f}")
    print(f"d2_specificity:      {result['d2_specificity']:.2f}")
    print(f"d3_edge_cases:       {result['d3_edge_cases']:.2f}")
    print(f"d4_consistency:      {result['d4_consistency']:.2f}")
    print(f"d5_cross_doc:        {result['d5_cross_doc']:.2f}")
    print(f"d6_actionability:    {result['d6_actionability']:.2f}")
    print(f"d7_risk:             {result['d7_risk']:.2f}")
    print(f"d8_flywheel:         {result['d8_flywheel']:.2f}")
    print(f"d9_measurement:      {result['d9_measurement']:.2f}")
    print(f"d10_structure:       {result['d10_structure']:.2f}")
    print(f"gaming_penalty:      {result['gaming_penalty']:.2f}")
    print(f"simplicity_bonus:    {result['simplicity_bonus']:.2f}")
    print(f"total_friction:      {result['total_friction']}")
    print(f"issues_found:        {result['issues_found']}")
    print("---")

    if verbose:
        issues = result["issues"]
        by_sev: dict[int, list[Issue]] = defaultdict(list)
        by_dim: dict[str, list[Issue]] = defaultdict(list)
        for issue in issues:
            by_sev[issue.severity].append(issue)
            by_dim[issue.dimension].append(issue)

        print("\n=== ISSUES BY SEVERITY ===\n")
        for sev in sorted(by_sev.keys(), reverse=True):
            label = SEVERITY_LABEL[sev]
            group = by_sev[sev]
            print(f"── {label} (severity {sev}) — {len(group)} issues ──")
            for i in group:
                print(f"  [{i.dimension}] {i.description}")
                if i.evidence:
                    print(f"        ↳ {i.evidence}")
            print()

        print("\n=== ISSUES BY DIMENSION ===\n")
        dim_order = ["D1","D2","D3","D4","D5","D6","D7","D8","D9","D10"]
        dim_labels = {
            "D1": "Definitional Completeness",
            "D2": "Numeric Specificity",
            "D3": "Edge Case Coverage",
            "D4": "Internal Consistency",
            "D5": "Cross-Doc Alignment",
            "D6": "Actionability",
            "D7": "Risk Acknowledgment",
            "D8": "Flywheel Clarity",
            "D9": "Measurement Framework",
            "D10": "Document Structure",
        }
        for dim in dim_order:
            group = by_dim.get(dim, [])
            score_key = f"d{dim[1:]}_" + {
                "D1": "completeness", "D2": "specificity", "D3": "edge_cases",
                "D4": "consistency", "D5": "cross_doc", "D6": "actionability",
                "D7": "risk", "D8": "flywheel", "D9": "measurement", "D10": "structure",
            }[dim]
            dim_score = result.get(score_key, "?")
            print(f"── {dim}: {dim_labels[dim]} — score {dim_score}/10, {len(group)} issues (weight {WEIGHTS[dim]}) ──")
            for i in sorted(group, key=lambda x: -x.severity):
                sev_str = SEVERITY_LABEL[i.severity]
                print(f"  [{sev_str}] {i.description}")
                if i.evidence:
                    print(f"             ↳ {i.evidence}")
            print()

        # Summary bar chart
        print("\n=== SCORE BREAKDOWN ===\n")
        dim_order_short = [
            ("D1 Completeness", result["d1_completeness"]),
            ("D2 Specificity ", result["d2_specificity"]),
            ("D3 Edge Cases  ", result["d3_edge_cases"]),
            ("D4 Consistency ", result["d4_consistency"]),
            ("D5 Cross-Doc   ", result["d5_cross_doc"]),
            ("D6 Actionabilty", result["d6_actionability"]),
            ("D7 Risk        ", result["d7_risk"]),
            ("D8 Flywheel    ", result["d8_flywheel"]),
            ("D9 Measurement ", result["d9_measurement"]),
            ("D10 Structure  ", result["d10_structure"]),
        ]
        for label, s in dim_order_short:
            bar_len = int(round(s))
            bar = "█" * bar_len + "░" * (10 - bar_len)
            print(f"  {label}  {bar}  {s:.1f}/10")
        print()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Score docs/operating-model.md against 10 business-quality dimensions."
    )
    parser.add_argument(
        "doc",
        nargs="?",
        default=str(DEFAULT_DOC) if DEFAULT_DOC else "docs/operating-model.md",
        help="Path to operating-model.md (default: auto-detected sibling)",
    )
    parser.add_argument(
        "--masterplan",
        default=str(DEFAULT_MASTERPLAN) if DEFAULT_MASTERPLAN else "masterplan.md",
        help="Path to masterplan.md (default: auto-detected sibling)",
    )
    parser.add_argument(
        "--arch",
        default=str(DEFAULT_ARCH) if DEFAULT_ARCH else "global-system-architecture.md",
        help="Path to global-system-architecture.md (default: auto-detected sibling)",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show all issues grouped by severity and dimension",
    )
    args = parser.parse_args()

    doc_path        = Path(args.doc)
    masterplan_path = Path(args.masterplan)
    arch_path       = Path(args.arch)

    result = run(doc_path, masterplan_path, arch_path, verbose=args.verbose)
    print_results(result, verbose=args.verbose)


if __name__ == "__main__":
    main()
