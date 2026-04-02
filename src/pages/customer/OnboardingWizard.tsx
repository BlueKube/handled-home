import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingProgress, ONBOARDING_STEPS, type OnboardingStep } from "@/hooks/useOnboardingProgress";
import { useProperty } from "@/hooks/useProperty";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  PropertyStep,
  ZoneCheckStep,
  PlanStep,
  SubscribeStep,
  ServiceDayStep,
  HomeSetupStep,
  RoutineStep,
  CompleteStep,
} from "./onboarding";

const STEP_LABELS: Record<OnboardingStep, string> = {
  property: "Home",
  zone_check: "Zone",
  home_setup: "Setup",
  plan: "Plan",
  subscribe: "Pay",
  service_day: "Day",
  routine: "Routine",
  complete: "Done",
};

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { progress, isLoading, currentStep, completedSteps, selectedPlanId, completeStep, goToStep, isSaving } =
    useOnboardingProgress();
  const { property, isLoading: propLoading } = useProperty();

  const checkoutSuccess = searchParams.get("checkout") === "success";
  const { data: subscription, isLoading: subLoading } = useCustomerSubscription(
    checkoutSuccess ? 2000 : undefined
  );

  const [verifyTimedOut, setVerifyTimedOut] = useState(false);
  useEffect(() => {
    if (!checkoutSuccess) return;
    const timer = setTimeout(() => setVerifyTimedOut(true), 15000);
    return () => clearTimeout(timer);
  }, [checkoutSuccess]);

  useEffect(() => {
    if (checkoutSuccess && subscription && ["active", "trialing"].includes(subscription.status)) {
      setSearchParams({}, { replace: true });
      if (!completedSteps.includes("subscribe")) {
        completeStep("subscribe");
      }
    }
  }, [checkoutSuccess, subscription, completedSteps, completeStep, setSearchParams]);

  useEffect(() => {
    if (!isLoading && !propLoading && !subLoading && currentStep === "complete" && completedSteps.includes("routine")) {
      navigate("/customer", { replace: true });
    }
  }, [isLoading, propLoading, subLoading, currentStep, completedSteps, navigate]);

  if (isLoading || propLoading) {
    return (
      <div className="p-4 space-y-4 animate-fade-in">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (checkoutSuccess && (!subscription || !["active", "trialing"].includes(subscription.status ?? ""))) {
    return (
      <div className="p-4 space-y-6 text-center animate-fade-in">
        {verifyTimedOut ? (
          <>
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <span className="text-destructive text-xl">!</span>
            </div>
            <h1 className="text-h2">Verification is taking longer than expected</h1>
            <p className="text-muted-foreground text-sm">Your payment may still be processing. Please try refreshing, or contact support if the issue persists.</p>
            <button onClick={() => window.location.reload()} className="text-sm text-accent underline">Refresh page</button>
          </>
        ) : (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto" />
            <h1 className="text-h2">Verifying your subscription…</h1>
            <p className="text-muted-foreground text-sm">This usually takes just a few seconds.</p>
          </>
        )}
      </div>
    );
  }

  const effectiveStep = (() => {
    if (currentStep === "property" && property) return "zone_check";
    if (currentStep === "zone_check" && completedSteps.includes("zone_check")) return "home_setup";
    if (currentStep === "home_setup" && completedSteps.includes("home_setup")) return "plan";
    if (currentStep === "subscribe" && subscription && ["active", "trialing"].includes(subscription.status))
      return "service_day";
    return currentStep;
  })();

  const stepIndex = ONBOARDING_STEPS.indexOf(effectiveStep);
  const progressPercent = Math.round((stepIndex / (ONBOARDING_STEPS.length - 1)) * 100);

  const canGoBack = stepIndex > 0 && effectiveStep !== "complete";
  const handleBack = () => {
    const prevStep = ONBOARDING_STEPS[stepIndex - 1];
    if (prevStep) goToStep(prevStep);
  };

  return (
    <div className="animate-fade-in pb-24">
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          {canGoBack ? (
            <button onClick={handleBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground">
            Step {stepIndex + 1} of {ONBOARDING_STEPS.length}
          </span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
        <div className="flex justify-between mt-1.5">
          {ONBOARDING_STEPS.map((s, i) => (
            <span
              key={s}
              className={`text-[10px] ${
                i <= stepIndex ? "text-accent font-medium" : "text-muted-foreground"
              } ${i === stepIndex ? "font-semibold" : ""}`}
            >
              {i <= 4 || i === ONBOARDING_STEPS.length - 1 ? STEP_LABELS[s] : ""}
            </span>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        {effectiveStep === "property" && <PropertyStep onComplete={async () => { await completeStep("property"); }} />}
        {effectiveStep === "zone_check" && <ZoneCheckStep onComplete={async () => { await completeStep("zone_check"); }} onWaitlist={() => navigate("/customer")} />}
        {effectiveStep === "plan" && (
          <PlanStep
            onSelectPlan={async (planId: string) => { await completeStep("plan", { selected_plan_id: planId }); }}
            onSkip={async () => { try { await completeStep("plan"); } catch { toast.error("Couldn't save progress — try again."); } }}
          />
        )}
        {effectiveStep === "home_setup" && <HomeSetupStep onComplete={async () => { await completeStep("home_setup"); }} />}
        {effectiveStep === "subscribe" && (
          <SubscribeStep planId={selectedPlanId}
            onComplete={async () => { await completeStep("subscribe"); }}
            onSkip={async () => { try { await completeStep("subscribe"); } catch { toast.error("Couldn't save progress — try again."); } }}
          />
        )}
        {effectiveStep === "service_day" && <ServiceDayStep onComplete={async () => { await completeStep("service_day"); }} />}
        {effectiveStep === "routine" && <RoutineStep onComplete={async () => { await completeStep("routine"); }} />}
        {effectiveStep === "complete" && <CompleteStep />}
      </div>
    </div>
  );
}
