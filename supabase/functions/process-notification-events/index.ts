import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 3;

interface NotificationEvent {
  id: string;
  event_type: string;
  audience_type: string;
  audience_user_id: string | null;
  audience_org_id: string | null;
  audience_zone_id: string | null;
  payload: Record<string, unknown>;
  priority: string;
  idempotency_key: string;
  attempt_count: number;
  status: string;
  scheduled_for: string;
}

interface Template {
  title_template: string;
  body_template: string;
  channels: string[];
  cta_label_template: string | null;
  cta_route_template: string | null;
  priority: string;
  enabled: boolean;
}

interface UserPrefs {
  critical_enabled: boolean;
  service_updates_enabled: boolean;
  marketing_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string | null;
}

const DEFAULT_PREFS: UserPrefs = {
  critical_enabled: true,
  service_updates_enabled: true,
  marketing_enabled: false,
  quiet_hours_enabled: true,
  quiet_hours_start: "21:00:00",
  quiet_hours_end: "08:00:00",
  timezone: null,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Log cron run
  const runId = crypto.randomUUID();
  const idempotencyKey = `process-notifications-${new Date().toISOString().slice(0, 16)}`;

  // Check idempotency — skip if same minute already processed
  const { data: existingRun } = await supabase
    .from("cron_run_log")
    .select("id")
    .eq("function_name", "process-notification-events")
    .eq("idempotency_key", idempotencyKey)
    .eq("status", "completed")
    .maybeSingle();

  if (existingRun) {
    return new Response(
      JSON.stringify({ skipped: true, reason: "already processed this minute" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  await supabase.from("cron_run_log").insert({
    id: runId,
    function_name: "process-notification-events",
    idempotency_key: idempotencyKey,
    status: "running",
    started_at: new Date().toISOString(),
  });

  let processedCount = 0;
  let errorCount = 0;

  try {
    // 1. Claim PENDING events scheduled for now or earlier
    const { data: events, error: claimErr } = await supabase.rpc(
      "claim_notification_events",
      { batch_limit: BATCH_SIZE }
    );

    if (claimErr) {
      // If the RPC doesn't exist yet, fall back to simple query + update
      console.warn("claim_notification_events RPC not found, using fallback:", claimErr.message);
    }

    // Fallback: simple select + update (no row-level locking but safe for single-worker)
    let pendingEvents: NotificationEvent[] = events ?? [];
    if (!events || events.length === 0) {
      const { data: fallbackEvents } = await supabase
        .from("notification_events")
        .select("*")
        .eq("status", "PENDING")
        .lte("scheduled_for", new Date().toISOString())
        .order("created_at", { ascending: true })
        .limit(BATCH_SIZE);

      if (fallbackEvents && fallbackEvents.length > 0) {
        const ids = fallbackEvents.map((e: NotificationEvent) => e.id);
        await supabase
          .from("notification_events")
          .update({ status: "PROCESSING" })
          .in("id", ids);
        pendingEvents = fallbackEvents as NotificationEvent[];
      }
    }

    if (pendingEvents.length === 0) {
      await supabase
        .from("cron_run_log")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          result_summary: { processed: 0, errors: 0 },
        })
        .eq("id", runId);

      return new Response(
        JSON.stringify({ processed: 0, errors: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pre-fetch all templates
    const eventTypes = [...new Set(pendingEvents.map((e) => e.event_type))];
    const { data: templates } = await supabase
      .from("notification_templates")
      .select("*")
      .in("event_type", eventTypes)
      .eq("enabled", true);

    const templateMap = new Map<string, Template>();
    for (const t of templates ?? []) {
      templateMap.set(`${t.event_type}:${t.audience_type}`, t as Template);
    }

    // Pre-fetch rate limits
    const { data: rateLimits } = await supabase
      .from("notification_rate_limits")
      .select("*");

    const rateLimitMap = new Map<string, { max_per_day: number; max_per_hour: number }>();
    for (const rl of rateLimits ?? []) {
      rateLimitMap.set(`${rl.priority}:${rl.audience_type}`, rl);
    }

    // 2. Process each event
    for (const event of pendingEvents) {
      try {
        // Resolve audience to user IDs
        const userIds = await resolveAudience(supabase, event);

        if (userIds.length === 0) {
          await markEventProcessed(supabase, event.id);
          processedCount++;
          continue;
        }

        // Resolve template
        const template =
          templateMap.get(`${event.event_type}:${event.audience_type}`) ??
          templateMap.get(`${event.event_type}:user`);

        // Get payload fields
        const payload = (event.payload ?? {}) as Record<string, string>;

        // Determine title, body, cta
        const title = template
          ? interpolate(template.title_template, payload)
          : (payload.title as string) ?? event.event_type;
        const body = template
          ? interpolate(template.body_template, payload)
          : (payload.body as string) ?? "";
        const ctaLabel = template?.cta_label_template
          ? interpolate(template.cta_label_template, payload)
          : (payload.cta_label as string) ?? null;
        const ctaRoute = template?.cta_route_template
          ? interpolate(template.cta_route_template, payload)
          : (payload.cta_route as string) ?? null;
        const channels = template?.channels ?? ["IN_APP"];
        const priority = template?.priority ?? event.priority;

        // Fetch preferences for all target users in one query
        const { data: prefsRows } = await supabase
          .from("user_notification_preferences")
          .select("*")
          .in("user_id", userIds);

        const prefsMap = new Map<string, UserPrefs>();
        for (const p of prefsRows ?? []) {
          prefsMap.set(p.user_id, p as UserPrefs);
        }

        const notificationsToInsert: Array<Record<string, unknown>> = [];
        const deliveriesToInsert: Array<Record<string, unknown>> = [];

        for (const userId of userIds) {
          const prefs = prefsMap.get(userId) ?? DEFAULT_PREFS;

          // Apply preference filter
          if (!shouldDeliver(priority, prefs)) {
            continue;
          }

          // Check quiet hours for non-critical
          const inQuietHours =
            priority !== "CRITICAL" && isInQuietHours(prefs);

          // Check rate limits for push/email suppression
          const rateLimit = rateLimitMap.get(`${priority}:${event.audience_type}`);
          let rateLimited = false;
          if (rateLimit && priority !== "CRITICAL") {
            // Count today's deliveries for this user+priority
            const todayStart = new Date();
            todayStart.setUTCHours(0, 0, 0, 0);
            const { count } = await supabase
              .from("notifications")
              .select("id", { count: "exact", head: true })
              .eq("user_id", userId)
              .eq("priority", priority)
              .gte("created_at", todayStart.toISOString());

            if ((count ?? 0) >= rateLimit.max_per_day) {
              rateLimited = true;
            }
          }

          const notifId = crypto.randomUUID();
          notificationsToInsert.push({
            id: notifId,
            user_id: userId,
            type: event.event_type,
            title,
            body,
            priority,
            cta_label: ctaLabel,
            cta_route: ctaRoute,
            context_type: (payload.context_type as string) ?? null,
            context_id: (payload.context_id as string) ?? null,
            source_event_id: event.id,
            data: payload,
          });

          // Create delivery records for each channel
          for (const channel of channels) {
            if (channel === "IN_APP") continue; // in-app is the notification row itself

            const suppressed = inQuietHours || rateLimited;
            deliveriesToInsert.push({
              notification_id: notifId,
              channel,
              status: suppressed ? "SUPPRESSED" : "QUEUED",
              attempted_at: new Date().toISOString(),
            });
          }
        }

        // Batch insert notifications
        if (notificationsToInsert.length > 0) {
          const { error: notifErr } = await supabase
            .from("notifications")
            .insert(notificationsToInsert);

          if (notifErr) {
            // Handle duplicate source_event_id gracefully
            if (notifErr.code === "23505") {
              console.log(`Duplicate notification for event ${event.id}, skipping`);
            } else {
              throw notifErr;
            }
          }
        }

        // Batch insert delivery records
        if (deliveriesToInsert.length > 0) {
          const { error: delErr } = await supabase
            .from("notification_delivery")
            .insert(deliveriesToInsert);

          if (delErr) throw delErr;
        }

        await markEventProcessed(supabase, event.id);
        processedCount++;
      } catch (eventErr) {
        errorCount++;
        const errMsg =
          eventErr instanceof Error ? eventErr.message : String(eventErr);
        console.error(`Error processing event ${event.id}:`, errMsg);

        const newAttempt = (event.attempt_count ?? 0) + 1;
        const newStatus = newAttempt >= MAX_ATTEMPTS ? "DEADLETTER" : "PENDING";

        await supabase
          .from("notification_events")
          .update({
            status: newStatus,
            attempt_count: newAttempt,
            last_error: errMsg,
          })
          .eq("id", event.id);
      }
    }

    // Attempt FCM push for QUEUED deliveries
    await attemptPushDelivery(supabase);

    // Update cron run log
    await supabase
      .from("cron_run_log")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        result_summary: { processed: processedCount, errors: errorCount },
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({ processed: processedCount, errors: errorCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("Fatal error in process-notification-events:", errMsg);

    await supabase
      .from("cron_run_log")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: errMsg,
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── Helpers ───────────────────────────────────────────────

async function resolveAudience(
  supabase: ReturnType<typeof createClient>,
  event: NotificationEvent
): Promise<string[]> {
  // Direct user targeting
  if (event.audience_user_id) {
    return [event.audience_user_id];
  }

  // Org targeting: all active members
  if (event.audience_org_id) {
    const { data } = await supabase
      .from("provider_members")
      .select("user_id")
      .eq("provider_org_id", event.audience_org_id)
      .eq("status", "active");
    return (data ?? []).map((r: { user_id: string }) => r.user_id);
  }

  // Zone targeting: resolve based on audience_type
  if (event.audience_zone_id) {
    if (event.audience_type === "admin") {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      return (data ?? []).map((r: { user_id: string }) => r.user_id);
    }

    if (event.audience_type === "provider") {
      const { data } = await supabase
        .from("provider_members")
        .select("user_id, provider_orgs!inner(id)")
        .eq("status", "active");
      // Filter by zone via provider_coverage
      const { data: coverage } = await supabase
        .from("provider_coverage")
        .select("provider_org_id")
        .eq("zone_id", event.audience_zone_id)
        .eq("status", "active");
      const orgIds = new Set(
        (coverage ?? []).map((c: { provider_org_id: string }) => c.provider_org_id)
      );
      return (data ?? [])
        .filter((m: { user_id: string; provider_orgs: { id: string } }) =>
          orgIds.has(m.provider_orgs?.id)
        )
        .map((m: { user_id: string }) => m.user_id);
    }

    // Default: customers in zone (via properties)
    const { data } = await supabase
      .from("properties")
      .select("user_id")
      .eq("zone_id", event.audience_zone_id);
    return [...new Set((data ?? []).map((r: { user_id: string }) => r.user_id))];
  }

  return [];
}

function shouldDeliver(priority: string, prefs: UserPrefs): boolean {
  if (priority === "CRITICAL") return true;
  if (priority === "SERVICE") return prefs.service_updates_enabled;
  if (priority === "MARKETING") return prefs.marketing_enabled;
  return true;
}

function isInQuietHours(prefs: UserPrefs): boolean {
  if (!prefs.quiet_hours_enabled) return false;

  const now = new Date();
  const currentHour = now.getUTCHours(); // Simplified: uses UTC; timezone support deferred
  const startHour = parseInt(prefs.quiet_hours_start);
  const endHour = parseInt(prefs.quiet_hours_end);

  if (startHour <= endHour) {
    return currentHour >= startHour && currentHour < endHour;
  }
  // Wraps midnight (e.g., 21:00 to 08:00)
  return currentHour >= startHour || currentHour < endHour;
}

function interpolate(
  template: string,
  payload: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => payload[key] ?? `{{${key}}}`);
}

async function markEventProcessed(
  supabase: ReturnType<typeof createClient>,
  eventId: string
) {
  await supabase
    .from("notification_events")
    .update({
      status: "PROCESSED",
      processed_at: new Date().toISOString(),
    })
    .eq("id", eventId);
}

async function attemptPushDelivery(
  supabase: ReturnType<typeof createClient>
) {
  const fcmKey = Deno.env.get("FCM_SERVER_KEY");
  if (!fcmKey) {
    console.log("FCM_SERVER_KEY not configured, skipping push delivery");
    return;
  }

  // Get QUEUED PUSH deliveries
  const { data: queued } = await supabase
    .from("notification_delivery")
    .select("id, notification_id, channel")
    .eq("status", "QUEUED")
    .eq("channel", "PUSH")
    .limit(100);

  if (!queued || queued.length === 0) return;

  // Get notification details
  const notifIds = [...new Set(queued.map((q: { notification_id: string }) => q.notification_id))];
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, user_id, title, body, data")
    .in("id", notifIds);

  if (!notifications) return;

  const notifMap = new Map<string, { user_id: string; title: string; body: string; data: unknown }>();
  for (const n of notifications) {
    notifMap.set(n.id, n);
  }

  // Get user device tokens
  const userIds = [...new Set(notifications.map((n: { user_id: string }) => n.user_id))];
  const { data: tokens } = await supabase
    .from("user_device_tokens")
    .select("user_id, token, platform")
    .in("user_id", userIds)
    .eq("status", "active");

  if (!tokens || tokens.length === 0) {
    // No active tokens, mark as FAILED
    const deliveryIds = queued.map((q: { id: string }) => q.id);
    await supabase
      .from("notification_delivery")
      .update({
        status: "FAILED",
        error_message: "No active device tokens",
        attempted_at: new Date().toISOString(),
      })
      .in("id", deliveryIds);
    return;
  }

  const tokensByUser = new Map<string, Array<{ token: string; platform: string }>>();
  for (const t of tokens) {
    if (!tokensByUser.has(t.user_id)) tokensByUser.set(t.user_id, []);
    tokensByUser.get(t.user_id)!.push(t);
  }

  // Send push for each delivery
  for (const delivery of queued) {
    const notif = notifMap.get(delivery.notification_id);
    if (!notif) continue;

    const userTokens = tokensByUser.get(notif.user_id);
    if (!userTokens || userTokens.length === 0) {
      await supabase
        .from("notification_delivery")
        .update({
          status: "FAILED",
          error_message: "No active device tokens for user",
          attempted_at: new Date().toISOString(),
        })
        .eq("id", delivery.id);
      continue;
    }

    // Send to first active token (FCM legacy HTTP API)
    const token = userTokens[0];
    try {
      const fcmResponse = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `key=${fcmKey}`,
        },
        body: JSON.stringify({
          to: token.token,
          notification: {
            title: notif.title,
            body: notif.body,
          },
          data: notif.data ?? {},
        }),
      });

      const result = await fcmResponse.text();

      if (fcmResponse.ok) {
        await supabase
          .from("notification_delivery")
          .update({
            status: "SENT",
            provider_message_id: result,
            attempted_at: new Date().toISOString(),
          })
          .eq("id", delivery.id);
      } else {
        await supabase
          .from("notification_delivery")
          .update({
            status: "FAILED",
            error_code: String(fcmResponse.status),
            error_message: result.slice(0, 500),
            attempted_at: new Date().toISOString(),
          })
          .eq("id", delivery.id);
      }
    } catch (pushErr) {
      const errMsg = pushErr instanceof Error ? pushErr.message : String(pushErr);
      await supabase
        .from("notification_delivery")
        .update({
          status: "FAILED",
          error_message: errMsg.slice(0, 500),
          attempted_at: new Date().toISOString(),
        })
        .eq("id", delivery.id);
    }
  }
}
