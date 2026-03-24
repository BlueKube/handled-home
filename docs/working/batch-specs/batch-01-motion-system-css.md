# Batch 1: Motion System CSS

## Phase
Phase 1: CSS Foundation & Utilities

## Why it matters
The motion system is referenced by every component and page in the app. Without `prefers-reduced-motion` handling, users with vestibular disorders experience discomfort. Without standardized easing curves as CSS custom properties, components can't reference them consistently. This batch lays the animation foundation for all subsequent work.

## Scope
1. Add easing curve CSS custom properties to `:root` in `src/index.css`:
   - `--ease-default: cubic-bezier(0.25, 0.1, 0.25, 1.0)`
   - `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)`
   - `--ease-in-out: cubic-bezier(0.42, 0, 0.58, 1)`
   - `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)`

2. Update existing keyframe animations to use correct easings:
   - `.animate-fade-in`: change `ease-out` → `var(--ease-default)` (design spec: ease-default)
   - `.animate-slide-up`: change `ease-out` → `var(--ease-out-expo)` (design spec: ease-out-expo for entry animations)
   - `.animate-scale-in`: change `ease-out` → `var(--ease-out-expo)` (design spec: ease-out-expo for entry animations)
   - `.animate-shimmer`: keep `ease-in-out` (matches spec)
   - `.press-feedback`: keep `duration-100` (matches "Instant" tier 100ms)

3. Add `@media (prefers-reduced-motion: reduce)` block that:
   - Replaces `.animate-fade-in` with opacity-only crossfade at 150ms (no translateY)
   - Replaces `.animate-slide-up` with opacity-only crossfade at 150ms (no translateY)
   - Replaces `.animate-scale-in` with opacity-only crossfade at 150ms (no scale)
   - Removes `.animate-shimmer` infinite loop — show static `bg-muted` (animation: none)
   - Disables `.press-feedback` scale — remove `active:scale-[0.98]` (transform: none !important on active)
   - Keeps functional motion (progress bars, spinners) — no blanket `animation: none *`

## Non-goals
- Changing any component TSX files (that's Phase 2)
- Adding duration scale CSS custom properties (not needed — durations are inline in each animation)
- Modifying `tailwind.config.ts` (that's Batch 2)
- Adding gradient or surface utilities (Batch 2)

## File targets
| Action | File |
|--------|------|
| Modify | `src/index.css` |

## Acceptance criteria
- [ ] Four easing curve custom properties defined in `:root`
- [ ] `.animate-fade-in` uses `var(--ease-default)`
- [ ] `.animate-slide-up` uses `var(--ease-out-expo)`
- [ ] `.animate-scale-in` uses `var(--ease-out-expo)`
- [ ] `.animate-shimmer` keeps `ease-in-out` (already correct)
- [ ] `@media (prefers-reduced-motion: reduce)` block exists
- [ ] Reduced motion: `.animate-fade-in` → opacity-only 150ms
- [ ] Reduced motion: `.animate-slide-up` → opacity-only 150ms
- [ ] Reduced motion: `.animate-scale-in` → opacity-only 150ms
- [ ] Reduced motion: `.animate-shimmer` → `animation: none`
- [ ] Reduced motion: `.press-feedback` → no scale transform on active
- [ ] Reduced motion does NOT disable spinner animations or progress bars
- [ ] `npm run build` passes

## Regression risks
- Animations could look different if easing curve custom properties don't render correctly in all browsers (CSS custom properties in `animation` shorthand)
- `!important` in reduced-motion could override intentional inline styles

## Visual validation checklist
- [ ] Page transitions still animate smoothly in normal mode
- [ ] Bottom sheets still slide up
- [ ] Skeleton shimmer still works
- [ ] Press feedback still scales buttons/cards
- [ ] With `prefers-reduced-motion: reduce` enabled: no translateY/scale animations, only opacity fades
