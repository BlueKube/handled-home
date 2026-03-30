# Handled Home — Admin Controls Round (Spec)
**Status context:** Round 2E is complete (all documents in `docs/prds/`). This round defines the **Admin Controls / Ops Cockpit** that lets the company run mostly automated while giving internal teams the ability to monitor, explain, and safely intervene.

This spec is written to be given to **Lovable** to implement in the existing React + Tailwind + Supabase project.

---

## 1. Intent and desired outcomes

### 1.1 Intent
Build the “control room” for Handled Home: a **dense, desktop-friendly, operational cockpit** and a set of role-scoped tools that allow internal staff to:
- Find and manage customers/providers quickly
- Prevent jobs from slipping (no job left undone)
- Understand *why* the system made decisions (glass-box machine)
- Make safe overrides and corrections
- Launch and grow new zones intentionally
- Train new ops staff with embedded SOP playbooks

### 1.2 Desired outcomes
- **Operational reliability:** dispatchers can keep service days flowing and resolve issues fast.
- **Trust + explainability:** operators see “why” behind assignments, holds, bonuses, and exceptions.
- **Profit control:** superuser can tune pricing/payout parameters (no negotiation) to maintain profitability.
- **Safety:** financial/algorithm changes are superuser-only, fully audited, and reversible.
- **Speed:** most admin work is doable on desktop with dense tables, bulk actions, and drilldowns.
- **Training:** SOPs exist inside the UI (not just in docs), role-filtered and action-linked.

---

## 2. Role model (simple)
**Important decision:** keep *all* internal users as `role = admin` at the app-auth layer. Subdivide permissions inside admin with an **admin sub-role**.

### 2.1 Admin sub-roles (inside admin)
- `superuser` — can change pricing, payout, incentives caps, and algorithm parameters. Can set global guardrails.
- `ops` — can configure operations (zones, SKUs, plans, provider status), resolve exceptions within guardrails.
- `dispatcher` — day-of execution: queues, reassignment, proof issues, escalation notes. **No pricing/payout edits.**
- `growth_manager` — builds new regions, manages incentives within superuser-set bounds, BYOC/founding partner pipeline.

### 2.2 Security principle
- UI hides/locks actions, but **Supabase RLS enforces** permissions.
- Any “change the machine” action requires **superuser**.

---

## 3. Admin information architecture (IA)
Your repo already has many admin routes (e.g., `/admin/ops`, `/admin/zones`, `/admin/skus`, `/admin/providers`, `/admin/billing`, `/admin/payouts`, `/admin/exceptions`, `/admin/support`, `/admin/growth`, `/admin/audit`, etc.). This round organizes them into a coherent admin experience and adds missing “control plane” surfaces.

### 3.1 Navigation groups (desktop sidebar)
- **Cockpit**
  - Ops Cockpit (home)
  - Today Queues (Dispatcher)
- **Execution**
  - Jobs
  - Service Days
  - Scheduling
  - Exceptions
- **People**
  - Customers (lookup + ledger)
  - Providers (org + individuals)
- **Markets**
  - Zones
  - Capacity
  - Availability/Coverage
- **Catalog**
  - SKUs (services)
  - Plans (subscription offerings)
  - Bundles
- **Money**
  - Billing
  - Payouts
  - Holds/Trust
- **Growth**
  - Incentives
  - BYOC / Founding Partner tools
  - Launch checklist
- **Support**
  - Tickets
  - Policies
  - Macros
- **Governance**
  - Audit log
  - Notification health
  - Feedback
  - Test toggles
- **Control Room** *(Superuser-only)*
  - Pricing & Margin
  - Payout & Holds rules
  - Incentive caps & rules
  - Algorithm & Assignment parameters
  - Policy guardrails
  - Change log / Rollback
- **Playbooks**
  - SOPs (role-filtered)

---

## 4. Desktop-first UX (while keeping mobile usable)
### 4.1 Why desktop matters
Admin work requires dense tables, rapid drilldowns, and multi-pane views. Mobile is “nice to have” for quick checks, but desktop is required for efficiency.

### 4.2 Layout rule
Implement a responsive **Admin Shell**:
- If user is `admin` and viewport ≥ `lg`:
  - Left sidebar navigation
  - Top command bar (search + global actions)
  - Content area supports split views (list + detail)
  - Dense table style by default
- Else:
  - Mobile layout with simplified nav

### 4.3 Density guidelines (tight + actionable)
- Tables: compact rows, sticky headers, inline status pills, hover actions
- Every row clickable to open detail drawer/pane
- Bulk actions when safe (e.g., close multiple tickets, approve multiple exceptions within caps)
- Saved views (filters) per role (Dispatcher default views)

### 4.4 Global command bar
- Universal search: customer email/phone, provider name, job id, subscription id
- Quick actions: “Create ticket”, “Find stuck jobs”, “Zone health”, “Open today queues”
- Keyboard shortcuts (dispatcher queues): J/K to move, Enter open, A assign, E escalate, N note

---

## 5. Ops Cockpit (the heart screen)
Route: `/admin/ops` (already exists) — elevate it to the daily hub.

### 5.1 Cockpit panels (desktop 4-column)
1) **Now (Reliability)**
   - Jobs at risk today
   - Overdue, missing proof
   - Unassigned / coverage gaps
   - Provider late / no-show alerts
2) **Money (Profit pulse)**
   - Estimated margin pulse (zone + category)
   - Credits/refunds issued (week)
   - Holds count + aging
   - Incentives spend (week)
3) **Quality (Service health)**
   - Redo rate & repeats
   - Average job duration vs expected (by category)
   - Top problem providers (quality score + trends)
4) **Markets/Growth**
   - Zone state (Open / Soft / Waitlist)
   - BYOC funnel: invites → attributed → activated
   - Provider supply vs demand indicators

### 5.2 Drilldown rule
Every tile is clickable → takes user to the relevant list view pre-filtered:
- “Jobs at risk” → `/admin/ops/jobs?view=at_risk_today`
- “Missing proof” → `/admin/ops/jobs?view=missing_proof`
- “Coverage gaps” → `/admin/ops/service-days?view=coverage_gaps`
- “Zone margin low” → `/admin/ops/billing?view=low_margin`

---

## 6. Dispatcher daily workstation
Goal: “No job left undone.” This is the most operationally critical role.

### 6.1 Dispatcher Home (queues)
Create a primary dispatcher route (or view) that can be pinned:
- `/admin/ops/dispatch` *(new)* or a special view within `/admin/ops/jobs`

Queues:
- **At Risk Today** (lateness risk, unassigned, provider en route too long)
- **Missing Proof**
- **Unassigned / Coverage Gaps**
- **Customer Reported Issue** (opened within last X hours)
- **Provider Incident** (no-show, cannot access, safety flag)

### 6.2 Dispatcher actions
Allowed actions (non-financial):
- Reassign job to eligible provider (within rules)
- Trigger backup provider flow
- Add internal notes & escalation reason
- Send templated messages (macros)
- Mark job as “needs follow-up”
- Convert job issue → support ticket
- Force “proof required” re-request (if supported)

Disallowed actions:
- Change pricing, payout, incentive rules
- Issue credits/refunds beyond caps (can request)

---

## 7. Glass-box machine: Decision Trace (must-have)
### 7.1 Purpose
Operators must understand *why* the system made a decision before we add many knobs.

### 7.2 Decision Trace standard
For every major automated decision, store a trace record:
- decision type (`service_day_assignment`, `job_assignment`, `hold_applied`, `bonus_applied`, `exception_decision`, etc.)
- entity id (job_id, service_day_id, payout_id)
- inputs snapshot (zone config version, sku version, policy version)
- candidates evaluated (providers, windows, etc.)
- scores and rules applied
- chosen outcome + short “reason summary”
- override events (who/why)

### 7.3 UI component
A reusable **DecisionTraceCard** shown on:
- Job detail
- Service day detail
- Provider org detail
- Payout/hold detail
- Exception detail

---

## 8. Embedded SOP / Playbooks (training + consistency)
Create `/admin/playbooks` with role-filtered playbooks.

### 8.1 Playbook requirements
Each playbook:
- 5–12 steps max
- Links to exact admin screens and filtered views
- “Common failure modes” section
- “Escalation to superuser” conditions
- One-line checklist at top

### 8.2 Core playbooks
Dispatcher:
- End-of-day reconciliation
- Missing proof handling
- No-show/late provider escalation
Ops:
- Provider probation ladder
- Coverage exception approvals
- Zone pause / waitlist workflow
Growth manager:
- Launch a new zone in 72 hours
- Founding partner / BYOC close checklist
Superuser:
- Emergency pricing override protocol
- Payout/hold escalation protocol

---

## 9. What stays out of scope
- Implementing new consumer/provider features not required for admin operations
- Building a full forecasting/BI product
- Complex multi-step approval workflows (decision: superuser-only changes)

---

## 10. Acceptance criteria (high level)
- Admin users see a desktop sidebar layout at `lg+` viewport; mobile remains functional.
- Admin sub-roles exist and gate pages/actions (enforced by RLS).
- Ops Cockpit tiles drill down to correct filtered views.
- Dispatcher has clear queues and can resolve day-of issues without touching finances.
- Decision trace appears on job/service day/provider/payout detail pages.
- SOP playbooks exist in UI and are role-filtered.
