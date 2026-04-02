import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Mail, Rocket, TrendingUp, UserPlus, UserX, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useByocFunnelStats, useReferralFunnelStats, useByopFunnelStats } from "@/hooks/useGrowthEvents";
import { useByopRecommendations } from "@/hooks/useByopRecommendation";

function FunnelBar({ steps }: { steps: { label: string; count: number }[] }) {
  const max = Math.max(1, ...steps.map((s) => s.count));
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-3">
          <span className="text-xs w-24 text-muted-foreground">{step.label}</span>
          <div className="flex-1 h-6 bg-muted rounded-sm overflow-hidden">
            <div
              className="h-full bg-primary/70 rounded-sm transition-all"
              style={{ width: `${(step.count / max) * 100}%`, minWidth: step.count > 0 ? "2px" : 0 }}
            />
          </div>
          <span className="text-xs font-medium w-12 text-right">{step.count}</span>
          {i > 0 && steps[i - 1].count > 0 && (
            <span className="text-xs text-muted-foreground w-12 text-right">
              {Math.round((step.count / steps[i - 1].count) * 100)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ByopAdminList() {
  const { recommendations, declineRecommendation } = useByopRecommendations({ admin: true });
  const [decliningId, setDecliningId] = useState<string | null>(null);

  const actionable = (recommendations.data ?? []).filter(
    (r: any) => r.status === "under_review" || r.status === "accepted"
  );

  const handleDecline = useCallback((id: string, providerName: string) => {
    if (!window.confirm(`Mark "${providerName}" as provider declined? This cannot be undone.`)) return;
    setDecliningId(id);
    declineRecommendation.mutate(id, {
      onSettled: () => setDecliningId(null),
    });
  }, [declineRecommendation]);

  if (actionable.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <UserX className="h-4 w-4" />
          BYOP Recommendations — Provider Actions
        </CardTitle>
        <p className="text-xs text-muted-foreground">Mark recommendations as provider declined when the provider is unavailable</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {actionable.map((rec: any) => (
          <div key={rec.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
            <div>
              <p className="text-sm font-medium">{rec.provider_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{rec.category?.replace(/_/g, " ")} · {rec.status.replace(/_/g, " ")}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs text-warning border-warning/30 hover:bg-warning/10"
              onClick={() => handleDecline(rec.id, rec.provider_name)}
              disabled={decliningId === rec.id}
            >
              <UserX className="h-3 w-3 mr-1" />
              Provider Declined
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function FunnelsTab() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("30d");

  const dateFilter = useMemo(() => {
    if (dateRange === "all") return undefined;
    const start = new Date();
    start.setDate(start.getDate() - (dateRange === "7d" ? 7 : 30));
    return { start: start.toISOString(), end: new Date().toISOString() };
  }, [dateRange]);

  const byoc = useByocFunnelStats(dateFilter);
  const referral = useReferralFunnelStats(dateFilter);
  const byop = useByopFunnelStats(dateFilter);

  const providerLeads = useQuery({
    queryKey: ["provider-leads-funnel"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("provider_leads") as any).select("status");
      if (error) throw error;
      const counts = { total: 0, new: 0, contacted: 0, applied: 0, declined: 0, notified: 0 };
      for (const row of data ?? []) {
        counts.total++;
        if (row.status in counts) counts[row.status as keyof typeof counts]++;
      }
      return counts;
    },
  });

  const isLoading = byoc.isLoading || referral.isLoading || byop.isLoading;
  if (isLoading) return <div className="space-y-4 mt-4"><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div>;

  const byocData = byoc.data ?? { invitesSent: 0, landingViews: 0, signups: 0, activated: 0 };
  const refData = referral.data ?? { codesShared: 0, landingViews: 0, signups: 0, subscribed: 0, firstVisit: 0 };
  const byopData = byop.data ?? { submitted: 0, underReview: 0, accepted: 0, notAFit: 0, providerUnavailable: 0 };

  const byocKFactor = byocData.invitesSent > 0 ? (byocData.activated / byocData.invitesSent) : 0;
  const refKFactor = refData.codesShared > 0 ? (refData.signups / refData.codesShared) : 0;
  const hasAnyData = byocData.invitesSent > 0 || refData.codesShared > 0 || byopData.submitted > 0;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-3">
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as "7d" | "30d" | "all")}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!hasAnyData && (
        <Card><CardContent className="py-12 text-center">
          <Rocket className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No growth events yet</p>
          <p className="text-xs text-muted-foreground mt-1">Your signups, BYOC activations, and referral conversions will appear here.</p>
        </CardContent></Card>
      )}

      <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><UserPlus className="h-4 w-4" />BYOC Activation Funnel</CardTitle></CardHeader>
        <CardContent><FunnelBar steps={[
          { label: "Invites Sent", count: byocData.invitesSent },
          { label: "Landing Views", count: byocData.landingViews },
          { label: "Signups", count: byocData.signups },
          { label: "Activated", count: byocData.activated },
        ]} /></CardContent>
      </Card>

      <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Referral Conversion Funnel</CardTitle></CardHeader>
        <CardContent><FunnelBar steps={[
          { label: "Codes Shared", count: refData.codesShared },
          { label: "Landing Views", count: refData.landingViews },
          { label: "Signups", count: refData.signups },
          { label: "Subscribed", count: refData.subscribed },
          { label: "First Visit", count: refData.firstVisit },
        ]} /></CardContent>
      </Card>

      <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />BYOP Recommendation Tracker</CardTitle></CardHeader>
        <CardContent>
          <FunnelBar steps={[
            { label: "Submitted", count: byopData.submitted },
            { label: "Under Review", count: byopData.underReview },
            { label: "Accepted", count: byopData.accepted },
          ]} />
          <div className="flex flex-wrap gap-3 mt-2">
            {byopData.notAFit > 0 && <p className="text-xs text-muted-foreground">{byopData.notAFit} marked as not a fit</p>}
            {byopData.providerUnavailable > 0 && <p className="text-xs text-warning">{byopData.providerUnavailable} provider declined</p>}
          </div>
        </CardContent>
      </Card>

      <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" />Provider Leads Pipeline</CardTitle></CardHeader>
        <CardContent>
          {providerLeads.isLoading ? <Skeleton className="h-12" /> : providerLeads.isError ? (
            <p className="text-xs text-destructive">Failed to load provider leads data.</p>
          ) : (
            <FunnelBar steps={[
              { label: "Total Leads", count: providerLeads.data?.total ?? 0 },
              { label: "New", count: providerLeads.data?.new ?? 0 },
              { label: "Contacted", count: providerLeads.data?.contacted ?? 0 },
              { label: "Applied", count: providerLeads.data?.applied ?? 0 },
              { label: "Declined", count: providerLeads.data?.declined ?? 0 },
            ]} />
          )}
        </CardContent>
      </Card>

      <Card><CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />K-factor Summary</CardTitle>
        <p className="text-xs text-muted-foreground">Activations per invite sent by loop</p>
      </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{byocKFactor.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">BYOC K-factor</p>
              <p className="text-xs text-muted-foreground">{byocData.activated} / {byocData.invitesSent} invites</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{refKFactor.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Referral K-factor</p>
              <p className="text-xs text-muted-foreground">{refData.signups} / {refData.codesShared} codes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ByopAdminList />
    </div>
  );
}
