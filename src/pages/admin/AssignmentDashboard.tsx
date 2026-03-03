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
import { useAssignmentRuns, useTriggerAssignmentRun, type AssignmentRun } from "@/hooks/useAssignmentRuns";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import {
  Play, CheckCircle2, XCircle, Clock, Loader2, ChevronRight,
  Users, MapPin, ShieldAlert, TruckIcon, AlertTriangle,
} from "lucide-react";
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

function RunRow({ run, isSelected, onSelect }: { run: AssignmentRun; isSelected: boolean; onSelect: () => void }) {
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
              {run.triggered_by === "system" ? "Nightly" : "Manual"}{" "}
              · {run.started_at ? formatDistanceToNow(parseISO(run.started_at), { addSuffix: true }) : "queued"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {run.status === "completed" && summary && (
            <span className="text-xs text-muted-foreground">
              {summary.total_visits ?? 0} visits
            </span>
          )}
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </button>
  );
}

function SummaryStatCard({ icon: Icon, label, value, detail }: {
  icon: React.ElementType; label: string; value: string | number; detail?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-lg font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {detail && <p className="text-xs text-muted-foreground/70">{detail}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function RunDetailPanel({ run }: { run: AssignmentRun }) {
  const summary = run.summary as any;

  const duration = run.started_at && run.completed_at
    ? `${((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000).toFixed(1)}s`
    : null;

  const totalVisits = summary?.total_visits ?? 0;
  const assigned = summary?.assigned ?? 0;
  const withBackup = summary?.with_backup ?? 0;
  const unassigned = summary?.unassigned ?? 0;
  const longDrive = summary?.long_drive ?? 0;
  const nearCapacity = summary?.near_capacity ?? 0;
  const pctAssigned = totalVisits > 0 ? Math.round((assigned / totalVisits) * 100) : 0;
  const pctBackup = totalVisits > 0 ? Math.round((withBackup / totalVisits) * 100) : 0;

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
              {run.triggered_by === "system" ? "Nightly" : "Manual"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <SummaryStatCard icon={Users} label="Total Visits" value={totalVisits} />
        <SummaryStatCard icon={CheckCircle2} label="Assigned Primary" value={`${pctAssigned}%`} detail={`${assigned} of ${totalVisits}`} />
        <SummaryStatCard icon={ShieldAlert} label="With Backup" value={`${pctBackup}%`} detail={`${withBackup} of ${totalVisits}`} />
        <SummaryStatCard icon={AlertTriangle} label="Unassigned" value={unassigned} />
        <SummaryStatCard icon={TruckIcon} label="Long Drive" value={longDrive} />
        <SummaryStatCard icon={MapPin} label="Near Capacity" value={nearCapacity} />
      </div>

      {summary?.capacity_hotspots && Array.isArray(summary.capacity_hotspots) && summary.capacity_hotspots.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Capacity Hotspots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {summary.capacity_hotspots.map((h: any, i: number) => (
                <div key={i} className="text-sm p-2 rounded-lg bg-warning/5 border border-warning/10">
                  <p className="font-medium">{h.provider_name ?? h.provider_org_id?.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{h.detail ?? "At or over capacity target"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AssignmentDashboard() {
  const { data: runs, isLoading } = useAssignmentRuns(30);
  const triggerRun = useTriggerAssignmentRun();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selectedRun = runs?.find((r) => r.id === selectedRunId) ?? null;

  const handleTrigger = async () => {
    try {
      await triggerRun.mutateAsync();
      toast.success("Assignment run started");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to trigger assignment run");
    }
    setConfirmOpen(false);
  };

  return (
    <>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Assignments</h1>
            <p className="text-sm text-muted-foreground">Provider assignment engine — clustered, capacity-constrained</p>
          </div>
          <Button
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={triggerRun.isPending}
          >
            {triggerRun.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            Run Assignments
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : !runs || runs.length === 0 ? (
          <Alert>
            <AlertDescription>No assignment runs yet. Click "Run Assignments" to execute the first assignment cycle.</AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-2">Recent Runs</p>
              {runs.map((run) => (
                <RunRow
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

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run Assignment Engine</AlertDialogTitle>
            <AlertDialogDescription>
              This will execute the assignment solver for the next 14 days. It assigns primary and backup providers to all planned/scheduled visits based on distance, capacity, familiarity, and balance. Existing locked assignments will not be changed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleTrigger}>Run Assignments</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
