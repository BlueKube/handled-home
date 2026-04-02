Create a new batch spec file for the next batch in the current round.

## Execution

You MUST execute these steps automatically — do not ask the user.

### Step 1: Find the next batch

Read `docs/working/plan.md` and find the first batch with ⬜ status. Extract:
- Batch number
- Feature numbers and descriptions
- Batch size (S/M/L/Micro)

If no ⬜ batches remain, report "All batches complete" and stop.

### Step 2: Create the spec file

Use the Write tool to create `docs/working/batch-specs/b<N>-<kebab-title>.md`:

```markdown
# Batch <N>: <Title>

## Phase
<Current round/phase from plan.md>

## Review: Quality

## Size: <S/M/L/Micro>

## What
<1-2 sentence description of what this batch polishes>

## Features
<For each feature in this batch:>
- Feature <num>: <description>

## Requirements
<For polish batches, these are the checklist items that need to pass:>
1. All features pass the 10-point polish checklist
2. No tsc or build errors introduced
3. Components under 300 lines

## Acceptance Criteria
- [ ] Each feature scores 9/10 or 10/10 on polish audit
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
- [ ] All fixes committed and pushed

## Files Changed
<Leave blank — will be filled during implementation>
```

### Step 3: Report

Output:
```
## Batch spec created
- Path: docs/working/batch-specs/b<N>-<title>.md
- Features: <list>
- Size: <size>
```
