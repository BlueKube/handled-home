import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Holiday {
  id: string;
  name: string;
  holiday_date: string;
  year: number;
  is_federal: boolean;
  skip_jobs: boolean;
  notify_customers: boolean;
  notify_providers: boolean;
  explain_customer: string | null;
  explain_provider: string | null;
  created_at: string;
}

/** Fetch holidays for a given year */
export function useHolidayCalendar(year: number) {
  return useQuery({
    queryKey: ["holiday-calendar", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("holiday_calendar")
        .select("*")
        .eq("year", year)
        .order("holiday_date", { ascending: true });

      if (error) throw error;
      return data as Holiday[];
    },
  });
}

/** Fetch upcoming holidays (next 60 days) */
export function useUpcomingHolidays() {
  return useQuery({
    queryKey: ["holidays-upcoming"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const sixtyDaysOut = new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("holiday_calendar")
        .select("*")
        .gte("holiday_date", today)
        .lte("holiday_date", sixtyDaysOut)
        .eq("skip_jobs", true)
        .order("holiday_date", { ascending: true });

      if (error) throw error;
      return data as Holiday[];
    },
  });
}
