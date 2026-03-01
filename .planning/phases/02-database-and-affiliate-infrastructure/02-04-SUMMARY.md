---
phase: 02-database-and-affiliate-infrastructure
plan: 04
subsystem: ui
tags: [wildlife, migration-routes, json-ld, seo, maplibre, geojson, postgis, affiliate]

requires:
  - phase: 02-database-and-affiliate-infrastructure
    provides: Shared detail components (Breadcrumbs, FtcDisclosure, BackToMap, MiniMap), server queries, affiliate URL builders
provides:
  - /wildlife/[slug] SSG detail pages with hero image, migration route map, and JSON-LD
  - WildlifeHero component with species name and peak months display
  - WildlifeContent component with month-aware migration route visualization and affiliate CTAs
  - buildWildlifeJsonLd and buildWildlifeMetadata helpers
  - get_wildlife_with_route PostGIS RPC for extracting LineString as GeoJSON
affects: [04-seo-content-engine, 03-wildlife-migration-data]

tech-stack:
  added: []
  patterns: [PostGIS RPC for geometry extraction as GeoJSON, month-aware route position interpolation, Event schema for wildlife spectacles]

key-files:
  created:
    - src/app/wildlife/[slug]/page.tsx
    - src/components/detail/WildlifeHero.tsx
    - src/components/detail/WildlifeContent.tsx
    - supabase/functions/get_wildlife_with_route.sql
  modified:
    - src/lib/structured-data.ts
    - src/lib/supabase/queries.ts
    - src/lib/supabase/types.ts
    - tests/structured-data.test.ts

key-decisions:
  - "PostGIS RPC (get_wildlife_with_route) to extract LineString route as GeoJSON since supabase-js cannot query geometry directly"
  - "Month-aware active position: linear interpolation of current month within peak_months to proportional route coordinate index"
  - "Wildlife affiliate CTA uses GetYourGuide only (species-based tour search), no Booking.com since wildlife pages lack destination context"

patterns-established:
  - "Wildlife detail page mirrors event detail page structure: Hero + Content + Breadcrumbs + BackToMap + JSON-LD"
  - "Route geometry extraction via ST_AsGeoJSON in SQL RPC, returned as JSON to MiniMap routeCoordinates prop"
  - "formatPeakMonths utility for displaying month arrays as human-readable ranges"

requirements-completed: [PAGE-03, PAGE-04]

duration: 4min
completed: 2026-03-01
---

# Phase 02 Plan 04: Wildlife Detail Pages Summary

**SSG wildlife detail pages with hero image, month-aware migration route map via PostGIS GeoJSON extraction, Event JSON-LD, OG meta tags, and GetYourGuide affiliate CTAs**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-01T16:36:40Z
- **Completed:** 2026-03-01T16:40:56Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Wildlife detail pages at /wildlife/[slug] with SSG via generateStaticParams
- WildlifeHero with full-width hero image (green gradient fallback) and peak months
- WildlifeContent with migration route MiniMap including month-aware active position dot, peak months display, and GetYourGuide affiliate CTA
- buildWildlifeJsonLd using Event schema adapted for wildlife spectacles
- PostGIS RPC for extracting LineString route geometry as GeoJSON coordinates
- 10 new tests for wildlife JSON-LD and formatPeakMonths (all 90 project tests pass)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create wildlife hero, content components, and JSON-LD helper** - `9ae086d` (feat)
2. **Task 2: Create /wildlife/[slug] SSG page with generateMetadata and JSON-LD** - `6ebd67d` (feat)

## Files Created/Modified
- `src/app/wildlife/[slug]/page.tsx` - SSG wildlife detail page with generateStaticParams, generateMetadata, JSON-LD, breadcrumbs
- `src/components/detail/WildlifeHero.tsx` - Full-width hero with species name, route name, peak months
- `src/components/detail/WildlifeContent.tsx` - Description, peak months, migration route map with active position, affiliate CTAs
- `supabase/functions/get_wildlife_with_route.sql` - PostGIS RPC returning migration_route with route as GeoJSON
- `src/lib/structured-data.ts` - Added buildWildlifeJsonLd, formatPeakMonths, buildWildlifeMetadata
- `src/lib/supabase/queries.ts` - Updated getWildlifeBySlug to use RPC for GeoJSON route geometry
- `src/lib/supabase/types.ts` - Added MigrationRouteWithGeoJSON type and get_wildlife_with_route RPC type
- `tests/structured-data.test.ts` - Added 10 tests for wildlife JSON-LD and formatPeakMonths

## Decisions Made
- Created PostGIS RPC `get_wildlife_with_route` to extract LineString geometry as GeoJSON (supabase-js cannot query PostGIS geometry directly)
- Wildlife pages use GetYourGuide only for affiliate CTAs (species-based tour search) since wildlife routes lack Booking.com destination context
- Month-aware active position computed by linear interpolation of current month within peak_months range to proportional route coordinate index

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created PostGIS RPC for route geometry extraction**
- **Found during:** Task 1 (queries.ts update)
- **Issue:** supabase-js select('*') returns PostGIS geometry as unusable WKB; need GeoJSON coordinates for MiniMap
- **Fix:** Created `supabase/functions/get_wildlife_with_route.sql` RPC using ST_AsGeoJSON, updated getWildlifeBySlug to call RPC, added MigrationRouteWithGeoJSON type
- **Files modified:** supabase/functions/get_wildlife_with_route.sql, src/lib/supabase/queries.ts, src/lib/supabase/types.ts
- **Verification:** Type-checked, RPC SQL is valid PostgreSQL
- **Committed in:** 9ae086d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary infrastructure for route visualization. No scope creep.

## Issues Encountered
None

## User Setup Required
The `get_wildlife_with_route` SQL function must be executed in the Supabase SQL Editor before wildlife pages can fetch route geometry data. The function is at `supabase/functions/get_wildlife_with_route.sql`.

## Next Phase Readiness
- All Phase 2 detail pages complete (events + wildlife)
- Wildlife pages ready for Phase 3 migration data population
- JSON-LD structured data foundation ready for Phase 4 SEO content engine

## Self-Check: PASSED

All 8 created/modified files verified on disk. Both task commits (9ae086d, 6ebd67d) verified in git log.

---
*Phase: 02-database-and-affiliate-infrastructure*
*Completed: 2026-03-01*
