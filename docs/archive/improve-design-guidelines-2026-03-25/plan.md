# Implementation Plan: Design Guidelines Conformance

**PRD:** `docs/working/prd.md`
**Branch:** `claude/improve-design-guidelines-dtTVf`
**Total phases:** 6
**Total batches:** 24
**Estimated scope:** Large

---

## Phase 1: CSS Foundation & Utilities

**Goal:** Establish the CSS infrastructure that all subsequent component and page work depends on. Every animation, spacing, z-index, and accessibility utility must exist before components reference them.

**Dependencies:** None — this phase must be completed first.

### Batch 1: Motion System CSS (Small)
**Files:** `src/index.css`
**Scope:**
- Add `prefers-reduced-motion: reduce` media query that disables all transform/scale animations, replaces with opacity crossfade at 150ms, removes `.animate-shimmer` infinite loop (show static `bg-muted`), disables `.press-feedback` scale
- Add easing curve CSS custom properties: `--ease-default`, `--ease-out-expo`, `--ease-in-out`, `--ease-spring` with cubic-bezier values from design guidelines
- Verify all existing keyframe animations use correct durations and easings per the motion system spec

### Batch 2: Spacing, Z-Index & Surface Utilities (Small)
**Files:** `src/index.css`, `tailwind.config.ts`
- Verify z-index scale is enforced via Tailwind config (z-0, z-10, z-20, z-40, z-50, z-[60])
- Add shadow elevation scale as Tailwind extend if not present (shadow-none through shadow-2xl with exact CSS values from design guidelines)
- Add gradient utility classes if needed (hero-accent, skeleton-sweep, image-overlay, surface-fade)
- Verify `.glass`, `.press-feedback`, `.safe-top`, `.safe-bottom` utilities match spec exactly

### Batch 3: Accessibility Foundation CSS (Small)
**Files:** `src/index.css`, `src/App.tsx` or layout component
- Add skip-nav link (`z-[100]`, sr-only until focused, links to `#main-content`)
- Add `<main id="main-content">` landmark to page layout
- Add `<nav>` landmark wrapper around bottom tab bar components
- Add `<aside>` landmark around admin sidebar
- Verify `focus-visible` ring styles (`ring-2 ring-ring ring-offset-2`) are globally applied

---

## Phase 2: Component Conformance

**Goal:** Audit every UI component in `src/components/ui/` against its design guidelines spec. Fix missing states, accessibility attributes, dark mode overrides, and structural mismatches.

**Dependencies:** Phase 1 (CSS utilities must exist first).

### Batch 4: Interactive Components — Button, Card, Badge, Tabs (Medium)
**Files:** `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/tabs.tsx`
**Scope:**
- **Button:** Verify all 9 variants match spec; verify `active:scale-[0.97]` uses `var(--ease-default)` timing; verify `focus-visible:ring-2 ring-ring ring-offset-2`; verify loading spinner + disabled state
- **Card:** Verify 4 variants (default, interactive, glass, elevated); add `focus:ring-2 ring-ring` if missing; verify `disabled:opacity-60` state
- **Badge:** Verify 4 variants; verify `min-h` 24px, `rounded-full`, `px-3`, 13px text; add dark mode opacity-80% treatment if missing
- **Tabs:** Verify 44px height, `bg-muted rounded-xl` container, active `bg-card shadow-sm rounded-lg`; verify `focus:ring-2 ring-ring`; verify disabled `opacity-50`

### Batch 5: Form Components — Input, Textarea, Select, Checkbox, Switch, Radio, Label (Medium)
**Files:** `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`, `src/components/ui/select.tsx`, `src/components/ui/checkbox.tsx`, `src/components/ui/switch.tsx`, `src/components/ui/radio-group.tsx`, `src/components/ui/label.tsx`
**Scope:**
- **Input:** Verify h-12 (48px), rounded-xl, `focus-visible:ring-2 ring-ring`, `focus-visible:bg-card`, `border-destructive` error state via className override; verify `aria-describedby` support
- **Textarea:** Verify min-height 80px, same focus treatment as Input; verify `rounded-xl`; add hover `border-ring` if missing
- **Select:** Verify h-12, rounded-xl, `ring-2 ring-ring` on open; verify error state `border-destructive`; verify disabled `opacity-50`
- **Checkbox:** Verify 20×20px, `rounded-md`, checked `bg-primary` + check icon; verify `ring-2 ring-ring` on focus; verify disabled `opacity-50`
- **Switch:** Verify track 44×24px rounded-full; thumb 20px; off `bg-muted`, on `bg-primary`; verify focus ring
- **Radio:** Verify 20px circle, `border-2 border-input`, selected dot `bg-primary`; verify error `border-destructive`
- **Label:** Verify 14px/500 weight; verify required indicator support (red asterisk); verify error state `text-destructive`

### Batch 6: Overlay Components — Dialog, Sheet, Drawer, Popover, Tooltip (Medium)
**Files:** `src/components/ui/dialog.tsx`, `src/components/ui/sheet.tsx`, `src/components/ui/drawer.tsx`, `src/components/ui/popover.tsx`, `src/components/ui/tooltip.tsx`
**Scope:**
- **Dialog:** Verify overlay `bg-black/50`; verify `.animate-scale-in` entry; add focus trap verification; add focus restore on close; verify dark overlay increase to `rgba(0,0,0,0.7)` via `dark:` modifier; verify max-w-sm, rounded-2xl, p-6, shadow-lg
- **Sheet:** Verify `.animate-slide-up` 250ms entry; verify overlay `bg-black/50`; verify `rounded-t-2xl p-4 pb-safe`; verify max-height 85vh; add focus trap; add dark overlay `dark:bg-black/70`
- **Drawer:** Verify Vaul integration; verify `.animate-slide-up`; verify drag-to-dismiss behavior; add dark overlay
- **Popover:** Verify `.animate-scale-in` 200ms; verify `bg-popover rounded-xl shadow-lg p-4`; verify fade-out on close
- **Tooltip:** Verify 300ms hover delay; verify `bg-popover rounded-lg p-2 shadow-md` 13px; verify `.animate-scale-in`; verify focus → immediate show

### Batch 7: Display Components — Avatar, Progress, Skeleton, Alert, Accordion, Separator, ScrollArea (Medium)
**Files:** `src/components/ui/avatar.tsx`, `src/components/ui/progress.tsx`, `src/components/ui/skeleton.tsx`, `src/components/ui/alert.tsx`, `src/components/ui/accordion.tsx`, `src/components/ui/separator.tsx`, `src/components/ui/scroll-area.tsx`
**Scope:**
- **Avatar:** Verify size variants (32, 40, 48, 64px); verify fallback initials; verify loading `bg-muted` pulse; verify error → fallback; verify focus `ring-2 ring-ring`
- **Progress:** Verify 8px rounded-full track; verify `bg-primary` fill; verify determinate/indeterminate states; verify small 4px variant
- **Skeleton:** Verify `bg-muted rounded-xl`, `.animate-shimmer` 1.5s infinite; verify line/circle/card variants
- **Alert:** Verify `border-l-4`; verify variants (default, destructive, warning, success); verify icon + title + description anatomy
- **Accordion:** Verify h-12 trigger; verify ChevronDown rotation on expand; verify `py-3` content; verify animate-height
- **Separator:** Verify 1px `bg-border`; verify vertical variant
- **ScrollArea:** Verify 4px scrollbar, `bg-muted` track, `bg-muted-foreground/30` thumb

### Batch 8: Composite Components — EmptyState, StatCard, PageSkeleton, Toast/Sonner (Medium)
**Files:** `src/components/ui/empty-state.tsx`, `src/components/StatCard.tsx`, `src/components/PageSkeleton.tsx`, `src/components/ui/sonner.tsx` (or `toast.tsx`/`toaster.tsx`)
**Scope:**
- **EmptyState:** Verify anatomy (40px icon → `.text-h3` title → `.text-body text-muted-foreground` body → CTA button); verify centered flex-col, gap-3, p-8; verify `role="status"`
- **StatCard:** Verify icon with `bg-accent/10 rounded-full`; verify value + label + trend; verify compact variant
- **PageSkeleton:** Verify shimmer animation; verify variants (stats, list, page); verify shapes match expected content
- **Toast/Sonner:** Add `aria-live="polite"` on toast container if missing; verify `rounded-2xl, p-4`; verify variants (default, destructive, success); add dark mode `bg-card` with `border-border`; verify top-center positioning

---

## Phase 3: Dark Mode Polish

**Goal:** Implement all dark mode component-specific overrides and elevation model from the design guidelines. This goes beyond token switching to handle shadows, borders, image treatment, and overlay opacity.

**Dependencies:** Phase 2 (components must be conformant before applying dark overrides).

### Batch 9: Dark Elevation & Card Borders (Small)
**Files:** `src/index.css`, `src/components/ui/card.tsx`
**Scope:**
- Implement dark elevation model: reduce shadow opacity to 40% of light values in `.dark` context
- Add visible card borders in dark mode (`dark:border-border`) since shadow-only differentiation fails
- Verify `bg-card` surfaces are visibly distinct from `bg-background` in dark mode (4% luminance difference)

### Batch 10: Dark Overlay & Image Treatment (Small)
**Files:** `src/index.css`, `src/components/ui/dialog.tsx`, `src/components/ui/sheet.tsx`, `src/components/ui/drawer.tsx`
**Scope:**
- Increase dialog/sheet/drawer overlay opacity in dark mode: `dark:bg-black/70` (from default `bg-black/50`)
- Add CSS utility for dark image treatment: `brightness(0.85)` filter on photos in dark mode
- Add skeleton shimmer dark mode adjustment (sweep from `--muted` 214 50% 18% to ~4% brighter)
- Verify toast readability in dark mode (add `dark:border-border` if needed)

### Batch 11: Dark Component Overrides Sweep (Small)
**Files:** Various `src/components/ui/*.tsx` files
**Scope:**
- **Badge:** Add `dark:bg-opacity-80` or equivalent to reduce oversaturation
- **Tab bar (BottomTabBar):** Verify glass blur works in dark; adjust opacity to `bg-card/85`
- **Navigation sidebar (admin):** Verify `--sidebar-background` is darker than page background (214 65% 6%)
- **Input:** Verify `bg-input` visually shifts in dark mode via token
- Test all overrides against the dark mode testing checklist from design guidelines

---

## Phase 4: Accessibility Hardening

**Goal:** Implement all accessibility patterns from the design guidelines: focus management, screen reader support, landmarks, color-independent status, and ARIA attributes.

**Dependencies:** Phase 2 (component conformance must be done first).

### Batch 12: Focus Management — Trap & Restore (Medium)
**Files:** `src/components/ui/dialog.tsx`, `src/components/ui/sheet.tsx`, `src/components/ui/drawer.tsx`, `src/components/ui/popover.tsx`
**Scope:**
- Verify Radix UI's built-in focus trap is active and not overridden in Dialog, Sheet, Popover
- Verify focus restore: when overlay closes, focus returns to the trigger element
- Verify Tab key cycles through focusable children within overlays
- Verify Escape key closes all overlay components
- Test with keyboard-only navigation

### Batch 13: ARIA & Screen Reader (Medium)
**Files:** `src/components/ui/sonner.tsx`, `src/components/ui/form.tsx`, various page files
**Scope:**
- Add `aria-live="polite"` on toast/notification container
- Ensure all form error messages use `role="alert"` via the Form component's FormMessage
- Add `aria-describedby` linking inputs to their helper/error text
- Verify all icon-only buttons have `aria-label` (back buttons with `ChevronLeft`, close buttons with `X`)
- Add `sr-only` labels where needed for visually hidden but screen-reader-accessible content

### Batch 14: Color-Independent Status & Landmarks (Small)
**Files:** Various component and page files
**Scope:**
- Audit all status indicators (badges, alerts, toasts) to ensure color is never the sole indicator — pair with icons
- Verify `<main id="main-content">` landmark exists in customer/provider layout
- Verify `<nav>` landmark on bottom tab bar
- Verify `<aside>` on admin sidebar
- Verify tab order follows visual flow on key pages (Dashboard, Jobs, Routine)

---

## Phase 5: Page-Level Conformance

**Goal:** Audit and fix every customer and provider page to follow the page template patterns, consistent padding, animation, back navigation, and spacing from the design guidelines. Admin pages get a lighter touch (spacing/a11y only).

**Dependencies:** Phases 1–4 (all foundations must be in place).

### Batch 15: Customer Dashboard & Core Tabs (Medium)
**Files:** `src/pages/customer/Dashboard.tsx`, `src/pages/customer/Schedule.tsx`, `src/pages/customer/Routine.tsx`, `src/pages/customer/Activity.tsx`
**Scope:**
- Verify **Dashboard** follows dashboard template: `.text-h2` greeting → stat cards → action cards → activity list
- Verify **Schedule** follows list template: `.text-h2` → filter tabs → ScrollArea list gap-3 → `pb-24`
- Verify **Routine** follows the correct template
- Verify **Activity** follows list template
- All must have: `animate-fade-in` on mount, `p-4 pb-24` padding, semantic color tokens only, no `max-w-*` constraints

### Batch 16: Customer Detail & Form Pages (Medium)
**Files:** `src/pages/customer/Property.tsx`, `src/pages/customer/PropertySizing.tsx`, `src/pages/customer/Plans.tsx`, `src/pages/customer/PlanDetail.tsx`, `src/pages/customer/ServiceDay.tsx`, `src/pages/customer/Services.tsx`
**Scope:**
- Verify **detail pages** follow: back button (`ChevronLeft` with `aria-label`) + `.text-h2` → hero card → info sections gap-4 → sticky CTA
- Verify **form pages** follow: back + `.text-h2` → fields gap-5 → sticky submit with `pb-safe`
- Verify **list pages** follow list template
- All must have: `animate-fade-in`, `p-4 pb-24`, correct heading hierarchy

### Batch 17: Customer Billing, Support & Settings Pages (Medium)
**Files:** `src/pages/customer/Billing.tsx`, `src/pages/customer/BillingHistory.tsx`, `src/pages/customer/BillingMethods.tsx`, `src/pages/customer/BillingReceipt.tsx`, `src/pages/customer/Issues.tsx`, pages in `src/pages/customer/` related to support and settings
**Scope:**
- Verify all billing pages follow detail/list templates
- Verify support pages (Support, New Ticket, Ticket List, Ticket Detail) follow correct templates
- Verify Settings page follows form template
- Verify More menu has correct spacing and navigation patterns
- Check back navigation patterns on all sub-pages

### Batch 18: Customer Remaining Pages (Medium)
**Files:** All remaining `src/pages/customer/*.tsx` not covered in batches 15–17 (CoverageMap, HomeAssistant, Referrals, RecommendProvider, OnboardingWizard, PhotoTimeline, etc.)
**Scope:**
- Audit every remaining customer page against its appropriate template (list/detail/form/dashboard)
- Fix `animate-fade-in`, padding (`p-4 pb-24`), heading hierarchy, back navigation
- Verify onboarding wizard follows multi-step form pattern (Progress bar, step transitions, back navigation)
- Verify empty states use EmptyState component with icon + title + body + CTA

### Batch 19: Provider Dashboard & Core Tabs (Medium)
**Files:** `src/pages/provider/Dashboard.tsx`, `src/pages/provider/Jobs.tsx`, `src/pages/provider/Earnings.tsx`, `src/pages/provider/Performance.tsx`
**Scope:**
- Verify **Dashboard** follows dashboard template
- Verify **Jobs** follows list template with filter tabs
- Verify **Earnings** follows dashboard/detail hybrid
- Verify **Performance** (Score tab) follows dashboard template
- All must have: `animate-fade-in`, `p-4 pb-24`, semantic tokens, no `max-w-*`

### Batch 20: Provider Detail & Form Pages (Medium)
**Files:** `src/pages/provider/JobDetail.tsx`, `src/pages/provider/JobChecklist.tsx`, `src/pages/provider/JobPhotos.tsx`, `src/pages/provider/JobComplete.tsx`, `src/pages/provider/History.tsx`
**Scope:**
- Verify job flow pages follow detail template with back navigation
- Verify JobChecklist and JobPhotos follow form/interaction templates
- Verify JobComplete follows confirmation template with celebration moment
- Verify History follows list template

### Batch 21: Provider Remaining Pages (Medium)
**Files:** All remaining `src/pages/provider/*.tsx` (Onboarding steps, Coverage, Availability, Organization, Settings, Support, BYOC, Referrals, etc.)
**Scope:**
- Audit every remaining provider page against its template
- Verify onboarding steps follow multi-step form pattern
- Verify settings/management pages follow form template
- Fix padding, animation, back navigation, empty states

### Batch 22: Admin Pages — Spacing & A11y Sweep (Large)
**Files:** All 60 `src/pages/admin/*.tsx`
**Scope:**
- Admin uses different standards: `p-6` padding, `max-w-*` OK, no `pb-24`, desktop sidebar layout
- Verify `animate-fade-in` on main containers
- Verify `.text-h2` page titles
- Verify `ChevronLeft` back navigation on detail pages with `aria-label`
- Verify semantic color tokens (no hardcoded colors)
- Verify responsive grids (`lg:grid-cols-*`)
- Lighter touch than customer/provider — focus on consistency, not template restructuring

---

## Phase 6: Validation, Documentation Sync & Cleanup

**Goal:** Final build validation, visual verification, and documentation sync across all six north star documents.

**Dependencies:** All previous phases.

### Batch 23: Build Validation & Visual Spot-Check (Small)
**Scope:**
- Run `npm run build` — must pass with zero TypeScript errors
- Run `npx tsc --noEmit` for type-check verification
- Take Playwright screenshots of key pages (customer Dashboard, provider Dashboard, admin Dashboard) in both light and dark mode
- Verify screenshots against design guidelines specs
- Fix any build errors or visual regressions discovered

### Batch 24: Documentation Sync (Small)
**Files:** `docs/design-guidelines.md`, `docs/screen-flows.md`, `docs/app-flow-pages-and-roles.md`, `docs/feature-list.md`, `docs/masterplan.md`, `docs/operating-model.md`
**Scope:**
- Sync all six north star documents with any changes made during implementation
- Update `docs/design-guidelines.md` if any specs were discovered to be incorrect during implementation
- Update `docs/feature-list.md` with accessibility and dark mode improvements
- Verify `docs/screen-flows.md` component references still match after any component renames
- Archive `docs/working/` to `docs/archive/`

---

## Risk Areas

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Each batch is reviewed before moving on; changes are styling/a11y only, not logic |
| Admin page count (60 pages) | Batch 22 is a lighter sweep — consistency fixes, not template restructuring |
| Component changes affecting many pages | Phase 2 changes are additive (adding states/attributes), not restructuring |
| Build failures from TypeScript | Run `npx tsc --noEmit` after each batch |
| Dark mode overrides conflicting with light | Use `dark:` Tailwind prefix exclusively, never conditional JS |

## Deferred Items

- Capacitor native integration (haptics, splash screen, status bar)
- Playwright E2E tests for accessibility
- Lighthouse a11y audit automation
- Dynamic type / font scaling beyond current rem setup
- Pull-to-refresh implementation
- Horizontal snap carousel implementation

---

## Progress Tracker

| Phase | Batch | Status | Notes |
|-------|-------|--------|-------|
| 1 | 1: Motion CSS | ✅ | Pushed. 2 SHOULD-FIX resolved in fix commit. |
| 1 | 2: Spacing/Z-Index/Surface | ✅ | Pushed. Clean review — 0 findings. |
| 1 | 3: A11y Foundation CSS | ✅ | Pushed. Clean review — 0 findings. |
| 2 | 4: Button/Card/Badge/Tabs | ✅ | Pushed. Clean review — 0 findings. Button verified no changes needed. |
| 2 | 5: Form Components | ✅ | Pushed. 1 SHOULD-FIX resolved (textarea transition). |
| 2 | 6: Overlay Components | ✅ | Pushed. 2 SHOULD-FIX resolved (alert-dialog sync, command palette width). |
| 2 | 7: Display Components | ✅ | Pushed. Clean review — 0 findings. |
| 2 | 8: Composite Components | ✅ | Pushed. Clean review — 0 findings. |
| 3 | 9: Dark Elevation & Borders | ✅ | Pushed. 1 MUST-FIX resolved (layer specificity). |
| 3 | 10: Dark Overlay & Images | ✅ | Pushed. Clean review — 0 findings. |
| 3 | 11: Dark Component Sweep | ✅ | Pushed. Clean review — 0 findings. |
| 4 | 12: Focus Trap & Restore | ✅ | Pushed. Verification only — Radix handles focus. |
| 4 | 13: ARIA & Screen Reader | ✅ | Pushed. 1 MUST-FIX resolved (conditional role=alert). |
| 4 | 14: Color-Independent Status | ✅ | Pushed. Verification only — landmarks done in Batch 3. |
| 5 | 15: Customer Dashboard & Tabs | ✅ | Pushed. 1 MUST-FIX resolved (Routine CTA max-w). |
| 5 | 16: Customer Detail & Forms | ✅ | Pushed. Bulk sweep — 26 files fixed. |
| 5 | 17: Customer Billing/Support | ✅ | Pushed. Part of 16-18 sweep. |
| 5 | 18: Customer Remaining | ✅ | Pushed. Part of 16-18 sweep. |
| 5 | 19: Provider Dashboard & Tabs | ✅ | Pushed. 4 files fixed. |
| 5 | 20: Provider Detail & Forms | ✅ | Pushed. Part of 19-21 sweep. |
| 5 | 21: Provider Remaining | ✅ | Pushed. Part of 19-21 sweep. |
| 5 | 22: Admin Sweep | ✅ | Pushed. 1 page fixed (OpsExceptions). Rest verified. |
| 6 | 23: Build Validation | ⬜ | |
| 6 | 24: Doc Sync & Archive | ⬜ | |
