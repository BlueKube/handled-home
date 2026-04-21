import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Loader2 } from "lucide-react";
import { PlanVariantCard } from "@/components/plans/PlanVariantCard";
import { FAMILY_HIGHLIGHTS } from "@/components/plans/planTierStyles";
import type { ActiveFamily } from "@/hooks/usePlanVariants";
import type { Plan } from "@/hooks/usePlans";

const OVERRIDE_REASONS: Array<{ value: string; label: string }> = [
  { value: "size_larger", label: "My home is larger than the default" },
  { value: "size_smaller", label: "My home is smaller than the default" },
  { value: "budget", label: "Budget preference" },
  { value: "other", label: "Other" },
];

const NO_REASON_SENTINEL = "__none__";

interface PlanStepResolvedProps {
  family: ActiveFamily;
  resolvedVariant: Plan;
  displayVariant: Plan;
  adjacentVariants: Plan[];
  handlesPerCycle?: number;
  rationale: string;
  isRecommended: boolean;
  overrideVariantId: string | null;
  overrideReason: string | null;
  confirming: boolean;
  onOverrideVariantChange: (variantId: string | null) => void;
  onOverrideReasonChange: (reason: string | null) => void;
  onBack: () => void;
  onConfirm: () => void;
  onSkip: () => void;
}

export function PlanStepResolved({
  family,
  displayVariant,
  adjacentVariants,
  handlesPerCycle,
  rationale,
  isRecommended,
  overrideVariantId,
  overrideReason,
  confirming,
  onOverrideVariantChange,
  onOverrideReasonChange,
  onBack,
  onConfirm,
  onSkip,
}: PlanStepResolvedProps) {
  const overrideActive = overrideVariantId !== null;
  const canConfirm = !overrideActive || overrideReason !== null;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        aria-label="Back to all plans"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="text-sm">Back to all plans</span>
      </button>

      <PlanVariantCard
        variant={displayVariant}
        family={family}
        handlesPerCycle={handlesPerCycle}
        rationale={overrideActive ? undefined : rationale}
        highlights={FAMILY_HIGHLIGHTS[family]}
        isRecommended={isRecommended}
      />

      {adjacentVariants.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Different size home?</p>
            <p className="text-xs text-muted-foreground mt-1">
              You can pick a size one step up or down. We'll flag it for review.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {adjacentVariants.map((variant) => {
              const isActive = overrideVariantId === variant.id;
              return (
                <Button
                  key={variant.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (isActive) {
                      onOverrideVariantChange(null);
                      onOverrideReasonChange(null);
                    } else {
                      onOverrideVariantChange(variant.id);
                    }
                  }}
                >
                  {variant.name}
                  {variant.display_price_text ? ` · ${variant.display_price_text}` : ""}
                </Button>
              );
            })}
          </div>

          {overrideActive && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground" htmlFor="override-reason">
                Why this size?
              </label>
              <Select
                value={overrideReason ?? NO_REASON_SENTINEL}
                onValueChange={(value) =>
                  onOverrideReasonChange(value === NO_REASON_SENTINEL ? null : value)
                }
              >
                <SelectTrigger id="override-reason">
                  <SelectValue placeholder="Choose a reason" />
                </SelectTrigger>
                <SelectContent>
                  {OVERRIDE_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      <Button
        className="w-full h-12 text-base font-semibold rounded-xl"
        onClick={onConfirm}
        disabled={!canConfirm || confirming}
      >
        {confirming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Continue
      </Button>

      <Button
        variant="ghost"
        className="w-full text-sm min-h-[44px]"
        onClick={onSkip}
        disabled={confirming}
      >
        Skip for now — browse plans later from your dashboard
      </Button>
    </div>
  );
}
