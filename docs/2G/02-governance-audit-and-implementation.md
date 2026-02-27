# Handled Home — Admin Controls: Governance, Audit, and Implementation Plan (Spec)
This document turns the Admin Controls vision into concrete implementation steps in Lovable.

---

## 1. Admin membership + permissions (RLS enforced)
### 1.1 Tables
Create `admin_memberships`:
- user_id (pk)
- admin_role enum: `superuser|ops|dispatcher|growth_manager`
- is_active boolean
- created_at, updated_at

Optional future: `admin_permissions` for one-off overrides.

### 1.2 Helper functions (Supabase SQL)
- `is_admin(uid)` → membership exists and active
- `admin_role(uid)` → returns role
- `has_admin_role(uid, role)` → bool

### 1.3 RLS rules (pattern)
- For admin tables/views:
  - SELECT allowed for `is_admin(auth.uid())`
  - UPDATE/INSERT/DELETE:
    - Only `superuser` where changing machine parameters
    - Ops/dispatcher/growth only for scoped operational tables (tickets, notes, assignments) as defined below

---

## 2. Audit logging (mandatory)
### 2.1 Table: `admin_audit_log`
Columns:
- id
- actor_user_id
- actor_admin_role
- action_type (string)
- entity_type (string)
- entity_id (uuid/string)
- before_state jsonb (nullable)
- after_state jsonb
- reason text
- created_at
- ip_hash (optional)
- request_id (optional)

### 2.2 Logging requirements
Any write to:
- pricing tables
- payout tables
- incentives rules/caps
- algorithm parameters
- zone state changes
MUST log:
- before/after
- reason
- actor role

### 2.3 Rollback
For versioned config tables (pricing/payout/etc.):
- “rollback” = create a new version copying a previous version as current
- Never hard-delete past versions

---

## 3. Control Room (superuser-only)
### 3.1 Control Room definition
A superuser-only set of pages for changing the machine:
- Pricing & Margin
- Payout Engine & Holds
- Incentives caps & rules
- Algorithm & Assignment params
- Policy guardrails
- Change Log / Rollback

### 3.2 Non-superuser “request change” (lightweight)
Not a multi-step approval workflow.
Create `admin_change_requests`:
- id, requester_user_id, requester_admin_role
- requested_area (pricing/payout/incentives/algorithm)
- payload jsonb (proposed change)
- reason
- status (open/closed)
- created_at, closed_at, closed_by

Ops/dispatcher/growth can submit requests; only superuser can apply changes.

---

## 4. Decision Trace (glass-box machine)
### 4.1 Table: `decision_traces`
- id
- decision_type
- entity_type
- entity_id
- inputs jsonb (policy versions, zone settings)
- candidates jsonb (evaluated options)
- scoring jsonb (weights and scores)
- outcome jsonb (selected result + short reason summary)
- created_at
- override_event_id (nullable)

### 4.2 UI
Reusable component `DecisionTraceCard` embedded into:
- Job detail
- Service day detail
- Provider org detail
- Payout/hold detail
- Exception detail

---

## 5. Desktop admin shell implementation
### 5.1 Create AdminShell
- Responsive: sidebar on `lg+`, mobile nav otherwise
- Command bar: universal search + quick actions
- Support split-view patterns:
  - list on left, detail drawer/pane on right

### 5.2 Dense tables baseline
- Compact row height
- Sticky headers
- Hover actions
- Row click opens detail
- Saved views per role

---

## 6. Dispatcher queues (implementation)
### 6.1 Views
- at_risk_today
- missing_proof
- unassigned
- coverage_gaps
- recent_customer_issues
- provider_incidents

### 6.2 Actions
- reassign within eligible set (server-side validation)
- trigger backup flow
- add notes
- create/attach support ticket
- escalate flag

### 6.3 Validations
- cannot assign a provider not eligible for zone/category/SKU
- cannot override financial controls

---

## 7. Ops responsibilities (implementation)
Ops can:
- manage SKUs (create/edit/pause) within superuser-set constraints
- manage zones: Open/Soft/Waitlist; launch checklist; pause workflows
- manage plans and bundles (configuration)
- manage providers: approve/probation/suspend (non-financial)
- resolve exceptions within caps
Ops cannot:
- change pricing/payout/algorithm parameters (superuser-only)

---

## 8. Growth manager responsibilities (implementation)
Growth can:
- manage BYOC/founding partner pipeline
- manage incentives within caps
- zone launch checklists + campaign toggles
Growth cannot:
- change incentive caps/bonus ceilings or pricing/payout (superuser-only)

---

## 9. SOP/Playbooks implementation
### 9.1 Storage
Store SOP markdown in repo `docs/sops/*.md` and render them in-app at `/admin/playbooks`.

### 9.2 Role filtering
- Each playbook has metadata: allowed_roles
- Only show playbooks relevant to the admin sub-role

---

## 10. Implementation tasks (Lovable build order)
### Sprint A — Access control + shell
1. Add `admin_memberships` + RLS helper functions
2. Gate `/admin/*` access by membership
3. Implement AdminShell (desktop sidebar + command bar)
4. Add role-based navigation and action gating

### Sprint B — Cockpit + queues
5. Upgrade Ops Cockpit tiles + drilldowns
6. Add dispatcher queue views + actions
7. Add universal search (customer/provider/job)

### Sprint C — Governance + explainability
8. Add `admin_audit_log` + integrate into machine-changing writes
9. Add Decision Trace data model + UI component

### Sprint D — Control Room
10. Control Room pages (superuser-only)
11. Zone pricing overlays + versioning + rollback
12. Provider payout overlays + contract types + time-guarded overtime config
13. Change request log for non-superusers

### Sprint E — SOPs and polish
14. Render playbooks in-app with links to views
15. Add saved views + keyboard shortcuts for dispatcher
16. Tighten table density and performance

---

## 11. Acceptance criteria
- Only admins with memberships can access admin routes.
- Only superusers can change pricing/payout/incentive caps/algorithm controls.
- Audit logging exists for all machine-changing operations.
- Decision Trace appears on core operational entities.
- AdminShell is desktop-first and dense.
- Dispatcher queues enable “no job left undone.”
- SOP playbooks exist inside the admin UI, role-filtered.
