import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminBilling() {
  const exceptionsQuery = useQuery({
    queryKey: ["admin-billing-exceptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_exceptions")
        .select("*")
        .eq("status", "OPEN")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const invoicesQuery = useQuery({
    queryKey: ["admin-all-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_invoices")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const payoutsQuery = useQuery({
    queryKey: ["admin-all-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_payouts")
        .select("*, provider_orgs:provider_org_id(name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        ...p,
        provider_name: p.provider_orgs?.name ?? null,
      }));
    },
  });

  const invoices = invoicesQuery.data ?? [];
  const paidToday = invoices
    .filter(i => i.status === "PAID" && i.paid_at && new Date(i.paid_at).toDateString() === new Date().toDateString())
    .reduce((s, i) => s + i.total_cents, 0);
  const failedCount = invoices.filter(i => i.status === "FAILED").length;

  return {
    exceptions: exceptionsQuery.data ?? [],
    invoices,
    payouts: payoutsQuery.data ?? [],
    paidToday,
    failedCount,
    isLoading: exceptionsQuery.isLoading,
    isError: exceptionsQuery.isError || invoicesQuery.isError || payoutsQuery.isError,
    refetch: () => {
      exceptionsQuery.refetch();
      invoicesQuery.refetch();
      payoutsQuery.refetch();
    },
  };
}
