import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { SimulationResult } from "@/lib/simulation/simulate";

function fmtDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

interface SimulatorChartsProps {
  result: SimulationResult;
}

export default function SimulatorCharts({ result }: SimulatorChartsProps) {
  const revenueData = useMemo(
    () =>
      result.months.map((m) => ({
        month: `M${m.month}`,
        revenue: Math.round(m.revenue_cents / 100),
        costs: Math.round(
          (m.provider_payout_cents + m.byoc_bonus_cents + m.referral_credit_cents +
            (m.revenue_cents - m.gross_margin_cents) - m.provider_payout_cents -
            m.byoc_bonus_cents - m.referral_credit_cents) / 100
        ),
        providerPay: Math.round(m.provider_payout_cents / 100),
        overhead: Math.round(
          (m.revenue_cents - m.gross_margin_cents - m.provider_payout_cents -
            m.byoc_bonus_cents - m.referral_credit_cents) / 100
        ),
      })),
    [result]
  );

  const marginData = useMemo(
    () =>
      result.months.map((m) => ({
        month: `M${m.month}`,
        margin: Number(m.gross_margin_pct.toFixed(1)),
        utilization: Number(m.provider_utilization_pct.toFixed(1)),
      })),
    [result]
  );

  const customerData = useMemo(
    () =>
      result.months.map((m) => ({
        month: `M${m.month}`,
        byoc: m.new_from_byoc,
        referral: m.new_from_referral,
        organic: m.new_from_organic,
        total: m.active_customers,
      })),
    [result]
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Revenue vs Costs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Revenue vs Provider Pay</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={(v) => `$${v.toLocaleString()}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
              />
              <Area type="monotone" dataKey="revenue" stackId="1" stroke="#4ade80" fill="#4ade8040" name="Revenue" />
              <Area type="monotone" dataKey="providerPay" stackId="2" stroke="#f87171" fill="#f8717140" name="Provider Pay" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Margin & Utilization Trends */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Margin % & Utilization %</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={marginData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(value: number) => [`${value}%`, undefined]}
              />
              <Line type="monotone" dataKey="margin" stroke="#4ade80" strokeWidth={2} dot={false} name="Gross Margin" />
              <Line type="monotone" dataKey="utilization" stroke="#38bdf8" strokeWidth={2} dot={false} name="Utilization" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Customer Growth */}
      <Card className="xl:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Customer Growth (Active + Acquisition Sources)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={customerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Area type="monotone" dataKey="total" stroke="#a78bfa" fill="#a78bfa20" strokeWidth={2} name="Active Customers" />
              <Area type="monotone" dataKey="byoc" stackId="sources" stroke="#38bdf8" fill="#38bdf840" name="New (BYOC)" />
              <Area type="monotone" dataKey="referral" stackId="sources" stroke="#4ade80" fill="#4ade8040" name="New (Referral)" />
              <Area type="monotone" dataKey="organic" stackId="sources" stroke="#fbbf24" fill="#fbbf2440" name="New (Organic)" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
