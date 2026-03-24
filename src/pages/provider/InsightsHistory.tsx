import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ChevronLeft, TrendingUp } from "lucide-react";

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
  const navigate = useNavigate();

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
    <div className="animate-fade-in p-4 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/provider/insights")} aria-label="Back to insights">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-h2">Weekly Trends</h1>
          <p className="text-caption">Last 8 weeks performance</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : !data?.weeks.length ? (
        <EmptyState
          compact
          icon={TrendingUp}
          title="No data available yet"
          body="Complete jobs to start seeing weekly performance trends."
        />
      ) : (
        <div className="space-y-4">
          {/* Completed jobs chart */}
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Completed Jobs per Week</h3>
            <div className="flex items-end gap-1.5 h-28">
              {data.weeks.map((w, i) => {
                const max = Math.max(...data.weeks.map((w) => w.completed), 1);
                const height = Math.max((w.completed / max) * 100, 4);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium tabular-nums">{w.completed}</span>
                    <div className="w-full relative" style={{ height: "80px" }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-accent/80 rounded-t-sm transition-all duration-300"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{w.label}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Issue rate chart */}
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Issue Rate per Week</h3>
            <div className="flex items-end gap-1.5 h-28">
              {data.weeks.map((w, i) => {
                const max = Math.max(...data.weeks.map((w) => w.issueRate), 1);
                const height = Math.max((w.issueRate / max) * 100, 4);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium tabular-nums">{w.issueRate}%</span>
                    <div className="w-full relative" style={{ height: "80px" }}>
                      <div
                        className={`absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-300 ${
                          w.issueRate > 10 ? "bg-destructive/80" : "bg-muted-foreground/30"
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
