# PRD: Core Scaffold, Auth & Project Shell

## Execution Mode

Speed mode — this is the foundation scaffold, low risk, needs to move fast.

## Problem Statement

Spec Builder has no codebase yet. We need the foundational infrastructure: a working React app with authentication, routing, role-based access, the project CRUD operations, and the shell pages that everything else will be built into.

## Goals

1. A deployable app with working auth (email/password + GitHub OAuth)
2. Project creation, listing, and navigation
3. The project workspace shell with sidebar navigation
4. Protected routes with role-based access (Owner/Editor/Viewer)
5. Supabase database schema for users, projects, team members, and documents
6. All shell pages rendering with proper layout (can be empty states)

## Scope

### Included
- Vite + React + TypeScript project setup
- Tailwind CSS 4 + shadcn/ui configuration
- Supabase client setup (auth, database)
- Auth pages: login, signup, forgot password, reset password
- Dashboard: project list + create project
- Project workspace: sidebar layout + all shell pages (empty states)
- React Router setup with full route tree
- ProtectedRoute component with role gates
- Supabase schema: users, projects, project_members, documents tables
- RLS policies for role-based access
- Dark mode support (CSS custom properties)

### Excluded
- Tiptap editor integration (Phase 2)
- AI generation (Phase 2)
- Persona system (Phase 2)
- PRD pipeline (Phase 3)
- Real-time collaboration (future)
- Billing/Stripe integration (future)

## User Stories

1. As a new user, I can sign up with email/password and land on an empty dashboard
2. As a returning user, I can log in and see my projects
3. As an owner, I can create a new project with name, description, and tech stack
4. As an owner, I can navigate into a project and see the workspace with sidebar
5. As an editor, I can access shared projects but not project settings
6. As a viewer, I can see projects in read-only mode

## Acceptance Criteria

- [ ] `npm run dev` starts the app without errors
- [ ] `npm run build` produces a clean production build
- [ ] `npx tsc --noEmit` passes with no type errors
- [ ] Auth flow works end-to-end (signup → verify → login → dashboard)
- [ ] All 18 routes from the app-flow doc are registered and render a page
- [ ] Sidebar navigation works within the project workspace
- [ ] Role gates prevent unauthorized access (Editor can't see settings, Viewer is read-only)
- [ ] Dark mode toggle works and all pages render correctly in both modes
- [ ] Empty states are present on all content pages
- [ ] Supabase schema is defined and RLS policies are applied

## Phases

### Phase 1: Project Setup + Auth (Batches 1–3)
- Vite scaffold, Tailwind, shadcn/ui, Supabase client
- Auth pages + auth context
- Database schema + RLS

### Phase 2: Dashboard + Project CRUD (Batches 4–5)
- Dashboard page with project cards
- Create project flow
- Project data layer (hooks, queries)

### Phase 3: Project Workspace Shell (Batches 6–8)
- Sidebar layout component
- All workspace pages (empty states)
- Route protection + role gates

## Priority

**High** — nothing else can be built until this exists.

## Constraints

- Must deploy to Vercel from day one (even as an empty shell)
- Supabase project must be created manually by the user before starting
- No mock data — use real Supabase from the start
