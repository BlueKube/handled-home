Commit all staged and unstaged changes, then push to the current branch.

Pre-compute context for a clean commit:
```bash
git status --short
git diff --stat
git log --oneline -3
```

Based on the changes:
1. Stage all relevant files (prefer specific files over `git add -A`)
2. Write a concise commit message following the repo convention: `feat|fix|docs|refactor(<scope>): description`
3. Commit using a HEREDOC for the message
4. Push to the current branch with `-u origin <branch-name>`
5. Report success or failure
