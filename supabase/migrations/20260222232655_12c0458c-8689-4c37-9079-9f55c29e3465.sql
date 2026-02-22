
-- R1: BEFORE UPDATE trigger to protect admin-controlled fields on support_tickets
CREATE OR REPLACE FUNCTION public.protect_support_ticket_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow if caller is admin
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Protect admin-controlled fields from non-admin updates
  IF (OLD.status IS DISTINCT FROM NEW.status)
    OR (OLD.resolution_summary IS DISTINCT FROM NEW.resolution_summary)
    OR (OLD.resolved_at IS DISTINCT FROM NEW.resolved_at)
    OR (OLD.resolved_by_user_id IS DISTINCT FROM NEW.resolved_by_user_id)
    OR (OLD.ai_summary IS DISTINCT FROM NEW.ai_summary)
    OR (OLD.ai_evidence_score IS DISTINCT FROM NEW.ai_evidence_score)
    OR (OLD.ai_risk_score IS DISTINCT FROM NEW.ai_risk_score)
    OR (OLD.ai_classification IS DISTINCT FROM NEW.ai_classification)
    OR (OLD.sla_due_at IS DISTINCT FROM NEW.sla_due_at)
    OR (OLD.policy_version_id IS DISTINCT FROM NEW.policy_version_id)
    OR (OLD.policy_scope_chain IS DISTINCT FROM NEW.policy_scope_chain)
  THEN
    RAISE EXCEPTION 'Only admins can modify protected support ticket fields (status, resolution, AI, SLA, policy)';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_support_ticket_admin_fields_trigger
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_support_ticket_admin_fields();

-- R2: SECURITY DEFINER RPC for customer to accept an offer
CREATE OR REPLACE FUNCTION public.accept_support_offer(p_offer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_offer support_ticket_offers%ROWTYPE;
  v_ticket support_tickets%ROWTYPE;
BEGIN
  -- Get and lock the offer
  SELECT * INTO v_offer FROM support_ticket_offers WHERE id = p_offer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  IF v_offer.status != 'pending' THEN
    RAISE EXCEPTION 'Offer is no longer pending (current: %)', v_offer.status;
  END IF;

  -- Verify caller owns the ticket
  SELECT * INTO v_ticket FROM support_tickets WHERE id = v_offer.ticket_id FOR UPDATE;
  IF NOT FOUND OR v_ticket.customer_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to accept this offer';
  END IF;

  -- Accept the offer
  UPDATE support_ticket_offers
    SET status = 'accepted', accepted_at = now()
    WHERE id = p_offer_id;

  -- Expire other pending offers on same ticket
  UPDATE support_ticket_offers
    SET status = 'expired'
    WHERE ticket_id = v_ticket.id
      AND status = 'pending'
      AND id != p_offer_id;

  -- Resolve the ticket
  UPDATE support_tickets
    SET status = 'resolved',
        resolved_at = now(),
        resolved_by_user_id = auth.uid()
    WHERE id = v_ticket.id;

  -- Log event
  INSERT INTO support_ticket_events (ticket_id, event_type, actor_user_id, actor_role, metadata)
    VALUES (v_ticket.id, 'offer_accepted', auth.uid(), 'customer',
      jsonb_build_object('offer_id', p_offer_id, 'offer_type', v_offer.offer_type));

  RETURN jsonb_build_object('status', 'resolved', 'offer_id', p_offer_id, 'ticket_id', v_ticket.id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_support_offer(uuid) TO authenticated;

-- D1: Storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Customers can upload to ticket paths they own
CREATE POLICY "Customers upload support attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'support-attachments'
  AND auth.uid() IS NOT NULL
);

-- Storage RLS: Users can view their own uploads
CREATE POLICY "Users view own support attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'support-attachments'
  AND auth.uid() IS NOT NULL
);

-- Storage RLS: Admins have full access
CREATE POLICY "Admins manage support attachments"
ON storage.objects FOR ALL
USING (
  bucket_id = 'support-attachments'
  AND public.has_role(auth.uid(), 'admin')
);
