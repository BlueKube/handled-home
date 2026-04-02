import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

interface HomeTeamCardProps {
  serviceDayConfirmed?: boolean;
}

export function HomeTeamCard({ serviceDayConfirmed = false }: HomeTeamCardProps) {
  const { user } = useAuth();

  const { data: providers, isLoading, isError } = useQuery({
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

      // Collect unique property IDs for a single jobs query
      const propertyIds = [...new Set(activations.map((a) => a.property_id).filter(Boolean))] as string[];
      
      // Single query: get next scheduled job per provider_org_id
      let jobsByProvider: Record<string, string> = {};
      if (propertyIds.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        const { data: jobs } = await supabase
          .from("jobs")
          .select("provider_org_id, scheduled_date")
          .in("property_id", propertyIds)
          .eq("status", "scheduled")
          .gte("scheduled_date", today)
          .order("scheduled_date", { ascending: true });
        
        if (jobs) {
          for (const job of jobs) {
            // Keep earliest date per provider
            if (!jobsByProvider[job.provider_org_id]) {
              jobsByProvider[job.provider_org_id] = job.scheduled_date!;
            }
          }
        }
      }

      return activations.map((act) => {
        const providerOrg = act.provider_orgs as any;
        const sku = act.service_skus as any;
        return {
          id: act.id,
          providerName: providerOrg?.name ?? "Provider",
          providerLogoUrl: providerOrg?.logo_url ?? null,
          category: sku?.category ?? "general",
          nextVisitDate: jobsByProvider[act.provider_org_id] ?? null,
        };
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    );
  }

  if (isError || !providers || providers.length === 0) return null;

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
                        : serviceDayConfirmed
                          ? "Scheduling in progress"
                          : "Complete setup to schedule visits"}
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
