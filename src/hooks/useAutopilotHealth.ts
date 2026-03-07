import { useMemo } from "react";
import { useOpsMetrics, OpsMetrics } from "@/hooks/useOpsMetrics";
import { useOpsExceptionCount } from "@/hooks/useOpsExceptions";
import { useAssignmentConfig } from "@/hooks/useAssignmentConfig";

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
  kpis: {
    unassignedLocked: number;
    slaRiskJobs: number;
    providerCallouts: number;
    proofMissing: number;
    customerReschedules: number;
  };
}

interface Thresholds {
  max_unassigned_locked: number;
  max_open_exceptions: number;
  sla_risk_threshold: number;
  max_issue_rate_7d: number;
  max_proof_missing_rate: number;
  max_reschedule_rate_locked: number;
  max_provider_callouts_day: number;
  max_avg_drive_minutes: number;
  max_redo_intents_7d: number;
}

const DEFAULTS: Thresholds = {
  max_unassigned_locked: 0,
  max_open_exceptions: 5,
  sla_risk_threshold: 3,
  max_issue_rate_7d: 5,
  max_proof_missing_rate: 10,
  max_reschedule_rate_locked: 5,
  max_provider_callouts_day: 2,
  max_avg_drive_minutes: 45,
  max_redo_intents_7d: 2,
};

function parseThresholds(config: any[]): Thresholds {
  const t = { ...DEFAULTS };
  for (const row of config) {
    const key = row.config_key?.replace("autopilot_", "") as keyof Thresholds;
    if (key in t) {
      const val = typeof row.config_value === "number" ? row.config_value : Number(row.config_value);
      if (!isNaN(val)) (t as any)[key] = val;
    }
  }
  return t;
}

function computeHealth(
  m: OpsMetrics,
  openExceptions: number,
  t: Thresholds,
): { status: AutopilotStatus; reasons: AutopilotReason[] } {
  const reasons: AutopilotReason[] = [];

  // RED conditions
  if (m.jobsInIssue > t.max_unassigned_locked) {
    reasons.push({
      label: "Jobs at risk in LOCKED window",
      detail: `${m.jobsInIssue} job(s) with open issues (threshold: ${t.max_unassigned_locked})`,
      severity: "red",
    });
  }

  if (openExceptions > t.max_open_exceptions) {
    reasons.push({
      label: "High exception backlog",
      detail: `${openExceptions} unresolved ops exceptions (threshold: ${t.max_open_exceptions})`,
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

  if (m.issueRate > t.max_issue_rate_7d) {
    reasons.push({
      label: "Issue rate elevated",
      detail: `${m.issueRate}% issue rate (7d) — threshold: ${t.max_issue_rate_7d}%`,
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

  if (m.redoIntents > t.max_redo_intents_7d) {
    reasons.push({
      label: "Redo intents rising",
      detail: `${m.redoIntents} redo request(s) this week (threshold: ${t.max_redo_intents_7d})`,
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
  const { data: configRows, isLoading: configLoading } = useAssignmentConfig();

  const thresholds = useMemo(() => parseThresholds(configRows ?? []), [configRows]);

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

    const { status, reasons } = computeHealth(metrics, openExceptions, thresholds);

    return {
      status,
      reasons,
      kpis: {
        unassignedLocked: 0,
        slaRiskJobs: metrics.jobsInIssue,
        providerCallouts: metrics.redoIntents,
        proofMissing: metrics.proofExceptions,
        customerReschedules: 0,
      },
    };
  }, [metrics, openExceptions, thresholds]);

  return {
    ...health,
    isLoading: metricsLoading || exceptionsLoading || configLoading,
  };
}
