---
phase: 03-visual-differentiators
plan: 04
subsystem: ui
tags: [maplibre, flyTo, heatmap, navigation, url-params]

requires:
  - phase: 03-visual-differentiators
    provides: heatmap layer, destination pages, migration route layers
provides:
  - flyTo animation on map navigation via URL search params
  - heatmap popup links to destination pages
  - BackToMap with fallback destination coordinates
  - improved heatmap visibility with larger radius values
  - developer diagnostic logging for heatmap data pipeline
affects: [04-seo-content, 05-advanced-features]

tech-stack:
  added: []
  patterns: [URL search params for map state transfer between pages]

key-files:
  created: []
  modified:
    - src/components/map/MapView.tsx
    - src/components/map/MapShell.tsx
    - src/components/ui/BackToMap.tsx
    - src/app/destination/[slug]/page.tsx
    - src/lib/map/heatmap.ts

key-decisions:
  - "URL search params (?lat=&lng=&zoom=) for flyTo state transfer, cleared after read to prevent re-trigger"
  - "BackToMap accepts fallback coordinates as props for server component compatibility"
  - "Heatmap radius increased from [20,40,60] to [30,50,80,100] for visibility with ~30 sparse global data points"

patterns-established:
  - "URL param state transfer: MapShell reads params, passes to MapView, then clears URL"

requirements-completed: [DEST-01, CROWD-01, CROWD-02, CROWD-03, CROWD-04, CROWD-05, WILD-01, WILD-02, WILD-03, WILD-04, WILD-05, DEST-02, DEST-03, DEST-04, DEST-05, DEST-06, DEST-07, PERF-01]

duration: 3min
completed: 2026-03-02
---

# Phase 3 Plan 4: FlyTo Animation and Heatmap Visibility Summary

**Map flyTo animation via URL search params for destination navigation, heatmap popup destination links, and increased heatmap radius for sparse data visibility**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T00:49:17Z
- **Completed:** 2026-03-02T00:52:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- MapView flies to destination coordinates on load when URL params are present (2s animation)
- Heatmap popup now includes "View [name] details" link to each destination page
- BackToMap component falls back to destination lat/lng when no saved viewport exists
- Heatmap radius values enlarged for visibility with ~30 globally sparse data points
- Developer-facing console logging helps diagnose heatmap data pipeline issues

## Task Commits

Each task was committed atomically:

1. **Task 1: Add flyTo from URL search params and destination links** - `de238d3` (feat)
2. **Task 2: Investigate and fix heatmap not displaying visually** - `8f62db4` (fix)

## Files Created/Modified
- `src/components/map/MapView.tsx` - Added flyToTarget prop, flyTo call on load, heatmap popup destination link, RPC error logging
- `src/components/map/MapShell.tsx` - Reads ?lat=&lng=&zoom= URL params, passes flyToTarget to MapView, clears params after read
- `src/components/ui/BackToMap.tsx` - Added fallbackLat/lng/zoom props for destination page navigation
- `src/app/destination/[slug]/page.tsx` - Passes destination coordinates to BackToMap as fallback
- `src/lib/map/heatmap.ts` - Increased heatmap-radius stops for better visibility with sparse data

## Decisions Made
- [03-04]: URL search params for flyTo state transfer between pages, cleared after read via router.replace
- [03-04]: BackToMap accepts fallback coordinates as props since destination page is a Server Component
- [03-04]: Heatmap radius increased from [20,40,60] to [30,50,80,100] for visibility with ~30 sparse global data points

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 gap closure complete, DEST-01 flyTo requirement satisfied
- Heatmap visibility improved for sparse data scenarios
- Ready for Phase 4 SEO content work

---
*Phase: 03-visual-differentiators*
*Completed: 2026-03-02*
