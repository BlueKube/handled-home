import { useMemo, useState } from "react";
import { useCronHealth } from "@/hooks/useCronHealth";
import { useAdminMembership } from "@/hooks/useAdminMembership";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, CheckCircle, XCircle, Clock, Play, AlertTriangle } from "lucide-react";
import { formatDistanceToNow, format, differenceInSeconds, addMinutes, addHours, addDays, isAfter } from "date-fns";

const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
  success: { icon: CheckCircle, color: "text-green-600" },
  failed: { icon: XCircle, color: "text-destructive" },
  running: { icon: Clock, color: "text-yellow-600" },
};

/* ── Schedule map: function → cron expression + human label ── */
const SCHEDULE_MAP: Record<string, { cron: string; label: string; intervalMinutes: number }> = {
  "compute-quality-scores": { cron: "0 3 * * *", label: "Daily 03:00 UTC", intervalMinutes: 24 * 60 },
  "run-scheduled-jobs": { cron: "0 4 * * *", label: "Daily 04:00 UTC", intervalMinutes: 24 * 60 },
  "process-notification-events": { cron: "*/2 * * * *", label: "Every 2 min", intervalMinutes: 2 },
  "cleanup-expired-offers": { cron: "0 5 * * *", label: "Daily 05:00 UTC", intervalMinutes: 24 * 60 },
  "check-weather": { cron: "0 */6 * * *", label: "Every 6 hours", intervalMinutes: 6 * 60 },
  "check-no-shows": { cron: "0 * * * *", label: "Hourly", intervalMinutes: 60 },
  "evaluate-provider-sla": { cron: "0 2 * * *", label: "Daily 02:00 UTC", intervalMinutes: 24 * 60 },
  "run-dunning": { cron: "0 6 * * *", label: "Daily 06:00 UTC", intervalMinutes: 24 * 60 },
  "run-billing-automation": { cron: "0 7 * * *", label: "Daily 07:00 UTC", intervalMinutes: 24 * 60 },
  "send-reminders": { cron: "0 12 * * *", label: "Daily 12:00 UTC", intervalMinutes: 24 * 60 },
  "snapshot-rollup": { cron: "0 1 * * 1", label: "Weekly Mon 01:00 UTC", intervalMinutes: 7 * 24 * 60 },
};

function getExpectedNextAndOverdue(lastRunAt: string | undefined, functionName: string) {
  const schedule = SCHEDULE_MAP[functionName];
  if (!schedule) return { expectedNext: null, isOverdue: false };

  if (!lastRunAt) return { expectedNext: "No runs yet", isOverdue: true };

  const lastRun = new Date(lastRunAt);
  const expectedNext = addMinutes(lastRun, schedule.intervalMinutes);
  const isOverdue = isAfter(new Date(), addMinutes(expectedNext, 5)); // 5 min grace

  return {
    expectedNext: format(expectedNext, "MMM d, HH:mm"),
    isOverdue,
  };
}

export default function CronHealth() {
  const { runs, retryNow } = useCronHealth();
  const { isSuperuser } = useAdminMembership();
  const [filter, setFilter] = useState<string>("all");

  const functionNames = useMemo(() => {
    if (!runs.data) return [];
    return [...new Set(runs.data.map((r) => r.function_name))].sort();
  }, [runs.data]);

  const filtered = useMemo(() => {
    if (!runs.data) return [];
    if (filter === "all") return runs.data;
    return runs.data.filter((r) => r.function_name === filter);
  }, [runs.data, filter]);

  const summaryByFn = useMemo(() => {
    if (!runs.data) return new Map<string, { last: typeof runs.data[0]; total: number; failures: number }>();
    const map = new Map<string, { last: typeof runs.data[0]; total: number; failures: number }>();
    for (const r of runs.data) {
      const existing = map.get(r.function_name);
      if (!existing) {
        map.set(r.function_name, { last: r, total: 1, failures: r.status === "failed" ? 1 : 0 });
      } else {
        existing.total++;
        if (r.status === "failed") existing.failures++;
      }
    }
    return map;
  }, [runs.data]);

  if (runs.isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cron Health</h1>
        <Button variant="outline" size="sm" onClick={() => runs.refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...summaryByFn.entries()].map(([fn, s]) => {
          const cfg = statusConfig[s.last.status] ?? statusConfig.running;
          const Icon = cfg.icon;
          const runtime = s.last.completed_at
            ? `${differenceInSeconds(new Date(s.last.completed_at), new Date(s.last.started_at))}s`
            : "—";
          const schedule = SCHEDULE_MAP[fn];
          const { expectedNext, isOverdue } = getExpectedNextAndOverdue(s.last.started_at, fn);

          return (
            <Card key={fn} className="relative">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono">{fn}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${cfg.color}`} />
                  <span className="capitalize">{s.last.status}</span>
                  <span className="text-muted-foreground">· {runtime}</span>
                </div>
                <p className="text-muted-foreground">
                  Last: {formatDistanceToNow(new Date(s.last.started_at), { addSuffix: true })}
                </p>
                {schedule && (
                  <p className="text-muted-foreground text-xs">
                    Schedule: {schedule.label}
                  </p>
                )}
                {expectedNext && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      Expected next: {expectedNext}
                    </span>
                    {isOverdue && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Overdue
                      </Badge>
                    )}
                  </div>
                )}
                <p className="text-muted-foreground">
                  {s.total} runs · {s.failures} failures
                </p>
                {isSuperuser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-3 right-3"
                    onClick={() => retryNow.mutate(fn)}
                    disabled={retryNow.isPending}
                  >
                    <Play className="h-3 w-3 mr-1" /> Retry
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        {summaryByFn.size === 0 && (
          <p className="text-muted-foreground col-span-full">No cron runs recorded yet.</p>
        )}
      </div>

      {/* Detailed log */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Run Log</h2>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All functions</SelectItem>
              {functionNames.map((fn) => (
                <SelectItem key={fn} value={fn}>{fn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 font-medium">Function</th>
                <th className="text-left p-2 font-medium">Status</th>
                <th className="text-left p-2 font-medium">Started</th>
                <th className="text-left p-2 font-medium">Runtime</th>
                <th className="text-left p-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const cfg = statusConfig[r.status] ?? statusConfig.running;
                const Icon = cfg.icon;
                const runtime = r.completed_at
                  ? `${differenceInSeconds(new Date(r.completed_at), new Date(r.started_at))}s`
                  : "running…";

                return (
                  <tr key={r.id} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-mono text-xs">{r.function_name}</td>
                    <td className="p-2">
                      <Badge variant={r.status === "failed" ? "destructive" : "secondary"} className="gap-1">
                        <Icon className={`h-3 w-3 ${cfg.color}`} />
                        {r.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-muted-foreground">
                      {format(new Date(r.started_at), "MMM d, HH:mm:ss")}
                    </td>
                    <td className="p-2">{runtime}</td>
                    <td className="p-2 text-xs max-w-xs truncate">
                      {r.error_message || (r.result_summary ? JSON.stringify(r.result_summary) : "—")}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">No runs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}