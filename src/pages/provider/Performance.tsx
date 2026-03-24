import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { useProviderPerformance } from "@/hooks/useProviderPerformance";
import { useProviderQualityScore } from "@/hooks/useProviderQualityScore";
import { useProviderTier } from "@/hooks/useProviderTier";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { EmptyState } from "@/components/ui/empty-state";
import { HelpTip } from "@/components/ui/help-tip";
import {
  CheckCircle,
  Clock,
  Camera,
  AlertTriangle,
  RotateCcw,
  TrendingUp,
  Shield,
  XCircle,
  Award,
  Flame,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

function MetricRing({ value, label, color, helpText }: { value: number | null; label: string; color: string; helpText?: string }) {
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
      <span className="text-xs text-muted-foreground text-center flex items-center gap-0.5">
        {label}
        {helpText && <HelpTip text={helpText} />}
      </span>
    </div>
  );
}

function SnapshotTrend({ snapshots }: { snapshots: { snapshot_date: string; completed_jobs: number | null }[] }) {
  if (snapshots.length === 0) {
    return (
      <EmptyState
        compact
        icon={TrendingUp}
        title="No performance history"
        body="Complete jobs to see your daily completion trends here."
      />
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

/** Compute consecutive days with completed_jobs > 0, most recent first. */
function computeStreak(snapshots: { snapshot_date: string; completed_jobs: number | null }[]): number {
  // Snapshots come in DESC order (most recent first)
  let streak = 0;
  for (const s of snapshots) {
    if ((s.completed_jobs ?? 0) > 0) streak++;
    else break;
  }
  return streak;
}

const BAND_COLORS: Record<string, { color: string; bg: string }> = {
  GREEN: { color: "text-success", bg: "bg-success/10" },
  YELLOW: { color: "text-amber-500", bg: "bg-amber-500/10" },
  ORANGE: { color: "text-orange-500", bg: "bg-orange-500/10" },
  RED: { color: "text-destructive", bg: "bg-destructive/10" },
};

export default function ProviderPerformance() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useProviderPerformance();
  const { org } = useProviderOrg();
  const { score } = useProviderQualityScore(org?.id);
  const { currentTier, tierConfig } = useProviderTier(org?.id);

  const snapshots = data?.snapshots ?? [];
  const streak = useMemo(() => computeStreak(snapshots), [snapshots]);

  if (isLoading) {
    return (
      <div className="animate-fade-in p-4 pb-24 space-y-4">
        <h1 className="text-h2">Score</h1>
        <Skeleton className="h-28 rounded-2xl" />
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
      <div className="animate-fade-in p-4 pb-24 space-y-4">
        <h1 className="text-h2">Score</h1>
        <QueryErrorCard message="Failed to load performance data." onRetry={() => refetch()} />
      </div>
    );
  }

  const stats = data?.jobStats;
  const enforcements = data?.enforcements ?? [];

  const latestSnapshot = snapshots.length > 0 ? snapshots[0] : null;
  const proofCompliance = latestSnapshot?.proof_compliance != null ? Math.round(Number(latestSnapshot.proof_compliance)) : null;
  const issueRate = latestSnapshot?.issue_rate != null ? Math.round(Number(latestSnapshot.issue_rate) * 100) : null;

  const band = score ? BAND_COLORS[score.band] ?? BAND_COLORS.GREEN : null;

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-5">
      <div>
        <h1 className="text-h2">Score</h1>
        <p className="text-caption mt-0.5">Last 30 days</p>
      </div>

      {/* Score Summary Banner */}
      <Card
        className={cn("p-4 cursor-pointer hover:bg-secondary/30 transition-colors", band?.bg)}
        onClick={() => navigate("/provider/quality")}
      >
        <div className="flex items-center gap-4">
          <div className={cn("text-4xl font-bold tabular-nums", band?.color ?? "text-muted-foreground")}>
            {score ? Number(score.score).toFixed(0) : "—"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Quality Score</span>
              {currentTier && (
                <Badge variant="outline" className={cn("text-[10px] gap-1", tierConfig.color)}>
                  <Award className="h-2.5 w-2.5" />
                  {tierConfig.label}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {score ? "Tap to see full breakdown" : "Complete more jobs to generate your score"}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </Card>

      {/* Streak Card */}
      <Card className={cn("p-4", streak > 0 ? "border-accent/30 bg-accent/5" : "")}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center",
            streak > 0 ? "bg-accent/20" : "bg-muted/50"
          )}>
            <Flame className={cn("h-5 w-5", streak > 0 ? "text-accent" : "text-muted-foreground")} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {streak > 0 ? `${streak}-day streak` : "Start a new streak today"}
            </p>
            <p className="text-xs text-muted-foreground">
              {streak > 0
                ? streak >= 7
                  ? "Incredible consistency. Keep it going!"
                  : "Complete jobs every day to build your streak."
                : "Complete a job to start your streak."}
            </p>
          </div>
          {streak >= 3 && (
            <Badge variant="secondary" className="text-xs tabular-nums">
              {streak >= 14 ? "On fire" : streak >= 7 ? "Hot streak" : "Building"}
            </Badge>
          )}
        </div>
      </Card>

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
            Your Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-around py-2">
            <MetricRing value={stats?.onTimeRate ?? null} label="On-Time Rate" color="hsl(var(--success))" helpText="% of jobs where you arrived within the scheduled window." />
            <MetricRing value={proofCompliance} label="Photo Compliance" color="hsl(var(--accent))" helpText="% of jobs with required before/after photos uploaded." />
            <MetricRing value={issueRate !== null ? Math.max(0, 100 - issueRate) : null} label="Issue-Free" color="hsl(var(--warning))" helpText="% of jobs completed without any reported issues or redo requests." />
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
