import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Link, ChevronLeft, Info, Users, DollarSign, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useReferralCodes } from "@/hooks/useReferralCodes";
import { useInviteScripts } from "@/hooks/useInviteScripts";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useGrowthEvents } from "@/hooks/useGrowthEvents";
import { useByocAttributions } from "@/hooks/useByocAttributions";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { differenceInCalendarDays, differenceInWeeks, format } from "date-fns";
import { formatCents } from "@/utils/format";

function statusBadgeVariant(s: string): "default" | "secondary" | "outline" | "destructive" {
  switch (s) {
    case "ACTIVE": return "default";
    case "PENDING": return "secondary";
    case "ENDED": return "outline";
    case "REVOKED": return "destructive";
    default: return "outline";
  }
}

function ByocDashboard() {
  const { attributions, activeCount, pendingCount, totalEarnedCents, isLoading, isError } = useByocAttributions();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-40 rounded-xl" />;
  if (isError) return (
    <Card className="p-4">
      <p className="text-xs text-destructive text-center">Failed to load attribution data.</p>
    </Card>
  );
  if (attributions.length === 0) return null;

  const now = new Date();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Customers I Brought
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-muted/40">
            <p className="text-lg font-bold text-primary">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/40">
            <p className="text-lg font-bold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/40">
            <p className="text-lg font-bold text-success">{formatCents(totalEarnedCents)}</p>
            <p className="text-xs text-muted-foreground">Earned</p>
          </div>
        </div>

        {/* Attribution list */}
        <div className="space-y-2">
          {attributions.slice(0, 10).map((a) => {
            const isActive = a.status === "ACTIVE";
            const bonusWeeksTotal = a.bonus_start_at && a.bonus_end_at
              ? Math.ceil(differenceInCalendarDays(new Date(a.bonus_end_at), new Date(a.bonus_start_at)) / 7)
              : 13;
            const bonusWeeksElapsed = a.bonus_start_at
              ? Math.max(0, differenceInWeeks(now, new Date(a.bonus_start_at)))
              : 0;
            const bonusWeeksRemaining = Math.max(0, bonusWeeksTotal - bonusWeeksElapsed);
            const isExpanded = expanded === a.id;

            return (
              <div
                key={a.id}
                className="border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : a.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadgeVariant(a.status)} className="text-xs">
                      {a.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Invited {format(new Date(a.invited_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>

                {isExpanded && (
                  <div className="mt-3 space-y-2 text-xs">
                    {isActive && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bonus window</span>
                          <span>Week {bonusWeeksElapsed + 1} of {bonusWeeksTotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Weeks remaining</span>
                          <span className="font-medium">{bonusWeeksRemaining}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary rounded-full h-1.5 transition-all"
                            style={{ width: `${Math.min(100, (bonusWeeksElapsed / bonusWeeksTotal) * 100)}%` }}
                          />
                        </div>
                      </>
                    )}
                    {a.status === "PENDING" && (
                      <div className="flex items-start gap-2 p-2 rounded bg-muted/40">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                        <p className="text-muted-foreground">
                          Bonus starts when customer completes their first visit.
                        </p>
                      </div>
                    )}
                    {a.first_completed_visit_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">First visit</span>
                        <span>{format(new Date(a.first_completed_visit_at), "MMM d, yyyy")}</span>
                      </div>
                    )}
                    {a.subscribed_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subscribed</span>
                        <span>{format(new Date(a.subscribed_at), "MMM d, yyyy")}</span>
                      </div>
                    )}
                    {a.status === "REVOKED" && a.revoked_reason && (
                      <div className="flex items-start gap-2 p-2 rounded bg-destructive/10">
                        <Info className="h-3.5 w-3.5 text-destructive mt-0.5" />
                        <p className="text-destructive">{a.revoked_reason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function InviteCustomers() {
  const navigate = useNavigate();
  const { codes, generateCode } = useReferralCodes();
  const { scripts } = useInviteScripts();
  const { org } = useProviderOrg();
  const { recordEvent } = useGrowthEvents();
  const { user } = useAuth();

  const inviteLink = codes.data?.[0]?.code
    ? `${window.location.origin}/invite/${codes.data[0].code}`
    : null;
  const providerName = org?.name ?? "Your Pro";

  const copyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied!");
      recordEvent.mutate({
        eventType: "link_copied",
        actorRole: "provider",
        sourceSurface: "provider_milestone_share",
        idempotencyKey: `prov_copy_${user?.id}_${Date.now()}`,
      });
    }
  };

  const copyScript = (body: string) => {
    const text = body
      .replace("{provider_name}", providerName)
      .replace("{link}", inviteLink ?? "");
    navigator.clipboard.writeText(text);
    toast.success("Script copied!");
    recordEvent.mutate({
      eventType: "script_copied",
      actorRole: "provider",
      sourceSurface: "provider_milestone_share",
      idempotencyKey: `prov_script_${user?.id}_${Date.now()}`,
    });
  };

  if (codes.isLoading) return <div className="animate-fade-in p-4 pb-24"><Skeleton className="h-48" /></div>;

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-h2">Founding Partner Program</h1>
          <p className="text-caption mt-0.5">Earn $10/week per active customer for 90 days</p>
        </div>
      </div>

      {/* BYOC Dashboard */}
      <ByocDashboard />

      {/* Copy Link */}
      {inviteLink ? (
        <div className="space-y-3">
          <Button onClick={copyLink} className="w-full gap-2" size="lg">
            <Copy className="h-4 w-4" /> Copy Invite Link
          </Button>
          <p className="text-xs text-muted-foreground text-center break-all">{inviteLink}</p>
        </div>
      ) : (
        <Button
          onClick={async () => {
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

      {/* How it works */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-success" />
            How Bonuses Work
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>• Earn <span className="font-semibold text-foreground">$10 per completed service week</span> for each customer you bring</p>
          <p>• Bonus window: <span className="font-semibold text-foreground">90 days</span> (≈13 weeks) starting at their first completed visit</p>
          <p>• A "completed service week" means the customer has an active subscription AND at least one visit completed that week</p>
          <p>• Bonuses are automatically calculated and added to your payouts</p>
        </CardContent>
      </Card>

      {/* SMS Scripts */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">SMS Scripts</h2>
        <p className="text-sm text-muted-foreground">Tap any script to copy it with your link included.</p>

        {scripts.data && scripts.data.length > 0 ? (
          scripts.data.map((s: any) => (
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
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No scripts available yet. Your invite link above works great on its own!</p>
        )}
      </div>
    </div>
  );
}
