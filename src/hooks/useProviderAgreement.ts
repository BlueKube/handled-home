import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const AGREEMENT_CLAUSES = [
  {
    key: "independent_contractor",
    title: "You are an independent business",
    text: "You are an independent contractor, not an employee of Handled Home. You control your work methods and your team. You're responsible for taxes, permits, insurance, and legal compliance.",
  },
  {
    key: "sku_levels",
    title: "Perform services using Handled SKUs + Levels",
    text: 'For Handled Home jobs, you agree to perform services according to our Service Definitions (SKUs) and Levels (scope + time + proof). No custom scope changes or "side agreements" for Platform jobs.',
  },
  {
    key: "proof_of_work",
    title: "Proof is required for every job",
    text: "You agree to complete required photos and checklists for every job. Proof protects you and the customer and keeps support costs low.",
  },
  {
    key: "no_side_payments",
    title: "All payments must go through Handled Home",
    text: "You will not accept cash, checks, or off-platform payments for Handled Home jobs, upgrades, or add-ons, unless explicitly authorized in writing by Handled Home.",
  },
  {
    key: "professional_conduct",
    title: "Be reliable and professional",
    text: "You agree to be on time, follow access instructions, treat the property respectfully, and communicate professionally. Repeated no-shows, late cancellations, or poor conduct can result in suspension or removal.",
  },
  {
    key: "schedule_discipline",
    title: "Follow scheduled windows and route plans",
    text: "You agree to follow job schedules and route plans provided by Handled Home, and use the app for job status updates. If you need to reschedule, you'll follow platform procedures.",
  },
  {
    key: "courtesy_upgrades",
    title: "Use courtesy upgrades only when allowed",
    text: "If enabled for your account, you may perform a Courtesy Upgrade only according to Handled policy, with required reason codes and proof. You may recommend a higher Level for next cycle when needed to meet standards.",
  },
  {
    key: "byoc_integrity",
    title: "BYOC incentives require integrity",
    text: "If you invite your customers (BYOC), you agree not to create fake accounts, misrepresent incentives, or manipulate signups. Abuse results in immediate removal and forfeiture of unpaid bonuses.",
  },
  {
    key: "customer_data",
    title: "Protect customer and platform information",
    text: "Customer information and platform operations are confidential. You will not use customer data for unrelated marketing or share it outside your business operations for Handled jobs.",
  },
  {
    key: "non_circumvention",
    title: "Don't take Handled Home customers off-platform",
    text: "If Handled Home introduces you to a customer, you agree not to redirect that customer to pay you outside the platform for the same services, during the period you're active on Handled Home.",
  },
  {
    key: "compliance_licensing",
    title: "You'll maintain required licensing and insurance",
    text: "You agree to maintain required licenses, insurance, and permits for your category and region, and provide updated proof when requested.",
  },
  {
    key: "termination_enforcement",
    title: "We can suspend or remove providers who break standards",
    text: "Handled Home may suspend or remove providers for fraud, safety issues, repeated proof failures, side payments, or serious customer complaints. You may stop using the platform at any time, subject to completing accepted jobs.",
  },
] as const;

export type ClauseKey = (typeof AGREEMENT_CLAUSES)[number]["key"];

export function useProviderAgreement(applicationId?: string) {
  const queryClient = useQueryClient();

  const acceptedQuery = useQuery({
    queryKey: ["provider_agreement_acceptance", applicationId],
    queryFn: async () => {
      if (!applicationId) return [];
      const { data, error } = await supabase
        .from("provider_agreement_acceptance")
        .select("clause_key, accepted_at")
        .eq("application_id", applicationId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!applicationId,
  });

  const acceptClause = useMutation({
    mutationFn: async (clauseKey: string) => {
      if (!applicationId) throw new Error("No application ID");
      const { data, error } = await supabase
        .from("provider_agreement_acceptance")
        .insert({
          application_id: applicationId,
          clause_key: clauseKey,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider_agreement_acceptance", applicationId] });
    },
  });

  const acceptedKeys = new Set((acceptedQuery.data ?? []).map((a) => a.clause_key));
  const allAccepted = AGREEMENT_CLAUSES.every((c) => acceptedKeys.has(c.key));
  const acceptedCount = acceptedKeys.size;

  return {
    accepted: acceptedQuery.data ?? [],
    acceptedKeys,
    acceptedCount,
    totalClauses: AGREEMENT_CLAUSES.length,
    allAccepted,
    loading: acceptedQuery.isLoading,
    acceptClause,
  };
}
