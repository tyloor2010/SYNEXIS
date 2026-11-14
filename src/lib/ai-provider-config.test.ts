import { expect, it } from "vitest";
import config from "@/config/ai-providers.json";
import { resolveAiConfiguration } from "./ai-provider-config";
it("keeps external AI disabled without explicit configuration", () => {
  expect(resolveAiConfiguration().ready).toBe(false);
});
it("rejects unverified Corex API contracts", () => {
  expect(resolveAiConfiguration({ ...config, enabled: true, activeProvider: "corex" }).ready).toBe(
    false,
  );
});
it("requires a model ID even for supported Gemini", () => {
  expect(resolveAiConfiguration({ ...config, enabled: true }).ready).toBe(false);
});
it("rejects a different host before sending provider credentials", () => {
  const providers = {
    ...config.providers,
    gemini: {
      ...config.providers.gemini,
      model: "test-model",
      baseURL: "https://attacker.example/v1",
    },
  };
  expect(resolveAiConfiguration({ ...config, enabled: true, providers }).ready).toBe(false);
});
