import { describe, it, expect } from "vitest";
import { parseCancelSnapResponse } from "@/hooks/useCancelSnap";

describe("parseCancelSnapResponse", () => {
  it("returns the refunded-success payload as-is on success", () => {
    const result = parseCancelSnapResponse(
      { success: true, resolution: "canceled", refunded: 120 },
      null,
    );
    expect(result).toEqual({
      success: true,
      resolution: "canceled",
      refunded: 120,
    });
  });

  it("treats {success:false, error:'already_resolved'} as a zero-refund success (idempotent)", () => {
    // SnapSheet calls cancelSnap in the refund-on-route-failure path and
    // may also double-fire on error-recovery flows; treating
    // already_resolved as success keeps that path safe.
    const result = parseCancelSnapResponse(
      { success: false, error: "already_resolved", status: "resolved" },
      null,
    );
    expect(result).toEqual({
      success: true,
      resolution: "canceled",
      refunded: 0,
    });
  });

  it("throws with the server-supplied error on other {success:false} shapes", () => {
    expect(() =>
      parseCancelSnapResponse({ success: false, error: "snap_not_found" }, null),
    ).toThrowError("snap_not_found");
  });

  it("throws with the supabase error message when .error is set", () => {
    expect(() =>
      parseCancelSnapResponse(null, { message: "Network down" }),
    ).toThrowError("Network down");
  });

  it("throws with a default message on empty data + no error", () => {
    expect(() => parseCancelSnapResponse(null, null)).toThrowError(
      "Empty response from resolve_snap",
    );
  });
});
