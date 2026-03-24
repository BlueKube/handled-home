# autoresearch-design — Handled Home Design Guidelines Optimization

Autonomous optimization of `docs/design-guidelines.md` using the [Karpathy autoresearch](https://github.com/karpathy/autoresearch) pattern. The agent edits the design guidelines in a loop, runs `evaluate-design.py`, and keeps or discards changes based on whether `design_score` improves.

Tone: **design systems engineer, not marketer.** Write like a senior design engineer documenting decisions for implementation — precise, value-laden, implementable. Every line should contain a concrete spec (px, ms, HSL, class name, cubic-bezier) or a specific decision. Not aspirational prose. Not brand manifesto. A document a developer can build from without guessing.

---

## Setup

To begin a new experiment run, work with the user to:

1. **Agree on a run tag**: propose a tag based on today's date (e.g. `mar24`). The branch `autoresearch-design/<tag>` must not already exist — this is a fresh run.
2. **Create the branch**: `git checkout -b autoresearch-design/<tag>` from current master.
3. **Read the reference files** — full context before touching anything:
   - `docs/design-guidelines.md` — **the only file you modify.** Design tokens, component specs, animation, layout rules.
   - `src/index.css` — frozen reference. Actual CSS custom property values. Your tokens MUST match these.
   - `docs/screen-flows.md` — frozen reference. Screen inventory and component usage. Cross-reference for completeness.
   - `docs/masterplan.md` — frozen reference. Brand voice, emotional tone, value proposition.
   - `docs/feature-list.md` — frozen reference. Feature inventory for component coverage validation.
   - `src/components/ui/*.tsx` file list — frozen reference. Actual implemented component names.
   - `auto/evaluate-design.py` — frozen evaluation harness. DO NOT MODIFY.
4. **Run the baseline**: `python auto/evaluate-design.py --verbose` and record the score.
5. **Initialize results.tsv**: Create `auto/design-results.tsv` with the header row (see Logging section).
6. **Confirm and go**: Confirm setup looks good, then kick off the experiment loop.

---

## The Three Files

| File | Role | Mutable? |
|------|------|----------|
| `docs/design-guidelines.md` | The design system spec — the **only** file you edit | YES |
| `auto/evaluate-design.py` | The 12-dimension scoring harness | NO |
| `auto/design-program.md` | This file — your operating instructions | NO (human-edited only) |

Reference files (always frozen):

| File | Role |
|------|------|
| `src/index.css` | Ground truth for CSS custom property values. Token coherence checks. |
| `docs/screen-flows.md` | Screen inventory and component usage. Component coverage cross-reference. |
| `docs/masterplan.md` | Brand voice, emotional positioning, business context. |
| `docs/feature-list.md` | Feature inventory for validating component coverage claims. |
| `src/components/ui/*.tsx` | Actual implemented component file names. Component existence cross-reference. |

---

## What You CAN Do

Modify `docs/design-guidelines.md`. Additions and edits that improve score legitimately:

- **Deepen token architecture**: Organize tokens into three tiers — primitive (raw values), semantic (purpose-based aliases), component-level (specific overrides). Add categories beyond color: spacing, typography, elevation, radius, opacity, duration. Use naming conventions like `--color-surface-elevated`, `--duration-fast`.
- **Complete dark mode**: Fill in every `---` placeholder in the color table. Add dark-mode guidance for images (dimming/desaturation), elevation model changes (luminance vs shadow), and component-specific dark overrides.
- **Build the motion system**: Define named easing curves with `cubic-bezier` values. Specify duration tiers (`instant` 100ms, `fast` 150ms, `normal` 250ms, `gentle` 350ms). Add entry/exit pairs for overlays. Define stagger patterns for lists. Include `prefers-reduced-motion` handling.
- **Expand component specs**: Document variants, sizes, states (default/hover/active/focus/disabled/loading), and slot anatomy (icon-left, label, icon-right, badge) for each component. Add usage guidance (when to use, when not to).
- **Add visual richness guidance**: Define gradient patterns (where, how subtle, direction). Specify multi-level shadow/elevation scale (4+ levels with actual CSS values). Document surface treatments (glass, noise texture, tinted backgrounds).
- **Document form patterns**: Specify form field anatomy (label, input, helper text, error text). Define states: empty, focused, filled, error, disabled, read-only. Include validation patterns and multi-step form guidance.
- **Define state patterns**: Create templates for empty states (icon + title + body + CTA), loading states (skeleton variants, shimmer, spinner), and error states (network, validation, permission, retry). Specify transitions between states.
- **Build spacing system**: Define a named spacing scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64). Document section-level composition rules. Add z-index scale. Add content density guidance.
- **Deepen accessibility**: Add focus management patterns (trap, restore, focus-visible styling). Include screen reader guidance (aria-live, landmarks). Document touch target exceptions. Add color-independent information guidance.
- **Define brand-to-visual mappings**: Map brand personality attributes to specific design decisions ("calm" → slow easing, muted palette; "trustworthy" → consistent radius, navy primary). Add UI copy tone examples. Define celebration/delight moments.
- **Add responsive/adaptive guidance**: Document orientation handling, dynamic type/font scaling, device-size tiers, keyboard avoidance patterns, and Capacitor-specific guidance.
- **Use tables for structured data**: Component specs, token tables, spacing scales, elevation levels. Consistent heading hierarchy (H2 sections, H3 subsections, H4 components).

---

## What You CANNOT Do

- Modify `auto/evaluate-design.py`, `src/index.css`, `docs/screen-flows.md`, `docs/masterplan.md`, or any other file
- Contradict `src/index.css` token values — your HSL values MUST match what's in the CSS (the harness cross-validates)
- Invent component names not in `src/components/ui/*.tsx` (informational flag — prefer documenting real components)
- Exceed 12,000 words (triggers diminishing-returns penalty via anti-gaming guard)
- Fall below 2,000 words (incomplete — triggers low word-count penalty)
- Create duplicate sections with >80% string similarity (detected and penalized)
- Use boilerplate copy-paste prose (detected via Jaccard similarity on 50+ word paragraphs)
- Add vague aspirational language without concrete values — sections with <20% actionable lines (lines containing px, ms, HSL, class name, or component name) are capped at 50% score contribution
- Add gradients, shadows, or animations to everything — the brand is "calm concierge," not "tech keynote"
- Use pure black (#000 or `0 0% 0%`) for dark mode backgrounds, gold/luxury accent colors, fonts below weight 300, or serif typefaces
- Remove existing specs that are already correct

---

## The Goal

**Maximize `design_score` as reported by `evaluate-design.py`.**

The harness has 12 scoring dimensions plus anti-gaming guards:

### Dimension 1: Token Architecture Depth (Weight: 1.3×)

Whether the doc defines a three-tier token hierarchy (primitive → semantic → component) covering color, spacing, typography, elevation, radius, opacity, and duration.

**0 anchor:** A flat table of 5-8 color tokens with raw HSL values.
**10 anchor:** Three explicit tiers. 8 token categories. 40+ individual tokens. Dark mode for each. Naming convention documented.

### Dimension 2: Dark Mode Completeness (Weight: 1.2×)

Whether every visual element has explicit dark-mode values. No placeholder dashes.

**0 anchor:** A `.dark` block with 3-4 variables. No component-level dark guidance.
**10 anchor:** Every token has a dark value. Dark-mode image/illustration, elevation, and component guidance. Testing checklist.

### Dimension 3: Animation & Motion System (Weight: 1.1×)

Motion guidance beyond a simple keyframe list. Easing curves, duration scale, entry/exit pairs, micro-interactions, reduced-motion.

**0 anchor:** A table of 3-5 named animations with duration only.
**10 anchor:** 3+ named easing curves with `cubic-bezier`. Duration scale. Entry/exit pairs for 4+ overlay types. Micro-interaction specs. `prefers-reduced-motion` handling.

### Dimension 4: Component Spec Coverage (Weight: 1.2×)

How many components are documented and how deeply each is specified.

**0 anchor:** 5 components with one-liner descriptions.
**10 anchor:** 20+ components, each with variants, sizes, states (hover/active/focus/disabled/loading), slot anatomy, and usage guidance.

### Dimension 5: Visual Richness & Depth (Weight: 1.3×)

Guidance for gradients, multi-level shadows, surface treatments, illustration style, image treatment. The "sterile to premium" dimension.

**0 anchor:** One shadow value. No gradients. No illustration guide.
**10 anchor:** 3+ gradient patterns. 4+ shadow/elevation levels with values. Surface treatment guidance. Illustration style guide. Image treatment rules.

### Dimension 6: Form & Input States (Weight: 1.0×)

Form element and form pattern documentation.

**0 anchor:** "Input: 48px height, rounded-xl."
**10 anchor:** Form field anatomy with states. 6+ form element types. Validation pattern. Multi-step form guidance. Form layout rules.

### Dimension 7: Empty, Loading & Error State Patterns (Weight: 1.0×)

Pattern library for non-happy-path states.

**0 anchor:** "Skeleton loading" mention. No empty/error patterns.
**10 anchor:** Empty state template with required elements. 3+ loading variants. 3+ error patterns. Visual specs with values. State transition guidance.

### Dimension 8: Spacing & Layout System (Weight: 0.9×)

Spacing scale and layout composition rules.

**0 anchor:** "8pt grid" with no scale.
**10 anchor:** 8+ spacing values mapped to tokens. Page templates. Z-index scale. Content density guidance. Scroll behavior.

### Dimension 9: Accessibility Beyond Contrast (Weight: 0.9×)

Accessibility depth beyond color contrast.

**0 anchor:** "WCAG AA required."
**10 anchor:** Focus management patterns. Screen reader guidance. Touch target exceptions. Color-independent information. Testing checklist.

### Dimension 10: Brand & Emotional Design Language (Weight: 1.0×)

Translating brand personality into concrete visual decisions.

**0 anchor:** One-line tone statement.
**10 anchor:** 3+ personality-to-design mappings. UI copy tone examples. Imagery direction. Celebration/delight moments. Anti-patterns list.

### Dimension 11: Responsive & Adaptive Patterns (Weight: 0.8×)

Device adaptation for a mobile-first app with desktop admin.

**0 anchor:** "Mobile-first" statement only.
**10 anchor:** Orientation handling. Dynamic type. Device-size tiers. Keyboard avoidance. Capacitor-specific guidance.

### Dimension 12: Documentation Structure & Navigability (Weight: 0.7×)

Document organization, heading hierarchy, consistency, cross-references.

**0 anchor:** Flat list with no structure.
**10 anchor:** H2 8+, H3 15+. Consistent component template. 3+ cross-references. 5+ tables. 3,000-8,000 word sweet spot.

---

## Anti-Gaming Guards

The harness applies these automatically. Understand them to avoid penalties:

1. **Word-count bell curve.** 3,000-8,000 words = full marks. Below 2,000 or above 12,000 = penalty. Don't inflate the doc with verbose prose.

2. **Specificity requirement.** Token/spec sub-checks require actual values (px, ms, HSL, hex, cubic-bezier, rem). "Use an appropriate shadow" without a value scores 0 for that sub-check. The harness counts lines matching `\d+px|\d+ms|\d+rem|hsl\(|#[0-9a-fA-F]{3,8}|cubic-bezier|rgba?\(`.

3. **Duplicate section detection.** H2/H3 headings with >80% Levenshtein similarity → -1 per duplicate.

4. **Coherence with `index.css`.** HSL token values in the guidelines are cross-checked against `src/index.css`. Each contradiction → -0.5 from final score.

5. **Boilerplate detection.** Any 50+ word paragraph appearing twice (Jaccard similarity >0.8) → -0.5 per instance.

6. **Actionability ratio.** Each section: count "actionable lines" (containing px, ms, color, class name, component name) vs total. If ratio < 0.2, that section's contribution is capped at 50%.

7. **Component cross-reference.** Components mentioned in `screen-flows.md` but absent from design-guidelines are flagged (informational — helps coverage but no direct penalty).

---

## Optimization Strategy

### High-impact moves (do first)

1. **D1 Token Architecture (1.3×) + D5 Visual Richness (1.3×):** These have the highest weights. Build a three-tier token system with actual values and add gradient/shadow/elevation specs with real CSS.
2. **D2 Dark Mode (1.2×) + D4 Components (1.2×):** Fill all dark mode placeholders and expand component specs to cover states, variants, and anatomy.
3. **D3 Animation (1.1×):** Add easing curves, duration scale, and entry/exit pairs.

### Medium-impact (do second)

4. **D6 Forms + D7 States + D10 Brand:** Form patterns, state templates, brand-to-design mappings.
5. **D8 Spacing + D9 Accessibility:** Spacing scale, z-index, focus management.

### Lower-impact (do last)

6. **D11 Responsive + D12 Structure:** Capacitor guidance, heading hierarchy.

### Key constraint

Every edit must use concrete values. The actionability ratio guard means: if you write a section about "Motion System" with 20 lines of prose and only 2 lines with actual cubic-bezier or ms values, that whole section is capped at 50% contribution. Lead with the specs, follow with brief rationale.

---

## Experiment Loop

```
repeat:
    1. Read docs/design-guidelines.md — re-anchor on current state
    2. Run:  python auto/evaluate-design.py --verbose
    3. Read output — note lowest-scoring dimensions and specific issues
    4. Edit docs/design-guidelines.md — target the weakest dimension
    5. Run:  python auto/evaluate-design.py --verbose
    6. If design_score improved:
         - git add docs/design-guidelines.md
         - git commit -m "exp(<tag>): <what changed> — design_score <old> → <new>"
         - Log to auto/design-results.tsv
       Else:
         - git checkout -- docs/design-guidelines.md   (revert)
         - Log the failed attempt to auto/design-results.tsv
    7. Continue
```

### Commit message format

```
exp(mar24): add three-tier token architecture — design_score 18.50 → 34.20
exp(mar24): expand component specs with states and anatomy — design_score 34.20 → 41.80
exp(mar24): REVERT: verbose motion prose lowered actionability ratio — design_score 41.80 → 39.10
```

### Logging (design-results.tsv)

Tab-separated, one row per experiment:

```
run	exp	design_score	d1_tokens	d2_dark	d3_motion	d4_components	d5_richness	d6_forms	d7_states	d8_spacing	d9_a11y	d10_brand	d11_responsive	d12_structure	gaming_penalty	css_penalty	notes
mar24	1	18.50	2.1	1.8	1.5	3.2	0.8	0.5	1.2	1.0	1.5	0.8	0.5	3.5	0.0	0.0	baseline
mar24	2	34.20	6.5	1.8	1.5	3.2	4.2	0.5	1.2	3.8	1.5	0.8	0.5	5.2	0.0	0.0	add three-tier tokens + spacing scale
```

---

## What a 10/10 Looks Like (Per Dimension)

For calibration, here's what maximum score requires for each dimension. You don't need to hit 10/10 everywhere — diminishing returns apply. Target 7+ on high-weight dimensions, 5+ on medium, 3+ on low.

### D1 (10/10): Token Architecture
Three explicit tiers (primitive/semantic/component) with headings or terms. 8 token categories (color, spacing, typography, elevation, radius, opacity, duration, z-index). 40+ token definitions in tables/lists. Dark mode column for each. Naming convention with examples.

### D2 (10/10): Dark Mode
Every color token has a dark value (zero `---` placeholders). Dark-mode image guidance. Dark elevation guidance. 5+ components with dark notes. Testing checklist.

### D3 (10/10): Motion
3+ easing curves with `cubic-bezier` values. Duration scale (3+ tiers with ms). `prefers-reduced-motion` guidance. 4+ entry/exit animation pairs. 3+ micro-interaction specs (toggle, switch, progress, etc).

### D4 (10/10): Components
20+ component headings. Most mention 3+ states. Most list variants AND sizes. Slot/anatomy descriptions. Usage "when to use" guidance.

### D5 (10/10): Visual Richness
3+ gradient definitions with color stops. 4+ shadow elevation levels with values. Surface treatment section (texture, glass, blur). Illustration style guide. Image treatment rules.

### D6 (10/10): Forms
5+ form field states documented. Validation pattern section. 6+ form element types. Form layout rules. Multi-step/wizard pattern.

### D7 (10/10): States
Empty state template with required elements. 3+ loading variants. 3+ error patterns. Visual specs with concrete values. State transition guidance.

### D8 (10/10): Spacing
8+ spacing values in a scale. Page layout templates. 4+ z-index levels. Density guidance. Scroll/overflow behavior.

### D9 (10/10): Accessibility
2+ focus management patterns. Screen reader guidance with aria. Touch target exceptions. Color-independent information. Testing tools/checklist.

### D10 (10/10): Brand
3+ personality-to-design mappings. 3+ UI copy examples. Imagery direction. Celebration moments. 3+ anti-pattern "don't" items.

### D11 (10/10): Responsive
Orientation handling. Font scaling. Device-size tiers. Keyboard avoidance. Capacitor/native guidance.

### D12 (10/10): Structure
8+ H2 headings, 15+ H3. 5+ components with same sub-heading pattern. 3+ cross-references. 5+ tables. 3,000-8,000 words.

---

## Common Pitfalls

1. **Prose bloat.** Writing paragraphs explaining why color matters instead of providing the color scale. The actionability guard will cap your score.
2. **Inventing tokens.** Adding HSL values that don't match `index.css`. The coherence check will deduct from your score.
3. **Section name gaming.** Creating "Shadow Tokens" and "Shadow Guidelines" as separate H3s. The duplicate detector will penalize.
4. **Copy-pasting component templates.** Identical prose across 20 components. The boilerplate detector catches this.
5. **Ignoring word count.** Going past 12,000 words trying to cover everything. Trim prose, keep specs.
6. **Wrong components.** Documenting `Tooltip` when it's not used in screens. Focus on components that appear in `screen-flows.md` first.
