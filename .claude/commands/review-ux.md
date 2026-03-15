# Mobile UI/UX Screen Review

Evaluate a screen (or set of screens) for mobile UX quality. Use when reviewing screenshots, critiquing a page implementation, or planning UX improvements.

## Before You Start

Read the source-of-truth docs:
- `docs/design-guidelines.md` — tokens, spacing, components
- `docs/screen-flows.md` — screen layouts, flows, component specs
- `docs/masterplan.md` — product strategy and vision

If screenshots or the live app are available, review the actual rendered state before proposing changes.

## Product Lens

Default to this framing unless the user overrides it:

- The product should feel like a **managed home operating system**, not a marketplace
- The experience should feel **calm, premium, trustworthy, operationally competent**
- Screens should reduce uncertainty, dead ends, and wasted space
- Prioritize what the user needs right now: **what's next, what's included, what happened**

## Screen Review Framework

Evaluate each screen on these 6 dimensions. Be specific — name the exact problem, don't say "needs improvement."

### 1. Clarity
- Can the user understand the screen's purpose in 3 seconds?
- Is the main action obvious?
- Is the top-of-screen content meaningful or decorative?

### 2. Hierarchy
- Are the most important facts above the fold?
- Is explanatory content competing with transactional content?
- Is visual weight aligned with user priorities?

### 3. Motion toward action
- Is the next step obvious?
- Do CTAs advance the workflow or deflect it?
- Are users invited to explore before being forced to commit?

### 4. Trust
- Does the screen feel finished and premium?
- Are there placeholders, wireframe-like styles, broken values, or null labels?
- Does the copy sound calm and competent?

### 5. Density
- Is the screen too empty or too packed?
- Is chrome heavier than content?
- Is there unnecessary whitespace creating a "void" effect?

### 6. Proof and feedback
- Does the screen show proof of work, progress, or value?
- Are photos, receipts, next visits, or included services surfaced where useful?

---

## Design Standards

### Navigation
- Bottom nav for recurring needs, not one-time setup
- Labels should reflect homeowner/provider mental models
- Avoid tabs that feel like a storefront unless intentionally commerce-led

### Empty States
Every empty state MUST have:
- [ ] Icon
- [ ] Title
- [ ] Body copy (explains what will appear here)
- [ ] Clear next step / CTA when appropriate

Good: reduces uncertainty, offers direction, sounds confident.
Bad: "No data", blank screen, apology-heavy copy, dead ends.

### Populated States
- Surface summary value immediately — don't make users dig
- Replace generic metrics with meaningful proof signals
- Use concise stat rows for glanceable info
- Avoid labels that are technically true but strategically weak

### Conversion Screens
- Don't bury pricing below too much education
- Let pre-subscription users see enough value to understand the purchase
- Avoid broken entitlement banners or null placeholders

### Billing & Subscription
- Financial language must be precise
- Plan price ≠ next bill amount (don't conflate them)
- Billing screens should reduce ambiguity, not add marketing language

### Copy Tone
**Use:** calm, competent, specific, non-blaming, operationally clear

**Good examples:**
- "Your next service will appear here once scheduled."
- "Browse available services — subscribe when you're ready."
- "No active membership."

**Avoid:** hype, vague filler, internal jargon, premature commitment pressure

---

## Screenshot Critique Rules

When reviewing screenshots:

1. Compare against the intended flow (from screen-flows.md), not just general taste
2. Call out: dead space, misweighted headers, weak CTAs, "unfinished" feelings
3. Name the exact reason a screen feels weak:
   - Too much whitespace / void effect
   - Missing proof of value
   - No clear next action
   - Explanatory content above critical content
   - Wrong primary CTA
4. Rank issues by **leverage** (trust, conversion, clarity, daily-use quality), not pixel trivia

---

## Output Format

When reviewing a screen, structure your output as:

```
### [Screen Name]

**Current state:** [1-2 sentence description of what's there now]

**Issues:**
1. [Dimension]: [Specific problem]
2. [Dimension]: [Specific problem]

**Recommended fixes** (ordered by leverage):
1. [Fix] — [which file, what change]
2. [Fix] — [which file, what change]

**Severity:** [Critical / High / Medium / Low]
```

When reviewing multiple screens, group by severity so the highest-leverage fixes are addressed first.
