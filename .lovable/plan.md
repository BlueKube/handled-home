

# Fix: Auth Login/Signup Hanging

## Root Cause

The Supabase JS client holds an internal session lock when firing `onAuthStateChange`. The current code uses `async`/`await` inside that callback (line 70-80 of `AuthContext.tsx`), which causes a deadlock -- the PostgREST requests in `fetchUserData` need the same lock to read the auth token, but it's already held.

The same issue affects the `bootstrap_new_user` RPC call in `AuthPage.tsx` (line 69) -- it runs while the session lock is still held from `signUp()`.

## Changes

### 1. `src/contexts/AuthContext.tsx`

- Remove `async` from `onAuthStateChange` callback
- Replace `await fetchUserData(...)` with `setTimeout(() => fetchUserData(...), 0)` to defer execution outside the lock
- Move `setLoading(false)` into `fetchUserData` (at the end, in a `finally` block) so loading clears only after data is loaded
- Add self-healing bootstrap: if `fetchUserData` finds zero roles, call `bootstrap_new_user` RPC and re-fetch. This handles partial signups automatically.
- Keep the `getSession().then(...)` path unchanged except also using the updated `fetchUserData` (which now handles its own loading state)

### 2. `src/pages/AuthPage.tsx`

- Remove the `bootstrap_new_user` RPC call from `handleSignup` (lines 67-75). The bootstrap is now handled inside `fetchUserData` when it detects missing roles.
- Keep `navigate("/")` after signup -- the `onAuthStateChange` flow will handle everything else.

### 3. Manual data fix for existing test user

The user `test@handled.home` (id: `7cfa1714-bf93-441f-99c0-4bc3e24a284c`) exists in auth but has no profile or role. Run a SQL migration to insert their profile and customer role so they can log in after the fix.

## Technical Detail

```text
BEFORE (deadlock):
  signIn() --[holds lock]--> onAuthStateChange(async cb)
    --> await fetchUserData()
      --> supabase.from("user_roles")... --[needs lock]--> HANG

AFTER (fixed):
  signIn() --[holds lock]--> onAuthStateChange(cb)
    --> setTimeout(fetchUserData, 0)  // queued, returns immediately
    --> lock released
  --> fetchUserData() runs freely, lock available
```
