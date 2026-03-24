# Design Guidelines — Handled Home (Mobile-Native)

> **Last updated:** 2026-03-15 — Corrected color tokens to match index.css. Updated component specs.

## Platform
Mobile-first iOS & Android app via Capacitor. No desktop breakpoints.

---

## Brand and Emotional Design

Brand personality: **calm concierge** — confident, kind, predictable. Tagline: "Your home, handled." See `docs/masterplan.md` for full brand positioning.

### Personality-to-Design Mappings

| Personality Trait | Visual Decision | Implementation |
|-------------------|----------------|----------------|
| **Calm** | Slow easing curves, muted palette, minimal motion | `cubic-bezier(0.25, 0.1, 0.25, 1.0)` for transitions; navy `hsl(214 65% 14%)` primary, no saturated reds in default UI |
| **Competent** | Consistent 12px radius, structured spacing, clear hierarchy | `rounded-xl` on all interactive elements; 8px grid; `.text-h2` for page titles |
| **Trustworthy** | Navy primary conveys authority; proof-of-work imagery; no flashy gradients | `bg-primary` for CTAs; before/after photo pairs; shadow-sm for subtle depth |
| **Kind** | Warm success messages, gentle error copy, rounded shapes | `rounded-2xl` cards; "We'll take care of it" not "Error occurred" |
| **Premium** | Generous whitespace, Inter 300–700 weight range, glass surface treatment | `p-4` card padding; `.glass` utility with backdrop-blur-xl |

### UI Copy Tone Examples

- **Success toast**: "Service confirmed — your lawn is on the schedule."
- **Error toast**: "We couldn't save that change. Check your connection and try again."
- **Empty state (no services)**: "No services yet. Let's get your home set up."
- **Confirmation dialog**: "Cancel this service? You can re-add it anytime from your plan."
- **Notification**: "Your pool service is complete. View the proof-of-work photos."
- **Onboarding**: "Tell us about your home so we can recommend the right plan."

### Imagery and Illustration Direction

- Photography: warm, natural lighting; residential settings; no stock-photo feel
- Illustration style: outlined Lucide icons at 24px with 1.5px stroke width; accent tint for icon containers using `bg-accent/10` with `rounded-full`
- Icon sizes: 16px inline, 20px in buttons, 24px standalone, 40px in empty states
- Spot illustrations for empty states: single-color line art using `text-muted-foreground`
- No decorative gradients — visual language is flat with subtle shadow depth

### Celebration and Delight Moments

- **Service completion**: success toast with checkmark icon + `.animate-scale-in` at 200ms
- **Plan activation**: confetti-style milestone card with accent border and `bg-accent/5` tint
- **Onboarding completion**: congratulations screen with achievement icon at 48px
- **First service booked**: reward badge pulse animation, scale(1.0→1.05→1.0) over 300ms

### Brand Anti-Patterns

- Never use aggressive language: avoid "URGENT", "ACT NOW", "Don't miss out"
- Never use red for non-destructive actions — `bg-destructive` is reserved for errors and delete confirmations
- Do not show raw error codes or stack traces to users
- Avoid dense data tables in customer-facing screens — use StatCard summaries instead
- Never auto-play video or sound — the app should feel quiet and controlled

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

All colors use CSS custom properties via `hsl(var(--<name>))` — defined in `src/index.css`. WCAG AA compliance required.

### Primitive Tokens

Core palette values. These are raw HSL values — never reference primitives directly in components, use semantic tokens instead.

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

### Semantic Tokens

Purpose-based aliases that map primitives to roles. Use these in components.

- **Surface default** → `bg-background` — page-level background
- **Surface raised** → `bg-card` — card, sheet, dialog backgrounds
- **Surface overlay** → `bg-popover` — popover, dropdown, tooltip backgrounds
- **Text primary** → `text-foreground` — headings, body text
- **Text secondary** → `text-muted-foreground` — captions, helper text
- **Interactive default** → `bg-primary` — primary buttons, active tab bar items
- **Interactive accent** → `bg-accent` — CTAs, links, focus ring (`--ring`)
- **Feedback success** → `bg-success` / `text-success` — confirmations
- **Feedback warning** → `bg-warning` / `text-warning` — advisory alerts
- **Feedback destructive** → `bg-destructive` / `text-destructive` — errors, delete actions

### Component-Level Token Overrides

Specific tokens scoped to individual components:

| Component Token | Light | Dark | Used by |
|-----------------|-------|------|---------|
| `--sidebar-background` | 214 65% 14% | 214 65% 6% | Admin sidebar shell |
| `--sidebar-foreground` | 220 20% 90% | 220 20% 90% | Admin sidebar text |
| `--sidebar-primary` | 200 80% 50% | 200 80% 50% | Active sidebar item |
| `--sidebar-accent` | 214 55% 20% | 214 55% 15% | Sidebar hover state |
| `--sidebar-border` | 214 50% 22% | 214 50% 15% | Sidebar dividers |

### Token Naming Convention

Pattern: `--{category}-{role}-{modifier}`. Examples:
- `--background` — base surface color
- `--card-foreground` — text color on card surfaces
- `--sidebar-primary` — component-scoped override for sidebar active state
- `--muted-foreground` — text on muted backgrounds

---

## Dark Mode

Dark theme is applied via the `.dark` class on `<html>`. All tokens in the color table above include explicit dark values from `src/index.css`.

### Dark Elevation Model

In dark mode, elevation is communicated through surface luminance rather than shadow — higher surfaces are lighter. Shadow opacity is reduced to 40% of light-mode values since shadows are less visible against dark backgrounds.

| Level | Surface | Light shadow | Dark treatment |
|-------|---------|-------------|----------------|
| 0 — Base | `bg-background` | none | `hsl(214 65% 8%)` background |
| 1 — Raised | `bg-card` | shadow-sm | `hsl(214 55% 12%)` — 4% lighter than base |
| 2 — Overlay | `bg-popover` | shadow-md | `hsl(214 55% 12%)` — same as card, border distinguishes |
| 3 — Sidebar | `bg-sidebar-background` | none | `hsl(214 65% 6%)` — darker than base for contrast |

### Dark Image and Illustration Guidance

- Apply `brightness(0.85)` filter to photos in dark mode to reduce glare
- Reduce illustration saturation by 10% — overly vivid colors clash with muted dark surfaces
- Overlay a `rgba(0,0,0,0.15)` dimming layer on hero images
- Use `text-foreground` for illustration line strokes (adapts automatically)
- Placeholder/skeleton shimmer gradient shifts from `hsl(214 55% 12%)` to `hsl(214 55% 16%)`

### Dark Component Overrides

- **Button (default)**: flips from navy `bg-primary` to cyan `bg-primary` — foreground becomes dark `hsl(214 65% 8%)`
- **Card**: border becomes visible at `hsl(214 50% 22%)` since shadow is ineffective
- **Input**: `bg-input` shifts to `hsl(214 50% 22%)`; focus ring remains `--ring` cyan
- **Badge/StatusBadge**: reduce background opacity to 80% to avoid oversaturation
- **Toast**: use `bg-card` surface with 1px `border-border` for definition
- **Tab bar**: glass backdrop-blur remains; opacity shifts to `bg-card/85` for legibility
- **Skeleton**: shimmer sweeps from `hsl(214 50% 18%)` to `hsl(214 50% 24%)`
- **Dialog/Sheet**: overlay darkness increases from `rgba(0,0,0,0.5)` to `rgba(0,0,0,0.7)`
- **Navigation sidebar**: `hsl(214 65% 6%)` — darker than page background for clear boundary

### Dark Mode Testing Checklist

- [ ] Verify all text passes WCAG AA (4.5:1 body, 3:1 large text) against dark surfaces
- [ ] Check card borders are visible — shadow-only differentiation fails in dark mode
- [ ] Validate toast readability over dark backgrounds
- [ ] Test skeleton shimmer animation contrast — must be perceptible but not flashy
- [ ] Audit image brightness — no pure-white glare on dark pages

---

## Spacing & Touch
- 8pt grid system
- Minimum tap target: 44px (iOS HIG)
- Input height: 48px (prevents iOS zoom)
- One primary CTA per screen
- Safe area insets: `env(safe-area-inset-top/bottom)`

---

## Components

Cross-reference `docs/screen-flows.md` for screen-level component usage and `docs/feature-list.md` for feature coverage.

### Button (`button.tsx`)
- Sizes: `sm` 36px, `default` h-11 (44px), `lg` 48px, `xl` 52px, `icon` 44×44
- Variants: `default`, `accent`, `soft`, `soft-destructive`, `outline`, `secondary`, `ghost`, `link`, `destructive`
- Slot anatomy: icon-left (16px) + label + icon-right (16px); icon-only uses `icon` size
- States: hover → `opacity-90`; active → `scale-[0.97]` 150ms; focus → `ring-2 ring-ring ring-offset-2`; disabled → `opacity-50 pointer-events-none`; loading → spinner replaces label, disabled state via `loading` prop
- Use when: primary CTA, form submission, navigation action. Avoid ghost for primary actions.

### Card (`card.tsx`)
- Default: `bg-card` rounded-2xl shadow-sm p-4
- Variants: `interactive` (hover → shadow-md, active → `scale-[0.98]` press feedback), `glass` (backdrop-blur-xl `bg-card/80`), `elevated` (shadow-lg)
- States: hover → shadow-md (interactive only); active → `scale-[0.98]`; focus → `ring-2 ring-ring`; disabled → `opacity-60`
- Slot anatomy: CardHeader (icon + title + description) → CardContent → CardFooter (actions)
- Use when: grouping related content. Use `interactive` for tappable list items. Use `glass` for overlays on images.

### Input (`input.tsx`)
- Height: h-12 (48px), rounded-xl, `border-input` 1px, 16px font-size (prevents iOS zoom)
- States: empty → placeholder in `text-muted-foreground`; focused → `ring-2 ring-ring` + `bg-card`; filled → `text-foreground`; error → `border-destructive ring-destructive`; disabled → `opacity-50 bg-muted`
- Slot anatomy: label (above) → prefix icon (left 16px) → input → suffix icon/action (right)
- Use when: single-line text entry. Use Textarea for multi-line.

### Textarea (`textarea.tsx`)
- Min-height: 80px, rounded-xl, same border/focus treatment as Input
- States: empty → placeholder; focused → `ring-2 ring-ring`; error → `border-destructive`; disabled → `opacity-50`
- Use when: multi-line text (notes, descriptions, access instructions).

### Select (`select.tsx`)
- Height: h-12 (48px), rounded-xl, chevron-down trailing icon 16px
- States: default → `border-input`; focused/open → `ring-2 ring-ring`; disabled → `opacity-50`; error → `border-destructive`
- Use when: choosing from 4+ predefined options. Use radio for 2–3 options.

### Checkbox (`checkbox.tsx`)
- Size: 20px × 20px, rounded-md (4px radius), `border-input`
- States: unchecked → `border-input bg-background`; checked → `bg-primary` + check icon in `text-primary-foreground`; hover → `border-ring`; focus → `ring-2 ring-ring`; disabled → `opacity-50`
- Use when: multi-select options, terms acceptance.

### Switch (`switch.tsx`)
- Track: 44px × 24px, rounded-full; Thumb: 20px circle
- States: off → `bg-muted`; on → `bg-primary`; hover → `opacity-90`; focus → `ring-2 ring-ring`; disabled → `opacity-50`
- Use when: binary toggle with immediate effect (notifications on/off). Prefer over checkbox for settings.

### Badge (`badge.tsx`)
- Height: min-h 24px, rounded-full, px-3, text-caption size (13px)
- Variants: `default` (bg-primary), `secondary` (bg-secondary), `outline` (border only), `destructive` (bg-destructive)
- Use when: status labels, counts, category tags.

### Dialog (`dialog.tsx`)
- Overlay: `bg-black/50`, entry `.animate-scale-in` 200ms
- Content: `bg-card` rounded-2xl p-6 shadow-lg max-w-sm centered
- Slot anatomy: DialogHeader (title `.text-h3` + description) → DialogContent → DialogFooter (actions, right-aligned)
- States: open → overlay + scale-in; closing → fade-out 150ms
- Use when: confirmations, destructive action gates. Do not use for forms — use Sheet instead.

### Sheet (`sheet.tsx`)
- Slides from bottom, entry `.animate-slide-up` 250ms, overlay `bg-black/50`
- Content: `bg-card` rounded-t-2xl p-4 pb-safe, max-height 85vh, drag-to-dismiss handle (40px × 4px rounded-full `bg-muted` centered)
- States: open → slide-up + overlay; dragging → follows finger; dismissed → slide-down 200ms
- Use when: forms, pickers, detail views that don't warrant a full page.

### Drawer (`drawer.tsx`)
- Identical animation to Sheet — wraps Vaul for native drag-to-dismiss behavior
- Use when: complex forms or multi-step flows from bottom of screen.

### Tabs (`tabs.tsx`)
- Height: 44px, `bg-muted` rounded-xl container, active tab `bg-card` shadow-sm rounded-lg
- States: default → `text-muted-foreground`; active → `text-foreground bg-card shadow-sm`; hover → `text-foreground`; focus → `ring-2 ring-ring`
- Use when: switching between 2–4 content panels (e.g., Login/Signup, service categories).

### Avatar (`avatar.tsx`)
- Sizes: 32px (inline), 40px (list items), 48px (profile), 64px (detail view)
- Shape: rounded-full, `bg-muted` fallback with initials in `text-muted-foreground`
- States: loaded → shows image with `object-cover`; loading → `bg-muted` pulse; error → fallback initials
- Use when: user/provider profile images, assignee indicators.

### Progress (`progress.tsx`)
- Height: 8px, rounded-full, track `bg-muted`, fill `bg-primary`
- Variants: default (primary fill), accent (`bg-accent` fill), small (4px height)
- States: determinate → width percent; indeterminate → shimmer animation
- Use when: upload progress, onboarding completion, step indicators.

### Skeleton (`skeleton.tsx`)
- Base: `bg-muted` rounded-xl, `.animate-shimmer` gradient sweep 1.5s infinite
- Variants: `line` (h-4 rounded), `circle` (rounded-full), `card` (rounded-2xl h-32)
- Use when: content is loading. Match skeleton shape to expected content layout.

### Tooltip (`tooltip.tsx`)
- Background: `bg-popover` rounded-lg p-2 shadow-md, 13px text
- Entry: `.animate-scale-in` 200ms; delay 300ms on hover
- States: hover-triggered → appear with delay; focus-triggered → immediate; dismissed → fade-out 100ms
- Use when: supplementary info on icon buttons. Not for essential information.

### EmptyState (`empty-state.tsx`)
- Layout: centered flex-col, gap-3, p-8
- Slot anatomy: icon (40px in `text-muted-foreground`) → title (`.text-h3`) → body (`.text-body text-muted-foreground`) → CTA button
- Use when: lists with no data, first-time screens. Every empty state must have icon + title + body + CTA.

### Popover (`popover.tsx`)
- Content: `bg-popover` rounded-xl shadow-lg p-4, entry `.animate-scale-in` 200ms
- States: open → scale-in from trigger; closed → fade-out 150ms
- Use when: contextual menus, filter dropdowns. Not for full forms — use Sheet.

### ScrollArea (`scroll-area.tsx`)
- Custom scrollbar: 4px wide, rounded-full, `bg-muted` track, `bg-muted-foreground/30` thumb
- Use when: constrained-height content areas (sidebars, long lists in sheets).

### Separator (`separator.tsx`)
- Height: 1px, `bg-border`, full width
- Variants: horizontal (default), vertical
- Use when: dividing content sections within a card or page.

---

## Animations
| Name | Keyframe | Duration | Use |
|------|----------|----------|-----|
| Shimmer | gradient sweep | 1.5s infinite | Skeleton loading |
| Slide Up | translateY(16→0) | 250ms | Bottom sheets, modals |
| Scale In | scale(0.95→1) | 200ms | Popovers, dialogs |
| Fade In | translateY(4→0) + opacity | 200ms | Page transitions |
| Press | scale(0.97/0.98) | 100ms | Buttons, cards |

All transitions: ease-out. No aggressive or decorative animations.

---

## Utilities
- `.glass` — bg-card/80 backdrop-blur-xl border-border/50
- `.press-feedback` — active:scale-[0.98] with transition
- `.safe-top` / `.safe-bottom` — env(safe-area-inset)
- `.text-h1` through `.text-caption` — typography presets
- `.animate-fade-in` — translateY(4→0) + opacity fade, applied to all page-level containers on mount

---

## Admin (Desktop) Layout

Admin pages use a **sidebar + command bar** layout (via `AdminShell`), not the mobile bottom tab bar.

| Pattern | Customer/Provider (Mobile) | Admin (Desktop) |
|---------|---------------------------|-----------------|
| Shell | Bottom tab bar (56px) | Sidebar + command bar (h-12) |
| Container padding | `p-4 pb-24` | `p-6` |
| Max-width constraints | None (mobile-only) | OK (`max-w-4xl`, `max-w-6xl`) |
| Responsive grids | None | OK (`lg:grid-cols-*`) |
| Page heading | `text-h2` | `text-h2` |
| Entry animation | `animate-fade-in` | `animate-fade-in` |
| Back navigation | `ChevronLeft` h-5 w-5 + aria-label | `ChevronLeft` h-5 w-5 + aria-label |
| Touch targets | Min 44px | Standard button sizes |

**Key differences:**
- No `pb-24` — admin has no bottom tab bar to clear
- `p-6` padding (not `p-4`) — more spacious desktop layout
- `max-w-*` constraints are appropriate for desktop readability
- Responsive grids are used for dashboard-style pages

---

## Accessibility
- Semantic headings
- Visible focus states (ring-2 ring-ring)
- Proper contrast ratios (WCAG AA)
- Clear error messaging
- 16px minimum font for inputs (no iOS zoom)
- Back buttons include `aria-label` for screen readers

