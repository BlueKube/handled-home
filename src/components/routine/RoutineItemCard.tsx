import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CadencePicker } from "./CadencePicker";
import { BiweeklyPatternToggle } from "./BiweeklyPatternToggle";
import { LevelSelector } from "./LevelSelector";
import { useSkuLevels } from "@/hooks/useSkuLevels";
import type { RoutineItem, CadenceType } from "@/hooks/useRoutine";

interface RoutineItemCardProps {
  item: RoutineItem;
  onRemove: (itemId: string) => void;
  onCadenceChange: (itemId: string, cadence: CadenceType, detail?: Record<string, any>) => void;
  onLevelChange?: (itemId: string, levelId: string) => void;
  allowIndependent?: boolean;
  biweeklyRecommendation?: "A" | "B";
}

export function RoutineItemCard({ item, onRemove, onCadenceChange, onLevelChange, allowIndependent, biweeklyRecommendation }: RoutineItemCardProps) {
  const { data: levels } = useSkuLevels(item.sku_id);
  const activeLevels = (levels ?? []).filter((l) => l.is_active);
  const hasLevels = activeLevels.length > 0;
  const selectedLevel = activeLevels.find((l) => l.id === (item as any).level_id);

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2 press-feedback">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.sku_name ?? "Service"}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {selectedLevel && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                {selectedLevel.label}
              </Badge>
            )}
            {selectedLevel && selectedLevel.handles_cost > 0 && (
              <span className="text-[10px] text-muted-foreground">{selectedLevel.handles_cost}h</span>
            )}
            {!selectedLevel && item.duration_minutes && (
              <p className="text-xs text-muted-foreground">{item.duration_minutes} min</p>
            )}
          </div>
        </div>
        <CadencePicker
          value={item.cadence_type}
          onChange={(c) => onCadenceChange(item.id, c)}
          allowIndependent={allowIndependent}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Level picker (compact) */}
      {hasLevels && onLevelChange && (
        <LevelSelector
          levels={activeLevels}
          selectedLevelId={(item as any).level_id ?? activeLevels[0]?.id ?? null}
          onSelect={(levelId) => onLevelChange(item.id, levelId)}
          compact
        />
      )}

      {item.cadence_type === "biweekly" && (
        <BiweeklyPatternToggle
          pattern={((item.cadence_detail as any)?.pattern ?? "A") as "A" | "B"}
          onChange={(pattern) => onCadenceChange(item.id, "biweekly", { pattern })}
          recommended={biweeklyRecommendation}
        />
      )}
    </div>
  );
}
