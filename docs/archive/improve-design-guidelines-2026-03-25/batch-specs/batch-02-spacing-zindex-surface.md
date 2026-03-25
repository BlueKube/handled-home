# Batch 2: Spacing, Z-Index & Surface Utilities

## Phase
Phase 1: CSS Foundation & Utilities

## Why it matters
Consistent shadow elevation, gradient utilities, and z-index enforcement prevent visual inconsistencies across pages. The Tailwind config animation values must stay in sync with index.css to avoid subtle easing differences if components ever reference the Tailwind versions.

## Scope
1. **Sync Tailwind config animations** with index.css easings:
   - Update `tailwind.config.ts` animation values to use the same easing curves as index.css (or remove duplicates if they're unused)
   - `animate-slide-up` and `animate-scale-in` should reference the correct easings

2. **Verify shadow elevation scale**: Tailwind's default shadow values (shadow-sm through shadow-2xl) — confirm they're adequate or override in config to match the design guidelines' exact CSS values

3. **Add gradient utility classes** to `src/index.css` `@layer components`:
   - `.gradient-hero`: `linear-gradient(135deg, hsl(214 65% 14%) 0%, hsl(214 50% 22%) 100%)`
   - `.gradient-image-overlay`: `linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)`

4. **Verify existing utilities** match spec exactly:
   - `.glass` — `bg-card/80 backdrop-blur-xl border-border/50` ✓ (already correct)
   - `.press-feedback` — `active:scale-[0.98]` with transition ✓ (already correct)
   - `.safe-top` / `.safe-bottom` — env(safe-area-inset) ✓ (already correct)

## Non-goals
- Adding new spacing tokens beyond Tailwind defaults (8pt grid already maps to Tailwind's spacing scale)
- Changing z-index values (Tailwind defaults + z-[60] already match the design spec)
- Modifying component TSX files

## File targets
| Action | File |
|--------|------|
| Modify | `tailwind.config.ts` |
| Modify | `src/index.css` |

## Acceptance criteria
- [ ] Tailwind config animation easings synced with index.css easing custom properties
- [ ] `.gradient-hero` utility class exists with correct gradient
- [ ] `.gradient-image-overlay` utility class exists with correct gradient
- [ ] Existing utilities (`.glass`, `.press-feedback`, `.safe-top`, `.safe-bottom`) verified correct
- [ ] `npm run build` passes

## Regression risks
- Changing Tailwind animation config could affect components using Tailwind's `animate-*` classes
- Gradient classes could conflict with existing inline gradient styles

## Visual validation checklist
- [ ] Accordion expand/collapse still works (uses Tailwind's `animate-accordion-down/up`)
- [ ] Glass utility still renders correctly on tab bar
- [ ] Build produces no errors
