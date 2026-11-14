# SYNEXIS AI connection settings

Edit `ai-providers.json` to select `nvidia`, `gemini`, or `corex`. Set the exact model ID from your provider account and leave private keys out of this file. Store keys securely under the configured `apiKeySecret` name.

- NVIDIA: documented NIM OpenAI-compatible API base is `https://integrate.api.nvidia.com/v1`.
- Gemini: uses Google's native API at `https://generativelanguage.googleapis.com/v1beta`.
- Corex: website address removed as requested. Set `baseURL`, `allowedHost` (the exact documented API hostname), `model`, and authentication secret only after validating its API contract. Leave `verifiedProtocol: false` until then; do not guess an API address.

AI starts disabled. No provider key or exact model has been supplied, and live model availability has not been verified. Changing model IDs in this configuration does not prove tool or model support. No automatic provider switching or retries.

The server adapter streams upstream and consumes final text; it can explain only compact precomputed facts. Custom usage counters were declined, so this adapter is not exposed as an unrestricted public paid-call endpoint. The public interface uses deterministic source-traceable summaries until secure deployment access and spending controls are configured. Existing administrator-only SEO AI remains separate and unchanged.