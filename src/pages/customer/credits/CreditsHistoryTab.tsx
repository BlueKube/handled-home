import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { ArrowDown, ArrowUp, RotateCcw, Clock, Gift } from "lucide-react";

interface HandleTxn {
  id: string;
  txn_type: string;
  amount: number;
  reference_type: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function labelForTxn(t: HandleTxn): { label: string; sublabel?: string } {
  const origin = (t.metadata?.origin as string | undefined) ?? undefined;
  const skuName = (t.metadata?.sku_name as string | undefined) ?? undefined;

  switch (t.txn_type) {
    case "grant":
      if (origin === "topup") return { label: "Topped up" };
      if (t.reference_type === "cycle_grant") return { label: "Monthly allowance" };
      return { label: "Credited" };
    case "spend":
      return { label: "Spent", sublabel: skuName };
    case "expire":
      return { label: "Expired" };
    case "rollover":
      return { label: "Rolled over" };
    case "refund":
      return { label: "Refunded" };
    default:
      return { label: t.txn_type };
  }
}

function iconForTxn(t: HandleTxn) {
  switch (t.txn_type) {
    case "grant":
      return (t.metadata?.origin as string | undefined) === "topup" ? Gift : ArrowDown;
    case "spend":
      return ArrowUp;
    case "rollover":
      return RotateCcw;
    case "expire":
      return Clock;
    case "refund":
      return ArrowDown;
    default:
      return ArrowDown;
  }
}

export function CreditsHistoryTab({ subscriptionId }: { subscriptionId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["handle_transactions", subscriptionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("handle_transactions")
        .select("id, txn_type, amount, reference_type, reference_id, metadata, created_at")
        .eq("subscription_id", subscriptionId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as HandleTxn[];
    },
  });

  if (isError) return <QueryErrorCard message="Couldn't load credit history." />;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8 text-sm">
        No credit activity yet.
      </p>
    );
  }

  // Group by month header.
  const groups = new Map<string, HandleTxn[]>();
  for (const txn of data) {
    const key = format(parseISO(txn.created_at), "MMMM yyyy");
    const arr = groups.get(key) ?? [];
    arr.push(txn);
    groups.set(key, arr);
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([month, txns]) => (
        <div key={month}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {month}
          </h3>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {txns.map((t) => {
                const { label, sublabel } = labelForTxn(t);
                const Icon = iconForTxn(t);
                const amountText = t.amount > 0 ? `+${t.amount}` : `${t.amount}`;
                const amountClass = t.amount > 0 ? "text-accent" : "text-muted-foreground";
                return (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(t.created_at), "MMM d")}
                        {sublabel ? ` · ${sublabel}` : ""}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${amountClass}`}>{amountText}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
