import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useAuth } from "@/contexts/AuthContext";

export interface ByocAttribution {
  id: string;
  provider_org_id: string;
  customer_id: string;
  invite_code: string | null;
  referral_code: string | null;
  invited_at: string;
  installed_at: string | null;
  subscribed_at: string | null;
  first_completed_visit_at: string | null;
  bonus_start_at: string | null;
  bonus_end_at: string | null;
  status: string;
  revoked_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ByocBonusEntry {
  id: string;
  attribution_id: string;
  provider_org_id: string;
  customer_id: string;
  week_start: string;
  week_end: string;
  amount_cents: number;
  status: string;
  created_at: string;
}

export function useByocAttributions() {
  const { org } = useProviderOrg();
  const { user } = useAuth();
  const qc = useQueryClient();

  const attributionsQuery = useQuery({
    queryKey: ["byoc-attributions", org?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("byoc_attributions")
        .select("*")
        .eq("provider_org_id", org!.id)
        .order("invited_at", { ascending: false });
      if (error) throw error;
      return data as ByocAttribution[];
    },
    enabled: !!org?.id,
  });

  const bonusesQuery = useQuery({
    queryKey: ["byoc-bonuses", org?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("byoc_bonus_ledger")
        .select("*")
        .eq("provider_org_id", org!.id)
        .eq("status", "earned")
        .order("week_start", { ascending: false });
      if (error) throw error;
      return data as ByocBonusEntry[];
    },
    enabled: !!org?.id,
  });

  const createAttribution = useMutation({
    mutationFn: async (params: {
      customer_id: string;
      invite_code?: string;
      referral_code?: string;
    }) => {
      const { data, error } = await supabase
        .from("byoc_attributions")
        .insert({
          provider_org_id: org!.id,
          customer_id: params.customer_id,
          invite_code: params.invite_code ?? null,
          referral_code: params.referral_code ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["byoc-attributions"] });
    },
  });

  const attributions = attributionsQuery.data ?? [];
  const bonuses = bonusesQuery.data ?? [];

  const activeCount = attributions.filter((a) => a.status === "ACTIVE").length;
  const pendingCount = attributions.filter((a) => a.status === "PENDING").length;
  const totalEarnedCents = bonuses.reduce((sum, b) => sum + b.amount_cents, 0);

  return {
    attributions,
    bonuses,
    activeCount,
    pendingCount,
    totalEarnedCents,
    isLoading: attributionsQuery.isLoading,
    isError: attributionsQuery.isError,
    refetch: attributionsQuery.refetch,
    createAttribution,
  };
}
