# Security review — 14 November 2026

## Boundaries retained
- Public JPL retrieval: bounded inputs, fixed HTTPS source, no caller-controlled URL, no synthetic fallback.
- Administrator SEO suggestions: verified server-side role check before AI; generated auth middleware, token attachment and CSRF protection retained.
- Other external AI: nonsecret editable configuration, server-only adapter, disabled publicly pending credentials/provider contracts/access controls; no counters added.
- Source exports: no environment values, credential files, Git metadata, installed dependencies, generated route/build files or backend account data.

## Changes in this review
- Removed the abandoned fire-project UI and FIRMS function; removed its mapping dependencies.
- Updated vulnerable Zod and pinned patched transitive js-yaml/source-map-js; verify against the lockfile, not just package ranges.
- Bounded upstream bytes while streaming before JSON/HTML allocation; rejected JPL redirects.
- Independently validated persisted scenarios, null samples, bounded array counts and oversized storage.
- Preserved historical snapshot provenance in exports; neutralized formula-like CSV text and regression-tested HTML escaping.
- Kept terrain caching optional, so denied/full browser storage cannot invalidate successfully verified terrain.
- Bounded AI facts/question size and request timeouts. No new public paid endpoint.
- Restricted provider credential destinations to each configured provider's expected HTTPS host and bounded structured SEO output.
- Applied a migration restricting role checks to the authenticated caller; anonymous execution is denied and checking another user always returns false.

## Verification and open limitations
Basic database checks reported no issues. The refreshed production dependency scan found no known vulnerabilities in 62 checked dependencies. The completed deep code review reported one warning: arbitrary signed-in callers could inspect another user's role. The new migration was applied, and its live function definition and authenticated/anonymous grants were verified. The scanner reviewed the previous saved revision; these fixes have not undergone a second deep scan.

Backend signup/provider settings and an authenticated administrator AI flow have not been independently verified in this review. Wider source coverage/catalog and live external providers remain incomplete; no test substitutes for unavailable source data or provider credentials.

Final verification: 56 tests passed across 17 files; current compilation succeeded. Real 48-hour JPL/LOLA planning, sensitivity, restored sharing, measurements and CSV/PDF export were exercised with no observed browser errors. Desktop and phone layouts and Home's rendered Moon were checked. Code hygiene checks returned zero errors and eight development hot-refresh warnings in mixed-export UI modules; these are not suppressed or described as security clearance.

No application can be guaranteed free of vulnerabilities or logic errors. Review deployment access, provider spending limits, dependencies and scientific assumptions whenever configuration or source data changes.