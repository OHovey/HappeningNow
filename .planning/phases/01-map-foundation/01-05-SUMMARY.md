---
phase: 01-map-foundation
plan: 05
subsystem: ui
tags: [maplibre-gl, filtering, geojson, supabase-rpc, timeline, clustering, responsive]

# Dependency graph
requires:
  - phase: 01-map-foundation/01-03
    provides: "Seed data with 506 festivals and 102 wildlife events in Supabase"
  - phase: 01-map-foundation/01-04
    provides: "MapLibre interactive map with clustering, layers, and SSR isolation"
provides:
  - "filterGeoJSON source-level filtering with year-boundary month handling"
  - "TimelineScrubber month pills component with horizontal scroll and 44px touch targets"
  - "CategoryToggles festival/wildlife toggle buttons with color-coded indicators"
  - "Supabase RPC data fetch replacing hardcoded sample GeoJSON"
  - "Default view showing current month events on page load"
  - "Error state with retry button for failed Supabase connections"
affects: [01-06, 01-07]

# Tech tracking
tech-stack:
  added: []
  patterns: [source-level-filtering-for-cluster-accuracy, filter-effect-on-data-change]

key-files:
  created:
    - src/lib/map/filters.ts
    - src/components/map/TimelineScrubber.tsx
    - src/components/map/CategoryToggles.tsx
    - tests/map/filters.test.ts
  modified:
    - src/components/map/MapView.tsx
    - scripts/seed.ts

key-decisions:
  - "Source-level filtering (filterGeoJSON + setData) not layer-level setFilter -- keeps cluster counts accurate per RESEARCH.md Pitfall 2"
  - "At least one category must remain active -- prevents empty map state confusion"

patterns-established:
  - "Filter pipeline: allGeoJSON -> filterGeoJSON(month, categories) -> source.setData(filtered) -- source-level filtering for clustering accuracy"
  - "UI overlay pattern: filter controls positioned absolute over map with z-10, stopPropagation to prevent map interaction conflicts"

requirements-completed: [MAP-04, MAP-05, MAP-06, MAP-07, PERF-04]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 1 Plan 5: Timeline & Category Filters Summary

**Source-level GeoJSON filtering with month pills, category toggles, and Supabase data fetch replacing sample data -- cluster counts stay accurate**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T07:46:37Z
- **Completed:** 2026-03-01T07:50:04Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Built filterGeoJSON with year-boundary month handling (e.g., Nov-Feb wrapping) and category filtering, with 17 unit tests
- Created TimelineScrubber with 12 month pills, horizontal scrolling on mobile, 44px touch targets, and active state styling
- Created CategoryToggles with festival (orange) and wildlife (green) toggle buttons, color-coded dot indicators
- Replaced hardcoded sample GeoJSON with Supabase RPC fetch, loading overlay, and error state with retry
- Connected filter pipeline: month/category state changes trigger filterGeoJSON + source.setData for accurate cluster counts

## Task Commits

Each task was committed atomically:

1. **Task 1: Build filter logic, month scrubber, and category toggles** - `8735d55` (feat)
2. **Task 2: Connect filters to map, fetch Supabase data, set default view** - `c440625` (feat)

## Files Created/Modified
- `src/lib/map/filters.ts` - filterGeoJSON, buildMonthFilter, buildCategoryFilter, getCurrentMonth
- `src/components/map/TimelineScrubber.tsx` - Month pills with horizontal scroll and active state
- `src/components/map/CategoryToggles.tsx` - Festival/wildlife toggle buttons with color dots
- `tests/map/filters.test.ts` - 17 unit tests covering month ranges, year wrapping, categories, combined filters
- `src/components/map/MapView.tsx` - Integrated Supabase fetch, filter state, TimelineScrubber, CategoryToggles, loading/error states
- `scripts/seed.ts` - Fixed pre-existing TypeScript error (non-null assertion for env vars after guard)

## Decisions Made
- Used source-level filtering (filterGeoJSON + setData) rather than layer-level setFilter to keep cluster counts accurate with ~600 events (per RESEARCH.md Pitfall 2)
- Enforced at least one category active to prevent confusing empty map state
- Positioned filter controls as absolute overlays with stopPropagation to prevent map interaction conflicts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing TypeScript error in scripts/seed.ts**
- **Found during:** Task 2 (build verification)
- **Issue:** `npm run build` failed due to TypeScript strict null check on `supabaseUrl` and `serviceRoleKey` parameters despite runtime guard with process.exit(1)
- **Fix:** Added non-null assertions (`!`) since values are guaranteed defined after the guard at line 353
- **Files modified:** scripts/seed.ts
- **Verification:** `npm run build` completes successfully
- **Committed in:** c440625 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Pre-existing build error, minimal fix. No scope creep.

## Issues Encountered
None beyond the pre-existing seed.ts type error.

## User Setup Required
None beyond prior plan requirements -- Supabase must be configured with env vars and seed data loaded (from plan 01-02, 01-03).

## Next Phase Readiness
- Filter pipeline ready for event detail panel (01-06) -- click handler can use filtered features
- Map now fetches real data from Supabase, enabling full end-to-end testing with seed data
- TimelineScrubber and CategoryToggles components ready for visual refinement if needed

## Self-Check: PASSED

All 4 created files verified on disk. Both task commits (8735d55, c440625) verified in git log.

---
*Phase: 01-map-foundation*
*Completed: 2026-03-01*
