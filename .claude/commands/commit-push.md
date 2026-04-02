Commit all staged and unstaged changes, then push to the current branch.

## Execution

You MUST execute these steps automatically — do not ask the user to do them.

### Step 1: Pre-validate (parallel)

Run these checks in parallel using the Bash tool:

```bash
# TypeScript type check
npx tsc --noEmit 2>&1 | tail -20

# Production build
npm run build 2>&1 | tail -20
```

If either fails:
- **tsc errors**: Fix the type errors first, then restart this command
- **Build errors**: Fix the build errors first, then restart this command
- Do NOT commit code that fails type checking or build

### Step 2: Gather git context (parallel)

Run these in parallel:

```bash
git status --short
git diff --stat
git log --oneline -3
git branch --show-current
```

### Step 3: Stage files

Stage specific files based on `git status` output. Prefer naming files explicitly over `git add -A`.

Never stage:
- `.env` files or credentials
- `node_modules/`
- Files not related to the current batch

### Step 4: Commit

Write a commit message following the repo convention:
```
feat|fix|docs|refactor(<scope>): Batch N — Description
```

Use a HEREDOC for the message:
```bash
git commit -m "$(cat <<'EOF'
feat(scope): Batch N — description

Details if needed.
EOF
)"
```

### Step 5: Push

```bash
git push -u origin <branch-name>
```

If push fails due to network errors, retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s).

### Step 6: Report

Output:
```
## Committed and pushed
- Branch: <branch>
- Commit: <short hash> <message>
- Files: N files changed
- Validation: tsc ✓ build ✓
```
