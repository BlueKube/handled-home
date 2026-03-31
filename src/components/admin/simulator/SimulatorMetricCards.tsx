import { Card } from "@/components/ui/card";
import type { SimulationResult } from "@/lib/simulation/simulate";

interface MetricCardProps {
  label: string;
  value: string;
  color?: "positive" | "negative" | "neutral";
}

function MetricCard({ label, value, color = "neutral" }: MetricCardProps) {
  const colorClass = color === "positive"
    ? "text-green-400"
    : color === "negative"
      ? "text-red-400"
      : "text-primary";

  return (
    <Card className="p-4 text-center">
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </Card>
  );
}

interface SimulatorMetricCardsProps {
  result: SimulationResult;
}

export default function SimulatorMetricCards({ result }: SimulatorMetricCardsProps) {
  const { metrics, score } = result;

  const marginColor = metrics.gross_margin_pct_avg >= 0 ? "positive" : "negative";
  const marginSign = metrics.gross_margin_pct_avg >= 0 ? "+" : "";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <MetricCard
        label="Gross Margin (avg)"
        value={`${marginSign}${metrics.gross_margin_pct_avg.toFixed(1)}%`}
        color={marginColor}
      />
      <MetricCard
        label="Final Customers (M12)"
        value={metrics.final_customers.toString()}
      />
      <MetricCard
        label="Break-Even Month"
        value={metrics.break_even_month?.toString() ?? "Never"}
        color={metrics.break_even_month ? "positive" : "negative"}
      />
      <MetricCard
        label="Total Revenue (12mo)"
        value={`$${(metrics.total_revenue_cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
      />
      <MetricCard
        label="Provider Utilization"
        value={`${metrics.provider_utilization_avg.toFixed(1)}%`}
      />
      <MetricCard
        label="Composite Score"
        value={score.toFixed(0)}
        color={score > 2000 ? "positive" : score > 1000 ? "neutral" : "negative"}
      />
    </div>
  );
}
