-- ============================================
-- SECURITY: Tighten lead table INSERT policies
-- ============================================
-- provider_leads: public lead capture form — keep anon insert but add validation
-- provider_referrals: only authenticated users should insert (provider Apply page)
-- customer_leads: only authenticated users should insert (Moving page)

-- ─── 1. provider_leads: Replace open INSERT with validated INSERT ───

DROP POLICY IF EXISTS anon_provider_leads_insert ON public.provider_leads;

CREATE POLICY validated_provider_leads_insert ON public.provider_leads
  FOR INSERT WITH CHECK (
    -- Email must look like an email (basic format check)
    email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    -- ZIP must be exactly 5 digits
    AND zip_code ~ '^\d{5}$'
    -- Source must be one of the allowed values (belt-and-suspenders with CHECK constraint)
    AND source IN ('browse', 'referral', 'manual')
  );

-- ─── 2. provider_referrals: Require authentication ───

DROP POLICY IF EXISTS anon_provider_referrals_insert ON public.provider_referrals;

CREATE POLICY auth_provider_referrals_insert ON public.provider_referrals
  FOR INSERT WITH CHECK (
    -- Must be logged in
    auth.uid() IS NOT NULL
    -- ZIP must be exactly 5 digits
    AND zip_code ~ '^\d{5}$'
  );

-- ─── 3. customer_leads: Require authentication ───

DROP POLICY IF EXISTS customer_leads_insert ON public.customer_leads;

CREATE POLICY auth_customer_leads_insert ON public.customer_leads
  FOR INSERT WITH CHECK (
    -- Must be logged in
    auth.uid() IS NOT NULL
    -- Email must look like an email
    AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    -- ZIP must be exactly 5 digits
    AND zip_code ~ '^\d{5}$'
  );