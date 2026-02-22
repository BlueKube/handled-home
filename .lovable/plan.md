
# Module 09 — Code Review Fixes

Addresses all issues from the review, organized by priority.

---

## MUST FIX

### 1. R1 — Provider can bypass `complete_job` RPC via direct table UPDATE

Same pattern as Module 08's R1. The `protect_job_assignment_fields` trigger only blocks changes to org/property/customer/zone, but a provider can directly `UPDATE jobs SET status = 'COMPLETED'`.

**Fix:** Add a new trigger `protect_job_status_completion` that prevents any non-SECURITY-DEFINER caller from setting `status` to `COMPLETED` unless the caller is an admin. This ensures only the `complete_job` and `admin_override_complete_job` RPCs (which run as SECURITY DEFINER) can mark jobs complete.

---

## SHOULD FIX

### 2. P1 — Issue reporting uses `prompt()` instead of structured dialog

`JobDetail.tsx` lines 264-269 use browser `prompt()` for issue type and description. Broken on mobile, bad UX.

**Fix:** Replace with a proper Sheet/Dialog component containing:
- Issue type select dropdown (all 7 types)
- Severity select (LOW/MED/HIGH, default MED)
- Description textarea (optional)
- Submit button

### 3. A3 — Photo preview uses `getPublicUrl` on a private bucket

Both provider (`JobPhotos.tsx` line 78) and admin (`JobDetail.tsx` photos tab) use `getPublicUrl` on the private `job-photos` bucket. Images won't load.

**Fix:** Replace `getPublicUrl` with `createSignedUrl` (e.g. 1-hour expiry). In the provider photos page, show actual image thumbnails. In the admin photos tab, render image thumbnails with signed URLs.

### 4. S4/S5 — Missing event types for checklist and arrival/departure

- Checklist updates write no events (spec requires `CHECKLIST_ITEM_DONE` / `CHECKLIST_ITEM_NOT_DONE`)
- Arrival/departure events use `ARRIVED`/`DEPARTED` instead of spec's `ARRIVED_MANUAL`/`DEPARTED_MANUAL`/`ARRIVED_AUTO`/`DEPARTED_AUTO`

**Fix:**
- In `useJobActions.ts`, after `updateChecklistItem` succeeds, insert a `job_event` with type `CHECKLIST_ITEM_DONE` or `CHECKLIST_ITEM_NOT_DONE`
- Change `recordArrival`/`recordDeparture` event types to include the source suffix (e.g. `ARRIVED_MANUAL`, `DEPARTED_AUTO`)

---

## NICE TO HAVE

### 5. A6 — Issue resolution missing `admin_audit_log` entry

`resolveIssue` in `useAdminJobs.ts` writes a `job_event` but no `admin_audit_log` entry.

**Fix:** Add `admin_audit_log` insert after resolving an issue.

### 6. P2 — No "Report an issue" button on checklist page

Spec says issue reporting should be accessible from "job detail or checklist".

**Fix:** Add the same issue-report button (using the new dialog from fix 2) to `JobChecklist.tsx`.

### 7. A1 — Admin jobs list missing filters

Only status and date range filters exist. Spec lists customer/property, provider org, SKU type.

**Fix:** The `useAdminJobs` hook already supports `provider_org_id` and `zone_id` filters. Add corresponding UI dropdowns to `admin/Jobs.tsx`.

### 8. P3 — Arrived/Departed button layout inconsistency

When neither arrival nor departure is recorded, the "Arrived" button sits in a 2-column grid alongside "Checklist", creating an odd layout.

**Fix:** Use conditional grid layout: 1-column when only one secondary button shows, 2-column when two show.

---

## Technical Details

### Database Migration

A small migration adds one trigger:

```text
1. CREATE FUNCTION protect_job_status_completion() -- prevents non-admin from setting status=COMPLETED
2. CREATE TRIGGER on jobs BEFORE UPDATE
```

The trigger checks: if `NEW.status = 'COMPLETED'` and `OLD.status != 'COMPLETED'`, verify the caller is admin. Since RPCs use SECURITY DEFINER, they bypass RLS but still execute triggers -- however, SECURITY DEFINER functions run as the function owner (typically `postgres`), so we need the trigger to allow the `postgres` role. The trigger will check `current_setting('role')` -- when running via SECURITY DEFINER, the role is the function owner, not `authenticated`.

### Frontend Changes

| File | Changes |
|------|---------|
| `src/pages/provider/JobDetail.tsx` | Replace prompt() with Sheet dialog for structured issue reporting |
| `src/pages/provider/JobPhotos.tsx` | Replace getPublicUrl with createSignedUrl; render image thumbnails |
| `src/pages/provider/JobChecklist.tsx` | Add "Report an Issue" button with same dialog component |
| `src/pages/admin/JobDetail.tsx` | Photos tab: use createSignedUrl and render thumbnails; resolveIssue: add admin_audit_log |
| `src/hooks/useJobActions.ts` | Add checklist event logging; fix arrival/departure event type names |
| `src/hooks/useAdminJobs.ts` | Add admin_audit_log insert in resolveIssue |
| `src/pages/admin/Jobs.tsx` | Add provider org and zone filter dropdowns |

### New Component

| File | Purpose |
|------|---------|
| `src/components/provider/ReportIssueSheet.tsx` | Reusable issue reporting dialog with type/severity/description fields, used in JobDetail and JobChecklist |

### Implementation Order

1. Database migration (status protection trigger)
2. ReportIssueSheet component
3. JobDetail.tsx (replace prompt with sheet)
4. JobPhotos.tsx (signed URLs + thumbnails)
5. useJobActions.ts (event type fixes)
6. useAdminJobs.ts (audit log fix)
7. Admin JobDetail.tsx (photo thumbnails + audit)
8. JobChecklist.tsx (add issue report button)
9. Admin Jobs.tsx (additional filters)
10. JobDetail.tsx layout fix (P3)
