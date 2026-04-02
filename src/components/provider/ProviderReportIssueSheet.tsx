import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";
import {
  PROVIDER_ISSUE_TYPES,
  getReasonCodesForType,
  type ProviderIssueType,
} from "@/hooks/useProviderIssueReport";

interface ProviderReportIssueSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: {
    issueType: ProviderIssueType;
    reasonCode: string;
    note?: string;
  }) => Promise<void>;
  isPending?: boolean;
}

/**
 * Provider issue reporting sheet — wired to report_provider_issue RPC.
 * Step 1: Pick issue type
 * Step 2: Pick reason code + optional note
 * Step 3: Confirmation
 */
export function ProviderReportIssueSheet({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: ProviderReportIssueSheetProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [issueType, setIssueType] = useState<ProviderIssueType | null>(null);
  const [reasonCode, setReasonCode] = useState("");
  const [note, setNote] = useState("");

  const reasonCodes = issueType ? getReasonCodesForType(issueType) : [];

  const reset = () => {
    setStep(1);
    setIssueType(null);
    setReasonCode("");
    setNote("");
    setSubmitFailed(false);
  };

  const [submitFailed, setSubmitFailed] = useState(false);

  const handleSubmit = async () => {
    if (!issueType || !reasonCode) return;
    try {
      setSubmitFailed(false);
      await onSubmit({
        issueType,
        reasonCode,
        note: note.trim() || undefined,
      });
      setStep(3);
    } catch {
      setSubmitFailed(true);
    }
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
            <AlertTriangle className="h-4 w-4 text-warning" />
            Report an Issue
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Step 1: Issue type */}
          {step === 1 && (
            <>
              <p className="text-sm text-muted-foreground">What's happening?</p>
              <div className="space-y-2">
                {PROVIDER_ISSUE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => {
                      setIssueType(t.value);
                      setStep(2);
                    }}
                    className="w-full text-left p-3.5 rounded-lg border border-border hover:bg-secondary/50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="text-sm font-medium">{t.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 2: Reason code + note */}
          {step === 2 && issueType && (
            <>
              <p className="text-sm text-muted-foreground">Select a reason</p>
              <div className="space-y-2">
                {reasonCodes.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReasonCode(r.value)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      reasonCode === r.value
                        ? "border-accent bg-accent/5"
                        : "border-border hover:bg-secondary/50"
                    }`}
                  >
                    <span className="text-sm font-medium">{r.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Additional notes (optional)</label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 500))}
                  placeholder="Anything else we should know…"
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">{note.length}/500</p>
              </div>

              {issueType === "access_failure" && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                  <strong>Note:</strong> The customer will be notified and a reschedule hold will be created automatically.
                  Access failures won't affect your reliability score.
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setStep(1); setReasonCode(""); }}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!reasonCode || isPending}
                  onClick={handleSubmit}
                >
                  {isPending ? "Submitting…" : "Submit"}
                </Button>
              </div>
              {submitFailed && (
                <p className="text-xs text-destructive text-center mt-2">
                  Couldn't submit — please try again.
                </p>
              )}
            </>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
              <p className="text-base font-semibold">Issue reported</p>
              <p className="text-sm text-muted-foreground">
                {issueType === "access_failure"
                  ? "The customer has been notified and a reschedule is in progress."
                  : "Ops has been notified and will follow up."}
              </p>
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
