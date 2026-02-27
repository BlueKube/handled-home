import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PlanChangeResult {
  direction: string;
  effective_at: string;
  new_plan_name: string;
}

interface CancelResult {
  status: string;
  effective_at?: string;
  bonus_handles?: number;
}

interface PauseResult {
  status: string;
  paused_at: string;
  resume_at: string;
  pause_weeks: number;
}

export function useSchedulePlanChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ subscriptionId, newPlanId }: { subscriptionId: string; newPlanId: string }) => {
      const { data, error } = await supabase.rpc("schedule_plan_change", {
        p_subscription_id: subscriptionId,
        p_new_plan_id: newPlanId,
      });
      if (error) throw error;
      return data as unknown as PlanChangeResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

export function useCancelPendingPlanChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data, error } = await supabase.rpc("cancel_pending_plan_change", {
        p_subscription_id: subscriptionId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

export function useCancelWithReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      subscriptionId,
      reason,
      feedback,
      acceptRetentionOffer,
    }: {
      subscriptionId: string;
      reason: string;
      feedback?: string;
      acceptRetentionOffer?: boolean;
    }) => {
      const { data, error } = await supabase.rpc("cancel_subscription_with_reason", {
        p_subscription_id: subscriptionId,
        p_reason: reason,
        p_feedback: feedback ?? null,
        p_accept_retention_offer: acceptRetentionOffer ?? false,
      });
      if (error) throw error;
      return data as unknown as CancelResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

export function usePauseSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ subscriptionId, weeks }: { subscriptionId: string; weeks: number }) => {
      const { data, error } = await supabase.rpc("pause_subscription", {
        p_subscription_id: subscriptionId,
        p_weeks: weeks,
      });
      if (error) throw error;
      return data as unknown as PauseResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

export function useResumeSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data, error } = await supabase.rpc("resume_subscription", {
        p_subscription_id: subscriptionId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}
