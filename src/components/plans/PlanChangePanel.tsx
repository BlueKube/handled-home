import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, ArrowRight, X, Calendar } from "lucide-react";
import { usePlanDetail, usePlans } from "@/hooks/usePlans";
import { useSchedulePlanChange, useCancelPendingPlanChange } from "@/hooks/usePlanSelfService";
import { Subscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { format } from "date-fns";

interface PlanChangePanelProps {
  subscription: Subscription;
}

export function PlanChangePanel({ subscription }: PlanChangePanelProps) {
  const { data: allPlans } = usePlans("active");
  const { data: currentPlan } = usePlanDetail(subscription.plan_id);
  const { data: pendingPlan } = usePlanDetail(subscription.pending_plan_id ?? null);
  const schedulePlanChange = useSchedulePlanChange();
  const cancelPending = useCancelPendingPlanChange();
  const [selectedPlanId, setSelectedPlanId] = useState("");

  const availablePlans = allPlans?.filter((p) => p.id !== subscription.plan_id) ?? [];
  const selectedPlan = allPlans?.find((p) => p.id === selectedPlanId);

  const getDirection = () => {
    if (!selectedPlan || !currentPlan) return null;
    if (selectedPlan.recommended_rank > currentPlan.recommended_rank) return "upgrade";
    if (selectedPlan.recommended_rank < currentPlan.recommended_rank) return "downgrade";
    return "lateral";
  };

  const direction = getDirection();

  const handleSchedule = async () => {
    if (!selectedPlanId) return;
    try {
      const result = await schedulePlanChange.mutateAsync({
        subscriptionId: subscription.id,
        newPlanId: selectedPlanId,
      });
      toast.success(`${result.direction === "upgrade" ? "Upgrade" : "Plan change"} scheduled for ${format(new Date(result.effective_at), "MMM d, yyyy")}`);
      setSelectedPlanId("");
    } catch (e: any) {
      toast.error(e.message || "Could not schedule plan change.");
    }
  };

  const handleCancelPending = async () => {
    try {
      await cancelPending.mutateAsync(subscription.id);
      toast.success("Pending plan change canceled.");
    } catch (e: any) {
      toast.error(e.message || "Could not cancel pending change.");
    }
  };

  // Show pending change banner
  if (subscription.pending_plan_id) {
    return (
      <Card className="border-accent/40 bg-accent/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent" />
            Pending Plan Change
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Switching to <span className="font-semibold text-foreground">{pendingPlan?.name ?? "..."}</span>{" "}
            on {subscription.pending_effective_at ? format(new Date(subscription.pending_effective_at), "MMM d, yyyy") : "next cycle"}.
          </p>
          <p className="text-xs text-muted-foreground">Your credits balance will carry over.</p>
          <Button variant="outline" size="sm" onClick={handleCancelPending} disabled={cancelPending.isPending}>
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel Change
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Change Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Changes take effect at the start of your next billing cycle. Credits carry over.
        </p>

        <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a new plan" />
          </SelectTrigger>
          <SelectContent>
            {availablePlans.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} — {p.display_price_text ?? ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedPlan && direction && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
            {direction === "upgrade" ? (
              <Badge variant="default" className="bg-success text-success-foreground gap-1">
                <ArrowUp className="h-3 w-3" /> Upgrade
              </Badge>
            ) : direction === "downgrade" ? (
              <Badge variant="secondary" className="gap-1">
                <ArrowDown className="h-3 w-3" /> Downgrade
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <ArrowRight className="h-3 w-3" /> Lateral
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {currentPlan?.name} → {selectedPlan.name}
            </span>
          </div>
        )}

        {selectedPlanId && (
          <Button
            size="sm"
            disabled={schedulePlanChange.isPending}
            onClick={handleSchedule}
          >
            {schedulePlanChange.isPending ? "Scheduling…" : "Confirm Change"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
