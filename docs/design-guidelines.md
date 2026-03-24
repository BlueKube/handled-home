# Design Guidelines — Handled Home (Mobile-Native)

## Platform and Responsive Behavior

Mobile-first iOS & Android app via Capacitor. Admin uses desktop sidebar layout. See `docs/app-flow-pages-and-roles.md` for routes.

### device tiers

| Tier | Width | Example | Adjustments |
|------|-------|---------|-------------|
| Compact | 320–375px | iPhone SE | Reduce `p-4` to `p-3`, stack horizontal layouts |
| Regular | 376–428px | iPhone 15 (390px) | **Design target** — all specs reference this tier |
| Max | 429–480px | iPhone 15 Pro Max | Extra breathing room, no changes needed |

### orientation and keyboard

- Lock customer/provider to portrait via Capacitor `Screen.lock({ orientation: 'portrait' })`
- Admin: landscape sidebar + content, min-width 1024px
- Keyboard avoidance: Capacitor `Keyboard.setResizeMode({ mode: 'native' })`; scroll focused input into view with `scrollIntoView({ behavior: 'smooth', block: 'center' })`
- Bottom-docked CTAs shift above keyboard; use `pb-safe`

### native integration (Capacitor)

- Safe areas: `.safe-top` → `env(safe-area-inset-top)` for notch; `.safe-bottom` for home indicator
- Status bar: light-content on dark backgrounds, dark-content on light
- Haptic feedback: `Haptics.impact({ style: 'light' })` on press, `medium` on toggle
- Splash screen: navy `--primary` background, auto-hide after mount
- Dynamic type: base 16px, respect iOS font scaling, maximum-scale 1.4×
- Font scaling: all typography uses rem internally; 13px (`.text-caption`) is absolute minimum

---

## Brand and Emotional Design

Brand personality: **calm concierge** — confident, kind, predictable. Tagline: "Your home, handled." See `docs/masterplan.md` for full business context.

### personality → design mappings

| Trait | Design Decision | Implementation |
|-------|----------------|----------------|
| **Calm** | Slow easing, muted navy palette, minimal motion | `cubic-bezier(0.25, 0.1, 0.25, 1.0)` default easing; `--primary` navy not saturated |
| **Competent** | Consistent radius, clear hierarchy, structured spacing | `rounded-xl` on inputs/buttons, `rounded-2xl` on cards; 8px grid |
| **Trustworthy** | Navy primary conveys authority; proof-of-work photos | `bg-primary` for CTAs; before/after image pairs in service detail |
| **Kind** | Warm success copy, gentle error language, rounded shapes | "We'll take care of it" not "Error occurred"; `rounded-full` badges |
| **Premium** | Generous whitespace, Inter 300–700, glass surfaces | `p-4` card padding; `.glass` backdrop-blur-xl; Inter font stack |

### copy tone examples

- **Success toast**: "Service confirmed — your lawn is on the schedule."
- **Error toast**: "We couldn't save that change. Check your connection and try again."
- **Empty state**: "No services yet. Let's get your home set up."
- **Confirmation dialog**: "Cancel this service? You can re-add it anytime from your plan."
- **Notification**: "Your pool service is complete. View the proof-of-work photos."

### imagery direction

- Photography: warm, natural lighting; residential settings; no stock-photo feel
- Illustration: Lucide icons at 24px with 1.5px stroke width; `bg-accent/10 rounded-full` containers
- Icon sizes: 16px inline, 20px in buttons, 24px standalone, 40px in empty states
- Spot illustrations for empty states: single-color line art in `text-muted-foreground`

### celebration moments

- **Service completion**: success toast + checkmark icon, `.animate-scale-in` 200ms
- **Plan activation**: milestone card with accent border, `bg-accent/5` tint
- **Onboarding complete**: achievement icon 48px + congratulations copy

### brand anti-patterns

- Never use aggressive language — avoid "URGENT", "ACT NOW", "Don't miss out"
- Never use `bg-destructive` for non-destructive actions — red is reserved for errors/deletes
- Do not show raw error codes or stack traces to users
- Avoid dense data tables in customer screens — use StatCard summaries instead
- Never auto-play video or sound — the app feels quiet and controlled

---

## Typography
Font: Inter  
- H1: 32px / 700 weight — `.text-h1`
- H2: 24px / 700 — `.text-h2`
- H3: 18px / 650 — `.text-h3`
- Body: 16px / 450–500 — `.text-body`
- Caption: 13px / 500 — `.text-caption`

Line-height ≥ 1.5×

---

## Color System (HSL tokens)

All colors use CSS custom properties via `hsl(var(--name))` — defined in `src/index.css`. Naming convention: `--{category}-{role}`, e.g. `--card-foreground`, `--sidebar-primary-foreground`, `--destructive-foreground`.

Semantic usage: `bg-background` for page surface, `bg-card` for raised surfaces, `bg-popover` for overlays, `text-foreground` for headings/body, `text-muted-foreground` for captions and helper text, `bg-primary` for default buttons, `bg-accent` for CTAs and `--ring` focus indicator, `bg-destructive` for errors, `bg-success` for confirmations, `bg-warning` for advisory alerts, `border-border` for dividers, `border-input` for form field borders.

### Primitive color tokens

Three-tier architecture: **primitive** (raw values below) → **semantic** (purpose aliases like `bg-background`, `text-foreground`) → **component** (scoped overrides like `--sidebar-*`).

| Token | Light | Dark |
|-------|-------|------|
| `--background` | 220 20% 97% | 214 65% 8% |
| `--foreground` | 214 65% 14% | 220 20% 95% |
| `--card` | 0 0% 100% | 214 55% 12% |
| `--card-foreground` | 214 65% 14% | 220 20% 95% |
| `--popover` | 0 0% 100% | 214 55% 12% |
| `--popover-foreground` | 214 65% 14% | 220 20% 95% |
| `--primary` | 214 65% 14% | 200 80% 50% |
| `--primary-foreground` | 0 0% 100% | 214 65% 8% |
| `--secondary` | 220 20% 95% | 214 50% 18% |
| `--secondary-foreground` | 214 65% 14% | 220 20% 95% |
| `--muted` | 220 14% 93% | 214 50% 18% |
| `--muted-foreground` | 215 16% 47% | 215 20% 65% |
| `--accent` | 200 80% 50% | 200 80% 50% |
| `--accent-foreground` | 0 0% 100% | 0 0% 100% |
| `--destructive` | 0 72% 51% | 0 63% 31% |
| `--destructive-foreground` | 0 0% 100% | 220 20% 95% |
| `--success` | 142 72% 37% | 142 72% 37% |
| `--success-foreground` | 0 0% 100% | 0 0% 100% |
| `--warning` | 38 92% 50% | 38 92% 50% |
| `--warning-foreground` | 214 65% 14% | 214 65% 14% |
| `--border` | 225 14% 91% | 214 50% 22% |
| `--input` | 225 14% 91% | 214 50% 22% |
| `--ring` | 200 80% 50% | 200 80% 50% |
| `--radius` | 0.75rem | 0.75rem |

### Component-scoped tokens (sidebar)

| Token | Light | Dark |
|-------|-------|------|
| `--sidebar-background` | 214 65% 14% | 214 65% 6% |
| `--sidebar-foreground` | 220 20% 90% | 220 20% 90% |
| `--sidebar-primary` | 200 80% 50% | 200 80% 50% |
| `--sidebar-primary-foreground` | 0 0% 100% | 0 0% 100% |
| `--sidebar-accent` | 214 55% 20% | 214 55% 15% |
| `--sidebar-accent-foreground` | 220 20% 95% | 220 20% 95% |
| `--sidebar-border` | 214 50% 22% | 214 50% 15% |

WCAG AA compliance required (4.5:1 body text, 3:1 large text 18px+).

---

## Dark Mode

Applied via `.dark` class on `<html>`. All token values above include explicit dark columns from `src/index.css`.

### dark elevation model

In dark mode, elevation uses surface luminance (lighter = higher) rather than shadow depth. Reduce shadow opacity to 40% of light values.

| Level | Surface | Light treatment | Dark treatment |
|-------|---------|----------------|----------------|
| 0 — Base | `bg-background` | none | `--background` 214 65% 8% |
| 1 — Raised | `bg-card` | shadow-sm | `--card` 214 55% 12% — 4% lighter than base |
| 2 — Overlay | `bg-popover` | shadow-md | `--popover` 214 55% 12% + `border-border` for definition |
| 3 — Sidebar | `--sidebar-background` | none | 214 65% 6% — darker than base for contrast |

### dark image and illustration guidance

- Apply `brightness(0.85)` filter on photos to reduce glare against dark surfaces
- Desaturate illustrations by ~10% — vivid colors clash with muted dark backgrounds
- Overlay `rgba(0,0,0,0.15)` dimming layer on hero images
- Skeleton shimmer: sweep from `--muted` to 4% lighter (214 50% 22%)

### dark component-specific overrides

- **Button** (default): flips from navy `bg-primary` to cyan; foreground becomes `--primary-foreground` 214 65% 8%
- **Card**: border becomes visible (`border-border` 214 50% 22%) since shadow is barely perceptible
- **Input**: `bg-input` shifts to 214 50% 22%; focus ring remains `--ring` cyan
- **Badge**: reduce background opacity to 80% to avoid oversaturation
- **Toast**: use `bg-card` surface with 1px `border-border` for definition
- **Tab bar**: glass blur remains; opacity shifts to `bg-card/85` for legibility
- **Skeleton**: shimmer sweeps from `--muted` 214 50% 18% to ~4% brighter
- **Dialog/Sheet**: overlay increases from `rgba(0,0,0,0.5)` to `rgba(0,0,0,0.7)`
- **Navigation sidebar**: 214 65% 6% — darker than page background for clear boundary

### dark mode testing checklist

- [ ] Verify all text passes WCAG AA contrast against dark surfaces
- [ ] Check card borders visible — shadow-only differentiation fails in dark mode
- [ ] Validate toast readability over dark backgrounds
- [ ] Test skeleton shimmer contrast — perceptible but not flashy
- [ ] Audit image brightness — no pure-white glare on dark pages

---

## Spacing and Layout

### spacing scale (8pt grid)

| Token | px | Tailwind | Use |
|-------|----|----------|-----|
| `space-1` | 4px | `p-1` / `gap-1` | Icon-to-text gap |
| `space-2` | 8px | `p-2` / `gap-2` | Tight list padding |
| `space-3` | 12px | `p-3` / `gap-3` | Compact card padding |
| `space-4` | 16px | `p-4` / `gap-4` | Default page/card padding |
| `space-5` | 20px | `p-5` / `gap-5` | Form field vertical gap |
| `space-6` | 24px | `p-6` / `gap-6` | Admin padding, section gap |
| `space-8` | 32px | `p-8` / `gap-8` | Empty state padding |
| `space-10` | 40px | `p-10` | Hero vertical padding |
| `space-12` | 48px | `p-12` | Page-level separation |
| `space-16` | 64px | `p-16` | Major section breaks |

### touch targets and density

- Minimum tap target: 44×44px (iOS HIG); exception: inline text links (underline + color sufficient)
- Input height: 48px (prevents iOS zoom)
- One primary CTA per screen — above fold or sticky bottom with `pb-safe`
- Compact density: p-3 / gap-2 (admin tables, schedules)
- Default density: p-4 / gap-3 (customer pages)
- Comfortable density: p-6 / gap-4 (admin dashboard)

### z-index scale

| Level | z-index | Tailwind | Use |
|-------|---------|----------|-----|
| Base | 0 | `z-0` | Page content |
| Sticky | 10 | `z-10` | Sticky headers, floating action |
| Dropdown | 20 | `z-20` | Select, popover, tooltip |
| Sheet | 40 | `z-40` | Bottom sheet, drawer |
| Modal | 50 | `z-50` | Dialog overlays |
| Toast | 60 | `z-[60]` | Toast (always on top) |

### page templates

- **List page**: `.text-h2` title → filter tabs → ScrollArea list gap-3 → `pb-24`
- **Detail page**: back button + `.text-h2` → hero card → info sections gap-4 → sticky CTA
- **Form page**: back + `.text-h2` → fields gap-5 → sticky submit
- **Dashboard**: `.text-h2` greeting → stat cards → action cards → activity list

### scroll behavior

- Main page: native momentum scroll (`-webkit-overflow-scrolling: touch`)
- Tab bar: `position: fixed bottom-0 z-40` + `.safe-bottom`
- Pull-to-refresh: Capacitor plugin, spinner at 60px threshold
- Infinite scroll: IntersectionObserver at 200px from bottom
- Sheet content: independent scroll within 85vh, snap-to-stops
- Horizontal overflow: `snap-x snap-mandatory` for card carousels

---

## Forms and Input Patterns

### Field states

| State | Border | Background | Label | Helper text |
|-------|--------|-----------|-------|-------------|
| **Empty** | `border-input` 1px | `bg-background` | `text-foreground` 14px/500 | `text-muted-foreground` 13px |
| **Focused** | `ring-2 ring-ring` | `bg-card` | `text-foreground` | helper visible |
| **Filled** | `border-input` 1px | `bg-background` | `text-foreground` | hidden unless error |
| **Error** | `border-destructive` | `bg-background` | `text-destructive` | error message in `text-destructive`, `role="alert"` |
| **Disabled** | `border-input opacity-50` | `bg-muted` | `text-muted-foreground` | `opacity-50` |
| **Read-only** | `border-transparent` | `bg-muted` | `text-muted-foreground` | none |

### Field anatomy

Every form field follows: **label** (above, 14px/500, `htmlFor` required) → **input** (h-12 48px, rounded-xl, 16px font to prevent iOS zoom) → **helper text** (below, 13px `text-muted-foreground`) → **error message** (replaces helper, `text-destructive`).

### Validation patterns

- **Inline validation**: validate on blur for text fields; show error immediately below field with `border-destructive` ring
- **On-submit validation**: scroll to first invalid field, focus it, show all errors simultaneously
- **Required indicator**: red asterisk after label text — `text-destructive` `*`
- **Helper text**: always visible in `text-muted-foreground` (e.g. "Min 8 characters"); replaced by error message on validation failure
- **Constraint patterns**: use React Hook Form + Zod schemas; errors come from Zod, displayed via `FormMessage`

### Form element types

| Element | Component | Height | Notes |
|---------|-----------|--------|-------|
| Text input | `input.tsx` | 48px | `rounded-xl`, prefix/suffix icon slots |
| Textarea | `textarea.tsx` | 80px min | auto-grows; same border treatment |
| Select | `select.tsx` | 48px | chevron-down trailing; dropdown via `popover.tsx` |
| Checkbox | `checkbox.tsx` | 20×20px | `rounded-md`, check icon on select |
| Radio | `radio-group.tsx` | 20px circle | dot indicator, border-2 |
| Toggle/Switch | `switch.tsx` | 24×44px track, 20px thumb | immediate effect, no form submit needed |
| OTP input | `input-otp.tsx` | 48px per cell | 6-digit, auto-advance between cells |
| Slider | `slider.tsx` | 8px track, 20px thumb | numeric range, `bg-primary` fill |
| Date | native date picker | 48px | Capacitor-delegated to OS picker |
| Search | `input.tsx` + `Search` icon | 48px | prefix Search icon 16px, clear button suffix |

### Form layout rules

- Field gap: `gap-5` (20px) vertical between fields in a form stack
- Label position: always above input, margin-bottom 4px
- Form group sections: `gap-6` (24px) between fieldsets; optional `text-h3` group heading
- Submit button: full-width, `xl` size (52px), sticky at bottom with `pb-safe` on mobile

### Multi-step forms

- Step progress: `Progress` bar at top showing completion percentage
- Step transitions: `.animate-fade-in` between steps (200ms ease-out)
- Back navigation: `ChevronLeft` in header; step data persisted in React state
- Onboarding flow uses 3–5 steps: property details → coverage map → plan recommendation → confirmation

---

## Components

Cross-reference `docs/screen-flows.md` for per-screen component usage and `docs/feature-list.md` for feature coverage.

### Button (`button.tsx`)
- Anatomy: icon-left (16px) → label → icon-right (16px)
- Sizes: `sm` 36px, `default` h-11 (44px), `lg` 48px, `xl` 52px, `icon` 44×44
- Variants: `default`, `accent`, `soft`, `soft-destructive`, `outline`, `secondary`, `ghost`, `link`, `destructive`
- States: hover → `opacity-90`; active → `scale-[0.97]` 150ms; focus → `ring-2 ring-ring ring-offset-2`; disabled → `opacity-50 pointer-events-none`; loading → spinner replaces label
- Use when: primary CTA, form submission. Avoid `ghost` for primary actions.

### Card (`card.tsx`)
- Anatomy: CardHeader (icon → title → description) → CardContent → CardFooter (actions)
- Variants: `default` (`bg-card` rounded-2xl shadow-sm p-4), `interactive` (hover → shadow-md, active → `scale-[0.98]`), `glass` (backdrop-blur-xl `bg-card/80`), `elevated` (shadow-lg)
- States: hover → shadow-md; active → `scale-[0.98]`; focus → `ring-2 ring-ring`; disabled → `opacity-60`
- Use when: grouping related content. Use `interactive` for tappable list items.

### Input (`input.tsx`)
- Anatomy: label → prefix icon (16px) → input field → suffix action
- Height: h-12 (48px), rounded-xl, 16px font (prevents iOS zoom)
- States: empty → placeholder `text-muted-foreground`; focused → `ring-2 ring-ring` + `bg-card`; filled → `text-foreground`; error → `border-destructive`; disabled → `opacity-50 bg-muted`
- Use when: single-line text. Use Textarea for multi-line.

### Textarea (`textarea.tsx`)
- Anatomy: label → textarea content → character count (trailing)
- Min-height 80px, rounded-xl, same focus treatment as Input
- States: empty → placeholder; focused → `ring-2 ring-ring`; error → `border-destructive`; disabled → `opacity-50`; hover → `border-ring`
- Use when: multi-line text (notes, descriptions).

### Select Dropdown (`select.tsx`)
- Anatomy: trigger (label → chevron-down 16px) → dropdown panel → option items
- Height: h-12 (48px), rounded-xl
- States: default → `border-input`; focused/open → `ring-2 ring-ring`; filled → selected value; error → `border-destructive`; disabled → `opacity-50`; loading → spinner replaces chevron
- Use when: 4+ predefined options. Use RadioGroup for 2–3.

### Checkbox (`checkbox.tsx`)
- Anatomy: checkbox box (leading) → label text (trailing)
- Size: 20×20px, rounded-md, `border-input`
- States: unchecked → `border-input bg-background`; checked → `bg-primary` + check icon; hover → `border-ring`; focus → `ring-2 ring-ring`; disabled → `opacity-50`
- Use when: multi-select options, terms acceptance.

### Switch (`switch.tsx`)
- Anatomy: track container → sliding thumb → label text
- Track: 44×24px rounded-full; thumb: 20px circle
- States: off → `bg-muted`; on → `bg-primary`; hover → `opacity-90`; focus → `ring-2 ring-ring`; disabled → `opacity-50`
- Use when: binary toggle with immediate effect. Prefer over Checkbox for settings.

### Badge (`badge.tsx`)
- Anatomy: dot indicator (leading) → label text
- min-h 24px, rounded-full, px-3, 13px text
- Variants: `default`, `secondary`, `outline`, `destructive`
- States: default → static; hover → `opacity-90` (if interactive); active → `scale-[0.97]`; focus → `ring-2 ring-ring`; disabled → `opacity-50`
- Use when: status labels, counts, tags.

### Dialog (`dialog.tsx`)
- Anatomy: overlay → DialogHeader (title → description) → DialogContent → DialogFooter (cancel → confirm)
- Overlay `bg-black/50`, content `bg-card` rounded-2xl p-6 shadow-lg max-w-sm
- States: open → `.animate-scale-in` 200ms; closing → fade-out 150ms; focus → trapped; disabled → footer buttons `opacity-50`; loading → CTA spinner
- Use when: confirmations, destructive gates. Do not use for forms — use Sheet.

### BottomSheet (`sheet.tsx`)
- Anatomy: drag handle (top) → header (title → close) → scrollable content → footer actions
- Slides from bottom, `.animate-slide-up` 250ms, overlay `bg-black/50`, `bg-card` rounded-t-2xl p-4 pb-safe, max-height 85vh
- States: open → slide-up; dragging → follows finger; dismissed → slide-down 200ms; focus → trapped; loading → skeleton content
- Use when: forms, pickers, detail views.

### Drawer (`drawer.tsx`)
- Anatomy: drag handle (top) → content → footer
- Wraps Vaul for native drag-to-dismiss, same `.animate-slide-up` 250ms
- States: open → slide-up + overlay; dragging → follows finger; hover handle → `bg-muted-foreground/50`; disabled → not dismissable; loading → skeleton
- Use when: complex multi-step flows from bottom.

### Tabs (`tabs.tsx`)
- Anatomy: TabsList container → TabsTrigger items → TabsContent panels
- Height: 44px, `bg-muted` rounded-xl, active `bg-card` shadow-sm rounded-lg
- States: default → `text-muted-foreground`; active → `text-foreground bg-card`; hover → `text-foreground`; focus → `ring-2 ring-ring`; disabled → `opacity-50`
- Use when: switching 2–4 content panels (Login/Signup, categories).

### Avatar (`avatar.tsx`)
- Anatomy: image → fallback initials
- Sizes: 32px inline, 40px list, 48px profile, 64px detail
- States: loaded → `object-cover`; loading → `bg-muted` pulse; error → fallback initials; hover → `opacity-80`; focus → `ring-2 ring-ring`; disabled → `opacity-50 grayscale`
- Use when: user/provider images.

### Progress (`progress.tsx`)
- Anatomy: track (full-width `bg-muted`) → fill bar (leading `bg-primary`) → label (trailing)
- Height: 8px rounded-full; small variant 4px
- States: determinate → width %; indeterminate → shimmer; error → `bg-destructive` fill; disabled → `opacity-40`; loading → track only
- Use when: upload progress, onboarding completion.

### LoadingSkeleton (`skeleton.tsx`)
- `bg-muted` rounded-xl, `.animate-shimmer` 1.5s infinite
- Variants: `line` (h-4), `circle` (rounded-full), `card` (rounded-2xl h-32)
- States: loading → shimmer active; loaded → crossfade 200ms; error → replaced by error state; disabled → static `bg-muted`; hover → n/a
- Use when: content loading. Match shape to expected content.

### Tooltip (`tooltip.tsx`)
- Anatomy: trigger element → tooltip panel (label → arrow)
- `bg-popover` rounded-lg p-2 shadow-md, 13px; `.animate-scale-in` 200ms
- States: hover → appear after 300ms delay; focus → immediate; active → visible; dismissed → fade-out 100ms; disabled → hidden; loading → n/a
- Use when: supplementary info on icon buttons. Not for essential info.

### EmptyState (`empty-state.tsx`)
- Anatomy: icon (40px `text-muted-foreground`) → title (`.text-h3`) → body (`.text-body text-muted-foreground`) → CTA button
- Layout: centered flex-col, gap-3, p-8
- States: default → full template; loading → PageSkeleton; error → retry CTA; hover CTA → button hover; active CTA → `scale-[0.97]`; disabled → CTA `opacity-50`
- Use when: lists with no data. Every empty state must have icon + title + body + CTA.

### Popover (`popover.tsx`)
- Anatomy: trigger → popover content panel (leading icon → items → trailing close)
- `bg-popover` rounded-xl shadow-lg p-4, `.animate-scale-in` 200ms
- States: open → scale-in; closed → fade-out 150ms; hover trigger → `opacity-80`; focus → trapped; active → click opens; disabled → trigger `opacity-50`; loading → skeleton
- Use when: contextual menus, filter dropdowns.

### ScrollArea (`scroll-area.tsx`)
- Anatomy: viewport → vertical scrollbar (trailing) → horizontal scrollbar
- Scrollbar: 4px wide rounded-full, `bg-muted` track, `bg-muted-foreground/30` thumb
- States: idle → scrollbar hidden; hover → visible `opacity-80`; scrolling → thumb `bg-muted-foreground/50`; disabled → `overflow-hidden`; focus → keyboard scroll
- Use when: constrained-height areas (sidebars, lists in sheets).

### Separator (`separator.tsx`)
- 1px `bg-border`, full width; vertical variant available
- States: default → visible; disabled → `opacity-30`; hover/active/focus → n/a
- Use when: dividing sections within a card.

### Label (`label.tsx`)
- Anatomy: label text → required indicator (trailing `text-destructive` asterisk)
- 14px/500 weight, `text-foreground`, margin-bottom 4px
- States: default → `text-foreground`; error → `text-destructive`; disabled → `opacity-70`; hover → n/a; focus → moves cursor to associated input
- Use when: above every form field. Always pair with `htmlFor`.

### Accordion (`accordion.tsx`)
- Anatomy: trigger (label → trailing ChevronDown 16px) → collapsible content
- Trigger h-12 (48px), ChevronDown rotates 180° on expand, content `py-3` animate-height 250ms
- States: collapsed → chevron down; expanded → chevron rotated; hover → `bg-muted/50`; focus → `ring-2 ring-ring`; disabled → `opacity-50`; loading → content skeleton
- Use when: FAQ, collapsible groups. Use Collapsible for single toggle.

### Alert (`alert.tsx`)
- Anatomy: accent border (leading) → icon (20px) → AlertTitle (`.text-h3`) → AlertDescription
- rounded-xl p-4, `border-l-4`
- Variants: `default`, `destructive` (`border-destructive bg-destructive/5`), `warning`, `success`
- States: default → visible; hover → n/a; focus → `ring-2 ring-ring`; disabled → `opacity-50`; loading → skeleton; error → n/a
- Use when: inline informational messages. Not for transient notifications (use Toast).

### RadioGroup (`radio-group.tsx`)
- Anatomy: radio circle (leading) → label text → optional description (trailing)
- 20px circle, `border-2 border-input`, inner dot 10px `bg-primary`
- States: unselected → empty; selected → dot `bg-primary`; hover → `border-ring`; focus → `ring-2 ring-ring`; active → `scale-[0.95]`; disabled → `opacity-50`; error → `border-destructive`
- Use when: single selection from 2–3 options.

### Slider (`slider.tsx`)
- Anatomy: track → fill (leading) → thumb handle → value label (above)
- Track h-2 rounded-full `bg-muted`; thumb 20px `bg-primary-foreground` shadow-md
- States: default → thumb at position; hover → thumb scale(1.1); active → thumb scale(1.2) `ring-4 ring-ring/20`; focus → `ring-2 ring-ring`; disabled → `opacity-50`; loading → track only
- Use when: numeric ranges (frequency, budget).

### error state patterns

| Error Type | Visual Treatment | User Action |
|-----------|-----------------|-------------|
| **Network error** | Toast `AlertTriangle` icon, `text-destructive` | Retry button |
| **Validation error** | Inline `text-destructive` below field, `border-destructive` | Fix and re-submit |
| **Not found** | EmptyState with `Search` icon, back/home CTA | Navigate away |
| **Timeout** | Toast with clock icon | Auto-retry 3s or manual |
| **Offline** | Persistent banner `bg-warning/10 border-warning` | Auto-dismiss on reconnect |
| **Permission denied** | EmptyState with `Lock` icon, contact CTA | Request access |

---

## Motion System

### easing curves

| Name | Value | Use |
|------|-------|-----|
| **ease-default** | `cubic-bezier(0.25, 0.1, 0.25, 1.0)` | General transitions, color changes |
| **ease-out-expo** | `cubic-bezier(0.16, 1, 0.3, 1)` | Entry animations — sheets, modals, pages |
| **ease-in-out** | `cubic-bezier(0.42, 0, 0.58, 1)` | Symmetric motions — toggles, switches |
| **ease-spring** | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful feedback — checkbox check, badge pulse |

### duration scale

| Tier | Duration | Use |
|------|----------|-----|
| **Instant** | 100ms | Press feedback, toggle, checkbox, ripple |
| **Fast** | 150ms–200ms | Fade-in, scale-in, tooltip, color shifts |
| **Normal** | 250ms | Sheet slide-up, dialog open, page transition |
| **Gentle** | 350ms | Multi-element stagger, drawer open |

### keyframe animations

| Class | Keyframe | Duration | Easing |
|-------|----------|----------|--------|
| `.animate-shimmer` | background-position -200%→200% | 1.5s infinite | ease-in-out |
| `.animate-slide-up` | translateY(16px→0) + opacity | 250ms | ease-out-expo |
| `.animate-scale-in` | scale(0.95→1) + opacity | 200ms | ease-out-expo |
| `.animate-fade-in` | translateY(4px→0) + opacity | 200ms | ease-default |
| `.press-feedback` | active:scale-[0.98] | 100ms | ease-default |

### entry/exit pairs

| Component | Entry | Exit |
|-----------|-------|------|
| **Sheet** | `.animate-slide-up` 250ms | slide-down + fade 200ms |
| **Dialog** | `.animate-scale-in` 200ms | scale(1→0.95) + fade 150ms |
| **Toast** | slide-down from top 200ms | fade-out + translateY(-8px) 150ms |
| **Popover** | `.animate-scale-in` 200ms | fade-out 100ms |
| **Drawer** | slide-up 350ms (Vaul spring) | drag-dismiss or slide-down 250ms |
| **Menu** | `.animate-scale-in` 150ms | fade-out 100ms |

### micro-interactions

- **Toggle/Switch**: thumb slides 44px over 100ms `ease-in-out`, track crossfade 150ms
- **Checkbox**: check icon scales 0→1 over 100ms `ease-spring`, bg fills simultaneously
- **Progress bar**: width transition 300ms `ease-default`
- **Pull-to-refresh**: spinner fades in at 60px threshold, rotate 360° over 800ms infinite
- **Long-press**: haptic at 300ms threshold, scale(1→0.96) during hold
- **Swipe-to-dismiss**: follows finger with spring-back if <30% threshold
- **List stagger**: each item delays 30ms, max 5 items (150ms total cap)

### `prefers-reduced-motion` handling

When `prefers-reduced-motion: reduce` is active:
- Disable all transform animations (translateY, scale) — replace with opacity crossfade at 150ms
- Remove `.animate-shimmer` infinite loop — show static `bg-muted`
- Disable `.press-feedback` scale — keep color-only active states
- Replace sheet slide transitions with instant opacity fade
- Keep progress bar and spinner — functional motion is acceptable per WCAG 2.1 §2.3.3

---

## Utilities
- `.glass` — bg-card/80 backdrop-blur-xl border-border/50
- `.press-feedback` — active:scale-[0.98] with transition
- `.safe-top` / `.safe-bottom` — env(safe-area-inset)
- `.text-h1` through `.text-caption` — typography presets

---

## Surfaces and Visual Depth

### shadow elevation scale

| Level | Token | CSS | Use |
|-------|-------|-----|-----|
| 0 | `shadow-none` | `box-shadow: none` | Flat inline elements |
| 1 | `shadow-sm` | `box-shadow: 0 1px 2px rgba(0,0,0,0.05)` | Cards at rest, list items |
| 2 | `shadow-md` | `box-shadow: 0 4px 6px rgba(0,0,0,0.07)` | Hovered cards, elevated surfaces |
| 3 | `shadow-lg` | `box-shadow: 0 10px 15px rgba(0,0,0,0.10)` | Popover, dropdown, tooltip |
| 4 | `shadow-xl` | `box-shadow: 0 20px 25px rgba(0,0,0,0.12)` | Dialog, sheet overlay |
| 5 | `shadow-2xl` | `box-shadow: 0 25px 50px rgba(0,0,0,0.15)` | Dragged elements, floating CTA |

### gradient patterns

Subtle, purposeful gradients — the brand is calm concierge, not tech keynote.

- **Hero accent**: `linear-gradient(135deg, hsl(214 65% 14%) 0%, hsl(214 50% 22%) 100%)` — onboarding hero bg
- **Skeleton sweep**: `linear-gradient(90deg, transparent 0%, hsl(220 14% 93%) 50%, transparent 100%)` — `.animate-shimmer` overlay
- **Image overlay**: `linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)` — text legibility on photos
- **Surface fade**: `radial-gradient(ellipse at top, hsl(220 20% 97%) 0%, hsl(0 0% 100%) 100%)` — subtle page depth

### surface treatments

- **Glass**: `.glass` — `bg-card/80 backdrop-blur-xl border-border/50`. Tab bar, floating headers
- **Frosted**: `backdrop-blur-lg bg-background/70`. Status bar overlays on scrolled content
- **Tinted surface**: `bg-accent/5` or `bg-success/5`. Highlight backgrounds on feature cards
- **Noise texture**: not used — keeps UI clean per brand guidelines

### image treatment rules

- Aspect ratios: hero 16:9, thumbnail 1:1 rounded-xl, avatar rounded-full
- Object fit: `object-cover` for photos, `object-contain` for logos
- Placeholder: `bg-muted` + centered icon `text-muted-foreground` while loading
- Border radius on images: match parent container — rounded-2xl in cards, rounded-xl standalone

---

## Accessibility

WCAG AA compliance required — 4.5:1 contrast for body text, 3:1 for large text (18px+).

- Semantic headings: one `h1` per page, sequential `h2`→`h3` nesting
- Visible focus: `ring-2 ring-ring ring-offset-2` on all interactive elements via `focus-visible`
- Focus trap: Dialog and Sheet trap focus within overlay; Tab cycles through focusable children; Escape closes
- Focus restore: when Dialog/Sheet closes, focus returns to the trigger element
- Touch targets: minimum 44×44px per iOS HIG; exception: inline text links (underline + color sufficient)
- 16px minimum font for inputs (prevents iOS auto-zoom on `focus`)
- `aria-label` on icon-only buttons (back `ChevronLeft`, close `X`)
- `aria-live="polite"` on toast container for screen reader announcements
- `role="alert"` on inline form error messages
- Color-independent info: never convey status by color alone — pair with icon (checkmark, `AlertTriangle`) as secondary indicator
- `sr-only` for visually hidden labels; `aria-describedby` links inputs to helper/error text
- Landmarks: `<main>` for page content, `<nav>` for tab bar, `<aside>` for admin sidebar
- VoiceOver/TalkBack: verify tab order follows visual flow, modals announce title on open
- Lighthouse a11y audit: target 95+ on all customer-facing pages

