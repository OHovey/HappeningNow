---
phase: 03-visual-differentiators
plan: 02
subsystem: ui, map
tags: [maplibre, geojson, migration-routes, animation, species-toggle, trail-effect]

# Dependency graph
requires:
  - phase: 01-map-foundation
    provides: MapView component, event layers, timeline scrubber, category toggles
  - phase: 02-database-and-affiliate-infrastructure
    provides: migration_routes table, route-utils computeActivePosition, GYG affiliate builder, BottomSheet
  - phase: 03-visual-differentiators
    provides: Crowd heatmap layer, heatmap z-order pattern, browser Supabase client in MapView
provides:
  - SPECIES_COLORS mapping and getSpeciesColor utility
  - Migration route layer builders (buildRouteSources, createRouteLayerPair, createDotLayer, createDotPulseLayer)
  - splitRouteAtPosition for trail-effect coordinate splitting
  - computeActivePositionIndex for coordinate index lookup
  - SpeciesToggles and SpeciesLegend UI components
  - MigrationRoutePanel bottom sheet content with GYG affiliate CTA
  - get_all_routes_with_geojson SQL RPC
affects: [03-03, 04-seo-templates]

# Tech tracking
tech-stack:
  added: []
  patterns: [route-layer-below-clusters, trail-effect-split, dot-pulse-animation-loop, species-toggle-visibility]

key-files:
  created:
    - src/lib/map/migration-layers.ts
    - src/components/map/SpeciesToggles.tsx
    - src/components/map/SpeciesLegend.tsx
    - supabase/functions/get_all_routes_with_geojson.sql
  modified:
    - src/lib/route-utils.ts
    - src/components/map/MapView.tsx
    - src/lib/supabase/types.ts

key-decisions:
  - "Route layers added with beforeId='clusters' to maintain z-order: heatmap -> routes -> dots -> event markers"
  - "Separate pulse animation loop for route dots (independent from event pulse) with different timing (750ms period vs 500ms)"
  - "MigrationRoutePanel shows GYG-only affiliate CTA (no Booking.com), following Phase 2 wildlife decision"
  - "computeActivePositionIndex extracted as separate export for route splitting (returns index, not coordinates)"
  - "Background click handler dynamically builds interactive layer list from migrationRoutesRef to exclude route features"

patterns-established:
  - "Route trail effect: split coordinates at dot position index, solid line behind (opacity 0.9), dashed ahead (opacity 0.4)"
  - "Species toggle pattern: setLayoutProperty visibility per route layer group (4 layers per route)"
  - "Route source update: rebuild all 3 sources (completed, upcoming, dot) per route on month change via setData"

requirements-completed: [WILD-01, WILD-02, WILD-03, WILD-04, WILD-05]

# Metrics
duration: 4min
completed: 2026-03-01
---

# Phase 3 Plan 2: Animated Wildlife Migration Routes Summary

**Color-coded migration route lines with trail effect (solid behind, dashed ahead of pulsing dot), month-synced animation, species toggles, and click-to-detail bottom sheet with GYG affiliate CTA**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-01T21:38:03Z
- **Completed:** 2026-03-01T21:42:27Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Extended computeActivePosition with selectedMonth parameter and added computeActivePositionIndex for route splitting
- Migration route layer system: SPECIES_COLORS mapping, splitRouteAtPosition for trail effect, buildRouteSources for 3-source GeoJSON, layer factories for line + dot + pulse layers
- Full MapView integration: routes fetched via RPC on load, sources/layers added below clusters, dot pulse animation, month sync, species toggle visibility, route click opens bottom sheet
- SpeciesToggles with color-coded buttons and All toggle, SpeciesLegend with compact dot+label display
- MigrationRoutePanel in bottom sheet with hero image, species label, peak dates, description, and GYG affiliate CTA

## Task Commits

Each task was committed atomically:

1. **Task 1: Create migration route layer config, extend computeActivePosition, and build species components** - `7903b24` (feat)
2. **Task 2: Wire migration routes into MapView with animation, toggles, and click-to-detail** - `e8bec0f` (feat)

## Files Created/Modified
- `src/lib/map/migration-layers.ts` - SPECIES_COLORS, route splitting, source builders, layer factories
- `src/lib/route-utils.ts` - Extended computeActivePosition with selectedMonth, added computeActivePositionIndex
- `src/components/map/SpeciesToggles.tsx` - Color-coded species filter toggle buttons
- `src/components/map/SpeciesLegend.tsx` - Compact species color legend
- `supabase/functions/get_all_routes_with_geojson.sql` - RPC to fetch all routes with ST_AsGeoJSON
- `src/components/map/MapView.tsx` - Integrated route layers, animation, toggles, click handler, MigrationRoutePanel
- `src/lib/supabase/types.ts` - Added get_all_routes_with_geojson RPC type

## Decisions Made
- Route layers added with `beforeId='clusters'` to maintain z-order: heatmap -> routes -> dots -> event markers
- Separate pulse animation loop for route dots (750ms period) independent from event pulse (500ms period)
- MigrationRoutePanel shows GYG-only affiliate CTA (no Booking.com), consistent with Phase 2 wildlife decision
- computeActivePositionIndex extracted as separate export returning coordinate index for route splitting
- Background click handler dynamically builds interactive layer list from migrationRoutesRef to exclude route features

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added get_all_routes_with_geojson SQL RPC**
- **Found during:** Task 2
- **Issue:** Plan mentioned needing an RPC to fetch all routes with GeoJSON but placed it conditionally ("if the existing RPC only fetches by slug")
- **Fix:** Created the SQL function since existing get_wildlife_with_route only accepts a single slug parameter
- **Files modified:** supabase/functions/get_all_routes_with_geojson.sql, src/lib/supabase/types.ts
- **Verification:** Types registered, RPC pattern matches existing convention
- **Committed in:** e8bec0f

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** SQL RPC was anticipated by the plan. No scope creep.

## Issues Encountered
None

## User Setup Required
The `get_all_routes_with_geojson` SQL function must be run in Supabase SQL Editor before migration routes will load on the map. See `supabase/functions/get_all_routes_with_geojson.sql`.

## Next Phase Readiness
- Migration route infrastructure complete for Plan 03-03 and Phase 4 SEO templates
- SPECIES_COLORS and getSpeciesColor exported for reuse
- All WILD requirements (01-05) implemented

## Self-Check: PASSED

All 7 files verified present. Commits 7903b24 and e8bec0f confirmed in git log.

---
*Phase: 03-visual-differentiators*
*Completed: 2026-03-01*
