import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Clock, CreditCard } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STEP_LABELS: Record<number, string> = {
  0: "Initial Failure",
  1: "Day 1 — Auto Retry",
  2: "Day 3 — Second Retry + Email",
  3: "Day 5 — Third Retry + Warning",
  4: "Day 7 — Final Retry + Suspension Warning",
  5: "Day 10 — Account Paused",
};

const STEP_SEVERITY: Record<number, "secondary" | "default" | "destructive"> = {
  0: "secondary",
  1: "secondary",
  2: "default",
  3: "default",
  4: "destructive",
  5: "destructive",
};

interface DunningSubscription {
  id: string;
  customer_id: string;
  plan_id: string;
  dunning_step: number;
  dunning_started_at: string | null;
  last_dunning_at: string | null;
  status: string;
}

export function DunningTracker() {
  const { data: dunningSubscriptions, isLoading } = useQuery({
    queryKey: ["admin-dunning-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id, customer_id, plan_id, dunning_step, dunning_started_at, last_dunning_at, status")
        .gt("dunning_step", 0)
        .order("dunning_step", { ascending: false });
      if (error) throw error;
      return data as DunningSubscription[];
    },
    refetchInterval: 60_000,
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const subs = dunningSubscriptions ?? [];

  if (subs.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Dunning Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">No active dunning sequences.</p>
        </CardContent>
      </Card>
    );
  }

  const criticalCount = subs.filter((s) => s.dunning_step >= 3).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Dunning Tracker
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">{subs.length} in dunning</Badge>
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-xs">{criticalCount} critical</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Step</TableHead>
              <TableHead className="text-xs">Stage</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Started</TableHead>
              <TableHead className="text-xs">Last Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subs.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>
                  <Badge variant={STEP_SEVERITY[sub.dunning_step] ?? "destructive"} className="text-[10px] font-mono">
                    {sub.dunning_step}/5
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {STEP_LABELS[sub.dunning_step] ?? `Step ${sub.dunning_step}`}
                </TableCell>
                <TableCell>
                  <Badge variant={sub.status === "past_due" ? "destructive" : "default"} className="text-[10px]">
                    {sub.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {sub.dunning_started_at
                    ? formatDistanceToNow(new Date(sub.dunning_started_at), { addSuffix: true })
                    : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {sub.last_dunning_at
                    ? formatDistanceToNow(new Date(sub.last_dunning_at), { addSuffix: true })
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
