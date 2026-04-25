import { useState, useEffect } from "react";
import { usePropertyCoverage, COVERAGE_CATEGORIES, type CoverageStatus, type SwitchIntent, type CoverageUpdate } from "@/hooks/usePropertyCoverage";
import { usePropertySignals, type SignalsFormData, SQFT_OPTIONS, YARD_OPTIONS, WINDOWS_OPTIONS, STORIES_OPTIONS, type SqftTier, type YardTier, type WindowsTier, type StoriesTier } from "@/hooks/usePropertySignals";
import { Button } from "@/components/ui/button";
import {
  Home, ArrowRight, Loader2, Sparkles,
  Leaf, Waves, Bug, Trash2, PawPrint,
  AppWindow as AppWindowIcon, Droplets, Wrench, Trees, Layers,
} from "lucide-react";
import { toast } from "sonner";

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

export function HomeSetupStep({ onComplete }: { onComplete: () => Promise<void> }) {
  const [phase, setPhase] = useState<"coverage" | "sizing">("coverage");
  const { coverage, save: saveCoverage, isSaving: savingCoverage } = usePropertyCoverage();
  const { signals, save: saveSizing, isSaving: savingSizing } = usePropertySignals();
  const [completing, setCompleting] = useState(false);
  const [selections, setSelections] = useState<Record<string, { status: CoverageStatus; intent: SwitchIntent | null }>>({});
  const [sizingForm, setSizingForm] = useState<SignalsFormData>({ home_sqft_tier: null, yard_tier: null, windows_tier: null, stories_tier: null });

  useEffect(() => {
    const init: typeof selections = {};
    for (const row of coverage) init[row.category_key] = { status: row.coverage_status as CoverageStatus, intent: row.switch_intent as SwitchIntent | null };
    for (const cat of COVERAGE_CATEGORIES) if (!init[cat.key]) init[cat.key] = { status: "NONE", intent: null };
    setSelections(init);
  }, [coverage]);

  useEffect(() => {
    if (signals) setSizingForm({
      home_sqft_tier: (signals.home_sqft_tier as SqftTier) ?? null, yard_tier: (signals.yard_tier as YardTier) ?? null,
      windows_tier: (signals.windows_tier as WindowsTier) ?? null, stories_tier: (signals.stories_tier as StoriesTier) ?? null,
    });
  }, [signals]);

  const setStatus = (key: string, status: CoverageStatus) => {
    setSelections((prev) => ({ ...prev, [key]: { status, intent: status === "SELF" || status === "NONE" ? prev[key]?.intent ?? null : null } }));
  };

  const handleCoverageNext = async () => {
    const updates: CoverageUpdate[] = COVERAGE_CATEGORIES.map((cat) => ({
      category_key: cat.key, coverage_status: selections[cat.key]?.status ?? "NONE", switch_intent: selections[cat.key]?.intent ?? null,
    }));
    try { await saveCoverage(updates); setPhase("sizing"); }
    catch { toast.error("Your coverage preferences couldn't be saved — check your connection and try again."); }
  };

  const handleSizingComplete = async () => {
    setCompleting(true);
    try { await saveSizing(sizingForm); await onComplete(); }
    catch { toast.error("Home size details couldn't be saved — you can skip this step and update later in Settings."); }
    finally { setCompleting(false); }
  };

  const handleSkip = async () => {
    setCompleting(true);
    try { await onComplete(); } finally { setCompleting(false); }
  };

  if (phase === "coverage") {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <Sparkles className="h-10 w-10 text-accent mx-auto mb-3" />
          <h1 className="text-h2">Make recommendations smarter</h1>
          <p className="text-muted-foreground text-sm mt-1">What's already handled at your home? This takes about 30 seconds.</p>
          <p className="text-xs text-muted-foreground mt-2">Address confirmed. Now let's size your plan.</p>
        </div>
        <div className="space-y-2.5">
          {COVERAGE_CATEGORIES.map((cat) => {
            const Icon = COVERAGE_ICON_MAP[cat.icon] ?? Home;
            const sel = selections[cat.key];
            return (
              <div key={cat.key} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><Icon className="h-4 w-4 text-accent" /></div>
                <span className="text-sm font-medium flex-1 min-w-0 truncate">{cat.label}</span>
                <div className="flex gap-1">
                  {COVERAGE_STATUS_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => setStatus(cat.key, opt.value)}
                      className={`rounded-lg py-1.5 px-2 text-[11px] font-medium transition-all border ${sel?.status === opt.value ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary"}`}>
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
          Next: Home Size <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button variant="ghost" className="w-full text-sm" onClick={handleSkip} disabled={completing}>Skip for now</Button>
      </div>
    );
  }

  const filledCount = Object.values(sizingForm).filter(Boolean).length;
  return (
    <div className="space-y-5">
      <div className="text-center">
        <Home className="h-10 w-10 text-accent mx-auto mb-3" />
        <h1 className="text-h2">Home size (quick estimate)</h1>
        <p className="text-muted-foreground text-sm mt-1">Helps us pick the right service level. All fields optional.</p>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Sizes your plan to match the work. Helps us right-size your service plan.
      </p>
      <div className="space-y-5">
        {SIZING_GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.field} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center"><Icon className="h-4 w-4 text-accent" /></div>
                <span className="font-medium text-sm">{group.label}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => (
                  <button key={opt.value} onClick={() => setSizingForm((prev) => ({ ...prev, [group.field]: opt.value }))}
                    className={`rounded-xl py-2 px-3.5 text-sm font-medium transition-all border ${sizingForm[group.field] === opt.value ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card text-muted-foreground border-border hover:bg-secondary"}`}>
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
        Continue <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
      <Button variant="ghost" className="w-full text-sm" onClick={handleSkip} disabled={completing}>Skip for now</Button>
    </div>
  );
}
