/**
 * BYOC Onboarding Wizard — Logic Tests
 *
 * Tests the core logic without rendering the full component tree,
 * avoiding heavy dependency chains that cause test runner issues.
 */
import { describe, it, expect } from "vitest";
import { getCategoryLabel } from "@/lib/serviceCategories";

// ══════════════════════════════════════
// 1. Step navigation logic
// ══════════════════════════════════════
type ByocStep = "recognition" | "confirm" | "property" | "home_setup" | "activating" | "services" | "plan" | "success";
const BYOC_STEPS: ByocStep[] = ["recognition", "confirm", "property", "home_setup", "activating", "services", "plan", "success"];

function handleBack(currentStep: ByocStep): ByocStep {
  const stepIndex = BYOC_STEPS.indexOf(currentStep);
  let prevIdx = stepIndex - 1;
  if (BYOC_STEPS[prevIdx] === "activating") prevIdx--;
  return prevIdx >= 0 ? BYOC_STEPS[prevIdx] : currentStep;
}

function canGoBack(step: ByocStep): boolean {
  const stepIndex = BYOC_STEPS.indexOf(step);
  return stepIndex > 0 && step !== "activating" && step !== "success";
}

function computeProgressPercent(step: ByocStep): number {
  const visibleSteps = BYOC_STEPS.filter((s) => s !== "activating");
  const visibleIndex = visibleSteps.indexOf(step);
  const stepIndex = BYOC_STEPS.indexOf(step);
  return Math.round(((visibleIndex >= 0 ? visibleIndex : stepIndex) / (visibleSteps.length - 1)) * 100);
}

describe("BYOC step navigation", () => {
  it("back from services skips activating → home_setup", () => {
    expect(handleBack("services")).toBe("home_setup");
  });
  it("back from plan → services", () => {
    expect(handleBack("plan")).toBe("services");
  });
  it("back from home_setup → property", () => {
    expect(handleBack("home_setup")).toBe("property");
  });
  it("back from property → confirm", () => {
    expect(handleBack("property")).toBe("confirm");
  });
  it("back from confirm → recognition", () => {
    expect(handleBack("confirm")).toBe("recognition");
  });
  it("back from recognition stays at recognition", () => {
    expect(handleBack("recognition")).toBe("recognition");
  });
});

describe("canGoBack", () => {
  it("false on recognition (first step)", () => expect(canGoBack("recognition")).toBe(false));
  it("false on activating", () => expect(canGoBack("activating")).toBe(false));
  it("false on success", () => expect(canGoBack("success")).toBe(false));
  it("true on confirm", () => expect(canGoBack("confirm")).toBe(true));
  it("true on property", () => expect(canGoBack("property")).toBe(true));
  it("true on services", () => expect(canGoBack("services")).toBe(true));
  it("true on plan", () => expect(canGoBack("plan")).toBe(true));
});

describe("progress percentage", () => {
  it("recognition = 0%", () => expect(computeProgressPercent("recognition")).toBe(0));
  it("success = 100%", () => expect(computeProgressPercent("success")).toBe(100));
  it("confirm ~17%", () => {
    const p = computeProgressPercent("confirm");
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(50);
  });
  it("property < home_setup", () => {
    expect(computeProgressPercent("property")).toBeLessThan(computeProgressPercent("home_setup"));
  });
});

// ══════════════════════════════════════
// 2. Property validation logic
// ══════════════════════════════════════
interface PropertyForm {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
}

function validateProperty(form: PropertyForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.street_address.trim()) errors.street_address = "Street address is required";
  if (!form.city.trim()) errors.city = "City is required";
  if (!form.state.trim()) errors.state = "State is required";
  const zip = form.zip_code.replace(/\D/g, "");
  if (!zip) errors.zip_code = "Zip code is required";
  else if (zip.length !== 5) errors.zip_code = "Must be 5 digits";
  return errors;
}

describe("Property validation", () => {
  it("valid input → no errors", () => {
    expect(Object.keys(validateProperty({ street_address: "123 Main", city: "Austin", state: "TX", zip_code: "78701" }))).toHaveLength(0);
  });
  it("empty fields → all errors", () => {
    const errors = validateProperty({ street_address: "", city: "", state: "", zip_code: "" });
    expect(errors.street_address).toBeDefined();
    expect(errors.city).toBeDefined();
    expect(errors.state).toBeDefined();
    expect(errors.zip_code).toBeDefined();
  });
  it("short zip → error", () => {
    expect(validateProperty({ street_address: "a", city: "b", state: "TX", zip_code: "123" }).zip_code).toBe("Must be 5 digits");
  });
  it("strips non-digits from zip", () => {
    expect(validateProperty({ street_address: "a", city: "b", state: "TX", zip_code: "78-701" }).zip_code).toBeUndefined();
  });
});

// ══════════════════════════════════════
// 3. Invite fallback logic
// ══════════════════════════════════════
function shouldShowFallback(inviteData: { is_active: boolean } | null | undefined): boolean {
  return !inviteData || !inviteData.is_active;
}

describe("Invite fallback logic", () => {
  it("null invite → fallback", () => expect(shouldShowFallback(null)).toBe(true));
  it("undefined invite → fallback", () => expect(shouldShowFallback(undefined)).toBe(true));
  it("inactive invite → fallback", () => expect(shouldShowFallback({ is_active: false })).toBe(true));
  it("active invite → no fallback", () => expect(shouldShowFallback({ is_active: true })).toBe(false));
});

// ══════════════════════════════════════
// 4. Cadence label logic
// ══════════════════════════════════════
const CADENCE_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  once: "One-time",
};

describe("Cadence labels", () => {
  it("weekly → Weekly", () => expect(CADENCE_LABELS["weekly"]).toBe("Weekly"));
  it("biweekly → Bi-weekly", () => expect(CADENCE_LABELS["biweekly"]).toBe("Bi-weekly"));
  it("unknown cadence falls back gracefully", () => {
    const label = CADENCE_LABELS["daily"] ?? "daily";
    expect(label).toBe("daily");
  });
});

// ══════════════════════════════════════
// 5. Service expansion logic
// ══════════════════════════════════════
describe("Services screen toggle logic", () => {
  function toggleCategory(interested: string[], cat: string): string[] {
    return interested.includes(cat)
      ? interested.filter((c) => c !== cat)
      : [...interested, cat];
  }

  it("adds new category", () => {
    expect(toggleCategory([], "pool")).toEqual(["pool"]);
  });
  it("removes existing category", () => {
    expect(toggleCategory(["pool", "pest_control"], "pool")).toEqual(["pest_control"]);
  });
  it("adds second category", () => {
    expect(toggleCategory(["mowing"], "pool")).toEqual(["mowing", "pool"]);
  });
});

describe("Services continue/skip routing", () => {
  function nextStepAfterServices(interested: string[]): ByocStep {
    return interested.length > 0 ? "plan" : "success";
  }

  it("interested services → plan", () => {
    expect(nextStepAfterServices(["pool"])).toBe("plan");
  });
  it("no interested services → success", () => {
    expect(nextStepAfterServices([])).toBe("success");
  });
});

// ══════════════════════════════════════
// 6. Activation error handling
// ══════════════════════════════════════
describe("Activation error handling", () => {
  function determinePostActivationStep(error: Error | null, inviteStillActive: boolean): ByocStep | "navigate_home" {
    if (!error) return "services";
    if (error.message?.includes("already activated") || error.message?.includes("409")) {
      return "navigate_home";
    }
    return "home_setup"; // Return to previous step on failure
  }

  it("success → services", () => {
    expect(determinePostActivationStep(null, true)).toBe("services");
  });
  it("already activated → navigate home", () => {
    expect(determinePostActivationStep(new Error("already activated"), true)).toBe("navigate_home");
  });
  it("409 conflict → navigate home", () => {
    expect(determinePostActivationStep(new Error("409 Conflict"), true)).toBe("navigate_home");
  });
  it("other error → home_setup", () => {
    expect(determinePostActivationStep(new Error("Network error"), true)).toBe("home_setup");
  });
});

// ══════════════════════════════════════
// 7. Context builder (mirrors useByocOnboardingContext)
// ══════════════════════════════════════
interface ByocContext {
  providerName: string;
  providerId: string;
  serviceName: string;
  categoryKey: string;
  zoneId: string;
  categoryLabel: string;
  isByocFlow: true;
}

function buildContext(
  metadata: Record<string, unknown> | null,
  inviteData: { provider_org: { id: string; name: string } | null; sku: { name: string } | null; category_key: string; zone_id: string } | null
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

describe("buildContext (refresh resilience)", () => {
  it("returns null when both are null", () => {
    expect(buildContext(null, null)).toBeNull();
  });
  it("prefers metadata over invite (refresh resilience)", () => {
    const ctx = buildContext(
      { byoc_provider_id: "meta-org", byoc_provider_name: "Meta Co", byoc_category_key: "mowing", byoc_zone_id: "z1" },
      { provider_org: { id: "live-org", name: "Live Co" }, sku: null, category_key: "pool", zone_id: "z2" }
    );
    expect(ctx!.providerId).toBe("meta-org");
    expect(ctx!.providerName).toBe("Meta Co");
  });
  it("falls back to invite when no metadata", () => {
    const ctx = buildContext({}, { provider_org: { id: "live-org", name: "Live Co" }, sku: { name: "Pool Clean" }, category_key: "pool", zone_id: "z2" });
    expect(ctx!.providerId).toBe("live-org");
    expect(ctx!.serviceName).toBe("Pool Clean");
  });
});
