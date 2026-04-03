import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SimulationResult } from "@/lib/simulation/simulate";

function fmt$(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

interface SimulatorProjectionTableProps {
  result: SimulationResult;
}

export default function SimulatorProjectionTable({ result }: SimulatorProjectionTableProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Monthly Projections (12-Month)</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs w-12">Mo</TableHead>
              <TableHead className="text-xs text-right">Customers</TableHead>
              <TableHead className="text-xs text-right">Jobs</TableHead>
              <TableHead className="text-xs text-right">Revenue</TableHead>
              <TableHead className="text-xs text-right">Provider Pay</TableHead>
              <TableHead className="text-xs text-right">Margin</TableHead>
              <TableHead className="text-xs text-right">Margin %</TableHead>
              <TableHead className="text-xs text-right">Util %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.months.map((m) => (
              <TableRow key={m.month}>
                <TableCell className="text-xs font-medium">{m.month}</TableCell>
                <TableCell className="text-xs text-right">{m.active_customers}</TableCell>
                <TableCell className="text-xs text-right">{m.total_jobs}</TableCell>
                <TableCell className="text-xs text-right">{fmt$(m.revenue_cents)}</TableCell>
                <TableCell className="text-xs text-right">{fmt$(m.provider_payout_cents)}</TableCell>
                <TableCell className={`text-xs text-right ${m.gross_margin_cents >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                  {fmt$(m.gross_margin_cents)}
                </TableCell>
                <TableCell className={`text-xs text-right ${m.gross_margin_pct >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                  {m.gross_margin_pct.toFixed(1)}%
                </TableCell>
                <TableCell className="text-xs text-right">{m.provider_utilization_pct.toFixed(1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
