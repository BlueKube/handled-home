import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Clock, ArrowUpDown, ArrowRight, ChevronRight } from "lucide-react";
import { SELF_HEALING_ACTIONS, type ProviderActionType } from "@/hooks/useProviderSelfHealing";

const ICON_MAP = {
  Clock,
  ArrowUpDown,
  ArrowRight,
} as const;

interface ProviderSelfHealingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: {
    actionType: ProviderActionType;
    payload: Record<string, unknown>;
  }) => Promise<{ decision?: string; reason?: string; customer_notified?: boolean }>;
  isPending?: boolean;
}

export function ProviderSelfHealingSheet({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: ProviderSelfHealingSheetProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [actionType, setActionType] = useState<ProviderActionType | null>(null);
  const [slipMinutes, setSlipMinutes] = useState("15");
  const [result, setResult] = useState<{ decision?: string; reason?: string; customer_notified?: boolean } | null>(null);

  const reset = () => {
    setStep(1);
    setActionType(null);
    setSlipMinutes("15");
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!actionType) return;
    const payload: Record<string, unknown> = {};
    if (actionType === "running_late") {
      payload.slip_minutes = parseInt(slipMinutes, 10) || 15;
    }
    const res = await onSubmit({ actionType, payload });
    setResult(res);
    setStep(3);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Quick Actions
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {step === 1 && (
            <>
              <p className="text-sm text-muted-foreground">What do you need to adjust?</p>
              <div className="space-y-2">
                {SELF_HEALING_ACTIONS.map((a) => {
                  const Icon = ICON_MAP[a.icon as keyof typeof ICON_MAP];
                  return (
                    <button
                      key={a.value}
                      onClick={() => {
                        setActionType(a.value);
                        setStep(2);
                      }}
                      className="w-full text-left p-3.5 rounded-lg border border-border hover:bg-secondary/50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <span className="text-sm font-medium">{a.label}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && actionType && (
            <>
              {actionType === "running_late" && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">How many minutes behind are you?</p>
                  <Input
                    type="number"
                    min={5}
                    max={120}
                    step={5}
                    value={slipMinutes}
                    onChange={(e) => setSlipMinutes(e.target.value)}
                    className="text-center text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    The system will check if this fits within the customer's window and auto-approve or escalate.
                  </p>
                </div>
              )}

              {actionType === "reorder_stops" && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Reorder remaining stops</p>
                  <p className="text-xs text-muted-foreground">
                    The system will approve if no appointment windows are affected. Windowed stops cannot be reordered by providers.
                  </p>
                </div>
              )}

              {actionType === "push_stop" && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Push this stop later</p>
                  <p className="text-xs text-muted-foreground">
                    Only allowed for flexible/unattended stops. Committed appointments and day-commit visits cannot be pushed.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={isPending || (actionType === "running_late" && (!slipMinutes || parseInt(slipMinutes) < 1))}
                  onClick={handleSubmit}
                >
                  {isPending ? "Checking…" : "Submit"}
                </Button>
              </div>
            </>
          )}

          {step === 3 && result && (
            <div className="text-center py-6 space-y-3">
              {result.decision === "approved" ? (
                <>
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
                  <p className="text-base font-semibold">Approved</p>
                </>
              ) : (
                <>
                  <XCircle className="h-12 w-12 text-destructive mx-auto" />
                  <p className="text-base font-semibold">Not Approved</p>
                </>
              )}
              <p className="text-sm text-muted-foreground">{result.reason}</p>
              {result.customer_notified && (
                <p className="text-xs text-primary">Customer has been notified.</p>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
