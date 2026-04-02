-- Fix: customer_leads status CHECK constraint missing 'notified'.
-- The auto_notify_customer_leads trigger sets status = 'notified' on zone launch,
-- but the original CHECK constraint didn't include this value, causing runtime failures.

ALTER TABLE public.customer_leads
  DROP CONSTRAINT IF EXISTS customer_leads_status_check;

ALTER TABLE public.customer_leads
  ADD CONSTRAINT customer_leads_status_check
  CHECK (status IN ('new', 'contacted', 'notified', 'subscribed', 'declined'));
