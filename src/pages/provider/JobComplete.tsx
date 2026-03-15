import { useParams, useNavigate } from "react-router-dom";
import { useJobDetail } from "@/hooks/useJobDetail";
import { useJobActions } from "@/hooks/useJobActions";
import { useProviderJobs } from "@/hooks/useProviderJobs";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, CheckCircle2, Camera, AlertTriangle, Send, PartyPopper, DollarSign, ChevronRight, Trophy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { useState, useMemo } from "react";
import { LevelSufficiencyForm } from "@/components/provider/LevelSufficiencyForm";
import { formatCents } from "@/utils/format";

/** Route progress bar — shows stop completion progress for today */
function RouteProgress({ currentJobId }: { currentJobId: string }) {
  const { data: todayJobs } = useProviderJobs("today_all");
  const navigate = useNavigate();

  const progress = useMemo(() => {
    if (!todayJobs || todayJobs.length === 0) return null;
    const completed = todayJobs.filter((j) => j.status === "COMPLETED").length;
    const total = todayJobs.length;
    const allDone = completed === total;

    // Find next uncompleted job
    const nextJob = todayJobs.find(
      (j) => j.id !== currentJobId && !["COMPLETED", "CANCELED"].includes(j.status)
    );

    return { completed, total, allDone, nextJobId: nextJob?.id ?? null, nextAddress: nextJob?.property?.street_address ?? null };
  }, [todayJobs, currentJobId]);

  if (!progress) return null;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">
            {progress.allDone ? "All stops complete" : `${progress.completed} of ${progress.total} stops complete`}
          </span>
          {progress.allDone && <Trophy className="h-4 w-4 text-success" />}
        </div>
        <div className="flex gap-1">
          {Array.from({ length: progress.total }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 min-w-[4px] rounded-full transition-colors ${
                i < progress.completed ? "bg-success" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Day complete or next stop */}
      {progress.allDone ? (
        <Card className="p-4 bg-success/5 border-success/20 text-center animate-fade-in">
          <Trophy className="h-8 w-8 text-success mx-auto mb-2" />
          <p className="text-sm font-semibold">Day Complete!</p>
          <p className="text-xs text-muted-foreground mt-1">
            All {progress.total} stops finished. Great work today.
          </p>
        </Card>
      ) : progress.nextJobId ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(`/provider/jobs/${progress.nextJobId}`)}
        >
          <span className="truncate">Next Stop: {progress.nextAddress ?? "View job"}</span>
          <ChevronRight className="h-4 w-4 ml-1 shrink-0" />
        </Button>
      ) : null}
    </div>
  );
}

export default function ProviderJobComplete() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useJobDetail(jobId);
  const actions = useJobActions(jobId);
  const [summary, setSummary] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [earnedCents, setEarnedCents] = useState<number | null>(null);

  // Track which SKUs have completed their level feedback
  const [completedLevelSkus, setCompletedLevelSkus] = useState<Set<string>>(new Set());

  if (isLoading || !data) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  const { job, skus, checklist, photos, issues } = data;
  const requiredChecklist = checklist.filter((c) => c.is_required);
  const doneChecklist = requiredChecklist.filter((c) => c.status !== "PENDING");
  const requiredPhotos = photos.filter((p) => p.slot_key);
  const uploadedPhotos = requiredPhotos.filter((p) => p.upload_status === "UPLOADED");
  const openIssues = issues.filter((i) => i.status === "OPEN");

  const checklistReady = doneChecklist.length === requiredChecklist.length;
  const photosReady = uploadedPhotos.length === requiredPhotos.length;

  // SKUs that have levels and need sufficiency feedback
  const skusWithLevels = skus.filter((s) => !!s.scheduled_level_id);
  const allLevelFeedbackDone = skusWithLevels.length === 0 ||
    skusWithLevels.every((s) => completedLevelSkus.has(s.sku_id));

  const canSubmit = checklistReady && photosReady && allLevelFeedbackDone;

  const handleMarkLevelComplete = (skuId: string) => {
    setCompletedLevelSkus((prev) => new Set([...prev, skuId]));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await actions.completeJob.mutateAsync(summary || undefined);
      const res = result as any;
      if (res?.status === "INCOMPLETE") {
        toast({ title: "Cannot complete", description: "Some requirements are still missing", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      // Try to fetch the earning for this job (may be computed async)
      try {
        const { data: earning } = await supabase
          .from("provider_earnings")
          .select("total_cents")
          .eq("job_id", jobId!)
          .maybeSingle();
        if (earning?.total_cents) {
          const amount = (earning.total_cents / 100).toFixed(2);
          setEarnedCents(earning.total_cents);
          sonnerToast.success(`+$${amount} earned`);
        }
      } catch {
        // Earning not yet computed — no toast, show fallback in success screen
      }

      if (res?.status === "PARTIAL_COMPLETE") {
        toast({ title: "Partially complete", description: `${res.open_issues} open issue(s) remain` });
      }
      setSubmitted(true);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="animate-fade-in p-4 pb-24 space-y-6">
        <div className="flex flex-col items-center justify-center pt-8 text-center">
          <PartyPopper className="h-16 w-16 text-accent mb-4" />
          <h1 className="text-h2 mb-2">Job Submitted!</h1>
          {earnedCents ? (
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-success" />
              <span className="text-lg font-bold text-success">
                +{formatCents(earnedCents)} earned
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-2">
              Earnings will appear in your Earn tab
            </p>
          )}
          <p className="text-muted-foreground mb-6">Great work. Your job has been recorded.</p>
        </div>

        {/* B2-3: Route progress with next stop navigation */}
        {jobId && <RouteProgress currentJobId={jobId} />}

        <Button className="w-full" onClick={() => navigate("/provider/jobs")}>
          Back to Jobs
        </Button>
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

      {/* Level Sufficiency Forms — one per SKU with levels */}
      {skusWithLevels.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Level Feedback</p>
          {skusWithLevels.map((sku) => (
            <LevelSufficiencyForm
              key={sku.sku_id}
              jobSku={sku}
              jobId={jobId!}
              propertyId={job.property_id}
              providerOrgId={job.provider_org_id}
              onComplete={() => handleMarkLevelComplete(sku.sku_id)}
            />
          ))}
        </div>
      )}

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
        disabled={!canSubmit || submitting}
      >
        <Send className="h-4 w-4 mr-2" />
        {!allLevelFeedbackDone
          ? "Complete level feedback first"
          : openIssues.length > 0
            ? "Submit (Partial)"
            : "Submit Complete"}
      </Button>
    </div>
  );
}
