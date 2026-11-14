# Terrain-aware SYNEXIS expansion

## Outcome
Expand SYNEXIS into a south-polar lunar planning and education experience that makes four questions easy to compare: sunlight above local terrain, available light and next sunset, direct Earth visibility and next interruption, and whether user-specified power and battery requirements are met by the modeled scenario.

Preserve the existing black-and-white space identity, fonts, team and presentation. As confirmed, Home gains an interactive 3D Moon; full planning controls remain on Navigator.

## Pages and journey
- **Home:** interactive NASA-textured Moon, concise introduction and entry to planning. No invented illumination or terrain claims before data loads.
- **Navigator:** choose a library site, globe point or coordinates; landing date/time and mission duration; Sun/Earth panels, visibility windows and timeline. Keep the existing `/explorer` address working.
- **Terrain:** integrate the local terrain viewer into Navigator for the initial release, as the brief permits. Show real LOLA elevations, local horizon and calculated sunlight shadows with source resolution and coverage visible.
- **Measure:** select terrain points to measure dimensions, surface distances, slope and terrain line of sight; display units and calculation limitations.
- **Compare:** compare up to four scenarios with matching definitions, mission requirements, power/battery estimates and downloadable reports.
- **Learn:** methodology, source names, assumptions, limitations and glossary. Provide educational and technical presentation of the same results—not different scientific calculations.

## Delivery order
### 1. Establish the real-terrain foundation
Identify and validate an official LOLA south-polar DEM product, its elevation units, projection, datum, missing-data values, resolution and licensing. Start with a bounded south-polar region; visibly show coverage rather than imply global terrain availability. Check actual retrieval and a known reference location before promising terrain-aware results.

Outside verified DEM coverage or when retrieval fails, withhold terrain results. Existing spherical estimates may remain available only with their current explicit limitations; never substitute generated terrain.

### 2. Build the navigation and viewing experience
Add Home's Moon and shared page navigation, then mission-duration controls and Learn. Extend the authentic JPL requests to the requested time window using bounded requests and visible sample intervals. Synchronize the globe, local terrain, selected point, Sun/Earth directions and timeline.

### 3. Calculate terrain-aware windows and measurements
Compute horizon profiles from real elevations, with lunar curvature and observer height handled explicitly. Compare Sun and Earth directions to those profiles. Distinguish point-direction visibility from solar-disc treatment; document which is implemented. Present total illuminated duration and next sunset, Earth-visible duration and next interruption as estimates with sampling/coverage limits. Do not count 25 hourly samples as 25 hours.

Render terrain shadows from the same source positions. Rendered shadows illustrate the calculation; quantitative visibility comes from the tested terrain analysis, not screen pixels. Use the same elevation source for measurement and rendering.

### 4. Compare mission requirements and export
Collect required mission inputs without inventing defaults: electrical load, array characteristics and orientation, conversion/loss assumptions, battery capacity, starting charge, usable-charge limits and charge/discharge efficiencies. Explain units and missing requirements.

Integrate power over the requested timeline; show energy demand, modeled generation, minimum battery charge and any deficit. Compare up to four complete scenarios and changes of one day or one kilometer without assuming either change always changes the result.

Use transparent statuses such as **requirements met under this model**, **requirements not met**, and **insufficient data**, with the contributing criteria shown. No arbitrary weighted score or flight-safety verdict. Export a readable report and source calculations including inputs, provenance, resolution, sampling, retrieval time and limitations.

## Scientific guardrails
- Horizons and LOLA are source data; no synthetic fallback measurements or terrain.
- Earth visibility is not a guaranteed radio link. Existing radio estimates retain their requirement for explicit equipment specifications.
- Missing terrain or mission inputs prevent a complete screening result.
- Never claim accuracy finer than the source DEM and temporal sampling support.
- No operational guarantees, flight certification, or full thermal simulation.
- No unrestricted AI chat. The initial release uses traceable explanations of computed results; any later AI explanation must remain grounded in those results.
- “Under one minute” is a workflow target to measure, not a promise about external-source retrieval speed.

## Technical approach
- Retain TanStack Start and the existing validated public JPL server function; extend its shared scenario schema and source checks rather than create a parallel feed.
- Process official DEM data into bounded, provenance-preserving terrain tiles. Validate the real source and asset-delivery approach before selecting a raster parser; no native raster processing inside the published server runtime.
- Keep projection, terrain/horizon, interval integration, measurements and battery calculations in pure TypeScript modules with concrete unit tests. Run heavier local analysis off the main UI thread when needed.
- Share scenario state across Navigator, Measure and Compare. Preserve up to four scenarios in browser-local storage, clearly local to the device; no account or shared-save expansion in this plan.
- Lazy-load 3D after hydration, preserve reduced-motion behavior and the one-per-tab opening. Keep Home's globe separate from scientific scenario state.
- Add unique page metadata and explicit public sitemap decisions for new pages. Preserve existing published URLs and presentation behavior.

## Acceptance checks
- Real LOLA tile retrieval, known-location elevation checks and missing-coverage handling.
- Known analytical terrain cases for blocked/clear Sun and Earth lines, curvature, slope and distance.
- Concrete tests for mission duration, interval-based light totals, four-scenario limit, missing inputs and battery depletion.
- End-to-end selection → date/duration → real-source result → terrain/measurement → comparison → report.
- Desktop and phone checks for visible 3D assets, selection, timeline synchronization, navigation and readable controls.
- Keep unsupported areas and unavailable source results explicitly unavailable; report any remaining source limitation rather than claim completion.