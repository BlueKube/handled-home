import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ServiceDayAssignment {
  id: string;
  customer_id: string;
  property_id: string;
  zone_id: string;
  day_of_week: string;
  service_window: string;
  status: string;
  rejection_used: boolean;
  reserved_until: string | null;
  reason_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceDayOffer {
  id: string;
  assignment_id: string;
  offered_day_of_week: string;
  offered_window: string;
  offer_type: string;
  rank: number;
  accepted: boolean;
  created_at: string;
}

export function useServiceDayAssignment(propertyId: string | null | undefined) {
  const { user } = useAuth();

  const assignmentQuery = useQuery({
    queryKey: ["service-day-assignment", propertyId],
    enabled: !!user && !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_day_assignments")
        .select("*")
        .eq("property_id", propertyId!)
        .in("status", ["offered", "confirmed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ServiceDayAssignment | null;
    },
  });

  const offersQuery = useQuery({
    queryKey: ["service-day-offers", assignmentQuery.data?.id],
    enabled: !!assignmentQuery.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_day_offers")
        .select("*")
        .eq("assignment_id", assignmentQuery.data!.id)
        .order("rank");
      if (error) throw error;
      return (data ?? []) as ServiceDayOffer[];
    },
  });

  return {
    assignment: assignmentQuery.data,
    offers: offersQuery.data ?? [],
    isLoading: assignmentQuery.isLoading,
    refetch: () => {
      assignmentQuery.refetch();
      offersQuery.refetch();
    },
  };
}
