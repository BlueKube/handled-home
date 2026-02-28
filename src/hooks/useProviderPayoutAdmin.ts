import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PayoutBase {
  id: string;
  sku_id: string;
  base_payout_cents: number;
  currency: string;
  active_from: string;
  version: number;
  changed_by: string;
  reason: string | null;
  created_at: string;
}

export interface PayoutZoneOverride {
  id: string;
  zone_id: string;
  sku_id: string;
  payout_multiplier: number | null;
  override_payout_cents: number | null;
  active_from: string;
  active_to: string | null;
  version: number;
  changed_by: string;
  reason: string | null;
  created_at: string;
}

export interface OrgContract {
  id: string;
  provider_org_id: string;
  contract_type: string;
  category: string;
  active_from: string;
  active_to: string | null;
  version: number;
  changed_by: string;
  reason: string | null;
  created_at: string;
}

export interface OvertimeRule {
  id: string;
  zone_id: string;
  sku_id: string;
  expected_minutes: number;
  overtime_rate_cents_per_min: number;
  overtime_start_after_minutes: number;
  overtime_cap_cents: number;
  version: number;
  changed_by: string;
  reason: string | null;
  created_at: string;
}

export function usePayoutBase() {
  return useQuery({
    queryKey: ["payout-base"],
    queryFn: async (): Promise<PayoutBase[]> => {
      const { data, error } = await supabase
        .from("provider_payout_base")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PayoutBase[];
    },
  });
}

export function usePayoutZoneOverrides(zoneId: string | undefined) {
  return useQuery({
    queryKey: ["payout-zone-overrides", zoneId],
    enabled: !!zoneId,
    queryFn: async (): Promise<PayoutZoneOverride[]> => {
      const { data, error } = await supabase
        .from("provider_payout_zone_overrides")
        .select("*")
        .eq("zone_id", zoneId!)
        .is("active_to", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PayoutZoneOverride[];
    },
  });
}

export function useOrgContracts() {
  return useQuery({
    queryKey: ["org-contracts"],
    queryFn: async (): Promise<OrgContract[]> => {
      const { data, error } = await supabase
        .from("provider_org_contracts")
        .select("*")
        .is("active_to", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrgContract[];
    },
  });
}

export function useOvertimeRules(zoneId: string | undefined) {
  return useQuery({
    queryKey: ["overtime-rules", zoneId],
    enabled: !!zoneId,
    queryFn: async (): Promise<OvertimeRule[]> => {
      const { data, error } = await supabase
        .from("payout_overtime_rules")
        .select("*")
        .eq("zone_id", zoneId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OvertimeRule[];
    },
  });
}

export function useSetPayoutBaseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { sku_id: string; base_payout_cents: number; reason: string }) => {
      const { error } = await supabase.rpc("set_provider_payout_base", {
        p_sku_id: params.sku_id,
        p_base_payout_cents: params.base_payout_cents,
        p_reason: params.reason,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payout-base"] }); toast.success("Base payout updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSetPayoutZoneOverrideMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      zone_id: string; sku_id: string;
      payout_multiplier?: number | null;
      override_payout_cents?: number | null;
      reason: string;
    }) => {
      const { error } = await supabase.rpc("set_provider_payout_zone_override", {
        p_zone_id: params.zone_id,
        p_sku_id: params.sku_id,
        p_payout_multiplier: params.payout_multiplier ?? null,
        p_override_payout_cents: params.override_payout_cents ?? null,
        p_reason: params.reason,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payout-zone-overrides"] }); toast.success("Payout override saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSetOrgContractMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { provider_org_id: string; contract_type: string; reason: string }) => {
      const { error } = await supabase.rpc("set_provider_org_contract", {
        p_provider_org_id: params.provider_org_id,
        p_contract_type: params.contract_type,
        p_reason: params.reason,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["org-contracts"] }); toast.success("Contract type updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSetOvertimeRulesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      zone_id: string; sku_id: string;
      expected_minutes: number; overtime_rate_cents_per_min: number;
      overtime_start_after_minutes: number; overtime_cap_cents: number;
      reason: string;
    }) => {
      const { error } = await supabase.rpc("set_payout_overtime_rules", {
        p_zone_id: params.zone_id,
        p_sku_id: params.sku_id,
        p_expected_minutes: params.expected_minutes,
        p_overtime_rate_cents_per_min: params.overtime_rate_cents_per_min,
        p_overtime_start_after_minutes: params.overtime_start_after_minutes,
        p_overtime_cap_cents: params.overtime_cap_cents,
        p_reason: params.reason,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["overtime-rules"] }); toast.success("Overtime rules saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
