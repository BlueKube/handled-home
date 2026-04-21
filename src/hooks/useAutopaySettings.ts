import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import type { CreditPackId } from "@/lib/creditPacks";

export interface AutopaySettings {
  enabled: boolean;
  pack_id: CreditPackId;
  threshold: number;
}

function parseSettings(metadata: unknown): AutopaySettings | null {
  if (!metadata || typeof metadata !== "object") return null;
  const raw = (metadata as Record<string, unknown>).autopay_credits;
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const enabled = obj.enabled === true;
  const packId = obj.pack_id;
  const threshold = Number(obj.threshold);
  if (typeof packId !== "string" || Number.isNaN(threshold)) return null;
  if (packId !== "starter" && packId !== "homeowner" && packId !== "year_round") return null;
  return { enabled, pack_id: packId, threshold };
}

export function useAutopaySettings() {
  const qc = useQueryClient();
  const { data: subscription } = useCustomerSubscription();

  const settings = parseSettings(subscription?.metadata ?? null);

  const save = useMutation({
    mutationFn: async (next: AutopaySettings) => {
      if (!subscription?.id) throw new Error("No active subscription");
      const existing = (subscription.metadata ?? {}) as Record<string, unknown>;
      const merged = { ...existing, autopay_credits: next };
      const { error } = await supabase
        .from("subscriptions")
        .update({ metadata: merged })
        .eq("id", subscription.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription"] });
      qc.invalidateQueries({ queryKey: ["customer_subscription"] });
    },
  });

  return { settings, save, hasSubscription: !!subscription?.id };
}

export function useHasSavedPaymentMethod() {
  const { data: subscription } = useCustomerSubscription();
  return useQuery({
    queryKey: ["customer_payment_methods_exists", subscription?.customer_id],
    enabled: !!subscription?.customer_id,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("customer_payment_methods")
        .select("id", { head: true, count: "exact" })
        .eq("customer_id", subscription!.customer_id)
        .eq("status", "active");
      if (error) throw error;
      return (count ?? 0) > 0;
    },
  });
}
