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

### 4. Stage 1 — Parallel code review (3 lanes × 2 tiers = 6 agents)
Launch 6 agents in parallel: one Sonnet agent and one Haiku agent per lane. Each lane has a single review focus — agents within the same lane may find overlapping issues (that's intentional redundancy), but agents should not cross into another lane's focus.

The Sonnet agent in each lane does the deep analysis. The Haiku agent in each lane acts as a fast, independent second set of eyes on the same scope. Both return a list of issues with reasons.

**Lanes:**

a. **Spec completeness audit** — Cross-reference every requirement, acceptance criterion, and edge case in the batch spec (from `docs/working/batch-specs/`) against the diff. Flag anything specified but not implemented, partially implemented, or implemented differently than specified. This is the most important lane — it prevents incomplete work from shipping as "done."
b. **Bug scan** — Shallow scan for obvious bugs in the changed code only. No extra context, no git history, no nitpicks — just the diff.
c. **Historical context & prior feedback** — Read git blame/history of modified code to spot regressions or issues informed by past changes. Check previous PRs/commits that touched these files for recurring review comments that may apply here. Do not cross into the bug scan lane; focus on what the history and prior reviews reveal.

### 5. Stage 2 — Synthesis & cross-check (1 lane × 2 tiers = 2 agents)
After all 6 Stage 1 agents return, launch Lane d with all findings as input:

d. **Synthesis & cross-check** — Receives all findings from Lanes a–c (both tiers). Cross-validates findings across lanes, resolves contradictions, connects related issues, catches inter-lane gaps, de-duplicates, scores each finding 0–100, and produces the final categorized report.

This is the only lane that sees other agents' output. It serves as the communication bridge between lanes:
- Connects related findings (e.g., "spec item implemented" from Lane a + "bug in that implementation" from Lane b)
- Resolves contradictions (e.g., "intentional per history" from Lane c vs. "flagged as bug" from Lane b)
- Elevates files flagged by multiple lanes as high-risk
- Catches issues that fall between lane boundaries

**Scoring (applied by the synthesis agent):**
- **Cross-tier agreement** (both Sonnet and Haiku flagged it): +30 confidence
- **Cross-lane agreement** (multiple lanes flagged it): +20 per additional lane
- **Severity of impact** (regression, security, data loss, missing spec item): +20–40
- **Specificity** (exact file:line with clear explanation): +10
- **Style-only** (formatting, naming preference): cap at 20

For spec-completeness issues, the synthesis agent must cite the specific spec requirement that was not satisfied.

### 6. Filter and categorize
The synthesis agent drops issues scoring below 25 and categorizes the rest:
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
After fixes are committed for any MUST-FIX or SHOULD-FIX findings, **re-run a lightweight review automatically** on the new diff. This verifies that:
- Each original finding was actually resolved (not just claimed fixed)
- The fix itself didn't introduce new issues

**Lightweight re-review (passes 2+):** Only run Lanes a–b (spec completeness + bug scan) plus Lane d (synthesis) — 6 agents instead of 8. Lane c (historical context & prior feedback) adds negligible value on a fix diff since the history hasn't meaningfully changed.

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
