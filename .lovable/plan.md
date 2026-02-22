

# UI Polish Pass — Pre-Module 06

## What and Why
Three targeted fixes from the design review that improve the first-impression screens without throwaway work. Everything else in the review is either already done (dark mode toggle exists in More menu) or better addressed when each module is built (placeholder pages, empty states, celebrations).

---

## Change 1: Delete App.css

Remove `src/App.css` entirely. It contains only Vite scaffold CSS (`.logo`, `.read-the-docs`, `logo-spin` animation) that is never used. Remove any import of it from `src/App.tsx` or `src/main.tsx`.

**Files**: Delete `src/App.css`, edit import in `src/App.tsx` if present.

---

## Change 2: Upgrade Dashboard Pages to Use StatCard

### Customer Dashboard (`src/pages/customer/Dashboard.tsx`)
Replace the raw `Card` + `CardContent` blocks with `StatCard` components. Keep the same data (Next Service Day = "Tuesday", Recent Visits = 0) but rendered through the design system component with the accent-tinted icon circles and proper typography hierarchy.

### Admin Dashboard (`src/pages/admin/Dashboard.tsx`)
Same treatment: swap the 4 raw Card blocks (Customers, MRR, Active Zones, Utilization) for `StatCard` components. This gives them the consistent icon treatment, tracking-tight values, and interactive card variant.

Both dashboards will also get the design system typography classes (`text-h2`, `text-caption`) instead of raw Tailwind (`text-2xl font-bold`, `text-muted-foreground`).

**Files**: `src/pages/customer/Dashboard.tsx`, `src/pages/admin/Dashboard.tsx`

---

## Change 3: Auth Page Tab Switcher Consistency

Replace the hand-rolled `rounded-full` pill switcher on the auth page with the `Tabs` / `TabsList` / `TabsTrigger` components from the UI library. This ensures the first screen a user sees uses the same component patterns as the rest of the app.

The visual appearance will be very similar (pill-style toggle) since the Tabs component already supports that styling, but it'll use the standardized component API with proper accessibility attributes.

**Files**: `src/pages/AuthPage.tsx`

---

## Implementation Order
1. Delete App.css (instant)
2. Upgrade dashboards (customer, then admin)
3. Auth page tabs swap

Total scope: 4 files modified, 1 file deleted.
