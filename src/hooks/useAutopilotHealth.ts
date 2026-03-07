import { useMemo } from "react";
import { useOpsMetrics, OpsMetrics } from "@/hooks/useOpsMetrics";
import { useOpsExceptionCount } from "@/hooks/useOpsExceptions";

export type AutopilotStatus = "green" | "yellow" | "red";

export interface AutopilotReason {
  label: string;
  detail: string;
  severity: "red" | "yellow";
}

export interface AutopilotHealth {
  status: AutopilotStatus;
  reasons: AutopilotReason[];
  isLoading: boolean;
  /** KPI snapshot used for the banner tiles */
  kpis: {
    unassignedLocked: number;
    slaRiskJobs: number;
    providerCallouts: number;
    proofMissing: number;
    customerReschedules: number;
  };
}

/**
 * Default thresholds — Phase 3 will make these admin-configurable.
 * Keys match assignment_config dial names that will be seeded.
 */
const DEFAULTS = {
  max_unassigned_locked: 0,
  sla_risk_threshold: 3,
  max_proof_missing_rate: 10, // percent
  max_reschedule_rate_locked: 5, // percent
  max_provider_callouts_day: 2,
  max_avg_drive_minutes: 45,
};

function computeHealth(
  m: OpsMetrics,
  openExceptions: number,
): { status: AutopilotStatus; reasons: AutopilotReason[] } {
  const reasons: AutopilotReason[] = [];

  // RED conditions
  if (m.jobsInIssue > 0) {
    reasons.push({
      label: "Jobs at risk in LOCKED window",
      detail: `${m.jobsInIssue} job(s) with open issues today`,
      severity: "red",
    });
  }

  if (openExceptions > 5) {
    reasons.push({
      label: "High exception backlog",
      detail: `${openExceptions} unresolved ops exceptions`,
      severity: "red",
    });
  }

  if (m.failedPaymentsToday > 0) {
    reasons.push({
      label: "Failed payments today",
      detail: `${m.failedPaymentsToday} payment(s) failed`,
      severity: "red",
    });
  }

  // YELLOW conditions
  if (m.proofExceptions > 0) {
    reasons.push({
      label: "Missing proof submissions",
      detail: `${m.proofExceptions} completed job(s) missing required proof`,
      severity: "yellow",
    });
  }

  if (m.issueRate > 5) {
    reasons.push({
      label: "Issue rate elevated",
      detail: `${m.issueRate}% issue rate (7d) — target <5%`,
      severity: "yellow",
    });
  }

  if (m.zonesOverCapacity > 0) {
    reasons.push({
      label: "Zones near capacity",
      detail: `${m.zonesOverCapacity} zone(s) >90% capacity`,
      severity: "yellow",
    });
  }

  if (m.pastDueCount > 0) {
    reasons.push({
      label: "Past-due invoices",
      detail: `${m.pastDueCount} invoice(s) past due`,
      severity: "yellow",
    });
  }

  if (m.redoIntents > 2) {
    reasons.push({
      label: "Redo intents rising",
      detail: `${m.redoIntents} redo request(s) this week`,
      severity: "yellow",
    });
  }

  const hasRed = reasons.some((r) => r.severity === "red");
  const hasYellow = reasons.length > 0;
  const status: AutopilotStatus = hasRed ? "red" : hasYellow ? "yellow" : "green";

  return { status, reasons };
}

export function useAutopilotHealth(): AutopilotHealth {
  const { data: metrics, isLoading: metricsLoading } = useOpsMetrics();
  const { data: openExceptions = 0, isLoading: exceptionsLoading } = useOpsExceptionCount();

  const health = useMemo(() => {
    if (!metrics) {
      return {
        status: "green" as AutopilotStatus,
        reasons: [],
        kpis: {
          unassignedLocked: 0,
          slaRiskJobs: 0,
          providerCallouts: 0,
          proofMissing: 0,
          customerReschedules: 0,
        },
      };
    }

    const { status, reasons } = computeHealth(metrics, openExceptions);

    return {
      status,
      reasons,
      kpis: {
        unassignedLocked: 0, // TODO: Wire to actual unassigned-in-LOCKED query when visit_assignments table supports it
        slaRiskJobs: metrics.jobsInIssue,
        providerCallouts: metrics.redoIntents, // Approximation — callout tracking not yet separate
        proofMissing: metrics.proofExceptions,
        customerReschedules: 0, // TODO: Wire when reschedule count query is added
      },
    };
  }, [metrics, openExceptions]);

  return {
    ...health,
    isLoading: metricsLoading || exceptionsLoading,
  };
}
