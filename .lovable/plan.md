

# Core UI Component Upgrade — Mobile-Native Polish

## Goal
Upgrade all foundational UI components with modern mobile-native design patterns: elevated cards with subtle glass effects, touch-optimized buttons with active states, refined inputs with floating labels, animated loading skeletons, and polished status indicators. Update the design guidelines doc to match.

---

## 1. Button Component Upgrade (`src/components/ui/button.tsx`)

Enhance with mobile-native sizing and touch feedback:
- Default height increased to 44px (matching iOS HIG minimum tap target)
- New `xl` size at 52px for primary CTAs
- Active press state: `active:scale-[0.97]` with 100ms transition
- `accent` variant added: teal background for primary actions
- `soft` variant: subtle background tints for secondary actions (e.g., soft-destructive, soft-accent)
- Loading spinner support: optional `loading` prop that shows a spinner and disables the button
- All variants get `rounded-xl` (14px) for a softer, more modern feel

---

## 2. Card Component Upgrade (`src/components/ui/card.tsx`)

Modern card with subtle depth and touch interaction:
- Default card gets a softer shadow (`shadow-sm` to `shadow-[0_1px_3px_rgba(0,0,0,0.06)]`) and `rounded-2xl`
- New `interactive` variant: adds `active:scale-[0.98]` press feedback + slightly elevated shadow on press
- New `glass` variant: translucent background with backdrop-blur for overlays/modals (light: `bg-white/80 backdrop-blur-xl`, dark: `bg-card/80 backdrop-blur-xl`)
- New `elevated` variant: stronger shadow for floating cards
- Card padding adjusted to 16px (mobile-optimized, down from 24px)
- `CardHeader` padding adjusted to `p-4 pb-2` and `CardContent` to `px-4 pb-4`
- Subtle border-radius gradient effect option via className

---

## 3. Input Component Upgrade (`src/components/ui/input.tsx`)

Touch-optimized inputs:
- Height increased to 48px (`h-12`) as default
- Border radius to `rounded-xl` (14px)
- Focus state: accent-colored ring (`ring-accent`) instead of default ring
- Subtle background shift on focus (`bg-background` to `bg-card`)
- Transition on all interactive states (150ms)
- Placeholder styling: lighter weight, slightly larger

---

## 4. New StatCard Component (`src/components/StatCard.tsx`)

Dashboard metric card used across all roles:
- Icon with tinted background circle (e.g., teal icon on teal/10 bg)
- Large numeric value with optional animated counter
- Label text below
- Optional trend indicator (up/down arrow with green/red color + percentage)
- Touch-interactive with press feedback
- Compact variant for inline stat rows

---

## 5. New PageSkeleton Component (`src/components/PageSkeleton.tsx`)

Branded loading states:
- Skeleton variant for stat cards (row of 2 rounded rectangles)
- Skeleton variant for list items (icon + two text lines)
- Skeleton variant for full page (header + stat row + list)
- Uses existing `Skeleton` primitive with shimmer animation upgrade
- Shimmer animation: gradient sweep from left to right (replaces plain pulse)

---

## 6. Skeleton Shimmer Animation (`src/components/ui/skeleton.tsx` + `src/index.css`)

Upgrade the plain pulse to a shimmer sweep:
- Add `@keyframes shimmer` in `index.css`: linear gradient that moves across
- Update Skeleton component to use `animate-shimmer` class
- Background: `bg-gradient-to-r from-muted via-muted-foreground/5 to-muted`

---

## 7. Badge / StatusBadge Polish (`src/components/StatusBadge.tsx`)

- Add a subtle dot indicator before the label text (colored circle matching status)
- Slightly larger padding for mobile touch (min-height 28px)
- Pill shape consistent across all variants

---

## 8. Bottom Tab Bar Polish (`src/components/BottomTabBar.tsx`)

- Add subtle top shadow/border for depth separation
- Active tab: teal dot indicator below the icon (instead of just color change)
- Slight icon scale animation on tap (`active:scale-90` with spring-like timing)
- Glass effect background: `bg-card/90 backdrop-blur-lg` for a modern floating feel

---

## 9. Toast / Notification Upgrade (`src/components/ui/toast.tsx`)

- Rounded corners increased to `rounded-2xl`
- Add success variant (green border/icon)
- Position moved to top-center for mobile (no bottom overlap with tab bar)
- Compact padding for mobile: `p-4` instead of `p-6`
- Swipe-to-dismiss already supported by Radix

---

## 10. CSS Design Tokens & Animations (`src/index.css`)

Add new animation utilities:
- `@keyframes shimmer` for skeleton loading
- `@keyframes slideUp` for bottom sheets and modals
- `@keyframes scaleIn` for popover/dialog entry
- `.animate-shimmer`, `.animate-slide-up`, `.animate-scale-in` utility classes
- Typography utility classes: `.text-h1`, `.text-h2`, `.text-h3`, `.text-body`, `.text-caption`
- `.glass` utility: `bg-card/80 backdrop-blur-xl border-white/20`

---

## 11. Tailwind Config Updates (`tailwind.config.ts`)

- Add shimmer, slideUp, scaleIn keyframes and animations
- Remove sidebar-specific color tokens (no longer used)
- Remove container/screens config (mobile-only, no breakpoint containers)

---

## 12. Design Guidelines Update (`docs/design-guidelines.md`)

Replace the existing document with updated mobile-native guidelines reflecting all changes:
- Mobile-only platform specification
- Updated component specs (card radius, button heights, input heights)
- New component inventory (StatCard, PageSkeleton, glass variants)
- Animation/motion spec with keyframe names
- Removed: desktop/keyboard navigation references, sidebar references
- Added: safe area handling, bottom tab bar spec, touch target requirements

---

## Technical Summary

### Files to create:
- `src/components/StatCard.tsx` — Metric card with icon, value, trend
- `src/components/PageSkeleton.tsx` — Loading skeleton layouts

### Files to modify:
- `src/components/ui/button.tsx` — New sizes, variants, loading prop, touch feedback
- `src/components/ui/card.tsx` — Glass/elevated/interactive variants, mobile padding
- `src/components/ui/input.tsx` — 48px height, accent ring, rounded-xl
- `src/components/ui/skeleton.tsx` — Shimmer animation
- `src/components/ui/toast.tsx` — Mobile positioning, rounded-2xl, compact padding
- `src/components/StatusBadge.tsx` — Dot indicator, larger touch target
- `src/components/BottomTabBar.tsx` — Glass background, active dot, tap animation
- `src/index.css` — Shimmer/slideUp/scaleIn keyframes, typography utilities, glass utility
- `tailwind.config.ts` — New animations, remove sidebar tokens and container config
- `docs/design-guidelines.md` — Full rewrite for mobile-native specs

### No new dependencies needed
All enhancements use Tailwind CSS, CSS keyframes, and existing Radix primitives.
