---
phase: 04-programmatic-seo
plan: 06
subsystem: seo
tags: [llms-txt, ai-discoverability, affiliate-links, isr, markdown]

# Dependency graph
requires:
  - phase: 04-02
    provides: SEO query functions (getDistinctRegions, getDistinctCountries, getDistinctSpecies)
  - phase: 04-03
    provides: Affiliate link builders (buildBookingLink, buildGetYourGuideLink)
  - phase: 04-04
    provides: Festival SEO page URL patterns
provides:
  - "llms.txt AI discoverability file with site catalog and URL patterns"
  - "llms-full.txt complete event database with affiliate links for AI assistants"
affects: [sitemap, robots-txt, ai-crawlers]

# Tech tracking
tech-stack:
  added: []
  patterns: [llms-txt-spec, ai-discoverability-routes]

key-files:
  created:
    - src/app/llms.txt/route.ts
    - src/app/llms-full.txt/route.ts
    - tests/seo/llms-txt.test.ts
  modified: []

key-decisions:
  - "Serve destinations without month in llms.txt URLs — lets destination pages choose best month"
  - "Wildlife entries get GYG links only, no Booking.com — wildlife viewing is tours not accommodation"
  - "Truncate descriptions to 200 chars in llms-full.txt to manage file size with 600+ events"

patterns-established:
  - "llms.txt spec: header, blockquote, section-per-entity-type, page-types, optional-link-to-full"
  - "Route handler pattern for static text file serving with ISR"

requirements-completed: [AIDX-01, AIDX-02]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 04 Plan 06: llms.txt AI Discoverability Summary

**llms.txt data catalog and llms-full.txt complete event database with affiliate links for AI assistant discoverability**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T04:11:29Z
- **Completed:** 2026-03-02T04:13:25Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- llms.txt serves structured catalog with regions, countries, species, destinations, and URL patterns per llmstxt.org spec
- llms-full.txt serves complete event database with Booking.com and GetYourGuide affiliate links
- Both routes use 24-hour ISR caching with text/markdown content type
- 29 tests verify content structure, affiliate link presence, and URL patterns

## Task Commits

Each task was committed atomically:

1. **Task 1: Create llms.txt and llms-full.txt route handlers** - `6adccb4` (feat)
2. **Task 2: Create tests for llms.txt content structure** - `5db3491` (test)

## Files Created/Modified
- `src/app/llms.txt/route.ts` - AI discoverability file with site catalog and URL patterns
- `src/app/llms-full.txt/route.ts` - Complete event database with affiliate links for AI assistants
- `tests/seo/llms-txt.test.ts` - 29 structural tests for both route handlers

## Decisions Made
- Serve destinations without month in llms.txt URLs — lets destination pages choose best month
- Wildlife entries get GYG links only, no Booking.com — wildlife viewing is tours not accommodation
- Truncate descriptions to 200 chars in llms-full.txt to manage file size with 600+ events

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AI discoverability files complete, ready for crawlers
- All Phase 4 programmatic SEO plans now complete

---
*Phase: 04-programmatic-seo*
*Completed: 2026-03-02*
