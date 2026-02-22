import { useParams, useNavigate } from "react-router-dom";
import { useJobDetail } from "@/hooks/useJobDetail";
import { useJobActions } from "@/hooks/useJobActions";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Play, CheckSquare, Camera, Send, AlertTriangle, MapPin, Clock,
  ChevronLeft, Dog, Key, Car, ShieldAlert, LogIn, LogOut
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ProviderJobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useJobDetail(jobId);
  const actions = useJobActions(jobId);

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

  const pets = property?.pets;
  const hasPets = Array.isArray(pets) && pets.length > 0;

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-4">
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

      {/* What to do */}
      <Card className="p-4 space-y-2">
        <h2 className="text-sm font-semibold text-foreground">What to do</h2>
        {skus.length === 0 ? (
          <p className="text-xs text-muted-foreground">No services assigned</p>
        ) : (
          <ul className="space-y-1">
            {skus.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                <span>{s.sku_name_snapshot ?? "Service"}</span>
                {s.duration_minutes_snapshot && (
                  <span className="text-xs text-muted-foreground">({s.duration_minutes_snapshot} min)</span>
                )}
              </li>
            ))}
          </ul>
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

      {/* CTAs */}
      <div className="space-y-2">
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
            <div className="grid grid-cols-2 gap-2">
              {!job.arrived_at && (
                <Button variant="outline" size="sm" onClick={handleArrival} disabled={actions.recordArrival.isPending}>
                  <LogIn className="h-3.5 w-3.5 mr-1.5" />
                  Arrived
                </Button>
              )}
              {job.arrived_at && !job.departed_at && (
                <Button variant="outline" size="sm" onClick={handleDeparture} disabled={actions.recordDeparture.isPending}>
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  Departed
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/provider/jobs/${jobId}/checklist`)}
              >
                <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                Checklist
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/provider/jobs/${jobId}/photos`)}
              >
                <Camera className="h-3.5 w-3.5 mr-1.5" />
                Photos
              </Button>
            </div>
          </>
        )}
        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-warning"
            onClick={() => {
              // Simple inline issue report — navigating to a dialog approach
              const type = prompt("Issue type:\nCOULD_NOT_ACCESS, SAFETY_CONCERN, MISSING_SUPPLIES, EXCESSIVE_SCOPE, CUSTOMER_REQUESTED_CHANGE, WEATHER_RELATED, OTHER");
              if (type) {
                const desc = prompt("Description (optional)") ?? undefined;
                actions.reportIssue.mutateAsync({ issue_type: type, description: desc })
                  .then(() => toast({ title: "Issue reported" }))
                  .catch((e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }));
              }
            }}
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            Report an Issue
          </Button>
        )}
      </div>
    </div>
  );
}
