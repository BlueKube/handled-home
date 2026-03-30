# 01-auth-and-roles.md
> **Implementation Status:** ✅ Implemented in Round 1. Key divergences: Admin Preview Mode added (not in original spec).
**Handled Home — Module 01 PRD (Expanded, Production-Ready)**  
**Platform:** Mobile-only (iOS + Android) via Capacitor  
**Backend:** Supabase (Auth + Postgres + Storage + Edge Functions)  
**Last updated:** 2026-02-22

---

## 0) What this module does (and does not do)

### In scope
- Supabase **email/password** authentication (signup, login, logout, session restore)
- **Profiles** row creation + maintenance (`profiles`)
- **Role assignment** and retrieval (`user_roles`)
- **Active role** selection and persistence (multi-role future-proof)
- **Admin Preview Mode** — admins can view the app as Customer or Provider without needing those roles in the database
- **Role-based route protection** and routing tree gating
- Mobile-first auth UI (Login + Signup) and minimal Settings utility (role switcher + preview mode)
- “Account Not Configured” handling (no role assigned)
- Production-grade error handling, loading states, and security constraints
- Analytics events for auth/role flows (recommended)

### Out of scope (must not be implemented here)
- Property profiles (Module 02)
- Zones/capacity (Module 03)
- SKU catalog (Module 04)
- Subscription engine (Module 05)
- Service Day system (Module 06)
- Bundle builder (Module 07)
- Provider onboarding (Module 08)
- Job execution / photos (Modules 09–10)
- Billing/payouts (Module 11)
- Support/referrals/reporting (Modules 12–14)
- Any desktop UI logic, layouts, or CSS assumptions

---

## 1) Goals and success criteria

### Goal
Implement a production-ready authentication + role system that reliably gates access to **customer**, **provider**, and **admin** experiences on a **mobile-only** Capacitor app.

### Success criteria (Definition of Done)
- Signup creates Supabase user, inserts `profiles`, inserts `user_roles(customer)`, then routes to `/customer`
- Login restores session, loads `profiles` + `user_roles`, resolves `activeRole`, then routes to correct root
- App restart restores session without user action (no flicker into protected screens)
- Route protection prevents cross-role access (typing `/admin` as customer always redirects)
- “Account Not Configured” appears if a user has 0 roles
- Multi-role users can switch `activeRole` via Settings without logging out
- No desktop layout artifacts: single-column, touch-first, large tap targets

---

## 2) Key user stories

### Customer
- I can create an account with email + password.
- I can sign in and remain signed in between app opens.
- I cannot access provider/admin screens.

### Provider
- I can sign in and see provider routes when my active role is provider.
- If I also have customer role, I can switch roles without logging out.

### Admin
- I can sign in and see admin routes when my active role is admin.
- I am never logged into admin routes unintentionally.

### Ops/support
- If a user is missing roles, they see “Account Not Configured” and can sign out.

---

## 3) Business rules (authoritative)
1. Every authenticated user **must** have a row in `profiles`.
2. Every authenticated user **must** have ≥ 1 row in `user_roles`.
3. Users may have multiple roles, but **exactly one active role** at a time.
4. Routing is restricted by **active role**.
5. If user has no role assigned → show “Account Not Configured”.
6. If user is not authenticated → redirect to `/auth`.
7. Signup assigns **customer** by default. No provider/admin signup in-app.

---

## 4) Data model and constraints

### 4.1 Tables (assumed existing)

#### `profiles`
- `id` (uuid, PK) — must equal `auth.uid()`
- `full_name` (text, required)
- `phone` (text, optional)
- `created_at` (timestamptz, default now())

#### `user_roles`
- `user_id` (uuid, FK → `profiles.id`)
- `role` (enum: `customer` | `provider` | `admin`)
- `created_at` (timestamptz, default now())

### 4.2 Recommended hardening (non-breaking)
- Unique constraint: `unique(user_id, role)`
- Index: `index(user_id)`
- Prefer server-controlled role assignment (RPC/Edge Function)

---

## 5) Security model (RLS + trust boundaries)

### 5.1 Trust boundaries
- **Client is untrusted.** It may store `activeRole` but cannot grant access.
- Authorization is enforced by **RLS**.
- `activeRole` controls UI routing only; data access remains RLS-scoped.

### 5.2 RLS policies (minimum required)

#### `profiles`
- SELECT: `profiles.id = auth.uid()`
- INSERT: `profiles.id = auth.uid()`
- UPDATE: `profiles.id = auth.uid()`
- DELETE: disallow

#### `user_roles`
- SELECT: `user_roles.user_id = auth.uid()`
- INSERT/UPDATE/DELETE: disallow from client (recommended)

If client insert is allowed for bootstrap:
- allow only `role='customer'`
- allow only when `user_id=auth.uid()`
- allow only if user has 0 roles

---

## 6) UX requirements (mobile-only)

### 6.1 Visual constraints
- Single column
- Full-width inputs
- Tap targets ≥ 44px
- Safe-area aware spacing
- No hover-only interactions
- No sidebars

### 6.2 Screens

#### A) Login
Route: `/auth/login` (or `/auth`)
- Fields: Email, Password
- Actions:
  - Primary: Log in
  - Secondary: Sign up link
  - Link: Forgot password (stub OK)
- States:
  - Loading disables inputs + CTA spinner
  - Error shows inline (no account enumeration)

#### B) Signup (customer only)
Route: `/auth/signup`
- Fields: Full name, Email, Password, Confirm password
- Validations:
  - full name required
  - email format required
  - password min 8 chars
  - confirm matches
- Success:
  - Create `profiles`
  - Insert `user_roles(customer)`
  - Route to `/customer`

#### C) Account Not Configured
Shown when session exists but roles array is empty.
- Title: Account not configured
- Body: missing role assignment; contact support
- CTA: Sign out
- No back navigation

#### D) Settings (role switcher + preview mode)
Shown only when `roles.length > 1`
- Active role selector (RoleSwitcher)
- Sign out

#### E) Preview As Card (admin only)
Visible on all Settings pages (Customer, Provider, Admin) when the real `activeRole` is `admin`.
- Three buttons: Customer, Provider, Admin
- Clicking sets `previewRole` in AuthContext and navigates to the corresponding dashboard
- Clicking "Admin" clears `previewRole` (returns to real admin role)
- The component self-hides for non-admin users via guard: `if (activeRole !== "admin") return null`

---

## 7) Backend interaction contracts (Supabase)

### 7.1 Signup flow (recommended safe path)
Client steps:
1. `supabase.auth.signUp({ email, password })`
2. Call a single bootstrap RPC/Edge Function:
   - Ensures profile exists
   - Assigns default customer role if missing
3. Fetch profile + roles
4. Persist `activeRole='customer'`
5. Route to `/customer`

Why: prevents partial signup states.

### 7.2 Bootstrap RPC (recommended)
Name: `bootstrap_new_user(full_name text)`

Responsibilities:
- Ensure `profiles` row exists for `auth.uid()`
- Insert role `customer` if user has no roles
- Idempotent (safe to call multiple times)

### 7.3 Login flow
1. `supabase.auth.signInWithPassword({ email, password })`
2. Fetch profile + roles
3. Resolve activeRole (§8)
4. Route to role root

### 7.4 Logout
- `supabase.auth.signOut()`
- Clear `activeRole` from storage
- Reset AuthContext
- Route to `/auth/login`

---

## 8) Active role resolution (production)

Storage key: `activeRole`

Resolution:
1. If `activeRole` in storage is valid (i.e., user has that role) → use it.
2. Otherwise, pick highest-priority role:

Priority:
1. customer
2. provider
3. admin

Persist resolved `activeRole`.

### 8.1 Admin Preview Mode

Storage key: `handled_preview_role`

- `previewRole` state in AuthContext, persisted in localStorage
- `effectiveRole = previewRole ?? activeRole` — used by all UI components for rendering
- `activeRole` remains unchanged (always reflects the real database role)
- `ProtectedRoute` allows admins to access any role's routes when `previewRole` is set
- `previewRole` is cleared on sign-out
- Available only when real `activeRole === "admin"`

Components using `effectiveRole`: `BottomTabBar`, `MoreMenu`, `AppHeader`, `RoleSwitcher`, `PreviewAsCard`

---

## 9) Route protection

### ProtectedRoute behavior
1. If loading → full-screen loading
2. If no session → redirect `/auth/login`
3. If roles empty → Account Not Configured
4. If requiredRole and mismatch → redirect to active root
5. Else render children

Role roots:
- customer → `/customer`
- provider → `/provider`
- admin → `/admin`

Rendering rule:
- Never mount mixed role route trees.

---

## 10) Error states and edge cases
- Partial signup: bootstrap repairs missing profile/roles on next login.
- Invalid stored role: ignore and replace.
- Email in use: friendly prompt to log in.
- Offline: show “No connection”; retry without clearing session.
- Auth state changes: listen to `onAuthStateChange`.

---

## 11) Analytics events (recommended)
- `auth_signup_started/succeeded/failed`
- `auth_login_started/succeeded/failed`
- `auth_logout`
- `role_loaded`
- `role_missing`
- `role_switched`

---

## 12) Accessibility
- Labels for all inputs
- Errors not color-only
- Correct mobile keyboard actions (Next/Done)
- Focus first invalid field
- Tap targets ≥ 44px

---

## 13) Acceptance tests
1. Signup creates user + profile + customer role → `/customer`.
2. Login routes to correct root.
3. App restart persists session + activeRole.
4. Logout routes to `/auth/login`.
5. Customer visiting `/admin` redirects `/customer`.
6. Multi-role switch works without logout.
7. No-role user sees Account Not Configured.
8. Mobile-only layout verified.

---

## 14) File impact map
- `src/pages/AuthPage.tsx`
- `src/contexts/AuthContext.tsx` — includes `previewRole`, `setPreviewRole`, `effectiveRole`
- `src/components/ProtectedRoute.tsx` — admin bypass for preview mode
- `src/components/BottomTabBar.tsx` — uses `effectiveRole`
- `src/components/MoreMenu.tsx` — uses `effectiveRole`
- `src/components/AppHeader.tsx` — uses `effectiveRole`
- `src/components/settings/RoleSwitcher.tsx` — uses `effectiveRole`
- `src/components/settings/PreviewAsCard.tsx` — admin preview mode UI
- `src/pages/admin/Settings.tsx` — includes PreviewAsCard
- `src/pages/customer/Settings.tsx` — includes PreviewAsCard
- `src/pages/provider/Settings.tsx` — includes PreviewAsCard
- `src/constants/roles.ts`
- Supabase SQL (RLS policies + optional RPC)

---

## 15) Completion criteria
Module is complete when:
- auth is reliable
- routing is role-correct
- session persistence is stable
- no-role handling is safe
- acceptance tests pass
