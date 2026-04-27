# Batch 6.1 — `bundles` + `bundle_items` schema + RLS + Fall Prep strawman seed

> **Round 64 · Phase 6 · Batch 1 of 3**
> **Created:** 2026-04-26
> **Mode:** Quality (production-facing schema)
> **Review:** Medium — 3 parallel lanes + Lane 4 synthesis (sub-agent). Lane 3 skipped per first-batch-in-phase rule.

---

## Why

Phase 6 needs new schema before the customer Bundle detail page (Batch 6.2) and admin curation UI (Batch 6.3) can be built. The migration also seeds a "Fall Prep" strawman bundle as starter content — long-term, all bundle content is admin-managed via Batch 6.3's UI, but a seeded bundle is required so 6.2's E2E tests have something to render.

## Goals

1. Two new tables (`bundles`, `bundle_items`) that model multi-SKU bundles with itemized credit pricing per line.
2. Zone-scoped + window-scoped customer reads (RLS).
3. Admin-only writes (RLS).
4. One seeded "Fall Prep" bundle with 5 line items the math sums correctly: separate = sum(items.credits); savings = separate − total.
5. The schema is forward-compatible with Batches 6.2 + 6.3 — no shape changes needed in those batches.

## Non-goals

- No changes to `seasonal_templates` / `seasonal_orders` (those are different infra and stay as-is).
- No customer-facing UI in this batch (lands in 6.2).
- No admin UI in this batch (lands in 6.3).
- No booking RPC (`useBookBundle` lands in 6.2).

## Scope

### Migration: `supabase/migrations/20260426010000_bundles_schema.sql`

Bootstrap-chain header (per CLAUDE.md lessons): `-- Previous migration: 20260425020000_customer_issues_category.sql`.

**Tables:**

```sql
CREATE TABLE bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,                                  -- "fall-prep-2026"
  name text NOT NULL,                                         -- "Fall Prep"
  season text NOT NULL,                                       -- 'fall' | 'winter' | 'spring' | 'summer'
  window_start_date date NOT NULL,                            -- inclusive
  window_end_date date NOT NULL,                              -- inclusive
  zone_ids uuid[] NOT NULL DEFAULT '{}',                      -- explicit zone allow-list (empty = no zones)
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'archived')),
  hero_image_path text,                                       -- storage path or absolute URL
  description text,
  total_credits int NOT NULL,                                 -- bundled price
  separate_credits int NOT NULL,                              -- sum of line items, denormalized for read perf
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (window_end_date >= window_start_date),
  CHECK (separate_credits >= total_credits),
  CHECK (total_credits > 0)
);

CREATE INDEX bundles_status_window_idx ON bundles (status, window_start_date, window_end_date);
CREATE INDEX bundles_zone_ids_gin ON bundles USING gin (zone_ids);

CREATE TABLE bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  sku_id uuid REFERENCES service_skus(id) ON DELETE RESTRICT, -- nullable for now (admin can describe a line without binding to an SKU)
  label text NOT NULL,                                         -- display label, can override SKU name
  est_minutes int NOT NULL CHECK (est_minutes > 0),
  credits int NOT NULL CHECK (credits > 0),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bundle_items_bundle_idx ON bundle_items (bundle_id, sort_order);
```

**Updated_at triggers:** add `updated_at` auto-bump triggers on both tables (use existing `set_updated_at()` function if present; otherwise inline `BEFORE UPDATE` trigger).

### RLS

```sql
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;

-- Customers read active bundles whose zone matches their property's zone AND the window is current.
-- Admins read all.
CREATE POLICY "bundles_read_active_by_zone_window" ON bundles
  FOR SELECT TO authenticated
  USING (
    status = 'active'
    AND CURRENT_DATE BETWEEN window_start_date AND window_end_date
    AND EXISTS (
      SELECT 1 FROM properties p
      WHERE p.user_id = auth.uid()
        AND p.zone_id = ANY(bundles.zone_ids)
    )
  );

CREATE POLICY "bundles_admin_all" ON bundles
  FOR ALL TO authenticated
  USING (has_admin_role('admin'))
  WITH CHECK (has_admin_role('admin'));

-- bundle_items follow their bundle's read visibility.
CREATE POLICY "bundle_items_read_via_bundle" ON bundle_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bundles b
      WHERE b.id = bundle_items.bundle_id
        AND (
          has_admin_role('admin')
          OR (
            b.status = 'active'
            AND CURRENT_DATE BETWEEN b.window_start_date AND b.window_end_date
            AND EXISTS (
              SELECT 1 FROM properties p
              WHERE p.user_id = auth.uid()
                AND p.zone_id = ANY(b.zone_ids)
            )
          )
        )
    )
  );

CREATE POLICY "bundle_items_admin_write" ON bundle_items
  FOR ALL TO authenticated
  USING (has_admin_role('admin'))
  WITH CHECK (has_admin_role('admin'));
```

**`has_admin_role('admin')`** — verify the helper exists by grepping the existing `has_admin_role` invocations in current migrations. If the function is named differently, align.

**`properties.user_id`** — confirm column name; should be `user_id` (auth uid) on `properties`. If the column is named differently (`owner_id`, `customer_id`, etc.), align.

**`properties.zone_id`** — confirm. Phase 1 / earlier infra established `properties.zone_id`. If unset for a property, the customer reads zero bundles (acceptable — non-onboarded users see no bundles).

### Seed: Fall Prep strawman

Inserted at the end of the migration. Status = `'draft'` (not `'active'`) so it doesn't render to customers immediately — admin flips it to `'active'` via Batch 6.3 UI when ready.

```sql
WITH inserted AS (
  INSERT INTO bundles (slug, name, season, window_start_date, window_end_date, zone_ids, status, description, total_credits, separate_credits)
  VALUES (
    'fall-prep-2026',
    'Fall Prep',
    'fall',
    '2026-09-15',
    '2026-11-30',
    '{}',                       -- empty zone_ids; admin populates per rollout decision
    'draft',
    'Get your home ready before the cold sets in. Five seasonal services attached to one of your routine visit days.',
    540,
    660
  )
  RETURNING id
)
INSERT INTO bundle_items (bundle_id, label, est_minutes, credits, sort_order)
SELECT id, label, est_minutes, credits, sort_order FROM inserted, (VALUES
  ('Gutter cleaning', 60, 200, 1),
  ('Sprinkler winterization', 30, 120, 2),
  ('Dryer vent cleaning', 30, 100, 3),
  ('Window wash (exterior)', 60, 160, 4),
  ('Outdoor faucet shutoff + insulation', 15, 80, 5)
) AS items(label, est_minutes, credits, sort_order);
```

Math check: 200 + 120 + 100 + 160 + 80 = **660** (separate). Bundle total = **540**. Savings = **120 (~18%)**. Matches the FULL-IMPLEMENTATION-PLAN.md §Phase 6 example numbers.

`sku_id` left NULL on every line item — Batch 6.2/6.3 can map labels to SKUs later via admin tooling. Admins draft real bundles via Batch 6.3 UI; this seed is just a stub.

## Acceptance criteria

- [ ] Migration applies cleanly via Supabase Preview (the GitHub↔Supabase integration runs it on the PR branch).
- [ ] `SELECT count(*) FROM bundles WHERE slug = 'fall-prep-2026'` returns 1.
- [ ] `SELECT count(*) FROM bundle_items WHERE bundle_id = (SELECT id FROM bundles WHERE slug = 'fall-prep-2026')` returns 5.
- [ ] `SELECT separate_credits, total_credits FROM bundles WHERE slug = 'fall-prep-2026'` returns `(660, 540)`.
- [ ] `(SELECT SUM(credits) FROM bundle_items WHERE bundle_id = …)` equals `separate_credits` exactly (660).
- [ ] RLS check: as a customer, `SELECT * FROM bundles` returns 0 rows (seed is `draft` + zone_ids empty). Confirms RLS enforces draft + zone gating.
- [ ] RLS check: as admin role, `SELECT * FROM bundles` returns the seeded row.
- [ ] `npx tsc --noEmit` clean (no source changes in this batch — types regen happens automatically post-merge via PR #39's verified workflow).
- [ ] `npm run build` clean.
- [ ] `bash scripts/check-migration-chain.sh --uncommitted` confirms the bootstrap-chain header is present.

## Testing tiers

| Tier | Run? | Notes |
|---|---|---|
| T1 (tsc + build) | ✅ via `/pre-pr` (skip vitest — no test files touched) | Mandatory |
| T2 (vitest unit) | — | No application logic, no helpers; nothing to unit test |
| T3 (smoke SQL) | ✅ via Supabase MCP `execute_sql` against the preview branch | Verifies RLS gating + seed math |
| T4 (Playwright E2E) | — | No UI in this batch |
| T5 (Sarah persona) | — | No UI |

## Out of scope (explicit deferrals to 6.2 / 6.3)

- Customer Bundle detail page → **6.2**.
- "Choose visit day" picker → **6.2**.
- `useBookBundle` mutation → **6.2**.
- Services-page bundle spotlight → **6.2**.
- Admin Bundles CRUD UI (`SeasonalBundles.tsx`) → **6.3**.
- Zone rollout UI → **6.3**.
- Window date picker UI → **6.3**.
- Real Fall Prep zone selection (admin decision) → **6.3** (after the admin UI exists).

## Risks + override notes

- **`has_admin_role('admin')` function name** — verify before commit; if the existing helper is `is_admin()` or similar, align the policy. If absent, fall back to `EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin')` style — confirm the actual existing pattern via grep.
- **`properties.user_id` + `properties.zone_id` column names** — verify before commit. If different (e.g. `properties.owner_user_id`), align.
- **No new `setOf updated_at()` trigger** — if the project doesn't have a shared trigger function, inline the `BEFORE UPDATE` trigger (small DRY hit, but isolates the migration).

## Batch deliverables checklist

- [ ] Migration file created at the right path with bootstrap-chain header.
- [ ] Both tables + RLS policies + seed land in one migration.
- [ ] Bundle math (separate = sum(items.credits)) holds in seed.
- [ ] All gates green (`tsc`, `build`, migration-chain check).
- [ ] PR opened with Test plan citing T1 + T3 (smoke SQL via MCP).
- [ ] Self-merge after Supabase Preview ✅ + Vercel ✅.
- [ ] Post-merge: regen-types.yml will auto-open a types PR — self-merge after `tsc` clean.
