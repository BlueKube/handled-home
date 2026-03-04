import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OfferedWindow {
  date: string;
  window_label: string;
  window_start: string;
  window_end: string;
  template_id: string;
  feasibility_score: number;
  is_fallback: boolean;
}

export interface WindowOfferResponse {
  ok: boolean;
  windows: OfferedWindow[];
  total_candidates_evaluated: number;
  specific_templates_found: number;
  fallback_used: boolean;
  config: {
    max_windows_shown: number;
    min_windows_to_show: number;
    min_lead_time_hours: number;
    default_window_length_hours: number;
  };
}

interface FetchWindowsParams {
  zone_id: string;
  category_key: string;
  property_id: string;
  service_duration_minutes?: number;
}

/**
 * Fetches offered appointment windows from the edge function.
 */
export function useAppointmentWindows(params: FetchWindowsParams | null) {
  return useQuery<WindowOfferResponse>({
    queryKey: ["appointment_windows", params?.zone_id, params?.category_key, params?.property_id],
    enabled: !!(params?.zone_id && params?.category_key && params?.property_id),
    staleTime: 5 * 60 * 1000, // 5 min cache
    queryFn: async () => {
      if (!params) throw new Error("Missing params");
      const { data, error } = await supabase.functions.invoke("offer-appointment-windows", {
        body: {
          zone_id: params.zone_id,
          category_key: params.category_key,
          property_id: params.property_id,
          service_duration_minutes: params.service_duration_minutes ?? 60,
          scheduling_profile: "appointment_window",
        },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error ?? "Failed to fetch windows");
      return data as WindowOfferResponse;
    },
  });
}

interface ConfirmWindowParams {
  visit_id: string;
  window_start: string;
  window_end: string;
  customer_window_preference: string;
}

/**
 * Confirms a selected appointment window on a visit.
 * Updates the visit with time_window_start/end and customer_window_preference.
 */
export function useConfirmAppointmentWindow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ConfirmWindowParams) => {
      // Edge function returns ISO timestamps; DB column is time type (HH:MM:SS)
      const toTimeStr = (iso: string): string => {
        const d = new Date(iso);
        return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}:00`;
      };

      const { data, error } = await supabase
        .from("visits")
        .update({
          time_window_start: toTimeStr(params.window_start),
          time_window_end: toTimeStr(params.window_end),
          customer_window_preference: params.customer_window_preference,
        })
        .eq("id", params.visit_id)
        .select("id")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Appointment window confirmed");
      queryClient.invalidateQueries({ queryKey: ["upcoming_visits"] });
    },
    onError: () => {
      toast.error("Couldn't confirm window. Please try again.");
    },
  });
}
