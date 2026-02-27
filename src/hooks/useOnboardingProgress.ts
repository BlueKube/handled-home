import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

export const ONBOARDING_STEPS = [
  "property",
  "zone_check",
  "plan",
  "subscribe",
  "service_day",
  "routine",
  "complete",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export interface OnboardingProgress {
  id: string;
  user_id: string;
  current_step: OnboardingStep;
  completed_steps: OnboardingStep[];
  selected_plan_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useOnboardingProgress() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["onboarding_progress", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_onboarding_progress")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as OnboardingProgress | null;
    },
  });

  const upsertProgress = useMutation({
    mutationFn: async (updates: {
      current_step: OnboardingStep;
      completed_steps?: OnboardingStep[];
      selected_plan_id?: string | null;
      metadata?: Record<string, unknown>;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const existing = query.data;
      if (existing) {
        const { error } = await supabase
          .from("customer_onboarding_progress")
          .update({
            current_step: updates.current_step,
            completed_steps: updates.completed_steps ?? existing.completed_steps,
            selected_plan_id: updates.selected_plan_id !== undefined ? updates.selected_plan_id : existing.selected_plan_id,
            metadata: (updates.metadata ?? existing.metadata) as unknown as Json,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("customer_onboarding_progress")
          .insert([{
            user_id: user.id,
            current_step: updates.current_step,
            completed_steps: updates.completed_steps ?? [],
            selected_plan_id: updates.selected_plan_id ?? null,
            metadata: (updates.metadata ?? {}) as unknown as Json,
          }]);
        if (error) throw error;
      }
    },
    // D1-F5: Optimistic cache update to prevent flash of stale data
    onMutate: async (updates) => {
      await qc.cancelQueries({ queryKey: ["onboarding_progress", user?.id] });
      const prev = qc.getQueryData<OnboardingProgress | null>(["onboarding_progress", user?.id]);
      qc.setQueryData<OnboardingProgress | null>(["onboarding_progress", user?.id], (old) => {
        if (!old) return old;
        return {
          ...old,
          current_step: updates.current_step,
          completed_steps: (updates.completed_steps ?? old.completed_steps) as OnboardingStep[],
          selected_plan_id: updates.selected_plan_id !== undefined ? updates.selected_plan_id : old.selected_plan_id,
          metadata: (updates.metadata ?? old.metadata) as Record<string, unknown>,
        };
      });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev !== undefined) {
        qc.setQueryData(["onboarding_progress", user?.id], context.prev);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["onboarding_progress", user?.id] });
    },
  });

  const completeStep = async (step: OnboardingStep, extras?: { selected_plan_id?: string; metadata?: Record<string, unknown> }) => {
    const progress = query.data;
    const completedSteps = progress?.completed_steps ?? [];
    const newCompleted = completedSteps.includes(step) ? completedSteps : [...completedSteps, step];

    const currentIdx = ONBOARDING_STEPS.indexOf(step);
    const nextStep = ONBOARDING_STEPS[currentIdx + 1] ?? "complete";

    await upsertProgress.mutateAsync({
      current_step: nextStep,
      completed_steps: newCompleted as OnboardingStep[],
      selected_plan_id: extras?.selected_plan_id,
      metadata: extras?.metadata,
    });
  };

  const goToStep = async (step: OnboardingStep) => {
    await upsertProgress.mutateAsync({ current_step: step });
  };

  return {
    progress: query.data,
    isLoading: query.isLoading,
    currentStep: (query.data?.current_step ?? "property") as OnboardingStep,
    completedSteps: (query.data?.completed_steps ?? []) as OnboardingStep[],
    selectedPlanId: query.data?.selected_plan_id ?? null,
    completeStep,
    goToStep,
    isSaving: upsertProgress.isPending,
  };
}
