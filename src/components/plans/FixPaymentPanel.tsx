import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, CheckCircle, Circle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useDunningEventsCustomer, computeDunningTimeline } from "@/hooks/useDunningEvents";
import { format } from "date-fns";

interface FixPaymentPanelProps {
  subscriptionId: string;
}

export function FixPaymentPanel({ subscriptionId }: FixPaymentPanelProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const dunningEvents = useDunningEventsCustomer();

  const handleFixPayment = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: { subscription_id: subscriptionId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Could not open payment portal");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Compute timeline from first dunning event
  const events = dunningEvents.data ?? [];
  const firstEvent = events.length > 0 ? events[events.length - 1] : null;
  const failureDate = firstEvent ? new Date(firstEvent.created_at) : new Date();
  const timeline = computeDunningTimeline(failureDate);
  const latestEvent = events[0];
  const failureReason = latestEvent?.explain_customer;

  // Grace period: 14 days from failure
  const daysSinceFailure = Math.floor((Date.now() - failureDate.getTime()) / (1000 * 60 * 60 * 24));
  const graceDaysRemaining = Math.max(0, 14 - daysSinceFailure);
  const graceProgress = Math.min((daysSinceFailure / 14) * 100, 100);
  const isSuspended = daysSinceFailure >= 14;

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Payment issue</p>
            <p className="text-xs text-muted-foreground">
              {failureReason || "Your last payment failed. Update your payment method to keep your subscription active."}
            </p>
          </div>
        </div>

        {/* Retry timeline */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Retry schedule</p>
          {timeline.filter((t) => t.step.startsWith("retry_")).map((t) => {
            const Icon = t.isPast ? CheckCircle : Circle;
            return (
              <div key={t.step} className="flex items-center gap-2">
                <Icon className={`h-3.5 w-3.5 shrink-0 ${t.isPast ? "text-muted-foreground" : "text-foreground"}`} />
                <span className={`text-xs ${t.isPast ? "text-muted-foreground" : "text-foreground"}`}>
                  {t.label} — {format(t.date, "MMM d")}
                </span>
              </div>
            );
          })}
        </div>

        {/* Grace period countdown */}
        {!isSuspended && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Grace period: {graceDaysRemaining} day{graceDaysRemaining !== 1 ? "s" : ""} remaining
            </p>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-warning transition-all"
                style={{ width: `${graceProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Suspension warning */}
        {isSuspended && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-2">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">
              Service suspended — update your payment method to restore service.
            </p>
          </div>
        )}

        {/* Fix Payment button */}
        <Button variant="destructive" size="sm" className="w-full min-h-[44px]" onClick={handleFixPayment} disabled={loading}>
          {loading ? "Opening…" : "Fix Payment"}
        </Button>
      </CardContent>
    </Card>
  );
}
