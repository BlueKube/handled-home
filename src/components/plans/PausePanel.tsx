import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pause, Play } from "lucide-react";
import { usePauseSubscription, useResumeSubscription } from "@/hooks/usePlanSelfService";
import { Subscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { format } from "date-fns";

interface PausePanelProps {
  subscription: Subscription;
}

export function PausePanel({ subscription }: PausePanelProps) {
  const [weeks, setWeeks] = useState("");
  const pauseSub = usePauseSubscription();
  const resumeSub = useResumeSubscription();

  const isPaused = subscription.paused_at != null;
  const resumeAt = subscription.resume_at;
  const pauseWeeks = subscription.pause_weeks;

  const handlePause = async () => {
    if (!weeks) return;
    try {
      const result = await pauseSub.mutateAsync({
        subscriptionId: subscription.id,
        weeks: parseInt(weeks),
      });
      toast.success(`Subscription paused until ${format(new Date(result.resume_at), "MMM d, yyyy")}`);
      setWeeks("");
    } catch (e: any) {
      toast.error(e.message || "Could not pause subscription.");
    }
  };

  const handleResume = async () => {
    try {
      await resumeSub.mutateAsync(subscription.id);
      toast.success("Subscription resumed!");
    } catch (e: any) {
      toast.error(e.message || "Could not resume subscription.");
    }
  };

  if (isPaused) {
    return (
      <Card className="border-warning/40 bg-warning/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Pause className="h-4 w-4 text-warning" />
            Subscription Paused
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Paused for {pauseWeeks} week{pauseWeeks !== 1 ? "s" : ""}.
            {resumeAt && (
              <> Auto-resumes <span className="font-medium text-foreground">{format(new Date(resumeAt), "MMM d, yyyy")}</span>.</>
            )}
          </p>
          <p className="text-xs text-muted-foreground">Your handles balance is frozen — no services will be scheduled.</p>
          <Button size="sm" onClick={handleResume} disabled={resumeSub.isPending}>
            <Play className="h-3.5 w-3.5 mr-1" />
            {resumeSub.isPending ? "Resuming…" : "Resume Now"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Don't show pause if canceling or not active
  if (subscription.cancel_at_period_end || !["active", "trialing"].includes(subscription.status)) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Pause className="h-4 w-4 text-muted-foreground" />
          Pause Subscription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Need a break? Pause for 1–4 weeks. Jobs are skipped and handles are frozen.
        </p>

        <Select value={weeks} onValueChange={setWeeks}>
          <SelectTrigger>
            <SelectValue placeholder="How long?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 week</SelectItem>
            <SelectItem value="2">2 weeks</SelectItem>
            <SelectItem value="3">3 weeks</SelectItem>
            <SelectItem value="4">4 weeks</SelectItem>
          </SelectContent>
        </Select>

        {weeks && (
          <Button variant="secondary" size="sm" onClick={handlePause} disabled={pauseSub.isPending}>
            {pauseSub.isPending ? "Pausing…" : `Pause for ${weeks} week${weeks !== "1" ? "s" : ""}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
