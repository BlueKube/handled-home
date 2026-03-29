-- Security fix: Remove overly permissive anon SELECT on byoc_invite_links
-- The old policy allowed anonymous users to enumerate ALL active invite tokens.
-- The get_byoc_invite_public RPC (SECURITY DEFINER) handles anon access with
-- token-based lookup, so direct table access for anon is not needed.
-- Authenticated provider users retain access through separate role-based policies.

DROP POLICY IF EXISTS "public_select_active_invite_links" ON public.byoc_invite_links;
