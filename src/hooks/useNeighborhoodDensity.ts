import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface NeighborhoodDensity {
  count: number;
  zip: string | null;
  milestone: number;
  zone_id: string | null;
}

export function useNeighborhoodDensity() {
  const { user } = useAuth();

  return useQuery<NeighborhoodDensity>({
    queryKey: ["neighborhood-density", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_neighborhood_density" as any,
        { p_user_id: user!.id }
      );
      if (error) throw error;
      return data as unknown as NeighborhoodDensity;
    },
  });
}
