# Project Research Summary

**Project:** HappeningNow.travel
**Domain:** Interactive travel events discovery map — festivals, wildlife migrations, crowd calendars with affiliate monetisation and programmatic SEO
**Researched:** 2026-03-01
**Confidence:** HIGH (stack and architecture verified against official docs; features MEDIUM via competitor analysis; pitfalls MEDIUM-HIGH via community reports and official sources)

---

## Executive Summary

HappeningNow.travel is a WebGL-powered travel discovery platform that combines an animated, month-by-month world event map with programmatic SEO at scale (~3,500 pages) and affiliate monetisation via accommodation and experiences deep links. No direct competitor offers the combination of a temporal animated map, crowd heatmap overlays, and wildlife migration routes as first-class content — this creates a genuine differentiation opportunity, not incremental improvement on existing products. The technical foundation is well-understood: Next.js 15 App Router with MapLibre GL JS and Supabase PostGIS is the canonical, zero-cost-at-launch stack for this type of application.

The recommended approach is to build in clearly separated layers that unblock each other. The interactive map and seed data must come first — the product literally does not exist without them, and every subsequent feature (heatmaps, SEO pages, affiliate CTAs, reverse search) depends on a working map with quality event data. The critical architectural insight is to keep MapLibre isolated as a single client island while keeping all SEO content in Server Components, so the site achieves both interactive richness and full crawler accessibility without compromise. Total infrastructure cost at launch is approximately $20/month (Vercel Pro only — required because the site earns affiliate revenue, making Hobby tier a ToS violation).

The primary risks are technical and content-quality rather than strategic. Two pitfalls in particular must be addressed before significant code is written: (1) using `setFilter()` not `setData()` for the timeline scrubber — the wrong choice causes visible jank on the core differentiating feature; and (2) applying to Booking.com's affiliate program via Awin before building any link infrastructure — the program changed in May 2025 and new affiliates must now apply through Awin, with rejections being common for sites without traffic history. A third risk is SEO-side: generating 3,500 thin, templated pages will trigger Google's doorway page filter and result in mass deindexation. Content differentiation strategy must be defined before templates are built.

---

## Key Findings

### Recommended Stack

The stack is unanimous across all research dimensions. Next.js 15 App Router with TypeScript handles both the interactive map shell (Client Component island) and the 3,500+ programmatic SEO pages (SSG + ISR via `generateStaticParams`). MapLibre GL JS 5.x replaces Mapbox as the zero-cost WebGL map renderer — same pipeline, no per-load billing. Supabase with PostGIS provides spatial queries (`ST_DWithin`, `<->` nearest-neighbour, bounding box `&&`) at no cost within free tier limits. OpenFreeMap tiles complete the fully free map stack.

Vercel Pro is required from day one — not Hobby — because affiliate revenue makes this a commercial product (Hobby is explicitly non-commercial). The total cost at launch is ~$20/month, with everything else on free tiers.

**Core technologies:**
- **Next.js 15.5** — App Router for both SSG SEO pages and server-side data fetching; `generateStaticParams` for 3,500-page static generation
- **MapLibre GL JS 5.x + react-map-gl 8.1.0** — WebGL map rendering at zero variable cost; import via `react-map-gl/maplibre`, load with `next/dynamic ssr: false`
- **Supabase (PostgreSQL + PostGIS)** — spatial queries, GiST indexes, instant REST API; use `geometry(Point, 4326)` not `geography` for 5-10x query speed
- **Tailwind CSS v4** — 3.5x faster builds; CSS-first config; required for rapid iteration across page variants
- **OpenFreeMap** — free unlimited tile hosting, no API key, attributions auto-applied; configure URL as env var with Protomaps fallback
- **Zod v4** — schema validation for all Supabase responses and API inputs; 14x faster than v3
- **Zustand** — purpose-split client stores (map state, filter state, UI state) to prevent cross-concern re-renders
- **@supabase/ssr (not @supabase/auth-helpers)** — the auth-helpers package is deprecated; @supabase/ssr is the only supported path
- **ConvertKit (Kit)** — email capture with interest-based segmentation; free to 10k subscribers; no SDK, simple REST fetch
- **Vercel Pro ($20/month)** — required for commercial use; ISR, 1TB bandwidth, no build limits

See `.planning/research/STACK.md` for full version compatibility matrix, installation commands, and cost breakdown.

### Expected Features

The product has a clear three-tier feature structure. Table stakes are what users assume exist (and competitors already have); differentiators are what make this worth building; anti-features are scope traps to avoid.

**Must have at launch (table stakes + core differentiators):**
- Interactive world map with zoomable, clustered event markers — product does not exist without this
- Animated timeline scrubber (month 1-12) that drives marker visibility — the primary differentiator; must be butter-smooth using `setFilter()` not `setData()`
- Category toggles (festivals / wildlife / both) — required for usability above 100 markers
- Event detail side panel with affiliate CTAs (Booking.com via Awin + GetYourGuide) — the conversion step
- Seed data: 100+ festivals, 30+ wildlife events, 10+ destinations — below this the map looks empty
- 5-10 static destination SSG pages with JSON-LD Event schema — test SEO template before scaling
- Mobile-responsive design, Lighthouse >90 — over 60% of travel discovery is on mobile
- Email capture (ConvertKit) with interest tagging — list building starts at launch

**Should have after initial validation:**
- Crowd heatmap overlay synced to scrubber — builds on working scrubber; needs per-destination crowd data
- Wildlife migration route animations — high-share visual; requires 500+ wildlife events and manual path curation
- Full programmatic SEO rollout (3,500+ pages) — scale from proven template; trigger: 3 pages ranking in top 10
- Destination 12-month dashboard (events + crowds + weather grid) — genuinely novel planning tool
- Location-based search (Nominatim + PostGIS `ST_DWithin`)
- Data pipeline (Wikipedia scraping + PredictHQ) for scale beyond manual curation

**Defer to v2+:**
- "I have a week off" reverse search tool — high value but needs 2,000+ events to return rich results
- Native PWA / installable app — responsive web is sufficient until product-market fit confirmed
- AI trip planning chatbot — LLM hallucination on festival dates destroys trust; make the site the source that AI tools reference
- Amazon Associates — lower commission (1-4.5%), lower priority than Booking.com/GYG

**Anti-features (deliberate out-of-scope):**
- User accounts — adds auth complexity, GDPR surface area, login friction that kills SEO conversion
- User-generated event submissions — UGC without moderation budget = data quality collapse
- Real-time event data — events are seasonal, not live; ISR is sufficient
- Full OTA booking flow — PCI compliance, customer support, supplier contracts; affiliate deep links handle this at zero cost
- Self-hosted video — bandwidth costs, encoding pipeline, rights issues; YouTube embeds only

See `.planning/research/FEATURES.md` for full competitor analysis, feature dependency map, and prioritisation matrix.

### Architecture Approach

The architecture separates into two distinct runtime modes: a client-side interactive map shell (one `'use client'` boundary at `MapShell.tsx`) and server-rendered SEO content pages. This boundary is fundamental — MapLibre requires browser APIs that do not exist server-side, and mixing the two causes build failures or hydration mismatches. The map island receives `initialEvents` as props from a Server Component that queries Supabase at render time, eliminating client-side data fetch waterfalls. Client state is managed by three purpose-split Zustand stores (map viewport, filter state, UI state) to prevent cross-concern re-renders.

**Major components:**
1. **MapShell (Client Component)** — owns the MapLibre GL JS instance; initialised via `useEffect`; never unmounted; loaded with `next/dynamic ssr: false`
2. **GeoJSON Source + Layer architecture** — all event markers render as MapLibre `SymbolLayer` from a single GeoJSON source; filtered via `map.setFilter()` on scrub; clustering via `cluster: true` on the source; no DOM markers
3. **Zustand filterStore** — `selectedMonth`, `activeCategories`, `filteredEvents` (derived); drives all marker visibility; shared between map and sidebar
4. **SSG pages with `generateStaticParams`** — `/festivals/[region]/[month]`, `/wildlife/[region]`, `/destinations/[slug]/[month]`; pre-rendered at build time; `revalidate = 86400` for daily freshness; served from Vercel CDN edge
5. **Next.js Route Handlers** — `/api/events?bbox=&month=&category=` for viewport-bound fetching; thin layer over Supabase; apply validation; return GeoJSON
6. **Supabase PostGIS** — `geometry(Point, 4326)` columns with GiST indexes; bounding box queries (`&&`) for viewport filtering; `<->` for distance sort; `ST_DWithin` for radius search
7. **lib/affiliate/** — pure functions that construct Booking.com (Awin) and GetYourGuide deep links from event data; no API calls; isolated from UI components

Data flow: Server Component prefetches initial events → passes as props to MapShell → map renders immediately → timeline scrub updates Zustand filter → `filteredEvents` selector recomputes → `source.setData(filtered)` runs in `useEffect` → MapLibre re-renders in WebGL (<16ms). On significant pan/zoom, a debounced fetch to `/api/events?bbox=...` retrieves new events and merges into the store.

See `.planning/research/ARCHITECTURE.md` for full project structure, code examples for each pattern, data flow diagrams, and scaling considerations.

### Critical Pitfalls

The research surfaced 7 critical pitfalls, each with a phase assignment indicating when it must be addressed.

1. **MapLibre SSR crash ("window is not defined")** — MapLibre accesses browser APIs at import time, crashing Next.js builds. Prevention: wrap in `next/dynamic` with `{ ssr: false }`; never import `maplibre-gl` in any server-touched file. Must be established in Phase 1 before any other map code is written.

2. **Timeline scrubber jank from `source.setData()` on every scrub** — Re-uploading GeoJSON to the GPU on each frame causes visible stuttering. Prevention: load all events once into a single GeoJSON source; use `map.setFilter()` on the layer (GPU expression, no data re-upload) when the scrubber moves. This is a Phase 1 architectural decision — retrofitting is a 1-2 day rewrite.

3. **Booking.com affiliate program requires Awin approval** — Booking.com terminated direct affiliate relationships with small publishers in May 2025 ("Bookinggeddon"). New affiliates must apply through Awin, and new sites with no traffic history face lengthy approval queues or rejection. Prevention: apply to Awin before writing any link-generation code; build Hotels.com/Agoda as fallback programs in parallel.

4. **Programmatic SEO thin content causes mass deindexation** — 3,500 pages that differ only in location/month/event name are classified as doorway pages. Recovery takes months. Prevention: minimum 400 unique words per page; 3+ unique facts per festival; `noindex` on any stub page where unique content cannot be guaranteed. Content differentiation strategy must be written before templates are built.

5. **PostGIS `geography` type is 5-10x slower than `geometry`** — Using `geography` for event coordinates causes spherical earth calculations on every spatial query, breaking the 200ms API response target. Prevention: use `geometry(Point, 4326)` with explicit GiST indexes; verify with `EXPLAIN ANALYZE` before launch.

6. **Vercel build timeout with 3,500 SSG pages** — Generating all pages at build time risks hitting Vercel's 45-minute timeout. Prevention: use ISR with `dynamicParams = true`; pre-generate only top 100-200 pages by search volume at build time; serve the rest on first request.

7. **Supabase free tier pauses after 7 days of inactivity** — Development sprints that don't touch the API trigger project pauses with 30-90s cold starts and potential data loss on restore. Prevention: GitHub Actions keep-alive cron every 5 days during development; budget $25/month for Supabase Pro before production launch.

See `.planning/research/PITFALLS.md` for full pitfall details, integration gotchas, performance traps, security checklist, and "looks done but isn't" verification checklist.

---

## Implications for Roadmap

Research points strongly toward a 5-phase structure where each phase unblocks the next and all critical pitfalls are addressed at their correct moment.

### Phase 1: Map Foundation and Seed Data

**Rationale:** The interactive map and event data are the dependency root of the entire product. Every downstream feature — affiliate CTAs, SEO pages, heatmaps, migration animations — requires both a working map and quality seed data. Building the map correctly from the start (correct `next/dynamic` pattern, `setFilter()` architecture, GeoJSON symbol layers) prevents the two most painful retrofits in the codebase.

**Delivers:** Working interactive world map with timeline scrubber, category toggles, event detail side panel, and initial seed data (100+ festivals, 30+ wildlife events, 10+ destinations).

**Features addressed:** Interactive map + markers, timeline scrubber (animated), category toggles, event detail panel, mobile-responsive design, email capture.

**Pitfalls must address:**
- MapLibre SSR isolation with `next/dynamic ssr: false` — before any map code is written
- `setFilter()` architecture for timeline scrubber — architectural decision, not retrofittable
- GeoJSON SymbolLayer (not DOM markers) — established before seed data is loaded

**Research flag:** Standard patterns — well-documented. Skip phase research.

---

### Phase 2: Database Foundation and Affiliate Infrastructure

**Rationale:** The Supabase schema and PostGIS spatial index choices are extremely difficult to change after data is loaded and API contracts are established. Affiliate program approval takes weeks and blocks all monetisation work. Both must be done early, before they become blockers.

**Delivers:** Production-ready PostGIS schema with correct `geometry` types and GiST indexes, spatial query API (`/api/events?bbox=`), affiliate link infrastructure (Booking.com via Awin + GetYourGuide), Supabase keep-alive setup, FTC disclosure component.

**Features addressed:** Location-based search (PostGIS ST_DWithin), affiliate deep links (Booking.com + GYG), viewport-bound event fetching, event detail affiliate CTAs.

**Pitfalls must address:**
- `geometry(Point, 4326)` not `geography` — schema decision before data load
- GiST indexes on all geometry columns — verified with `EXPLAIN ANALYZE`
- Supabase keep-alive GitHub Actions workflow — before any persistent data
- Booking.com Awin affiliate approval — apply at phase start; do not build link logic until approval confirmed
- FTC affiliate disclosure — sitewide footer + page-level before any affiliate links ship

**Research flag:** Awin affiliate application process and approval timeline needs validation. Apply immediately at phase start.

---

### Phase 3: Visual Differentiators

**Rationale:** With the map foundation and data stable, the features that create the "wow" moments — crowd heatmaps and wildlife migration animations — can be built on top of the working scrubber. These are high-complexity features that benefit from a stable base. They are also the features most likely to drive social sharing and return visits.

**Delivers:** Crowd heatmap overlay synced to the month scrubber (green-to-red, per destination per month), wildlife migration route animations (MapLibre LineLayer with `requestAnimationFrame`), destination 12-month dashboard (events + crowds + weather grid).

**Features addressed:** Crowd heatmap overlay, wildlife migration animations, destination 12-month dashboard.

**Pitfalls must address:**
- Animation cleanup (`map.remove()` in useEffect return) — memory leak invisible in short sessions
- Mobile WebGL performance testing on mid-range Android — performance gaps vs desktop are dramatic
- OpenFreeMap tile URL as environment variable with Protomaps fallback — before traffic-dependent features ship

**Research flag:** Wildlife migration path data sources (eBird, BirdCast, manual curation) need assessment at phase planning. Animation performance at 30+ simultaneous paths needs load testing.

---

### Phase 4: Programmatic SEO at Scale

**Rationale:** SEO must come after the visual differentiators are stable because: (a) the destination 12-month dashboard is the content that makes SEO pages non-thin; (b) the map data enrichment needed for quality pages also enriches the map experience; (c) SEO results take 60-90 days to manifest regardless of when pages are published. The content differentiation strategy must be fully defined before the template is built.

**Delivers:** 3,500+ programmatic SEO pages (`/festivals/[region]/[month]`, `/wildlife/[region]`, `/destinations/[slug]/[month]`) using ISR with partial pre-build, JSON-LD Event structured data, `next-sitemap` sitemap index, OG tags, canonical URLs.

**Features addressed:** Programmatic SEO pages (3,500+), event schema JSON-LD, OG/social metadata, `next-sitemap` sitemap generation.

**Pitfalls must address:**
- ISR + `dynamicParams = true` strategy — pre-generate top 100-200 pages only; rest generated on demand; keeps build under 5 minutes
- Content differentiation per page type — defined in a spec before templates are built; minimum 400 unique words; `noindex` on stubs
- ISR revalidation storm — stagger `revalidate` values across page types; use targeted `revalidatePath` for updates
- `EXPLAIN ANALYZE` on all spatial queries before indexing begins

**Research flag:** Content differentiation spec requires human judgment — what constitutes "unique enough" for each page category. Template design needs careful review against thin content criteria before rollout.

---

### Phase 5: Growth and Data Scale

**Rationale:** After the core product is live and receiving organic traffic, growth features become viable. The reverse search tool requires 2,000+ events to return rich results. Email segmentation sequences require 500+ subscribers. The data pipeline (Wikipedia scraping + PredictHQ) is needed when manual curation becomes the bottleneck rather than a choice.

**Delivers:** "I have a week off" reverse search (PostGIS + date-overlap query), interest-based email segmentation sequences (ConvertKit), automated data pipeline for event enrichment at scale, location-based search UI (Nominatim geocoding).

**Features addressed:** Reverse search tool, email segmentation sequences, data pipeline (Wikipedia + PredictHQ), location search.

**Pitfalls must address:**
- Nominatim rate limiting (1 req/sec) — server-side only, cache all geocoding results permanently in Supabase
- Reverse search PostGIS query complexity — requires careful query planning and index verification

**Research flag:** PredictHQ API costs and data coverage need evaluation at phase planning. Reverse search PostGIS query design (date overlap + radius + category ranking) needs deeper research before implementation.

---

### Phase Ordering Rationale

- **Data before features:** Seed data is a dependency of the map, which is a dependency of everything else. The feature dependency graph from FEATURES.md makes this explicit.
- **Schema before data:** PostGIS column types and indexes cannot be easily changed after data is loaded. Phase 2 schema work is non-negotiable before Phase 1 seed loading.
- **Affiliate approval before affiliate code:** Phase 2 starts the Awin application immediately; Phase 2 completes the link infrastructure only after approval. This respects the 2-4 week approval timeline.
- **Differentiators before SEO:** The destination 12-month dashboard (Phase 3) is what prevents SEO pages (Phase 4) from being thin. Building them in the wrong order creates rework.
- **Vertical slice first:** The MVP (Phase 1 + 2) delivers a complete, monetisable product. Every subsequent phase adds depth, not breadth.

### Research Flags

Phases needing deeper research during planning (via `/gsd:research-phase`):
- **Phase 3 (Visual Differentiators):** Wildlife migration data sources and API coverage; animation performance at scale needs benchmarking
- **Phase 5 (Growth and Data Scale):** PredictHQ API pricing and coverage; reverse search query design; Nominatim rate limiting mitigations at data pipeline scale

Phases with well-documented patterns (skip research-phase):
- **Phase 1 (Map Foundation):** MapLibre + Next.js + react-map-gl patterns are thoroughly documented with official examples
- **Phase 2 (Database Foundation):** PostGIS + Supabase patterns are official-doc-verified; Awin application is an external process not a technical problem
- **Phase 4 (Programmatic SEO):** `generateStaticParams` + ISR + next-sitemap are well-established Next.js patterns; content quality is a judgment call, not a research question

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core technologies verified via official docs and package registries. Version compatibility matrix verified. Vercel ToS commercial restriction confirmed on official pricing page. |
| Features | MEDIUM | Competitor analysis based on live site observation; Everfest was unreachable during research; festivals.day was unreachable. Core feature gaps vs competitors are confirmed; specific competitor internal capabilities are inferred. |
| Architecture | HIGH | All architectural patterns verified via MapLibre official docs, Next.js official docs, and Supabase official docs. Code examples are from official sources or verified community references. |
| Pitfalls | MEDIUM-HIGH | MapLibre SSR pitfall confirmed via official large data guide and community reports. Booking.com affiliate change confirmed via multiple industry sources (May 2025). PostGIS geometry vs geography performance confirmed via official PostGIS docs and benchmarks. Supabase pause behaviour confirmed via community tools built specifically to address it. |

**Overall confidence:** HIGH

The stack and architecture are on firm ground from official documentation. The features research has minor gaps due to competitor site availability during research — the core competitive positioning is sound but specific competitor feature details should be treated as directional rather than definitive.

### Gaps to Address

- **Booking.com Awin approval timeline and requirements:** The application process is an external dependency. Start the application immediately when Phase 2 begins. Have Hotels.com (via CJ) and Agoda applications running in parallel. Do not gate Phase 2 completion on approval — gate only the link-generation code.
- **OpenFreeMap SLA and availability:** No formal uptime guarantee exists. The tile URL must be an environment variable from day one, with a Protomaps self-hosted fallback documented (not necessarily implemented). Treat as a managed risk.
- **Wildlife migration data sources:** The research confirms the category gap (no consumer travel site covers wildlife migrations) but does not enumerate specific data APIs or freely licensed route datasets. This needs investigation in Phase 3 planning.
- **Supabase free tier inactivity pause in production:** The research confirms $25/month Pro plan eliminates this. Budget this from Phase 2 onward. The keep-alive workflow mitigates the risk during development phases.
- **UI component library compatibility with Tailwind v4:** Many component libraries were mid-migration to Tailwind v4 at the time of research. Verify any chosen UI library (e.g., Shadcn) is v4 compatible before Phase 1 begins. If not, pin to Tailwind v3 for the specific library.

---

## Sources

### Primary (HIGH confidence)
- [Next.js 15 official blog](https://nextjs.org/blog/next-15) — App Router, generateStaticParams, ISR patterns
- [MapLibre GL JS official docs](https://maplibre.org/maplibre-gl-js/docs/) — WebGL map API, layer patterns, large data guide
- [MapLibre clustering examples](https://maplibre.org/maplibre-gl-js/docs/examples/create-and-style-clusters/) — GeoJSON source cluster patterns
- [Supabase PostGIS docs](https://supabase.com/docs/guides/database/extensions/postgis) — Spatial queries, GiST indexes, geometry vs geography
- [Supabase SSR package docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — @supabase/ssr replaces deprecated auth-helpers
- [Tailwind CSS v4 release](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first config, stable January 2025
- [Vercel pricing page](https://vercel.com/pricing) — Hobby non-commercial restriction confirmed
- [OpenFreeMap quick start](https://openfreemap.org/quick_start/) — Free unlimited tiles, no API key
- [react-map-gl docs](https://visgl.github.io/react-map-gl/docs/whats-new) — v8.1.0, `react-map-gl/maplibre` import path
- [PostGIS performance tips](https://postgis.net/docs/performance_tips.html) — geometry vs geography, GiST indexes
- [Google Event structured data](https://developers.google.com/search/docs/appearance/structured-data/event) — JSON-LD requirements for rich results
- [GetYourGuide affiliate programme](https://partner.getyourguide.com/) — 8% commission confirmed

### Secondary (MEDIUM confidence)
- [FestivalNet live site](https://festivalnet.com/find-festivals) — competitor feature observation
- [TheBestTimeToVisit.com](https://www.thebesttimetovisit.com/) — competitor feature observation
- [Booking.com affiliate terminations (Bookinggeddon)](https://www.affiversemedia.com/booking-com-suddenly-ends-affiliate-partnerships-what-travel-bloggers-need-to-know/) — May 2025 program restructure
- [Booking.com moves to Awin](https://www.netinfluencer.com/booking-com-moves-all-affiliates-to-awin-what-to-know-about-termination-notices/) — Awin network requirement confirmed
- [Supabase free tier pause prevention](https://github.com/travisvn/supabase-pause-prevention) — 7-day inactivity confirmed
- [Programmatic SEO thin content guide 2025](https://www.getpassionfruit.com/blog/programmatic-seo-traffic-cliff-guide) — thin content deindexation patterns
- [PostGIS geometry vs geography performance](https://medium.com/coord/postgis-performance-showdown-geometry-vs-geography-ec99967da4f0) — 5-10x slowdown confirmed
- [Expedia Group Q3 2025 travel trends](https://partner.expediagroup.com/en-us/resources/blog/q3-2025-travel-trends-insights) — 60%+ mobile travel discovery
- [Next.js generateStaticParams build time reports](https://github.com/vercel/next.js/discussions/67471) — 6x build time increase with large page sets

### Tertiary (LOW confidence)
- [Everfest/Fest300](https://www.everfest.com/fest300) — unreachable during research; feature set inferred from SaaSHub and RocketReach profiles
- [festivals.day](https://festivals.day/) — unreachable during research; feature set could not be directly verified

---

*Research completed: 2026-03-01*
*Ready for roadmap: yes*
