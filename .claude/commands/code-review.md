---
allowed-tools: Bash(gh issue view:*), Bash(gh search:*), Bash(gh issue list:*), Bash(gh pr comment:*), Bash(gh pr diff:*), Bash(gh pr view:*), Bash(gh pr list:*), Bash(git diff:*), Bash(git log:*), Bash(git blame:*), Bash(git show:*)
description: Code review changes — works on a PR number or the latest committed phase
disable-model-invocation: false
---
Provide a code review for the given changes.

This command supports two modes:
- **PR mode**: Pass a PR number (e.g., `/code-review 123`) to review a pull request
- **Phase mode**: Pass no argument or `phase` (e.g., `/code-review` or `/code-review phase`) to review the latest committed changes on the current branch vs the base branch (main)

## Steps

### Step 0: Determine review mode
- If an argument is a number, treat it as a PR number and use **PR mode** (use `gh pr diff` to get changes)
- Otherwise, use **Phase mode** (use `git diff main...HEAD` to get committed changes on this branch)
- If in phase mode and there are no differences from main, report "No changes to review" and stop

### Step 1: Eligibility check (PR mode only)
Use a Haiku agent to check if the pull request (a) is closed, (b) is a draft, (c) does not need a code review (eg. because it is an automated pull request, or is very simple and obviously ok), or (d) already has a code review from you from earlier. If so, do not proceed.

### Step 2: Find CLAUDE.md files
Use a Haiku agent to give you a list of file paths to (but not the contents of) any relevant CLAUDE.md files from the codebase: the root CLAUDE.md file (if one exists), as well as any CLAUDE.md files in the directories whose files were modified.

### Step 3: Summarize the changes
Use a Haiku agent to view the diff (from PR or git diff), and ask the agent to return a summary of the change.

### Step 4: Parallel code review
Launch 5 parallel Sonnet agents to independently code review the change. The agents should do the following, then return a list of issues and the reason each issue was flagged (eg. CLAUDE.md adherence, bug, historical git context, etc.):

a. **Agent #1 — CLAUDE.md compliance**: Audit the changes to make sure they comply with the CLAUDE.md. Note that CLAUDE.md is guidance for Claude as it writes code, so not all instructions will be applicable during code review.
b. **Agent #2 — Bug scan**: Read the file changes, then do a shallow scan for obvious bugs. Avoid reading extra context beyond the changes, focusing just on the changes themselves. Focus on large bugs, and avoid small issues and nitpicks. Ignore likely false positives.
c. **Agent #3 — Historical context**: Read the git blame and history of the code modified, to identify any bugs in light of that historical context.
d. **Agent #4 — Prior feedback**: Read previous pull requests that touched these files, and check for any comments on those pull requests that may also apply to the current changes.
e. **Agent #5 — Code comment compliance**: Read code comments in the modified files, and make sure the changes comply with any guidance in the comments.

### Step 5: Confidence scoring
For each issue found in step 4, launch a parallel Haiku agent that takes the diff, issue description, and list of CLAUDE.md files (from step 2), and returns a score to indicate the agent's level of confidence for whether the issue is real or false positive. To do that, the agent should score each issue on a scale from 0-100, indicating its level of confidence. For issues that were flagged due to CLAUDE.md instructions, the agent should double check that the CLAUDE.md actually calls out that issue specifically. The scale is (give this rubric to the agent verbatim):

a. 0: Not confident at all. This is a false positive that doesn't stand up to light scrutiny, or is a pre-existing issue.
b. 25: Somewhat confident. This might be a real issue, but may also be a false positive. The agent wasn't able to verify that it's a real issue. If the issue is stylistic, it is one that was not explicitly called out in the relevant CLAUDE.md.
c. 50: Moderately confident. The agent was able to verify this is a real issue, but it might be a nitpick or not happen very often in practice. Relative to the rest of the PR, it's not very important.
d. 75: Highly confident. The agent double checked the issue, and verified that it is very likely it is a real issue that will be hit in practice. The existing approach in the PR is insufficient. The issue is very important and will directly impact the code's functionality, or it is an issue that is directly mentioned in the relevant CLAUDE.md.
e. 100: Absolutely certain. The agent double checked the issue, and confirmed that it is definitely a real issue, that will happen frequently in practice. The evidence directly confirms this.

### Step 6: Filter
Filter out any issues with a score less than 80. If there are no issues that meet this criteria, report "No issues found" and stop.

### Step 7: Re-check eligibility (PR mode only)
Use a Haiku agent to repeat the eligibility check from step 1, to make sure that the pull request is still eligible for code review.

### Step 8: Report results

**PR mode**: Use the `gh` bash command to comment back on the pull request with the result.
**Phase mode**: Output the results directly to the user in the conversation.

When writing your report, keep in mind to:
a. Keep your output brief
b. Avoid emojis (except the robot in the footer)
c. Link and cite relevant code, files, and URLs

## False positive examples (for steps 4 and 5)
- Pre-existing issues
- Something that looks like a bug but is not actually a bug
- Pedantic nitpicks that a senior engineer wouldn't call out
- Issues that a linter, typechecker, or compiler would catch (eg. missing or incorrect imports, type errors, broken tests, formatting issues, pedantic style issues like newlines). No need to run these build steps yourself -- it is safe to assume that they will be run separately as part of CI.
- General code quality issues (eg. lack of test coverage, general security issues, poor documentation), unless explicitly required in CLAUDE.md
- Issues that are called out in CLAUDE.md, but explicitly silenced in the code (eg. due to a lint ignore comment)
- Changes in functionality that are likely intentional or are directly related to the broader change
- Real issues, but on lines that the user did not modify

## Notes
- Do not check build signal or attempt to build or typecheck the app. These will run separately, and are not relevant to your code review.
- Use `gh` to interact with Github for PR mode, and `git` commands for phase mode
- Make a todo list first
- You must cite and link each bug (eg. if referring to a CLAUDE.md, you must link it)

## Output format

For your final report, follow this format precisely (assuming 3 issues found):

---
### Code review
Found 3 issues:
1. <brief description of bug> (CLAUDE.md says "<...>")
<link to file and line with full sha1 + line range for context, eg. https://github.com/anthropics/claude-code/blob/1d54823877c4de72b2316a64032a54afc404e619/README.md#L13-L17>
2. <brief description of bug> (some/other/CLAUDE.md says "<...>")
<link to file and line with full sha1 + line range for context>
3. <brief description of bug> (bug due to <file and code snippet>)
<link to file and line with full sha1 + line range for context>
🤖 Generated with [Claude Code](https://claude.ai/code)
<sub>- If this code review was useful, please react with 👍. Otherwise, react with 👎.</sub>
---

Or, if no issues found:

---
### Code review
No issues found. Checked for bugs and CLAUDE.md compliance.
🤖 Generated with [Claude Code](https://claude.ai/code)
---

## Link format
When linking to code, follow this format precisely, otherwise the Markdown preview won't render correctly: https://github.com/anthropics/claude-cli-internal/blob/c21d3c10bc8e898b7ac1a2d745bdc9bc4e423afe/package.json#L10-L15
- Requires full git sha
- You must provide the full sha. Commands like `https://github.com/owner/repo/blob/$(git rev-parse HEAD)/foo/bar` will not work, since your comment will be directly rendered in Markdown.
- Repo name must match the repo you're reviewing
- # sign after the file name
- Line range format is L[start]-L[end]
- Provide at least 1 line of context before and after, centered on the line you are commenting about (eg. if you are commenting about lines 5-6, you should link to `L4-7`)
