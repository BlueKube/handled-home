
# Sprint 8: Exceptions, Reschedules, and Ops Control v1 — Implementation Plan

This is Lovable's reply after committing to the main branch. Claude Code to review, but not code anything...

---

## Existing State (What We Have)

- **visits** table: `schedule_state` enum (`planning|scheduled|dispatched|in_progress|complete|exception_pending|canceled|rescheduled`), `scheduling_profile`, `eta_range_start/end`, `route_order`, `service_week_start/end`, `due_status`, `piggybacked_onto_visit_id`
- **visit_tasks** table: task-level status, SKU refs, duration estimates
- **provider_work_profiles** table: working hours, home lat/lng, equipment kits, blocked windows
- **provider_blocked_windows** table: recurring + one-off blocked windows
- **route_sequence_runs** table: nightly run audit trail with feasibility status
- **assignment_config** table: tuning dials infrastructure
- **support_tickets** / **customer_issues** tables: existing support pipeline
- **notifications** / **notification_events** tables: full event bus + delivery infrastructure
- **admin_audit_log** / **decision_traces** tables: audit + explainability
- **customer_credits** table: credit issuance + application
- **billing_exceptions** table: existing billing-level exceptions (NOT scheduling exceptions)
- **SchedulingExceptions.tsx** page: Sprint 7 admin page (unbooked, infeasible, overdue queries — read-only)
- **job_events** / **job_issues** tables: existing event/issue logging

## What's Missing (Needs Building)

1. **`ops_exceptions` table** — unified exception queue with severity, SLA, escalation, type, status, ownership
2. **`ops_exception_actions` table** — audit trail for every repair action taken
3. **`ops_exception_attachments` table** — photos/notes evidence per exception
4. **`customer_reschedule_holds` table** — soft-hold on next-best slot for access failure flow
5. **Config dials** for freeze override policy, hold TTL, notification throttling, show-up credit
6. **`generate-exceptions` logic** — nightly predictive exception creation from route-sequence results
7. **`repair-visit` edge function** — feasibility-checked repair actions with undo support
8. **Ops Console UI** — exception queue, detail view, guided repair panel, bulk actions
9. **Customer reschedule flow** — self-serve inside-freeze reschedule from feasible options
10. **Provider issue reporting flow** — can't access, skip, safety, running late
11. **Freeze override policy enforcement** — break-freeze guardrails + frequency limits
12. **Notification templates** — promise-changed, at-risk, access-failed customer comms

---

## Phased Implementation

### Phase 1: Schema & Config Foundation

**Migration:**

1. **Create Postgres enums:**
   - `ops_exception_type` — `window_at_risk|service_week_at_risk|provider_overload|coverage_break|provider_unavailable|access_failure|customer_reschedule|weather_safety|quality_block`
   - `ops_exception_severity` — `urgent|soon|watch`
   - `ops_exception_status` — `open|acknowledged|in_progress|resolved|snoozed|escalated`

2. **Create `ops_exceptions` table:**
   - `id` (uuid PK), `exception_type` (ops_exception_type NOT NULL)
   - `severity` (ops_exception_severity NOT NULL)
   - `sla_target_at` (timestamptz) — when ops should resolve by
   - `escalated_at` (timestamptz, nullable) — when auto-escalated
   - `status` (ops_exception_status NOT NULL DEFAULT 'open')
   - `visit_id` (FK visits, nullable), `provider_org_id` (FK provider_orgs, nullable), `customer_id` (uuid REFERENCES auth.users, nullable)
   - `scheduled_date` (date, nullable), `zone_id` (FK zones, nullable)
   - `reason_summary` (text) — "Why" one-liner
   - `reason_details` (jsonb) — structured diagnostic data
   - `assigned_to_user_id` (uuid REFERENCES auth.users, nullable) — ops owner
   - `resolved_at` (timestamptz, nullable), `resolved_by_user_id` (uuid REFERENCES auth.users, nullable)
   - `resolution_type` (text, nullable — `reorder|move_day|swap_provider|convert_profile|cancel_refund|auto_resolved|snoozed`)
   - `resolution_note` (text, nullable)
   - `source` (text — `nightly_planning|provider_report|customer_request|system_detection`)
   - `linked_exception_id` (uuid, nullable — for related exceptions)
   - `idempotency_key` (text, nullable, UNIQUE) — explicit idempotency (pattern matches `cron_run_log`)
   - `created_at`, `updated_at`
   - **UNIQUE constraint:** `(visit_id, exception_type, scheduled_date)` WHERE `status NOT IN ('resolved')` — partial unique index prevents duplicate open exceptions
   - RLS: admin full access, service_role full access

3. **Create `ops_exception_actions` table (audit trail):**
   - `id`, `exception_id` (FK), `action_type` (text), `actor_user_id` (uuid REFERENCES auth.users), `actor_role` (text)
   - `before_state` (jsonb) — **shape: `{visit_id, schedule_state, scheduled_date, provider_org_id, route_order, eta_range_start, eta_range_end, time_window_start, time_window_end}`** — full snapshot of affected visit(s) at action time. Kept permanently for audit.
   - `after_state` (jsonb) — same shape, post-action
   - `reason_code` (text), `reason_note` (text, nullable)
   - `is_freeze_override` (bool, default false)
   - `is_undone` (bool, default false), `undone_at` (timestamptz, nullable), `undone_by_user_id` (uuid REFERENCES auth.users, nullable)
   - `undo_expires_at` (timestamptz, nullable) — 10-minute undo window. **Undo rules:** (a) `before_state` kept forever for audit; (b) undo is one-shot (no undo-of-undo); (c) if a subsequent action exists on the same exception, prior action becomes non-undoable
   - `customer_notified` (bool, default false), `provider_notified` (bool, default false)
   - `impact_summary` (jsonb — old_promise, new_promise, added_drive_minutes, added_overtime_minutes)
   - `created_at`
   - RLS: admin read, service_role full access

4. **Create `ops_exception_attachments` table:**
   - `id`, `exception_id` (FK), `attachment_type` (text — `photo|note`)
   - `storage_path` (text, nullable), `note_text` (text, nullable)
   - `uploaded_by_user_id` (uuid REFERENCES auth.users), `uploaded_by_role` (text)
   - `created_at`
   - RLS: admin full access, provider insert own

5. **Create `customer_reschedule_holds` table:**
   - `id`, `visit_id` (FK), `customer_id` (uuid REFERENCES auth.users)
   - `held_date` (date), `held_window_start` (time, nullable), `held_window_end` (time, nullable)
   - `hold_type` (text — `auto_access_failure|customer_choice`)
   - `status` (text — `held|confirmed|released|expired`)
   - `expires_at` (timestamptz)
   - `created_at`, `updated_at`
   - RLS: customer read own, admin full access

6. **Seed assignment_config with Sprint 8 dials (~12 new):**
   - Freeze: `max_break_freeze_per_customer_30d` (1), `freeze_override_warning_threshold` (1)
   - Hold: `hold_ttl_hours` (12)
   - Compensation: `access_failure_show_up_credit_cents` (500)
   - Notification throttle: `max_exception_notifications_per_week` (3)
   - SLA: `urgent_sla_hours` (8), `soon_sla_hours` (48), `watch_sla_hours` (120)
   - Escalation: `auto_escalate_within_hours` (48)
   - Repair scoring: `repair_drive_weight` (1.0), `repair_overtime_weight` (2.0), `repair_disruption_weight` (1.5), `repair_customer_disruption_weight` (3.0)

7. **Seed notification_templates for Sprint 8** (~6 new):
   - `CUSTOMER_PROMISE_CHANGED`, `CUSTOMER_VISIT_AT_RISK`, `CUSTOMER_ACCESS_FAILED_HOLD`
   - `PROVIDER_VISIT_REASSIGNED`, `ADMIN_EXCEPTION_ESCALATED`, `ADMIN_FREEZE_OVERRIDE`

8. **Indexes:** `ops_exceptions(status, severity)`, `ops_exceptions(visit_id)`, `ops_exceptions(provider_org_id, scheduled_date)`, `customer_reschedule_holds(visit_id, status)`

### Phase 2: Exception Generation Engine

**Enhance `route-sequence` edge function + new `generate-exceptions` logic:**

1. **After nightly sequencing**, for each provider/day:
   - **Window-at-risk:** If `planned_arrival_time` > `time_window_end` for any windowed visit → create exception (check against the customer's hard window, NOT the display `eta_range_end`)
   - **Service-week-at-risk:** If no visit scheduled before `service_week_end` for any `service_week` profile visit → create exception
   - **Provider overload:** If estimated finish time > working hours end → create exception
   - **Coverage break:** If a visit has no assigned `provider_org_id` → create exception

2. **Severity auto-assignment:**
   - 🔴 Urgent: affected visit within 48 hours
   - 🟠 Soon: affected visit within 3-5 days
   - 🟡 Watch: beyond 5 days

3. **SLA target computation:** severity → `sla_target_at` from config dials

4. **Idempotency:** use `(visit_id, exception_type, scheduled_date)` as natural key — don't create duplicates for same issue

5. **Auto-escalation:** background check — if unresolved exception and visit now within 48h, bump to urgent

### Phase 3: Reactive Exception Flows (Provider + Customer)

**Provider issue reporting:**

1. **`useProviderIssueReport` hook** — report: `cant_access` (with reason code: gate_locked, customer_not_home, wrong_code), `customer_skip`, `safety_weather`, `running_late`
2. **Provider UI:** "Report Issue" button on active visit card → reason picker → optional note + photo → creates `ops_exception` + sets visit `schedule_state` to `exception_pending`
3. **Access failure flow:** auto-creates exception + triggers customer hold flow (Phase 5)
4. **Running late flow:** creates `window_at_risk` exception if new ETA > `time_window_end`, updates visit's `eta_range_start/end`, emits `CUSTOMER_VISIT_AT_RISK` notification to affected customer

**Customer reschedule request:**

4. **`useCustomerReschedule` hook** — calls `offer-appointment-windows` for feasible alternatives, creates reschedule exception if no options
5. **Customer UI:** "Reschedule" button on upcoming visit → shows 3-6 feasible options (filtered by scheduling_profile) → confirm → updates visit → notifies ops if inside freeze
   - **Freeze clarification:** Customer-initiated reschedules inside freeze do NOT count toward `max_break_freeze_per_customer_30d` (customer chose it; only ops-initiated overrides count)

**Provider unavailable:**

6. **`useProviderUnavailable` hook** — mark day unavailable → all affected visits get `provider_unavailable` exceptions → trigger repair suggestions

### Phase 4: Ops Console — Exception Queue + Detail + Actions

**New pages/components:**

1. **`/admin/ops/exceptions` page** — Ops Exception Queue:
   - Filterable by severity, type, status, zone, provider, date range
   - Sortable (default: severity desc, then SLA urgency)
   - Bulk actions: acknowledge, assign owner, snooze until next nightly
   - Count badges per severity tier
   - Auto-refresh on interval

2. **Exception Detail View** (sheet/drawer):
   - Current plan snapshot: route order, ETA, remaining capacity, provider schedule
   - Constraints summary: window, due-by, provider hours, blocked windows
   - Repair suggestions (ranked by RepairScore):
     - Impact preview: old promise → new promise, customer notify?, provider minutes
   - Evidence/attachments section (photos + notes)
   - Action history timeline
   - "Create Support Ticket" escalation action

3. **Repair Actions (v1):**
   - **Reorder within provider day** — calls route-sequence for single provider/day
   - **Move to another day** — with freeze override check + Break Freeze dialog if inside freeze
   - **Swap provider** — feasibility check (capacity, equipment, zone coverage)
   - **Cancel + credit** — cancel visit, optionally issue credit
   - All actions: confirmation dialog with impact preview, reason code + optional note required
   - 10-minute undo window on all actions

4. **Break Freeze dialog:**
   - Reason code selector (provider_unavailable, safety_weather, access_failure, window_at_risk)
   - Customer notification preview
   - Frequency check: "This customer has had N freeze overrides in the last 30 days" warning
   - Audit trail entry

5. **Hooks:** `useOpsExceptions`, `useOpsExceptionDetail`, `useOpsExceptionActions`, `useRepairSuggestions`
6. **RepairScore computation:** runs server-side in a `suggest-repairs` edge function (needs provider schedules, drive time, capacity data — not feasible client-side)

### Phase 5: Customer Access Failure Flow + Reschedule UX

1. **Auto-hold on access failure:**
   - When provider reports access failure → system selects next-best feasible slot
   - Creates `customer_reschedule_holds` entry with `hold_ttl_hours` expiry
   - Emits `CUSTOMER_ACCESS_FAILED_HOLD` notification

2. **Customer confirmation UI:**
   - Calm message: "We couldn't access your home. We reserved: [option]. Confirm or choose another."
   - Actions: **Confirm** (one tap), **Choose another** (shows 3-6 feasible options), **Skip this cycle** (if allowed)
   - `useCustomerHoldConfirmation` hook

3. **Hold expiry:**
   - Piggyback on `run-scheduled-jobs` edge function (already has pg_cron every 2 min) — add a `check_expired_holds` sub-task
   - Expired holds → set status = `expired`, release slot, keep exception as "Customer confirmation needed"

### Phase 6: Operational Analytics + Wiring

1. **Exception metrics queries** (admin views):
   - Window miss rate by category/zone/provider
   - Access failure rate by access mode
   - Break-freeze frequency (30-day rolling)
   - Reschedule frequency
   - SLA compliance (time-to-resolve)
   - Top reason codes
   - Repair outcome distribution
   - Customer impact rate

2. **Wire into existing systems:**
   - Route-sequence nightly → generate predictive exceptions
   - Provider availability blocks → generate `provider_unavailable` exceptions for affected visits
   - Coverage-break detection also via provider deactivation flow (not just nightly planning)
   - Add exception count badge to AdminShell sidebar (lightweight count query, 30s `refetchInterval`)
   - Wire `ops_exception_actions` to `admin_audit_log` via trigger or RPC
   - **Retire/rewire Sprint 7 `SchedulingExceptions.tsx`** — replace raw visit queries with `ops_exceptions` queries to avoid two conflicting exception views

3. **Notification throttling:**
   - Apply `max_exception_notifications_per_week` cap per customer
   - Max 1 notification per promise change

4. **Provider compensation:**
   - On customer-caused access failure resolution → auto-create show-up credit for provider (configurable amount)

---

## Technical Details

### Repair Strategy Order (deterministic)
```text
1) Local repair (reorder same provider/day) — cheapest
2) Same provider, different day (outside freeze only, unless Break Freeze)
3) Swap provider within zone (same day)
4) Swap provider within zone (different day)
5) Escalate (cancel/credit/manual)
```

### RepairScore
```text
RepairScore = +PromiseKeptBonus
            − (AddedDriveMin × w_drive)
            − (AddedOvertimeMin × w_ot)
            − (ProviderDisruption × w_disrupt)
            − (CustomerDisruption × w_cust)
```

### Severity → SLA Mapping
```text
🔴 Urgent: within 48h → SLA = same day (8h)
🟠 Soon:   3-5 days  → SLA = 24-48h
🟡 Watch:  5+ days   → SLA = 5 days
```

### Break Freeze Guardrails
```text
MaxBreakFreezePerCustomerPer30Days = 1 (configurable)
Required: reason code + audit + customer notification
```

---

## File Summary

| Phase | New Files | Modified Files |
|-------|-----------|----------------|
| 1 | — | migration SQL |
| 2 | — | `route-sequence/index.ts` |
| 3 | `src/hooks/useProviderIssueReport.ts`, `src/hooks/useCustomerReschedule.ts`, `src/components/provider/IssueReportSheet.tsx`, `src/components/customer/RescheduleSheet.tsx` | Provider Jobs page, Customer UpcomingVisits |
| 4 | `src/hooks/useOpsExceptions.ts`, `src/pages/admin/OpsExceptions.tsx`, `src/components/admin/ExceptionDetailSheet.tsx`, `src/components/admin/RepairActionDialog.tsx`, `src/components/admin/BreakFreezeDialog.tsx` | `AdminShell.tsx`, `App.tsx` |
| 5 | `src/hooks/useCustomerHoldConfirmation.ts`, `src/components/customer/AccessFailureHold.tsx` | Customer dashboard/visits |
| 6 | — | `route-sequence/index.ts`, `AdminShell.tsx`, existing exception views |

First action: Begin Phase 1 migration.
