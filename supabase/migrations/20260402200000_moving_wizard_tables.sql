-- ============================================
-- Round 10, Phase 3, B7: Moving Wizard Tables
-- ============================================
-- property_transitions: tracks when a customer moves, captures
-- new address and new homeowner contact for warm handoff.
-- customer_leads: mirrors provider_leads pattern for customer-side
-- lead capture in uncovered zones.
-- ============================================

CREATE TABLE IF NOT EXISTS public.property_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  old_owner_user_id UUID NOT NULL REFERENCES auth.users(id),
  new_owner_name TEXT,
  new_owner_email TEXT,
  new_owner_phone TEXT,
  move_date DATE NOT NULL,
  new_address TEXT,
  new_zip TEXT,
  new_zip_covered BOOLEAN,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled')),
  keep_services_until_move BOOLEAN NOT NULL DEFAULT true,
  notify_on_launch BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_transitions_user
  ON public.property_transitions(old_owner_user_id);

COMMENT ON TABLE public.property_transitions IS 'Tracks customer moves. Captures new address for plan transfer and new homeowner contact for warm handoff.';

-- RLS
ALTER TABLE public.property_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY property_transitions_own ON public.property_transitions
  FOR ALL USING (old_owner_user_id = auth.uid());

CREATE POLICY admin_property_transitions_all ON public.property_transitions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_memberships WHERE user_id = auth.uid() AND is_active = true)
  );

-- ─── Customer Leads ───

CREATE TABLE IF NOT EXISTS public.customer_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  phone TEXT,
  zip_code TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('moving', 'waitlist', 'referral')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'subscribed', 'declined')),
  notify_on_launch BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_leads_email
  ON public.customer_leads(email);

CREATE INDEX IF NOT EXISTS idx_customer_leads_zip
  ON public.customer_leads(zip_code);

COMMENT ON TABLE public.customer_leads IS 'Customer leads for uncovered zones — from moving wizard, waitlist, and referrals. Notified when zone launches.';

-- RLS
ALTER TABLE public.customer_leads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form or authenticated user)
CREATE POLICY customer_leads_insert ON public.customer_leads
  FOR INSERT WITH CHECK (true);

-- Admin full access
CREATE POLICY admin_customer_leads_all ON public.customer_leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_memberships WHERE user_id = auth.uid() AND is_active = true)
  );
