import { useNavigate } from "react-router-dom";
import { useOpsMetrics } from "@/hooks/useOpsMetrics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, DollarSign, MapPin, TrendingUp, Gauge } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const nav = useNavigate();
  const { data: ops, isLoading: opsLoading } = useOpsMetrics();

  const { data: counts, isLoading: countsLoading } = useQuery({
    queryKey: ["admin-dashboard-counts"],
    queryFn: async () => {
      const [custRes, zonesRes, subsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("zones").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      ]);
      return {
        customers: custRes.count ?? 0,
        activeZones: zonesRes.count ?? 0,
        activeSubs: subsRes.count ?? 0,
      };
    },
  });

  const isLoading = opsLoading || countsLoading;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-h2 mb-1">Admin Console</h1>
      <p className="text-caption mb-6">Operations overview</p>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={Users} label="Customers" value={counts?.customers ?? 0} />
            <StatCard icon={DollarSign} label="Paid Today" value={`$${((ops?.paidTodayCents ?? 0) / 100).toFixed(0)}`} />
            <StatCard icon={MapPin} label="Active Zones" value={counts?.activeZones ?? 0} />
            <StatCard icon={TrendingUp} label="Active Subs" value={counts?.activeSubs ?? 0} />
          </div>

          <Button variant="outline" onClick={() => nav("/admin/ops")} className="mt-4">
            <Gauge className="h-4 w-4 mr-2" /> Open Ops Cockpit →
          </Button>
        </>
      )}
    </div>
  );
}
