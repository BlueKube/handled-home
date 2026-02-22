
-- ============================================================
-- Module 13.2: Founding Partner + Provider Growth Hub
-- ============================================================

-- 1. Enums
CREATE TYPE public.provider_application_status AS ENUM ('draft', 'submitted', 'approved', 'waitlisted', 'rejected');
CREATE TYPE public.zone_launch_status AS ENUM ('open', 'soft_launch', 'waitlist', 'not_supported');

-- 2. provider_applications table
CREATE TABLE public.provider_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  provider_org_id uuid REFERENCES public.provider_orgs(id),
  category text NOT NULL,
  zip_codes text[] NOT NULL DEFAULT '{}',
  status public.provider_application_status NOT NULL DEFAULT 'draft',
  waitlist_reason text,
  founding_partner boolean NOT NULL DEFAULT false,
  cohort_id uuid REFERENCES public.market_cohorts(id),
  program_id uuid REFERENCES public.referral_programs(id),
  launch_path_target integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_provider_applications_user ON public.provider_applications(user_id);
CREATE INDEX idx_provider_applications_status ON public.provider_applications(status);

-- 3. invite_scripts table
CREATE TABLE public.invite_scripts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id uuid REFERENCES public.referral_programs(id),
  tone text NOT NULL,
  body text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Add launch_status to market_cohorts
ALTER TABLE public.market_cohorts
  ADD COLUMN launch_status public.zone_launch_status NOT NULL DEFAULT 'waitlist';

-- 5. Enable RLS
ALTER TABLE public.provider_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_scripts ENABLE ROW LEVEL SECURITY;

-- 6. RLS: provider_applications
CREATE POLICY "Users can read own applications"
  ON public.provider_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON public.provider_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft applications"
  ON public.provider_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Admins full access applications"
  ON public.provider_applications FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. RLS: invite_scripts
CREATE POLICY "Authenticated can read active scripts"
  ON public.invite_scripts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins full access scripts"
  ON public.invite_scripts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. RPC: check_zone_readiness
CREATE OR REPLACE FUNCTION public.check_zone_readiness(
  p_zip_codes text[],
  p_category text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_best_status text := 'not_supported';
  v_matched_zones jsonb := '[]'::jsonb;
  v_zone record;
BEGIN
  -- Find zones that contain any of the provided zip codes
  FOR v_zone IN
    SELECT z.id, z.name, z.zip_codes AS zone_zips,
           COALESCE(mc.launch_status::text, 'waitlist') AS launch_status
    FROM zones z
    LEFT JOIN market_cohorts mc ON mc.zone_id = z.id AND mc.status = 'active'
    WHERE z.status = 'active'
      AND z.zip_codes && p_zip_codes
  LOOP
    v_matched_zones := v_matched_zones || jsonb_build_object(
      'zone_id', v_zone.id,
      'zone_name', v_zone.name,
      'launch_status', v_zone.launch_status
    );

    -- Determine best status (open > soft_launch > waitlist > not_supported)
    IF v_zone.launch_status = 'open' THEN
      v_best_status := 'open';
    ELSIF v_zone.launch_status = 'soft_launch' AND v_best_status != 'open' THEN
      v_best_status := 'soft_launch';
    ELSIF v_zone.launch_status = 'waitlist' AND v_best_status NOT IN ('open', 'soft_launch') THEN
      v_best_status := 'waitlist';
    END IF;
  END LOOP;

  v_result := jsonb_build_object(
    'status', v_best_status,
    'category', p_category,
    'matched_zones', v_matched_zones,
    'zip_codes_checked', to_jsonb(p_zip_codes)
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_zone_readiness(text[], text) TO authenticated;

-- 9. Trigger for updated_at on provider_applications
CREATE TRIGGER update_provider_applications_updated_at
  BEFORE UPDATE ON public.provider_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
