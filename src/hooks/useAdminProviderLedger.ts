import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminProviderLedger(providerOrgId: string | undefined) {
  const orgQuery = useQuery({
    queryKey: ["admin-provider-org", providerOrgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_orgs")
        .select("*")
        .eq("id", providerOrgId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!providerOrgId,
  });

  const payoutAccountQuery = useQuery({
    queryKey: ["admin-provider-payout-account", providerOrgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_payout_accounts")
        .select("*")
        .eq("provider_org_id", providerOrgId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!providerOrgId,
  });

  const earningsQuery = useQuery({
    queryKey: ["admin-provider-earnings", providerOrgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_earnings")
        .select("*, jobs(scheduled_date, property_id, properties(street_address))")
        .eq("provider_org_id", providerOrgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!providerOrgId,
  });

  const holdsQuery = useQuery({
    queryKey: ["admin-provider-holds", providerOrgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_holds")
        .select("*, provider_hold_context(*)")
        .eq("provider_org_id", providerOrgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!providerOrgId,
  });

  const payoutsQuery = useQuery({
    queryKey: ["admin-provider-payouts", providerOrgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_payouts")
        .select("*")
        .eq("provider_org_id", providerOrgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!providerOrgId,
  });

  return {
    org: orgQuery.data,
    payoutAccount: payoutAccountQuery.data,
    earnings: earningsQuery.data ?? [],
    holds: holdsQuery.data ?? [],
    payouts: payoutsQuery.data ?? [],
    isLoading: orgQuery.isLoading || earningsQuery.isLoading,
  };
}
