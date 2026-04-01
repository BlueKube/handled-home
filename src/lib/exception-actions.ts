/**
 * Next-best-action definitions for the unified exception queue.
 * Maps exception types to structured repair actions with labels,
 * action types, and pre-filled reason codes.
 */

export interface RepairAction {
  label: string;
  actionType: string;
  reasonCode: string;
  variant: "default" | "outline";
}

export const EXCEPTION_ACTIONS: Record<string, RepairAction[]> = {
  // === OPS DOMAIN ===
  window_at_risk: [
    { label: "Reorder Stops", actionType: "reorder_route", reasonCode: "fit_window", variant: "default" },
    { label: "Swap to Backup", actionType: "swap_provider", reasonCode: "window_at_risk", variant: "outline" },
    { label: "Extend Window", actionType: "extend_window", reasonCode: "customer_request", variant: "outline" },
  ],
  service_week_at_risk: [
    { label: "Schedule Remaining", actionType: "schedule_visit", reasonCode: "service_week_deadline", variant: "default" },
    { label: "Move to Next Week", actionType: "reschedule", reasonCode: "capacity_constraint", variant: "outline" },
  ],
  provider_overload: [
    { label: "Move to Backup", actionType: "swap_provider", reasonCode: "overload_relief", variant: "default" },
    { label: "Redistribute Days", actionType: "redistribute", reasonCode: "load_balance", variant: "outline" },
  ],
  coverage_break: [
    { label: "Assign Backup", actionType: "assign_provider", reasonCode: "coverage_gap", variant: "default" },
    { label: "Recruit Provider", actionType: "flag_recruiting", reasonCode: "zone_coverage", variant: "outline" },
  ],
  provider_unavailable: [
    { label: "Assign Backup", actionType: "swap_provider", reasonCode: "provider_unavailable", variant: "default" },
    { label: "Contact Provider", actionType: "contact", reasonCode: "availability_check", variant: "outline" },
  ],
  access_failure: [
    { label: "Reschedule Hold", actionType: "reschedule_hold", reasonCode: "access_failure", variant: "default" },
    { label: "Send Crew Back", actionType: "retry_today", reasonCode: "same_day_retry", variant: "outline" },
  ],
  customer_reschedule: [
    { label: "Offer Windows", actionType: "offer_windows", reasonCode: "customer_reschedule", variant: "default" },
    { label: "Next Available", actionType: "reschedule", reasonCode: "next_available", variant: "outline" },
  ],
  weather_safety: [
    { label: "Batch Reschedule", actionType: "batch_reschedule", reasonCode: "weather_event", variant: "default" },
    { label: "Issue Credit", actionType: "issue_credit", reasonCode: "weather_disruption", variant: "outline" },
  ],
  quality_block: [
    { label: "Schedule Redo", actionType: "schedule_redo", reasonCode: "quality_issue", variant: "default" },
    { label: "Issue Credit", actionType: "issue_credit", reasonCode: "quality_compensation", variant: "outline" },
    { label: "Flag Provider", actionType: "flag_quality", reasonCode: "quality_review", variant: "outline" },
  ],

  // === BILLING DOMAIN ===
  payment_failed: [
    { label: "Retry Payment", actionType: "retry_payment", reasonCode: "manual_retry", variant: "default" },
    { label: "Contact Customer", actionType: "contact", reasonCode: "payment_assistance", variant: "outline" },
    { label: "Issue Credit", actionType: "issue_credit", reasonCode: "payment_offset", variant: "outline" },
  ],
  payment_past_due: [
    { label: "Escalate Dunning", actionType: "escalate_dunning", reasonCode: "past_due_escalation", variant: "default" },
    { label: "Contact Customer", actionType: "contact", reasonCode: "past_due_outreach", variant: "outline" },
    { label: "Pause Subscription", actionType: "pause_subscription", reasonCode: "nonpayment", variant: "outline" },
  ],
  payout_failed: [
    { label: "Retry Payout", actionType: "retry_payout", reasonCode: "payout_retry", variant: "default" },
    { label: "Contact Provider", actionType: "contact", reasonCode: "payout_issue", variant: "outline" },
    { label: "Manual Transfer", actionType: "manual_transfer", reasonCode: "payout_fallback", variant: "outline" },
  ],
  dispute_opened: [
    { label: "Present Evidence", actionType: "present_evidence", reasonCode: "dispute_defense", variant: "default" },
    { label: "Issue Credit", actionType: "issue_credit", reasonCode: "dispute_resolution", variant: "outline" },
    { label: "Accept Dispute", actionType: "accept_dispute", reasonCode: "dispute_concession", variant: "outline" },
  ],
  earnings_held: [
    { label: "Release Hold", actionType: "release_hold", reasonCode: "hold_cleared", variant: "default" },
    { label: "Extend Hold", actionType: "extend_hold", reasonCode: "investigation_ongoing", variant: "outline" },
    { label: "Contact Provider", actionType: "contact", reasonCode: "hold_explanation", variant: "outline" },
  ],
  reconciliation_mismatch: [
    { label: "Investigate", actionType: "investigate", reasonCode: "reconciliation_review", variant: "default" },
    { label: "Issue Adjustment", actionType: "issue_adjustment", reasonCode: "reconciliation_fix", variant: "outline" },
    { label: "Flag for Audit", actionType: "flag_audit", reasonCode: "reconciliation_audit", variant: "outline" },
  ],
};
