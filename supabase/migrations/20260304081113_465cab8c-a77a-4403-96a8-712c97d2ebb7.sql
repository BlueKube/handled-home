
-- P2: CHECK constraints on customer_reschedule_holds
ALTER TABLE public.customer_reschedule_holds
  ADD CONSTRAINT chk_reschedule_hold_type CHECK (hold_type IN ('auto_access_failure', 'customer_choice')),
  ADD CONSTRAINT chk_reschedule_hold_status CHECK (status IN ('held', 'confirmed', 'released', 'expired'));

-- P2: CHECK constraint on ops_exception_actions.action_type
ALTER TABLE public.ops_exception_actions
  ADD CONSTRAINT chk_exception_action_type CHECK (action_type IN (
    'reorder', 'move_day', 'swap_provider', 'convert_profile',
    'cancel_refund', 'snooze', 'escalate', 'reassign', 'undo',
    'note', 'manual_resolve'
  ));

-- P3: CHECK constraint on ops_exceptions.resolution_type
ALTER TABLE public.ops_exceptions
  ADD CONSTRAINT chk_exception_resolution_type CHECK (resolution_type IN (
    'reorder', 'move_day', 'swap_provider', 'convert_profile',
    'cancel_refund', 'auto_resolved', 'snoozed', NULL
  ));

-- P3: Index on customer_id for reschedule flow queries
CREATE INDEX idx_ops_exceptions_customer ON public.ops_exceptions (customer_id);

-- P2: Provider SELECT policy on attachments (can read own uploads)
CREATE POLICY "Providers can read own attachments"
  ON public.ops_exception_attachments
  FOR SELECT
  USING (uploaded_by_user_id = auth.uid());
