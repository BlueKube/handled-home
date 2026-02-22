import { useParams, useNavigate } from "react-router-dom";
import { useJobDetail } from "@/hooks/useJobDetail";
import { useJobActions } from "@/hooks/useJobActions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Check, X, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
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

  if (isLoading || !data) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
      </div>
    );
  }

  const { checklist, job } = data;
  const isReadOnly = !["IN_PROGRESS", "ISSUE_REPORTED", "PARTIAL_COMPLETE"].includes(job.status);
  const required = checklist.filter((c) => c.is_required);
  const done = required.filter((c) => c.status !== "PENDING");
  const progress = required.length > 0 ? Math.round((done.length / required.length) * 100) : 100;

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

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/provider/jobs/${jobId}`)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-h3">Checklist</h1>
          <p className="text-caption">{done.length}/{required.length} required complete</p>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      {/* Items */}
      <div className="space-y-2">
        {checklist.map((item) => (
          <Card key={item.id} className="p-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
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
                <div className="flex gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8 px-3"
                    onClick={() => handleDone(item.id)}
                    disabled={actions.updateChecklistItem.isPending}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Done
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                    onClick={() => setSkipDialog(item.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : item.status === "DONE" ? (
                <div className="flex items-center text-success">
                  <Check className="h-4 w-4" />
                </div>
              ) : item.status === "NOT_DONE_WITH_REASON" ? (
                <div className="flex items-center text-warning">
                  <AlertCircle className="h-4 w-4" />
                </div>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

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
    </div>
  );
}
