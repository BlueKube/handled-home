
-- ============================================================
-- Sprint 5: Zone Expansion (2B-14, 2B-15, 2B-16)
-- ============================================================

-- ============================================================
-- 2B-14: Expansion Suggestions
-- ============================================================
CREATE TABLE public.expansion_suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id uuid NOT NULL REFERENCES public.zones(id),
  suggestion_type text NOT NULL, -- 'split_zone' | 'recruit_provider' | 'raise_price' | 'protect_quality'
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'implemented'
  priority text NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'critical'
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb, -- capacity_util_pct, waitlist_count, avg_drive_time_min, support_ticket_rate
  recommendation text NOT NULL, -- human-readable recommendation
  explain_admin text, -- detailed explanation for admin
  proposed_action jsonb DEFAULT '{}'::jsonb, -- proposed zone boundaries, settings, etc.
  reviewed_by_admin_user_id uuid,
  reviewed_at timestamptz,
  review_note text,
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expansion_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage expansion suggestions"
  ON public.expansion_suggestions FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_expansion_suggestions_zone_status ON public.expansion_suggestions (zone_id, status);

-- ============================================================
-- 2B-15: Waitlist System
-- ============================================================
CREATE TABLE public.waitlist_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  zip_code text NOT NULL,
  zone_id uuid REFERENCES public.zones(id), -- NULL if no zone matches yet
  source text NOT NULL DEFAULT 'website', -- 'website' | 'share_landing' | 'provider_invite' | 'admin'
  referral_code text, -- optional referral code used
  status text NOT NULL DEFAULT 'waiting', -- 'waiting' | 'notified' | 'converted' | 'unsubscribed'
  notified_at timestamptz,
  converted_at timestamptz,
  converted_user_id uuid, -- links to auth user after signup
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email, zip_code) -- prevent duplicate waitlist entries
);

ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;

-- Public can insert (signup), only admins can read/manage
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist_entries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage waitlist"
  ON public.waitlist_entries FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_waitlist_zip ON public.waitlist_entries (zip_code);
CREATE INDEX idx_waitlist_zone_status ON public.waitlist_entries (zone_id, status);

-- ============================================================
-- 2B-16: Auto-zone creation support
-- Add draft_source to zones for tracking auto-created zones
-- ============================================================
-- RPC: Count waitlist entries per zip code for expansion analysis
CREATE OR REPLACE FUNCTION public.get_waitlist_summary()
RETURNS TABLE(zip_code text, zone_id uuid, zone_name text, entry_count bigint, earliest_entry timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    w.zip_code,
    w.zone_id,
    z.name as zone_name,
    count(*) as entry_count,
    min(w.created_at) as earliest_entry
  FROM waitlist_entries w
  LEFT JOIN zones z ON z.id = w.zone_id
  WHERE w.status = 'waiting'
  GROUP BY w.zip_code, w.zone_id, z.name
  ORDER BY entry_count DESC;
$$;

-- RPC: Notify waitlist entries when a zone launches
CREATE OR REPLACE FUNCTION public.notify_waitlist_on_launch(p_zone_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_zone record;
  v_count int := 0;
  v_entry record;
BEGIN
  SELECT * INTO v_zone FROM zones WHERE id = p_zone_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'reason', 'zone_not_found');
  END IF;

  FOR v_entry IN
    SELECT * FROM waitlist_entries
    WHERE zone_id = p_zone_id AND status = 'waiting'
  LOOP
    UPDATE waitlist_entries
    SET status = 'notified', notified_at = now(), updated_at = now()
    WHERE id = v_entry.id;
    
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('status', 'ok', 'notified_count', v_count, 'zone_name', v_zone.name);
END;
$$;

-- RPC: Review an expansion suggestion
CREATE OR REPLACE FUNCTION public.review_expansion_suggestion(
  p_suggestion_id uuid,
  p_decision text, -- 'approved' | 'rejected'
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE expansion_suggestions
  SET status = p_decision,
      reviewed_by_admin_user_id = auth.uid(),
      reviewed_at = now(),
      review_note = p_note,
      updated_at = now()
  WHERE id = p_suggestion_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suggestion not found or not pending';
  END IF;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_expansion_suggestions_updated_at
  BEFORE UPDATE ON public.expansion_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_waitlist_entries_updated_at
  BEFORE UPDATE ON public.waitlist_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
