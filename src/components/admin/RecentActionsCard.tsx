import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, UserCog, Bot } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

interface RecentAction {
  id: string;
  source: "ops" | "system" | "assignment";
  label: string;
  detail: string;
  actor: string;
  created_at: string;
}

function useRecentActions(limit: number = 15) {
  return useQuery<RecentAction[]>({
    queryKey: ["recent-actions", limit],
    queryFn: async () => {
      const actions: RecentAction[] = [];

      // Fetch from ops_exception_actions (recent ops actions)
      const { data: opsActions } = await supabase
        .from("ops_exception_actions")
        .select("id, action_type, reason_code, reason_note, actor_user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      // Batch-fetch actor names for ops actions
      const opsActorIds = [...new Set((opsActions ?? []).map(a => a.actor_user_id).filter(Boolean))];
      const { data: opsProfiles } = opsActorIds.length > 0
        ? await supabase.from("profiles").select("id, full_name").in("id", opsActorIds)
        : { data: [] };
      const profileMap = new Map((opsProfiles ?? []).map(p => [p.id, p.full_name ?? "Admin"]));

      for (const a of opsActions ?? []) {
        actions.push({
          id: a.id,
          source: "ops",
          label: (a.action_type ?? "").replace(/_/g, " "),
          detail: a.reason_note || a.reason_code || "",
          actor: a.actor_user_id ? (profileMap.get(a.actor_user_id) ?? "Admin") : "System",
          created_at: a.created_at,
        });
      }

      // Fetch from job_assignment_log (recent assignments)
      const { data: assignActions } = await supabase
        .from("job_assignment_log")
        .select("id, assignment_reason, explain_admin, assigned_by, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      for (const a of assignActions ?? []) {
        const actorLabel = a.assigned_by === "system" ? "System" : (a.assigned_by === "admin" ? "Admin" : a.assigned_by ?? "System");
        actions.push({
          id: a.id,
          source: a.assigned_by === "system" ? "system" : "assignment",
          label: "Assignment",
          detail: a.explain_admin || a.assignment_reason || "",
          actor: actorLabel,
          created_at: a.created_at,
        });
      }

      // Sort combined by recency
      actions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return actions.slice(0, limit);
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

const SOURCE_CONFIG = {
  ops: { label: "Ops", icon: UserCog, variant: "default" as const },
  system: { label: "System", icon: Bot, variant: "secondary" as const },
  assignment: { label: "Assign", icon: Activity, variant: "outline" as const },
};

export function RecentActionsCard() {
  const { data: actions, isLoading } = useRecentActions();

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Actions</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-40" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Recent Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!actions || actions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent actions</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {actions.map((a) => {
              const cfg = SOURCE_CONFIG[a.source];
              const Icon = cfg.icon;
              return (
                <div key={a.id} className="flex items-start gap-2.5 text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium capitalize truncate">{a.label}</span>
                      <Badge variant={cfg.variant} className="text-[9px] px-1 py-0 shrink-0">
                        {cfg.label}
                      </Badge>
                    </div>
                    {a.detail && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{a.detail}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                    {formatDistanceToNow(parseISO(a.created_at), { addSuffix: true })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
