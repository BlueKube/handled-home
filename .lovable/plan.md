

# Module 01: Auth & Roles — Full Implementation Plan

## Overview
Implement production-ready authentication and role-based access control per the expanded Module 01 PRD. This covers the signup flow with automatic profile + role creation, session restoration, "Account Not Configured" handling, hardened RLS, and route protection. Two new documentation files will also be created.

---

## Current State Assessment

**What exists and works:**
- `profiles` table with `user_id` column (not `id = auth.uid()` as spec suggests, but functionally equivalent)
- `user_roles` table with `app_role` enum (`customer | provider | admin`)
- `has_role()` security definer function
- RLS policies on both tables
- `AuthContext` with session restore, role fetching, and active role persistence
- `ProtectedRoute` component with role gating
- Basic auth page with login/signup tabs

**Gaps to close:**
1. Signup does NOT create `profiles` or `user_roles` rows — it only stores metadata on the auth user
2. No `bootstrap_new_user` RPC function to safely create profile + default role
3. No "Account Not Configured" screen for users with 0 roles
4. Signup allows role selection (should be customer-only per spec)
5. No confirm password field on signup
6. No password minimum 8 chars enforcement (currently 6)
7. `ProtectedRoute` doesn't handle the empty-roles case
8. `AuthContext` doesn't expose profile data
9. Logout doesn't clear `activeRole` from localStorage
10. RLS on `user_roles` allows arbitrary client inserts (should be restricted)

---

## Implementation Steps

### Step 1: Database Migration — `bootstrap_new_user` RPC

Create an idempotent Postgres RPC function that:
- Accepts `_full_name text` parameter
- Uses `auth.uid()` to identify the caller
- Inserts a `profiles` row if none exists for this user
- Inserts a `user_roles` row with `role = 'customer'` if user has 0 roles
- Returns void (or the profile row)
- Is `SECURITY DEFINER` so it bypasses RLS for the insert

```sql
CREATE OR REPLACE FUNCTION public.bootstrap_new_user(_full_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure profile exists
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (auth.uid(), _full_name)
  ON CONFLICT (user_id) DO NOTHING;

  -- Assign customer role if no roles exist
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'customer');
  END IF;
END;
$$;
```

Also add a unique constraint on `profiles.user_id` if not already present, and ensure `unique(user_id, role)` on `user_roles`.

### Step 2: Tighten RLS on `user_roles`

Remove the current client-side INSERT policy ("Service role can insert roles") and replace with a more restrictive one, or rely entirely on the `bootstrap_new_user` SECURITY DEFINER function for role assignment. This prevents privilege escalation (a user inserting `admin` role for themselves).

### Step 3: AuthContext Upgrade (`src/contexts/AuthContext.tsx`)

- Add `profile` state (full_name, phone, avatar_url) to context
- Fetch profile alongside roles in a combined `fetchUserData()` function
- Implement deterministic active role resolution per spec: customer > provider > admin
- Clear localStorage `handled_active_role` on sign out
- Expose `profile` in context value

### Step 4: ProtectedRoute Upgrade (`src/components/ProtectedRoute.tsx`)

Add the "Account Not Configured" case:
1. If loading -> full-screen loader (with branded spinner)
2. If no user -> redirect to `/auth`
3. If user exists but `roles.length === 0` -> render "Account Not Configured" screen
4. If `requiredRole` and role mismatch -> redirect to active role root
5. Else render children

### Step 5: New "Account Not Configured" Component

Create `src/components/AccountNotConfigured.tsx`:
- Title: "Account Not Configured"
- Body: "Your account hasn't been assigned a role yet. Please contact support."
- CTA: "Sign Out" button
- No back navigation, no sidebar, no tab bar
- Full-screen, centered, mobile-friendly

### Step 6: Auth Page Overhaul (`src/pages/AuthPage.tsx`)

**Login tab:**
- Email + Password fields (unchanged)
- Loading state disables inputs and shows spinner on button
- Error displayed via toast (no account enumeration)
- On success: navigate to `/` (RootRedirect handles routing)

**Signup tab:**
- Fields: Full Name, Email, Password, Confirm Password
- Remove role selector (customer-only by spec)
- Validations: full name required, email format, password min 8 chars, confirm match
- On success:
  1. `supabase.auth.signUp({ email, password })`
  2. Call `supabase.rpc('bootstrap_new_user', { _full_name: fullName })`
  3. Navigate to `/`
- Error handling: friendly message for "email already in use"

**Forgot password link:** Show as a text link below login form (stub — navigates nowhere or shows toast "Coming soon")

### Step 7: Logout Cleanup

In `AuthContext.signOut()`:
- Call `supabase.auth.signOut()`
- Clear `handled_active_role` from localStorage
- Reset all state (user, session, roles, profile)

### Step 8: RootRedirect Enhancement (`src/App.tsx`)

Update `RootRedirect` to handle empty roles:
- If loading -> null
- If no user -> `/auth`
- If roles empty -> `/account-not-configured` or let ProtectedRoute handle it
- Else -> `/${activeRole}`

### Step 9: Documentation Files

**Replace** `docs/modules/01-auth-and-roles.md` with the uploaded expanded PRD content.

**Create** `docs/global-system-architecture.md` with the uploaded architecture spec.

### Step 10: Constants File

Create `src/constants/roles.ts`:
- Export `ROLE_PRIORITY` array: `['customer', 'provider', 'admin']`
- Export `STORAGE_KEYS` object: `{ ACTIVE_ROLE: 'handled_active_role' }`
- Used by AuthContext for deterministic resolution

---

## Files Impact

### New files:
- `src/components/AccountNotConfigured.tsx` — No-role fallback screen
- `src/constants/roles.ts` — Role constants and storage keys
- `docs/global-system-architecture.md` — Global architecture spec

### Modified files:
- `src/contexts/AuthContext.tsx` — Profile state, deterministic role resolution, logout cleanup
- `src/components/ProtectedRoute.tsx` — Empty-roles handling with AccountNotConfigured
- `src/pages/AuthPage.tsx` — Remove role selector, add confirm password, call bootstrap RPC, validation
- `src/App.tsx` — Minor RootRedirect adjustment

### Replaced files:
- `docs/modules/01-auth-and-roles.md` — Full replacement with expanded PRD

### Database changes:
- New RPC function: `bootstrap_new_user(_full_name text)`
- Add unique constraint on `profiles(user_id)` if missing
- Tighten `user_roles` INSERT RLS policy (remove client-side insert, rely on SECURITY DEFINER RPC)

