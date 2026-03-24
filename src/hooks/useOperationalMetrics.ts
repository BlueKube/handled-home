import { useQuery } from "@tanstack/react-query";

interface MetricStatus {
  value: number;
  target: number;
  status: "healthy" | "warning" | "critical";
}

export interface OperationalMetrics {
  grossMargin: MetricStatus;
  providerUtilization: MetricStatus;
  isLoading: boolean;
}

function computeStatus(value: number, greenThreshold: number, yellowThreshold: number): "healthy" | "warning" | "critical" {
  if (value >= greenThreshold) return "healthy";
  if (value >= yellowThreshold) return "warning";
  return "critical";
}

export function useOperationalMetrics(): OperationalMetrics {
  const query = useQuery({
    queryKey: ["operational-metrics"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      // MOCK DATA — TODO: Replace with Supabase queries for revenue, payout, and job capacity data
      const grossMarginValue = 22;
      const providerUtilValue = 74;

      return {
        grossMargin: {
          value: grossMarginValue,
          target: 25,
          status: computeStatus(grossMarginValue, 25, 15),
        } as MetricStatus,
        providerUtilization: {
          value: providerUtilValue,
          target: 80,
          status: computeStatus(providerUtilValue, 80, 60),
        } as MetricStatus,
      };
    },
  });

  return {
    grossMargin: query.data?.grossMargin ?? { value: 0, target: 25, status: "critical" as const },
    providerUtilization: query.data?.providerUtilization ?? { value: 0, target: 80, status: "critical" as const },
    isLoading: query.isLoading,
  };
}
