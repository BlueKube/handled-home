import { describe, it, expect } from "vitest";
import { parseRouteSnapResponse, RouteSnapError } from "@/hooks/useRouteSnap";

describe("parseRouteSnapResponse", () => {
  it("returns a next_visit result on success", () => {
    const result = parseRouteSnapResponse(
      {
        success: true,
        route_type: "next_visit",
        linked_job_id: "job-123",
      },
      null,
    );
    expect(result).toEqual({
      success: true,
      route_type: "next_visit",
      linked_job_id: "job-123",
    });
  });

  it("returns an ad_hoc result on success", () => {
    const result = parseRouteSnapResponse(
      {
        success: true,
        route_type: "ad_hoc",
        dispatch_request_id: "dispatch-456",
      },
      null,
    );
    expect(result).toEqual({
      success: true,
      route_type: "ad_hoc",
      dispatch_request_id: "dispatch-456",
    });
  });

  it("throws a typed RouteSnapError with the server-supplied code on {success:false}", () => {
    expect(() =>
      parseRouteSnapResponse({ success: false, error: "no_upcoming_job" }, null),
    ).toThrow(RouteSnapError);

    try {
      parseRouteSnapResponse({ success: false, error: "no_upcoming_job" }, null);
    } catch (err) {
      expect(err).toBeInstanceOf(RouteSnapError);
      expect((err as RouteSnapError).code).toBe("no_upcoming_job");
    }
  });

  it("throws rpc_error when supabase returns an error object", () => {
    try {
      parseRouteSnapResponse(null, { message: "Network unreachable" });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(RouteSnapError);
      expect((err as RouteSnapError).code).toBe("rpc_error");
      expect((err as Error).message).toContain("Network unreachable");
    }
  });

  it("throws rpc_error with a default message when error has no .message", () => {
    try {
      parseRouteSnapResponse(null, {});
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(RouteSnapError);
      expect((err as RouteSnapError).code).toBe("rpc_error");
      expect((err as Error).message).toBe("Routing failed");
    }
  });

  it("throws rpc_error when data is empty / non-object with no error", () => {
    try {
      parseRouteSnapResponse(null, null);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(RouteSnapError);
      expect((err as RouteSnapError).code).toBe("rpc_error");
    }
  });
});
