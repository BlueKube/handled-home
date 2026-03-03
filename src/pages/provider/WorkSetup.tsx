import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import {
  useProviderWorkProfile,
  useUpsertWorkProfile,
  normalizeWorkingHours,
  DEFAULT_WORKING_HOURS,
  type WorkingHours,
} from "@/hooks/useProviderWorkProfile";
import { CATEGORY_LABELS, CATEGORY_ORDER, getCategoryIcon } from "@/lib/serviceCategories";
import { toast } from "sonner";
import {
  MapPin, Wrench, Clock, ChevronRight, ChevronLeft, Check, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EQUIPMENT_OPTIONS = [
  { key: "mower_push", label: "Push Mower" },
  { key: "mower_riding", label: "Riding Mower" },
  { key: "trimmer", label: "String Trimmer" },
  { key: "edger", label: "Edger" },
  { key: "blower", label: "Leaf Blower" },
  { key: "hedge_trimmer", label: "Hedge Trimmer" },
  { key: "chainsaw", label: "Chainsaw" },
  { key: "pressure_washer", label: "Pressure Washer" },
  { key: "pool_equipment", label: "Pool Equipment" },
  { key: "pest_sprayer", label: "Pest Sprayer" },
  { key: "cleaning_kit", label: "Cleaning Kit" },
];

const WEEKDAYS = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
] as const;

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 5;
  const m = i % 2 === 0 ? "00" : "30";
  const val = `${String(h).padStart(2, "0")}:${m}`;
  const ampm = h < 12 ? "AM" : h === 12 ? "PM" : "PM";
  const display = `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${m} ${ampm}`;
  return { value: val, label: display };
});

const STEPS = [
  { key: "location", label: "Location", icon: MapPin },
  { key: "services", label: "Services", icon: Wrench },
  { key: "schedule", label: "Schedule", icon: Clock },
] as const;

export default function ProviderWorkSetup() {
  const navigate = useNavigate();
  const { org, loading: orgLoading } = useProviderOrg();
  const { data: profile, isLoading: profileLoading, isError, refetch } = useProviderWorkProfile(org?.id);
  const upsert = useUpsertWorkProfile();

  const [step, setStep] = useState(0);
  const [homeLabel, setHomeLabel] = useState("");
  const [homeLat, setHomeLat] = useState("");
  const [homeLng, setHomeLng] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [hours, setHours] = useState<WorkingHours>(DEFAULT_WORKING_HOURS);
  const [maxJobs, setMaxJobs] = useState(12);

  // Seed form from existing profile — normalize abbreviated day keys from DB default
  useEffect(() => {
    if (profile) {
      setHomeLabel(profile.home_address_label ?? "");
      setHomeLat(profile.home_lat?.toString() ?? "");
      setHomeLng(profile.home_lng?.toString() ?? "");
      setCategories(profile.service_categories ?? []);
      setEquipment(profile.equipment_kits ?? []);
      const rawHours = (profile.working_hours as WorkingHours) ?? DEFAULT_WORKING_HOURS;
      setHours(normalizeWorkingHours(rawHours));
      setMaxJobs(profile.max_jobs_per_day ?? 12);
    }
  }, [profile]);

  const loading = orgLoading || profileLoading;

  const toggleCategory = (key: string) =>
    setCategories((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );

  const toggleEquipment = (key: string) =>
    setEquipment((prev) =>
      prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]
    );

  const toggleDay = (day: string) =>
    setHours((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { start: "08:00", end: "17:00" },
    }));

  const updateDayTime = (day: string, field: "start" | "end", value: string) =>
    setHours((prev) => ({
      ...prev,
      [day]: prev[day] ? { ...prev[day]!, [field]: value } : { start: "08:00", end: "17:00", [field]: value },
    }));

  const activeDays = useMemo(
    () => WEEKDAYS.filter((d) => hours[d.key] != null).length,
    [hours]
  );

  const canAdvance = () => {
    if (step === 0) return homeLabel.trim().length > 0;
    if (step === 1) return categories.length > 0;
    return activeDays > 0;
  };

  const handleSave = async () => {
    if (!org) return;
    try {
      await upsert.mutateAsync({
        provider_org_id: org.id,
        home_address_label: homeLabel.trim() || null,
        home_lat: homeLat ? parseFloat(homeLat) : null,
        home_lng: homeLng ? parseFloat(homeLng) : null,
        service_categories: categories,
        equipment_kits: equipment,
        working_hours: hours as any,
        max_jobs_per_day: maxJobs,
      });
      toast.success("Work setup saved");
      navigate("/provider/coverage");
    } catch {
      toast.error("Failed to save work setup");
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <QueryErrorCard message="Failed to load work profile." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Work Setup</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Help us build efficient routes for your area.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={s.key} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors w-full justify-center",
                  isActive && "bg-primary text-primary-foreground",
                  isDone && "bg-primary/10 text-primary cursor-pointer",
                  !isActive && !isDone && "bg-muted text-muted-foreground"
                )}
              >
                {isDone ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Location */}
      {step === 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Home Base
            </CardTitle>
            <CardDescription className="text-xs">
              Your starting point for daily routes. Never shown to customers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-accent/10 border border-accent/20">
              <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Tighter routes = higher earnings per hour. Setting your home base helps us cluster jobs near you.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="home-label">Address or area name</Label>
              <Input
                id="home-label"
                placeholder="e.g. 123 Main St, Pasadena"
                value={homeLabel}
                onChange={(e) => setHomeLabel(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="home-lat" className="text-xs">Latitude (optional)</Label>
                <Input
                  id="home-lat"
                  type="number"
                  step="any"
                  placeholder="34.1478"
                  value={homeLat}
                  onChange={(e) => setHomeLat(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="home-lng" className="text-xs">Longitude (optional)</Label>
                <Input
                  id="home-lng"
                  type="number"
                  step="any"
                  placeholder="-118.1445"
                  value={homeLng}
                  onChange={(e) => setHomeLng(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Services */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Service Categories
              </CardTitle>
              <CardDescription className="text-xs">
                Select every category you can perform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORY_ORDER.map((key) => {
                  const Icon = getCategoryIcon(key);
                  const selected = categories.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleCategory(key)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border text-left transition-colors text-sm",
                        selected
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
                      <span className="truncate">{CATEGORY_LABELS[key]}</span>
                      {selected && <Check className="h-3.5 w-3.5 text-primary ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Equipment</CardTitle>
              <CardDescription className="text-xs">
                What equipment do you have available?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <label
                    key={eq.key}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer"
                  >
                    <span className="text-sm">{eq.label}</span>
                    <Switch
                      checked={equipment.includes(eq.key)}
                      onCheckedChange={() => toggleEquipment(eq.key)}
                    />
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Schedule */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Working Hours
              </CardTitle>
              <CardDescription className="text-xs">
                Toggle days on/off and set your available window.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {WEEKDAYS.map((d) => {
                const active = hours[d.key] != null;
                return (
                  <div key={d.key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Switch checked={active} onCheckedChange={() => toggleDay(d.key)} />
                        <span className={cn("text-sm font-medium", !active && "text-muted-foreground")}>
                          {d.label}
                        </span>
                      </label>
                      {active && (
                        <Badge variant="outline" className="text-xs">
                          {hours[d.key]!.start} – {hours[d.key]!.end}
                        </Badge>
                      )}
                    </div>
                    {active && (
                      <div className="flex items-center gap-2 ml-10">
                        <Select
                          value={hours[d.key]!.start}
                          onValueChange={(v) => updateDayTime(d.key, "start", v)}
                        >
                          <SelectTrigger className="h-8 text-xs w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((t) => (
                              <SelectItem key={t.value} value={t.value} className="text-xs">
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground">to</span>
                        <Select
                          value={hours[d.key]!.end}
                          onValueChange={(v) => updateDayTime(d.key, "end", v)}
                        >
                          <SelectTrigger className="h-8 text-xs w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((t) => (
                              <SelectItem key={t.value} value={t.value} className="text-xs">
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Daily Capacity</CardTitle>
              <CardDescription className="text-xs">
                Maximum jobs you can handle per day.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select
                  value={String(maxJobs)}
                  onValueChange={(v) => setMaxJobs(parseInt(v))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">jobs per day</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center gap-3 pt-2">
        {step > 0 && (
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
            className="flex-1"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            disabled={!canAdvance() || upsert.isPending}
            className="flex-1"
          >
            {upsert.isPending ? "Saving…" : "Save Work Setup"}
          </Button>
        )}
      </div>
    </div>
  );
}
