import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_ORDER, CATEGORY_LABELS } from "@/lib/serviceCategories";
import { useByopRecommendations } from "@/hooks/useByopRecommendation";
import { stripNonDigits } from "./shared";

interface Props {
  onComplete: () => Promise<void>;
}

export function BringSomeoneStep({ onComplete }: Props) {
  const { submit } = useByopRecommendations();
  const [providerName, setProviderName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completing, setCompleting] = useState(false);

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSkip = async () => {
    setCompleting(true);
    try {
      await onComplete();
    } catch {
      toast.error("Couldn't save your progress — try again.");
    } finally {
      setCompleting(false);
    }
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!providerName.trim()) errs.providerName = "Tell us who they are.";
    if (!category) errs.category = "Pick a service category.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setCompleting(true);
    try {
      await submit.mutateAsync({
        provider_name: providerName.trim(),
        category,
        phone: phone.trim() || undefined,
        note: "[from: onboarding]",
      });
    } catch {
      // submit.mutateAsync surfaces its own error toast — bail without advancing
      setCompleting(false);
      return;
    }
    try {
      await onComplete();
    } catch {
      toast.error("Recommendation saved, but couldn't advance — try again.");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          <h2 className="text-h2">Know a great pro?</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Recommend someone you trust — we'll vet them. You earn 30 credits when they're a fit.
        </p>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bring-name">Their name</Label>
            <Input
              id="bring-name"
              value={providerName}
              onChange={(e) => {
                setProviderName(e.target.value);
                clearError("providerName");
              }}
              placeholder="e.g., Tomás Rivera"
              autoComplete="off"
            />
            {errors.providerName && (
              <p className="text-xs text-destructive">{errors.providerName}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bring-category">What do they do?</Label>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v);
                clearError("category");
              }}
            >
              <SelectTrigger id="bring-category">
                <SelectValue placeholder="Pick a service" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ORDER.map((key) => (
                  <SelectItem key={key} value={key}>
                    {CATEGORY_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bring-phone">Phone (optional)</Label>
            <Input
              id="bring-phone"
              value={phone}
              onChange={(e) => setPhone(stripNonDigits(e.target.value))}
              placeholder="555-123-4567"
              inputMode="tel"
              autoComplete="off"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Button
          onClick={handleSubmit}
          disabled={completing || submit.isPending}
          className="min-h-[44px]"
        >
          {completing || submit.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending…
            </>
          ) : (
            "Send recommendation"
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={handleSkip}
          disabled={completing}
          className="min-h-[44px]"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}
