Audit a single feature for 9/10 maturity. This is the core command for the polish rounds.

Usage: /polish-feature <feature number> "<feature description>"

For the given feature:

1. **Find the implementation** — search for the primary files that implement this feature (pages, components, hooks, utils, migrations)
2. **Read every line** — don't skim, read the actual code
3. **Run the checklist** against CLAUDE.md Section 8b:
   - [ ] Implementation matches feature description exactly
   - [ ] Error states handled (network failure, empty data, auth failure)
   - [ ] Loading states present (skeleton or spinner)
   - [ ] Empty states present (icon + message when no data)
   - [ ] Dark-mode colors correct (no light-mode Tailwind values like bg-green-100)
   - [ ] No dead code, unused imports, stale comments
   - [ ] Component under 300 lines (extract if over)
   - [ ] Math/calculations verified against business rules
   - [ ] `as any` casts documented or replaced where possible
   - [ ] Consistent patterns with similar features elsewhere
   - [ ] Accessibility basics (labels, aria on interactive elements)
   - [ ] Mobile-responsive (no overflow, no text truncation)
4. **Report findings** as:
   - PASS: feature meets 9/10 — list what was verified
   - FIX: list each issue with file:line and what needs to change
5. If FIX items found, implement the fixes, commit, and run /review-batch
