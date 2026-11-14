# Transform Voyager into FIREHARMONIZE

## Goal
Preserve the current hand-drawn, animated, responsive experience while changing its purpose into a judge-ready NASA Space Apps Challenge 2026 fire-analysis story centered on the Harmonized Fire Activity Calendar.

## What will change
- Rebrand navigation, page copy, metadata, and attribution to **FIREHARMONIZE — MODIS × VIIRS Fire Activity Harmonization**.
- Repurpose the opening into a fire-analysis overview with the existing animated visual language, a clear **Launch Demo** action, demo-data status, and six key fire metrics.
- Add an interactive fire map with selectable MODIS, VIIRS, and Harmonized layers; sensor/date/FRP/confidence/day-night controls; hotspot details; and region selection including California, Mediterranean, Amazon, Australia, North Africa, and Egypt.
- Build the central **MODIS vs VIIRS → Harmonized View** switch so judges can compare raw observations with a shared 5 km × 5 km weekly grid.
- Build the main **Harmonized Fire Activity Calendar** as a years-by-months heatmap. Selecting a cell will show detections, sensor counts, FRP, baseline, and anomaly.
- Repurpose existing content blocks into the transparent harmonization workflow, historical anomaly analysis, MODIS/VIIRS comparison, methodology, and data attribution.
- Keep all sample observations local and clearly marked **DEMO DATA**. Prepare a typed data boundary for a future `VITE_FIRMS_API_KEY` connection without exposing any key or presenting demo values as live NASA data.

## Interaction and visual approach
- Retain the current monochrome paper/ink theme, typography, custom cursor, reveal animations, floating motion, card treatment, and mobile-first behavior.
- Use restrained sensor accents within the existing semantic token system so MODIS, VIIRS, harmonized cells, and anomalies are easy to distinguish.
- Make **Launch Demo** scroll through and activate the predefined California analysis state, with the harmonized view and calendar ready for a two-minute walkthrough.

## Technical details
- Rework the existing single route rather than adding unnecessary pages or changing routing.
- Split the transformed experience into focused local components and deterministic demo-data utilities while preserving the existing architecture.
- Use a lightweight custom geographic canvas/SVG visualization and accessible native controls instead of adding a heavy map dependency.
- Update the route metadata and root defaults for the new identity.
- Verify desktop and phone layouts, interactive layer/view/region/calendar controls, scrolling, console output, and horizontal overflow.

## Guardrails
- The harmonized index will be labeled as a **project-defined analytical metric** and described as a common spatial-temporal comparison framework.
- Copy will explicitly state that harmonization does not eliminate all sensor bias, demo data is simulated, and the project is not an official NASA product.
- NASA FIRMS, MODIS, and VIIRS will be credited clearly.
