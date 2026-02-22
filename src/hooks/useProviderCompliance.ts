import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProviderCompliance(orgId?: string) {
  const queryClient = useQueryClient();

  const complianceQuery = useQuery({
    queryKey: ["provider_compliance", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from("provider_compliance")
        .select("*")
        .eq("provider_org_id", orgId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const upsertCompliance = useMutation({
    mutationFn: async (params: {
      orgId: string;
      termsAccepted?: boolean;
      insuranceAttested?: boolean;
      businessType?: string;
      taxFormAttested?: boolean;
      backgroundCheckConsented?: boolean;
      insuranceDocUrl?: string;
      taxDocUrl?: string;
      otherDocUrl?: string;
    }) => {
      const payload: Record<string, any> = {
        provider_org_id: params.orgId,
      };
      if (params.termsAccepted !== undefined) {
        payload.terms_accepted_at = params.termsAccepted ? new Date().toISOString() : null;
      }
      if (params.insuranceAttested !== undefined) payload.insurance_attested = params.insuranceAttested;
      if (params.businessType !== undefined) payload.business_type = params.businessType;
      if (params.taxFormAttested !== undefined) payload.tax_form_attested = params.taxFormAttested;
      if (params.backgroundCheckConsented !== undefined) payload.background_check_consented = params.backgroundCheckConsented;
      if (params.insuranceDocUrl !== undefined) payload.insurance_doc_url = params.insuranceDocUrl;
      if (params.taxDocUrl !== undefined) payload.tax_doc_url = params.taxDocUrl;
      if (params.otherDocUrl !== undefined) payload.other_doc_url = params.otherDocUrl;

      const { data, error } = await supabase
        .from("provider_compliance")
        .upsert(payload as any, { onConflict: "provider_org_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["provider_compliance"] }),
  });

  return { compliance: complianceQuery.data, loading: complianceQuery.isLoading, upsertCompliance };
}
