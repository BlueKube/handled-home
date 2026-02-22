import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GrowthStats {
  invitesSent: number;
  installs: number;
  subscriptions: number;
  firstVisits: number;
  bonusesPendingCents: number;
  bonusesPaidCents: number;
}

export function useProviderGrowthStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["provider-growth-stats", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<GrowthStats> => {
      const { data: codes } = await supabase
        .from("referral_codes")
        .select("id, uses_count")
        .eq("user_id", user!.id);

      const codeIds = codes?.map((c: any) => c.id) ?? [];
      const invitesSent = codes?.reduce((s: number, c: any) => s + (c.uses_count || 0), 0) ?? 0;

      if (codeIds.length === 0) {
        return { invitesSent: 0, installs: 0, subscriptions: 0, firstVisits: 0, bonusesPendingCents: 0, bonusesPaidCents: 0 };
      }

      // Use typed-loose queries to avoid deep instantiation on generated types
      const client = supabase as any;

      const { data: referrals } = await client
        .from("referrals")
        .select("id")
        .in("code_id", codeIds);

      const referralIds = (referrals ?? []).map((r: any) => r.id);
      const installs = referralIds.length;

      let subscriptions = 0;
      let firstVisits = 0;
      if (referralIds.length > 0) {
        const { data: milestones } = await client
          .from("referral_milestones")
          .select("milestone")
          .in("referral_id", referralIds);
        subscriptions = (milestones ?? []).filter((m: any) => m.milestone === "subscribed").length;
        firstVisits = (milestones ?? []).filter((m: any) => m.milestone === "first_visit").length;
      }

      const { data: rewards } = await client
        .from("referral_rewards")
        .select("amount_cents, status")
        .eq("referrer_user_id", user!.id);

      const rewardsList = (rewards ?? []) as any[];
      const bonusesPendingCents = rewardsList.filter((r) => ["pending", "on_hold", "earned"].includes(r.status)).reduce((s: number, r: any) => s + r.amount_cents, 0);
      const bonusesPaidCents = rewardsList.filter((r) => ["applied", "paid"].includes(r.status)).reduce((s: number, r: any) => s + r.amount_cents, 0);

      return { invitesSent, installs, subscriptions, firstVisits, bonusesPendingCents, bonusesPaidCents };
    },
  });
}
