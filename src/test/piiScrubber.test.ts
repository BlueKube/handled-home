import { describe, it, expect } from "vitest";
import { scrubPii, containsPii } from "@/lib/piiScrubber";

describe("scrubPii", () => {
  it("scrubs phone numbers", () => {
    const r = scrubPii("Call me at 555-123-4567");
    expect(r.cleaned).toBe("Call me at [phone removed]");
    expect(r.hadPii).toBe(true);
    expect(r.counts.phones).toBe(1);
  });

  it("scrubs emails", () => {
    const r = scrubPii("Email me at john@example.com");
    expect(r.cleaned).toBe("Email me at [email removed]");
    expect(r.counts.emails).toBe(1);
  });

  it("scrubs URLs", () => {
    const r = scrubPii("Visit https://my-company.com/pricing for details");
    expect(r.cleaned).toBe("Visit [link removed] for details");
    expect(r.counts.urls).toBe(1);
  });

  it("scrubs multiple types at once", () => {
    const r = scrubPii("Call 555-123-4567 or visit https://example.com or email a@b.com");
    expect(r.hadPii).toBe(true);
    expect(r.counts.phones).toBe(1);
    expect(r.counts.urls).toBe(1);
    expect(r.counts.emails).toBe(1);
  });

  it("leaves clean text unchanged", () => {
    const r = scrubPii("Great service, loved the mowing!");
    expect(r.cleaned).toBe("Great service, loved the mowing!");
    expect(r.hadPii).toBe(false);
  });

  it("handles empty/null input", () => {
    expect(scrubPii("").hadPii).toBe(false);
  });

  it("ignores short digit sequences (zip codes, dates)", () => {
    const r = scrubPii("ZIP 30301 on 12/25/26");
    expect(r.counts.phones).toBe(0);
  });
});

describe("containsPii", () => {
  it("detects email", () => {
    expect(containsPii("reach me at test@gmail.com")).toBe(true);
  });

  it("returns false for clean text", () => {
    expect(containsPii("all good here")).toBe(false);
  });
});
