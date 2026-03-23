# autoresearch-ux — Handled Home Screen Flows Optimization

Autonomous UX spec optimization using [Karpathy's autoresearch](https://github.com/karpathy/autoresearch) pattern, scored against Nielsen's 10 Usability Heuristics with PURE severity weighting, cognitive walkthrough checks, and anti-gaming guards.

## Setup

To set up a new experiment, work with the user to:

1. **Agree on a run tag**: propose a tag based on today's date (e.g. `mar23`). The branch `autoresearch-ux/<tag>` must not already exist — this is a fresh run.
2. **Create the branch**: `git checkout -b autoresearch-ux/<tag>` from current master.
3. **Read the reference files**: Read these files for full context:
   - `docs/screen-flows.md` — **the file you modify.** All screen specs, layouts, copy, states, components.
   - `docs/design-guidelines.md` — frozen reference. Design system. DO NOT MODIFY.
   - `docs/masterplan.md` — frozen reference. Product strategy. DO NOT MODIFY.
   - `auto/evaluate-ux.py` — frozen evaluation harness. DO NOT MODIFY.
4. **Run the baseline**: `python auto/evaluate-ux.py docs/screen-flows.md --verbose` and record the score.
5. **Initialize results.tsv**: Create `auto/results.tsv` with the header row.
6. **Confirm and go**: Confirm setup looks good, then kick off experimentation.

## The Three Files

| File | Role | Mutable? |
|------|------|----------|
| `docs/screen-flows.md` | The UX spec — the only file you edit | YES |
| `auto/evaluate-ux.py` | The 5-layer scoring harness | NO |
| `auto/ux-program.md` | This file — your operating instructions | NO (human-edited) |

## What You CAN Do

Modify `docs/screen-flows.md`. Everything is fair game:
- **Copy**: Headlines, body text, CTAs, error messages, empty states, captions
- **Section ordering**: Reorder for better information hierarchy
- **Empty states**: Add with icon + title + body + CTA (must be unique per screen)
- **Loading states**: Add skeleton/spinner definitions
- **Error states**: Add with plain language + recovery actions
- **CTAs**: Strengthen with specific action verbs
- **Trust signals**: Add to conversion/onboarding screens (NOT everywhere)
- **Back buttons / cancel / dismiss**: Add user control exits
- **Progress indicators**: Add to multi-step flows
- **Skip options**: Add to onboarding steps
- **Validation rules**: Add to form screens
- **Explainer components**: Add to complex screens
- **New screens**: Add for undocumented flows
- **Screen structure**: Add Route, Who, Purpose, Layout where missing

## What You CANNOT Do

- Modify `auto/evaluate-ux.py`, `docs/design-guidelines.md`, or `docs/masterplan.md`
- Change the fundamental product (subscriptions, handles model, BYOC)
- Violate brand voice: calm, competent, kind, never blaming. "Your home, handled."
- Add hype-heavy, FOMO, or aggressive copy
- Remove existing screens or flows
- Break navigation structure
- **Use boilerplate**: every empty state, error state, and CTA must be specific to the screen's context. Do NOT copy-paste generic text across screens.

## The Goal

**Maximize `ux_score` as reported by `evaluate-ux.py`.**

The harness has 5 scoring layers:

### Layer 1: Nielsen's 10 Usability Heuristics (60% of score)

| # | Heuristic | What It Checks | Weight |
|---|-----------|----------------|--------|
| H1 | Visibility of system status | Loading states, progress bars, status badges, feedback | 1.2× |
| H2 | Match system & real world | Brand voice, user language (not jargon) | 1.0× |
| H3 | User control & freedom | Back buttons, cancel/dismiss, undo | 1.0× |
| H4 | Consistency & standards | Design tokens (not raw hex), button specs with variant/size | 0.8× |
| H5 | Error prevention | Input validation, confirmation dialogs, guard screens | 1.1× |
| H6 | Recognition > recall | Clear primary CTAs with action verbs, visible labels | 1.2× |
| H7 | Flexibility & efficiency | Skip options in onboarding, shortcuts | 0.7× |
| H8 | Aesthetic & minimalist design | 3-12 sections per screen (not sparse, not overloaded) | 0.9× |
| H9 | Error recovery | Error states defined with plain language + recovery action | 1.0× |
| H10 | Help & documentation | Empty states (icon+title+body+CTA), explainers, tooltips | 1.1× |

### Layer 2: PURE Severity Weighting

Every issue has a severity:
- **3 (Critical)**: Blocks the task or causes user failure
- **2 (Friction)**: User can proceed but with confusion or difficulty
- **1 (Cosmetic)**: Polish issue, user barely notices

High total friction lowers the composite score even if individual heuristics look OK.

### Layer 3: Cognitive Walkthrough (20% of score)

For 6 key task flows, checks at each step:
- **Q1**: Will the user know what to do? (CTA visible, action clear)
- **Q2**: Will the user know it worked? (Feedback defined: success, progress, confirmation)

Key flows evaluated:
1. Customer onboarding (Flow 1 + 5)
2. BYOC activation (Flow 2 + 6)
3. Browse and subscribe (Flow 8)
4. Routine management (Flow 9)
5. Provider job execution (Flow 19)
6. Provider onboarding (Flow 17)

### Layer 4: Anti-Gaming Guards

The harness detects and penalizes:
- **Duplicate copy**: Same empty state text on 3+ screens → penalty
- **Boilerplate**: Generic "No data yet" / "Nothing here" → penalty
- **Misplaced trust signals**: Trust keywords stuffed into non-conversion screens → penalty
- **Copy reuse**: Same copy string appearing 4+ times → penalty
- **Bloat**: Average >40 lines/screen → penalty

It rewards:
- **Simplicity**: Clean, concise specs (12-25 lines/screen avg) → +1.0 bonus

### Layer 5: LLM-as-Judge (10% of score, optional)

When `--llm-judge` is passed, samples 5 screens and scores:
- Brand tone (1-5)
- Specificity (1-5)
- Actionability (1-5)

Run every 5-10 experiments to spot-check subjective quality.

## Baseline Score

```
ux_score:            45.77 / 100.00
screens_analyzed:    117
issues_found:        310
total_friction:      478

  H1 Visibility        ███░░░░░░░  3.0/10
  H2 Real World        █████░░░░░  5.9/10
  H3 User Control      ██░░░░░░░░  2.7/10
  H4 Consistency       ██████████ 10.0/10
  H5 Error Prevent     ███░░░░░░░  3.1/10
  H6 Recognition       █████░░░░░  5.1/10
  H7 Flexibility       ███░░░░░░░  3.5/10
  H8 Minimalist        ████████░░  8.9/10
  H9 Error Recover     █░░░░░░░░░  1.8/10
  H10 Help/Docs        ███░░░░░░░  3.3/10
  CW Learnability      █████░░░░░  5.7/10

  16 critical issues (severity 3)
  205 friction issues (severity 2)
  89 cosmetic issues (severity 1)
```

## Experimentation

### The Experiment Loop

LOOP FOREVER:

1. **Read the current state**: Check latest commit, review current `ux_score`.
2. **Identify the weakest dimension**: Focus on the heuristic with the lowest score.
3. **Form a hypothesis**: Decide on a specific change. Examples:
   - "Adding error states with recovery actions to Flows 11-16 should improve H9"
   - "Adding loading skeletons to provider screens should improve H1"
   - "Adding back buttons to primary tab pages should improve H3"
   - "Fleshing out provider onboarding steps 2-6 with CTAs should fix CW critical issues"
4. **Make the edit**: Modify `docs/screen-flows.md`.
5. **git commit**: Descriptive message.
6. **Run evaluation**: `python auto/evaluate-ux.py docs/screen-flows.md > auto/run.log 2>&1`
7. **Read results**: `grep "^ux_score:\|^h[0-9].*:\|^cw_score:\|^gaming_penalty:\|^total_friction:" auto/run.log`
8. **Log to results.tsv** (commit results.tsv with each kept experiment).
9. **Keep or discard**:
   - `ux_score` improved → keep the commit
   - `ux_score` equal or worse → `git reset --hard HEAD~1`
10. **Repeat**.

### Focus Strategy (priority order based on baseline)

1. **H9 Error Recovery (1.8/10)** — Most screens have zero error states. Add error states with plain language + clear recovery actions. Each must be unique to the screen.
2. **H3 User Control (2.7/10)** — 24 sub-pages missing back buttons. Add navigation back affordances. Add cancel/dismiss to action screens.
3. **H1 Visibility (3.0/10)** — 53 screens missing loading states. Add skeleton/spinner definitions. Add status badges for dynamic content.
4. **H5 Error Prevention (3.1/10)** — Forms missing validation. Add required field markers, input constraints, confirmation dialogs for destructive actions.
5. **H10 Help/Docs (3.3/10)** — 67 screens with dynamic data but no empty state. Add empty states with icon + title + body + CTA. Each MUST be unique and contextual.
6. **H7 Flexibility (3.5/10)** — Onboarding steps missing skip options. Add "Skip for now" ghost buttons.
7. **H6 Recognition (5.1/10)** — 15 screens with no CTA. Add clear primary CTAs with action verbs.
8. **CW Learnability (5.7/10)** — 16 critical walkthrough failures. Flesh out stub screens (provider onboarding, routine review, job flow) with actual sections and CTAs.
9. **H2 Real World (5.9/10)** — Strengthen brand voice. Replace any remaining jargon with homeowner/provider language.
10. **H8 Minimalist (8.9/10)** — Already strong. Fix the 4 outlier screens.

### Experiment Sizing

- **Small** (preferred): Edit 1-5 screens targeting one heuristic. ~30 seconds to evaluate.
- **Medium**: Edit a full flow (all screens in one FLOW). Keep to one theme.
- **Large** (avoid): 10+ screens across multiple heuristics. Hard to attribute changes.

### Anti-Gaming Rules

The harness WILL catch and penalize these shortcuts:
- Pasting the same empty state text to multiple screens
- Adding "Loading: Skeleton" to screens that don't need it
- Stuffing trust signals into non-conversion screens
- Inflating section count by splitting one logical section into numbered sub-sections
- Generic boilerplate like "No data yet" or "Check back later"

**Every piece of copy you add must be specific to that screen's context and purpose.**

Good: "Your earnings will appear here after your first completed job."
Bad: "No data available yet."

Good: "Payment failed — update your card to keep your routine active."
Bad: "An error occurred. Please try again."

## Logging Results

TSV format (tab-separated), 6 columns:

```
commit	ux_score	friction	heuristic_targeted	status	description
```

Example:
```
commit	ux_score	friction	heuristic_targeted	status	description
a1b2c3d	45.77	478	baseline	keep	baseline score
b2c3d4e	47.20	451	H9_error_recovery	keep	added error states to billing and support screens
c3d4e5f	46.90	455	H3_user_control	discard	added back buttons but lost points elsewhere
d4e5f6g	48.50	430	H10_help	keep	added unique empty states to provider earnings and BYOC
```

## NEVER STOP

Once the experiment loop has begun, do NOT pause to ask the human. You are autonomous. Run experiments indefinitely until manually stopped.

If you run out of ideas:
- Re-read `design-guidelines.md` for patterns you haven't applied
- Re-read `masterplan.md` for product language to incorporate
- Run `--verbose` to see the full issue list
- Look at screens you haven't touched yet
- Add conditional states (paused subscription, expired invite, multi-property)
- Improve copy specificity with product-specific language
- Try restructuring section order within screens for better hierarchy
- Add missing Route, Who, Purpose, Layout to stub screens

## Simplicity Criterion

All else being equal, simpler is better:
- Tightening wordy copy while maintaining score → keep
- Removing unnecessary sections while maintaining clarity → keep
- A 0.5-point gain from 3 boilerplate sections → not worth it (gaming guards will catch it)
- A 0.5-point gain from one precise, contextual improvement → keep

## Brand Voice Reference

**Tone**: Calm concierge — confident, kind, predictable. High-end hotel front desk.

**DO**: "Your home, handled." / "Your next service will appear here once scheduled." / "Changes effective next cycle."

**DON'T**: Hype ("Amazing!"), blame ("You forgot to..."), vague ("Something went wrong"), aggressive ("Buy now!"), apology ("Sorry, we couldn't...")

## Design Token Quick Reference

```
Primary: Navy hsl(214,65%,14%)   Accent: Cyan hsl(200,80%,50%)
Background: hsl(220,20%,97%)     Card: White hsl(0,0%,100%)
Success: Green hsl(142,72%,37%)  Warning: Amber hsl(38,92%,50%)
Destructive: Red hsl(0,72%,51%)  Muted: hsl(215,16%,47%)

H1:32px/700 H2:24px/700 H3:18px/650 Body:16px/450 Caption:13px/500
Button: h-11(44px) default, h-12(48px) lg, h-14(52px) xl
Card: rounded-2xl, shadow, p-4 | Input: h-12, rounded-xl
Touch: min 44×44px | Icons: Lucide React (PascalCase)
```

## Navigation Reference

Customer tabs: Home → Schedule → Routine → Activity → More
Provider tabs: Home → Jobs → Earn → Score → More
Admin: Sidebar (AdminShell)
