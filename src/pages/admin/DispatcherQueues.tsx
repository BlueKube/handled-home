import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatcherQueues, type QueueJob, type QueueIssue } from "@/hooks/useDispatcherQueues";
import { DispatcherActionsDialog } from "@/components/admin/DispatcherActionsDialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, Camera, UserX, MapPin, MessageSquare, ShieldAlert,
  ChevronRight, RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

/* ── Queue tab config ── */
const QUEUES = [
  { key: "atRisk", label: "At Risk", icon: AlertTriangle, color: "text-destructive" },
  { key: "missingProof", label: "Missing Proof", icon: Camera, color: "text-warning" },
  { key: "unassigned", label: "Unassigned", icon: UserX, color: "text-warning" },
  { key: "coverageGaps", label: "Coverage", icon: MapPin, color: "text-accent" },
  { key: "customerIssues", label: "Cust Issues", icon: MessageSquare, color: "text-destructive" },
  { key: "providerIncidents", label: "Prov Incidents", icon: ShieldAlert, color: "text-destructive" },
] as const;

type QueueKey = (typeof QUEUES)[number]["key"];

/* ── Job row ── */
function JobRow({ job, onAction }: { job: QueueJob; onAction: (jobId: string) => void }) {
  const nav = useNavigate();
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-b-0 group"
      onClick={() => nav(`/admin/jobs/${job.id}`)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">{job.id.slice(0, 8)}</span>
          <Badge variant="outline" className="text-[10px] px-1 py-0">
            {job.status}
          </Badge>
        </div>
        <p className="text-sm truncate mt-0.5">
          {job.scheduled_date} · Zone {job.zone_id?.slice(0, 6)}
        </p>
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">
        {formatDistanceToNow(new Date(job.updated_at), { addSuffix: true })}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.stopPropagation(); onAction(job.id); }}
      >
        Action
      </Button>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

/* ── Issue row ── */
function IssueRow({ issue, onClick }: { issue: QueueIssue; onClick: () => void }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-b-0 group"
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge
            variant={issue.severity === "high" || issue.severity === "HIGH" ? "destructive" : "outline"}
            className="text-[10px] px-1 py-0"
          >
            {issue.issue_type}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1 py-0">
            {issue.severity}
          </Badge>
        </div>
        <p className="text-sm truncate mt-0.5">
          {issue.description || "No description"} · Job {issue.job_id.slice(0, 8)}
        </p>
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">
        {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
      </span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

/* ── Coverage gap row ── */
function CoverageRow({ gap }: { gap: { zone_id: string; zone_name: string; gap_count: number } }) {
  const nav = useNavigate();
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-b-0 group"
      onClick={() => nav(`/admin/ops/zones/${gap.zone_id}`)}
    >
      <MapPin className="h-4 w-4 text-accent shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{gap.zone_name}</p>
        <p className="text-xs text-muted-foreground">Capacity {gap.gap_count} · 0 jobs today</p>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

export default function DispatcherQueues() {
  const { data, isLoading, refetch, isFetching } = useDispatcherQueues();
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState<QueueKey>("atRisk");
  const [actionJobId, setActionJobId] = useState<string | null>(null);

  const counts: Record<QueueKey, number> = {
    atRisk: data?.atRisk.length ?? 0,
    missingProof: data?.missingProof.length ?? 0,
    unassigned: data?.unassigned.length ?? 0,
    coverageGaps: data?.coverageGaps.length ?? 0,
    customerIssues: data?.customerIssues.length ?? 0,
    providerIncidents: data?.providerIncidents.length ?? 0,
  };

  const totalAlerts = counts.atRisk + counts.missingProof + counts.unassigned + counts.customerIssues + counts.providerIncidents;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2 mb-0.5">Dispatcher Queues</h1>
          <p className="text-caption">
            {totalAlerts > 0
              ? `${totalAlerts} item${totalAlerts !== 1 ? "s" : ""} need attention`
              : "All clear — no items need attention"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-1.5"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as QueueKey)}>
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            {QUEUES.map((q) => {
              const count = counts[q.key];
              return (
                <TabsTrigger
                  key={q.key}
                  value={q.key}
                  className="gap-1.5 text-xs whitespace-nowrap"
                >
                  <q.icon className={cn("h-3.5 w-3.5", count > 0 ? q.color : "text-muted-foreground")} />
                  {q.label}
                  {count > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-0.5 min-w-[18px] text-center">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* At Risk */}
          <TabsContent value="atRisk">
            <Card>
              {data!.atRisk.length === 0 ? (
                <EmptyQueue label="No at-risk jobs today" />
              ) : (
                data!.atRisk.map((job) => (
                  <JobRow key={job.id} job={job} onAction={setActionJobId} />
                ))
              )}
            </Card>
          </TabsContent>

          {/* Missing Proof */}
          <TabsContent value="missingProof">
            <Card>
              {data!.missingProof.length === 0 ? (
                <EmptyQueue label="All completed jobs have proof" />
              ) : (
                data!.missingProof.map((job) => (
                  <JobRow key={job.id} job={job} onAction={setActionJobId} />
                ))
              )}
            </Card>
          </TabsContent>

          {/* Unassigned */}
          <TabsContent value="unassigned">
            <Card>
              {data!.unassigned.length === 0 ? (
                <EmptyQueue label="All jobs are assigned" />
              ) : (
                data!.unassigned.map((job) => (
                  <JobRow key={job.id} job={job} onAction={setActionJobId} />
                ))
              )}
            </Card>
          </TabsContent>

          {/* Coverage Gaps */}
          <TabsContent value="coverageGaps">
            <Card>
              {data!.coverageGaps.length === 0 ? (
                <EmptyQueue label="No coverage gaps" />
              ) : (
                data!.coverageGaps.map((gap) => (
                  <CoverageRow key={gap.zone_id} gap={gap} />
                ))
              )}
            </Card>
          </TabsContent>

          {/* Customer Issues */}
          <TabsContent value="customerIssues">
            <Card>
              {data!.customerIssues.length === 0 ? (
                <EmptyQueue label="No open customer issues" />
              ) : (
                data!.customerIssues.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} onClick={() => nav(`/admin/jobs/${issue.job_id}`)} />
                ))
              )}
            </Card>
          </TabsContent>

          {/* Provider Incidents */}
          <TabsContent value="providerIncidents">
            <Card>
              {data!.providerIncidents.length === 0 ? (
                <EmptyQueue label="No open provider incidents" />
              ) : (
                data!.providerIncidents.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} onClick={() => nav(`/admin/jobs/${issue.job_id}`)} />
                ))
              )}
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {actionJobId && (
        <DispatcherActionsDialog
          jobId={actionJobId}
          open={!!actionJobId}
          onClose={() => setActionJobId(null)}
        />
      )}
    </div>
  );
}

function EmptyQueue({ label }: { label: string }) {
  return (
    <div className="px-4 py-8 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
