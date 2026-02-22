import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useReferralPrograms() {
  const qc = useQueryClient();

  const programs = useQuery({
    queryKey: ["referral-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_programs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createProgram = useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      referrer_type?: string;
      milestone_triggers?: string[];
      referrer_reward_amount_cents?: number;
      referred_reward_amount_cents?: number;
      referrer_reward_type?: string;
      referred_reward_type?: string;
      hold_days?: number;
      max_rewards_per_referrer_per_week?: number | null;
      max_reward_dollars_per_referrer_per_4weeks?: number | null;
      status?: string;
    }) => {
      const { data, error } = await supabase
        .from("referral_programs")
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-programs"] });
      toast.success("Program created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateProgram = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("referral_programs")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-programs"] });
      toast.success("Program updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { programs, createProgram, updateProgram };
}
