import { useParams, useNavigate } from "react-router-dom";
import { useJobDetail } from "@/hooks/useJobDetail";
import { useJobActions } from "@/hooks/useJobActions";
import { useProviderJobs } from "@/hooks/useProviderJobs";
import { useReportProviderIssue, type ProviderIssueType } from "@/hooks/useProviderIssueReport";
import { useProposeProviderAction } from "@/hooks/useProviderSelfHealing";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProviderReportIssueSheet } from "@/components/provider/ProviderReportIssueSheet";
import { ProviderSelfHealingSheet } from "@/components/provider/ProviderSelfHealingSheet";
import {
  Play, CheckSquare, Camera, Send, AlertTriangle, MapPin, Clock,
  ChevronLeft, ChevronRight, Dog, Key, Car, ShieldAlert, LogIn, LogOut
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Look up the visit_id for this job by matching property + date */
function useVisitIdForJob(job: { property_id: string; scheduled_date: string | null; provider_org_id: string } | undefined) {
  return useQuery({
    queryKey: ["visit_for_job", job?.property_id, job?.scheduled_date, job?.provider_org_id],
    enabled: !!(job?.property_id && job?.scheduled_date && job?.provider_org_id),
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      if (!job?.property_id || !job?.scheduled_date || !job?.provider_org_id) return null;
      const { data, error } = await supabase
        .from("visits")
        .select("id")
        .eq("property_id", job.property_id)
        .eq("scheduled_date", job.scheduled_date)
        .eq("provider_org_id", job.provider_org_id)
        .not("schedule_state", "in", '("canceled","rescheduled")')
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
  });
}

/** Queue position breadcrumb — shows "Stop X of Y" with prev/next nav */
function QueueBreadcrumb({ jobId }: { jobId: string }) {
  const navigate = useNavigate();
  const { data: todayJobs } = useProviderJobs("today_all");

  const queueInfo = useMemo(() => {
    if (!todayJobs || todayJobs.length === 0) return null;
    const idx = todayJobs.findIndex((j) => j.id === jobId);
    if (idx === -1) return null;
    return {
      index: idx,
      total: todayJobs.length,
      prevId: idx > 0 ? todayJobs[idx - 1].id : null,
      nextId: idx < todayJobs.length - 1 ? todayJobs[idx + 1].id : null,
    };
  }, [todayJobs, jobId]);

  if (!queueInfo) return null;

  return (
    <div className="flex items-center justify-between px-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        disabled={!queueInfo.prevId}
        onClick={() => queueInfo.prevId && navigate(`/provider/jobs/${queueInfo.prevId}`, { replace: true })}
        aria-label="Previous stop"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-xs text-muted-foreground font-medium" role="status" aria-live="polite">
        Stop {queueInfo.index + 1} of {queueInfo.total} today
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        disabled={!queueInfo.nextId}
        onClick={() => queueInfo.nextId && navigate(`/provider/jobs/${queueInfo.nextId}`, { replace: true })}
        aria-label="Next stop"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function ProviderJobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useJobDetail(jobId);
  const actions = useJobActions(jobId);
  const [issueSheetOpen, setIssueSheetOpen] = useState(false);
  const [selfHealOpen, setSelfHealOpen] = useState(false);
  const reportIssue = useReportProviderIssue();
  const proposeAction = useProposeProviderAction();

  // Resolve visit_id for the report_provider_issue RPC
  const { data: visitId } = useVisitIdForJob(data?.job);

  if (isLoading || !data) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  const { job, skus, checklist, photos, issues, property } = data;
  const isActive = ["IN_PROGRESS", "ISSUE_REPORTED", "PARTIAL_COMPLETE"].includes(job.status);
  const isNotStarted = job.status === "NOT_STARTED";
  const isCompleted = job.status === "COMPLETED" || job.status === "CANCELED";

  const requiredChecklist = checklist.filter((c) => c.is_required);
  const doneChecklist = requiredChecklist.filter((c) => c.status !== "PENDING");
  const requiredPhotos = photos.filter((p) => p.slot_key);
  const uploadedPhotos = requiredPhotos.filter((p) => p.upload_status === "UPLOADED");

  const canComplete = doneChecklist.length === requiredChecklist.length
    && uploadedPhotos.length === requiredPhotos.length
    && isActive;

  const handleStart = async () => {
    try {
      await actions.startJob.mutateAsync();
      toast({ title: "Job started" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleArrival = async () => {
    try {
      await actions.recordArrival.mutateAsync("manual");
      toast({ title: "Arrival recorded" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDeparture = async () => {
    try {
      await actions.recordDeparture.mutateAsync("manual");
      toast({ title: "Departure recorded" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleIssueSubmit = async (params: {
    issueType: ProviderIssueType;
    reasonCode: string;
    note?: string;
  }) => {
    if (!visitId) {
      // Fallback to legacy job_issues for jobs without a matching visit
      try {
        await actions.reportIssue.mutateAsync({
          issue_type: params.issueType,
          severity: "MED",
          description: `[${params.reasonCode}] ${params.note ?? ""}`.trim(),
        });
        toast({ title: "Issue reported" });
      } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
      return;
    }

    try {
      await reportIssue.mutateAsync({
        visitId,
        issueType: params.issueType,
        reasonCode: params.reasonCode,
        note: params.note,
      });
      toast({ title: "Issue reported" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const pets = property?.pets;
  const hasPets = Array.isArray(pets) && pets.length > 0;

  // Determine if we need a sticky action bar (only when job is actionable)
  const showStickyBar = isNotStarted || isActive;

  // P3: Determine secondary button count for grid layout
  const secondaryButtons: React.ReactNode[] = [];
  if (isActive && !job.arrived_at) {
    secondaryButtons.push(
      <Button key="arrive" variant="outline" size="sm" onClick={handleArrival} disabled={actions.recordArrival.isPending}>
        <LogIn className="h-3.5 w-3.5 mr-1.5" />Arrived
      </Button>
    );
  }
  if (isActive && job.arrived_at && !job.departed_at) {
    secondaryButtons.push(
      <Button key="depart" variant="outline" size="sm" onClick={handleDeparture} disabled={actions.recordDeparture.isPending}>
        <LogOut className="h-3.5 w-3.5 mr-1.5" />Departed
      </Button>
    );
  }
  if (isActive) {
    secondaryButtons.push(
      <Button key="checklist" variant="outline" size="sm" onClick={() => navigate(`/provider/jobs/${jobId}/checklist`)}>
        <CheckSquare className="h-3.5 w-3.5 mr-1.5" />Checklist
      </Button>
    );
    secondaryButtons.push(
      <Button key="photos" variant="outline" size="sm" onClick={() => navigate(`/provider/jobs/${jobId}/photos`)}>
        <Camera className="h-3.5 w-3.5 mr-1.5" />Photos
      </Button>
    );
  }

  return (
    <>
      <div className={`animate-fade-in p-4 space-y-4 ${showStickyBar ? "pb-48" : "pb-24"}`}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/provider/jobs")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-h3">Job Detail</h1>
            <p className="text-caption">
              {property ? `${property.street_address}, ${property.city}` : "Property"}
            </p>
          </div>
          <StatusBadge status={job.status.toLowerCase()} />
        </div>

        {/* Queue position breadcrumb */}
        {jobId && <QueueBreadcrumb jobId={jobId} />}

        {/* What to do */}
        <Card className="p-4 space-y-2">
          <h2 className="text-sm font-semibold text-foreground">What to do</h2>
          {skus.length === 0 ? (
            <p className="text-xs text-muted-foreground">No services assigned</p>
          ) : (
            <div className="space-y-3">
              {skus.map((s) => (
                <div key={s.id} className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                    <span className="font-medium">{s.sku_name_snapshot ?? "Service"}</span>
                    {s.scheduled_level_label && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                        {s.scheduled_level_label}
                      </span>
                    )}
                  </div>
                  {s.scheduled_level_planned_minutes && (
                    <div className="ml-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{s.scheduled_level_planned_minutes} min target</span>
                    </div>
                  )}
                  {s.scheduled_level_inclusions && s.scheduled_level_inclusions.length > 0 && (
                    <ul className="ml-4 space-y-0.5">
                      {(s.scheduled_level_inclusions as string[]).slice(0, 6).map((inc, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                          <span className="text-success mt-0.5">✓</span> {inc}
                        </li>
                      ))}
                    </ul>
                  )}
                  {s.scheduled_level_proof_photo_min != null && s.scheduled_level_proof_photo_min > 0 && (
                    <div className="ml-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Camera className="h-3 w-3" />
                      <span>{s.scheduled_level_proof_photo_min} photo{s.scheduled_level_proof_photo_min !== 1 ? "s" : ""} required</span>
                    </div>
                  )}
                  {!s.scheduled_level_label && s.duration_minutes_snapshot && (
                    <div className="ml-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{s.duration_minutes_snapshot} min</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Access & Safety */}
        <Card className="p-4 space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Access & Safety</h2>
          <div className="grid gap-2 text-sm">
            {property?.gate_code && (
              <div className="flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Gate: {property.gate_code}</span>
              </div>
            )}
            {hasPets && (
              <div className="flex items-center gap-2">
                <Dog className="h-3.5 w-3.5 text-warning" />
                <span>Pets on property</span>
              </div>
            )}
            {property?.parking_instructions && (
              <div className="flex items-center gap-2">
                <Car className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{property.parking_instructions}</span>
              </div>
            )}
            {property?.access_instructions && (
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                <span>{property.access_instructions}</span>
              </div>
            )}
            {job.access_notes_snapshot && (
              <p className="text-xs text-muted-foreground italic">{job.access_notes_snapshot}</p>
            )}
            {!property?.gate_code && !hasPets && !property?.parking_instructions && !property?.access_instructions && !job.access_notes_snapshot && (
              <p className="text-xs text-muted-foreground">No special access notes</p>
            )}
          </div>
        </Card>

        {/* Proof Required */}
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Proof Required</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => !isCompleted && navigate(`/provider/jobs/${jobId}/checklist`)}
              disabled={isCompleted || isNotStarted}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition disabled:opacity-50"
            >
              <CheckSquare className="h-5 w-5 text-foreground" />
              <span className="text-xs font-medium">{doneChecklist.length}/{requiredChecklist.length} Checklist</span>
            </button>
            <button
              onClick={() => !isCompleted && navigate(`/provider/jobs/${jobId}/photos`)}
              disabled={isCompleted || isNotStarted}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition disabled:opacity-50"
            >
              <Camera className="h-5 w-5 text-foreground" />
              <span className="text-xs font-medium">{uploadedPhotos.length}/{requiredPhotos.length} Photos</span>
            </button>
          </div>
          {isActive && !canComplete && (
            <p className="text-xs text-muted-foreground text-center">
              Finish checklist and required photos to complete.
            </p>
          )}
        </Card>

        {/* Issues indicator */}
        {issues.length > 0 && (
          <Card className="p-3 border-warning/30 bg-warning/5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">
                {issues.filter((i) => i.status === "OPEN").length} open issue{issues.filter((i) => i.status === "OPEN").length !== 1 ? "s" : ""}
              </span>
            </div>
          </Card>
        )}

        {/* Timestamps */}
        {(job.arrived_at || job.departed_at) && (
          <div className="flex gap-4 text-xs text-muted-foreground">
            {job.arrived_at && (
              <div className="flex items-center gap-1">
                <LogIn className="h-3 w-3" />
                Arrived {new Date(job.arrived_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
            {job.departed_at && (
              <div className="flex items-center gap-1">
                <LogOut className="h-3 w-3" />
                Departed {new Date(job.departed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
          </div>
        )}

        {/* Inline lesser actions (Report Issue, Quick Actions) */}
        {isActive && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-warning"
              onClick={() => setIssueSheetOpen(true)}
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
              Report an Issue
            </Button>

            {/* Quick Actions button — self-healing */}
            {visitId && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setSelfHealOpen(true)}
              >
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Quick Actions
              </Button>
            )}
          </div>
        )}

        {/* Structured issue reporting sheet — wired to report_provider_issue RPC */}
        <ProviderReportIssueSheet
          open={issueSheetOpen}
          onOpenChange={setIssueSheetOpen}
          onSubmit={handleIssueSubmit}
          isPending={reportIssue.isPending || actions.reportIssue.isPending}
        />

        {/* Self-healing actions sheet */}
        <ProviderSelfHealingSheet
          open={selfHealOpen}
          onOpenChange={setSelfHealOpen}
          onSubmit={async ({ actionType, payload }) => {
            if (!visitId) return { decision: "DENIED" as const, reason: "No visit found", customer_notified: false };
            const result = await proposeAction.mutateAsync({
              visitId,  
              actionType,
              payload,
            });
            return {
              decision: result.decision,
              reason: result.reason,
              customer_notified: result.customer_notified,
            };
          }}
          isPending={proposeAction.isPending}
        />
      </div>

      {/* B2-1: Sticky Action Bar — pinned to bottom, always visible */}
      {showStickyBar && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 pb-safe space-y-2">
          {isNotStarted && (
            <Button className="w-full" size="lg" onClick={handleStart} disabled={actions.startJob.isPending}>
              <Play className="h-4 w-4 mr-2" />
              Start Job
            </Button>
          )}
          {isActive && (
            <>
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate(`/provider/jobs/${jobId}/complete`)}
                disabled={!canComplete}
              >
                <Send className="h-4 w-4 mr-2" />
                Complete Job
              </Button>
              {/* P3: Dynamic grid based on button count */}
              <div className={`grid gap-2 ${secondaryButtons.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {secondaryButtons}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
