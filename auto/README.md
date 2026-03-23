# autoresearch-ux — Autonomous UX Optimization for Handled Home

Adapted from [Karpathy's autoresearch](https://github.com/karpathy/autoresearch) pattern.
Instead of optimizing `val_bpb` on a neural network, this optimizes `ux_score` on your screen-flows specification.

Scored against **Nielsen's 10 Usability Heuristics** (industry gold standard), with **PURE-style severity weighting**, **cognitive walkthrough** checks, **anti-gaming guards**, and an optional **LLM-as-judge** layer.

## How It Works

```
┌─────────────────────────────────────────────────┐
│  The Karpathy Loop (adapted for UX)             │
│                                                 │
│  1. Agent reads screen-flows.md                 │
│  2. Agent forms hypothesis (e.g., "add error    │
│     recovery states to billing screens")        │
│  3. Agent edits screen-flows.md                 │
│  4. Agent runs evaluate-ux.py → gets score      │
│  5. Score improved? → git commit (keep)         │
│     Score same/worse? → git reset (discard)     │
│  6. GOTO 1                                      │
│                                                 │
│  ~60-100 experiments/hour                       │
│  ~500+ experiments overnight                    │
└─────────────────────────────────────────────────┘
```

## The Three Files

| File | Analogous to | Role | Who edits |
|------|-------------|------|-----------|
| `docs/screen-flows.md` | `train.py` | The UX spec — mutated by the agent | Agent |
| `auto/evaluate-ux.py` | `prepare.py` | The scoring harness — frozen | Nobody (read-only) |
| `auto/ux-program.md` | `program.md` | Agent instructions — how to behave | Human |

## Baseline Score

```
ux_score:            45.77 / 100.00
screens_analyzed:    117
issues_found:        310 (16 critical, 205 friction, 89 cosmetic)
total_friction:      478

Nielsen's 10 Heuristics:
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

Cognitive Walkthrough:
  CW Learnability      █████░░░░░  5.7/10
```

Biggest opportunities: H9 Error Recovery, H3 User Control, H1 Visibility, H5 Error Prevention, H10 Help.

## Setup (5 minutes)

### Prerequisites
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed
- Git access to `BlueKube/home-handled`
- Python 3.10+

### Step 1: Copy files into the repo

```bash
# From the repo root
mkdir -p auto
cp autoresearch-ux/evaluate-ux.py auto/evaluate-ux.py
cp autoresearch-ux/ux-program.md auto/ux-program.md
```

### Step 2: Verify the harness runs

```bash
python auto/evaluate-ux.py docs/screen-flows.md --verbose
```

You should see the baseline score (~57.87).

### Step 3: Start Claude Code

```bash
claude
```

### Step 4: Give Claude Code the kickoff prompt

Copy-paste this into Claude Code:

```
Read auto/ux-program.md — that's your operating instructions for this session.

Then read these reference files for context:
- docs/screen-flows.md (the file you'll be editing)
- docs/design-guidelines.md (read-only reference)
- docs/masterplan.md (read-only reference)

Let's do the setup: create a new branch autoresearch-ux/mar23, run the baseline evaluation, initialize results.tsv, and then kick off the experiment loop.

Target: maximize ux_score. Start with the lowest-scoring dimensions (empty states, completeness, structure). Run experiments indefinitely — I'll check back in the morning.
```

### Step 5: Walk away

Claude Code will:
1. Create the branch
2. Run the baseline
3. Start the experiment loop
4. Run 60-100+ experiments per hour
5. Keep improvements, discard failures
6. Log everything to `auto/results.tsv`

Check back in the morning. Review the results:

```bash
# See how many experiments ran
wc -l auto/results.tsv

# See the score progression
cat auto/results.tsv

# See the current score
python auto/evaluate-ux.py docs/screen-flows.md

# See the git log of kept improvements
git log --oneline autoresearch-ux/mar23
```

## 5-Layer Scoring Architecture

### Layer 1: Nielsen's 10 Usability Heuristics (60% of score)

| # | Heuristic | What It Checks | Weight |
|---|-----------|----------------|--------|
| H1 | Visibility of system status | Loading states, progress bars, status badges, feedback | 1.2× |
| H2 | Match system & real world | Brand voice, user language (not jargon) | 1.0× |
| H3 | User control & freedom | Back buttons, cancel/dismiss, undo | 1.0× |
| H4 | Consistency & standards | Design tokens, button specs with variant/size | 0.8× |
| H5 | Error prevention | Input validation, confirmation, guard screens | 1.1× |
| H6 | Recognition > recall | Clear CTAs with action verbs, visible labels | 1.2× |
| H7 | Flexibility & efficiency | Skip options, shortcuts | 0.7× |
| H8 | Aesthetic & minimalist | 3-12 sections per screen | 0.9× |
| H9 | Error recovery | Error states with plain language + fix | 1.0× |
| H10 | Help & documentation | Empty states, explainers, tooltips | 1.1× |

### Layer 2: PURE Severity Weighting
Every issue scored 1 (cosmetic) to 3 (blocks task). High total friction lowers the composite.

### Layer 3: Cognitive Walkthrough (20% of score)
For 6 key flows, checks: "Will the user know what to do?" and "Will the user know it worked?"

### Layer 4: Anti-Gaming Guards
Detects and penalizes: duplicate copy, boilerplate, misplaced trust signals, copy reuse, bloat.
Rewards: concise, clean specs.

### Layer 5: LLM-as-Judge (10%, optional)
Samples screens and scores brand tone, specificity, actionability via `--llm-judge` flag.

## Customizing

### Change what "better" means
Edit `auto/ux-program.md` to change the agent's focus, priorities, or constraints.

### Change how scoring works
Edit `auto/evaluate-ux.py` to adjust weights, add new dimensions, or change thresholds. BUT — only do this between runs, never while the agent is looping.

### Focus on specific flows
Add a line to `auto/ux-program.md` like:
```
Focus this run on Flows 17-24 (Provider screens only). Skip admin screens.
```

### Enable LLM-as-judge
Add `--llm-judge` flag when running. Implement the API call in `llm_judge_score()` — the rubric and sampling logic are already built. Runs every 5-10 experiments to spot-check subjective copy quality.

## Results

After an overnight run, you'll have:
- A branch (`autoresearch-ux/mar23`) with N kept commits, each a proven improvement
- A `results.tsv` log of every experiment (kept and discarded)
- A measurably better `screen-flows.md`

Review the diff, cherry-pick what you want, and merge to main.
