import { Pencil, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdminBundle } from "@/hooks/useAdminBundles";

interface BundleRowProps {
  bundle: AdminBundle;
  onEdit: (bundle: AdminBundle) => void;
}

const STATUS_VARIANT: Record<AdminBundle["status"], "default" | "secondary" | "outline"> = {
  active: "default",
  draft: "secondary",
  archived: "outline",
};

export function BundleRow({ bundle, onEdit }: BundleRowProps) {
  return (
    <button
      type="button"
      onClick={() => onEdit(bundle)}
      className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-secondary/30 active:bg-secondary/50 transition-colors first:rounded-t-xl last:rounded-b-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
        <Layers className="h-5 w-5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium truncate">{bundle.name}</p>
          <Badge variant={STATUS_VARIANT[bundle.status]} className="text-[10px]">
            {bundle.status}
          </Badge>
          <span className="text-[11px] text-muted-foreground capitalize">
            {bundle.season}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {bundle.window_start_date} → {bundle.window_end_date} ·{" "}
          {bundle.zone_ids.length} zone{bundle.zone_ids.length === 1 ? "" : "s"} ·{" "}
          {bundle.bundle_items.length} item
          {bundle.bundle_items.length === 1 ? "" : "s"} ·{" "}
          {bundle.total_credits} cr
        </p>
      </div>
      <Pencil className="h-4 w-4 text-muted-foreground/60 shrink-0" />
    </button>
  );
}
