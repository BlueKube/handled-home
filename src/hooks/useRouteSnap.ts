import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type RouteSnapResult =
  | { success: true; route_type: "next_visit"; linked_job_id: string }
  | { success: true; route_type: "ad_hoc"; dispatch_request_id: string };

// Known error codes returned by handle_snap_routing — used by SnapSheet to
// decide whether to refund+bail or offer an ad_hoc retry on the same hold.
export type RouteSnapErrorCode =
  | "snap_not_found"
  | "unauthorized"
  | "routing_not_set"
  | "credits_not_held"
  | "already_routed"
  | "no_upcoming_job"
  | "invalid_routing";

export class RouteSnapError extends Error {
  readonly code: RouteSnapErrorCode | string;
  constructor(code: RouteSnapErrorCode | string, message?: string) {
    super(message ?? code);
    this.name = "RouteSnapError";
    this.code = code;
  }
}

// Parse the raw (data, error) pair from supabase.rpc("handle_snap_routing")
// into a strongly-typed RouteSnapResult, throwing RouteSnapError on any
// failure mode. Exported so tests can exercise it without spinning up
// a QueryClient or mocking @tanstack/react-query.
export function parseRouteSnapResponse(
  data: unknown,
  error: { message?: string } | null,
): RouteSnapResult {
  if (error) {
    throw new RouteSnapError("rpc_error", error.message ?? "Routing failed");
  }
  if (!data || typeof data !== "object") {
    throw new RouteSnapError("rpc_error", "Empty response from handle_snap_routing");
  }
  const result = data as
    | RouteSnapResult
    | { success: false; error: RouteSnapErrorCode; status?: string; routing?: string };

  if (result.success === false) {
    throw new RouteSnapError(result.error);
  }
  return result;
}

// Phase 4.4 routing step: after useFinalizeSnap has held credits, call
// handle_snap_routing to either attach a job_task to the next visit OR
// insert a dispatch_requests row. No invalidation — routing doesn't
// change handle balance.
export function useRouteSnap() {
  return useMutation<RouteSnapResult, RouteSnapError, { snapId: string }>({
    mutationFn: async ({ snapId }) => {
      const { data, error } = await supabase.rpc("handle_snap_routing", {
        p_snap_request_id: snapId,
      });
      return parseRouteSnapResponse(data, error);
    },
  });
}
