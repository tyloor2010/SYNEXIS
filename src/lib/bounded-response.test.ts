import { expect, it } from "vitest";
import { readBoundedText } from "./bounded-response.server";
it("rejects streamed upstream data larger than the byte budget", async () => {
  await expect(readBoundedText(new Response("abcdef"), 5)).rejects.toThrow("size");
});
it("enforces byte budgets including multibyte characters", async () => {
  await expect(readBoundedText(new Response("é"), 2)).resolves.toBe("é");
  await expect(readBoundedText(new Response("é"), 1)).rejects.toThrow("size");
});
