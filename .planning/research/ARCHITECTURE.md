# Architecture Research

**Domain:** Interactive travel events map platform
**Researched:** 2026-03-01
**Confidence:** HIGH (core patterns verified via official docs and multiple sources)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                           │
│                        (Next.js App Router)                          │
├───────────────────────┬─────────────────────────┬───────────────────┤
│   Map Shell (Client)  │   SEO Pages (Static)    │  Layout / Nav     │
│  ┌─────────────────┐  │  ┌───────────────────┐  │  (Server Comp.)   │
│  │  MapLibre GL JS │  │  │ /festivals/[slug] │  │                   │
│  │  MapCanvas      │  │  │ /wildlife/[slug]  │  │                   │
│  │  MarkerLayer    │  │  │ /events/[region]  │  │                   │
│  │  ClusterLayer   │  │  │ /[dest]/[month]   │  │                   │
│  │  HeatmapLayer   │  │  └───────────────────┘  │                   │
│  │  AnimPath Layer │  │  (SSG + ISR, ~3,500 pg) │                   │
│  └────────┬────────┘  └──────────────────────────                   │
│           │                                                          │
│  ┌────────┴────────┐  ┌───────────────────────┐                    │
│  │ TimelineScrubber│  │   Event Detail Panel  │                    │
│  │ CategoryToggles │  │   (Slide-in sidebar)  │                    │
│  │ SearchControls  │  │   Affiliate CTAs      │                    │
│  └─────────────────┘  └───────────────────────┘                    │
├─────────────────────────────────────────────────────────────────────┤
│                        CLIENT STATE LAYER                            │
│              Zustand stores (map, UI, filter, selected)              │
├─────────────────────────────────────────────────────────────────────┤
│                          DATA LAYER                                  │
│                      (Next.js API Routes)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│  │/api/events   │  │/api/events/  │  │  /api/destinations        │ │
│  │?bbox=...     │  │[id]          │  │  /api/destinations/[slug] │ │
│  │?month=...    │  │              │  │                           │ │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬──────────────┘ │
├─────────┴─────────────────┴──────────────────────┴──────────────────┤
│                         BACKEND / DATABASE                           │
│                     Supabase (PostgreSQL + PostGIS)                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  festivals  │  │  wildlife    │  │     destinations         │   │
│  │  table      │  │  events      │  │  (crowd/weather data)    │   │
│  │  + PostGIS  │  │  table       │  │                          │   │
│  │  geometry   │  │  + geometry  │  │                          │   │
│  └─────────────┘  └──────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| MapCanvas | Owns the MapLibre GL JS instance; initialises map, tile source, controls | Client Component with `use client`; single instance, never unmount |
| MarkerLayer | Renders event markers on map as GeoJSON SymbolLayer | MapLibre Layer API — NOT DOM markers; data driven from GeoJSON source |
| ClusterLayer | Groups nearby markers at low zoom levels | MapLibre built-in cluster support on GeoJSON source (`cluster: true`) |
| HeatmapLayer | Crowd density overlay, updated per month selection | MapLibre HeatmapLayer; data comes from separate endpoint |
| AnimatedPathLayer | Migration route polylines with animation | MapLibre LineLayer + custom animation loop via `requestAnimationFrame` |
| TimelineScrubber | Month selector (1-12); drives filter state in Zustand | Client Component; updates `selectedMonth` store atom |
| CategoryToggles | Filters map markers by category (festivals/wildlife/both) | Client Component; updates `activeCategories` store atom |
| EventDetailPanel | Slide-in sidebar showing event details and affiliate links | Client Component; reads `selectedEventId` from Zustand |
| SEO Pages | Static detail pages for festivals, wildlife, destinations | Server Components; `generateStaticParams` + `generateMetadata` |
| API Routes | Thin translation layer between Supabase and client | Next.js Route Handlers; apply auth/validation; return GeoJSON |
| Supabase/PostGIS | Spatial data storage; ST_DWithin, bounding box queries | PostgreSQL with PostGIS extension; GIST indexes on geometry columns |

## Recommended Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout, global metadata
│   ├── page.tsx                  # Homepage (map shell, Server Component wrapper)
│   ├── (map)/                    # Route group — map UI
│   │   └── page.tsx              # Renders MapShell (passes data as props)
│   ├── festivals/
│   │   └── [region]/
│   │       └── [month]/
│   │           └── page.tsx      # SSG festival listing page
│   ├── events/
│   │   └── [slug]/
│   │       └── page.tsx          # SSG event detail page
│   ├── wildlife/
│   │   └── [region]/
│   │       └── page.tsx          # SSG wildlife region page
│   ├── destinations/
│   │   └── [slug]/
│   │       └── [month]/
│   │           └── page.tsx      # SSG destination/month page
│   ├── api/
│   │   ├── events/
│   │   │   ├── route.ts          # GET /api/events?bbox=&month=&category=
│   │   │   └── [id]/route.ts     # GET /api/events/[id]
│   │   ├── destinations/
│   │   │   └── route.ts          # GET /api/destinations
│   │   └── search/
│   │       └── route.ts          # GET /api/search?lat=&lng=&radius=
│   ├── sitemap.ts                # Dynamic sitemap generation
│   └── robots.ts                 # Robots.txt
│
├── components/
│   ├── map/                      # All map-related Client Components
│   │   ├── MapShell.tsx          # 'use client' — owns MapLibre instance
│   │   ├── EventMarkerLayer.tsx  # GeoJSON SymbolLayer for events
│   │   ├── ClusterLayer.tsx      # Cluster config + circle/symbol layers
│   │   ├── HeatmapLayer.tsx      # Crowd density overlay
│   │   ├── MigrationPathLayer.tsx # Animated route polylines
│   │   └── MapControls.tsx       # Zoom, locate, reset
│   ├── ui/
│   │   ├── TimelineScrubber.tsx  # Month scrubber
│   │   ├── CategoryToggle.tsx    # Festival/wildlife/both toggle
│   │   ├── EventDetailPanel.tsx  # Slide-in event sidebar
│   │   ├── SearchPanel.tsx       # Reverse search UI
│   │   └── EmailCapture.tsx      # ConvertKit sign-up form
│   └── seo/
│       ├── StructuredData.tsx    # JSON-LD schema injection
│       └── OGCard.tsx            # Open Graph preview card
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server-side Supabase client
│   │   └── queries.ts            # Named query functions (events, destinations)
│   ├── maplibre/
│   │   ├── layers.ts             # Layer style definitions
│   │   ├── sources.ts            # GeoJSON source config
│   │   └── animation.ts          # Path animation utilities
│   └── affiliate/
│       ├── booking.ts            # Booking.com deep link builder
│       └── getyourguide.ts       # GetYourGuide deep link builder
│
├── stores/
│   ├── mapStore.ts               # Zustand: viewport, zoom, center
│   ├── filterStore.ts            # Zustand: selectedMonth, activeCategories
│   └── uiStore.ts                # Zustand: selectedEventId, panelOpen
│
├── types/
│   ├── events.ts                 # Festival, WildlifeEvent types
│   ├── destinations.ts           # Destination, CrowdData types
│   └── geojson.ts                # GeoJSON feature property types
│
└── data/
    └── seed/                     # Static seed JSON files for initial load
        ├── festivals.json
        └── wildlife.json
```

### Structure Rationale

- **app/(map)/:** Route group isolates the interactive map shell so its Client Component boundary does not contaminate SEO page Server Components.
- **components/map/:** All MapLibre code is isolated here so `use client` only propagates within this subtree, keeping the rest of the app Server-rendered.
- **lib/supabase/:** Separate client and server instances are required by `@supabase/ssr` — sharing a single instance breaks App Router auth.
- **stores/:** Thin, purpose-split Zustand stores prevent re-renders on unrelated state changes. Map state, filter state, and UI state are separate atoms.
- **lib/affiliate/:** Affiliate link building is isolated; changing partner programs does not touch UI components.

## Architectural Patterns

### Pattern 1: Client Island for the Map

**What:** The entire MapLibre canvas is isolated as a single "client island" — one `'use client'` boundary at `MapShell.tsx`. Everything above it (layout, page wrappers, SEO metadata) stays Server Components.

**When to use:** Always for this project. MapLibre requires browser APIs (`window`, WebGL context) that cannot run on the server.

**Trade-offs:** Keeps initial HTML fully server-rendered for SEO; adds hydration cost for the map island on first load. Acceptable because the map is not crawled by search engines anyway.

**Example:**
```typescript
// app/page.tsx — Server Component
import { MapShell } from '@/components/map/MapShell'
import { getInitialEvents } from '@/lib/supabase/queries'

export default async function HomePage() {
  const initialEvents = await getInitialEvents() // runs server-side
  return <MapShell initialEvents={initialEvents} />
}

// components/map/MapShell.tsx — Client Component
'use client'
import maplibregl from 'maplibre-gl'
import { useRef, useEffect } from 'react'

export function MapShell({ initialEvents }: Props) {
  const mapRef = useRef<maplibregl.Map | null>(null)
  useEffect(() => {
    mapRef.current = new maplibregl.Map({ container: 'map', ... })
  }, [])
  // ...
}
```

### Pattern 2: GeoJSON Source as Single Source of Truth

**What:** All event markers on the map come from a single GeoJSON source that gets updated (not replaced) when filters change. The map reads from the source; React state drives what's in the source.

**When to use:** Any time you need to filter, cluster, or animate map markers. Avoids the DOM marker anti-pattern.

**Trade-offs:** Requires understanding MapLibre's layer API instead of React component model. Much faster than DOM markers for 500+ points — uses WebGL, not the DOM.

**Example:**
```typescript
// Update GeoJSON source when month changes
const filteredEvents = useFilterStore((s) => s.filteredEvents)

useEffect(() => {
  const source = mapRef.current?.getSource('events') as maplibregl.GeoJSONSource
  if (source) {
    source.setData({
      type: 'FeatureCollection',
      features: filteredEvents.map(eventToGeoJSONFeature)
    })
  }
}, [filteredEvents])
```

### Pattern 3: Viewport-Bound API Fetching

**What:** The `/api/events` endpoint accepts a bounding box (`bbox`) parameter and returns only events within that viewport. The client fires a re-fetch when the user pans or zooms significantly.

**When to use:** When event dataset grows beyond 500 events. At seed data size (600 events total) you can load all events upfront, but the pattern should be built in from the start.

**Trade-offs:** Adds complexity (debounced viewport listener), but prevents loading 5,000 events into the browser at once. PostGIS `&&` operator with GIST index makes bounding box queries extremely fast.

**Example:**
```typescript
// API Route: app/api/events/route.ts
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const bbox = searchParams.get('bbox') // "minLng,minLat,maxLng,maxLat"
  const month = searchParams.get('month')

  const supabase = createServerClient()
  const { data } = await supabase.rpc('events_in_bbox', {
    min_lng: bbox[0], min_lat: bbox[1],
    max_lng: bbox[2], max_lat: bbox[3],
    filter_month: month
  })
  return Response.json(toGeoJSON(data))
}
```

### Pattern 4: SSG + ISR for SEO Pages with generateStaticParams

**What:** The ~3,500 programmatic SEO pages are statically generated at build time using `generateStaticParams`. Festival/wildlife/destination data is read from Supabase at build time, pages are pre-rendered and served from Vercel's CDN, revalidated on a schedule via ISR.

**When to use:** All SEO pages (`/festivals/[region]/[month]`, `/wildlife/[region]`, `/destinations/[slug]/[month]`).

**Trade-offs:** Build times grow with page count (3,500 pages ≈ 5-10 min build). Use `dynamicParams = false` to prevent generating unknown routes on the fly, which wastes serverless function invocations.

**Example:**
```typescript
// app/festivals/[region]/[month]/page.tsx
export const revalidate = 86400 // 24 hours

export async function generateStaticParams() {
  const supabase = createServerClient()
  const { data: festivals } = await supabase
    .from('festivals')
    .select('region_slug, month')
  return festivals.map((f) => ({ region: f.region_slug, month: String(f.month) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Festivals in ${params.region} in ${monthName(params.month)}`,
    description: `...`
  }
}
```

## Data Flow

### Request Flow — Map Events

```
User scrubs timeline to month 6
    ↓
filterStore.setMonth(6)
    ↓
filteredEvents selector recomputes (client-side filter of cached data)
    ↓
MapShell useEffect fires → source.setData(filteredGeoJSON)
    ↓
MapLibre re-renders markers (WebGL, <16ms)

If viewport changes significantly:
User pans map → onMoveEnd fires (debounced 300ms)
    ↓
/api/events?bbox=...&month=6 (Next.js Route Handler)
    ↓
Supabase PostGIS: SELECT * FROM events WHERE geom && ST_MakeBox2D(...)
    ↓
GeoJSON response → filterStore.setServerEvents(data)
    ↓
filteredEvents recomputes → MapShell updates source
```

### Request Flow — SEO Page

```
Googlebot requests /festivals/europe/june
    ↓
Vercel CDN serves pre-rendered HTML (static, <10ms)
    ↓
[If revalidation period expired] Next.js regenerates page in background
    ↓
Supabase query: SELECT festivals WHERE region='europe' AND month=6
    ↓
HTML rebuilt with fresh data, cached on CDN
```

### State Management

```
filterStore (Zustand)
    selectedMonth: number       ← TimelineScrubber
    activeCategories: string[]  ← CategoryToggle
    serverEvents: Event[]       ← fetched from /api/events on pan/zoom
    filteredEvents: Event[]     ← derived: serverEvents filtered by month/category

mapStore (Zustand)
    viewport: ViewState         ← MapLibre onMove
    zoom: number                ← MapLibre onZoom

uiStore (Zustand)
    selectedEventId: string | null  ← marker click
    panelOpen: boolean              ← derived from selectedEventId
    searchMode: boolean             ← SearchPanel toggle
```

### Key Data Flows

1. **Initial load:** Server Component queries Supabase for all events within default viewport (world view, current month). Passes as `initialEvents` prop to MapShell. Map renders immediately with data without client-side fetch waterfall.
2. **Month filter change:** Pure client-side — Zustand filter recomputes filtered subset, GeoJSON source updated. No API call needed if events are already loaded.
3. **Pan/zoom to new region:** Client detects significant viewport change, fires debounced fetch to `/api/events?bbox=...`. New events merged into store.
4. **Event click:** Marker click fires MapLibre event → `uiStore.setSelectedEventId(id)` → EventDetailPanel reads event from store → slides in with details and affiliate CTAs.
5. **SEO page build:** `generateStaticParams` runs at build time, queries all unique region/month combos from Supabase, generates full page list. Pages are HTML at rest, no JS required for content.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Load all events upfront (600 total fits in ~100KB GeoJSON). No viewport fetching needed. Single Supabase connection via API routes. |
| 1k-100k users | Enable viewport-bound fetching (already architected). Add CDN caching headers to `/api/events` responses (5-min cache by bbox key). Supabase free tier handles ~500 simultaneous connections. |
| 100k+ users | Move to vector tiles via Martin tile server (serves PostGIS directly as MVT). Replace GeoJSON API with tile endpoints. Upgrade Supabase tier for connection pooling. Consider read replica. |

### Scaling Priorities

1. **First bottleneck — API Route cold starts:** Vercel serverless functions have cold start latency. Mitigate with `export const dynamic = 'force-static'` where possible and CDN caching on API responses. The map data API is the most-hit endpoint.
2. **Second bottleneck — GeoJSON payload size:** At 2,000+ events, returning full GeoJSON on every pan becomes expensive. Solution is already noted: vector tiles via Martin. Build the `/api/events?bbox=` pattern from the start so switching to tiles is a config change, not a rewrite.

## Anti-Patterns

### Anti-Pattern 1: DOM Markers for Event Pins

**What people do:** Use `new maplibregl.Marker(element).setLngLat(coord).addTo(map)` for each event, often inside React `useEffect` loops.

**Why it's wrong:** DOM markers create one DOM node per event. At 500 events the page has 500 extra DOM elements. Panning/zooming triggers layout thrashing. No native clustering support. React reconciler fights with MapLibre's own DOM management.

**Do this instead:** Use a GeoJSON source + SymbolLayer for all event pins. MapLibre renders these in WebGL — 10,000 markers costs the same as 10 in terms of DOM overhead. Handle clustering via GeoJSON source `cluster: true`.

### Anti-Pattern 2: Hydration Mismatch on Map Component

**What people do:** Render MapLibre map container in a Server Component or forget `'use client'` directive. Or render map during SSR and hydrate differently on client.

**Why it's wrong:** MapLibre accesses `window` and `WebGLRenderingContext` during initialisation. These do not exist server-side. This causes hydration failures or runtime errors.

**Do this instead:** Keep all MapLibre code within a single `'use client'` component. Use `useEffect` for map initialisation (runs only after hydration). For SSR placeholder, render a static image or loading skeleton in the Server Component wrapper.

### Anti-Pattern 3: Fetching Events Inside Map Components

**What people do:** Put data fetch logic (`fetch('/api/events')`) inside `MapShell.tsx` or individual layer components with `useEffect`.

**Why it's wrong:** Creates fetch waterfalls (component renders → effect fires → fetch starts → data arrives → re-render). Users see an empty map briefly on every load. Also makes data hard to share between map and sidebar.

**Do this instead:** Fetch initial events in the Server Component page wrapper (runs before HTML is sent to client). Pass as `initialEvents` prop to MapShell. Client-side fetches for viewport changes go through the Zustand store, which is shared by both the map and the sidebar.

### Anti-Pattern 4: One Giant SEO Page Route

**What people do:** Try to serve all 3,500 programmatic SEO pages from a single catch-all route (`[[...slug]]`) with server-side rendering on every request.

**Why it's wrong:** Every Googlebot crawl triggers a Supabase query and a serverless function invocation. At 3,500 pages being recrawled monthly, that's meaningful cost and latency. Also misses CDN caching.

**Do this instead:** Use fully specified dynamic routes (`[region]/[month]/page.tsx`) with `generateStaticParams`. Pages are pre-built HTML served from Vercel's CDN edge nodes globally. Add `revalidate = 86400` for daily content freshness.

### Anti-Pattern 5: Shared Supabase Client Between Server and Client

**What people do:** Create one Supabase client in a singleton module and import it everywhere — both in Server Components and Client Components.

**Why it's wrong:** `@supabase/ssr` requires separate client instances for browser (cookie-based session) and server (reads cookies from request headers). A shared singleton breaks session management and causes auth bugs.

**Do this instead:** `lib/supabase/client.ts` for browser usage, `lib/supabase/server.ts` for Server Components and Route Handlers. The server client is created per-request, not as a singleton.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenFreeMap tiles | Direct URL in MapLibre style spec | No auth required; `https://tiles.openfreemap.org/styles/liberty` style URL |
| Supabase PostGIS | `@supabase/ssr` server client in Route Handlers; RPC calls for spatial queries | Use `supabase.rpc('function_name')` for complex PostGIS queries to avoid URL-encoding geometry |
| Booking.com affiliate | Deep link URL construction in `lib/affiliate/booking.ts` | Links generated server-side in SSG pages; client-side in EventDetailPanel |
| GetYourGuide affiliate | Deep link URL construction in `lib/affiliate/getyourguide.ts` | Same pattern as Booking.com |
| ConvertKit | REST API call from Next.js Route Handler (`/api/subscribe`) | Never expose API key to client; server-side only |
| Nominatim (geocoding) | Fetch in Route Handler for search feature | Rate limit: 1 req/sec; cache results in Supabase |
| Vercel CDN | Automatic via deployment; set `Cache-Control` headers on API routes | `s-maxage=300, stale-while-revalidate=600` on map data endpoints |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Server Components ↔ MapShell (Client) | Props (serializable data only) | Pass `initialEvents: Event[]` not Supabase query objects — must be JSON-serializable |
| MapShell ↔ EventDetailPanel | Zustand store (`uiStore.selectedEventId`) | Both are Client Components sharing the same store instance |
| API Routes ↔ Supabase | `@supabase/ssr` server client | API routes are the only place that talks to Supabase from the client path |
| SEO Pages ↔ Supabase | Direct server queries in `generateStaticParams` and page components | Build-time only; no runtime Supabase calls from SEO pages after build |
| MapShell ↔ API Routes | `fetch('/api/events?bbox=...')` on pan/zoom | Debounce at 300ms; cache response client-side by bbox key |
| Affiliate CTAs ↔ Event Data | `lib/affiliate/*.ts` pure functions | Deterministic URL builders; no API calls; testable in isolation |

## Sources

- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js/docs/) — Official docs, HIGH confidence
- [MapLibre Large Data Guide](https://maplibre.org/maplibre-gl-js/docs/guides/large-data/) — Performance patterns, HIGH confidence
- [MapLibre Next.js TypeScript Starter](https://github.com/richard-unterberg/maplibre-nextjs-ts-starter) — Real-world architecture reference, MEDIUM confidence
- [Supabase PostGIS Geo Queries](https://supabase.com/docs/guides/database/extensions/postgis) — Official Supabase docs, HIGH confidence
- [Next.js App Router Architecture 2026](https://www.yogijs.tech/blog/nextjs-project-architecture-app-router) — Community article, MEDIUM confidence
- [Next.js ISR Guide](https://nextjs.org/docs/pages/guides/incremental-static-regeneration) — Official Next.js docs, HIGH confidence
- [Next.js + Supabase production lessons](https://catjam.fi/articles/next-supabase-what-do-differently) — Production post-mortem, MEDIUM confidence
- [MapLibre Clustering with GeoJSON](https://maplibre.org/maplibre-gl-js/docs/examples/create-and-style-clusters/) — Official examples, HIGH confidence
- [State Management in React 2025](https://makersden.io/blog/react-state-management-in-2025) — Community analysis, MEDIUM confidence

---
*Architecture research for: HappeningNow.travel — interactive travel events map platform*
*Researched: 2026-03-01*
