

This is Lovable's reply after committing to the main branch. Claude Code to review, but not code anything...

## Plan: Switch Playwright CI to Manual Trigger Only

**Change**: Replace the automatic `push`/`pull_request` triggers in `.github/workflows/playwright.yml` with `workflow_dispatch` (manual trigger).

**File**: `.github/workflows/playwright.yml`

Replace lines 3-6:
```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

With:
```yaml
on:
  workflow_dispatch:
```

This lets you run the workflow manually from GitHub → Actions → "Playwright E2E" → "Run workflow" button. No other changes needed.

