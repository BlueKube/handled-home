
-- Fix SECURITY DEFINER views by setting security_invoker
ALTER VIEW notification_health_summary SET (security_invoker = true);
ALTER VIEW notification_delivery_daily SET (security_invoker = true);
ALTER VIEW notification_deadletters SET (security_invoker = true);
