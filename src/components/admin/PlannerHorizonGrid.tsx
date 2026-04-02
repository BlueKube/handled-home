import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, isToday, startOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface DayStats {
  date: string;
  total: number;
  assigned: number;
  unassigned: number;
  window: "locked" | "draft";
}

function useHorizonStats() {
  return useQuery<DayStats[]>({
    queryKey: ["planner-horizon-stats"],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const todayStr = format(today, "yyyy-MM-dd");

      const { data, error } = await supabase.rpc(
        "get_planner_horizon_stats" as any,
        { p_start_date: todayStr, p_days: 14 } as any
      );

      if (error) throw error;

      return ((data as any[]) ?? []).map((row: any, i: number) => ({
        date: row.stat_date,
        total: Number(row.total ?? 0),
        assigned: Number(row.assigned ?? 0),
        unassigned: Number(row.unassigned ?? 0),
        window: (i < 7 ? "locked" : "draft") as "locked" | "draft",
      }));
    },
    staleTime: 120_000,
    refetchInterval: 120_000,
  });
}

export function PlannerHorizonGrid() {
  const { data: days, isLoading, isError } = useHorizonStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">14-Day Horizon</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !days) return (
    <Card>
      <CardHeader><CardTitle className="text-base">14-Day Horizon</CardTitle></CardHeader>
      <CardContent><p className="text-sm text-destructive">Failed to load horizon data.</p></CardContent>
    </Card>
  );

  const freezeBoundaryIdx = 6;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">14-Day Rolling Horizon</CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3" /> LOCKED (T+0 to T+6)
            </span>
            <span className="flex items-center gap-1">
              <Pencil className="h-3 w-3" /> DRAFT (T+7 to T+13)
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, i) => {
            const d = new Date(day.date + "T00:00:00");
            const today = isToday(d);
            const isFreezeEdge = i === freezeBoundaryIdx;

            return (
              <div
                key={day.date}
                className={cn(
                  "relative rounded-lg border p-2 text-center transition-colors",
                  day.window === "locked"
                    ? "bg-primary/5 border-primary/20"
                    : "bg-muted/30 border-border",
                  today && "ring-2 ring-primary ring-offset-1",
                  isFreezeEdge && "border-r-2 border-r-destructive/50",
                  day.unassigned > 0 && day.window === "locked" && "border-destructive/40 bg-destructive/5"
                )}
              >
                <p className={cn(
                  "text-[10px] font-medium uppercase",
                  today ? "text-primary" : "text-muted-foreground"
                )}>
                  {format(d, "EEE")}
                </p>
                <p className={cn(
                  "text-sm font-bold",
                  today ? "text-primary" : "text-foreground"
                )}>
                  {format(d, "d")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {day.total} visit{day.total !== 1 ? "s" : ""}
                </p>
                {day.unassigned > 0 && (
                  <Badge
                    variant={day.window === "locked" ? "destructive" : "secondary"}
                    className="text-[9px] px-1 py-0 mt-1"
                  >
                    {day.unassigned} unassigned
                  </Badge>
                )}
                {today && (
                  <div className="absolute top-1 right-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Freeze boundary label */}
        <div className="flex items-center mt-3 gap-2">
          <div className="flex-1 h-px bg-primary/20" />
          <span className="text-[10px] font-medium text-primary/60 uppercase tracking-wider">
            ← Freeze boundary (day 7) →
          </span>
          <div className="flex-1 h-px bg-muted-foreground/20" />
        </div>
      </CardContent>
    </Card>
  );
}
