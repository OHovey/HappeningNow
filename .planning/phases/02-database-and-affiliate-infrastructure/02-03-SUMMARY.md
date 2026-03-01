---
phase: 02-database-and-affiliate-infrastructure
plan: 03
subsystem: ui, api, seo
tags: [ssg, json-ld, open-graph, event-detail, schema-dts, breadcrumbs, affiliate, structured-data]

requires:
  - phase: 01-map-foundation
    provides: MapLibre setup, event data types, affiliate URL builders, CrowdBadge component
  - phase: 02-database-and-affiliate-infrastructure
    plan: 01
    provides: Bbox API, enhanced affiliate links with Awin wrapping
  - phase: 02-database-and-affiliate-infrastructure
    plan: 02
    provides: Breadcrumbs, FtcDisclosure, BackToMap, MiniMap shared components
provides:
  - SSG /event/[slug] detail pages with generateStaticParams and generateMetadata
  - Server-side Supabase query helpers (getEventBySlug, getAllEventSlugs, getNearbyEvents)
  - Event JSON-LD structured data with schema-dts types and XSS prevention
  - Open Graph meta tags with event photo as OG image
  - Shared query helpers for wildlife pages (getWildlifeBySlug, getAllWildlifeSlugs)
affects: [02-04, 04-seo-content-engine]

tech-stack:
  added: [schema-dts]
  patterns: [SSG with generateStaticParams + generateMetadata, JSON-LD via dangerouslySetInnerHTML with XSS escape, buildEventJsonLd/buildEventMetadata helper pattern]

key-files:
  created:
    - src/app/event/[slug]/page.tsx
    - src/lib/supabase/queries.ts
    - src/lib/structured-data.ts
    - src/components/detail/EventHero.tsx
    - src/components/detail/EventContent.tsx
    - src/components/detail/NearbyEvents.tsx
    - tests/structured-data.test.ts
    - tests/metadata.test.ts
  modified:
    - src/app/layout.tsx
    - package.json

key-decisions:
  - "metadataBase added to layout.tsx (resolves relative OG image URLs to absolute)"
  - "Event coordinates deferred: PostGIS geometry not directly extractable via supabase-js; MiniMap omits coordinates until RPC added"
  - "Nearby events algorithm: region first, then country, then temporal overlap as fallback"

patterns-established:
  - "SSG detail page pattern: generateStaticParams + generateMetadata + async Server Component with notFound()"
  - "Structured data helpers: buildEventJsonLd/buildEventMetadata in src/lib/structured-data.ts"
  - "Server queries: src/lib/supabase/queries.ts as centralized data fetching layer"

requirements-completed: [PAGE-03, PAGE-04]

duration: 2min
completed: 2026-03-01
---

# Phase 02 Plan 03: Event Detail Pages Summary

**SSG /event/[slug] pages with Event JSON-LD, Open Graph meta tags, hero image, breadcrumbs, affiliate CTAs, and nearby events grid**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-01T16:36:13Z
- **Completed:** 2026-03-01T16:38:39Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- SSG event detail pages with generateStaticParams for all events and generateMetadata for OG tags
- Event JSON-LD structured data using schema-dts types with XSS prevention
- Server-side query helpers for events and wildlife (shared with plan 02-04)
- Full event detail layout: hero image, breadcrumbs, description, dates, mini map, affiliate CTAs, nearby events
- 11 new tests for JSON-LD and metadata generation (80 total passing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create server queries, event detail components, and test scaffolds** - `00fd48d` (feat)
2. **Task 2: Create /event/[slug] SSG page with generateMetadata and JSON-LD** - `4172495` (feat)

## Files Created/Modified
- `src/lib/supabase/queries.ts` - Server-side data fetching helpers (getEventBySlug, getAllEventSlugs, getNearbyEvents, getWildlifeBySlug, getAllWildlifeSlugs)
- `src/lib/structured-data.ts` - buildEventJsonLd and buildEventMetadata helpers with schema-dts types
- `src/app/event/[slug]/page.tsx` - SSG event detail page with generateStaticParams, generateMetadata, JSON-LD, breadcrumbs
- `src/components/detail/EventHero.tsx` - Full-width hero image with overlaid event name, dates, and CrowdBadge
- `src/components/detail/EventContent.tsx` - Event description, dates, location, lazy-loaded MiniMap, affiliate CTAs with FTC disclosure
- `src/components/detail/NearbyEvents.tsx` - Related events grid with thumbnails, names, dates, and crowd badges
- `src/app/layout.tsx` - Added metadataBase for absolute OG image URL resolution
- `tests/structured-data.test.ts` - 7 tests for Event JSON-LD output
- `tests/metadata.test.ts` - 4 tests for OG meta tag generation

## Decisions Made
- Added `metadataBase: new URL('https://happeningnow.travel')` to layout.tsx to resolve relative OG image URLs to absolute
- Event coordinates for MiniMap deferred: PostGIS geometry stored as WKB is not directly extractable via supabase-js; a future RPC with ST_X/ST_Y will be needed
- Nearby events algorithm uses region as primary criterion, country as secondary, and temporal overlap as last resort

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Event detail pages complete and ready for SEO content engine (Phase 4)
- Server query helpers shared with wildlife detail pages (Plan 02-04)
- JSON-LD and metadata patterns established for reuse across all detail page types
- Event coordinate extraction from PostGIS geometry needs an RPC function for MiniMap integration

## Self-Check: PASSED

All 8 created files verified on disk. Both task commits (00fd48d, 4172495) verified in git log.

---
*Phase: 02-database-and-affiliate-infrastructure*
*Completed: 2026-03-01*
