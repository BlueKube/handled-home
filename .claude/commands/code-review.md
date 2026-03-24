---
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git blame:*), Bash(git show:*), Bash(gh pr diff:*), Bash(gh pr view:*), Bash(gh pr comment:*)
description: Code review changes — works on a PR number or the latest committed phase
---
Review code changes for bugs, spec completeness, and project compliance.

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

### 4. Parallel code review (5 lanes × 2 tiers = 10 agents)
Launch 10 agents in parallel: one Sonnet agent and one Haiku agent per lane. Each lane has a single review focus — agents within the same lane may find overlapping issues (that's intentional redundancy), but agents should not cross into another lane's focus.

The Sonnet agent in each lane does the deep analysis. The Haiku agent in each lane acts as a fast, independent second set of eyes on the same scope. Both return a list of issues with reasons.

**Lanes:**

a. **Spec completeness audit** — Cross-reference every requirement, acceptance criterion, and edge case in the batch spec (from `docs/working/batch-specs/`) against the diff. Flag anything specified but not implemented, partially implemented, or implemented differently than specified. This is the most important lane — it prevents incomplete work from shipping as "done."
b. **Bug scan** — Shallow scan for obvious bugs in the changed code only. No extra context, no git history, no nitpicks — just the diff.
c. **Historical context** — Read git blame/history of modified code to spot regressions or issues informed by past changes. Do not cross into the bug scan lane; focus on what the history reveals.
d. **Prior feedback** — Check previous PRs/commits that touched these files for recurring review comments that may apply here.
e. **Code comment compliance** — Verify changes comply with inline guidance (TODOs, FIXMEs, doc comments) and CLAUDE.md conventions in the modified files.

After all 10 agents return, merge and deduplicate findings across both tiers before proceeding to confidence scoring.

### 5. Confidence scoring
For each issue, launch a parallel Haiku agent to score confidence (0–100):

- **0**: False positive, doesn't hold up to scrutiny, or pre-existing issue.
- **25**: Might be real, might be false positive. Stylistic issues not tied to spec requirements.
- **50**: Verified real issue but minor — a nitpick or rarely hit in practice. (SHOULD-FIX)
- **75**: Confirmed real issue that will be hit in practice, or a spec requirement that is missing/incomplete. (MUST-FIX)
- **100**: Definitely real, will happen frequently, or a clearly specified requirement that was not implemented at all. (MUST-FIX)

For spec-completeness issues, the agent must cite the specific spec requirement that was not satisfied.

### 6. Filter and categorize
Drop issues scoring below 25. Categorize the rest:
- **MUST-FIX** (75+): Must be resolved before batch is done.
- **SHOULD-FIX** (25–74): Should be resolved in the same batch if straightforward.

### 7. Report results
- **Phase mode**: Output results directly to the conversation.
- **PR mode**: Comment on the PR via `gh pr comment`.

Format:
```
### Code review (pass N)
Found N issues (X must-fix, Y should-fix):

**MUST-FIX:**
1. Description — reason (file:line reference)

**SHOULD-FIX:**
1. Description — reason (file:line reference)
```

Or if clean: "No issues found. All spec items verified, no bugs detected."

### 8. Recheck loop (phase mode only)
After fixes are committed for any MUST-FIX or SHOULD-FIX findings, **re-run steps 1–7 automatically** on the new diff. This verifies that:
- Each original finding was actually resolved (not just claimed fixed)
- The fix itself didn't introduce new issues

Keep looping until a pass comes back clean (no issues scoring 25+). Cap at **3 passes** to avoid infinite loops — if issues persist after 3 passes, report the remaining findings and stop.

Label each pass in output: "Code review (pass 1)", "Code review (pass 2)", etc.

## False positives (skip these)
- Pre-existing issues not introduced by this diff
- Things a linter/typechecker/compiler would catch
- General code quality opinions not tied to spec requirements or project conventions
- Intentional functionality changes related to the broader change
- Issues on lines the user did not modify

## Notes
- Do not attempt to build or typecheck — that runs separately
- Make a todo list first
- Cite file paths and line numbers for each issue
