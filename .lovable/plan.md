

# Module 09 — Job Execution Implementation Plan

This is the core service delivery module. Every completed job produces auditable proof, enforces quality standards, and builds customer trust. The implementation covers database schema, server-side RPCs, provider job execution UI, admin support tools, and a storage bucket for job photos.

---

## Phase 1: Database Migration

A single migration creates all tables, RPCs, RLS policies, storage bucket, and constraints.

### 1.1 Tables (6 new tables)

**`jobs`** -- Core job record
- `id`, `service_day_instance_id` (nullable), `routine_version_id` (nullable), `property_id`, `customer_id`, `zone_id`, `provider_org_id`
- `status` with CHECK (`NOT_STARTED`, `IN_PROGRESS`, `ISSUE_REPORTED`, `PARTIAL_COMPLETE`, `COMPLETED`, `CANCELED`)
- `access_notes_snapshot` (text, snapshotted from property at job creation)
- `started_at`, `completed_at`, `arrived_at`, `departed_at` (all timestamptz nullable)
- `arrived_source`, `departed_source` (text nullable, CHECK `auto`/`manual`)
- `provider_summary` (text nullable, max 240 chars enforced via trigger)
- `created_at`, `updated_at` with auto-update trigger

**`job_skus`** -- SKUs attached to this job (snapshotted at creation)
- `id`, `job_id` FK, `sku_id` FK -> service_skus.id
- UNIQUE(job_id, sku_id)

**`job_checklist_items`** -- Checklist derived from SKU definitions
- `id`, `job_id` FK, `sku_id` (nullable), `label`, `is_required` (default true)
- `status` CHECK (`PENDING`, `DONE`, `NOT_DONE_WITH_REASON`)
- `reason_code` (nullable), `note` (nullable), `updated_at`

**`job_photos`** -- Photo evidence
- `id`, `job_id` FK, `sku_id` (nullable), `slot_key` (nullable)
- `storage_path` (text not null), `upload_status` CHECK (`PENDING`, `UPLOADED`, `FAILED`)
- `captured_at` (nullable), `created_at`

**`job_issues`** -- Structured issue reports
- `id`, `job_id` FK
- `issue_type` CHECK (7 types: `COULD_NOT_ACCESS`, `SAFETY_CONCERN`, `MISSING_SUPPLIES`, `EXCESSIVE_SCOPE`, `CUSTOMER_REQUESTED_CHANGE`, `WEATHER_RELATED`, `OTHER`)
- `severity` CHECK (`LOW`, `MED`, `HIGH`)
- `description` (nullable), `created_by_user_id`, `created_by_role` CHECK (`provider`, `customer`, `admin`)
- `status` CHECK (`OPEN`, `RESOLVED`), `resolved_at`, `resolved_by_admin_user_id`, `resolution_note`
- `created_at`, `updated_at`

**`job_events`** -- Append-only audit trail
- `id`, `job_id` FK, `actor_user_id`, `actor_role` CHECK (`provider`, `admin`, `customer`, `system`)
- `event_type` (text not null), `metadata` (jsonb default '{}'), `created_at`

### 1.2 RLS Policies

All tables have RLS enabled. Access model:

| Table | Provider | Customer | Admin |
|-------|----------|----------|-------|
| jobs | Read/Update own org's jobs (no assignment field changes) | Read own jobs | Full access |
| job_skus | Read own org's jobs | Read own jobs | Full access |
| job_checklist_items | Read/Update own org's jobs; Insert for own org | Read own jobs | Full access |
| job_photos | Read/Insert/Update own org's jobs | Read own jobs | Full access |
| job_issues | Read/Insert own org's jobs | Read/Insert own jobs | Full access |
| job_events | Read own org's jobs; Insert own org's jobs | Read own jobs | Full access |

Provider UPDATE on `jobs` uses a trigger to prevent changing `provider_org_id`, `property_id`, `customer_id`, `zone_id` (assignment fields are immutable).

### 1.3 Storage Bucket

Create `job-photos` bucket (private):
- INSERT: authenticated users
- SELECT: owner (provider org member via job lookup) + admin
- Folder structure: `{job_id}/{photo_id}`

### 1.4 RPCs (4 functions)

**`start_job(p_job_id uuid)`** (SECURITY DEFINER)
- Validates provider org membership
- Validates job status is `NOT_STARTED`
- Sets status = `IN_PROGRESS`, `started_at = now()`
- Writes `JOB_STARTED` event
- Returns job record

**`report_job_issue(p_job_id uuid, p_issue_type text, p_severity text, p_description text)`** (SECURITY DEFINER)
- Validates provider org membership and job is active (IN_PROGRESS or ISSUE_REPORTED)
- Inserts into `job_issues`
- Updates job status to `ISSUE_REPORTED`
- Writes `ISSUE_REPORTED` event
- Returns issue record

**`complete_job(p_job_id uuid, p_provider_summary text DEFAULT NULL)`** (SECURITY DEFINER)
- Validates provider org membership
- Validates job is IN_PROGRESS or ISSUE_REPORTED or PARTIAL_COMPLETE
- Checks all required checklist items are DONE or NOT_DONE_WITH_REASON
- Checks all required photos have upload_status = 'UPLOADED'
- If issues exist and not all resolved, marks PARTIAL_COMPLETE instead
- If valid: sets COMPLETED, completed_at, provider_summary; writes JOB_COMPLETED event
- Returns validation result or completion confirmation

**`admin_override_complete_job(p_job_id uuid, p_reason text, p_note text DEFAULT NULL)`** (SECURITY DEFINER)
- Requires admin role
- Records what was missing in metadata
- Sets job COMPLETED with override flag
- Writes `ADMIN_OVERRIDE_COMPLETION` event with reason
- Returns confirmation

### 1.5 Triggers

- `update_updated_at` trigger on `jobs`, `job_checklist_items`, `job_issues`
- `protect_job_assignment_fields` -- BEFORE UPDATE on `jobs`, prevents non-admin from changing `provider_org_id`, `property_id`, `customer_id`, `zone_id`

### 1.6 Realtime

Enable realtime on `jobs` table for live status updates.

---

## Phase 2: React Hooks

### 2.1 `useProviderJobs` (new)
- Fetches jobs for the current user's provider org
- Filters: today, upcoming, history (completed/canceled)
- Joins job_skus -> service_skus for display names
- Returns loading/error states

### 2.2 `useJobDetail` (new)
- Fetches single job by ID with all related data (skus, checklist, photos, issues, events)
- Validates provider org membership client-side
- Returns structured job detail object

### 2.3 `useJobActions` (new)
- `startJob` mutation (calls `start_job` RPC)
- `updateChecklistItem` mutation (direct update on job_checklist_items)
- `uploadPhoto` mutation (upload to storage + insert job_photos record)
- `reportIssue` mutation (calls `report_job_issue` RPC)
- `completeJob` mutation (calls `complete_job` RPC)
- `recordArrival` / `recordDeparture` mutations (update jobs + insert event)
- All mutations invalidate relevant query keys

### 2.4 `useAdminJobs` (new)
- Fetches all jobs with filters (status, date range, provider org, customer, zone)
- Admin override mutations (calls `admin_override_complete_job` RPC)
- Resolve issue mutation (update job_issues + insert event)

---

## Phase 3: Provider UI (6 pages/routes)

### 3.1 Provider Jobs List (`/provider/jobs`)
File: `src/pages/provider/Jobs.tsx` (replace placeholder)

- Two tabs: **Today** and **Upcoming**
- Job cards showing: stop number, property label, service summary (SKU names), status pill, resume indicator
- Cards tap through to job detail
- Empty state: "Jobs will appear here when assigned"
- Pull-to-refresh pattern (invalidate queries)

### 3.2 Provider Job History (`/provider/history`)
File: `src/pages/provider/History.tsx` (new page)

- List of completed/canceled jobs with date grouping
- Each card: property, SKUs, completion time, issue indicator
- Tapping opens read-only job detail

### 3.3 Job Detail (`/provider/jobs/:jobId`)
File: `src/pages/provider/JobDetail.tsx` (new)

Sections in order:
1. **What to do** -- SKU names with scope bullets
2. **Access and safety** -- gate code, pets, parking, access instructions (from snapshot)
3. **Proof required** -- checklist count (X/Y required done), photo count (X/Y uploaded)
4. Primary CTAs: Start Job / Checklist / Photos / Complete (disabled until requirements met)
5. Secondary CTAs: Report an Issue, Record Arrival/Departure

Guidance microcopy: "Finish checklist and required photos to complete."

### 3.4 Job Checklist (`/provider/jobs/:jobId/checklist`)
File: `src/pages/provider/JobChecklist.tsx` (new)

- List of checklist items with required indicator
- One-tap "Done" button per item
- "Cannot complete" flow: select reason code + optional short note
- Required items must end in Done or Not-done-with-reason before completion
- Progress indicator at top

### 3.5 Job Photos (`/provider/jobs/:jobId/photos`)
File: `src/pages/provider/JobPhotos.tsx` (new)

- Required photo slots (labeled: Before, After, etc.) shown first
- Upload status per photo (Pending/Uploaded/Failed with retry)
- "Add extra photo" button
- File input with camera capture preference (`accept="image/*" capture="environment"`)
- Upload to Supabase Storage `job-photos` bucket
- Insert `job_photos` record with `upload_status`
- Compression before upload (canvas-based resize to max 1200px)
- "Uploads pending" banner when any photo is PENDING

### 3.6 Job Complete (`/provider/jobs/:jobId/complete`)
File: `src/pages/provider/JobComplete.tsx` (new)

- Checklist summary: "10/10 required complete"
- Photo summary: "After photos: 2/2 uploaded"
- Issue summary (if any open issues)
- Optional provider summary field (max 240 chars)
- Submit calls `complete_job` RPC
- If invalid: show exactly what's missing with navigation links
- If valid: success screen with confirmation

---

## Phase 4: Admin UI (2 pages)

### 4.1 Admin Jobs List (`/admin/jobs`)
File: `src/pages/admin/Jobs.tsx` (new)

- Filters: status, date range, provider org, zone
- Job cards: property, provider org, status, date, issue indicator, "missing proof" flag
- Click through to admin job detail

### 4.2 Admin Job Detail (`/admin/jobs/:jobId`)
File: `src/pages/admin/JobDetail.tsx` (new)

- Read-only evidence view with tabs:
  - Overview (assignment info, timestamps, provider summary)
  - Checklist (all items with statuses and skip reasons)
  - Photos (gallery view with signed URLs)
  - Issues (list with resolution controls)
  - Events (timeline of all job_events)
- Admin actions:
  - Override completion (with reason dialog)
  - Mark "needs redo" (writes event)
  - Resolve issue (with note)

---

## Phase 5: Routing and Navigation Updates

### 5.1 New Routes in App.tsx

Provider routes:
- `/provider/jobs/:jobId` -> JobDetail
- `/provider/jobs/:jobId/checklist` -> JobChecklist
- `/provider/jobs/:jobId/photos` -> JobPhotos
- `/provider/jobs/:jobId/complete` -> JobComplete
- `/provider/history` -> ProviderHistory

Admin routes:
- `/admin/jobs` -> AdminJobs
- `/admin/jobs/:jobId` -> AdminJobDetail

### 5.2 Navigation Updates

- Add "Jobs" entry to admin sidebar nav (after Providers)
- Provider sidebar already has "My Jobs" pointing to `/provider/jobs`
- Add "History" to provider sidebar nav

### 5.3 StatusBadge Updates

Add new status entries to StatusBadge.tsx:
- `not_started` -- secondary style
- `issue_reported` -- warning style
- `partial_complete` -- warning style

---

## Phase 6: Spec File

Copy the uploaded spec to `docs/modules/09-job-execution.md` replacing the existing placeholder.

---

## Technical Details

### New Files Created
| File | Purpose |
|------|---------|
| `supabase/migrations/YYYYMMDD_module09_job_execution.sql` | All schema, RLS, RPCs, triggers, storage |
| `src/hooks/useProviderJobs.ts` | Provider job list queries |
| `src/hooks/useJobDetail.ts` | Single job detail with related data |
| `src/hooks/useJobActions.ts` | All provider job mutations |
| `src/hooks/useAdminJobs.ts` | Admin job queries and actions |
| `src/pages/provider/Jobs.tsx` | Provider jobs list (replace placeholder) |
| `src/pages/provider/JobDetail.tsx` | Provider job detail |
| `src/pages/provider/JobChecklist.tsx` | Checklist completion flow |
| `src/pages/provider/JobPhotos.tsx` | Photo capture and upload |
| `src/pages/provider/JobComplete.tsx` | Completion review and submit |
| `src/pages/provider/History.tsx` | Provider job history |
| `src/pages/admin/Jobs.tsx` | Admin jobs search and list |
| `src/pages/admin/JobDetail.tsx` | Admin job detail with override tools |
| `docs/modules/09-job-execution.md` | Updated spec |

### Modified Files
| File | Changes |
|------|---------|
| `src/App.tsx` | Add 7 new routes (5 provider, 2 admin) |
| `src/components/AppSidebar.tsx` | Add "Jobs" to admin nav, "History" to provider nav |
| `src/components/StatusBadge.tsx` | Add `not_started`, `issue_reported`, `partial_complete` status styles |

### Implementation Order
1. Copy spec file to docs/modules/
2. Database migration (tables + RLS + RPCs + triggers + storage)
3. React hooks (useProviderJobs, useJobDetail, useJobActions, useAdminJobs)
4. Provider Jobs list page (replace placeholder)
5. Provider Job Detail page
6. Provider Job Checklist page
7. Provider Job Photos page (with compression + upload)
8. Provider Job Complete page (with RPC validation)
9. Provider History page
10. Admin Jobs list page
11. Admin Job Detail page (with override tools)
12. App.tsx routing + sidebar/statusbadge updates

### Deferred (not in this implementation)
- GPS tracking layer (Section 13 of spec) -- marked as optional, will stub the data model but not implement the tracking UI or geolocation
- AI automations (Section 14) -- informational only, no implementation needed for MVP
- Customer receipt notification (Section 6) -- the data payload is produced by the `complete_job` RPC; actual notification delivery is deferred to a future module
- Offline photo queue with service worker -- will implement basic retry but full offline-first with IndexedDB is deferred
- `job_tracking_state` table -- will include in migration as a stub for future use

