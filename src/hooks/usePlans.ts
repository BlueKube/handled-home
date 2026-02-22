import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Plan {
  id: string;
  name: string;
  tagline: string | null;
  status: string;
  display_price_text: string | null;
  recommended_rank: number;
  current_entitlement_version_id: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanEntitlementVersion {
  id: string;
  plan_id: string;
  version: number;
  status: string;
  model_type: string;
  included_credits: number;
  included_count: number;
  included_minutes: number;
  extra_allowed: boolean;
  max_extra_credits: number;
  max_extra_count: number;
  max_extra_minutes: number;
  created_at: string;
}

export interface PlanZoneAvailability {
  id: string;
  plan_id: string;
  zone_id: string;
  is_enabled: boolean;
  created_at: string;
}

export function usePlans(statusFilter?: string) {
  return useQuery({
    queryKey: ["plans", statusFilter],
    queryFn: async () => {
      let query = supabase.from("plans").select("*").order("recommended_rank", { ascending: true });
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Plan[];
    },
  });
}

export function usePlanDetail(planId: string | null) {
  return useQuery({
    queryKey: ["plans", planId],
    enabled: !!planId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("id", planId!)
        .single();
      if (error) throw error;
      return data as Plan;
    },
  });
}

export function usePlanEntitlementVersions(planId: string | null) {
  return useQuery({
    queryKey: ["plan_entitlement_versions", planId],
    enabled: !!planId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_entitlement_versions")
        .select("*")
        .eq("plan_id", planId!)
        .order("version", { ascending: false });
      if (error) throw error;
      return data as PlanEntitlementVersion[];
    },
  });
}

export function usePlanZoneAvailability(planId: string | null) {
  return useQuery({
    queryKey: ["plan_zone_availability", planId],
    enabled: !!planId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_zone_availability")
        .select("*")
        .eq("plan_id", planId!);
      if (error) throw error;
      return data as PlanZoneAvailability[];
    },
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: Partial<Plan>) => {
      const { data, error } = await supabase
        .from("plans")
        .insert(plan as any)
        .select()
        .single();
      if (error) throw error;
      return data as Plan;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Plan> }) => {
      const { data, error } = await supabase
        .from("plans")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Plan;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
}

export function useDuplicatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sourceId: string) => {
      const { data: original, error: fetchErr } = await supabase
        .from("plans")
        .select("*")
        .eq("id", sourceId)
        .single();
      if (fetchErr || !original) throw fetchErr ?? new Error("Plan not found");

      const { id, created_at, updated_at, current_entitlement_version_id, ...rest } = original as any;
      const { data, error } = await supabase
        .from("plans")
        .insert({ ...rest, name: `${original.name} (Copy)`, status: "draft" } as any)
        .select()
        .single();
      if (error) throw error;
      return data as Plan;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
}

export function useCreateEntitlementVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (version: Partial<PlanEntitlementVersion>) => {
      const { data, error } = await supabase
        .from("plan_entitlement_versions")
        .insert(version as any)
        .select()
        .single();
      if (error) throw error;
      return data as PlanEntitlementVersion;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["plan_entitlement_versions"] });
      qc.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}

export function useUpdateZoneAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, zoneId, isEnabled }: { planId: string; zoneId: string; isEnabled: boolean }) => {
      const { data: existing } = await supabase
        .from("plan_zone_availability")
        .select("id")
        .eq("plan_id", planId)
        .eq("zone_id", zoneId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("plan_zone_availability")
          .update({ is_enabled: isEnabled } as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("plan_zone_availability")
          .insert({ plan_id: planId, zone_id: zoneId, is_enabled: isEnabled } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan_zone_availability"] }),
  });
}

export function useUpdateEntitlementVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PlanEntitlementVersion> }) => {
      const { data, error } = await supabase
        .from("plan_entitlement_versions")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as PlanEntitlementVersion;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plan_entitlement_versions"] });
      qc.invalidateQueries({ queryKey: ["entitlements"] });
    },
  });
}

export function useSkuRulesForVersion(entitlementVersionId: string | null) {
  return useQuery({
    queryKey: ["plan_entitlement_sku_rules", entitlementVersionId],
    enabled: !!entitlementVersionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_entitlement_sku_rules")
        .select("*")
        .eq("entitlement_version_id", entitlementVersionId!);
      if (error) throw error;
      return data as Array<{ id: string; entitlement_version_id: string; sku_id: string; rule_type: string; reason: string | null }>;
    },
  });
}

export function useManageSkuRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entitlementVersionId, skuId, ruleType, reason }: {
      entitlementVersionId: string; skuId: string; ruleType: string; reason?: string;
    }) => {
      // Upsert: delete existing rule for this SKU, insert new one
      await supabase
        .from("plan_entitlement_sku_rules")
        .delete()
        .eq("entitlement_version_id", entitlementVersionId)
        .eq("sku_id", skuId);

      if (ruleType !== "none") {
        const { error } = await supabase
          .from("plan_entitlement_sku_rules")
          .insert({ entitlement_version_id: entitlementVersionId, sku_id: skuId, rule_type: ruleType, reason } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plan_entitlement_sku_rules"] });
      qc.invalidateQueries({ queryKey: ["entitlements"] });
    },
  });
}
