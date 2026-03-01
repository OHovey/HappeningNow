# Requirements: HappeningNow.travel

**Defined:** 2026-03-01
**Core Value:** The Timeline Map — an animated world map where users scrub through months and see pulsing dots for festivals, wildlife spectacles, and crowd levels appear and disappear

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [x] **FOUND-01**: Next.js 15 project with TypeScript, Tailwind CSS v4, App Router deployed to Vercel
- [x] **FOUND-02**: Supabase PostgreSQL with PostGIS extension, all core tables created with spatial indexes
- [x] **FOUND-03**: Seed data: 500+ festivals, 100+ wildlife events, 30+ destinations with crowd/weather data curated and loaded
- [x] **FOUND-04**: Seed data: 10+ major migration routes as GeoJSON LineStrings

### Map & Core Experience

- [x] **MAP-01**: MapLibre GL JS renders interactive world map with OpenFreeMap tiles (client-only via next/dynamic)
- [x] **MAP-02**: Event markers display as colour-coded pulsing dots (orange=festivals, green=wildlife, blue=other) sized by event scale
- [x] **MAP-03**: Marker clustering at low zoom levels — numbered circles that expand on click/zoom
- [x] **MAP-04**: Timeline scrubber (horizontal 12-month slider) filters events with smooth animated transitions using setFilter() on pre-loaded data
- [x] **MAP-05**: Category toggle buttons (Festivals / Wildlife / All) show/hide marker layers
- [x] **MAP-06**: "What's happening this week" default view on page load showing current week's events
- [x] **MAP-07**: Month picker pills above the map for direct month selection (tappable month buttons, horizontally scrollable on mobile)
- [x] **MAP-08**: Click any event marker opens side panel with event details, photo, dates, description, and affiliate CTAs
- [x] **MAP-09**: Map controls: zoom, locate me, fullscreen

### Crowd Heatmap

- [x] **CROWD-01**: Crowd heatmap overlay toggle on main map (green→amber→red colour ramp)
- [x] **CROWD-02**: Heatmap synced to month scrubber — changes as user drags through months
- [x] **CROWD-03**: Heatmap renders below event markers (z-order) so events remain clickable
- [x] **CROWD-04**: Click heatmap region shows crowd detail popup with score, tourist numbers, and "quiet alternatives nearby" link
- [x] **CROWD-05**: Crowd indicators added to event popup ("Peak crowds" / "Low season — great timing!")

### Wildlife & Migration Tracker

- [x] **WILD-01**: Wildlife events appear alongside festival events on the Timeline Map as first-class content
- [x] **WILD-02**: Animated migration route paths on map (curved lines per species)
- [x] **WILD-03**: Pulse dot moves along each active route to show animal position based on selected month
- [x] **WILD-04**: Species toggle controls (Whales / Wildebeest / Butterflies / Birds / All)
- [x] **WILD-05**: Click route or dot shows popup with best viewing spots, peak dates, and tour affiliate links

### Destination Drilldown

- [x] **DEST-01**: `/destination/[slug]` SSG pages with map flyTo animation on navigation
- [x] **DEST-02**: 12-month calendar grid showing events, wildlife events, and crowd data per month
- [x] **DEST-03**: Crowd level displayed as green→red gradient background per month column
- [x] **DEST-04**: Weather summary per month (temperature, rain days, sunshine hours)
- [x] **DEST-05**: "Best time to visit" summary text per destination
- [x] **DEST-06**: Event/wildlife pills in calendar that expand to show details + affiliate links
- [x] **DEST-07**: Booking.com widget on destination page pre-filled with destination and best month

### Reverse Search

- [ ] **SRCH-01**: `/search` page with form: date range + location/airport + category filter + max travel distance
- [ ] **SRCH-02**: Nominatim geocoding for location input
- [ ] **SRCH-03**: PostGIS spatial query for events within radius of user location overlapping date range
- [ ] **SRCH-04**: "Worth the trip" scoring algorithm (event scale x uniqueness / crowd level x distance)
- [ ] **SRCH-05**: Results rendered as ranked cards with photo, travel time, crowd indicator, price range, affiliate links
- [ ] **SRCH-06**: Results simultaneously shown as highlighted markers on the map

### Event & Wildlife Detail Pages

- [ ] **PAGE-01**: `/event/[slug]` SSG detail pages with full event information
- [ ] **PAGE-02**: `/wildlife/[slug]` SSG detail pages with viewing info, best times, tour links
- [x] **PAGE-03**: Event schema JSON-LD structured data on all event pages
- [x] **PAGE-04**: Open Graph meta tags for social sharing on all detail pages
- [x] **PAGE-05**: Breadcrumb navigation on all pages

### Programmatic SEO

- [ ] **SEO-01**: `/festivals/[region]/[month]` pages (~120 pages) with filtered events + map + intro text
- [ ] **SEO-02**: `/festivals/[country]` pages (~80 pages) with country event list + calendar
- [ ] **SEO-03**: `/festivals/[country]/[month]` pages (~960 pages) with filtered event list
- [ ] **SEO-04**: `/wildlife/[region]` pages (~15 pages) with wildlife events by region
- [ ] **SEO-05**: `/wildlife/[species]` pages (~50 pages) with all viewing locations per species
- [ ] **SEO-06**: `/wildlife/[region]/[month]` pages (~180 pages) with what to see where, when
- [ ] **SEO-07**: `/what-to-do/[destination]/[month]` pages (~2000+ pages) with combined events + crowd + weather
- [ ] **SEO-08**: Each programmatic page includes unique AI-generated intro (2-3 sentences) with strategy to avoid AI content detection
- [ ] **SEO-09**: Each page includes pre-filtered embedded map, event cards, affiliate links, internal links, email capture
- [ ] **SEO-10**: XML sitemap generated from seo_pages table
- [ ] **SEO-11**: robots.txt and sitemap submission config
- [ ] **SEO-12**: ISR (revalidate = 86400) for programmatic pages instead of full SSG to avoid Vercel build timeout

### Affiliate & Monetisation

- [x] **AFFL-01**: Booking.com affiliate deep links with destination ID + dates on event panels and detail pages
- [x] **AFFL-02**: GetYourGuide/Viator affiliate deep links for experiences/tours on event and wildlife pages
- [x] **AFFL-03**: Affiliate CTAs contextually placed at moment of discovery intent (side panel, detail pages, search results)

### Email & Growth

- [x] **EMAIL-01**: Email capture component (inline form, not intrusive popup) on all pages
- [x] **EMAIL-02**: ConvertKit API integration for email submissions
- [x] **EMAIL-03**: Interest-based tagging on subscribe (festivals / wildlife / region preferences) -- requires KIT_TAG_FESTIVALS and KIT_TAG_WILDLIFE env vars from Kit dashboard
- [ ] **EMAIL-04**: Alert signup: "Alert me about events in [region]"

### AI Discoverability

- [ ] **AIDX-01**: llms.txt file at site root describing site purpose, data structure, and key pages for LLM crawlers
- [ ] **AIDX-02**: llms-full.txt with comprehensive structured data about events, destinations, and wildlife for AI model ingestion
- [ ] **AIDX-03**: Clean, semantic HTML structure optimised for AI content extraction (clear headings, data attributes, structured tables)

### Performance & Polish

- [x] **PERF-01**: Lighthouse mobile score > 90
- [x] **PERF-02**: Map initial load < 2 seconds
- [x] **PERF-03**: API response time < 200ms with PostGIS spatial indexes
- [x] **PERF-04**: Responsive design: mobile-first for all components, touch-optimised map
- [x] **PERF-05**: Error boundaries and loading states throughout
- [x] **PERF-06**: Analytics integration (Plausible or Umami — privacy-focused, no cookie banner)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Data Scaling

- **SCALE-01**: Wikipedia scraping pipeline for festival lists (top 30 countries)
- **SCALE-02**: PredictHQ API integration for automated event discovery
- **SCALE-03**: Songkick API integration for music events
- **SCALE-04**: Weekly cron job for new event discovery and data refresh
- **SCALE-05**: Data validation pipeline (deduplication, geocoding, anomaly flagging)

### Enhanced Monetisation

- **MON-01**: Amazon Associates integration for travel gear recommendations
- **MON-02**: Display ads (Ezoic initially, Mediavine at scale)
- **MON-03**: Email nurture sequences for affiliate conversion

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User accounts / profiles | Auth complexity, GDPR surface area, login wall friction. Use URL state for saved filters. |
| User-generated event submissions | Spam, moderation overhead, data quality collapse. Curation is a competitive advantage. |
| Real-time event data / websockets | Travel events are seasonal, not live. ISR revalidation (24h) is sufficient. |
| Full booking flow (in-product checkout) | Requires PCI compliance, customer support. Let Booking.com/GYG handle checkout via affiliate links. |
| Ticketing / event registration | Different business model. Link to official ticket pages instead. |
| Social feed / community timeline | Dead social feed is worse than none. Focus on content that gets shared externally. |
| Native mobile app | PWA achieves near-native. Revisit only after product-market fit confirmed. |
| AI trip planning chatbot | LLM API costs, hallucination risk on dates. Be the source AI tools reference, not compete with them. |
| Video hosting | Bandwidth/CDN costs. Use YouTube embeds if needed. |
| Real-time weather API | Paid API, wrong granularity (event is months away). Use static historical climate data. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| MAP-01 | Phase 1 | Complete |
| MAP-02 | Phase 1 | Complete |
| MAP-03 | Phase 1 | Complete |
| MAP-04 | Phase 1 | Complete |
| MAP-05 | Phase 1 | Complete |
| MAP-06 | Phase 1 | Complete |
| MAP-07 | Phase 1 | Complete |
| MAP-08 | Phase 1 | Complete |
| MAP-09 | Phase 1 | Complete |
| AFFL-01 | Phase 1 | Complete |
| AFFL-02 | Phase 1 | Complete |
| AFFL-03 | Phase 1 | Complete |
| EMAIL-01 | Phase 1 | Complete |
| EMAIL-02 | Phase 1 | Complete |
| EMAIL-03 | Phase 1 | Complete |
| PERF-04 | Phase 1 | Complete |
| PERF-05 | Phase 1 | Complete |
| PERF-06 | Phase 1 | Complete |
| PAGE-03 | Phase 2 | Complete |
| PAGE-04 | Phase 2 | Complete |
| PAGE-05 | Phase 2 | Complete |
| PERF-02 | Phase 2 | Complete |
| PERF-03 | Phase 2 | Complete |
| CROWD-01 | Phase 3 | Complete |
| CROWD-02 | Phase 3 | Complete |
| CROWD-03 | Phase 3 | Complete |
| CROWD-04 | Phase 3 | Complete |
| CROWD-05 | Phase 3 | Complete |
| WILD-01 | Phase 3 | Complete |
| WILD-02 | Phase 3 | Complete |
| WILD-03 | Phase 3 | Complete |
| WILD-04 | Phase 3 | Complete |
| WILD-05 | Phase 3 | Complete |
| DEST-01 | Phase 3 | Complete |
| DEST-02 | Phase 3 | Complete |
| DEST-03 | Phase 3 | Complete |
| DEST-04 | Phase 3 | Complete |
| DEST-05 | Phase 3 | Complete |
| DEST-06 | Phase 3 | Complete |
| DEST-07 | Phase 3 | Complete |
| PERF-01 | Phase 3 | Complete |
| SEO-01 | Phase 4 | Pending |
| SEO-02 | Phase 4 | Pending |
| SEO-03 | Phase 4 | Pending |
| SEO-04 | Phase 4 | Pending |
| SEO-05 | Phase 4 | Pending |
| SEO-06 | Phase 4 | Pending |
| SEO-07 | Phase 4 | Pending |
| SEO-08 | Phase 4 | Pending |
| SEO-09 | Phase 4 | Pending |
| SEO-10 | Phase 4 | Pending |
| SEO-11 | Phase 4 | Pending |
| SEO-12 | Phase 4 | Pending |
| PAGE-01 | Phase 4 | Pending |
| PAGE-02 | Phase 4 | Pending |
| AIDX-01 | Phase 4 | Pending |
| AIDX-02 | Phase 4 | Pending |
| AIDX-03 | Phase 4 | Pending |
| SRCH-01 | Phase 5 | Pending |
| SRCH-02 | Phase 5 | Pending |
| SRCH-03 | Phase 5 | Pending |
| SRCH-04 | Phase 5 | Pending |
| SRCH-05 | Phase 5 | Pending |
| SRCH-06 | Phase 5 | Pending |
| EMAIL-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 57 total
- Mapped to phases: 57
- Unmapped: 0

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 — traceability populated during roadmap creation*
