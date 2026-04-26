import { describe, it, expect } from "vitest";
import { slugify } from "./bundleSlug";

describe("slugify", () => {
  it("converts a multi-word name to kebab-case", () => {
    expect(slugify("Fall Prep 2026")).toBe("fall-prep-2026");
  });

  it("collapses repeated whitespace", () => {
    expect(slugify("Spring   Refresh")).toBe("spring-refresh");
  });

  it("strips punctuation", () => {
    expect(slugify("Spring & Summer (2026)!")).toBe("spring-summer-2026");
  });

  it("strips diacritics", () => {
    expect(slugify("Été Préparation")).toBe("ete-preparation");
  });

  it("trims hyphens at edges", () => {
    expect(slugify("---trim me---")).toBe("trim-me");
  });

  it("collapses consecutive hyphens", () => {
    expect(slugify("a--b---c")).toBe("a-b-c");
  });

  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("treats underscores as word separators", () => {
    expect(slugify("fall_prep_2026")).toBe("fall-prep-2026");
  });
});
