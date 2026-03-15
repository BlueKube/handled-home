# Handled Redesign Workflow

## When to Use This Skill

Use this skill when:
- a product redesign will span multiple batches or PRs
- the user has provided an epic list, roadmap, backlog, or implementation phases
- the work needs both design quality and execution discipline
- the user wants the overall objective revisited periodically so the project does not drift
- the task involves implementing UI changes, reviewing them, validating them, and continuing in sequence

This skill is especially suited for Handled Home, but it also works for other multi-batch product redesigns where roadmap alignment matters.

## Core Operating Principle

Treat redesign work as a sequence of small, reviewable batches that always stay attached to the larger roadmap.

Do not optimize for speed by bundling too much together.
Do optimize for clarity, continuity, and compounding quality.

## Required Workflow

Follow this sequence for every batch unless the user explicitly overrides it.

1. Re-anchor to the roadmap.
- Identify which epic or epics the next batch advances.
- State this internally before planning.
- Keep a running understanding of:
  - what is already advanced
  - what is partially advanced
  - what remains untouched
- If the user has provided phase ordering, respect it unless there is a strong reason to deviate.

2. Define a tight batch.
- Keep the batch small enough for one focused implementation and one focused review cycle.
- Favor one theme across 1–3 screens or one narrow cross-cutting system change.
- Avoid mixing unrelated fixes just because they are nearby in code.
- Good examples:
  - nav and route cleanup
  - shell cleanup
  - shared empty-state system
  - dashboard onboarding polish
  - billing trust improvements
  - support/referrals polish

3. Write the spec before coding.
Every batch should have a concrete implementation spec that includes:
- title and theme
- why this batch matters
- which epic(s) it maps to
- diagnosis of the current UX issue
- exact scope
- non-goals
- specific implementation items with likely file targets
- acceptance criteria
- regression risks
- visual validation checklist

Do not start implementation before the spec exists.

4. Implement only the written scope.
- Keep the implementation aligned to the spec.
- If a useful idea emerges that expands scope, defer it to the next batch unless it is necessary to complete the current one.
- Prefer one focused branch or commit stack.
- Preserve previously cleared work.

5. Run independent subagent code review.
- Review is mandatory after every batch implementation.
- Launch a **fresh subagent** (no prior implementation context) to review the batch diff.
- The subagent receives: the git diff, the batch spec/acceptance criteria, and the design system rules.
- The subagent does NOT receive: the implementation reasoning, earlier conversation, or "why" behind choices. This forces it to evaluate the code on its own merits.
- The reviewer should evaluate:
  - correctness
  - spec adherence
  - UX consistency
  - accessibility (aria-labels, touch targets ≥ 44px, keyboard nav)
  - dark mode (semantic tokens only, no hardcoded colors)
  - CTA and route behavior
  - whether the intended user state actually improved
  - consistency with existing patterns in the codebase
  - regressions (functionality removed, broken navigation, missing imports)
- The subagent returns findings categorized as:
  - **MUST-FIX**: Bugs, regressions, accessibility violations, broken routes
  - **SHOULD-FIX**: Inconsistencies, missing polish, non-critical UX issues
  - **NICE-TO-HAVE**: Suggestions, minor improvements, style preferences
- Treat MUST-FIX findings as blocking — fix them before moving to the next batch.
- SHOULD-FIX findings should be fixed in the same batch when feasible.
- NICE-TO-HAVE findings can be deferred to a later batch.
- Fix findings and rerun review until all MUST-FIX items are resolved.

### How to launch the review subagent

Use the Agent tool with these parameters:
- `subagent_type`: general-purpose
- `description`: "Review Batch N code changes"
- `prompt`: Include (1) the git diff output, (2) the acceptance criteria from the batch spec, (3) design system rules from CLAUDE.md/design-guidelines.md, and (4) instructions to categorize findings as MUST-FIX / SHOULD-FIX / NICE-TO-HAVE.

The subagent runs in a clean context with no knowledge of the implementation decisions. This simulates a "different reviewer" and catches blind spots the implementer misses.

6. Validate the live UI.
- Validate the implemented state in the actual app whenever possible.
- Prefer authenticated screen checks and screenshots over code-only trust.
- Compare the rendered result against the intended user state.
- If screenshots still show a real issue, do not call the batch done.

7. Reconcile the batch with the roadmap.
At the end of each batch, record:
- which epic(s) were advanced
- whether they are now substantially advanced, partially advanced, or still open
- what the strongest next batch should be

8. Periodically restate the plan.
For long-running redesign projects, periodically reaffirm:
- the full epic list or roadmap
- which phase the project is in
- what has already been done
- what remains most important

Do this especially when:
- several batches have passed
- the user reminds you of the plan
- the work risks drifting into local optimizations

## Roadmap Mapping Rules

When the user has provided an epic list, do not lose it.

For each batch:
- identify the primary epic
- identify any secondary epics that benefit incidentally
- avoid claiming an epic is complete unless the substantive user-facing goals have been addressed
- distinguish:
  - untouched
  - lightly advanced
  - partially advanced
  - substantially advanced
  - final sweep complete

If the user gives a recommended phase order, use that as the default sequence.

## Review Gate Rules

A batch is not complete until all of the following are true:
- implementation finished
- independent review completed
- findings resolved or explicitly deferred with rationale
- live UI validated when possible
- screenshots no longer show material defects in the scoped area

Do not publish or recommend merge if the latest screenshots still show a real scoped issue.

## Scope Discipline Rules

Use these rules to avoid drift:
- If a fix takes more than one focused PR-sized unit, split it.
- If a fix belongs to a different epic, log it for the next batch instead of sneaking it in.
- If an issue is visible but not part of the current scope, note it separately.
- If a one-line fix resolves a visible defect cleanly, use the one-line fix.
- If the first fix fails in live validation, write a new mini-spec and run another tiny batch instead of improvising.

## Branch and Commit Discipline

Prefer a clear sequence:
- spec
- implementation commit(s)
- review-fix commit(s)
- final validation

When summarizing branch state, include:
- working branch name
- latest relevant commits
- whether the code is only local or already published

Do not assume publish state without verification.

## Communication Rules

When updating the user:
- state what phase or batch is happening
- mention the outcome of the last stage
- say what comes next
- keep it concise

When summarizing progress:
- map work back to the epic roadmap
- be explicit about what is advanced vs unfinished
- prefer concrete status language over vague optimism

## Handled Home Defaults

For Handled Home specifically:
- use the 12-epic backlog as the roadmap of record when relevant
- preserve the navigation recommendation:
  - Home
  - Schedule
  - Routine
  - Activity
  - More
- treat `docs/screen-flows.md`, `docs/design-guidelines.md`, and `docs/masterplan.md` as source-of-truth references
- use screenshot-driven review as a required part of validation
- keep customer-facing redesign ahead of provider/admin work unless the user changes priorities

## Batch Summary Template

Use this structure when reporting a batch:
- Batch name
- Epic mapping
- What changed
- Review status
- Live validation result
- Remaining issue, if any
- Recommended next batch

## Examples

- “Write the next small redesign batch for the dashboard and map it to the roadmap.”
- “Implement this batch, review it with a different model, fix findings, and validate the live UI before moving on.”
- “Reconcile the last three batches against the epic list and tell me what remains.”
- “Do not continue until the screenshots are clean for the scoped issue.”