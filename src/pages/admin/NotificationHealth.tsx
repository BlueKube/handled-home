import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNotificationHealth } from "@/hooks/useNotificationHealth";
import { AlertTriangle, CheckCircle, Clock, Mail, Bell, XCircle, Ban } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function NotificationHealth() {
  const { summary, isSummaryLoading, dailyBreakdown, isDailyLoading, deadletters, isDeadlettersLoading } =
    useNotificationHealth();

  // Transform daily breakdown for chart
  const chartData = dailyBreakdown.reduce<Record<string, Record<string, number>>>((acc, row) => {
    const key = row.delivery_date;
    if (!acc[key]) acc[key] = { date: new Date(key).getTime() };
    const statusKey = `${row.channel}_${row.status}`;
    acc[key][statusKey] = (acc[key][statusKey] ?? 0) + row.count;
    return acc;
  }, {});

  const chartArray = Object.values(chartData)
    .sort((a, b) => (a.date as number) - (b.date as number))
    .map((d) => ({
      ...d,
      label: format(new Date(d.date as number), "MMM d"),
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notification Health</h1>
        <p className="text-muted-foreground text-sm">
          Delivery status, processing latency, and deadletter queue
        </p>
      </div>

      {/* Summary Cards */}
      {isSummaryLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Sent (24h)"
              value={summary.sent_24h}
              icon={<CheckCircle className="h-4 w-4 text-green-500" />}
            />
            <StatCard
              label="Failed (24h)"
              value={summary.failed_24h}
              icon={<XCircle className="h-4 w-4 text-destructive" />}
              alert={summary.failed_24h > 0}
            />
            <StatCard
              label="Suppressed (24h)"
              value={summary.suppressed_24h}
              icon={<Ban className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              label="Queued"
              value={summary.queued_24h}
              icon={<Clock className="h-4 w-4 text-yellow-500" />}
              alert={summary.queued_24h > 10}
            />
            <StatCard
              label="Deadletters"
              value={summary.deadletter_total}
              icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
              alert={summary.deadletter_total > 0}
            />
            <StatCard
              label="Pending Events"
              value={summary.pending_total}
              icon={<Bell className="h-4 w-4 text-blue-500" />}
            />
            <StatCard
              label="Avg Latency"
              value={`${summary.avg_latency_minutes.toFixed(1)}m`}
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
              alert={summary.avg_latency_minutes > 5}
            />
            <StatCard
              label="Last Run"
              value={
                summary.last_run_at
                  ? formatDistanceToNow(new Date(summary.last_run_at), { addSuffix: true })
                  : "Never"
              }
              icon={
                summary.last_run_status === "completed" ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )
              }
            />
          </div>
        </>
      ) : null}

      {/* Delivery Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Delivery Breakdown (7 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isDailyLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartArray.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No delivery data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartArray}>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="PUSH_SENT" stackId="a" fill="hsl(var(--chart-1))" name="Push Sent" />
                <Bar dataKey="PUSH_FAILED" stackId="a" fill="hsl(var(--chart-5))" name="Push Failed" />
                <Bar dataKey="EMAIL_SENT" stackId="b" fill="hsl(var(--chart-2))" name="Email Sent" />
                <Bar dataKey="EMAIL_FAILED" stackId="b" fill="hsl(var(--chart-4))" name="Email Failed" />
                <Bar dataKey="EMAIL_SKIPPED" stackId="b" fill="hsl(var(--chart-3))" name="Email Skipped" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Deadletter Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Deadletter Queue
            {deadletters.length > 0 && (
              <Badge variant="destructive" className="ml-2">{deadletters.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isDeadlettersLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : deadletters.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No deadletter events — all notifications processed successfully
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Last Error</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deadletters.map((dl) => (
                    <TableRow key={dl.id}>
                      <TableCell className="font-mono text-xs">{dl.event_type}</TableCell>
                      <TableCell>
                        <Badge variant={dl.priority === "CRITICAL" ? "destructive" : "secondary"}>
                          {dl.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {dl.audience_type}
                        {dl.audience_user_id && (
                          <span className="text-muted-foreground ml-1">
                            ({dl.audience_user_id.slice(0, 8)}…)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{dl.attempt_count}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-destructive">
                        {dl.last_error ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(dl.created_at), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  alert,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  alert?: boolean;
}) {
  return (
    <Card className={alert ? "border-destructive/50" : ""}>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          {icon}
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
