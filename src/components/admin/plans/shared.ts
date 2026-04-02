import { supabase } from "@/integrations/supabase/client";

export const MODEL_LABELS: Record<string, string> = {
  credits_per_cycle: "Credits per Cycle",
  count_per_cycle: "Count per Cycle",
  minutes_per_cycle: "Minutes per Cycle",
};

export const RULE_OPTIONS = [
  { value: "none", label: "No rule" },
  { value: "included", label: "Included" },
  { value: "extra_allowed", label: "Extra allowed" },
  { value: "blocked", label: "Blocked" },
  { value: "provider_only", label: "Provider only" },
];

export async function updatePlanVersion(planId: string, versionId: string) {
  await supabase.from("plans").update({ current_entitlement_version_id: versionId } as any).eq("id", planId);
}
