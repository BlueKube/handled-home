import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];
type PriorityFilter = "ALL" | "CRITICAL" | "SERVICE" | "MARKETING";

const PRIORITY_DOT: Record<string, string> = {
  CRITICAL: "bg-destructive",
  SERVICE: "bg-primary",
  MARKETING: "bg-muted-foreground/50",
};

const PAGE_SIZE = 50;

export default function Notifications() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<PriorityFilter>("ALL");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const { notifications, unreadCount, markRead, markAllRead, isMarkingAllRead, isLoading } =
    useNotifications(limit, filter);

  const handleClick = (n: Notification) => {
    if (!n.read_at) markRead(n.id);
    if (n.cta_route) navigate(n.cta_route);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Notifications</h1>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead()}
            disabled={isMarkingAllRead}
            className="gap-1.5"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as PriorityFilter)}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="CRITICAL">Critical</TabsTrigger>
          <TabsTrigger value="SERVICE">Service</TabsTrigger>
          <TabsTrigger value="MARKETING">Marketing</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-1 rounded-lg border border-border overflow-hidden bg-card">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 px-4 py-3.5">
              <Skeleton className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Bell className="h-12 w-12 opacity-20" />
          <p className="text-sm">No notifications</p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden bg-card">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => handleClick(n)}
                  className={cn(
                    "w-full text-left px-4 py-3.5 flex gap-3 hover:bg-accent/50 transition-colors",
                    !n.read_at && "bg-accent/20"
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                      PRIORITY_DOT[n.priority] ?? PRIORITY_DOT.SERVICE
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm",
                        !n.read_at ? "font-semibold text-foreground" : "text-foreground/80"
                      )}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-3 mt-0.5">
                      {n.body}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {notifications.length >= limit && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLimit((l) => l + PAGE_SIZE)}
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
