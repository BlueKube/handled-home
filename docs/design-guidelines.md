# Design Guidelines — Handled Home (Mobile-Native)

## Platform
Mobile-first iOS & Android app via Capacitor. No desktop breakpoints.

---

## Emotional Tone
Calm concierge — confident, kind, predictable. "Your home is handled."

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

## Spacing & Touch
- 8pt grid system
- Minimum tap target: 44px (iOS HIG)
- Input height: 48px (prevents iOS zoom)
- One primary CTA per screen
- Safe area insets: `env(safe-area-inset-top/bottom)`

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

### Button (`button.tsx`)
- Default: h-11 (44px), rounded-xl
- Sizes: `sm` (36px), `lg` (48px), `xl` (52px), `icon` (44×44)
- Variants: `default`, `accent`, `soft`, `soft-destructive`, `outline`, `secondary`, `ghost`, `link`, `destructive`
- Active: `scale-[0.97]`, 150ms transition
- Loading: spinner + disabled state via `loading` prop

### Card (`card.tsx`)
- Default: rounded-2xl, subtle shadow, p-4
- Variants: `interactive` (press feedback), `glass` (backdrop-blur), `elevated` (stronger shadow)

### Input (`input.tsx`)
- h-12, rounded-xl, accent ring on focus
- Background shifts to `--card` on focus

### StatCard (`StatCard.tsx`)
- Icon with tinted bg circle (accent/10)
- Value + label + optional trend indicator
- `compact` variant for inline rows

### PageSkeleton (`PageSkeleton.tsx`)
- Shimmer animation (gradient sweep)
- Variants: `stats`, `list`, `page`

### StatusBadge (`StatusBadge.tsx`)
- Pill shape, min-h 28px, dot indicator before label

### BottomTabBar
- Glass bg: `bg-card/90 backdrop-blur-lg`
- Active: teal dot + icon scale
- Top shadow for depth

### Toast
- rounded-2xl, p-4, top-center position
- Variants: `default`, `destructive`, `success`

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

---

## Accessibility
- Semantic headings
- Visible focus states (ring-2 ring-ring)
- Proper contrast ratios (WCAG AA)
- Clear error messaging
- 16px minimum font for inputs (no iOS zoom)

---

## Voice
Calm, competent, kind. Never blame users. Reinforce: "Your home is handled."
