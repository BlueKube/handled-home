-- Missing indexes from spec Part D (corrected column names)

-- byoc_invite_events: lookup by invite + time ordering
CREATE INDEX IF NOT EXISTS idx_byoc_invite_events_invite_created
  ON public.byoc_invite_events (invite_id, created_at);

-- byoc_activations: provider dashboard queries
CREATE INDEX IF NOT EXISTS idx_byoc_activations_provider_activated
  ON public.byoc_activations (provider_org_id, activated_at);

-- provider_compliance_documents: org + status filtering
CREATE INDEX IF NOT EXISTS idx_provider_compliance_docs_org_status
  ON public.provider_compliance_documents (org_id, status);

-- provider_coverage: zone + request_status for eligibility checks
CREATE INDEX IF NOT EXISTS idx_provider_coverage_zone_status
  ON public.provider_coverage (zone_id, request_status);