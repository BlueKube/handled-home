import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, { label: string; className: string }> = {
  assigned: { label: "Assigned", className: "bg-primary text-primary-foreground" },
  confirmed: { label: "Confirmed", className: "bg-success text-success-foreground" },
  rejected: { label: "Rejected", className: "bg-destructive text-destructive-foreground" },
  alternate_assigned: { label: "Alternate", className: "bg-warning text-warning-foreground" },
  en_route: { label: "En Route", className: "bg-primary text-primary-foreground" },
  in_progress: { label: "In Progress", className: "bg-warning text-warning-foreground" },
  completed: { label: "Completed", className: "bg-success text-success-foreground" },
  blocked: { label: "Blocked", className: "bg-destructive text-destructive-foreground" },
  rescheduled: { label: "Rescheduled", className: "bg-warning text-warning-foreground" },
  partially_refunded: { label: "Partial Refund", className: "border border-border bg-transparent" },
  refunded: { label: "Refunded", className: "border border-border bg-transparent" },
  pending: { label: "Pending", className: "bg-warning text-warning-foreground" },
  active: { label: "Active", className: "bg-success text-success-foreground" },
  probation: { label: "Probation", className: "bg-destructive text-destructive-foreground" },
  suspended: { label: "Suspended", className: "bg-destructive text-destructive-foreground" },
  scheduled: { label: "Scheduled", className: "bg-primary text-primary-foreground" },
  alternate_offered: { label: "Alternate Offered", className: "bg-warning text-warning-foreground" },
  locked: { label: "Locked", className: "bg-secondary text-secondary-foreground" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusStyles[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
