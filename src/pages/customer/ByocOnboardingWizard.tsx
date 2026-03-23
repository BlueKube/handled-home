import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useByocOnboardingContext } from "@/hooks/useByocOnboardingContext";
import { useProperty, PropertyFormData, formatPetsForDisplay } from "@/hooks/useProperty";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { usePlans, type Plan } from "@/hooks/usePlans";
import { PlanCard } from "@/components/plans/PlanCard";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  User,
} from "lucide-react";
import { toast } from "sonner";
import handledLogo from "@/assets/handled-home-logo.png";

// ── Types ──
type ByocStep = "confirm" | "plan" | "activating" | "success";

const BYOC_STEPS: ByocStep[] = ["confirm", "plan", "activating", "success"];

const CADENCE_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  once: "One-time",
};

const TIER_HIGHLIGHTS: Record<string, string[]> = {
  essential: ["Weekly mow + edge trim", "Swap services each cycle", "Roll over unused handles"],
  plus: ["Everything in Essential", "Seasonal services included", "Priority scheduling"],
  premium: ["Everything in Plus", "Home Assistant access", "Dedicated provider team"],
};

function getTierKey(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("premium")) return "premium";
  if (lower.includes("plus")) return "plus";
  return "essential";
}

// ── Helpers ──
function stripNonDigits(val: string): string {
  return val.replace(/\D/g, "").slice(0, 5);
}

interface FieldErrors {
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

function validateProperty(form: PropertyFormData): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.street_address.trim()) errors.street_address = "Street address is required";
  if (!form.city.trim()) errors.city = "City is required";
  if (!form.state.trim()) errors.state = "State is required";
  const zip = form.zip_code.replace(/\D/g, "");
  if (!zip) errors.zip_code = "Zip code is required";
  else if (zip.length !== 5) errors.zip_code = "Must be 5 digits";
  return errors;
}

// ════════════════════════════════════════
// Main Wizard (2-Step)
// ════════════════════════════════════════
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
      const { data: freshInvite } = await supabase
        .from("byoc_invite_links")
        .select("is_active")
        .eq("token", token!)
        .maybeSingle();

      if (!freshInvite?.is_active) {
        toast.error("This invitation is no longer active.");
        setStep("success");
        return;
      }

      let propertyId = createdPropertyId;
      if (!propertyId) {
        const { data: prop } = await supabase
          .from("properties")
          .select("id")
          .eq("user_id", user!.id)
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
  const progressPercent = step === "success" ? 100 : Math.round(((visibleIndex >= 0 ? visibleIndex : 0) / (visibleSteps.length - 1)) * 100);

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
              void attemptActivation();
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

// ════════════════════════════════════════
// Step 1: Confirm Your Service
// ════════════════════════════════════════
function ConfirmServiceStep({
  providerName,
  providerLogoUrl,
  categoryLabel,
  cadence,
  onNext,
  onSkip,
}: {
  providerName: string;
  providerLogoUrl: string | null;
  categoryLabel: string;
  cadence: string;
  onNext: (propertyId?: string) => void;
  onSkip: () => void;
}) {
  const { property, save, isSaving } = useProperty();
  const [form, setForm] = useState<PropertyFormData>({
    street_address: "", city: "", state: "", zip_code: "",
    gate_code: "", access_instructions: "", parking_instructions: "",
    pets_input: "", notes: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState(false);
  const initial = providerName.charAt(0).toUpperCase();

  useEffect(() => {
    if (property) {
      setForm({
        street_address: property.street_address || "",
        city: property.city || "",
        state: property.state || "",
        zip_code: property.zip_code || "",
        gate_code: property.gate_code || "",
        access_instructions: property.access_instructions || "",
        parking_instructions: property.parking_instructions || "",
        pets_input: formatPetsForDisplay(property.pets),
        notes: property.notes || "",
      });
    }
  }, [property]);

  const updateField = (field: keyof PropertyFormData, value: string) => {
    let finalValue = value;
    if (field === "state") finalValue = value.toUpperCase().slice(0, 2);
    if (field === "zip_code") finalValue = stripNonDigits(value);
    const newForm = { ...form, [field]: finalValue };
    setForm(newForm);
    if (touched) setErrors(validateProperty(newForm));
  };

  const handleSubmit = async () => {
    setTouched(true);
    const normalized = { ...form, zip_code: stripNonDigits(form.zip_code) };
    const fieldErrors = validateProperty(normalized);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;
    try {
      const saved = await save(normalized);
      onNext(saved?.id);
    } catch {}
  };

  const isValid = Object.keys(validateProperty(form)).length === 0;

  return (
    <div className="space-y-6">
      {/* Provider Context Card */}
      <Card className="bg-accent/5 border-accent/20">
        <CardContent className="pt-4 flex gap-4 items-center">
          {providerLogoUrl ? (
            <img
              src={providerLogoUrl}
              alt={providerName}
              className="h-12 w-12 rounded-full object-cover border-2 border-primary/20"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold border-2 border-primary/20">
              {initial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">{providerName}</p>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                <User className="h-3 w-3 mr-0.5" /> Your provider
              </Badge>
            </div>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{categoryLabel}</Badge>
              <Badge variant="outline" className="text-xs">{CADENCE_LABELS[cadence] ?? cadence}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-caption text-muted-foreground">
        This is already set up from your provider's invitation.
      </p>

      {/* Address Input */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <h3 className="text-base font-semibold">Confirm Your Address</h3>

          <div className="space-y-1.5">
            <Label htmlFor="byoc-street">Street Address *</Label>
            <Input id="byoc-street" value={form.street_address} onChange={(e) => updateField("street_address", e.target.value)} placeholder="123 Main St" />
            {errors.street_address && <p className="text-xs text-destructive">{errors.street_address}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="byoc-city">City *</Label>
              <Input id="byoc-city" value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="Los Angeles" />
              {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="byoc-state">State *</Label>
              <Input id="byoc-state" value={form.state} onChange={(e) => updateField("state", e.target.value)} placeholder="TX" maxLength={2} className="uppercase" />
              {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="byoc-zip">Zip Code *</Label>
            <Input id="byoc-zip" inputMode="numeric" value={form.zip_code} onChange={(e) => updateField("zip_code", e.target.value)} placeholder="90210" maxLength={5} />
            {errors.zip_code && <p className="text-xs text-destructive">{errors.zip_code}</p>}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Button onClick={handleSubmit} disabled={!isValid || isSaving} className="w-full h-12 text-base font-semibold rounded-xl">
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Next
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>

      <Button variant="ghost" className="w-full text-sm" onClick={onSkip}>
        Skip for now — finish setup later
      </Button>
    </div>
  );
}

// ════════════════════════════════════════
// Step 2: Choose Plan & Activate
// ════════════════════════════════════════
function PlanActivateStep({
  providerName,
  categoryLabel,
  cadence,
  selectedPlanId,
  onSelectPlan,
  onActivate,
  onSkip,
}: {
  providerName: string;
  categoryLabel: string;
  cadence: string;
  selectedPlanId: string | null;
  onSelectPlan: (planId: string) => void;
  onActivate: () => Promise<void>;
  onSkip: () => void;
}) {
  const { data: plans, isLoading: plansLoading } = usePlans("active");
  const [activating, setActivating] = useState(false);

  const { data: allHandles } = useQuery({
    queryKey: ["plan_handles_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_handles").select("plan_id, handles_per_cycle");
      if (error) throw error;
      return new Map((data ?? []).map((r: any) => [r.plan_id, r]));
    },
  });

  // Auto-select recommended plan
  useEffect(() => {
    if (!selectedPlanId && plans?.length) {
      const recommended = plans.reduce((best, p) => p.recommended_rank > best.recommended_rank ? p : best, plans[0]);
      onSelectPlan(recommended.id);
    }
  }, [plans, selectedPlanId, onSelectPlan]);

  const handleActivate = async () => {
    setActivating(true);
    try {
      await onActivate();
    } finally {
      setActivating(false);
    }
  };

  if (plansLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-h2">Choose Your Plan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your provider's service is included in all plans.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="space-y-4">
        {plans?.map((plan) => {
          const tierKey = getTierKey(plan.name);
          const isRecommended = plans.length > 0 &&
            plan.recommended_rank === Math.max(...plans.map((p) => p.recommended_rank));
          const dbHandles = allHandles?.get(plan.id);

          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              isRecommended={isRecommended}
              zoneEnabled
              handlesPerCycle={dbHandles?.handles_per_cycle}
              tierHighlights={TIER_HIGHLIGHTS[tierKey]}
              onBuildRoutine={() => onSelectPlan(plan.id)}
            />
          );
        })}
      </div>

      {/* CTA */}
      <Button
        onClick={handleActivate}
        disabled={activating || !selectedPlanId}
        className="w-full h-12 text-base font-semibold rounded-xl"
      >
        {activating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Activate Service
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>

      <Button variant="ghost" className="w-full text-sm" onClick={onSkip}>
        Skip for now
      </Button>
    </div>
  );
}

// ════════════════════════════════════════
// Activating Screen (spinner / error)
// ════════════════════════════════════════
function ActivatingScreen({
  error,
  onRetry,
  onSkip,
}: {
  error: string | null;
  onRetry: () => void;
  onSkip: () => void;
}) {
  if (error) {
    return (
      <div className="space-y-6 text-center py-16 animate-fade-in">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h1 className="text-h2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <div className="space-y-2 pt-2">
          <Button onClick={onRetry} className="w-full h-12 text-base font-semibold rounded-xl">
            Try Again
          </Button>
          <Button variant="ghost" className="w-full text-sm" onClick={onSkip}>
            Skip and continue setup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center py-16 animate-fade-in">
      <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto" />
      <h1 className="text-h2">Connecting your provider…</h1>
      <p className="text-sm text-muted-foreground">This usually takes just a moment.</p>
    </div>
  );
}

// ════════════════════════════════════════
// Success Screen (inline confirmation)
// ════════════════════════════════════════
function SuccessScreen({
  providerName,
  categoryLabel,
  cadence,
  onDashboard,
  onExplorePlan,
}: {
  providerName: string;
  categoryLabel: string;
  cadence: string;
  onDashboard: () => void;
  onExplorePlan: () => void;
}) {
  return (
    <div className="space-y-6 text-center animate-fade-in">
      <CheckCircle className="h-16 w-16 text-accent mx-auto" />
      <h1 className="text-h2">You're all set!</h1>

      {/* Summary Card */}
      <Card>
        <CardContent className="pt-4 space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Provider</span>
            <span className="text-sm font-medium">{providerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Service</span>
            <span className="text-sm font-medium">{categoryLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Frequency</span>
            <span className="text-sm font-medium">{CADENCE_LABELS[cadence] ?? cadence}</span>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Your first service will be scheduled automatically.
      </p>

      <div className="space-y-3">
        <Button onClick={onDashboard} className="w-full h-12 text-base font-semibold rounded-xl">
          Go to Dashboard
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button variant="outline" onClick={onExplorePlan} className="w-full h-12">
          Explore Your Plan
        </Button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// Fallback: Invalid/Expired Invite
// ════════════════════════════════════════
function InviteFallbackScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full text-center space-y-4 animate-fade-in">
        <img src={handledLogo} alt="Handled Home" className="h-10 mx-auto" />
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
        <h1 className="text-xl font-bold">This invitation is no longer active</h1>
        <p className="text-sm text-muted-foreground">
          The invite link may have expired or been deactivated.
        </p>
        <div className="space-y-2">
          <Button className="w-full" onClick={() => navigate("/customer")}>
            Continue to Dashboard
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate("/customer/onboarding")}>
            Set up your home
          </Button>
        </div>
      </div>
    </div>
  );
}
