-- Round 64 / Phase 4 / Batch 4.1 — Snap-a-Fix schema
--
-- Creates:
--   - public.snap_requests     (customer-owned photo-first requests + AI triage state)
--   - public.job_tasks         (line items on a job; task_type IN ('included','snap','bundle','addon'))
--   - storage bucket 'snap-photos' + RLS for customer-own / provider-via-linkage / admin
--
-- Does NOT create:
--   - dispatch_requests (Batch 4.4)
--   - snap-ai-classify edge function (Batch 4.3)
--   - handle_snap_routing / resolve_snap RPCs (Batch 4.4)
--   - ai_inference_runs.snap_request_id column (added when 4.3 writes it)
--
-- reference_type values on public.handle_transactions ('snap_hold', 'snap_spend',
-- 'snap_refund') require no migration — that column is free-form TEXT.

-- ---------------------------------------------------------------------------
-- Table: snap_requests
-- ---------------------------------------------------------------------------
CREATE TABLE public.snap_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       uuid NOT NULL,
  property_id       uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  subscription_id   uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  photo_paths       text[] NOT NULL DEFAULT '{}',
  description       text,
  area              text CHECK (area IN ('bath','kitchen','yard','exterior','other')),
  routing           text CHECK (routing IN ('next_visit','ad_hoc')),
  status            text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','triaged','scheduled','dispatched','resolved','canceled')),
  credits_held      int NOT NULL DEFAULT 0,
  credits_actual    int,
  ai_classification jsonb,
  linked_job_id     uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  resolved_at       timestamptz
);

CREATE INDEX idx_snap_requests_customer  ON public.snap_requests(customer_id);
CREATE INDEX idx_snap_requests_linked_job ON public.snap_requests(linked_job_id)
  WHERE linked_job_id IS NOT NULL;
CREATE INDEX idx_snap_requests_status    ON public.snap_requests(status);

-- updated_at maintenance
CREATE OR REPLACE FUNCTION public.tg_snap_requests_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER snap_requests_updated_at
  BEFORE UPDATE ON public.snap_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_snap_requests_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: snap_requests
-- ---------------------------------------------------------------------------
ALTER TABLE public.snap_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snap_req_customer_select" ON public.snap_requests
  FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "snap_req_customer_insert" ON public.snap_requests
  FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "snap_req_customer_update" ON public.snap_requests
  FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "snap_req_admin_all" ON public.snap_requests
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "snap_req_provider_select" ON public.snap_requests
  FOR SELECT
  USING (
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

-- ---------------------------------------------------------------------------
-- Table: job_tasks
-- ---------------------------------------------------------------------------
CREATE TABLE public.job_tasks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  task_type         text NOT NULL
    CHECK (task_type IN ('included','snap','bundle','addon')),
  snap_request_id   uuid REFERENCES public.snap_requests(id) ON DELETE SET NULL,
  sku_id            uuid REFERENCES public.service_skus(id) ON DELETE SET NULL,
  description       text,
  credits_estimated int,
  credits_actual    int,
  status            text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','done','skipped')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz
);

CREATE INDEX idx_job_tasks_job          ON public.job_tasks(job_id);
CREATE INDEX idx_job_tasks_snap_request ON public.job_tasks(snap_request_id)
  WHERE snap_request_id IS NOT NULL;
CREATE UNIQUE INDEX uniq_job_tasks_snap_request
  ON public.job_tasks(snap_request_id)
  WHERE snap_request_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RLS: job_tasks
-- ---------------------------------------------------------------------------
ALTER TABLE public.job_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_tasks_customer_select" ON public.job_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_tasks.job_id
        AND j.customer_id = auth.uid()
    )
  );

CREATE POLICY "job_tasks_provider_select" ON public.job_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.jobs j
      JOIN public.provider_members pm ON pm.provider_org_id = j.provider_org_id
      WHERE j.id = job_tasks.job_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'active'
    )
  );

CREATE POLICY "job_tasks_provider_update" ON public.job_tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.jobs j
      JOIN public.provider_members pm ON pm.provider_org_id = j.provider_org_id
      WHERE j.id = job_tasks.job_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.jobs j
      JOIN public.provider_members pm ON pm.provider_org_id = j.provider_org_id
      WHERE j.id = job_tasks.job_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'active'
    )
  );

CREATE POLICY "job_tasks_admin_all" ON public.job_tasks
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ---------------------------------------------------------------------------
-- Storage: snap-photos bucket
-- Path layout: <customer_id>/<snap_request_id>/<photo_id>.jpg
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('snap-photos', 'snap-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Customer can upload snap photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'snap-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

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

COMMENT ON TABLE public.snap_requests IS
  'Customer-initiated Snap-a-Fix requests. Created before AI classification; routing set by the customer; linked_job_id populated by handle_snap_routing RPC (Batch 4.4).';
COMMENT ON TABLE public.job_tasks IS
  'Line items on a job. task_type: included (routine line), snap (customer snap), bundle (bundled add-on), addon (ad-hoc provider addon).';
