---
phase: 01-map-foundation
plan: 06
subsystem: ui
tags: [bottom-sheet, affiliate-links, booking-com, getyourguide, crowd-badge, event-panel, maplibre-gl]

# Dependency graph
requires:
  - phase: 01-map-foundation/01-05
    provides: "Timeline/category filtering with Supabase data fetch and source-level filtering pipeline"
provides:
  - "BottomSheet slide-up component with drag-to-dismiss and accessibility"
  - "EventPanel with hero image, crowd badge, date range, description, and affiliate CTAs"
  - "AffiliateLinks with Booking.com and GetYourGuide deep link CTAs"
  - "CrowdBadge color-coded pill (quiet/moderate/busy)"
  - "Affiliate URL builders (buildBookingLink, buildGetYourGuideLink) with env var fallbacks"
  - "Map marker click handler opening bottom sheet with event data"
affects: [01-07]

# Tech tracking
tech-stack:
  added: []
  patterns: [bottom-sheet-dialog-pattern, affiliate-deep-link-builders, touch-drag-to-dismiss]

key-files:
  created:
    - src/lib/affiliates.ts
    - src/components/ui/CrowdBadge.tsx
    - src/components/ui/BottomSheet.tsx
    - src/components/panel/EventPanel.tsx
    - src/components/panel/AffiliateLinks.tsx
    - tests/affiliates.test.ts
  modified:
    - src/components/map/MapView.tsx

key-decisions:
  - "Affiliate URL builders handle missing env vars by omitting tracking params rather than hiding CTAs -- buttons always visible"
  - "Source-level filtering on event-circles layer click for selectedEvent state rather than querying Supabase again"

patterns-established:
  - "Bottom sheet pattern: BottomSheet wrapper + content panel component -- reusable for any slide-up detail view"
  - "Affiliate link pattern: URL builder functions in lib/affiliates.ts, CTA buttons in panel/AffiliateLinks.tsx"

requirements-completed: [MAP-08, AFFL-01, AFFL-02, AFFL-03]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 1 Plan 6: Event Detail Panel Summary

**Bottom sheet event panel with hero image, crowd badge, and Booking.com/GetYourGuide affiliate CTAs triggered by map marker clicks**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T07:52:44Z
- **Completed:** 2026-03-01T07:55:37Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Built affiliate URL builders for Booking.com and GetYourGuide with destination ID, city fallback, and month-derived date params
- Created BottomSheet with GPU-accelerated slide animation, touch drag-to-dismiss (100px threshold), backdrop overlay, and keyboard accessibility
- Created EventPanel with hero image (or category-colored gradient placeholder), CrowdBadge overlay, date range, location, description, and affiliate CTAs
- Wired map marker clicks to open bottom sheet with event data, background clicks to dismiss
- 10 unit tests for affiliate link generation covering full params, fallbacks, and missing env vars

## Task Commits

Each task was committed atomically:

1. **Task 1: Create affiliate URL builders, crowd badge, and bottom sheet** - `ee44191` (feat)
2. **Task 2: Create EventPanel and wire marker click to bottom sheet** - `3998f5c` (feat)

## Files Created/Modified
- `src/lib/affiliates.ts` - buildBookingLink, buildGetYourGuideLink, formatMonthRange
- `src/components/ui/CrowdBadge.tsx` - Color-coded crowd indicator pill (quiet/moderate/busy)
- `src/components/ui/BottomSheet.tsx` - Slide-up sheet with drag-to-dismiss, backdrop, focus trap
- `src/components/panel/EventPanel.tsx` - Event detail content with hero, badge, dates, description, CTAs
- `src/components/panel/AffiliateLinks.tsx` - Booking.com and GetYourGuide CTA buttons
- `tests/affiliates.test.ts` - 10 unit tests for affiliate URL builders and month formatting
- `src/components/map/MapView.tsx` - Added click handlers, selectedEvent state, BottomSheet rendering

## Decisions Made
- Affiliate URL builders omit tracking params when env vars are missing rather than hiding CTAs -- users can still navigate to booking sites, just without attribution
- Used GeoJSON feature properties directly from map click (no re-fetch from Supabase) for instant panel display
- Reserved spacing in EventPanel for email capture component (plan 01-07)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None beyond prior plan requirements. Set `NEXT_PUBLIC_BOOKING_AFFILIATE_ID` and `NEXT_PUBLIC_GYG_PARTNER_ID` env vars when affiliate accounts are approved (Phase 2).

## Next Phase Readiness
- EventPanel has reserved spacing for email capture component (plan 01-07)
- BottomSheet reusable for any future slide-up detail views
- Affiliate link builders ready for real partner IDs once approved

## Self-Check: PASSED

All 6 created files verified on disk. Both task commits (ee44191, 3998f5c) verified in git log.

---
*Phase: 01-map-foundation*
*Completed: 2026-03-01*
