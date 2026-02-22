import { Camera, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CADENCE_LABELS } from "@/hooks/useRoutinePreview";
import type { RoutineItem } from "@/hooks/useRoutine";

interface ReviewServiceCardProps {
  item: RoutineItem;
  entitlementStatus?: string;
}

export function ReviewServiceCard({ item, entitlementStatus }: ReviewServiceCardProps) {
  const statusColor = entitlementStatus === "blocked"
    ? "text-destructive"
    : entitlementStatus === "extra_allowed"
    ? "text-warning"
    : "text-success";

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{item.sku_name ?? "Service"}</h4>
        <Badge variant="secondary" className="text-[10px]">
          {CADENCE_LABELS[item.cadence_type] ?? item.cadence_type}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        {item.duration_minutes && (
          <span>⏱ {item.duration_minutes} min</span>
        )}
        <span className={statusColor}>
          {entitlementStatus === "included" ? "✓ Included" : entitlementStatus === "extra_allowed" ? "⊕ Extra" : "Available"}
        </span>
      </div>

      {/* Proof expectations */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {item.proof_photo_count > 0 && (
          <span className="flex items-center gap-1">
            <Camera className="h-3 w-3" />
            {item.proof_photo_count} photo{item.proof_photo_count !== 1 ? "s" : ""}
          </span>
        )}
        {item.checklist_count > 0 && (
          <span className="flex items-center gap-1">
            <ListChecks className="h-3 w-3" />
            {item.checklist_count} step{item.checklist_count !== 1 ? "s" : ""}
          </span>
        )}
        {item.proof_photo_count === 0 && item.checklist_count === 0 && (
          <span className="italic">No proof requirements</span>
        )}
      </div>
    </div>
  );
}
