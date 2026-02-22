import { cn } from "@/lib/utils";
import { AlertTriangle, Scissors, Calendar, CreditCard, ShieldAlert, RefreshCw } from "lucide-react";

export type SupportCategory = "quality" | "missed" | "damage" | "billing" | "safety" | "routine_change";

interface SupportCategoryTileProps {
  category: SupportCategory;
  selected?: boolean;
  onClick: (category: SupportCategory) => void;
}

const CATEGORIES: Record<SupportCategory, { label: string; description: string; icon: React.ElementType }> = {
  quality: { label: "Quality issue", description: "Work wasn't done right", icon: AlertTriangle },
  missed: { label: "Missed service", description: "Nobody showed up", icon: Calendar },
  damage: { label: "Damage", description: "Something was damaged", icon: ShieldAlert },
  billing: { label: "Billing question", description: "Charge doesn't look right", icon: CreditCard },
  safety: { label: "Safety concern", description: "Hazard or unsafe behavior", icon: ShieldAlert },
  routine_change: { label: "Routine change", description: "Need to adjust my services", icon: RefreshCw },
};

export function SupportCategoryTile({ category, selected, onClick }: SupportCategoryTileProps) {
  const config = CATEGORIES[category];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={() => onClick(category)}
      className={cn(
        "w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all press-feedback",
        selected
          ? "border-accent bg-accent/5 ring-1 ring-accent/30"
          : "border-border bg-card hover:bg-secondary/50"
      )}
    >
      <div className={cn(
        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
        selected ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
      )}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{config.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
      </div>
    </button>
  );
}

export function getAllCategories(): SupportCategory[] {
  return ["quality", "missed", "damage", "billing", "safety", "routine_change"];
}
