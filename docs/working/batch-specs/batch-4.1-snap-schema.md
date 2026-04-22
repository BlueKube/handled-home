# Batch 4.1 — Snap-a-Fix Schema

> **Phase:** 4 (Snap-a-Fix) · **Size:** Medium · **Review tier:** Medium 3-lane + synthesis (Lane 3 skipped — first batch in phase)
> **PRD:** `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` lines 200–253

---

## Goal

Create the database substrate for Snap-a-Fix: a customer-owned `snap_requests` table, a generic `job_tasks` table that Batch 4.4 will populate with `task_type='snap'` rows on the next scheduled job, and a `snap-photos` storage bucket (because `job-photos` INSERT is locked to provider members per migration `20260403053002`).

No frontend, no edge function, no routing logic — those are Batches 4.2 / 4.3 / 4.4.

---

## Files touched

- **New:** `supabase/migrations/20260422000000_snap_a_fix_schema.sql`
- **Regenerated:** `src/integrations/supabase/types.ts` (via `mcp__supabase__generate_typescript_types` after apply)

No other source files change in this batch.

---

## Schema

### Table: `snap_requests`

```sql
CREATE TABLE public.snap_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id      uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  subscription_id  uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  photo_paths      text[] NOT NULL DEFAULT '{}',
  description      text,
  area             text CHECK (area IN ('bath','kitchen','yard','exterior','other')),
  routing          text CHECK (routing IN ('next_visit','ad_hoc')),
  status           text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','triaged','scheduled','dispatched','resolved','canceled')),
  credits_held     int NOT NULL DEFAULT 0,
  credits_actual   int,
  ai_classification jsonb,
  linked_job_id    uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  resolved_at      timestamptz
);

CREATE INDEX idx_snap_requests_customer ON public.snap_requests(customer_id);
CREATE INDEX idx_snap_requests_linked_job ON public.snap_requests(linked_job_id) WHERE linked_job_id IS NOT NULL;
CREATE INDEX idx_snap_requests_status ON public.snap_requests(status);
```

Notes:
- `subscription_id` is nullable to keep the row writable before the hook looks up the active subscription; `useSubmitSnap` in 4.2 always populates it.
- `area` is a closed enum matching the PRD's five chip options (Bath / Kitchen / Yard / Exterior / Other).
- `routing` is nullable at insert time — the sheet may create the row on photo upload and set routing later.
- `credits_held` / `credits_actual` counted in credit units (matches `handle_transactions.amount` INTEGER).
- `updated_at` maintained via trigger (see end of migration).

### Table: `job_tasks`

```sql
CREATE TABLE public.job_tasks (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id              uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  task_type           text NOT NULL
    CHECK (task_type IN ('included','snap','bundle','addon')),
  snap_request_id     uuid REFERENCES public.snap_requests(id) ON DELETE SET NULL,
  sku_id              uuid REFERENCES public.service_skus(id) ON DELETE SET NULL,
  description         text,
  credits_estimated   int,
  credits_actual      int,
  status              text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','done','skipped')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  completed_at        timestamptz
);

CREATE INDEX idx_job_tasks_job ON public.job_tasks(job_id);

-- Partial unique index doubles as the lookup index for snap_request_id — no
-- need for a separate non-unique index on the same column + predicate.
CREATE UNIQUE INDEX uniq_job_tasks_snap_request ON public.job_tasks(snap_request_id)
  WHERE snap_request_id IS NOT NULL;
```

Notes:
- The PRD lists this as an extension of an existing `job_tasks` table; no such table exists today, so we create it fresh. Phase 5 (Visit Detail) will read `task_type` to render type chips.
- `snap_request_id` is unique when present — a snap lands on exactly one job_task row.
- `sku_id` is nullable because `task_type='snap'` rows may be created before AI classification picks a SKU.

### RLS — `snap_requests`

```sql
ALTER TABLE public.snap_requests ENABLE ROW LEVEL SECURITY;

-- Customer reads + writes own
CREATE POLICY "snap_req_customer_select" ON public.snap_requests
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "snap_req_customer_insert" ON public.snap_requests
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "snap_req_customer_update" ON public.snap_requests
  FOR UPDATE USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- Admin: full read + update
CREATE POLICY "snap_req_admin_all" ON public.snap_requests
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Provider reads via linked job
CREATE POLICY "snap_req_provider_select" ON public.snap_requests
  FOR SELECT USING (
    linked_job_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.jobs j
      JOIN public.provider_members pm ON pm.provider_org_id = j.provider_org_id
      WHERE j.id = snap_requests.linked_job_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'active'
    )
  );
```

### RLS — `job_tasks`

```sql
ALTER TABLE public.job_tasks ENABLE ROW LEVEL SECURITY;

-- Customer reads tasks on their own jobs
CREATE POLICY "job_tasks_customer_select" ON public.job_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_tasks.job_id AND j.customer_id = auth.uid()
    )
  );

-- Provider reads tasks on their org's jobs
CREATE POLICY "job_tasks_provider_select" ON public.job_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.jobs j
      JOIN public.provider_members pm ON pm.provider_org_id = j.provider_org_id
      WHERE j.id = job_tasks.job_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'active'
    )
  );

-- Provider updates status/credits_actual on their org's jobs
CREATE POLICY "job_tasks_provider_update" ON public.job_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.jobs j
      JOIN public.provider_members pm ON pm.provider_org_id = j.provider_org_id
      WHERE j.id = job_tasks.job_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'active'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.jobs j
      JOIN public.provider_members pm ON pm.provider_org_id = j.provider_org_id
      WHERE j.id = job_tasks.job_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'active'
    )
  );

-- Admin full access
CREATE POLICY "job_tasks_admin_all" ON public.job_tasks
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

Note: no customer INSERT policy on `job_tasks` — these rows are only created by the SECURITY DEFINER `handle_snap_routing` RPC in Batch 4.4 and by provider-side routines that already use service role. Likewise no customer UPDATE.

### Storage: `snap-photos` bucket

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('snap-photos', 'snap-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Path layout: <customer_id>/<snap_request_id>/<photo_id>.jpg
-- Authenticated customer uploads anywhere under their own customer_id prefix.
CREATE POLICY "Customer can upload snap photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'snap-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Customer reads own photos + admin reads all + provider reads via linked job
CREATE POLICY "Customer/admin/provider can read snap photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'snap-photos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1
        FROM public.snap_requests sr
        JOIN public.jobs j ON j.id = sr.linked_job_id
        JOIN public.provider_members pm ON pm.provider_org_id = j.provider_org_id
        WHERE (storage.foldername(name))[2] = sr.id::text
          AND pm.user_id = auth.uid()
          AND pm.status = 'active'
      )
    )
  );

CREATE POLICY "Customer can delete own snap photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'snap-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

Notes:
- `storage.foldername(name)[1]` = customer_id, `[2]` = snap_request_id. Enforced at path level so a customer can't write into another customer's prefix.
- Provider read works through the `snap_requests → jobs → provider_members` linkage, gated on the snap being linked to a job.

### `updated_at` triggers

Both new tables reuse the existing project-wide helper `public.update_updated_at_column()` (defined in migration `20260221235955`) instead of a one-off function:

```sql
CREATE TRIGGER snap_requests_updated_at
  BEFORE UPDATE ON public.snap_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER job_tasks_updated_at
  BEFORE UPDATE ON public.job_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

`job_tasks` also carries an `updated_at timestamptz NOT NULL DEFAULT now()` column so the helper has something to write.

---

## What is deliberately NOT in this batch

| Item | Where it lives |
|------|----------------|
| `dispatch_requests` table | Batch 4.4 |
| `snap-ai-classify` edge function | Batch 4.3 |
| `handle_snap_routing` / `resolve_snap` RPCs | Batch 4.4 |
| `ai_inference_runs.snap_request_id` column | Batch 4.3 (only added when the edge function writes it) |
| Frontend capture / FAB / hook | Batch 4.2 |
| `snap_hold` / `snap_spend` / `snap_refund` reference_type values on `handle_transactions` | No migration needed — column is free-form TEXT |

Reviewers: flagging 4.2–4.4 work as missing is **not a MUST-FIX** for this batch. Spec completeness lane should only check items listed under "Schema" above.

---

## Acceptance criteria

1. Migration applies cleanly via `supabase db push` (or GitHub→Supabase auto-apply on merge to main).
2. `mcp__supabase__generate_typescript_types` regen includes `snap_requests` and `job_tasks` in `Database['public']['Tables']`.
3. `npx tsc --noEmit` — clean.
4. `npm run build` — clean.
5. `mcp__supabase__get_advisors` — no new RLS-disabled warnings; no new "security definer view" warnings.
6. Smoke checks (manual, via Management API `execute_sql`):
   - As customer A: `INSERT INTO snap_requests (...)` with `customer_id=A` → succeeds.
   - As customer A: same `INSERT` with `customer_id=B` → denied.
   - As customer A: `SELECT * FROM snap_requests WHERE customer_id=B` → 0 rows.
   - As customer A: upload to `snap-photos/A/<snap_id>/x.jpg` → succeeds; upload to `snap-photos/B/...` → denied.

---

## Risks / known edge cases

- **`job_tasks` uniqueness:** partial unique index on `snap_request_id` prevents double-creating a snap task. Routine regeneration in Phase 5 may need to preserve the snap task instead of rebuilding — flag for Phase 5.
- **Customer-insert on `snap_requests.linked_job_id`:** a malicious customer could insert a row with a stranger's `linked_job_id`. Mitigated because provider/admin read policies require ownership of the linked job independently, and `handle_snap_routing` (4.4) sets this field server-side. Non-issue, but a SHOULD-FIX candidate if a reviewer wants a trigger that nulls `linked_job_id` on client inserts.
- **Service role bypass:** edge functions in 4.3/4.4 use service role and bypass RLS, as expected.

---

## Review notes

- Lane 1 (spec completeness) should check: 2 tables, all listed columns/constraints, 4 + 4 RLS policies, 3 storage policies, 2 triggers (both reusing `public.update_updated_at_column`), 3 indexes on `snap_requests` (customer, partial linked_job, status), 2 indexes on `job_tasks` (job, partial-unique snap_request_id).
- Lane 2 (bug scan) should flag: SQL injection surfaces (none expected in DDL-only), missing `ON DELETE` specs, policy gaps, and any `has_role` call without the `::app_role` cast.
- Lane 3 **skipped** per the first-batch-in-phase rule. Tag with `[OVERRIDE: Lane 3 skipped — first batch in Phase 4, no prior review findings]` in commit body.
