# Sprint C1 Review: Notification Center UI (2C-C1) + UI Polish

> **Reviewer:** Claude
> **Date:** 2026-02-25
> **Files reviewed:**
> - `src/hooks/useNotifications.ts` (new)
> - `src/components/NotificationBell.tsx` (new)
> - `src/components/NotificationPanel.tsx` (new)
> - `src/pages/shared/Notifications.tsx` (new)
> - `src/components/AppHeader.tsx` (modified)
> - `src/App.tsx` (3 new routes)
> - `src/components/MoreMenu.tsx` (UI polish — full rewrite)
> - `src/pages/NotFound.tsx` (UI polish)
> - `src/components/admin/SkuListCard.tsx` (UI polish)
> - `src/pages/admin/Dashboard.tsx` (UI polish — skeleton grid fix)

---

## Overall Assessment

Sprint C1 delivers a solid, well-structured notification center. The hook design is clean, the realtime subscription pattern is correct, the panel layout handles long lists without breaking, and the shared `Notifications.tsx` page avoids role-specific duplication. The UI polish changes (More menu sectioning, branded 404, header sizing) are meaningful improvements.

Two issues stand out: a subtle duplicate realtime subscription caused by calling `useNotifications` in both `NotificationBell` and `NotificationPanel` simultaneously, and the customer `/notifications` route being gated behind `CustomerPropertyGate`, which blocks access to notifications that may be specifically about completing property setup.

---

## Findings

### 1. MEDIUM — Duplicate Realtime Subscriptions

**File:** `useNotifications.ts` line 36; `NotificationBell.tsx` line 8; `NotificationPanel.tsx` line 34

`NotificationBell` calls `useNotifications()` and also renders `NotificationPanel`, which calls `useNotifications()` again. Both components are always mounted (the Bell is in the header; the Panel is in the Bell's render tree regardless of whether the Sheet is open or closed). This creates **two independent `useEffect` hooks** that each call:

```typescript
supabase.channel(`notifications:${userId}`)
  .on("postgres_changes", ...)
  .subscribe();
```

Both use the identical channel name. Supabase's realtime client creates a new channel object each time `.channel()` is called, resulting in two concurrent subscriptions to the same filter. When a new notification arrives, both handlers fire → two `queryClient.invalidateQueries` calls → two redundant refetches.

This is not a data-correctness bug (TanStack Query deduplicates the cache), but it wastes socket traffic and may cause unexpected double-fetch behavior that's hard to debug.

**Fix:** Hoist `useNotifications()` to `NotificationBell` and pass `notifications`/`unreadCount`/`markRead`/`markAllRead` down to `NotificationPanel` as props, so only one hook instance and one channel subscription exist:

```tsx
// NotificationBell.tsx
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const notif = useNotifications();
  // ...pass notif as props to NotificationPanel
}
```

### 2. MEDIUM — Customer `/notifications` Behind `CustomerPropertyGate`

**File:** `App.tsx` line 167

```tsx
<Route path="/customer/notifications"
  element={<CustomerPropertyGate><SharedNotifications /></CustomerPropertyGate>}
/>
```

`CustomerPropertyGate` redirects users without a configured property to `/customer/property?gated=1`. This means a new customer who hasn't finished onboarding cannot view their notifications — even though a typical use case is receiving a notification *prompting* them to complete their property setup.

The provider and admin notification routes are not gated:
```tsx
<Route path="/provider/notifications" element={<SharedNotifications />} />
<Route path="/admin/notifications"    element={<SharedNotifications />} />
```

**Fix:** Remove `CustomerPropertyGate` from the notifications route:
```tsx
<Route path="/customer/notifications" element={<SharedNotifications />} />
```

### 3. MEDIUM — Client-Side Filter Against Server-Paginated Data

**File:** `Notifications.tsx` lines 29-32

```typescript
const filtered =
  filter === "ALL"
    ? notifications
    : notifications.filter((n) => n.priority === filter);
```

The hook fetches the 50 most recent notifications. The CRITICAL/SERVICE/MARKETING filter tabs apply to this local slice only. If a user has 50+ SERVICE notifications, switching to the CRITICAL tab might show 0 items even though there are CRITICAL notifications further back in history. The user has no way to know whether "0 Critical" means there are none, or just none in the current page.

**Fix (preferred):** Add the priority filter to the Supabase query inside `useNotifications` and make it a parameter, so the server always returns filtered results:
```typescript
.eq("priority", filter) // only when filter !== "ALL"
```

**Fix (acceptable):** Add a note below an empty filtered state: *"No Critical notifications in the last 50 loaded. Load more to see older ones."*

### 4. LOW — No Loading State in `NotificationPanel`

**File:** `NotificationPanel.tsx` lines 67-110

The panel immediately renders either the empty state or the notification list. It does not consume `isLoading` from `useNotifications`. On first open, there's a brief flash of "You're all caught up" before the query resolves, even when the user has notifications.

**Fix:** Check `isLoading` and render 3 skeleton rows:
```tsx
{isLoading ? (
  <div className="space-y-0 divide-y divide-border">
    {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
  </div>
) : notifications.length === 0 ? ( ...
```

### 5. LOW — `markRead`/`markAllRead` Mutations Have No Error Handler

**File:** `useNotifications.ts` lines 62-88

Neither mutation has an `onError` callback. If the Supabase `.update()` fails (network blip, RLS rejection), the mutation silently fails. The user clicks "Mark all read", nothing changes, and they have no idea why.

**Fix:** Add a toast `onError`:
```typescript
onError: () => {
  toast({ title: "Could not update notifications", variant: "destructive" });
},
```

### 6. LOW — Dark Mode Toggle Uses ChevronRight (Navigation Affordance)

**File:** `MoreMenu.tsx` lines 163-172

The dark/light mode toggle row ends with `<ChevronRight className="h-4 w-4 text-muted-foreground/50" />`. A ChevronRight universally signals "tap to navigate to a new screen." A toggle action should use a `<Switch>` component or a visible state indicator (sun/moon icon that changes) instead of a directional arrow.

```tsx
// Current (misleading)
<ChevronRight className="h-4 w-4 text-muted-foreground/50" />

// Better: show current theme state, no chevron
<span className="text-xs text-muted-foreground">{theme === "dark" ? "On" : "Off"}</span>
```

### 7. LOW — Provider More Menu Has Redundant "Dashboard" Entry

**File:** `MoreMenu.tsx` lines 47-55

`providerSections` includes:
```typescript
{ label: "Dashboard", icon: Building2, path: "/provider" },
{ label: "Organization", icon: Building2, path: "/provider/organization" },
```

"Dashboard" is the first tab in the provider BottomTabBar. Listing it again in the More menu under "Business" adds clutter without value. Users who land on More are looking for items *not* in the tabs. Additionally, both items share `Building2` — visually identical.

**Fix:** Remove the redundant Dashboard entry from `providerSections`.

### 8. LOW — Admin More Menu Icon Mismatches

**File:** `MoreMenu.tsx` lines 70-104

Several icon choices are semantically wrong:
- `"Payouts"` uses `Gauge` icon — should use `Wallet` or `DollarSign`
- `"Exceptions"` uses `Gauge` icon — should use `AlertTriangle` or `Flag`
- `"Service Days"` and `"Scheduling"` both use `CalendarDays` — identical icons for different items
- `"Capacity"` and `"Exceptions"` both use `Gauge` — identical icons for different items

A user scanning the list relies on icons as quick identifiers. Four items sharing two icons in the same menu defeats that purpose.

### 9. LOW — `NotFound.tsx` Uses Hard Anchor Navigation Instead of React Router Link

**File:** `NotFound.tsx` line 24

```tsx
<Button asChild size="lg" className="mt-4">
  <a href="/">Back to Home</a>
</Button>
```

`<a href="/">` triggers a full browser page reload. In a SPA this works, but it discards all React state and re-runs the full app bootstrap. React Router's `<Link to="/">` does client-side navigation with no reload. The 404 page is outside `AppLayout` so no `useNavigate` context issues apply.

**Fix:**
```tsx
import { Link } from "react-router-dom";
// ...
<Button asChild size="lg" className="mt-4">
  <Link to="/">Back to Home</Link>
</Button>
```

---

## What's Good

- **Hook design is solid** — query key includes `limit` so different page sizes get distinct cache entries; realtime subscription cleans up on unmount; `markAllRead` correctly filters `.is("read_at", null)` to avoid re-marking already-read items
- **`PRIORITY_DOT` fallback** — `?? PRIORITY_DOT.SERVICE` for unknown priority values prevents runtime errors when new priority types are added
- **`SheetDescription` is `sr-only`** — preserves screen reader accessibility without cluttering the visual UI (Radix requires it to be present)
- **Badge clamps at `min-w-[1rem]`** — single-digit counts display as a circle, not an ellipse
- **`ScrollArea` in the panel** — long notification lists scroll internally rather than pushing the "View all" footer off screen
- **Shared `Notifications.tsx`** — one page component serves all three roles, avoiding divergence
- **"Load more" appends** — `setLimit(l => l + PAGE_SIZE)` adds to the existing fetch rather than replacing, so previously loaded items stay visible
- **More menu sectioning** — grouped sections with card backgrounds and chevrons is a significant UX improvement over a flat list; the admin section organization (Operations / Finance / Growth & Insights / System) maps cleanly to user mental models
- **Admin dashboard skeleton matches content grid** — `grid-cols-2 gap-4 lg:grid-cols-4` in both skeleton and loaded content eliminates the visual layout shift on load
- **Branded 404** — logo + "Your home is still handled." copy is warm and on-brand; much better than the generic previous version
- **Header balance** — flex-1 spacers flanking the centered logo with bell on the right is clean and stable at all screen widths

---

## Recommendations

1. **Hoist `useNotifications` to `NotificationBell`**, pass result as props to `NotificationPanel` — eliminates duplicate channel subscription
2. **Remove `CustomerPropertyGate`** from customer notifications route
3. **Move priority filter server-side** in `useNotifications` (or add empty-state clarification) — client-side filter against a paged dataset is misleading
4. **Add loading skeleton to `NotificationPanel`** — prevents empty-state flash on first open
5. **Add `onError` toast** to `markRead`/`markAllRead` mutations
6. **Replace `ChevronRight` with toggle indicator** on dark mode row in More menu
7. **Remove redundant Dashboard entry** from provider More menu sections
8. **Fix admin More menu icons** — correct Payouts/Exceptions icons, differentiate Service Days/Scheduling
9. **Use `<Link>` instead of `<a href>` on 404 page**
