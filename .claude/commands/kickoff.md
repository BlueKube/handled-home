---
description: Kickoff a new batch or phase — reads the roadmap, identifies what's next, and writes the spec
disable-model-invocation: false
---
Kickoff a new batch or phase of work.

Follow these steps precisely:

## Step 1: Read project context
Read the following files to understand the current state:
- `CLAUDE.md` — project instructions, completion status, current mission
- `docs/skills/redesign-workflow-guide.md` — batch execution workflow

## Step 2: Re-anchor to the roadmap
- Identify what work is already complete (check the "What's Already Complete" section in CLAUDE.md)
- Identify what remains to be done
- State which batch or phase comes next and why
- If the user provided a specific task or area, map it to the roadmap

## Step 3: Define the batch scope
- Keep the batch small: 1 theme across 1-3 screens or 1 narrow cross-cutting change
- Identify the exact files that will be touched
- List non-goals to prevent scope creep

## Step 4: Write the spec
Create a markdown spec (output to the user, not a file unless asked) with these sections:
- **Title**: Batch name
- **Why it matters**: User-facing value
- **Epic mapping**: Which epic(s) this advances
- **Current state diagnosis**: What's wrong or missing today
- **Scope**: Exact changes to make
- **Non-goals**: What we're explicitly NOT doing
- **File targets**: Specific files to create or modify
- **Acceptance criteria**: Checkable conditions for "done"
- **Regression risks**: What could break
- **Visual validation checklist**: What to verify in screenshots

## Step 5: Confirm with the user
Present the spec and ask for approval before any implementation begins.

## Reminders
- Do not start coding before the spec is approved
- Follow the full workflow in `docs/skills/redesign-workflow-guide.md`
- After implementation, run `/code-review` (no PR required) to review committed changes
- After code review, run `npx tsc --noEmit` and `npm run build` to validate the build
