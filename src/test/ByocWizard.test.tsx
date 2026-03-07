import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// ── Mock modules ──

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" }, session: {} }),
}));

vi.mock("@/hooks/useOnboardingProgress", () => ({
  useOnboardingProgress: () => ({
    progress: { id: "prog-1", user_id: "user-1", current_step: "property", completed_steps: [], selected_plan_id: null, metadata: {}, created_at: "", updated_at: "" },
    advanceStep: vi.fn(),
    isLoading: false,
  }),
  ONBOARDING_STEPS: ["property", "zone_check", "home_setup", "plan", "subscribe", "service_day", "routine", "complete"],
}));

vi.mock("@/hooks/useProperty", () => ({
  useProperty: () => ({ property: null, save: vi.fn().mockResolvedValue({ id: "prop-1" }), isSaving: false, isLoading: false }),
  formatPetsForDisplay: () => "",
}));

vi.mock("@/hooks/usePropertyCoverage", () => ({
  usePropertyCoverage: () => ({ coverage: [], save: vi.fn().mockResolvedValue(undefined), isSaving: false }),
  COVERAGE_CATEGORIES: [],
}));

vi.mock("@/hooks/usePropertySignals", () => ({
  usePropertySignals: () => ({ signals: null, save: vi.fn().mockResolvedValue(undefined), isSaving: false }),
  SQFT_OPTIONS: [], YARD_OPTIONS: [], WINDOWS_OPTIONS: [], STORIES_OPTIONS: [],
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }), order: () => ({ limit: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) }), eq: () => ({ data: [], error: null }) }) }),
      update: () => ({ eq: () => ({ then: (cb: any) => cb({ error: null }) }) }),
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
    byocContext: mockInviteData?.is_active
      ? { providerName: mockInviteData.provider_org?.name ?? "Your Provider", providerId: mockInviteData.provider_org?.id ?? "", serviceName: mockInviteData.sku?.name ?? "Lawn Care", categoryKey: mockInviteData.category_key, zoneId: mockInviteData.zone_id, categoryLabel: "Lawn Care", isByocFlow: true as const }
      : null,
    isLoading: false,
  }),
}));

// ── Wrapper ──
function Wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/customer/onboarding/byoc/test-token"]}>
        <Routes>
          <Route path="/customer/onboarding/byoc/:token" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ── Import component under test ──
import ByocOnboardingWizard from "../ByocOnboardingWizard";

beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockClear();
  mockActivateMutateAsync = vi.fn().mockResolvedValue({});
});

// ════════════════════════════════════════
// Tests
// ════════════════════════════════════════

describe("ByocOnboardingWizard", () => {
  describe("Invalid / inactive invite → fallback screen", () => {
    it("shows fallback when invite data is null", () => {
      mockInviteData = null;
      render(<ByocOnboardingWizard />, { wrapper: Wrapper });
      expect(screen.getByText("This invitation is no longer active")).toBeInTheDocument();
    });

    it("shows fallback when invite is_active is false", () => {
      mockInviteData = { id: "inv-1", provider_org: { id: "org-1", name: "Lawn Co", logo_url: null }, sku: null, category_key: "mowing", zone_id: "z1", is_active: false, default_cadence: "weekly" };
      render(<ByocOnboardingWizard />, { wrapper: Wrapper });
      expect(screen.getByText("This invitation is no longer active")).toBeInTheDocument();
    });

    it("fallback has dashboard and onboarding buttons", () => {
      mockInviteData = null;
      render(<ByocOnboardingWizard />, { wrapper: Wrapper });
      expect(screen.getByText("Continue to Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Set up your home")).toBeInTheDocument();
    });

    it("fallback dashboard button navigates to /customer", () => {
      mockInviteData = null;
      render(<ByocOnboardingWizard />, { wrapper: Wrapper });
      fireEvent.click(screen.getByText("Continue to Dashboard"));
      expect(mockNavigate).toHaveBeenCalledWith("/customer");
    });
  });

  describe("Valid invite → recognition screen", () => {
    beforeEach(() => {
      mockInviteData = { id: "inv-1", provider_org: { id: "org-1", name: "Green Lawns LLC", logo_url: null }, sku: { id: "sku-1", name: "Weekly Mowing", category: "mowing", duration_minutes: 30 }, category_key: "mowing", zone_id: "z1", is_active: true, default_cadence: "weekly" };
    });

    it("shows provider name", () => {
      render(<ByocOnboardingWizard />, { wrapper: Wrapper });
      expect(screen.getByText(/Green Lawns LLC/)).toBeInTheDocument();
    });

    it("shows initial avatar when no logo", () => {
      render(<ByocOnboardingWizard />, { wrapper: Wrapper });
      expect(screen.getByText("G")).toBeInTheDocument();
    });

    it("shows heading", () => {
      render(<ByocOnboardingWizard />, { wrapper: Wrapper });
      expect(screen.getByText("Your provider is already on Handled Home")).toBeInTheDocument();
    });

    it("'I'm new here' navigates to standard onboarding", () => {
      render(<ByocOnboardingWizard />, { wrapper: Wrapper });
      fireEvent.click(screen.getByText("I'm new here"));
      expect(mockNavigate).toHaveBeenCalledWith("/customer/onboarding");
    });
  });

  describe("Confirm service → advances correctly", () => {
    beforeEach(() => {
      mockInviteData = { id: "inv-1", provider_org: { id: "org-1", name: "Green Lawns LLC", logo_url: null }, sku: { id: "sku-1", name: "Weekly Mowing", category: "mowing", duration_minutes: 30 }, category_key: "mowing", zone_id: "z1", is_active: true, default_cadence: "weekly", level: { id: "lvl-1", label: "Standard" } };
    });

    it("Continue from recognition shows confirm screen", () => {
      render(<ByocOnboardingWizard />, { wrapper: Wrapper });
      fireEvent.click(screen.getByText("Continue"));
      expect(screen.getByText("We found your service")).toBeInTheDocument();
    });

    it("confirm shows service details", () => {
      render(<ByocOnboardingWizard />, { wrapper: Wrapper });
      fireEvent.click(screen.getByText("Continue"));
      expect(screen.getByText("Green Lawns LLC")).toBeInTheDocument();
      expect(screen.getByText("Weekly Mowing")).toBeInTheDocument();
    });

    it("'Yes, looks right' advances to property", () => {
      render(<ByocOnboardingWizard />, { wrapper: Wrapper });
      fireEvent.click(screen.getByText("Continue"));
      fireEvent.click(screen.getByText("Yes, looks right"));
      expect(screen.getByText("Tell us about your home")).toBeInTheDocument();
    });
  });

  describe("Back navigation", () => {
    beforeEach(() => {
      mockInviteData = { id: "inv-1", provider_org: { id: "org-1", name: "Test Co", logo_url: null }, sku: null, category_key: "mowing", zone_id: "z1", is_active: true, default_cadence: "weekly" };
    });

    it("shows step indicator", () => {
      render(<ByocOnboardingWizard />, { wrapper: Wrapper });
      expect(screen.getByText(/Step 1 of/)).toBeInTheDocument();
    });

    it("back button appears on confirm screen", () => {
      render(<ByocOnboardingWizard />, { wrapper: Wrapper });
      fireEvent.click(screen.getByText("Continue"));
      expect(screen.getByText("Back")).toBeInTheDocument();
    });

    it("back from confirm returns to recognition", () => {
      render(<ByocOnboardingWizard />, { wrapper: Wrapper });
      fireEvent.click(screen.getByText("Continue"));
      fireEvent.click(screen.getByText("Back"));
      expect(screen.getByText("Your provider is already on Handled Home")).toBeInTheDocument();
    });
  });
});

// ── Pure navigation logic ──

describe("BYOC back nav skips activating step", () => {
  const BYOC_STEPS = ["recognition", "confirm", "property", "home_setup", "activating", "services", "plan", "success"] as const;
  function handleBack(currentStep: string): string {
    const stepIndex = BYOC_STEPS.indexOf(currentStep as any);
    let prevIdx = stepIndex - 1;
    if (BYOC_STEPS[prevIdx] === "activating") prevIdx--;
    return prevIdx >= 0 ? BYOC_STEPS[prevIdx] : currentStep;
  }

  it("services → home_setup", () => { expect(handleBack("services")).toBe("home_setup"); });
  it("plan → services", () => { expect(handleBack("plan")).toBe("services"); });
  it("home_setup → property", () => { expect(handleBack("home_setup")).toBe("property"); });
  it("recognition stays", () => { expect(handleBack("recognition")).toBe("recognition"); });
});
