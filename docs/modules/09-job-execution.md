# 09-job-execution.md
> **Implementation Status:** ✅ Implemented in Round 1. Round 2B added auto-assign, no-show detection, photo quality validation, route optimization.

**Handled Home — Module 09 PRD (Provider Job Execution + Proof)**  
**Mobile:** iOS + Android (Capacitor) — **Provider**  
**Admin Console:** Mobile-optimized, operationally usable  
**Primary Provider Routes:**  
- `/provider/jobs`  
- `/provider/jobs/:jobId`  
- `/provider/jobs/:jobId/checklist`  
- `/provider/jobs/:jobId/photos`  
- `/provider/jobs/:jobId/complete`  
- `/provider/history`  

**Primary Admin Routes:**  
- `/admin/jobs`  
- `/admin/jobs/:jobId`  
- `/admin/providers/:providerOrgId/performance` (optional, lightweight)  

**Last updated:** 2026-02-22  

---

## 0) Why this module exists

Module 09 is where service is actually delivered. It must:
- prevent missed steps (checklists)  
- capture trustworthy proof (photos + timestamps + notes)  
- make completion unambiguous and auditable (“definition of done”)  
- keep providers moving quickly (low friction)  
- produce clean artifacts for customer trust and support resolution  
- optionally add premium transparency via **bounded** GPS presence + ETA (opt-in)  

This module is a retention engine: consistent execution + strong evidence = customer trust = renewal.

---

## 1) North Star outcomes (Definition of Done)

1) Providers complete jobs in a fast, guided flow with minimal typing.  
2) Every completed job has required proof attached (checklist + photos) or an explicit, audited exception.  
3) Completion is server-validated and atomic; “done” is enforced consistently.  
4) Exceptions are captured as structured issues (not chat).  
5) Customers receive a premium “Handled receipt” (photos + timestamps + brief summary).  
6) Support can resolve disputes from a single job record, quickly.

---

## 2) Scope

### 2.1 In scope
- Provider jobs list (today + upcoming) and history  
- Job detail (scope + access notes + proof requirements)  
- Guided checklist completion (required vs optional)  
- Photo capture + upload with offline/poor-signal resilience  
- Structured issue reporting (blocked access, scope mismatch, safety, etc.)  
- Completion submission via server-side validation (atomic)  
- Admin/support job search + read-only evidence view + minimal override tools  
- Customer “job completed” notification payload (MVP, controlled)  
- Optional premium transparency layer: **bounded, opt-in** “en route” ETA + arrived/left timestamps  

### 2.2 Out of scope (later modules)
- Provider scheduling/calendar negotiation  
- Provider earnings/payouts  
- Full dispute workflow automation/refunds  
- Always-on live tracking / map dot / appointment calendar  
- Deep analytics dashboards (beyond lightweight summaries)

---

## 3) Non-negotiable rules

1) Provider can only view/execute jobs assigned to their provider org.  
2) Provider cannot complete a job unless required proof is satisfied (or admin override with reason).  
3) Proof requirements come from **SKU requirements** (Module 04) or job template derived from SKU; Module 09 does not invent requirements.  
4) Jobs are created/assigned by upstream modules (Service Day + Routine → job generation). Module 09 executes assigned jobs only.  
5) Every completion, issue change, and admin override is audit-logged (append-only events).  
6) No chat threads. Issues are structured: type + severity + optional short note + evidence.  
7) GPS tracking is opt-in, bounded to **en route only**, coarse, and stops on arrival.

---

## 4) Mental model (language)

### Provider sees
- **Jobs** (one job = one service task at one property)  
- **Today** list (a route-like stop list; not appointments)  
- **Definition of done** (checklist + proof)  
- **Issue** (a structured reason why work can’t proceed normally)

### Customer experiences
- A “Handled receipt” for each visit (photos + arrived/left + short summary)  
- Optional ETA band only when provider starts heading to their stop (no promises)

---

## 5) Provider UX flows (premium, guided, fast)

### 5.1 Jobs list
Route: `/provider/jobs`  
Tabs:
- **Today**  
- **Upcoming**  

Job card (scannable):
- Stop label: “Stop 3” (or “Next”)  
- Property short label (nickname or truncated address)  
- Service summary (1–2 lines)  
- Status pill:
  - Not started / In progress / Issue / Completed  
- Optional indicator: “ETA enabled” (only if tracking enabled for that job)

Premium UX rules:
- One obvious next action per card  
- Minimal clutter; no calendar visuals  
- Clear “Resume” state when partially complete (photos pending, checklist incomplete)

---

### 5.2 Job detail
Route: `/provider/jobs/:jobId`  

Must show (in this order):
1) **What to do**
   - SKU list (or summary) with top scope bullets  
2) **Access & safety**
   - gate code, pets, parking, access instructions (snapshotted from property)  
3) **Proof required**
   - checklist count (required vs optional)  
   - photo slots/count required  
4) Primary CTAs:
   - “Start job” (creates started event)  
   - “Checklist”  
   - “Photos”  
   - “Complete” (disabled until requirements met)  
5) Secondary CTAs:
   - “Report an issue”  
   - “Start driving to this stop” (only when tracking feature enabled)

Guidance microcopy (calm):
- “Finish checklist and required photos to complete.”

---

### 5.3 Checklist flow (guided)
Route: `/provider/jobs/:jobId/checklist`  

Requirements:
- Checklist items derived from SKU definitions (Module 04) or job template created upstream  
- Each item shows:
  - label  
  - required indicator  
  - state: Pending / Done / Not done (with reason)

Provider actions:
- One-tap “Done”  
- If cannot complete a required item:
  - choose reason code (structured)  
  - optional short note  
  - system nudges toward “Report an issue” when reason indicates blocking

UX rules:
- Prevent accidental skipping of required items:
  - required items must end in Done or Not-done-with-reason  
- If skipping is allowed due to issue:
  - it must be explicit, auditable, and reflected in completion receipt (as “Blocked: …”)

---

### 5.4 Photo proof flow (resilient)
Route: `/provider/jobs/:jobId/photos`  

Must support:
- Required **photo slots** when specified (e.g., Before/After/Close-up)  
- Required minimum counts when slots aren’t specified  
- Optional “extra photos”  

Photo states per image:
- Pending upload  
- Uploaded  
- Failed (Retry)

Offline/poor signal:
- allow capture offline  
- queue upload automatically  
- show “Uploads pending” banner  
- completion is blocked until required photos are uploaded and server-confirmed (unless admin override)

Provider speed:
- “Take next required photo” guided mode (optional)  
- “Batch capture” supported (capture multiple quickly)

---

### 5.5 Completion flow (server validated, atomic)
Route: `/provider/jobs/:jobId/complete`  

Show:
- Checklist summary: “10/10 required complete”  
- Photo summary: “After photos: 2/2 uploaded”  
- Issue summary (if any)  
- Optional provider summary field:
  - one short text box, max 240 chars  
  - helper: “Optional: note anything unusual.”

Submit behavior:
- Completion must call a server-side action/RPC that validates:
  - required checklist satisfied (or explicitly waived by issue + policy)  
  - required photos uploaded  
- If invalid:
  - show exactly what’s missing with deep links:
    - “Add 1 After photo” → Photos  
    - “Finish 2 checklist items” → Checklist  
- If valid:
  - job becomes **COMPLETED** with timestamps  
  - job_events recorded  
  - customer receipt notification triggered (if enabled)

---

### 5.6 Issue reporting (structured, not chat)
Entry from job detail or checklist: “Report an issue”

Issue types (MVP set, admin-configurable later):
- Could not access property  
- Safety concern (animal/person)  
- Missing supplies/equipment  
- Excessive scope / damage discovered  
- Customer requested change (not approved)  
- Weather-related  
- Other (requires short note)

Severity:
- Low / Medium / High

Required capture:
- issue_type  
- severity  
- optional short description  
- at least one photo when relevant (recommended; required for certain issue types)

Issue outcomes:
- `ISSUE_REPORTED` (job paused awaiting ops)  
- `PARTIAL_COMPLETE` (some tasks done + proof; blocked remainder)  
- `CANNOT_COMPLETE` (blocked; requires evidence)

UX rules:
- Reporting an issue should feel safe and fast:
  - “You’re not stuck—log the issue and move on.”  
- No negotiation UI. No messaging threads.

---

## 6) Customer experience (receipt + trust)

> Customer UI polish can live in Module 10+, but Module 09 must produce the data payload.

### 6.1 “Handled receipt” (MVP payload)
On server-validated completion:
- deliver a customer notification payload including:
  - 2–4 best photos (prefer “After” and key detail; include “Before” when useful)  
  - arrived_at / left_at / time_on_site  
  - provider summary (optional)  
  - issue summary (if partial/blocked)

Copy is calm:
- “All set — we took care of it.”

No scheduling promises:
- never use appointment language  
- no precise countdowns  

### 6.2 Customer issue flag (structured, rate-limited)
If customer flags a concern (later UI):
- options: Missed something / Damage concern / Not satisfied / Other  
- requires short note; photo recommended  
- creates a support issue record (not provider chat)

---

## 7) Admin/support tools (minimal but critical)

### 7.1 Jobs search
Route: `/admin/jobs`  
Filters:
- customer/property  
- provider org  
- date range  
- status  
- SKU/service type (optional)  
- “missing proof” flag (optional)  

### 7.2 Job detail support view
Route: `/admin/jobs/:jobId`  
Show:
- assigned provider org  
- checklist state (with skipped reasons)  
- photo evidence gallery  
- arrived/left timestamps + source (auto/manual)  
- provider notes + issues  
- customer issue flags (if any)

Admin actions (require reason + audit log):
- override proof requirements and mark complete  
- mark job “needs redo” (support outcome; not a scheduling tool)  
- mark issue resolved with note  
- optional “reassign” hook (stub ok)

---

## 8) Data model (Supabase) + evidence spine

### 8.1 Core tables

#### `jobs`
- `id` uuid pk  
- `service_day_instance_id` uuid null  
- `routine_version_id` uuid null  
- `property_id` uuid not null  
- `customer_id` uuid not null  
- `zone_id` uuid not null  
- `provider_org_id` uuid not null  
- `status` text not null  
  (`NOT_STARTED` | `IN_PROGRESS` | `ISSUE_REPORTED` | `PARTIAL_COMPLETE` | `COMPLETED` | `CANCELED`)  
- `access_notes_snapshot` text null  
- `started_at` timestamptz null  
- `completed_at` timestamptz null  
- `arrived_at` timestamptz null  
- `departed_at` timestamptz null  
- `arrived_source` text null (`auto` | `manual`)  
- `departed_source` text null (`auto` | `manual`)  
- `provider_summary` text null  
- `created_at` timestamptz default now()  
- `updated_at` timestamptz default now()  

#### `job_skus`
- `id` uuid pk  
- `job_id` uuid fk -> jobs.id  
- `sku_id` uuid fk -> service_skus.id  
- `created_at` timestamptz default now()  
Unique: `(job_id, sku_id)`

#### `job_checklist_items`
- `id` uuid pk  
- `job_id` uuid fk -> jobs.id  
- `sku_id` uuid null  
- `label` text not null  
- `is_required` boolean not null default true  
- `status` text not null default 'PENDING'  
  (`PENDING` | `DONE` | `NOT_DONE_WITH_REASON`)  
- `reason_code` text null  
- `note` text null  
- `updated_at` timestamptz default now()

#### `job_photos`
- `id` uuid pk  
- `job_id` uuid fk -> jobs.id  
- `sku_id` uuid null  
- `slot_key` text null  
- `storage_path` text not null  
- `upload_status` text not null default 'PENDING'  
  (`PENDING` | `UPLOADED` | `FAILED`)  
- `captured_at` timestamptz null  
- `created_at` timestamptz default now()

#### `job_issues`
- `id` uuid pk  
- `job_id` uuid fk -> jobs.id  
- `issue_type` text not null  
- `severity` text not null (`LOW` | `MED` | `HIGH`)  
- `description` text null  
- `created_by_user_id` uuid not null  
- `created_by_role` text not null (`provider` | `customer` | `admin`)  
- `status` text not null default 'OPEN' (`OPEN` | `RESOLVED`)  
- `resolved_at` timestamptz null  
- `resolved_by_admin_user_id` uuid null  
- `resolution_note` text null  
- `created_at` timestamptz default now()  
- `updated_at` timestamptz default now()

#### `job_events` (append-only)
- `id` uuid pk  
- `job_id` uuid fk -> jobs.id  
- `actor_user_id` uuid not null  
- `actor_role` text not null (`provider` | `admin` | `customer` | `system`)  
- `event_type` text not null  
- `metadata` jsonb not null default '{}'  
- `created_at` timestamptz default now()  

Minimum event types:
- `JOB_CREATED`, `JOB_STARTED`, `CHECKLIST_ITEM_DONE`, `CHECKLIST_ITEM_NOT_DONE`,  
  `PHOTO_CAPTURED`, `PHOTO_UPLOADED`, `ISSUE_REPORTED`, `JOB_COMPLETED`, `ADMIN_OVERRIDE_COMPLETION`,  
  `EN_ROUTE_STARTED`, `ARRIVED_AUTO`, `ARRIVED_MANUAL`, `DEPARTED_AUTO`, `DEPARTED_MANUAL`

---

## 9) Proof requirements derivation (from SKUs)

- Use Module 04 SKU requirements as the source of truth.  
- Snapshot requirements at job creation to avoid mid-job definition changes.

Snapshot fields per SKU (recommended):
- required photo labels/count  
- checklist labels + required flags  
- key scope bullets (top 3–5)

---

## 10) Security + RLS + storage policies

- Providers can read/write only jobs where `provider_org_id` matches their org.  
- Providers cannot change assignment fields (provider_org_id, property_id, customer_id).  
- Customers can read only their job records and customer-safe evidence (later UI).  
- Admins can access all.  
- Photos use Supabase Storage with org/customer-scoped access and signed URLs for customer views.

---

## 11) Server-side validation + atomic completion

### 11.1 Required RPC: `complete_job(job_id, payload)`
Validates:
- required checklist satisfied  
- required photos UPLOADED  
- issue policy applied (partial/cannot complete)  

Writes atomically:
- job status + timestamps  
- `JOB_COMPLETED` event  
- enqueue customer receipt notification

### 11.2 Admin override: `admin_override_complete_job(job_id, reason, note)`
- requires admin role  
- records what was missing (does not erase)  
- writes override event + reason  

---

## 12) Reliability requirements (mobile + offline)

- Offline checklist and photo capture supported.  
- Upload queue with retry states.  
- Completion blocked until server confirms required uploads (unless admin override).  
- Image compression for performance; lazy-load galleries.

---

## 13) Premium transparency layer: bounded GPS presence + ETA (optional)

### 13.1 Principles
- Not Uber: no always-on tracking  
- Opt-in and bounded to “en route”  
- Coarse ETA band (e.g., “12–20 min”)  
- Stop tracking on arrival or timeout

### 13.2 Policy controls
`provider_org_tracking_policy`:
- `tracking_enabled_default` bool  
- `allow_job_opt_in` bool  
- `allow_job_opt_out` bool  
- `min_update_interval_seconds` (default 120)  
- `geofence_radius_meters` (default 80)  
- `max_en_route_minutes` (default 60)

Job field:
- `jobs.tracking_opt_in` bool

### 13.3 Tracking state table (privacy-first)
`job_tracking_state`:
- `job_id`, `en_route_started_at`, ETA low/high + updated_at, arrived/departed timestamps + source, end reason  
- no breadcrumb trails by default

---

## 14) AI + automations (safe, practical)

1) **Next best action** (deterministic): highlight what’s missing (photos/checklist).  
2) **Photo quality nudge** (optional): blurry/low-light prompt; never blocks.  
3) **Templated completion note suggestion** (optional): one-tap summary from variables.  
4) **Issue triage tagging** (admin advisory): safety/high severity surfaced.  
5) **Evidence completeness label** (informational): “Complete” vs “Complete + extra proof”.

---

## 15) Acceptance tests

1) Provider sees only org jobs.  
2) Provider cannot complete job without required proof.  
3) Offline photos show pending upload; completion blocked until uploaded.  
4) Issue reporting moves job to ISSUE_REPORTED and stores structured reason.  
5) Admin override requires reason and is audit-logged.  
6) Customer receipt sent only after server-validated completion.  
7) Tracking (if enabled) runs only during en route; stops on arrival/timeout.

---

## 16) Deliverables

- DB migrations + RLS + storage policies  
- Provider routes: list/detail/checklist/photos/complete/history  
- Issue reporting flow  
- Admin routes: jobs search + job detail + override  
- RPCs: start job, report issue, photo metadata, complete job, admin override  
- Customer receipt notification hook (MVP payload)  
- Optional tracking policy + bounded ETA + arrived/left capture  
