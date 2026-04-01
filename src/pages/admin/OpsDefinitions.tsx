import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Search } from "lucide-react";

interface KpiDefinition {
  name: string;
  category: string;
  formula: string;
  window: string;
  source: string;
  cadence: string;
  caveats: string;
  threshold?: { green: string; yellow: string; red: string };
}

const KPI_DEFINITIONS: KpiDefinition[] = [
  // Operations
  {
    name: "Jobs Scheduled Today",
    category: "Operations",
    formula: "COUNT(jobs WHERE scheduled_date = TODAY)",
    window: "Today",
    source: "jobs",
    cadence: "Real-time",
    caveats: "Includes all statuses except CANCELED",
  },
  {
    name: "Jobs Completed Today",
    category: "Operations",
    formula: "COUNT(jobs WHERE scheduled_date = TODAY AND status = COMPLETED)",
    window: "Today",
    source: "jobs",
    cadence: "Real-time",
    caveats: "Reflects server-validated completion only",
  },
  {
    name: "Issue Rate",
    category: "Operations",
    formula: "(job_issues created in window) ÷ (completed jobs in window) × 100",
    window: "7 days",
    source: "job_issues, jobs",
    cadence: "Real-time",
    caveats: "Denominator is completed jobs, not scheduled",
    threshold: { green: "< 5%", yellow: "5-10%", red: "> 10%" },
  },
  {
    name: "Proof Compliance %",
    category: "Operations",
    formula: "(completed jobs with all required proof) ÷ (completed jobs) × 100",
    window: "7 days",
    source: "jobs, job_photos, job_checklist_items",
    cadence: "Real-time",
    caveats: "Override completions count as exceptions",
    threshold: { green: "> 95%", yellow: "85-95%", red: "< 85%" },
  },
  {
    name: "Capacity Utilization",
    category: "Operations",
    formula: "(assigned_count) ÷ (max_homes) × 100 per zone/day",
    window: "Next 7 days",
    source: "zone_service_day_capacity",
    cadence: "Real-time",
    caveats: "Buffer percent not subtracted in display",
    threshold: { green: "60-85%", yellow: "40-60% or 85-95%", red: "< 40% or > 95%" },
  },
  {
    name: "Rejection Rate",
    category: "Operations",
    formula: "(assignments with rejection_used) ÷ (total assignments) × 100",
    window: "7 / 30 days",
    source: "service_day_assignments",
    cadence: "Real-time",
    caveats: "Per-zone drill-down available",
    threshold: { green: "< 15%", yellow: "15-25%", red: "> 25%" },
  },
  // Financial
  {
    name: "Gross Margin %",
    category: "Financial",
    formula: "(subscription_revenue - provider_payouts - overhead) ÷ subscription_revenue × 100",
    window: "28-day billing cycle",
    source: "customer_invoices, provider_earnings, system_config",
    cadence: "Daily snapshot",
    caveats: "Excludes one-time add-on revenue",
    threshold: { green: "> 25%", yellow: "15-25%", red: "< 15%" },
  },
  {
    name: "Credits Issued",
    category: "Financial",
    formula: "SUM(customer_credits.amount_cents) in window",
    window: "7 / 30 days",
    source: "customer_credits",
    cadence: "Real-time",
    caveats: "Includes all credit types",
  },
  {
    name: "Past Due Customers",
    category: "Financial",
    formula: "COUNT(customer_invoices WHERE status = PAST_DUE)",
    window: "Current",
    source: "customer_invoices",
    cadence: "Real-time",
    caveats: "Invoice status set by billing webhook",
  },
  {
    name: "Provider Utilization",
    category: "Financial",
    formula: "(total_jobs_completed) ÷ (providers × stops_per_day × working_days) × 100",
    window: "28-day cycle",
    source: "jobs, provider_orgs, system_config",
    cadence: "Daily snapshot",
    caveats: "Uses configured stops_per_day, not actual",
    threshold: { green: "> 80%", yellow: "60-80%", red: "< 60%" },
  },
  // Growth
  {
    name: "Referrals Activated",
    category: "Growth",
    formula: "COUNT(referrals WHERE status = ACTIVATED) in window",
    window: "7 days",
    source: "referrals",
    cadence: "Real-time",
    caveats: "Activation = referred user completed first visit",
  },
  {
    name: "Provider Applications",
    category: "Growth",
    formula: "COUNT(provider_applications) in window",
    window: "7 days",
    source: "provider_applications",
    cadence: "Real-time",
    caveats: "All statuses included",
  },
  {
    name: "Attach Rate (90-day cohort)",
    category: "Growth",
    formula: "(customers with 2+ active SKUs at day 90) ÷ (customers who reached day 90) × 100",
    window: "Rolling 90-day cohort",
    source: "subscriptions, customer_routines",
    cadence: "Weekly snapshot",
    caveats: "Only counts customers who survived to day 90",
    threshold: { green: "> 28%", yellow: "18-28%", red: "< 18%" },
  },
  {
    name: "Household Churn",
    category: "Growth",
    formula: "(canceled subscriptions in period) ÷ (active subscriptions at period start) × 100",
    window: "28-day cycle",
    source: "subscriptions",
    cadence: "Per billing cycle",
    caveats: "Paused subscriptions not counted as churned",
    threshold: { green: "< 3.5%", yellow: "3.5-5%", red: "> 5%" },
  },
  // Support
  {
    name: "Self-Resolution Rate",
    category: "Support",
    formula: "(tickets resolved without admin) ÷ (total tickets) × 100",
    window: "30 days",
    source: "support_tickets",
    cadence: "Real-time",
    caveats: "Target: ≥80%",
    threshold: { green: "> 80%", yellow: "60-80%", red: "< 60%" },
  },
  {
    name: "SLA Breach Risk",
    category: "Support",
    formula: "COUNT(tickets WHERE sla_due_at < NOW AND status ≠ resolved)",
    window: "Current",
    source: "support_tickets",
    cadence: "Real-time",
    caveats: "Only tickets with SLA set",
  },
  // Provider Quality
  {
    name: "Provider Quality Score",
    category: "Provider Quality",
    formula: "rating(35%) + issues(25%) + photos(20%) + on_time(20%)",
    window: "Rolling 28 days",
    source: "provider_quality_scores",
    cadence: "Daily recalc",
    caveats: "Minimum 5 ratings for aggregation",
    threshold: { green: "85-100", yellow: "70-84", red: "< 70" },
  },
  {
    name: "Active Probations",
    category: "Provider Quality",
    formula: "COUNT(provider_probation WHERE status = active)",
    window: "Current",
    source: "provider_probation",
    cadence: "Real-time",
    caveats: "New table added in Round 5 Phase 3",
  },
];

const CATEGORIES = [...new Set(KPI_DEFINITIONS.map((k) => k.category))];

export default function OpsDefinitions() {
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filtered = KPI_DEFINITIONS.filter((kpi) => {
    const matchesSearch = !search || kpi.name.toLowerCase().includes(search.toLowerCase()) || kpi.formula.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || kpi.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-fade-in p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/admin/ops")} aria-label="Back to Ops Cockpit">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">KPI Definitions</h1>
          <p className="text-sm text-muted-foreground">Single source of truth for all ops metrics — {KPI_DEFINITIONS.length} KPIs</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-muted-foreground" />
          <Input
            placeholder="Search KPIs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs pl-8 w-48"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant={categoryFilter === "all" ? "default" : "outline"}
            size="sm"
            className="text-xs h-8"
            onClick={() => setCategoryFilter("all")}
          >
            All ({KPI_DEFINITIONS.length})
          </Button>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              size="sm"
              className="text-xs h-8"
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((kpi) => (
          <Card key={kpi.name}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{kpi.name}</CardTitle>
                <Badge variant="outline" className="text-[10px]">{kpi.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="bg-muted/50 p-2 rounded">
                <p className="text-xs font-mono">{kpi.formula}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Window</p>
                  <p className="font-medium">{kpi.window}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Source</p>
                  <p className="font-mono text-[10px]">{kpi.source}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cadence</p>
                  <p className="font-medium">{kpi.cadence}</p>
                </div>
              </div>
              {kpi.threshold && (
                <div className="flex gap-1.5">
                  <Badge className="text-[10px] bg-green-500/20 text-green-400 border-0">{kpi.threshold.green}</Badge>
                  <Badge className="text-[10px] bg-yellow-500/20 text-yellow-400 border-0">{kpi.threshold.yellow}</Badge>
                  <Badge className="text-[10px] bg-red-500/20 text-red-400 border-0">{kpi.threshold.red}</Badge>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">{kpi.caveats}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
