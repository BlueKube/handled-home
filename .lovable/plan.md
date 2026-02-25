

# Task 2C-C1d: Notification Preference Toggles in Settings

## What We Are Building

A shared `NotificationPreferences` card component that lets customers and providers manage their notification settings. It reads/writes the `user_notification_preferences` table and renders toggles for each notification tier plus quiet hours configuration.

---

## Technical Design

### 1. `useNotificationPreferences` Hook (`src/hooks/useNotificationPreferences.ts`)

- Fetches the user's row from `user_notification_preferences` (single row, keyed by `user_id`)
- If no row exists, upserts a default on first load (critical=true, service=true, marketing=false, quiet_hours_enabled=true, 21:00-08:00)
- Returns: `preferences`, `isLoading`, `updatePreference(field, value)` mutation
- `updatePreference` does a single-column update + invalidates query cache
- Optimistic update for instant toggle feel

### 2. `NotificationPreferences` Component (`src/components/settings/NotificationPreferences.tsx`)

- Card with `Bell` icon header: "Notification Preferences"
- Three toggle rows:
  - **Critical Alerts** — always on, toggle disabled, helper text: "Payment issues, security alerts. Cannot be disabled."
  - **Service Updates** — toggle for `service_updates_enabled`, helper: "Job reminders, schedule changes, completion receipts"
  - **Marketing & Tips** — toggle for `marketing_enabled`, helper: "Seasonal tips, referral rewards, new services"
- Separator
- **Quiet Hours** section:
  - Toggle for `quiet_hours_enabled`
  - When enabled: two time selects (start/end) for `quiet_hours_start` / `quiet_hours_end`
  - Helper: "Non-critical notifications held until quiet hours end"
- Loading skeleton while fetching

### 3. Settings Page Integration

- Add `<NotificationPreferences />` to both `customer/Settings.tsx` and `provider/Settings.tsx`, placed after `ChangePasswordForm` and before `RoleSwitcher`

---

## Files

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useNotificationPreferences.ts` | Create | Query + upsert + update mutation |
| `src/components/settings/NotificationPreferences.tsx` | Create | Card with toggles + quiet hours |
| `src/pages/customer/Settings.tsx` | Edit | Add NotificationPreferences component |
| `src/pages/provider/Settings.tsx` | Edit | Add NotificationPreferences component |

### No database changes needed — `user_notification_preferences` table and RLS already exist from Sprint C0.

