# autoresearch-ops — Handled Home Operating Model Optimization

Autonomous optimization of `docs/operating-model.md` using the [Karpathy autoresearch](https://github.com/karpathy/autoresearch) pattern. The agent edits the operating model in a loop, runs `evaluate-ops.py`, and keeps or discards changes based on whether `ops_score` improves.

Tone: **business strategy, not marketing.** Write like a sharp operator or CFO — precise, terse, numbers-first. Not a copywriter. Not an engineer. A person who has run P&Ls and knows what gaps kill a business.

---

## Setup

To begin a new experiment run, work with the user to:

1. **Agree on a run tag**: propose a tag based on today's date (e.g. `mar23`). The branch `autoresearch-ops/<tag>` must not already exist — this is a fresh run.
2. **Create the branch**: `git checkout -b autoresearch-ops/<tag>` from current master.
3. **Read the reference files** — full context before touching anything:
   - `docs/operating-model.md` — **the only file you modify.** Business strategy, pricing, payout, unit economics.
   - `masterplan.md` — frozen reference. Product strategy and vision. DO NOT MODIFY.
   - `global-system-architecture.md` — frozen reference. Canonical schema, enums, state machines, rules engine. DO NOT MODIFY.
   - `auto/evaluate-ops.py` — frozen evaluation harness. DO NOT MODIFY.
4. **Run the baseline**: `python auto/evaluate-ops.py docs/operating-model.md --masterplan docs/masterplan.md --arch docs/global-system-architecture.md --verbose > auto/run.log 2>&1` and record the score.
5. **Initialize results.tsv**: Create `auto/results.tsv` with the header row (see Logging section below).
6. **Confirm and go**: Confirm setup looks good, then kick off the experiment loop.

---

## The Three Files

| File | Role | Mutable? |
|------|------|----------|
| `docs/operating-model.md` | The operating model — the **only** file you edit | YES |
| `auto/evaluate-ops.py` | The 10-dimension scoring harness | NO |
| `auto/ops-program.md` | This file — your operating instructions | NO (human-edited only) |

Reference files (always frozen):

| File | Role |
|------|------|
| `docs/masterplan.md` | Strategy, vision, flywheels, risks — source of truth for business intent |
| `docs/global-system-architecture.md` | Canonical terms, schema, enums, state machines, KPIs, rules engine |

---

## What You CAN Do

Modify `docs/operating-model.md`. Additions and edits that improve score legitimately:

- **Add edge cases**: What happens when a customer downgrades mid-cycle? Cancels with a failed payment? When a provider is suspended? When a zone never reaches density threshold? Each scenario needs a concrete resolution, not a vague "handle appropriately."
- **Add numeric specificity**: Replace directional language with numbers. "Review periodically" → "Review quarterly." "Thin margins" → "Margins below 10%." Every claim should pass the "could you build a dashboard for this?" test.
- **Add formulas**: Make economic relationships explicit. Household contribution margin = plan revenue − blended provider payout − support/ops cost − payment/platform overhead. Provide the arithmetic.
- **Add risk acknowledgment**: Identify failure modes per strategy. Density flywheel can stall if zone never reaches 15 households — say so, and say what happens next.
- **Add measurement criteria**: For each major claim, add a KPI and a threshold. "Attach rate improves" → "Attach rate target: ≥2.0 SKUs/household by month 6." Use canonical KPI names from `global-system-architecture.md` §10.
- **Improve cross-doc alignment**: Use canonical glossary terms from `global-system-architecture.md` §4 (Household, Property, Zone, Service Day, Cycle, SKU, Job). Reference schema tables where relevant (`zone_ops_configs`, `provider_earnings`, `subscriptions`). Match state enum values (`PROBATION`, `SUSPENDED`, `ACTIVE`).
- **Tighten vague language**: Replace "some," "many," "meaningful," "significant," "often," and "periodically" with numbers or specific cadences wherever possible.
- **Add decision criteria**: Convert guidance like "review regularly" into "kill if no attach within 90 days" — decisions that can be implemented as rules.
- **Add flywheel structure**: If a feedback loop is described in prose, convert it to a numbered step-by-step cycle with → connectors and explicit breakpoints.
- **Add section cross-references**: Call out relationships between sections explicitly (e.g., "See Zone & Density Mechanics for threshold tables.").
- **Use tables**: Replace paragraph lists with tables for tiers, thresholds, streams, and scenarios.

---

## What You CANNOT Do

- Modify `auto/evaluate-ops.py`, `docs/masterplan.md`, or `docs/global-system-architecture.md`
- Change the fundamental business model (subscription spread, BYOC/BYOP, zone density, plan tiers)
- Contradict `masterplan.md` on revenue model, revenue streams, flywheel mechanics, or strategic positioning
- Rename canonical terms from `global-system-architecture.md` §4 glossary
- Invent schema table names not present in `global-system-architecture.md` §6
- Add speculative features or products not grounded in the existing documents
- Introduce marketing language, hype, or feature-announcement tone
- Expose per-handle or per-service economics to customers (the abstraction is a core invariant)
- Claim the UI computes pricing, payouts, or earnings (the rules engine owns this — see `global-system-architecture.md` §7)
- Make provider payouts visible to customers or customer pricing visible to providers
- Bloat the document: adding bulk without substance triggers the gaming penalty. Every paragraph must earn its place.

---

## The Goal

**Maximize `ops_score` as reported by `evaluate-ops.py`.**

The harness scores 10 dimensions, each 0–10. The weighted composite scales to 0–100.

### Scoring Dimensions

| # | Dimension | Weight | What It Checks |
|---|-----------|--------|----------------|
| D1 | Definitional Completeness | 1.2× | Every term has a formula/mechanism; every tier has positioning + differentiation; every strategy has definition + criteria + metrics + exit |
| D2 | Numeric Specificity | 1.1× | Thresholds in numbers, not directions; margin targets; timeframes; vague-word count |
| D3 | Edge Case Coverage | **1.3× (highest)** | Failure/exception scenarios per business mechanic: downgrade, cancel, failed payment, provider departure, zone gaps, BYOC churn, density stall |
| D4 | Internal Consistency | 1.1× | No contradictions between sections; payout description stable; margin claims aligned; exception rules enforced consistently |
| D5 | Cross-Doc Alignment | 1.0× | Canonical terms match `global-system-architecture.md` §4; revenue streams match `masterplan.md`; KPIs from §10; no rules-engine violations |
| D6 | Actionability | 1.0× | Admin controls specific enough to implement; decision criteria explicit; formulas implementable; cadences named |
| D7 | Risk Acknowledgment | 0.9× | Failure modes per strategy; mitigations proposed; cross-referenced with `masterplan.md` Risks & Mitigations |
| D8 | Flywheel Clarity | 0.9× | Each feedback loop as step-by-step cycle; causal links explicit; breakpoints identified |
| D9 | Measurement Framework | 0.8× | KPIs with targets (not just "track"); leading and lagging indicators; aligned with canonical KPIs from §10 |
| D10 | Document Structure | 0.7× | Section headers, tables, cross-references, no repetition, logical ordering |

### Anti-Gaming Guards

The harness detects and penalizes:
- **Boilerplate risk copy**: same risk/mitigation language pasted to multiple sections → penalty
- **Filler sentences**: sentences over 40 words that add length but not substance → penalty
- **Bloat**: document grows >50% from baseline (~3,500 words) without proportional score gains → scaled penalty up to 3.0 points
- **Contradictions**: adding text that contradicts existing invariants (e.g., violating abstraction rules) → critical penalty

The harness rewards:
- **Conciseness**: tighter document that maintains or improves score → +1.0 simplicity bonus
- **Precision**: replacing vague language with numbers → directly improves D2

### PURE Severity

Every detected issue is rated:
- **3 (Critical)**: Could cause a wrong business decision — e.g., contradictory pricing guidance, missing edge case that crashes an economic assumption
- **2 (Friction)**: Creates ambiguity for the reader — e.g., undefined term, vague timeframe, missing risk acknowledgment
- **1 (Cosmetic)**: Structural issue — e.g., missing table, poor formatting, wrong section order

Total friction is output separately. Driving down friction (especially severity-3 issues) improves score more than adding length.

---

## Baseline Score

```
---
ops_score:           80.58
max_possible:        100.00
d1_completeness:     8.50
d2_specificity:      9.51
d3_edge_cases:       1.80
d4_consistency:      10.00
d5_cross_doc:        9.10
d6_actionability:    9.50
d7_risk:             6.80
d8_flywheel:         9.20
d9_measurement:      8.40
d10_structure:       9.80
gaming_penalty:      1.00
simplicity_bonus:    1.00
total_friction:      55
issues_found:        30
---

  D1 Completeness  ████████░░  8.5/10
  D2 Specificity   █████████░  9.5/10
  D3 Edge Cases    ██░░░░░░░░  1.8/10   ← PRIMARY TARGET
  D4 Consistency   ██████████ 10.0/10
  D5 Cross-Doc     █████████░  9.1/10
  D6 Actionabilty  ██████████  9.5/10
  D7 Risk          ███████░░░  6.8/10   ← SECONDARY TARGET
  D8 Flywheel      █████████░  9.2/10
  D9 Measurement   ████████░░  8.4/10
  D10 Structure    ██████████  9.8/10

  4 critical issues (severity 3)
  17 friction issues (severity 2)
  9 cosmetic issues (severity 1)
```

---

## Experiment Loop

LOOP FOREVER:

1. **Read the current state**: Check latest commit, review current `ops_score` from `auto/results.tsv`.
2. **Identify the weakest dimension**: Focus on the dimension with the lowest score × weight product (D3 edge cases dominates at 1.3×).
3. **Form a hypothesis**: Decide on a specific, targeted change. Examples:
   - "Adding a customer downgrade/cancel edge case section should improve D3 by ~0.8"
   - "Adding a zone coverage gap failure mode to Zone & Density Mechanics should fix two D3 criticals"
   - "Adding an explicit Risk section to operating-model.md should improve D7 by ~1.5"
   - "Defining the bundle expansion flywheel as a named numbered loop should improve D8"
   - "Replacing 'periodically' with 'quarterly' in Provider Payout should improve D6"
4. **Make the edit**: Modify `docs/operating-model.md` only.
5. **git commit**: Descriptive message.
6. **Run evaluation**:
   ```
   python auto/evaluate-ops.py docs/operating-model.md \
     --masterplan docs/masterplan.md \
     --arch docs/global-system-architecture.md \
     > auto/run.log 2>&1
   ```
7. **Read results**:
   ```
   grep "^ops_score:\|^d[0-9].*:\|^gaming_penalty:\|^total_friction:\|^simplicity_bonus:" auto/run.log
   ```
8. **Log to results.tsv** (do NOT commit results.tsv — it is local state only).
9. **Keep or discard**:
   - `ops_score` improved → keep the commit
   - `ops_score` equal or worse → `git reset --hard HEAD~1`
10. **Repeat.**

---

## Focus Strategy

Priority order based on baseline weaknesses:

### 1. D3 Edge Case Coverage (1.8/10) — PRIMARY FOCUS

This is the lowest score and the highest-weight dimension. The document has almost no edge case coverage. Each item below is worth roughly 0.7–1.0 points:

**Gaps to address (in order of severity):**

1. **Provider leaves or exits the network** *(Critical)* — What happens to their assigned households? How is coverage maintained? What notice period, if any?
2. **Zone never reaches density threshold** *(Critical)* — At what point is a zone declared nonviable? What is the exit/wind-down protocol?
3. **Zone with too few providers (coverage gap)** *(Critical)* — When a zone has demand but insufficient supply, what triggers provider recruiting? Is there a waitlist mechanism?
4. **Customer downgrade mid-cycle** *(Friction)* — Does the downgrade take effect immediately or at cycle end? What happens to scheduled services for the current cycle?
5. **Customer cancel mid-cycle / refund policy** *(Friction)* — Is there a pro-rated refund? Cancel at cycle end? Grace period?
6. **Failed payment / dunning** *(Friction)* — How many retry attempts? What is the grace period before service suspension? When does account enter dunning state?
7. **Provider suspended (PROBATION / SUSPENDED state)** *(Friction)* — Who covers their scheduled jobs? How are affected households notified and rescheduled?
8. **Zone oversaturated / too many customers** *(Friction)* — How is the capacity cap enforced? Is there a waitlist? When does this trigger zone expansion?
9. **BYOC customer churns after migration** *(Friction)* — Does the provider retain any relationship? Is there a recovery flow?
10. **BYOP provider declines or becomes unavailable** *(Friction)* — Is the customer transitioned to the standard network? Over what timeframe?

**Format guidance**: Add a dedicated "Failure Modes & Edge Cases" subsection within each relevant section, or consolidate into a single "Operational Exception Handling" section. Use a table: | Scenario | Trigger | Resolution | Owner |. Be specific — each scenario needs a concrete answer, not "handled on a case-by-case basis."

### 2. D7 Risk Acknowledgment (6.8/10) — SECONDARY FOCUS

Four gaps:
- **Density failure**: Acknowledge explicitly that if a zone never reaches 15 households, the density flywheel never activates. State the failure mode and the response (zone closure, provider redeployment).
- **BYOC/BYOP thin margin risk**: Acknowledge that migrated households may never expand beyond the entry service, leaving the platform holding below-standard margin indefinitely. State the mitigation (attach nudges, 90-day review gate).
- **Margin compression over time**: Provider payouts reviewed quarterly could trend up (labor market pressure), compressing spread without proportional customer price increases. State the mitigation.
- **Cross-reference masterplan.md's Risks & Mitigations section**: The masterplan explicitly calls out marketplace entropy, spammy upsells, provider abuse of courtesy upgrades, and switching chaos. The operating model should acknowledge the financial/operational risk analogs.

### 3. D1 Definitional Completeness — three Loss Leader gaps

The Loss Leader Strategy section needs:
- **Qualifying criteria**: What precise conditions must a service meet to be designated a loss leader? (Not just examples — a set of testable criteria)
- **Success metrics**: What measurable outcomes confirm the loss leader is working? (e.g., attach rate ≥ 1 additional service within 60 days for ≥30% of the cohort)
- **Exit criteria**: Beyond "kill if no attach in 90 days" — what does "no attach" mean quantitatively? What is the minimum cohort size to evaluate?

### 4. D8 Flywheel Clarity — bundle expansion flywheel

The provider economics flywheel is present. The bundle expansion flywheel is not named and structured as a loop. Add it as a numbered step-by-step cycle mirroring the density flywheel structure, with explicit breakpoints.

### 5. D9 Measurement Framework — two missing thresholds

- **Churn rate**: State a target or acceptable threshold (e.g., "monthly churn target <2% per household cohort")
- **Attach rate**: State a target and timeline (e.g., "target ≥2.0 active SKUs/household by end of month 6")

---

## Experiment Sizing

- **Small** (preferred): One section, one gap type. ~5–15 lines added. Fastest feedback loop.
- **Medium**: One major gap (e.g., a complete edge-cases table for provider lifecycle). ~20–40 lines.
- **Large** (avoid): Multiple sections simultaneously. Hard to attribute score movement. Break into sequential small experiments.

When a large change is tempting, do it in parts: commit edge cases for customer lifecycle first, run the harness, then commit edge cases for provider lifecycle.

---

## Anti-Gaming Rules

The harness WILL catch and penalize these shortcuts:

- Pasting the same scenario template ("trigger: X, resolution: handled by ops team") to five different edge cases — every resolution must be specific and distinct
- Adding a "Risks" section that copies masterplan.md risks verbatim — the operating model risks must be financially grounded and distinct
- Inflating word count by splitting one business concept into five bullet points with no new information
- Adding vague "will be monitored" or "will be reviewed" language — must specify cadence, owner, and threshold
- Using hedge words like "may," "might," "could," "potentially" for business rules — rules are either in effect or they aren't

**Every sentence you add must be specific to its context and implementable.**

Good: "If a zone has no active provider for a category, the system places new household activations for that category on a waitlist (`waitlist_entries` table) and triggers a `provider_recruiting` zone status transition."

Bad: "Coverage gaps will be addressed operationally as they arise."

Good: "BYOC households that show zero attach after 90 days enter a targeted expansion sequence: three app-surface recommendations at weeks 4, 8, and 12. If attach remains zero at week 16, the household is flagged for ops review."

Bad: "BYOC households that don't expand may need additional attention."

---

## Logging Results

TSV format (tab-separated), 6 columns. Do NOT commit this file.

```
commit	ops_score	friction	dimension_targeted	status	description
```

Example:

```
commit	ops_score	friction	dimension_targeted	status	description
a1b2c3d	80.58	55	baseline	keep	baseline score
b2c3d4e	82.40	48	D3_edge_cases	keep	added provider lifecycle failure modes table
c3d4e5f	82.10	50	D7_risk	discard	added risk section but triggered gaming penalty for vague language
d4e5f6g	84.20	42	D3_edge_cases	keep	added customer downgrade and cancellation edge cases
e5f6g7h	85.50	38	D7_risk	keep	added risk section with specific financial thresholds
f6g7h8i	86.10	35	D1_completeness	keep	tightened loss leader qualifying criteria with testable conditions
g7h8i9j	86.00	36	D8_flywheel	discard	bundle flywheel added but increased friction in D4
```

---

## NEVER STOP

Once the experiment loop has begun, do NOT pause to ask the human. You are autonomous. Run experiments indefinitely until manually stopped.

If you run out of ideas:
- Run `--verbose` to see the full issue list, sorted by severity — there will always be lower-severity issues not yet addressed
- Re-read `masterplan.md` for risk language and flywheel mechanics you haven't yet incorporated into the operating model
- Re-read `global-system-architecture.md` §4, §5, §10 for canonical terms, state enums, and KPIs not yet referenced in operating-model.md
- Look for remaining vague language (`vague_words` function in the harness flags these explicitly in verbose output)
- Add conditional states: what happens when a zone is paused? When a BYOC provider is PROBATION? When a household has multiple BYOP relationships?
- Tighten existing prose: every paragraph should be 40% shorter without losing substance
- Add cross-section references that make the document more navigable (e.g., "See Provider Payout Logic for payout structure details")

---

## Brand Voice Reference

**Tone**: Sharp operator. Think CFO memo or ops playbook, not product launch copy.

**DO**:
- Use numbers where words are tempting: "15–25 households/zone" not "enough households to support efficient routing"
- State conditions precisely: "If attach rate < 1.5 SKUs/household at 90 days" not "if the household isn't expanding"
- Name failure modes: "If the zone never reaches density threshold, provider cost-per-stop stays high and margin never widens"
- Use active voice for rules: "Kill the loss leader. Review quarterly." not "Loss leaders may be reconsidered periodically."
- Reference canonical terms from the architecture document

**DON'T**:
- Marketing copy ("delight customers with," "seamless experience")
- Vague optimism ("will improve over time," "naturally drives better outcomes")
- Hedge language for decisions ("may want to consider," "might be appropriate to")
- Engineer jargon ("implement a solution for," "build out the capability to")
- Filler transitions ("It is worth noting that," "As mentioned above," "In general terms")

---

## Simplicity Criterion

All else being equal, tighter is better:

- Replacing a 60-word paragraph with a 3-row table that contains the same information → keep
- Removing a vague "this is important" sentence while maintaining the substantive point → keep
- A 1-point gain from adding 500 words of boilerplate risk language → not worth it (gaming guards will catch it)
- A 1-point gain from adding one specific edge-case table with four distinct rows → keep

The harness rewards documents that are below the baseline word count (~3,500 words) with a simplicity bonus. Every word should be load-bearing.
