import { DollarSign, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReferralRewards } from "@/hooks/useReferralRewards";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  on_hold: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  earned: "bg-primary/10 text-primary",
  applied: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  voided: "bg-destructive/10 text-destructive",
};

export default function ProviderReferrals() {
  const rewards = useReferralRewards();

  const earnedCents = rewards.data?.filter((r: any) => ["earned", "applied", "paid"].includes(r.status)).reduce((s: number, r: any) => s + r.amount_cents, 0) ?? 0;
  const onHoldCents = rewards.data?.filter((r: any) => r.status === "on_hold").reduce((s: number, r: any) => s + r.amount_cents, 0) ?? 0;
  const paidCents = rewards.data?.filter((r: any) => r.status === "paid").reduce((s: number, r: any) => s + r.amount_cents, 0) ?? 0;

  if (rewards.isLoading) {
    return <div className="p-4 space-y-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-48" /></div>;
  }

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Referral Bonuses</h1>

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
          <p className="text-sm text-muted-foreground">No referral bonuses yet.</p>
        )}
      </div>
    </div>
  );
}
