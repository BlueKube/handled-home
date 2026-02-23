import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";

const KPI_DEFINITIONS = [
  {
    name: "Jobs Scheduled Today",
    formula: "COUNT(jobs WHERE scheduled_date = TODAY)",
    window: "Today",
    source: "jobs",
    cadence: "Real-time",
    caveats: "Includes all statuses except CANCELED",
  },
  {
    name: "Jobs Completed Today",
    formula: "COUNT(jobs WHERE scheduled_date = TODAY AND status = COMPLETED)",
    window: "Today",
    source: "jobs",
    cadence: "Real-time",
    caveats: "Reflects server-validated completion only",
  },
  {
    name: "Issue Rate",
    formula: "(job_issues created in window) ÷ (completed jobs in window) × 100",
    window: "7 days",
    source: "job_issues, jobs",
    cadence: "Real-time",
    caveats: "Denominator is completed jobs, not scheduled",
  },
  {
    name: "Proof Compliance %",
    formula: "(completed jobs with all required proof) ÷ (completed jobs) × 100",
    window: "7 days",
    source: "jobs, job_photos, job_checklist_items",
    cadence: "Real-time",
    caveats: "Override completions count as exceptions",
  },
  {
    name: "Capacity Utilization",
    formula: "(assigned_count) ÷ (max_homes) × 100 per zone/day/window",
    window: "Next 7 days",
    source: "zone_service_day_capacity",
    cadence: "Real-time",
    caveats: "Buffer_percent not subtracted in display",
  },
  {
    name: "Credits Issued",
    formula: "SUM(customer_credits.amount_cents) in window",
    window: "7 / 30 days",
    source: "customer_credits",
    cadence: "Real-time",
    caveats: "Includes all credit types",
  },
  {
    name: "Past Due Customers",
    formula: "COUNT(customer_invoices WHERE status = PAST_DUE)",
    window: "Current",
    source: "customer_invoices",
    cadence: "Real-time",
    caveats: "Invoice status set by billing webhook",
  },
  {
    name: "Referrals Activated",
    formula: "COUNT(referrals WHERE status = ACTIVATED) in window",
    window: "7 days",
    source: "referrals",
    cadence: "Real-time",
    caveats: "Activation = referred user completed first visit",
  },
  {
    name: "Provider Applications",
    formula: "COUNT(provider_applications) in window",
    window: "7 days",
    source: "provider_applications",
    cadence: "Real-time",
    caveats: "All statuses included",
  },
  {
    name: "Self-Resolve Rate",
    formula: "(resolved tickets where TTR < 1 hour) ÷ (all resolved tickets) × 100",
    window: "7 days",
    source: "support_tickets",
    cadence: "Real-time",
    caveats: "Proxy for self-service; includes admin quick-closes",
  },
  {
    name: "Median Time-to-Resolution",
    formula: "MEDIAN(resolved_at - created_at) for resolved tickets",
    window: "7 days",
    source: "support_tickets",
    cadence: "Real-time",
    caveats: "Excludes tickets still open",
  },
  {
    name: "SLA Breach Risk",
    formula: "COUNT(tickets WHERE sla_due_at < NOW AND status ≠ resolved)",
    window: "Current",
    source: "support_tickets",
    cadence: "Real-time",
    caveats: "Only tickets with SLA set",
  },
  {
    name: "Rejection Rate",
    formula: "(assignments with rejection_used = true) ÷ (total assignments) × 100",
    window: "7 / 30 days",
    source: "service_day_assignments",
    cadence: "Real-time",
    caveats: "Per-zone drill-down available",
  },
];

export default function OpsDefinitions() {
  const nav = useNavigate();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/admin/ops")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-h2">KPI Definitions</h1>
          <p className="text-caption">Single source of truth for all ops metrics</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>KPI</TableHead>
              <TableHead>Formula</TableHead>
              <TableHead>Window</TableHead>
              <TableHead className="hidden md:table-cell">Source</TableHead>
              <TableHead className="hidden lg:table-cell">Caveats</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {KPI_DEFINITIONS.map((kpi) => (
              <TableRow key={kpi.name}>
                <TableCell className="font-medium whitespace-nowrap">{kpi.name}</TableCell>
                <TableCell className="text-xs font-mono max-w-[200px] truncate">{kpi.formula}</TableCell>
                <TableCell className="whitespace-nowrap">{kpi.window}</TableCell>
                <TableCell className="hidden md:table-cell text-xs font-mono">{kpi.source}</TableCell>
                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{kpi.caveats}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
