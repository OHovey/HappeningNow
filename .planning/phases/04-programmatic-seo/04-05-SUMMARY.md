---
phase: 04-programmatic-seo
plan: 05
subsystem: seo
tags: [sitemap, robots, next-js, xml, crawl]

requires:
  - phase: 04-programmatic-seo
    provides: "seo-queries.ts with getDistinctCountries, getDistinctRegions, getDistinctSpecies, getAllDestinationSlugs, getAllEventSlugs, getAllWildlifeSlugs"
provides:
  - "Root sitemap.xml with homepage, event, wildlife, and destination detail page URLs"
  - "Section sitemaps for festivals, wildlife, and what-to-do with all programmatic page URLs"
  - "robots.txt with sitemap reference and /api/ disallow"
affects: [seo, crawling, google-search-console]

tech-stack:
  added: []
  patterns: ["Next.js sitemap.ts file convention", "Next.js robots.ts file convention", "generateSitemaps() for per-section sitemaps"]

key-files:
  created:
    - src/app/sitemap.ts
    - src/app/festivals/sitemap.ts
    - src/app/wildlife/sitemap.ts
    - src/app/what-to-do/sitemap.ts
    - src/app/robots.ts
    - tests/seo/sitemap.test.ts
    - tests/seo/robots.test.ts
  modified: []

key-decisions:
  - "Used Next.js built-in sitemap.ts/robots.ts conventions instead of next-sitemap package"
  - "Single sitemap per section (generateSitemaps returns [{id:0}]) since URL counts are well under 50k limit"

patterns-established:
  - "Sitemap revalidate=3600 for hourly freshness across all sitemap files"
  - "Section sitemaps use generateSitemaps() + default export pattern"

requirements-completed: [SEO-10, SEO-11]

duration: 2min
completed: 2026-03-02
---

# Phase 4 Plan 5: Sitemaps and Robots.txt Summary

**XML sitemaps for 3,500+ programmatic pages across festivals/wildlife/what-to-do sections plus robots.txt with API disallow**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T04:11:35Z
- **Completed:** 2026-03-02T04:13:09Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Root sitemap covers homepage, all event detail pages, wildlife detail pages, and destination pages
- Section sitemaps generate correct URL patterns for all festivals (country, country/month, region/month), wildlife (region, region/month, species), and what-to-do (destination/month) pages
- robots.txt blocks /api/ routes and references sitemap at canonical URL
- All sitemaps use hourly revalidation (3600s) for freshness

## Task Commits

Each task was committed atomically:

1. **Task 1: Create section sitemaps and root sitemap index** - `6adccb4` (feat)
2. **Task 2: Create robots.ts with sitemap reference and API disallow** - `46f5baf` (feat)

## Files Created/Modified
- `src/app/sitemap.ts` - Root sitemap with homepage, event, wildlife, and destination URLs
- `src/app/festivals/sitemap.ts` - Festival section sitemap with country and region URL patterns
- `src/app/wildlife/sitemap.ts` - Wildlife section sitemap with region and species URL patterns
- `src/app/what-to-do/sitemap.ts` - What-to-do section sitemap with destination/month URL patterns
- `src/app/robots.ts` - robots.txt generation with sitemap URL and API disallow
- `tests/seo/sitemap.test.ts` - 21 tests for slugify, URL formats, months, priorities, revalidate config
- `tests/seo/robots.test.ts` - 4 tests for robots.txt output structure

## Decisions Made
- Used Next.js built-in sitemap.ts/robots.ts file conventions (not next-sitemap package) for native caching and content-type
- Single sitemap per section sufficient since URL counts are well under the 50,000 limit

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Sitemaps and robots.txt complete, ready for Google Search Console submission
- All programmatic page URLs are discoverable by crawlers

## Self-Check: PASSED

All 7 created files verified present. Both task commits (6adccb4, 46f5baf) verified in git log.

---
*Phase: 04-programmatic-seo*
*Completed: 2026-03-02*
