import { useLevelAnalytics } from "@/hooks/useLevelAnalytics";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpCircle, Lightbulb, BarChart3, AlertTriangle } from "lucide-react";

function StatTile({ icon: Icon, label, value, sub, alert }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; alert?: boolean;
}) {
  return (
    <Card className={`p-4 ${alert ? "border-destructive/30 bg-destructive/5" : ""}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${alert ? "bg-destructive/10" : "bg-accent/10"}`}>
          <Icon className={`h-4 w-4 ${alert ? "text-destructive" : "text-accent"}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold tracking-tight">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

export default function LevelAnalytics() {
  const { data, isLoading } = useLevelAnalytics();

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-h2">Level Analytics</h1>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-h2 mb-0.5">Level Analytics</h1>
        <p className="text-caption">Last 30 days · Recommendations, courtesy upgrades, and mismatch hotspots</p>
      </div>

      {/* F4-fix: 3 tiles only — removed duplicate recommendation rate tile */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
        <StatTile
          icon={BarChart3}
          label="Jobs with Levels"
          value={data.totalJobsWithLevels}
        />
        <StatTile
          icon={Lightbulb}
          label="Recommendations"
          value={data.totalRecommendations}
          sub={`${data.recommendationRate}% of leveled jobs`}
          alert={data.recommendationRate > 30}
        />
        <StatTile
          icon={ArrowUpCircle}
          label="Courtesy Upgrades"
          value={data.totalCourtesyUpgrades}
          sub={`${data.courtesyRate}% of leveled jobs`}
          alert={data.courtesyRate > 15}
        />
      </div>

      {/* Mismatch table */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Mismatch Hotspots (SKU × Zone)
        </h2>
        {data.mismatchRows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No mismatches detected in the last 30 days</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead className="text-right">Jobs</TableHead>
                  <TableHead className="text-right">Recs</TableHead>
                  <TableHead className="text-right">Courtesy</TableHead>
                  <TableHead className="text-right">Mismatch %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.mismatchRows.slice(0, 20).map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm">{row.sku_name}</TableCell>
                    <TableCell className="text-sm">{row.zone_name}</TableCell>
                    <TableCell className="text-right text-sm">{row.total_jobs}</TableCell>
                    <TableCell className="text-right text-sm">{row.recommendation_count}</TableCell>
                    <TableCell className="text-right text-sm">{row.courtesy_count}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={row.mismatch_rate > 30 ? "destructive" : row.mismatch_rate > 15 ? "secondary" : "outline"}
                        className="text-[10px]"
                      >
                        {row.mismatch_rate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Outlier providers */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Outlier Providers (High Courtesy Rate)
        </h2>
        {data.outlierProviders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No outlier providers detected</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider Org</TableHead>
                  <TableHead className="text-right">Courtesy Upgrades</TableHead>
                  <TableHead className="text-right">Total Jobs</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.outlierProviders.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm">{p.org_name}</TableCell>
                    <TableCell className="text-right text-sm">{p.courtesy_count}</TableCell>
                    <TableCell className="text-right text-sm">{p.total_jobs}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive" className="text-[10px]">{p.rate_pct}%</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
