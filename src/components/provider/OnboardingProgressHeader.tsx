import { ChevronLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OnboardingProgressHeaderProps {
  currentStep: number;
  totalSteps?: number;
  onBack?: () => void;
}

export default function OnboardingProgressHeader({
  currentStep,
  totalSteps = 6,
  onBack,
}: OnboardingProgressHeaderProps) {
  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-2">
        {onBack ? (
          <button
            onClick={onBack}
            className="h-11 w-11 flex items-center justify-center rounded-lg -ml-1 hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : (
          <div className="w-11" />
        )}
        <span className="text-caption flex-1">Step {currentStep} of {totalSteps}</span>
      </div>
      <Progress value={progressPercent} className="h-1.5 [&>div]:!bg-accent" />
    </div>
  );
}
