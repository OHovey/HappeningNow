---
phase: 01-map-foundation
plan: 03
subsystem: database
tags: [seed-data, supabase, postgis, geojson, festivals, wildlife, migration]

# Dependency graph
requires:
  - phase: 01-02
    provides: PostGIS schema with events, destinations, migration_routes tables
provides:
  - 506 festival seed events with real-world coordinates and descriptions
  - 102 wildlife event entries with viewing locations and seasons
  - 31 destination entries with monthly crowd and weather data
  - 13 migration route LineString coordinate arrays
  - Seed script (scripts/seed.ts) for loading all data into Supabase
  - npm run seed command for database population
affects: [01-04, 01-05, 01-06, 01-07]

# Tech tracking
tech-stack:
  added: ["tsx"]
  patterns: [batch-sql-insert, exec-sql-rpc, st-makepoint-geometry, st-geomfromgeojson]

key-files:
  created:
    - src/data/seed/festivals.json
    - src/data/seed/wildlife.json
    - src/data/seed/destinations.json
    - src/data/seed/migration-routes.json
    - scripts/seed.ts
  modified:
    - package.json
    - .env.local.example

key-decisions:
  - "Raw SQL via exec_sql RPC function for PostGIS geometry insertion (supabase-js has no native geometry support)"
  - "Batch inserts of 50 rows to avoid Supabase timeout limits"
  - "Dry-run mode works without Supabase credentials for CI/local validation"

patterns-established:
  - "Seed data pattern: JSON files in src/data/seed/ read by scripts/seed.ts with --dry-run and --force flags"
  - "PostGIS point insertion: ST_SetSRID(ST_MakePoint(lng, lat), 4326) via raw SQL"
  - "LineString insertion: ST_SetSRID(ST_GeomFromGeoJSON(...), 4326) for migration routes"

requirements-completed: [FOUND-03, FOUND-04]

# Metrics
duration: 18min
completed: 2026-03-01
---

# Phase 1 Plan 3: Seed Data Summary

**506 festivals, 102 wildlife events, 31 destinations, and 13 migration routes with a PostGIS-aware seed script using batch SQL inserts**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-01T07:25:08Z
- **Completed:** 2026-03-01T07:43:51Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Curated 506 real-world festival events spanning all continents, all 12 months, and diverse categories (music, religious, cultural, film, harvest)
- Created 102 wildlife viewing events with accurate GPS coordinates for specific locations (not just countries)
- Built 31 destination profiles with monthly crowd scores (1-10) and weather data (temperature, rain days, sunshine hours)
- Designed 13 migration routes as GeoJSON LineString coordinate arrays (wildebeest, humpback whales, monarch butterflies, arctic terns, etc.)
- Wrote a seed script supporting --dry-run validation, --force for CI, and batch insertion with PostGIS geometry handling

## Task Commits

Each task was committed atomically:

1. **Task 1: Curate festival and wildlife event seed data** - `c256daf` (feat)
2. **Task 2: Create seed script to load data into Supabase** - `c1e5b95` (feat)

## Files Created/Modified
- `src/data/seed/festivals.json` - 506 festival events with coordinates, months, descriptions, and scale
- `src/data/seed/wildlife.json` - 102 wildlife events with viewing locations and seasonal timing
- `src/data/seed/destinations.json` - 31 destinations with monthly crowd and weather JSONB data
- `src/data/seed/migration-routes.json` - 13 migration routes with GeoJSON LineString coordinates
- `scripts/seed.ts` - Database seeding script with batch inserts, dry-run, and PostGIS geometry conversion
- `package.json` - Added "seed" script and tsx dev dependency
- `.env.local.example` - Added SUPABASE_SERVICE_ROLE_KEY with source comment

## Decisions Made
- Used raw SQL via an `exec_sql` RPC function for PostGIS geometry insertion since supabase-js doesn't natively support geometry types
- Batch size of 50 rows per insert to stay within Supabase timeout and payload limits
- Dry-run mode validates all data without requiring Supabase credentials, enabling CI validation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed dry-run requiring Supabase credentials**
- **Found during:** Task 2 (seed script verification)
- **Issue:** --dry-run mode exited with error when env vars were missing, even though it doesn't connect to Supabase
- **Fix:** Moved env var check after dry-run detection so dry-run works without credentials
- **Files modified:** scripts/seed.ts
- **Verification:** `npx tsx scripts/seed.ts --dry-run` runs successfully without any env vars set
- **Committed in:** c1e5b95 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor fix for usability. No scope creep.

## Issues Encountered
- None

## User Setup Required

Before running `npm run seed`, the user must:
1. Have Supabase project created with schema.sql and get_events_geojson.sql applied (from plan 01-02)
2. Create the `exec_sql` RPC function in Supabase SQL Editor (or the script will attempt to create it)
3. Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (from Supabase Dashboard > Project Settings > API > service_role)
4. Run `npm run seed` to populate the database

## Next Phase Readiness
- All seed data JSON files are ready and validated (506 festivals, 102 wildlife, 31 destinations, 13 routes)
- Seed script is ready to populate the database once Supabase is configured
- Data covers all continents and all months for timeline scrubber testing
- Map components (01-04) can render this data once loaded

## Self-Check: PASSED

All 5 created files verified on disk. Both task commits (c256daf, c1e5b95) verified in git log.

---
*Phase: 01-map-foundation*
*Completed: 2026-03-01*
