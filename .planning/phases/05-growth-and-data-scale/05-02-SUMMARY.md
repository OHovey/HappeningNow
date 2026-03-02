---
phase: 05-growth-and-data-scale
plan: 02
subsystem: ui
tags: [search, maplibre, autocomplete, photon, scoring, result-cards, affiliate-links, vitest]

# Dependency graph
requires:
  - phase: 05-growth-and-data-scale
    provides: Search API route, geocode proxy, worthTheTripScore scoring, SearchEventResult type
  - phase: 02-database-and-affiliate-infrastructure
    provides: Affiliate link builders (buildBookingLink, buildGetYourGuideLink)
  - phase: 01-map-foundation
    provides: MapLibre client island pattern, OPENFREEMAP_STYLE constant
provides:
  - /search page with server component shell and client SearchPage
  - SearchBar horizontal form with location, month range, category, distance
  - LocationInput with Photon autocomplete and keyboard navigation
  - SearchResults with ranked scored cards, loading and empty states
  - ResultCard with indicator tags, affiliate CTAs, category accents
  - SearchMap with MapLibre markers, highlight filter, user location dot
  - Card-map bidirectional selection interaction
  - URL param sync for bookmarkable searches
affects: [05-03, seo, search-experience]

# Tech tracking
tech-stack:
  added: []
  patterns: [search-page-url-sync, debounced-auto-search, card-map-interaction, dynamic-import-map]

key-files:
  created:
    - src/app/search/page.tsx
    - src/components/search/SearchPage.tsx
    - src/components/search/SearchBar.tsx
    - src/components/search/LocationInput.tsx
    - src/components/search/SearchResults.tsx
    - src/components/search/ResultCard.tsx
    - src/components/search/SearchMap.tsx
    - tests/search/search-page.test.tsx
    - tests/search/result-card.test.tsx
    - tests/search/map-highlight.test.ts
  modified: []

key-decisions:
  - "next/dynamic ssr:false for SearchMap -- MapLibre requires browser DOM"
  - "URL params sync via router.replace for bookmarkable searches without navigation"
  - "300ms debounce on both location autocomplete and search filter changes"
  - "Client-side scoring sort with worthTheTripScore -- score hidden, indicator tags visible"

patterns-established:
  - "Search page URL sync: filters stored in searchParams for bookmarkable state"
  - "Card-map interaction: shared selectedResultId state with setFilter highlight layer"
  - "Debounced auto-search: no submit button, 300ms timer on all filter changes"

requirements-completed: [SRCH-01, SRCH-05, SRCH-06]

# Metrics
duration: 4min
completed: 2026-03-02
---

# Phase 5 Plan 2: Search Page UI Summary

**Google Flights-style /search page with horizontal form bar, Photon autocomplete, ranked result cards with indicator tags and affiliate links, and MapLibre map with card-to-marker bidirectional selection**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-02T05:51:33Z
- **Completed:** 2026-03-02T05:55:19Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Full /search page with horizontal search bar (location, month range, category, distance) and no search button -- auto-search on filter change
- LocationInput with Photon geocode autocomplete, keyboard navigation (ArrowUp/Down/Enter/Escape), and 300ms debounce
- ResultCard with indicator tags (Highly Unique, Low Crowds, travel time), affiliate CTAs (Booking.com + GetYourGuide), and category color accents
- SearchMap with MapLibre circle markers, highlight filter layer for selected result, user location blue dot, and automatic fit-bounds
- Bidirectional card-map interaction: clicking card highlights marker, clicking marker highlights card
- URL param sync for bookmarkable searches (lat, lng, name, from, to, cat, radius)
- 19 tests across 3 test files all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Search page shell, SearchBar, and LocationInput** - `84908b1` (feat)
2. **Task 2: SearchResults, ResultCard, SearchMap with card-map interaction** - `ae050e9` (feat)

## Files Created/Modified
- `src/app/search/page.tsx` - Server component shell with metadata
- `src/components/search/SearchPage.tsx` - Client page managing state, URL sync, auto-search
- `src/components/search/SearchBar.tsx` - Horizontal form bar with all filter fields
- `src/components/search/LocationInput.tsx` - Photon autocomplete with keyboard navigation
- `src/components/search/SearchResults.tsx` - Ranked result list with loading and empty states
- `src/components/search/ResultCard.tsx` - Card with indicator tags, affiliate CTAs, selection ring
- `src/components/search/SearchMap.tsx` - MapLibre map with result markers and highlight filter
- `tests/search/search-page.test.tsx` - 6 tests for form rendering and auto-search (no button)
- `tests/search/result-card.test.tsx` - 7 tests for tags, affiliates, selection styling
- `tests/search/map-highlight.test.ts` - 6 tests for GeoJSON builder and highlight filter logic

## Decisions Made
- Used next/dynamic ssr:false for SearchMap since MapLibre requires browser DOM
- URL params synced via router.replace to avoid adding history entries on filter changes
- 300ms debounce on both location autocomplete and search API calls
- Indicator tags explain ranking without exposing the hidden score (per user decision)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test cleanup for happy-dom environment**
- **Found during:** Task 2 (test execution)
- **Issue:** Testing library renders leaked between tests in happy-dom, causing "multiple elements found" errors
- **Fix:** Added afterEach(cleanup) to search-page and result-card test files
- **Files modified:** tests/search/search-page.test.tsx, tests/search/result-card.test.tsx
- **Verification:** All 19 tests pass cleanly
- **Committed in:** ae050e9 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor test environment fix. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in `.rpc()` call signatures (Args typed as `undefined`) affect all RPC calls project-wide. Not caused by this plan. Out of scope.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Search UI complete: /search page ready for user testing
- All search components consume the backend API routes from Plan 01
- Ready for Plan 03 (data growth / additional features)

---
*Phase: 05-growth-and-data-scale*
*Completed: 2026-03-02*
