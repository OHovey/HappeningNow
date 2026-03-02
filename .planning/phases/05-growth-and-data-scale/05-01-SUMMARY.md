---
phase: 05-growth-and-data-scale
plan: 01
subsystem: api
tags: [postgis, photon, geocoding, spatial-search, scoring, zod, vitest]

# Dependency graph
requires:
  - phase: 01-map-foundation
    provides: PostGIS events table with geometry(Point, 4326), get_events_bbox RPC pattern
  - phase: 02-database-and-affiliate-infrastructure
    provides: Supabase types, createServerClient, affiliate IDs on events
provides:
  - PostGIS search_events_nearby RPC with ST_DWithin geography cast
  - Photon geocode proxy API route with caching
  - Search API route with Zod validation
  - Client-side worth-the-trip scoring algorithm
  - Indicator tag generator (Highly Unique, Low Crowds, travel time)
  - SearchEventResult type in Database types
affects: [05-02, 05-03, search-page-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [photon-geocode-proxy, radius-search-rpc, client-side-scoring]

key-files:
  created:
    - supabase/functions/search_events_nearby.sql
    - src/app/api/geocode/route.ts
    - src/app/api/search/route.ts
    - src/lib/scoring.ts
    - tests/scoring.test.ts
    - tests/api/geocode.test.ts
    - tests/api/search.test.ts
  modified:
    - src/lib/supabase/types.ts

key-decisions:
  - "Used Photon (not Nominatim) for geocode proxy -- Nominatim forbids autocomplete"
  - "Scale^2 makes uniqueness dominant factor in worth-the-trip scoring"
  - "In-memory Map cache for geocode proxy -- acceptable for serverless session lifetime"

patterns-established:
  - "Photon proxy: server-side geocode with in-memory TTL cache"
  - "Radius search: ST_DWithin with ::geography cast for meter-based distance"
  - "Scoring: client-side ranking with hidden score, visible indicator tags"

requirements-completed: [SRCH-02, SRCH-03, SRCH-04]

# Metrics
duration: 3min
completed: 2026-03-02
---

# Phase 5 Plan 1: Search Backend Summary

**PostGIS radius search RPC, Photon geocode proxy, and worth-the-trip scoring algorithm with 26 passing tests**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T05:46:13Z
- **Completed:** 2026-03-02T05:49:16Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- PostGIS search_events_nearby RPC with ST_DWithin geography cast for meter-based radius queries and month wrap-around logic
- Photon geocode proxy with in-memory caching, input validation, and error handling
- Search API route with Zod validation for lat/lng/radius/month/category parameters
- Worth-the-trip scoring algorithm: scale^2 * crowdFactor / log2(distanceKm+1)
- Indicator tags: Highly Unique, Unique, Low Crowds, travel time estimate
- 26 tests across 3 test files all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: PostGIS search RPC + geocode proxy + search API route** - `b1123fa` (feat)
2. **Task 2: Scoring algorithm with tests** - `ba33823` (feat)

## Files Created/Modified
- `supabase/functions/search_events_nearby.sql` - PostGIS radius + date overlap RPC
- `src/app/api/geocode/route.ts` - Photon proxy with caching
- `src/app/api/search/route.ts` - Spatial search endpoint with Zod validation
- `src/lib/scoring.ts` - Worth-the-trip scoring and indicator tags
- `src/lib/supabase/types.ts` - Added SearchEventResult type and search_events_nearby RPC type
- `tests/scoring.test.ts` - 13 tests for scoring, travel time, indicator tags
- `tests/api/geocode.test.ts` - 5 tests for Photon proxy
- `tests/api/search.test.ts` - 8 tests for search API validation and RPC calls

## Decisions Made
- Used Photon (not Nominatim) for geocode proxy -- Nominatim usage policy forbids autocomplete
- Scale squared makes uniqueness the dominant scoring factor per user decision
- In-memory Map cache for geocode proxy -- acceptable for serverless; helps within session
- Log2 distance dampening means far-away unique events still rank well

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed geocode test cache collision**
- **Found during:** Task 2 (geocode test)
- **Issue:** Geocode tests for Photon failure returned 200 instead of 502 because prior test cached the "london" query
- **Fix:** Used unique query strings per test case to avoid in-memory cache hits
- **Files modified:** tests/api/geocode.test.ts
- **Verification:** All 5 geocode tests pass
- **Committed in:** ba33823 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor test fix for cache isolation. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in supabase `.rpc()` call signatures (Args typed as `undefined`) affect all RPC calls project-wide. Not caused by this plan's changes. Search route has the same pattern as the existing events route.

## User Setup Required
None - no external service configuration required. The search_events_nearby SQL function needs to be deployed to Supabase via `supabase db push` or run in the SQL editor.

## Next Phase Readiness
- Search backend complete: geocode, spatial query, and scoring ready for the /search page UI
- API routes ready to be consumed by SearchBar, LocationInput, and SearchResults components
- Scoring algorithm ready for client-side result ranking

---
*Phase: 05-growth-and-data-scale*
*Completed: 2026-03-02*
