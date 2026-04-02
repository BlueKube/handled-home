Run the standard code review on the last commit. Follow the CLAUDE.md Section 5 review protocol.

## Execution

You MUST execute these steps automatically — do not ask the user to do them.

### Step 1: Gather context (parallel)

Run these three operations in parallel using the Bash tool:

```bash
# 1. Get the diff
git diff HEAD~1...HEAD

# 2. Find the current batch spec
ls docs/working/batch-specs/

# 3. Get batch size from plan.md
grep -A2 "| B" docs/working/plan.md | head -20
```

Then read the batch spec file and extract the Size (S/M/L/Micro).

### Step 2: Determine review tier

Based on the batch size from the spec:

| Size | Agents | Configuration |
|------|--------|--------------|
| Micro | 1 | 1 combined Sonnet reviewer, no synthesis |
| Small (S) | 2 | 1 combined Sonnet reviewer + 1 Sonnet synthesis |
| Medium (M) | 4 | 3 parallel Sonnet lanes + 1 Sonnet synthesis |
| Large (L) | 5 | 3 parallel Sonnet lanes + 1 Sonnet synthesis + 1 Haiku synthesis |

If no batch spec exists (e.g., polish round without formal specs), default to **Small** tier.

### Step 3: Launch review agents

Store the diff and spec content in variables. Then launch agents based on the tier.

**For Micro/Small — launch 1 combined reviewer:**

Launch a single Agent (model: sonnet, description: "Combined spec+bug review") with this prompt structure:
- Role: combined code reviewer (Spec Completeness + Bug Scan)
- Include the FULL diff (from `git diff HEAD~1...HEAD`, NOT a summary)
- Include the batch spec or feature description
- Include the known-patterns list from `.claude/agents/batch-reviewer.md`:
  - `as any` casts on Supabase queries — intentional
  - `cancel_at_period_end + status='canceling'` — standard cancel pattern
  - SECURITY DEFINER on trigger functions — required
  - `SET search_path = public` on SECURITY DEFINER — security hardening
- Output format: MUST-FIX (75+) / SHOULD-FIX (25-74) / DROP (0-24) with file:line

**For Small — also launch synthesis after the reviewer completes.**

**For Medium/Large — launch 3 parallel lanes:**

Launch these 3 agents in parallel (single message, multiple Agent tool calls):

1. **Lane 1 — Spec Completeness** (model: sonnet): Full batch spec + diff. Check every requirement has implementation.
2. **Lane 2 — Bug Scan** (model: sonnet): Diff only, NO spec context. Find bugs from code alone.
3. **Lane 3 — Historical Context** (model: sonnet): Run `git log --oneline -20` and `git blame` on changed files + diff. Check for reverted fixes or repeated mistakes. **Skip if first batch in phase or no prior review history.**

After all lanes complete, launch **Lane 4 — Synthesis** (model: sonnet):
- Receives ALL lane outputs + diff + spec
- De-duplicates, cross-validates, scores using the formula:
  - Cross-lane agreement: +25 per additional lane
  - Severity (regression/security/data loss): +20-40
  - Specificity (file:line with explanation): +10
  - Style-only: cap at 20
- Categorizes: MUST-FIX (75+), SHOULD-FIX (25-74), DROP (0-24)

For Large, add a Haiku synthesis agent as a second opinion.

### Step 4: Act on findings

Read the final report (synthesis output or single reviewer output for Micro).

- **MUST-FIX items**: Fix them immediately, commit, push, then run a **lightweight re-review** (Lanes 1-2 + synthesis only, 3 agents max)
- **SHOULD-FIX items**: Fix in same batch when feasible
- **DROP items**: Log or ignore

Maximum 3 fix passes. If issues persist after 3 passes, report to user for decision.

### Step 5: Report

Output the final review summary to the user:
```
## Review: [PASS/FINDINGS]
- MUST-FIX: N items (fixed/unfixed)
- SHOULD-FIX: N items (fixed/deferred)
- Fix passes: N/3
```
