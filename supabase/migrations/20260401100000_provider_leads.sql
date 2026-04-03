-- ============================================
-- Round 8, Phase 1, B1: Provider Leads Table
-- ============================================
-- Stores provider interest from the browse page lead capture form,
-- provider-to-provider referrals, and manual admin entry.
-- Supports the full provider acquisition funnel from first touch
-- through zone launch notification.
-- ============================================

CREATE TABLE IF NOT EXISTS public.provider_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  source TEXT NOT NULL CHECK (source IN ('browse', 'referral', 'manual')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'applied', 'declined', 'notified')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_provider_leads_zip_code ON public.provider_leads(zip_code);
CREATE INDEX IF NOT EXISTS idx_provider_leads_status ON public.provider_leads(status);

COMMENT ON TABLE public.provider_leads IS 'Provider interest leads from browse page, referrals, and manual entry. Used for zone launch notifications and conversion tracking.';

-- Updated_at trigger
CREATE TRIGGER set_provider_leads_updated_at
  BEFORE UPDATE ON public.provider_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.provider_leads ENABLE ROW LEVEL SECURITY;

-- Anon insert: anyone can submit a lead from the public browse page
CREATE POLICY anon_provider_leads_insert ON public.provider_leads
  FOR INSERT WITH CHECK (true);

-- Admin full access: read, update, delete
CREATE POLICY admin_provider_leads_all ON public.provider_leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_memberships WHERE user_id = auth.uid() AND is_active = true)
  );
