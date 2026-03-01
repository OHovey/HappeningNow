---
phase: 02-database-and-affiliate-infrastructure
plan: 01
subsystem: api, database, ui
tags: [postgis, bbox, zod, maplibre, affiliate, awin, route-handler]

# Dependency graph
requires:
  - phase: 01-map-foundation
    provides: MapView with GeoJSON source, event layers, filtering pipeline, affiliate URL builders
provides:
  - PostGIS bounding-box RPC function (get_events_bbox)
  - Next.js Route Handler /api/events with Zod validation
  - Bbox-aware MapView with debounced moveend fetching
  - Enhanced Booking.com link builder with date safety and city fallback
  - Awin click tracking wrapper for affiliate links
affects: [02-database-and-affiliate-infrastructure, 03-wildlife-migration, 04-seo-content]

# Tech tracking
tech-stack:
  added: [zod]
  patterns: [bbox-api-pipeline, debounced-moveend, abort-controller-race-prevention, awin-link-wrapping]

key-files:
  created:
    - supabase/functions/get_events_bbox.sql
    - src/app/api/events/route.ts
    - tests/api/events-bbox.test.ts
  modified:
    - src/lib/supabase/types.ts
    - src/components/map/MapView.tsx
    - src/lib/affiliates.ts
    - tests/affiliates.test.ts
    - package.json

key-decisions:
  - "Zod installed as direct dependency (was transitive only)"
  - "350ms debounce for moveend within allowed 300-500ms range"
  - "AbortController per request to prevent stale data from out-of-order responses"
  - "Filter changes trigger full bbox re-fetch (server-side filtering) plus client-side refinement"
  - "Awin wrapping is opt-in via params, direct aid= links remain default per RESEARCH.md guidance"

patterns-established:
  - "Route Handler validation: Zod safeParse on searchParams with structured error responses"
  - "Bbox pipeline: map moveend -> debounce -> Route Handler -> Supabase RPC -> GeoJSON source update"
  - "Affiliate date safety: future-only checkin, 500-day clamp, 7-day default stay"

requirements-completed: [PERF-02, PERF-03]

# Metrics
duration: 4min
completed: 2026-03-01
---

# Phase 2 Plan 1: Bbox API and Affiliate Enhancement Summary

**PostGIS bbox RPC with Zod-validated Route Handler, debounced moveend map fetching, and Booking.com date-safe affiliate links with Awin wrapping**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-01T16:12:09Z
- **Completed:** 2026-03-01T16:15:56Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Created PostGIS get_events_bbox RPC with ST_MakeEnvelope for GiST index-powered viewport queries
- Built /api/events Route Handler with Zod validation for bbox, month, and category params
- Switched MapView from full-table get_events_geojson RPC to live bbox API calls on debounced moveend
- Enhanced buildBookingLink with future-only dates, 500-day clamp, city-name fallback, and optional Awin wrapping
- All 69 tests passing (17 new bbox validation + 9 new affiliate tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create bbox RPC function and Route Handler with tests** - `76bee5e` (feat)
2. **Task 2: Switch MapView from full-table RPC to bbox API with debounced moveend** - `a0adcc7` (feat)
3. **Task 3: Enhance affiliate link builders with date safety and city fallback** - `66a5043` (feat)

## Files Created/Modified
- `supabase/functions/get_events_bbox.sql` - PostGIS bbox RPC with month/category filters
- `src/app/api/events/route.ts` - Route Handler with Zod validation and cache headers
- `src/lib/supabase/types.ts` - Added get_events_bbox to Database.public.Functions
- `src/components/map/MapView.tsx` - Bbox-aware fetching with debounced moveend and AbortController
- `src/lib/affiliates.ts` - Date safety, city fallback, Awin wrapping for Booking.com links
- `tests/api/events-bbox.test.ts` - 17 tests for Zod schema validation
- `tests/affiliates.test.ts` - Extended to 19 tests with date safety, fallback, and Awin tests
- `package.json` - Added zod as direct dependency

## Decisions Made
- Installed zod as direct dependency (was only available as transitive dep)
- Used 350ms debounce for moveend within the 300-500ms range allowed by user constraints
- AbortController per request prevents stale data from out-of-order network responses
- Filter changes (month, category) trigger full bbox re-fetch for server-side filtering accuracy, with client-side filterGeoJSON still applied for immediate refinement
- Awin wrapping is opt-in via awinAffiliateId + awinMerchantId params; direct aid= links remain default until Awin approval received

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
- **SQL deployment:** Run `supabase/functions/get_events_bbox.sql` in the Supabase SQL Editor to create the RPC function
- **Verification:** Run `EXPLAIN ANALYZE SELECT * FROM get_events_bbox(-180, -90, 180, 90, NULL, NULL);` to verify <200ms and GiST index usage

## Next Phase Readiness
- Bbox API pipeline complete and ready for SSG detail pages (Plan 02-02)
- Affiliate link builders ready for FTC disclosure component integration (Plan 02-03)
- MapView no longer depends on get_events_geojson; clean break to production spatial queries achieved

---
*Phase: 02-database-and-affiliate-infrastructure*
*Completed: 2026-03-01*
