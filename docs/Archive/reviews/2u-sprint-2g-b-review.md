# Sprint 2G-B Review — Cockpit + Dispatcher Queues

**Status:** FAIL — 2 HIGH findings, 2 MEDIUM, 2 LOW

## Prior-review remediation (A-F1, A-F2)

| Finding | Fix | Verified |
|---------|-----|----------|
| A-F1 | Dead `groupHasActive` variable removed from AdminSidebar | Yes — no longer present in `AdminShell.tsx` |
| A-F2 | "Customers" nav label renamed to "Customer Billing" | Yes — line 68 of `AdminShell.tsx` |

## 2G-B1 — Ops Cockpit upgrade

`src/pages/admin/OpsCockpit.tsx` (164 lines):
- 5 stacked sections: Today Execution, Capacity Pressure, Quality (7d), Revenue & Billing, Growth (7d)
- Uses existing `useOpsMetrics` hook — no new data plumbing
- Sparklines on issue rate, credits issued, past due count
- Clickable tiles navigate to relevant admin pages
- Loading skeleton with 16 cards

**Deviation from description:** Lovable described a "4-column cockpit" layout; what was built is a vertically-stacked sectioned dashboard. Content coverage is equivalent. No "Open Dispatcher →" button — instead, the sidebar has "Dispatcher Queues" as a Cockpit group nav item, which achieves the same goal.

**Verdict:** Layout acceptable. Content correct.

## 2G-B2 — Dispatcher Queues + data hook

`src/hooks/useDispatcherQueues.ts` (164 lines):
- 6 parallel Supabase queries: at-risk, missing proof, unassigned, customer issues, provider incidents, zones
- Missing proof uses a second query for `job_photos` to filter jobs without photos — correct approach
- Coverage gaps: zones with capacity but 0 jobs today
- 30s auto-refresh

`src/pages/admin/DispatcherQueues.tsx` (280 lines):
- 6-tab interface with count badges
- `JobRow` with hover "Action" button (group-hover opacity transition)
- `IssueRow` with severity-based badge coloring
- `CoverageRow` with zone info
- `EmptyQueue` placeholder per tab
- Manual refresh button with spinner

**Architecture is solid.** However, the status values used in the queries are wrong — see B-F1.

## 2G-B3 — Dispatcher Actions Dialog

`src/components/admin/DispatcherActionsDialog.tsx` (134 lines):
- 3 action types: Add Note, Follow Up, Create Ticket
- "Add Note" → inserts to `job_events`
- "Follow Up" → inserts event + updates job status
- "Create Ticket" → fetches `customer_id` from job, then creates `support_tickets` row
- Invalidates dispatcher-queues query on success
- Uses `ticket_type: "general"`, `severity: "high"` — both valid enum values

**`support_tickets` insert is correct** — Lovable properly fetches the job's `customer_id` (required FK) before inserting. However, the follow-up action writes an invalid job status — see B-F2.

## 2G-B4 — Universal Search (Cmd+K)

`src/hooks/useAdminSearch.ts` (114 lines):
- Searches: profiles (name/email/phone), provider_orgs (business name), jobs (UUID prefix), subscriptions (UUID prefix)
- UUID detection via regex, parallel `Promise.all`
- Minimum 2-character query, 10s stale time

`src/components/admin/AdminSearchDialog.tsx` (113 lines):
- `CommandDialog` from shadcn (cmdk)
- `Cmd+K` / `Ctrl+K` keyboard shortcut
- Results grouped by type with icons
- Trigger button in command bar with `⌘K` hint

Wired into `AdminShell.tsx` — the `AdminCommandBar` now renders `<AdminSearchDialog />` instead of a static placeholder.

**Verdict:** Clean implementation. One input sanitization concern — see B-F3.

## Routing

`App.tsx` line 120: `import AdminDispatcherQueues` added.
Line 240: `<Route path="/admin/ops/dispatch" element={<AdminDispatcherQueues />} />` added.
AdminShell sidebar Cockpit group already had the nav link from 2G-A.

**Verdict:** Correct.

---

## Findings

| ID | Severity | Issue |
|----|----------|-------|
| B-F1 | **HIGH** | **Dispatcher queues query wrong job status values.** The `jobs` table has a CHECK constraint: `status IN ('NOT_STARTED','IN_PROGRESS','ISSUE_REPORTED','PARTIAL_COMPLETE','COMPLETED','CANCELED')`. The `useDispatcherQueues` hook queries for `["issue", "ISSUE", "in_progress", "IN_PROGRESS", "scheduled", "SCHEDULED"]` (At Risk), `["pending", "PENDING", "scheduled", "SCHEDULED"]` (Unassigned), and `["completed", "COMPLETED"]` (Missing Proof). Only `"IN_PROGRESS"` and `"COMPLETED"` match real values. The At Risk queue misses `ISSUE_REPORTED` jobs entirely. The Unassigned queue will **always be empty** (should filter `NOT_STARTED` where `provider_org_id IS NULL`). |
| B-F2 | **HIGH** | **"Follow Up" action writes invalid job status.** `DispatcherActionsDialog` line 41 sets `status: "needs_follow_up" as any` — this value violates the jobs CHECK constraint and will throw a Postgres error at runtime. The `as any` cast hides the TypeScript error. |
| B-F3 | **MEDIUM** | **Search filter injection risk.** `useAdminSearch` line 73 interpolates unsanitized user input into PostgREST `.or()` filter: `` .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`) ``. Characters like `,` or `.` in the query string can alter filter semantics. Should sanitize special characters or use separate `.ilike()` calls. |
| B-F4 | **MEDIUM** | **Non-standard event types in job_events.** The `event_type` column on `job_events` has no CHECK constraint (just `text NOT NULL`), so the inserts won't crash. But the values `"internal_note"`, `"needs_follow_up"`, `"ticket_created"` are semantically different from the established job lifecycle events (`JOB_STARTED`, `JOB_COMPLETED`, `ISSUE_REPORTED`, etc.). Consider a dedicated `dispatcher_notes` table or a discriminator column to avoid polluting the job event log. |
| B-F5 | **LOW** | **UUID regex too permissive.** `useAdminSearch` line 22: `/^[0-9a-f]{8}(-[0-9a-f]{4}){0,4}/i` matches any 8+ hex-char string, triggering unnecessary ID searches for common names or email prefixes that happen to be hex strings (e.g., "Abcdefab"). Minor perf issue only. |
| B-F6 | **LOW** | **Review file deletions.** Lovable deleted 11 historical review files from `docs/reviews/` and `docs/` during the "Fix 2G-A review findings" commit. While those files may have been considered stale, the review trail should be preserved. Files like `2t-round-2g-plan-review.md`, `2t-sprint-e02-review.md` through `e05` were removed. |

## Required fixes before PASS

1. **B-F1**: Rewrite `useDispatcherQueues` status filters to match actual DB values:
   - At Risk: `['IN_PROGRESS', 'ISSUE_REPORTED']`
   - Missing Proof: `['COMPLETED']` (already correct as uppercase)
   - Unassigned: `['NOT_STARTED']` with `provider_org_id IS NULL` (already has `.or("provider_org_id.is.null")` but combined with wrong status filter)
2. **B-F2**: Remove the "Follow Up" → job status update. Either (a) only add a job_event note, or (b) propose a migration to add `NEEDS_FOLLOW_UP` to the jobs status CHECK constraint.

## What passed well

- `AdminSearchDialog` uses shadcn's `CommandDialog` (cmdk) — keyboard-first, accessible
- Dispatcher queues auto-refresh at 30s with manual refresh button
- Missing proof detection correctly anti-joins `job_photos` by ID set
- Coverage gap logic is simple and correct (zones with capacity but 0 jobs today)
- Job row hover-reveal for action button is a clean UX pattern
- Support ticket creation correctly resolves `customer_id` from the job before inserting

## Open findings tracker (cumulative)

| ID | Severity | Status | Description |
|----|----------|--------|-------------|
| E05-F3 | LOW | OPEN | Tier modifier cosmetic for primary path |
| A-F1 | LOW | CLOSED | Dead variable `groupHasActive` — removed |
| A-F2 | LOW | CLOSED | Customers nav label — renamed to "Customer Billing" |
| A-F3 | INFO | CLOSED | Control Room subset — expected, future sprint |
| B-F1 | HIGH | **OPEN** | Dispatcher queues query wrong status values |
| B-F2 | HIGH | **OPEN** | "Follow Up" writes invalid job status |
| B-F3 | MEDIUM | OPEN | Search filter injection in `.or()` |
| B-F4 | MEDIUM | OPEN | Non-standard event types in job_events |
| B-F5 | LOW | OPEN | UUID regex too permissive |
| B-F6 | LOW | OPEN | Review file deletions |
