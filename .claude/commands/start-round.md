Start a new polish round. This is the entry point for each session.

## Execution

You MUST execute these steps automatically — do not just list them.

### Step 1: Read context (parallel)

Use the Read tool to read ALL of these files in parallel:

1. `docs/working/plan.md` — read Session Handoff section first (last 10 lines)
2. `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` — find the current/next round
3. `lessons-learned.md` — check for recent lessons

If `docs/working/plan.md` doesn't exist, this is a fresh round — skip to Step 3.

### Step 2: Set up branch

Based on Session Handoff:

```bash
# If resuming an existing round:
git fetch origin <branch-from-handoff>
git checkout <branch-from-handoff>
git pull origin <branch-from-handoff>

# If starting a new round:
# IMPORTANT: Chain off the PREVIOUS round's branch, not main
git checkout -b polish/round-<N>-<name>
```

Branch naming follows the chaining protocol from CLAUDE.md Section 8b.

### Step 3: Identify features for this round

Read the round's section from `FULL-IMPLEMENTATION-PLAN.md`. Extract the feature list with numbers and descriptions from `docs/feature-list.md`.

### Step 4: Create plan.md

Use the Write tool to create `docs/working/plan.md` with:

```markdown
# Round <N>: <Round Name>

> **Round:** <N> of 61
> **Branch:** `<branch-name>`
> **Phase:** Single phase — Features <range>
> **Execution mode:** Quality

---

## Batch Breakdown

| Batch | Title | Size | Files | Status | Context |
|-------|-------|------|-------|--------|---------|
| B1 | <title> | S/M | | ⬜ | |

---

## Session Handoff
- **Branch:** <branch-name>
- **Last completed:** None
- **Next up:** B1 — <title>
- **Context at exit:** N/A
- **Blockers:** None
- **Round progress:** Starting
```

### Step 5: Run the round

Use `/polish-round` to audit and fix all features in the round in parallel.

This is the preferred approach for efficiency. It:
- Groups features into 5-7 feature batches
- Launches parallel audit agents (one per batch)
- Processes results as agents complete
- Batches fix commits by theme

For individual feature debugging, `/polish-feature <num> "<desc>"` is still available.

### Step 6: After all features are audited and fixed

1. Update `docs/feature-list.md` with new scores
2. Update `docs/working/plan.md` — mark batches ✅, update Session Handoff
3. Check context with `/context` — if under 60%, continue to next round. If over 60%, push and exit.

### Context management

- Use `/context` after each round (not after each feature)
- The 200k context window is the effective limit, not the model's 1M capacity
- Exit at 60% of the 200k window (~120k tokens)
- Always push and update Session Handoff before exiting
