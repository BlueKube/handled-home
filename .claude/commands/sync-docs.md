# Documentation Sync

Sync project documentation with the current codebase state. Run this after completing a phase (a group of related batches) — it is mandatory before starting the next phase.

## When to Run

- After completing all batches in a phase (e.g., "all provider pages done" or "all admin pages done")
- Before starting a new phase (ensure docs are clean for the next work)
- When the user explicitly requests a documentation review

## Documents to Audit

Check each of these for stale information:

### 1. `docs/app-flow-pages-and-roles.md`
- [ ] Page names match actual `<h1>` headings in code
- [ ] Route paths match `App.tsx` route definitions
- [ ] Dynamic pages noted correctly (e.g., `*(dynamic: org name)*`)
- [ ] Redirects noted (e.g., `*(redirect → /admin/zones)*`)
- [ ] Route counts are accurate
- [ ] Primary journeys reflect current flow

### 2. `docs/screen-flows.md`
- [ ] Screen names match actual page headings
- [ ] Component specs match current implementations
- [ ] Navigation flows match current route structure
- [ ] Back navigation targets are correct
- [ ] Empty state descriptions match current copy

### 3. `docs/design-guidelines.md`
- [ ] Color tokens match `src/index.css`
- [ ] Component specs match actual component implementations
- [ ] Utility classes documented match what's in the codebase
- [ ] Any new patterns introduced during the phase are documented
- [ ] Role-specific layout differences are documented (mobile vs admin)

### 4. `docs/masterplan.md`
- [ ] Product strategy sections still align with what was built
- [ ] Feature descriptions match current implementations
- [ ] No references to deprecated or renamed features

### 5. `docs/feature-list.md`
- [ ] Feature status labels are current
- [ ] No features listed as "planned" that are now implemented
- [ ] No implemented features missing from the list

### 6. `CLAUDE.md`
- [ ] Completion status is current (which batches/phases are done)
- [ ] Roadmap section reflects remaining work
- [ ] Suggested batch groupings updated if work has shifted
- [ ] Any new conventions or patterns documented

## Procedure

### 1. Parallelize the audit

Launch subagents to audit multiple documents simultaneously. Each subagent should:
- Read the doc
- Cross-reference against actual code (grep for page headings, check route files, etc.)
- Return a list of stale items with suggested corrections

```
Agent: subagent_type=Explore
Prompt: "Read [doc path]. Cross-reference against the codebase.
Find any stale page names, incorrect routes, outdated specs, or
missing patterns. Return a list of specific items to update with
the current correct values from the code."
```

### 2. Apply fixes

Edit each document to match the current codebase reality. Common fixes:
- Page names that drifted (e.g., "Quality Score" → "Quality & Tier")
- Navigation patterns not reflected in specs
- Design utilities used in code but not documented
- Completion status that's outdated

### 3. Verify no regressions

After editing docs, scan for internal consistency:
- Do cross-references between docs still work?
- Are route counts still accurate after adding/removing entries?
- Do dynamic page names follow the same notation convention?

### 4. Commit

```bash
git add docs/ CLAUDE.md
git commit -m "docs: sync documentation with codebase after [phase name]"
```

## What to Look For

Common staleness patterns:

| Pattern | Example |
|---------|---------|
| Renamed page heading | Doc says "Provider List", code says "Providers" |
| Changed navigation target | Doc says back goes to `/settings`, code goes to `/more` |
| New utility not documented | `animate-fade-in` used everywhere, not in design-guidelines |
| Outdated route count | Doc says 58 admin pages, actual count is 61 |
| Feature status drift | Doc says "planned", feature is shipped |
| Layout pattern undocumented | Admin uses `p-6` not `p-4`, but guidelines only show mobile |

## Completion Gate

Documentation sync is done when:

- [ ] All 6 documents audited
- [ ] All stale items corrected
- [ ] Changes committed and pushed
- [ ] No internal inconsistencies between documents
