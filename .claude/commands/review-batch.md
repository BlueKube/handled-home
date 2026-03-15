# Independent Batch Code Review

Run an independent code review of the most recent batch implementation. This simulates a "different reviewer" who has no knowledge of why decisions were made.

## How It Works

You will launch a fresh subagent that receives ONLY:
1. The git diff of the batch
2. The acceptance criteria / batch spec
3. The design system rules
4. Instructions to evaluate and categorize findings

The subagent does NOT receive:
- Implementation reasoning
- Earlier conversation context
- The "why" behind any choices

This forces evaluation on the merits of the code alone.

## Procedure

### 1. Gather the diff

```bash
# Get the diff for the last batch commit(s)
git diff HEAD~1..HEAD
# Or for multiple commits in the batch:
git log --oneline -10  # find the batch boundary
git diff <first-batch-commit>^..HEAD
```

### 2. Gather the acceptance criteria

Pull from the batch spec (plan file or earlier in conversation). If no spec exists, reconstruct acceptance criteria from the commit messages and changed files.

### 3. Gather design system rules

Read from `docs/design-guidelines.md` and the role-specific patterns:

**Customer / Provider (Mobile):**
- `p-4 pb-24` padding, no max-width, no responsive grids
- `animate-fade-in` on page containers
- `text-h2` for page headings, `text-caption` for subtitles
- `ChevronLeft` h-5 w-5 with `aria-label` for back navigation
- Min 44px touch targets
- Semantic color tokens only (no hardcoded colors)

**Admin (Desktop):**
- `p-6` padding (no pb-24), `max-w-*` OK, responsive grids OK
- Same animation, heading, back nav, and accessibility rules as above

### 4. Launch the review subagent

Use the Agent tool with:
- `subagent_type`: `general-purpose`
- `description`: "Review Batch N code changes"
- `prompt`: Include the diff, acceptance criteria, and design rules. End with:

```
Review this diff against the acceptance criteria and design system rules.

For each finding, categorize as:
- **MUST-FIX**: Bugs, regressions, accessibility violations, broken routes, missing imports
- **SHOULD-FIX**: Inconsistencies, missing polish, non-critical UX issues
- **NICE-TO-HAVE**: Minor suggestions, style preferences

Check specifically for:
1. Correctness — Does the code work? Are imports present? Are routes valid?
2. Spec adherence — Does every acceptance criterion have a corresponding change?
3. UX consistency — Do patterns match the rest of the codebase?
4. Accessibility — aria-labels on icon buttons, touch targets ≥ 44px, focus states
5. Dark mode — Semantic tokens only, no hardcoded colors
6. Regressions — Was any existing functionality removed or broken?
7. Heading hierarchy — Page headings use text-h2, not text-2xl/text-xl
8. Animation — Page containers have animate-fade-in
9. Padding — Correct for role (p-4 pb-24 mobile, p-6 admin)
10. Back navigation — ChevronLeft (not ArrowLeft) with aria-label

Return findings as a structured list grouped by severity.
```

### 5. Process findings

- **MUST-FIX**: Fix immediately. These block the batch.
- **SHOULD-FIX**: Fix in the same batch when feasible. If deferring, state why.
- **NICE-TO-HAVE**: Can defer. Log for a future batch if worthwhile.

### 6. Commit fixes

```
fix(<role>-ux): resolve Batch N review findings
```

### 7. Re-review if needed

If MUST-FIX items were found, consider re-running the review after fixes to catch anything introduced by the fix itself.

---

## Quick Self-Review Checklist

If a full subagent review isn't warranted (very small batch), at minimum grep for these common misses:

```bash
# Stale heading classes on page-level h1 tags
grep -rn "text-2xl font-bold" src/pages/<role>/

# ArrowLeft instead of ChevronLeft on back buttons
grep -rn "ArrowLeft" src/pages/<role>/

# Missing animate-fade-in on page containers
# (manual check — grep for the page's main div)

# Mobile padding on admin pages (should be p-6, not p-4 pb-24)
grep -rn "pb-24" src/pages/admin/

# Hardcoded colors instead of semantic tokens
grep -rn "text-\[#" src/pages/<role>/
grep -rn "bg-\[#" src/pages/<role>/
```
