-- P1: Validate clause_key values at DB level
ALTER TABLE public.provider_agreement_acceptance
  ADD CONSTRAINT chk_valid_clause_key CHECK (
    clause_key IN (
      'independent_contractor',
      'sku_levels',
      'proof_of_work',
      'no_side_payments',
      'professional_conduct',
      'schedule_discipline',
      'courtesy_upgrades',
      'byoc_integrity',
      'customer_data',
      'non_circumvention',
      'compliance_licensing',
      'termination_enforcement'
    )
  );