

# Admin Preview Mode (No Banner)

## Summary

Add a `previewRole` capability to `AuthContext` so that when the active role is `admin`, you can switch the UI to view the app as Customer or Provider — without needing those roles assigned in the database. No preview banner; the bottom tab bar makes the current view obvious. Ideal for screenshots and demos.

## Changes

### 1. AuthContext — Add `previewRole` state

**File:** `src/contexts/AuthContext.tsx`

- Add `previewRole: AppRole | null` state (default `null`)
- Add `setPreviewRole: (role: AppRole | null) => void` to context
- Add computed `effectiveRole`: returns `previewRole ?? activeRole`
- Expose `effectiveRole` in the context value
- When `setPreviewRole` is called, also store in localStorage so it survives page refresh; clear on sign-out

### 2. ProtectedRoute — Allow admin to preview any role

**File:** `src/components/ProtectedRoute.tsx`

- Use `effectiveRole` instead of `activeRole` for the role check (line 30)
- Add bypass: if user's real `activeRole` is `admin` and `previewRole` is set, skip the role mismatch redirect

### 3. BottomTabBar — Use effectiveRole

**File:** `src/components/BottomTabBar.tsx`

- Replace `activeRole` with `effectiveRole` from `useAuth()` for selecting which tabs to show and for the `isActive` logic

### 4. MoreMenu — Use effectiveRole

**File:** `src/components/MoreMenu.tsx`

- Replace `activeRole` with `effectiveRole` for selecting menu items

### 5. AppHeader — Use effectiveRole

**File:** `src/components/AppHeader.tsx`

- Use `effectiveRole` wherever `activeRole` is referenced for display/routing

### 6. New Component: PreviewAsCard

**File:** `src/components/settings/PreviewAsCard.tsx` (new)

- A `Card` with three buttons: Customer, Provider, Admin
- Clicking one calls `setPreviewRole(role)` and navigates to `/${role}`
- Clicking "Admin" clears preview mode (`setPreviewRole(null)`) and navigates to `/admin`
- Only renders when real `activeRole` is `admin`

### 7. Admin Settings — Add PreviewAsCard

**File:** `src/pages/admin/Settings.tsx`

- Import and render `<PreviewAsCard />` above the sign-out button

### 8. RoleSwitcher — Use effectiveRole

**File:** `src/components/settings/RoleSwitcher.tsx`

- Use `effectiveRole` for the active highlight styling

## How It Works

1. Admin navigates to `/admin/settings` → sees "Preview As" card
2. Clicks "Customer" → `previewRole` is set to `customer`, app navigates to `/customer`
3. Bottom tab bar shows customer tabs, More menu shows customer items
4. To return: navigate to More → Settings → use RoleSwitcher or PreviewAsCard (also accessible from any role's settings page since preview is active)
5. Or: set `previewRole` back to `null` to return to admin

## Technical Notes

- `effectiveRole` is the single source of truth for all UI rendering
- The real `activeRole` remains `admin` — only the view changes
- `ProtectedRoute` allows access because the real role is admin
- No banner needed — bottom tabs clearly show which role view is active
- Preview state persists in localStorage, cleared on sign-out

## Files Summary

| File | Action |
|------|--------|
| `src/contexts/AuthContext.tsx` | Add `previewRole`, `setPreviewRole`, `effectiveRole` |
| `src/components/ProtectedRoute.tsx` | Use `effectiveRole`, allow admin bypass |
| `src/components/BottomTabBar.tsx` | Use `effectiveRole` |
| `src/components/MoreMenu.tsx` | Use `effectiveRole` |
| `src/components/AppHeader.tsx` | Use `effectiveRole` |
| `src/components/settings/RoleSwitcher.tsx` | Use `effectiveRole` |
| `src/components/settings/PreviewAsCard.tsx` | New — preview role selector card |
| `src/pages/admin/Settings.tsx` | Add `PreviewAsCard` |

