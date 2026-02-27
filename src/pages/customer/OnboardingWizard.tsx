import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingProgress, ONBOARDING_STEPS, type OnboardingStep } from "@/hooks/useOnboardingProgress";
import { useProperty, PropertyFormData, formatPetsForDisplay } from "@/hooks/useProperty";
import { useZoneLookup } from "@/hooks/useZoneLookup";
import { usePlans, type Plan } from "@/hooks/usePlans";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useServiceDayAssignment } from "@/hooks/useServiceDayAssignment";
import { useServiceDayActions } from "@/hooks/useServiceDayActions";
import { useServiceDayCapacity } from "@/hooks/useServiceDayCapacity";
import { SchedulingPreferences as SchedulingPreferencesComponent, type SchedulingPrefs } from "@/components/customer/SchedulingPreferences";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PlanCard } from "@/components/plans/PlanCard";
import { HandlesExplainer } from "@/components/plans/HandlesExplainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  AlertTriangle,
  Loader2,
  MapPin,
  Shield,
  Sparkles,
  CalendarCheck,
  Home,
  Bell,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

// ── Tier highlights (fallback) ──
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

// ── Step labels for progress bar ──
const STEP_LABELS: Record<OnboardingStep, string> = {
  property: "Your Home",
  zone_check: "Coverage",
  plan: "Pick Plan",
  subscribe: "Subscribe",
  service_day: "Service Day",
  routine: "Routine",
  complete: "All Set",
};

// ── Helpers ──
function stripNonDigits(val: string): string {
  return val.replace(/\D/g, "").slice(0, 5);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
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
// Main Wizard
// ════════════════════════════════════════
export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { progress, isLoading, currentStep, completedSteps, selectedPlanId, completeStep, goToStep, isSaving } =
    useOnboardingProgress();
  const { property, isLoading: propLoading } = useProperty();

  // D1-F2: Detect checkout=success and poll for subscription
  const checkoutSuccess = searchParams.get("checkout") === "success";
  const { data: subscription, isLoading: subLoading } = useCustomerSubscription(
    checkoutSuccess ? 2000 : undefined
  );

  // D1-F2: Auto-advance after successful checkout when subscription appears
  useEffect(() => {
    if (checkoutSuccess && subscription && ["active", "trialing"].includes(subscription.status)) {
      // Clear query param and advance past subscribe step
      setSearchParams({}, { replace: true });
      if (!completedSteps.includes("subscribe")) {
        completeStep("subscribe");
      }
    }
  }, [checkoutSuccess, subscription, completedSteps, completeStep, setSearchParams]);

  // D1-F1 FIX: Only redirect when onboarding is truly complete
  useEffect(() => {
    if (!isLoading && !propLoading && !subLoading && currentStep === "complete" && completedSteps.includes("routine")) {
      navigate("/customer", { replace: true });
    }
  }, [isLoading, propLoading, subLoading, currentStep, completedSteps, navigate]);

  if (isLoading || propLoading) {
    return (
      <div className="p-4 space-y-4 max-w-lg mx-auto animate-fade-in">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // D1-F2: Show verifying state after checkout redirect
  if (checkoutSuccess && (!subscription || !["active", "trialing"].includes(subscription.status ?? ""))) {
    return (
      <div className="max-w-lg mx-auto p-4 space-y-6 text-center animate-fade-in">
        <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto" />
        <h1 className="text-h2">Verifying your subscription…</h1>
        <p className="text-muted-foreground text-sm">This usually takes just a few seconds.</p>
      </div>
    );
  }

  // Auto-advance if steps already completed
  const effectiveStep = (() => {
    if (currentStep === "property" && property) return "zone_check";
    if (currentStep === "zone_check" && completedSteps.includes("zone_check")) return "plan";
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
      {/* Progress bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          {canGoBack ? (
            <button onClick={handleBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back
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
              {i <= 3 || i === ONBOARDING_STEPS.length - 1 ? STEP_LABELS[s] : ""}
            </span>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="px-4 mt-4">
        {effectiveStep === "property" && (
          <PropertyStep
            onComplete={async () => {
              await completeStep("property");
            }}
          />
        )}
        {effectiveStep === "zone_check" && (
          <ZoneCheckStep
            onComplete={async () => {
              await completeStep("zone_check");
            }}
            onWaitlist={() => navigate("/customer")}
          />
        )}
        {effectiveStep === "plan" && (
          <PlanStep
            onSelectPlan={async (planId: string) => {
              await completeStep("plan", { selected_plan_id: planId });
            }}
          />
        )}
        {effectiveStep === "subscribe" && (
          <SubscribeStep
            planId={selectedPlanId}
            onComplete={async () => {
              await completeStep("subscribe");
            }}
          />
        )}
        {effectiveStep === "service_day" && (
          <ServiceDayStep
            onComplete={async () => {
              await completeStep("service_day");
            }}
          />
        )}
        {effectiveStep === "routine" && (
          <RoutineStep
            onComplete={async () => {
              await completeStep("routine");
            }}
          />
        )}
        {effectiveStep === "complete" && <CompleteStep />}
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// Step 1: Property
// ════════════════════════════════════════
function PropertyStep({ onComplete }: { onComplete: () => Promise<void> }) {
  const { property, save, isSaving } = useProperty();
  const [form, setForm] = useState<PropertyFormData>({
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    gate_code: "",
    access_instructions: "",
    parking_instructions: "",
    pets_input: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState(false);

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
      await save(normalized);
      await onComplete();
    } catch {}
  };

  const isValid = Object.keys(validateProperty(form)).length === 0;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <Home className="h-10 w-10 text-accent mx-auto mb-3" />
        <h1 className="text-h2">Tell us about your home</h1>
        <p className="text-muted-foreground text-sm mt-1">We need a few details to match you with the right service team.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ob-street">Street Address *</Label>
          <Input id="ob-street" value={form.street_address} onChange={(e) => updateField("street_address", e.target.value)} placeholder="123 Main St" />
          {errors.street_address && <p className="text-xs text-destructive">{errors.street_address}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ob-city">City *</Label>
            <Input id="ob-city" value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="Los Angeles" />
            {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ob-state">State *</Label>
            <Input id="ob-state" value={form.state} onChange={(e) => updateField("state", e.target.value)} placeholder="TX" maxLength={2} className="uppercase" />
            {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ob-zip">Zip Code *</Label>
          <Input id="ob-zip" inputMode="numeric" value={form.zip_code} onChange={(e) => updateField("zip_code", e.target.value)} placeholder="90210" maxLength={5} />
          {errors.zip_code && <p className="text-xs text-destructive">{errors.zip_code}</p>}
        </div>

        {/* Optional fields collapsed */}
        <details className="group">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
            + Access details, pets, notes (optional)
          </summary>
          <div className="space-y-4 mt-3">
            <div className="space-y-1.5">
              <Label htmlFor="ob-gate">Gate Code</Label>
              <Input id="ob-gate" value={form.gate_code} onChange={(e) => updateField("gate_code", e.target.value)} placeholder="#1234" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-access">Access Instructions</Label>
              <Textarea id="ob-access" value={form.access_instructions} onChange={(e) => updateField("access_instructions", e.target.value)} placeholder="Enter through the side gate" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-parking">Parking Notes</Label>
              <Textarea id="ob-parking" value={form.parking_instructions} onChange={(e) => updateField("parking_instructions", e.target.value)} placeholder="Park in the driveway" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-pets">Pets</Label>
              <Input id="ob-pets" value={form.pets_input} onChange={(e) => updateField("pets_input", e.target.value)} placeholder="dog, cat" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-notes">Anything Else</Label>
              <Textarea id="ob-notes" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Anything we should know?" rows={2} />
            </div>
          </div>
        </details>
      </div>

      <Button onClick={handleSubmit} disabled={!isValid || isSaving} className="w-full h-12 text-base font-semibold rounded-xl">
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Continue
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

// ════════════════════════════════════════
// Step 2: Zone Check
// ════════════════════════════════════════
function ZoneCheckStep({ onComplete, onWaitlist }: { onComplete: () => Promise<void>; onWaitlist: () => void }) {
  const { property } = useProperty();
  const zipCode = property?.zip_code ?? "";
  const { zoneName, isLoading, isCovered, isNotCovered } = useZoneLookup(zipCode);
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);

  // Auto-advance if covered
  useEffect(() => {
    if (isCovered) {
      const timer = setTimeout(() => onComplete(), 1500);
      return () => clearTimeout(timer);
    }
  }, [isCovered, onComplete]);

  const handleJoinWaitlist = async () => {
    setJoining(true);
    try {
      const { error } = await supabase.functions.invoke("join-waitlist", {
        body: {
          email: user?.email ?? "",
          full_name: user?.user_metadata?.full_name ?? "",
          zip_code: zipCode,
          source: "onboarding",
        },
      });
      if (error) throw error;
      toast.success("You're on the list! We'll notify you when we launch in your area.");
      onWaitlist();
    } catch {
      toast.error("Couldn't join waitlist. Try again.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 text-center">
      <MapPin className="h-10 w-10 text-accent mx-auto" />
      <h1 className="text-h2">Checking your area</h1>
      <p className="text-muted-foreground text-sm">Zip code: <span className="font-mono font-semibold">{zipCode}</span></p>

      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <span className="text-muted-foreground">Looking up coverage…</span>
        </div>
      )}

      {isCovered && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="pt-6 text-center space-y-3">
            <CheckCircle className="h-10 w-10 text-accent mx-auto" />
            <p className="font-semibold text-foreground">You're covered!</p>
            <p className="text-sm text-muted-foreground">Zone: {zoneName}</p>
            <p className="text-xs text-muted-foreground animate-pulse">Continuing…</p>
          </CardContent>
        </Card>
      )}

      {isNotCovered && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-6 space-y-4">
            <AlertTriangle className="h-10 w-10 text-warning mx-auto" />
            <p className="font-semibold text-foreground">We're not in your area yet</p>
            <p className="text-sm text-muted-foreground">
              Handled Home is expanding quickly. Join the waitlist and we'll let you know the moment we launch near you.
            </p>
            <Button onClick={handleJoinWaitlist} disabled={joining} className="w-full">
              {joining ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
              Join Waitlist
            </Button>
            <Button variant="ghost" onClick={onWaitlist} className="w-full text-sm">
              Continue exploring
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ════════════════════════════════════════
// Step 3: Plan Selection
// ════════════════════════════════════════
function PlanStep({ onSelectPlan }: { onSelectPlan: (planId: string) => Promise<void> }) {
  const { data: plans, isLoading } = usePlans("active");
  const { property } = useProperty();
  const [selecting, setSelecting] = useState<string | null>(null);

  // Fetch plan handles
  const { data: allHandles } = useQuery({
    queryKey: ["plan_handles_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_handles").select("plan_id, handles_per_cycle");
      if (error) throw error;
      return new Map((data ?? []).map((r) => [r.plan_id, r]));
    },
  });

  // Zone availability
  const { data: customerZoneId } = useQuery({
    queryKey: ["zone_by_zip", property?.zip_code],
    enabled: !!property?.zip_code && /^\d{5}$/.test(property.zip_code),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zones")
        .select("id")
        .contains("zip_codes", [property!.zip_code])
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
  });

  const { data: allAvail } = useQuery({
    queryKey: ["plan_zone_availability_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_zone_availability").select("plan_id, zone_id, is_enabled");
      if (error) throw error;
      return data ?? [];
    },
  });

  const isPlanZoneEnabled = (planId: string): boolean => {
    if (!customerZoneId || !allAvail) return true;
    const row = allAvail.find((a) => a.plan_id === planId && a.zone_id === customerZoneId);
    return row?.is_enabled ?? true;
  };

  const handleSelect = async (planId: string) => {
    setSelecting(planId);
    try {
      await onSelectPlan(planId);
    } finally {
      setSelecting(null);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <Shield className="h-10 w-10 text-accent mx-auto mb-3" />
        <h1 className="text-h2">Pick your membership</h1>
        <p className="text-muted-foreground text-sm mt-1">One simple plan — we handle the rest.</p>
      </div>

      <HandlesExplainer />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {plans?.map((plan) => {
            const tierKey = getTierKey(plan.name);
            const dbHandles = allHandles?.get(plan.id);
            const isRecommended = plan.recommended_rank != null && plans.every(
              (p) => (p.recommended_rank ?? 0) <= (plan.recommended_rank ?? 0)
            );
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                isRecommended={isRecommended}
                zoneEnabled={isPlanZoneEnabled(plan.id)}
                handlesPerCycle={dbHandles?.handles_per_cycle}
                tierHighlights={TIER_HIGHLIGHTS[tierKey]}
                onBuildRoutine={
                  isPlanZoneEnabled(plan.id)
                    ? () => handleSelect(plan.id)
                    : undefined
                }
              />
            );
          })}
        </div>
      )}

      {selecting && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Saving selection…</span>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════
// Step 4: Subscribe
// ════════════════════════════════════════
function SubscribeStep({ planId, onComplete }: { planId: string | null; onComplete: () => Promise<void> }) {
  const { user } = useAuth();
  const { data: plan, isLoading } = useQuery({
    queryKey: ["plans", planId],
    enabled: !!planId,
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("*").eq("id", planId!).single();
      if (error) throw error;
      return data as Plan;
    },
  });
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user || !planId) return;
    setLoading(true);
    try {
      // D1-F8: Removed customer_id — edge function derives identity from JWT
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          plan_id: planId,
          customer_email: user.email,
          success_url: `${window.location.origin}/customer/onboarding?checkout=success`,
          cancel_url: `${window.location.origin}/customer/onboarding?checkout=cancel`,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        // Dev mode: simulate success
        toast.success("Subscription activated!");
        await onComplete();
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Could not start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div className="max-w-lg mx-auto space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-48 w-full" /></div>;
  }

  if (!plan) {
    return <p className="text-center text-muted-foreground py-8">Plan not found.</p>;
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <Sparkles className="h-10 w-10 text-accent mx-auto mb-3" />
        <h1 className="text-h2">Confirm your membership</h1>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{plan.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {plan.tagline && <p className="text-sm text-muted-foreground">{plan.tagline}</p>}
          {plan.display_price_text && <p className="text-2xl font-bold">{plan.display_price_text}</p>}
          <p className="text-xs text-muted-foreground">Billed every 4 weeks. Cancel anytime.</p>
        </CardContent>
      </Card>

      <Button className="w-full h-12 text-base font-semibold rounded-xl" onClick={handleCheckout} disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing…</> : "Subscribe Now"}
      </Button>
    </div>
  );
}

// ════════════════════════════════════════
// Step 5: Service Day (D1.5: scheduling UX polish — efficiency framing + preferences)
// ════════════════════════════════════════
function ServiceDayStep({ onComplete }: { onComplete: () => Promise<void> }) {
  const [completing, setCompleting] = useState(false);
  const { property } = useProperty();
  const { assignment, offers, isLoading: assignLoading, refetch } = useServiceDayAssignment(property?.id);
  const { createOrRefreshOffer, confirmServiceDay, savePreferences } = useServiceDayActions();
  const { capacities } = useServiceDayCapacity(assignment?.zone_id ?? null);

  const [prefs, setPrefs] = useState<SchedulingPrefs>({
    align_days_preference: false,
    must_be_home: false,
    must_be_home_window: null,
  });

  // D1.5-F4: Ref guard to prevent duplicate offer creation
  const offerCreated = useRef(false);

  // Auto-create offer if none exists
  useEffect(() => {
    if (!assignLoading && property?.id && !assignment && !offerCreated.current) {
      offerCreated.current = true;
      createOrRefreshOffer.mutate(property.id, { onSuccess: () => refetch() });
    }
  }, [assignLoading, property?.id, assignment]);

  const primaryOffer = offers.find((o) => o.offer_type === "primary");
  const offeredDay = primaryOffer?.offered_day_of_week ?? assignment?.day_of_week;
  const offeredCap = capacities.find((c) => c.day_of_week === offeredDay);
  const capacityUtilization = offeredCap
    ? Math.round((offeredCap.assigned_count / Math.max(1, offeredCap.max_homes + Math.floor(offeredCap.max_homes * offeredCap.buffer_percent / 100))) * 100)
    : undefined;

  const handleAccept = async () => {
    setCompleting(true);
    try {
      // Save scheduling preferences
      if (property?.id) {
        await savePreferences.mutateAsync({
          propertyId: property.id,
          alignDaysPreference: prefs.align_days_preference,
          mustBeHome: prefs.must_be_home,
          mustBeHomeWindow: prefs.must_be_home ? prefs.must_be_home_window : null,
        });
      }
      // Confirm the service day if there's an assignment
      if (assignment && assignment.status === "offered") {
        await confirmServiceDay.mutateAsync(assignment.id);
      }
      await onComplete();
    } catch {
      // Errors handled by mutation toasts
    } finally {
      setCompleting(false);
    }
  };

  if (assignLoading || createOrRefreshOffer.isPending) {
    return (
      <div className="max-w-lg mx-auto space-y-4 text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
        <p className="text-sm text-muted-foreground">Finding the best route day for your area…</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <CalendarCheck className="h-10 w-10 text-accent mx-auto mb-3" />
        <h1 className="text-h2">Your Service Day</h1>
        <p className="text-muted-foreground text-sm mt-1">
          We match you to the most efficient route day — so your provider arrives on time, every time.
        </p>
      </div>

      {/* Show the system-recommended day */}
      {assignment && offeredDay && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            <span className="text-xs font-medium text-accent uppercase tracking-wide">System Recommended</span>
          </div>
          <div className="text-center py-3">
            <p className="text-3xl font-bold text-accent">{capitalize(offeredDay)}</p>
            {capacityUtilization != null && capacityUtilization < 70 && (
              <p className="text-xs text-muted-foreground mt-1">Stable day — plenty of availability</p>
            )}
            {capacityUtilization != null && capacityUtilization >= 70 && capacityUtilization < 90 && (
              <p className="text-xs text-muted-foreground mt-1">Popular day in your area</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            This day has the best route density in your neighborhood, which means reliable, on-time service.
          </p>
        </Card>
      )}

      {/* Scheduling preferences */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Scheduling preferences</h3>
        <SchedulingPreferencesComponent
          value={prefs}
          onChange={setPrefs}
          alignmentExplanation={
            prefs.align_days_preference
              ? assignment?.alignment_explanation ?? null
              : null
          }
          compact
        />
      </div>

      <Button className="w-full h-12 text-base font-semibold rounded-xl" onClick={handleAccept} disabled={completing}>
        {completing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Accept & Continue
      </Button>
      <Button variant="ghost" className="w-full text-sm" onClick={async () => {
        setCompleting(true);
        try { await onComplete(); } finally { setCompleting(false); }
      }} disabled={completing}>
        Skip for now — I'll set this up later
      </Button>
    </div>
  );
}

// ════════════════════════════════════════
// Step 6: Routine (D1-F4: inline with complete action)
// ════════════════════════════════════════
function RoutineStep({ onComplete }: { onComplete: () => Promise<void> }) {
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await onComplete();
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 text-center">
      <Sparkles className="h-10 w-10 text-accent mx-auto" />
      <h1 className="text-h2">Build your routine</h1>
      <p className="text-muted-foreground text-sm">
        Choose which services you'd like on your regular visits. You can always swap, add, or remove services later from your dashboard.
      </p>

      <Button className="w-full" onClick={handleComplete} disabled={completing}>
        {completing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Continue to Complete Setup
      </Button>
      <Button variant="ghost" className="w-full text-sm" onClick={handleComplete} disabled={completing}>
        Skip for now
      </Button>
    </div>
  );
}

// ════════════════════════════════════════
// Step 7: Complete
// ════════════════════════════════════════
function CompleteStep() {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto space-y-6 text-center animate-fade-in">
      <CheckCircle className="h-16 w-16 text-accent mx-auto" />
      <h1 className="text-h2">You're all set!</h1>
      <p className="text-muted-foreground">
        Welcome to Handled Home. Your first service day is coming up — we'll send you a reminder.
      </p>

      <div className="space-y-3 pt-4">
        <Button className="w-full" onClick={() => navigate("/customer")}>
          Go to Dashboard
        </Button>
        <Button variant="outline" className="w-full" onClick={() => navigate("/customer/routine")}>
          Review My Routine
        </Button>
      </div>
    </div>
  );
}
