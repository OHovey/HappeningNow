# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** The Timeline Map — an animated world map where users scrub through months and see pulsing dots for festivals, wildlife spectacles, and crowd levels appear and disappear
**Current focus:** Phase 3 — Visual Differentiators

## Current Position

Phase: 3 of 5 (Visual Differentiators)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-03-01 — Crowd heatmap overlay with toggle, month sync, click popup, crowd badge

Progress: [████████▓░] 47% (Phases 1-2 complete, Phase 3 Plan 1 complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 11
- Average duration: 3min
- Total execution time: 0.45 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-map-foundation | 7 | 19min | 3min |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 01 P03 | 18min | 2 tasks | 7 files |
| Phase 01 P05 | 3min | 2 tasks | 6 files |
| Phase 01 P06 | 3min | 2 tasks | 7 files |
| Phase 01 P07 | 2min | 2 tasks | 5 files |
| Phase 01 P08 | 1min | 2 tasks | 2 files |
| Phase 02 P01 | 4min | 3 tasks | 9 files |
| Phase 02 P02 | 2min | 2 tasks | 5 files |
| Phase 02 P03 | 2min | 2 tasks | 10 files |
| Phase 02 P04 | 4min | 2 tasks | 8 files |
| Phase 02 P05 | 1min | 2 tasks | 4 files |
| Phase 03 P01 | 4min | 2 tasks | 8 files |

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
- [01-03]: Raw SQL via exec_sql RPC for PostGIS geometry insertion (supabase-js has no native geometry support)
- [01-03]: Batch size 50 rows per insert to avoid Supabase timeout limits
- [01-03]: Dry-run mode works without Supabase credentials for CI validation
- [01-04]: Layer definitions as pure config objects (LayerSpecification) not imperative addLayer calls -- composable and testable
- [01-04]: Two-layer SSR isolation: 'use client' MapShell + next/dynamic ssr:false MapView
- [01-05]: Source-level filtering (filterGeoJSON + setData) not layer setFilter -- keeps cluster counts accurate
- [01-05]: At least one category must remain active -- prevents empty map confusion
- [01-06]: Affiliate URL builders omit tracking params when env vars missing -- CTAs always visible
- [01-06]: GeoJSON feature properties used directly from map click (no re-fetch from Supabase)
- [01-07]: Placeholder TAG_IDS (value 0) skip tagging calls -- form works without Kit dashboard config
- [01-07]: Interest checkboxes pre-check based on eventCategory for contextual subscriber segmentation
- [01-08]: TAG_IDS uses parseInt with fallback 0 -- existing guard means no behavioral change without env vars
- [02-01]: Zod installed as direct dependency for Route Handler validation
- [02-01]: 350ms debounce for moveend (within 300-500ms user constraint)
- [02-01]: AbortController per request prevents stale data from race conditions
- [02-01]: Filter changes trigger bbox re-fetch plus client-side refinement
- [02-01]: Awin wrapping opt-in via params; direct aid= links remain default until approval
- [02-02]: Test file uses .tsx extension for JSX support (project convention)
- [02-02]: Viewport saved to localStorage with exported saveViewport/getSavedViewport helpers
- [02-02]: MiniMap set to interactive:false for detail page embedding
- [02-03]: metadataBase added to layout.tsx for absolute OG image URL resolution
- [02-03]: Event coordinates deferred -- PostGIS WKB not extractable via supabase-js; needs future RPC
- [02-03]: Nearby events: region first, country second, temporal overlap as fallback
- [02-04]: PostGIS RPC (get_wildlife_with_route) to extract LineString route as GeoJSON since supabase-js cannot query geometry directly
- [02-04]: Month-aware active position: linear interpolation of current month within peak_months to proportional route coordinate index
- [02-04]: Wildlife affiliate CTA uses GetYourGuide only (species-based tour search), no Booking.com since wildlife pages lack destination context
- [02-05]: Bare ST_X/ST_Y without schema prefix, matching existing get_wildlife_with_route convention
- [02-05]: EventWithCoords uses Omit<Event, 'location'> to replace WKB geometry with extracted lng/lat
- [02-05]: migration_route_id FK on events links wildlife events to their parent migration route for route rendering on event detail pages
- [02-05]: computeActivePosition extracted from WildlifeContent to shared src/lib/route-utils.ts for reuse in EventContent
- [02-05]: Booking.com CTA hidden for wildlife events (category === 'wildlife') in AffiliateLinks.tsx; only GetYourGuide shown
- [02-05]: /wildlife/[slug] redirects to /event/[slug] when slug matches a wildlife event but not a migration route
- [03-01]: Heatmap layer added BEFORE cluster/event layers for correct z-order (heatmap below events)
- [03-01]: Browser Supabase client used for destination fetch in MapView (client component)
- [03-01]: setData used for month sync instead of setFilter because crowd_score property changes per month
- [03-01]: weather_data type fixed from {temp, rain, sunshine} to {temp_c, rain_days, sunshine_hours}

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 2]: Booking.com Awin affiliate approval is an external dependency with 2-4 week timeline. Start application at Phase 2 kickoff. Run Hotels.com (CJ) and Agoda applications in parallel as fallbacks.
- [Phase 3]: Wildlife migration data sources (eBird, BirdCast, manual curation) not yet enumerated. Needs investigation at Phase 3 planning.
- [Phase 4]: Content differentiation strategy (min 400 unique words per page, noindex rules for stubs) must be defined before any SEO templates are built. Plan 04-01 is a spec-first gate.
- [Phase 5]: PredictHQ API pricing and data coverage need evaluation at Phase 5 planning. Reverse search PostGIS query design needs deeper research.

## Session Continuity

Last session: 2026-03-01
Stopped at: Completed 03-01-PLAN.md (Crowd Heatmap Overlay)
Resume file: None
