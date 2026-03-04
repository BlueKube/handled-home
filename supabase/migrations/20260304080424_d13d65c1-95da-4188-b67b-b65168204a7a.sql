
-- ============================================================
-- Sprint 8 Phase 1: Ops Exceptions Schema
-- ============================================================

-- 1. Enums
CREATE TYPE public.ops_exception_type AS ENUM (
  'window_at_risk',
  'service_week_at_risk',
  'provider_overload',
  'coverage_break',
  'provider_unavailable',
  'access_failure',
  'customer_reschedule',
  'weather_safety',
  'quality_block'
);

CREATE TYPE public.ops_exception_severity AS ENUM (
  'urgent',
  'soon',
  'watch'
);

CREATE TYPE public.ops_exception_status AS ENUM (
  'open',
  'acknowledged',
  'in_progress',
  'resolved',
  'snoozed',
  'escalated'
);

-- 2. ops_exceptions
CREATE TABLE public.ops_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exception_type public.ops_exception_type NOT NULL,
  severity public.ops_exception_severity NOT NULL,
  sla_target_at timestamptz,
  escalated_at timestamptz,
  status public.ops_exception_status NOT NULL DEFAULT 'open',
  visit_id uuid REFERENCES public.visits(id) ON DELETE SET NULL,
  provider_org_id uuid REFERENCES public.provider_orgs(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_date date,
  zone_id uuid REFERENCES public.zones(id) ON DELETE SET NULL,
  reason_summary text NOT NULL,
  reason_details jsonb DEFAULT '{}'::jsonb,
  assigned_to_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  resolved_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_type text,
  resolution_note text,
  source text NOT NULL DEFAULT 'system_detection',
  linked_exception_id uuid REFERENCES public.ops_exceptions(id) ON DELETE SET NULL,
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_ops_exceptions_open_per_visit
  ON public.ops_exceptions (visit_id, exception_type, scheduled_date)
  WHERE status NOT IN ('resolved');

CREATE INDEX idx_ops_exceptions_status_severity ON public.ops_exceptions (status, severity);
CREATE INDEX idx_ops_exceptions_visit_id ON public.ops_exceptions (visit_id);
CREATE INDEX idx_ops_exceptions_provider_date ON public.ops_exceptions (provider_org_id, scheduled_date);

CREATE TRIGGER set_ops_exceptions_updated_at
  BEFORE UPDATE ON public.ops_exceptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ops_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all ops exceptions"
  ON public.ops_exceptions FOR ALL TO authenticated
  USING (public.is_admin_member(auth.uid()));

CREATE POLICY "Service role has full access to ops exceptions"
  ON public.ops_exceptions FOR ALL TO service_role
  USING (true);

-- 3. ops_exception_actions
CREATE TABLE public.ops_exception_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exception_id uuid NOT NULL REFERENCES public.ops_exceptions(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_role text NOT NULL,
  before_state jsonb DEFAULT '{}'::jsonb,
  after_state jsonb DEFAULT '{}'::jsonb,
  reason_code text NOT NULL,
  reason_note text,
  is_freeze_override boolean NOT NULL DEFAULT false,
  is_undone boolean NOT NULL DEFAULT false,
  undone_at timestamptz,
  undone_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  undo_expires_at timestamptz,
  customer_notified boolean NOT NULL DEFAULT false,
  provider_notified boolean NOT NULL DEFAULT false,
  impact_summary jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ops_exception_actions_exception ON public.ops_exception_actions (exception_id);

ALTER TABLE public.ops_exception_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read ops exception actions"
  ON public.ops_exception_actions FOR SELECT TO authenticated
  USING (public.is_admin_member(auth.uid()));

CREATE POLICY "Service role has full access to ops exception actions"
  ON public.ops_exception_actions FOR ALL TO service_role
  USING (true);

-- 4. ops_exception_attachments
CREATE TABLE public.ops_exception_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exception_id uuid NOT NULL REFERENCES public.ops_exceptions(id) ON DELETE CASCADE,
  attachment_type text NOT NULL DEFAULT 'note',
  storage_path text,
  note_text text,
  uploaded_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_by_role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ops_exception_attachments_exception ON public.ops_exception_attachments (exception_id);

ALTER TABLE public.ops_exception_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all ops exception attachments"
  ON public.ops_exception_attachments FOR ALL TO authenticated
  USING (public.is_admin_member(auth.uid()));

CREATE POLICY "Providers can insert own attachments"
  ON public.ops_exception_attachments FOR INSERT TO authenticated
  WITH CHECK (uploaded_by_user_id = auth.uid());

CREATE POLICY "Service role has full access to ops exception attachments"
  ON public.ops_exception_attachments FOR ALL TO service_role
  USING (true);

-- 5. customer_reschedule_holds
CREATE TABLE public.customer_reschedule_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  held_date date NOT NULL,
  held_window_start time,
  held_window_end time,
  hold_type text NOT NULL DEFAULT 'customer_choice',
  status text NOT NULL DEFAULT 'held',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reschedule_holds_visit_status ON public.customer_reschedule_holds (visit_id, status);

CREATE TRIGGER set_customer_reschedule_holds_updated_at
  BEFORE UPDATE ON public.customer_reschedule_holds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.customer_reschedule_holds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can read own reschedule holds"
  ON public.customer_reschedule_holds FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Admins can manage all reschedule holds"
  ON public.customer_reschedule_holds FOR ALL TO authenticated
  USING (public.is_admin_member(auth.uid()));

CREATE POLICY "Service role has full access to reschedule holds"
  ON public.customer_reschedule_holds FOR ALL TO service_role
  USING (true);
