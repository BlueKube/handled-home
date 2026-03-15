# Redesign Batch Workflow

Execute a focused UI/UX redesign batch. Follow every step in order. Do not skip steps.

## Step 1: Re-anchor to the roadmap

Before planning any work:

- [ ] State which pages/areas this batch covers
- [ ] State what was completed in previous batches
- [ ] State what remains after this batch
- [ ] If the user provided phase ordering, respect it

Read these files for current state:
- `CLAUDE.md` — completion status, roadmap, what's done
- `docs/app-flow-pages-and-roles.md` — full route tree by role

## Step 2: Define a tight batch

- [ ] 1 theme across 1–3 screens (no more)
- [ ] Do not mix unrelated fixes
- [ ] Name the batch clearly (e.g., "Provider Batch 6: Availability, Coverage & Work Setup")

Good batch themes: shell cleanup, empty-state system, dashboard polish, billing trust, navigation consistency, animation/spacing pass.

## Step 3: Write the spec before coding

Create a markdown spec (in plan mode or as a comment) with ALL of these sections:

1. **Title and theme**
2. **Why this batch matters** — what user problem does it solve?
3. **Roadmap position** — what's done, what's this, what's next
4. **Scope** — exact changes, grouped by file
5. **Non-goals** — what you will NOT touch
6. **File targets** — table of files and changes
7. **Acceptance criteria** — checkable list
8. **Regression risks** — what could break

Do NOT start implementation before the spec is written and approved.

## Step 4: Implement only the spec

- [ ] Implement exactly what the spec says
- [ ] If you discover something out of scope, note it for a future batch — do not sneak it in
- [ ] Commit implementation with a clear message: `feat(<role>-ux): Batch N — Description`

## Step 5: Run independent code review

This is mandatory. Invoke `/review-batch` or manually:

- [ ] Launch a fresh subagent with NO implementation context
- [ ] Provide: git diff, acceptance criteria, design system rules
- [ ] Subagent categorizes findings as MUST-FIX / SHOULD-FIX / NICE-TO-HAVE
- [ ] Fix ALL MUST-FIX findings before proceeding
- [ ] Fix SHOULD-FIX findings when feasible
- [ ] Commit fixes: `fix(<role>-ux): resolve Batch N review findings`

## Step 6: Validate build

- [ ] Run `npx tsc --noEmit` — must pass
- [ ] Run `npm run build` — must pass

## Step 7: Validate the live UI (when possible)

- [ ] Take screenshots via Playwright or manual check
- [ ] Verify light mode and dark mode
- [ ] Confirm touch targets are at least 44px
- [ ] Confirm animations render (animate-fade-in)
- [ ] If screenshots show real issues, do not call the batch done

## Step 8: Reconcile with the roadmap

After the batch is complete:

- [ ] State which pages are now done
- [ ] State what the next batch should cover
- [ ] Update `CLAUDE.md` completion status if a significant milestone was reached

## Step 9: Phase-end documentation sync

After the FINAL batch in a phase (e.g., all provider pages done, or all admin pages done):

- [ ] **Invoke `/sync-docs`** — this is mandatory, not optional
- [ ] Do not start the next phase until docs are synced

---

## Role-Specific Patterns

Adapt your implementation to the target role:

### Customer / Provider (Mobile)
- Shell: Bottom tab bar (56px)
- Padding: `p-4 pb-24` (clears tab bar)
- No max-width constraints (mobile-only)
- No responsive grids
- Back nav: `ChevronLeft` h-5 w-5 + `aria-label`
- Entry animation: `animate-fade-in`
- Touch targets: min 44px

### Admin (Desktop)
- Shell: Sidebar + command bar (`AdminShell`)
- Padding: `p-6` (no pb-24 — no tab bar)
- `max-w-*` constraints OK for readability
- Responsive grids OK (`lg:grid-cols-*`)
- Back nav: `ChevronLeft` h-5 w-5 + `aria-label`
- Entry animation: `animate-fade-in`
- Headings: `text-h2`

---

## Batch Completion Gate

A batch is NOT done until ALL of these are true:

- [ ] Implementation matches the written spec
- [ ] Independent code review completed, MUST-FIX items resolved
- [ ] `tsc --noEmit` and `npm run build` pass
- [ ] Live UI validated when possible
- [ ] Roadmap reconciled
- [ ] If this is the last batch in a phase: `/sync-docs` completed
