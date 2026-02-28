import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

  return useMutation({
    mutationFn: async (params: { sku_id: string; base_price_cents: number; reason: string }) => {
      const { data, error } = await supabase.rpc("set_sku_base_price", {
        p_sku_id: params.sku_id,
        p_base_price_cents: params.base_price_cents,
        p_reason: params.reason,
      });
      if (error) throw error;
      return data;
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

  return useMutation({
    mutationFn: async (params: {
      zone_id: string;
      sku_id: string;
      price_multiplier?: number | null;
      override_price_cents?: number | null;
      reason: string;
      active_from?: string;
    }) => {
      const { data, error } = await supabase.rpc("set_zone_pricing_override", {
        p_zone_id: params.zone_id,
        p_sku_id: params.sku_id,
        p_price_multiplier: params.price_multiplier ?? null,
        p_override_price_cents: params.override_price_cents ?? null,
        p_reason: params.reason,
        p_active_from: params.active_from ?? new Date().toISOString(),
      });
      if (error) throw error;
      return data;
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

  return useMutation({
    mutationFn: async (params: {
      zone_id: string;
      sku_ids: string[];
      price_multiplier: number;
      reason: string;
    }) => {
      const { data, error } = await supabase.rpc("bulk_set_zone_multiplier", {
        p_zone_id: params.zone_id,
        p_sku_ids: params.sku_ids,
        p_price_multiplier: params.price_multiplier,
        p_reason: params.reason,
      });
      if (error) throw error;
      return data;
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
