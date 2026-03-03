import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type AnalyticsEventType =
  | "recommendation_created"
  | "recommendation_approved"
  | "recommendation_rejected"
  | "recommendation_snoozed"
  | "state_changed"
  | "waitlist_joined"
  | "subscribe_blocked_by_state";

/**
 * Emit a growth_events row for state-machine analytics.
 * Fire-and-forget — errors are logged but never thrown to UI.
 */
export async function emitStateAnalyticsEvent(params: {
  eventType: AnalyticsEventType;
  actorId: string;
  actorRole: "admin" | "customer" | "provider" | "system";
  zoneId?: string | null;
  category?: string | null;
  context?: Record<string, unknown>;
  sourceSurface: string;
}) {
  const idempotencyKey = `${params.eventType}_${params.actorId}_${params.zoneId ?? "global"}_${params.category ?? "all"}_${Date.now()}`;

  try {
    const row = {
      event_type: params.eventType,
      actor_id: params.actorId,
      actor_role: params.actorRole,
      zone_id: params.zoneId ?? null,
      category: params.category ?? null,
      context: (params.context ?? {}) as Json,
      source_surface: params.sourceSurface,
      idempotency_key: idempotencyKey,
    };
    await supabase.from("growth_events").insert([row]);
  } catch (err) {
    console.error("[analytics] Failed to emit event:", params.eventType, err);
  }
}
