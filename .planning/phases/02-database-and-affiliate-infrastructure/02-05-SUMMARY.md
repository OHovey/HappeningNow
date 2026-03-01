---
phase: 02-database-and-affiliate-infrastructure
plan: 05
subsystem: database
tags: [postgis, sql-rpc, st_x, st_y, minimap, coordinates]

# Dependency graph
requires:
  - phase: 02-database-and-affiliate-infrastructure
    provides: "Event detail pages (02-03), MiniMap component (02-02)"
provides:
  - "get_event_with_coords SQL RPC extracting lng/lat from PostGIS geometry"
  - "EventWithCoords TypeScript type"
  - "Coordinate data pipeline from RPC through to MiniMap rendering"
affects: [event-detail-pages, minimap, map-rendering]

# Tech tracking
tech-stack:
  added: []
  patterns: [PostGIS RPC for coordinate extraction, Omit<Event, 'location'> pattern for geometry replacement]

key-files:
  created:
    - supabase/functions/get_event_with_coords.sql
  modified:
    - src/lib/supabase/types.ts
    - src/lib/supabase/queries.ts
    - src/app/event/[slug]/page.tsx

key-decisions:
  - "Bare ST_X/ST_Y without schema prefix, matching existing get_wildlife_with_route convention"
  - "EventWithCoords uses Omit<Event, 'location'> to replace WKB geometry with extracted lng/lat"

patterns-established:
  - "PostGIS coordinate extraction via SQL RPC: ST_X for longitude, ST_Y for latitude"

requirements-completed: [PAGE-03, PAGE-04, PAGE-05, PERF-02, PERF-03]

# Metrics
duration: 1min
completed: 2026-03-01
---

# Phase 2 Plan 5: Event MiniMap Gap Closure Summary

**PostGIS RPC extracting event coordinates via ST_X/ST_Y, wired through getEventBySlug to MiniMap rendering on /event/[slug] pages**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-01T16:56:22Z
- **Completed:** 2026-03-01T16:57:26Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created `get_event_with_coords` SQL RPC that extracts lng/lat from PostGIS geometry using ST_X/ST_Y
- Added `EventWithCoords` TypeScript interface with proper type safety
- Rewired `getEventBySlug` to use RPC instead of direct table query, enabling coordinate extraction
- Event detail pages now pass coordinates to EventContent/MiniMap component
- Removed the TODO comment about missing coordinate extraction
- All 90 existing tests pass with no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create get_event_with_coords SQL RPC and update TypeScript types** - `34f770c` (feat)
2. **Task 2: Wire coordinates through getEventBySlug -> EventPage -> EventContent -> MiniMap** - `86079d1` (feat)

## Files Created/Modified
- `supabase/functions/get_event_with_coords.sql` - SQL RPC returning event row with lng/lat extracted from PostGIS geometry
- `src/lib/supabase/types.ts` - Added EventWithCoords interface and Database Functions entry
- `src/lib/supabase/queries.ts` - getEventBySlug now calls RPC, returns EventWithCoords
- `src/app/event/[slug]/page.tsx` - Extracts coordinates from RPC result and passes to EventContent

## Decisions Made
- Bare ST_X/ST_Y without schema prefix, matching existing get_wildlife_with_route convention
- EventWithCoords uses `Omit<Event, 'location'>` to cleanly replace the WKB geometry field with extracted numeric coordinates
- Category and crowd_level cast to TEXT in SQL to match RETURNS TABLE signature (enum types require explicit cast)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - SQL RPC must be deployed to Supabase (standard migration workflow), no new env vars or external service config needed.

## Next Phase Readiness
- Phase 2 is now fully complete with all gap closures addressed
- Event detail pages have full MiniMap support once the RPC is deployed to Supabase
- Ready for Phase 3 planning

---
*Phase: 02-database-and-affiliate-infrastructure*
*Completed: 2026-03-01*
