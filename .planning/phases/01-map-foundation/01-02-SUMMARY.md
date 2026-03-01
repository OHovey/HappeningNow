---
phase: 01-map-foundation
plan: 02
subsystem: database
tags: [supabase, postgis, geospatial, typescript, geojson]

# Dependency graph
requires: []
provides:
  - PostGIS schema with events, destinations, migration_routes tables
  - GeoJSON export RPC function (get_events_geojson)
  - Typed Supabase client helpers (browser + server)
  - Database TypeScript types (Event, Destination, MigrationRoute, EventGeoJSON)
affects: [01-03, 01-04, 01-05, 01-06, 01-07, 02-seed-data]

# Tech tracking
tech-stack:
  added: ["@supabase/supabase-js"]
  patterns: [singleton-browser-client, fresh-server-client, geometry-point-4326, gist-spatial-index]

key-files:
  created:
    - supabase/schema.sql
    - supabase/functions/get_events_geojson.sql
    - src/lib/supabase/types.ts
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
  modified: []

key-decisions:
  - "geometry(Point, 4326) type used over geography for 5-10x faster queries (per locked decision)"
  - "Singleton pattern for browser client, fresh instance per request for server client"
  - "COALESCE to empty array in GeoJSON RPC prevents null when events table is empty"

patterns-established:
  - "Supabase client pattern: createBrowserClient() singleton for components, createServerClient() per-request for server"
  - "Database types defined manually in types.ts matching schema.sql (keep in sync on migrations)"

requirements-completed: [FOUND-02]

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 1 Plan 2: Supabase Database Layer Summary

**PostGIS schema with 3 spatial tables, GiST indexes, GeoJSON export RPC, and typed Supabase client helpers for browser and server**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-01T07:16:43Z
- **Completed:** 2026-03-01T07:18:57Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- PostGIS schema with events, destinations, and migration_routes tables using geometry(Point, 4326) and geometry(LineString, 4326) columns
- GiST spatial indexes on all geometry columns plus composite indexes for category and month filtering
- get_events_geojson() RPC function returning a complete GeoJSON FeatureCollection with all event properties for MapLibre
- Typed Supabase client helpers with full Database type for type-safe queries

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PostGIS schema with spatial tables and indexes** - `2283089` (feat)
2. **Task 2: Create Supabase TypeScript client helpers and types** - `9b9ed21` (feat)

## Files Created/Modified
- `supabase/schema.sql` - PostGIS extension, 3 tables with geometry columns, constraints, and spatial indexes
- `supabase/functions/get_events_geojson.sql` - RPC function returning GeoJSON FeatureCollection for map rendering
- `src/lib/supabase/types.ts` - TypeScript types: Event, Destination, MigrationRoute, GeoJSON types, Database type
- `src/lib/supabase/client.ts` - Browser-side Supabase client with singleton pattern
- `src/lib/supabase/server.ts` - Server-side Supabase client (fresh per request)

## Decisions Made
- Used geometry(Point, 4326) over geography type for 5-10x faster PostGIS queries (locked decision from research)
- Browser client uses singleton pattern to avoid redundant connections; server client creates fresh instance per request to avoid shared state
- GeoJSON RPC uses COALESCE to return empty array instead of null when events table is empty

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Scaffolded Next.js project and installed @supabase/supabase-js**
- **Found during:** Pre-Task 2 (TypeScript client helpers need compilation)
- **Issue:** No package.json, tsconfig.json, or node_modules existed; TypeScript verification would fail
- **Fix:** Scaffolded Next.js 15 project with create-next-app and installed @supabase/supabase-js
- **Files modified:** package.json, tsconfig.json, node_modules (scaffolded but not committed as part of this plan)
- **Verification:** npx tsc --noEmit passes with zero errors
- **Note:** Scaffolded files left uncommitted for plan 01-01 to handle properly

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Scaffolding was necessary for TypeScript compilation. Scaffolded files not committed as part of this plan to avoid conflict with plan 01-01.

## Issues Encountered
- create-next-app rejected "HappeningNow" as a project name (npm naming restrictions on capital letters); worked around by scaffolding in /tmp and copying files over

## User Setup Required

This plan produces SQL files that must be run manually in Supabase. The plan's `user_setup` section specifies:
- Create a Supabase project and enable PostGIS extension
- Run `supabase/schema.sql` in Supabase SQL Editor
- Run `supabase/functions/get_events_geojson.sql` in Supabase SQL Editor
- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables

## Next Phase Readiness
- Schema SQL files are ready to execute in Supabase SQL Editor
- TypeScript types are ready for use in seed data scripts and map components
- Client helpers are ready for both browser components and server-side data fetching

## Self-Check: PASSED

All 5 created files verified on disk. Both task commits (2283089, 9b9ed21) verified in git log.

---
*Phase: 01-map-foundation*
*Completed: 2026-03-01*
