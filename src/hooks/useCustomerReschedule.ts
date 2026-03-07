import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RescheduleHold {
  id: string;
  visit_id: string;
  customer_id: string;
  held_date: string;
  held_window_start: string | null;
  held_window_end: string | null;
  hold_type: string;
  status: string;
  expires_at: string;
  created_at: string;
}

/**
 * Fetches any active reschedule hold for a given visit.
 */
export function useRescheduleHold(visitId: string | undefined) {
  const { user } = useAuth();

  return useQuery<RescheduleHold | null>({
    queryKey: ["reschedule_hold", visitId],
    enabled: !!visitId && !!user,
    queryFn: async () => {
      if (!visitId || !user) return null;
      const { data, error } = await supabase
        .from("customer_reschedule_holds")
        .select("*")
        .eq("visit_id", visitId)
        .eq("customer_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as RescheduleHold | null;
    },
  });
}

/**
 * Confirms or releases a reschedule hold.
 * p_action = 'confirm' | 'release'
 */
export function useConfirmRescheduleHold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { holdId: string; action: "confirm" | "release" }) => {
      const { data, error } = await supabase.rpc("confirm_reschedule_hold", {
        p_hold_id: params.holdId,
        p_action: params.action,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reschedule_hold"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming_visits"] });
    },
  });
}

/**
 * Requests a customer-initiated reschedule. Creates a customer_reschedule exception.
 */
export function useRequestReschedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { visitId: string; reason?: string }) => {
      const { data, error } = await supabase.rpc("request_customer_reschedule", {
        p_visit_id: params.visitId,
        p_reason: params.reason ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upcoming_visits"] });
    },
  });
}

/**
 * Applies a customer reschedule — picks a new date/window.
 */
export function useApplyReschedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      visitId: string;
      newDate: string;
      newWindowStart?: string;
      newWindowEnd?: string;
      exceptionId?: string;
    }) => {
      const { data, error } = await supabase.rpc("apply_customer_reschedule", {
        p_visit_id: params.visitId,
        p_new_date: params.newDate,
        p_new_window_start: params.newWindowStart ?? null,
        p_new_window_end: params.newWindowEnd ?? null,
        p_exception_id: params.exceptionId ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upcoming_visits"] });
      queryClient.invalidateQueries({ queryKey: ["reschedule_hold"] });
    },
  });
}
