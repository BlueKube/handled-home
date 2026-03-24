import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, { label: string; className: string; dotColor: string }> = {
  assigned: { label: "Assigned", className: "bg-primary text-primary-foreground", dotColor: "bg-primary-foreground/70" },
  confirmed: { label: "Confirmed", className: "bg-success text-success-foreground", dotColor: "bg-success-foreground/70" },
  rejected: { label: "Rejected", className: "bg-destructive text-destructive-foreground", dotColor: "bg-destructive-foreground/70" },
  alternate_assigned: { label: "Alternate", className: "bg-warning text-warning-foreground", dotColor: "bg-warning-foreground/70" },
  en_route: { label: "En Route", className: "bg-primary text-primary-foreground", dotColor: "bg-primary-foreground/70" },
  in_progress: { label: "In Progress", className: "bg-warning text-warning-foreground", dotColor: "bg-warning-foreground/70" },
  completed: { label: "Completed", className: "bg-success text-success-foreground", dotColor: "bg-success-foreground/70" },
  blocked: { label: "Blocked", className: "bg-destructive text-destructive-foreground", dotColor: "bg-destructive-foreground/70" },
  rescheduled: { label: "Rescheduled", className: "bg-warning text-warning-foreground", dotColor: "bg-warning-foreground/70" },
  partially_refunded: { label: "Partial Refund", className: "border border-border bg-transparent", dotColor: "bg-muted-foreground" },
  refunded: { label: "Refunded", className: "border border-border bg-transparent", dotColor: "bg-muted-foreground" },
  pending: { label: "Pending", className: "bg-warning text-warning-foreground", dotColor: "bg-warning-foreground/70" },
  active: { label: "Active", className: "bg-success text-success-foreground", dotColor: "bg-success-foreground/70" },
  inactive: { label: "Inactive", className: "bg-secondary text-secondary-foreground", dotColor: "bg-secondary-foreground/50" },
  probation: { label: "Probation", className: "bg-destructive text-destructive-foreground", dotColor: "bg-destructive-foreground/70" },
  suspended: { label: "Suspended", className: "bg-destructive text-destructive-foreground", dotColor: "bg-destructive-foreground/70" },
  scheduled: { label: "Scheduled", className: "bg-primary text-primary-foreground", dotColor: "bg-primary-foreground/70" },
  alternate_offered: { label: "Alternate Offered", className: "bg-warning text-warning-foreground", dotColor: "bg-warning-foreground/70" },
  locked: { label: "Locked", className: "bg-secondary text-secondary-foreground", dotColor: "bg-secondary-foreground/50" },
  not_started: { label: "Not Started", className: "bg-secondary text-secondary-foreground", dotColor: "bg-muted-foreground" },
  issue_reported: { label: "Issue Reported", className: "bg-warning text-warning-foreground", dotColor: "bg-warning-foreground/70" },
  partial_complete: { label: "Partial Complete", className: "bg-warning text-warning-foreground", dotColor: "bg-warning-foreground/70" },
  draft: { label: "Draft", className: "bg-secondary text-secondary-foreground", dotColor: "bg-muted-foreground" },
  paused: { label: "Paused", className: "bg-warning text-warning-foreground", dotColor: "bg-warning-foreground/70" },
  expansion_planned: { label: "Expansion Planned", className: "bg-primary text-primary-foreground", dotColor: "bg-primary-foreground/70" },
  archived: { label: "Archived", className: "border border-border bg-transparent text-muted-foreground", dotColor: "bg-muted-foreground" },
  hidden: { label: "Hidden", className: "bg-secondary text-secondary-foreground", dotColor: "bg-muted-foreground" },
  retired: { label: "Retired", className: "border border-border bg-transparent text-muted-foreground", dotColor: "bg-muted-foreground" },
  trialing: { label: "Trialing", className: "bg-primary text-primary-foreground", dotColor: "bg-primary-foreground/70" },
  past_due: { label: "Past Due", className: "bg-destructive text-destructive-foreground", dotColor: "bg-destructive-foreground/70" },
  incomplete: { label: "Incomplete", className: "bg-warning text-warning-foreground", dotColor: "bg-warning-foreground/70" },
  canceling: { label: "Canceling", className: "bg-warning text-warning-foreground", dotColor: "bg-warning-foreground/70" },
  canceled: { label: "Canceled", className: "border border-border bg-transparent text-muted-foreground", dotColor: "bg-muted-foreground" },
  recommended: { label: "Recommended", className: "bg-primary text-primary-foreground", dotColor: "bg-primary-foreground/70" },
  submitted: { label: "Submitted", className: "bg-primary text-primary-foreground", dotColor: "bg-primary-foreground/70" },
  under_review: { label: "Under Review", className: "bg-warning text-warning-foreground", dotColor: "bg-warning-foreground/70" },
  resolved: { label: "Resolved", className: "bg-success text-success-foreground", dotColor: "bg-success-foreground/70" },
  planned: { label: "Planned", className: "bg-secondary text-secondary-foreground", dotColor: "bg-muted-foreground" },
  issue: { label: "Issue", className: "bg-destructive text-destructive-foreground", dotColor: "bg-destructive-foreground/70" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusStyles[status] ?? { label: status, className: "", dotColor: "bg-muted-foreground" };
  return (
    <Badge
      variant="outline"
      className={cn(
        "min-h-[28px] rounded-full px-3 py-1 text-xs font-medium gap-1.5 inline-flex items-center",
        config.className,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dotColor)} />
      {config.label}
    </Badge>
  );
}
