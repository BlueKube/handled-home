
# Module 01 Fixes — Claude Code Review Remediation

## CRITICAL Fixes

### 1. Privilege Escalation in `handle_new_user()` trigger
The trigger reads `role` from `raw_user_meta_data`, allowing a malicious client to pass `role: 'admin'` during signup. Fix: hard-code `'customer'` and ignore user-supplied metadata.

**Database migration** to replace the function:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');

  RETURN NEW;
END;
$$;
```

### 2. ProtectedRoute checks `roles.includes()` instead of `activeRole`
A multi-role user with `activeRole=customer` can access `/admin/*` routes. Fix line 30 in `src/components/ProtectedRoute.tsx`:

Change `!roles.includes(requiredRole)` to `activeRole !== requiredRole`.

---

## MODERATE Fixes

### 3. `profiles.full_name` should be NOT NULL
Database migration to add the constraint:
```sql
ALTER TABLE public.profiles ALTER COLUMN full_name SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN full_name SET DEFAULT '';
```

### 4. Remove redundant `handle_new_user()` trigger
Both the trigger and `bootstrap_new_user()` RPC do the same work. Since the RPC is called explicitly from signup and is more controlled, drop the trigger and keep only the RPC. This also fully eliminates the privilege escalation vector.

**Database migration:**
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

### 5. Add explicit DELETE deny policy on `profiles`
```sql
CREATE POLICY "No one can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (false);
```

---

## Files to modify

- **New migration file** — Contains all SQL changes (fix trigger/drop it, NOT NULL on full_name, DELETE deny policy)
- **`src/components/ProtectedRoute.tsx`** — Line 30: change `roles.includes(requiredRole)` to `activeRole !== requiredRole`

## Items intentionally deferred

- **Settings role switcher** (items 5 from review) — Already works via MoreMenu; Settings pages will be built out in a future iteration
- **Inline form errors** (item 9) — UX polish, not a security or correctness issue
- **Analytics events** (item 10) — Spec says "recommended", will add when analytics infra is built
- **Automated tests** (item 11) — Will be addressed in a dedicated testing pass
- **Profiles PK schema** (item 4) — Current `id` + `user_id` pattern works correctly with all RLS policies; changing it now would require migrating existing data and updating all queries for marginal benefit
