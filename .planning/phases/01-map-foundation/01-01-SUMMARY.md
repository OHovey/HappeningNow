---
phase: 01-map-foundation
plan: 01
subsystem: infra
tags: [next.js, tailwind-v4, vitest, plausible, error-boundary, maplibre-gl, supabase, typescript]

# Dependency graph
requires: []
provides:
  - "Next.js 15 App Router project scaffold with TypeScript"
  - "Tailwind CSS v4 with custom theme colors (festival orange, wildlife green, other blue)"
  - "PlausibleProvider analytics wrapper in root layout"
  - "Vitest test framework with happy-dom and React plugin"
  - "ErrorBoundary class component with fallback UI and reset"
  - "LoadingSkeleton component with map, card, text, and default variants"
  - "Environment variable template (.env.local.example)"
affects: [01-02, 01-03, 01-04, 01-05, 01-06, 01-07]

# Tech tracking
tech-stack:
  added: [next.js 16.1.6, react 19.2.3, tailwindcss v4, vitest 3.2.4, vite 6, happy-dom, maplibre-gl, @supabase/supabase-js, next-plausible, @vitejs/plugin-react, @testing-library/react, @testing-library/jest-dom]
  patterns: [CSS-first Tailwind v4 config, App Router, PlausibleProvider in head, class-based error boundary]

key-files:
  created:
    - package.json
    - tsconfig.json
    - vitest.config.mts
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/app/globals.css
    - src/components/ui/ErrorBoundary.tsx
    - src/components/ui/LoadingSkeleton.tsx
    - tests/components/error-boundary.test.tsx
    - .env.local.example
  modified: []

key-decisions:
  - "Used happy-dom instead of jsdom for test environment — jsdom v28 has ESM compatibility issues with Node 20"
  - "Pinned vite to v6 — vite v7 requires full ESM which breaks vitest 3.x config loading on Node 20"
  - "Used vitest.config.mts (not .ts) — .mts extension ensures ESM module resolution for plugin imports"
  - "Next.js 16.1.6 shipped as latest (plan said 15) — used current stable"

patterns-established:
  - "Tailwind v4 CSS-first: @import 'tailwindcss' + @theme inline block, no tailwind.config.js"
  - "Error boundaries: class component with 'use client', componentDidCatch, reset pattern"
  - "Test structure: tests/ directory mirroring src/, .test.tsx files, vitest + happy-dom"
  - "Component convention: 'use client' directive for interactive components in src/components/ui/"

requirements-completed: [FOUND-01, PERF-05, PERF-06]

# Metrics
duration: 5min
completed: 2026-03-01
---

# Phase 1 Plan 1: Project Scaffold Summary

**Next.js 16 project with Tailwind v4 CSS-first config, Plausible analytics, ErrorBoundary/LoadingSkeleton components, and Vitest test runner with 4 passing tests**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-01T07:16:27Z
- **Completed:** 2026-03-01T07:21:53Z
- **Tasks:** 2
- **Files modified:** 24

## Accomplishments
- Next.js project builds successfully with TypeScript, Tailwind v4, and App Router
- PlausibleProvider wraps the application with configurable domain
- ErrorBoundary catches component errors with retry UI, LoadingSkeleton provides map/card/text variants
- Vitest configured and running with 4 passing error boundary tests
- All env vars documented in .env.local.example

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 15 project with Tailwind v4 and core dependencies** - `f3f3159` (feat)
2. **Task 2: Create error boundary, loading skeleton, and their tests** - `64e20c0` (feat)

## Files Created/Modified
- `package.json` - Project dependencies and scripts (Next.js, maplibre-gl, supabase, vitest)
- `tsconfig.json` - TypeScript config with @/* path alias
- `vitest.config.mts` - Vitest with happy-dom environment and React plugin
- `src/app/layout.tsx` - Root layout with PlausibleProvider and metadata
- `src/app/page.tsx` - Placeholder home page
- `src/app/globals.css` - Tailwind v4 CSS-first config with custom theme colors
- `src/components/ui/ErrorBoundary.tsx` - React error boundary with fallback and reset
- `src/components/ui/LoadingSkeleton.tsx` - Loading skeleton with map/card/text/default variants
- `tests/components/error-boundary.test.tsx` - 4 tests covering error boundary behavior
- `.env.local.example` - Environment variable template
- `.gitignore` - Git ignore with .env exception for example file
- `eslint.config.mjs` - ESLint configuration
- `next.config.ts` - Next.js configuration
- `postcss.config.mjs` - PostCSS with Tailwind plugin

## Decisions Made
- Used happy-dom instead of jsdom — jsdom v28 has ESM compatibility issues with Node 20
- Pinned vite to v6 — vite v7 requires full ESM which breaks vitest config loading on Node 20
- Used vitest.config.mts instead of .ts — .mts extension ensures ESM module resolution
- Next.js 16.1.6 shipped as latest stable (plan referenced v15)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Switched test environment from jsdom to happy-dom**
- **Found during:** Task 2 (Error boundary tests)
- **Issue:** jsdom v28 has ESM require() incompatibility with Node 20, preventing test execution
- **Fix:** Installed happy-dom and updated vitest.config.mts to use happy-dom environment
- **Files modified:** vitest.config.mts, package.json
- **Verification:** All 4 tests pass
- **Committed in:** 64e20c0 (Task 2 commit)

**2. [Rule 3 - Blocking] Pinned vite to v6 and renamed config to .mts**
- **Found during:** Task 1 (Vitest configuration)
- **Issue:** vite v7 (pulled by vitest) uses ESM-only Node API, breaking vitest config loading on Node 20. vitest.config.ts failed to load @vitejs/plugin-react ESM module
- **Fix:** Installed vite@^6 explicitly and renamed vitest.config.ts to vitest.config.mts for ESM resolution
- **Files modified:** vitest.config.mts, package.json
- **Verification:** vitest runs successfully, build passes
- **Committed in:** 64e20c0 (Task 2 commit)

**3. [Rule 3 - Blocking] Created in temp dir due to npm naming restriction**
- **Found during:** Task 1 (Project scaffold)
- **Issue:** create-next-app rejected directory name "HappeningNow" due to uppercase characters in npm naming rules
- **Fix:** Created project in /tmp/happeningnow-scaffold and copied files to project directory
- **Files modified:** All scaffolded files
- **Verification:** Build passes, project structure correct
- **Committed in:** f3f3159 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All auto-fixes necessary for functionality on Node 20. No scope creep.

## Issues Encountered
- npm naming restrictions prevented in-place scaffolding — resolved by scaffolding in temp directory
- ESM compatibility chain: vite v7 + jsdom v28 both require ESM-only imports incompatible with Node 20 — resolved by pinning vite v6 and using happy-dom

## User Setup Required

None - no external service configuration required. Environment variables are documented in `.env.local.example` but not needed for local development at this stage.

## Next Phase Readiness
- Project foundation ready for all subsequent plans
- Map components (01-04) can import ErrorBoundary and LoadingSkeleton
- Database layer (01-02) has supabase client dependency available
- Test infrastructure ready for TDD workflows

## Self-Check: PASSED

All 10 created files verified present. Both task commits (f3f3159, 64e20c0) verified in git log.

---
*Phase: 01-map-foundation*
*Completed: 2026-03-01*
