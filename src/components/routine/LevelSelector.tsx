import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SkuLevel } from "@/hooks/useSkuLevels";

interface LevelSelectorProps {
  levels: SkuLevel[];
  selectedLevelId: string | null;
  onSelect: (levelId: string) => void;
  compact?: boolean;
}

export function LevelSelector({ levels, selectedLevelId, onSelect, compact }: LevelSelectorProps) {
  const [expanded, setExpanded] = useState(false);
  const activeLevels = levels.filter((l) => l.is_active);

  if (activeLevels.length === 0) {
    return <p className="text-xs text-muted-foreground">No service levels available.</p>;
  }

  const selected = activeLevels.find((l) => l.id === selectedLevelId) ?? activeLevels[0];

  if (compact) {
    return (
      <div className="space-y-1.5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-primary font-medium"
        >
          {selected.label}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {expanded && (
          <div className="space-y-1 animate-fade-in">
            {activeLevels.map((level) => (
              <button
                key={level.id}
                onClick={() => { onSelect(level.id); setExpanded(false); }}
                className={cn(
                  "w-full text-left rounded-lg px-2.5 py-1.5 text-xs border transition-colors",
                  level.id === selected.id
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card hover:bg-secondary/50"
                )}
              >
                <span>{level.label}</span>
                {level.handles_cost > 0 && (
                  <span className="ml-1 text-muted-foreground">· {level.handles_cost}h</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full comparison view
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Choose Level</p>
      <div className="space-y-2">
        {activeLevels.map((level) => {
          const isSelected = level.id === selected.id;
          const delta = level.handles_cost - (activeLevels[0]?.handles_cost ?? 0);
          return (
            <button
              key={level.id}
              onClick={() => onSelect(level.id)}
              className={cn(
                "w-full text-left rounded-xl p-3 border transition-all",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card hover:bg-secondary/30"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                  <span className="text-sm font-medium">{level.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {delta > 0 && (
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                      +{delta} handles
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{level.handles_cost}h</span>
                </div>
              </div>
              {level.short_description && (
                <p className="text-xs text-muted-foreground ml-6">{level.short_description}</p>
              )}
              {(level.inclusions as string[])?.length > 0 && (
                <ul className="mt-1.5 ml-6 space-y-0.5">
                  {(level.inclusions as string[]).slice(0, 4).map((inc, i) => (
                    <li key={i} className="text-xs text-muted-foreground">• {inc}</li>
                  ))}
                </ul>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
