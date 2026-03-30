# PRD 24: Zone Launch Lifecycle

> **Status:** PARTIALLY COMPLETE
> **Priority:** P1 High
> **Effort:** Medium (3-5 days)

## What Exists Today

The system has a working zone management framework with ZIP-code-based zone definitions, per-zone capacity settings (max homes/day, max minutes/day, buffer percentage), zone health scores (Green/Yellow/Red), and a `market_zone_category_state` table that controls per-category availability within each zone.

The current lifecycle uses four states: **CLOSED**, **SOFT_LAUNCH**, **OPEN**, and **PROTECT_QUALITY**. An admin can override zone category states via an RPC with reason logging and optional time-based locks. Zones can be created, configured, and toggled between these four states. The admin Growth Console has a Zone Matrix tab showing all zones and their per-category states with color-coded badges.

## What's Missing

The designed 5-state lifecycle -- **planning**, **recruiting**, **soft_launch**, **live**, **paused** -- is not fully implemented. Three states are missing:

1. **Planning** -- A pre-launch state for zones being set up but not yet visible to providers or customers. Today, a new zone jumps straight to CLOSED, which does not distinguish "we haven't started yet" from "we intentionally shut this down."

2. **Recruiting** -- A state where the zone is actively seeking providers but not yet accepting customers. Today, ops must use informal channels to track which zones are in recruitment mode since there is no system state for it.

3. **Paused** -- A temporary halt state for situations like severe weather, capacity emergencies, or seasonal slowdowns. Today, the only way to stop a zone is to set it to CLOSED, which carries a finality that does not match temporary situations and may trigger unnecessary customer notifications or concern.

Additionally, the existing states (SOFT_LAUNCH, OPEN, PROTECT_QUALITY) need to be mapped or migrated to align with the designed lifecycle vocabulary (soft_launch, live, protect_quality).

## Why This Matters

### For the Business
- **Operational visibility:** Without planning and recruiting states, the ops team has no system-level view of which zones are in pre-launch preparation. This forces them to track launch progress in spreadsheets or Slack, creating information silos.
- **Launch playbook automation:** A proper lifecycle enables automated checklists -- "Zone X is in planning, here's what is still needed before recruiting can begin." This turns zone launches from ad-hoc efforts into repeatable processes.
- **Capacity protection:** Without a paused state, weather events or provider shortages force a binary choice: keep the zone open (risking poor service) or close it entirely (losing customer confidence). Paused provides a middle ground with clear customer messaging.
- **Franchise-readiness:** As Handled Home scales into new metros, a proper launch lifecycle becomes the playbook. Every new zone follows the same sequence, reducing launch risk.

### For the User
- **Customers** get accurate expectations. A zone in "recruiting" shows a waitlist signup rather than appearing unavailable. A "paused" zone displays "We'll be back soon" messaging instead of looking permanently closed.
- **Providers** see recruiting zones as opportunities to apply, creating a pipeline before customer demand arrives. Providers are ready on day one of soft launch.
- **Ops admins** get a clear dashboard showing every zone's position in the launch pipeline, enabling better resource allocation and launch coordination across markets.

## User Flow

### Admin: Creating and Advancing a Zone Through Lifecycle

1. Admin navigates to Zones management and taps "Create Zone."
2. After configuring ZIP codes, capacity settings, and categories, the zone is created in **Planning** state.
3. The zone detail page shows a lifecycle progress bar: Planning > Recruiting > Soft Launch > Live, with the current state highlighted.
4. In Planning state, the zone appears only in admin views. A checklist shows launch prerequisites (capacity configured, provider pay rates set, service categories selected).
5. When prerequisites are met, admin taps "Begin Recruiting" to advance to **Recruiting** state.
6. In Recruiting state, the zone appears on the provider application funnel as an available territory. Customers searching this ZIP see a "Coming Soon -- Join Waitlist" option.
7. Once enough providers are approved, admin taps "Start Soft Launch" to advance to **Soft Launch** state.
8. In Soft Launch state, a limited number of founding customers can subscribe. The system enforces capacity limits more conservatively.
9. After validating service quality, admin taps "Go Live" to advance to **Live** state, opening the zone fully.
10. At any point after recruiting, admin can tap "Pause Zone" to enter **Paused** state with a required reason (weather, capacity, seasonal, other).
11. In Paused state, existing customers see "Service temporarily paused" messaging. New signups are redirected to the waitlist. No new jobs are generated.
12. Admin taps "Resume" from Paused to return to the previous active state.

### Customer: Encountering a Non-Live Zone

1. Customer enters their ZIP code during onboarding.
2. If the zone is in Planning or Recruiting, they see: "We're getting ready to launch in your area. Join our waitlist to be first in line."
3. If the zone is Paused, existing customers see a dashboard banner: "Service in your area is temporarily paused. We'll notify you when service resumes." Their subscription billing is handled according to pause policy.
4. If the zone is in Soft Launch, customers see a "Limited Availability" badge and may be offered founding member pricing.

## UI/UX Design Recommendations

- **Lifecycle progress bar:** A horizontal stepper component on the zone detail page showing all 5 states as connected nodes. The current state is highlighted in the brand accent color; completed states are filled; future states are outlined. Paused overlays the current state with an amber indicator.
- **State transition buttons:** Primary action buttons at the bottom of the zone detail page that contextually show the next logical transition ("Begin Recruiting", "Start Soft Launch", "Go Live", "Pause Zone"). Destructive actions (moving backward) should use a secondary/danger style and require confirmation.
- **Admin zone list:** Add a color-coded status pill next to each zone name. Planning = gray, Recruiting = blue, Soft Launch = amber, Live = green, Paused = red with a pulse animation.
- **Pause modal:** When pausing, show a modal with reason selection (dropdown), expected duration (optional date picker), and a preview of what customers will see. This ensures admins understand the customer impact before confirming.
- **Customer-facing messaging:** For non-live zones, use warm, reassuring copy. Avoid technical terms like "recruiting" -- instead say "We're building your local team." For paused zones, lead with empathy: "Due to [reason], service is on a brief hold. Your subscription is safe."
- **Zone pipeline dashboard widget:** On the ops dashboard, show a pipeline view -- how many zones are in each lifecycle stage -- giving leadership a quick read on market expansion progress.

## Acceptance Criteria

- A newly created zone defaults to "planning" state and is invisible to customers and providers
- Admin can advance a zone through the full lifecycle: planning > recruiting > soft_launch > live
- Admin can pause any zone that is in recruiting, soft_launch, or live state
- Admin can resume a paused zone to its pre-pause state
- Pausing a zone requires a reason and optionally an expected resume date
- Backward transitions (e.g., live to soft_launch) require confirmation and a reason
- Customer-facing ZIP lookup returns appropriate messaging for each zone state (coming soon, limited availability, paused, or fully available)
- Waitlist signups are available for zones in planning, recruiting, or paused states
- No new jobs are generated for zones in planning, recruiting, or paused states
- The admin zone list shows the current lifecycle state with visual differentiation for each state
- Zone lifecycle transitions are logged in the audit trail with admin ID, reason, and timestamp
- Existing zones with CLOSED/SOFT_LAUNCH/OPEN/PROTECT_QUALITY states continue to function correctly during and after migration
