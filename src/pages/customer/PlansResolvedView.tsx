import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanVariantCard } from "@/components/plans/PlanVariantCard";
import { FAMILY_HIGHLIGHTS } from "@/components/plans/planTierStyles";
import type { ActiveFamily } from "@/hooks/usePlanVariants";
import type { Plan } from "@/hooks/usePlans";

const FAMILY_NAME: Record<ActiveFamily, string> = {
  basic: "Basic",
  full: "Full",
  premier: "Premier",
};

interface PlansResolvedViewProps {
  family: ActiveFamily;
  resolvedVariant: Plan;
  otherVariants: Plan[];
  handlesPerCycle?: number;
  rationale: string;
  isRecommended: boolean;
  showOtherSizes: boolean;
  onToggleOtherSizes: () => void;
  onBack: () => void;
}

export function PlansResolvedView({
  family,
  resolvedVariant,
  otherVariants,
  handlesPerCycle,
  rationale,
  isRecommended,
  showOtherSizes,
  onToggleOtherSizes,
  onBack,
}: PlansResolvedViewProps) {
  const navigate = useNavigate();

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        aria-label="Back to all plans"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="text-sm">Back to all plans</span>
      </button>

      <PlanVariantCard
        variant={resolvedVariant}
        family={family}
        handlesPerCycle={handlesPerCycle}
        rationale={rationale}
        highlights={FAMILY_HIGHLIGHTS[family]}
        isRecommended={isRecommended}
        confirmLabel="Subscribe"
        onConfirm={() => navigate(`/customer/subscribe?plan=${resolvedVariant.id}`)}
        onChangeSize={otherVariants.length > 0 ? onToggleOtherSizes : undefined}
      />

      {showOtherSizes && otherVariants.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">
            Other sizes in {FAMILY_NAME[family]}
          </p>
          <div className="space-y-2">
            {otherVariants.map((variant) => (
              <Button
                key={variant.id}
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate(`/customer/subscribe?plan=${variant.id}`)}
              >
                <span>{variant.name}</span>
                <span className="text-muted-foreground">{variant.display_price_text ?? "—"}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        Billed every 4 weeks. Change or cancel anytime — changes take effect next cycle.
      </p>
    </div>
  );
}
