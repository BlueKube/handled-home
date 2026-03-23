---
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git blame:*), Bash(git show:*), Bash(gh pr diff:*), Bash(gh pr view:*), Bash(gh pr comment:*)
description: Code review changes — works on a PR number or the latest committed phase
---
Review code changes for bugs and CLAUDE.md compliance.

**Modes:**
- No argument: **Phase mode** — reviews `git diff main...HEAD`
- PR number argument: **PR mode** — reviews `gh pr diff <number>`

## Steps

### 1. Get the diff
- Phase mode: `git diff main...HEAD`. If empty, report "No changes to review" and stop.
- PR mode: `gh pr diff <number>`. Skip if closed/draft.

### 2. Find CLAUDE.md files
Use a Haiku agent to locate any CLAUDE.md files in the repo root and in directories whose files were modified.

### 3. Summarize changes
Use a Haiku agent to return a brief summary of the diff.

### 4. Parallel code review (5 Sonnet agents)
Launch 5 Sonnet agents in parallel. Each returns a list of issues with reasons:

a. **CLAUDE.md compliance** — Audit changes against CLAUDE.md rules.
b. **Bug scan** — Shallow scan for obvious bugs in the changed code. Focus on real bugs, not nitpicks.
c. **Historical context** — Read git blame/history of modified code to spot issues informed by past changes.
d. **Prior feedback** — Check previous PRs/commits that touched these files for recurring review comments.
e. **Code comment compliance** — Verify changes comply with guidance in code comments in modified files.

### 5. Confidence scoring
For each issue, launch a parallel Haiku agent to score confidence (0–100):

- **0**: False positive, doesn't hold up to scrutiny, or pre-existing issue.
- **25**: Might be real, might be false positive. Stylistic issues not called out in CLAUDE.md.
- **50**: Verified real issue but minor — a nitpick or rarely hit in practice. (SHOULD-FIX)
- **75**: Confirmed real issue that will be hit in practice, or directly called out in CLAUDE.md. (MUST-FIX)
- **100**: Definitely real, will happen frequently, evidence confirms it. (MUST-FIX)

For CLAUDE.md-flagged issues, the agent must verify the CLAUDE.md actually calls it out.

### 6. Filter and categorize
Drop issues scoring below 50. Categorize the rest:
- **MUST-FIX** (75+): Must be resolved before batch is done.
- **SHOULD-FIX** (50–74): Should be resolved in the same batch if straightforward.

### 7. Report results
- **Phase mode**: Output results directly to the conversation.
- **PR mode**: Comment on the PR via `gh pr comment`.

Format:
```
### Code review
Found N issues (X must-fix, Y should-fix):

**MUST-FIX:**
1. Description — reason (file:line reference)

**SHOULD-FIX:**
1. Description — reason (file:line reference)
```

Or if clean: "No issues found. Checked for bugs and CLAUDE.md compliance."

## False positives (skip these)
- Pre-existing issues not introduced by this diff
- Things a linter/typechecker/compiler would catch
- General code quality opinions not called out in CLAUDE.md
- Intentional functionality changes related to the broader change
- Issues on lines the user did not modify

## Notes
- Do not attempt to build or typecheck — that runs separately
- Make a todo list first
- Cite file paths and line numbers for each issue
