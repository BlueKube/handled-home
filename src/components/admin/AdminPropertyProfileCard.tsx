import { Card } from "@/components/ui/card";
import { useAdminPropertyProfile } from "@/hooks/useAdminPropertyProfile";
import { COVERAGE_CATEGORIES } from "@/hooks/usePropertyCoverage";
import { SQFT_OPTIONS, YARD_OPTIONS, WINDOWS_OPTIONS, STORIES_OPTIONS } from "@/hooks/usePropertySignals";
import { Home, Leaf, Waves, Sparkles, Bug, Trash2, PawPrint, AppWindow, Droplets, Wrench } from "lucide-react";
import { format } from "date-fns";

const ICON_MAP: Record<string, React.ReactNode> = {
  Leaf: <Leaf className="h-3.5 w-3.5" />,
  Waves: <Waves className="h-3.5 w-3.5" />,
  Sparkles: <Sparkles className="h-3.5 w-3.5" />,
  Bug: <Bug className="h-3.5 w-3.5" />,
  Trash2: <Trash2 className="h-3.5 w-3.5" />,
  PawPrint: <PawPrint className="h-3.5 w-3.5" />,
  AppWindow: <AppWindow className="h-3.5 w-3.5" />,
  Home: <Home className="h-3.5 w-3.5" />,
  Droplets: <Droplets className="h-3.5 w-3.5" />,
  Wrench: <Wrench className="h-3.5 w-3.5" />,
};

const STATUS_COLORS: Record<string, string> = {
  PROVIDER: "bg-success/15 text-success",
  SELF: "bg-warning/15 text-warning",
  NONE: "bg-muted text-muted-foreground",
  NA: "bg-muted/50 text-muted-foreground/60",
};

function tierLabel(value: string | null, options: { value: string; label: string }[]): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}

interface Props {
  propertyId: string | undefined | null;
}

export function AdminPropertyProfileCard({ propertyId }: Props) {
  const { data, isLoading } = useAdminPropertyProfile(propertyId);

  if (!propertyId) return null;
  if (isLoading) return <Card className="p-4"><div className="h-20 bg-muted/40 rounded animate-pulse" /></Card>;
  if (!data || (data.coverage.length === 0 && !data.signals)) return null;

  const coverageMap = new Map(data.coverage.map((c) => [c.category_key, c]));
  const latestCoverageUpdate = data.coverage.length > 0
    ? data.coverage.reduce((latest, c) => c.updated_at > latest ? c.updated_at : latest, data.coverage[0].updated_at)
    : null;

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Home Profile</h3>

      {/* Coverage map */}
      {data.coverage.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Coverage Map</p>
            {latestCoverageUpdate && (
              <span className="text-[10px] text-muted-foreground">
                Updated {format(new Date(latestCoverageUpdate), "MMM d, h:mm a")}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {COVERAGE_CATEGORIES.map((cat) => {
              const row = coverageMap.get(cat.key);
              if (!row) return null;
              return (
                <div
                  key={cat.key}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${STATUS_COLORS[row.coverage_status] ?? "bg-muted"}`}
                >
                  {ICON_MAP[cat.icon]}
                  <span className="truncate flex-1">{cat.label}</span>
                  <span className="font-medium text-[10px] uppercase">{row.coverage_status}</span>
                </div>
              );
            })}
          </div>
          {data.coverage.some((c) => c.switch_intent) && (
            <div className="pt-1">
              <p className="text-[10px] text-muted-foreground font-medium">Switch Intents</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {data.coverage
                  .filter((c) => c.switch_intent)
                  .map((c) => (
                    <span key={c.category_key} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {COVERAGE_CATEGORIES.find((cat) => cat.key === c.category_key)?.label}: {c.switch_intent?.replace(/_/g, " ")}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sizing signals */}
      {data.signals && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Property Sizing</p>
            {data.signals.updated_at && (
              <span className="text-[10px] text-muted-foreground">
                Updated {format(new Date(data.signals.updated_at), "MMM d, h:mm a")}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Sqft:</span>{" "}
              <span className="font-medium">{tierLabel(data.signals.home_sqft_tier, SQFT_OPTIONS)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Yard:</span>{" "}
              <span className="font-medium">{tierLabel(data.signals.yard_tier, YARD_OPTIONS)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Windows:</span>{" "}
              <span className="font-medium">{tierLabel(data.signals.windows_tier, WINDOWS_OPTIONS)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Stories:</span>{" "}
              <span className="font-medium">{tierLabel(data.signals.stories_tier, STORIES_OPTIONS)}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
