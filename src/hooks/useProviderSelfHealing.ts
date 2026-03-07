import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ProviderActionType = "running_late" | "reorder_stops" | "push_stop";

export interface ProposeActionResult {
  success: boolean;
  proposal_id?: string;
  decision?: "approved" | "denied";
  reason?: string;
  customer_notified?: boolean;
  error?: string;
}

export function useProposeProviderAction() {
  const queryClient = useQueryClient();

  return useMutation<
    ProposeActionResult,
    Error,
    { visitId: string; actionType: ProviderActionType; payload?: Record<string, unknown> }
  >({
    mutationFn: async ({ visitId, actionType, payload }) => {
      const { data, error } = await supabase.rpc(
        "propose_provider_action" as any,
        {
          p_visit_id: visitId,
          p_action_type: actionType,
          p_payload: payload ?? {},
        } as any
      );
      if (error) throw error;
      return data as unknown as ProposeActionResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-detail"] });
    },
  });
}

export const SELF_HEALING_ACTIONS = [
  {
    value: "running_late" as const,
    label: "Running Late",
    description: "Update your ETA — the system will notify the customer if needed",
    icon: "Clock",
  },
  {
    value: "reorder_stops" as const,
    label: "Reorder Stops",
    description: "Change the order of your remaining stops today",
    icon: "ArrowUpDown",
  },
  {
    value: "push_stop" as const,
    label: "Push Stop Later",
    description: "Move this stop later in the day (flex/unattended only)",
    icon: "ArrowRight",
  },
] as const;
