import { describe, expect, it } from "vitest";
import { seoInput, seoOutput } from "./seo-suggestions-schema";

describe("SEO suggestions validation", () => {
  it("rejects oversized AI output collections", () => {
    expect(
      seoOutput.safeParse({
        suggestedTitle: "SYNEXIS",
        suggestedDescription: "Lunar sites",
        suggestions: Array(31).fill({
          priority: "Low",
          area: "Title",
          action: "Review",
          reason: "Clarity",
        }),
        limitations: [],
      }).success,
    ).toBe(false);
  });
  it("requires meaningful page content", () => {
    expect(seoInput.safeParse({ title: "SYNEXIS", content: "short" }).success).toBe(false);
    expect(
      seoInput.safeParse({
        title: "SYNEXIS",
        content: "Authentic JPL Horizons lunar site comparisons.",
      }).success,
    ).toBe(true);
  });
  it("requires actionable structured suggestions and valid priority", () => {
    expect(
      seoOutput.safeParse({
        suggestedTitle: "SYNEXIS",
        suggestedDescription: "Lunar sites",
        suggestions: [{ priority: "Urgent", area: "Title", action: "Rewrite", reason: "Clarity" }],
        limitations: [],
      }).success,
    ).toBe(false);
  });
});
