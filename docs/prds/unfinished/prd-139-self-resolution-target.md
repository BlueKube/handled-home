# PRD 139: Self-Resolution Target (80% Auto-Resolve Rate)

> **Status:** PLACEHOLDER
> **Priority:** P0 Critical
> **Effort:** Medium (3–5 days)

## What Exists Today
The auto-resolve pipeline is functional end-to-end. The `support-ai-classify` edge function classifies tickets using AI (evidence score, risk score, recommended action), and the `auto-resolve-dispute` edge function applies credits and resolves tickets that pass guard criteria (evidence score >= 75, risk score < 30, credit amount <= $50). The customer-facing Guided Resolver flow walks users through category selection, description, and photo upload. The AI classification chain can automatically resolve qualifying tickets server-side and notify the customer. The OpsSupport page shows a basic "Self-Resolve (7d)" stat card, but it calculates this by checking whether tickets were resolved within 1 hour of creation -- a rough proxy, not a true auto-resolution metric. There is no dedicated dashboard, no trend tracking, no alerting, and no way to drill into what is and isn't being auto-resolved.

## What's Missing
- **True auto-resolution rate metric.** The current proxy (resolved within 1 hour) conflates fast human resolution with actual AI auto-resolution. The system needs to track whether a ticket was resolved by the `auto-resolve-dispute` function specifically, using the existing `resolved_by: "ai_auto_resolve"` metadata tag in ticket events.
- **Auto-resolution rate dashboard.** A dedicated view showing the current rate, historical trend, and breakdown by category, severity, and reason for non-resolution.
- **Target tracking with visual indicator.** A clear display of the 80% target with current performance relative to that goal.
- **Non-resolution reason breakdown.** For tickets that did not auto-resolve, a breakdown of why: evidence score too low, risk score too high, credit amount exceeds cap, flagged as repeat offender, etc.
- **Alerting when rate drops.** Automated notifications to admins when the auto-resolution rate drops below threshold (e.g., below 75% triggers a warning, below 70% triggers an alert).
- **Optimization levers visibility.** Insight into which categories have the lowest auto-resolution rates, suggesting where the AI classification or guard criteria might need adjustment.

## Why This Matters
### For the Business
The auto-resolution rate is the North Star metric for the support system's scalability. Every ticket that requires human intervention costs 5-15 minutes of admin time. At scale, a 1% improvement in auto-resolution rate eliminates dozens of support hours per week. Without measuring this rate, the team cannot optimize it, cannot detect regressions (e.g., a change to the AI model that reduces auto-resolve quality), and cannot make data-driven decisions about guard criteria thresholds. The 80% target represents the threshold at which the support system scales economically -- below that, support costs grow linearly with transaction volume.

### For the User
Customers who get instant, fair resolutions are more satisfied than those who wait for human review. Auto-resolved tickets are resolved in seconds, not hours. Measuring and optimizing the auto-resolution rate directly improves average resolution time for customers. For admins, understanding why tickets are not auto-resolving helps them focus on the right improvements rather than guessing.

## User Flow
1. Admin navigates to the Ops Support Health page (or a new dedicated "Resolution Metrics" section).
2. The hero metric shows the current 7-day auto-resolution rate as a large percentage with a visual indicator showing performance against the 80% target (e.g., a progress ring or gauge).
3. Below the hero metric, a sparkline or small chart shows the daily auto-resolution rate for the last 30 days, making trends immediately visible.
4. A breakdown table shows auto-resolution rate by issue category (quality, missed, damage, billing, safety, routine_change), highlighting which categories are below target.
5. A "Why Not Auto-Resolved" card shows the distribution of rejection reasons for the last 7 days: evidence score too low (X%), risk score too high (Y%), credit amount exceeds cap (Z%), repeat offender flag (W%).
6. Admin can click into any category to see sample tickets that narrowly missed auto-resolution (e.g., evidence score was 72, just below the 75 threshold) to understand if thresholds need adjustment.
7. When the auto-resolution rate drops below 75% for a rolling 24-hour period, the system sends an in-app notification and optional email alert to admin users.
8. When the rate drops below 70%, the alert escalates with a more urgent visual treatment (red banner on the Ops dashboard).

## UI/UX Design Recommendations
- **Hero gauge component.** Use a semi-circular gauge or progress ring centered at the top of the metrics section. The gauge should fill from 0% to 100%, with the 80% target line clearly marked. Color code: green when above 80%, yellow at 70-80%, red below 70%. Show the exact percentage in large, bold text inside the gauge.
- **Trend sparkline.** A small, clean sparkline chart showing the last 30 days of daily rates. Use the same color coding (green/yellow/red) for the line. Show a horizontal dashed line at 80% as the target reference.
- **Category breakdown table.** A simple table with one row per issue category, showing: category name, total tickets (7d), auto-resolved count, auto-resolution rate (as percentage with colored badge), and a small inline bar chart showing rate relative to 80%.
- **Rejection reason donut chart.** A donut/ring chart showing the proportional breakdown of why tickets were not auto-resolved, with each segment labeled with the reason and percentage.
- **Near-miss insight card.** A card that highlights tickets that were close to auto-resolving (e.g., "12 tickets last week had evidence scores between 70-74. Lowering the threshold by 5 points could improve rate by ~3%."). This provides actionable optimization guidance.
- **Alert banner.** When the rate is below target, show a persistent but dismissible banner at the top of the Ops dashboard with the current rate, the target, and a link to the detailed metrics view.

## Acceptance Criteria
- Auto-resolution rate is calculated using actual AI auto-resolve events (not time-based proxy)
- Dashboard shows current 7-day auto-resolution rate with visual target indicator (80% goal)
- 30-day trend chart displays daily auto-resolution rate
- Breakdown by issue category shows which categories are above/below target
- Non-resolution reasons are categorized and displayed (evidence score, risk score, credit cap, repeat offender)
- Alert triggers when 24-hour rolling auto-resolution rate drops below 75%
- Escalated alert triggers when rate drops below 70%
- Admin can drill into near-miss tickets (those close to auto-resolution thresholds)
- Metrics update in near-real-time (within minutes of new resolutions)
- All metric calculations handle edge cases (zero tickets, new categories, etc.) gracefully
