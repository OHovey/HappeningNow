# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** The Timeline Map — an animated world map where users scrub through months and see pulsing dots for festivals, wildlife spectacles, and crowd levels appear and disappear
**Current focus:** Phase 1 — Map Foundation

## Current Position

Phase: 1 of 5 (Map Foundation)
Plan: 0 of 7 in current phase
Status: Ready to plan
Last activity: 2026-03-01 — Roadmap created, all 54 v1 requirements mapped across 5 phases

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

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

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 2]: Booking.com Awin affiliate approval is an external dependency with 2-4 week timeline. Start application at Phase 2 kickoff. Run Hotels.com (CJ) and Agoda applications in parallel as fallbacks.
- [Phase 3]: Wildlife migration data sources (eBird, BirdCast, manual curation) not yet enumerated. Needs investigation at Phase 3 planning.
- [Phase 4]: Content differentiation strategy (min 400 unique words per page, noindex rules for stubs) must be defined before any SEO templates are built. Plan 04-01 is a spec-first gate.
- [Phase 5]: PredictHQ API pricing and data coverage need evaluation at Phase 5 planning. Reverse search PostGIS query design needs deeper research.

## Session Continuity

Last session: 2026-03-01
Stopped at: Roadmap created. STATE.md and ROADMAP.md written. REQUIREMENTS.md traceability updated.
Resume file: None
