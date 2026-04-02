import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, CheckCircle, Clock, AlertCircle, Sparkles, Users, Loader2, Megaphone, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderApplication, ByocEstimate } from "@/hooks/useProviderApplication";
import { useZoneReadiness, ZoneReadinessResult } from "@/hooks/useZoneReadiness";
import OpportunityBanner, {
  mapStateToBannerVariant,
  type BannerVariant,
} from "@/components/provider/OpportunityBanner";

const CATEGORIES = [
  { value: "lawn_care", label: "Lawn Care" },
  { value: "cleaning", label: "House Cleaning" },
  { value: "pool", label: "Pool Service" },
  { value: "pest_control", label: "Pest Control" },
  { value: "landscaping", label: "Landscaping" },
  { value: "handyman", label: "Handyman" },
  { value: "windows", label: "Windows" },
  { value: "gutters", label: "Gutters" },
  { value: "pressure_wash", label: "Pressure Wash" },
  { value: "trash_bins", label: "Trash Bins" },
];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  open: <CheckCircle className="h-5 w-5 text-success" />,
  soft_launch: <Sparkles className="h-5 w-5 text-primary" />,
  waitlist: <Clock className="h-5 w-5 text-warning" />,
  not_supported: <Megaphone className="h-5 w-5 text-primary" />,
  submitted: <Clock className="h-5 w-5 text-primary" />,
  under_review: <Clock className="h-5 w-5 text-primary" />,
  approved: <CheckCircle className="h-5 w-5 text-success" />,
  approved_conditional: <CheckCircle className="h-5 w-5 text-warning" />,
  waitlisted: <Clock className="h-5 w-5 text-warning" />,
  rejected: <AlertCircle className="h-5 w-5 text-destructive" />,
};

const STATUS_MESSAGES: Record<string, { title: string; desc: string }> = {
  submitted: { title: "Application submitted", desc: "We're reviewing your application. You'll be notified when there's an update." },
  under_review: { title: "Under review", desc: "Our team is reviewing your application. Hang tight!" },
  approved: { title: "You're approved!", desc: "Complete onboarding to start earning." },
  approved_conditional: { title: "Approved with conditions", desc: "Complete onboarding. Check your notifications for details." },
  waitlisted: { title: "We're building your zone", desc: "We're working on launching in your area. Help us get there faster — refer providers you trust in the categories below." },
  rejected: { title: "Not approved", desc: "Check notifications for details. You may reapply later." },
  draft: { title: "Draft application", desc: "Continue your application below." },
};

const ZONE_STATUS_LABELS: Record<string, string> = {
  CLOSED: "Building",
  WAITLIST_ONLY: "Building",
  PROVIDER_RECRUITING: "Recruiting",
  SOFT_LAUNCH: "Launching soon",
  OPEN: "Active",
  PROTECT_QUALITY: "Building",
};

const TOTAL_STEPS = 5;

export default function ProviderApply() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [homeBaseZip, setHomeBaseZip] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [zipInput, setZipInput] = useState("");
  const [zipCodes, setZipCodes] = useState<string[]>([]);
  const [readiness, setReadiness] = useState<ZoneReadinessResult | null>(null);
  const [bannerVariant, setBannerVariant] = useState<BannerVariant | null>(null);

  // BYOC intake
  const [hasByoc, setHasByoc] = useState<boolean | null>(null);
  const [byocEstCount, setByocEstCount] = useState("1-10");
  const [byocWillingness, setByocWillingness] = useState("medium");
  const [byocRelType, setByocRelType] = useState("recurring");
  const [byocWillingInvite, setByocWillingInvite] = useState(true);

  const { application, submitApplication } = useProviderApplication();
  const zoneCheck = useZoneReadiness();

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const addZip = () => {
    const zip = zipInput.trim();
    if (zip && /^\d{5}$/.test(zip) && !zipCodes.includes(zip)) {
      setZipCodes([...zipCodes, zip]);
      setZipInput("");
    }
  };

  const removeZip = (zip: string) => setZipCodes(zipCodes.filter((z) => z !== zip));

  const allZips = useMemo(() => {
    const zips = [...zipCodes];
    if (homeBaseZip && /^\d{5}$/.test(homeBaseZip) && !zips.includes(homeBaseZip)) {
      zips.unshift(homeBaseZip);
    }
    return zips;
  }, [zipCodes, homeBaseZip]);

  const checkReadiness = async () => {
    try {
      const primaryCategory = selectedCategories[0];
      const result = await zoneCheck.mutateAsync({
        zip_codes: allZips,
        category: primaryCategory,
      });
      setReadiness(result);

      // Determine banner variant from zone state
      const bestZone = result.matched_zones?.[0];
      if (bestZone) {
        // TODO: hasFoundingSlots and categoriesFilled should come from
        // check_zone_readiness RPC once it returns founding_partner_slots data.
        // For now, use safe defaults that show the most relevant variant.
        const hasFoundingSlots = true;
        const categoriesFilled = false;
        const variant = mapStateToBannerVariant(
          bestZone.launch_status,
          hasFoundingSlots,
          categoriesFilled,
        );
        setBannerVariant(variant);
      } else {
        setBannerVariant("HELP_LAUNCH");
      }
    } catch (err: any) {
      toast.error(err?.message || "Could not check zone availability. Please try again.");
    }
  };

  const handleSubmit = async () => {
    const primaryCategory = selectedCategories[0];
    const byocEstimate: ByocEstimate | undefined =
      hasByoc
        ? {
            estimated_count: byocEstCount,
            willingness: byocWillingness,
            relationship_type: byocRelType,
            willing_to_invite: byocWillingInvite,
          }
        : undefined;

    try {
      await submitApplication.mutateAsync({
        category: primaryCategory,
        zip_codes: allZips,
        requested_categories: selectedCategories,
        byoc_estimate_json: byocEstimate,
        pitch_variant_seen: bannerVariant ?? undefined,
      });
      // Navigate to status screen after successful submission
      navigate("/provider/apply", { replace: true });
    } catch {
      // Error toast handled by hook's onError
    }
  };

  // ─── Loading state ───
  if (application.isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── Existing application status screen (skip draft — let them re-enter wizard) ───
  if (application.data && !readiness && application.data.status !== "draft") {
    const app = application.data;
    const status = app.status as string;
    const msg = STATUS_MESSAGES[status] ?? STATUS_MESSAGES.submitted;
    const showRecruitment = status === "waitlisted" || status === "submitted" || status === "under_review";
    const appZips = ((app as any).zip_codes ?? []) as string[];

    return (
      <div className="animate-fade-in p-4 pb-24 space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-h2">Your Application</h1>
        </div>
        <Card>
          <CardContent className="py-6 text-center space-y-3">
            {STATUS_ICONS[status] ?? STATUS_ICONS.submitted}
            <h2 className="text-lg font-semibold">{msg.title}</h2>
            <p className="text-sm text-muted-foreground">{msg.desc}</p>
            {app.requested_categories && app.requested_categories.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center pt-2">
                {app.requested_categories.map((c: string) => (
                  <Badge key={c} variant="secondary" className="text-xs capitalize">
                    {c.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            )}
            {(status === "approved" || status === "approved_conditional") && (
              <Button
                onClick={() => navigate("/provider/onboarding")}
                className="w-full mt-4"
              >
                Start Onboarding
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Category gaps — real zone data */}
        {showRecruitment && appZips.length > 0 && (
          <CategoryGapsCard zipCodes={appZips} />
        )}

        {/* Referral progress + incentive */}
        {showRecruitment && <ReferralProgressCard />}

        {/* Know someone? Referral form */}
        {showRecruitment && (
          <ProviderReferralForm
            defaultZip={(app as any).zip_codes?.[0] ?? ""}
          />
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-h2">Apply to Handled Home</h1>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              s <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* ── Step 1: Category selection (multi-select) ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">What services do you provide?</h2>
            <p className="text-sm text-muted-foreground">
              Select all that apply. You can add more later.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((c) => {
              const selected = selectedCategories.includes(c.value);
              return (
                <Card
                  key={c.value}
                  className={`cursor-pointer transition-all ${
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => toggleCategory(c.value)}
                >
                  <CardContent className="py-3.5 text-center flex items-center justify-center gap-2">
                    {selected && (
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <p className="text-sm font-medium">{c.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {selectedCategories.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {selectedCategories.length} selected
            </p>
          )}
          <Button
            className="w-full"
            disabled={selectedCategories.length === 0}
            onClick={() => setStep(2)}
          >
            Continue
          </Button>
        </div>
      )}

      {/* ── Step 2: Location & Coverage ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Where do you work?</h2>
            <p className="text-sm text-muted-foreground">
              We match you to local jobs in your service area.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="homeBase" className="text-sm font-medium">
              Home base ZIP
            </Label>
            <Input
              id="homeBase"
              placeholder="Your home base zip code"
              value={homeBaseZip}
              onChange={(e) => setHomeBaseZip(e.target.value)}
              maxLength={5}
            />
            <p className="text-xs text-muted-foreground">
              Your home base helps us build tighter routes.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone number <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="phone"
              placeholder="Your phone number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Helps us match your application if you were referred by phone.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Service ZIPs</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add zip code"
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addZip()}
                maxLength={5}
              />
              <Button variant="outline" onClick={addZip}>
                Add
              </Button>
            </div>
          </div>

          {zipCodes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {zipCodes.map((z) => (
                <Badge
                  key={z}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeZip(z)}
                >
                  <MapPin className="h-3 w-3 mr-1" /> {z} ×
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={
                !homeBaseZip || !/^\d{5}$/.test(homeBaseZip) || allZips.length === 0
              }
              onClick={async () => {
                // Save phone to profile if provided
                if (phoneNumber) {
                  const { data: { user: authUser } } = await supabase.auth.getUser();
                  if (authUser?.id) {
                    await (supabase.from("profiles") as any)
                      .update({ phone: phoneNumber })
                      .eq("user_id", authUser.id);
                  }
                }
                await checkReadiness();
                setStep(3);
              }}
            >
              {zoneCheck.isPending ? "Checking..." : "See opportunities"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Opportunity Banner ── */}
      {step === 3 && (
        <div className="space-y-4">
          {bannerVariant && (
            <OpportunityBanner
              variant={bannerVariant}
              zoneName={readiness?.matched_zones?.[0]?.zone_name ?? "your area"}
              onApply={() => setStep(4)}
            />
          )}

          {readiness && readiness.matched_zones.length > 1 && (
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground mb-2">
                  Matched zones
                </p>
                <div className="space-y-1">
                  {readiness.matched_zones.map((z) => (
                    <div
                      key={z.zone_id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{z.zone_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {ZONE_STATUS_LABELS[z.launch_status] ?? "Building"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Button variant="outline" onClick={() => setStep(2)} className="w-full">
            Back
          </Button>
        </div>
      )}

      {/* ── Step 4: BYOC Intake ── */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              Do you have existing customers in these areas?
            </h2>
            <p className="text-sm text-muted-foreground">
              This helps us prioritize Founding Partner offers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card
              className={`cursor-pointer transition-all ${
                hasByoc === true
                  ? "border-primary bg-primary/5"
                  : "hover:bg-accent/50"
              }`}
              onClick={() => setHasByoc(true)}
            >
              <CardContent className="py-4 text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-sm font-medium">Yes</p>
              </CardContent>
            </Card>
            <Card
              className={`cursor-pointer transition-all ${
                hasByoc === false
                  ? "border-primary bg-primary/5"
                  : "hover:bg-accent/50"
              }`}
              onClick={() => setHasByoc(false)}
            >
              <CardContent className="py-4 text-center">
                <p className="text-sm font-medium text-muted-foreground">No</p>
              </CardContent>
            </Card>
          </div>

          {hasByoc && (
            <Card className="animate-fade-in">
              <CardContent className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Estimated customers you could invite
                  </Label>
                  <RadioGroup
                    value={byocEstCount}
                    onValueChange={setByocEstCount}
                    className="flex flex-wrap gap-2"
                  >
                    {["1-10", "11-50", "51-200", "200+"].map((v) => (
                      <div key={v} className="flex items-center gap-1.5">
                        <RadioGroupItem value={v} id={`cnt-${v}`} />
                        <Label htmlFor={`cnt-${v}`} className="text-sm">
                          {v}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    How willing are they to switch?
                  </Label>
                  <RadioGroup
                    value={byocWillingness}
                    onValueChange={setByocWillingness}
                    className="flex gap-3"
                  >
                    {["low", "medium", "high"].map((v) => (
                      <div key={v} className="flex items-center gap-1.5">
                        <RadioGroupItem value={v} id={`will-${v}`} />
                        <Label
                          htmlFor={`will-${v}`}
                          className="text-sm capitalize"
                        >
                          {v}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Relationship type
                  </Label>
                  <RadioGroup
                    value={byocRelType}
                    onValueChange={setByocRelType}
                    className="flex gap-3"
                  >
                    {[
                      { value: "recurring", label: "Mostly recurring" },
                      { value: "mixed", label: "Mixed" },
                      { value: "one_time", label: "Mostly one-time" },
                    ].map((v) => (
                      <div key={v.value} className="flex items-center gap-1.5">
                        <RadioGroupItem value={v.value} id={`rel-${v.value}`} />
                        <Label htmlFor={`rel-${v.value}`} className="text-sm">
                          {v.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="willingInvite"
                    checked={byocWillingInvite}
                    onCheckedChange={(v) => setByocWillingInvite(!!v)}
                  />
                  <Label htmlFor="willingInvite" className="text-sm">
                    I'd be willing to invite them via a script you provide
                  </Label>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={hasByoc === null}
              onClick={() => setStep(5)}
            >
              {hasByoc === false ? "Skip & Continue" : "Continue"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 5: Review & Submit ── */}
      {step === 5 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Review & Submit</h2>

          <Card>
            <CardContent className="py-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Categories</p>
                <div className="flex flex-wrap gap-1">
                  {selectedCategories.map((c) => (
                    <Badge key={c} variant="secondary" className="capitalize text-xs">
                      {c.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Home base</span>
                <span className="text-sm font-medium">{homeBaseZip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Service ZIPs
                </span>
                <span className="text-sm font-medium">
                  {allZips.join(", ")}
                </span>
              </div>
              {hasByoc && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    BYOC estimate
                  </span>
                  <span className="text-sm font-medium">
                    {byocEstCount} customers ({byocWillingness} willingness)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(4)}>
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitApplication.isPending}
            >
              {submitApplication.isPending
                ? "Submitting..."
                : "Submit Application"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReferralProgressCard() {
  const { user } = useAuth();
  const referralCount = useQuery({
    queryKey: ["my-referral-count", user?.email],
    queryFn: async () => {
      if (!user?.email) return 0;
      const { count, error } = await (supabase.from("provider_referrals") as any)
        .select("id", { count: "exact", head: true })
        .eq("referrer_email", user.email);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!user?.email,
  });

  const count = referralCount.data ?? 0;
  const target = 3;
  const hasReached = count >= target;

  if (referralCount.isLoading) return null;

  return (
    <Card>
      <CardContent className="py-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {count > 0 ? `You've referred ${count} provider${count !== 1 ? "s" : ""}` : "Refer providers to get priority"}
          </p>
          {hasReached && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs">
              Priority eligible
            </Badge>
          )}
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary rounded-full h-2 transition-all"
            style={{ width: `${Math.min((count / target) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {hasReached
            ? "You've earned priority review status! We'll fast-track your application."
            : `Refer ${target - count} more provider${target - count !== 1 ? "s" : ""} to unlock priority review.`}
        </p>
      </CardContent>
    </Card>
  );
}

function CategoryGapsCard({ zipCodes }: { zipCodes: string[] }) {
  const gaps = useQuery({
    queryKey: ["category-gaps", zipCodes],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_category_gaps", {
        p_zip_codes: zipCodes,
      });
      if (error) throw error;
      return (data ?? []) as Array<{ category: string; status: string; zone_name: string }>;
    },
    enabled: zipCodes.length > 0,
  });

  // Fallback: if RPC fails or returns empty, show nothing (don't show naive list)
  if (gaps.isLoading || gaps.isError || !gaps.data || gaps.data.length === 0) return null;

  // Deduplicate categories (may appear in multiple zones)
  const uniqueCategories = Array.from(new Set(gaps.data.map((g) => g.category)));

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">Help us launch faster</p>
        </div>
        <p className="text-xs text-muted-foreground">
          We need providers in these categories to launch in your area:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {uniqueCategories.map((cat) => (
            <Badge key={cat} variant="outline" className="text-xs capitalize">
              {cat.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProviderReferralForm({ defaultZip }: { defaultZip: string }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [category, setCategory] = useState("");
  const [zip, setZip] = useState(defaultZip);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!name || !contact || !category) return;
    setSubmitting(true);
    try {
      const { error } = await (supabase.from("provider_referrals") as any).insert({
        referrer_email: user?.email || "",
        referred_name: name,
        referred_contact: contact,
        referred_category: category,
        zip_code: zip || "00000",
      });
      if (error) throw error;
      setName("");
      setContact("");
      setCategory("");
      setSubmitted(true);
      toast.success("Referral submitted — thank you!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Know someone?
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Refer a provider you trust. The faster we fill categories, the sooner we launch.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {submitted ? (
          <div className="text-center py-3 space-y-2 animate-fade-in">
            <CheckCircle className="h-6 w-6 text-success mx-auto" />
            <p className="text-sm font-medium">Thanks for the referral!</p>
            <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
              Refer another
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Their name</Label>
              <Input
                placeholder="Provider name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone or email</Label>
              <Input
                placeholder="Phone number or email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Service category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ZIP code</Label>
              <Input
                placeholder="ZIP code"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                maxLength={5}
                className="h-9"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={!name || !contact || !category || submitting}
            >
              {submitting ? "Submitting..." : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Submit Referral
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
