Run the standard code review on the last commit. Follow the CLAUDE.md Section 5 review protocol.

1. Get the diff: `git diff HEAD~1...HEAD`
2. Read the batch spec from `docs/working/batch-specs/` for the current batch
3. Determine batch size from the spec (Small/Medium/Large/Micro)
4. Launch review agents based on size:
   - **Micro**: 1 combined Sonnet reviewer, no synthesis
   - **Small**: 1 combined Sonnet reviewer (spec + bugs) + 1 Sonnet synthesis
   - **Medium**: 3 parallel Sonnet lanes + 1 Sonnet synthesis
   - **Large**: 3 parallel Sonnet lanes + 1 Sonnet synthesis + 1 Haiku synthesis
5. Pass the ACTUAL diff to review agents (never pseudocode summaries)
6. Report the final scored findings
7. If MUST-FIX findings exist, fix them, commit, push, and run a lightweight re-review
