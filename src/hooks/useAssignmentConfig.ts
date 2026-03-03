import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AssignmentConfigRow {
  id: string;
  config_key: string;
  config_value: any; // bare scalar stored as jsonb
  description: string | null;
  updated_at: string | null;
  updated_by_user_id: string | null;
}

/** Dial metadata for UI rendering */
export interface DialMeta {
  key: string;
  label: string;
  group: "weights" | "thresholds" | "capacity";
  min: number;
  max: number;
  step: number;
  unit: string;
}

export const DIAL_META: DialMeta[] = [
  { key: "w_distance", label: "Distance Weight", group: "weights", min: 0, max: 1, step: 0.05, unit: "" },
  { key: "w_balance", label: "Balance Weight", group: "weights", min: 0, max: 1, step: 0.05, unit: "" },
  { key: "w_spread", label: "Spread Weight", group: "weights", min: 0, max: 1, step: 0.05, unit: "" },
  { key: "w_familiarity", label: "Familiarity Weight", group: "weights", min: 0, max: 1, step: 0.05, unit: "" },
  { key: "w_zone_affinity", label: "Zone Affinity Weight", group: "weights", min: 0, max: 1, step: 0.05, unit: "" },
  { key: "max_candidate_drive_minutes", label: "Max Drive Time", group: "thresholds", min: 10, max: 120, step: 5, unit: "min" },
  { key: "reassign_min_score_delta", label: "Reassign Min Score Delta", group: "thresholds", min: 0, max: 20, step: 0.5, unit: "pts" },
  { key: "reassign_min_percent", label: "Reassign Min %", group: "thresholds", min: 0, max: 1, step: 0.05, unit: "" },
  { key: "freeze_strictness_multiplier", label: "Freeze Strictness", group: "thresholds", min: 1, max: 5, step: 0.5, unit: "×" },
  { key: "utilization_target", label: "Utilization Target", group: "capacity", min: 0.5, max: 1, step: 0.05, unit: "" },
  { key: "default_task_minutes", label: "Default Task Minutes", group: "capacity", min: 10, max: 120, step: 5, unit: "min" },
  { key: "familiarity_cap_minutes", label: "Familiarity Cap", group: "capacity", min: 0, max: 60, step: 5, unit: "min" },
  { key: "buffer_minutes", label: "Buffer Minutes", group: "capacity", min: 0, max: 30, step: 5, unit: "min" },
];

export function useAssignmentConfig() {
  return useQuery({
    queryKey: ["assignment_config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignment_config")
        .select("*")
        .order("config_key");
      if (error) throw error;
      return (data ?? []) as AssignmentConfigRow[];
    },
  });
}

export function useUpdateAssignmentConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, config_value }: { id: string; config_value: number }) => {
      const { data, error } = await supabase
        .from("assignment_config")
        .update({ config_value, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignment_config"] });
    },
  });
}
