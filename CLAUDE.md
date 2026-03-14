# Handled Home — Claude Code Project Guide

## Project Overview

Handled Home is a **managed home-maintenance platform** — "Your home, handled." Customers set up their home once, get a recommended recurring service plan, and manage all home services (lawn, pool, pest, etc.) from one app with one-tap add-ons, standardized quality levels, and proof-of-work receipts. For providers, the app fills schedules with recurring work, reduces admin, and improves route density.

Three user roles: **Customer**, **Provider**, **Admin**.

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
│   ├── customer/    # 36 customer pages
│   ├── provider/    # 42 provider pages
│   ├── admin/       # 59 admin pages
│   └── shared/      # Shared pages
├── hooks/           # 60+ custom React hooks
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

Button variants: `default` (navy), `accent` (cyan), `outline`, `ghost`, `destructive`, `secondary`.

All colors use CSS custom properties via `hsl(var(--<name>))` — defined in `src/index.css`.

## Stitch MCP Server — Design-to-Code Workflow

The `stitch` MCP server is configured in `.claude/settings.json`. It connects to Google Stitch to pull AI-generated designs.

### Available MCP Tools

| Tool | Purpose | Parameters |
|------|---------|------------|
| `get_screen_code` | Get HTML code for a design screen | `projectId`, `screenId` |
| `get_screen_image` | Get screenshot as base64 image | `projectId`, `screenId` |
| `build_site` | Build full site mapping screens to routes | `projectId`, `routes[]` |

### Implementation Workflow

When implementing a screen from Stitch designs:

1. **Pull the design** — Use `get_screen_image` to see the visual design, then `get_screen_code` to get the HTML reference
2. **Map to existing components** — Translate Stitch HTML into existing shadcn/ui components (`Card`, `Button`, `Badge`, `Tabs`, etc.) and project-specific components
3. **Follow existing patterns** — Match the file structure and hook patterns already in the codebase (React Query hooks, Supabase integration, etc.)
4. **Respect the design system** — Use Tailwind classes with CSS variable colors (`bg-primary`, `text-accent`, etc.), not hardcoded values
5. **Keep mobile-first** — All customer/provider screens target 390×844 viewport with safe area padding

### Key Design Docs

- `docs/masterplan.md` — Business model, vision, flywheels, and product strategy
- `docs/operating-model.md` — Unit economics, pricing mechanics, margin levers, provider payouts
- `docs/screen-flows.md` — 30+ user flows with detailed screen specs (layout, copy, components, states)
- `docs/app-flow-pages-and-roles.md` — Complete route tree with page names and gates

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run Vitest unit tests
npx playwright test  # Run E2E tests
```

## PR Review Workflow

When working on a PR or responding to code review feedback, use `gh` CLI to fetch comments:

```bash
# Quick: fetch all review data for a PR
./scripts/fetch-pr-review.sh <PR_NUMBER>

# Individual commands:
gh pr view <NUMBER> --comments                              # Conversation comments
gh api repos/{owner}/{repo}/pulls/<NUMBER>/comments         # Inline code review comments
gh api repos/{owner}/{repo}/pulls/<NUMBER>/reviews          # Review verdicts (approved, changes requested)
```

**Steps when addressing review feedback:**
1. Run `./scripts/fetch-pr-review.sh <PR#>` to see all pending comments
2. Address each comment — fix code, respond, or discuss
3. Commit fixes and push to the PR branch
4. Optionally reply to resolved comments via `gh api`

## Conventions

- Pages are in `src/pages/<role>/` — one file per route
- Reusable components go in `src/components/<role>/` or `src/components/ui/`
- Data fetching uses custom hooks in `src/hooks/` wrapping React Query + Supabase
- Forms use React Hook Form + Zod validation
- Toast notifications via Sonner
- Drawers/sheets via Vaul + Radix Sheet
- Navigation guards use `ProtectedRoute`, `SubscriptionGate`, `CustomerPropertyGate`
