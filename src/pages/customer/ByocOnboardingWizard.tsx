import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useByocOnboardingContext } from "@/hooks/useByocOnboardingContext";
import { useProperty, PropertyFormData, formatPetsForDisplay } from "@/hooks/useProperty";
import { usePropertyCoverage, COVERAGE_CATEGORIES, type CoverageStatus, type SwitchIntent, type CoverageUpdate } from "@/hooks/usePropertyCoverage";
import { usePropertySignals, type SignalsFormData, SQFT_OPTIONS, YARD_OPTIONS, WINDOWS_OPTIONS, STORIES_OPTIONS, type SqftTier, type YardTier, type WindowsTier, type StoriesTier } from "@/hooks/usePropertySignals";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getCategoryLabel, getCategoryIcon, getCategoryGradient, CATEGORY_ORDER } from "@/lib/serviceCategories";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Home,
  Sparkles,
  AlertTriangle,
  Trees,
  Layers,
  AppWindow as AppWindowIcon,
  Leaf, Waves, Bug, Trash2, PawPrint, Droplets, Wrench,
} from "lucide-react";
import { toast } from "sonner";
import handledLogo from "@/assets/handled-home-logo.png";

// ── Types ──
type ByocStep = "recognition" | "confirm" | "property" | "home_setup" | "activating" | "services" | "plan" | "success";

const BYOC_STEPS: ByocStep[] = ["recognition", "confirm", "property", "home_setup", "activating", "services", "plan", "success"];

const STEP_LABELS: Record<ByocStep, string> = {
  recognition: "Provider",
  confirm: "Service",
  property: "Your Home",
  home_setup: "Details",
  activating: "Linking",
  services: "More",
  plan: "Plan",
  success: "Done",
};

const CADENCE_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  once: "One-time",
};

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

// Coverage icon map
const COVERAGE_ICON_MAP: Record<string, React.ElementType> = {
  Leaf, Waves, Sparkles, Bug, Trash2, PawPrint,
  AppWindow: AppWindowIcon, Home, Droplets, Wrench,
};

const COVERAGE_STATUS_OPTIONS: { value: CoverageStatus; short: string }[] = [
  { value: "SELF", short: "Myself" },
  { value: "PROVIDER", short: "Have one" },
  { value: "NONE", short: "None" },
  { value: "NA", short: "N/A" },
];

const SIZING_GROUPS = [
  { label: "Home Size", icon: Home, options: SQFT_OPTIONS, field: "home_sqft_tier" as const },
  { label: "Yard", icon: Trees, options: YARD_OPTIONS, field: "yard_tier" as const },
  { label: "Windows", icon: AppWindowIcon, options: WINDOWS_OPTIONS, field: "windows_tier" as const },
  { label: "Stories", icon: Layers, options: STORIES_OPTIONS, field: "stories_tier" as const },
];

// ════════════════════════════════════════
// Main Wizard
// ════════════════════════════════════════
export default function ByocOnboardingWizard() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { invite, activate, byocContext, isLoading: contextLoading } = useByocOnboardingContext(token);
  const [step, setStep] = useState<ByocStep>("recognition");
  const [selectedCadence, setSelectedCadence] = useState<string | null>(null);
  const [interestedCategories, setInterestedCategories] = useState<string[]>([]);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);

  const inviteData = invite.data;
  const cadence = selectedCadence || inviteData?.default_cadence || "weekly";
  const { progress } = useOnboardingProgress();

  // Persist interested_services to metadata
  const persistInterestedServices = useCallback(async (categories: string[]) => {
    if (!progress?.id) return;
    const metadata = (progress.metadata as Record<string, unknown>) ?? {};
    const updated = { ...metadata, interested_services: categories };
    const { error } = await supabase
      .from("customer_onboarding_progress")
      .update({ metadata: updated as unknown as Json })
      .eq("id", progress.id);
    if (error) console.error("[BYOC] Failed to persist interested_services:", error);
  }, [progress]);

  // Loading
  if (contextLoading || invite.isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-lg mx-auto animate-fade-in">
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

  const stepIndex = BYOC_STEPS.indexOf(step);
  const visibleSteps = BYOC_STEPS.filter((s): s is ByocStep => s !== "activating");
  const visibleIndex = visibleSteps.indexOf(step as ByocStep);
  const progressPercent = Math.round(((visibleIndex >= 0 ? visibleIndex : stepIndex) / (visibleSteps.length - 1)) * 100);

  const canGoBack = stepIndex > 0 && step !== "activating" && step !== "success";
  const handleBack = () => {
    let prevIdx = stepIndex - 1;
    if (BYOC_STEPS[prevIdx] === "activating") prevIdx--;
    if (prevIdx >= 0) setStep(BYOC_STEPS[prevIdx]);
  };

  return (
    <div className="animate-fade-in pb-24">
      {/* Progress bar */}
      {step !== "activating" && (
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
              Step {(visibleIndex >= 0 ? visibleIndex : stepIndex) + 1} of {visibleSteps.length}
            </span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      )}

      {/* Step content */}
      <div className="px-4 mt-4">
        {step === "recognition" && byocContext && (
          <RecognitionScreen
            providerName={byocContext.providerName}
            providerLogoUrl={(invite.data?.provider_org?.logo_url) ?? null}
            onContinue={() => setStep("confirm")}
            onNewHere={() => navigate("/customer/onboarding")}
          />
        )}
        {step === "confirm" && byocContext && (
          <ConfirmServiceScreen
            providerName={byocContext.providerName}
            serviceName={byocContext.serviceName}
            categoryLabel={byocContext.categoryLabel}
            defaultCadence={cadence}
            levelLabel={inviteData?.level?.label ?? null}
            durationMinutes={inviteData?.sku?.duration_minutes ?? null}
            onConfirm={(c) => {
              if (c) setSelectedCadence(c);
              setStep("property");
            }}
          />
        )}
        {step === "property" && (
          <PropertyScreen onComplete={(propertyId) => {
            if (propertyId) setCreatedPropertyId(propertyId);
            setStep("home_setup");
          }} />
        )}
        {step === "home_setup" && (
          <HomeSetupScreen
            onComplete={async () => {
              // Transition to activating spinner
              setStep("activating");
              try {
                // Re-check invite validity
                const { data: freshInvite } = await supabase
                  .from("byoc_invite_links")
                  .select("is_active")
                  .eq("token", token!)
                  .maybeSingle();

                if (!freshInvite?.is_active) {
                  toast.error("This invitation is no longer active.");
                  setStep("services"); // Skip activation, continue setup
                  return;
                }

                // Use the property_id passed forward from PropertyScreen
                let propertyId = createdPropertyId;
                if (!propertyId) {
                  // Fallback: query most recent property
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
                setStep("services");
              } catch (err: any) {
                if (err.message?.includes("already activated") || err.message?.includes("409")) {
                  toast.info("You've already activated this invite.");
                  navigate("/customer");
                  return;
                }
                toast.error(err.message || "Connection failed. Please try again.");
                setStep("home_setup");
              }
            }}
          />
        )}
        {step === "activating" && <ActivatingScreen />}
        {step === "services" && byocContext && (
          <ServicesScreen
            excludeCategory={byocContext.categoryKey}
            zoneId={byocContext.zoneId}
            interested={interestedCategories}
            onToggle={(cat) => {
              setInterestedCategories((prev) =>
                prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
              );
            }}
            onContinue={async () => {
              await persistInterestedServices(interestedCategories);
              if (interestedCategories.length > 0) {
                setStep("plan");
              } else {
                setStep("success");
              }
            }}
            onSkip={async () => {
              await persistInterestedServices([]);
              setStep("success");
            }}
          />
        )}
        {step === "plan" && (
          <PlanSummaryScreen
            interestedCategories={interestedCategories}
            onContinue={() => setStep("success")}
            onSkip={() => setStep("success")}
          />
        )}
        {step === "success" && byocContext && (
          <SuccessScreen
            providerName={byocContext.providerName}
            onDashboard={() => navigate("/customer")}
          />
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// Screen 1: Provider Recognition
// ════════════════════════════════════════
function RecognitionScreen({
  providerName,
  providerLogoUrl,
  onContinue,
  onNewHere,
}: {
  providerName: string;
  providerLogoUrl: string | null;
  onContinue: () => void;
  onNewHere: () => void;
}) {
  const initial = providerName.charAt(0).toUpperCase();

  return (
    <div className="max-w-lg mx-auto space-y-6 text-center">
      {/* Provider avatar */}
      <div className="flex justify-center">
        {providerLogoUrl ? (
          <img
            src={providerLogoUrl}
            alt={providerName}
            className="h-20 w-20 rounded-full object-cover border-4 border-primary/20"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold border-4 border-primary/20">
            {initial}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h1 className="text-h2">Your provider is already on Handled Home</h1>
        <p className="text-muted-foreground text-sm">
          {providerName} uses Handled Home to keep service simpler, more organized, and easier to manage.
        </p>
      </div>

      <Button onClick={onContinue} className="w-full h-12 text-base font-semibold rounded-xl">
        Continue
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>

      <button onClick={onNewHere} className="text-sm text-muted-foreground hover:text-foreground underline">
        I'm new here
      </button>
    </div>
  );
}

// ════════════════════════════════════════
// Screen 2: Confirm Service
// ════════════════════════════════════════
function ConfirmServiceScreen({
  providerName,
  serviceName,
  categoryLabel,
  defaultCadence,
  levelLabel,
  durationMinutes,
  onConfirm,
}: {
  providerName: string;
  serviceName: string;
  categoryLabel: string;
  defaultCadence: string;
  levelLabel: string | null;
  durationMinutes: number | null;
  onConfirm: (cadence?: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [cadence, setCadence] = useState(defaultCadence);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <CheckCircle className="h-10 w-10 text-accent mx-auto mb-3" />
        <h1 className="text-h2">We found your service</h1>
        <p className="text-muted-foreground text-sm mt-1">Does this look right?</p>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Provider</span>
            <span className="text-sm font-medium">{providerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Service</span>
            <span className="text-sm font-medium">{serviceName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Category</span>
            <span className="text-sm font-medium">{categoryLabel}</span>
          </div>
          {levelLabel && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Service Level</span>
              <span className="text-sm font-medium">{levelLabel}</span>
            </div>
          )}
          {durationMinutes && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Est. Duration</span>
              <span className="text-sm font-medium">{durationMinutes} min</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Frequency</span>
            <span className="text-sm font-medium">{CADENCE_LABELS[cadence] ?? cadence}</span>
          </div>
        </CardContent>
      </Card>

      {editing && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm font-medium mb-2">Preferred frequency</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CADENCE_LABELS).map(([val, label]) => (
                <Button
                  key={val}
                  variant={cadence === val ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCadence(val)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={() => onConfirm(cadence)} className="w-full h-12 text-base font-semibold rounded-xl">
        Yes, looks right
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>

      {!editing && (
        <Button variant="ghost" className="w-full text-sm" onClick={() => setEditing(true)}>
          Edit details
        </Button>
      )}
    </div>
  );
}

// ════════════════════════════════════════
// Screen 3: Property
// ════════════════════════════════════════
function PropertyScreen({ onComplete }: { onComplete: (propertyId?: string) => void }) {
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
      const saved = await save(normalized);
      onComplete(saved?.id);
    } catch {
      toast.error("Failed to save property. Please try again.");
    }
  };

  const isValid = Object.keys(validateProperty(form)).length === 0;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <Home className="h-10 w-10 text-accent mx-auto mb-3" />
        <h1 className="text-h2">Tell us about your home</h1>
        <p className="text-muted-foreground text-sm mt-1">
          This helps us organize your services and recommend what your home might need.
        </p>
      </div>

      <div className="space-y-4">
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

        <details className="group">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
            + Access details, pets, notes (optional)
          </summary>
          <div className="space-y-4 mt-3">
            <div className="space-y-1.5">
              <Label htmlFor="byoc-gate">Gate Code</Label>
              <Input id="byoc-gate" value={form.gate_code} onChange={(e) => updateField("gate_code", e.target.value)} placeholder="#1234" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="byoc-access">Access Instructions</Label>
              <Textarea id="byoc-access" value={form.access_instructions} onChange={(e) => updateField("access_instructions", e.target.value)} placeholder="Enter through the side gate" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="byoc-pets">Pets</Label>
              <Input id="byoc-pets" value={form.pets_input} onChange={(e) => updateField("pets_input", e.target.value)} placeholder="dog, cat" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="byoc-notes">Anything Else</Label>
              <Textarea id="byoc-notes" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Anything we should know?" rows={2} />
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
// Screen 4: Home Setup (Coverage + Sizing)
// ════════════════════════════════════════
function HomeSetupScreen({ onComplete }: { onComplete: () => Promise<void> }) {
  const [phase, setPhase] = useState<"coverage" | "sizing">("coverage");
  const { coverage, save: saveCoverage, isSaving: savingCoverage } = usePropertyCoverage();
  const { signals, save: saveSizing, isSaving: savingSizing } = usePropertySignals();
  const [completing, setCompleting] = useState(false);

  const [selections, setSelections] = useState<
    Record<string, { status: CoverageStatus; intent: SwitchIntent | null }>
  >({});

  const [sizingForm, setSizingForm] = useState<SignalsFormData>({
    home_sqft_tier: null, yard_tier: null, windows_tier: null, stories_tier: null,
  });

  useEffect(() => {
    const init: typeof selections = {};
    for (const row of coverage) {
      init[row.category_key] = {
        status: row.coverage_status as CoverageStatus,
        intent: row.switch_intent as SwitchIntent | null,
      };
    }
    for (const cat of COVERAGE_CATEGORIES) {
      if (!init[cat.key]) init[cat.key] = { status: "NONE", intent: null };
    }
    setSelections(init);
  }, [coverage]);

  useEffect(() => {
    if (signals) {
      setSizingForm({
        home_sqft_tier: (signals.home_sqft_tier as SqftTier) ?? null,
        yard_tier: (signals.yard_tier as YardTier) ?? null,
        windows_tier: (signals.windows_tier as WindowsTier) ?? null,
        stories_tier: (signals.stories_tier as StoriesTier) ?? null,
      });
    }
  }, [signals]);

  const setStatus = (key: string, status: CoverageStatus) => {
    setSelections((prev) => ({
      ...prev,
      [key]: { status, intent: status === "SELF" || status === "NONE" ? prev[key]?.intent ?? null : null },
    }));
  };

  const handleCoverageNext = async () => {
    const updates: CoverageUpdate[] = COVERAGE_CATEGORIES.map((cat) => ({
      category_key: cat.key,
      coverage_status: selections[cat.key]?.status ?? "NONE",
      switch_intent: selections[cat.key]?.intent ?? null,
    }));
    try {
      await saveCoverage(updates);
      setPhase("sizing");
    } catch {
      toast.error("Failed to save coverage. Please try again.");
    }
  };

  const handleSizingComplete = async () => {
    setCompleting(true);
    try {
      await saveSizing(sizingForm);
      await onComplete();
    } catch {
      toast.error("Failed to save home details. Please try again.");
    } finally {
      setCompleting(false);
    }
  };

  const handleSkip = async () => {
    setCompleting(true);
    try { await onComplete(); } finally { setCompleting(false); }
  };

  if (phase === "coverage") {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div className="text-center">
          <Sparkles className="h-10 w-10 text-accent mx-auto mb-3" />
          <h1 className="text-h2">A few quick details</h1>
          <p className="text-muted-foreground text-sm mt-1">
            These help providers prepare for service.
          </p>
        </div>

        <div className="space-y-2.5">
          {COVERAGE_CATEGORIES.map((cat) => {
            const Icon = COVERAGE_ICON_MAP[cat.icon] ?? Home;
            const sel = selections[cat.key];
            return (
              <div key={cat.key} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm font-medium flex-1 min-w-0 truncate">{cat.label}</span>
                <div className="flex gap-1">
                  {COVERAGE_STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStatus(cat.key, opt.value)}
                      className={`rounded-lg py-1.5 px-2 text-[11px] font-medium transition-all border ${
                        sel?.status === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary"
                      }`}
                    >
                      {opt.short}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <Button onClick={handleCoverageNext} disabled={savingCoverage} className="w-full h-12 text-base font-semibold rounded-xl">
          {savingCoverage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Next: Home Size
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button variant="ghost" className="w-full text-sm" onClick={handleSkip} disabled={completing}>
          Skip for now
        </Button>
      </div>
    );
  }

  const filledCount = Object.values(sizingForm).filter(Boolean).length;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="text-center">
        <Home className="h-10 w-10 text-accent mx-auto mb-3" />
        <h1 className="text-h2">Home size (quick estimate)</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Helps us pick the right service level. All fields optional.
        </p>
      </div>

      <div className="space-y-5">
        {SIZING_GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.field} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <span className="font-medium text-sm">{group.label}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSizingForm((prev) => ({ ...prev, [group.field]: opt.value }))}
                    className={`rounded-xl py-2 px-3.5 text-sm font-medium transition-all border ${
                      sizingForm[group.field] === opt.value
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card text-muted-foreground border-border hover:bg-secondary"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">{filledCount}/4 fields set</p>

      <Button onClick={handleSizingComplete} disabled={savingSizing || completing} className="w-full h-12 text-base font-semibold rounded-xl">
        {(savingSizing || completing) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Continue
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
      <Button variant="ghost" className="w-full text-sm" onClick={handleSkip} disabled={completing}>
        Skip for now
      </Button>
    </div>
  );
}

// ════════════════════════════════════════
// Activating Screen (spinner)
// ════════════════════════════════════════
function ActivatingScreen() {
  return (
    <div className="max-w-lg mx-auto space-y-6 text-center py-16 animate-fade-in">
      <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto" />
      <h1 className="text-h2">Connecting your provider…</h1>
      <p className="text-sm text-muted-foreground">This usually takes just a moment.</p>
    </div>
  );
}

// ════════════════════════════════════════
// Screen 5: Other Services (by category)
// ════════════════════════════════════════
function ServicesScreen({
  excludeCategory,
  zoneId,
  interested,
  onToggle,
  onContinue,
  onSkip,
}: {
  excludeCategory: string;
  zoneId: string;
  interested: string[];
  onToggle: (cat: string) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  // Query zone_category_providers for active categories in this zone
  const { data: availableCategories } = useQuery({
    queryKey: ["byoc_zone_categories", zoneId],
    enabled: !!zoneId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zone_category_providers")
        .select("category")
        .eq("zone_id", zoneId)
        .eq("role", "primary");

      if (error) throw error;
      if (!data) return [];

      // Deduplicate and exclude the BYOC category
      const categories = [...new Set(data.map((r) => r.category))].filter(
        (c) => c !== excludeCategory
      );

      // Sort by CATEGORY_ORDER
      const orderOf = (c: string) => { const i = CATEGORY_ORDER.indexOf(c); return i >= 0 ? i : 99; };
      return categories.sort((a, b) => orderOf(a) - orderOf(b));
    },
  });

  const cats = availableCategories ?? [];

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <Sparkles className="h-10 w-10 text-accent mx-auto mb-3" />
        <h1 className="text-h2">Many homes also need help with:</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add what interests you, or skip for now.
        </p>
      </div>

      {cats.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No additional services available in your area yet.
        </p>
      ) : (
        <div className="space-y-2">
          {cats.map((cat) => {
            const Icon = getCategoryIcon(cat);
            const label = getCategoryLabel(cat);
            const isSelected = interested.includes(cat);

            return (
              <button
                key={cat}
                onClick={() => onToggle(cat)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:bg-secondary/50"
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-primary/10" : "bg-accent/10"
                }`}>
                  <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-accent"}`} />
                </div>
                <span className="text-sm font-medium flex-1 text-left">{label}</span>
                {isSelected && <CheckCircle className="h-5 w-5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      <Button onClick={onContinue} className="w-full h-12 text-base font-semibold rounded-xl">
        Continue
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
      <Button variant="ghost" className="w-full text-sm" onClick={onSkip}>
        Skip for now
      </Button>
    </div>
  );
}

// ════════════════════════════════════════
// Screen 6: Plan Summary (conditional)
// ════════════════════════════════════════
function PlanSummaryScreen({
  interestedCategories,
  onContinue,
  onSkip,
}: {
  interestedCategories: string[];
  onContinue: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <Home className="h-10 w-10 text-accent mx-auto mb-3" />
        <h1 className="text-h2">Here's the simplest way to handle these</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Estimated monthly total for added services
        </p>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-3">
          {interestedCategories.map((cat) => {
            const Icon = getCategoryIcon(cat);
            return (
              <div key={cat} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm font-medium">{getCategoryLabel(cat)}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Pricing details will be available once your plan is configured. You can always adjust later.
      </p>

      <Button onClick={onContinue} className="w-full h-12 text-base font-semibold rounded-xl">
        Start my plan
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
      <Button variant="ghost" className="w-full text-sm" onClick={onSkip}>
        Keep services separate
      </Button>
    </div>
  );
}

// ════════════════════════════════════════
// Screen 7: Success
// ════════════════════════════════════════
function SuccessScreen({
  providerName,
  onDashboard,
}: {
  providerName: string;
  onDashboard: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto space-y-6 text-center animate-fade-in">
      <CheckCircle className="h-16 w-16 text-accent mx-auto" />
      <h1 className="text-h2">Your home is ready</h1>

      <div className="space-y-2 text-sm text-muted-foreground text-left max-w-xs mx-auto">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-accent shrink-0" />
          <span>{providerName} is connected</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-accent shrink-0" />
          <span>See upcoming visits</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-accent shrink-0" />
          <span>View service photos</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-accent shrink-0" />
          <span>Add more services anytime</span>
        </div>
      </div>

      <Button onClick={onDashboard} className="w-full h-12 text-base font-semibold rounded-xl">
        Go to Dashboard
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
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
      <div className="max-w-md w-full text-center space-y-4 animate-fade-in">
        <img src={handledLogo} alt="Handled Home" className="h-10 mx-auto" />
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
        <h1 className="text-xl font-bold">This invitation is no longer active</h1>
        <p className="text-sm text-muted-foreground">
          You can still continue setting up your home and add services manually.
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
