---
phase: 03-visual-differentiators
plan: 03
subsystem: ui, destination-pages
tags: [calendar-grid, crowd-colors, booking-widget, ssg, json-ld, next-script-lazy]

# Dependency graph
requires:
  - phase: 03-visual-differentiators
    plan: 01
    provides: Shared crowd-colors utility, DestinationWithCoords type, destination query functions
  - phase: 02-database-and-affiliate-infrastructure
    provides: Supabase queries, affiliate URL builders, Breadcrumbs, BackToMap, FtcDisclosure, MiniMap
provides:
  - computeBestMonths utility (60% crowd / 40% weather weighting)
  - formatTemperature, formatWeatherSummary, monthName utilities
  - DestinationHero, MonthColumn, CalendarGrid, BestTimeToVisit, BookingWidget components
  - /destination/[slug] SSG pages with generateStaticParams, generateMetadata, JSON-LD
  - booking_destination_id field on Destination type
affects: [04-seo-templates, destination-listing-pages]

# Tech tracking
tech-stack:
  added: []
  patterns: [calendar-grid-12-month, lazyOnload-affiliate-script, expandable-event-pills]

key-files:
  created:
    - src/lib/destination-utils.ts
    - src/components/destination/DestinationHero.tsx
    - src/components/destination/MonthColumn.tsx
    - src/components/destination/CalendarGrid.tsx
    - src/components/destination/BestTimeToVisit.tsx
    - src/components/destination/BookingWidget.tsx
    - src/app/destination/[slug]/page.tsx
  modified:
    - src/lib/supabase/types.ts

key-decisions:
  - "computeBestMonths weights crowd 60% and weather 40%, with temp comfort ideal at 23C"
  - "DestinationHero uses gradient background (no hero images in seed data) instead of MiniMap for LCP"
  - "MonthColumn event pills expand inline with affiliate links, not in a modal"
  - "BookingWidget uses ins tag with flexiproduct.js via next/script lazyOnload for Lighthouse perf"
  - "booking_destination_id added to Destination type, handled as null gracefully with fallback link"
  - "CalendarGrid responsive: grid-cols-3 mobile, grid-cols-4 sm, grid-cols-6 lg, grid-cols-12 xl"

patterns-established:
  - "Destination page pattern: SSG with generateStaticParams + generateMetadata + TouristDestination JSON-LD"
  - "Lazy affiliate script: next/script strategy=lazyOnload keeps TBT low for Lighthouse mobile >90"
  - "Best-month computation: reusable computeBestMonths for any crowd+weather dataset"

requirements-completed: [DEST-01, DEST-02, DEST-03, DEST-04, DEST-05, DEST-06, DEST-07, PERF-01]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 3 Plan 3: Destination Calendar Grid Pages Summary

**SSG destination pages with 12-month calendar grid showing crowd gradient bars, expandable event pills, weather data, best-time-to-visit recommendations, and lazy-loaded Booking.com widget**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T21:38:29Z
- **Completed:** 2026-03-01T21:41:19Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Destination utility library with computeBestMonths (60% crowd / 40% weather), formatTemperature, formatWeatherSummary
- 12-month calendar grid with responsive collapse (3/4/6/12 columns), crowd gradient bars using shared crowd-colors, expandable event/wildlife pills with affiliate links, compact weather data per month
- Best-time-to-visit section highlighting 2-3 recommended months as emerald pills with explanation text
- Booking.com widget with flexiproduct.js loaded via next/script lazyOnload, static fallback CTA, FTC disclosure
- SSG destination pages with generateStaticParams, rich OG metadata, TouristDestination JSON-LD structured data

## Task Commits

Each task was committed atomically:

1. **Task 1: Create destination utility functions and all destination components** - `d2631fa` (feat)
2. **Task 2: Create /destination/[slug] SSG page with metadata, JSON-LD, and Lighthouse optimization** - `dc0eecf` (feat)

## Files Created/Modified
- `src/lib/destination-utils.ts` - computeBestMonths, formatTemperature, formatWeatherSummary, monthName
- `src/components/destination/DestinationHero.tsx` - Server component with gradient hero and destination name
- `src/components/destination/MonthColumn.tsx` - Client component: crowd bar, expandable event pills, weather
- `src/components/destination/CalendarGrid.tsx` - 12-month grid with responsive layout and month-aware event filtering
- `src/components/destination/BestTimeToVisit.tsx` - Server component with best-month pills and explanation
- `src/components/destination/BookingWidget.tsx` - Client component with lazy flexiproduct.js and static fallback
- `src/app/destination/[slug]/page.tsx` - SSG page with metadata, JSON-LD, full component layout
- `src/lib/supabase/types.ts` - Added booking_destination_id to Destination type

## Decisions Made
- computeBestMonths weights crowd 60% and weather 40%, with temperature comfort centered at 23C and normalized across rain days, sunshine hours
- DestinationHero uses a gradient background instead of MiniMap for the hero visual since destinations have no image_url in seed data; avoids maplibre-gl import overhead for better LCP
- MonthColumn event pills expand inline (not modal) to show description and affiliate links, keeping the grid scannable
- BookingWidget uses the Booking.com ins/flexiproduct.js pattern with next/script strategy="lazyOnload" to avoid blocking TBT
- booking_destination_id added to Destination type as nullable; BookingWidget falls back to free-text search (ss param) when null
- CalendarGrid uses grid-cols-3 on mobile, grid-cols-4 on sm, grid-cols-6 on lg, grid-cols-12 on xl for progressive disclosure

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added booking_destination_id to Destination type**
- **Found during:** Task 1
- **Issue:** Destination type lacked booking_destination_id field needed by BookingWidget; seed data also doesn't include it
- **Fix:** Added optional nullable booking_destination_id to Destination interface; BookingWidget handles null with fallback search link
- **Files modified:** src/lib/supabase/types.ts
- **Verification:** TypeScript compiles, BookingWidget renders fallback when null
- **Committed in:** d2631fa

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Type addition was explicitly anticipated in plan Task 2 step 3. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. Booking.com widget gracefully degrades when NEXT_PUBLIC_BOOKING_AFFILIATE_ID is not set.

## Next Phase Readiness
- All destination page components are complete and ready for SEO template generation in Phase 4
- Calendar grid reuses shared crowd-colors utility from Plan 03-01
- Destination query functions and type system are complete
- booking_destination_id can be populated in seed data when Booking.com affiliate approval arrives

## Self-Check: PASSED

All 7 created files verified on disk. Both task commits (d2631fa, dc0eecf) verified in git log. All 90 tests pass with no regressions.

---
*Phase: 03-visual-differentiators*
*Completed: 2026-03-01*
