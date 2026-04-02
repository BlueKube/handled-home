Audit a single feature for 9/10 maturity. This is the core command for the polish rounds.

Usage: /polish-feature <feature number> "<feature description>"

Arguments: $ARGUMENTS

## Execution

You MUST execute these steps — do not just describe them.

### Step 1: Spawn an audit sub-agent

Launch an Agent (subagent_type: "Explore", thoroughness: "very thorough") to find ALL implementation files for this feature. The agent prompt must include:
- The feature number and description from $ARGUMENTS
- Instructions to search using multiple strategies: grep for keywords from the description, glob for likely file patterns, check pages/, components/, hooks/, utils/, types/
- Return: every file path with a 1-line summary of what it contains

### Step 2: Spawn the polish audit as a sub-agent

This is the critical step. Launch an Agent (model: sonnet) that:
- Receives the file list from Step 1
- Reads every file using the Read tool (not skimming — full reads)
- Runs this checklist against each file, returning PASS/FAIL with file:line evidence:

1. **Implementation matches description**: Does the code do what "$ARGUMENTS" says?
2. **Error states**: Network failures, empty responses, auth failures — handled with user-facing messages?
3. **Loading states**: Skeleton or spinner shown while data loads?
4. **Empty states**: Meaningful icon + message when no data (not blank screen)?
5. **Dark-mode colors**: No light-mode Tailwind values (bg-green-100, text-blue-600)? Uses dark variants?
6. **Dead code**: No unused imports, unreachable code, stale comments, console.log?
7. **Component size**: Under 300 lines? If over, identify extraction targets.
8. **Math verification**: Any calculations correct per business rules?
9. **Pattern consistency**: Same patterns as similar features elsewhere?
10. **Mobile responsive**: No horizontal overflow, text truncation, touch targets ≥44px?

The agent prompt must also include the known-patterns list so it doesn't flag false positives:
- `as any` casts on Supabase queries — intentional
- `cancel_at_period_end + status='canceling'` — standard cancel pattern
- SECURITY DEFINER on trigger functions — required for auth.users access

The agent must return a structured report:
```
Feature: [number] [description]
Files audited: [list]
Score: X/10
PASS items: [list with evidence]
FAIL items: [list with file:line and what to fix]
```

### Step 3: Act on the report

Read the sub-agent's report. This is now the only thing in your main context — the file contents stayed in the sub-agent.

- If Score is 9/10 or 10/10: Report PASS, no fixes needed
- If Score is below 9/10: Implement every FAIL item fix directly (you already have file:line references), then run `/commit-push` followed by `/review-batch`

Do NOT re-read files that the sub-agent already audited unless you need to make fixes. The sub-agent's report contains everything you need to decide.
