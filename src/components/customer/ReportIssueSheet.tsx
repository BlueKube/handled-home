import { useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, CheckCircle2, AlertTriangle } from "lucide-react";
import { useSubmitCustomerIssue } from "@/hooks/useCustomerIssues";
import { toast } from "@/hooks/use-toast";

interface ReportIssueSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  visitDate?: string | null;
}

const REASONS = [
  { value: "missed_something", label: "Missed something" },
  { value: "damage_concern", label: "Damage concern" },
  { value: "not_satisfied", label: "Not satisfied" },
  { value: "other", label: "Other" },
];

export function ReportIssueSheet({ open, onOpenChange, jobId, visitDate }: ReportIssueSheetProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const submitMutation = useSubmitCustomerIssue();

  const isOldVisit = visitDate
    ? (Date.now() - new Date(visitDate).getTime()) > 14 * 24 * 60 * 60 * 1000
    : false;
  const daysAgo = visitDate
    ? Math.floor((Date.now() - new Date(visitDate).getTime()) / (24 * 60 * 60 * 1000))
    : 0;

  const requiresPhoto = reason === "damage_concern";

  const reset = () => {
    setStep(1);
    setReason("");
    setNote("");
    setPhoto(null);
  };

  const handleSubmit = async () => {
    if (!reason || !note.trim()) return;
    if (requiresPhoto && !photo) {
      toast({ title: "Photo required", description: "A photo is required for damage concerns.", variant: "destructive" });
      return;
    }
    try {
      await submitMutation.mutateAsync({
        jobId,
        reason,
        note: note.trim(),
        photo: photo ?? undefined,
      });
      setStep(3);
    } catch (err: any) {
      if (err.message?.includes("duplicate key")) {
        toast({ title: "Already reported", description: "You've already reported a concern for this visit.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <SheetContent side="bottom" className="max-h-[85vh]">
        <SheetHeader>
          <SheetTitle>Report a problem</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Step 1: Choose reason */}
          {step === 1 && (
            <>
              {isOldVisit && (
                <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg text-sm">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">This visit was {daysAgo} days ago. We'll do our best to help.</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">What went wrong?</p>
              <div className="space-y-2">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => { setReason(r.value); setStep(2); }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      reason === r.value ? "border-accent bg-accent/5" : "border-border hover:bg-secondary/50"
                    }`}
                  >
                    <span className="text-sm font-medium">{r.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <>
              <p className="text-sm text-muted-foreground">Tell us more</p>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                placeholder="Describe what happened…"
                rows={4}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{note.length}/500</span>
                {requiresPhoto && !photo && <span className="text-destructive">Photo required</span>}
              </div>

              {/* Photo upload */}
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                />
                {photo ? (
                  <div className="flex items-center gap-2 p-2 bg-success/10 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-sm truncate flex-1">{photo.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => setPhoto(null)}>Remove</Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {requiresPhoto ? "Add photo (required)" : "Add photo (recommended)"}
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button
                  className="flex-1"
                  disabled={!note.trim() || (requiresPhoto && !photo) || submitMutation.isPending}
                  onClick={handleSubmit}
                >
                  {submitMutation.isPending ? "Submitting…" : "Submit"}
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
              <p className="text-base font-semibold">Thanks — support will review and follow up.</p>
              <p className="text-sm text-muted-foreground">We'll update you when this is resolved.</p>
              <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Done</Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
