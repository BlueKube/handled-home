import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CloudRain, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

/**
 * Payment failure banner — shows if there's an unread CUSTOMER_PAYMENT_FAILED notification.
 * Weather reschedule banner — shows if there's an unread CUSTOMER_SCHEDULE_CHANGED_WEATHER notification.
 * Tied to notification records per spec.
 */
export function CustomerNotificationBanners() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data: bannerNotifications } = useQuery({
    queryKey: ["customer_banner_notifications", user?.id],
    enabled: !!user?.id,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, type, title, body, cta_route, read_at")
        .eq("user_id", user!.id)
        .in("type", [
          "CUSTOMER_PAYMENT_FAILED",
          "CUSTOMER_SUBSCRIPTION_PAUSED",
          "CUSTOMER_SCHEDULE_CHANGED_WEATHER",
        ])
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const dismiss = async (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
  };

  const visibleBanners = (bannerNotifications ?? []).filter(
    (n) => !dismissed.has(n.id)
  );

  if (visibleBanners.length === 0) return null;

  return (
    <div className="space-y-2">
      {visibleBanners.map((n) => {
        const isPayment =
          n.type === "CUSTOMER_PAYMENT_FAILED" ||
          n.type === "CUSTOMER_SUBSCRIPTION_PAUSED";
        const isWeather = n.type === "CUSTOMER_SCHEDULE_CHANGED_WEATHER";

        return (
          <Card
            key={n.id}
            className={`p-3 flex items-center gap-3 border ${
              isPayment
                ? "bg-destructive/10 border-destructive/30"
                : "bg-accent/10 border-accent/30"
            }`}
          >
            {isPayment ? (
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            ) : (
              <CloudRain className="h-5 w-5 text-accent shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{n.title}</p>
              <p className="text-xs text-muted-foreground truncate">{n.body}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {n.cta_route && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => navigate(n.cta_route!)}
                >
                  {isPayment ? "Fix" : "View"}
                </Button>
              )}
              <button
                onClick={() => dismiss(n.id)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
