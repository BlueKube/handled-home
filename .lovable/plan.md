

# Visual Design & UX Audit — Handled Home

## Overall Impression

The app has a **solid, professional foundation** that reads as a premium home-services concierge. The design system is well-structured (Inter typography, navy+teal palette, consistent spacing). It's better than 80% of early-stage mobile apps I see. That said, there are several issues ranging from cosmetic to meaningful UX gaps.

---

## What Works Well

- **Color palette**: The deep navy + teal accent is distinctive and premium. It avoids the generic "blue SaaS" look.
- **Typography hierarchy**: The H1/H2/caption system creates clear visual hierarchy on every page.
- **StatCard component**: Clean icon-circle + value pattern. Consistent and scannable.
- **Bottom tab bar**: Glass blur effect, active dot indicator, and scale animation all feel native-quality.
- **Auth page**: Clean, focused, well-spaced. The rounded pill tab switcher is a nice touch.
- **Status badges**: Pill shape with dot indicators — consistent and readable across many states.
- **Empty states**: The "no jobs today" and notification "all caught up" states are thoughtful.

---

## Issues Found

### 1. SKU Card Text Truncation (Visible Bug)
**Page**: `/admin/skus`
**Problem**: SKU description text is cut off mid-word (e.g., "Performed on your", "Scheduled on its", "Completed within your"). The truncation happens without an ellipsis, making it look broken rather than intentional.
**Fix**: Either show full text (these are short), use `line-clamp-2` with proper ellipsis, or remove the description snippet from the list view entirely (it adds clutter without value).

### 2. Admin Dashboard StatCards — Stacked, Not Grid
**Page**: `/admin`  
**Problem**: The 4 stat cards stack vertically in a single column on mobile (`grid md:grid-cols-2 lg:grid-cols-4`). At 390px, they each take the full width, creating a very tall scroll area before reaching content. The Provider dashboard correctly uses `grid-cols-2` without a breakpoint prefix.
**Fix**: Use `grid grid-cols-2 gap-4` (no `md:` prefix) to show 2x2 on mobile, matching the Provider dashboard pattern.

### 3. "More" Menu Lacks Visual Polish
**Page**: `/admin/more` (and likely customer/provider variants)
**Problem**: The More menu is a flat list of icon + text links with no grouping, no section headers, no cards, and no visual hierarchy. It feels like a debug menu rather than a polished settings/navigation hub. Compare this to any well-designed iOS "More" tab — they use grouped sections with headers and subtle card backgrounds.
**Fix**: Group items into sections (Operations, Finance, Settings) with section headers, wrap in cards, and add chevron indicators for drill-down items.

### 4. Page Title Alignment Inconsistency
**Problem**: Some pages left-pad their title at `p-6` (Customer Dashboard), others at `px-4` (Notifications), and the Zones page has no horizontal padding on the title. This creates a subtle but noticeable inconsistency as you navigate.
**Fix**: Standardize all page containers to use `px-4 py-6` or `p-4 pt-6` consistently.

### 5. Header Feels Thin
**Problem**: The `AppHeader` is `h-12` (48px), which meets minimum tap target but feels cramped for a mobile app header. The logo at `h-7` (28px) is small. Compare to iOS standard nav bar height of 44pt + status bar. The result is a header that feels more like a toolbar than a branded app header.
**Fix**: Consider `h-14` (56px) with the logo at `h-8` for better presence.

### 6. "New Zone" / "New SKU" Buttons — Alignment
**Page**: `/admin/zones`, `/admin/skus`
**Problem**: The "New Zone" button sits on the same line as the filter dropdown but right-aligned, creating an uneven visual weight. On narrow screens, these two elements nearly collide.
**Fix**: Give the action button its own row below the filters, or use a FAB (floating action button) pattern that's more native to mobile.

### 7. Notification Bell — No Visual Weight
**Problem**: The bell icon in the header is small and unadorned when there are zero notifications. It's easy to miss. The badge appearance (red dot with count) is good when active, but the resting state needs slightly more presence.
**Fix**: Minor — possibly increase bell size to `h-6 w-6` or add a subtle circle background.

### 8. 404 Page — Off-Brand
**Page**: `/404`
**Problem**: The 404 page uses `bg-muted` instead of `bg-background`, plain text styling, and a bare underlined link. It doesn't use the Handled Home logo, brand colors, or any warmth.
**Fix**: Add the logo, use the brand voice ("We couldn't find that page. Your home is still handled."), and use a proper `Button` component for the return link.

---

## UX Observations (Not Bugs, But Worth Noting)

### Compelling Aspects
- The "Your home is handled" tagline creates emotional resonance — it's reassuring
- The 4-week preview timeline on the customer dashboard is genuinely useful
- Truth banners (service day pending, routine nudge) are well-designed gentle prods
- The cross-pollination card concept is smart for growth

### Areas That Feel Underdeveloped
- **No onboarding flow for new users**: After signup, you land on the dashboard with empty states. A guided setup (add property → pick plan → confirm service day) would dramatically improve activation.
- **No visual delight moments**: The app is functional but clinical. Small touches like a checkmark animation on task completion, or a subtle gradient on the header, would add warmth.
- **Cards lack depth differentiation**: Every card uses the same rounded-2xl white surface. Important items (next visit, action needed) look the same as informational items. Consider using the `elevated` card variant or accent borders for CTAs.

---

## Severity Summary

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 1 | SKU text truncation | Medium (visible bug) | Small |
| 2 | Admin stats not 2-col on mobile | Medium (layout) | Tiny |
| 3 | More menu lacks polish | Low (cosmetic) | Medium |
| 4 | Inconsistent page padding | Low (cosmetic) | Small |
| 5 | Header feels thin | Low (cosmetic) | Tiny |
| 6 | Button/filter alignment | Low (cosmetic) | Small |
| 7 | Bell icon resting state | Low (cosmetic) | Tiny |
| 8 | 404 page off-brand | Low (cosmetic) | Small |

---

## Recommendation

I'd suggest fixing **issues 1-2** immediately (they're visible bugs), and batching **3-8** into a "UI Polish Sprint" alongside Sprint C2. None of these block functionality, but collectively they're the difference between "functional prototype" and "feels like a real product."

Want me to create a plan to fix any or all of these?

