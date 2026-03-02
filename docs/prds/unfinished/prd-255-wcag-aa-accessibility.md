# PRD 255: WCAG AA Accessibility Compliance

> **Status:** PARTIALLY COMPLETE
> **Priority:** P1 High
> **Effort:** Large (1-2 weeks)

## What Exists Today

The design system has solid accessibility foundations already in place:

- **HSL-based color tokens** with light and dark mode variants, designed with contrast ratios in mind. The design guidelines explicitly state "WCAG AA compliance required."
- **44px minimum tap targets** enforced by button defaults (`h-11`) and icon button sizing (`44x44`), following iOS Human Interface Guidelines.
- **8pt grid system** providing consistent, predictable spacing throughout the app.
- **Semantic headings** with a defined typography scale (H1 through Caption) using Inter font with line-height at least 1.5x.
- **Visible focus states** using `ring-2 ring-ring` via Tailwind, with `focus-visible` styles applied across core UI components (button, input, textarea, toggle, switch, slider, checkbox, radio group, tabs, sidebar, and resizable panels).
- **16px minimum input font size** to prevent iOS auto-zoom on focus.
- **Form labels** using `htmlFor` associations in several key forms (auth, property, onboarding, settings, provider application).
- **Some aria-label usage** on interactive elements (sidebar, pagination, breadcrumb, notification bell, floating add button, suggestion cards).
- **Alt text** on images across approximately 20 files including photo galleries, service cards, auth pages, and landing pages.
- **ARIA roles** on a few structural components (table, pagination, alert, breadcrumb, carousel, input OTP).

The gap is not that accessibility was ignored -- it is that accessibility was applied organically rather than systematically. There has been no formal audit, no automated enforcement, and no guarantee of consistency across every page and interaction path.

## What's Missing

1. **Formal WCAG AA audit across all pages:** A systematic page-by-page review to identify gaps in contrast ratios, missing labels, keyboard traps, and screen reader issues. The app has roughly 40+ pages across three roles (customer, provider, admin) and none have been formally audited.
2. **Automated accessibility testing in CI:** No axe-core, pa11y, or similar tooling runs on pull requests. Accessibility regressions can be introduced silently.
3. **Comprehensive alt text coverage:** While ~20 files include `alt` attributes on images, coverage is not universal. Dynamic images (user-uploaded photos, provider profile images, service hero images) may have generic or missing alt text.
4. **Complete aria-label coverage on interactive elements:** Only 9 total `aria-label` instances exist across 7 files. Many interactive elements -- icon-only buttons, toggle switches, action menus, bottom tab bar items, dialogs -- likely lack descriptive labels for screen readers.
5. **Keyboard navigation completeness:** Only 3 files implement `tabIndex` or keyboard event handlers. Custom interactive components (bottom tab bar, swipeable cards, photo galleries, before/after sliders, drag-and-drop interfaces) may not be keyboard-navigable.
6. **Screen reader compatibility testing:** No evidence of testing with VoiceOver (iOS) or TalkBack (Android). Dynamic content updates (toasts, loading states, real-time score changes) may not announce properly to screen readers via live regions.
7. **Color contrast verification:** The HSL tokens were designed with contrast in mind, but specific combinations (muted text on card backgrounds, warning text on light backgrounds, accent-on-primary combinations) have not been numerically verified against the 4.5:1 AA threshold.
8. **Form error association:** Toast-based error messages (used extensively throughout the app) are not programmatically associated with the form fields that caused them. Screen reader users may not understand which field needs correction.
9. **Skip navigation and landmark regions:** No skip-to-content links or comprehensive ARIA landmark structure for efficient screen reader navigation.
10. **Reduced motion support:** Animations (shimmer, slide-up, scale-in, press feedback) do not respect the `prefers-reduced-motion` media query.

## Why This Matters

### For the Business

One in four US adults lives with a disability. Excluding them from the app excludes 25% of the addressable homeowner market -- a market segment that skews older and wealthier (exactly the premium demographic Handled targets). Beyond market size, ADA compliance for digital services is an increasingly active area of litigation; web accessibility lawsuits exceeded 4,000 in 2023 and continue to rise. For a subscription business handling sensitive home access, an accessibility lawsuit would be a brand-damaging event disproportionate to the cost of prevention. Additionally, accessible apps are structurally better apps -- the discipline of accessibility improves code quality, testability, and maintainability for every user.

### For the User

Homeowners with visual impairments need screen reader support to manage their home services. Homeowners with motor disabilities need full keyboard and switch-control navigation to book appointments, review photos, and communicate with providers. Homeowners with cognitive disabilities benefit from clear labels, consistent patterns, and predictable interactions -- which accessibility standards enforce. Even users without disabilities benefit: clear focus states help power-keyboard users, good contrast helps users in bright sunlight, and proper form labeling reduces errors for everyone. Accessibility is not accommodation -- it is quality.

## User Flow

1. **Every existing user flow works identically** -- accessibility compliance does not change what users do, it changes how robustly the interface supports the ways they do it. The following are the key interaction patterns that need accessibility attention:

2. **Screen reader user navigates the customer dashboard:** The user activates VoiceOver and hears the page title announced. They swipe through elements and hear each stat card read as "Upcoming visits: 3" rather than just "3." The Complete Home Setup progress card announces its completion percentage. Navigation tabs in the bottom bar announce their labels ("Home," "Routine," "Activity") and their selected state.

3. **Keyboard user books a service:** The user tabs through the service catalog. Each service card receives visible focus with the teal ring. Pressing Enter opens the service detail sheet. Tab moves through the detail content logically. The user can select a service level, confirm, and return to the catalog entirely without a mouse or touch.

4. **User with low vision reviews job photos:** Photo thumbnails have descriptive alt text ("Before photo of front lawn" / "After photo of front lawn"). The before/after comparison slider is operable via keyboard arrow keys. Photo zoom controls have sufficient contrast and labeled buttons.

5. **Motor-impaired user fills out the property profile:** Every form field has a visible label (not just a placeholder). Error messages are announced by the screen reader and visually associated with the field in error. The "Save" action is reachable via keyboard without navigating through the entire page.

6. **User with motion sensitivity uses the app:** Animations are suppressed or simplified when the operating system's "reduce motion" setting is active. Shimmer loading skeletons become static placeholders. Press-feedback scaling effects are removed. Page transitions become instant cuts rather than slides.

7. **Developer opens a pull request:** Automated accessibility tests run in CI alongside existing checks. The tests catch missing alt text, insufficient contrast ratios, missing form labels, and elements without accessible names. The PR cannot merge with accessibility violations above a configured threshold.

## UI/UX Design Recommendations

- **Do not change the visual design.** The existing glassmorphism aesthetic, teal accents, and 8pt grid are compatible with WCAG AA. Accessibility is about adding structure beneath the existing visuals, not redesigning them.
- **Add skip navigation links** as the first focusable element on each page. These should be visually hidden until focused, then appear as a teal pill button anchored to the top of the viewport. Keep the link text simple: "Skip to main content."
- **Implement ARIA landmark regions** on every page layout: `<main>`, `<nav>` for the bottom tab bar and sidebar, `<header>` for the app header, and `<aside>` for any supplementary panels. This gives screen reader users a structural map of each page.
- **Add aria-live regions for dynamic content.** Toast notifications should use `role="status"` or `aria-live="polite"` so screen readers announce them. Loading states should use `aria-busy="true"` on the container. Real-time data updates (quality scores, job status changes) should announce via `aria-live="polite"`.
- **Ensure every interactive element has an accessible name.** Icon-only buttons need `aria-label` (e.g., the floating add button, notification bell, settings gear, close/dismiss buttons on sheets). Toggle switches and checkboxes need associated labels. Tab bar items need labels beyond their icons.
- **Respect `prefers-reduced-motion`** with a global CSS media query that disables or simplifies all keyframe animations (shimmer, slide-up, scale-in, fade-in, press feedback). Replace animated transitions with instant state changes. This is a single CSS addition that covers all animation utilities.
- **Associate form errors with fields.** When validation fails, use `aria-describedby` to link the error message element to the input, and use `aria-invalid="true"` on the field. Move the error message inline below the field rather than relying solely on toast notifications.
- **Verify contrast ratios numerically.** Run every foreground/background token combination through a contrast checker. Pay special attention to: muted foreground on card backgrounds (both light and dark modes), warning text on light backgrounds, and any text rendered on glassmorphic (semi-transparent) surfaces where background contrast depends on what is behind the glass.
- **Make custom components keyboard-accessible.** The before/after photo slider should respond to arrow keys. The bottom tab bar should implement roving tabindex. Photo galleries should support arrow-key navigation. Swipeable cards should have button alternatives. Drag-and-drop interactions should have keyboard alternatives (e.g., move up/down buttons).
- **Add visible focus indicators consistently.** While the `focus-visible` ring is applied to core shadcn/ui primitives, verify it appears on every custom component: ServiceCard, SuggestionCard, StatCard, StatusBadge, BottomTabBar items, and any clickable div or span that behaves as a button.

## Acceptance Criteria

- Every page in the app (customer, provider, and admin roles) passes an automated WCAG AA audit with zero critical violations using axe-core or an equivalent tool.
- All images have meaningful alt text. Decorative images use `alt=""` and `aria-hidden="true"`. Dynamic images (user-uploaded photos) have contextually generated alt text (e.g., "Before photo for lawn mowing job on March 1").
- Every interactive element (buttons, links, inputs, toggles, tabs, menu items) has a programmatically determinable accessible name -- either from visible text content, an associated label, or an `aria-label`.
- The entire app is operable via keyboard alone. Every interactive element is focusable and activatable. There are no keyboard traps. Focus order follows a logical reading sequence on every page.
- All text meets WCAG AA contrast minimums: 4.5:1 for normal text, 3:1 for large text (18px bold or 24px regular), in both light and dark modes.
- Form validation errors are programmatically associated with their fields via `aria-describedby` and `aria-invalid`, not just displayed as floating toast messages.
- Animations respect `prefers-reduced-motion`. Users with motion sensitivity enabled at the OS level see no animated transitions, shimmer effects, or scaling feedback.
- Skip navigation links are present and functional on every page, allowing keyboard users to bypass repetitive navigation.
- ARIA landmark regions (`main`, `nav`, `header`) are used on every page layout.
- Toast notifications and dynamic content updates are announced to screen readers via appropriate `aria-live` regions.
- An automated accessibility check runs in the CI pipeline on every pull request, preventing regressions.
- The app has been manually tested with VoiceOver (iOS) and TalkBack (Android) on at least the five highest-traffic user flows: dashboard, service booking, property setup, job photo review, and settings.
