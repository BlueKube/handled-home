-- P1-1: Allow public (anon + authenticated) to SELECT active invite links by token
-- This is needed so the /byoc/activate/:token page can display invite details
-- Only active links are visible; inactive/expired links return no rows
CREATE POLICY "public_select_active_invite_links"
  ON public.byoc_invite_links FOR SELECT TO anon, authenticated
  USING (is_active = true);