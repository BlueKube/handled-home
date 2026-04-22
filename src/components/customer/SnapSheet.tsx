import { useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, CheckCircle2, Bath, ChefHat, Trees, Home, HelpCircle, Zap, CalendarDays } from "lucide-react";
import {
  useSubmitSnap,
  type SnapArea,
  type SnapRouting,
  SNAP_HOLD_DEFAULTS,
} from "@/hooks/useSubmitSnap";
import { toast } from "@/hooks/use-toast";

interface SnapSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AREAS: { value: SnapArea; label: string; Icon: React.ElementType }[] = [
  { value: "bath", label: "Bath", Icon: Bath },
  { value: "kitchen", label: "Kitchen", Icon: ChefHat },
  { value: "yard", label: "Yard", Icon: Trees },
  { value: "exterior", label: "Exterior", Icon: Home },
  { value: "other", label: "Other", Icon: HelpCircle },
];

export function SnapSheet({ open, onOpenChange }: SnapSheetProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [area, setArea] = useState<SnapArea | null>(null);
  const [routing, setRouting] = useState<SnapRouting | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const submitMutation = useSubmitSnap();

  const reset = () => {
    setStep(1);
    setPhoto(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setDescription("");
    setArea(null);
    setRouting(null);
  };

  const handlePhotoSelected = (file: File) => {
    setPhoto(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!photo || !routing) return;
    try {
      await submitMutation.mutateAsync({
        file: photo,
        description: description.trim() || undefined,
        area,
        routing,
        creditsToHold: SNAP_HOLD_DEFAULTS[routing],
      });
      toast({
        title: "Snap submitted",
        description: routing === "ad_hoc"
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
        if (!next) reset();
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
                Take a photo of whatever needs handling. We'll estimate the credits after you submit.
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
                  onChange={(e) => setDescription(e.target.value.slice(0, 280))}
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
                <Button className="flex-1" onClick={() => setStep(3)}>
                  Continue
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="p-4 rounded-lg border border-border bg-secondary/30 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  Almost ready
                </div>
                <p className="text-sm text-muted-foreground">
                  We'll estimate the credits after submit and confirm before they're used.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(4)}>
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
                          ~{SNAP_HOLD_DEFAULTS.ad_hoc} credits held
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
                          ~{SNAP_HOLD_DEFAULTS.next_visit} credits held
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
                  disabled={!routing || submitMutation.isPending}
                  onClick={handleSubmit}
                >
                  {submitMutation.isPending ? "Submitting…" : "Submit"}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
