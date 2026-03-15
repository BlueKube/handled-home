import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Camera, Bug, DollarSign, Lightbulb, Clock, ChevronRight, TrendingUp } from "lucide-react";

export default function ProviderInsights() {
  const { org } = useProviderOrg();
  const navigate = useNavigate();

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
        (supabase.from("jobs") as any).select("id, status, arrived_at, departed_at").eq("provider_org_id", org!.id).eq("status", "COMPLETED").gte("completed_at", weekAgo.toISOString()),
        (supabase.from("jobs") as any).select("id, status").eq("provider_org_id", org!.id).eq("status", "COMPLETED").gte("completed_at", thirtyDaysAgo.toISOString()),
        (supabase.from("job_issues") as any).select("id, jobs!inner(provider_org_id)").eq("jobs.provider_org_id", org!.id).gte("created_at", thirtyDaysAgo.toISOString()),
        supabase.from("provider_earnings").select("status, total_cents").eq("provider_org_id", org!.id),
      ]);

      const completedWeekJobs = jobsWeekRes.data ?? [];
      const completedWeek = completedWeekJobs.length;
      const completed30d = jobs30dRes.data?.length ?? 0;
      const issues30d = issuesRes.data?.length ?? 0;
      const issueRate = completed30d > 0 ? Math.round((issues30d / completed30d) * 100) : 0;

      const weekJobIds = completedWeekJobs.map((j: any) => j.id);
      let proofCompliance = 100;
      if (weekJobIds.length > 0) {
        const [photosRes, checklistRes] = await Promise.all([
          supabase.from("job_photos").select("job_id").in("job_id", weekJobIds),
          supabase.from("job_checklist_items").select("job_id, is_required").in("job_id", weekJobIds),
        ]);
        const photosSet = new Set((photosRes.data ?? []).map((p: any) => p.job_id));
        const requiredSet = new Set<string>();
        (checklistRes.data ?? []).forEach((ci: any) => {
          if (ci.is_required) requiredSet.add(ci.job_id);
        });
        let compliant = 0;
        let total = 0;
        weekJobIds.forEach((id: string) => {
          if (requiredSet.has(id)) {
            total++;
            if (photosSet.has(id)) compliant++;
          }
        });
        proofCompliance = total > 0 ? Math.round((compliant / total) * 100) : 100;
      }

      const timesOnSite = completedWeekJobs
        .filter((j: any) => j.arrived_at && j.departed_at)
        .map((j: any) => (new Date(j.departed_at).getTime() - new Date(j.arrived_at).getTime()) / 60000);
      const avgTimeOnSite = timesOnSite.length > 0 ? Math.round(timesOnSite.reduce((a, b) => a + b, 0) / timesOnSite.length) : 0;

      const earnings = earningsRes.data ?? [];
      const eligible = earnings.filter((e: any) => e.status === "ELIGIBLE").reduce((s: number, e: any) => s + e.total_cents, 0);
      const held = earnings.filter((e: any) => ["HELD", "HELD_UNTIL_READY"].includes(e.status)).reduce((s: number, e: any) => s + e.total_cents, 0);

      return {
        completedWeek,
        proofCompliance,
        issueRate,
        avgTimeOnSite,
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
      <div className="animate-fade-in p-4 pb-24 space-y-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="grid gap-3 grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-5">
      <div>
        <h1 className="text-h2">My Performance</h1>
        <p className="text-caption mt-0.5">How you're doing this week</p>
      </div>

      <div className="grid gap-3 grid-cols-2">
        <StatCard icon={ClipboardCheck} label="Completed (Week)" value={data.completedWeek} />
        <StatCard icon={Camera} label="Proof Compliance" value={`${data.proofCompliance}%`} />
        <StatCard icon={Bug} label="Issue Rate (30d)" value={`${data.issueRate}%`} />
        <StatCard icon={Clock} label="Avg On-Site" value={data.avgTimeOnSite > 0 ? `${data.avgTimeOnSite}m` : "—"} />
      </div>

      {/* Eligible payout card */}
      <Card
        variant="interactive"
        className="p-4 cursor-pointer"
        onClick={() => navigate("/provider/payouts")}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">${(data.eligibleCents / 100).toFixed(0)} eligible</p>
            <p className="text-xs text-muted-foreground">Tap to view payouts</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>

      {/* Coaching tips */}
      {cues.length > 0 && (
        <Card className="p-4 space-y-2 border-warning/30 bg-warning/5">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-warning" />
            <h3 className="font-semibold text-sm">Coaching Tips</h3>
          </div>
          {cues.map((c, i) => (
            <p key={i} className="text-sm text-muted-foreground">{"\u2022"} {c}</p>
          ))}
        </Card>
      )}

      {/* Weekly trends link */}
      <Card
        variant="interactive"
        className="p-4 cursor-pointer"
        onClick={() => navigate("/provider/insights/history")}
      >
        <div className="flex items-center gap-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium flex-1">View Weekly Trends</p>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
    </div>
  );
}
