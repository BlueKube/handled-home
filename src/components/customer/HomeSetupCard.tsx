import { useNavigate } from "react-router-dom";
import { usePropertyCoverage } from "@/hooks/usePropertyCoverage";
import { usePropertySignals } from "@/hooks/usePropertySignals";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CircleDashed, ChevronRight, Sparkles } from "lucide-react";

/**
 * Progressive "Complete Home Setup" prompt card.
 * Shows on dashboard when coverage map or sizing is incomplete.
 */
export function HomeSetupCard() {
  const navigate = useNavigate();
  const { hasData: hasCoverage, isLoading: covLoading } = usePropertyCoverage();
  const { hasData: hasSignals, isLoading: sigLoading } = usePropertySignals();

  if (covLoading || sigLoading) return null;
  if (hasCoverage && hasSignals) return null; // fully complete

  const steps = [
    { label: "Coverage map", done: hasCoverage, route: "/customer/coverage-map?return=/customer" },
    { label: "Home size", done: hasSignals, route: "/customer/property-sizing?return=/customer" },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done);

  return (
    <Card className="p-4 space-y-3 border-accent/20 bg-accent/5">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-accent" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Complete Home Setup</p>
          <p className="text-xs text-muted-foreground">
            ~30 seconds — helps us tailor your services
          </p>
        </div>
        <span className="text-xs font-medium text-accent">
          {completedCount}/{steps.length}
        </span>
      </div>

      <div className="space-y-1.5">
        {steps.map((step) => (
          <button
            key={step.label}
            onClick={() => navigate(step.route)}
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-accent/10 transition-colors"
          >
            {step.done ? (
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            ) : (
              <CircleDashed className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="text-sm text-foreground flex-1 text-left">{step.label}</span>
            {!step.done && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
        ))}
      </div>

      {nextStep && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(nextStep.route)}
          className="w-full border-accent/30 text-accent hover:bg-accent/10"
        >
          Continue setup
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      )}
    </Card>
  );
}
