import { PropertyFormData } from "@/hooks/useProperty";

// ── Types ──
export type ByocStep = "confirm" | "plan" | "activating" | "success";

export const BYOC_STEPS: ByocStep[] = ["confirm", "plan", "activating", "success"];

export const CADENCE_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  once: "One-time",
};

export const TIER_HIGHLIGHTS: Record<string, string[]> = {
  essential: ["Weekly mow + edge trim", "Swap services each cycle", "Roll over unused handles"],
  plus: ["Everything in Essential", "Seasonal services included", "Priority scheduling"],
  premium: ["Everything in Plus", "Home Assistant access", "Dedicated provider team"],
};

export function getTierKey(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("premium")) return "premium";
  if (lower.includes("plus")) return "plus";
  return "essential";
}

// ── Helpers ──
export function stripNonDigits(val: string): string {
  return val.replace(/\D/g, "").slice(0, 5);
}

export interface FieldErrors {
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export function validateProperty(form: PropertyFormData): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.street_address.trim()) errors.street_address = "Street address is required";
  if (!form.city.trim()) errors.city = "City is required";
  if (!form.state.trim()) errors.state = "State is required";
  const zip = form.zip_code.replace(/\D/g, "");
  if (!zip) errors.zip_code = "Zip code is required";
  else if (zip.length !== 5) errors.zip_code = "Must be 5 digits";
  return errors;
}
