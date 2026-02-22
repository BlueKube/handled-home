import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ServiceDayAssignmentAdmin {
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

export function useServiceDayAdmin(zoneId: string | null) {
  const qc = useQueryClient();

  const assignmentsQuery = useQuery({
    queryKey: ["service-day-admin-assignments", zoneId],
    enabled: !!zoneId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_day_assignments")
        .select("*")
        .eq("zone_id", zoneId!)
        .in("status", ["offered", "confirmed"])
        .order("day_of_week");
      if (error) throw error;
      return (data ?? []) as ServiceDayAssignmentAdmin[];
    },
  });

  const overrideLogsQuery = useQuery({
    queryKey: ["service-day-override-logs", zoneId],
    enabled: !!zoneId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_day_override_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const overrideAssignment = useMutation({
    mutationFn: async ({
      assignmentId,
      newDay,
      newWindow,
      reason,
      notes,
    }: {
      assignmentId: string;
      newDay: string;
      newWindow: string;
      reason: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase.rpc(
        "admin_override_service_day" as any,
        {
          p_assignment_id: assignmentId,
          p_new_day: newDay,
          p_new_window: newWindow,
          p_reason: reason,
          p_notes: notes ?? null,
        }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Assignment overridden");
      qc.invalidateQueries({ queryKey: ["service-day-admin-assignments", zoneId] });
      qc.invalidateQueries({ queryKey: ["service-day-capacity", zoneId] });
      qc.invalidateQueries({ queryKey: ["service-day-override-logs", zoneId] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return {
    assignments: assignmentsQuery.data ?? [],
    overrideLogs: overrideLogsQuery.data ?? [],
    isLoading: assignmentsQuery.isLoading,
    overrideAssignment,
  };
}
