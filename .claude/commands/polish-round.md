Audit and fix all features in the current round. This is the batch command that replaces calling /polish-feature individually.

Usage: /polish-round

## Execution

You MUST execute these steps automatically — do not ask the user.

### Step 1: Read the current round from the plan

Read `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` and `docs/working/plan.md` to determine:
- Which round number we're on
- Which features are in scope (feature numbers + descriptions)
- Read the feature descriptions from `docs/feature-list.md`

### Step 2: Batch the features into parallel audit groups

Group features into batches of 5-7 based on domain similarity:
- UI page features together
- Hook/data features together
- Backend/edge function features together
- Admin features together

### Step 3: Launch parallel audit agents (one per group)

For each group, launch a single Agent (model: sonnet) that audits ALL features in the group. The agent prompt must:
- List every feature number + description in the group
- Instruct the agent to find files (Glob/Grep), read them fully, and run the 10-point checklist on each
- Include the full known-patterns list from `/polish-feature` to reduce false positives
- Return a structured report per feature with Score and PASS/FAIL items

Launch ALL groups in parallel (background agents). This is the key efficiency gain — one message spawns all audits.

### Step 4: Process results as agents complete

As each agent completes:
1. Read the report
2. Evaluate each FAIL item — dismiss false positives, identify real fixes
3. Fix all MUST-FIX and actionable SHOULD-FIX items
4. Batch related fixes into single commits (e.g., all dark-mode fixes in one commit)

### Step 5: Commit, push, update docs

After all groups are processed:
1. Run `npx tsc --noEmit` to verify no type errors
2. Commit and push any remaining changes
3. Update `docs/feature-list.md` with new scores
4. Update `docs/working/plan.md` with round completion + session handoff
5. Report summary: features audited, issues fixed, features still below 9/10

### Efficiency targets
- 10-feature round: 2-3 parallel agents, ~10 minutes total
- 25-feature round: 4-5 parallel agents, ~15 minutes total
- Fix commits should be batched by theme (dark-mode, error states, touch targets) not per-feature
