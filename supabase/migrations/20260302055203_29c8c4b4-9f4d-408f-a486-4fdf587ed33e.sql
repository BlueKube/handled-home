-- Phase 4 Fix: Add UNIQUE constraint on (org_id, doc_type) for upsert support
ALTER TABLE public.provider_compliance_documents
  ADD CONSTRAINT uq_compliance_doc_org_type UNIQUE (org_id, doc_type);

-- Phase 4 Fix: Add UPDATE RLS policy for providers on their own compliance docs
CREATE POLICY "Providers can update own compliance docs"
  ON public.provider_compliance_documents
  FOR UPDATE
  USING (
    org_id IN (
      SELECT po.id FROM public.provider_orgs po
      JOIN public.provider_members pm ON pm.provider_org_id = po.id
      WHERE pm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT po.id FROM public.provider_orgs po
      JOIN public.provider_members pm ON pm.provider_org_id = po.id
      WHERE pm.user_id = auth.uid()
    )
  );