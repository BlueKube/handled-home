import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePlanRuns, usePlanRunDetail, useTriggerPlanRun, type PlanRun } from "@/hooks/usePlanRuns";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { Play, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  running: { label: "Running", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
};

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed": return <CheckCircle2 className="h-4 w-4 text-success" />;
    case "failed": return <XCircle className="h-4 w-4 text-destructive" />;
    case "running": return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    default: return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function PlanRunRow({ run, isSelected, onSelect }: { run: PlanRun; isSelected: boolean; onSelect: () => void }) {
  const cfg = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.pending;
  const summary = run.summary as any;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-colors ${
        isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusIcon status={run.status} />
          <div>
            <p className="text-sm font-medium">{format(parseISO(run.run_date), "EEE, MMM d, yyyy")}</p>
            <p className="text-xs text-muted-foreground">
              {run.triggered_by === "system" ? "Nightly" : run.triggered_by === "admin_draft_only" ? "Draft rebuild" : "Manual"}{" "}
              · {run.started_at ? formatDistanceToNow(parseISO(run.started_at), { addSuffix: true }) : "queued"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {run.status === "completed" && summary && (
            <span className="text-xs text-muted-foreground">
              {summary.draft_visits_created ?? 0} new · {summary.properties_processed ?? 0} props
            </span>
          )}
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </button>
  );
}

function RunDetailPanel({ run }: { run: PlanRun }) {
  const summary = run.summary as any;
  const conflicts = (run.conflicts ?? []) as any[];

  const stats = [
    { label: "Properties Processed", value: summary?.properties_processed ?? 0 },
    { label: "Properties Skipped", value: summary?.properties_skipped ?? 0 },
    { label: "Locked Visits", value: summary?.locked_visits ?? 0 },
    { label: "Draft Visits", value: summary?.draft_visits ?? 0 },
    { label: "Draft Visits Created", value: summary?.draft_visits_created ?? 0 },
    { label: "Draft Visits Removed", value: summary?.draft_visits_removed ?? 0 },
    { label: "Tasks Created", value: summary?.tasks_created ?? 0 },
    { label: "Tasks Removed", value: summary?.tasks_removed ?? 0 },
  ];

  const duration = run.started_at && run.completed_at
    ? `${((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000).toFixed(1)}s`
    : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Run Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Run Date</span>
            <span className="font-medium">{format(parseISO(run.run_date), "EEE, MMM d, yyyy")}</span>
          </div>
          {duration && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{duration}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Trigger</span>
            <Badge variant="outline" className="text-xs">
              {run.triggered_by === "system" ? "Nightly" : run.triggered_by === "admin_draft_only" ? "Draft Rebuild" : "Manual"}
            </Badge>
          </div>
          <div className="border-t pt-3 grid grid-cols-2 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-semibold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {conflicts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Conflicts ({conflicts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {conflicts.map((c: any, i: number) => (
                <div key={i} className="text-sm p-2 rounded-lg bg-warning/5 border border-warning/10">
                  <p className="font-medium">{c.type === "no_service_day" ? "No Service Day" : c.type === "no_routine" ? "No Routine" : c.type}</p>
                  <p className="text-xs text-muted-foreground">{c.detail}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{c.property_id?.slice(0, 8)}…</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function PlannerDashboard() {
  const { data: runs, isLoading } = usePlanRuns(30);
  const triggerRun = useTriggerPlanRun();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<"full" | "draft_only" | null>(null);

  const selectedRun = runs?.find((r) => r.id === selectedRunId) ?? null;

  const handleTrigger = async () => {
    if (!confirmDialog) return;
    try {
      await triggerRun.mutateAsync(confirmDialog);
      toast.success(confirmDialog === "draft_only" ? "Draft rebuild started" : "Full planner run started");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to trigger planner");
    }
    setConfirmDialog(null);
  };

  return (
    <>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Planner</h1>
            <p className="text-sm text-muted-foreground">14-day rolling horizon with 7-day freeze</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDialog("draft_only")}
              disabled={triggerRun.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Rebuild DRAFT
            </Button>
            <Button
              size="sm"
              onClick={() => setConfirmDialog("full")}
              disabled={triggerRun.isPending}
            >
              {triggerRun.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              Run Planner
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : !runs || runs.length === 0 ? (
          <Alert>
            <AlertDescription>No plan runs yet. Click "Run Planner" to execute the first nightly planning cycle.</AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-2">Recent Runs</p>
              {runs.map((run) => (
                <PlanRunRow
                  key={run.id}
                  run={run}
                  isSelected={run.id === selectedRunId}
                  onSelect={() => setSelectedRunId(run.id === selectedRunId ? null : run.id)}
                />
              ))}
            </div>
            <div className="lg:col-span-2">
              {selectedRun ? (
                <RunDetailPanel run={selectedRun} />
              ) : (
                <Card className="p-6 text-center text-muted-foreground text-sm">
                  Select a run to view details
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog === "draft_only" ? "Rebuild DRAFT Schedule" : "Run Full Planner"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog === "draft_only"
                ? "This will regenerate days 8–14 (DRAFT window) without touching the next 7 days. Safe to run anytime."
                : "This will execute the full nightly planner: advance windows, generate visits, and apply any pending changes. The next 7 days (LOCKED) will not be modified."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleTrigger}>
              {confirmDialog === "draft_only" ? "Rebuild DRAFT" : "Run Planner"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
