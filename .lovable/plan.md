

# Module 10 — Customer Dashboard and Proof Implementation Plan

This module transforms the customer experience into a premium "control center" with a 4-week preview timeline, visit receipts with proof (photos, timestamps, checklist highlights), and structured issue reporting. It consumes data produced by Modules 07 (routines) and 09 (jobs/proof).

---

## Phase 1: Database Migration

A small migration adds one new table and updates RLS. Most data already exists from Module 09.

### 1.1 New Table: `customer_issues`

Customer-facing issue intake with different reason taxonomy than provider `job_issues`:

- `id` uuid PK
- `job_id` uuid FK -> jobs.id
- `customer_id` uuid NOT NULL
- `reason` text NOT NULL, CHECK (`missed_something`, `damage_concern`, `not_satisfied`, `other`)
- `note` text NOT NULL (max 500 chars enforced via trigger)
- `photo_storage_path` text nullable (for damage photos)
- `photo_upload_status` text nullable, CHECK (`PENDING`, `UPLOADED`, `FAILED`)
- `status` text NOT NULL DEFAULT `submitted`, CHECK (`submitted`, `under_review`, `resolved`)
- `resolution_note` text nullable
- `resolved_at` timestamptz nullable
- `resolved_by_admin_user_id` uuid nullable
- `created_at`, `updated_at` with auto-update trigger
- UNIQUE(job_id, customer_id) -- one issue per visit per customer (spec rate limit)

### 1.2 RLS Policies for `customer_issues`

- Customer: SELECT/INSERT own issues (customer_id = auth.uid())
- Admin: ALL access
- No provider access to customer issues

### 1.3 Storage Policy Update

Add customer read access to `job-photos` bucket: customers can read photos for their own jobs (join job_photos -> jobs where customer_id = auth.uid()).

### 1.4 Admin RPC: `admin_resolve_customer_issue`

SECURITY DEFINER function that:
- Validates admin role
- Updates status to `resolved`, sets resolution_note, resolved_at, resolved_by_admin_user_id
- Writes to admin_audit_log

---

## Phase 2: React Hooks (4 new hooks)

### 2.1 `useCustomerJobs` (new)
- Fetches jobs for the current customer
- Filters: upcoming (NOT_STARTED, IN_PROGRESS), completed, all
- Joins job_skus for service names
- Sorted by scheduled_date
- Used by dashboard preview and visits list

### 2.2 `useCustomerVisitDetail` (new)
- Fetches a single job by ID (customer-scoped)
- Loads: job, job_skus, job_checklist_items (highlights only), job_photos (with signed URLs), customer_issues
- Computes time-on-site from arrived_at/departed_at
- Returns structured receipt data

### 2.3 `useCustomerIssues` (new)
- Fetches customer's issues across all jobs
- Submit issue mutation: inserts into customer_issues
- Photo upload for damage concerns (to job-photos bucket under issues/ path)
- Query by status filter

### 2.4 `useFourWeekPreview` (new)
- Builds the 4-week preview model from:
  - Active routine items + cadence rules (Module 07)
  - Service day assignment (Module 06)
  - Actual jobs already created (Module 09)
- Returns array of 4 week objects, each containing visit cards
- Each visit card: type (routine/seasonal/add-on), service summary, status, job_id (if exists)
- Client-side computation (no new DB table needed for MVP)

---

## Phase 3: Customer Dashboard (complete rewrite)
File: `src/pages/customer/Dashboard.tsx`

### 3.1 Next Visit Card (top)
- Shows next planned or active visit
- Status states: Planned / En route / In progress / Completed
- Service summary (human-readable SKU names)
- CTA changes by state:
  - Planned: "View plan" (scrolls to timeline)
  - In progress: "View details"
  - Completed: "View receipt" (navigates to /customer/visits/:jobId)
- En route ETA band (text-only): "Estimated arrival: 12-20 min" (displays when job has started_at but not arrived_at; stubbed for now since tracking is optional)

### 3.2 Truth Banners
- Service Day not confirmed: "Confirm your Service Day to activate your plan." with deep link to /customer/service-day
- Routine not effective: "Your routine updates take effect next cycle."
- Zone paused: calm message with support link
- Existing banners (service day offer, routine nudge) preserved

### 3.3 Four-Week Preview Timeline
- Week 1-4 containers (labeled "This Week", "Next Week", "Week 3", "Week 4")
- Each week: primary visit card shown, "+N more" indicator for extras
- Tap week expands to show all visit cards
- Each visit card shows:
  - Badge: Routine / Seasonal / Add-on
  - Service summary
  - Status: Planned / Route assignment pending / Completed / Issue
- Completed cards link to receipt
- "Adjust your routine" deep link to /customer/routine with "effective next cycle" language

### 3.4 Seasonal Plan Card
- Preserved from existing dashboard (SeasonalPlanCard component)

---

## Phase 4: Visit History List
File: `src/pages/customer/History.tsx` (replace placeholder)

Route: `/customer/visits` (new) AND keep `/customer/history` as alias

- Paginated list of completed jobs
- Each card: date, Routine/Seasonal badge, status pill, thumbnail (best "after" photo if available)
- Tap navigates to `/customer/visits/:jobId`
- Empty state: "Your visit receipts will appear here after your first handled visit."
- Status pills: Completed / Issue under review / Resolved

---

## Phase 5: Visit Receipt (Handled Receipt)
File: `src/pages/customer/VisitDetail.tsx` (new)

Route: `/customer/visits/:jobId`

The core retention moment. Sections in spec order:

### 5.1 Header
- Status pill: Completed / Issue under review / Resolved
- Visit date
- Human-readable service summary
- Property label

### 5.2 Presence Proof
- Arrived at / Left at (formatted time)
- Time on site (computed: departed_at - arrived_at)
- If missing due to override: "Verified by support."

### 5.3 Photo Proof Gallery
- Required photos first (grouped by slot labels)
- Optional photos below
- Full-screen viewer with labels (Sheet/dialog with zoom)
- If no photos yet: "Finalizing your receipt..." with refresh

### 5.4 Work Summary
- Provider summary line (if present)
- Checklist highlights: show completed items, flag "Not completed" with reason label
- Not every item shown by default -- only key items and exceptions

### 5.5 Issue/Problem CTA
- If no issue: "Report a problem" button
- If issue exists: show status + submitted date + resolution note when resolved

---

## Phase 6: Customer Issue Reporting Flow
File: `src/components/customer/ReportIssueSheet.tsx` (new)

Entry: receipt page "Report a problem" button

### 6.1 Step 1: Choose Reason
- Missed something
- Damage concern
- Not satisfied
- Other

### 6.2 Step 2: Details
- Short note (required, max 500 chars)
- Photo upload:
  - Required for "Damage concern"
  - Strongly recommended otherwise
- Image compression (reuse compressImage from useJobActions)

### 6.3 Step 3: Submit + Confirmation
- "Thanks -- support will review and follow up."
- Expectation line (configurable)
- After submit, receipt shows issue status inline

### 6.4 Rate Limits
- One issue per visit (UNIQUE constraint enforces)
- Old visits (>14 days): "This visit was X days ago" disclaimer

---

## Phase 7: Optional Customer Issues Center
File: `src/pages/customer/Issues.tsx` (new, optional MVP)

Route: `/customer/issues`

- List of all customer issues with status filters
- Each card: visit date, reason, status, created date
- Tap opens receipt for that visit

---

## Phase 8: Routing and Navigation Updates

### 8.1 New Routes in App.tsx

Customer routes:
- `/customer/visits` -> CustomerVisits (history list)
- `/customer/visits/:jobId` -> CustomerVisitDetail (receipt)
- `/customer/issues` -> CustomerIssues (optional)

### 8.2 Navigation Updates

- Rename "Service History" to "Visits" in sidebar nav
- Update `/customer/history` path to `/customer/visits` in sidebar
- Keep `/customer/history` route as redirect/alias to `/customer/visits`
- Bottom tab "History" stays but points to `/customer/visits`

### 8.3 StatusBadge Updates

Add customer-facing status entries:
- `submitted` -- primary style
- `under_review` -- warning style
- `resolved` -- success style
- `planned` -- secondary style (for preview timeline)

---

## Technical Details

### New Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/YYYYMMDD_module10.sql` | customer_issues table, RLS, storage policies, admin RPC |
| `src/hooks/useCustomerJobs.ts` | Customer job list queries |
| `src/hooks/useCustomerVisitDetail.ts` | Single visit receipt data with signed photo URLs |
| `src/hooks/useCustomerIssues.ts` | Customer issue queries and submit mutation |
| `src/hooks/useFourWeekPreview.ts` | 4-week preview computation from routines + jobs |
| `src/pages/customer/Dashboard.tsx` | Complete rewrite with next visit + timeline |
| `src/pages/customer/History.tsx` | Replace placeholder with visits list |
| `src/pages/customer/VisitDetail.tsx` | Handled Receipt / proof hub |
| `src/pages/customer/Issues.tsx` | Optional issues center |
| `src/components/customer/ReportIssueSheet.tsx` | Structured issue intake flow |
| `src/components/customer/VisitCard.tsx` | Reusable visit card for timeline + history |
| `src/components/customer/PhotoGallery.tsx` | Photo proof gallery with full-screen viewer |
| `src/components/customer/NextVisitCard.tsx` | Dashboard top card for next visit |
| `src/components/customer/WeekTimeline.tsx` | Collapsible week container for 4-week preview |
| `docs/modules/10-customer-dashboard-and-proof.md` | Spec file |

### Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Add 3 new customer routes (visits, visits/:jobId, issues) |
| `src/components/AppSidebar.tsx` | Rename "Service History" to "Visits", update path |
| `src/components/BottomTabBar.tsx` | Update History path to /customer/visits |
| `src/components/StatusBadge.tsx` | Add submitted, under_review, resolved, planned status styles |

### Implementation Order

1. Copy spec file to docs/modules/
2. Database migration (customer_issues table + RLS + storage policies + admin RPC)
3. React hooks (useCustomerJobs, useCustomerVisitDetail, useCustomerIssues, useFourWeekPreview)
4. Reusable components (VisitCard, NextVisitCard, WeekTimeline, PhotoGallery, ReportIssueSheet)
5. Customer Dashboard rewrite (next visit card + truth banners + 4-week timeline)
6. Visit History page (replace placeholder)
7. Visit Receipt page (Handled Receipt with proof)
8. Customer Issues center (optional)
9. App.tsx routing + sidebar + bottom tab + StatusBadge updates

### Deferred

- ETA band with real GPS tracking data (Module 09 optional; will show static "en route" state when job is IN_PROGRESS with started_at but no arrived_at)
- Push notifications and deep linking (notification infrastructure not yet built)
- `customer_visit_preview` materialized view (spec says optional for performance; client-side computation is sufficient for MVP)
- Multi-property switcher (spec says future)
- Admin customer/property support views (`/admin/customers/:id`, `/admin/properties/:id`) -- can be added later; admin already has job detail access

