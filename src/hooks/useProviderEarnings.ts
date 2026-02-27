import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, differenceInCalendarDays, getDaysInMonth } from "date-fns";

export type EarningsPeriod = "today" | "week" | "month";

function periodRange(period: EarningsPeriod): { from: string; to: string } {
  const now = new Date();
  if (period === "today") {
    const d = format(now, "yyyy-MM-dd");
    return { from: d, to: d };
  }
  if (period === "week") {
    return {
      from: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      to: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    };
  }
  return {
    from: format(startOfMonth(now), "yyyy-MM-dd"),
    to: format(endOfMonth(now), "yyyy-MM-dd"),
  };
}

export function useProviderEarnings(period: EarningsPeriod = "month") {
  const { org } = useProviderOrg();
  const { from, to } = periodRange(period);

  const earningsQuery = useQuery({
    queryKey: ["provider-earnings", org?.id, period, from],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_earnings")
        .select("*, jobs(scheduled_date, property_id, properties(street_address))")
        .eq("provider_org_id", org!.id)
        .gte("created_at", `${from}T00:00:00`)
        .lte("created_at", `${to}T23:59:59`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!org?.id,
  });

  // Only unpaid statuses for balance computation (E02-F3 fix)
  const balanceQuery = useQuery({
    queryKey: ["provider-earnings-balances", org?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_earnings")
        .select("total_cents, status")
        .eq("provider_org_id", org!.id)
        .in("status", ["ELIGIBLE", "HELD", "HELD_UNTIL_READY"]);
      if (error) throw error;
      return data;
    },
    enabled: !!org?.id,
  });

  // Month-to-date earnings (always current month, independent of period selector — E02-F2 fix)
  const mtdRange = { from: format(startOfMonth(new Date()), "yyyy-MM-dd"), to: format(endOfMonth(new Date()), "yyyy-MM-dd") };
  const mtdQuery = useQuery({
    queryKey: ["provider-earnings-mtd", org?.id, mtdRange.from],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_earnings")
        .select("total_cents")
        .eq("provider_org_id", org!.id)
        .gte("created_at", `${mtdRange.from}T00:00:00`)
        .lte("created_at", `${mtdRange.to}T23:59:59`);
      if (error) throw error;
      return data;
    },
    enabled: !!org?.id,
  });

  const payoutsQuery = useQuery({
    queryKey: ["provider-payouts", org?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_payouts")
        .select("*")
        .eq("provider_org_id", org!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!org?.id,
  });

  const payoutAccountQuery = useQuery({
    queryKey: ["provider-payout-account", org?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_payout_accounts")
        .select("*")
        .eq("provider_org_id", org!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!org?.id,
  });

  // Scheduled upcoming jobs for projection
  const projectionQuery = useQuery({
    queryKey: ["provider-projection", org?.id],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

      // Count remaining scheduled jobs this month
      const { count, error } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("provider_org_id", org!.id)
        .gte("scheduled_date", today)
        .lte("scheduled_date", monthEnd)
        .not("status", "in", '("COMPLETED","CANCELED")');
      if (error) throw error;

      // Get 30-day avg per job
      const thirtyDaysAgo = format(new Date(Date.now() - 30 * 86400000), "yyyy-MM-dd");
      const { data: avgData, error: avgErr } = await supabase
        .from("provider_earnings")
        .select("total_cents")
        .eq("provider_org_id", org!.id)
        .gte("created_at", `${thirtyDaysAgo}T00:00:00`);
      if (avgErr) throw avgErr;

      const avgPerJob = avgData && avgData.length > 0
        ? avgData.reduce((s, e) => s + e.total_cents, 0) / avgData.length
        : 4500; // $45 fallback

      return {
        remainingJobs: count ?? 0,
        avgPerJob: Math.round(avgPerJob),
        projectedRemaining: Math.round((count ?? 0) * avgPerJob),
      };
    },
    enabled: !!org?.id,
  });

  const earnings = earningsQuery.data ?? [];
  const balances = balanceQuery.data ?? [];
  const periodTotal = earnings.reduce((s, e) => s + e.total_cents, 0);
  const periodModifiers = earnings.reduce((s, e) => s + e.modifier_cents, 0);
  const eligibleBalance = balances.filter(e => e.status === "ELIGIBLE").reduce((s, e) => s + e.total_cents, 0);
  const heldBalance = balances.filter(e => ["HELD", "HELD_UNTIL_READY"].includes(e.status)).reduce((s, e) => s + e.total_cents, 0);

  // E02-F2 fix: always use MTD query for projection, not period-dependent
  const monthEarned = (mtdQuery.data ?? []).reduce((s, e) => s + e.total_cents, 0);
  const projection = projectionQuery.data;
  const monthProjection = monthEarned + (projection?.projectedRemaining ?? 0);

  return {
    earnings,
    payouts: payoutsQuery.data ?? [],
    payoutAccount: payoutAccountQuery.data,
    eligibleBalance,
    heldBalance,
    periodTotal,
    periodModifiers,
    monthProjection,
    projectionDetail: projection,
    isLoading: earningsQuery.isLoading,
    isError: earningsQuery.isError || payoutsQuery.isError,
    refetch: earningsQuery.refetch,
    isAccountReady: payoutAccountQuery.data?.status === "READY",
  };
}
