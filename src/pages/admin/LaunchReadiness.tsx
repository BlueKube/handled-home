import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, AlertTriangle, Rocket } from "lucide-react";

interface CheckItem {
  label: string;
  description: string;
  status: "pass" | "fail" | "warn";
  detail?: string;
}

function useReadinessChecks() {
  return useQuery({
    queryKey: ["launch-readiness"],
    queryFn: async () => {
      const checks: CheckItem[] = [];

      // 1. Zones configured
      const { count: zoneCount } = await supabase
        .from("zones")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");
      checks.push({
        label: "Zones Configured",
        description: "At least 1 active zone exists",
        status: (zoneCount ?? 0) > 0 ? "pass" : "fail",
        detail: `${zoneCount ?? 0} active zone(s)`,
      });

      // 2. SKUs active
      const { count: skuCount } = await supabase
        .from("service_skus")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");
      checks.push({
        label: "Service SKUs Active",
        description: "At least 5 active SKUs in catalog",
        status: (skuCount ?? 0) >= 5 ? "pass" : (skuCount ?? 0) > 0 ? "warn" : "fail",
        detail: `${skuCount ?? 0} active SKU(s)`,
      });

      // 3. Plans active
      const { count: planCount } = await supabase
        .from("plans")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");
      checks.push({
        label: "Plans Active",
        description: "At least 1 active subscription plan",
        status: (planCount ?? 0) > 0 ? "pass" : "fail",
        detail: `${planCount ?? 0} active plan(s)`,
      });

      // 4. Plans have Stripe price IDs
      const { data: plansWithoutStripe } = await supabase
        .from("plans")
        .select("id, name")
        .eq("status", "active")
        .is("stripe_price_id", null);
      const missingStripe = plansWithoutStripe?.length ?? 0;
      checks.push({
        label: "Stripe Pricing Configured",
        description: "All active plans have Stripe price IDs",
        status: missingStripe === 0 && (planCount ?? 0) > 0 ? "pass" : "fail",
        detail: missingStripe > 0
          ? `${missingStripe} plan(s) missing Stripe price`
          : "All plans configured",
      });

      // 5. Providers onboarded
      const { count: providerCount } = await supabase
        .from("provider_orgs")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");
      checks.push({
        label: "Providers Onboarded",
        description: "At least 3 active provider orgs for zone density",
        status: (providerCount ?? 0) >= 3 ? "pass" : (providerCount ?? 0) > 0 ? "warn" : "fail",
        detail: `${providerCount ?? 0} active provider org(s)`,
      });

      // 6. Provider payout accounts
      const { count: payoutAccountCount } = await supabase
        .from("provider_payout_accounts")
        .select("id", { count: "exact", head: true })
        .eq("status", "READY");
      checks.push({
        label: "Provider Payout Accounts",
        description: "At least 1 provider has a connected Stripe account",
        status: (payoutAccountCount ?? 0) > 0 ? "pass" : "fail",
        detail: `${payoutAccountCount ?? 0} ready account(s)`,
      });

      // 7. Cron health — check recent cron_run_log entries
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: recentCronRuns } = await supabase
        .from("cron_run_log")
        .select("id", { count: "exact", head: true })
        .gte("started_at", oneDayAgo);
      checks.push({
        label: "Cron Jobs Running",
        description: "At least 1 cron job ran in the last 24 hours",
        status: (recentCronRuns ?? 0) > 0 ? "pass" : "warn",
        detail: `${recentCronRuns ?? 0} run(s) in last 24h`,
      });

      // 8. BYOC invite templates exist
      const { count: byocTemplateCount } = await supabase
        .from("byoc_invite_links")
        .select("id", { count: "exact", head: true });
      checks.push({
        label: "BYOC Invites Available",
        description: "BYOC invite system has entries or is ready",
        status: (byocTemplateCount ?? 0) > 0 ? "pass" : "warn",
        detail: `${byocTemplateCount ?? 0} invite(s) created`,
      });

      // 9. Entitlement versions configured
      const { count: entitlementCount } = await supabase
        .from("plan_entitlement_versions")
        .select("id", { count: "exact", head: true });
      checks.push({
        label: "Plan Entitlements Configured",
        description: "Plans have entitlement versions defining handle budgets",
        status: (entitlementCount ?? 0) > 0 ? "pass" : "fail",
        detail: `${entitlementCount ?? 0} version(s)`,
      });

      return checks;
    },
  });
}

const statusIcon = {
  pass: <CheckCircle2 className="h-5 w-5 text-green-400" />,
  fail: <XCircle className="h-5 w-5 text-destructive" />,
  warn: <AlertTriangle className="h-5 w-5 text-amber-400" />,
};

const statusBadge = {
  pass: <Badge className="bg-green-900/40 text-green-400 border-green-500/20">Pass</Badge>,
  fail: <Badge variant="destructive">Fail</Badge>,
  warn: <Badge className="bg-amber-900/40 text-amber-400 border-amber-500/20">Warning</Badge>,
};

export default function AdminLaunchReadiness() {
  const { data: checks, isLoading } = useReadinessChecks();

  const passCount = checks?.filter((c) => c.status === "pass").length ?? 0;
  const failCount = checks?.filter((c) => c.status === "fail").length ?? 0;
  const totalCount = checks?.length ?? 0;
  const allGreen = failCount === 0 && totalCount > 0;

  if (isLoading || !checks) {
    return (
      <div className="animate-fade-in p-6 space-y-6">
        <h1 className="text-h2">Launch Readiness</h1>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 mb-0.5">Launch Readiness</h1>
          <p className="text-caption">
            Pre-launch checklist for zone activation. All items should be green before going live.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Rocket className={`h-5 w-5 ${allGreen ? "text-green-400" : "text-muted-foreground"}`} />
          <span className={`text-sm font-medium ${allGreen ? "text-green-400" : "text-muted-foreground"}`}>
            {passCount}/{totalCount} passing
          </span>
        </div>
      </div>

      {allGreen && (
        <Card className="p-4 border-green-500/30 bg-green-950/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
            <div>
              <p className="font-medium text-green-400">Ready to Launch</p>
              <p className="text-xs text-green-400/70">All prerequisite checks are passing.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {checks.map((check, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-4">
              {statusIcon[check.status]}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{check.label}</p>
                  {statusBadge[check.status]}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{check.description}</p>
              </div>
              {check.detail && (
                <span className="text-xs text-muted-foreground shrink-0">{check.detail}</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
