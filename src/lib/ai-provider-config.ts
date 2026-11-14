import config from "@/config/ai-providers.json";
export type AiProviderName = keyof typeof config.providers;
export function resolveAiConfiguration(value = config) {
  if (!value.enabled)
    return {
      ready: false as const,
      reason: "AI is not enabled. Calculated summaries remain available.",
    };
  const name = value.activeProvider as AiProviderName;
  const provider = value.providers[name];
  if (!provider || !provider.verifiedProtocol || !provider.model.trim() || !provider.baseURL.trim())
    return {
      ready: false as const,
      reason: "AI provider needs a verified API address and exact model ID.",
    };
  let url: URL;
  try {
    url = new URL(provider.baseURL);
  } catch {
    return { ready: false as const, reason: "AI provider configuration is invalid." };
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^[A-Z][A-Z0-9_]+$/.test(provider.apiKeySecret)
  )
    return { ready: false as const, reason: "AI provider configuration is invalid." };
  const expectedHost =
    name === "gemini"
      ? "generativelanguage.googleapis.com"
      : name === "nvidia"
        ? "integrate.api.nvidia.com"
        : value.providers.corex.allowedHost;
  if (
    !expectedHost || url.hostname !== expectedHost ||
    (url.port && url.port !== "443") ||
    !Number.isInteger(value.maxOutputTokens)
  )
    return { ready: false as const, reason: "AI provider host or output limit is invalid." };
  return {
    ready: true as const,
    name,
    provider,
    maxOutputTokens: Math.min(350, Math.max(1, value.maxOutputTokens)),
  };
}
