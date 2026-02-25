
-- Finding #1: Restrict emit_notification_event to service_role only
REVOKE ALL ON FUNCTION public.emit_notification_event FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.emit_notification_event TO service_role;

-- Finding #4: Add CHECK constraint on notifications.priority
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_priority_check
  CHECK (priority IN ('CRITICAL','SERVICE','MARKETING'));

-- Finding #5: Drop redundant admin SELECT policy on notification_events
DROP POLICY IF EXISTS "Admins can read all notification events" ON public.notification_events;

-- Finding #7: Enforce critical_enabled always true at DB level
ALTER TABLE public.user_notification_preferences
  ADD CONSTRAINT critical_always_enabled CHECK (critical_enabled = true);
