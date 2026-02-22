import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EntitlementPlan {
  plan_id: string;
  entitlement_version_id: string;
  model_type: string;
  included: { credits: number; count: number; minutes: number };
  extras: { allowed: boolean; max_credits: number; max_count: number; max_minutes: number };
}

export interface EntitlementZone {
  zone_id: string | null;
  is_covered: boolean;
  plan_enabled: boolean;
}

export interface EntitlementSku {
  sku_id: string;
  sku_name: string;
  status: "included" | "extra_allowed" | "blocked" | "provider_only" | "available";
  provider_only: boolean;
  reason: string | null;
  ui_badge: string;
  ui_explainer: string;
}

export interface ServiceWeekEntitlement {
  included_per_billing_cycle: number;
  consumed_in_current_cycle: number;
  remaining_in_current_cycle: number;
}

export interface EntitlementPayload {
  plan: EntitlementPlan;
  zone: EntitlementZone;
  skus: EntitlementSku[];
  service_weeks: ServiceWeekEntitlement;
  messages: {
    included_explainer: string;
    extra_explainer: string;
    change_policy: string;
  };
}

const MODEL_LABELS: Record<string, string> = {
  credits_per_cycle: "credits",
  count_per_cycle: "services",
  minutes_per_cycle: "minutes",
};

const BADGE_MAP: Record<string, string> = {
  included: "Included",
  extra_allowed: "Extra",
  blocked: "Not Available",
  provider_only: "Provider Only",
};

export function useEntitlements(planId: string | null, zoneId: string | null, entitlementVersionId?: string | null) {
  return useQuery<EntitlementPayload | null>({
    queryKey: ["entitlements", planId, zoneId, entitlementVersionId],
    enabled: !!planId,
    queryFn: async () => {
      if (!planId) return null;

      // 1. Fetch plan
      const { data: plan, error: planErr } = await supabase
        .from("plans")
        .select("*")
        .eq("id", planId)
        .single();
      if (planErr || !plan) throw planErr ?? new Error("Plan not found");

      // 2. Fetch zone availability
      let zoneAvail = null;
      if (zoneId) {
        const { data } = await supabase
          .from("plan_zone_availability")
          .select("*")
          .eq("plan_id", planId)
          .eq("zone_id", zoneId)
          .maybeSingle();
        zoneAvail = data;
      }

      // 3. Fetch entitlement version
      const versionId = entitlementVersionId || (plan as any).current_entitlement_version_id;
      let version: any = null;
      if (versionId) {
        const { data } = await supabase
          .from("plan_entitlement_versions")
          .select("*")
          .eq("id", versionId)
          .single();
        version = data;
      }

      // 4. Fetch SKU rules for version
      let skuRules: any[] = [];
      if (versionId) {
        const { data } = await supabase
          .from("plan_entitlement_sku_rules")
          .select("*")
          .eq("entitlement_version_id", versionId);
        skuRules = data ?? [];
      }

      // 5. Fetch all active SKUs
      const { data: allSkus } = await supabase
        .from("service_skus")
        .select("id, name")
        .eq("status", "active");

      // Build entitlement payload
      const modelType = version?.model_type ?? "credits_per_cycle";
      const modelLabel = MODEL_LABELS[modelType] ?? "credits";

      const included = {
        credits: version?.included_credits ?? 0,
        count: version?.included_count ?? 0,
        minutes: version?.included_minutes ?? 0,
      };
      const extras = {
        allowed: version?.extra_allowed ?? false,
        max_credits: version?.max_extra_credits ?? 0,
        max_count: version?.max_extra_count ?? 0,
        max_minutes: version?.max_extra_minutes ?? 0,
      };

      // Build SKU list with entitlement status
      const rulesBySku = new Map<string, any>();
      for (const rule of skuRules) {
        rulesBySku.set(rule.sku_id, rule);
      }

      const skus: EntitlementSku[] = (allSkus ?? []).map((sku: any) => {
        const rule = rulesBySku.get(sku.id);
        const status = rule?.rule_type ?? "available";
        return {
          sku_id: sku.id,
          sku_name: sku.name,
          status,
          provider_only: status === "provider_only",
          reason: rule?.reason ?? null,
          ui_badge: BADGE_MAP[status] ?? "Available",
          ui_explainer: status === "blocked"
            ? (rule?.reason ?? "Not available on this plan")
            : status === "extra_allowed"
            ? "Available as an add-on"
            : status === "provider_only"
            ? "Managed by your provider"
            : status === "included"
            ? "Included in your plan"
            : "Available to add",
        };
      });

      const includedVal = modelType === "credits_per_cycle" ? included.credits
        : modelType === "count_per_cycle" ? included.count : included.minutes;

      const serviceWeeksPerCycle = version?.included_service_weeks_per_billing_cycle ?? 4;

      return {
        plan: {
          plan_id: planId,
          entitlement_version_id: versionId ?? "",
          model_type: modelType,
          included,
          extras,
        },
        zone: {
          zone_id: zoneId,
          is_covered: !!zoneAvail,
          plan_enabled: zoneAvail?.is_enabled ?? false,
        },
        skus,
        service_weeks: {
          included_per_billing_cycle: serviceWeeksPerCycle,
          consumed_in_current_cycle: 0, // future modules increment this
          remaining_in_current_cycle: serviceWeeksPerCycle,
        },
        messages: {
          included_explainer: `${includedVal} ${modelLabel} included per cycle · ${serviceWeeksPerCycle} service week${serviceWeeksPerCycle !== 1 ? "s" : ""} per billing cycle`,
          extra_explainer: extras.allowed ? `Up to ${extras.max_credits || extras.max_count || extras.max_minutes} extra ${modelLabel} available` : "No extras available on this plan",
          change_policy: "Plan changes take effect at the start of your next billing cycle (every 4 weeks).",
        },
      };
    },
  });
}
