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
git checkout -b polish/round-<N>-<name>
```

Branch naming follows the chaining protocol from CLAUDE.md Section 8b.

### Step 3: Identify features for this round

Read the round's section from `FULL-IMPLEMENTATION-PLAN.md`. Extract the feature list with numbers and descriptions.

### Step 4: Create plan.md

Use the Write tool to create `docs/working/plan.md` with:

```markdown
# Round <N>: <Round Name>

## Features
1. Feature <num> — <description>
2. Feature <num> — <description>
...

## Batches

| Batch | Features | Size | Status | Context |
|-------|----------|------|--------|---------|
| B1 | <feat nums> | S/M | ⬜ | |
| B2 | <feat nums> | S/M | ⬜ | |
...

## Session Handoff
- **Branch:** polish/round-<N>-<name>
- **Last completed:** None
- **Next up:** B1 — <title>
- **Context at exit:** N/A
- **Blockers:** None
```

Group 2-3 related features per batch. Most polish batches are Small or Medium.

### Step 5: Create batch spec for B1

Create `docs/working/batch-specs/b1-<kebab-title>.md` with the standard template (see `/new-batch`).

### Step 6: Begin feature audits

For each feature in B1, run `/polish-feature <number> "<description>"`.

This spawns a sub-agent per feature that audits and returns a scored report. Fixes happen in main context based on the report.

### Step 7: After all B1 features are audited and fixed

1. Run `/commit-push` (which pre-validates with tsc + build)
2. Run `/review-batch` (which auto-gathers diff/spec and spawns review lanes)
3. Update the progress table in `plan.md`: B1 status → ✅, record context %
4. Check context with `/context` — if under 60%, continue to B2. If over 60%, update Session Handoff and exit.

### Ongoing: Repeat for each batch

Continue the loop: audit features → fix → commit-push → review-batch → update progress → check context.
