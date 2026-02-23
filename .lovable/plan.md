

# Build Real Settings Pages (Module 01 — Final 10%)

The auth system, role resolution, route protection, and role switching are all implemented and working. The only remaining gap is the three placeholder Settings pages. The role switcher already works in the "More" menu, so Settings should focus on **profile management** and **account actions**.

---

## Shared Settings Features (all three roles)

Each Settings page will include:

1. **Profile Section** — Edit full name, phone number (reads/writes `profiles` table)
2. **Account Section** — Change password (uses `supabase.auth.updateUser`)
3. **Sign Out** button
4. **Role Switcher** — Only visible when user has multiple roles (already implemented in MoreMenu, will reuse `useAuth().setActiveRole`)

## Admin-Only Additions

The Admin Settings page will additionally show:

5. **Platform Config** (read-only display for now) — placeholder section for future system configuration

---

## Implementation Details

### New shared component: `src/components/settings/ProfileForm.tsx`
- Renders editable fields for `full_name` and `phone`
- Uses `useAuth().profile` for initial values
- On save: `supabase.from("profiles").update({ full_name, phone }).eq("user_id", user.id)`
- Toast on success/error

### New shared component: `src/components/settings/ChangePasswordForm.tsx`
- Current password field (for UX confirmation, not validated server-side by Supabase)
- New password + confirm password fields
- On save: `supabase.auth.updateUser({ password: newPassword })`
- Validation: min 8 chars, passwords match
- Toast on success/error

### New shared component: `src/components/settings/RoleSwitcher.tsx`
- Extracted from MoreMenu's existing role-switch UI
- Only renders when `roles.length > 1`
- Calls `setActiveRole(r)` and navigates to `/${r}`

### Updated pages

**`src/pages/customer/Settings.tsx`**
- Avatar placeholder (initials circle from profile)
- User email (read-only, from `useAuth().user.email`)
- ProfileForm
- ChangePasswordForm
- RoleSwitcher (if multi-role)
- Sign Out button

**`src/pages/provider/Settings.tsx`**
- Same as customer Settings

**`src/pages/admin/Settings.tsx`**
- Same as customer Settings
- Additional "Platform Configuration" card (static/placeholder for future use)

### MoreMenu cleanup
- Replace inline role-switcher code with the new `RoleSwitcher` component (keeps DRY)

---

## File Summary

| File | Action |
|------|--------|
| `src/components/settings/ProfileForm.tsx` | Create — name + phone editor |
| `src/components/settings/ChangePasswordForm.tsx` | Create — password change form |
| `src/components/settings/RoleSwitcher.tsx` | Create — extracted from MoreMenu |
| `src/pages/customer/Settings.tsx` | Replace placeholder with real page |
| `src/pages/provider/Settings.tsx` | Replace placeholder with real page |
| `src/pages/admin/Settings.tsx` | Replace placeholder with real page |
| `src/components/MoreMenu.tsx` | Use RoleSwitcher component |

No database changes needed — `profiles` table and RLS policies already exist.

