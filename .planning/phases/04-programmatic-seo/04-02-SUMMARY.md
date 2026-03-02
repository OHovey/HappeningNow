---
phase: 04-programmatic-seo
plan: 02
subsystem: seo
tags: [nextjs-routes, isr, festival-pages, region-disambiguation, noindex, canonical-urls]

# Dependency graph
requires:
  - phase: 04-programmatic-seo
    provides: Shared SEO infrastructure (intro templates, thin-page logic, query layer, SeoPageLayout, EventCardGrid, FilteredMap)
  - phase: 01-map-foundation
    provides: MapLibre setup, Supabase client, affiliate URL builders, Breadcrumbs, CrowdBadge
provides:
  - Festival country pages at /festivals/[slug]/ with month-grouped calendar view
  - Festival region+month and country+month pages at /festivals/[slug]/[month]/ via KNOWN_REGIONS disambiguation
  - 33 behavioral tests for ISR config, disambiguation, noindex, and component usage
affects: [04-06]

# Tech tracking
tech-stack:
  added: []
  patterns: [known-regions-disambiguation, events-to-geojson-conversion, month-grouped-calendar-view]

key-files:
  created:
    - src/app/festivals/[slug]/page.tsx
    - src/app/festivals/[slug]/[month]/page.tsx
    - tests/seo/festival-pages.test.ts
  modified: []

key-decisions:
  - "Single [slug]/[month] directory handles both region+month and country+month via KNOWN_REGIONS set disambiguation at runtime"
  - "Numeric month params (1-12) in URLs rather than month name slugs for cleaner canonical URLs"
  - "Country page groups events by month with h2 headings for calendar-style display"

patterns-established:
  - "KNOWN_REGIONS set: centralized region slug list for slug disambiguation across SEO page families"
  - "eventsToGeoJSON helper: converts Event[] to EventGeoJSON FeatureCollection for FilteredMap"
  - "groupEventsByMonth: fan-out events spanning multiple months into per-month buckets"

requirements-completed: [SEO-01, SEO-02, SEO-03, SEO-12]

# Metrics
duration: 3min
completed: 2026-03-02
---

# Phase 4 Plan 2: Festival SEO Pages Summary

**Three festival route families (~1,160 pages) with ISR, region/country slug disambiguation, month-grouped calendar views, and noindex for thin pages**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T04:04:50Z
- **Completed:** 2026-03-02T04:07:53Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- Festival country pages at /festivals/[slug] show all festivals grouped by month with h2 calendar sections
- Festival region+month and country+month pages at /festivals/[slug]/[month] disambiguate via KNOWN_REGIONS set
- ISR configured with revalidate=86400, dynamicParams=true, empty generateStaticParams for on-demand generation
- Thin pages (<3 events) get noindex via shouldNoindex(), canonical URLs set for all pages
- 33 behavioral tests covering ISR exports, disambiguation logic, noindex, canonicals, and component imports

## Task Commits

Each task was committed atomically:

1. **Task 1: Create /festivals/[slug]/[month] and /festivals/[slug] pages with tests** - `63abd69` (feat)

## Files Created/Modified
- `src/app/festivals/[slug]/page.tsx` - Country festival page with month-grouped calendar view, ISR, noindex logic
- `src/app/festivals/[slug]/[month]/page.tsx` - Region+month and country+month page with KNOWN_REGIONS disambiguation
- `tests/seo/festival-pages.test.ts` - 33 behavioral tests for ISR config, disambiguation, noindex, canonicals, components

## Decisions Made
- Single [slug]/[month] route handles both region+month and country+month via KNOWN_REGIONS set (12 known regions) -- avoids Next.js routing conflicts
- Numeric month params (1-12) in URLs for clean canonicals (e.g., /festivals/thailand/3)
- Country pages group events by month with h2 headings, rendering EventCardGrid per month section
- BreadcrumbItem uses `name` field (not `label`) matching existing Breadcrumbs component interface

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed BreadcrumbItem property name**
- **Found during:** Task 1 (TypeScript verification)
- **Issue:** Used `label` property for breadcrumb items but BreadcrumbItem interface requires `name`
- **Fix:** Changed all breadcrumb items from `{ label: '...' }` to `{ name: '...' }`
- **Files modified:** src/app/festivals/[slug]/page.tsx, src/app/festivals/[slug]/[month]/page.tsx
- **Verification:** `npx tsc --noEmit` shows zero errors in festival page files
- **Committed in:** 63abd69 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed regex `s` flag TypeScript target compatibility**
- **Found during:** Task 1 (TypeScript verification)
- **Issue:** Regex with `s` flag requires ES2018+ target, project uses earlier target
- **Fix:** Replaced regex assertions with `toContain` checks
- **Files modified:** tests/seo/festival-pages.test.ts
- **Verification:** Tests pass, TypeScript compiles cleanly
- **Committed in:** 63abd69 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bug fixes)
**Impact on plan:** Both fixes necessary for TypeScript compilation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Festival pages ready for ISR serving
- KNOWN_REGIONS pattern available for reuse in wildlife and what-to-do page families (Plans 03-04)
- eventsToGeoJSON helper can be extracted to shared util if needed by other pages

---
*Phase: 04-programmatic-seo*
*Completed: 2026-03-02*
