Create a new batch spec file for the next batch in the current round.

1. Read `docs/working/plan.md` to find the next incomplete batch (⬜ status)
2. Create a batch spec file at `docs/working/batch-specs/b<N>-<kebab-title>.md` with this template:

```markdown
# Batch <N>: <Title>

## Phase
<Current phase from plan.md>

## Review: Quality

## Size: <S/M/L/Micro>

## What
<Brief description of what this batch does>

## Requirements
<Numbered list of specific requirements>

## Acceptance Criteria
- [ ] <Criterion 1>
- [ ] <Criterion 2>

## Files Changed
- `<file path>` (<new/edit>)
```

3. Report the batch spec path and ask if the spec looks correct before proceeding
