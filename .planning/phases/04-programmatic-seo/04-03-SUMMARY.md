---
phase: 04-programmatic-seo
plan: 03
subsystem: seo
tags: [wildlife, isr, programmatic-seo, canonical-urls, maplibre, getyourguide]

# Dependency graph
requires:
  - phase: 04-programmatic-seo
    provides: Shared SEO infrastructure (intro templates, thin-page check, seo-queries, SeoPageLayout, EventCardGrid, FilteredMap)
provides:
  - Wildlife region listing pages at /wildlife/region/[region]
  - Wildlife region+month listing pages at /wildlife/region/[region]/[month]
  - Wildlife species listing pages at /wildlife/species/[species]
  - Canonical URLs on existing /event/[slug] and /wildlife/[slug] detail pages
  - 19 behavioral tests for wildlife SEO page configuration
affects: [04-05, 04-06]

# Tech tracking
tech-stack:
  added: []
  patterns: [sub-path-routing-disambiguation, numeric-month-url-params, geographic-grouping-by-region]

key-files:
  created:
    - src/app/wildlife/region/[region]/page.tsx
    - src/app/wildlife/region/[region]/[month]/page.tsx
    - src/app/wildlife/species/[species]/page.tsx
    - tests/seo/wildlife-pages.test.ts
  modified:
    - src/app/event/[slug]/page.tsx
    - src/app/wildlife/[slug]/page.tsx
    - src/lib/seo/internal-links.ts

key-decisions:
  - "Numeric month params (/wildlife/region/africa/6) over slugified month names (/wildlife/region/africa/june) for cleaner URLs and simpler validation"
  - "Events cast to unknown for GeoJSON conversion because Event type lacks lng/lat (available only at render from Supabase query results)"
  - "Species extraction from event names via first word split -- heuristic for grouping when migration_route join unavailable"

patterns-established:
  - "Sub-path routing: /wildlife/region/ and /wildlife/species/ avoid Next.js dynamic segment conflict with /wildlife/[slug]"
  - "Numeric month URL params with parseInt validation and 1-12 range check"
  - "Geographic grouping: species pages group events by region with h2 section headers"

requirements-completed: [SEO-04, SEO-05, SEO-06, PAGE-01, PAGE-02]

# Metrics
duration: 4min
completed: 2026-03-02
---

# Phase 4 Plan 3: Wildlife SEO Pages Summary

**3 wildlife programmatic SEO route families (/wildlife/region/, /wildlife/species/) with ISR, intro templates, GetYourGuide CTAs, and canonical URLs on existing detail pages**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-02T04:05:09Z
- **Completed:** 2026-03-02T04:09:21Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Wildlife region page renders all wildlife events for a region with map, event cards, and GetYourGuide-only CTAs
- Wildlife region+month page filters by month with validation (1-12) and appropriate noindex for thin pages
- Wildlife species page groups events by region for clear geographic organization with cross-linked region pages
- Canonical URLs added to /event/[slug] and /wildlife/[slug] preventing duplicate content with programmatic pages
- Sub-path routing (/wildlife/region/, /wildlife/species/) avoids conflict with existing /wildlife/[slug] detail routes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create wildlife region and species SEO pages** - `95b4d60` (feat)
2. **Task 2: Add canonical URLs to existing event and wildlife detail pages** - committed by concurrent 04-04 agent in `2ad77cc` (no separate commit needed)

## Files Created/Modified
- `src/app/wildlife/region/[region]/page.tsx` - Wildlife region listing with ISR, intro templates, map, event grid
- `src/app/wildlife/region/[region]/[month]/page.tsx` - Wildlife region+month listing with month validation
- `src/app/wildlife/species/[species]/page.tsx` - Wildlife species listing grouped by region
- `tests/seo/wildlife-pages.test.ts` - 19 tests: ISR exports, route structure, noindex logic, canonical URLs
- `src/app/event/[slug]/page.tsx` - Added canonical URL in generateMetadata alternates
- `src/app/wildlife/[slug]/page.tsx` - Added canonical URL in generateMetadata alternates
- `src/lib/seo/internal-links.ts` - Fixed wildlife links to use numeric months matching route params

## Decisions Made
- Numeric month params (/wildlife/region/africa/6) chosen over month name slugs for cleaner URLs and simpler validation
- Events cast through unknown for GeoJSON conversion since Event type lacks lng/lat coordinates
- Species extracted from event names via first-word heuristic when direct migration_route join is not available

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed internal-links.ts wildlife month URLs**
- **Found during:** Task 1 (wildlife region/month page creation)
- **Issue:** internal-links.ts generated wildlife month URLs as `/wildlife/region/africa/january` but the actual route uses numeric months `/wildlife/region/africa/6`
- **Fix:** Changed getRelatedWildlifeLinks() to use numeric month values instead of slugified month names
- **Files modified:** src/lib/seo/internal-links.ts
- **Verification:** All 220 tests pass, internal links now match route structure
- **Committed in:** 95b4d60 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to prevent broken internal links. No scope creep.

## Issues Encountered
- Task 2 canonical URL changes were already committed by a concurrent 04-04 agent -- verified changes present and skipped redundant commit

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 3 wildlife route families operational with ISR (86400s revalidation)
- Shared infrastructure (templates, queries, components) proven across festival (04-02) and wildlife (04-03) pages
- Ready for remaining SEO plans (04-05 sitemap, 04-06 robots.txt)

---
*Phase: 04-programmatic-seo*
*Completed: 2026-03-02*
