import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  usePropertyCoverage,
  COVERAGE_CATEGORIES,
  CoverageStatus,
  SwitchIntent,
  CoverageUpdate,
} from "@/hooks/usePropertyCoverage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Leaf, Waves, Sparkles, Bug, Trash2, PawPrint,
  AppWindow, Home, Droplets, Wrench, Loader2, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ICON_MAP: Record<string, React.ElementType> = {
  Leaf, Waves, Sparkles, Bug, Trash2, PawPrint,
  AppWindow, Home, Droplets, Wrench,
};

const STATUS_OPTIONS: { value: CoverageStatus; label: string; short: string }[] = [
  { value: "SELF", label: "I do it myself", short: "Myself" },
  { value: "PROVIDER", label: "I have someone", short: "Have one" },
  { value: "NONE", label: "Not handled", short: "None" },
  { value: "NA", label: "N/A", short: "N/A" },
];

const INTENT_OPTIONS: { value: SwitchIntent; label: string }[] = [
  { value: "OPEN_NOW", label: "Open now" },
  { value: "OPEN_LATER", label: "Maybe later" },
  { value: "NOT_OPEN", label: "Not open" },
];

export default function CoverageMap() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawReturn = searchParams.get("return") || "/customer";
  const returnTo = rawReturn.startsWith("/") ? rawReturn : "/customer";
  const { coverage, coverageMap, isLoading, save, isSaving } = usePropertyCoverage();

  // Local state keyed by category
  const [selections, setSelections] = useState<
    Record<string, { status: CoverageStatus; intent: SwitchIntent | null }>
  >({});

  // Initialize from DB data, or default all to NONE for first-time users
  useEffect(() => {
    const init: typeof selections = {};
    if (coverage.length > 0) {
      for (const row of coverage) {
        init[row.category_key] = {
          status: row.coverage_status as CoverageStatus,
          intent: row.switch_intent as SwitchIntent | null,
        };
      }
    }
    // Fill any missing categories with NONE
    for (const cat of COVERAGE_CATEGORIES) {
      if (!init[cat.key]) {
        init[cat.key] = { status: "NONE", intent: null };
      }
    }
    setSelections(init);
  }, [coverage]);

  const setStatus = (key: string, status: CoverageStatus) => {
    setSelections((prev) => ({
      ...prev,
      [key]: {
        status,
        // Clear intent unless SELF or NONE (where switch intent is meaningful)
        intent: status === "SELF" || status === "NONE" ? prev[key]?.intent ?? null : null,
      },
    }));
  };

  const setIntent = (key: string, intent: SwitchIntent) => {
    setSelections((prev) => ({
      ...prev,
      [key]: { ...prev[key], intent },
    }));
  };

  const handleSave = async () => {
    const updates: CoverageUpdate[] = COVERAGE_CATEGORIES.map((cat) => {
      const sel = selections[cat.key];
      return {
        category_key: cat.key,
        coverage_status: sel?.status ?? "NONE",
        switch_intent: sel?.intent ?? null,
      };
    });
    try {
      await save(updates);
      navigate(returnTo);
    } catch {
      // onError in hook already shows toast
    }
  };

  const filledCount = Object.keys(selections).length;
  const totalCount = COVERAGE_CATEGORIES.length;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-28">
      {/* Header */}
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-h2 text-foreground">What's already handled?</h1>
        <p className="text-caption mt-1">
          This helps us suggest the right services and avoid irrelevant offers.
        </p>
      </div>

      {/* Category cards */}
      <div className="px-4 space-y-3">
        {COVERAGE_CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.icon] ?? Home;
          const sel = selections[cat.key];
          const showIntent =
            sel?.status === "SELF" || sel?.status === "NONE";

          return (
            <div
              key={cat.key}
              className="rounded-xl border border-border bg-card p-4 space-y-3"
            >
              {/* Category header */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <span className="font-medium text-foreground">{cat.label}</span>
              </div>

              {/* Segmented control */}
              <div className="grid grid-cols-4 gap-1.5">
                {STATUS_OPTIONS.map((opt) => {
                  const isActive = sel?.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setStatus(cat.key, opt.value)}
                      className={cn(
                        "rounded-lg py-2 px-1 text-xs font-medium transition-all duration-150 border",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary"
                      )}
                    >
                      {opt.short}
                    </button>
                  );
                })}
              </div>

              {/* Switch intent sub-question */}
              <AnimatePresence>
                {showIntent && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-1 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Would you be open to switching this to Handled Home?
                      </p>
                      <div className="flex gap-2">
                        {INTENT_OPTIONS.map((opt) => {
                          const isActive = sel?.intent === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setIntent(cat.key, opt.value)}
                              className={cn(
                                "rounded-lg py-1.5 px-3 text-xs font-medium transition-all border",
                                isActive
                                  ? "bg-accent text-accent-foreground border-accent"
                                  : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary"
                              )}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Progress + Save */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent safe-bottom">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            {filledCount}/{totalCount} categories set
          </span>
          {filledCount < totalCount && (
            <span className="text-xs text-muted-foreground">
              Unset categories default to "Not handled"
            </span>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-12 text-base font-semibold rounded-xl"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Save & Continue
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
