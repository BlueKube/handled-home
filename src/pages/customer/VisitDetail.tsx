import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCustomerVisitDetail } from "@/hooks/useCustomerVisitDetail";
import { useQuickFeedback } from "@/hooks/useQuickFeedback";
import { usePrivateReview } from "@/hooks/usePrivateReview";
import { useUpdateRoutineItemLevel } from "@/hooks/useRoutineActions";
import { useRoutine } from "@/hooks/useRoutine";
import { useProperty } from "@/hooks/useProperty";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { PhotoGallery } from "@/components/customer/PhotoGallery";
import { BeforeAfterSlider } from "@/components/customer/BeforeAfterSlider";
import { ReportIssueSheet } from "@/components/customer/ReportIssueSheet";
import { ShareCardSheet } from "@/components/customer/ShareCardSheet";

import { QuickFeedbackCard } from "@/components/customer/QuickFeedbackCard";
import { PrivateReviewCard } from "@/components/customer/PrivateReviewCard";
import { ArrowLeft, Clock, CheckCircle2, XCircle, AlertTriangle, Share2, ArrowUpCircle, Lightbulb } from "lucide-react";
import { format } from "date-fns";

export default function CustomerVisitDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useCustomerVisitDetail(jobId);
  const { feedback, submitFeedback } = useQuickFeedback(jobId);
  const { review, submitReview } = usePrivateReview(jobId);
  const [issueSheetOpen, setIssueSheetOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [dismissedRecommendation, setDismissedRecommendation] = useState(false);
  const { property } = useProperty();
  const { data: routineData } = useRoutine(property?.id);
  const updateLevel = useUpdateRoutineItemLevel();

  const handleUpdateLevel = (levelId: string, skuId: string) => {
    if (!routineData) {
      toast.error("No active routine found");
      return;
    }
    const item = routineData.items.find((i) => i.sku_id === skuId);
    if (!item) {
      toast.error("Service not found in your routine");
      return;
    }
    updateLevel.mutate(
      { itemId: item.id, levelId },
      {
        onSuccess: () => toast.success("Routine updated to new level"),
        onError: () => toast.error("Failed to update level"),
      }
    );
  };

  // Find before/after pair for comparison
  const photos = data?.photos ?? [];
  const beforePhoto = useMemo(() => photos.find((p) => p.slot_key?.toLowerCase().includes("before")), [photos]);
  const afterPhoto = useMemo(() => photos.find((p) => p.slot_key?.toLowerCase().includes("after")), [photos]);
  const hasBeforeAfter = !!(beforePhoto?.signedUrl && afterPhoto?.signedUrl);

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl">
        <div className="h-6 w-32 bg-muted/50 rounded animate-pulse mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 max-w-4xl text-center">
        <p className="text-sm text-muted-foreground">Visit not found.</p>
        <Button variant="link" onClick={() => navigate("/customer/visits")}>← Back to visits</Button>
      </div>
    );
  }

  const { job, skus, checklistHighlights, issue, timeOnSiteMinutes, courtesyUpgrade, recommendation } = data;

  const skuSummary = skus.map((s) => {
    const name = s.sku_name_snapshot ?? "Service";
    const level = s.scheduled_level_label;
    return level ? `${name} (${level})` : name;
  }).join(", ") || "Visit";
  const visitDate = job.completed_at
    ? format(new Date(job.completed_at), "EEEE, MMM d, yyyy")
    : job.scheduled_date
      ? format(new Date(job.scheduled_date), "EEEE, MMM d, yyyy")
      : "—";

  const jobStatusForBadge = issue
    ? issue.status === "resolved" ? "resolved" : "under_review"
    : job.status === "COMPLETED" ? "completed" : job.status.toLowerCase();

  return (
    <div className="p-6 max-w-4xl space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="gap-1 -ml-2" onClick={() => navigate("/customer/visits")}>
        <ArrowLeft className="h-4 w-4" />
        Visits
      </Button>

      {/* 8.1 Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <StatusBadge status={jobStatusForBadge} />
        </div>
        <h1 className="text-h2">{skuSummary}</h1>
        <p className="text-sm text-muted-foreground">{visitDate}</p>
      </div>

      {/* 8.2 Presence Proof */}
      <Card className="p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Presence Proof</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Arrived</p>
            <p className="text-sm font-medium">
              {job.arrived_at ? format(new Date(job.arrived_at), "h:mm a") : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Left</p>
            <p className="text-sm font-medium">
              {job.departed_at ? format(new Date(job.departed_at), "h:mm a") : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">On site</p>
            <p className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {timeOnSiteMinutes != null ? `${timeOnSiteMinutes} min` : "—"}
            </p>
          </div>
        </div>
        {!job.arrived_at && !job.departed_at && job.status === "COMPLETED" && (
          <p className="text-xs text-muted-foreground italic">Verified by support.</p>
        )}
      </Card>

      {/* 8.3 Photo Proof Gallery */}
      <Card className="p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Photo Proof</h3>
        <PhotoGallery photos={photos} />
      </Card>

      {/* Before/After Comparison */}
      {hasBeforeAfter && (
        <Card className="p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Before &amp; After</h3>
          <BeforeAfterSlider
            beforeUrl={beforePhoto!.signedUrl!}
            afterUrl={afterPhoto!.signedUrl!}
          />
        </Card>
      )}

      <Card className="p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Work Summary</h3>

        {job.provider_summary && (
          <p className="text-sm">{job.provider_summary}</p>
        )}

        {checklistHighlights.length > 0 && (
          <div className="space-y-1.5">
            {checklistHighlights.map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                {item.status === "DONE" ? (
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm">{item.label}</p>
                  {item.status === "NOT_DONE_WITH_REASON" && item.reason_code && (
                    <p className="text-xs text-muted-foreground">Not completed: {item.reason_code.replace(/_/g, " ")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!job.provider_summary && checklistHighlights.length === 0 && (
          <p className="text-sm text-muted-foreground">No additional details available.</p>
        )}
      </Card>

      {/* Courtesy Upgrade Notice */}
      {courtesyUpgrade && (
        <Card className="p-4 space-y-2 border-primary/30 bg-primary/5">
          <div className="flex items-start gap-2">
            <ArrowUpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Courtesy Upgrade Applied</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                We upgraded you from {courtesyUpgrade.scheduled_level_label} to {courtesyUpgrade.performed_level_label} today
                so your home meets Handled standards.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Reason: {courtesyUpgrade.reason_code.replace(/_/g, " ")}
              </p>
            </div>
          </div>
          <Button
            variant="default"
            size="sm"
            className="w-full text-xs mt-2"
            disabled={updateLevel.isPending}
            onClick={() => handleUpdateLevel(courtesyUpgrade.performed_level_id, courtesyUpgrade.sku_id)}
          >
            Update to {courtesyUpgrade.performed_level_label} going forward
          </Button>
        </Card>
      )}

      {/* Provider Recommendation Notice */}
      {recommendation && !courtesyUpgrade && !dismissedRecommendation && (
        <Card className="p-4 space-y-2 border-accent/30 bg-accent/5">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Provider Recommendation</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your provider recommends upgrading to {recommendation.recommended_level_label} for better results.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Reason: {recommendation.reason_code.replace(/_/g, " ")}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1 text-xs"
              disabled={updateLevel.isPending}
              onClick={() => handleUpdateLevel(recommendation.recommended_level_id, recommendation.sku_id)}
            >
              Update going forward
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {
                setDismissedRecommendation(true);
                toast.info("Keeping current level");
              }}
            >
              Keep current level
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Feedback — receipt-anchored satisfaction check */}
      {job.status === "COMPLETED" && (
        <QuickFeedbackCard
          existingFeedback={feedback ? { outcome: feedback.outcome, tags: (feedback.tags ?? []) as string[] } : null}
          onSubmit={(outcome, tags) => submitFeedback.mutate({ outcome, tags })}
          onIssue={() => setIssueSheetOpen(true)}
          isSubmitting={submitFeedback.isPending}
        />
      )}

      {/* Private Review — delayed anonymous provider feedback */}
      {job.status === "COMPLETED" && (
        <PrivateReviewCard
          existingReview={review ? {
            rating: review.rating,
            tags: (review.tags ?? []) as string[],
            comment_public_candidate: review.comment_public_candidate,
          } : null}
          onSubmit={(data) => submitReview.mutate(data)}
          isSubmitting={submitReview.isPending}
        />
      )}

      {/* Share CTA */}
      {job.status === "COMPLETED" && !issue && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setShareSheetOpen(true)}
        >
          <Share2 className="h-4 w-4" /> Share the after photo
        </Button>
      )}

      {/* 8.5 Issue / Problem CTA */}
      <Card className="p-4 space-y-3">
        {issue ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <p className="text-sm font-medium">Issue reported</p>
              <StatusBadge status={issue.status === "resolved" ? "resolved" : "submitted"} className="text-[10px] h-5" />
            </div>
            <p className="text-sm text-muted-foreground">{issue.note}</p>
            <p className="text-xs text-muted-foreground">
              Submitted {format(new Date(issue.created_at), "MMM d, yyyy")}
            </p>
            {issue.resolution_note && (
              <div className="bg-success/10 rounded-lg p-3">
                <p className="text-sm">{issue.resolution_note}</p>
              </div>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIssueSheetOpen(true)}
          >
            Report a problem
          </Button>
        )}
      </Card>

      {jobId && (
        <ReportIssueSheet
          open={issueSheetOpen}
          onOpenChange={setIssueSheetOpen}
          jobId={jobId}
          visitDate={job.completed_at}
        />
      )}

      {jobId && (
        <ShareCardSheet
          open={shareSheetOpen}
          onOpenChange={setShareSheetOpen}
          jobId={jobId}
          zoneId={job.zone_id}
        />
      )}
    </div>
  );
}
