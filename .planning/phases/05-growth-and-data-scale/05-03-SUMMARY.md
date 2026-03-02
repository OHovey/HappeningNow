---
phase: 05-growth-and-data-scale
plan: 03
subsystem: ui
tags: [email-alerts, convertkit, wikipedia, cheerio, nominatim, geocoding, seed-data, vitest]

# Dependency graph
requires:
  - phase: 05-growth-and-data-scale
    provides: Search page UI with SearchPage, SearchResults, selectedLocation state
  - phase: 02-database-and-affiliate-infrastructure
    provides: Kit (ConvertKit) API v4 helpers, subscribe endpoint, TAG_IDS
provides:
  - AlertSignup component for region-based email alerts on search page
  - Extended subscribe API with alert flag and region custom field
  - setSubscriberCustomField Kit API v4 helper
  - Wikipedia festival seed data scraping script with Nominatim geocoding
affects: [email-growth, seed-data, search-experience]

# Tech tracking
tech-stack:
  added: [cheerio]
  patterns: [alert-signup-form-state-machine, kit-custom-fields, wikipedia-mediawiki-scraper, nominatim-batch-geocode]

key-files:
  created:
    - src/components/search/AlertSignup.tsx
    - scripts/scrape-wikipedia.ts
    - tests/api/alert-signup.test.ts
  modified:
    - src/components/search/SearchPage.tsx
    - src/app/api/subscribe/route.ts
    - src/lib/convertkit.ts
    - package.json

key-decisions:
  - "Updated Wikipedia target pages to jazz and film festival lists (have wikitable format) instead of music festivals list (uses unstructured list items)"
  - "All alert categories default checked per user decision"
  - "Inline confirmation replaces form on success per user decision"

patterns-established:
  - "Alert signup: compact card below search results with form state machine (idle/loading/success/error)"
  - "Kit custom fields: setSubscriberCustomField for arbitrary metadata on subscribers"
  - "Wikipedia scraping: MediaWiki parse API + cheerio table extraction + Nominatim geocoding with 1s rate limit"

requirements-completed: [EMAIL-04]

# Metrics
duration: 7min
completed: 2026-03-02
---

# Phase 5 Plan 3: Data Growth Summary

**Region alert signup on search page with Kit custom fields and Wikipedia festival seed data scraping script using cheerio and Nominatim**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-02T05:57:38Z
- **Completed:** 2026-03-02T06:04:45Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- AlertSignup component with category checkboxes (Festivals, Wildlife, Markets, Other), email input, and inline success confirmation
- Extended subscribe API to accept `alert: true` flag with `region` field, sets Kit custom field `alert_region` on subscriber
- `setSubscriberCustomField` helper in convertkit.ts using Kit API v4 PUT endpoint
- Wikipedia scraping script targeting jazz and film festival list pages via MediaWiki parse API
- Nominatim geocoding with 1-second delay between requests per usage policy
- 5 tests covering alert signup, validation, backward compatibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Alert signup component and extended subscribe API** - `a47b070` (feat)
2. **Task 2: Wikipedia seed data scraping script** - `2792a94` (feat)

## Files Created/Modified
- `src/components/search/AlertSignup.tsx` - Region alert signup form with category checkboxes and state machine
- `src/components/search/SearchPage.tsx` - Wired AlertSignup below SearchResults when location selected
- `src/app/api/subscribe/route.ts` - Extended with alert/region/categories validation and custom field
- `src/lib/convertkit.ts` - Added setSubscriberCustomField for Kit API v4
- `scripts/scrape-wikipedia.ts` - Wikipedia festival scraper with cheerio + Nominatim geocoding
- `tests/api/alert-signup.test.ts` - 5 tests for alert subscription flow
- `package.json` - Added cheerio dependency and scrape-wikipedia npm script

## Decisions Made
- Updated Wikipedia target pages from music festivals (list-based, no tables) to jazz festivals and film festivals (have wikitable format with structured Name/Location/Country columns)
- All alert categories checked by default per user decision
- Inline confirmation message replaces form on success per user decision

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Changed Wikipedia target pages to ones with actual wikitable format**
- **Found during:** Task 2 (Wikipedia scraping)
- **Issue:** Plan specified List_of_music_festivals, List_of_food_festivals, List_of_film_festivals. Music festivals page uses unstructured list items, not wikitables. Food festivals page does not exist.
- **Fix:** Replaced with List_of_jazz_festivals, List_of_film_festivals, List_of_film_festivals_in_Europe which have proper wikitable structures with Name/Location/Country columns
- **Files modified:** scripts/scrape-wikipedia.ts
- **Verification:** Script successfully fetches and parses tables from replacement pages
- **Committed in:** 2792a94 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Changed Wikipedia page targets to ones with parseable table data. Same scraping approach, better data sources. No scope creep.

## Issues Encountered
- Wikipedia "List_of_music_festivals" page uses `<li>` list items rather than `<table class="wikitable">` elements, making table-based parsing impossible. Resolved by selecting alternative pages with proper table structure.

## User Setup Required
None - no external service configuration required. The scraping script is run manually via `npm run scrape-wikipedia` and requires internet access for MediaWiki API and Nominatim geocoding.

## Next Phase Readiness
- Phase 5 complete: search backend, search UI, and data growth features all delivered
- Alert signup captures region interest for future email campaigns via Kit custom fields
- Wikipedia seed script ready to run when additional festival data is needed

---
*Phase: 05-growth-and-data-scale*
*Completed: 2026-03-02*
