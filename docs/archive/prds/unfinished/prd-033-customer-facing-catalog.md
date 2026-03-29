# PRD 33: Customer-Facing Service Catalog

> **Status:** PARTIALLY COMPLETE
> **Priority:** P2 Medium
> **Effort:** Medium (3-5 days)

## What Exists Today

A customer-facing Services page exists at `/customer/services` with meaningful functionality already in place:

- **Search:** A live search input filters services by name in real time.
- **Featured carousel:** Services flagged as `is_featured` display in a horizontally scrollable row at the top using the ServiceCard "featured" variant -- cards with hero images, overlay gradients, duration badges, and price hints.
- **Category grouping:** Non-search results are grouped by category (lawn_care, cleaning, landscaping, pest_control, pool_care) with category-specific icons and labels, sorted in a defined display order.
- **Service detail sheet:** Tapping any service card opens a bottom sheet with the SkuDetailView component showing full service details.
- **ServiceCard component:** Two variants exist -- "default" (vertical card with image, name, description, duration, price hint) and "featured" (wider horizontal card with image overlay and compact info).

The admin side has full SKU catalog management. SKUs have names, descriptions, categories, hero images, featured flags, display ordering, duration estimates, price hints, and structured scope (inclusions, exclusions, checklists).

Services are also surfaced through the AI-powered routine builder suggestions and the onboarding wizard's routine step, but those are separate discovery channels.

## What's Missing

Despite the existing Services page having search, featured scroll, and category grouping, several elements are needed to make it a true browsable catalog experience:

1. **Category filter chips/tabs:** Customers cannot quickly jump to a specific category. They must scroll past all categories to find what they want. Horizontal filter chips or tabs (e.g., "All | Lawn Care | Cleaning | Pool") would let customers narrow the view instantly.

2. **"Add to Routine" action from catalog:** The service detail sheet shows information but does not let the customer add the service to their current routine or draft routine directly. The catalog is read-only -- customers must go to the routine builder separately to act on what they discover.

3. **Availability awareness:** The catalog does not reflect zone-category state. If pool_care is not available in the customer's zone, pool services still show up with no indication they cannot be ordered. The catalog should show "Available," "Coming Soon," or hide unavailable services based on the customer's zone.

4. **Seasonal and contextual curation:** There is no mechanism to show "Spring Cleanup Picks" or "Most Popular in Your Area" sections. The featured carousel is static -- it shows the same featured services regardless of season, location, or customer profile.

5. **Empty state and discovery prompts:** If a customer's zone has very few services, the catalog feels sparse. There is no "More services coming soon" messaging or prompting to join waitlists for upcoming categories.

6. **Navigation prominence:** The Services page is accessible via the sidebar but is not prominently featured on the customer dashboard. There is no "Explore Services" card or entry point on the home screen.

## Why This Matters

### For the Business
- **Higher ARPU (Average Revenue Per User):** Customers who browse a rich catalog add more services to their routine. Every additional service per customer increases revenue without proportional acquisition cost. Industry benchmarks suggest catalog browsing drives 15-30% higher service attachment.
- **Reduced reliance on AI suggestions:** The AI suggestion engine is valuable but limited by what it knows about the customer. A browsable catalog lets customers self-discover services the AI might not suggest, capturing demand that would otherwise be invisible.
- **Cross-sell and upsell surface:** A catalog with "Popular in your area" and seasonal recommendations creates natural upsell moments. A customer browsing lawn care sees gutter cleaning suggested alongside it and adds both.
- **Market intelligence:** Tracking which services customers browse, click, and add-to-routine (vs. which they skip) provides valuable signal for category expansion and SKU prioritization decisions.

### For the User
- **Discovery and control:** Some customers prefer to browse and choose rather than be told what they need. A catalog respects different shopping styles -- some people want the AI assistant, others want to see everything and pick.
- **Confidence in value:** Seeing the full range of available services reinforces the value of the subscription. "I'm paying for access to all of this" feels different from "I have three services set up."
- **Seasonal awareness:** Customers may not realize they need gutter cleaning until they see it highlighted as a fall essential. The catalog educates while it sells.

## User Flow

### Browsing and Adding a Service

1. Customer taps "Services" in the bottom navigation or sidebar, or taps an "Explore Services" card on their dashboard.
2. The catalog page loads with a hero section showing 2-3 featured services in a horizontally scrollable carousel with rich imagery.
3. Below the carousel, a row of category filter chips appears: "All," "Lawn Care," "Cleaning," "Pool," "Pest Control," "Landscaping," and any additional active categories. The active chip is highlighted.
4. Customer taps "Pool" to filter. The grid below instantly filters to show only pool services. A subtle animation transitions the grid.
5. Customer taps a service card ("Weekly Pool Maintenance"). A detail sheet slides up from the bottom.
6. The detail sheet shows: hero image, service name, duration estimate, price hint, full description, what's included, what's not included, and a prominent "Add to My Routine" button.
7. Customer taps "Add to My Routine." The system adds the service to their draft routine (or active routine if subscribed) and shows a toast confirmation: "Pool Maintenance added to your routine."
8. Customer dismisses the sheet and continues browsing. A subtle badge on the "Routine" nav item shows the count of newly added services.

### Encountering an Unavailable Service

1. Customer scrolls past active categories and sees a "Coming Soon" section at the bottom of the catalog.
2. This section shows 1-2 services from categories in waitlist_only state for their zone, displayed with a desaturated card style.
3. Customer taps a "Coming Soon" service. The detail sheet shows the service description and a "Notify Me When Available" button instead of "Add to Routine."
4. Customer taps "Notify Me." They see a confirmation and the card updates to show a small checkmark indicating they are on the waitlist.

### Seasonal Discovery

1. During fall, a curated "Fall Essentials" section appears between the featured carousel and the main grid.
2. This section highlights services like gutter cleaning, leaf removal, and winterization with seasonal imagery.
3. The section is time-limited and admin-configurable (start date, end date, which SKUs to feature).

## UI/UX Design Recommendations

- **Category filter chips:** Use a horizontally scrollable row of pill-shaped chips. The selected chip should use the brand accent fill with white text; unselected chips should use a subtle outline style. Place them in a sticky position below the search bar so they remain accessible while scrolling.
- **Search with recent/popular:** Enhance the existing search with a dropdown showing "Popular Services" and "Recently Viewed" when the search field is focused but empty. This reduces the effort to find services the customer has browsed before.
- **Service card enhancements:** Add a small "handles cost" indicator to each card (e.g., "2 handles") so customers understand the cost at a glance without opening the detail sheet. Also add a subtle heart/bookmark icon for favoriting services they want to remember.
- **Detail sheet redesign:** Make the bottom sheet taller (70-80% of screen) with a sticky "Add to Routine" button at the bottom. Include a photo gallery if multiple images exist. Show "X customers in your area use this service" as social proof when available.
- **Dashboard entry point:** Add an "Explore Services" card to the customer dashboard, positioned after the routine summary. Use a visually distinct gradient background with a call-to-action like "Discover 20+ services for your home." The number should be dynamic based on available SKUs.
- **Grid layout:** Use a 2-column grid on mobile with consistent card heights. Cards should have a slight shadow on press and a smooth scale animation on tap for tactile feedback.
- **Empty state:** If the customer's zone has fewer than 5 active services, show an encouraging message: "More services are on the way for your area. Here's what's available now." Include a link to browse the full catalog with a note about which services are coming soon.

## Acceptance Criteria

- The customer Services page displays a featured services carousel, category filter chips, and a categorized grid of all available services
- Category filter chips filter the grid in real time with smooth transitions
- Tapping a service card opens a detail sheet with full service information and an "Add to Routine" action
- "Add to Routine" adds the service to the customer's active or draft routine and shows a confirmation toast
- Services unavailable in the customer's zone are shown in a "Coming Soon" section with a "Notify Me" action, or hidden entirely if the category is CLOSED
- The search input filters across all categories and shows results in a flat grid
- The customer dashboard includes an "Explore Services" entry point that links to the catalog
- Category filter state persists during the session (navigating away and back remembers the selected category)
- Service cards display the service name, category icon, duration estimate, and price hint
- The catalog reflects the customer's zone availability -- only services from active categories are shown as orderable
- Browsing and click analytics are tracked (which services are viewed, which are added to routine) for product intelligence
