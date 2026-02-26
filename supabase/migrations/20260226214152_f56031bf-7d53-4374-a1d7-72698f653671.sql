
-- C4: Trigger for CUSTOMER_PROVIDER_EN_ROUTE when arrived_at is set
CREATE OR REPLACE FUNCTION public.notify_customer_provider_en_route()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only fire when arrived_at transitions from NULL to a value
  IF OLD.arrived_at IS NULL AND NEW.arrived_at IS NOT NULL THEN
    PERFORM emit_notification_event(
      p_event_type := 'CUSTOMER_PROVIDER_EN_ROUTE',
      p_idempotency_key := 'en_route:' || NEW.id::text,
      p_audience_type := 'CUSTOMER',
      p_audience_user_id := NEW.customer_id,
      p_priority := 'NORMAL',
      p_payload := jsonb_build_object(
        'job_id', NEW.id,
        'scheduled_date', NEW.scheduled_date
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_en_route
  AFTER UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION notify_customer_provider_en_route();
