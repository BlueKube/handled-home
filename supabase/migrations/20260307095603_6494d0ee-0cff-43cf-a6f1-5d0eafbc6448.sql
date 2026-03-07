-- Fix P1: Remove overly permissive first EXISTS clause that exposes all provider orgs
-- with active invites to any authenticated user.
-- Fix P2: Add REVOKE/GRANT for least-privilege on SECURITY DEFINER function.

CREATE OR REPLACE FUNCTION public.can_read_provider_org_via_byoc(p_user_id uuid, p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.byoc_activations
    WHERE provider_org_id = p_org_id AND customer_user_id = p_user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.byoc_invite_links bil
    WHERE bil.org_id = p_org_id AND bil.is_active = true
    AND EXISTS (
      SELECT 1 FROM public.customer_onboarding_progress cop
      WHERE cop.user_id = p_user_id
      AND (cop.metadata->>'byoc_token') IN (
        SELECT token FROM public.byoc_invite_links WHERE org_id = p_org_id AND is_active = true
      )
    )
  )
$$;

-- Revoke default public access, grant only to authenticated
REVOKE ALL ON FUNCTION public.can_read_provider_org_via_byoc(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_provider_org_via_byoc(uuid, uuid) TO authenticated;