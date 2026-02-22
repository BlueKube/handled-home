import { useProviderEarnings } from "@/hooks/useProviderEarnings";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageSkeleton } from "@/components/PageSkeleton";

function formatCents(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

const earningStatusColors: Record<string, string> = {
  EARNED: "secondary", ELIGIBLE: "default", HELD: "destructive", HELD_UNTIL_READY: "outline", PAID: "default",
};

export default function ProviderPayoutHistory() {
  const navigate = useNavigate();
  const { earnings, payouts, isLoading } = useProviderEarnings();

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="px-4 py-6 space-y-4 animate-fade-in pb-20">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/provider/payouts")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">History</h1>
      </div>

      <Tabs defaultValue="earnings">
        <TabsList className="w-full">
          <TabsTrigger value="earnings" className="flex-1">Earnings</TabsTrigger>
          <TabsTrigger value="payouts" className="flex-1">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="earnings" className="space-y-2 mt-3">
          {earnings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No earnings yet.</p>
          ) : earnings.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{formatCents(e.total_cents)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant={earningStatusColors[e.status] as any ?? "secondary"} className="text-[10px]">
                  {e.status === "HELD" ? "Under review" : e.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="payouts" className="space-y-2 mt-3">
          {payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No payouts yet.</p>
          ) : payouts.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{formatCents(p.total_cents)}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={p.status === "PAID" ? "default" : p.status === "FAILED" ? "destructive" : "secondary"} className="text-[10px]">
                  {p.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
