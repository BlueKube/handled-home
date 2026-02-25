import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { useProviderPerformance } from "@/hooks/useProviderPerformance";
import {
  CheckCircle,
  Clock,
  Camera,
  AlertTriangle,
  RotateCcw,
  TrendingUp,
  Shield,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

function MetricRing({ value, label, color }: { value: number | null; label: string; color: string }) {
  const display = value !== null ? `${value}%` : "—";
  const circumference = 2 * Math.PI * 36;
  const offset = value !== null ? circumference - (value / 100) * circumference : circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-20 w-20">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{display}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
}

function SnapshotTrend({ snapshots }: { snapshots: { snapshot_date: string; completed_jobs: number | null }[] }) {
  if (snapshots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No performance history yet. Complete jobs to see trends.
      </p>
    );
  }

  const recent = [...snapshots].reverse().slice(-14);
  const maxVal = Math.max(...recent.map((s) => s.completed_jobs ?? 0), 1);

  return (
    <div className="flex items-end gap-1 h-20 px-1">
      {recent.map((s) => {
        const val = s.completed_jobs ?? 0;
        const height = Math.max((val / maxVal) * 100, 4);
        return (
          <div key={s.snapshot_date} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className="w-full bg-accent/80 rounded-t-sm transition-all duration-300"
              style={{ height: `${height}%` }}
              title={`${format(new Date(s.snapshot_date), "MMM d")}: ${val} jobs`}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function ProviderPerformance() {
  const { data, isLoading, isError, refetch } = useProviderPerformance();

  if (isLoading) {
    return (
      <div className="animate-fade-in p-4 pb-24 space-y-4 max-w-2xl">
        <h1 className="text-h2">Performance</h1>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="animate-fade-in p-4 pb-24 space-y-4 max-w-2xl">
        <h1 className="text-h2">Performance</h1>
        <QueryErrorCard message="Failed to load performance data." onRetry={() => refetch()} />
      </div>
    );
  }

  const stats = data?.jobStats;
  const snapshots = data?.snapshots ?? [];
  const enforcements = data?.enforcements ?? [];

  const latestSnapshot = snapshots.length > 0 ? snapshots[0] : null;
  const proofCompliance = latestSnapshot?.proof_compliance != null ? Math.round(Number(latestSnapshot.proof_compliance)) : null;
  const issueRate = latestSnapshot?.issue_rate != null ? Math.round(Number(latestSnapshot.issue_rate) * 100) : null;

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-5 max-w-2xl">
      <div>
        <h1 className="text-h2">Performance</h1>
        <p className="text-caption mt-0.5">Last 30 days</p>
      </div>

      <div className="grid gap-3 grid-cols-2">
        <StatCard icon={CheckCircle} label="Jobs Completed" value={stats?.totalCompleted ?? 0} />
        <StatCard icon={Clock} label="Avg Time On Site" value={stats?.avgCompletionMinutes ? `${stats.avgCompletionMinutes} min` : "—"} />
        <StatCard icon={RotateCcw} label="Redo Requests" value={stats?.redoCount ?? 0} />
        <StatCard icon={XCircle} label="Canceled" value={stats?.totalCanceled ?? 0} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Key Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-around py-2">
            <MetricRing value={stats?.onTimeRate ?? null} label="On-Time Rate" color="hsl(var(--success))" />
            <MetricRing value={proofCompliance} label="Photo Compliance" color="hsl(var(--accent))" />
            <MetricRing value={issueRate !== null ? Math.max(0, 100 - issueRate) : null} label="Issue-Free" color="hsl(var(--warning))" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Daily Completions</CardTitle>
        </CardHeader>
        <CardContent>
          <SnapshotTrend snapshots={snapshots} />
          {snapshots.length > 0 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Last {Math.min(snapshots.length, 14)} days
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            SLA Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enforcements.length === 0 ? (
            <div className="flex items-center gap-3 py-3">
              <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium">Good Standing</p>
                <p className="text-xs text-muted-foreground">No warnings or restrictions</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {enforcements.map((e) => (
                <div key={e.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {e.action_type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    {e.reason && (
                      <p className="text-xs text-muted-foreground mt-1">{e.reason}</p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {format(new Date(e.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
