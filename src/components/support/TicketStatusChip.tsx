import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string; dotColor: string }> = {
  new: { label: "New", className: "bg-primary text-primary-foreground", dotColor: "bg-primary-foreground/70" },
  awaiting_customer: { label: "Needs your input", className: "bg-warning text-warning-foreground", dotColor: "bg-warning-foreground/70" },
  awaiting_provider: { label: "Awaiting provider", className: "bg-secondary text-secondary-foreground", dotColor: "bg-muted-foreground" },
  in_review: { label: "In review", className: "bg-primary text-primary-foreground", dotColor: "bg-primary-foreground/70" },
  resolved: { label: "Resolved", className: "bg-success text-success-foreground", dotColor: "bg-success-foreground/70" },
  closed: { label: "Closed", className: "border border-border bg-transparent text-muted-foreground", dotColor: "bg-muted-foreground" },
  escalated: { label: "Escalated", className: "bg-destructive text-destructive-foreground", dotColor: "bg-destructive-foreground/70" },
};

interface TicketStatusChipProps {
  status: string;
  className?: string;
}

export function TicketStatusChip({ status, className }: TicketStatusChipProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: "", dotColor: "bg-muted-foreground" };
  return (
    <Badge
      variant="outline"
      className={cn(
        "min-h-[24px] rounded-full px-2.5 py-0.5 text-[11px] font-medium gap-1.5 inline-flex items-center",
        config.className,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dotColor)} />
      {config.label}
    </Badge>
  );
}
