import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminCustomerLedger(customerId: string | undefined) {
  const profileQuery = useQuery({
    queryKey: ["admin-customer-profile", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", customerId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  const subscriptionQuery = useQuery({
    queryKey: ["admin-customer-subscription", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, plans(name)")
        .eq("customer_id", customerId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  const invoicesQuery = useQuery({
    queryKey: ["admin-customer-invoices", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_invoices")
        .select("*, customer_invoice_line_items(*)")
        .eq("customer_id", customerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  const creditsQuery = useQuery({
    queryKey: ["admin-customer-credits", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_credits")
        .select("*")
        .eq("customer_id", customerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  const paymentsQuery = useQuery({
    queryKey: ["admin-customer-payments", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_payments")
        .select("*")
        .eq("customer_id", customerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  return {
    profile: profileQuery.data,
    subscription: subscriptionQuery.data,
    invoices: invoicesQuery.data ?? [],
    credits: creditsQuery.data ?? [],
    payments: paymentsQuery.data ?? [],
    isLoading: profileQuery.isLoading || invoicesQuery.isLoading,
  };
}
