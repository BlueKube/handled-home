import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatcherQueues, type QueueJob, type QueueIssue } from "@/hooks/useDispatcherQueues";
import { DispatcherActionsDialog, type ActionType } from "@/components/admin/DispatcherActionsDialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, Camera, UserX, MapPin, MessageSquare, ShieldAlert,
  ChevronRight, RefreshCw, Keyboard,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ── Saved view helpers ── */
const STORAGE_KEY = "hh_dispatcher_saved_tab";
function loadSavedTab(): QueueKey {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && QUEUES.some((q) => q.key === v)) return v as QueueKey;
  } catch {}
  return "atRisk";
}
function saveSavedTab(key: QueueKey) {
  try { localStorage.setItem(STORAGE_KEY, key); } catch {}
}

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

/* ── Compact Job row ── */
function JobRow({
  job,
  onAction,
  isSelected,
  onSelect,
}: {
  job: QueueJob;
  onAction: (jobId: string) => void;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const nav = useNavigate();
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-1.5 cursor-pointer border-b border-border/50 last:border-b-0 group transition-colors",
        isSelected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50"
      )}
      onClick={onSelect}
      onDoubleClick={() => nav(`/admin/jobs/${job.id}`)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">{job.id.slice(0, 8)}</span>
          <Badge variant="outline" className="text-[10px] px-1 py-0 leading-tight">
            {job.status}
          </Badge>
        </div>
        <p className="text-xs truncate mt-0.5 text-muted-foreground">
          {job.scheduled_date} · Zone {job.zone_id?.slice(0, 6)}
        </p>
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">
        {formatDistanceToNow(new Date(job.updated_at), { addSuffix: true })}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.stopPropagation(); onAction(job.id); }}
      >
        Action
      </Button>
      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

/* ── Compact Issue row ── */
function IssueRow({
  issue,
  onClick,
  isSelected,
  onSelect,
}: {
  issue: QueueIssue;
  onClick: () => void;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-1.5 cursor-pointer border-b border-border/50 last:border-b-0 group transition-colors",
        isSelected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50"
      )}
      onClick={onSelect}
      onDoubleClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge
            variant={issue.severity === "high" || issue.severity === "HIGH" ? "destructive" : "outline"}
            className="text-[10px] px-1 py-0 leading-tight"
          >
            {issue.issue_type}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1 py-0 leading-tight">
            {issue.severity}
          </Badge>
        </div>
        <p className="text-xs truncate mt-0.5 text-muted-foreground">
          {issue.description || "No description"} · Job {issue.job_id.slice(0, 8)}
        </p>
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">
        {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
      </span>
      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

/* ── Coverage gap row ── */
function CoverageRow({
  gap,
  isSelected,
  onSelect,
}: {
  gap: { zone_id: string; zone_name: string; gap_count: number };
  isSelected: boolean;
  onSelect: () => void;
}) {
  const nav = useNavigate();
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-1.5 cursor-pointer border-b border-border/50 last:border-b-0 group transition-colors",
        isSelected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50"
      )}
      onClick={onSelect}
      onDoubleClick={() => nav(`/admin/ops/zones/${gap.zone_id}`)}
    >
      <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{gap.zone_name}</p>
        <p className="text-xs text-muted-foreground">Capacity {gap.gap_count} · 0 jobs today</p>
      </div>
      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

export default function DispatcherQueues() {
  const { data, isLoading, refetch, isFetching } = useDispatcherQueues();
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState<QueueKey>(loadSavedTab);
  const [actionJobId, setActionJobId] = useState<string | null>(null);
  const [defaultAction, setDefaultAction] = useState<ActionType | undefined>(undefined);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Persist tab choice
  const handleTabChange = useCallback((v: string) => {
    const key = v as QueueKey;
    setActiveTab(key);
    saveSavedTab(key);
    setSelectedIndex(0);
  }, []);

  // Get current list length
  const currentListLength = data
    ? activeTab === "coverageGaps"
      ? data.coverageGaps.length
      : activeTab === "customerIssues" || activeTab === "providerIncidents"
        ? data[activeTab].length
        : data[activeTab].length
    : 0;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return;

      const queueKeys = QUEUES.map((q) => q.key);
      const currentIdx = queueKeys.indexOf(activeTab);

      switch (e.key.toLowerCase()) {
        case "j": // Next item
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, currentListLength - 1));
          break;
        case "k": // Previous item
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "enter": // Open selected item
          e.preventDefault();
          if (!data) break;
          if (activeTab === "coverageGaps") {
            const gap = data.coverageGaps[selectedIndex];
            if (gap) nav(`/admin/ops/zones/${gap.zone_id}`);
          } else if (activeTab === "customerIssues" || activeTab === "providerIncidents") {
            const issue = data[activeTab][selectedIndex];
            if (issue) nav(`/admin/jobs/${issue.job_id}`);
          } else {
            const job = data[activeTab][selectedIndex];
            if (job) nav(`/admin/jobs/${job.id}`);
          }
          break;
        case "a": // Action on selected job (no preset)
          e.preventDefault();
          if (!data) break;
          if (activeTab !== "coverageGaps" && activeTab !== "customerIssues" && activeTab !== "providerIncidents") {
            const job = data[activeTab][selectedIndex];
            if (job) {
              setDefaultAction(undefined);
              setActionJobId(job.id);
            }
          }
          break;
        case "e": // Escalate — open action dialog with "create_ticket" pre-selected
          e.preventDefault();
          if (!data) break;
          if (activeTab !== "coverageGaps" && activeTab !== "customerIssues" && activeTab !== "providerIncidents") {
            const job = data[activeTab][selectedIndex];
            if (job) {
              setDefaultAction("create_ticket");
              setActionJobId(job.id);
            }
          }
          break;
        case "n": // Note — open action dialog for note
          e.preventDefault();
          if (!data) break;
          if (activeTab !== "coverageGaps" && activeTab !== "customerIssues" && activeTab !== "providerIncidents") {
            const job = data[activeTab][selectedIndex];
            if (job) {
              setDefaultAction("note");
              setActionJobId(job.id);
            }
          }
          break;
        case "r": // Refresh
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            refetch();
          }
          break;
        case "arrowright":
          e.preventDefault();
          if (currentIdx < queueKeys.length - 1) handleTabChange(queueKeys[currentIdx + 1]);
          break;
        case "arrowleft":
          e.preventDefault();
          if (currentIdx > 0) handleTabChange(queueKeys[currentIdx - 1]);
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab, selectedIndex, currentListLength, data, nav, refetch, handleTabChange]);

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
    <div className="animate-fade-in p-6 space-y-4">
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
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground">
                  <Keyboard className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs max-w-[220px]">
                <p className="font-semibold mb-1">Keyboard shortcuts</p>
                <div className="space-y-0.5">
                  <p><kbd className="px-1 bg-muted rounded text-[10px]">J</kbd> / <kbd className="px-1 bg-muted rounded text-[10px]">K</kbd> — Navigate items</p>
                  <p><kbd className="px-1 bg-muted rounded text-[10px]">Enter</kbd> — Open selected</p>
                  <p><kbd className="px-1 bg-muted rounded text-[10px]">A</kbd> — Action on selected</p>
                  <p><kbd className="px-1 bg-muted rounded text-[10px]">E</kbd> — Escalate (create ticket)</p>
                  <p><kbd className="px-1 bg-muted rounded text-[10px]">N</kbd> — Add note</p>
                  <p><kbd className="px-1 bg-muted rounded text-[10px]">R</kbd> — Refresh</p>
                  <p><kbd className="px-1 bg-muted rounded text-[10px]">← →</kbd> — Switch tabs</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 h-7"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap sticky top-0 z-10 bg-background">
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
                data!.atRisk.map((job, i) => (
                  <JobRow key={job.id} job={job} onAction={setActionJobId} isSelected={selectedIndex === i} onSelect={() => setSelectedIndex(i)} />
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
                data!.missingProof.map((job, i) => (
                  <JobRow key={job.id} job={job} onAction={setActionJobId} isSelected={selectedIndex === i} onSelect={() => setSelectedIndex(i)} />
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
                data!.unassigned.map((job, i) => (
                  <JobRow key={job.id} job={job} onAction={setActionJobId} isSelected={selectedIndex === i} onSelect={() => setSelectedIndex(i)} />
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
                data!.coverageGaps.map((gap, i) => (
                  <CoverageRow key={gap.zone_id} gap={gap} isSelected={selectedIndex === i} onSelect={() => setSelectedIndex(i)} />
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
                data!.customerIssues.map((issue, i) => (
                  <IssueRow key={issue.id} issue={issue} onClick={() => nav(`/admin/jobs/${issue.job_id}`)} isSelected={selectedIndex === i} onSelect={() => setSelectedIndex(i)} />
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
                data!.providerIncidents.map((issue, i) => (
                  <IssueRow key={issue.id} issue={issue} onClick={() => nav(`/admin/jobs/${issue.job_id}`)} isSelected={selectedIndex === i} onSelect={() => setSelectedIndex(i)} />
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
          onClose={() => { setActionJobId(null); setDefaultAction(undefined); }}
          defaultAction={defaultAction}
        />
      )}
    </div>
  );
}

function EmptyQueue({ label }: { label: string }) {
  return (
    <div className="px-4 py-6 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
