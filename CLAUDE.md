# Handled Home — Claude Code Project Guide

## Project Overview

Handled Home is a **managed home-maintenance platform** — "Your home, handled." Customers set up their home once, get a recommended recurring service plan, and manage all home services (lawn, pool, pest, etc.) from one app with one-tap add-ons, standardized quality levels, and proof-of-work receipts. For providers, the app fills schedules with recurring work, reduces admin, and improves route density.

Three user roles: **Customer**, **Provider**, **Admin**.

## Workflow (Non-Negotiable)

**Every implementation task — whether a new feature, redesign, bug fix batch, or system overhaul — follows the PRD-to-Production workflow.**

Read and follow `docs/skills/prd-to-production-workflow.md` before starting any work. Do not skip steps.

### Quick reference (full details in the workflow doc)

1. **PRD → Plan** — Decompose the PRD into phases and batches. Write `docs/working/plan.md`. Get human approval.
2. **Batch execution** — For each batch: re-anchor → write spec in `docs/working/batch-specs/` → implement → commit → 10-agent code review → fix loop → validate build → validate visually → push.
3. **Doc sync** — After each phase, sync the six north star documents (see below).
4. **Phase transition** — Mark phase complete in plan, restate what's next.
5. **Completion** — Final recap, archive `docs/working/` to `docs/archive/`.

### Slash commands

- `/code-review` — 10-agent review (4 parallel lanes + 1 synthesis lane × 2 tiers). Phase mode (no args) or PR mode (`/code-review 123`).

### Working folder structure

```
docs/working/
├── prd.md              # The current PRD (copied here at start)
├── plan.md             # The phased implementation plan
└── batch-specs/        # Individual batch specs (one per batch)
```

## Six North Star Documents

These are the living documents that define the product. Claude reads them at the start of work to understand full context. They are updated after each phase — never allowed to go stale.

| Document | Purpose |
|----------|---------|
| `docs/masterplan.md` | Business plan, vision, value proposition, growth strategy |
| `docs/operating-model.md` | Revenue model, unit economics, thresholds, operational rules |
| `docs/screen-flows.md` | Screen layouts, components, navigation, empty/loading states |
| `docs/app-flow-pages-and-roles.md` | Route tree, page inventory, role gates, user journeys |
| `docs/feature-list.md` | Feature inventory, delivery status, strategic tags |
| `docs/design-guidelines.md` | Design tokens, spacing, typography, component specs, accessibility |

See the "Phase 3: Documentation Sync" section of the workflow doc for what to check and how to sync.

## Tech Stack

- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS 3 + shadcn/ui (Radix primitives)
- **State/Data:** TanStack React Query + Supabase (auth, DB, edge functions)
- **Routing:** React Router DOM 6
- **Mobile:** Capacitor (iOS/Android)
- **Icons:** Lucide React
- **Animation:** Framer Motion
- **Maps:** Mapbox GL + h3-js
- **Testing:** Vitest + Playwright

## Project Structure

```
src/
├── components/
│   ├── ui/          # shadcn/ui base components (30+)
│   ├── customer/    # Customer-facing components
│   ├── provider/    # Provider-facing components
│   ├── admin/       # Admin-facing components
│   ├── plans/       # Subscription/plan components
│   ├── routine/     # Routine management
│   ├── settings/    # Settings components
│   └── support/     # Support/help components
├── pages/
│   ├── customer/    # Customer pages
│   ├── provider/    # Provider pages
│   ├── admin/       # Admin pages
│   └── shared/      # Shared pages
├── hooks/           # Custom React hooks
├── contexts/        # AuthContext
├── lib/             # Utilities (utils, h3, billing, etc.)
├── constants/       # Config constants
└── integrations/    # Supabase client + types
```

## Key Aliases

- `@/components` → `src/components`
- `@/components/ui` → `src/components/ui`
- `@/lib` → `src/lib`
- `@/hooks` → `src/hooks`

## Design System

| Token | Value |
|-------|-------|
| Primary | Navy `hsl(214, 65%, 14%)` |
| Accent | Cyan `hsl(200, 80%, 50%)` |
| Background | Light gray `hsl(220, 20%, 97%)` |
| Card | White, `rounded-2xl`, shadow `0 1px 3px rgba(0,0,0,0.06)` |
| Font | Inter (300–700) |
| Viewport | 390×844 mobile-first |
| Button heights | default 44px, large 48px, xl 52px — all `rounded-xl` |
| Input | 48px height, `rounded-xl`, border gray |
| Bottom Tab Bar | Fixed bottom, 56px, glass blur `bg-card/90`, 5 tabs |
| Touch target | Min 44×44px |
| Icons | Lucide React |
| Safe area | Use `pb-safe` for iOS safe area |

Button variants: `default` (navy), `accent` (cyan), `outline`, `ghost`, `destructive`, `secondary`.

All colors use CSS custom properties via `hsl(var(--<name>))` — defined in `src/index.css`.

### Consistency standards

**Customer/Provider pages (mobile):**
- `animate-fade-in` on main containers
- `p-4 pb-24` padding (pb-24 for bottom tab bar clearance)
- `text-h2` for page titles, `text-caption` for subtitles
- `ChevronLeft` back navigation with aria-labels
- 44px minimum touch targets
- Semantic color tokens only (no hardcoded colors)
- No `max-w-lg` or `max-w-2xl` constraints (mobile-only app)
- Shared `formatCents` from `@/utils/format`

**Admin pages (desktop sidebar layout):**
- `animate-fade-in` on main containers
- `p-6` padding (no pb-24 — admin uses sidebar, not bottom tab bar)
- `text-h2` for page titles
- `ChevronLeft` back navigation with aria-labels on detail pages
- Semantic color tokens only
- `max-w-*` constraints OK for admin (desktop layout)
- Responsive grids (`lg:grid-cols-*`) OK for admin

## UX Principles

- The product should feel like a **managed home operating system**, not a marketplace
- Provider experience should feel **calm, competent, trustworthy**
- Empty states need: icon, title, body copy, clear next step
- Every screen should answer: what's next, what's included, what happened
- Copy tone: calm, competent, specific, non-blaming, operationally clear
- Don't bury important actions below the fold
- Use semantic color tokens (bg-success, bg-warning, text-muted-foreground) — no hardcoded colors
- All additions must work in dark mode

## Screen Review Dimensions

For each page you touch, evaluate:
1. **Clarity** — Can the user understand the screen's purpose in 3 seconds?
2. **Hierarchy** — Are the most important facts above the fold?
3. **Motion toward action** — Is the next step obvious?
4. **Trust** — Does it feel finished and premium?
5. **Density** — Appropriate content density? No voids?
6. **Proof and feedback** — Does it show progress, earnings, or value?

## Git Workflow

- Develop on the designated feature branch (see task instructions)
- Commit message format: `feat(<scope>): Batch N — {Description}`
- Review fix commits: `fix(<scope>): resolve Batch N review findings`
- Doc sync commits: `docs: sync documentation after phase N`
- Push to feature branch after each batch; PR into `main` when phase is complete

## Test Credentials

- customer@test.com / 65406540
- provider@test.com / 65406540
- admin@test.com / 65406540

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (validates)
npx tsc --noEmit     # Type check without emit
npm run test         # Vitest unit tests
npx playwright test  # Run E2E tests
```

## Visual Validation with Playwright

After each batch, visually verify your changes using Playwright screenshots. The repo has a full screenshot catalog setup.

### Quick: Screenshot a specific page

```bash
# Start dev server first
npm run dev &

# Take a screenshot of a specific page (example: provider Dashboard)
npx playwright test e2e/screenshot-catalog.spec.ts -g "provider-dashboard" \
  --project=chromium
```

Screenshots are saved to `e2e/milestones/`. Open them to verify your changes rendered correctly.

### Full screenshot catalog

```bash
# Capture all screens for a role at once
npx playwright test e2e/screenshot-catalog.spec.ts -g "Provider Screens" \
  --project=chromium
```

### Environment variables for auth

```bash
export BASE_URL=http://localhost:5173
export TEST_CUSTOMER_EMAIL=customer@test.com
export TEST_CUSTOMER_PASSWORD=65406540
export TEST_PROVIDER_EMAIL=provider@test.com
export TEST_PROVIDER_PASSWORD=65406540
export TEST_ADMIN_EMAIL=admin@test.com
export TEST_ADMIN_PASSWORD=65406540
```

Run auth setup before screenshot tests:

```bash
npx playwright test e2e/auth.setup.ts --project=auth-setup
```

### What to check in screenshots

1. **Layout** — No overflow, no truncated text, proper spacing
2. **Dark mode** — Colors readable, no white-on-white or dark-on-dark
3. **Empty states** — Icon + title + body + CTA (not blank screens)
4. **Touch targets** — Buttons/links at least 44×44px
5. **Bottom safe area** — Content not hidden behind tab bar (pb-24)
6. **New components** — Actually visible and positioned correctly

### Mobile viewport

Playwright is configured for iPhone-like viewport (390×844). All screenshots should match the mobile-first design target.

## Conventions

- Pages are in `src/pages/<role>/` — one file per route
- Reusable components go in `src/components/<role>/` or `src/components/ui/`
- Data fetching uses custom hooks in `src/hooks/` wrapping React Query + Supabase
- Forms use React Hook Form + Zod validation
- Toast notifications via Sonner
- Drawers/sheets via Vaul + Radix Sheet
- Navigation guards use `ProtectedRoute`, `SubscriptionGate`, `CustomerPropertyGate`
