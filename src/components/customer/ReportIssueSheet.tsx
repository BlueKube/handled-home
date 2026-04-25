import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertTriangle,
  Wrench,
  AlertOctagon,
  SkipForward,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import {
  useSubmitCustomerIssue,
  type VisitIssueCategory,
} from "@/hooks/useCustomerIssues";
import { toast } from "@/hooks/use-toast";
import { ReportIssueDetailsStep } from "./ReportIssueDetailsStep";

interface ReportIssueSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  visitDate?: string | null;
}

interface CategoryCopy {
  value: VisitIssueCategory;
  label: string;
  blurb: string;
  icon: React.ComponentType<{ className?: string }>;
  photoMode: "required" | "optional" | "hidden";
  placeholder: string;
  privateToHandled?: boolean; // feedback-only micro-flow
}

// Record-keyed so TypeScript enforces exhaustiveness — adding a variant to
// VisitIssueCategory without a copy entry here becomes a compile error.
const CATEGORY_COPY: Record<VisitIssueCategory, CategoryCopy> = {
  fix_didnt_hold: {
    value: "fix_didnt_hold",
    label: "Fix didn't hold",
    blurb: "Something we fixed came back. We'll fix it again — credits come back if we can't.",
    icon: Wrench,
    photoMode: "optional",
    placeholder: "Which fix stopped working? (a photo helps but isn't required)",
  },
  damage: {
    value: "damage",
    label: "Damage",
    blurb: "Anything that got damaged during the visit. A photo is required so we can move quickly.",
    icon: AlertOctagon,
    photoMode: "required",
    placeholder: "What got damaged, and where on your property?",
  },
  task_skipped: {
    value: "task_skipped",
    label: "Task skipped",
    blurb: "A task on your list didn't get done. We'll make it right and the credits come back if we can't.",
    icon: SkipForward,
    photoMode: "optional",
    placeholder: "Which task was skipped?",
  },
  feedback: {
    value: "feedback",
    label: "Feedback",
    blurb: "For the Handled team — not your provider. Every note gets read.",
    icon: MessageSquare,
    photoMode: "hidden",
    placeholder: "Tell us anything. Praise, frustration, a specific suggestion.",
    privateToHandled: true,
  },
};

// Iteration order for the picker. Declared separately from the Record so the
// visual sequence is explicit and easy to reorder without touching copy.
const CATEGORY_ORDER: readonly VisitIssueCategory[] = [
  "fix_didnt_hold",
  "damage",
  "task_skipped",
  "feedback",
];

export function ReportIssueSheet({
  open,
  onOpenChange,
  jobId,
  visitDate,
}: ReportIssueSheetProps) {
  const [step, setStep] = useState<"picker" | "details" | "confirm">("picker");
  const [category, setCategory] = useState<VisitIssueCategory | null>(null);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const submitMutation = useSubmitCustomerIssue();

  const isOldVisit = visitDate
    ? Date.now() - new Date(visitDate).getTime() > 14 * 24 * 60 * 60 * 1000
    : false;
  const daysAgo = visitDate
    ? Math.floor((Date.now() - new Date(visitDate).getTime()) / (24 * 60 * 60 * 1000))
    : 0;

  const selected = category ? CATEGORY_COPY[category] : null;
  const photoRequired = selected?.photoMode === "required";
  const photoAllowed = selected?.photoMode !== "hidden";

  const reset = () => {
    setStep("picker");
    setCategory(null);
    setNote("");
    setPhoto(null);
  };

  const selectCategory = (cat: VisitIssueCategory) => {
    setCategory(cat);
    setStep("details");
  };

  const handleSubmit = async () => {
    if (!category || !note.trim()) return;
    if (photoRequired && !photo) {
      toast({
        title: "Photo required",
        description: "Damage reports need a photo so we can triage quickly.",
        variant: "destructive",
      });
      return;
    }
    try {
      await submitMutation.mutateAsync({
        jobId,
        category,
        note: note.trim(),
        photo: photoAllowed ? (photo ?? undefined) : undefined,
      });
      setStep("confirm");
    } catch (err: any) {
      if (err.message?.includes("duplicate key")) {
        toast({
          title: "Already reported",
          description: "You've already reported a concern for this visit.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Couldn't submit",
          description: err.message ?? "Please try again.",
          variant: "destructive",
        });
      }
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
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {step === "picker" && "Report a problem"}
            {step === "details" && selected?.label}
            {step === "confirm" && "Thanks — we're on it"}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {step === "picker" && (
            <>
              {isOldVisit && (
                <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg text-sm">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    This visit was {daysAgo} days ago. We'll do our best to help.
                  </p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Pick the closest match. Each category routes to the right team.
              </p>
              <div className="space-y-2">
                {CATEGORY_ORDER.map((key) => {
                  const c = CATEGORY_COPY[key];
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => selectCategory(c.value)}
                      className="w-full text-left p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors flex items-start gap-3 min-h-[64px]"
                    >
                      <div className="rounded-full bg-primary/10 p-2 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{c.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.blurb}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Our promise — in-picker so users see the guarantee before choosing */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-success/10 text-sm">
                <ShieldCheck className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Our promise</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    If we can't fix it, the credits come back to your balance. No forms, no haggling.
                  </p>
                </div>
              </div>
            </>
          )}

          {step === "details" && selected && (
            <ReportIssueDetailsStep
              copy={{
                label: selected.label,
                blurb: selected.blurb,
                placeholder: selected.placeholder,
                photoMode: selected.photoMode,
                privateToHandled: selected.privateToHandled,
              }}
              note={note}
              onNoteChange={setNote}
              photo={photo}
              onPhotoChange={setPhoto}
              onBack={reset}
              onSubmit={handleSubmit}
              submitting={submitMutation.isPending}
            />
          )}

          {step === "confirm" && (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
              <p className="text-base font-semibold">
                Thanks — support will review and follow up.
              </p>
              <p className="text-sm text-muted-foreground">
                We'll update you as soon as this is resolved.
              </p>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-success/10 text-left text-sm">
                <ShieldCheck className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  If we can't fix it, the credits come back to your balance.
                </p>
              </div>
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
