import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderOrg } from "@/hooks/useProviderOrg";

export function useProviderEarnings() {
  const { user } = useAuth();
  const { org } = useProviderOrg();

  const earningsQuery = useQuery({
    queryKey: ["provider-earnings", org?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_earnings")
        .select("*, jobs(scheduled_date, property_id, properties(street_address))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!org?.id,
  });

  const payoutsQuery = useQuery({
    queryKey: ["provider-payouts", org?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_payouts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!org?.id,
  });

  const payoutAccountQuery = useQuery({
    queryKey: ["provider-payout-account", org?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_payout_accounts")
        .select("*")
        .eq("provider_org_id", org!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!org?.id,
  });

  const holdsQuery = useQuery({
    queryKey: ["provider-holds", org?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_holds")
        .select("*")
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!org?.id,
  });

  const earnings = earningsQuery.data ?? [];
  const eligibleBalance = earnings.filter(e => e.status === "ELIGIBLE").reduce((s, e) => s + e.total_cents, 0);
  const heldBalance = earnings.filter(e => ["HELD", "HELD_UNTIL_READY"].includes(e.status)).reduce((s, e) => s + e.total_cents, 0);

  return {
    earnings,
    payouts: payoutsQuery.data ?? [],
    payoutAccount: payoutAccountQuery.data,
    holds: holdsQuery.data ?? [],
    eligibleBalance,
    heldBalance,
    isLoading: earningsQuery.isLoading,
    isAccountReady: payoutAccountQuery.data?.status === "READY",
  };
}
