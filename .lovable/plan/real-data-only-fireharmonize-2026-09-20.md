# Real-data-only FIREHARMONIZE

## Goal
Keep the existing FIREHARMONIZE design and interaction structure, but ensure every pixel that looks like scientific data is traceable to authentic NASA FIRMS observations or a documented calculation.

## Changes
- Remove all generated hotspot, calendar, KPI, anomaly, comparison, map, and case-study values from the application.
- Replace the illustrative map and decorative hero fire points with a legitimate geographic basemap and observation layers populated only from retrieved NASA FIRMS records.
- Add a secure server-side NASA FIRMS data adapter so the API key never appears in the browser, with separate MODIS and VIIRS retrieval and strict field validation.
- Derive KPIs, weekly/monthly calendar cells, sensor comparisons, common-grid harmonization, historical baselines, and anomalies only from returned records.
- Show accurate connection/loading/no-data/insufficient-data states instead of fallback numbers.
- Add source, sensor, AOI, period, resolution, aggregation, and processing provenance around major results, with accessible methodology details.
- Keep predefined AOIs as geographic selections only; any unconfigured case study will clearly say its dataset is not configured.
- Preserve the existing page structure, typography, controls, animations, creator credit, responsive behavior, and non-endorsement language.

## Technical details
- Use Lovable Cloud for the protected server-side FIRMS request and secret handling.
- Read the FIRMS key only inside the server handler; never expose it through client environment variables or rendered content.
- Use schema validation for upstream records and return only the scientific fields required by the interface.
- Keep raw NASA records, project calculations, and project-defined indices visibly distinguished.

## Verification
- Scan source and rendered content for fabricated values, demo records, misleading live labels, and generated scientific imagery.
- Test connected, unavailable, empty, and insufficient-history states.
- Verify map filtering, hotspot provenance, calendar aggregation, harmonization reproducibility, navigation, and mobile/desktop layouts.
