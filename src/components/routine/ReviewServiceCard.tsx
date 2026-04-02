import { Camera, ListChecks, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CADENCE_LABELS } from "@/hooks/useRoutinePreview";
import type { RoutineItem } from "@/hooks/useRoutine";

interface ReviewServiceCardProps {
  item: RoutineItem;
  entitlementStatus?: string;
  inclusions?: string[];
  exclusions?: string[];
}

export function ReviewServiceCard({ item, entitlementStatus, inclusions, exclusions }: ReviewServiceCardProps) {
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

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {item.duration_minutes && (
          <span>⏱ {item.duration_minutes} min</span>
        )}
        <span className={statusColor}>
          {entitlementStatus === "included" ? "✓ Included" : entitlementStatus === "extra_allowed" ? "⊕ Extra" : "Available"}
        </span>
      </div>

      {/* L11: Scope bullets */}
      {inclusions && inclusions.length > 0 && (
        <div className="flex items-start gap-2 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
          <div>
            <span className="font-medium text-foreground">Included: </span>
            <span className="text-muted-foreground">{inclusions.join(", ")}</span>
          </div>
        </div>
      )}
      {exclusions && exclusions.length > 0 && (
        <div className="flex items-start gap-2 text-xs">
          <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
          <div>
            <span className="font-medium text-foreground">Not included: </span>
            <span className="text-muted-foreground">{exclusions.join(", ")}</span>
          </div>
        </div>
      )}

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
