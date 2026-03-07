-- Drop the recursive policy
DROP POLICY IF EXISTS "Customers can read provider orgs via BYOC" ON public.provider_orgs;

-- Create a SECURITY DEFINER function to check BYOC access (bypasses RLS recursion)
CREATE OR REPLACE FUNCTION public.can_read_provider_org_via_byoc(p_user_id uuid, p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.byoc_invite_links WHERE org_id = p_org_id AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.byoc_activations WHERE provider_org_id = p_org_id AND customer_user_id = p_user_id
  )
$$;

-- Recreate policy using the security definer function
CREATE POLICY "Customers can read provider orgs via BYOC"
ON public.provider_orgs
FOR SELECT
TO authenticated
USING (
  public.can_read_provider_org_via_byoc(auth.uid(), id)
);