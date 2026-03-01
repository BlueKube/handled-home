import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  usePropertySignals,
  SignalsFormData,
  SQFT_OPTIONS,
  YARD_OPTIONS,
  WINDOWS_OPTIONS,
  STORIES_OPTIONS,
  SqftTier,
  YardTier,
  WindowsTier,
  StoriesTier,
} from "@/hooks/usePropertySignals";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Loader2, ChevronRight, Home, Trees, AppWindow, Layers } from "lucide-react";

interface TierGroup<T extends string> {
  label: string;
  icon: React.ElementType;
  options: { value: T; label: string }[];
  field: keyof SignalsFormData;
  hint: string;
}

const GROUPS: TierGroup<string>[] = [
  {
    label: "Home Size",
    icon: Home,
    options: SQFT_OPTIONS,
    field: "home_sqft_tier",
    hint: "Approximate square footage",
  },
  {
    label: "Yard Size",
    icon: Trees,
    options: YARD_OPTIONS,
    field: "yard_tier",
    hint: "Total outdoor area",
  },
  {
    label: "Windows",
    icon: AppWindow,
    options: WINDOWS_OPTIONS,
    field: "windows_tier",
    hint: "Approximate window count",
  },
  {
    label: "Stories",
    icon: Layers,
    options: STORIES_OPTIONS,
    field: "stories_tier",
    hint: "Number of floors (affects gutters, windows)",
  },
];

export default function PropertySizing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawReturn = searchParams.get("return") || "/customer";
  const returnTo = rawReturn.startsWith("/") ? rawReturn : "/customer";
  const { signals, isLoading, save, isSaving } = usePropertySignals();

  const [form, setForm] = useState<SignalsFormData>({
    home_sqft_tier: null,
    yard_tier: null,
    windows_tier: null,
    stories_tier: null,
  });

  // Initialize from DB
  useEffect(() => {
    if (signals) {
      setForm({
        home_sqft_tier: (signals.home_sqft_tier as SqftTier) ?? null,
        yard_tier: (signals.yard_tier as YardTier) ?? null,
        windows_tier: (signals.windows_tier as WindowsTier) ?? null,
        stories_tier: (signals.stories_tier as StoriesTier) ?? null,
      });
    }
  }, [signals]);

  const setField = (field: keyof SignalsFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await save(form);
      navigate(returnTo);
    } catch {
      // onError in hook shows toast
    }
  };

  const filledCount = Object.values(form).filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-28">
      {/* Header */}
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-h2 text-foreground">Home size (quick estimate)</h1>
        <p className="text-caption mt-1">
          This helps us pick the right service level and time window.
        </p>
      </div>

      {/* Tier groups */}
      <div className="px-4 space-y-5">
        {GROUPS.map((group) => {
          const Icon = group.icon;
          const currentValue = form[group.field];

          return (
            <div key={group.field} className="space-y-2.5">
              {/* Group header */}
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Icon className="h-4.5 w-4.5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{group.label}</p>
                  <p className="text-xs text-muted-foreground">{group.hint}</p>
                </div>
              </div>

              {/* Pill selectors */}
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const isActive = currentValue === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setField(group.field, opt.value)}
                      className={cn(
                        "rounded-xl py-2.5 px-4 text-sm font-medium transition-all duration-150 border",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-card text-muted-foreground border-border hover:bg-secondary"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent safe-bottom">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            {filledCount}/4 fields set
          </span>
          <span className="text-xs text-muted-foreground">
            All fields optional
          </span>
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
