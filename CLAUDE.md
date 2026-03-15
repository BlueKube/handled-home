# Handled Home — Claude Code Project Guide

## Project Overview

Handled Home is a **managed home-maintenance platform** — "Your home, handled." Customers set up their home once, get a recommended recurring service plan, and manage all home services (lawn, pool, pest, etc.) from one app with one-tap add-ons, standardized quality levels, and proof-of-work receipts. For providers, the app fills schedules with recurring work, reduces admin, and improves route density.

Three user roles: **Customer**, **Provider**, **Admin**.

## Your Current Mission

You are continuing a UI/UX overhaul of the Handled Home app. The customer redesign (12 epics) and all provider pages (11 batches, 34 pages) are complete. The next phase is **admin pages** — 59 pages that need the same consistency polish.

## Workflow (Non-Negotiable)

Follow this exact sequence for every batch. Do not skip steps.

1. **Re-anchor to the roadmap** — State which provider pages/areas this batch covers and what remains.
2. **Write a spec before coding** — Every batch needs a markdown spec with: title, why it matters, scope, non-goals, exact file targets, acceptance criteria, regression risks, visual validation checklist.
3. **Keep batches small** — 1 theme across 1-3 screens. Don't mix unrelated fixes.
4. **Implement only the spec** — If you find something out of scope, defer it.
5. **Run independent subagent code review** — Launch a fresh subagent with NO implementation context. Give it the git diff, acceptance criteria, and design system rules. The subagent categorizes findings as MUST-FIX / SHOULD-FIX / NICE-TO-HAVE. See `docs/skills/redesign-workflow-guide.md` step 5 for details.
6. **Fix all MUST-FIX findings** — Do not merge until review is clear. Re-run review if substantial changes were needed.
7. **Validate build** — Run `npx tsc --noEmit` and `npm run build` before considering a batch done.
8. **Reconcile** — After each batch, update which pages are done and what's next.
9. **Sync documentation after each phase** — After completing a phase (group of related batches), review all key docs for stale info: page names, navigation specs, design patterns, product strategy sections. See `docs/skills/redesign-workflow-guide.md` step 9.

## Workflow & UX Reference Docs

Read these before starting any batch:
- `docs/skills/redesign-workflow-guide.md` — Batch execution workflow (MUST follow)
- `docs/skills/mobile-ui-ux-guide.md` — Mobile UX design principles and review framework

## Key Reference Docs

These are already in the repo under `docs/`. Read all of these before starting work:
- `docs/screen-flows.md` — The source of truth for all screen layouts, flows, and component specs (~68KB)
- `docs/design-guidelines.md` — Design tokens, spacing, color, typography, component specs
- `docs/masterplan.md` — Business model, vision, product strategy (~35KB)
- `docs/operating-model.md` — Unit economics, pricing mechanics, margin levers, provider payouts (~17KB)
- `docs/app-flow-pages-and-roles.md` — Complete route tree (141 pages) with role gates and primary user journeys
- `docs/feature-list.md` — Full feature inventory by area

## What's Already Complete

### Customer Redesign (PR #29 — merged)
All 12 customer epics complete. 36 customer pages polished.

### Provider Batch 1: Dashboard & Earnings Clarity (PR #30 — merged)
- New `DailyRecapCard.tsx` component on Dashboard
- Modifier explanation labels on Earnings
- Expandable hold detail on Earnings
- `useProviderEarnings.ts` extended with `ProviderEarning`/`HeldEarning` types, `heldEarnings` array
- `useProviderJobs.ts` with `"today_all"` filter
- New `src/utils/format.ts` shared `formatCents` utility

### Provider Batch 2: Job Flow & Navigation Polish (PR #31 — merged)
- Sticky action bar on `JobDetail.tsx` (fixed bottom-16, pb-48)
- Queue position breadcrumb ("Stop X of Y") with prev/next navigation
- Enhanced completion celebration on `JobComplete.tsx` with route progress bar
- New `RouteProgressCard.tsx` on Dashboard
- Review fixes: tap targets, aria-live, progress bar min-width, earnings column fix, loading skeleton

## Provider Redesign (Complete)

All 34 provider pages and key provider components have been polished across 11 batches:

| Batch | Scope | Status |
|-------|-------|--------|
| 1 | Dashboard, Earnings | Complete (PR #30) |
| 2 | JobDetail, JobComplete, Jobs | Complete (PR #31) |
| 3 | JobChecklist, JobPhotos | Complete |
| 4 | Payouts, PayoutHistory, History | Complete |
| 5 | Performance, QualityScore, Insights, InsightsHistory | Complete |
| 6 | Availability, Coverage, WorkSetup | Complete |
| 7 | Organization, Settings, SKUs | Complete |
| 8 | Support, SupportTicketDetail, Referrals | Complete |
| 9 | ByocCenter, ByocCreateLink, InviteCustomers | Complete |
| 10 | Onboarding (7 pages), Apply, Performance | Complete |
| 11 | Component Cleanup (VisitJobCard, NotificationBanners, WeekDueQueue) | Complete |

### Consistency standards applied across all pages
- `animate-fade-in` on main containers
- `p-4 pb-24` padding (pb-24 for bottom tab bar clearance)
- `text-h2` for page titles, `text-caption` for subtitles
- `ChevronLeft` back navigation with aria-labels
- 44px minimum touch targets
- Semantic color tokens only (no hardcoded colors)
- No `max-w-lg` or `max-w-2xl` constraints (mobile-only app)
- Shared `formatCents` from `@/utils/format`

### Deferred Items
- L4: Extract shared `RouteProgressBar` component (JobComplete + RouteProgressCard — different semantics, low priority)
- L10: Add focus ring to Proof Required buttons in JobDetail
- L11: Confirm `replace: true` behavior on breadcrumb navigation

## What Remains — Admin Pages

59 admin pages need the same UX consistency pass. Customer (36 pages) and Provider (34 pages) are complete.

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
| Safe area | Use `pb-safe` for iOS safe area |

Button variants: `default` (navy), `accent` (cyan), `outline`, `ghost`, `destructive`, `secondary`.

All colors use CSS custom properties via `hsl(var(--<name>))` — defined in `src/index.css`.

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
1. **Clarity** — Can the provider understand the screen's purpose in 3 seconds?
2. **Hierarchy** — Are the most important facts above the fold?
3. **Motion toward action** — Is the next step obvious?
4. **Trust** — Does it feel finished and premium?
5. **Density** — Appropriate content density? No voids?
6. **Proof and feedback** — Does it show progress, earnings, or value?

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

## Git Workflow

- Create a branch per batch: `provider-ux/batch{N}-{short-description}`
- Commit message format: `feat(provider-ux): Batch N — {Description}`
- Review fix commits: `fix(provider-ux): resolve Batch N review findings`
- PR into `main`
- Squash merge with descriptive commit message

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

# Take a screenshot of a specific provider page (example: Dashboard)
npx playwright test e2e/screenshot-catalog.spec.ts -g "provider-dashboard" \
  --project=chromium
```

Screenshots are saved to `e2e/milestones/`. Open them to verify your changes rendered correctly.

### Full provider screenshot catalog

```bash
# Capture all provider screens at once
npx playwright test e2e/screenshot-catalog.spec.ts -g "Provider Screens" \
  --project=chromium
```

### Write a quick one-off validation script

For pages not in the catalog, or to test specific states:

```typescript
// e2e/validate-batch.spec.ts (temporary, don't commit)
import { test, expect } from "@playwright/test";
import path from "path";

test.use({
  storageState: path.join(__dirname, ".auth", "provider.json"),
});

test("validate batch changes", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("handled_active_role", "provider");
  });

  // Navigate to the page you changed
  await page.goto("/provider/jobs");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "test-results/provider-jobs.png", fullPage: true });

  // Test dark mode too
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/provider-jobs-dark.png", fullPage: true });
});
```

### Environment variables for auth

The e2e auth setup reads credentials from environment variables:

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
