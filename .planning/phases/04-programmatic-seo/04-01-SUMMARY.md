---
phase: 04-programmatic-seo
plan: 01
subsystem: seo
tags: [templates, noindex, internal-links, supabase, semantic-html, maplibre, affiliate]

# Dependency graph
requires:
  - phase: 01-map-foundation
    provides: MapLibre setup, Supabase client, affiliate URL builders, Breadcrumbs, CrowdBadge, EmailCapture
  - phase: 02-database-and-affiliate-infrastructure
    provides: Event/Destination types, server client, existing query patterns
provides:
  - 7 intro template arrays with 20+ variations each and deterministic hash selection
  - Thin page noindex logic (shouldNoindex)
  - Internal linking helpers for festival, wildlife, what-to-do cross-linking
  - Supabase SEO query layer (festival, wildlife, what-to-do, sitemap helpers)
  - SeoPageLayout shared component with semantic HTML (AIDX-03)
  - EventCardGrid with affiliate CTAs
  - FilteredMap with SSR fallback for Googlebot
  - InternalLinks navigation component
affects: [04-02, 04-03, 04-04, 04-05, 04-06]

# Tech tracking
tech-stack:
  added: []
  patterns: [deterministic-hash-template-selection, type-assertion-for-supabase-select, noscript-ssr-fallback]

key-files:
  created:
    - src/lib/seo/intro-templates.ts
    - src/lib/seo/thin-page-check.ts
    - src/lib/seo/internal-links.ts
    - src/lib/supabase/seo-queries.ts
    - src/components/seo/SeoPageLayout.tsx
    - src/components/seo/EventCardGrid.tsx
    - src/components/seo/FilteredMap.tsx
    - src/components/seo/InternalLinks.tsx
    - tests/seo/intro-templates.test.ts
    - tests/seo/thin-page-check.test.ts
    - tests/seo/semantic-html.test.tsx
  modified: []

key-decisions:
  - "Type assertions (as Event[]) used in seo-queries.ts because minimal Database type causes supabase-js to infer 'never' -- matches existing queries.ts pattern"
  - "simpleHash for deterministic template selection -- content hash mod template count ensures same page always gets same intro"
  - "FilteredMap uses next/dynamic ssr:false with noscript fallback listing event names for Googlebot"

patterns-established:
  - "Deterministic template selection: simpleHash(key) % templates.length for consistent intro text across builds"
  - "SEO page layout: Breadcrumbs > H1 > Intro > EmailCapture > Content > InternalLinks > BackToMap"
  - "noscript fallback: list event location names as plain text for Googlebot JS-disabled crawling"

requirements-completed: [SEO-08, SEO-09, AIDX-03]

# Metrics
duration: 7min
completed: 2026-03-02
---

# Phase 4 Plan 1: Shared SEO Infrastructure Summary

**Deterministic intro template system (7x20+ variations), thin-page noindex logic, Supabase SEO query layer, and reusable semantic HTML components with affiliate CTAs and Googlebot SSR fallback**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-02T03:55:17Z
- **Completed:** 2026-03-02T04:02:01Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- 7 template arrays with 20+ factual, data-driven intro variations each, selected deterministically via content hash
- Thin page detection: pages with <3 events noindexed unless both weather and crowd data available
- Internal linking helpers generating up to 8 related page links per page type
- Full Supabase query layer for all 3 SEO page types plus sitemap generation helpers
- SeoPageLayout with AIDX-03 semantic HTML (main, section, article, h1/h2/h3, data-section attributes)
- EventCardGrid with Booking.com and GetYourGuide CTAs (wildlife hides Booking.com)
- FilteredMap with MapLibre markers and noscript text fallback for Googlebot

## Task Commits

Each task was committed atomically:

1. **Task 1: Create intro template system, thin-page logic, internal links, and SEO queries with tests** - `ad46144` (feat)
2. **Task 2: Create shared SEO page components** - `2ade764` (feat)

## Files Created/Modified
- `src/lib/seo/intro-templates.ts` - 7 template arrays (20+ each) with deterministic hash selection
- `src/lib/seo/thin-page-check.ts` - shouldNoindex() with THIN_PAGE_THRESHOLD=3
- `src/lib/seo/internal-links.ts` - getRelatedFestivalLinks, getRelatedWildlifeLinks, getRelatedWhatToDoLinks
- `src/lib/supabase/seo-queries.ts` - Festival/wildlife/what-to-do queries, sitemap helpers, slugify/deslugify
- `src/components/seo/SeoPageLayout.tsx` - Shared layout with breadcrumbs, email capture, semantic HTML
- `src/components/seo/EventCardGrid.tsx` - Responsive event card grid with affiliate CTAs
- `src/components/seo/FilteredMap.tsx` - Interactive MapLibre map with noscript SSR fallback
- `src/components/seo/InternalLinks.tsx` - Related pages navigation (max 8 links)
- `tests/seo/intro-templates.test.ts` - 26 tests: template counts, determinism, non-empty output
- `tests/seo/thin-page-check.test.ts` - 12 tests: noindex thresholds, supplementary data
- `tests/seo/semantic-html.test.tsx` - 17 tests: semantic elements, data-section attributes, heading hierarchy

## Decisions Made
- Type assertions (as Event[]) in seo-queries.ts to work around minimal Database type inference -- matches existing queries.ts pattern
- simpleHash for deterministic template selection: content hash mod template count ensures same page always gets same intro across builds
- FilteredMap uses next/dynamic ssr:false with noscript fallback listing event names for Googlebot per RESEARCH.md Pitfall 4

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added type assertions to seo-queries.ts**
- **Found during:** Task 2 (TypeScript verification)
- **Issue:** Supabase typed client returns `never` for `.select('*')` with minimal Database type, causing TS errors in seo-queries.ts
- **Fix:** Added explicit type assertions (as Event[], as Destination, etc.) matching the pattern used in existing queries.ts
- **Files modified:** src/lib/supabase/seo-queries.ts
- **Verification:** `npx tsc --noEmit` shows zero errors in seo-queries.ts
- **Committed in:** 2ade764 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Necessary for TypeScript compilation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All shared SEO infrastructure ready for Plans 02-04 (festival, wildlife, what-to-do routes)
- Template system, query layer, and components are imported by page.tsx files
- 55 tests passing across all 3 test files

---
*Phase: 04-programmatic-seo*
*Completed: 2026-03-02*
