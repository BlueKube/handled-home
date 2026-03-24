import { useParams, useNavigate } from "react-router-dom";
import { useJobDetail } from "@/hooks/useJobDetail";
import { useJobActions } from "@/hooks/useJobActions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { ReportIssueSheet } from "@/components/provider/ReportIssueSheet";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ChevronLeft, Check, X, AlertCircle, AlertTriangle, CheckSquare,
  CheckCircle2, Camera, ArrowRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const REASON_CODES = [
  { value: "not_applicable", label: "Not applicable to this property" },
  { value: "weather", label: "Weather prevented completion" },
  { value: "access_blocked", label: "Could not access area" },
  { value: "customer_request", label: "Customer requested skip" },
  { value: "safety", label: "Safety concern" },
  { value: "other", label: "Other" },
];

export default function ProviderJobChecklist() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useJobDetail(jobId);
  const actions = useJobActions(jobId);
  const [skipDialog, setSkipDialog] = useState<string | null>(null);
  const [skipReason, setSkipReason] = useState("");
  const [skipNote, setSkipNote] = useState("");
  const [issueSheetOpen, setIssueSheetOpen] = useState(false);

  // Group checklist items by SKU
  const skuGroups = useMemo(() => {
    if (!data) return [];
    const { checklist, skus } = data;
    const skuMap = new Map(skus.map((s) => [s.sku_id, s.sku_name_snapshot ?? "Service"]));
    const groups = new Map<string, { name: string; items: typeof checklist }>();

    for (const item of checklist) {
      const key = item.sku_id ?? "__general__";
      if (!groups.has(key)) {
        groups.set(key, {
          name: item.sku_id ? (skuMap.get(item.sku_id) ?? "Service") : "General",
          items: [],
        });
      }
      groups.get(key)!.items.push(item);
    }
    return Array.from(groups.values());
  }, [data]);

  if (isLoading || !data) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-4 w-24" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const { checklist, job, property } = data;
  const isActive = ["IN_PROGRESS", "ISSUE_REPORTED", "PARTIAL_COMPLETE"].includes(job.status);
  const isReadOnly = !isActive;
  const required = checklist.filter((c) => c.is_required);
  const done = required.filter((c) => c.status !== "PENDING");
  const progress = required.length > 0 ? Math.round((done.length / required.length) * 100) : 100;
  const allRequiredDone = done.length === required.length && required.length > 0;
  const showStickyBar = isActive;

  const handleDone = async (itemId: string) => {
    try {
      await actions.updateChecklistItem.mutateAsync({ itemId, status: "DONE" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleSkipSubmit = async () => {
    if (!skipDialog || !skipReason) return;
    try {
      await actions.updateChecklistItem.mutateAsync({
        itemId: skipDialog,
        status: "NOT_DONE_WITH_REASON",
        reason_code: skipReason,
        note: skipNote || undefined,
      });
      setSkipDialog(null);
      setSkipReason("");
      setSkipNote("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleIssueSubmit = async (params: { issue_type: string; severity: string; description?: string }) => {
    try {
      await actions.reportIssue.mutateAsync(params);
      toast({ title: "Issue reported" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <>
      <div className={`animate-fade-in p-4 space-y-4 ${showStickyBar ? "pb-48" : "pb-24"}`}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/provider/jobs/${jobId}`)}
            aria-label="Back to job detail"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-h3">Checklist</h1>
            <p className="text-caption truncate">
              {property ? `${property.street_address}, ${property.city}` : `${done.length}/${required.length} required complete`}
            </p>
          </div>
          {isReadOnly && <StatusBadge status={job.status.toLowerCase()} />}
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              {done.length}/{required.length} required complete
            </span>
            {allRequiredDone && (
              <span className="text-xs text-success font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> All done
              </span>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* All complete celebration */}
        {allRequiredDone && (
          <Card className="p-4 bg-success/5 border-success/20 animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">All required items complete</p>
                <p className="text-xs text-muted-foreground">Continue to photos to finish this job.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Empty state */}
        {checklist.length === 0 && (
          <EmptyState
            compact
            icon={CheckSquare}
            title="No checklist items"
            body="This job has no checklist requirements. Continue to photos."
          />
        )}

        {/* Checklist items grouped by SKU */}
        {skuGroups.map((group) => (
          <div key={group.name} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
              <h2 className="text-sm font-semibold text-foreground">{group.name}</h2>
            </div>
            {group.items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.is_required && (
                        <span className="text-[10px] text-destructive font-medium">Required</span>
                      )}
                    </div>
                    {item.status === "NOT_DONE_WITH_REASON" && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        <span className="text-warning font-medium">Skipped:</span>{" "}
                        {REASON_CODES.find((r) => r.value === item.reason_code)?.label ?? item.reason_code}
                        {item.note && <span> — {item.note}</span>}
                      </div>
                    )}
                  </div>
                  {!isReadOnly && item.status === "PENDING" ? (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="default"
                        variant="default"
                        className="h-11 px-4"
                        onClick={() => handleDone(item.id)}
                        disabled={actions.updateChecklistItem.isPending}
                        aria-label={`Mark "${item.label}" done`}
                      >
                        <Check className="h-4 w-4 mr-1.5" />
                        Done
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-11 w-11"
                        onClick={() => setSkipDialog(item.id)}
                        aria-label={`Skip "${item.label}"`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : item.status === "DONE" ? (
                    <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-success/10">
                      <Check className="h-5 w-5 text-success" />
                    </div>
                  ) : item.status === "NOT_DONE_WITH_REASON" ? (
                    <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-warning/10">
                      <AlertCircle className="h-5 w-5 text-warning" />
                    </div>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        ))}

        {/* Report an Issue button */}
        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-warning"
            onClick={() => setIssueSheetOpen(true)}
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            Report an Issue
          </Button>
        )}

        {/* Skip reason dialog */}
        <Dialog open={!!skipDialog} onOpenChange={(open) => !open && setSkipDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cannot Complete Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Select value={skipReason} onValueChange={setSkipReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {REASON_CODES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Additional notes (optional)"
                value={skipNote}
                onChange={(e) => setSkipNote(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSkipDialog(null)}>Cancel</Button>
              <Button onClick={handleSkipSubmit} disabled={!skipReason || actions.updateChecklistItem.isPending}>
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Issue reporting sheet */}
        <ReportIssueSheet
          open={issueSheetOpen}
          onOpenChange={setIssueSheetOpen}
          onSubmit={handleIssueSubmit}
          isPending={actions.reportIssue.isPending}
        />
      </div>

      {/* Sticky Action Bar */}
      {showStickyBar && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 pb-safe space-y-2 max-w-2xl mx-auto">
          <Button
            className="w-full"
            size="lg"
            variant={allRequiredDone ? "accent" : "default"}
            onClick={() => navigate(`/provider/jobs/${jobId}/photos`)}
          >
            <Camera className="h-4 w-4 mr-2" />
            Continue to Photos
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => navigate(`/provider/jobs/${jobId}`)}
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Back to Job
          </Button>
        </div>
      )}
    </>
  );
}
