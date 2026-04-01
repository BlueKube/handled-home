-- ============================================
-- Round 9, Phase 3, B5: Auto-Notify Zone Leads on Launch
-- ============================================
-- When a market_zone_category_state transitions to SOFT_LAUNCH or OPEN,
-- automatically mark matching provider leads as notified.
-- ============================================

-- Add notified_at timestamp to provider_leads
ALTER TABLE public.provider_leads
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

-- Function: auto-notify matching leads when a zone category goes live
CREATE OR REPLACE FUNCTION public.auto_notify_zone_leads()
RETURNS TRIGGER AS $$
DECLARE
  v_zone_zips TEXT[];
  v_notified_count INT;
BEGIN
  -- Only fire when status changes TO soft_launch or open
  IF NEW.status NOT IN ('SOFT_LAUNCH', 'OPEN') THEN
    RETURN NEW;
  END IF;

  -- Skip if status didn't actually change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get the zone's ZIP codes
  SELECT zip_codes INTO v_zone_zips
  FROM public.zones
  WHERE id = NEW.zone_id;

  IF v_zone_zips IS NULL OR array_length(v_zone_zips, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Update matching leads: new → notified
  UPDATE public.provider_leads
  SET status = 'notified',
      notified_at = now()
  WHERE zip_code = ANY(v_zone_zips)
    AND status = 'new';

  GET DIAGNOSTICS v_notified_count = ROW_COUNT;

  -- Log to notification_events if the table exists (optional integration)
  -- For now, the notified_at timestamp is the audit trail

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on market_zone_category_state status changes
DROP TRIGGER IF EXISTS trg_auto_notify_zone_leads ON public.market_zone_category_state;
CREATE TRIGGER trg_auto_notify_zone_leads
  AFTER UPDATE OF status ON public.market_zone_category_state
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_notify_zone_leads();
