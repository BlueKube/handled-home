import { cn } from "@/lib/utils";

export type VisitChipType = "included" | "snap" | "bundle" | "credits";

interface Props {
  type: VisitChipType;
  className?: string;
}

const VARIANT_CLASSES: Record<VisitChipType, string> = {
  included: "bg-success/10 text-success",
  snap: "bg-warning/10 text-warning",
  bundle: "bg-accent/15 text-accent-foreground",
  credits: "bg-primary/10 text-primary",
};

const VARIANT_LABELS: Record<VisitChipType, string> = {
  included: "Included",
  snap: "Snap",
  bundle: "Bundle",
  credits: "Credits",
};

export function VisitTypeChip({ type, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide",
        VARIANT_CLASSES[type],
        className
      )}
    >
      {VARIANT_LABELS[type]}
    </span>
  );
}
