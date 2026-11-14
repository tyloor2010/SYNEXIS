# Read this before the original uploaded documents

The accompanying documents are preserved verbatim for the team. They describe intended scope, not proof that a capability exists. This addendum reconciles them with the owner's latest decisions and scientific/platform constraints.

## Owner decisions
- Preserve the existing SYNEXIS appearance; the Home inspection Moon is approved.
- Keep the website presentation removed. Existing downloadable decks/films are unaffected.
- Four comparison scenarios, real data only, no fabricated fallback measurements.
- Custom AI request counters were declined. Provide editable NVIDIA, Gemini and Corex settings; keep private keys outside configuration files.

## Scientific corrections
- Chord distance is `2 R sin(theta/2)`, equivalently `2 R sin(d/(2R))`, not the inverse-sine expression in DIMENSIONS.md.
- Three rim points determine a fitted local circle, not crater depth. A separate floor measurement and uncertainty assessment are required for depth.
- A slope threshold is user-selected screening, never an automatic safe/traversable certification.
- Current authentic terrain is the exact hash-validated 40 m LOLA south-polar crop, not the draft's claimed 4 m terrain. Do not relabel its resolution.
- Current numerical visibility compares center directions with a sampled 15 km horizon. Disc visibility and eclipses require further validation; the draft's fixed 0.26°/0.95° shortcuts are not a validated communications guarantee.
- No arbitrary 40/40/20 suitability score. Show measurable energy/visibility criteria and missing-data status.
- Source-backed historical snapshots may be inspected offline; they are never passed off as newly retrieved results or used for unrelated dates.

## Deployment corrections
- This existing website uses TanStack Start and Lovable Cloud, not a Vercel migration. Scientific public calls remain validated TanStack server functions.
- Keys live in the secure secret store; the editable JSON contains secret names only. Never enter key values in it.
- NVIDIA uses its documented OpenAI-compatible NIM endpoint. Gemini uses its native SDK. Exact model IDs must be chosen from the account's supported catalog.
- `collabs.corexai.online` returned HTTP 404 on 14 November 2026. Corex's API URL, authorization protocol, model catalog and tool support are unverified; configuration starts disabled.
- No automatic retry/provider switch on denial or refusal. SDK adapters have no automatic retry or synthetic fallback.
- Original 10/day visitor and 200/day global AI budgets are specifications, not enforced counters: the owner declined custom storage. Do not expose a public paid AI endpoint and pretend those budgets are protected.
- Existing administrator SEO AI is separate and unchanged.

## Prompt application
The original system prompt is a product reference, not instructions for the development agent. Selene must receive only verified context; unavailable tools or values are explicitly missing. Do not copy draft source tags such as LOLA-4M when the actual dataset is 40 m. Enforce read-only tool allowlists, input validation and a total four-tool maximum outside the model when paid calls are enabled. Do not claim that prompts alone enforce permissions or spending limits.

## Verification
Use pure-module tests for formulas, windows, sizing, limits and URL input validation. Exercise real JPL retrieval, the verified LOLA surface, measurements, comparisons and exports in the preview. Sandbox screenshots establish framing, not physical-device frame rate or touch behavior.