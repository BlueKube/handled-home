
-- ============================================================
-- Sprint D8: Private Customer Feedback + Provider Quality Score
-- ============================================================

-- 1) visit_feedback_quick — Immediate satisfaction check
CREATE TABLE public.visit_feedback_quick (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id),
  zone_id uuid REFERENCES public.zones(id),
  category text,
  outcome text NOT NULL DEFAULT 'GOOD',
  tags jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One quick feedback per job/customer
CREATE UNIQUE INDEX uq_visit_feedback_quick_job_customer ON public.visit_feedback_quick(job_id, customer_id);
CREATE INDEX idx_vfq_provider_org ON public.visit_feedback_quick(provider_org_id);
CREATE INDEX idx_vfq_zone ON public.visit_feedback_quick(zone_id);

-- Validation trigger for outcome
CREATE OR REPLACE FUNCTION public.trg_validate_feedback_quick_outcome()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.outcome NOT IN ('GOOD', 'ISSUE') THEN
    RAISE EXCEPTION 'outcome must be GOOD or ISSUE';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_feedback_quick_outcome
  BEFORE INSERT OR UPDATE ON public.visit_feedback_quick
  FOR EACH ROW EXECUTE FUNCTION public.trg_validate_feedback_quick_outcome();

-- RLS
ALTER TABLE public.visit_feedback_quick ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers insert own quick feedback"
  ON public.visit_feedback_quick FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers read own quick feedback"
  ON public.visit_feedback_quick FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Admins read all quick feedback"
  ON public.visit_feedback_quick FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) visit_ratings_private — Delayed anonymous provider review
CREATE TABLE public.visit_ratings_private (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id),
  zone_id uuid REFERENCES public.zones(id),
  category text,
  rating int NOT NULL,
  tags jsonb DEFAULT '[]'::jsonb,
  comment_private text,
  comment_public_candidate text,
  scheduled_release_at timestamptz NOT NULL,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_visit_ratings_private_job_customer ON public.visit_ratings_private(job_id, customer_id);
CREATE INDEX idx_vrp_provider_org ON public.visit_ratings_private(provider_org_id);
CREATE INDEX idx_vrp_zone ON public.visit_ratings_private(zone_id);
CREATE INDEX idx_vrp_scheduled_release ON public.visit_ratings_private(scheduled_release_at);

-- Rating validation trigger (1-5)
CREATE OR REPLACE FUNCTION public.trg_validate_private_rating()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_private_rating
  BEFORE INSERT OR UPDATE ON public.visit_ratings_private
  FOR EACH ROW EXECUTE FUNCTION public.trg_validate_private_rating();

-- RLS
ALTER TABLE public.visit_ratings_private ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers insert own private ratings"
  ON public.visit_ratings_private FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers update own private ratings"
  ON public.visit_ratings_private FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers read own private ratings"
  ON public.visit_ratings_private FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Admins read all private ratings"
  ON public.visit_ratings_private FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) provider_feedback_rollups — Weekly aggregated insights (provider-visible)
CREATE TABLE public.provider_feedback_rollups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  review_count int NOT NULL DEFAULT 0,
  avg_rating numeric(3,2),
  theme_counts jsonb DEFAULT '{}'::jsonb,
  summary_positive text,
  summary_improve text,
  published_at timestamptz,
  visibility_status text NOT NULL DEFAULT 'HIDDEN_INSUFFICIENT_N',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pfr_provider_org ON public.provider_feedback_rollups(provider_org_id);
CREATE INDEX idx_pfr_period ON public.provider_feedback_rollups(period_start, period_end);

-- RLS
ALTER TABLE public.provider_feedback_rollups ENABLE ROW LEVEL SECURITY;

-- Providers read own rollups
CREATE POLICY "Providers read own rollups"
  ON public.provider_feedback_rollups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.provider_members pm
      WHERE pm.provider_org_id = provider_feedback_rollups.provider_org_id
        AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all rollups"
  ON public.provider_feedback_rollups FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4) provider_quality_score_snapshots — Composite score
CREATE TABLE public.provider_quality_score_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id),
  score_window_days int NOT NULL DEFAULT 28,
  score numeric(5,2) NOT NULL DEFAULT 0,
  band text NOT NULL DEFAULT 'GREEN',
  components jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pqss_provider_org ON public.provider_quality_score_snapshots(provider_org_id);
CREATE INDEX idx_pqss_computed_at ON public.provider_quality_score_snapshots(computed_at);

-- Band validation
CREATE OR REPLACE FUNCTION public.trg_validate_quality_band()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.band NOT IN ('GREEN', 'YELLOW', 'ORANGE', 'RED') THEN
    RAISE EXCEPTION 'band must be GREEN, YELLOW, ORANGE, or RED';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_quality_band
  BEFORE INSERT OR UPDATE ON public.provider_quality_score_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.trg_validate_quality_band();

-- RLS
ALTER TABLE public.provider_quality_score_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers read own score snapshots"
  ON public.provider_quality_score_snapshots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.provider_members pm
      WHERE pm.provider_org_id = provider_quality_score_snapshots.provider_org_id
        AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all score snapshots"
  ON public.provider_quality_score_snapshots FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5) provider_quality_score_events — Audit trail
CREATE TABLE public.provider_quality_score_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id),
  old_score numeric(5,2),
  new_score numeric(5,2) NOT NULL,
  old_band text,
  new_band text NOT NULL,
  change_reasons jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pqse_provider_org ON public.provider_quality_score_events(provider_org_id);
CREATE INDEX idx_pqse_created_at ON public.provider_quality_score_events(created_at);

ALTER TABLE public.provider_quality_score_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers read own score events"
  ON public.provider_quality_score_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.provider_members pm
      WHERE pm.provider_org_id = provider_quality_score_events.provider_org_id
        AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all score events"
  ON public.provider_quality_score_events FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6) RPC: submit_quick_feedback — handles ISSUE routing
CREATE OR REPLACE FUNCTION public.submit_quick_feedback(
  p_job_id uuid,
  p_outcome text,
  p_tags jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid := auth.uid();
  v_job record;
  v_feedback_id uuid;
BEGIN
  -- Verify job belongs to caller and is completed
  SELECT id, provider_org_id, zone_id INTO v_job
  FROM jobs
  WHERE id = p_job_id AND customer_id = v_customer_id AND status = 'COMPLETED';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found or not completed';
  END IF;

  INSERT INTO visit_feedback_quick (job_id, customer_id, provider_org_id, zone_id, outcome, tags)
  VALUES (p_job_id, v_customer_id, v_job.provider_org_id, v_job.zone_id, p_outcome, p_tags)
  ON CONFLICT (job_id, customer_id) DO UPDATE
    SET outcome = EXCLUDED.outcome, tags = EXCLUDED.tags
  RETURNING id INTO v_feedback_id;

  -- If ISSUE, emit notification for admin
  IF p_outcome = 'ISSUE' THEN
    PERFORM emit_notification_event(
      p_event_type := 'ADMIN_FEEDBACK_ISSUE_FLAGGED',
      p_audience_type := 'ADMIN',
      p_payload := jsonb_build_object(
        'job_id', p_job_id,
        'customer_id', v_customer_id,
        'provider_org_id', v_job.provider_org_id,
        'zone_id', v_job.zone_id
      ),
      p_idempotency_key := 'feedback_issue_' || p_job_id || '_' || v_customer_id
    );
  END IF;

  RETURN jsonb_build_object('id', v_feedback_id, 'outcome', p_outcome);
END;
$$;

-- 7) RPC: submit_private_review — delayed anonymous provider review
CREATE OR REPLACE FUNCTION public.submit_private_review(
  p_job_id uuid,
  p_rating int,
  p_tags jsonb DEFAULT '[]'::jsonb,
  p_comment_public_candidate text DEFAULT NULL,
  p_comment_private text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid := auth.uid();
  v_job record;
  v_review_id uuid;
BEGIN
  -- Verify job belongs to caller and is completed
  SELECT id, provider_org_id, zone_id, completed_at INTO v_job
  FROM jobs
  WHERE id = p_job_id AND customer_id = v_customer_id AND status = 'COMPLETED';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found or not completed';
  END IF;

  -- scheduled_release_at already set during request scheduling; on direct submit, use now
  INSERT INTO visit_ratings_private (
    job_id, customer_id, provider_org_id, zone_id,
    rating, tags, comment_public_candidate, comment_private,
    scheduled_release_at, submitted_at
  )
  VALUES (
    p_job_id, v_customer_id, v_job.provider_org_id, v_job.zone_id,
    p_rating, p_tags, p_comment_public_candidate, p_comment_private,
    now(), now()
  )
  ON CONFLICT (job_id, customer_id) DO UPDATE
    SET rating = EXCLUDED.rating,
        tags = EXCLUDED.tags,
        comment_public_candidate = EXCLUDED.comment_public_candidate,
        comment_private = EXCLUDED.comment_private,
        submitted_at = now()
  RETURNING id INTO v_review_id;

  RETURN jsonb_build_object('id', v_review_id);
END;
$$;

-- 8) Seed notification templates for D8 flows
INSERT INTO public.notification_templates (
  template_key, event_type, audience_type, title_template, body_template,
  channels, priority, enabled
) VALUES
  ('customer_feedback_quick_requested', 'CUSTOMER_FEEDBACK_QUICK_REQUESTED', 'CUSTOMER',
   'How was your visit?', 'Your visit is complete — let us know how it went in one tap.',
   ARRAY['IN_APP', 'PUSH'], 'SERVICE', true),
  ('customer_provider_review_requested', 'CUSTOMER_PROVIDER_REVIEW_REQUESTED', 'CUSTOMER',
   'Private feedback request', 'Share private, anonymous feedback about a recent visit. Providers never see who said what.',
   ARRAY['IN_APP', 'PUSH'], 'SERVICE', true),
  ('admin_feedback_issue_flagged', 'ADMIN_FEEDBACK_ISSUE_FLAGGED', 'ADMIN',
   'Customer flagged issue', 'A customer reported something wasn''t right after a visit.',
   ARRAY['IN_APP'], 'CRITICAL', true),
  ('provider_quality_rollup_published', 'PROVIDER_QUALITY_ROLLUP_PUBLISHED', 'PROVIDER',
   'Weekly Quality Report', 'Your quality insights for the past week are ready to review.',
   ARRAY['IN_APP', 'PUSH'], 'SERVICE', true),
  ('admin_provider_risk_alert', 'ADMIN_PROVIDER_RISK_ALERT', 'ADMIN',
   'Provider quality alert', 'Provider score dropped to {{band}} — review recommended.',
   ARRAY['IN_APP'], 'CRITICAL', true)
ON CONFLICT (template_key) DO NOTHING;
