import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, Users, Send, Briefcase, Zap, ShieldAlert, AlertTriangle } from "lucide-react";

export default function OpsGrowth() {
  const nav = useNavigate();
  const [tab, setTab] = useState("overview");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ops-growth-health-full"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const since = sevenDaysAgo.toISOString();

      const [
        referralsRes, applicationsRes, riskFlagsRes,
        invitesRes, cohortsRes, referralListRes,
        appListRes, heldRewardsRes,
      ] = await Promise.all([
        (supabase.from("referrals") as any).select("id", { count: "exact", head: true }).eq("status", "ACTIVATED").gte("created_at", since),
        supabase.from("provider_applications").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("referral_risk_flags").select("id", { count: "exact", head: true }).eq("status", "open" as any),
        // Provider invites sent
        supabase.from("growth_events").select("id", { count: "exact", head: true }).eq("event_type", "invite_sent" as any).gte("created_at", since),
        // Founding Partner cohorts (top by velocity = count of recent activations)
        supabase.from("market_cohorts").select("id, label, status, zone_id, zones(name)").eq("status", "active"),
        // Referral leaderboard
        (supabase.from("referrals") as any).select("referrer_id, status, zone_id, zones(name)").eq("status", "ACTIVATED").gte("created_at", since),
        // Provider application funnel
        supabase.from("provider_applications").select("id, status, category, created_at, user_id").gte("created_at", since).order("created_at", { ascending: false }).limit(50),
        // Held rewards
        supabase.from("referral_risk_flags").select("id, referral_id, flag_type, reason, status, created_at").eq("status", "open" as any).order("created_at", { ascending: false }).limit(50),
      ]);

      // Referral leaderboard
      const refs = referralListRes.data ?? [];
      const byReferrer: Record<string, { count: number; zones: Set<string> }> = {};
      refs.forEach((r: any) => {
        const rid = r.referrer_id || "unknown";
        if (!byReferrer[rid]) byReferrer[rid] = { count: 0, zones: new Set() };
        byReferrer[rid].count++;
        if (r.zones?.name) byReferrer[rid].zones.add(r.zones.name);
      });
      const leaderboard = Object.entries(byReferrer)
        .map(([rid, v]) => ({ referrer_id: rid, count: v.count, zones: Array.from(v.zones).join(", ") }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      // App funnel
      const apps = appListRes.data ?? [];
      const appByStatus: Record<string, number> = {};
      apps.forEach((a: any) => {
        appByStatus[a.status] = (appByStatus[a.status] || 0) + 1;
      });
      const appFunnel = Object.entries(appByStatus)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);

      // Cohort velocity (simplified: count active cohorts)
      const cohorts = (cohortsRes.data ?? []).map((c: any) => ({
        id: c.id,
        label: c.label,
        zone_name: c.zones?.name || "—",
      })).slice(0, 3);

      return {
        referralsActivated: referralsRes.count ?? 0,
        providerApplications: applicationsRes.count ?? 0,
        fraudHolds: riskFlagsRes.count ?? 0,
        providerInvitesSent: invitesRes.count ?? 0,
        cohorts,
        leaderboard,
        appFunnel,
        heldRewards: heldRewardsRes.data ?? [],
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

  if (isError) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-h2">Growth</h1>
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">Failed to load Growth data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/admin/ops")} aria-label="Back to Ops Cockpit">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-h2">Growth Health</h1>
          <p className="text-caption">Referrals, provider pipeline, risk (7 days)</p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Users} label="Referrals" value={data.referralsActivated} />
        <StatCard icon={Send} label="Invites Sent" value={data.providerInvitesSent} />
        <StatCard icon={Briefcase} label="Provider Apps" value={data.providerApplications} />
        <StatCard icon={Zap} label="FP Cohorts" value={data.cohorts.length} />
        <StatCard icon={ShieldAlert} label="Fraud Holds" value={data.fraudHolds} />
      </div>

      {/* FP Cohorts summary */}
      {data.cohorts.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Active Founding Partner Cohorts</h3>
          <div className="space-y-1">
            {data.cohorts.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{c.label}</span>
                <span className="text-muted-foreground">{c.zone_name}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leaderboard">Referral Board ({data.leaderboard.length})</TabsTrigger>
          <TabsTrigger value="funnel">App Funnel</TabsTrigger>
          <TabsTrigger value="holds">Held Rewards ({data.heldRewards.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="p-4">
            <p className="text-muted-foreground text-sm mb-3">Deep links to growth admin for actions.</p>
            <Button variant="outline" size="sm" onClick={() => nav("/admin/growth")}>
              Open Growth Admin →
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          {data.leaderboard.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No referral activity in last 7 days.</p>
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Activations</TableHead>
                    <TableHead>Zones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.leaderboard.map((r: any, i: number) => (
                    <TableRow key={r.referrer_id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{r.referrer_id.slice(0, 8)}…</TableCell>
                      <TableCell className="font-medium">{r.count}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.zones || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="funnel">
          {data.appFunnel.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No applications in last 7 days.</p>
          ) : (
            <Card className="p-4 space-y-2">
              <h3 className="font-semibold mb-2">Provider Application Funnel</h3>
              {data.appFunnel.map((s: any) => (
                <div key={s.status} className="flex items-center justify-between py-1">
                  <Badge variant="outline" className="capitalize">{s.status}</Badge>
                  <span className="font-medium">{s.count}</span>
                </div>
              ))}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="holds">
          {data.heldRewards.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No held rewards.</p>
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referral</TableHead>
                    <TableHead>Flag Type</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.heldRewards.map((h: any) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-mono text-xs">{h.referral_id?.slice(0, 8)}…</TableCell>
                      <TableCell><Badge variant="outline">{h.flag_type}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{h.reason || "—"}</TableCell>
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
