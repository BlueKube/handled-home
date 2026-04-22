import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  CheckCircle2,
  Bath,
  ChefHat,
  Trees,
  Home,
  HelpCircle,
  Zap,
  CalendarDays,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  useCreateSnapDraft,
  cleanupSnapDraft,
  type SnapArea,
  type SnapDraft,
} from "@/hooks/useCreateSnapDraft";
import { useClassifySnap, type SnapClassification } from "@/hooks/useClassifySnap";
import { useFinalizeSnap, type SnapRouting } from "@/hooks/useFinalizeSnap";
import { useRouteSnap, RouteSnapError } from "@/hooks/useRouteSnap";
import { useCancelSnap } from "@/hooks/useCancelSnap";

interface SnapSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Fallback credit holds when AI classification isn't available.
const FALLBACK_HOLD: Record<SnapRouting, number> = {
  next_visit: 120,
  ad_hoc: 200,
};

// Multiplier applied to AI-suggested credits so the hold covers unexpected
// scope (refund is issued if actual < held).
const AD_HOC_PREMIUM = 1.2;

const AREAS: { value: SnapArea; label: string; Icon: React.ElementType }[] = [
  { value: "bath", label: "Bath", Icon: Bath },
  { value: "kitchen", label: "Kitchen", Icon: ChefHat },
  { value: "yard", label: "Yard", Icon: Trees },
  { value: "exterior", label: "Exterior", Icon: Home },
  { value: "other", label: "Other", Icon: HelpCircle },
];

function routingHoldAmount(
  routing: SnapRouting,
  classification: SnapClassification | null,
): number {
  if (!classification) return FALLBACK_HOLD[routing];
  const base = classification.suggested_credits;
  return routing === "ad_hoc" ? Math.round(base * AD_HOC_PREMIUM) : base;
}

export function SnapSheet({ open, onOpenChange }: SnapSheetProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [area, setArea] = useState<SnapArea | null>(null);
  const [routing, setRouting] = useState<SnapRouting | null>(null);
  const [draft, setDraft] = useState<SnapDraft | null>(null);
  const [classification, setClassification] = useState<SnapClassification | null>(null);
  const [classifyFailed, setClassifyFailed] = useState(false);
  const [finalized, setFinalized] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const createDraft = useCreateSnapDraft();
  const classify = useClassifySnap();
  const finalize = useFinalizeSnap();
  const routeSnap = useRouteSnap();
  const cancelSnap = useCancelSnap();
  // Monotonically increasing generation counter — any classify result for a
  // generation older than the current one is stale and must be ignored. Used
  // to defeat the Back→Continue race Lane 2/4 flagged.
  const classifyGenRef = useRef(0);
  const classifyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Clear any pending classify-timeout when the sheet unmounts.
  useEffect(() => {
    return () => {
      if (classifyTimeoutRef.current !== null) {
        window.clearTimeout(classifyTimeoutRef.current);
        classifyTimeoutRef.current = null;
      }
    };
  }, []);

  const reset = () => {
    setStep(1);
    setPhoto(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setDescription("");
    setArea(null);
    setRouting(null);
    setDraft(null);
    setClassification(null);
    setClassifyFailed(false);
    setFinalized(false);
  };

  const handleClose = () => {
    // If the sheet closes with a draft that never got finalized, clean up the
    // orphan row + uploaded photo. Fire-and-forget — errors are logged inside.
    if (draft && !finalized) {
      void cleanupSnapDraft(draft);
    }
    reset();
  };

  const handlePhotoSelected = (file: File) => {
    setPhoto(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setStep(2);
  };

  const kickOffClassify = (snapId: string) => {
    const gen = ++classifyGenRef.current;
    setClassification(null);
    setClassifyFailed(false);

    // 5s client-side timeout (spec acceptance #4). If classify hasn't
    // resolved by then, fall back to the placeholder card. Server-side
    // call keeps running; its eventual result is ignored via the
    // generation check.
    if (classifyTimeoutRef.current !== null) {
      window.clearTimeout(classifyTimeoutRef.current);
    }
    classifyTimeoutRef.current = window.setTimeout(() => {
      if (gen === classifyGenRef.current) setClassifyFailed(true);
      classifyTimeoutRef.current = null;
    }, 5000);

    const clearTimer = () => {
      if (classifyTimeoutRef.current !== null) {
        window.clearTimeout(classifyTimeoutRef.current);
        classifyTimeoutRef.current = null;
      }
    };

    void classify
      .mutateAsync({ snapId })
      .then((res) => {
        if (gen !== classifyGenRef.current) return; // stale — user went Back/Continue
        clearTimer(); // cancel the 5s fallback now that we have a real answer
        setClassification(res);
        setClassifyFailed(false);
      })
      .catch(() => {
        if (gen !== classifyGenRef.current) return;
        clearTimer();
        setClassifyFailed(true);
      });
  };

  const handleStep2Continue = async () => {
    // Guard against same-frame double-tap.
    if (createDraft.isPending) return;
    if (!photo) return;

    // If the user went Back from step 3 and hit Continue again with an
    // existing draft, reuse it instead of creating a second one. Re-kick
    // classify if we don't yet have a result.
    if (draft) {
      setStep(3);
      if (!classification && !classify.isPending) kickOffClassify(draft.snapId);
      return;
    }

    try {
      const result = await createDraft.mutateAsync({
        file: photo,
        description: description.trim() || undefined,
        area,
      });
      setDraft(result);
      setStep(3);
      kickOffClassify(result.snapId);
    } catch (err) {
      toast({
        title: "Couldn't upload photo",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  // Chain finalize (hold credits) → route (attach to next_visit OR open
  // dispatch_request). If routing fails with no_upcoming_job, keep the hold
  // and flip the UI to ad_hoc so the user can retry on the same credits.
  // Any other routing failure → cancel/refund and surface the error.
  const handleSubmit = async () => {
    if (!draft || !routing) return;

    const isAdHocRetry = finalized;
    const creditsToHold = routingHoldAmount(routing, classification);

    try {
      if (!isAdHocRetry) {
        // First attempt: hold credits via finalize, then route.
        await finalize.mutateAsync({
          snapId: draft.snapId,
          subscriptionId: draft.subscriptionId,
          routing,
          creditsToHold,
        });
        setFinalized(true);
      }
      // else: credits already held from the failed next_visit attempt — skip
      // the hold and just route again.

      try {
        await routeSnap.mutateAsync({ snapId: draft.snapId });
      } catch (routeErr) {
        if (routeErr instanceof RouteSnapError && routeErr.code === "no_upcoming_job") {
          toast({
            title: "No upcoming visits",
            description:
              "Your routine doesn't have a scheduled visit yet. Choose Urgent to dispatch someone instead.",
          });
          // Flip routing UI to ad_hoc; leave credits held so the retry is free.
          setRouting("ad_hoc");
          return;
        }
        // Any other routing failure — attempt to refund credits. If the
        // refund itself fails, leave `finalized=true` so a user retry
        // doesn't re-enter finalize and double-hold; surface a distinct
        // toast so the customer knows support-intervention may be needed.
        // (Sheet stays open either way.)
        try {
          await cancelSnap.mutateAsync({ snapId: draft.snapId });
          // Refund succeeded — safe to clear finalized so a retry can
          // re-run the full flow from the top. Rethrow so the outer
          // catch surfaces the original routing error to the user.
          setFinalized(false);
          throw routeErr;
        } catch (cancelErr) {
          // If the rethrown routeErr landed here, propagate it so the
          // outer catch toasts once. If cancelSnap ITSELF failed,
          // surface the refund-pending toast and return so the outer
          // generic toast doesn't stack on top of it.
          if (cancelErr === routeErr) throw routeErr;
          toast({
            title: "Routing failed — refund pending",
            description:
              "We couldn't release your credits automatically. Contact support if they don't return within a few minutes.",
            variant: "destructive",
          });
          // Don't clear finalized — a retry would otherwise re-hold
          // credits on top of the existing hold.
          return;
        }
      }

      toast({
        title: "Snap submitted",
        description:
          routing === "ad_hoc"
            ? "We'll dispatch someone soon."
            : "We'll add this to your next visit.",
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Couldn't submit",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
        onOpenChange(next);
      }}
    >
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Snap a fix</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {step === 1 && (
            <>
              <p className="text-sm text-muted-foreground">
                Take a photo of whatever needs handling. We'll estimate the credits before you submit.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handlePhotoSelected(f);
                }}
              />
              <Button className="w-full h-32 text-base" onClick={() => fileRef.current?.click()}>
                <Camera className="h-6 w-6 mr-2" />
                Take photo or choose from library
              </Button>
            </>
          )}

          {step === 2 && previewUrl && (
            <>
              <img
                src={previewUrl}
                alt="Snap preview"
                className="w-full rounded-lg max-h-64 object-cover"
              />
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Anything we should know? (optional)
                </p>
                <Textarea
                  value={description}
                  maxLength={280}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. leaky under the sink, been happening for a few days"
                  rows={3}
                />
                <div className="text-xs text-muted-foreground text-right mt-1">
                  {description.length}/280
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Where in the home?</p>
                <div className="flex flex-wrap gap-2">
                  {AREAS.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      onClick={() => setArea(value)}
                      aria-pressed={area === value}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm transition-colors ${
                        area === value
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border hover:bg-secondary/50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={createDraft.isPending}
                  onClick={handleStep2Continue}
                >
                  {createDraft.isPending ? "Uploading…" : "Continue"}
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {classify.isPending && !classification && !classifyFailed && (
                <div className="p-4 rounded-lg border border-border bg-secondary/30 flex items-start gap-3">
                  <Loader2 className="h-5 w-5 text-accent animate-spin shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Analyzing your photo…</div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Takes a few seconds.
                    </p>
                  </div>
                </div>
              )}

              {classification && (
                <div className="p-4 rounded-lg border border-accent/40 bg-accent/5 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-accent" />
                    We think…
                  </div>
                  <p className="text-base">{classification.summary}</p>
                  <p className="text-sm text-muted-foreground">
                    About <span className="font-semibold text-foreground">{classification.suggested_credits} credits</span>{" "}
                    — confirm on the next step.
                  </p>
                </div>
              )}

              {classifyFailed && !classification && (
                <div className="p-4 rounded-lg border border-border bg-secondary/30 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    Almost ready
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We couldn't auto-estimate this one — you'll see a default hold on the next step. Refunds apply if the fix needs fewer credits.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={classify.isPending && !classifyFailed}
                  onClick={() => setStep(4)}
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <p className="text-sm text-muted-foreground">How should we handle this?</p>
              <div className="space-y-2">
                <button
                  onClick={() => setRouting("ad_hoc")}
                  aria-pressed={routing === "ad_hoc"}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    routing === "ad_hoc"
                      ? "border-accent bg-accent/10"
                      : "border-border hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-semibold">Urgent</span>
                        <span className="text-xs text-muted-foreground">
                          ~{routingHoldAmount("ad_hoc", classification)} credits held
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        We'll dispatch someone as soon as a provider is available.
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setRouting("next_visit")}
                  aria-pressed={routing === "next_visit"}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    routing === "next_visit"
                      ? "border-accent bg-accent/10"
                      : "border-border hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <CalendarDays className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-semibold">Next visit</span>
                        <span className="text-xs text-muted-foreground">
                          ~{routingHoldAmount("next_visit", classification)} credits held
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        We'll add this to your next scheduled service.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Credits are held, not spent. If the fix needs fewer (or we can't complete it), we'll refund the difference.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={
                    !routing ||
                    finalize.isPending ||
                    routeSnap.isPending ||
                    cancelSnap.isPending
                  }
                  onClick={handleSubmit}
                >
                  {finalize.isPending
                    ? "Holding credits…"
                    : routeSnap.isPending
                      ? "Routing…"
                      : cancelSnap.isPending
                        ? "Refunding…"
                        : "Submit"}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
