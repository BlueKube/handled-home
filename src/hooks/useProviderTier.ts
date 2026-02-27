import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TierEntry {
  id: string;
  provider_org_id: string;
  tier: string;
  previous_tier: string | null;
  reason: string;
  hold_period_days: number;
  assignment_priority_modifier: number;
  effective_at: string;
  created_at: string;
}

export interface TrainingGate {
  id: string;
  provider_org_id: string;
  sku_id: string;
  status: string;
  required_score_minimum: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  sku_name?: string;
  sku_category?: string;
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; holdDays: number; priorityMod: number }> = {
  gold: { label: "Gold", color: "text-amber-500", bg: "bg-amber-500/10", holdDays: 2, priorityMod: 2 },
  silver: { label: "Silver", color: "text-slate-400", bg: "bg-slate-400/10", holdDays: 3, priorityMod: 1 },
  standard: { label: "Standard", color: "text-muted-foreground", bg: "bg-muted/50", holdDays: 5, priorityMod: 0 },
};

export { TIER_CONFIG };

export function useProviderTier(providerOrgId: string | undefined) {
  const { user } = useAuth();

  const tierQuery = useQuery<TierEntry | null>({
    queryKey: ["provider_tier_current", providerOrgId],
    enabled: !!user && !!providerOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_tier_history")
        .select("*")
        .eq("provider_org_id", providerOrgId!)
        .order("effective_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as TierEntry | null;
    },
  });

  const historyQuery = useQuery<TierEntry[]>({
    queryKey: ["provider_tier_history", providerOrgId],
    enabled: !!user && !!providerOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_tier_history")
        .select("*")
        .eq("provider_org_id", providerOrgId!)
        .order("effective_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as TierEntry[];
    },
  });

  const gatesQuery = useQuery<TrainingGate[]>({
    queryKey: ["provider_training_gates", providerOrgId],
    enabled: !!user && !!providerOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_training_gates")
        .select("*, service_skus(name, category)")
        .eq("provider_org_id", providerOrgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((g: any) => ({
        ...g,
        sku_name: g.service_skus?.name,
        sku_category: g.service_skus?.category,
      })) as TrainingGate[];
    },
  });

  const currentTier = tierQuery.data?.tier ?? "standard";
  const tierConfig = TIER_CONFIG[currentTier] ?? TIER_CONFIG.standard;

  return {
    currentTier,
    tierConfig,
    tierEntry: tierQuery.data,
    tierHistory: historyQuery.data ?? [],
    trainingGates: gatesQuery.data ?? [],
    pendingGates: (gatesQuery.data ?? []).filter((g) => g.status === "pending"),
    completedGates: (gatesQuery.data ?? []).filter((g) => g.status === "completed"),
    isLoading: tierQuery.isLoading,
  };
}
