import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

const PRIORITY_DOT: Record<string, string> = {
  CRITICAL: "bg-destructive",
  SERVICE: "bg-primary",
  MARKETING: "bg-muted-foreground/50",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationPanel({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { effectiveRole } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead, isMarkingAllRead } =
    useNotifications();

  const handleClick = (n: Notification) => {
    if (!n.read_at) markRead(n.id);
    if (n.cta_route) {
      onOpenChange(false);
      navigate(n.cta_route);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col p-0 w-full sm:max-w-md">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllRead()}
                disabled={isMarkingAllRead}
                className="text-xs gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>
          <SheetDescription className="sr-only">Your recent notifications</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Bell className="h-10 w-10 opacity-30" />
              <p className="text-sm">You're all caught up</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleClick(n)}
                    className={cn(
                      "w-full text-left px-4 py-3 flex gap-3 hover:bg-accent/50 transition-colors",
                      !n.read_at && "bg-accent/20"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        PRIORITY_DOT[n.priority] ?? PRIORITY_DOT.SERVICE
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm truncate",
                          !n.read_at ? "font-semibold text-foreground" : "text-foreground/80"
                        )}
                      >
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
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
          )}
        </ScrollArea>

        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            className="w-full text-sm"
            onClick={() => {
              onOpenChange(false);
              navigate(`/${effectiveRole}/notifications`);
            }}
          >
            View all notifications
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
