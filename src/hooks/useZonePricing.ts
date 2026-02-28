import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SkuPricingBase {
  id: string;
  sku_id: string;
  base_price_cents: number;
  currency: string;
  active_from: string;
  version: number;
  changed_by: string;
  reason: string | null;
  created_at: string;
}

export interface SkuPricingZoneOverride {
  id: string;
  zone_id: string;
  sku_id: string;
  price_multiplier: number | null;
  override_price_cents: number | null;
  active_from: string;
  active_to: string | null;
  version: number;
  changed_by: string;
  reason: string | null;
  created_at: string;
}

export function useSkuPricingBase() {
  return useQuery({
    queryKey: ["sku-pricing-base"],
    queryFn: async (): Promise<SkuPricingBase[]> => {
      const { data, error } = await supabase
        .from("sku_pricing_base")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SkuPricingBase[];
    },
  });
}

export function useZonePricingOverrides(zoneId: string | undefined) {
  return useQuery({
    queryKey: ["zone-pricing-overrides", zoneId],
    enabled: !!zoneId,
    queryFn: async (): Promise<SkuPricingZoneOverride[]> => {
      const { data, error } = await supabase
        .from("sku_pricing_zone_overrides")
        .select("*")
        .eq("zone_id", zoneId!)
        .is("active_to", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SkuPricingZoneOverride[];
    },
  });
}

export function useSetBasePriceMutation() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { sku_id: string; base_price_cents: number; reason: string }) => {
      const { error } = await supabase.from("sku_pricing_base").insert({
        sku_id: params.sku_id,
        base_price_cents: params.base_price_cents,
        changed_by: user!.id,
        reason: params.reason,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sku-pricing-base"] });
      toast.success("Base price updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSetZoneOverrideMutation() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      zone_id: string;
      sku_id: string;
      price_multiplier?: number | null;
      override_price_cents?: number | null;
      reason: string;
      active_from?: string;
    }) => {
      // Expire current active override for same zone+sku
      await supabase
        .from("sku_pricing_zone_overrides")
        .update({ active_to: new Date().toISOString() } as any)
        .eq("zone_id", params.zone_id)
        .eq("sku_id", params.sku_id)
        .is("active_to", null);

      const { error } = await supabase.from("sku_pricing_zone_overrides").insert({
        zone_id: params.zone_id,
        sku_id: params.sku_id,
        price_multiplier: params.price_multiplier ?? null,
        override_price_cents: params.override_price_cents ?? null,
        changed_by: user!.id,
        reason: params.reason,
        active_from: params.active_from ?? new Date().toISOString(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zone-pricing-overrides"] });
      toast.success("Zone pricing override saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBulkSetMultiplierMutation() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      zone_id: string;
      sku_ids: string[];
      price_multiplier: number;
      reason: string;
    }) => {
      // Expire all current overrides for these SKUs in this zone
      for (const skuId of params.sku_ids) {
        await supabase
          .from("sku_pricing_zone_overrides")
          .update({ active_to: new Date().toISOString() } as any)
          .eq("zone_id", params.zone_id)
          .eq("sku_id", skuId)
          .is("active_to", null);
      }

      const rows = params.sku_ids.map((skuId) => ({
        zone_id: params.zone_id,
        sku_id: skuId,
        price_multiplier: params.price_multiplier,
        override_price_cents: null,
        changed_by: user!.id,
        reason: params.reason,
      }));

      const { error } = await supabase.from("sku_pricing_zone_overrides").insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zone-pricing-overrides"] });
      toast.success("Bulk multiplier applied");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRollbackPricingMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { override_id: string; reason?: string }) => {
      const { data, error } = await supabase.rpc("rollback_pricing_override", {
        p_override_id: params.override_id,
        p_reason: params.reason ?? "Rollback",
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zone-pricing-overrides"] });
      toast.success("Pricing rolled back");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
