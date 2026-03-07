import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ProviderIssueType = "access_failure" | "unavailable" | "weather" | "quality_block";

export interface ProviderIssueReasonCode {
  value: string;
  label: string;
  issueType: ProviderIssueType;
}

/** Reason codes per PRD — access failure uses customer-caused codes */
export const PROVIDER_ISSUE_REASON_CODES: ProviderIssueReasonCode[] = [
  // Access failure
  { value: "gate_locked", label: "Gate locked", issueType: "access_failure" },
  { value: "customer_not_home", label: "Customer not home", issueType: "access_failure" },
  { value: "wrong_code", label: "Wrong access code", issueType: "access_failure" },
  { value: "dog_loose", label: "Dog loose in yard", issueType: "access_failure" },
  { value: "other_access", label: "Other access issue", issueType: "access_failure" },

  // Unavailable
  { value: "sick", label: "Sick / can't work today", issueType: "unavailable" },
  { value: "vehicle_issue", label: "Vehicle issue", issueType: "unavailable" },
  { value: "personal_emergency", label: "Personal emergency", issueType: "unavailable" },

  // Weather
  { value: "severe_weather", label: "Severe weather", issueType: "weather" },
  { value: "unsafe_conditions", label: "Unsafe conditions (lightning, ice)", issueType: "weather" },

  // Quality block
  { value: "hazard_on_site", label: "Hazard on site", issueType: "quality_block" },
  { value: "equipment_failure", label: "Equipment failure", issueType: "quality_block" },
  { value: "scope_mismatch", label: "Job scope doesn't match reality", issueType: "quality_block" },
];

export const PROVIDER_ISSUE_TYPES: { value: ProviderIssueType; label: string; description: string }[] = [
  { value: "access_failure", label: "Can't access property", description: "Gate locked, customer not home, wrong code" },
  { value: "unavailable", label: "I'm unavailable", description: "Sick, vehicle issue, or emergency" },
  { value: "weather", label: "Weather / safety", description: "Severe weather or unsafe conditions" },
  { value: "quality_block", label: "Can't complete job", description: "Hazard, equipment, or scope issue" },
];

export function getReasonCodesForType(issueType: ProviderIssueType): ProviderIssueReasonCode[] {
  return PROVIDER_ISSUE_REASON_CODES.filter((r) => r.issueType === issueType);
}

/**
 * Calls report_provider_issue RPC — creates a reactive ops_exception.
 * For access_failure, also creates a customer_reschedule_hold.
 */
export function useReportProviderIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      visitId: string;
      issueType: ProviderIssueType;
      reasonCode: string;
      note?: string;
    }) => {
      const { data, error } = await supabase.rpc("report_provider_issue", {
        p_visit_id: params.visitId,
        p_issue_type: params.issueType,
        p_reason_code: params.reasonCode,
        p_note: params.note ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider_jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job_detail"] });
    },
  });
}
