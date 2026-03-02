# PRD 25: Market Zone Category State

> **Status:** PLACEHOLDER
> **Priority:** P1 High
> **Effort:** Medium (3-5 days)

## What Exists Today

The `market_zone_category_state` system is built and operational. Each zone can have multiple service categories (lawn_care, cleaning, landscaping, pest_control, pool_care), and each category within a zone has its own independent state. The admin Growth Console exposes a "Zone Matrix" tab where ops can see every zone-category combination and its current state at a glance.

The current state enum has four values: **CLOSED**, **SOFT_LAUNCH**, **OPEN**, and **PROTECT_QUALITY**. Admins can override any zone-category state via an RPC call that logs the reason and optionally locks the state for a set number of days. The system also has config JSONB per record for flexible settings, locked_until timestamps for time-based locks, and admin attribution for who made the override.

The provider application flow already reads zone category states to show opportunity banners (the OpportunityBanner component maps states to banner variants like open, soft_launch, waitlist, not_supported). Zone health monitoring computes per-zone health snapshots and the autopilot system can take automated actions based on health metrics.

## What's Missing

Two critical states from the original spec are not implemented:

1. **waitlist_only** -- A state where a category accepts customer demand (waitlist signups) but is not yet fulfilling orders. This is the customer-side equivalent of "we know you want this, and we are working on it." Today, the only options are CLOSED (invisible) or SOFT_LAUNCH (actively serving), with no middle ground for demand capture.

2. **provider_recruiting** -- A state where a category is actively seeking providers but not yet accepting customers at all. This differs from the zone-level recruiting state (PRD 24) because it is per-category. A zone could be live for lawn_care but still recruiting for pool_care. Today, there is no way to express "we need pool techs in this zone" at the category level.

Additionally, the transition rules between states need formalization. Today, an admin can jump from any state to any other state. There should be guardrails: for example, a category should not go from CLOSED directly to OPEN without passing through recruiting or soft_launch, unless an admin explicitly overrides with a reason.

## Why This Matters

### For the Business
- **Demand capture before supply:** The waitlist_only state lets the business gauge customer interest in a category before investing in provider recruitment. If 200 customers in a zone want pool care, that justifies recruiting pool techs. Without it, the business is flying blind on category-level demand.
- **Granular market control:** A zone might have strong lawn care coverage but no cleaning providers. Today, the zone is either open or closed at the category level, with no signal that cleaning is "coming soon." This causes lost revenue from customers who would wait if they knew the service was coming.
- **Provider recruitment targeting:** When a specific category in a specific zone is in provider_recruiting, the platform can show targeted "We need you" messaging on the provider application page, improving provider acquisition efficiency.

### For the User
- **Customers** who want a service that is not yet available in their zone can join a category-specific waitlist rather than being told "not available" with no recourse. They get notified the moment the category goes live in their zone, creating a launch-day activation spike.
- **Providers** see exactly which categories need them in which zones. A handyman in a zone that is recruiting for pest_control will not waste time applying for that category, while a licensed pest tech will see a clear "apply now" signal.
- **Ops admins** gain a fine-grained control panel. Instead of making binary open/closed decisions, they can stage category rollouts: launch lawn_care first, then add cleaning when providers are ready, then add pool_care in summer. Each category follows its own lifecycle within the zone.

## User Flow

### Admin: Managing Category States Within a Zone

1. Admin opens the Growth Console and navigates to the Zone Matrix tab.
2. The matrix shows zones as rows and categories as columns. Each cell displays a color-coded state badge.
3. Admin clicks on a cell (e.g., "Austin South" x "Pool Care") to open the state management drawer.
4. The drawer shows the current state, who set it, when it was last changed, and any active lock.
5. Admin selects a new target state from a dropdown that shows only valid transitions from the current state. Invalid transitions are grayed out with a tooltip explaining why.
6. For the **waitlist_only** state, admin sees a preview: "Customers in this zone will see 'Pool Care -- Coming Soon. Join the waitlist to be first.' on the service catalog."
7. For the **provider_recruiting** state, admin sees: "This category will appear on the provider application page with an 'Apply Now' badge. Customers will not see this category listed."
8. Admin enters a reason for the transition (required for all changes) and optionally sets a lock period.
9. After confirming, the state changes immediately. The zone matrix cell updates to reflect the new color and badge.

### Customer: Encountering a Waitlist-Only Category

1. Customer is browsing the service catalog or building their routine in a zone where pool_care is in waitlist_only state.
2. The pool care category appears with a "Coming Soon" badge and a muted visual treatment -- clearly present but distinguished from active categories.
3. Customer taps the category and sees a detail view explaining the service, estimated availability timeline (if set by admin), and a prominent "Notify Me" button.
4. Customer taps "Notify Me" and is added to the category-specific waitlist. They see a confirmation: "You will be the first to know when pool care launches in your area."
5. When the admin transitions pool_care to soft_launch or live, all waitlisted customers receive a push notification and email.

### Provider: Seeing Recruiting Signals

1. Provider visits the application page and enters their ZIP code.
2. The zone readiness check returns per-category signals. Categories in provider_recruiting state show a highlighted "Now Hiring" badge.
3. Provider selects their service categories. Categories in provider_recruiting show an urgency indicator: "High demand -- providers needed."
4. After submitting the application, the provider is prioritized for review in categories marked as provider_recruiting.

## UI/UX Design Recommendations

- **Zone Matrix enhancements:** Add the two new states to the color system. Use purple for provider_recruiting (signaling action needed) and a soft blue for waitlist_only (signaling demand capture). Keep the existing amber for SOFT_LAUNCH and green for OPEN.
- **State transition guard rails:** In the state change dropdown, show valid transitions prominently and invalid transitions as disabled with explanatory tooltips. For example, if a category is CLOSED, the dropdown shows "Set to Waitlist Only" and "Set to Provider Recruiting" as primary options, with "Set to Open" grayed out with "Must pass through soft_launch first."
- **Waitlist counter badge:** On the Zone Matrix, show a small waitlist count badge on cells in waitlist_only state (e.g., "42 waiting"). This gives ops instant demand signal without clicking into each cell.
- **Category lifecycle mini-timeline:** In the state management drawer, show a horizontal timeline of all state changes for that zone-category pair, with timestamps and admin names. This provides audit context at a glance.
- **Customer catalog integration:** In the customer-facing service catalog, categories in waitlist_only should appear in a dedicated "Coming Soon" section below active services, using a slightly desaturated card style with the service image overlaid with a subtle "Coming Soon" ribbon.
- **Provider application badges:** On the provider Apply page, categories in provider_recruiting should show a pulsing "Now Hiring" badge next to the category checkbox, with a short value proposition (e.g., "12 homes already waiting for this service").

## Acceptance Criteria

- The zone-category state system supports six states: CLOSED, WAITLIST_ONLY, PROVIDER_RECRUITING, SOFT_LAUNCH, OPEN, and PROTECT_QUALITY
- Admin can transition any zone-category pair between states with required reason logging
- State transitions enforce valid pathways: CLOSED can go to waitlist_only or provider_recruiting; provider_recruiting can go to soft_launch; waitlist_only can go to provider_recruiting or soft_launch; soft_launch can go to open; open can go to protect_quality or soft_launch
- Admin can override transition rules with an explicit "force override" that requires additional confirmation and reason
- Customer-facing catalog shows "Coming Soon" treatment for categories in waitlist_only state
- Customers can join a per-zone, per-category waitlist from the "Coming Soon" card
- Provider application page shows "Now Hiring" badges for categories in provider_recruiting state
- The Growth Console Zone Matrix displays all six states with distinct color-coding
- Waitlist counts are visible on the Zone Matrix for categories in waitlist_only state
- All state transitions are logged with admin ID, timestamp, reason, and previous state
- Existing zone-category records using the old 4-state enum continue to function during migration
