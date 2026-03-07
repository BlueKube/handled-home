import { describe, it, expect } from "vitest";
import { getCategoryLabel } from "@/lib/serviceCategories";

// ── Pure function tests for buildContext logic ──
// We extract and test the context-building logic independently.

interface ByocContext {
  providerName: string;
  providerId: string;
  serviceName: string;
  categoryKey: string;
  zoneId: string;
  categoryLabel: string;
  isByocFlow: true;
}

interface ByocInviteDetails {
  provider_org: { id: string; name: string; logo_url: string | null } | null;
  sku: { id: string; name: string; category: string; duration_minutes: number } | null;
  category_key: string;
  zone_id: string;
  [key: string]: unknown;
}

// Mirror of buildContext from useByocOnboardingContext.ts
function buildContext(
  metadata: Record<string, unknown> | null,
  inviteData: ByocInviteDetails | null | undefined
): ByocContext | null {
  if (metadata?.byoc_provider_id) {
    const categoryKey = (metadata.byoc_category_key as string) ?? "";
    return {
      providerName: (metadata.byoc_provider_name as string) ?? "Your Provider",
      providerId: (metadata.byoc_provider_id as string) ?? "",
      serviceName: (metadata.byoc_service_name as string) ?? getCategoryLabel(categoryKey),
      categoryKey,
      zoneId: (metadata.byoc_zone_id as string) ?? "",
      categoryLabel: getCategoryLabel(categoryKey),
      isByocFlow: true,
    };
  }

  if (inviteData) {
    return {
      providerName: inviteData.provider_org?.name ?? "Your Provider",
      providerId: inviteData.provider_org?.id ?? "",
      serviceName: inviteData.sku?.name ?? getCategoryLabel(inviteData.category_key),
      categoryKey: inviteData.category_key,
      zoneId: inviteData.zone_id,
      categoryLabel: getCategoryLabel(inviteData.category_key),
      isByocFlow: true,
    };
  }

  return null;
}

describe("buildContext (BYOC context builder)", () => {
  it("returns null when both metadata and invite are null", () => {
    expect(buildContext(null, null)).toBeNull();
    expect(buildContext(null, undefined)).toBeNull();
    expect(buildContext({}, null)).toBeNull();
  });

  it("builds context from persisted metadata", () => {
    const metadata = {
      byoc_provider_id: "org-123",
      byoc_provider_name: "Green Lawns Inc",
      byoc_service_name: "Weekly Mowing",
      byoc_category_key: "mowing",
      byoc_zone_id: "zone-1",
    };

    const ctx = buildContext(metadata, null);
    expect(ctx).not.toBeNull();
    expect(ctx!.providerName).toBe("Green Lawns Inc");
    expect(ctx!.providerId).toBe("org-123");
    expect(ctx!.serviceName).toBe("Weekly Mowing");
    expect(ctx!.categoryKey).toBe("mowing");
    expect(ctx!.zoneId).toBe("zone-1");
    expect(ctx!.isByocFlow).toBe(true);
  });

  it("prefers metadata over live invite data", () => {
    const metadata = {
      byoc_provider_id: "meta-org",
      byoc_provider_name: "Meta Provider",
      byoc_category_key: "mowing",
      byoc_zone_id: "zone-meta",
    };
    const invite: ByocInviteDetails = {
      provider_org: { id: "live-org", name: "Live Provider", logo_url: null },
      sku: null,
      category_key: "pest_control",
      zone_id: "zone-live",
    };

    const ctx = buildContext(metadata, invite);
    expect(ctx!.providerId).toBe("meta-org");
    expect(ctx!.providerName).toBe("Meta Provider");
  });

  it("falls back to invite data when metadata has no byoc_provider_id", () => {
    const invite: ByocInviteDetails = {
      provider_org: { id: "live-org", name: "Live Provider", logo_url: null },
      sku: { id: "sku-1", name: "Pool Cleaning", category: "pool", duration_minutes: 45 },
      category_key: "pool",
      zone_id: "zone-live",
    };

    const ctx = buildContext({}, invite);
    expect(ctx!.providerId).toBe("live-org");
    expect(ctx!.serviceName).toBe("Pool Cleaning");
    expect(ctx!.categoryKey).toBe("pool");
  });

  it("uses fallback provider name when provider_org is null", () => {
    const invite: ByocInviteDetails = {
      provider_org: null,
      sku: null,
      category_key: "mowing",
      zone_id: "z1",
    };

    const ctx = buildContext(null, invite);
    expect(ctx!.providerName).toBe("Your Provider");
    expect(ctx!.providerId).toBe("");
  });
});

// ── Property validation tests ──

function validateProperty(form: { street_address: string; city: string; state: string; zip_code: string }) {
  const errors: Record<string, string> = {};
  if (!form.street_address.trim()) errors.street_address = "Street address is required";
  if (!form.city.trim()) errors.city = "City is required";
  if (!form.state.trim()) errors.state = "State is required";
  const zip = form.zip_code.replace(/\D/g, "");
  if (!zip) errors.zip_code = "Zip code is required";
  else if (zip.length !== 5) errors.zip_code = "Must be 5 digits";
  return errors;
}

describe("validateProperty", () => {
  it("returns no errors for valid input", () => {
    const errors = validateProperty({ street_address: "123 Main", city: "Austin", state: "TX", zip_code: "78701" });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("requires all fields", () => {
    const errors = validateProperty({ street_address: "", city: "", state: "", zip_code: "" });
    expect(errors.street_address).toBeDefined();
    expect(errors.city).toBeDefined();
    expect(errors.state).toBeDefined();
    expect(errors.zip_code).toBeDefined();
  });

  it("requires 5-digit zip", () => {
    const errors = validateProperty({ street_address: "123", city: "A", state: "TX", zip_code: "123" });
    expect(errors.zip_code).toBe("Must be 5 digits");
  });

  it("strips non-digits from zip before validating", () => {
    const errors = validateProperty({ street_address: "123", city: "A", state: "TX", zip_code: "78-701" });
    expect(errors.zip_code).toBeUndefined();
  });
});

// ── Navigation logic tests ──

describe("BYOC step navigation", () => {
  const BYOC_STEPS = ["recognition", "confirm", "property", "home_setup", "activating", "services", "plan", "success"] as const;

  function handleBack(currentStep: string): string {
    const stepIndex = BYOC_STEPS.indexOf(currentStep as any);
    let prevIdx = stepIndex - 1;
    if (BYOC_STEPS[prevIdx] === "activating") prevIdx--;
    return prevIdx >= 0 ? BYOC_STEPS[prevIdx] : currentStep;
  }

  it("goes from services to home_setup (skipping activating)", () => {
    expect(handleBack("services")).toBe("home_setup");
  });

  it("goes from home_setup to property", () => {
    expect(handleBack("home_setup")).toBe("property");
  });

  it("stays at recognition when already at first step", () => {
    expect(handleBack("recognition")).toBe("recognition");
  });

  it("goes from plan to services", () => {
    expect(handleBack("plan")).toBe("services");
  });
});
