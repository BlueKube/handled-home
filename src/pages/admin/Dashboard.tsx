import { useNavigate } from "react-router-dom";
import { useOpsMetrics } from "@/hooks/useOpsMetrics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, DollarSign, MapPin, TrendingUp, Gauge, Briefcase,
  AlertTriangle, ChevronRight, Building2, CreditCard,
  ShieldAlert, Clock, Sparkles, CheckCircle, Package,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { SparklineChart } from "@/components/SparklineChart";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function formatCents(cents: number) {
  return "$" + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface QuickLink {
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
}

const quickLinks: QuickLink[] = [
  { label: "Ops Cockpit", description: "Real-time operational health", icon: Gauge, path: "/admin/ops" },
  { label: "Providers", description: "Manage provider network", icon: Building2, path: "/admin/providers" },
  { label: "Jobs", description: "View and manage all jobs", icon: Briefcase, path: "/admin/jobs" },
  { label: "Billing", description: "Revenue and payments", icon: CreditCard, path: "/admin/billing" },
  { label: "Support", description: "Tickets and resolution", icon: ShieldAlert, path: "/admin/support" },
  { label: "Growth", description: "Signups, referrals, BYOC", icon: TrendingUp, path: "/admin/growth" },
];

export default function AdminDashboard() {
  const nav = useNavigate();
  const { data: ops, isLoading: opsLoading } = useOpsMetrics();

  const { data: counts, isLoading: countsLoading } = useQuery({
    queryKey: ["admin-dashboard-counts"],
    queryFn: async () => {
      const [custRes, zonesRes, subsRes, provRes, appsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("zones").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("provider_organizations").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("provider_applications").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
      ]);
      return {
        customers: custRes.count ?? 0,
        activeZones: zonesRes.count ?? 0,
        activeSubs: subsRes.count ?? 0,
        activeProviders: provRes.count ?? 0,
        pendingApplications: appsRes.count ?? 0,
      };
    },
  });

  const isLoading = opsLoading || countsLoading;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Admin Console</h1>
        <p className="text-sm text-muted-foreground">Operations overview</p>
      </div>

      {/* Key Metrics */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard icon={Users} label="Customers" value={counts?.customers ?? 0} />
            <StatCard icon={Building2} label="Active Providers" value={counts?.activeProviders ?? 0} />
            <StatCard icon={TrendingUp} label="Active Subs" value={counts?.activeSubs ?? 0} />
            <StatCard icon={Briefcase} label="Jobs Today" value={ops?.jobsScheduledToday ?? 0} />
            <StatCard icon={DollarSign} label="Revenue Today" value={formatCents(ops?.paidTodayCents ?? 0)} />
            <StatCard icon={MapPin} label="Active Zones" value={counts?.activeZones ?? 0} />
          </div>

          {/* Today's Execution */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Today's Execution</h2>
              <Badge variant="outline" className="text-xs">
                {ops?.completionPct ?? 0}% complete
              </Badge>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 mb-3">
              <div
                className="bg-accent h-2 rounded-full transition-all"
                style={{ width: `${Math.min(ops?.completionPct ?? 0, 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold">{ops?.jobsScheduledToday ?? 0}</p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
              <div>
                <p className="text-lg font-bold">{ops?.jobsCompletedToday ?? 0}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div>
                <p className="text-lg font-bold text-destructive">{ops?.jobsInIssue ?? 0}</p>
                <p className="text-xs text-muted-foreground">Issues</p>
              </div>
            </div>
          </Card>

          {/* Alerts */}
          {((ops?.pastDueCount ?? 0) > 0 || (ops?.failedPaymentsToday ?? 0) > 0 || (counts?.pendingApplications ?? 0) > 0 || (ops?.zonesOverCapacity ?? 0) > 0) && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Attention Needed</h2>
              {(ops?.pastDueCount ?? 0) > 0 && (
                <Card
                  className="p-3 border-destructive/30 bg-destructive/5 cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => nav("/admin/billing")}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{ops?.pastDueCount} past-due invoices</p>
                      <p className="text-xs text-muted-foreground">Customers with payment failures</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                </Card>
              )}
              {(ops?.failedPaymentsToday ?? 0) > 0 && (
                <Card
                  className="p-3 border-warning/30 bg-warning/5 cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => nav("/admin/ops/billing")}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-warning shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{ops?.failedPaymentsToday} failed payments today</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                </Card>
              )}
              {(counts?.pendingApplications ?? 0) > 0 && (
                <Card
                  className="p-3 border-accent/30 bg-accent/5 cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => nav("/admin/providers/applications")}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-accent shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{counts?.pendingApplications} pending provider application{(counts?.pendingApplications ?? 0) !== 1 ? "s" : ""}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                </Card>
              )}
              {(ops?.zonesOverCapacity ?? 0) > 0 && (
                <Card
                  className="p-3 border-warning/30 bg-warning/5 cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => nav("/admin/ops/zones")}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-warning shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{ops?.zonesOverCapacity} zone{(ops?.zonesOverCapacity ?? 0) !== 1 ? "s" : ""} at capacity</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* 7-Day Trends */}
          {ops?.trends && Object.keys(ops.trends).length > 0 && (
            <Card className="p-4">
              <h2 className="text-sm font-semibold mb-3">7-Day Trends</h2>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {ops.trends.jobs_completed && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Jobs Completed</p>
                    <SparklineChart data={ops.trends.jobs_completed} color="hsl(var(--accent))" height={28} />
                  </div>
                )}
                {ops.trends.revenue && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                    <SparklineChart data={ops.trends.revenue} color="hsl(var(--success))" height={28} />
                  </div>
                )}
                {ops.trends.signups && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Signups</p>
                    <SparklineChart data={ops.trends.signups} color="hsl(var(--primary))" height={28} />
                  </div>
                )}
                {ops.trends.issues && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Issues</p>
                    <SparklineChart data={ops.trends.issues} color="hsl(var(--destructive))" height={28} />
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Growth Snapshot */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold mb-3">Growth (7 days)</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 mx-auto mb-1">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
                <p className="text-lg font-bold">{ops?.referralsActivated ?? 0}</p>
                <p className="text-xs text-muted-foreground">Referrals</p>
              </div>
              <div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 mx-auto mb-1">
                  <Building2 className="h-4 w-4 text-accent" />
                </div>
                <p className="text-lg font-bold">{ops?.providerApplications ?? 0}</p>
                <p className="text-xs text-muted-foreground">Applications</p>
              </div>
              <div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 mx-auto mb-1">
                  <Package className="h-4 w-4 text-accent" />
                </div>
                <p className="text-lg font-bold">{ops?.providerInvitesSent ?? 0}</p>
                <p className="text-xs text-muted-foreground">BYOC Invites</p>
              </div>
            </div>
          </Card>

          {/* Quality (7d) */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold mb-3">Quality (7 days)</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold">{ops?.issueRate ?? 0}%</p>
                <p className="text-xs text-muted-foreground">Issue Rate</p>
              </div>
              <div>
                <p className="text-lg font-bold">{formatCents(ops?.creditsIssuedCents ?? 0)}</p>
                <p className="text-xs text-muted-foreground">Credits Issued</p>
              </div>
              <div>
                <p className="text-lg font-bold">{ops?.redoIntents ?? 0}</p>
                <p className="text-xs text-muted-foreground">Redo Requests</p>
              </div>
            </div>
          </Card>

          {/* Quick Links */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">Quick Access</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {quickLinks.map((link) => (
                <Card
                  key={link.path}
                  variant="interactive"
                  className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => nav(link.path)}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 shrink-0">
                      <link.icon className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{link.label}</p>
                      <p className="text-xs text-muted-foreground">{link.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Hot Zones */}
          {ops?.hotZones && ops.hotZones.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Hot Zones</h2>
                <Button variant="ghost" size="sm" className="text-xs h-auto p-0" onClick={() => nav("/admin/ops/zones")}>
                  View all →
                </Button>
              </div>
              <div className="space-y-2">
                {ops.hotZones.map((zone) => (
                  <div key={zone.zone_name} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-accent" />
                      <span className="text-sm">{zone.zone_name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {zone.demand} new sub{zone.demand !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
