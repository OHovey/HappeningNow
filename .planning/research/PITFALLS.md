# Pitfalls Research

**Domain:** Interactive travel events map platform with affiliate monetisation and programmatic SEO
**Researched:** 2026-03-01
**Confidence:** MEDIUM-HIGH (verified across official docs, community reports, and multiple sources)

---

## Critical Pitfalls

### Pitfall 1: MapLibre GL JS Breaks SSR — The "Window Is Not Defined" Bomb

**What goes wrong:**
MapLibre GL JS assumes a browser environment and references `window`, `document`, `navigator`, and WebGL context at import time. In Next.js App Router, any component that imports `maplibre-gl` directly will crash during server-side rendering or static generation with `ReferenceError: window is not defined`. This kills the build or causes hydration mismatches that are hard to debug.

**Why it happens:**
Developers write a `<Map>` component, import MapLibre at the top of the file, and assume the `'use client'` directive is enough. It is not — the module itself throws at import time on the server before React can evaluate directives.

**How to avoid:**
Use `next/dynamic` with `{ ssr: false }` for the entire map component. Never import `maplibre-gl` in any file that can be touched by the server. The pattern is:

```typescript
// map-wrapper.tsx — this file is safe to import anywhere
import dynamic from 'next/dynamic'
const MapComponent = dynamic(() => import('./map-client'), { ssr: false })
export default MapComponent
```

The inner `map-client.tsx` contains all MapLibre imports and must be isolated from server execution.

**Warning signs:**
- Build or dev server throws `ReferenceError: window is not defined`
- Hydration mismatch errors in the browser console
- Map works in dev but crashes in production build

**Phase to address:**
Phase 1 (Map Foundation) — set the correct dynamic import pattern before any other map code is written. Retrofitting this is painful.

---

### Pitfall 2: Calling `map.setData()` on Every Timeline Scrub Kills Frame Rate

**What goes wrong:**
The core "wow" feature — scrubbing the month timeline and watching event dots appear/disappear — is tempting to implement by calling `source.setData(filteredGeoJSON)` whenever the slider moves. This triggers a full GPU re-upload of the entire GeoJSON payload on every frame. At 60fps scrubbing, this causes visible jank and can freeze the browser tab on lower-end devices.

**Why it happens:**
The MapLibre docs show `setData()` as the way to update GeoJSON. Developers use it for everything, including hot-path real-time updates. MapLibre's repaint cycle is expensive — even small changes to a source trigger a full re-render of affected layers.

**How to avoid:**
Use MapLibre's `setFilter()` on a pre-loaded source instead of swapping data. Load ALL events into the map at startup, then use GL expression filters to show/hide by month:

```typescript
// Load all events once
map.addSource('events', { type: 'geojson', data: allEventsGeoJSON })

// On scrub: filter, don't swap data
map.setFilter('events-layer', ['==', ['get', 'month'], selectedMonth])
```

`setFilter()` is evaluated on the GPU via GL expressions — it does not re-upload data. For the pulsing animation effect, use `setFeatureState()` for opacity/size, or pre-bake animation offsets as properties and drive them with GL interpolate expressions.

**Warning signs:**
- Scrubbing the timeline causes visible stuttering or dropped frames
- Chrome DevTools shows GPU memory spikes on slider drag
- CPU usage spikes to 100% during scrub

**Phase to address:**
Phase 1 (Map Foundation) — the filter-based architecture must be established before seed data is loaded or the timeline UI is built.

---

### Pitfall 3: Booking.com Direct Affiliate Program No Longer Accepts Small Publishers

**What goes wrong:**
In May 2025, Booking.com terminated affiliate partnerships with thousands of smaller publishers (those earning under €1,000/month) and migrated remaining partners to Awin/CJ affiliate networks. New affiliates must now apply through Awin (or CJ depending on region), and Booking.com's direct program is effectively closed to new entrants without a track record.

**Why it happens:**
Booking.com restructured its affiliate program to cut costs and focus on high-volume traffic sources. A new site with no traffic history will likely be rejected or placed in a lengthy approval queue.

**Consequences:**
- Building Booking.com deep links throughout the codebase before being approved wastes significant effort
- If rejected, the entire accommodation affiliate strategy needs replacing
- Links built for the old direct program format will not work with the Awin network format

**How to avoid:**
Apply to Booking.com via Awin **before** building any affiliate link infrastructure. Also join alternative accommodation affiliate programs in parallel as fallbacks: Hotels.com (Expedia Group via CJ), Agoda (own program), and Hostelworld (own program). Do not build a monetisation strategy with a single affiliate program as a dependency.

**Warning signs:**
- You have affiliate links in the codebase but no confirmed program approval
- You are using the old `booking.com/affiliate` URL format instead of Awin tracking links
- Your Awin application is under review and you continue building

**Phase to address:**
Phase 2 (Affiliate Infrastructure) — affiliate program approval must be confirmed as a prerequisite before building any link-generation logic.

---

### Pitfall 4: Programmatic SEO at 3,500 Pages Trips Google's Thin Content Filter

**What goes wrong:**
Generating 3,500+ pages from a template where 80% of the content is identical (same description, same affiliate links, only the location/month/event name changes) causes Google to classify these as thin content or doorway pages. The result is mass deindexation — pages get crawled but marked "Discovered - currently not indexed" in Search Console and never rank.

**Why it happens:**
Developers focus on the template engine and URL structure, treating content as a fill-in-the-blanks exercise. The underlying assumption that "unique data = unique content" is wrong — Google evaluates whether the page satisfies user intent, not whether a field name changed.

**Consequences:**
Entire programmatic SEO investment (3,500 pages at launch) returns zero organic traffic. Recovery requires rewriting content at scale, which can take months. A Google manual action for "doorway pages" is possible if patterns are egregious.

**How to avoid:**
Each page category needs a differentiation strategy:
- **Festival/region/month pages:** Include 3+ unique facts about that specific festival (not templated), local weather context, crowd level context, and a curated "also happening nearby" list unique to that event.
- **Wildlife/region pages:** Include migration patterns, best viewing spots, species-specific detail — not just dates.
- **What-to-do/destination/month pages:** Must include the 12-month calendar grid with actual data variation; this is your differentiator — use it.

Target minimum 400 unique words per page. Use `noindex` on any pages where unique content cannot be guaranteed (e.g., stub pages with only dates and no enriched data).

**Warning signs:**
- Search Console shows hundreds of pages as "Discovered - currently not indexed"
- All programmatic pages have identical word counts in crawl reports
- Zero organic impressions after 60+ days of indexing

**Phase to address:**
Phase 4 (Programmatic SEO) — content differentiation strategy must be defined before templates are built, not retrofitted.

---

### Pitfall 5: PostGIS `geography` Type at Every Query Slows the API Below 200ms Target

**What goes wrong:**
Using the `geography` type for event coordinates rather than `geometry` causes every spatial query to perform spherical earth calculations, which is 5-10x slower than planar `geometry` math. For a dataset of 2,000+ events with concurrent API requests, proximity queries and bounding box intersections will exceed the 200ms target response time.

**Why it happens:**
PostGIS documentation recommends `geography` for "accurate" distance calculations (it handles Earth's curvature). Developers read this as "always use geography for location data," not realising the performance tradeoff. At the scale of events data where accuracy within 1km is acceptable, `geometry(Point, 4326)` with a GiST index is the right choice.

**Consequences:**
- `ST_DWithin` queries on `geography` columns run 5-10x slower than equivalent `geometry` queries
- Reverse search ("show me what's near me") becomes too slow for interactive use
- API response times exceed the 200ms budget at moderate concurrency

**How to avoid:**
Store event coordinates as `geometry(Point, 4326)` not `geography`. Ensure a GiST index exists on every geometry column:

```sql
CREATE INDEX events_location_idx ON events USING GIST (location);
```

Use `ST_DWithin` with the geometry type and a distance in degrees, or convert explicitly. Only use `geography` if you need sub-metre accuracy, which this use case does not. Verify query plans use the index via `EXPLAIN ANALYZE` before shipping.

**Warning signs:**
- API routes for proximity search return in >500ms in dev with 500 events
- `EXPLAIN ANALYZE` shows `Seq Scan` instead of `Index Scan` on geometry columns
- Supabase Logs show query times trending up as the event dataset grows

**Phase to address:**
Phase 2 (Database & API Foundation) — schema decisions are very hard to change after data is loaded and API contracts are published.

---

### Pitfall 6: Vercel Free Tier Build Timeout with 3,500 SSG Pages

**What goes wrong:**
Generating 3,500+ static pages via `generateStaticParams` at build time on Vercel's Hobby plan risks hitting the 45-minute build timeout. Documented community reports show build times increasing 6x when adding large `generateStaticParams` sets, and builds silently halting partway through (generating ~1,000 pages then stopping) without explicit error messages.

**Why it happens:**
Each static page requires fetching data from Supabase (or a build-time data file), rendering with Next.js, and writing static HTML. At 3,500 pages with sequential data fetching, build time compounds quickly. The Hobby plan also uses shared infrastructure with lower CPU priority.

**Consequences:**
- Deployments fail silently mid-build
- A subset of pages deploy successfully, causing inconsistent user experience
- Production is blocked until build completes or architecture changes

**How to avoid:**
Do not build all 3,500 pages statically at launch. Use ISR with an empty `generateStaticParams` array and `export const dynamicParams = true`. Pages are generated on first request and cached at the CDN edge. Pre-generate only the highest-traffic pages (top 100-200 by estimated search volume) at build time. This keeps build times under 5 minutes.

```typescript
// pages/festivals/[region]/[month]/page.tsx
export async function generateStaticParams() {
  // Only pre-build top pages — rest generated on demand
  return topFestivalPages.map(p => ({ region: p.region, month: p.month }))
}
export const dynamicParams = true // serve others on demand
export const revalidate = 86400 // revalidate daily
```

**Warning signs:**
- Local `next build` takes longer than 30 minutes
- Vercel build logs show more than 500 pages generated then silence
- Build succeeds but only a fraction of expected URLs return 200

**Phase to address:**
Phase 4 (Programmatic SEO) — ISR vs SSG strategy must be decided before programmatic page templates are built.

---

### Pitfall 7: Supabase Free Tier Pauses After 7 Days of Inactivity

**What goes wrong:**
Supabase pauses free-tier projects after 7 days of no activity. During development phases with no active users, the project will be paused repeatedly. A paused project takes 30-90 seconds to resume on first request — causing the first visitor (or you, during dev) to see a completely broken experience. There are also documented cases of data loss after pause/restore cycles.

**Why it happens:**
Supabase uses pausing to manage free-tier server costs. The project is treated as inactive if no API calls hit the database within the 7-day window. This is easy to trigger during multi-week focused development sprints on frontend features that don't touch the API.

**Consequences:**
- Development velocity is broken by constant unexpected pauses
- First production visitors hit a 60-second cold start
- Potential data loss on restore (community-reported, low frequency but non-zero risk)

**How to avoid:**
Set up a GitHub Actions workflow to ping Supabase every 5 days during development. Accept that Supabase free tier is only viable pre-launch; budget for the $25/month Pro plan at launch to eliminate this problem. Treat the free tier as "development only, not production."

```yaml
# .github/workflows/keep-supabase-alive.yml
name: Keep Supabase Alive
on:
  schedule:
    - cron: '0 12 */5 * *'
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -s "${{ secrets.SUPABASE_URL }}/rest/v1/events?limit=1" -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}"
```

**Warning signs:**
- Supabase dashboard shows project status as "Paused"
- API calls return 503 during development
- You haven't touched the project for more than 5 days

**Phase to address:**
Phase 2 (Database Foundation) — set up keep-alive infrastructure before any persistent data goes into the database.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `source.setData()` for timeline filtering | Simple to implement | Jank at scrub speed, GPU thrash | Never — use `setFilter()` instead |
| `geography` type for all coordinates | "Correct" distances | 5-10x slower spatial queries | Never for a 2k+ event read-heavy dataset |
| Building all 3,500 pages at SSG build time | Full pre-render | 45-min build timeouts, Vercel Hobby limits | Never — use ISR with partial pre-build |
| Single affiliate program (Booking.com only) | Simpler link management | Single point of failure, program closure risk | Never — always 2+ programs per category |
| Skipping `noindex` on stub programmatic pages | Faster to ship | Thin content penalty on entire domain | Never — noindex stubs until enriched |
| Hardcoding tile URLs in the map component | Works immediately | OpenFreeMap has no SLA; one env var change is all it takes to swap | Acceptable in MVP, must be config-driven before launch |
| No `map.remove()` cleanup in useEffect | Less code | WebGL context leak, GPU memory not freed on navigation | Never — always cleanup in return function |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| MapLibre + Next.js | Importing `maplibre-gl` in a server-touched file | `next/dynamic` with `{ ssr: false }`, isolated `map-client.tsx` |
| Booking.com (Awin) | Building links before approval confirmed | Apply to Awin first, get approval, then build link infrastructure |
| GetYourGuide Affiliate | Linking to generic search results instead of specific activity pages | Use GYG's deep link tool for specific activities near each event |
| Supabase PostGIS | Using the Supabase JS client for spatial queries (limited support) | Use Supabase RPC functions (`supabase.rpc('nearby_events', {...})`) for complex spatial queries |
| Nominatim geocoding | No rate limiting in data pipeline | Respect 1 request/second limit; cache all geocoding results permanently |
| OpenFreeMap | Treating it as a guaranteed-uptime service | Configure tile URL as an environment variable; have a Protomaps fallback configured |
| ConvertKit | Subscribing users without interest tags | Always pass interest tags (e.g., `festivals`, `wildlife`) at subscribe time for segmentation to work |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading full events GeoJSON on map init | Slow initial load, blank map for 3+ seconds | Paginate or filter server-side to viewport bounds; lazy load off-screen regions | 500+ events in GeoJSON |
| No GiST index on geometry columns | Proximity queries time out | Always `CREATE INDEX ... USING GIST` on any geometry column | 1,000+ rows without index |
| RLS policies without column indexes | Read queries slow for public data | Add indexes on columns referenced in RLS policies, or disable RLS for truly public tables | Any table >10k rows with RLS |
| Rendering HTML markers instead of GL layers | Smooth panning impossible, jank at 500+ markers | Use symbol layers with sprite icons, not `Marker` DOM elements | 200+ HTML markers on screen |
| Calling PostGIS functions in RLS policies per-row | Database CPU pegged | Wrap auth functions in `(SELECT ...)` to cache per-statement, not per-row | Any authenticated query with RLS |
| ISR revalidation storm | All pages revalidate simultaneously after 24h, database hammered | Stagger `revalidate` values per page type; use `revalidatePath` API for targeted updates | 3,500+ pages with same `revalidate` TTL |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Supabase anon key exposed without RLS | Anyone can read/write all rows | Enable RLS on all tables; anon key is safe only if RLS is configured |
| No FTC affiliate disclosure | FTC fines up to $51,744 per violation; program termination | Sitewide footer disclosure + page-level disclosure on any page with affiliate links |
| Nominatim geocoding API called client-side | IP rate limiting bypassed, exposing your geocoding cache to abuse | All geocoding must be server-side only; cache results in database |
| Affiliate link cloaking that violates program terms | Instant program termination | Always use the network's provided link format; do not mask with custom short URLs for Booking.com/GYG |
| No `rel="nofollow noopener"` on affiliate links | Minor SEO impact; browser security issue on `target="_blank"` | All external affiliate links: `rel="nofollow noopener noreferrer" target="_blank"` |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Map loads blank then flashes in | Jarring, looks broken | Show skeleton/spinner over map container; fire map init before component mount completes |
| Timeline scrubber jumps (not smooth) | Core interaction feels cheap | Debounce filter application by 100ms; pre-calculate filtered sets per month at load time |
| Event popup covers other markers | User must close and reclick | Offset popup to the right; use side panel instead of popup for event detail |
| Mobile: no tap target for clustered markers | Mobile users can't expand clusters | Minimum 44x44px touch target for cluster circles; expand on tap not hover |
| Affiliate links open in same tab | Users lose their map position | All affiliate links `target="_blank"`; warn users visually they're leaving the site |
| No loading state for side panel content | Panel appears empty for 500ms+ | Skeleton UI in panel while event detail fetches; or pre-fetch on hover |
| Map zoom level is wrong for event density | Either no markers visible (too zoomed out) or everything clustered (too zoomed in) | Default zoom 3-4 for world view; auto-zoom to event cluster on filter selection |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Affiliate links:** Verify all links include correct affiliate tracking parameters — a link without the tracking ID earns nothing; looks like working links in preview
- [ ] **Programmatic SEO pages:** Check Search Console 30 days post-launch — pages may be "Discovered - currently not indexed" despite appearing to render correctly
- [ ] **MapLibre cleanup:** Verify `map.remove()` is called in useEffect return — memory leak is invisible in short sessions, shows in long browsing sessions
- [ ] **Structured data:** Run Google Rich Results Test on event pages — JSON-LD may be present but fail validation due to missing required fields
- [ ] **PostGIS indexes:** Run `EXPLAIN ANALYZE` on all spatial queries before launch — index may appear to exist but not be used due to statistics or type mismatch
- [ ] **OpenGraph tags:** Check og:image is an absolute URL with real dimensions — many SSG implementations generate relative paths that break social sharing
- [ ] **Mobile map performance:** Test on real mid-range Android device (not iPhone, not Chrome DevTools emulation) — WebGL performance differences are dramatic
- [ ] **Affiliate program approval:** Confirm you have received explicit approval email from Awin/GYG, not just submitted an application
- [ ] **FTC disclosure:** Verify disclosure appears before affiliate links, not only in footer — Google's crawler and FTC both evaluate placement

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| SSR crash from MapLibre import | LOW | Add `next/dynamic` wrapper; 1-2 hours |
| Timeline jank from `setData()` | MEDIUM | Refactor to filter-based architecture; 1-2 days if source loading is already correct |
| Booking.com affiliate rejected | LOW | Apply to Awin, pivot to Hotels.com/Agoda in interim; 1 week delay |
| Google thin content deindexation | HIGH | Content enrichment at scale (weeks); disavow/noindex bad pages; file reconsideration if manual action issued |
| Vercel build timeout | MEDIUM | Convert SSG to ISR; 1-2 days refactoring |
| Supabase pause in production | LOW | Upgrade to Pro plan ($25/month); 30 minutes |
| PostGIS slow queries (no index) | LOW | `CREATE INDEX CONCURRENTLY` without table lock; 30 minutes |
| MapLibre WebGL memory leak | MEDIUM | Add useEffect cleanup; test with Chrome Memory profiler; 1 day |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| MapLibre SSR crash | Phase 1 (Map Foundation) | Build succeeds with `next build`; no hydration errors |
| Timeline `setData()` jank | Phase 1 (Map Foundation) | 60fps scrubbing on mid-range device in Chrome DevTools |
| PostGIS `geography` type slowness | Phase 2 (Database Foundation) | `EXPLAIN ANALYZE` shows Index Scan on all spatial queries |
| Supabase 7-day pause | Phase 2 (Database Foundation) | GitHub Actions keep-alive deployed and verified |
| Booking.com affiliate approval | Phase 2 (Affiliate Infrastructure) | Approval email received before link generation code written |
| HTML Marker performance | Phase 1 (Map Foundation) | Symbol layers used for all event markers from day one |
| Supabase 500MB limit | Phase 2 (Database Foundation) | Monitor via Supabase dashboard; optimise image storage off-DB |
| Vercel build timeout | Phase 4 (Programmatic SEO) | ISR + partial pre-build confirmed before page count exceeds 500 |
| Thin content deindexation | Phase 4 (Programmatic SEO) | Content differentiation spec written before templates are built |
| FTC affiliate disclosure | Phase 2 (Affiliate Infrastructure) | Disclosure component in layout, verified on every page with affiliate links |

---

## Sources

- MapLibre GL JS official large data guide: https://maplibre.org/maplibre-gl-js/docs/guides/large-data/
- MapLibre repaint performance issue (GitHub): https://github.com/maplibre/maplibre-gl-js/issues/96
- Next.js SSR "window is not defined" solutions: https://dev.to/devin-rosario/stop-window-is-not-defined-in-nextjs-2025-394j
- Next.js `generateStaticParams` build time 6x increase (community report): https://github.com/vercel/next.js/discussions/67471
- Vercel Hobby plan 45-minute build timeout: https://vercel.com/docs/limits
- PostGIS performance tips (official): https://postgis.net/docs/performance_tips.html
- PostGIS geometry vs geography performance: https://medium.com/coord/postgis-performance-showdown-geometry-vs-geography-ec99967da4f0
- Supabase RLS performance and best practices: https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
- Supabase free tier 7-day pause prevention: https://github.com/travisvn/supabase-pause-prevention
- Programmatic SEO common mistakes: https://seomatic.ai/blog/programmatic-seo-mistakes
- Programmatic SEO traffic cliff guide 2025: https://www.getpassionfruit.com/blog/programmatic-seo-traffic-cliff-guide
- Booking.com affiliate terminations May 2025 ("Bookinggeddon"): https://www.affiversemedia.com/booking-com-suddenly-ends-affiliate-partnerships-what-travel-bloggers-need-to-know/
- Booking.com moves to Awin: https://www.netinfluencer.com/booking-com-moves-all-affiliates-to-awin-what-to-know-about-termination-notices/
- FTC affiliate disclosure requirements 2025: https://impact.com/influencer/affiliate-link-disclosure/
- OpenFreeMap terms and reliability: https://openfreemap.org/
- Supabase PostGIS geo queries: https://supabase.com/docs/guides/database/extensions/postgis

---
*Pitfalls research for: Interactive travel events map platform (HappeningNow.travel)*
*Researched: 2026-03-01*
