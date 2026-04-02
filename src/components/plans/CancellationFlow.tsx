import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Gift, HeartCrack } from "lucide-react";
import { useCancelWithReason } from "@/hooks/usePlanSelfService";
import { Subscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { format } from "date-fns";

interface CancellationFlowProps {
  subscription: Subscription;
}

const CANCEL_REASONS = [
  { value: "too_expensive", label: "Too expensive" },
  { value: "not_using", label: "Not using the service enough" },
  { value: "quality", label: "Unhappy with service quality" },
  { value: "moving", label: "Moving to a new area" },
  { value: "seasonal", label: "Only need seasonal service" },
  { value: "other", label: "Other" },
];

export function CancellationFlow({ subscription }: CancellationFlowProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<"reason" | "offer" | "confirm">("reason");
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const cancelWithReason = useCancelWithReason();

  const handleAcceptOffer = async () => {
    try {
      const result = await cancelWithReason.mutateAsync({
        subscriptionId: subscription.id,
        reason,
        feedback: feedback || undefined,
        acceptRetentionOffer: true,
      });
      toast.success(`Welcome back! ${result.bonus_handles} bonus handles added.`);
      setDialogOpen(false);
      resetState();
    } catch (e: any) {
      toast.error(e.message || "Something went wrong.");
    }
  };

  const handleConfirmCancel = async () => {
    try {
      const result = await cancelWithReason.mutateAsync({
        subscriptionId: subscription.id,
        reason,
        feedback: feedback || undefined,
        acceptRetentionOffer: false,
      });
      toast.success(`Subscription will end on ${result.effective_at ? format(new Date(result.effective_at), "MMM d") : "end of cycle"}.`);
      setDialogOpen(false);
      resetState();
    } catch (e: any) {
      toast.error(e.message || "Could not cancel subscription.");
    }
  };

  const resetState = () => {
    setStep("reason");
    setReason("");
    setFeedback("");
  };

  if (subscription.cancel_at_period_end || subscription.status === "canceled") {
    return null;
  }

  return (
    <AlertDialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetState(); }}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/5">
          Cancel Subscription
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        {step === "reason" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <HeartCrack className="h-5 w-5 text-destructive" />
                We're sorry to see you go
              </AlertDialogTitle>
              <AlertDialogDescription>
                Help us improve — why are you canceling?
              </AlertDialogDescription>
            </AlertDialogHeader>

            <RadioGroup value={reason} onValueChange={setReason} className="space-y-2 my-4">
              {CANCEL_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="text-sm cursor-pointer">{r.label}</Label>
                </div>
              ))}
            </RadioGroup>

            <Textarea
              placeholder="Any additional feedback? (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="text-sm"
              rows={2}
            />

            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={!reason}
                onClick={() => {
                  if (reason === "moving") {
                    setDialogOpen(false);
                    navigate("/customer/moving");
                    return;
                  }
                  setStep("offer");
                }}
              >
                {reason === "moving" ? "Start Moving Wizard" : "Continue"}
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {step === "offer" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-accent" />
                Before you go — a gift
              </AlertDialogTitle>
              <AlertDialogDescription>
                We'd love to keep you! How about <span className="font-semibold text-foreground">5 bonus handles</span> on us?
              </AlertDialogDescription>
            </AlertDialogHeader>

            <Card className="border-accent/40 bg-accent/5 my-4">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm font-medium">Stay and get 5 free handles</p>
                <p className="text-xs text-muted-foreground mt-1">
                  That's extra services at no additional cost. Your subscription continues as-is.
                </p>
              </CardContent>
            </Card>

            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setStep("confirm")}>
                No thanks, continue canceling
              </Button>
              <Button onClick={handleAcceptOffer} disabled={cancelWithReason.isPending}>
                {cancelWithReason.isPending ? "Adding handles…" : "Stay & Get 5 Handles"}
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {step === "confirm" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Cancellation</AlertDialogTitle>
              <AlertDialogDescription>
                Your subscription will remain active until{" "}
                {subscription.billing_cycle_end_at
                  ? format(new Date(subscription.billing_cycle_end_at), "MMMM d, yyyy")
                  : "the end of your billing period"}
                . You can resubscribe anytime.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmCancel}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={cancelWithReason.isPending}
              >
                {cancelWithReason.isPending ? "Canceling…" : "Yes, Cancel"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
