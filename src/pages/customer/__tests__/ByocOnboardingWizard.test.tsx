import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// ── Mock modules ──

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" }, session: {} }),
}));

const mockProgress = {
  id: "prog-1",
  user_id: "user-1",
  current_step: "property",
  completed_steps: [],
  selected_plan_id: null,
  metadata: {},
  created_at: "",
  updated_at: "",
};

vi.mock("@/hooks/useOnboardingProgress", () => ({
  useOnboardingProgress: () => ({
    progress: mockProgress,
    advanceStep: vi.fn(),
    isLoading: false,
  }),
  ONBOARDING_STEPS: ["property", "zone_check", "home_setup", "plan", "subscribe", "service_day", "routine", "complete"],
}));

vi.mock("@/hooks/useProperty", () => ({
  useProperty: () => ({
    property: null,
    save: vi.fn().mockResolvedValue({ id: "prop-1" }),
    isSaving: false,
    isLoading: false,
  }),
  formatPetsForDisplay: () => "",
}));

vi.mock("@/hooks/usePropertyCoverage", () => ({
  usePropertyCoverage: () => ({
    coverage: [],
    save: vi.fn().mockResolvedValue(undefined),
    isSaving: false,
  }),
  COVERAGE_CATEGORIES: [],
}));

vi.mock("@/hooks/usePropertySignals", () => ({
  usePropertySignals: () => ({
    signals: null,
    save: vi.fn().mockResolvedValue(undefined),
    isSaving: false,
  }),
  SQFT_OPTIONS: [],
  YARD_OPTIONS: [],
  WINDOWS_OPTIONS: [],
  STORIES_OPTIONS: [],
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          order: () => ({
            limit: () => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
        }),
      }),
      update: () => ({
        eq: () => ({ then: (cb: any) => cb({ error: null }) }),
      }),
    }),
    functions: { invoke: vi.fn() },
  },
}));

// ── Control the invite mock ──
let mockInviteData: any = null;
let mockActivateMutateAsync = vi.fn();

vi.mock("@/hooks/useByocOnboardingContext", () => ({
  useByocOnboardingContext: () => ({
    invite: { data: mockInviteData, isLoading: false },
    activate: { mutateAsync: mockActivateMutateAsync },
    byocContext: mockInviteData
      ? {
          providerName: mockInviteData.provider_org?.name ?? "Your Provider",
          providerId: mockInviteData.provider_org?.id ?? "",
          serviceName: mockInviteData.sku?.name ?? "Lawn Care",
          categoryKey: mockInviteData.category_key,
          zoneId: mockInviteData.zone_id,
          categoryLabel: "Lawn Care",
          isByocFlow: true as const,
        }
      : null,
    isLoading: false,
  }),
}));

// ── Helpers ──
function renderWizard(token = "test-token") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/customer/onboarding/byoc/${token}`]}>
        <Routes>
          <Route path="/customer/onboarding/byoc/:token" element={<React.Suspense fallback={<div>Loading...</div>}><ByocWizardWrapper /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// Lazy import to ensure mocks are set up first
let ByocWizardWrapper: React.FC;

beforeEach(async () => {
  vi.clearAllMocks();
  mockNavigate.mockClear();
  mockActivateMutateAsync = vi.fn().mockResolvedValue({});
  const mod = await import("../ByocOnboardingWizard");
  ByocWizardWrapper = mod.default;
});

// ════════════════════════════════════════
// Tests
// ════════════════════════════════════════

describe("ByocOnboardingWizard", () => {
  describe("Invalid / inactive invite → fallback screen", () => {
    it("shows fallback when invite data is null", () => {
      mockInviteData = null;
      renderWizard();
      expect(screen.getByText("This invitation is no longer active")).toBeInTheDocument();
    });

    it("shows fallback when invite is_active is false", () => {
      mockInviteData = {
        id: "inv-1",
        provider_org: { id: "org-1", name: "Lawn Co", logo_url: null },
        sku: null,
        category_key: "mowing",
        zone_id: "z1",
        is_active: false,
        default_cadence: "weekly",
      };
      renderWizard();
      expect(screen.getByText("This invitation is no longer active")).toBeInTheDocument();
    });

    it("fallback has dashboard and onboarding buttons", () => {
      mockInviteData = null;
      renderWizard();
      expect(screen.getByText("Continue to Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Set up your home")).toBeInTheDocument();
    });

    it("fallback dashboard button navigates to /customer", () => {
      mockInviteData = null;
      renderWizard();
      fireEvent.click(screen.getByText("Continue to Dashboard"));
      expect(mockNavigate).toHaveBeenCalledWith("/customer");
    });
  });

  describe("Valid invite → recognition screen renders", () => {
    beforeEach(() => {
      mockInviteData = {
        id: "inv-1",
        provider_org: { id: "org-1", name: "Green Lawns LLC", logo_url: null },
        sku: { id: "sku-1", name: "Weekly Mowing", category: "mowing", duration_minutes: 30 },
        category_key: "mowing",
        zone_id: "z1",
        is_active: true,
        default_cadence: "weekly",
      };
    });

    it("shows provider name on recognition screen", () => {
      renderWizard();
      expect(screen.getByText(/Green Lawns LLC/)).toBeInTheDocument();
    });

    it("shows provider initial avatar when no logo", () => {
      renderWizard();
      expect(screen.getByText("G")).toBeInTheDocument();
    });

    it("shows 'Your provider is already on Handled Home' heading", () => {
      renderWizard();
      expect(screen.getByText("Your provider is already on Handled Home")).toBeInTheDocument();
    });

    it("shows Continue button", () => {
      renderWizard();
      expect(screen.getByText("Continue")).toBeInTheDocument();
    });

    it("has 'I'm new here' link", () => {
      renderWizard();
      expect(screen.getByText("I'm new here")).toBeInTheDocument();
    });

    it("'I'm new here' navigates to standard onboarding", () => {
      renderWizard();
      fireEvent.click(screen.getByText("I'm new here"));
      expect(mockNavigate).toHaveBeenCalledWith("/customer/onboarding");
    });
  });

  describe("Confirm service → advances correctly", () => {
    beforeEach(() => {
      mockInviteData = {
        id: "inv-1",
        provider_org: { id: "org-1", name: "Green Lawns LLC", logo_url: null },
        sku: { id: "sku-1", name: "Weekly Mowing", category: "mowing", duration_minutes: 30 },
        category_key: "mowing",
        zone_id: "z1",
        is_active: true,
        default_cadence: "weekly",
        level: { id: "lvl-1", label: "Standard" },
      };
    });

    it("advancing from recognition shows confirm screen", () => {
      renderWizard();
      fireEvent.click(screen.getByText("Continue"));
      expect(screen.getByText("We found your service")).toBeInTheDocument();
    });

    it("confirm screen shows service details", () => {
      renderWizard();
      fireEvent.click(screen.getByText("Continue"));
      expect(screen.getByText("Green Lawns LLC")).toBeInTheDocument();
      expect(screen.getByText("Weekly Mowing")).toBeInTheDocument();
      expect(screen.getByText("Weekly")).toBeInTheDocument();
    });

    it("confirm 'Yes, looks right' advances to property", () => {
      renderWizard();
      fireEvent.click(screen.getByText("Continue"));
      fireEvent.click(screen.getByText("Yes, looks right"));
      expect(screen.getByText("Tell us about your home")).toBeInTheDocument();
    });
  });

  describe("Step indicator and back navigation", () => {
    beforeEach(() => {
      mockInviteData = {
        id: "inv-1",
        provider_org: { id: "org-1", name: "Test Co", logo_url: null },
        sku: null,
        category_key: "mowing",
        zone_id: "z1",
        is_active: true,
        default_cadence: "weekly",
      };
    });

    it("shows step indicator", () => {
      renderWizard();
      expect(screen.getByText(/Step 1 of/)).toBeInTheDocument();
    });

    it("back button appears on confirm screen", () => {
      renderWizard();
      fireEvent.click(screen.getByText("Continue"));
      expect(screen.getByText("Back")).toBeInTheDocument();
    });

    it("back from confirm returns to recognition", () => {
      renderWizard();
      fireEvent.click(screen.getByText("Continue"));
      fireEvent.click(screen.getByText("Back"));
      expect(screen.getByText("Your provider is already on Handled Home")).toBeInTheDocument();
    });
  });
});

// ── Pure logic tests (already in useByocOnboardingContext.test.ts but
//    duplicated here for navigation-specific scenarios) ──

describe("BYOC navigation: back skips activating step", () => {
  const BYOC_STEPS = ["recognition", "confirm", "property", "home_setup", "activating", "services", "plan", "success"] as const;

  function handleBack(currentStep: string): string {
    const stepIndex = BYOC_STEPS.indexOf(currentStep as any);
    let prevIdx = stepIndex - 1;
    if (BYOC_STEPS[prevIdx] === "activating") prevIdx--;
    return prevIdx >= 0 ? BYOC_STEPS[prevIdx] : currentStep;
  }

  it("services → home_setup (skips activating)", () => {
    expect(handleBack("services")).toBe("home_setup");
  });

  it("plan → services", () => {
    expect(handleBack("plan")).toBe("services");
  });
});
