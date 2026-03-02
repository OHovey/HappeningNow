---
phase: 04-programmatic-seo
plan: 04
subsystem: seo
tags: [what-to-do, programmatic-seo, isr, weather, crowd-data, affiliate, booking, maplibre]

# Dependency graph
requires:
  - phase: 04-programmatic-seo
    provides: Shared SEO infrastructure (SeoPageLayout, EventCardGrid, FilteredMap, intro templates, thin-page logic, seo-queries, internal-links)
  - phase: 03-visual-differentiators
    provides: Crowd colors (crowdScoreToColor, crowdScoreToLabel, estimateTouristVolume), destination-utils (formatWeatherSummary, formatTemperature)
  - phase: 02-database-and-affiliate-infrastructure
    provides: Supabase types (Event, Destination, EventGeoJSON), affiliate URL builders (buildBookingLink, buildGetYourGuideLink)
provides:
  - /what-to-do/[destination]/[month] programmatic SEO route (~2,000+ target pages)
  - Weather + crowd summary section with color-coded badges
  - Events section with FilteredMap and EventCardGrid
  - Prominent Booking.com and GetYourGuide affiliate CTAs
  - Internal links to adjacent months, destination page, and nearby destinations
affects: [04-05, 04-06]

# Tech tracking
tech-stack:
  added: []
  patterns: [what-to-do-multi-data-page, numeric-month-url-routes, supplementary-data-indexing]

key-files:
  created:
    - src/app/what-to-do/[destination]/[month]/page.tsx
    - tests/seo/whatodo-pages.test.ts
  modified:
    - src/lib/seo/internal-links.ts

key-decisions:
  - "Numeric months in URLs (/what-to-do/bangkok/3) not slugified names (/what-to-do/bangkok/march) -- simpler parsing, shorter URLs, consistent with plan spec"
  - "What-to-do pages remain indexed even with 0 events when weather+crowd data exists -- shouldNoindex passes hasWeatherData and hasCrowdData flags"
  - "Fixed getRelatedWhatToDoLinks to use numeric month URLs matching the route pattern"

patterns-established:
  - "Multi-data page pattern: combine events + weather + crowd in a single page with data-section attributes for each concern"
  - "Numeric month URLs: /what-to-do/[destination]/[month] where month is 1-12"

requirements-completed: [SEO-07]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 4 Plan 4: What-to-Do Pages Summary

**What-to-do programmatic SEO pages combining events, weather, and crowd data with prominent Booking.com/GetYourGuide CTAs at /what-to-do/[destination]/[month]**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T04:05:28Z
- **Completed:** 2026-03-02T04:07:28Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- What-to-do page route with ISR (revalidate=86400, dynamicParams=true, empty generateStaticParams)
- Weather and crowd summary section with color-coded badge, crowd score explanation, temperature/rain/sunshine details
- Events section with interactive FilteredMap and EventCardGrid with affiliate CTAs
- Prominent booking section with Booking.com CTA (pre-filled with destination + month) and GetYourGuide CTA
- Internal links to adjacent months, destination detail page, and nearby destinations
- 23 behavioral tests verifying ISR config, utility imports, noindex logic, metadata, and page structure

## Task Commits

Each task was committed atomically:

1. **Task 1: Create /what-to-do/[destination]/[month] programmatic SEO pages** - `ea73741` (feat)

## Files Created/Modified
- `src/app/what-to-do/[destination]/[month]/page.tsx` - What-to-do page with weather, crowd, events, booking sections
- `tests/seo/whatodo-pages.test.ts` - 23 behavioral tests for ISR, imports, noindex, metadata, structure
- `src/lib/seo/internal-links.ts` - Fixed getRelatedWhatToDoLinks to use numeric months + added destination detail link

## Decisions Made
- Numeric months in URLs (e.g., /what-to-do/bangkok/3) for simpler parsing and shorter URLs
- What-to-do pages stay indexed with 0 events when supplementary weather+crowd data exists
- Fixed getRelatedWhatToDoLinks to generate numeric month URLs matching the route pattern, added destination detail page link

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed getRelatedWhatToDoLinks URL format**
- **Found during:** Task 1 (page implementation)
- **Issue:** getRelatedWhatToDoLinks generated slugified month names (/what-to-do/bangkok/march) but the route expects numeric months (/what-to-do/bangkok/3)
- **Fix:** Changed URL generation to use numeric months. Also added destination detail page link per plan spec.
- **Files modified:** src/lib/seo/internal-links.ts
- **Verification:** Internal links now generate correct numeric month URLs
- **Committed in:** ea73741 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for correct internal linking. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- What-to-do pages ready for sitemap inclusion (Plan 05/06)
- Route pattern established for ~2,000+ pages via ISR
- All 23 tests passing

---
*Phase: 04-programmatic-seo*
*Completed: 2026-03-02*
