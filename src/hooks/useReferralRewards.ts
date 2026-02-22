import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useReferralRewards(filters?: { status?: string; programId?: string }) {
  const { user, activeRole } = useAuth();

  return useQuery({
    queryKey: ["referral-rewards", user?.id, activeRole, filters],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("referral_rewards")
        .select("*, referral_programs(name), referrals(referrer_user_id, referred_user_id)")
        .order("created_at", { ascending: false });

      if (activeRole !== "admin") {
        query = query.eq("recipient_user_id", user!.id);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status as any);
      }
      if (filters?.programId) {
        query = query.eq("program_id", filters.programId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
