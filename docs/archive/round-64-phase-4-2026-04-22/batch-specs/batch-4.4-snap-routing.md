# Batch 4.4 — Snap routing + refund path

> **Phase:** 4 (Snap-a-Fix) · **Size:** Large · **Review tier:** Large (3 lanes + Sonnet synthesis + Haiku synthesis, all as sub-agents per §5)
> **PRD:** `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` lines 200–253
> **Depends on:** Batches 4.1 (schema), 4.2 (capture UI), 4.3 (AI classify) — all merged
> **Testing strategy:** `docs/testing-strategy.md` — this batch adopts Tier 1 + Tier 2 as the new floor; Tier 3/4 pending credentials.

---

## Goal

Close the Snap loop. When the customer commits on step 4 of SnapSheet, we currently hold credits and set `snap_requests.routing` — but nothing *acts* on that routing yet. Batch 4.4 makes routing real:

- **`next_visit`** snaps attach a `job_tasks` row with `task_type='snap'` onto the customer's next scheduled `jobs` in their routine. Provider sees the snap task when they open the job.
- **`ad_hoc`** snaps land in a new `dispatch_requests` queue for provider-ops dispatch.
- **Cancel / refund** path: if a snap is canceled before completion, held credits come back via `refund_handles`.
- **Resolution** path: on completion, if the actual credits used < credits held, the difference refunds automatically.

Visit Detail / provider-UI surfaces for `job_tasks` are Phase 5, not this batch — per the original PRD.

---

## Files touched

### New
- `supabase/migrations/20260422200000_snap_routing.sql` — `dispatch_requests` table + RLS + `handle_snap_routing` + `resolve_snap` RPCs.
- `src/hooks/useRouteSnap.ts` — frontend wrapper for `handle_snap_routing`.
- `src/hooks/useCancelSnap.ts` — frontend wrapper for `resolve_snap` cancel path.
- `src/lib/__tests__/imageCompression.test.ts` — Vitest exemplar per testing-strategy Appendix C item 2. Kept small; demonstrates the Tier 2 pattern.
- `src/hooks/__tests__/useRouteSnap.test.ts` — Vitest with `@tanstack/react-query` wrapper + mocked supabase client.

### Modified
- `src/components/customer/SnapSheet.tsx` — after `finalize.mutateAsync` resolves, chain `routeSnap` with rollback-via-cancel on failure.
- `docs/upcoming/TODO.md` — add "deploy the 4.4 migration + verify `handle_snap_routing` + `resolve_snap` executed clean in prod".

No existing files deleted this batch.

---

## Schema

### Table `dispatch_requests`

```sql
CREATE TABLE public.dispatch_requests (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snap_request_id           uuid NOT NULL REFERENCES public.snap_requests(id) ON DELETE CASCADE,
  property_id               uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  customer_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status                    text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'assigned', 'en_route', 'completed', 'canceled')),
  urgency                   text CHECK (urgency IN ('low', 'medium', 'high')),
  assigned_provider_org_id  uuid REFERENCES public.provider_orgs(id) ON DELETE SET NULL,
  dispatched_at             timestamptz,
  resolved_at               timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dispatch_requests_customer  ON public.dispatch_requests(customer_id);
CREATE INDEX idx_dispatch_requests_status    ON public.dispatch_requests(status);
CREATE INDEX idx_dispatch_requests_assigned  ON public.dispatch_requests(assigned_provider_org_id)
  WHERE assigned_provider_org_id IS NOT NULL;

CREATE TRIGGER dispatch_requests_updated_at
  BEFORE UPDATE ON public.dispatch_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.dispatch_requests ENABLE ROW LEVEL SECURITY;

-- Customer: read own
CREATE POLICY "dispatch_req_customer_select" ON public.dispatch_requests
  FOR SELECT USING (customer_id = auth.uid());

-- Provider: read requests assigned to their org
CREATE POLICY "dispatch_req_provider_select" ON public.dispatch_requests
  FOR SELECT USING (
    assigned_provider_org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.provider_members pm
      WHERE pm.provider_org_id = dispatch_requests.assigned_provider_org_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'active'
    )
  );

-- Provider: update status on their own dispatches (for en_route / completed transitions)
CREATE POLICY "dispatch_req_provider_update" ON public.dispatch_requests
  FOR UPDATE USING (
    assigned_provider_org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.provider_members pm
      WHERE pm.provider_org_id = dispatch_requests.assigned_provider_org_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'active'
    )
  ) WITH CHECK (
    assigned_provider_org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.provider_members pm
      WHERE pm.provider_org_id = dispatch_requests.assigned_provider_org_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'active'
    )
  );

-- Admin: full access
CREATE POLICY "dispatch_req_admin_all" ON public.dispatch_requests
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

Note: no customer INSERT policy — `handle_snap_routing` RPC is SECURITY DEFINER and writes on the customer's behalf.

### RPC `handle_snap_routing`

```sql
CREATE OR REPLACE FUNCTION public.handle_snap_routing(p_snap_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_snap   RECORD;
  v_next_job uuid;
  v_dispatch_id uuid;
  v_urgency text;
BEGIN
  -- 1. Load + authorize
  SELECT * INTO v_snap FROM snap_requests WHERE id = p_snap_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'snap_not_found');
  END IF;

  IF v_snap.customer_id <> v_caller
     AND NOT has_role(v_caller, 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  -- 2. State guards
  IF v_snap.routing IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'routing_not_set');
  END IF;
  IF v_snap.credits_held <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'credits_not_held');
  END IF;
  IF v_snap.status NOT IN ('submitted', 'triaged') THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_routed', 'status', v_snap.status);
  END IF;

  -- 3. Urgency from AI classification if available, else fallback
  v_urgency := COALESCE(v_snap.ai_classification->>'urgency_signal', 'medium');

  -- 4. Route
  IF v_snap.routing = 'next_visit' THEN
    -- Find customer's next job on the same property, not yet started
    SELECT j.id INTO v_next_job
    FROM jobs j
    WHERE j.customer_id = v_snap.customer_id
      AND j.property_id = v_snap.property_id
      AND j.scheduled_date >= CURRENT_DATE
      AND j.status IN ('NOT_STARTED', 'IN_PROGRESS')
    ORDER BY j.scheduled_date ASC, j.created_at ASC
    LIMIT 1;

    IF v_next_job IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'no_upcoming_job');
    END IF;

    INSERT INTO job_tasks (job_id, task_type, snap_request_id, description, credits_estimated, status)
    VALUES (
      v_next_job, 'snap', v_snap.id,
      COALESCE(v_snap.ai_classification->>'summary', v_snap.description),
      v_snap.credits_held, 'pending'
    );

    UPDATE snap_requests
    SET linked_job_id = v_next_job, status = 'scheduled', updated_at = now()
    WHERE id = v_snap.id;

    RETURN jsonb_build_object(
      'success', true,
      'route_type', 'next_visit',
      'linked_job_id', v_next_job
    );

  ELSIF v_snap.routing = 'ad_hoc' THEN
    INSERT INTO dispatch_requests (snap_request_id, property_id, customer_id, urgency)
    VALUES (v_snap.id, v_snap.property_id, v_snap.customer_id, v_urgency)
    RETURNING id INTO v_dispatch_id;

    UPDATE snap_requests
    SET status = 'dispatched', updated_at = now()
    WHERE id = v_snap.id;

    RETURN jsonb_build_object(
      'success', true,
      'route_type', 'ad_hoc',
      'dispatch_request_id', v_dispatch_id
    );
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'invalid_routing', 'routing', v_snap.routing);
END;
$$;
```

### RPC `resolve_snap`

```sql
CREATE OR REPLACE FUNCTION public.resolve_snap(
  p_snap_request_id uuid,
  p_credits_actual int DEFAULT NULL,
  p_canceled boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_snap RECORD;
  v_refund_amount int;
  v_final_actual int;
  v_is_service_caller boolean;
BEGIN
  -- Callers: owner, admin, or service role (edge functions / triggers).
  -- Service role sets auth.uid() = NULL.
  v_is_service_caller := (v_caller IS NULL);

  SELECT * INTO v_snap FROM snap_requests WHERE id = p_snap_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'snap_not_found');
  END IF;

  IF NOT v_is_service_caller
     AND v_snap.customer_id <> v_caller
     AND NOT has_role(v_caller, 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF v_snap.status IN ('resolved', 'canceled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_resolved', 'status', v_snap.status);
  END IF;

  IF p_canceled THEN
    -- Full refund.
    PERFORM refund_handles(
      v_snap.subscription_id,
      v_snap.customer_id,
      v_snap.credits_held,
      v_snap.id,
      NULL
    );

    UPDATE snap_requests
    SET status = 'canceled',
        credits_actual = 0,
        resolved_at = now(),
        updated_at = now()
    WHERE id = v_snap.id;

    RETURN jsonb_build_object(
      'success', true,
      'resolution', 'canceled',
      'refunded', v_snap.credits_held
    );
  END IF;

  -- Completion path.
  v_final_actual := LEAST(
    COALESCE(p_credits_actual, v_snap.credits_held),
    v_snap.credits_held
  );

  UPDATE snap_requests
  SET credits_actual = v_final_actual,
      status = 'resolved',
      resolved_at = now(),
      updated_at = now()
  WHERE id = v_snap.id;

  IF v_final_actual < v_snap.credits_held THEN
    v_refund_amount := v_snap.credits_held - v_final_actual;
    PERFORM refund_handles(
      v_snap.subscription_id,
      v_snap.customer_id,
      v_refund_amount,
      v_snap.id,
      NULL
    );
    RETURN jsonb_build_object(
      'success', true,
      'resolution', 'resolved_partial',
      'credits_actual', v_final_actual,
      'refunded', v_refund_amount
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'resolution', 'resolved_full',
    'credits_actual', v_final_actual
  );
END;
$$;
```

Grant execute:

```sql
GRANT EXECUTE ON FUNCTION public.handle_snap_routing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_snap(uuid, int, boolean) TO authenticated, service_role;
```

---

## Frontend

### `src/hooks/useRouteSnap.ts`

Mutation wrapper. Input: `{ snapId }`. Invokes `handle_snap_routing`. Returns the RPC's return shape. Surfaces the `error` field as a human-readable `Error` on non-success. No invalidation — the routing step doesn't change handle balance.

### `src/hooks/useCancelSnap.ts`

Mutation wrapper. Input: `{ snapId }`. Invokes `resolve_snap(snapId, null, true)`. Because a cancel refunds credits, invalidate the same prefix-match keys used in `useFinalizeSnap`: `["subscription"]`, `["handle_balance"]`, `["handle_transactions"]`.

### SnapSheet change

`handleSubmit` currently runs `finalize.mutateAsync(...)` and on success toasts + resets. Extend:

```ts
const finalizeResult = await finalize.mutateAsync({...});

try {
  await routeSnap.mutateAsync({ snapId: draft.snapId });
} catch (routeErr) {
  // Routing failed after credits were held. Refund via cancel so the
  // customer isn't left with credits deducted for nothing, then
  // surface the error.
  await cancelSnap.mutateAsync({ snapId: draft.snapId }).catch(() => {});
  throw routeErr;
}

// On success, toast + reset (unchanged).
```

Two error paths for routing failure worth surfacing explicitly in copy:
- `no_upcoming_job` (next_visit with empty routine) → toast "No upcoming visits. Pick Urgent instead." Keep the sheet on step 4 so the user can switch routing.
- All other errors → generic toast + refund happened.

Cleaner: if the error is `no_upcoming_job`, do **not** refund — instead keep the hold live and let the user re-submit with `ad_hoc`. This is a known constraint mentioned in the PRD ("next_visit requires a routine"). Detect `error.message === 'no_upcoming_job'` and branch:
- For `no_upcoming_job`: toast + flip routing state to `'ad_hoc'` visually + re-submit path (but **don't** double-hold credits; the existing hold covers it).
- All other errors: refund + surface.

Implementation: expose the "don't refund, just offer ad_hoc" path via a new state flag `awaitingAdHocRetry`. Hide finalize + route into a single `submit` helper.

---

## Tier 2 test coverage (per testing-strategy.md)

### `src/lib/__tests__/imageCompression.test.ts` (Appendix-C exemplar — one-shot carryover)

- Input: a small canvas-generated `File` (jpeg with known dimensions, e.g. 2400×1200).
- Assert `compressImage(file, 1200)` returns a `Blob` with `type === 'image/jpeg'`.
- Assert decoded image dimensions are ≤ 1200 on the longest side.
- Assert `URL.revokeObjectURL` is called (spy).
- Assert a non-image file rejects with the `img.onerror` path.

### `src/hooks/__tests__/useRouteSnap.test.ts`

- `renderHook` with a `QueryClient` wrapper.
- Mock `supabase.rpc` to return three scenarios:
  1. `{ success: true, route_type: 'next_visit', linked_job_id: '...' }` → resolves to that shape.
  2. `{ success: false, error: 'no_upcoming_job' }` → throws an Error with the matching message.
  3. Network error → throws.
- No invalidation to assert — routing doesn't change balance.

### `src/hooks/__tests__/useCancelSnap.test.ts`

- `renderHook` with `QueryClient`.
- Mock `supabase.rpc` to return `{ success: true, resolution: 'canceled', refunded: 120 }`.
- Assert `queryClient.invalidateQueries` called with each of `["subscription"]`, `["handle_balance"]`, `["handle_transactions"]`.

---

## What is deliberately NOT in this batch

| Item | Where it lives |
|------|----------------|
| Visit Detail rendering snap chips | Phase 5 |
| Provider UI for `dispatch_requests` queue | Phase 5 / 7 |
| Auto-dispatch assignment logic (which provider_org) | Phase 7 (provider tooling) |
| Trigger on `complete_job` → auto-call `resolve_snap` | Deferred; human ops can call `resolve_snap` manually via admin until the trigger lands |
| Type regen for `snap_requests` / `job_tasks` / `dispatch_requests` | Deferred (sandbox lacks `SUPABASE_ACCESS_TOKEN`); `as any` casts at the boundary are noted in-code. Tracked in `docs/upcoming/TODO.md`. |

---

## Acceptance criteria

1. Migration applies clean on Supabase Preview branch — both RPCs callable, RLS in place, indexes created.
2. `handle_snap_routing` happy paths:
   - `next_visit` with an upcoming job → `job_tasks` row inserted, `snap_requests.status='scheduled'`, `linked_job_id` set.
   - `ad_hoc` → `dispatch_requests` row inserted, `snap_requests.status='dispatched'`.
3. `handle_snap_routing` error paths return structured `{success:false, error:...}` JSON (caller tests this).
4. `resolve_snap` happy paths:
   - Completion with `credits_actual = credits_held` → status='resolved', no refund.
   - Completion with `credits_actual < credits_held` → status='resolved_partial', refund issued.
   - Cancel → status='canceled', full refund.
5. Frontend:
   - Successful next_visit or ad_hoc submit shows correct toast.
   - `no_upcoming_job` shows specific toast AND flips routing UI to ad_hoc without double-holding.
   - Other routing failures refund + surface.
6. Tier 2 tests pass: `npm test` clean; at least one test for `imageCompression`, `useRouteSnap`, `useCancelSnap`.
7. Tier 1 gates clean: `npx tsc --noEmit`, `npm run build`, `npm run lint`.

---

## Review

**Large tier per CLAUDE.md §5:**
- Lane 1 — Spec Completeness (Sonnet sub-agent)
- Lane 2 — Bug Scan (Sonnet sub-agent)
- Lane 3 — Historical Context + Prior Feedback (Sonnet sub-agent) — NOT skipped; this batch has rich prior-review history across 4.1/4.2/4.3 to compare against
- Lane 4 — Sonnet synthesis (sub-agent, NOT inline)
- Lane 5 — Haiku synthesis (sub-agent) — Large-tier second opinion on Lane 4's report

No inline synthesis. Deviation gets `[OVERRIDE]` tag per §10.

---

## Deploy steps (human, post-merge)

- Migration auto-applies via GitHub↔Supabase integration.
- No edge function changes — nothing to `supabase functions deploy`.
- Append to `docs/upcoming/TODO.md`: verify both new RPCs callable in prod (smoke via SQL editor).
