---
name: handled-mobile-ui-ux
description: Mobile UI/UX design and review workflow for Handled Home and similar service apps. Use when redesigning screens, evaluating mobile UX, reviewing screenshots, refining navigation, improving empty states, tightening conversion paths, creating batch-sized UI specs, or auditing customer flows against product docs, design guidelines, and screenshots.
metadata:
  author: Perplexity Computer
  version: '1.0'
  project: Handled Home
---

# Handled Mobile UI/UX

## When to Use This Skill

Use this skill when the task involves any of the following:
- redesigning mobile customer screens
- reviewing mobile UI/UX for a service app
- critiquing screenshots or screen recordings
- refining navigation, information architecture, or screen hierarchy
- improving empty states, populated states, billing, plans, onboarding, or routine-building flows
- creating a backlog or batch spec for UI changes
- validating that implementation matches product strategy and UX docs
- preparing an implementation-review-validation workflow for iterative design work

This skill is especially appropriate for Handled Home, but it also works for other mobile-first home services, property care, subscription, field service, or operational consumer apps.

## Core Product Lens

Default to this product framing unless the user explicitly overrides it:
- The product should feel like a managed home operating system, not a marketplace.
- The customer experience should feel calm, premium, trustworthy, and operationally competent.
- Navigation should favor recurring customer needs, not one-time setup artifacts.
- Screens should reduce uncertainty, dead ends, and wasted space.
- Empty states should be helpful and directional, not blank or apologetic.
- Conversion-path screens should inspire confidence before asking for commitment.
- The mobile experience should prioritize what a homeowner most needs right now: what’s next, what’s included, what happened, and what to do next.

## Required Workflow

When using this skill, follow this workflow unless the user asks for something narrower.

1. Establish source-of-truth documents.
- For Handled Home, treat these as required references whenever available:
  - `docs/screen-flows.md`
  - `docs/design-guidelines.md`
  - `docs/masterplan.md`
- If screenshots exist, review them before proposing major redesign work.
- If implementation already exists, inspect the current UI state before proposing a fix.

2. Diagnose before changing.
- Identify the current screen state: empty, populated, conversion-path, or operational flow.
- Name the specific UX problem in plain language.
- Prefer concrete diagnoses like:
  - “content hierarchy inverted”
  - “dead-end CTA”
  - “important action below the fold”
  - “empty state lacks direction”
  - “screen feels sparse because chrome outweighs content”
- Avoid vague statements like “make it better” or “improve polish.”

3. Work in tight batches.
- Create small, coherent batches of changes.
- Each batch should usually target one theme across 1–3 screens.
- Good batch themes:
  - shell cleanup
  - shared empty-state system
  - populated-state summary cards
  - pre-subscription conversion path
  - billing clarity
  - dashboard onboarding/setup polish
- Avoid giant redesign passes that touch unrelated surfaces at once.

4. Specify before implementation.
- Write a concrete batch implementation spec before coding.
- Every spec should include:
  - scope
  - user problem
  - exact files likely to change
  - precise UI changes
  - acceptance criteria
  - non-goals
  - regression risks
- If one item depends on unavailable data or would expand scope too much, mark it as deferred rather than silently broadening the batch.

5. Independent review is mandatory.
- After implementation, require a separate review pass by a different strong model.
- Review should focus on:
  - correctness
  - UX consistency
  - accessibility
  - dark mode
  - routing/CTA behavior
  - adherence to the written spec
  - whether the work actually improves the intended user state
- Fix findings until the batch is clear.

6. Validate the live UI.
- Perform live visual validation whenever possible.
- Prefer checking the actual authenticated screen state over trusting code alone.
- Confirm the intended target state truly renders.
- Check that the improved screen is better for the target persona, not just technically correct.

## Screen Review Framework

For each screen, evaluate these dimensions:

1. Clarity
- Can the user understand what this screen is for in 3 seconds?
- Is the main action obvious?
- Is the top-of-screen content meaningful?

2. Hierarchy
- Are the most important facts above the fold?
- Is explanatory content competing with transactional content?
- Is the visual weight aligned with user priorities?

3. Motion toward action
- Does the screen give the user a clear next step?
- Do CTAs advance the workflow instead of deflecting it?
- Are users invited to explore before being forced to commit when appropriate?

4. Trust
- Does the screen feel finished and premium?
- Are there placeholders, wireframe-like styles, broken values, or null-ish labels?
- Does the copy sound calm and competent?

5. Density
- Is the screen too empty?
- Is the chrome heavier than the content?
- Is there unnecessary whitespace creating a “void” effect?

6. Proof and feedback
- Does the product show proof of work, progress, or value?
- Are photos, receipts, next visits, or included services surfaced where useful?

## Design Standards

### Navigation
- Use bottom nav for recurring needs, not one-time setup steps.
- Avoid tabs that feel like a storefront unless the product is intentionally commerce-led.
- Navigation labels should reflect homeowner mental models.
- Legacy routes may remain for compatibility, but the visible IA should reflect the current product truth.

### Empty States
Every empty state should provide:
- icon
- title
- body copy
- clear next step when appropriate

Good empty states:
- reduce uncertainty
- explain what will appear here later
- offer a relevant action
- sound confident and helpful

Avoid:
- plain body text alone
- apology-heavy copy
- dead-end states
- generic “No data” wording

### Populated States
- Populated states must surface summary value quickly.
- Replace generic metrics with meaningful proof signals.
- Use concise stat rows to compress value into glanceable elements.
- Avoid summary labels that are technically true but strategically weak.

### Conversion Screens
- Do not bury pricing or value below too much education.
- Education components should support conversion, not block it.
- If a user is pre-subscription, let them see enough value to understand what they are buying.
- Avoid broken entitlement banners or null placeholders in pre-subscription states.

### Billing and Subscription
- Financial language must be precise.
- Do not imply an exact bill amount unless the app has the real billing data.
- Plan price and next bill are different concepts.
- Billing screens should reduce ambiguity, not add marketing language where accounting truth is expected.

### Copy Tone
Use copy that is:
- calm
- competent
- specific
- non-blaming
- operationally clear

Prefer:
- “Your next service will appear here once scheduled.”
- “Browse available services — subscribe when you’re ready.”
- “No active membership.”

Avoid:
- hype-heavy copy
- vague filler
- internal jargon
- forcing commitment too early

## Screenshot Critique Rules

When reviewing screenshots:
- Compare current reality to the intended flow, not just to general design taste.
- Call out dead space, misweighted headers, weak CTAs, and “unfinished” feelings.
- Identify the exact reason a screen feels weak:
  - too much whitespace
  - missing proof
  - no next action
  - explanatory content above critical content
  - wrong primary CTA
- Rank issues by leverage, not by pixel trivia.

Prioritize fixes that improve:
- trust
- conversion
- clarity
- repeated daily use

## Batch Spec Template

When creating a batch spec, use this outline:

1. Title and theme
2. Why this batch matters
3. Scope
4. Non-goals
5. Spec items with file targets
6. Acceptance criteria
7. Regression risk assessment
8. What to validate visually after implementation

## Review Checklist

Before clearing a batch, verify:
- the batch stayed within scope
- the implemented UI matches the written spec
- dark mode still works
- provider/admin areas were not accidentally affected if out of scope
- no dead-end CTAs were introduced
- no placeholder, null, or misleading values are shown to users
- the main target user state was validated live
- the new UI is materially better, not just different

## Handled Home Defaults

For Handled Home specifically, default assumptions are:
- customer-first mobile redesigns come before provider/admin polish
- documentation alignment matters as much as visual polish
- screen changes should be evaluated against product strategy, not just component aesthetics
- independent review by a separate model is required before moving to the next batch
- live visual validation is required whenever possible

## Output Expectations

When using this skill, outputs should be:
- specific
- batch-sized
- implementation-ready
- reviewable
- grounded in actual screen states

Avoid broad redesign manifestos unless the user asks for them.
Prefer decisions that can be implemented, reviewed, and validated in one contained cycle.

## Example Uses

- “Review these customer screenshots and identify the next highest-leverage mobile redesign batch.”
- “Turn the Plans and Routine issues into a focused implementation spec.”
- “Audit this mobile billing screen for clarity, trust, and next-step quality.”
- “Check whether the implemented screen matches screen-flows.md and masterplan.md.”
- “Propose a small batch that improves the pre-subscription conversion path.”
