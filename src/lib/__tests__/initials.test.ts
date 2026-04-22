import { describe, it, expect } from "vitest";
import { getInitials } from "@/lib/initials";

describe("getInitials", () => {
  it("returns both first and last initials when given a full name", () => {
    expect(getInitials("John Smith", "john@example.com")).toBe("JS");
  });

  it("collapses extra whitespace between name parts", () => {
    expect(getInitials("  John   Smith  ", null)).toBe("JS");
  });

  it("returns a single letter for a one-word name", () => {
    expect(getInitials("Cher", null)).toBe("C");
  });

  it("uses the first + last word for 3+ word names", () => {
    expect(getInitials("Mary Jane Smith", null)).toBe("MS");
  });

  it("falls back to the first character of email when name is null", () => {
    expect(getInitials(null, "jane@example.com")).toBe("J");
  });

  it("falls back to email when name is an empty string", () => {
    expect(getInitials("", "kate@example.com")).toBe("K");
  });

  it("falls back to email when name is whitespace-only", () => {
    expect(getInitials("   ", "lex@example.com")).toBe("L");
  });

  it("uppercases lowercase initials", () => {
    expect(getInitials("john smith", null)).toBe("JS");
    expect(getInitials(null, "adam@example.com")).toBe("A");
  });

  it("returns the brand letter H when both name and email are nullish", () => {
    expect(getInitials(null, null)).toBe("H");
    expect(getInitials(undefined, undefined)).toBe("H");
    expect(getInitials("", "")).toBe("H");
    expect(getInitials("  ", "  ")).toBe("H");
  });
});
