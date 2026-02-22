

# Mobile-First Design System Overhaul + Capacitor Setup

## Overview
This app will be distributed as a native iOS and Android app. The entire UI needs to shift from a desktop sidebar layout to a mobile-native experience with bottom tab navigation, touch-optimized spacing, safe area handling, and Capacitor integration for app store distribution.

---

## 1. Capacitor Setup for Native Builds

Install Capacitor dependencies and configure the project so it can be built and deployed to iOS and Android.

- Install `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`
- Run `npx cap init` with proper app ID and name
- Configure `capacitor.config.ts` with the project's preview URL for live reload during development
- Add mobile viewport meta tags to `index.html` (viewport-fit=cover, status bar config)

**After setup, you will need to:**
1. Export to GitHub and clone locally
2. Run `npx cap add ios` and/or `npx cap add android`
3. Run `npx cap sync` then `npx cap run ios` or `npx cap run android`

---

## 2. Navigation Overhaul: Sidebar to Bottom Tabs

Replace the desktop sidebar with a mobile-native bottom tab bar.

### New component: `BottomTabBar.tsx`
- Fixed to bottom of screen with safe area padding (for iPhone notch/home indicator)
- 4-5 primary tabs per role (most important screens)
- Active tab highlighted with accent color + filled icon
- Remaining pages accessible via a "More" tab or from within screens

### Tab structure per role:

**Customer (5 tabs):**
Home | Service Day | History | Subscription | More

**Provider (5 tabs):**
Jobs | Earnings | Performance | Coverage | More

**Admin (5 tabs):**
Dashboard | Zones | SKUs | Providers | More

### "More" screen
- Simple list/menu of remaining nav items (Settings, Support, Billing, etc.)
- Clean grouped list with icons

### Remove:
- `AppSidebar.tsx` — no longer used
- `SidebarProvider` / `SidebarTrigger` from layout and header

---

## 3. Header Redesign for Mobile

### Modify `AppHeader.tsx`
- Compact mobile header: logo centered, height 48px
- Left: back button (when navigated into sub-page) or hamburger for "More"
- Right: role switcher (dev only) + avatar/profile icon
- No email text display (too wide for mobile)
- Safe area top padding for iOS status bar

---

## 4. Layout Restructure

### Modify `AppLayout.tsx`
- Remove sidebar wrapper entirely
- Structure: Header (top) + Content (scrollable, flex-1) + BottomTabBar (bottom)
- Content area gets bottom padding to avoid overlap with tab bar
- Add safe area insets via CSS `env(safe-area-inset-*)` values

---

## 5. Touch-Optimized Design Tokens

### Update `index.css` and `tailwind.config.ts`
- Minimum tap target: 44px (already in design guidelines)
- Increase `--radius` to `0.75rem` (12px) for rounder, more mobile-native feel
- Card padding: 16px standard
- Input heights: 48px minimum
- Font sizes: body stays 16px (prevents iOS zoom on input focus)
- Add safe area CSS custom properties

### Add mobile utilities:
```css
.safe-top { padding-top: env(safe-area-inset-top); }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
```

---

## 6. Auth Page — Mobile Native Feel

### Redesign `AuthPage.tsx`
- Full-screen mobile layout (no centered card on white background)
- Logo at top (larger, ~80px), tagline below
- Form fields directly on the surface background (no wrapping card)
- Large 48px-height inputs with 16px font (prevents iOS zoom)
- Full-width buttons with 48px height
- Tab switcher (Login / Sign Up) as pill-shaped toggle at top of form

---

## 7. PlaceholderPage — Mobile Optimized

### Update `PlaceholderPage.tsx`
- Full-width cards (no max-width constraint)
- 16px horizontal padding
- Larger touch-friendly elements

---

## 8. Dark Mode Support

### Add `ThemeProvider` using `next-themes`
- Wrap app in ThemeProvider in `App.tsx`
- Create `ThemeToggle.tsx` — simple sun/moon icon button
- Place toggle in Settings pages and/or header
- Verify all CSS variables render correctly in dark mode

---

## 9. Motion & Polish

- Page transition: subtle fade-in on route change (CSS animation)
- Tab bar icon: gentle scale bounce on tap
- Card hover/press: slight scale-down on active (touch feedback)
- Pull-to-refresh styling prep (for future data pages)

---

## Technical Summary

### New files:
- `src/components/BottomTabBar.tsx` — Role-aware bottom tab navigation
- `src/components/MoreMenu.tsx` — Overflow navigation items
- `src/components/ThemeToggle.tsx` — Dark/light mode switch
- `capacitor.config.ts` — Capacitor configuration

### Modified files:
- `index.html` — Mobile viewport meta tags, safe area
- `src/index.css` — Safe area utilities, touch sizing, mobile animations
- `tailwind.config.ts` — Radius, spacing adjustments
- `src/components/AppLayout.tsx` — Remove sidebar, add bottom tabs
- `src/components/AppHeader.tsx` — Compact mobile header
- `src/pages/AuthPage.tsx` — Full-screen mobile design
- `src/components/PlaceholderPage.tsx` — Mobile padding/sizing
- `src/App.tsx` — Add ThemeProvider wrapper
- `src/main.tsx` — No changes expected
- `package.json` — Add Capacitor dependencies

### Files to remove:
- `src/components/AppSidebar.tsx` — Replaced by BottomTabBar

### Dependencies to install:
- `@capacitor/core`
- `@capacitor/cli` (dev)
- `@capacitor/ios`
- `@capacitor/android`

