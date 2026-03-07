import { useMemo } from "react";
import { useOpsMetrics, OpsMetrics } from "@/hooks/useOpsMetrics";
import { useOpsExceptionCount } from "@/hooks/useOpsExceptions";
import { useAssignmentConfig } from "@/hooks/useAssignmentConfig";
import { useZoneHealthRolling, ZoneHealthRollingRow } from "@/hooks/useZoneHealthRolling";

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

/** Aggregate zone-level metrics into system-wide signals */
function aggregateZoneMetrics(zones: ZoneHealthRollingRow[]) {
  let totalUnassignedLocked = 0;
  let maxRescheduleRate = 0;
  let maxProofMissingRate = 0;
  let maxAvgDriveMinutes = 0;

  for (const z of zones) {
    totalUnassignedLocked += z.unassigned_locked;
    if (z.reschedule_rate > maxRescheduleRate) maxRescheduleRate = z.reschedule_rate;
    if (z.proof_missing_rate > maxProofMissingRate) maxProofMissingRate = z.proof_missing_rate;
    if (z.avg_stop_minutes > maxAvgDriveMinutes) maxAvgDriveMinutes = z.avg_stop_minutes;
  }

  return { totalUnassignedLocked, maxRescheduleRate, maxProofMissingRate, maxAvgDriveMinutes };
}

function computeHealth(
  m: OpsMetrics,
  openExceptions: number,
  t: Thresholds,
  zoneAgg: ReturnType<typeof aggregateZoneMetrics>,
): { status: AutopilotStatus; reasons: AutopilotReason[] } {
  const reasons: AutopilotReason[] = [];

  // RED conditions
  if (zoneAgg.totalUnassignedLocked > t.max_unassigned_locked) {
    reasons.push({
      label: "Unassigned jobs in LOCKED window",
      detail: `${zoneAgg.totalUnassignedLocked} unassigned job(s) (threshold: ${t.max_unassigned_locked})`,
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
  if (zoneAgg.maxProofMissingRate > t.max_proof_missing_rate) {
    reasons.push({
      label: "Proof missing rate exceeded",
      detail: `${zoneAgg.maxProofMissingRate}% in worst zone (threshold: ${t.max_proof_missing_rate}%)`,
      severity: "yellow",
    });
  }

  if (zoneAgg.maxRescheduleRate > t.max_reschedule_rate_locked) {
    reasons.push({
      label: "Reschedule rate elevated",
      detail: `${zoneAgg.maxRescheduleRate}% in worst zone (threshold: ${t.max_reschedule_rate_locked}%)`,
      severity: "yellow",
    });
  }

  if (zoneAgg.maxAvgDriveMinutes > t.max_avg_drive_minutes) {
    reasons.push({
      label: "Average drive time high",
      detail: `${zoneAgg.maxAvgDriveMinutes} min in worst zone (threshold: ${t.max_avg_drive_minutes} min)`,
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
  const { data: zoneRows, isLoading: zonesLoading } = useZoneHealthRolling();

  const thresholds = useMemo(() => parseThresholds(configRows ?? []), [configRows]);
  const zoneAgg = useMemo(() => aggregateZoneMetrics(zoneRows ?? []), [zoneRows]);

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

    const { status, reasons } = computeHealth(metrics, openExceptions, thresholds, zoneAgg);

    return {
      status,
      reasons,
      kpis: {
        unassignedLocked: zoneAgg.totalUnassignedLocked,
        slaRiskJobs: metrics.jobsInIssue,
        providerCallouts: metrics.redoIntents,
        proofMissing: metrics.proofExceptions,
        customerReschedules: 0,
      },
    };
  }, [metrics, openExceptions, thresholds, zoneAgg]);

  return {
    ...health,
    isLoading: metricsLoading || exceptionsLoading || configLoading || zonesLoading,
  };
}
