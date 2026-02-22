import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CadencePicker } from "./CadencePicker";
import { BiweeklyPatternToggle } from "./BiweeklyPatternToggle";
import type { RoutineItem, CadenceType } from "@/hooks/useRoutine";

interface RoutineItemCardProps {
  item: RoutineItem;
  onRemove: (itemId: string) => void;
  onCadenceChange: (itemId: string, cadence: CadenceType, detail?: Record<string, any>) => void;
  allowIndependent?: boolean;
}

export function RoutineItemCard({ item, onRemove, onCadenceChange, allowIndependent }: RoutineItemCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2 press-feedback">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.sku_name ?? "Service"}</p>
          {item.duration_minutes && (
            <p className="text-xs text-muted-foreground">{item.duration_minutes} min</p>
          )}
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
      {item.cadence_type === "biweekly" && (
        <BiweeklyPatternToggle
          pattern={((item.cadence_detail as any)?.pattern ?? "A") as "A" | "B"}
          onChange={(pattern) => onCadenceChange(item.id, "biweekly", { pattern })}
        />
      )}
    </div>
  );
}
