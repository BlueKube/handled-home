

# Sprint C1: Notification Center UI

## What We Are Building

The notification UI layer: a bell icon in the header with an unread count badge, a slide-out panel for quick glance, and a full-screen `/notifications` route for each role. Plus a `useNotifications` hook powered by Realtime for live updates.

---

## Technical Design

### 1. `useNotifications` Hook (`src/hooks/useNotifications.ts`)

- Fetches from `notifications` table filtered by `user_id = auth.uid()`, ordered by `created_at desc`, limit 50
- Returns: `notifications`, `unreadCount`, `markRead(id)`, `markAllRead()`, `isLoading`
- `markRead`: updates `read_at = now()` for a single notification
- `markAllRead`: updates `read_at = now()` for all unread notifications of the user
- Subscribes to Realtime `postgres_changes` on `notifications` table (INSERT events) to invalidate the query cache, giving live bell badge updates without polling
- `unreadCount` derived from `notifications.filter(n => !n.read_at).length`

### 2. `NotificationBell` Component (`src/components/NotificationBell.tsx`)

- Bell icon (lucide `Bell`) with a red badge showing `unreadCount` (capped at "9+" display)
- Click opens the slide-out `NotificationPanel` (Sheet component, side="right")
- Badge hidden when count is 0
- Positioned in `AppHeader` to the right of the logo

### 3. `NotificationPanel` Component (`src/components/NotificationPanel.tsx`)

- Uses the `Sheet` component (already exists) sliding from right
- Header: "Notifications" title + "Mark all read" button
- List of `NotificationItem` components showing: priority dot (red/blue/gray for CRITICAL/SERVICE/MARKETING), title, body truncated to 2 lines, relative time (date-fns `formatDistanceToNow`)
- Unread items have a subtle left border accent or background tint
- Clicking a notification with a `cta_route` navigates to that route and marks it read
- Footer: "View all" link navigating to `/{role}/notifications`
- Empty state: bell icon + "You're all caught up"

### 4. `NotificationItem` Component (inline in Panel or extracted)

- Priority indicator dot (color-coded)
- Title (bold if unread), body (muted, truncated), timestamp
- Click handler: mark read + navigate if `cta_route` exists

### 5. Full-Screen Notifications Page (`src/pages/shared/Notifications.tsx`)

- Shared page used by all three roles
- Filter tabs: All | Critical | Service | Marketing
- Same `NotificationItem` rendering but with more space
- "Mark all read" button in header
- Pagination: initially just "Load more" button fetching next 50

### 6. Routing Changes (`src/App.tsx`)

- Add `/{role}/notifications` route for all three role groups (customer, provider, admin)
- All point to the same `Notifications` page component

### 7. `AppHeader` Update

- Add `NotificationBell` to the right side of the header
- Layout: logo centered, bell icon absolute-right

---

## Files

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useNotifications.ts` | Create | Query + Realtime subscription + mark read mutations |
| `src/components/NotificationBell.tsx` | Create | Bell icon with badge, opens panel |
| `src/components/NotificationPanel.tsx` | Create | Slide-out sheet with notification list |
| `src/pages/shared/Notifications.tsx` | Create | Full-screen notifications page with filters |
| `src/components/AppHeader.tsx` | Edit | Add NotificationBell to the right side |
| `src/App.tsx` | Edit | Add `/{role}/notifications` routes for all 3 roles |

### No database changes needed — schema and RLS from C0 already support all reads/writes.

