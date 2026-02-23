import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Camera, Bug, DollarSign, Lightbulb } from "lucide-react";

export default function ProviderInsights() {
  const { org } = useProviderOrg();
  const nav = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["provider-insights", org?.id],
    enabled: !!org?.id,
    queryFn: async () => {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [jobsWeekRes, jobs30dRes, issuesRes, earningsRes] = await Promise.all([
        supabase.from("jobs").select("id, status").eq("provider_org_id", org!.id).eq("status", "COMPLETED").gte("completed_at", weekAgo.toISOString()),
        supabase.from("jobs").select("id, status").eq("provider_org_id", org!.id).eq("status", "COMPLETED").gte("completed_at", thirtyDaysAgo.toISOString()),
        supabase.from("job_issues").select("id, jobs!inner(provider_org_id)").eq("jobs.provider_org_id", org!.id).gte("created_at", thirtyDaysAgo.toISOString()),
        supabase.from("provider_earnings").select("status, total_cents").eq("provider_org_id", org!.id),
      ]);

      const completedWeek = jobsWeekRes.data?.length ?? 0;
      const completed30d = jobs30dRes.data?.length ?? 0;
      const issues30d = issuesRes.data?.length ?? 0;
      const issueRate = completed30d > 0 ? Math.round((issues30d / completed30d) * 100) : 0;

      const earnings = earningsRes.data ?? [];
      const eligible = earnings.filter((e: any) => e.status === "ELIGIBLE").reduce((s: number, e: any) => s + e.total_cents, 0);
      const held = earnings.filter((e: any) => ["HELD", "HELD_UNTIL_READY"].includes(e.status)).reduce((s: number, e: any) => s + e.total_cents, 0);

      return {
        completedWeek,
        proofCompliance: 100, // TODO: compute from photos
        issueRate,
        eligibleCents: eligible,
        heldCents: held,
      };
    },
  });

  // Coaching cues
  const cues: string[] = [];
  if (data) {
    if (data.proofCompliance < 90) cues.push("Add more after photos to improve your proof score.");
    if (data.issueRate > 10) cues.push("Issues spiked recently — review access notes before each job.");
    if (data.heldCents > 0) cues.push("Some earnings are on hold. Complete outstanding items to release.");
  }

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-h2">My Performance</h1>
        <div className="grid gap-3 grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-h2 mb-1">My Performance</h1>
        <p className="text-caption">How you're doing this week</p>
      </div>

      <div className="grid gap-3 grid-cols-2">
        <StatCard icon={ClipboardCheck} label="Completed (Week)" value={data.completedWeek} />
        <StatCard icon={Camera} label="Proof Compliance" value={`${data.proofCompliance}%`} />
        <StatCard icon={Bug} label="Issue Rate (30d)" value={`${data.issueRate}%`} />
        <div onClick={() => nav("/provider/payouts")} className="cursor-pointer">
          <StatCard icon={DollarSign} label="Eligible Payout" value={`$${(data.eligibleCents / 100).toFixed(0)}`} />
        </div>
      </div>

      {cues.length > 0 && (
        <Card className="p-4 space-y-2 border-warning/30 bg-warning/5">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-warning" />
            <h3 className="font-semibold text-sm">Coaching Tips</h3>
          </div>
          {cues.map((c, i) => (
            <p key={i} className="text-sm text-muted-foreground">• {c}</p>
          ))}
        </Card>
      )}
    </div>
  );
}
