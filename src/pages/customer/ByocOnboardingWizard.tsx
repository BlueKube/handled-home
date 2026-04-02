import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useByocOnboardingContext } from "@/hooks/useByocOnboardingContext";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmServiceStep,
  PlanActivateStep,
  ActivatingScreen,
  SuccessScreen,
  InviteFallbackScreen,
  BYOC_STEPS,
  type ByocStep,
} from "./byoc-onboarding";

export default function ByocOnboardingWizard() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { invite, activate, byocContext, isLoading: contextLoading } = useByocOnboardingContext(token);
  const [step, setStepRaw] = useState<ByocStep>("confirm");
  const [selectedCadence, setSelectedCadence] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);
  const stepRestored = useRef(false);

  const inviteData = invite.data;
  const cadence = selectedCadence || inviteData?.default_cadence || "weekly";
  const { progress } = useOnboardingProgress();

  // Persist step to metadata on every change
  const setStep = useCallback((nextStep: ByocStep) => {
    setStepRaw(nextStep);
    if (progress?.id) {
      const metadata = (progress.metadata as Record<string, unknown>) ?? {};
      const updated = { ...metadata, byoc_step: nextStep };
      void supabase
        .from("customer_onboarding_progress")
        .update({ metadata: updated as any })
        .eq("id", progress.id);
    }
  }, [progress]);

  // Restore step from persisted metadata on mount
  useEffect(() => {
    if (stepRestored.current || !progress) return;
    const metadata = progress.metadata as Record<string, unknown> | null;
    const savedStep = metadata?.byoc_step as ByocStep | undefined;
    if (savedStep && BYOC_STEPS.includes(savedStep) && savedStep !== "activating") {
      stepRestored.current = true;
      setStepRaw(savedStep);
    } else if (metadata?.byoc_provider_id) {
      stepRestored.current = true;
    }
  }, [progress]);

  // Activation logic
  const attemptActivation = useCallback(async () => {
    try {
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: freshInvite } = await supabase
        .from("byoc_invite_links")
        .select("is_active")
        .eq("token", token!)
        .maybeSingle();

      if (!freshInvite?.is_active) {
        toast.error("This invitation is no longer active.");
        navigate("/customer");
        return;
      }

      let propertyId = createdPropertyId;
      if (!propertyId) {
        const { data: prop } = await supabase
          .from("properties")
          .select("id")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        propertyId = prop?.id ?? undefined;
      }

      await activate.mutateAsync({
        property_id: propertyId,
        cadence,
      });

      toast.success("Provider connected!");
      setStep("success");
    } catch (err: any) {
      if (err.message?.includes("already activated") || err.message?.includes("409")) {
        toast.info("You've already activated this invite.");
        navigate("/customer");
        return;
      }
      setActivationError(err.message || "Connection failed. Please try again.");
    }
  }, [token, createdPropertyId, user, activate, cadence, setStep, navigate]);

  // Loading
  if (contextLoading || invite.isLoading) {
    return (
      <div className="p-4 space-y-4 animate-fade-in">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Invalid/expired invite
  if (!inviteData || !inviteData.is_active) {
    return <InviteFallbackScreen />;
  }

  const visibleSteps: ByocStep[] = ["confirm", "plan"];
  const visibleIndex = visibleSteps.indexOf(step as ByocStep);
  const progressPercent = step === "success" ? 100 : visibleSteps.length > 1
    ? Math.round((Math.max(0, visibleIndex) / (visibleSteps.length - 1)) * 100)
    : 100;

  const canGoBack = step === "plan";
  const handleBack = () => setStep("confirm");

  return (
    <div className="animate-fade-in pb-24">
      {/* Progress bar */}
      {step !== "activating" && step !== "success" && (
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            {canGoBack ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground min-h-[44px]"
                aria-label="Back to previous step"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <span />
            )}
            <span className="text-xs text-muted-foreground">
              Step {(visibleIndex >= 0 ? visibleIndex : 0) + 1} of {visibleSteps.length}
            </span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      )}

      {/* Step content */}
      <div className="px-4 mt-4">
        {step === "confirm" && !byocContext && (
          <div className="py-8 text-center">
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        )}
        {step === "confirm" && byocContext && (
          <ConfirmServiceStep
            providerName={byocContext.providerName}
            providerLogoUrl={inviteData?.provider_org?.logo_url ?? null}
            categoryLabel={byocContext.categoryLabel}
            cadence={cadence}
            onNext={(propertyId) => {
              if (propertyId) setCreatedPropertyId(propertyId);
              setStep("plan");
            }}
            onSkip={() => setStep("plan")}
          />
        )}
        {step === "plan" && byocContext && (
          <PlanActivateStep
            providerName={byocContext.providerName}
            categoryLabel={byocContext.categoryLabel}
            cadence={cadence}
            selectedPlanId={selectedPlanId}
            onSelectPlan={setSelectedPlanId}
            onActivate={async () => {
              setStep("activating");
              setActivationError(null);
              await attemptActivation();
            }}
            onSkip={() => {
              setStep("activating");
              setActivationError(null);
              attemptActivation().catch((err) => {
                setActivationError(err?.message || "Connection failed. Please try again.");
              });
            }}
          />
        )}
        {step === "activating" && (
          <ActivatingScreen
            error={activationError}
            onRetry={async () => {
              setActivationError(null);
              await attemptActivation();
            }}
            onSkip={() => {
              setActivationError(null);
              setStep("success");
            }}
          />
        )}
        {step === "success" && byocContext && (
          <SuccessScreen
            providerName={byocContext.providerName}
            categoryLabel={byocContext.categoryLabel}
            cadence={cadence}
            onDashboard={() => navigate("/customer")}
            onExplorePlan={() => navigate("/customer/plans")}
          />
        )}
      </div>
    </div>
  );
}
