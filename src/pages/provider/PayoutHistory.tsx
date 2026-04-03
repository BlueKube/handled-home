import { useProviderEarnings } from "@/hooks/useProviderEarnings";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ChevronLeft, DollarSign, Banknote, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageSkeleton } from "@/components/PageSkeleton";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { formatCents } from "@/utils/format";
import { format } from "date-fns";
import { useMemo } from "react";

const earningStatusVariant: Record<string, string> = {
  EARNED: "secondary",
  ELIGIBLE: "default",
  HELD: "destructive",
  HELD_UNTIL_READY: "outline",
  PAID: "default",
};

const earningStatusLabel: Record<string, string> = {
  EARNED: "Earned",
  ELIGIBLE: "Eligible",
  HELD: "Under review",
  HELD_UNTIL_READY: "Pending setup",
  PAID: "Paid",
};

export default function ProviderPayoutHistory() {
  const navigate = useNavigate();
  const { earnings, payouts, isLoading, isError } = useProviderEarnings();

  // Group earnings by date
  const earningsByDate = useMemo(() => {
    const groups = new Map<string, typeof earnings>();
    for (const e of earnings) {
      const key = format(new Date(e.created_at), "yyyy-MM-dd");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [earnings]);

  if (isLoading) return <PageSkeleton />;
  if (isError) return <QueryErrorCard />;

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/provider/payouts")}
          aria-label="Back to payouts"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-h2">History</h1>
      </div>

      <Tabs defaultValue="earnings">
        <TabsList className="w-full">
          <TabsTrigger value="earnings" className="flex-1">Earnings</TabsTrigger>
          <TabsTrigger value="payouts" className="flex-1">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="earnings" className="space-y-4 mt-3">
          {earnings.length === 0 ? (
            <EmptyState
              compact
              icon={DollarSign}
              title="No earnings yet"
              body="Complete jobs to start earning. Your earnings will appear here."
            />
          ) : (
            earningsByDate.map(([date, dateEarnings]) => (
              <div key={date} className="space-y-2">
                <p className="text-caption uppercase tracking-wider px-1">
                  {format(new Date(date), "EEEE, MMM d")}
                </p>
                {dateEarnings.map((e) => (
                  <Card key={e.id}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <DollarSign className="h-5 w-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-sm font-semibold">{formatCents(e.total_cents)}</p>
                        {e.jobs?.properties?.street_address && (
                          <p className="text-xs text-muted-foreground truncate">
                            {e.jobs.properties.street_address}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={(earningStatusVariant[e.status] ?? "secondary") as any}
                        className="text-[10px] shrink-0"
                      >
                        {earningStatusLabel[e.status] ?? e.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="payouts" className="space-y-2 mt-3">
          {payouts.length === 0 ? (
            <EmptyState
              compact
              icon={Banknote}
              title="No payouts yet"
              body="Payouts are processed weekly on Fridays. Your payout history will appear here."
            />
          ) : (
            payouts.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    p.status === "PAID" ? "bg-success/10" : p.status === "FAILED" ? "bg-destructive/10" : "bg-muted"
                  }`}>
                    {p.status === "PAID" ? (
                      <Banknote className="h-5 w-5 text-success" />
                    ) : p.status === "FAILED" ? (
                      <Banknote className="h-5 w-5 text-destructive" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold">{formatCents(p.total_cents)}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.paid_at
                        ? format(new Date(p.paid_at), "MMM d, yyyy")
                        : format(new Date(p.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge
                    variant={p.status === "PAID" ? "default" : p.status === "FAILED" ? "destructive" : "secondary"}
                    className="text-[10px] shrink-0"
                  >
                    {p.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
