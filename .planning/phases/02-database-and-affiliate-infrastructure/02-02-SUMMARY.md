---
phase: 02-database-and-affiliate-infrastructure
plan: 02
subsystem: ui
tags: [breadcrumbs, json-ld, seo, affiliate, ftc, maplibre, navigation]

requires:
  - phase: 01-map-foundation
    provides: MapLibre setup, OPENFREEMAP_STYLE constant, Tailwind/Next.js foundation
provides:
  - Breadcrumbs component with BreadcrumbList JSON-LD structured data
  - FtcDisclosure inline affiliate disclosure badge
  - BackToMap floating navigation button with viewport preservation
  - MiniMap embedded MapLibre map with optional migration route overlay
affects: [02-03, 02-04, 04-seo-content-engine]

tech-stack:
  added: []
  patterns: [JSON-LD structured data via dangerouslySetInnerHTML, viewport persistence via localStorage, non-interactive MapLibre instance]

key-files:
  created:
    - src/components/ui/Breadcrumbs.tsx
    - src/components/ui/FtcDisclosure.tsx
    - src/components/ui/BackToMap.tsx
    - src/components/detail/MiniMap.tsx
    - tests/breadcrumbs.test.tsx
  modified: []

key-decisions:
  - "Test file uses .tsx extension (not .ts) for JSX support in vitest"
  - "Viewport saved to localStorage with saveViewport/getSavedViewport helpers exported for map consumption"
  - "MiniMap set to interactive:false for detail page embedding"

patterns-established:
  - "JSON-LD structured data: render via script tag with XSS prevention (.replace(/</g, '\\u003c'))"
  - "Detail page shared components: reusable across /event/[slug] and /wildlife/[slug]"
  - "Viewport persistence: localStorage key 'happeningnow_last_viewport'"

requirements-completed: [PAGE-05]

duration: 2min
completed: 2026-03-01
---

# Phase 02 Plan 02: Shared Detail Page Components Summary

**Breadcrumbs with BreadcrumbList JSON-LD, FTC disclosure badge, floating Back to Map button, and MiniMap with optional migration route overlay**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-01T16:12:06Z
- **Completed:** 2026-03-01T16:14:11Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Breadcrumbs component with visual Home > Region > Name nav and BreadcrumbList JSON-LD structured data
- FTC affiliate disclosure inline badge for placement near affiliate CTAs
- Floating Back to Map button that preserves map viewport via localStorage
- MiniMap component supporting single markers, migration route lines, waypoint labels, and month-aware active position highlighting
- 5 unit tests for breadcrumb rendering and JSON-LD output

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Breadcrumbs component with BreadcrumbList JSON-LD and tests** - `1156f8d` (feat)
2. **Task 2: Create FtcDisclosure, BackToMap, and MiniMap components** - `560a9f3` (feat)

## Files Created/Modified
- `src/components/ui/Breadcrumbs.tsx` - Visual breadcrumb nav + BreadcrumbList JSON-LD structured data
- `src/components/ui/FtcDisclosure.tsx` - Inline "Affiliate link" disclosure badge with info icon
- `src/components/ui/BackToMap.tsx` - Floating button navigating to / with saved viewport params
- `src/components/detail/MiniMap.tsx` - Non-interactive MapLibre map with marker, optional route line, waypoints, active position
- `tests/breadcrumbs.test.tsx` - 5 tests covering breadcrumb rendering, JSON-LD, and edge cases

## Decisions Made
- Used `.tsx` extension for breadcrumb test file (plan specified `.ts` but file contains JSX)
- Exported `saveViewport`/`getSavedViewport` helpers from BackToMap for map page consumption
- MiniMap uses `interactive: false` for clean detail page embedding

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Renamed test file from .ts to .tsx**
- **Found during:** Task 1 (Breadcrumbs tests)
- **Issue:** Plan specified `tests/breadcrumbs.test.ts` but file contains JSX which requires `.tsx` extension
- **Fix:** Created file as `.tsx` to match project convention (see `error-boundary.test.tsx`)
- **Files modified:** tests/breadcrumbs.test.tsx
- **Verification:** `npx vitest run tests/breadcrumbs.test.tsx` passes all 5 tests
- **Committed in:** 1156f8d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary file extension fix for JSX support. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All four shared components ready for import by detail page plans (02-03, 02-04)
- Wave 2 plans can now run in parallel using these shared components
- BreadcrumbList JSON-LD provides SEO foundation for Phase 4 content engine

## Self-Check: PASSED

All 5 created files verified on disk. Both task commits (1156f8d, 560a9f3) verified in git log.

---
*Phase: 02-database-and-affiliate-infrastructure*
*Completed: 2026-03-01*
