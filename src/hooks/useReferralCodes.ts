import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

function generateCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const limit = 256 - (256 % chars.length); // 248 — reject bytes >= limit to avoid modulo bias
  let result = "";
  let i = 0;
  while (i < length) {
    const [b] = crypto.getRandomValues(new Uint8Array(1));
    if (b < limit) {
      result += chars[b % chars.length];
      i++;
    }
  }
  return result;
}

export function useReferralCodes() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const codes = useQuery({
    queryKey: ["referral-codes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_codes")
        .select("*, referral_programs(name, status, max_rewards_per_referrer_per_week)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Velocity cap: check referrals attributed to this user in the past 7 days
  const velocityCheck = useQuery({
    queryKey: ["referral-velocity", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!user) return 0;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from("referrals" as any)
        .select("id", { count: "exact", head: true })
        .eq("referrer_user_id", user.id)
        .gte("created_at", sevenDaysAgo);
      if (error) throw error;
      return count ?? 0;
    },
  });

  // TODO: Source weeklyLimit from useReferralPrograms for authoritative value when user has no code yet
  const weeklyLimit = codes.data?.[0]?.referral_programs?.max_rewards_per_referrer_per_week ?? 10;
  const weeklyCount = velocityCheck.data ?? 0;
  const isRateLimited = velocityCheck.isSuccess && weeklyCount >= weeklyLimit;
  const rateLimitMessage = isRateLimited
    ? "You've reached your weekly referral limit. Try again next week."
    : null;

  const hasActiveCode = codes.isSuccess && (codes.data ?? []).length > 0;

  const generateCodeMutation = useMutation({
    mutationFn: async (programId: string) => {
      if (!user) throw new Error("Not authenticated");
      // Re-check velocity cap from DB to avoid stale cache
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: recentCount, error: velError } = await supabase
        .from("referrals" as any)
        .select("id", { count: "exact", head: true })
        .eq("referrer_user_id", user.id)
        .gte("created_at", sevenDaysAgo);
      if (velError) throw velError;
      if ((recentCount ?? 0) >= weeklyLimit) {
        throw new Error("You've reached your weekly referral limit. Try again next week.");
      }
      // Enforce one code per customer — re-check from DB to avoid stale cache
      const { count, error: countError } = await supabase
        .from("referral_codes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (countError) throw countError;
      if ((count ?? 0) > 0) {
        throw new Error("You already have a referral code. Only one code per account is allowed.");
      }
      const code = generateCode();
      const { data, error } = await supabase
        .from("referral_codes")
        .insert({ program_id: programId, user_id: user.id, code } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-codes"] });
      qc.invalidateQueries({ queryKey: ["referral-velocity"] });
      toast.success("Referral code generated — share it to start earning.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { codes, generateCode: generateCodeMutation, hasActiveCode, isRateLimited, rateLimitMessage };
}
