---
phase: 03-visual-differentiators
plan: 01
subsystem: ui, map
tags: [maplibre, heatmap, geojson, crowd-data, supabase-rpc, postgis]

# Dependency graph
requires:
  - phase: 01-map-foundation
    provides: MapView component, event layers, timeline scrubber, category toggles
  - phase: 02-database-and-affiliate-infrastructure
    provides: Supabase client pattern, bbox API, event panel, destinations table
provides:
  - Shared crowd-colors utility (crowdScoreToColor, crowdScoreToLabel, estimateTouristVolume)
  - Heatmap GeoJSON source builder and MapLibre layer config
  - CrowdHeatmapToggle UI component
  - DestinationWithCoords type and get_destinations_with_coords RPC
  - Destination query functions (getAllDestinationsWithCoords, getDestinationBySlug, etc.)
  - Crowd indicator text on event panel
affects: [03-02, 03-03, 04-seo-templates]

# Tech tracking
tech-stack:
  added: []
  patterns: [heatmap-layer-below-events, setData-per-month-sync, browser-rpc-for-client-data]

key-files:
  created:
    - src/lib/crowd-colors.ts
    - src/lib/map/heatmap.ts
    - src/components/map/CrowdHeatmapToggle.tsx
    - supabase/functions/get_destinations_with_coords.sql
  modified:
    - src/lib/supabase/types.ts
    - src/lib/supabase/queries.ts
    - src/components/map/MapView.tsx
    - src/components/panel/EventPanel.tsx

key-decisions:
  - "Heatmap layer added BEFORE cluster/event layers for correct z-order (heatmap below events)"
  - "Browser Supabase client used for destination fetch in MapView (client component, follows existing pattern)"
  - "setData used for month sync instead of setFilter because crowd_score property value changes per month"
  - "Heatmap click shows nearest destination popup with 'Find quieter alternatives' button that pans map"
  - "weather_data type fixed to match actual DB keys (temp_c, rain_days, sunshine_hours)"

patterns-established:
  - "Crowd score mapping: shared crowd-colors.ts utility for consistent color/label across all crowd UI"
  - "Heatmap source update: rebuild GeoJSON FeatureCollection with new month scores via setData"
  - "Destination RPC pattern: get_destinations_with_coords extracts ST_X/ST_Y from PostGIS geometry"

requirements-completed: [CROWD-01, CROWD-02, CROWD-03, CROWD-04, CROWD-05]

# Metrics
duration: 4min
completed: 2026-03-01
---

# Phase 3 Plan 1: Crowd Heatmap Overlay Summary

**Cool-to-warm crowd heatmap overlay on the map with toggle, month sync, click popup with quieter alternatives, and crowd badge on event panels**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-01T21:31:00Z
- **Completed:** 2026-03-01T21:35:35Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Shared crowd-colors utility with 10-value cool-to-warm gradient, score-to-color/label/volume mapping
- MapLibre heatmap layer with transparent purple-blue-amber-orange-red color ramp, regional blob radius scaling
- Heatmap toggle button, month sync via setData, click popup with crowd details and "Find quieter alternatives"
- Crowd indicator text on EventPanel: green "Low season", amber "Moderate crowds", red "Peak crowds"
- DestinationWithCoords type, get_destinations_with_coords SQL RPC, and server-side query functions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared crowd-colors utility and heatmap source/layer config** - `2f10ad5` (feat)
2. **Task 2: Wire heatmap into MapView with toggle, month sync, click popup, and crowd badge** - `a32ee71` (feat)

## Files Created/Modified
- `src/lib/crowd-colors.ts` - Shared crowd score to color/label/volume mapping utility
- `src/lib/map/heatmap.ts` - Heatmap GeoJSON source builder and MapLibre heatmap layer config
- `src/components/map/CrowdHeatmapToggle.tsx` - Toggle button for heatmap visibility (flame icon)
- `supabase/functions/get_destinations_with_coords.sql` - PostGIS RPC extracting lng/lat from destinations
- `src/lib/supabase/types.ts` - Fixed weather_data keys, added DestinationWithCoords interface
- `src/lib/supabase/queries.ts` - Added destination query functions
- `src/components/map/MapView.tsx` - Integrated heatmap source, layer, toggle, month sync, click handler
- `src/components/panel/EventPanel.tsx` - Added crowd indicator text below crowd badge

## Decisions Made
- Heatmap layer added BEFORE cluster/event layers for correct z-order (heatmap below events)
- Browser Supabase client used for destination fetch in MapView (client component, follows existing singleton pattern)
- setData used for month sync instead of setFilter because crowd_score property value changes per month
- Heatmap click shows nearest destination popup with "Find quieter alternatives" button that pans map to quietest destination
- weather_data type fixed from {temp, rain, sunshine} to {temp_c, rain_days, sunshine_hours} to match actual seed data

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed weather_data type mismatch**
- **Found during:** Task 1
- **Issue:** Destination.weather_data type used {temp, rain, sunshine} but actual database seed data uses {temp_c, rain_days, sunshine_hours}
- **Fix:** Updated type to match actual DB keys
- **Files modified:** src/lib/supabase/types.ts
- **Verification:** Type check passes
- **Committed in:** 2f10ad5

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type fix was explicitly called out in the plan. No scope creep.

## Issues Encountered
None

## User Setup Required
The `get_destinations_with_coords` SQL function must be run in Supabase SQL Editor before the heatmap will load destination data. See `supabase/functions/get_destinations_with_coords.sql`.

## Next Phase Readiness
- Crowd-colors utility is exported and ready for reuse by Plan 03-03 (destination calendar grid)
- Heatmap layer infrastructure is complete for any future crowd visualization features
- Destination query functions ready for destination detail pages

---
*Phase: 03-visual-differentiators*
*Completed: 2026-03-01*
