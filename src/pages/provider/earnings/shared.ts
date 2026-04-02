import { formatCents } from "@/utils/format";

export function modifierExplanation(cents: number, holdReason?: string | null): string {
  if (cents > 0) {
    if (cents >= 1000) return "Quality tier bonus";
    if (cents >= 500) return "Rush / high-demand bonus";
    return "Service bonus";
  }
  if (cents < 0) {
    if (holdReason === "high_severity_issue") return "Adjustment — issue reported";
    return "Adjustment applied";
  }
  return "";
}

export function holdReasonLabel(reason: string): string {
  switch (reason) {
    case "probation_provider":
      return "New provider review period";
    case "high_severity_issue":
      return "Under review — service issue reported";
    case "payout_account_not_ready":
      return "Payout account setup required";
    default:
      return reason.replace(/_/g, " ");
  }
}

export function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "PAID":
    case "ELIGIBLE":
      return "default";
    case "HELD":
    case "HELD_UNTIL_READY":
      return "secondary";
    case "VOIDED":
      return "destructive";
    default:
      return "outline";
  }
}
