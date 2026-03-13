# Sprint 2G-A Review — Access Control + Admin Shell

**Status:** PASS with 3 findings

## Prior-review remediation (OBS-2 through OBS-4)

Lovable addressed all five open findings from the plan review in migration `20260227231252`:

| Finding | Fix | Verified |
|---------|-----|----------|
| OBS-2 / E05-F1 | `requires_training_gate` column added to `service_skus`, `auto_assign_job` updated with deny-by-default gate checks on both primary and backup paths | Yes — column in migration, Supabase types regenerated, SkuFormSheet reads it natively (no more `as any` cast) |
| OBS-3 | `2s-sprint-e05-review.md` rewritten — fabricated fix claims removed, now honestly says E04 findings were not addressed in E05 | Yes |
| OBS-4 / E04-F1 | `compute_byoc_bonuses` rewritten with `GET DIAGNOSTICS ROW_COUNT` after `ON CONFLICT DO NOTHING` — only counts actual inserts | Yes |
| OBS-4 / E04-F2 | `activate_byoc_attribution` now checks `has_role(auth.uid(), 'admin') OR provider_members` membership before activating | Yes |
| OBS-4 / E04-F3 | Trigger renamed to `trg_byoc_attributions_set_updated_at` (drops both old names first) | Yes |
| OBS-4 / E05-F2 | New `evaluate_training_gates` RPC — auto-completes pending gates when provider quality score meets `required_score_minimum`. Admin-guarded | Yes |

The 2F component cleanup was also done: `NeighborhoodDensityWidget`, `PostJobSharePrompt`, and `useNeighborhoodDensity` deleted from source, imports removed from Dashboard and VisitDetail. DB migration with `neighborhood_density` table remains (immutable migration history) but no frontend code references it.

## 2G-A1 — admin_memberships schema

Migration `20260227231448`:
- `admin_role` enum: `superuser|ops|dispatcher|growth_manager` — matches spec §2.1
- `admin_memberships` table: `user_id` PK referencing `auth.users`, `admin_role`, `is_active`, timestamps
- Helper functions: `is_admin_member`, `get_admin_role`, `has_admin_role`, `is_superuser` — all `SECURITY DEFINER` to avoid RLS recursion
- RLS: any active admin can SELECT, only superuser can INSERT/UPDATE/DELETE
- Index on `is_active WHERE is_active = true`

Function names differ slightly from spec (`is_admin_member` not `is_admin`, `get_admin_role` not `admin_role`) — this avoids collision with the enum type name. Good decision.

**Verdict:** Correct. Schema matches spec §1.1–1.3.

## 2G-A2 — useAdminMembership hook

`src/hooks/useAdminMembership.ts`:
- Queries `admin_memberships` for current user when `activeRole === "admin"`
- 5-minute stale time (reasonable for role data that rarely changes)
- Exposes: `membership`, `adminRole`, `isSuperuser`, `isOps`, `isDispatcher`, `isGrowthManager`, `hasMembership`, `isLoading`, `hasAnyRole()`
- `isOps` returns true for both `ops` and `superuser` — correct, superuser is a superset of ops

**Verdict:** Correct. Clean hook design.

## 2G-A3 — AdminShell layout

`src/components/admin/AdminShell.tsx`:
- Uses shadcn `SidebarProvider` + `Sidebar` with `collapsible="icon"`
- 11 nav groups matching spec §3.1: Cockpit, Execution, People, Markets, Catalog, Money, Growth, Support, Governance, Control Room, Playbooks
- Command bar with search placeholder, `⌘K` hint, and `NotificationBell`
- `<Outlet />` renders routed content
- Settings link pinned at bottom of sidebar

**Verdict:** Correct. Matches spec §5.1 (AdminShell) and §3.1 (nav groups).

## 2G-A4 — Role-based gating

- Control Room group has `roles: ["superuser"]` — hidden for all other sub-roles
- `App.tsx`: admin routes now wrapped with `<AdminShell />` instead of `<AppLayout />`
- `BottomTabBar.tsx`: returns `null` when `effectiveRole === "admin"` — admin uses sidebar instead
- Route access still gated by `ProtectedRoute requiredRole="admin"` (checks `user_roles` table) — correct per spec §2 ("keep all internal users as `role = admin` at the app-auth layer")

**Verdict:** Correct. UI gating works. RLS enforces backend.

## Findings

| ID | Severity | Issue |
|----|----------|-------|
| A-F1 | LOW | **Dead variable `groupHasActive` in AdminSidebar** — computed at line 160 but never used. Likely intended for auto-expanding the active group's collapsible, but `SidebarGroup` doesn't support `defaultOpen`. Harmless dead code. |
| A-F2 | LOW | **People > Customers links to `/admin/billing`** — spec §3.1 says "Customers (lookup + ledger)" as a People item. Currently there's no dedicated customer lookup page, so billing is a reasonable placeholder, but the nav label is misleading. Should either rename to "Customer Billing" or create a proper customer lookup page in a future sprint. |
| A-F3 | INFO | **Control Room nav items are a subset of spec** — only shows Pricing & Margin, Payout Rules, and Change Log. Spec §3.1 also lists Incentive caps, Algorithm params, and Policy guardrails. Acceptable: those pages don't exist yet and will be added in Sprint 2G-D. |

## What passed well

- Clean separation: migration handles schema + RLS, hook handles client query, shell handles layout
- `SECURITY DEFINER` on all helper functions prevents RLS infinite recursion
- Sidebar uses shadcn's built-in collapsible icon mode — no custom collapse logic needed
- Role gating is declarative (`roles` array on nav groups/items) — easy to extend
- Command bar is a placeholder that's ready for Sprint 2G-B4 (universal search)
- All E04/E05 findings resolved in a single migration before building new infrastructure

## Open findings tracker (cumulative)

| ID | Severity | Status | Description |
|----|----------|--------|-------------|
| E04-F1 | MEDIUM | CLOSED | `compute_byoc_bonuses` over-count — fixed with GET DIAGNOSTICS |
| E04-F2 | MEDIUM | CLOSED | `activate_byoc_attribution` no auth guard — fixed |
| E04-F3 | LOW | CLOSED | Trigger naming — fixed |
| E05-F1 | MEDIUM | CLOSED | Allow-by-default training gates — fixed with deny-by-default + `requires_training_gate` column |
| E05-F2 | LOW | CLOSED | Unused `required_score_minimum` — wired via `evaluate_training_gates` RPC |
| E05-F3 | LOW | OPEN | Tier modifier cosmetic for primary path (documented, acceptable) |
| A-F1 | LOW | OPEN | Dead variable `groupHasActive` in AdminSidebar |
| A-F2 | LOW | OPEN | People > Customers nav label misleading (links to billing) |
