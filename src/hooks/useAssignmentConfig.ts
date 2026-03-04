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
  group: "weights" | "thresholds" | "capacity" | "bundling" | "sequencing" | "eta" | "availability" | "anchored" | "late" | "window_offering" | "piggybacking" | "service_week";
  min: number;
  max: number;
  step: number;
  unit: string;
}

export const DIAL_META: DialMeta[] = [
  // Sprint 5 — Assignment weights
  { key: "w_distance", label: "Distance Weight", group: "weights", min: 0, max: 1, step: 0.05, unit: "" },
  { key: "w_balance", label: "Balance Weight", group: "weights", min: 0, max: 1, step: 0.05, unit: "" },
  { key: "w_spread", label: "Spread Weight", group: "weights", min: 0, max: 1, step: 0.05, unit: "" },
  { key: "w_familiarity", label: "Familiarity Weight", group: "weights", min: 0, max: 1, step: 0.05, unit: "" },
  { key: "w_zone_affinity", label: "Zone Affinity Weight", group: "weights", min: 0, max: 1, step: 0.05, unit: "" },
  // Sprint 5 — Assignment thresholds
  { key: "max_candidate_drive_minutes", label: "Max Drive Time", group: "thresholds", min: 10, max: 120, step: 5, unit: "min" },
  { key: "reassign_min_score_delta", label: "Reassign Min Score Delta", group: "thresholds", min: 0, max: 20, step: 0.5, unit: "pts" },
  { key: "reassign_min_percent", label: "Reassign Min %", group: "thresholds", min: 0, max: 1, step: 0.05, unit: "" },
  { key: "freeze_strictness_multiplier", label: "Freeze Strictness", group: "thresholds", min: 1, max: 5, step: 0.5, unit: "×" },
  // Sprint 5 — Capacity
  { key: "utilization_target", label: "Utilization Target", group: "capacity", min: 0.5, max: 1, step: 0.05, unit: "" },
  { key: "default_task_minutes", label: "Default Task Minutes", group: "capacity", min: 10, max: 120, step: 5, unit: "min" },
  { key: "familiarity_cap_minutes", label: "Familiarity Cap", group: "capacity", min: 0, max: 60, step: 5, unit: "min" },
  { key: "buffer_minutes", label: "Buffer Minutes", group: "capacity", min: 0, max: 30, step: 5, unit: "min" },
  // Sprint 6 — Bundling
  { key: "setup_base_minutes", label: "Setup Base Minutes", group: "bundling", min: 0, max: 15, step: 1, unit: "min" },
  { key: "setup_cap_minutes", label: "Setup Cap Minutes", group: "bundling", min: 5, max: 30, step: 5, unit: "min" },
  { key: "split_penalty_minutes", label: "Split Penalty Minutes", group: "bundling", min: 0, max: 60, step: 5, unit: "min" },
  // Sprint 6 — Sequencing
  { key: "min_improvement_minutes", label: "Min Improvement Minutes", group: "sequencing", min: 0, max: 30, step: 1, unit: "min" },
  { key: "min_improvement_percent", label: "Min Improvement %", group: "sequencing", min: 0, max: 25, step: 1, unit: "%" },
  { key: "overtime_weight", label: "Overtime Weight", group: "sequencing", min: 0, max: 5, step: 0.5, unit: "×" },
  { key: "window_violation_weight", label: "Window Violation Weight", group: "sequencing", min: 0, max: 10, step: 0.5, unit: "×" },
  { key: "reorder_thrash_weight", label: "Reorder Thrash Weight", group: "sequencing", min: 0, max: 5, step: 0.5, unit: "×" },
  { key: "split_penalty_weight", label: "Split Penalty Weight", group: "sequencing", min: 0, max: 5, step: 0.5, unit: "×" },
  // Sprint 6 — ETA
  { key: "base_range_minutes", label: "Base ETA Range", group: "eta", min: 30, max: 120, step: 15, unit: "min" },
  { key: "increment_per_bucket", label: "Increment per Bucket", group: "eta", min: 0, max: 30, step: 5, unit: "min" },
  // Sprint 6 — Availability
  { key: "min_handled_hours_per_week", label: "Min Hours/Week", group: "availability", min: 4, max: 20, step: 1, unit: "hr" },
  { key: "full_marketplace_hours_per_week", label: "Full Hours/Week", group: "availability", min: 8, max: 40, step: 1, unit: "hr" },
  { key: "max_recurring_blocks_per_week", label: "Max Recurring Blocks", group: "availability", min: 1, max: 7, step: 1, unit: "" },
  { key: "max_segments_per_day", label: "Max Segments/Day", group: "availability", min: 1, max: 5, step: 1, unit: "" },
  { key: "min_segment_minutes", label: "Min Segment Duration", group: "availability", min: 30, max: 180, step: 15, unit: "min" },
  // Sprint 6 — Anchored
  { key: "anchor_buffer_minutes", label: "Anchor Buffer", group: "anchored", min: 10, max: 60, step: 5, unit: "min" },
  { key: "max_added_drive_minutes_per_day", label: "Max Added Drive/Day", group: "anchored", min: 5, max: 60, step: 5, unit: "min" },
  { key: "max_extra_stops_per_day", label: "Max Extra Stops/Day", group: "anchored", min: 0, max: 3, step: 1, unit: "" },
  // Sprint 6 — Late
  { key: "late_grace_minutes", label: "Late Grace Period", group: "late", min: 5, max: 30, step: 5, unit: "min" },
  // Sprint 7 — Window Offering
  { key: "max_windows_shown", label: "Max Windows Shown", group: "window_offering", min: 2, max: 10, step: 1, unit: "" },
  { key: "min_windows_to_show", label: "Min Windows to Show", group: "window_offering", min: 1, max: 6, step: 1, unit: "" },
  { key: "min_lead_time_hours", label: "Min Lead Time", group: "window_offering", min: 6, max: 72, step: 6, unit: "hr" },
  { key: "max_home_required_stops_per_provider_per_day", label: "Max Home Stops/Provider/Day", group: "window_offering", min: 1, max: 8, step: 1, unit: "" },
  { key: "max_home_required_stops_per_zone_per_day", label: "Max Home Stops/Zone/Day", group: "window_offering", min: 5, max: 50, step: 5, unit: "" },
  { key: "default_appointment_window_length_hours", label: "Default Window Length", group: "window_offering", min: 1, max: 6, step: 0.5, unit: "hr" },
  // Sprint 7 — Piggybacking
  { key: "max_piggyback_added_minutes", label: "Max Piggyback Added", group: "piggybacking", min: 10, max: 60, step: 5, unit: "min" },
  { key: "max_piggyback_added_percent", label: "Max Piggyback Added %", group: "piggybacking", min: 0.1, max: 0.5, step: 0.05, unit: "" },
  // Sprint 7 — Service Week
  { key: "due_soon_lead_hours", label: "Due Soon Lead Time", group: "service_week", min: 12, max: 96, step: 12, unit: "hr" },
  { key: "max_provider_committed_flexible_stops_per_day", label: "Max Flex Stops/Day", group: "service_week", min: 0, max: 5, step: 1, unit: "" },
  { key: "max_provider_committed_flexible_minutes_per_day", label: "Max Flex Minutes/Day", group: "service_week", min: 15, max: 120, step: 15, unit: "min" },
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
