

## Round 2G — Admin Controls / Ops Cockpit

This replaces the old "Admin Intelligence" round with the expanded 3-document spec covering admin sub-roles, pricing/payout engine, governance/audit, dispatcher workstation, decision traces, and SOP playbooks.

### Step 0: Copy spec files to docs/2G/

Copy the three uploaded markdown files into `docs/2G/`:
- `docs/2G/00-overview-and-ux.md`
- `docs/2G/01-pricing-and-payout-engine.md`
- `docs/2G/02-governance-audit-and-implementation.md`

### Updated tasks.md — Round 2G replacement

Replace the existing Round 2G section with the following sprints, following the implementation order from spec doc 02 section 10:

---

### Sprint 2G-A — Access Control + Admin Shell

| ID | Pri | Size | Task |
|----|-----|------|------|
| 2G-A1 | P0 | L | Create `admin_memberships` table (user_id PK, admin_role enum, is_active) + helper SQL functions (`is_admin`, `admin_role`, `has_admin_role`) + RLS policies scoped by sub-role |
| 2G-A2 | P0 | M | Gate all `/admin/*` routes by `admin_memberships` — create `useAdminMembership` hook, update `ProtectedRoute` to check membership |
| 2G-A3 | P0 | L | Build `AdminShell` layout — desktop sidebar with grouped nav (Cockpit, Execution, People, Markets, Catalog, Money, Growth, Support, Governance, Control Room, Playbooks), top command bar placeholder, responsive (sidebar on lg+, mobile nav otherwise) |
| 2G-A4 | P0 | M | Role-based nav and action gating — hide Control Room nav for non-superusers, disable financial actions for dispatchers, wire UI locks to `useAdminMembership` |

### Sprint 2G-B — Cockpit + Dispatcher Queues

| ID | Pri | Size | Task |
|----|-----|------|------|
| 2G-B1 | P0 | XL | Upgrade Ops Cockpit to 4-column layout (Now/Money/Quality/Markets) with clickable drilldown tiles linking to pre-filtered views |
| 2G-B2 | P0 | L | Build dispatcher queue page (`/admin/ops/dispatch`) — At Risk Today, Missing Proof, Unassigned, Coverage Gaps, Customer Issues, Provider Incidents queues |
| 2G-B3 | P1 | L | Dispatcher actions — reassign job (server-validated), trigger backup flow, add internal notes, create/attach support ticket, mark needs-follow-up |
| 2G-B4 | P1 | M | Universal search (command bar) — search by customer email/phone, provider name, job ID, subscription ID across tables |

### Sprint 2G-C — Governance + Explainability

| ID | Pri | Size | Task |
|----|-----|------|------|
| 2G-C1 | P0 | L | Create `admin_audit_log` table + `log_admin_action` RPC — before/after state, reason, actor role. Integrate into all machine-changing writes |
| 2G-C2 | P0 | L | Create `decision_traces` table + reusable `DecisionTraceCard` component — show on job detail, service day detail, provider org detail, payout/hold detail |
| 2G-C3 | P1 | M | Wire `auto_assign_job` and other RPCs to emit decision trace records (inputs, candidates, scoring, outcome) |

### Sprint 2G-D — Control Room (Superuser-Only)

| ID | Pri | Size | Task |
|----|-----|------|------|
| 2G-D1 | P0 | XL | Zone pricing engine — `sku_pricing_base`, `sku_pricing_zone_overrides` tables with versioning. Admin UI for zone multipliers, bulk set, copy from zone, schedule effective dates, rollback. Superuser-only write RLS |
| 2G-D2 | P0 | XL | Provider payout engine — `provider_payout_base`, `provider_payout_zone_overrides`, `provider_org_contracts` (partner_flat / partner_time_guarded / contractor_time_based), `payout_overtime_rules` tables. Admin UI for payout tables, contract types, overtime params. Superuser-only write RLS |
| 2G-D3 | P1 | L | `admin_change_requests` table + UI — non-superusers can submit change requests for pricing/payout/incentives/algorithm. Superuser reviews and applies |
| 2G-D4 | P1 | M | Change log + rollback UI — view all versioned config changes with rollback action (creates new version copying previous) |

### Sprint 2G-E — SOPs + Polish

| ID | Pri | Size | Task |
|----|-----|------|------|
| 2G-E1 | P1 | M | Create `/admin/playbooks` page — render SOP markdown with role filtering (dispatcher/ops/growth/superuser playbooks) |
| 2G-E2 | P1 | M | Write core SOP content — end-of-day reconciliation, missing proof handling, no-show escalation, provider probation ladder, zone pause workflow, emergency pricing override |
| 2G-E3 | P2 | M | Dense table polish — compact row height, sticky headers, hover actions, keyboard shortcuts (J/K/Enter/A/E/N) for dispatcher queues |
| 2G-E4 | P2 | S | Saved views per role — dispatcher default queue filters persisted to localStorage |

---

### Technical notes

- **No new auth system** — admin sub-roles are implemented as a new `admin_memberships` table within the existing `role = admin` app-auth layer. The existing `ProtectedRoute` already gates by `admin` role; sub-role checks add a second layer.
- **Existing admin pages** remain functional — the new `AdminShell` wraps them with improved navigation grouping. Existing routes (`/admin/ops`, `/admin/zones`, etc.) keep working.
- **Pricing/payout tables** are append-only versioned configs — rollback creates a new version, never deletes.
- **All audit/pricing/payout writes** go through RPCs with `SECURITY DEFINER` + `has_admin_role(auth.uid(), 'superuser')` checks.
- **Decision traces** are read-only for all admin sub-roles, written by system RPCs only.

