# Roadmap: HappeningNow.travel

## Overview

HappeningNow.travel ships in five phases, each delivering a coherent, verifiable capability that unblocks the next. Phase 1 establishes the map foundation and seed data — the dependency root the entire product sits on. Phase 2 hardens the database schema and wires affiliate revenue infrastructure before any data is loaded or links are shipped. Phase 3 adds the visual differentiators (crowd heatmaps, wildlife migration animations, destination dashboards) that make SEO pages non-thin. Phase 4 rolls out the programmatic SEO engine at scale — 3,500+ pages built on the rich data from earlier phases. Phase 5 closes the loop with reverse search, email growth infrastructure, and the data pipeline for scaling beyond manual curation.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Map Foundation** - Interactive world map with timeline scrubber, event markers, and seed data live and explorable (completed 2026-03-01)
- [ ] **Phase 2: Database and Affiliate Infrastructure** - Production PostGIS schema with correct spatial types, spatial query API, and affiliate link infrastructure wired
- [ ] **Phase 3: Visual Differentiators** - Crowd heatmap, wildlife migration animations, and destination 12-month dashboard added to the working map
- [ ] **Phase 4: Programmatic SEO** - 3,500+ statically generated SEO pages live with structured data, sitemaps, and ISR
- [ ] **Phase 5: Growth and Data Scale** - Reverse search, email segmentation, and automated data pipeline operational

## Phase Details

### Phase 1: Map Foundation
**Goal**: Users can explore a live interactive world map, scrub through months to see events appear and disappear, filter by category, click any event to see details, and sign up for email updates
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, MAP-01, MAP-02, MAP-03, MAP-04, MAP-05, MAP-06, MAP-07, MAP-08, MAP-09, AFFL-01, AFFL-02, AFFL-03, EMAIL-01, EMAIL-02, EMAIL-03, PERF-04, PERF-05, PERF-06
**Success Criteria** (what must be TRUE):
  1. User loads the site and sees a world map with pulsing, colour-coded event markers immediately visible without a loading spinner
  2. User drags the month scrubber and markers appear and disappear smoothly with no jank or stutter
  3. User clicks Festivals or Wildlife toggle buttons and the correct subset of markers shows or hides
  4. User clicks any event marker and sees a side panel with the event name, photo, description, dates, and Booking.com/GetYourGuide affiliate links
  5. User submits their email address on the capture form and the form confirms subscription without a page reload
**Plans**: 8 plans

Plans:
- [ ] 01-01-PLAN.md — Project scaffold: Next.js 15 + TypeScript + Tailwind v4 + Plausible analytics + error boundaries + Vitest
- [ ] 01-02-PLAN.md — Supabase schema: PostgreSQL + PostGIS tables, geometry columns, GiST indexes, TypeScript client helpers
- [ ] 01-03-PLAN.md — Seed data: 500+ festivals, 100+ wildlife events, 30+ destinations, 10+ migration routes loaded to Supabase
- [ ] 01-04-PLAN.md — Map shell: MapLibre GL JS client island with circle layers, pulsing markers, clustering, zoom/locate/fullscreen
- [ ] 01-05-PLAN.md — Timeline scrubber and category toggles: source-level filtering, month pills, current-month default view
- [ ] 01-06-PLAN.md — Event detail panel: bottom sheet, hero image, crowd badge, Booking.com + GYG affiliate CTAs
- [ ] 01-07-PLAN.md — Email capture: Kit API v4 integration, inline form in bottom sheet, interest tagging
- [ ] 01-08-PLAN.md — Gap closure: update MAP-07 requirement text, env-var-driven Kit tag IDs

### Phase 2: Database and Affiliate Infrastructure
**Goal**: The PostGIS schema is production-hardened with correct spatial column types and verified query performance, the spatial events API is live, and affiliate deep links are generating correct URLs for Booking.com (via Awin) and GetYourGuide
**Depends on**: Phase 1
**Requirements**: PAGE-03, PAGE-04, PAGE-05, PERF-02, PERF-03
**Success Criteria** (what must be TRUE):
  1. A PostGIS bounding-box query for events within any viewport returns results in under 200ms as verified by EXPLAIN ANALYZE
  2. Booking.com affiliate deep links in event panels open the correct Booking.com search page with destination and dates pre-filled
  3. GetYourGuide affiliate deep links open the correct GYG experience search page for the event location
  4. The map initial load completes in under 2 seconds on a standard broadband connection
  5. Breadcrumb navigation appears on all detail pages and is correctly structured
**Plans**: 5 plans

Plans:
- [ ] 02-01-PLAN.md — Bbox RPC function, /api/events Route Handler with Zod, MapView bbox integration
- [ ] 02-02-PLAN.md — Shared UI components: Breadcrumbs (+ JSON-LD), FTC disclosure, BackToMap, MiniMap
- [ ] 02-03-PLAN.md — /event/[slug] SSG pages with JSON-LD Event schema, OG tags, hero, nearby events
- [ ] 02-04-PLAN.md — /wildlife/[slug] SSG pages with JSON-LD, OG tags, migration route mini map
- [ ] 02-05-PLAN.md — Gap closure: PostGIS RPC for event coordinates, wire MiniMap on event detail pages

### Phase 3: Visual Differentiators
**Goal**: Users can toggle a crowd heatmap that shifts colours as they scrub through months, watch animated migration routes with a moving position dot, and visit destination pages showing a full 12-month events, crowds, and weather grid
**Depends on**: Phase 2
**Requirements**: CROWD-01, CROWD-02, CROWD-03, CROWD-04, CROWD-05, WILD-01, WILD-02, WILD-03, WILD-04, WILD-05, DEST-01, DEST-02, DEST-03, DEST-04, DEST-05, DEST-06, DEST-07, PERF-01
**Success Criteria** (what must be TRUE):
  1. User toggles the heatmap overlay and sees a green-to-red colour gradient across destinations that changes smoothly as the month scrubber moves
  2. User clicks a heatmap region and sees a popup showing crowd score, tourist volume estimate, and a link to quieter alternatives
  3. User watches a migration route animate — a dot moves along the path for the selected month, and clicking it shows best viewing spots, peak dates, and tour links
  4. User navigates to a destination page and sees a 12-column calendar grid showing events, wildlife, crowd gradient, and weather summary per month
  5. Mobile Lighthouse performance score is above 90 on the destination page and homepage
**Plans**: TBD

Plans:
- [ ] 03-01: Crowd heatmap — MapLibre HeatmapLayer with green-to-red ramp, synced to month scrubber via setFilter(), rendered below event markers, click popup
- [ ] 03-02: Wildlife migration animations — LineLayer per species with requestAnimationFrame dot position based on selected month, species toggles, viewing spot popup
- [ ] 03-03: Destination drilldown pages — /destination/[slug] SSG, 12-month calendar grid, crowd gradient columns, weather summaries, best-time-to-visit text, Booking.com widget

### Phase 4: Programmatic SEO
**Goal**: Search engines can discover and index 3,500+ unique, content-rich pages covering festivals by region and month, wildlife by region and species, and destination month guides — all with structured data, canonical URLs, and a submitted sitemap
**Depends on**: Phase 3
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, SEO-07, SEO-08, SEO-09, SEO-10, SEO-11, SEO-12, PAGE-01, PAGE-02, AIDX-01, AIDX-02, AIDX-03
**Success Criteria** (what must be TRUE):
  1. Google Search Console shows 3,500+ pages indexed with no manual actions or mass deindexation warnings within 30 days of launch
  2. Every programmatic page contains a unique 2-3 sentence intro, a filtered embedded map, event cards with affiliate links, internal links, and an email capture form
  3. An XML sitemap index is served at /sitemap.xml and accepted by Google Search Console without errors
  4. Every event and wildlife detail page has valid JSON-LD Event structured data verified by Google's Rich Results Test
  5. A page not pre-generated at build time is served via ISR on first request and cached at the CDN edge within 60 seconds
**Plans**: TBD

Plans:
- [ ] 04-01: Content differentiation spec — define unique content strategy per page type before any template is built; set noindex rules for stub pages
- [ ] 04-02: Festival SEO pages — /festivals/[region]/[month], /festivals/[country], /festivals/[country]/[month] with ISR and generateStaticParams
- [ ] 04-03: Wildlife SEO pages — /wildlife/[region], /wildlife/[species], /wildlife/[region]/[month] with ISR
- [ ] 04-04: What-to-do pages — /what-to-do/[destination]/[month] (~2000+ pages) with ISR, AI-generated intros, full content components
- [ ] 04-05: Sitemap and technical SEO — next-sitemap XML index from seo_pages table, robots.txt, canonical URLs, sitemap submission
- [ ] 04-06: AI discoverability — llms.txt and llms-full.txt at site root, semantic HTML optimisation for LLM crawlers

### Phase 5: Growth and Data Scale
**Goal**: Users can search for events near their location within a date range and get ranked results, email subscribers receive interest-matched content, and the event database can grow beyond manual curation through automated data ingestion
**Depends on**: Phase 4
**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-04, SRCH-05, SRCH-06, EMAIL-04
**Success Criteria** (what must be TRUE):
  1. User enters a location, date range, and category on the search page and receives a ranked list of events within their specified radius, with travel time, crowd level, and affiliate links
  2. The ranked results also appear as highlighted markers on the embedded map, visually distinguishing them from unfiltered events
  3. User subscribes with a region preference and receives a confirmation that an alert is active for that region
  4. A new event submitted through the data pipeline appears on the live map within 24 hours without a manual build or deploy
**Plans**: TBD

Plans:
- [ ] 05-01: Reverse search — /search page, Nominatim geocoding (server-side cached), PostGIS ST_DWithin date-overlap query, "worth the trip" scoring, ranked cards, map highlight
- [ ] 05-02: Email growth — ConvertKit region alert signup, interest-based segmentation sequences, alert trigger workflow
- [ ] 05-03: Data pipeline — Wikipedia scraping for festival discovery, PredictHQ API integration (free tier), deduplication and geocoding, automated ingestion workflow

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Map Foundation | 8/8 | Complete    | 2026-03-01 |
| 2. Database and Affiliate Infrastructure | 0/4 | Not started | - |
| 3. Visual Differentiators | 0/3 | Not started | - |
| 4. Programmatic SEO | 0/6 | Not started | - |
| 5. Growth and Data Scale | 0/3 | Not started | - |
