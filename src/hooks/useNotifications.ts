import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];
type PriorityFilter = "ALL" | "CRITICAL" | "SERVICE" | "MARKETING";

const QUERY_KEY = "notifications";
const PAGE_SIZE = 50;

export function useNotifications(limit = PAGE_SIZE, priorityFilter: PriorityFilter = "ALL") {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: [QUERY_KEY, userId, limit, priorityFilter],
    queryFn: async () => {
      if (!userId) return [];
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (priorityFilter !== "ALL") {
        query = query.eq("priority", priorityFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!userId,
  });

  // Realtime subscription for new inserts
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read_at).length,
    [notifications]
  );

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId] });
    },
    onError: () => {
      toast.error("Failed to mark notification as read");
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId!)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId] });
    },
    onError: () => {
      toast.error("Failed to mark all notifications as read");
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead: markRead.mutate,
    markAllRead: markAllRead.mutate,
    isMarkingRead: markRead.isPending,
    isMarkingAllRead: markAllRead.isPending,
  };
}
