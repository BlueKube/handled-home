import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

/**
 * Provider SLA banner — shows if there's an unread PROVIDER_SLA_LEVEL_CHANGED notification
 * for ORANGE or RED levels. Tied to notification records per spec.
 */
export function ProviderNotificationBanners() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data: bannerNotifications } = useQuery({
    queryKey: ["provider_banner_notifications", user?.id],
    enabled: !!user?.id,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, type, title, body, cta_route, read_at, data")
        .eq("user_id", user!.id)
        .eq("type", "PROVIDER_SLA_LEVEL_CHANGED")
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  const dismiss = async (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["provider_banner_notifications"] });
  };

  const visibleBanners = (bannerNotifications ?? []).filter(
    (n) => !dismissed.has(n.id)
  );

  if (visibleBanners.length === 0) return null;

  return (
    <div className="space-y-2">
      {visibleBanners.map((n) => {
        const slaData = n.data as Record<string, unknown> | null;
        const level = (slaData?.level as string) ?? "ORANGE";
        const isRed = level === "RED";

        return (
          <Card
            key={n.id}
            className={`p-3 flex items-center gap-3 border ${
              isRed
                ? "bg-destructive/10 border-destructive/30"
                : "bg-warning/10 border-warning/30"
            }`}
          >
            <ShieldAlert
              className={`h-5 w-5 shrink-0 ${
                isRed ? "text-destructive" : "text-warning"
              }`}
            />
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
                  View
                </Button>
              )}
              <button
                onClick={() => dismiss(n.id)}
                className="p-3 rounded hover:bg-secondary text-muted-foreground"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
