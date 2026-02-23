import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Inbox, ShieldAlert, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export default function OpsSupport() {
  const nav = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["ops-support-health"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const now = new Date().toISOString();

      const [ticketsRes, slaRes, resolvedRes, highSevRes] = await Promise.all([
        supabase.from("support_tickets").select("id, status, created_at, resolved_at, sla_due_at, severity"),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).not("sla_due_at", "is", null).lt("sla_due_at", now).neq("status", "resolved"),
        supabase.from("support_tickets").select("id, created_at, resolved_at").eq("status", "resolved").gte("created_at", sevenDaysAgo.toISOString()),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("severity", "high").neq("status", "resolved"),
      ]);

      const tickets = ticketsRes.data ?? [];
      const openCount = tickets.filter((t) => t.status !== "resolved" && t.status !== "closed").length;

      // Self-resolve rate: resolved tickets where resolved_at - created_at < 1 hour
      const resolved = resolvedRes.data ?? [];
      const selfResolved = resolved.filter((t) => {
        if (!t.resolved_at || !t.created_at) return false;
        return new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime() < 3600000;
      }).length;
      const selfResolveRate = resolved.length > 0 ? Math.round((selfResolved / resolved.length) * 100) : 0;

      // Median TTR
      const ttrMs = resolved
        .filter((t) => t.resolved_at && t.created_at)
        .map((t) => new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime())
        .sort((a, b) => a - b);
      const medianTtr = ttrMs.length > 0 ? ttrMs[Math.floor(ttrMs.length / 2)] : 0;
      const medianTtrHours = Math.round(medianTtr / 3600000);

      return {
        openTickets: openCount,
        slaBreachRisk: slaRes.count ?? 0,
        selfResolveRate,
        medianTtrHours,
        highSeverity: highSevRes.count ?? 0,
      };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 grid-cols-2">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
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
          <h1 className="text-h2">Support Health</h1>
          <p className="text-caption">Deep-links into support admin</p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2">
        <div onClick={() => nav("/admin/support")} className="cursor-pointer">
          <StatCard icon={Inbox} label="Open Tickets" value={data.openTickets} />
        </div>
        <div onClick={() => nav("/admin/support")} className="cursor-pointer">
          <StatCard icon={ShieldAlert} label="SLA Breach Risk" value={data.slaBreachRisk} />
        </div>
        <div onClick={() => nav("/admin/support")} className="cursor-pointer">
          <StatCard icon={CheckCircle} label="Self-Resolve (7d)" value={`${data.selfResolveRate}%`} />
        </div>
        <div onClick={() => nav("/admin/support")} className="cursor-pointer">
          <StatCard icon={Clock} label="Median TTR" value={`${data.medianTtrHours}h`} />
        </div>
        <div onClick={() => nav("/admin/support")} className="cursor-pointer">
          <StatCard icon={AlertTriangle} label="High Severity" value={data.highSeverity} />
        </div>
      </div>

      <Button variant="outline" onClick={() => nav("/admin/support")}>
        Open Support Admin →
      </Button>
    </div>
  );
}
