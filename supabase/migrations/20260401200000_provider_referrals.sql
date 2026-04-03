-- ============================================
-- Round 8, Phase 2, B3: Provider Referrals Table
-- ============================================
-- Stores provider-to-provider referrals from the "know someone?"
-- form shown after application. Supports the recruitment funnel
-- for building provider networks in pre-launch zones.
-- ============================================

CREATE TABLE IF NOT EXISTS public.provider_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_email TEXT NOT NULL,
  referred_name TEXT NOT NULL,
  referred_contact TEXT NOT NULL,
  referred_category TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'applied', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_referrals_zip_code ON public.provider_referrals(zip_code);
CREATE INDEX IF NOT EXISTS idx_provider_referrals_status ON public.provider_referrals(status);

COMMENT ON TABLE public.provider_referrals IS 'Provider-to-provider referrals from the post-application "know someone?" form. Used to build provider networks in pre-launch zones.';

-- RLS
ALTER TABLE public.provider_referrals ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a referral (form is accessible post-application)
CREATE POLICY anon_provider_referrals_insert ON public.provider_referrals
  FOR INSERT WITH CHECK (true);

-- Admin full access
CREATE POLICY admin_provider_referrals_all ON public.provider_referrals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_memberships WHERE user_id = auth.uid() AND is_active = true)
  );
