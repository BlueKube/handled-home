import { ResponsiveContainer, LineChart, Line } from "recharts";

interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

/**
 * 2A-10: Reusable mini sparkline chart for dashboards.
 * Accepts a simple number[] and renders a minimal trend line.
 */
export function SparklineChart({
  data,
  color = "hsl(var(--primary))",
  height = 32,
  className,
}: SparklineChartProps) {
  if (!data || data.length < 2) return null;

  const chartData = data.map((value, i) => ({ i, v: value }));

  return (
    <div className={className} style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
