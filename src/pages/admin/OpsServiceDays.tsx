import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Clock, XCircle, Settings, AlertTriangle, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

export default function OpsServiceDays() {
  const nav = useNavigate();
  const [tab, setTab] = useState("overview");

  const { data, isLoading } = useQuery({
    queryKey: ["ops-service-day-health-full"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [assignmentsRes, overridesRes, capsRes, zonesRes] = await Promise.all([
        supabase.from("service_day_assignments").select("id, status, rejection_used, created_at, zone_id, customer_id"),
        supabase.from("service_day_override_log").select("id, zone_id, admin_user_id, reason, created_at, previous_day, new_day").gte("created_at", sevenDaysAgo.toISOString()).order("created_at", { ascending: false }),
        supabase.from("zone_service_day_capacity").select("zone_id, max_homes, assigned_count"),
        supabase.from("zones").select("id, name").eq("status", "active"),
      ]);

      const assignments = assignmentsRes.data ?? [];
      const overrides = overridesRes.data ?? [];
      const zones = zonesRes.data ?? [];
      const zoneMap = new Map(zones.map((z: any) => [z.id, z.name]));

      const offered = assignments.filter((a: any) => a.status === "offered").length;
      const confirmed = assignments.filter((a: any) => a.status === "confirmed").length;
      const total7d = assignments.filter((a: any) => a.created_at >= sevenDaysAgo.toISOString()).length;
      const rejected7d = assignments.filter((a: any) => a.rejection_used && a.created_at >= sevenDaysAgo.toISOString()).length;
      const total30d = assignments.filter((a: any) => a.created_at >= thirtyDaysAgo.toISOString()).length;
      const rejected30d = assignments.filter((a: any) => a.rejection_used && a.created_at >= thirtyDaysAgo.toISOString()).length;

      // Capacity exceptions: zones where assigned >= max
      const caps = capsRes.data ?? [];
      let capacityExceptions = 0;
      caps.forEach((c: any) => {
        if (c.max_homes > 0 && c.assigned_count >= c.max_homes) capacityExceptions++;
      });

      // Zones with high rejection rate
      const rejByZone: Record<string, { total: number; rejected: number }> = {};
      assignments.filter((a: any) => a.created_at >= sevenDaysAgo.toISOString()).forEach((a: any) => {
        const zid = a.zone_id || "unknown";
        if (!rejByZone[zid]) rejByZone[zid] = { total: 0, rejected: 0 };
        rejByZone[zid].total++;
        if (a.rejection_used) rejByZone[zid].rejected++;
      });
      const highRejZones = Object.entries(rejByZone)
        .map(([zid, v]) => ({ zone_name: zoneMap.get(zid) || zid.slice(0, 8), rate: v.total > 0 ? Math.round((v.rejected / v.total) * 100) : 0, rejected: v.rejected, total: v.total }))
        .filter((z) => z.rate > 20)
        .sort((a, b) => b.rate - a.rate);

      return {
        offerBacklog: offered,
        confirmed,
        rejectionRate7d: total7d > 0 ? Math.round((rejected7d / total7d) * 100) : 0,
        rejectionRate30d: total30d > 0 ? Math.round((rejected30d / total30d) * 100) : 0,
        overridesCount7d: overrides.length,
        capacityExceptions,
        overrides: overrides.map((o: any) => ({ ...o, zone_name: zoneMap.get(o.zone_id) || o.zone_id?.slice(0, 8) })),
        highRejZones,
        assignmentsByStatus: { offered, confirmed, rejected: rejected7d },
      };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 grid-cols-2">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/admin/ops")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-h2">Service Day Health</h1>
          <p className="text-caption">Density + predictability signals</p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Clock} label="Offer Backlog" value={data.offerBacklog} />
        <StatCard icon={XCircle} label="Rejection (7d)" value={`${data.rejectionRate7d}%`} />
        <StatCard icon={AlertTriangle} label="Rejection (30d)" value={`${data.rejectionRate30d}%`} />
        <StatCard icon={Settings} label="Overrides (7d)" value={data.overridesCount7d} />
        <StatCard icon={ShieldAlert} label="Cap Blocked" value={data.capacityExceptions} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">By Status</TabsTrigger>
          <TabsTrigger value="overrides">Override Log ({data.overridesCount7d})</TabsTrigger>
          <TabsTrigger value="high-rej">High Rejection ({data.highRejZones.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Assignments by Status (7d)</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{data.assignmentsByStatus.offered}</p>
                <p className="text-caption">Offered</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{data.assignmentsByStatus.confirmed}</p>
                <p className="text-caption">Confirmed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{data.assignmentsByStatus.rejected}</p>
                <p className="text-caption">Rejected</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="overrides">
          {data.overrides.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No overrides in last 7 days.</p>
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.overrides.map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.zone_name}</TableCell>
                      <TableCell className="text-xs">{o.previous_day || "—"} → {o.new_day || "—"}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{o.reason || "—"}</TableCell>
                      <TableCell className="text-xs">{format(new Date(o.created_at), "MMM d HH:mm")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="high-rej">
          {data.highRejZones.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No zones with rejection rate above 20%.</p>
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead>Rejection Rate</TableHead>
                    <TableHead>Rejected / Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.highRejZones.map((z: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{z.zone_name}</TableCell>
                      <TableCell>
                        <Badge variant={z.rate >= 50 ? "destructive" : "outline"}>{z.rate}%</Badge>
                      </TableCell>
                      <TableCell>{z.rejected} / {z.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
