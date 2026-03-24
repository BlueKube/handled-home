import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, Users, Gift, Clock, ChevronRight, ChevronLeft, Target, Star, Trophy } from "lucide-react";
import { CustomerEmptyState } from "@/components/customer/CustomerEmptyState";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReferralCodes } from "@/hooks/useReferralCodes";
import { useReferrals } from "@/hooks/useReferrals";
import { useReferralRewards } from "@/hooks/useReferralRewards";
import { useReferralPrograms } from "@/hooks/useReferralPrograms";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpTip } from "@/components/ui/help-tip";

const MILESTONE_LABELS: Record<string, string> = {
  installed: "Signed up",
  subscribed: "Subscribed",
  first_visit: "First visit",
  paid_cycle: "Paid cycle",
};

export default function CustomerReferrals() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { codes, generateCode } = useReferralCodes();
  const { programs } = useReferralPrograms();
  const referrals = useReferrals("own");
  const rewards = useReferralRewards();

  const activeProgram = programs.data?.find((p: any) => p.status === "active");
  const myCode = codes.data?.[0];

  const handleCopyLink = () => {
    if (!myCode) return;
    const link = `${window.location.origin}/auth?ref=${myCode.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateCode = () => {
    if (!activeProgram) return;
    generateCode.mutate(activeProgram.id);
  };

  // Compute summary
  const earnedCents = rewards.data?.filter((r: any) => ["earned", "applied", "paid"].includes(r.status)).reduce((s: number, r: any) => s + r.amount_cents, 0) ?? 0;
  const pendingCents = rewards.data?.filter((r: any) => ["pending", "on_hold"].includes(r.status)).reduce((s: number, r: any) => s + r.amount_cents, 0) ?? 0;

  if (codes.isLoading || referrals.isLoading) {
    return <div className="p-4 space-y-4"><Skeleton className="h-32" /><Skeleton className="h-48" /><Skeleton className="h-32" /></div>;
  }

  return (
    <div className="px-4 py-6 pb-24 space-y-6 animate-fade-in">
      <button onClick={() => navigate("/customer/more")} className="flex items-center gap-1 text-muted-foreground mb-2 hover:text-foreground transition-colors" aria-label="Back to More menu">
        <ChevronLeft className="h-4 w-4" />
        <span className="text-sm">More</span>
      </button>
      <h1 className="text-h2">Referrals</h1>

      {/* Share Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" /> Share & Earn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeProgram ? (
            <>
              <p className="text-sm text-muted-foreground">{activeProgram.description || "Invite friends and earn credits when they subscribe."}</p>
              {myCode ? (
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-sm font-mono">{myCode.code}</code>
                  <Button size="sm" variant="outline" onClick={handleCopyLink} aria-label={copied ? "Copied" : "Copy referral link"}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <Button onClick={handleGenerateCode} disabled={generateCode.isPending} size="sm">
                  Generate Code
                </Button>
              )}
              {myCode && (
                <p className="text-xs text-muted-foreground">{myCode.uses_count} referral{myCode.uses_count !== 1 ? "s" : ""} used</p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No active referral program at this time.</p>
          )}
        </CardContent>
      </Card>

      {/* Credits Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <Gift className="h-5 w-5 text-accent mx-auto mb-1" />
            <p className="text-2xl font-bold">${(earnedCents / 100).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Clock className="h-5 w-5 text-accent mx-auto mb-1" />
            <p className="text-2xl font-bold">${(pendingCents / 100).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Milestones — tiered rewards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-accent" /> Referral Milestones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(() => {
            const referralCount = referrals.data?.length ?? 0;
            const milestones = [
              { target: 3, reward: "$30 credit", icon: Star, label: "Starter" },
              { target: 5, reward: "Free month", icon: Trophy, label: "Ambassador" },
              { target: 10, reward: "VIP status", icon: Gift, label: "Champion" },
            ];
            const current = milestones.find((m) => referralCount < m.target) ?? milestones[milestones.length - 1];
            const progress = Math.min((referralCount / current.target) * 100, 100);
            const remaining = Math.max(0, current.target - referralCount);

            return (
              <>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {remaining > 0
                      ? `${remaining} more referral${remaining !== 1 ? "s" : ""} to unlock: ${current.reward}`
                      : "All milestones unlocked!"}
                  </p>
                  <Progress value={progress} className="h-2 mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">{referralCount} / {current.target} referrals</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {milestones.map((m) => {
                    const Icon = m.icon;
                    const achieved = referralCount >= m.target;
                    return (
                      <div
                        key={m.target}
                        className={`rounded-xl p-2.5 text-center border ${
                          achieved
                            ? "bg-accent/10 border-accent/30"
                            : "bg-muted/30 border-border"
                        }`}
                      >
                        <Icon className={`h-4 w-4 mx-auto mb-1 ${achieved ? "text-accent" : "text-muted-foreground/50"}`} />
                        <p className="text-xs font-medium">{m.label}</p>
                        <p className="text-[10px] text-muted-foreground">{m.reward}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* Referral List */}
      <div>
        <h2 className="text-h3 mb-3">Your Referrals</h2>
        {referrals.data && referrals.data.length > 0 ? (
          <div className="space-y-2">
            {referrals.data.map((ref: any) => (
              <Card key={ref.id}>
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Referral #{ref.id.slice(0, 8)}</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {ref.referral_milestones?.map((m: any) => (
                        <Badge key={m.id} variant="secondary" className="text-xs">
                          {MILESTONE_LABELS[m.milestone] || m.milestone}
                        </Badge>
                      ))}
                      {(!ref.referral_milestones || ref.referral_milestones.length === 0) && (
                        <span className="text-xs text-muted-foreground">Awaiting first milestone</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <CustomerEmptyState
            icon={Users}
            title="No referrals yet"
            body="Share your code with friends and earn rewards when they subscribe."
            ctaLabel={myCode ? "Copy your referral link" : "Generate referral code"}
            ctaAction={myCode ? handleCopyLink : handleGenerateCode}
            ctaDisabled={!myCode && generateCode.isPending}
          />
        )}
      </div>
    </div>
  );
}
