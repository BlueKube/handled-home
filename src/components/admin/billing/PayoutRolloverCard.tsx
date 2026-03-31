import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet } from "lucide-react";

function fmt$(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

interface EarningsAggregate {
  provider_org_id: string;
  provider_name: string;
  total_pending_cents: number;
  earnings_count: number;
  oldest_earning: string;
}

export function PayoutRolloverCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payout-rollovers"],
    queryFn: async () => {
      // Find providers with PENDING earnings that are below the $25 threshold
      const { data: earnings, error } = await supabase
        .from("provider_earnings")
        .select(`
          provider_org_id,
          net_cents,
          created_at,
          provider_orgs:provider_org_id(name)
        `)
        .eq("payout_status", "PENDING")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Aggregate by provider
      const byProvider = new Map<string, EarningsAggregate>();
      for (const e of (earnings ?? []) as any[]) {
        const orgId = e.provider_org_id;
        const existing = byProvider.get(orgId);
        if (existing) {
          existing.total_pending_cents += e.net_cents;
          existing.earnings_count += 1;
        } else {
          byProvider.set(orgId, {
            provider_org_id: orgId,
            provider_name: e.provider_orgs?.name ?? "Unknown",
            total_pending_cents: e.net_cents,
            earnings_count: 1,
            oldest_earning: e.created_at,
          });
        }
      }

      // Filter to sub-threshold providers (< $25 = 2500 cents)
      return Array.from(byProvider.values())
        .filter((agg) => agg.total_pending_cents < 2500 && agg.total_pending_cents > 0)
        .sort((a, b) => a.total_pending_cents - b.total_pending_cents);
    },
    refetchInterval: 120_000,
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  const rollovers = data ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Payout Rollovers
          </CardTitle>
          {rollovers.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {rollovers.length} below threshold
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {rollovers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            All providers are above the $25 payout threshold.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Provider</TableHead>
                <TableHead className="text-xs text-right">Accumulated</TableHead>
                <TableHead className="text-xs text-right">Earnings</TableHead>
                <TableHead className="text-xs text-right">To Threshold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rollovers.map((r) => (
                <TableRow key={r.provider_org_id}>
                  <TableCell className="text-xs font-medium">{r.provider_name}</TableCell>
                  <TableCell className="text-xs text-right">{fmt$(r.total_pending_cents)}</TableCell>
                  <TableCell className="text-xs text-right">{r.earnings_count}</TableCell>
                  <TableCell className="text-xs text-right text-muted-foreground">
                    {fmt$(2500 - r.total_pending_cents)} more
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
