import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { getCategoryLabel, getCategoryIcon } from "@/lib/serviceCategories";
import { CalendarDays, Users } from "lucide-react";
import { format, parseISO } from "date-fns";

interface LinkedProvider {
  id: string;
  providerName: string;
  providerLogoUrl: string | null;
  category: string;
  nextVisitDate: string | null;
}

export function HomeTeamCard() {
  const { user } = useAuth();

  const { data: providers, isLoading } = useQuery({
    queryKey: ["home_team", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get BYOC activations with provider org info
      const { data: activations, error } = await supabase
        .from("byoc_activations")
        .select("id, provider_org_id, status, cadence, property_id, sku_id, provider_orgs:provider_org_id(id, name, logo_url), service_skus:sku_id(category)")
        .eq("customer_user_id", user!.id)
        .eq("status", "active");

      if (error) throw error;
      if (!activations || activations.length === 0) return [];

      // Get next scheduled job for each provider
      const results: LinkedProvider[] = [];

      for (const act of activations) {
        const providerOrg = act.provider_orgs as any;
        const sku = act.service_skus as any;
        
        let nextVisitDate: string | null = null;
        
        if (act.property_id) {
          const { data: nextJob } = await supabase
            .from("jobs")
            .select("scheduled_date")
            .eq("property_id", act.property_id)
            .eq("provider_org_id", act.provider_org_id)
            .eq("status", "scheduled")
            .gte("scheduled_date", new Date().toISOString().split("T")[0])
            .order("scheduled_date", { ascending: true })
            .limit(1)
            .maybeSingle();
          
          nextVisitDate = nextJob?.scheduled_date ?? null;
        }

        results.push({
          id: act.id,
          providerName: providerOrg?.name ?? "Provider",
          providerLogoUrl: providerOrg?.logo_url ?? null,
          category: sku?.category ?? "general",
          nextVisitDate,
        });
      }

      return results;
    },
  });

  if (isLoading || !providers || providers.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Your Home Team
        </p>
      </div>

      <div className="space-y-2">
        {providers.map((provider) => {
          const CategoryIcon = getCategoryIcon(provider.category);
          const initial = provider.providerName.charAt(0).toUpperCase();

          return (
            <Card key={provider.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Provider avatar */}
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                    {initial}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{provider.providerName}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CategoryIcon className="h-3 w-3" />
                      <span>{getCategoryLabel(provider.category)}</span>
                    </div>
                  </div>

                  {/* Next visit */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      <span>Next Visit</span>
                    </div>
                    <p className="text-sm font-medium">
                      {provider.nextVisitDate
                        ? format(parseISO(provider.nextVisitDate), "EEE, MMM d")
                        : "Scheduled soon"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
