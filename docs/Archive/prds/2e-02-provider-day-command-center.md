# PRD — 2E-02 Provider Day Command Center (Today + Route + Status)

**Purpose:** Make the provider’s daily experience so efficient and low-friction that it becomes the “operating system” for their workday.

---

## 1) Goals
- Provider opens app and sees the entire day planned: stops, route order, map, time windows, tasks.
- Provider executes each job with clear status flow and proof checklist.
- Exceptions are explainable and low-stress.
- Increases utilization and predictability (retention driver).

## 2) Non-goals
- Live GPS streaming to customers (coarse state updates only)
- Advanced VRP routing beyond existing MVP
- Customer-provider chat

---

## 3) Core Screens

### 3.1 Today (Home)
- Summary: stops, expected work time, expected drive time, projected earnings today
- List/Map toggle
- “Start route” (locks route order unless exception)
- Alerts: reassigned jobs, weather changes, SLA warnings

### 3.2 Map View
- Pins for today’s jobs + numbered order
- Tap pin → job preview
- “Navigate” button (opens native maps)

### 3.3 Job Detail
- Status buttons: EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED
- Timestamp capture at ARRIVED/COMPLETED
- Optional coarse GPS timestamp at ARRIVED/DEPART (audit only)
- Checklist for SKU tasks
- Proof capture (photo prompts)
- “Report issue” button (admin-visible)

---

## 4) Customer-facing updates (uses Round 2C notifications)
Customer sees:
- “Provider on the way”
- “Service in progress”
- “Completed” + receipt ready

---

## 5) Data Model (high level)
- `provider_route_plan` (provider_org_id, date, ordered_job_ids, locked_at)
- `job_events` (job_id, event_type, created_at, metadata)
- jobs: status, arrived_at, started_at, completed_at, gps_arrived_at (optional), gps_departed_at (optional)

---

## 6) Acceptance Criteria
- Provider can run full day from Today screen without admin.
- Route stays stable once started.
- Status transitions create auditable job events.
- Customer receives coarse state changes and receipt.
