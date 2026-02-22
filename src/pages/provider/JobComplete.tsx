import { useParams, useNavigate } from "react-router-dom";
import { useJobDetail } from "@/hooks/useJobDetail";
import { useJobActions } from "@/hooks/useJobActions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, CheckCircle2, Camera, AlertTriangle, Send, PartyPopper } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ProviderJobComplete() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useJobDetail(jobId);
  const actions = useJobActions(jobId);
  const [summary, setSummary] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  const { job, checklist, photos, issues } = data;
  const requiredChecklist = checklist.filter((c) => c.is_required);
  const doneChecklist = requiredChecklist.filter((c) => c.status !== "PENDING");
  const requiredPhotos = photos.filter((p) => p.slot_key);
  const uploadedPhotos = requiredPhotos.filter((p) => p.upload_status === "UPLOADED");
  const openIssues = issues.filter((i) => i.status === "OPEN");

  const checklistReady = doneChecklist.length === requiredChecklist.length;
  const photosReady = uploadedPhotos.length === requiredPhotos.length;
  const canSubmit = checklistReady && photosReady;

  const handleSubmit = async () => {
    try {
      const result = await actions.completeJob.mutateAsync(summary || undefined);
      const res = result as any;
      if (res?.status === "INCOMPLETE") {
        toast({ title: "Cannot complete", description: "Some requirements are still missing", variant: "destructive" });
      } else if (res?.status === "PARTIAL_COMPLETE") {
        toast({ title: "Partially complete", description: `${res.open_issues} open issue(s) remain` });
        setSubmitted(true);
      } else {
        setSubmitted(true);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (submitted) {
    return (
      <div className="animate-fade-in p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <PartyPopper className="h-16 w-16 text-accent mb-4" />
        <h1 className="text-h2 mb-2">Job Submitted!</h1>
        <p className="text-muted-foreground mb-6">Great work. Your job has been recorded.</p>
        <Button onClick={() => navigate("/provider/jobs")}>Back to Jobs</Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/provider/jobs/${jobId}`)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-h3">Complete Job</h1>
      </div>

      {/* Checklist summary */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className={`h-5 w-5 ${checklistReady ? "text-success" : "text-muted-foreground"}`} />
          <div className="flex-1">
            <p className="text-sm font-medium">Checklist</p>
            <p className="text-xs text-muted-foreground">
              {doneChecklist.length}/{requiredChecklist.length} required items complete
            </p>
          </div>
          {!checklistReady && (
            <Button size="sm" variant="outline" onClick={() => navigate(`/provider/jobs/${jobId}/checklist`)}>
              Complete
            </Button>
          )}
        </div>
      </Card>

      {/* Photos summary */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Camera className={`h-5 w-5 ${photosReady ? "text-success" : "text-muted-foreground"}`} />
          <div className="flex-1">
            <p className="text-sm font-medium">Photos</p>
            <p className="text-xs text-muted-foreground">
              {uploadedPhotos.length}/{requiredPhotos.length} required photos uploaded
            </p>
          </div>
          {!photosReady && (
            <Button size="sm" variant="outline" onClick={() => navigate(`/provider/jobs/${jobId}/photos`)}>
              Upload
            </Button>
          )}
        </div>
      </Card>

      {/* Issues summary */}
      {openIssues.length > 0 && (
        <Card className="p-4 border-warning/30 bg-warning/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div className="flex-1">
              <p className="text-sm font-medium">Open Issues</p>
              <p className="text-xs text-muted-foreground">
                {openIssues.length} unresolved issue{openIssues.length !== 1 ? "s" : ""}. Job will be marked as partial.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Provider summary */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Summary (optional)</label>
        <Textarea
          placeholder="Add a brief note about the visit..."
          value={summary}
          onChange={(e) => setSummary(e.target.value.slice(0, 240))}
          className="resize-none"
          rows={3}
        />
        <p className="text-xs text-muted-foreground text-right">{summary.length}/240</p>
      </div>

      {/* Submit */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={!canSubmit || actions.completeJob.isPending}
      >
        <Send className="h-4 w-4 mr-2" />
        {openIssues.length > 0 ? "Submit (Partial)" : "Submit Complete"}
      </Button>
    </div>
  );
}
