import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

function weekStart(weeksAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() - weeksAgo * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeek(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ProviderInsightsHistory() {
  const { org } = useProviderOrg();
  const nav = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["provider-insights-history", org?.id],
    enabled: !!org?.id,
    queryFn: async () => {
      const eightWeeksAgo = new Date();
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

      const [jobsRes, issuesRes] = await Promise.all([
        (supabase.from("jobs") as any)
          .select("id, status, completed_at")
          .eq("provider_org_id", org!.id)
          .eq("status", "COMPLETED")
          .gte("completed_at", eightWeeksAgo.toISOString()),
        (supabase.from("job_issues") as any)
          .select("id, created_at, jobs!inner(provider_org_id)")
          .eq("jobs.provider_org_id", org!.id)
          .gte("created_at", eightWeeksAgo.toISOString()),
      ]);

      const jobs = jobsRes.data ?? [];
      const issues = issuesRes.data ?? [];

      // Build weekly buckets (last 8 weeks)
      const weeks: { label: string; completed: number; issues: number; issueRate: number }[] = [];
      for (let i = 7; i >= 0; i--) {
        const start = weekStart(i);
        const end = weekStart(i - 1);
        const weekJobs = jobs.filter((j: any) => {
          const d = new Date(j.completed_at);
          return d >= start && d < end;
        });
        const weekIssues = issues.filter((issue: any) => {
          const d = new Date(issue.created_at);
          return d >= start && d < end;
        });
        const completed = weekJobs.length;
        const issueCount = weekIssues.length;
        weeks.push({
          label: formatWeek(start),
          completed,
          issues: issueCount,
          issueRate: completed > 0 ? Math.round((issueCount / completed) * 100) : 0,
        });
      }

      return { weeks };
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/provider/insights")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-h2">Weekly Trends</h1>
          <p className="text-caption">Last 8 weeks performance</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : !data?.weeks.length ? (
        <p className="text-muted-foreground text-center py-12">No data available yet.</p>
      ) : (
        <div className="space-y-3">
          {/* Simple bar chart representation */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Completed Jobs per Week</h3>
            <div className="flex items-end gap-2 h-32">
              {data.weeks.map((w, i) => {
                const max = Math.max(...data.weeks.map((w) => w.completed), 1);
                const height = (w.completed / max) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium">{w.completed}</span>
                    <div className="w-full relative" style={{ height: "100px" }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-sm"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{w.label}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-4">Issue Rate per Week</h3>
            <div className="flex items-end gap-2 h-32">
              {data.weeks.map((w, i) => {
                const max = Math.max(...data.weeks.map((w) => w.issueRate), 1);
                const height = (w.issueRate / max) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium">{w.issueRate}%</span>
                    <div className="w-full relative" style={{ height: "100px" }}>
                      <div
                        className={`absolute bottom-0 left-0 right-0 rounded-t-sm ${
                          w.issueRate > 10 ? "bg-destructive" : "bg-muted-foreground/30"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{w.label}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
