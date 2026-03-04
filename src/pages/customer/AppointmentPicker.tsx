import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { AppointmentWindowPicker } from "@/components/customer/AppointmentWindowPicker";
import {
  useAppointmentWindows,
  useConfirmAppointmentWindow,
  type OfferedWindow,
} from "@/hooks/useAppointmentWindows";

/**
 * Page for picking an appointment window for a specific visit.
 * Route: /customer/appointment/:visitId
 */
export default function AppointmentPicker() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const { data: subscription } = useCustomerSubscription();

  // Fetch visit metadata to get property_id, tasks (for category + duration)
  const { data: visitMeta, isLoading: metaLoading } = useQuery({
    queryKey: ["visit_meta_for_picker", visitId],
    enabled: !!visitId,
    queryFn: async () => {
      if (!visitId) return null;

      const { data: visit, error } = await supabase
        .from("visits")
        .select("id, property_id, scheduled_date, scheduling_profile")
        .eq("id", visitId)
        .single();

      if (error) throw error;
      if (!visit) return null;

      // Get tasks with SKU info
      const { data: tasks } = await supabase
        .from("visit_tasks")
        .select("sku_id, duration_estimate_minutes, service_skus(name, category_key)")
        .eq("visit_id", visitId);

      const taskArr = (tasks ?? []) as any[];
      const category_key = taskArr[0]?.service_skus?.category_key ?? "lawn_care";
      const totalDuration = taskArr.reduce((sum: number, t: any) => sum + (t.duration_estimate_minutes ?? 0), 0);
      const taskSummary = taskArr.map((t: any) => t.service_skus?.name ?? "Service").join(", ");

      return {
        visit_id: visit.id,
        property_id: visit.property_id,
        scheduled_date: visit.scheduled_date,
        category_key,
        total_duration: totalDuration || 60,
        task_summary: taskSummary || "Home service",
      };
    },
  });

  // Zone comes from customer subscription
  const zone_id = subscription?.zone_id ?? null;

  // Fetch available windows
  const windowParams = visitMeta && zone_id
    ? {
        zone_id,
        category_key: visitMeta.category_key,
        property_id: visitMeta.property_id,
        service_duration_minutes: visitMeta.total_duration,
      }
    : null;

  const { data: windowData, isLoading: windowsLoading } = useAppointmentWindows(windowParams);
  const confirmMutation = useConfirmAppointmentWindow();

  const handleSelect = (window: OfferedWindow) => {
    if (!visitId) return;
    confirmMutation.mutate(
      {
        visit_id: visitId,
        window_start: window.window_start,
        window_end: window.window_end,
        customer_window_preference: window.window_label,
      },
      {
        onSuccess: () => navigate("/customer/upcoming"),
      }
    );
  };

  if (metaLoading) {
    return (
      <div className="p-6 max-w-lg space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    );
  }

  if (!visitMeta) {
    return (
      <div className="p-6 max-w-lg text-center space-y-3">
        <p className="text-sm text-muted-foreground">Visit not found.</p>
        <Button variant="link" onClick={() => navigate("/customer/upcoming")}>
          ← Back to upcoming
        </Button>
      </div>
    );
  }

  if (!zone_id) {
    return (
      <div className="p-6 max-w-lg text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          Your subscription isn't set up yet. Please contact support.
        </p>
        <Button variant="link" onClick={() => navigate("/customer/upcoming")}>
          ← Back to upcoming
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg space-y-5 pb-24">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 -ml-2"
        onClick={() => navigate("/customer/upcoming")}
      >
        <ArrowLeft className="h-4 w-4" />
        Upcoming
      </Button>

      <div>
        <h1 className="text-xl font-bold">Schedule Appointment</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{visitMeta.task_summary}</p>
      </div>

      <AppointmentWindowPicker
        windows={windowData?.windows ?? []}
        isLoading={windowsLoading}
        onSelect={handleSelect}
        isConfirming={confirmMutation.isPending}
      />
    </div>
  );
}
