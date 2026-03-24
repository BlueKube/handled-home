import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const FRAUD_FLAG_CATEGORIES = [
  "velocity_cap",
  "suspicious_ip",
  "same_household",
  "self_referral",
  "rapid_redemption",
] as const;

export type FraudFlagCategory = typeof FRAUD_FLAG_CATEGORIES[number];

export function useReferralAdmin() {
  const qc = useQueryClient();

  const riskFlags = useQuery({
    queryKey: ["referral-risk-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_risk_flags")
        .select("*, referrals(referrer_user_id, referred_user_id), referral_rewards(amount_cents, status, reward_type)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const voidReward = useMutation({
    mutationFn: async ({ rewardId, reason }: { rewardId: string; reason: string }) => {
      const { data, error } = await supabase.rpc("void_referral_reward", {
        p_reward_id: rewardId,
        p_reason: reason,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-rewards"] });
      toast.success("Reward voided");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const releaseHold = useMutation({
    mutationFn: async ({ rewardId, reason }: { rewardId: string; reason: string }) => {
      const { data, error } = await supabase.rpc("release_referral_hold", {
        p_reward_id: rewardId,
        p_reason: reason,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-rewards"] });
      toast.success("Hold released");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const applyReward = useMutation({
    mutationFn: async (rewardId: string) => {
      const { data, error } = await supabase.rpc("apply_referral_reward", {
        p_reward_id: rewardId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-rewards"] });
      toast.success("Reward applied to ledger");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const overrideAttribution = useMutation({
    mutationFn: async ({ referralId, newReferrerId, reason }: { referralId: string; newReferrerId: string; reason: string }) => {
      const { data, error } = await supabase.rpc("override_referral_attribution", {
        p_referral_id: referralId,
        p_new_referrer_id: newReferrerId,
        p_reason: reason,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referrals"] });
      toast.success("Attribution overridden");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reviewFlag = useMutation({
    mutationFn: async ({ flagId, action, note, category }: { flagId: string; action: "reviewed" | "dismissed"; note?: string; category?: FraudFlagCategory }) => {
      const { error } = await supabase
        .from("referral_risk_flags")
        .update({ status: action, reviewed_by_admin_user_id: (await supabase.auth.getUser()).data.user?.id, reviewed_at: new Date().toISOString(), review_note: note } as any)
        .eq("id", flagId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-risk-flags"] });
      toast.success("Flag updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { riskFlags, voidReward, releaseHold, applyReward, overrideAttribution, reviewFlag };
}
