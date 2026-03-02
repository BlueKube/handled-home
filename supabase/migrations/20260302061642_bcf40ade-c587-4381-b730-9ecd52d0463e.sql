CREATE POLICY "provider_update_own_invite_links"
  ON public.byoc_invite_links FOR UPDATE TO authenticated
  USING (org_id IN (SELECT provider_org_id FROM public.provider_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT provider_org_id FROM public.provider_members WHERE user_id = auth.uid()));