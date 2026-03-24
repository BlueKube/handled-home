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
