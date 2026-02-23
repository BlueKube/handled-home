import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Users, Send, Briefcase, Zap, ShieldAlert } from "lucide-react";

export default function OpsGrowth() {
  const nav = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["ops-growth-health"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const since = sevenDaysAgo.toISOString();

      const referralsRes = await (supabase.from("referrals") as any).select("id", { count: "exact", head: true }).eq("status", "ACTIVATED").gte("created_at", since);
      const applicationsRes = await supabase.from("provider_applications").select("id", { count: "exact", head: true }).gte("created_at", since);
      const riskFlagsRes = await supabase.from("referral_risk_flags").select("id", { count: "exact", head: true }).eq("status", "open" as any);

      return {
        referralsActivated: referralsRes.count ?? 0,
        providerApplications: applicationsRes.count ?? 0,
        fraudHolds: riskFlagsRes.count ?? 0,
      };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 grid-cols-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
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
          <h1 className="text-h2">Growth Health</h1>
          <p className="text-caption">Referrals, provider pipeline, risk (7 days)</p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2">
        <div onClick={() => nav("/admin/growth")} className="cursor-pointer">
          <StatCard icon={Users} label="Referrals Activated" value={data.referralsActivated} />
        </div>
        <div onClick={() => nav("/admin/growth")} className="cursor-pointer">
          <StatCard icon={Briefcase} label="Provider Apps" value={data.providerApplications} />
        </div>
        <div onClick={() => nav("/admin/growth")} className="cursor-pointer">
          <StatCard icon={ShieldAlert} label="Fraud Holds" value={data.fraudHolds} />
        </div>
      </div>

      <Button variant="outline" onClick={() => nav("/admin/growth")}>
        Open Growth Admin →
      </Button>
    </div>
  );
}
