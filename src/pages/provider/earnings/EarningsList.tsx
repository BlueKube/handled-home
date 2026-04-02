import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { EmptyState } from "@/components/ui/empty-state";
import { useProviderEarnings, type EarningsPeriod } from "@/hooks/useProviderEarnings";
import { DollarSign, Banknote, ArrowDownToLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/utils/format";
import { format } from "date-fns";
import { EarningCard } from "./EarningCard";

export function EarningsList({ period }: { period: EarningsPeriod }) {
  const { earnings, isLoading, isError, refetch } = useProviderEarnings(period);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <QueryErrorCard message="Failed to load earnings." onRetry={() => refetch()} />;
  }

  if (earnings.length === 0) {
    return (
      <EmptyState
        compact
        icon={DollarSign}
        title="No earnings for this period"
        body="Complete jobs to start earning. Earnings appear here after each service."
      />
    );
  }

  return (
    <div className="space-y-2">
      {earnings.map((e) => (
        <EarningCard key={e.id} earning={e} />
      ))}
    </div>
  );
}

export function PayoutsList() {
  const { payouts, isLoading, isError, refetch } = useProviderEarnings();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <QueryErrorCard message="Failed to load payouts." onRetry={() => refetch()} />;
  }

  if (payouts.length === 0) {
    return (
      <EmptyState
        compact
        icon={Banknote}
        title="No payouts yet"
        body="Payouts are processed weekly on Fridays. Complete jobs to get started."
      />
    );
  }

  return (
    <div className="space-y-2">
      {payouts.map((p: any) => (
        <Card key={p.id} className="p-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
              <ArrowDownToLine className="h-4 w-4 text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                Payout — {format(new Date(p.created_at), "MMM d, yyyy")}
              </p>
              <Badge variant={p.status === "COMPLETED" ? "default" : "secondary"} className="text-xs mt-0.5">
                {p.status}
              </Badge>
            </div>
            <p className="text-sm font-bold shrink-0">{formatCents(p.amount_cents)}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
