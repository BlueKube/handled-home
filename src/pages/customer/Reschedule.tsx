import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import {
  useRescheduleHold,
  useConfirmRescheduleHold,
  useRequestReschedule,
  useApplyReschedule,
} from "@/hooks/useCustomerReschedule";
import {
  useAppointmentWindows,
  type OfferedWindow,
} from "@/hooks/useAppointmentWindows";
import { AppointmentWindowPicker } from "@/components/customer/AppointmentWindowPicker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ChevronLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { format, parseISO } from "date-fns";

import { formatTime12 } from "@/lib/formatTime12";

/**
 * Customer Reschedule Page
 * Route: /customer/reschedule/:visitId
 *
 * Two modes:
 * 1. Access failure hold — auto-held slot to confirm or choose another
 * 2. Customer-initiated — request reschedule and pick from feasible options
 */
export default function CustomerReschedule() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const { data: subscription } = useCustomerSubscription();
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<"reason" | "picking" | "done">("reason");

  // Load visit metadata
  const { data: visitMeta, isLoading: metaLoading } = useQuery({
    queryKey: ["visit_meta_reschedule", visitId],
    enabled: !!visitId,
    queryFn: async () => {
      if (!visitId) return null;
      const { data: visit, error } = await supabase
        .from("visits")
        .select("id, property_id, scheduled_date, scheduling_profile, schedule_state")
        .eq("id", visitId)
        .single();
      if (error) throw error;
      if (!visit) return null;

      const { data: tasks } = await supabase
        .from("visit_tasks")
        .select("sku_id, duration_estimate_minutes, service_skus(name, category_key)")
        .eq("visit_id", visitId);

      const taskArr = (tasks ?? []) as any[];
      const category_key = taskArr[0]?.service_skus?.category_key ?? "lawn_care";
      const totalDuration = taskArr.reduce((sum: number, t: any) => sum + (t.duration_estimate_minutes ?? 0), 0);
      const taskSummary = taskArr.map((t: any) => t.service_skus?.name ?? "Service").join(", ");

      return {
        visit_id: visit.id,
        property_id: visit.property_id,
        scheduled_date: visit.scheduled_date,
        schedule_state: visit.schedule_state,
        scheduling_profile: visit.scheduling_profile,
        category_key,
        total_duration: totalDuration || 60,
        task_summary: taskSummary || "Home service",
      };
    },
  });

  // Check for existing active hold (access failure auto-hold)
  const { data: hold, isLoading: holdLoading } = useRescheduleHold(visitId);
  const confirmHold = useConfirmRescheduleHold();
  const requestReschedule = useRequestReschedule();
  const applyReschedule = useApplyReschedule();

  const zone_id = subscription?.zone_id ?? null;
  const isAccessFailure = !!hold;

  // Fetch feasible windows when in "picking" mode or has hold and wants alternatives
  const [showAlternatives, setShowAlternatives] = useState(false);
  const shouldFetchWindows = step === "picking" || showAlternatives;

  const windowParams = shouldFetchWindows && visitMeta && zone_id
    ? {
        zone_id,
        category_key: visitMeta.category_key,
        property_id: visitMeta.property_id,
        service_duration_minutes: visitMeta.total_duration,
      }
    : null;

  const { data: windowData, isLoading: windowsLoading } = useAppointmentWindows(windowParams);

  // Auto-advance to picking if no hold and reason submitted
  const handleRequestReschedule = async () => {
    if (!visitId) return;
    try {
      await requestReschedule.mutateAsync({ visitId, reason: reason.trim() || undefined });
      setStep("picking");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to request reschedule");
    }
  };

  // Confirm the auto-held slot
  const handleConfirmHold = async () => {
    if (!hold) return;
    try {
      await confirmHold.mutateAsync({ holdId: hold.id, action: "confirm" });
      toast.success("Visit rescheduled — we'll confirm shortly.");
      setStep("done");
    } catch (e: any) {
      toast.error(e.message ?? "Couldn't confirm");
    }
  };

  // Pick an alternative window
  const handleSelectWindow = async (window: OfferedWindow) => {
    if (!visitId) return;

    // If we had a hold, release it first
    if (hold) {
      try {
        await confirmHold.mutateAsync({ holdId: hold.id, action: "release" });
      } catch {
        // Continue anyway — hold may already be expired
      }
    }

    try {
      await applyReschedule.mutateAsync({
        visitId,
        newDate: window.date,
        newWindowStart: window.window_start,
        newWindowEnd: window.window_end,
      });
      toast.success("Visit rescheduled successfully.");
      setStep("done");
    } catch (e: any) {
      toast.error(e.message ?? "Couldn't reschedule");
    }
  };

  // --- Loading states ---
  if (metaLoading || holdLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  if (!visitMeta) {
    return (
      <div className="p-4 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Visit not found.</p>
        <Button variant="link" onClick={() => navigate("/customer/upcoming")}>
          ← Back to upcoming
        </Button>
      </div>
    );
  }

  // --- Done state ---
  if (step === "done") {
    return (
      <div className="p-4 space-y-5 text-center">
        <CheckCircle2 className="h-14 w-14 text-success mx-auto" />
        <h1 className="text-h2">Visit Rescheduled</h1>
        <p className="text-sm text-muted-foreground">
          We've updated your schedule. You'll get a confirmation notification.
        </p>
        <Button onClick={() => navigate("/customer/upcoming")}>Back to Upcoming</Button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-5 animate-fade-in">
      {/* Header */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 -ml-2"
        onClick={() => navigate("/customer/upcoming")}
      >
        <ChevronLeft className="h-4 w-4" />
        Upcoming
      </Button>

      <div>
        <h1 className="text-h2">Reschedule Visit</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{visitMeta.task_summary}</p>
        <p className="text-xs text-muted-foreground mt-1">
          <CalendarDays className="inline h-3 w-3 mr-1" />
          Originally {visitMeta.scheduled_date ? format(parseISO(visitMeta.scheduled_date), "EEE, MMM d") : "—"}
        </p>
      </div>

      {/* Access Failure Hold */}
      {isAccessFailure && !showAlternatives && (
        <Card className="p-5 space-y-4 border-warning/30 bg-warning/5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">We couldn't access your home</p>
              <p className="text-xs text-muted-foreground mt-1">
                We've reserved the next available time for you:
              </p>
            </div>
          </div>

          {/* Reserved slot display */}
          <Card className="p-4 border-accent/30 bg-accent/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {hold.held_date ? format(parseISO(hold.held_date), "EEE, MMM d") : "Next available"}
                </p>
                {hold.held_window_start && hold.held_window_end && (
                  <p className="text-xs text-muted-foreground">
                    {formatTime12(hold.held_window_start)} – {formatTime12(hold.held_window_end)}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <p className="text-xs text-muted-foreground">
            This reservation expires {hold.expires_at ? format(parseISO(hold.expires_at), "MMM d 'at' h:mma") : "soon"}.
          </p>

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={handleConfirmHold}
              disabled={confirmHold.isPending}
            >
              {confirmHold.isPending ? "Confirming…" : "Confirm This Time"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAlternatives(true)}
            >
              Choose Another Time
            </Button>
          </div>
        </Card>
      )}

      {/* Alternative window picker (for access failure hold release or customer reschedule) */}
      {(showAlternatives || step === "picking") && (
        <AppointmentWindowPicker
          windows={windowData?.windows ?? []}
          isLoading={windowsLoading}
          onSelect={handleSelectWindow}
          isConfirming={applyReschedule.isPending || confirmHold.isPending}
        />
      )}

      {/* Customer-initiated reschedule reason (only if no hold) */}
      {!isAccessFailure && step === "reason" && (
        <Card className="p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold">Why do you need to reschedule?</p>
            <p className="text-xs text-muted-foreground mt-1">Optional — helps us improve.</p>
          </div>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 300))}
            placeholder="e.g., I won't be home, schedule conflict…"
            rows={3}
            className="resize-none"
          />
          <Button
            className="w-full"
            onClick={handleRequestReschedule}
            disabled={requestReschedule.isPending}
          >
            {requestReschedule.isPending ? "Requesting…" : "See Available Times"}
          </Button>
        </Card>
      )}

      <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
        Inside the 7-day window, reschedules are limited to protect your service quality.
      </p>
    </div>
  );
}
