# PRD 160: Notification Digest Batching

> **Status:** PLACEHOLDER
> **Priority:** P2 Medium
> **Effort:** Medium (3-5 days)

## What Exists Today

The notification system has a solid foundation for digests, but only the schema layer:

- **`digest_eligible` boolean** on `notification_templates` -- SERVICE-tier templates are marked as digest-eligible by default. Templates are categorized into three priority tiers: CRITICAL, SERVICE, and MARKETING.
- **`notification_digests` table** -- Tracks per-user, per-day digest records with fields for `user_id`, `digest_date`, `notification_id`, `included_at`, and `sent_at`. Has a unique constraint on (user_id, digest_date) and FK to notifications.
- **User notification preferences** are fully built (`NotificationPreferences` component) with per-tier toggles (Critical/Service/Marketing), quiet hours, and timezone support.
- **`process-notification-events` edge function** processes notifications individually, routing through in-app, push, and email channels.
- **`send-email` edge function** handles email delivery via Resend integration.
- **Admin notification health dashboard** tracks delivery stats, deadletters, and processing latency.

What does NOT exist: no batch processing logic, no daily/weekly digest aggregation job, no digest rendering template, and no digest delivery pipeline. The schema is ready but nothing consumes it.

## What's Missing

1. **Digest aggregation job:** A scheduled job (daily and/or weekly) that collects all digest-eligible notifications for each user since their last digest, groups them, and creates a consolidated digest record.
2. **Digest rendering pipeline:** Logic to take a batch of notifications and render them into a single cohesive digest -- both as an in-app digest view and as a formatted email.
3. **Digest delivery:** Integration with the existing `send-email` function to deliver the compiled digest email, and an in-app digest summary card in the notification center.
4. **User digest frequency preference:** A setting for users to choose their digest cadence (daily or weekly) for SERVICE and MARKETING tier notifications.
5. **Notification hold logic:** When a notification is digest-eligible and the user has digest mode enabled, the processor should hold it rather than delivering immediately, marking it for inclusion in the next digest.
6. **Digest opt-out:** Users who prefer immediate delivery for all notifications should be able to disable digest batching.

## Why This Matters

### For the Business
Notification fatigue is the number one reason users disable push notifications entirely. Once notifications are disabled, users are 3x more likely to churn because they miss important service updates (job confirmations, schedule changes, resolution offers). Batching low-priority notifications into a daily digest keeps users informed without training them to ignore or disable the notification channel. Protecting the notification channel protects retention. Additionally, batching reduces infrastructure costs by consolidating multiple email sends into one per user per day.

### For the User
A user who gets 4-5 SERVICE-tier notifications in a single day (job confirmed, provider assigned, weekly summary, plan renewal reminder) experiences each one as an interruption. The same information packaged as a single daily digest at a predictable time (e.g., 9 AM in their timezone) transforms interruptions into a pleasant morning briefing. Users retain control: CRITICAL notifications (service issues, billing problems, safety alerts) always arrive immediately. The digest is for everything that can wait.

## User Flow

1. **Opt-in (Settings):** User visits notification preferences (already built). A new "Digest mode" toggle appears under the SERVICE tier section, with a frequency selector (Daily or Weekly). When enabled, a time-of-day picker lets the user choose their preferred delivery time (default: 9:00 AM local).
2. **Notification arrives:** When the notification processor handles a digest-eligible notification for a user with digest mode enabled, it marks the notification as "held for digest" instead of delivering it immediately. The notification is still visible in the in-app notification center but without a push or email.
3. **Digest job runs:** A scheduled job runs at the top of each hour. For each user whose preferred digest time has arrived (accounting for timezone), it collects all held notifications since the last digest.
4. **Digest is compiled:** The job groups notifications by category (e.g., "Service Updates," "Account Activity," "Recommendations") and generates a digest. Each notification in the digest shows its title, a brief body preview, timestamp, and a deep link to the relevant page.
5. **Digest is delivered:** The compiled digest is sent as a single email (via `send-email`) and/or a single push notification with a summary line (e.g., "You have 4 updates from Handled"). Tapping the push notification opens the in-app digest view.
6. **In-app digest view:** In the notification center, digest-batched notifications are grouped under a collapsible "Daily Digest - [Date]" header. Expanding it shows individual notification cards.
7. **Fallback:** If no digest-eligible notifications exist for a user on a given day, no digest is sent (no empty emails).

## UI/UX Design Recommendations

- **Digest toggle in preferences:** Place it as a sub-section under the SERVICE tier toggle (only visible when SERVICE notifications are enabled). Use a clean toggle + frequency selector pattern. Show a helper text: "Batch non-urgent updates into a single daily or weekly summary."
- **Time picker:** A simple hour-only dropdown (6 AM through 10 PM in 1-hour increments) with the user's timezone displayed next to it. The timezone is already captured in notification preferences.
- **Email digest template:** A clean, mobile-friendly email layout. Header with the Handled logo and "Your Daily Update." Sections grouped by category with subtle divider lines. Each notification as a compact row: icon + title + 1-line body + timestamp. A single "Open Handled" CTA button at the bottom. Footer with one-click unsubscribe/manage preferences link.
- **In-app digest grouping:** In the notification center, use a collapsible section header styled as a date-stamped card. The header shows the date, notification count, and an expand/collapse chevron. Collapsed by default to keep the notification list clean. Expand reveals individual notification cards in their standard format.
- **Push notification for digest:** A single push with a summary subject (e.g., "4 updates today") and the first notification's title as the body preview. Tapping opens the notification center filtered to that digest date.
- **Visual distinction:** Digest-held notifications in the in-app center should show a subtle "Included in digest" tag or a clock icon to indicate they are waiting for batch delivery rather than being individually pushed.
- **CRITICAL bypass:** Make it visually clear in the preferences UI that CRITICAL notifications always arrive immediately regardless of digest settings. Use an informational note: "Urgent alerts (service issues, billing, safety) are always delivered instantly."

## Acceptance Criteria

- Users can enable/disable digest mode for SERVICE and MARKETING tier notifications in their notification preferences.
- Users can select a digest frequency (daily or weekly) and a preferred delivery time.
- When digest mode is enabled, digest-eligible notifications are held from push/email delivery and instead batched.
- Held notifications remain visible in the in-app notification center immediately (just without push/email).
- A scheduled digest job runs hourly and delivers compiled digests at each user's preferred time, respecting their timezone.
- The digest email groups notifications by category and includes deep links to relevant pages.
- A push notification summary is sent when the digest is delivered.
- In the notification center, digested notifications are grouped under a collapsible date-stamped header.
- CRITICAL notifications are never batched -- they always deliver immediately regardless of digest settings.
- No digest is sent if there are zero digest-eligible notifications for that period.
- The digest job is registered as a sub-job in the `run-scheduled-jobs` orchestrator with proper cron run logging.
- The admin notification health dashboard reflects digest delivery stats (digests sent, notifications batched, delivery success rate).
