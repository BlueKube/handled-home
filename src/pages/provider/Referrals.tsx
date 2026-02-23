import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Award, Copy, Link, Users, DollarSign, Clock, AlertTriangle, ChevronRight, TrendingUp, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useReferralRewards } from "@/hooks/useReferralRewards";
import { useReferralCodes } from "@/hooks/useReferralCodes";
import { useProviderApplication } from "@/hooks/useProviderApplication";
import { useProviderGrowthStats } from "@/hooks/useProviderGrowthStats";
import { useInviteScripts } from "@/hooks/useInviteScripts";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useMarketZoneState } from "@/hooks/useMarketZoneState";
import { useGrowthEvents } from "@/hooks/useGrowthEvents";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  on_hold: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  earned: "bg-primary/10 text-primary",
  applied: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  voided: "bg-destructive/10 text-destructive",
};

const APP_STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-primary/10 text-primary",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  waitlisted: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  rejected: "bg-destructive/10 text-destructive",
};

export default function ProviderReferrals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const rewards = useReferralRewards();
  const { codes, generateCode } = useReferralCodes();
  const { application } = useProviderApplication();
  const stats = useProviderGrowthStats();
  const { scripts } = useInviteScripts();
  const { org } = useProviderOrg();
  const { recordEvent } = useGrowthEvents();
  const { states } = useMarketZoneState();
  const milestonePromptTracked = useRef(false);

  const isLoading = rewards.isLoading || codes.isLoading || application.isLoading;

  const earnedCents = rewards.data?.filter((r: any) => ["earned", "applied", "paid"].includes(r.status)).reduce((s: number, r: any) => s + r.amount_cents, 0) ?? 0;
  const onHoldCents = rewards.data?.filter((r: any) => r.status === "on_hold").reduce((s: number, r: any) => s + r.amount_cents, 0) ?? 0;
  const paidCents = rewards.data?.filter((r: any) => r.status === "paid").reduce((s: number, r: any) => s + r.amount_cents, 0) ?? 0;

  const inviteLink = codes.data?.[0]?.code
    ? `${window.location.origin}/invite/${codes.data[0].code}`
    : null;

  const providerName = org?.name ?? "Your Pro";

  const app = application.data;
  const isFoundingPartner = app?.founding_partner === true;
  const isWaitlisted = app?.status === "waitlisted";
  const launchTarget = app?.launch_path_target ?? 0;
  const launchProgress = stats.data ? Math.min(stats.data.installs, launchTarget) : 0;
  const zoneState = states.data?.[0]?.status ?? "CLOSED";
  const hasNewEarned = rewards.data?.some((r: any) => r.status === "earned") ?? false;

  useEffect(() => {
    if (hasNewEarned && !milestonePromptTracked.current && user) {
      milestonePromptTracked.current = true;
      recordEvent.mutate({
        eventType: "milestone_share_shown",
        actorRole: "provider",
        sourceSurface: "provider_milestone_share",
        idempotencyKey: `milestone_prompt_${user.id}_${new Date().toISOString().slice(0, 10)}`,
      });
    }
  }, [hasNewEarned, user]);

  const copyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied!");
    }
  };

  const copyScript = (body: string) => {
    const text = body
      .replace("{provider_name}", providerName)
      .replace("{link}", inviteLink ?? "");
    navigator.clipboard.writeText(text);
    toast.success("Script copied!");
  };

  if (isLoading) {
    return <div className="p-4 space-y-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-48" /></div>;
  }

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Growth Hub</h1>
        {isFoundingPartner && (
          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-0 gap-1">
            <Award className="h-3 w-3" /> Founding Partner
          </Badge>
        )}
      </div>

      {/* Application status banner */}
      {app && app.status !== "approved" && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Application Status</p>
              <p className="text-xs text-muted-foreground mt-0.5">{app.category} · {app.zip_codes?.join(", ")}</p>
            </div>
            <Badge className={APP_STATUS_COLORS[app.status] ?? ""}>{app.status}</Badge>
          </CardContent>
        </Card>
      )}

      {/* Milestone share prompt */}
      {hasNewEarned && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="py-4 px-4 flex items-start gap-3">
            <Megaphone className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <p className="text-sm font-medium">
                {zoneState === "OPEN" ? "We're live — invite customers now" :
                 zoneState === "SOFT_LAUNCH" ? "Limited early spots available" :
                 "Launching soon — build your waitlist"}
              </p>
              <p className="text-xs text-muted-foreground">You've earned new bonuses! Keep growing your book.</p>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate("/provider/referrals/invite-customers")}>
                <ChevronRight className="h-3.5 w-3.5" /> Invite more customers
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Customers section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Invite Customers
        </h2>

        {inviteLink ? (
          <Button onClick={copyLink} className="w-full gap-2">
            <Copy className="h-4 w-4" /> Copy Invite Link
          </Button>
        ) : (
          <Button
            onClick={async () => {
              // P3: Fallback to first active program if no codes exist yet
              let programId = codes.data?.[0]?.program_id;
              if (!programId) {
                const { data: programs } = await (supabase as any)
                  .from("referral_programs")
                  .select("id")
                  .eq("status", "active")
                  .limit(1);
                programId = programs?.[0]?.id;
              }
              if (programId) {
                generateCode.mutate(programId);
              } else {
                toast.error("No active referral program found.");
              }
            }}
            variant="outline"
            className="w-full gap-2"
            disabled={generateCode.isPending}
          >
            <Link className="h-4 w-4" /> Generate Invite Link
          </Button>
        )}

        {/* SMS Scripts */}
        {scripts.data && scripts.data.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">SMS Scripts (tap to copy)</p>
            {scripts.data.map((s: any) => (
              <Card key={s.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => copyScript(s.body)}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs capitalize">{s.tone}</Badge>
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.body.replace("{provider_name}", providerName).replace("{link}", inviteLink ?? "[link]")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Progress stats */}
        {stats.data && (
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: "Sent", value: stats.data.invitesSent },
              { label: "Installs", value: stats.data.installs },
              { label: "Subs", value: stats.data.subscriptions },
              { label: "Visits", value: stats.data.firstVisits },
              { label: "Bonuses", value: `$${((stats.data.bonusesPendingCents + stats.data.bonusesPaidCents) / 100).toFixed(0)}` },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => navigate("/provider/referrals/invite-customers")}
        >
          <ChevronRight className="h-4 w-4" /> Full Invite Toolkit
        </Button>
      </div>

      {/* Launch Path (waitlisted) */}
      {isWaitlisted && launchTarget > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" /> Launch Path
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={(launchProgress / launchTarget) * 100} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {launchProgress} / {launchTarget} customers — Invite {Math.max(0, launchTarget - launchProgress)} more to unlock priority activation
            </p>
            {app?.waitlist_reason && (
              <p className="text-xs text-amber-600">{app.waitlist_reason}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bonus Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <DollarSign className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold">${(earnedCents / 100).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Clock className="h-5 w-5 text-amber-500 mx-auto mb-1" />
            <p className="text-xl font-bold">${(onHoldCents / 100).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">On Hold</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-xl font-bold">${(paidCents / 100).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Reward History */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Reward History</h2>
        {rewards.data && rewards.data.length > 0 ? (
          <div className="space-y-2">
            {rewards.data.map((r: any) => (
              <Card key={r.id}>
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">${(r.amount_cents / 100).toFixed(2)}</p>
                      <Badge className={`text-xs ${STATUS_COLORS[r.status] || ""}`}>{r.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.referral_programs?.name} · {r.milestone}
                    </p>
                    {r.status === "on_hold" && r.hold_reason && (
                      <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3" /> {r.hold_reason}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No referral bonuses yet. Start inviting customers!</p>
        )}
      </div>
    </div>
  );
}
