
-- =============================================
-- Module 11: Billing & Payouts — Full Schema
-- =============================================

-- =============================================
-- 1. Customer Tables
-- =============================================

-- 1.1 customer_payment_methods
CREATE TABLE public.customer_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  processor_ref text NOT NULL,
  brand text,
  last4 text,
  exp_month int,
  exp_year int,
  is_default boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_customer_payment_methods_updated_at
  BEFORE UPDATE ON public.customer_payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 1.2 customer_invoices
CREATE TABLE public.customer_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id),
  invoice_type text NOT NULL DEFAULT 'SUBSCRIPTION',
  cycle_start_at timestamptz,
  cycle_end_at timestamptz,
  subtotal_cents int NOT NULL DEFAULT 0,
  credits_applied_cents int NOT NULL DEFAULT 0,
  total_cents int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'UPCOMING',
  processor_invoice_id text,
  idempotency_key text UNIQUE,
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_invoices ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_customer_invoices_updated_at
  BEFORE UPDATE ON public.customer_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 1.3 customer_invoice_line_items
CREATE TABLE public.customer_invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.customer_invoices(id) ON DELETE CASCADE,
  label text NOT NULL,
  type text NOT NULL DEFAULT 'PLAN',
  amount_cents int NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_invoice_line_items ENABLE ROW LEVEL SECURITY;

-- 1.4 customer_payments
CREATE TABLE public.customer_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.customer_invoices(id),
  customer_id uuid NOT NULL,
  amount_cents int NOT NULL DEFAULT 0,
  processor_payment_id text,
  status text NOT NULL DEFAULT 'INITIATED',
  attempt_number int NOT NULL DEFAULT 1,
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;

-- 1.5 customer_ledger_events (append-only)
CREATE TABLE public.customer_ledger_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  event_type text NOT NULL,
  invoice_id uuid REFERENCES public.customer_invoices(id),
  amount_cents int NOT NULL DEFAULT 0,
  balance_after_cents int NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_ledger_events ENABLE ROW LEVEL SECURITY;

-- 1.6 customer_credits
CREATE TABLE public.customer_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  amount_cents int NOT NULL DEFAULT 0,
  reason text,
  issued_by_admin_user_id uuid,
  applied_to_invoice_id uuid REFERENCES public.customer_invoices(id),
  status text NOT NULL DEFAULT 'AVAILABLE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_credits ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_customer_credits_updated_at
  BEFORE UPDATE ON public.customer_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. Provider Tables
-- =============================================

-- 2.1 provider_payout_accounts
CREATE TABLE public.provider_payout_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id) UNIQUE,
  processor_account_id text,
  status text NOT NULL DEFAULT 'NOT_READY',
  onboarding_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_payout_accounts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_provider_payout_accounts_updated_at
  BEFORE UPDATE ON public.provider_payout_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2.2 provider_earnings
CREATE TABLE public.provider_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id),
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  base_amount_cents int NOT NULL DEFAULT 0,
  modifier_cents int NOT NULL DEFAULT 0,
  total_cents int NOT NULL DEFAULT 0,
  hold_until timestamptz,
  status text NOT NULL DEFAULT 'EARNED',
  payout_id uuid,
  hold_reason text,
  idempotency_key text GENERATED ALWAYS AS (provider_org_id::text || '_' || job_id::text) STORED UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_earnings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_provider_earnings_updated_at
  BEFORE UPDATE ON public.provider_earnings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2.3 payout_runs (needed before provider_payouts FK)
CREATE TABLE public.payout_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'PENDING',
  started_at timestamptz,
  completed_at timestamptz,
  earnings_count int NOT NULL DEFAULT 0,
  total_cents int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payout_runs ENABLE ROW LEVEL SECURITY;

-- 2.4 provider_payouts
CREATE TABLE public.provider_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id),
  payout_run_id uuid REFERENCES public.payout_runs(id),
  total_cents int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'INITIATED',
  processor_payout_id text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_payouts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_provider_payouts_updated_at
  BEFORE UPDATE ON public.provider_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add FK from provider_earnings.payout_id -> provider_payouts.id
ALTER TABLE public.provider_earnings
  ADD CONSTRAINT provider_earnings_payout_id_fkey
  FOREIGN KEY (payout_id) REFERENCES public.provider_payouts(id);

-- 2.5 provider_payout_line_items
CREATE TABLE public.provider_payout_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid NOT NULL REFERENCES public.provider_payouts(id) ON DELETE CASCADE,
  earning_id uuid NOT NULL REFERENCES public.provider_earnings(id) UNIQUE,
  amount_cents int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_payout_line_items ENABLE ROW LEVEL SECURITY;

-- 2.6 provider_holds
CREATE TABLE public.provider_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id),
  earning_id uuid NOT NULL REFERENCES public.provider_earnings(id),
  hold_type text NOT NULL DEFAULT 'AUTO',
  severity text NOT NULL DEFAULT 'MED',
  reason_category text,
  status text NOT NULL DEFAULT 'ACTIVE',
  released_by_admin_user_id uuid,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_holds ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_provider_holds_updated_at
  BEFORE UPDATE ON public.provider_holds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2.7 provider_hold_context
CREATE TABLE public.provider_hold_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hold_id uuid NOT NULL REFERENCES public.provider_holds(id),
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id),
  reason_category text,
  note text,
  photo_storage_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_hold_context ENABLE ROW LEVEL SECURITY;

-- Note validation trigger for 200 char limit
CREATE OR REPLACE FUNCTION public.validate_hold_context_note_length()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.note IS NOT NULL AND length(NEW.note) > 200 THEN
    RAISE EXCEPTION 'Hold context note must be 200 characters or fewer';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_hold_context_note_length
  BEFORE INSERT OR UPDATE ON public.provider_hold_context
  FOR EACH ROW EXECUTE FUNCTION public.validate_hold_context_note_length();

-- =============================================
-- 3. System Tables
-- =============================================

-- 3.1 payment_webhook_events
CREATE TABLE public.payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processor_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- 3.2 billing_runs
CREATE TABLE public.billing_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_runs ENABLE ROW LEVEL SECURITY;

-- 3.3 admin_adjustments
CREATE TABLE public.admin_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  adjustment_type text NOT NULL,
  amount_cents int NOT NULL DEFAULT 0,
  reason text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_adjustments ENABLE ROW LEVEL SECURITY;

-- 3.4 billing_exceptions
CREATE TABLE public.billing_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  severity text NOT NULL DEFAULT 'MED',
  entity_type text NOT NULL,
  entity_id uuid,
  customer_id uuid,
  provider_org_id uuid,
  status text NOT NULL DEFAULT 'OPEN',
  next_action text,
  resolved_by_admin_user_id uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_exceptions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_billing_exceptions_updated_at
  BEFORE UPDATE ON public.billing_exceptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 4. Indexes
-- =============================================
CREATE INDEX idx_customer_invoices_customer_id ON public.customer_invoices(customer_id);
CREATE INDEX idx_customer_invoices_status ON public.customer_invoices(status);
CREATE INDEX idx_customer_payments_invoice_id ON public.customer_payments(invoice_id);
CREATE INDEX idx_customer_payments_customer_id ON public.customer_payments(customer_id);
CREATE INDEX idx_customer_ledger_events_customer_id ON public.customer_ledger_events(customer_id);
CREATE INDEX idx_customer_credits_customer_id ON public.customer_credits(customer_id);
CREATE INDEX idx_provider_earnings_org_id ON public.provider_earnings(provider_org_id);
CREATE INDEX idx_provider_earnings_status ON public.provider_earnings(status);
CREATE INDEX idx_provider_payouts_org_id ON public.provider_payouts(provider_org_id);
CREATE INDEX idx_provider_holds_org_id ON public.provider_holds(provider_org_id);
CREATE INDEX idx_provider_holds_earning_id ON public.provider_holds(earning_id);
CREATE INDEX idx_billing_exceptions_status ON public.billing_exceptions(status);
CREATE INDEX idx_billing_exceptions_type ON public.billing_exceptions(type);

-- =============================================
-- 5. RLS Policies
-- =============================================

-- customer_payment_methods
CREATE POLICY "Customers read own payment methods"
  ON public.customer_payment_methods FOR SELECT
  USING (customer_id = auth.uid());
CREATE POLICY "Customers insert own payment methods"
  ON public.customer_payment_methods FOR INSERT
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Customers update own payment methods"
  ON public.customer_payment_methods FOR UPDATE
  USING (customer_id = auth.uid());
CREATE POLICY "Admins manage all payment methods"
  ON public.customer_payment_methods FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- customer_invoices
CREATE POLICY "Customers read own invoices"
  ON public.customer_invoices FOR SELECT
  USING (customer_id = auth.uid());
CREATE POLICY "Admins manage all invoices"
  ON public.customer_invoices FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- customer_invoice_line_items
CREATE POLICY "Customers read own invoice line items"
  ON public.customer_invoice_line_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.customer_invoices ci
    WHERE ci.id = invoice_id AND ci.customer_id = auth.uid()
  ));
CREATE POLICY "Admins manage all invoice line items"
  ON public.customer_invoice_line_items FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- customer_payments
CREATE POLICY "Customers read own payments"
  ON public.customer_payments FOR SELECT
  USING (customer_id = auth.uid());
CREATE POLICY "Admins manage all payments"
  ON public.customer_payments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- customer_ledger_events (append-only; no update/delete for anyone)
CREATE POLICY "Customers read own ledger events"
  ON public.customer_ledger_events FOR SELECT
  USING (customer_id = auth.uid());
CREATE POLICY "Admins read all ledger events"
  ON public.customer_ledger_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- customer_credits
CREATE POLICY "Customers read own credits"
  ON public.customer_credits FOR SELECT
  USING (customer_id = auth.uid());
CREATE POLICY "Admins manage all credits"
  ON public.customer_credits FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- provider_payout_accounts
CREATE POLICY "Providers read own payout account"
  ON public.provider_payout_accounts FOR SELECT
  USING (public.is_provider_org_member(provider_org_id));
CREATE POLICY "Admins manage all payout accounts"
  ON public.provider_payout_accounts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- provider_earnings
CREATE POLICY "Providers read own earnings"
  ON public.provider_earnings FOR SELECT
  USING (public.is_provider_org_member(provider_org_id));
CREATE POLICY "Admins manage all earnings"
  ON public.provider_earnings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- provider_payouts
CREATE POLICY "Providers read own payouts"
  ON public.provider_payouts FOR SELECT
  USING (public.is_provider_org_member(provider_org_id));
CREATE POLICY "Admins manage all payouts"
  ON public.provider_payouts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- provider_payout_line_items
CREATE POLICY "Providers read own payout line items"
  ON public.provider_payout_line_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.provider_payouts pp
    WHERE pp.id = payout_id AND public.is_provider_org_member(pp.provider_org_id)
  ));
CREATE POLICY "Admins manage all payout line items"
  ON public.provider_payout_line_items FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- provider_holds
CREATE POLICY "Providers read own holds"
  ON public.provider_holds FOR SELECT
  USING (public.is_provider_org_member(provider_org_id));
CREATE POLICY "Admins manage all holds"
  ON public.provider_holds FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- provider_hold_context
CREATE POLICY "Providers read own hold context"
  ON public.provider_hold_context FOR SELECT
  USING (public.is_provider_org_member(provider_org_id));
CREATE POLICY "Providers insert own hold context"
  ON public.provider_hold_context FOR INSERT
  WITH CHECK (public.is_provider_org_member(provider_org_id));
CREATE POLICY "Admins manage all hold context"
  ON public.provider_hold_context FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- payment_webhook_events (service role only — no direct user access)
-- No policies; only edge functions with service role key write/read these.

-- billing_runs (admin only)
CREATE POLICY "Admins manage billing runs"
  ON public.billing_runs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- payout_runs (admin only)
CREATE POLICY "Admins manage payout runs"
  ON public.payout_runs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- admin_adjustments (admin only)
CREATE POLICY "Admins manage adjustments"
  ON public.admin_adjustments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- billing_exceptions (admin only)
CREATE POLICY "Admins manage exceptions"
  ON public.billing_exceptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
