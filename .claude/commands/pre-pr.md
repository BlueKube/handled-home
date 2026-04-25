---
description: Run Tier 1 + 2 gates in parallel (tsc + build + vitest) before opening a PR. Reports a concise summary.
---

Run `bash scripts/pre-pr-check.sh` from the repo root and report the results to the user.

If the script exits non-zero, do not open the PR — fix the failures first. Skip gates with the documented env flags only when the change is genuinely scoped that narrowly:

- `PRE_PR_SKIP_BUILD=1` — TS-only / docs-only changes per CLAUDE.md §13 ("npm run build is redundant on schema-only / TS-only batches").
- `PRE_PR_SKIP_VITEST=1` — only when no test files were touched.

Per CLAUDE.md §11 pre-merge checklist, `tsc --noEmit` + `npm run build` (when applicable) must pass before a PR is considered ready.
