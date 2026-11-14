import { z } from "zod";

export const seoInput = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(30).max(20000),
});
export const seoOutput = z.object({
  suggestedTitle: z.string().min(1).max(200),
  suggestedDescription: z.string().min(1).max(500),
  suggestions: z
    .array(
      z.object({
        priority: z.enum(["High", "Medium", "Low"]),
        area: z.string().min(1).max(100),
        action: z.string().min(1).max(2000),
        reason: z.string().min(1).max(2000),
      }),
    )
    .max(30),
  limitations: z.array(z.string().min(1).max(2000)).max(20),
});
export type SeoSuggestions = z.infer<typeof seoOutput>;
