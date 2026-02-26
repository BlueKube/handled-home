
-- C5-F7: Drop and recreate view (can't change column type in-place)
DROP VIEW IF EXISTS notification_delivery_daily;
CREATE VIEW notification_delivery_daily
WITH (security_invoker = true) AS
SELECT
  date_trunc('day', attempted_at)::date AS delivery_date,
  channel,
  status,
  count(*)::int AS count
FROM notification_delivery
WHERE attempted_at >= now() - interval '7 days'
  AND status != 'QUEUED'
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 2, 3;
