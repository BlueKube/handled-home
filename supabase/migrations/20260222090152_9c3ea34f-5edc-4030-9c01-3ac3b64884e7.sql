
-- ============================================================
-- Module 09: Job Execution — Tables, RLS, RPCs, Triggers, Storage
-- ============================================================

-- ========================
-- 1. TABLES
-- ========================

-- 1.1 jobs
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_day_instance_id uuid,
  routine_version_id uuid REFERENCES public.routine_versions(id),
  property_id uuid NOT NULL REFERENCES public.properties(id),
  customer_id uuid NOT NULL,
  zone_id uuid NOT NULL REFERENCES public.zones(id),
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id),
  assigned_member_id uuid,
  scheduled_date date,
  status text NOT NULL DEFAULT 'NOT_STARTED'
    CHECK (status IN ('NOT_STARTED','IN_PROGRESS','ISSUE_REPORTED','PARTIAL_COMPLETE','COMPLETED','CANCELED')),
  access_notes_snapshot text,
  started_at timestamptz,
  completed_at timestamptz,
  arrived_at timestamptz,
  departed_at timestamptz,
  arrived_source text CHECK (arrived_source IN ('auto','manual')),
  departed_source text CHECK (departed_source IN ('auto','manual')),
  provider_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.2 job_skus
CREATE TABLE public.job_skus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sku_id uuid NOT NULL REFERENCES public.service_skus(id),
  sku_name_snapshot text,
  duration_minutes_snapshot int,
  UNIQUE(job_id, sku_id)
);

-- 1.3 job_checklist_items
CREATE TABLE public.job_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sku_id uuid REFERENCES public.service_skus(id),
  label text NOT NULL,
  is_required boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','DONE','NOT_DONE_WITH_REASON')),
  reason_code text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.4 job_photos
CREATE TABLE public.job_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sku_id uuid REFERENCES public.service_skus(id),
  slot_key text,
  storage_path text NOT NULL,
  upload_status text NOT NULL DEFAULT 'PENDING'
    CHECK (upload_status IN ('PENDING','UPLOADED','FAILED')),
  captured_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.5 job_issues
CREATE TABLE public.job_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  issue_type text NOT NULL
    CHECK (issue_type IN ('COULD_NOT_ACCESS','SAFETY_CONCERN','MISSING_SUPPLIES','EXCESSIVE_SCOPE','CUSTOMER_REQUESTED_CHANGE','WEATHER_RELATED','OTHER')),
  severity text NOT NULL DEFAULT 'MED'
    CHECK (severity IN ('LOW','MED','HIGH')),
  description text,
  created_by_user_id uuid NOT NULL,
  created_by_role text NOT NULL CHECK (created_by_role IN ('provider','customer','admin')),
  status text NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN','RESOLVED')),
  resolved_at timestamptz,
  resolved_by_admin_user_id uuid,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.6 job_events
CREATE TABLE public.job_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL,
  actor_role text NOT NULL CHECK (actor_role IN ('provider','admin','customer','system')),
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========================
-- 2. INDEXES
-- ========================
CREATE INDEX idx_jobs_provider_org ON public.jobs(provider_org_id);
CREATE INDEX idx_jobs_customer ON public.jobs(customer_id);
CREATE INDEX idx_jobs_property ON public.jobs(property_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_scheduled_date ON public.jobs(scheduled_date);
CREATE INDEX idx_job_skus_job ON public.job_skus(job_id);
CREATE INDEX idx_job_checklist_job ON public.job_checklist_items(job_id);
CREATE INDEX idx_job_photos_job ON public.job_photos(job_id);
CREATE INDEX idx_job_issues_job ON public.job_issues(job_id);
CREATE INDEX idx_job_events_job ON public.job_events(job_id);

-- ========================
-- 3. TRIGGERS
-- ========================

-- 3.1 updated_at triggers (reuse existing function)
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_checklist_items_updated_at
  BEFORE UPDATE ON public.job_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_issues_updated_at
  BEFORE UPDATE ON public.job_issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3.2 Protect job assignment fields from non-admin changes
CREATE OR REPLACE FUNCTION public.protect_job_assignment_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (OLD.provider_org_id IS DISTINCT FROM NEW.provider_org_id)
    OR (OLD.property_id IS DISTINCT FROM NEW.property_id)
    OR (OLD.customer_id IS DISTINCT FROM NEW.customer_id)
    OR (OLD.zone_id IS DISTINCT FROM NEW.zone_id)
  THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only admins can modify job assignment fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_job_assignment_fields
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.protect_job_assignment_fields();

-- 3.3 Enforce provider_summary max length
CREATE OR REPLACE FUNCTION public.enforce_provider_summary_length()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.provider_summary IS NOT NULL AND length(NEW.provider_summary) > 240 THEN
    RAISE EXCEPTION 'provider_summary must be 240 characters or fewer';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_provider_summary_length
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_provider_summary_length();

-- ========================
-- 4. RLS
-- ========================
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_events ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is a member of a provider org
CREATE OR REPLACE FUNCTION public.is_provider_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.provider_members
    WHERE provider_org_id = p_org_id
      AND user_id = auth.uid()
      AND status = 'ACTIVE'
  )
$$;

-- 4.1 jobs policies
CREATE POLICY "Admins can manage all jobs"
  ON public.jobs FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Providers can read own org jobs"
  ON public.jobs FOR SELECT
  USING (is_provider_org_member(provider_org_id));

CREATE POLICY "Providers can update own org jobs"
  ON public.jobs FOR UPDATE
  USING (is_provider_org_member(provider_org_id));

CREATE POLICY "Customers can read own jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid() = customer_id);

-- 4.2 job_skus policies
CREATE POLICY "Admins can manage all job_skus"
  ON public.job_skus FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Providers can read own org job_skus"
  ON public.job_skus FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_skus.job_id AND is_provider_org_member(j.provider_org_id)));

CREATE POLICY "Customers can read own job_skus"
  ON public.job_skus FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_skus.job_id AND j.customer_id = auth.uid()));

-- 4.3 job_checklist_items policies
CREATE POLICY "Admins can manage all checklist items"
  ON public.job_checklist_items FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Providers can read own org checklist items"
  ON public.job_checklist_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_checklist_items.job_id AND is_provider_org_member(j.provider_org_id)));

CREATE POLICY "Providers can update own org checklist items"
  ON public.job_checklist_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_checklist_items.job_id AND is_provider_org_member(j.provider_org_id)));

CREATE POLICY "Providers can insert own org checklist items"
  ON public.job_checklist_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_checklist_items.job_id AND is_provider_org_member(j.provider_org_id)));

CREATE POLICY "Customers can read own checklist items"
  ON public.job_checklist_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_checklist_items.job_id AND j.customer_id = auth.uid()));

-- 4.4 job_photos policies
CREATE POLICY "Admins can manage all job photos"
  ON public.job_photos FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Providers can read own org job photos"
  ON public.job_photos FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_photos.job_id AND is_provider_org_member(j.provider_org_id)));

CREATE POLICY "Providers can insert own org job photos"
  ON public.job_photos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_photos.job_id AND is_provider_org_member(j.provider_org_id)));

CREATE POLICY "Providers can update own org job photos"
  ON public.job_photos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_photos.job_id AND is_provider_org_member(j.provider_org_id)));

CREATE POLICY "Customers can read own job photos"
  ON public.job_photos FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_photos.job_id AND j.customer_id = auth.uid()));

-- 4.5 job_issues policies
CREATE POLICY "Admins can manage all job issues"
  ON public.job_issues FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Providers can read own org job issues"
  ON public.job_issues FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_issues.job_id AND is_provider_org_member(j.provider_org_id)));

CREATE POLICY "Providers can insert own org job issues"
  ON public.job_issues FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_issues.job_id AND is_provider_org_member(j.provider_org_id)));

CREATE POLICY "Customers can read own job issues"
  ON public.job_issues FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_issues.job_id AND j.customer_id = auth.uid()));

CREATE POLICY "Customers can insert own job issues"
  ON public.job_issues FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_issues.job_id AND j.customer_id = auth.uid()));

-- 4.6 job_events policies
CREATE POLICY "Admins can manage all job events"
  ON public.job_events FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Providers can read own org job events"
  ON public.job_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_events.job_id AND is_provider_org_member(j.provider_org_id)));

CREATE POLICY "Providers can insert own org job events"
  ON public.job_events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_events.job_id AND is_provider_org_member(j.provider_org_id)));

CREATE POLICY "Customers can read own job events"
  ON public.job_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_events.job_id AND j.customer_id = auth.uid()));

-- ========================
-- 5. STORAGE BUCKET
-- ========================
INSERT INTO storage.buckets (id, name, public) VALUES ('job-photos', 'job-photos', false);

-- Storage policies
CREATE POLICY "Authenticated can upload job photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'job-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Providers and admins can read job photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'job-photos'
    AND (
      has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.jobs j
        JOIN public.job_photos jp ON jp.job_id = j.id
        WHERE jp.storage_path = storage.objects.name
          AND is_provider_org_member(j.provider_org_id)
      )
      OR EXISTS (
        SELECT 1 FROM public.jobs j
        JOIN public.job_photos jp ON jp.job_id = j.id
        WHERE jp.storage_path = storage.objects.name
          AND j.customer_id = auth.uid()
      )
    )
  );

-- ========================
-- 6. RPCs
-- ========================

-- 6.1 start_job
CREATE OR REPLACE FUNCTION public.start_job(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_job jobs%ROWTYPE;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF NOT is_provider_org_member(v_job.provider_org_id) THEN
    RAISE EXCEPTION 'Not a member of the assigned provider org';
  END IF;

  IF v_job.status != 'NOT_STARTED' THEN
    RAISE EXCEPTION 'Job is not in NOT_STARTED status (current: %)', v_job.status;
  END IF;

  UPDATE jobs SET status = 'IN_PROGRESS', started_at = now() WHERE id = p_job_id;

  INSERT INTO job_events (job_id, actor_user_id, actor_role, event_type, metadata)
    VALUES (p_job_id, auth.uid(), 'provider', 'JOB_STARTED', jsonb_build_object('started_at', now()));

  RETURN jsonb_build_object('status', 'IN_PROGRESS', 'job_id', p_job_id, 'started_at', now());
END;
$$;

-- 6.2 report_job_issue
CREATE OR REPLACE FUNCTION public.report_job_issue(
  p_job_id uuid,
  p_issue_type text,
  p_severity text DEFAULT 'MED',
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_job jobs%ROWTYPE;
  v_issue_id uuid;
  v_role text;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  -- Determine caller role
  IF has_role(auth.uid(), 'admin') THEN
    v_role := 'admin';
  ELSIF is_provider_org_member(v_job.provider_org_id) THEN
    v_role := 'provider';
  ELSIF v_job.customer_id = auth.uid() THEN
    v_role := 'customer';
  ELSE
    RAISE EXCEPTION 'Not authorized to report issues on this job';
  END IF;

  IF v_job.status NOT IN ('IN_PROGRESS', 'ISSUE_REPORTED', 'NOT_STARTED') THEN
    RAISE EXCEPTION 'Cannot report issue on job with status %', v_job.status;
  END IF;

  INSERT INTO job_issues (job_id, issue_type, severity, description, created_by_user_id, created_by_role)
    VALUES (p_job_id, p_issue_type, p_severity, p_description, auth.uid(), v_role)
    RETURNING id INTO v_issue_id;

  UPDATE jobs SET status = 'ISSUE_REPORTED' WHERE id = p_job_id AND status != 'ISSUE_REPORTED';

  INSERT INTO job_events (job_id, actor_user_id, actor_role, event_type, metadata)
    VALUES (p_job_id, auth.uid(), v_role, 'ISSUE_REPORTED',
      jsonb_build_object('issue_id', v_issue_id, 'issue_type', p_issue_type, 'severity', p_severity));

  RETURN jsonb_build_object('issue_id', v_issue_id, 'status', 'ISSUE_REPORTED');
END;
$$;

-- 6.3 complete_job
CREATE OR REPLACE FUNCTION public.complete_job(
  p_job_id uuid,
  p_provider_summary text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_job jobs%ROWTYPE;
  v_missing_checklist int;
  v_missing_photos int;
  v_open_issues int;
  v_missing_details jsonb := '[]'::jsonb;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF NOT is_provider_org_member(v_job.provider_org_id) THEN
    RAISE EXCEPTION 'Not a member of the assigned provider org';
  END IF;

  IF v_job.status NOT IN ('IN_PROGRESS', 'ISSUE_REPORTED', 'PARTIAL_COMPLETE') THEN
    RAISE EXCEPTION 'Job cannot be completed from status %', v_job.status;
  END IF;

  -- Check required checklist items
  SELECT count(*) INTO v_missing_checklist
    FROM job_checklist_items
    WHERE job_id = p_job_id AND is_required = true AND status = 'PENDING';

  -- Check required photos (photos with a slot_key are required)
  SELECT count(*) INTO v_missing_photos
    FROM job_photos
    WHERE job_id = p_job_id AND slot_key IS NOT NULL AND upload_status != 'UPLOADED';

  -- Check open issues
  SELECT count(*) INTO v_open_issues
    FROM job_issues
    WHERE job_id = p_job_id AND status = 'OPEN';

  -- Build missing details
  IF v_missing_checklist > 0 THEN
    v_missing_details := v_missing_details || jsonb_build_object('type', 'checklist', 'count', v_missing_checklist);
  END IF;
  IF v_missing_photos > 0 THEN
    v_missing_details := v_missing_details || jsonb_build_object('type', 'photos', 'count', v_missing_photos);
  END IF;

  -- If checklist or photos incomplete, reject
  IF v_missing_checklist > 0 OR v_missing_photos > 0 THEN
    RETURN jsonb_build_object(
      'status', 'INCOMPLETE',
      'job_id', p_job_id,
      'missing', v_missing_details
    );
  END IF;

  -- If open issues exist, mark partial
  IF v_open_issues > 0 THEN
    UPDATE jobs SET status = 'PARTIAL_COMPLETE', provider_summary = p_provider_summary WHERE id = p_job_id;

    INSERT INTO job_events (job_id, actor_user_id, actor_role, event_type, metadata)
      VALUES (p_job_id, auth.uid(), 'provider', 'JOB_PARTIAL_COMPLETE',
        jsonb_build_object('open_issues', v_open_issues, 'provider_summary', p_provider_summary));

    RETURN jsonb_build_object(
      'status', 'PARTIAL_COMPLETE',
      'job_id', p_job_id,
      'open_issues', v_open_issues
    );
  END IF;

  -- All clear — complete
  UPDATE jobs SET
    status = 'COMPLETED',
    completed_at = now(),
    provider_summary = p_provider_summary
  WHERE id = p_job_id;

  INSERT INTO job_events (job_id, actor_user_id, actor_role, event_type, metadata)
    VALUES (p_job_id, auth.uid(), 'provider', 'JOB_COMPLETED',
      jsonb_build_object('completed_at', now(), 'provider_summary', p_provider_summary));

  RETURN jsonb_build_object('status', 'COMPLETED', 'job_id', p_job_id, 'completed_at', now());
END;
$$;

-- 6.4 admin_override_complete_job
CREATE OR REPLACE FUNCTION public.admin_override_complete_job(
  p_job_id uuid,
  p_reason text,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_job jobs%ROWTYPE;
  v_missing_checklist int;
  v_missing_photos int;
  v_open_issues int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_job FROM jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF v_job.status = 'COMPLETED' THEN
    RAISE EXCEPTION 'Job is already completed';
  END IF;

  -- Record what was missing
  SELECT count(*) INTO v_missing_checklist
    FROM job_checklist_items WHERE job_id = p_job_id AND is_required = true AND status = 'PENDING';
  SELECT count(*) INTO v_missing_photos
    FROM job_photos WHERE job_id = p_job_id AND slot_key IS NOT NULL AND upload_status != 'UPLOADED';
  SELECT count(*) INTO v_open_issues
    FROM job_issues WHERE job_id = p_job_id AND status = 'OPEN';

  UPDATE jobs SET status = 'COMPLETED', completed_at = now() WHERE id = p_job_id;

  INSERT INTO job_events (job_id, actor_user_id, actor_role, event_type, metadata)
    VALUES (p_job_id, auth.uid(), 'admin', 'ADMIN_OVERRIDE_COMPLETION',
      jsonb_build_object(
        'reason', p_reason,
        'note', p_note,
        'missing_checklist_count', v_missing_checklist,
        'missing_photo_count', v_missing_photos,
        'open_issue_count', v_open_issues
      ));

  INSERT INTO admin_audit_log (admin_user_id, entity_type, entity_id, action, after, reason)
    VALUES (auth.uid(), 'job', p_job_id, 'override_complete',
      jsonb_build_object('status', 'COMPLETED', 'missing_checklist', v_missing_checklist, 'missing_photos', v_missing_photos),
      p_reason);

  RETURN jsonb_build_object('status', 'COMPLETED', 'job_id', p_job_id, 'override', true);
END;
$$;

-- ========================
-- 7. REALTIME
-- ========================
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
