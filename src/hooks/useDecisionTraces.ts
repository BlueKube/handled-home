import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DecisionTrace {
  id: string;
  decision_type: string;
  entity_type: string;
  entity_id: string;
  inputs: Record<string, any>;
  candidates: any[];
  scoring: Record<string, any>;
  outcome: Record<string, any>;
  override_event_id: string | null;
  created_at: string;
}

export function useDecisionTraces(entityType: string, entityId: string | undefined) {
  return useQuery({
    queryKey: ["decision-traces", entityType, entityId],
    enabled: !!entityId,
    queryFn: async (): Promise<DecisionTrace[]> => {
      const { data, error } = await supabase
        .from("decision_traces")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as DecisionTrace[];
    },
  });
}
