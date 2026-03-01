# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** The Timeline Map — an animated world map where users scrub through months and see pulsing dots for festivals, wildlife spectacles, and crowd levels appear and disappear
**Current focus:** Phase 1 — Map Foundation

## Current Position

Phase: 1 of 5 (Map Foundation)
Plan: 5 of 7 in current phase
Status: Executing
Last activity: 2026-03-01 — Completed 01-04 Interactive map with MapLibre

Progress: [███░░░░░░░] 11%

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 3min
- Total execution time: 0.17 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-map-foundation | 3 | 10min | 3min |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Pre-build]: MapLibre over Mapbox — zero cost at scale, same WebGL capabilities
- [Pre-build]: geometry(Point, 4326) not geography type — 5-10x faster PostGIS queries; critical schema decision before data load
- [Pre-build]: setFilter() not setData() for timeline scrubber — GPU-side filter, no jank; architectural decision not retrofittable
- [Pre-build]: Vercel Pro required ($20/month) — Hobby tier is explicitly non-commercial; site earns affiliate revenue
- [Pre-build]: Apply to Booking.com via Awin immediately at Phase 2 start — approval takes 2-4 weeks; do not gate Phase 2 completion on it
- [01-01]: happy-dom over jsdom for tests — jsdom v28 ESM incompatible with Node 20
- [01-01]: Pinned vite v6 — vite v7 ESM-only breaks vitest config on Node 20
- [01-01]: vitest.config.mts not .ts — .mts ensures ESM resolution
- [01-02]: Singleton pattern for browser Supabase client, fresh instance per request for server client
- [01-02]: COALESCE to empty array in GeoJSON RPC prevents null when events table is empty
- [01-04]: Layer definitions as pure config objects (LayerSpecification) not imperative addLayer calls -- composable and testable
- [01-04]: Two-layer SSR isolation: 'use client' MapShell + next/dynamic ssr:false MapView

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 2]: Booking.com Awin affiliate approval is an external dependency with 2-4 week timeline. Start application at Phase 2 kickoff. Run Hotels.com (CJ) and Agoda applications in parallel as fallbacks.
- [Phase 3]: Wildlife migration data sources (eBird, BirdCast, manual curation) not yet enumerated. Needs investigation at Phase 3 planning.
- [Phase 4]: Content differentiation strategy (min 400 unique words per page, noindex rules for stubs) must be defined before any SEO templates are built. Plan 04-01 is a spec-first gate.
- [Phase 5]: PredictHQ API pricing and data coverage need evaluation at Phase 5 planning. Reverse search PostGIS query design needs deeper research.

## Session Continuity

Last session: 2026-03-01
Stopped at: Completed 01-04-PLAN.md (Interactive map)
Resume file: None
