-- Allow authenticated users to read provider_orgs that are referenced by:
-- 1. Active BYOC invite links (for onboarding flow)
-- 2. Their own BYOC activations (for dashboard HomeTeamCard)
CREATE POLICY "Customers can read provider orgs via BYOC"
ON public.provider_orgs
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT org_id FROM public.byoc_invite_links WHERE is_active = true
  )
  OR
  id IN (
    SELECT provider_org_id FROM public.byoc_activations WHERE customer_user_id = auth.uid()
  )
);