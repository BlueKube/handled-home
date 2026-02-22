
-- =============================================
-- Module 12: Support & Disputes — Database Migration
-- =============================================

-- Enums
CREATE TYPE public.support_ticket_type AS ENUM (
  'quality', 'missed_item', 'damage', 'billing', 'safety', 'routine_change', 'provider_promise_mismatch', 'general'
);

CREATE TYPE public.support_ticket_status AS ENUM (
  'open', 'awaiting_customer', 'awaiting_provider', 'in_review', 'resolved', 'escalated', 'closed', 'duplicate'
);

CREATE TYPE public.support_ticket_severity AS ENUM (
  'low', 'medium', 'high', 'critical'
);

CREATE TYPE public.support_offer_type AS ENUM (
  'credit', 'redo_intent', 'addon', 'refund', 'plan_change', 'review_by_time', 'no_action'
);

CREATE TYPE public.support_offer_status AS ENUM (
  'pending', 'accepted', 'rejected', 'expired', 'applied'
);

CREATE TYPE public.support_event_type AS ENUM (
  'ticket_created', 'offer_shown', 'offer_accepted', 'offer_rejected',
  'customer_added_info', 'provider_acknowledged', 'provider_evidence_uploaded',
  'provider_review_requested', 'provider_statement_added',
  'admin_resolved', 'admin_escalated', 'admin_hold_applied', 'admin_hold_released',
  'admin_credit_issued', 'admin_refund_issued', 'admin_redo_created',
  'admin_risk_flagged', 'admin_macro_applied',
  'ai_classified', 'ai_scored', 'sla_breached', 'auto_closed', 'duplicate_linked',
  'status_changed'
);

CREATE TYPE public.support_policy_scope_type AS ENUM (
  'global', 'zone', 'category', 'sku', 'provider'
);

-- =============================================
-- 1. support_tickets
-- =============================================
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  job_id uuid REFERENCES public.jobs(id),
  invoice_id uuid REFERENCES public.customer_invoices(id),
  provider_org_id uuid REFERENCES public.provider_orgs(id),
  zone_id uuid REFERENCES public.zones(id),
  ticket_type public.support_ticket_type NOT NULL DEFAULT 'general',
  severity public.support_ticket_severity NOT NULL DEFAULT 'medium',
  status public.support_ticket_status NOT NULL DEFAULT 'open',
  category text,
  sku_id uuid REFERENCES public.service_skus(id),
  customer_note text,
  resolution_summary text,
  policy_version_id uuid,
  policy_scope_chain jsonb,
  ai_classification jsonb,
  ai_evidence_score numeric,
  ai_risk_score numeric,
  ai_summary text,
  acquisition_source text,
  referring_provider_org_id uuid REFERENCES public.provider_orgs(id),
  partner_tier text,
  duplicate_of_ticket_id uuid REFERENCES public.support_tickets(id),
  sla_due_at timestamptz,
  resolved_at timestamptz,
  resolved_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_tickets_note_length CHECK (customer_note IS NULL OR length(customer_note) <= 500)
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Customer: read/insert own
CREATE POLICY "Customers read own tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers insert own tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers update own tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- Provider: read tickets tied to their org
CREATE POLICY "Providers read org tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (
    provider_org_id IS NOT NULL
    AND public.is_provider_org_member(provider_org_id)
  );

-- Admin: full access
CREATE POLICY "Admins full access tickets" ON public.support_tickets
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 2. support_ticket_offers (append-only)
-- =============================================
CREATE TABLE public.support_ticket_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  offer_type public.support_offer_type NOT NULL,
  status public.support_offer_status NOT NULL DEFAULT 'pending',
  amount_cents integer,
  description text,
  metadata jsonb,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_ticket_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own ticket offers" ON public.support_ticket_offers
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.customer_id = auth.uid()));

CREATE POLICY "Admins full access offers" ON public.support_ticket_offers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Providers read org ticket offers" ON public.support_ticket_offers
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id AND t.provider_org_id IS NOT NULL AND public.is_provider_org_member(t.provider_org_id)
  ));

-- =============================================
-- 3. support_ticket_events (append-only audit log)
-- =============================================
CREATE TABLE public.support_ticket_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  event_type public.support_event_type NOT NULL,
  actor_user_id uuid,
  actor_role text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_ticket_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own ticket events" ON public.support_ticket_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.customer_id = auth.uid()));

CREATE POLICY "Customers insert own ticket events" ON public.support_ticket_events
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.customer_id = auth.uid()));

CREATE POLICY "Providers read org ticket events" ON public.support_ticket_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id AND t.provider_org_id IS NOT NULL AND public.is_provider_org_member(t.provider_org_id)
  ));

CREATE POLICY "Providers insert org ticket events" ON public.support_ticket_events
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id AND t.provider_org_id IS NOT NULL AND public.is_provider_org_member(t.provider_org_id)
  ));

CREATE POLICY "Admins full access events" ON public.support_ticket_events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 4. support_attachments
-- =============================================
CREATE TABLE public.support_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  uploaded_by_user_id uuid NOT NULL,
  uploaded_by_role text NOT NULL,
  storage_path text NOT NULL,
  file_type text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own ticket attachments" ON public.support_attachments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.customer_id = auth.uid()));

CREATE POLICY "Customers insert own ticket attachments" ON public.support_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.customer_id = auth.uid())
  );

CREATE POLICY "Providers read org ticket attachments" ON public.support_attachments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id AND t.provider_org_id IS NOT NULL AND public.is_provider_org_member(t.provider_org_id)
  ));

CREATE POLICY "Providers insert org ticket attachments" ON public.support_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.provider_org_id IS NOT NULL AND public.is_provider_org_member(t.provider_org_id)
    )
  );

CREATE POLICY "Admins full access attachments" ON public.support_attachments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 5. support_policies (versioned, immutable)
-- =============================================
CREATE TABLE public.support_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version integer NOT NULL,
  name text NOT NULL,
  description text,
  dials jsonb NOT NULL DEFAULT '{}'::jsonb,
  change_reason text,
  created_by_user_id uuid,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access policies" ON public.support_policies
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Read-only for non-admins (policy resolution needs this)
CREATE POLICY "Authenticated read published policies" ON public.support_policies
  FOR SELECT TO authenticated
  USING (status = 'published');

-- =============================================
-- 6. support_policy_scopes
-- =============================================
CREATE TABLE public.support_policy_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type public.support_policy_scope_type NOT NULL,
  scope_ref_id uuid,
  scope_ref_key text,
  active_policy_id uuid NOT NULL REFERENCES public.support_policies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_policy_scopes ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_support_policy_scopes_updated_at
  BEFORE UPDATE ON public.support_policy_scopes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins full access policy scopes" ON public.support_policy_scopes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read policy scopes" ON public.support_policy_scopes
  FOR SELECT TO authenticated
  USING (true);

-- =============================================
-- 7. support_macros
-- =============================================
CREATE TABLE public.support_macros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  patch jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_macros ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_support_macros_updated_at
  BEFORE UPDATE ON public.support_macros
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins full access macros" ON public.support_macros
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 8. ai_inference_runs
-- =============================================
CREATE TABLE public.ai_inference_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  model_name text NOT NULL,
  input_summary text,
  output jsonb,
  classification jsonb,
  evidence_score numeric,
  risk_score numeric,
  duplicate_ticket_id uuid REFERENCES public.support_tickets(id),
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_inference_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access ai runs" ON public.ai_inference_runs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes for common queries
CREATE INDEX idx_support_tickets_customer ON public.support_tickets(customer_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_provider_org ON public.support_tickets(provider_org_id);
CREATE INDEX idx_support_tickets_job ON public.support_tickets(job_id);
CREATE INDEX idx_support_ticket_offers_ticket ON public.support_ticket_offers(ticket_id);
CREATE INDEX idx_support_ticket_events_ticket ON public.support_ticket_events(ticket_id);
CREATE INDEX idx_support_attachments_ticket ON public.support_attachments(ticket_id);
CREATE INDEX idx_ai_inference_runs_ticket ON public.ai_inference_runs(ticket_id);
