import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ProviderApplicationRow = Database["public"]["Tables"]["provider_applications"]["Row"];
type AgreementClauseRow = Database["public"]["Tables"]["provider_agreement_acceptance"]["Row"];
type ComplianceDocRow = Database["public"]["Tables"]["provider_compliance_documents"]["Row"];

export interface ApplicationDetailResult extends ProviderApplicationRow {
  provider_orgs: { id: string; name: string; status: string } | null;
  agreement_clauses: AgreementClauseRow[];
  compliance_docs: ComplianceDocRow[];
}

export function useAdminApplications() {
  const qc = useQueryClient();

  const applications = useQuery({
    queryKey: ["admin-provider-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_applications")
        .select("*, provider_orgs:provider_org_id(id, name, status)")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const reviewApplication = useMutation({
    mutationFn: async (params: {
      application_id: string;
      decision: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase.rpc("review_provider_application", {
        p_application_id: params.application_id,
        p_decision: params.decision,
        p_reason: params.reason || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-provider-applications"] });
      qc.invalidateQueries({ queryKey: ["admin-provider-application-detail"] });
    },
  });

  return { applications, reviewApplication };
}

/** Separate hook for application detail — avoids Rules of Hooks violation */
export function useApplicationDetail(id: string) {
  return useQuery({
    queryKey: ["admin-provider-application-detail", id],
    enabled: !!id,
    queryFn: async (): Promise<ApplicationDetailResult> => {
      const { data, error } = await supabase
        .from("provider_applications")
        .select("*, provider_orgs:provider_org_id(id, name, status)")
        .eq("id", id)
        .single();
      if (error) throw error;

      // Fetch agreement clauses
      const { data: clauses } = await supabase
        .from("provider_agreement_acceptance")
        .select("*")
        .eq("application_id", id)
        .order("accepted_at", { ascending: true });

      // Fetch compliance docs if org exists
      let complianceDocs: ComplianceDocRow[] = [];
      if (data.provider_org_id) {
        const { data: docs } = await supabase
          .from("provider_compliance_documents")
          .select("*")
          .eq("org_id", data.provider_org_id);
        complianceDocs = (docs ?? []) as ComplianceDocRow[];
      }

      return {
        ...data,
        provider_orgs: data.provider_orgs as any,
        agreement_clauses: (clauses ?? []) as AgreementClauseRow[],
        compliance_docs: complianceDocs,
      };
    },
  });
}
