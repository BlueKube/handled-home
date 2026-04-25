---
description: Post-merge closeout — sync main, branch, update plan.md handoff + sarah-backlog if relevant, ship a docs-only PR, self-merge.
---

You just merged a feature batch PR. Run this closeout to keep `main` and the working docs in sync before the next session picks up.

## Steps

1. **Sync main locally**
   ```bash
   git checkout main && git pull origin main
   ```
   Confirm the latest commit is the merge you just did.

2. **Branch for the closeout**
   ```bash
   git checkout -b docs/<short-slug>-closeout
   ```
   Slug should reference the batch you just merged (e.g. `5.5-closeout`, `dx-1-closeout`).

3. **Update `docs/working/plan.md`**
   - Flip the row for the just-merged batch from `🟡 in progress` → `✅`.
   - Rewrite the **Session Handoff** block to reflect what just shipped:
     - **Branch at session end** — `main` clean, synced at `<merge-sha>`.
     - **Last completed** — 1-paragraph summary of the batch + any review-caught bugs worth surfacing.
     - **Next up** — concrete pointer to the next batch or a fresh-session boundary per CLAUDE.md §8.
     - **Open TODOs** — refresh the carry-over list. Mention any TODO whose priority just changed.
     - **Round progress** — ✅ counts updated.

4. **Update `docs/working/sarah-backlog.md` if Tier 5 fired on the merged PR**
   - For each finding the per-PR triage rule classified as `queue` (not `fix-in-batch` or `drop`):
     - If theme is new: add a new entry per the format block.
     - If theme exists: increment `pr_history:` with the new SHA.
     - Apply the §5.9 promotion rule: if `pr_history:` reaches 3+ consecutive PRs, promote `status:` → `🛑 promoted-to-must-fix` and add concrete next-batch scope notes.
   - Findings classified as `drop` (test-data artifacts, etc.) do NOT land in the backlog — log to `docs/upcoming/TODO.md` instead if they point at a real fixture gap.

5. **Update `docs/upcoming/TODO.md`** for any human action items the merged batch surfaced (API keys, secrets, design decisions, etc.).

6. **Commit + push + open PR**
   - Commit message: `docs: <batch-id> closeout — <short summary>`.
   - PR title: `docs: <batch-id> closeout`.
   - Body: 3-bullet summary linking to the merged batch SHA.

7. **Self-merge** (per CLAUDE.md §11 — docs-only is within self-merge authority).
   - Wait for Vercel ✅ + Supabase skipped (the workflow won't fire on docs-only per `paths-ignore`).
   - Use `merge_method: "merge"` (preserves the closeout commit on main).

## Pre-merge checklist (always run)

- [ ] `tsc --noEmit` clean (no source change but verify).
- [ ] No unintended files staged (only `docs/working/plan.md`, `docs/working/sarah-backlog.md`, `docs/upcoming/TODO.md`).
- [ ] Vercel Preview ✅, Supabase Preview skipped.
- [ ] No review comments to address.

## Notes

- The closeout PR is intentionally separate from the feature PR. It captures the post-merge state of the working docs once main has actually advanced.
- If the merged batch was itself docs-only (e.g. lessons-learned or testing-strategy edits), there's no closeout needed — just flip the plan.md row directly on main if it was 🟡.
- If Sarah scored zero or skipped the matrix on the merged PR, skip step 4.
