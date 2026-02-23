import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, XCircle, Settings, AlertTriangle } from "lucide-react";

export default function OpsServiceDays() {
  const nav = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["ops-service-day-health"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [assignmentsRes, overridesRes] = await Promise.all([
        supabase.from("service_day_assignments").select("id, status, rejection_used, created_at"),
        supabase.from("service_day_override_log").select("id, created_at").gte("created_at", sevenDaysAgo.toISOString()),
      ]);

      const assignments = assignmentsRes.data ?? [];
      const offered = assignments.filter((a) => a.status === "offered").length;
      const total = assignments.length;
      const rejected7d = assignments.filter((a) => a.rejection_used && a.created_at >= sevenDaysAgo.toISOString()).length;
      const total7d = assignments.filter((a) => a.created_at >= sevenDaysAgo.toISOString()).length;
      const rejected30d = assignments.filter((a) => a.rejection_used && a.created_at >= thirtyDaysAgo.toISOString()).length;
      const total30d = assignments.filter((a) => a.created_at >= thirtyDaysAgo.toISOString()).length;

      return {
        offerBacklog: offered,
        rejectionRate7d: total7d > 0 ? Math.round((rejected7d / total7d) * 100) : 0,
        rejectionRate30d: total30d > 0 ? Math.round((rejected30d / total30d) * 100) : 0,
        overridesCount7d: overridesRes.data?.length ?? 0,
      };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/admin/ops")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-h2">Service Day Health</h1>
          <p className="text-caption">Density + predictability signals</p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2">
        <StatCard icon={Clock} label="Offer Backlog" value={data.offerBacklog} />
        <StatCard icon={XCircle} label="Rejection Rate (7d)" value={`${data.rejectionRate7d}%`} />
        <StatCard icon={Settings} label="Overrides (7d)" value={data.overridesCount7d} />
        <StatCard icon={AlertTriangle} label="Rejection Rate (30d)" value={`${data.rejectionRate30d}%`} />
      </div>

      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          Drill into individual zones for assignment-level detail.
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => nav("/admin/service-days")}>
          View Service Day Admin →
        </Button>
      </Card>
    </div>
  );
}
