import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WaitlistEntry {
  id: string;
  email: string;
  full_name: string | null;
  zip_code: string;
  zone_id: string | null;
  source: string;
  referral_code: string | null;
  status: string;
  notified_at: string | null;
  converted_at: string | null;
  converted_user_id: string | null;
  created_at: string;
}

export interface WaitlistSummary {
  zip_code: string;
  zone_id: string | null;
  zone_name: string | null;
  entry_count: number;
  earliest_entry: string;
}

/** Admin: get waitlist entries for a zone or zip */
export function useWaitlistEntries(filters: { zoneId?: string; status?: string } = {}) {
  return useQuery({
    queryKey: ["waitlist-entries", filters],
    queryFn: async () => {
      let query = supabase
        .from("waitlist_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters.zoneId) query = query.eq("zone_id", filters.zoneId);
      if (filters.status) query = query.eq("status", filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return data as WaitlistEntry[];
    },
  });
}

/** Admin: get waitlist summary by zip */
export function useWaitlistSummary() {
  return useQuery({
    queryKey: ["waitlist-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_waitlist_summary");
      if (error) throw error;
      return data as WaitlistSummary[];
    },
  });
}

/** Public: join waitlist */
export function useJoinWaitlist() {
  return useMutation({
    mutationFn: async (entry: { email: string; full_name?: string; zip_code: string; source?: string; referral_code?: string }) => {
      // Try to find a matching zone for this zip
      const { data: zones } = await supabase
        .from("zones")
        .select("id, zip_codes")
        .eq("status", "active");

      let zoneId: string | null = null;
      for (const zone of zones || []) {
        if ((zone.zip_codes as string[])?.includes(entry.zip_code)) {
          zoneId = zone.id;
          break;
        }
      }

      const { error } = await supabase
        .from("waitlist_entries")
        .insert({
          email: entry.email,
          full_name: entry.full_name || null,
          zip_code: entry.zip_code,
          zone_id: zoneId,
          source: entry.source || "website",
          referral_code: entry.referral_code || null,
        });

      if (error) {
        if (error.message.includes("duplicate")) {
          throw new Error("You're already on the waitlist for this area!");
        }
        throw error;
      }
    },
  });
}

/** Admin: notify waitlist when zone launches */
export function useNotifyWaitlistOnLaunch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (zoneId: string) => {
      const { data, error } = await supabase.rpc("notify_waitlist_on_launch", { p_zone_id: zoneId });
      if (error) throw error;
      return data as { status: string; notified_count: number; zone_name: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["waitlist-entries"] }),
  });
}
