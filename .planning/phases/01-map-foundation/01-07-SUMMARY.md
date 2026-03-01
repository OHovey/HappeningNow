---
phase: 01-map-foundation
plan: 07
subsystem: ui
tags: [email-capture, kit-api, convertkit, subscriber-tagging, bottom-sheet, form]

# Dependency graph
requires:
  - phase: 01-map-foundation/01-06
    provides: "EventPanel with bottom sheet and affiliate CTAs"
provides:
  - "EmailCapture form component with interest checkboxes and inline success/error states"
  - "Kit API v4 helper (createSubscriber, tagSubscriber) with error handling"
  - "Subscribe API route with email validation, interest tagging, and graceful config fallback"
  - "7 unit tests for subscribe API covering validation, tagging, and error cases"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [kit-api-v4-server-proxy, inline-form-feedback, interest-checkbox-tagging]

key-files:
  created:
    - src/lib/convertkit.ts
    - src/components/panel/EmailCapture.tsx
    - src/app/api/subscribe/route.ts
    - tests/api/subscribe.test.ts
  modified:
    - src/components/panel/EventPanel.tsx

key-decisions:
  - "Placeholder TAG_IDS (value 0) skip tagging calls -- form works without Kit dashboard config"
  - "Interest checkboxes pre-check based on eventCategory for contextual subscriber segmentation"

patterns-established:
  - "Server-side API proxy pattern: client form -> Next.js route handler -> external API (Kit v4), keeping API keys off the browser"
  - "Inline form state machine: idle -> loading -> success (replaces form) or error (shows message, retryable)"

requirements-completed: [EMAIL-01, EMAIL-02, EMAIL-03]

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 1 Plan 7: Email Capture Summary

**Inline email capture form in event panel with Kit API v4 server proxy, interest-based tagging, and contextual pre-selection**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-01T07:58:20Z
- **Completed:** 2026-03-01T08:00:19Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Built Kit API v4 helper with createSubscriber (handles 422 existing subscriber) and tagSubscriber (skips unconfigured placeholder IDs)
- Created subscribe API route with email validation, interest + event category tagging, and 503 fallback when Kit API key is not set
- Built EmailCapture client component with email input, interest checkboxes (pre-checked by event category), loading spinner, inline success message, and error retry
- Integrated email capture into EventPanel below affiliate links with visual divider
- 7 unit tests for subscribe API covering valid/invalid email, interests tagging, event category tagging, API errors, and missing config

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Kit API helper and subscribe API route** - `caceffa` (feat)
2. **Task 2: Create EmailCapture component and integrate into event panel** - `be014f7` (feat)

## Files Created/Modified
- `src/lib/convertkit.ts` - Kit API v4 helpers: createSubscriber, tagSubscriber, TAG_IDS constant
- `src/app/api/subscribe/route.ts` - POST handler validating email, creating subscriber, applying interest + category tags
- `src/components/panel/EmailCapture.tsx` - Client form with email input, interest checkboxes, loading/success/error states
- `tests/api/subscribe.test.ts` - 7 unit tests for subscribe route with mocked Kit API
- `src/components/panel/EventPanel.tsx` - Added EmailCapture component below affiliate links

## Decisions Made
- Placeholder TAG_IDS (value 0) cause tagSubscriber to skip the call -- form works end-to-end without Kit dashboard configuration, just without tagging
- Interest checkboxes pre-check the option matching the viewed event's category for contextual subscriber segmentation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
To enable full Kit integration:
- Create a Kit (ConvertKit) account at https://kit.com
- Set `KIT_API_KEY` environment variable from Kit Dashboard -> Settings -> Developer -> API Key (v4)
- Create tags "festivals" and "wildlife" in Kit Dashboard -> Subscribers -> Tags -> Create Tag
- Update `TAG_IDS` in `src/lib/convertkit.ts` with the real tag IDs from the dashboard

Without these steps, the form still works but returns 503 (gracefully handled by the UI).

## Next Phase Readiness
- Phase 1 (Map Foundation) is complete with all 7 plans executed
- Email capture ready for real Kit integration once API key and tags are configured
- All foundation components (map, data, filters, event panel, affiliate CTAs, email capture) are in place

## Self-Check: PASSED

---
*Phase: 01-map-foundation*
*Completed: 2026-03-01*
