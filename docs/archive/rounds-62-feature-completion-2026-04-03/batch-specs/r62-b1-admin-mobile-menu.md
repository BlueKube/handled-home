# Batch Spec: R62-B1 — Admin Mobile Menu + Logout

## Review: Quality (Small→Medium tier — 3 parallel lanes + 1 synthesis)

## Problem
On mobile, admin users cannot:
1. Open the sidebar navigation (it slides off-screen with no visible trigger)
2. Log out (no logout button exists anywhere in the admin UI)
3. Switch roles (no role switcher in admin)

The `SidebarTrigger` exists in `AdminCommandBar` but the sidebar itself uses `collapsible="icon"` which collapses to icons on desktop but fully hides on mobile with no sheet/overlay behavior.

## Files
- `src/components/admin/AdminShell.tsx` — primary changes

## Changes

### 1. Mobile-responsive sidebar
The shadcn/ui Sidebar component with `collapsible="icon"` should already support mobile via a Sheet overlay. Verify the SidebarTrigger is visible on mobile. If not, ensure it renders on small screens.

### 2. Add logout + role switcher to sidebar footer
Add to the bottom of `AdminSidebar` (below Settings):
- Current user email (truncated)
- Role switcher button (calls `switchRole` from AuthContext)
- Logout button (calls `signOut` from AuthContext)

### 3. Ensure hamburger is visible
The `SidebarTrigger` in `AdminCommandBar` should be the mobile hamburger. Verify it's not hidden by responsive classes.

## Acceptance Criteria
- [ ] Admin sidebar opens via hamburger/trigger on mobile viewports
- [ ] Logout button visible and functional in admin sidebar
- [ ] Role switcher visible for multi-role users
- [ ] Desktop behavior unchanged (sidebar collapse/expand)
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes
