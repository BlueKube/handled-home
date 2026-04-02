-- ============================================
-- Round 11, Phase 2, B2: Customer Lead Zone Launch Notifications
-- ============================================
-- Mirrors the provider lead auto-notify pattern.
-- When a zone category transitions to SOFT_LAUNCH or OPEN,
-- auto-notifies matching customer leads.
-- ============================================

-- Add notified_at timestamp
ALTER TABLE public.customer_leads
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

-- Function: auto-notify matching customer leads on zone launch
CREATE OR REPLACE FUNCTION public.auto_notify_customer_leads()
RETURNS TRIGGER AS $$
DECLARE
  v_zone_zips TEXT[];
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

  -- Update matching customer leads: new → notified
  UPDATE public.customer_leads
  SET status = 'notified',
      notified_at = now()
  WHERE zip_code = ANY(v_zone_zips)
    AND status = 'new'
    AND notify_on_launch = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on market_zone_category_state status changes
DROP TRIGGER IF EXISTS trg_auto_notify_customer_leads ON public.market_zone_category_state;
CREATE TRIGGER trg_auto_notify_customer_leads
  AFTER UPDATE OF status ON public.market_zone_category_state
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_notify_customer_leads();
