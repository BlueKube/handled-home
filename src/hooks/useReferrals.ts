import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useReferrals(mode: "own" | "all" = "own") {
  const { user, activeRole } = useAuth();

  return useQuery({
    queryKey: ["referrals", mode, user?.id],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("referrals")
        .select("*, referral_programs(name), referral_milestones(*), referral_codes(code)")
        .order("created_at", { ascending: false });

      if (mode === "own" && activeRole !== "admin") {
        query = query.or(`referrer_user_id.eq.${user!.id},referred_user_id.eq.${user!.id}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
