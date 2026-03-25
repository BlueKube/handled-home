import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCustomerBilling() {
  const { user } = useAuth();

  const invoicesQuery = useQuery({
    queryKey: ["customer-invoices", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_invoices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const paymentMethodsQuery = useQuery({
    queryKey: ["customer-payment-methods", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_payment_methods")
        .select("*")
        .eq("status", "active")
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const creditsQuery = useQuery({
    queryKey: ["customer-credits", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_credits")
        .select("*")
        .eq("status", "AVAILABLE")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const availableCredits = creditsQuery.data?.reduce((sum, c) => sum + (c.amount_cents || 0), 0) ?? 0;
  const defaultMethod = paymentMethodsQuery.data?.find((m) => m.is_default) ?? paymentMethodsQuery.data?.[0];
  const latestInvoice = invoicesQuery.data?.[0];
  const hasFailedPayment = latestInvoice?.status === "FAILED";

  return {
    invoices: invoicesQuery.data ?? [],
    paymentMethods: paymentMethodsQuery.data ?? [],
    credits: creditsQuery.data ?? [],
    availableCredits,
    defaultMethod,
    latestInvoice,
    hasFailedPayment,
    isLoading: invoicesQuery.isLoading || paymentMethodsQuery.isLoading,
    isError: invoicesQuery.isError || paymentMethodsQuery.isError || creditsQuery.isError,
    refetch: async () => {
      await Promise.all([invoicesQuery.refetch(), paymentMethodsQuery.refetch(), creditsQuery.refetch()]);
    },
  };
}
