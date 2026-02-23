
-- =============================================
-- Module 13.4: Viral Surfaces + Growth Event Bus
-- =============================================

-- 1. growth_events (append-only event bus)
CREATE TABLE public.growth_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  actor_role text NOT NULL,
  actor_id uuid NOT NULL,
  zone_id uuid REFERENCES public.zones(id),
  category text,
  sku_id uuid REFERENCES public.service_skus(id),
  cohort_id uuid REFERENCES public.market_cohorts(id),
  source_surface text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text NOT NULL UNIQUE
);

CREATE INDEX idx_growth_events_type_created ON public.growth_events (event_type, created_at DESC);
CREATE INDEX idx_growth_events_actor ON public.growth_events (actor_id);
CREATE INDEX idx_growth_events_zone_cat ON public.growth_events (zone_id, category);

ALTER TABLE public.growth_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own growth events"
  ON public.growth_events FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

CREATE POLICY "Users can read own growth events"
  ON public.growth_events FOR SELECT
  USING (auth.uid() = actor_id);

CREATE POLICY "Admins full access growth events"
  ON public.growth_events FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. share_cards
CREATE TABLE public.share_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  customer_id uuid NOT NULL,
  zone_id uuid REFERENCES public.zones(id),
  category text,
  share_code text NOT NULL UNIQUE,
  hero_photo_path text,
  asset_mode text NOT NULL DEFAULT 'after_only',
  brand_mode text NOT NULL DEFAULT 'minimal',
  show_first_name boolean NOT NULL DEFAULT false,
  show_neighborhood boolean NOT NULL DEFAULT false,
  checklist_bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  expiry_mode text NOT NULL DEFAULT 'default_30d',
  is_revoked boolean NOT NULL DEFAULT false,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_share_cards_customer ON public.share_cards (customer_id);
CREATE INDEX idx_share_cards_job ON public.share_cards (job_id);
CREATE INDEX idx_share_cards_code ON public.share_cards (share_code) WHERE is_revoked = false;

ALTER TABLE public.share_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own share cards"
  ON public.share_cards FOR ALL
  USING (auth.uid() = customer_id);

CREATE POLICY "Admins full access share cards"
  ON public.share_cards FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Public read for share landing (anon can read non-revoked, non-expired cards by share_code)
CREATE POLICY "Anyone can read active share cards"
  ON public.share_cards FOR SELECT
  USING (is_revoked = false AND expires_at > now());

-- 3. growth_surface_config
CREATE TABLE public.growth_surface_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id uuid NOT NULL REFERENCES public.zones(id),
  category text NOT NULL,
  surface_weights jsonb NOT NULL DEFAULT '{"receipt_share":1,"provider_share":1,"cross_pollination":0.5}'::jsonb,
  prompt_frequency_caps jsonb NOT NULL DEFAULT '{"share_per_job":1,"reminder_per_week":1}'::jsonb,
  incentive_visibility boolean NOT NULL DEFAULT false,
  share_brand_default text NOT NULL DEFAULT 'minimal',
  share_link_expiry_days integer NOT NULL DEFAULT 30,
  share_link_hard_cap_days integer NOT NULL DEFAULT 365,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (zone_id, category)
);

ALTER TABLE public.growth_surface_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read surface config"
  ON public.growth_surface_config FOR SELECT
  USING (true);

CREATE POLICY "Admins full access surface config"
  ON public.growth_surface_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. RPC: create_share_card
CREATE OR REPLACE FUNCTION public.create_share_card(
  p_job_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job record;
  v_existing record;
  v_photo_path text;
  v_bullets jsonb;
  v_share_code text;
  v_card record;
  v_dispute_count int;
BEGIN
  -- Verify caller owns the job
  SELECT j.id, j.customer_id, j.status, j.zone_id, j.completed_at
  INTO v_job
  FROM jobs j
  WHERE j.id = p_job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF v_job.customer_id != auth.uid() THEN
    RAISE EXCEPTION 'Not your job';
  END IF;

  IF v_job.status != 'COMPLETED' THEN
    RAISE EXCEPTION 'Job not completed';
  END IF;

  -- Check for unresolved disputes
  SELECT count(*) INTO v_dispute_count
  FROM customer_issues ci
  WHERE ci.job_id = p_job_id AND ci.status != 'resolved';

  IF v_dispute_count > 0 THEN
    RAISE EXCEPTION 'Cannot share: unresolved issue exists';
  END IF;

  -- Return existing card if already created
  SELECT * INTO v_existing
  FROM share_cards sc
  WHERE sc.job_id = p_job_id AND sc.customer_id = auth.uid() AND sc.is_revoked = false;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'id', v_existing.id, 'job_id', v_existing.job_id,
      'share_code', v_existing.share_code, 'hero_photo_path', v_existing.hero_photo_path,
      'asset_mode', v_existing.asset_mode, 'brand_mode', v_existing.brand_mode,
      'show_first_name', v_existing.show_first_name, 'show_neighborhood', v_existing.show_neighborhood,
      'checklist_bullets', v_existing.checklist_bullets, 'expires_at', v_existing.expires_at,
      'is_revoked', v_existing.is_revoked, 'created_at', v_existing.created_at
    );
  END IF;

  -- Pick best photo (after slot preferred, else latest)
  SELECT jp.storage_path INTO v_photo_path
  FROM job_photos jp
  WHERE jp.job_id = p_job_id AND jp.upload_status = 'CONFIRMED'
  ORDER BY
    CASE WHEN jp.slot_key = 'after' THEN 0 ELSE 1 END,
    jp.created_at DESC
  LIMIT 1;

  -- Pull 1-3 checklist bullets
  SELECT jsonb_agg(cl.label ORDER BY cl.created_at)
  INTO v_bullets
  FROM (
    SELECT label, created_at
    FROM job_checklist_items
    WHERE job_id = p_job_id AND status = 'DONE'
    ORDER BY created_at
    LIMIT 3
  ) cl;

  IF v_bullets IS NULL THEN
    v_bullets := '[]'::jsonb;
  END IF;

  -- Generate unique share code (8 chars)
  v_share_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  -- Determine category from job SKUs
  INSERT INTO share_cards (
    job_id, customer_id, zone_id, category, share_code,
    hero_photo_path, checklist_bullets
  )
  VALUES (
    p_job_id, auth.uid(), v_job.zone_id,
    (SELECT ss.category FROM job_skus js JOIN service_skus ss ON ss.id = js.sku_id WHERE js.job_id = p_job_id LIMIT 1),
    v_share_code, v_photo_path, v_bullets
  )
  RETURNING * INTO v_card;

  RETURN jsonb_build_object(
    'id', v_card.id, 'job_id', v_card.job_id,
    'share_code', v_card.share_code, 'hero_photo_path', v_card.hero_photo_path,
    'asset_mode', v_card.asset_mode, 'brand_mode', v_card.brand_mode,
    'show_first_name', v_card.show_first_name, 'show_neighborhood', v_card.show_neighborhood,
    'checklist_bullets', v_card.checklist_bullets, 'expires_at', v_card.expires_at,
    'is_revoked', v_card.is_revoked, 'created_at', v_card.created_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_share_card(uuid) TO authenticated;

-- 5. RPC: revoke_share_card
CREATE OR REPLACE FUNCTION public.revoke_share_card(
  p_share_card_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE share_cards
  SET is_revoked = true, revoked_at = now()
  WHERE id = p_share_card_id
    AND customer_id = auth.uid()
    AND is_revoked = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Share card not found or already revoked';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_share_card(uuid) TO authenticated;

-- 6. RPC: record_growth_event
CREATE OR REPLACE FUNCTION public.record_growth_event(
  p_event_type text,
  p_actor_role text,
  p_source_surface text,
  p_idempotency_key text,
  p_zone_id uuid DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_sku_id uuid DEFAULT NULL,
  p_cohort_id uuid DEFAULT NULL,
  p_context jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event record;
  v_valid_types text[] := ARRAY[
    'prompt_shown', 'share_initiated', 'share_completed',
    'landing_viewed', 'signup_completed', 'link_copied',
    'script_copied', 'qr_shown', 'cross_poll_shown',
    'cross_poll_initiated', 'milestone_share_shown'
  ];
BEGIN
  IF NOT (p_event_type = ANY(v_valid_types)) THEN
    RAISE EXCEPTION 'Invalid event_type: %', p_event_type;
  END IF;

  INSERT INTO growth_events (
    event_type, actor_role, actor_id, source_surface,
    idempotency_key, zone_id, category, sku_id, cohort_id, context
  )
  VALUES (
    p_event_type, p_actor_role, auth.uid(), p_source_surface,
    p_idempotency_key, p_zone_id, p_category, p_sku_id, p_cohort_id, p_context
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING * INTO v_event;

  IF v_event IS NULL THEN
    RETURN NULL; -- duplicate
  END IF;

  RETURN jsonb_build_object('id', v_event.id, 'event_type', v_event.event_type, 'created_at', v_event.created_at);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_growth_event(text, text, text, text, uuid, text, uuid, uuid, jsonb) TO authenticated;
-- Also allow anon for landing_viewed events
GRANT EXECUTE ON FUNCTION public.record_growth_event(text, text, text, text, uuid, text, uuid, uuid, jsonb) TO anon;

-- 7. RPC: get_share_card_public (for landing page, anon-safe)
CREATE OR REPLACE FUNCTION public.get_share_card_public(
  p_share_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card record;
  v_job record;
  v_first_name text;
  v_neighborhood text;
BEGIN
  SELECT sc.*, j.completed_at, j.zone_id as job_zone_id
  INTO v_card
  FROM share_cards sc
  JOIN jobs j ON j.id = sc.job_id
  WHERE sc.share_code = p_share_code
    AND sc.is_revoked = false
    AND sc.expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('expired', true);
  END IF;

  -- Get first name if allowed
  IF v_card.show_first_name THEN
    SELECT split_part(p.full_name, ' ', 1) INTO v_first_name
    FROM profiles p WHERE p.user_id = v_card.customer_id;
  END IF;

  -- Get neighborhood if allowed
  IF v_card.show_neighborhood THEN
    SELECT pr.city INTO v_neighborhood
    FROM properties pr WHERE pr.user_id = v_card.customer_id
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'share_code', v_card.share_code,
    'hero_photo_path', v_card.hero_photo_path,
    'asset_mode', v_card.asset_mode,
    'brand_mode', v_card.brand_mode,
    'category', v_card.category,
    'checklist_bullets', v_card.checklist_bullets,
    'completed_at', v_card.completed_at,
    'first_name', COALESCE(v_first_name, null),
    'neighborhood', COALESCE(v_neighborhood, null),
    'expired', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_share_card_public(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_share_card_public(text) TO authenticated;
