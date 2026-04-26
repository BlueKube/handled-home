import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { PhotoGallery } from "@/components/customer/PhotoGallery";
import { BeforeAfterSlider } from "@/components/customer/BeforeAfterSlider";
import { ReportIssueSheet } from "@/components/customer/ReportIssueSheet";
import { ShareCardSheet } from "@/components/customer/ShareCardSheet";
import { ReceiptSuggestions } from "@/components/customer/ReceiptSuggestions";
import { QuickFeedbackCard } from "@/components/customer/QuickFeedbackCard";
import { PrivateReviewCard } from "@/components/customer/PrivateReviewCard";
import { PostVisitGrowthCard } from "@/components/customer/PostVisitGrowthCard";
import { VisitDetailLevelCallouts } from "@/components/customer/VisitDetailLevelCallouts";
import { VisitDetailReferralCard } from "@/components/customer/VisitDetailReferralCard";
import { HelpTip } from "@/components/ui/help-tip";
import {
  ChevronLeft, Clock, CheckCircle2, XCircle, AlertTriangle, Share2,
} from "lucide-react";
import { useQuickFeedback } from "@/hooks/useQuickFeedback";
import { usePrivateReview } from "@/hooks/usePrivateReview";
import { useAddRoutineItem } from "@/hooks/useRoutineActions";
import { useRoutine } from "@/hooks/useRoutine";
import { useProperty } from "@/hooks/useProperty";
import type { VisitDetail } from "@/hooks/useCustomerVisitDetail";

interface Props {
  jobId: string;
  data: VisitDetail;
}

export function VisitDetailComplete({ jobId, data }: Props) {
  const navigate = useNavigate();
  const { feedback, submitFeedback } = useQuickFeedback(jobId);
  const { review, submitReview } = usePrivateReview(jobId);
  const [issueSheetOpen, setIssueSheetOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const { property } = useProperty();
  const { data: routineData } = useRoutine(property?.id);
  const addItem = useAddRoutineItem();

  const handleAddToRoutine = useCallback(
    async (skuId: string, levelId?: string | null) => {
      if (!routineData?.version?.id) {
        toast.error("No active routine found");
        return;
      }
      try {
        await addItem.mutateAsync({
          versionId: routineData.version.id,
          skuId,
          levelId,
        });
      } catch {
        toast.error("Couldn't add service");
      }
    },
    [routineData, addItem]
  );

  const { job, skus, checklistHighlights, issue, timeOnSiteMinutes, courtesyUpgrade, recommendation, photos } = data;

  const beforePhoto = useMemo(
    () => photos.find((p) => p.slot_key?.toLowerCase().includes("before")),
    [photos]
  );
  const afterPhoto = useMemo(
    () => photos.find((p) => p.slot_key?.toLowerCase().includes("after")),
    [photos]
  );
  const hasBeforeAfter = !!(beforePhoto?.signedUrl && afterPhoto?.signedUrl);

  const skuSummary =
    skus
      .map((s) => {
        const name = s.sku_name_snapshot ?? "Service";
        const level = s.scheduled_level_label;
        return level ? `${name} (${level})` : name;
      })
      .join(", ") || "Visit";
  const visitDate = job.completed_at
    ? format(new Date(job.completed_at), "EEEE, MMM d, yyyy")
    : job.scheduled_date
      ? format(new Date(job.scheduled_date), "EEEE, MMM d, yyyy")
      : "—";
  const jobStatusForBadge = issue
    ? issue.status === "resolved"
      ? "resolved"
      : "under_review"
    : job.status === "COMPLETED"
      ? "completed"
      : job.status.toLowerCase();

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 -ml-2"
        onClick={() => navigate("/customer/visits")}
      >
        <ChevronLeft className="h-4 w-4" />
        Visits
      </Button>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <StatusBadge status={jobStatusForBadge} />
        </div>
        <h1 className="text-h2">
          {skuSummary}{" "}
          <HelpTip text="This is your visit receipt — it includes photos, checklists, and provider notes for this service." />
        </h1>
        <p className="text-sm text-muted-foreground">{visitDate}</p>
      </div>

      <Card className="p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Presence Proof
        </h3>
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

      <Card className="p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Photo Proof
        </h3>
        <PhotoGallery photos={photos} />
      </Card>

      {hasBeforeAfter && (
        <Card className="p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Before &amp; After
          </h3>
          <BeforeAfterSlider
            beforeUrl={beforePhoto!.signedUrl!}
            afterUrl={afterPhoto!.signedUrl!}
          />
        </Card>
      )}

      <Card className="p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Work Summary
        </h3>
        {job.provider_summary && <p className="text-sm">{job.provider_summary}</p>}
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
                    <p className="text-xs text-muted-foreground">
                      Not completed: {item.reason_code.replace(/_/g, " ")}
                    </p>
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

      <VisitDetailLevelCallouts
        courtesyUpgrade={courtesyUpgrade}
        recommendation={recommendation}
      />

      {job.status === "COMPLETED" && (
        <QuickFeedbackCard
          existingFeedback={
            feedback
              ? { outcome: feedback.outcome, tags: (feedback.tags ?? []) as string[] }
              : null
          }
          onSubmit={(outcome, tags) => submitFeedback.mutate({ outcome, tags })}
          onIssue={() => setIssueSheetOpen(true)}
          isSubmitting={submitFeedback.isPending}
        />
      )}

      {job.status === "COMPLETED" && (
        <PrivateReviewCard
          existingReview={
            review
              ? {
                  rating: review.rating,
                  tags: (review.tags ?? []) as string[],
                  comment_public_candidate: review.comment_public_candidate,
                }
              : null
          }
          onSubmit={(payload) => submitReview.mutate(payload)}
          isSubmitting={submitReview.isPending}
        />
      )}

      {job.status === "COMPLETED" && (review?.rating ?? 0) >= 4 && (
        <PostVisitGrowthCard />
      )}

      {job.status === "COMPLETED" && !issue && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setShareSheetOpen(true)}
        >
          <Share2 className="h-4 w-4" /> Share the after photo
        </Button>
      )}

      {job.status === "COMPLETED" && <VisitDetailReferralCard />}

      {job.status === "COMPLETED" && property?.id && (
        <ReceiptSuggestions
          propertyId={property.id}
          onAddToRoutine={handleAddToRoutine}
        />
      )}

      <Card className="p-4 space-y-3">
        {issue ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <p className="text-sm font-medium">Issue reported</p>
              <StatusBadge
                status={issue.status === "resolved" ? "resolved" : "submitted"}
                className="text-[10px] h-5"
              />
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

      <ReportIssueSheet
        open={issueSheetOpen}
        onOpenChange={setIssueSheetOpen}
        jobId={jobId}
        visitDate={job.completed_at}
      />

      <ShareCardSheet
        open={shareSheetOpen}
        onOpenChange={setShareSheetOpen}
        jobId={jobId}
        zoneId={job.zone_id}
      />
    </div>
  );
}
