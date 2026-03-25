# Spec Builder — Claude Code Project Guide

## Project Overview

Spec Builder is an **AI-powered documentation IDE for spec-driven development**. It helps teams create structured project documentation (masterplans, design systems, screen flows, feature lists, operating models), derive downstream documents automatically, keep everything in sync, and generate implementation-ready PRDs that feed into AI coding agents.

Think of it as the **planning layer** for AI-native development — where specs are authored before code is written, and documentation stays alive as the product evolves.

Three user roles: **Owner**, **Editor**, **Viewer**.

## Workflow (Non-Negotiable)

**Every implementation task — whether a new feature, redesign, bug fix batch, or system overhaul — follows the PRD-to-Production workflow.**

Read and follow `docs/skills/prd-to-production-workflow.md` before starting any work. Do not skip steps.

### Quick reference (full details in the workflow doc)

1. **PRD → Plan** — Decompose the PRD into phases and batches. Write `docs/working/plan.md`. Get human approval.
2. **Batch execution** — For each batch: re-anchor → write spec in `docs/working/batch-specs/` → implement → commit & push → code review (via sub-agents) → fix loop → validate build → push.
3. **Doc sync** — After each phase, sync the six north star documents (see below).
4. **Phase transition** — Consolidation check (duplicated patterns, dead code, overgrown files) → fresh session → restate what's next.
5. **Completion** — Final recap, archive `docs/working/` to `docs/archive/[prd-name]-[YYYY-MM-DD]/`, clean working folder, pick up next PRD from `docs/upcoming/`.

### Slash commands

- `/code-review` — 8-agent review (3 parallel lanes + 1 synthesis lane × 2 tiers). Phase mode (no args) or PR mode (`/code-review 123`).

### Mandatory Code Review — Non-Negotiable

**After committing every batch, you MUST run the 8-agent code review before moving to the next batch.** No exceptions. The review is part of the definition of done for a batch, not a separate optional step.

A batch is not complete until: `implement → commit → code review → fix loop → validate build → push`. Skipping the review and pushing is a workflow violation.

### Working folder structure

```
docs/working/
├── prd.md              # The current PRD (copied here at start)
├── plan.md             # The phased implementation plan (includes Session Handoff + Progress Table)
└── batch-specs/        # Individual batch specs (one per batch)

docs/upcoming/          # PRD queue for scheduled automation (numbered: 001-xxx.md, 002-xxx.md)
```

### Progress tracker status key

| Symbol | Meaning |
|--------|----------|
| `✅` | Complete and pushed |
| `🟡` | In progress — partial work pushed (note what's done) |
| `⬜` | Not started |
| `❌` | Blocked (note reason) |

## Six North Star Documents

| Document | Purpose |
|----------|---------|
| `docs/masterplan.md` | Business plan, vision, value proposition, growth strategy |
| `docs/operating-model.md` | Revenue model, unit economics, thresholds, operational rules |
| `docs/screen-flows.md` | Screen layouts, components, navigation, empty/loading states |
| `docs/app-flow-pages-and-roles.md` | Route tree, page inventory, role gates, user journeys |
| `docs/feature-list.md` | Feature inventory, delivery status, strategic tags |
| `docs/design-guidelines.md` | Design tokens, spacing, typography, component specs, accessibility |

## Tech Stack

- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS 4 + shadcn/ui (Radix primitives)
- **State/Data:** TanStack React Query + Supabase (auth, DB, realtime, edge functions)
- **Routing:** React Router DOM 7
- **Rich Editor:** Tiptap (ProseMirror-based)
- **Diff Rendering:** Custom diff components with IDE-style green/red highlighting
- **AI Integration:** Anthropic Claude API via Supabase Edge Functions
- **Graph Visualization:** React Flow
- **Hosting:** Vercel
- **Icons:** Lucide React
- **Animation:** Framer Motion
- **Testing:** Vitest + Playwright

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui base components
│   ├── editor/          # Tiptap editor, diff viewer, markdown renderer
│   ├── documents/       # Document chain, document cards, sync indicators
│   ├── personas/        # AI persona avatars, suggestion cards, toggle controls
│   ├── prd/             # PRD editor, queue manager, export controls
│   ├── project/         # Project dashboard, big picture view, dependency graph
│   ├── collaboration/   # Comments, presence indicators, role badges
│   └── settings/        # Project settings, team management, billing
├── pages/
│   ├── auth/            # Login, signup, password reset
│   ├── dashboard/       # Project list, create project
│   ├── project/         # Project workspace (main editing environment)
│   └── settings/        # Account settings, billing
├── hooks/               # Custom React hooks
├── contexts/            # Auth, project, editor contexts
├── lib/                 # Utilities (diff engine, markdown, AI client, etc.)
├── constants/           # Config constants, persona definitions
└── integrations/        # Supabase client + types
```

## Key Aliases

- `@/components` → `src/components`
- `@/components/ui` → `src/components/ui`
- `@/lib` → `src/lib`
- `@/hooks` → `src/hooks`

## Design System

| Token | Value |
|-------|-------|
| Primary | Deep Indigo `hsl(234, 55%, 18%)` |
| Accent | Electric Blue `hsl(220, 90%, 56%)` |
| Success | Emerald `hsl(152, 60%, 42%)` — used for diff additions |
| Destructive | Rose `hsl(0, 72%, 51%)` — used for diff deletions |
| Warning | Amber `hsl(38, 92%, 50%)` |
| Background | Cool Gray `hsl(220, 14%, 96%)` |
| Card | White, `rounded-2xl`, shadow `0 1px 3px rgba(0,0,0,0.06)` |
| Font | Inter (300–700) |
| Code Font | JetBrains Mono |
| Viewport | Desktop-first (1440px primary), responsive down to 768px |
| Button heights | default 36px, large 40px, xl 44px — all `rounded-lg` |
| Input | 40px height, `rounded-lg`, border gray |
| Sidebar | Fixed left, 280px, collapsible to 64px icon-only |
| Touch target | Min 36×36px |
| Icons | Lucide React |

### Persona Colors

| Persona | Color | Icon |
|---------|-------|------|
| Visionary | Purple `hsl(270, 70%, 55%)` | `Sparkles` |
| Engineer | Slate `hsl(215, 20%, 45%)` | `Wrench` |
| Project Manager | Teal `hsl(180, 55%, 40%)` | `ListChecks` |
| Auditor | Amber `hsl(38, 92%, 50%)` | `SearchCheck` |

Button variants: `default` (indigo), `accent` (blue), `outline`, `ghost`, `destructive`, `secondary`, `success`.

All colors use CSS custom properties via `hsl(var(--<name>))` — defined in `src/index.css`.

### Diff styling

- **Additions:** `bg-success/10` background, `border-l-2 border-success` left accent
- **Deletions:** `bg-destructive/10` background, `border-l-2 border-destructive` left accent, strikethrough text
- **Inline changes:** Character-level highlighting within changed lines
- **Pending suggestions:** Dashed border, muted opacity until accepted

## UX Principles

- The product should feel like a **professional IDE for documentation**, not a note-taking app
- The big picture view should answer "what's the state of my project?" in 3 seconds
- AI suggestions should feel like contributions from a smart teammate, not spam
- Persona suggestions should be visually distinct and clearly attributed
- Diffs should be immediately scannable — the user should see what changed without reading every word
- Empty states need: icon, title, body copy, clear next step
- Every screen should answer: what document am I looking at, is it up to date, what should I do next
- Copy tone: intelligent, capable, collaborative — never condescending or overly casual

## Screen Review Dimensions

For each page you touch, evaluate:
1. **Clarity** — Can the user understand the screen's purpose in 3 seconds?
2. **Hierarchy** — Are the most important elements (document status, pending changes) above the fold?
3. **Motion toward action** — Is the next step obvious (edit, accept, generate, export)?
4. **Trust** — Does it feel polished and professional?
5. **Information density** — Appropriate for a power-user tool? No wasted space?
6. **Context** — Does the user always know where they are in the document chain?

## Git Workflow

- Develop on the designated feature branch (see task instructions)
- Commit message format: `feat(<scope>): Batch N — {Description}`
- Review fix commits: `fix(<scope>): resolve Batch N review findings`
- Doc sync commits: `docs: sync documentation after phase N`
- Push to feature branch after each batch; PR into `main` when phase is complete

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (validates)
npx tsc --noEmit     # Type check without emit
npm run test         # Vitest unit tests
npx playwright test  # Run E2E tests
```

## Conventions

- Pages are in `src/pages/<section>/` — one file per route
- Reusable components go in `src/components/<area>/` or `src/components/ui/`
- Data fetching uses custom hooks in `src/hooks/` wrapping React Query + Supabase
- Forms use React Hook Form + Zod validation
- Toast notifications via Sonner
- Navigation guards use `ProtectedRoute` component
- AI calls go through Supabase Edge Functions — never call the Anthropic API directly from the client
- Persona logic lives in `src/lib/personas/` — each persona has a system prompt, trigger conditions, and display config
- Document chain logic lives in `src/lib/document-chain/` — derivation order, dependency resolution, staleness detection
