# Phase 2: Database and Affiliate Infrastructure - Research

**Researched:** 2026-03-01
**Domain:** PostGIS spatial queries, Next.js Route Handlers, affiliate deep links, SSG detail pages, structured data
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Booking.com deep links pre-fill destination city + event check-in/check-out dates
- When no specific Booking.com match exists, fall back to a generic destination search for the nearest city/region (still earns commission)
- Small inline FTC disclosure note near each affiliate CTA (e.g., "Affiliate link" badge or small text)
- GetYourGuide links open to a location-based search for the event's city/region (no curated experience IDs needed)
- Full-width hero image with event name and dates overlaid (immersive travel-site feel)
- Below the hero, include all of: event description + dates + location, crowd level badge + best time tip, mini embedded MapLibre map pinpointing the event, and a nearby events section (same region or time period)
- OG images use the event photo directly from the database (no generated branded templates)
- Mini animated map showing the migration route with marked viewing locations, month-aware with current position highlighted
- Same content structure as event pages where applicable (hero, description, crowd info, nearby)
- OG images use the wildlife photo directly
- Full switch from Phase 1 static seed data to live bbox API calls (clean break, no hybrid approach)
- Map re-fetches events on debounced moveend (300-500ms) when user pans/zooms
- API returns all events in the viewport (no server-side pagination) — ~600 total events keeps payloads manageable, MapLibre handles client-side clustering
- API supports server-side category filtering via ?category=festival|wildlife parameter
- Breadcrumb pattern: Home > Region > Event/Species Name (consistent across both event and wildlife pages)
- Breadcrumb region links point to future SEO listing page URLs (e.g., /festivals/southeast-asia) — reserved now, built in Phase 4
- Floating "Back to Map" button on all detail pages, preserving last viewport/filters

### Claude's Discretion
- Exact debounce timing (300-500ms range)
- Loading states and error handling on detail pages
- Mini map sizing and interaction details
- Nearby events algorithm (geographic vs temporal proximity)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PAGE-03 | Event schema JSON-LD structured data on all event pages | JSON-LD `<script>` tag pattern with `schema-dts` types; Event schema with location, dates, attendance mode |
| PAGE-04 | Open Graph meta tags for social sharing on all detail pages | `generateMetadata` with openGraph field; use event/wildlife photo URL directly as OG image |
| PAGE-05 | Breadcrumb navigation on all pages | BreadcrumbList JSON-LD + visual breadcrumb component; Home > Region > Name pattern |
| PERF-02 | Map initial load < 2 seconds | Bbox API replaces full-table RPC; only viewport events loaded; debounced re-fetch on moveend |
| PERF-03 | API response time < 200ms with PostGIS spatial indexes | GiST index on events.location already exists; bbox RPC using && operator with ST_MakeEnvelope; EXPLAIN ANALYZE verification |
</phase_requirements>

## Summary

This phase transitions from Phase 1's full-table GeoJSON RPC to a production-quality spatial API, adds SSG detail pages for events and wildlife with structured data, and hardens the affiliate link infrastructure with FTC-compliant disclosure.

The PostGIS schema is already well-structured from Phase 1: `geometry(Point, 4326)` columns with GiST indexes are in place. The main work is creating a parameterized bbox RPC function that accepts viewport coordinates plus filter params, then wiring MapView to call a Next.js Route Handler on debounced `moveend`. For detail pages, Next.js `generateStaticParams` + `generateMetadata` provide SSG with OG tags, and JSON-LD is rendered as a `<script>` tag in the page component. Affiliate links already have working URL builders from Phase 1; this phase adds Awin tracking parameter support and the FTC disclosure component.

**Primary recommendation:** Build the bbox RPC function in Supabase SQL, expose it via a `/api/events` Route Handler with Zod validation, create `/event/[slug]` and `/wildlife/[slug]` SSG pages with `generateMetadata` and JSON-LD, and add a shared Breadcrumbs component with BreadcrumbList structured data.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router, Route Handlers, SSG with generateStaticParams | Already installed; project framework |
| @supabase/supabase-js | ^2.98.0 | Supabase client for RPC calls | Already installed; data layer |
| zod | 4.3.6 | Query parameter validation in Route Handlers | Already installed as transitive dep; TypeScript-first validation |
| maplibre-gl | ^5.19.0 | Map rendering, moveend event for bbox re-fetch | Already installed; map framework |
| schema-dts | latest | TypeScript types for JSON-LD structured data | Google-maintained, 100k+ weekly downloads, type-safe schema.org |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| PostGIS (Supabase) | 3.x | ST_MakeEnvelope, ST_AsGeoJSON, && operator | Bounding box queries in RPC functions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| schema-dts | Raw JSON objects | schema-dts catches schema errors at compile time; raw is simpler but error-prone |
| Zod in Route Handler | Manual parsing | Zod provides type inference + validation in one step; already available |
| Supabase RPC for bbox | Direct PostgREST filter | RPC gives full SQL control over ST_MakeEnvelope; PostgREST lacks native geometry operators |

**Installation:**
```bash
npm install schema-dts
```

Zod 4.3.6 is already installed in node_modules (transitive dependency). Verify it works as a direct import; if not, add to package.json:
```bash
npm install zod
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── api/
│   │   └── events/
│   │       └── route.ts          # Bbox events Route Handler
│   ├── event/
│   │   └── [slug]/
│   │       └── page.tsx          # SSG event detail page
│   ├── wildlife/
│   │   └── [slug]/
│   │       └── page.tsx          # SSG wildlife detail page
│   └── layout.tsx                # metadataBase for OG URLs
├── components/
│   ├── ui/
│   │   ├── Breadcrumbs.tsx       # Shared breadcrumb nav + JSON-LD
│   │   ├── FtcDisclosure.tsx     # Inline affiliate disclosure
│   │   └── BackToMap.tsx         # Floating back-to-map button
│   ├── detail/
│   │   ├── EventHero.tsx         # Full-width hero with overlaid text
│   │   ├── EventContent.tsx      # Description, dates, crowd, mini map
│   │   ├── NearbyEvents.tsx      # Related events section
│   │   └── MiniMap.tsx           # Small embedded MapLibre map
│   └── panel/
│       └── AffiliateLinks.tsx    # Updated with FTC disclosure
├── lib/
│   ├── affiliates.ts             # Existing — enhance with Awin params
│   ├── affiliate/                # OR keep flat, Claude's discretion
│   │   ├── booking.ts
│   │   └── gyg.ts
│   └── supabase/
│       └── queries.ts            # Server-side data fetching helpers
supabase/
└── functions/
    └── get_events_bbox.sql       # New bbox RPC function
```

### Pattern 1: PostGIS Bounding Box RPC Function
**What:** A Supabase RPC function that accepts viewport bounds and optional filters, returns GeoJSON
**When to use:** Every map moveend event triggers this via the Route Handler

```sql
-- Source: https://supabase.com/docs/guides/database/extensions/postgis
CREATE OR REPLACE FUNCTION get_events_bbox(
  min_lng float,
  min_lat float,
  max_lng float,
  max_lat float,
  filter_month int DEFAULT NULL,
  filter_category text DEFAULT NULL
)
RETURNS json
LANGUAGE sql
STABLE
AS $$
  SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(
      json_agg(
        json_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(e.location)::json,
          'properties', json_build_object(
            'id', e.id,
            'name', e.name,
            'slug', e.slug,
            'category', e.category,
            'description', e.description,
            'image_url', e.image_url,
            'start_month', e.start_month,
            'end_month', e.end_month,
            'scale', e.scale,
            'crowd_level', e.crowd_level,
            'country', e.country,
            'region', e.region,
            'booking_destination_id', e.booking_destination_id,
            'getyourguide_location_id', e.getyourguide_location_id
          )
        )
      ),
      '[]'::json
    )
  )
  FROM events e
  WHERE e.location && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    AND (filter_month IS NULL OR (
      CASE WHEN e.start_month <= e.end_month
        THEN filter_month BETWEEN e.start_month AND e.end_month
        ELSE filter_month >= e.start_month OR filter_month <= e.end_month
      END
    ))
    AND (filter_category IS NULL OR e.category = filter_category);
$$;
```

**Key:** The `&&` operator triggers the GiST index scan. `ST_MakeEnvelope` creates the bounding box from viewport coordinates. The `COALESCE(..., '[]'::json)` pattern prevents null when no events match (established in Phase 1).

### Pattern 2: Next.js Route Handler with Zod Validation
**What:** `/api/events/route.ts` validates query params and calls the Supabase RPC
**When to use:** Map moveend triggers fetch to this endpoint

```typescript
// Source: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
// Source: https://dub.co/blog/zod-api-validation
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';

const bboxSchema = z.object({
  bbox: z.string().transform((s) => {
    const parts = s.split(',').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) throw new Error('Invalid bbox');
    return { min_lng: parts[0], min_lat: parts[1], max_lng: parts[2], max_lat: parts[3] };
  }),
  month: z.coerce.number().int().min(1).max(12).optional(),
  category: z.enum(['festival', 'wildlife']).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = bboxSchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { bbox, month, category } = parsed.data;
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc('get_events_bbox', {
    min_lng: bbox.min_lng,
    min_lat: bbox.min_lat,
    max_lng: bbox.max_lng,
    max_lat: bbox.max_lat,
    filter_month: month ?? null,
    filter_category: category ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
```

### Pattern 3: SSG Detail Page with generateMetadata
**What:** `/event/[slug]/page.tsx` with generateStaticParams, generateMetadata, and JSON-LD
**When to use:** All event and wildlife detail pages

```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-static-params
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
import type { Metadata } from 'next';
import type { WithContext, Event as EventSchema } from 'schema-dts';
import { createServerClient } from '@/lib/supabase/server';

export async function generateStaticParams() {
  const supabase = createServerClient();
  const { data } = await supabase.from('events').select('slug');
  return (data ?? []).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServerClient();
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!event) return { title: 'Event Not Found' };

  return {
    title: event.name,
    description: event.description ?? `Discover ${event.name}`,
    openGraph: {
      title: event.name,
      description: event.description ?? `Discover ${event.name}`,
      type: 'article',
      images: event.image_url ? [{ url: event.image_url }] : [],
    },
  };
}
```

### Pattern 4: JSON-LD as Script Tag
**What:** Structured data rendered inline in the page component
**When to use:** Every detail page (Event schema + BreadcrumbList)

```typescript
// Source: https://nextjs.org/docs/app/guides/json-ld
const jsonLd: WithContext<EventSchema> = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: event.name,
  description: event.description ?? '',
  startDate: `${new Date().getFullYear()}-${String(event.start_month).padStart(2, '0')}-01`,
  endDate: `${new Date().getFullYear()}-${String(event.end_month).padStart(2, '0')}-28`,
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  eventStatus: 'https://schema.org/EventScheduled',
  location: {
    '@type': 'Place',
    name: event.country ?? 'Unknown',
    address: {
      '@type': 'PostalAddress',
      addressCountry: event.country ?? '',
      addressRegion: event.region ?? '',
    },
  },
  image: event.image_url ?? undefined,
};

// In JSX:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
  }}
/>
```

### Pattern 5: BreadcrumbList JSON-LD
**What:** Structured breadcrumb data for search engine rich results
**When to use:** Every detail page

```typescript
// Source: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://happeningnow.travel',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: event.region ?? event.country ?? 'Events',
      item: `https://happeningnow.travel/festivals/${slugify(event.region ?? event.country ?? 'events')}`,
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: event.name,
    },
  ],
};
```

### Anti-Patterns to Avoid
- **Calling Supabase directly from client for bbox queries:** Route Handler provides caching, validation, and hides credentials. Always go through `/api/events`.
- **Using geography type instead of geometry:** Project decided on `geometry(Point, 4326)` in Phase 1 for 5-10x faster queries. Do not change column types.
- **Using layer-level setFilter for bbox results:** Continue using source-level filterGeoJSON + setData pattern established in Phase 1 for accurate cluster counts.
- **Putting JSON-LD in layout.tsx:** JSON-LD is page-specific structured data. Render it in the page component, not the layout.
- **Fetching all events on page load then filtering client-side:** Phase 2 switches to bbox API. Remove the `get_events_geojson` RPC call from MapView.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON-LD type safety | Manual JSON objects | `schema-dts` WithContext types | Catches schema.org property errors at compile time |
| Query param validation | Manual parsing + type casting | Zod schema with `.safeParse()` | Handles coercion, provides typed output, returns structured errors |
| Bounding box geometry | JavaScript coordinate math | PostGIS `ST_MakeEnvelope` + `&&` operator | Database-level GiST index scan, not row-by-row comparison |
| OG meta tags | Manual `<meta>` tags in `<head>` | Next.js `generateMetadata` returning `Metadata` object | Framework handles deduplication, merging, streaming |
| Breadcrumb structured data | Custom SEO helper | BreadcrumbList schema from `schema-dts` | Google-documented schema; validates with Rich Results Test |

**Key insight:** PostGIS spatial operators (`&&`, `ST_MakeEnvelope`) leverage GiST indexes for sub-millisecond bounding box filtering. Any client-side or application-level bbox filtering on ~600 events would work, but would not scale and misses the point of having PostGIS.

## Common Pitfalls

### Pitfall 1: PostGIS Extension Schema Mismatch
**What goes wrong:** Supabase can install PostGIS in the `extensions` schema, requiring `extensions.ST_MakeEnvelope()` prefix. Functions using bare `ST_MakeEnvelope()` fail silently or error.
**Why it happens:** Default Supabase projects install extensions in `extensions` schema for security isolation.
**How to avoid:** This project's schema.sql uses `CREATE EXTENSION IF NOT EXISTS postgis;` without schema qualifier, and the existing `get_events_geojson` function uses bare `ST_AsGeoJSON` successfully. Follow the same pattern. If a new project, check with `SELECT extnamespace::regnamespace FROM pg_extension WHERE extname = 'postgis';`.
**Warning signs:** "function st_makeenvelope does not exist" error.

### Pitfall 2: Bbox Coordinate Order (lng/lat vs lat/lng)
**What goes wrong:** Passing latitude as X and longitude as Y to ST_MakeEnvelope produces empty or wrong results.
**Why it happens:** PostGIS uses X=longitude, Y=latitude. MapLibre's `getBounds()` returns `{_sw: {lng, lat}, _ne: {lng, lat}}`. Mixing these up is extremely common.
**How to avoid:** ST_MakeEnvelope signature: `ST_MakeEnvelope(xmin=min_lng, ymin=min_lat, xmax=max_lng, ymax=max_lat, 4326)`. Name parameters explicitly.
**Warning signs:** Queries returning 0 results when the map clearly shows events, or returning events from a different continent.

### Pitfall 3: Missing COALESCE in Aggregate Queries
**What goes wrong:** `json_agg()` returns `NULL` when no rows match, causing the entire JSON response to be null instead of an empty FeatureCollection.
**Why it happens:** SQL aggregate functions return NULL on empty input.
**How to avoid:** Always wrap with `COALESCE(json_agg(...), '[]'::json)`. This pattern is already established in `get_events_geojson.sql`.
**Warning signs:** API returns `null` instead of `{"type":"FeatureCollection","features":[]}` when panning to an area with no events.

### Pitfall 4: Debounce Race Conditions
**What goes wrong:** Rapid pan/zoom fires multiple API calls; slower earlier requests resolve after faster later ones, showing stale data.
**Why it happens:** Network requests don't resolve in order.
**How to avoid:** Use an AbortController per request. On each new moveend, abort the previous fetch. Alternatively, track a request sequence number and discard responses that arrive out of order.
**Warning signs:** Map briefly flashes events from a previous viewport after panning.

### Pitfall 5: generateStaticParams Timeout on Large Dataset
**What goes wrong:** Build times balloon or timeout when generating hundreds of static pages.
**Why it happens:** Each page calls Supabase individually during build.
**How to avoid:** With ~600 events + ~100 wildlife, this is manageable. Use request memoization (Next.js auto-memoizes fetch; for Supabase client calls, use React `cache()`). Consider `dynamicParams = true` (default) so non-pre-rendered slugs are generated on first request.
**Warning signs:** `next build` taking >5 minutes or Vercel build timeout.

### Pitfall 6: Booking.com Date Validation Constraints
**What goes wrong:** Affiliate links with invalid dates (past dates, >500 days in future, checkout before checkin) land on an error page instead of search results.
**Why it happens:** Booking.com validates checkin/checkout strictly: checkin must be within 500 days of today, checkout must be 1-90 days after checkin, format must be yyyy-mm-dd.
**How to avoid:** Always compute dates relative to current date. For month-based events, set checkin to the 1st of the month (or today if that month has already started) and checkout to min(end of month, checkin + 30 days).
**Warning signs:** Affiliate links landing on Booking.com error pages instead of search results.

### Pitfall 7: XSS in JSON-LD
**What goes wrong:** User-controlled strings (event names, descriptions) containing `</script>` can break out of the JSON-LD script tag.
**Why it happens:** `JSON.stringify` does not escape `<` by default.
**How to avoid:** Apply `.replace(/</g, '\\u003c')` to the stringified JSON before inserting into `dangerouslySetInnerHTML`. This is the Next.js recommended approach.
**Warning signs:** Broken page rendering when event descriptions contain HTML-like content.

## Code Examples

### Calling Bbox API from MapView (Client-Side)
```typescript
// In MapView.tsx — replace the existing fetchData with bbox-aware fetching
const fetchBboxEvents = useCallback(async (map: maplibregl.Map, signal: AbortSignal) => {
  const bounds = map.getBounds();
  const bbox = [
    bounds.getWest(),   // min_lng
    bounds.getSouth(),  // min_lat
    bounds.getEast(),   // max_lng
    bounds.getNorth(),  // max_lat
  ].join(',');

  const params = new URLSearchParams({ bbox });
  if (selectedMonth) params.set('month', String(selectedMonth));
  if (activeCategories.length === 1) params.set('category', activeCategories[0]);

  const res = await fetch(`/api/events?${params}`, { signal });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}, [selectedMonth, activeCategories]);

// Debounced moveend handler
useEffect(() => {
  const map = mapRef.current;
  if (!map) return;

  let abortController = new AbortController();
  let timer: ReturnType<typeof setTimeout>;

  const onMoveEnd = () => {
    clearTimeout(timer);
    abortController.abort();
    abortController = new AbortController();

    timer = setTimeout(async () => {
      try {
        const data = await fetchBboxEvents(map, abortController.signal);
        const source = map.getSource('events') as maplibregl.GeoJSONSource;
        if (source) source.setData(data);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error(err);
      }
    }, 350); // 350ms debounce within 300-500ms range
  };

  map.on('moveend', onMoveEnd);
  return () => {
    map.off('moveend', onMoveEnd);
    clearTimeout(timer);
    abortController.abort();
  };
}, [fetchBboxEvents]);
```

### EXPLAIN ANALYZE Verification Query
```sql
-- Run in Supabase SQL Editor to verify <200ms performance
EXPLAIN ANALYZE
SELECT * FROM get_events_bbox(-180, -90, 180, 90, NULL, NULL);

-- Targeted viewport query (should be faster)
EXPLAIN ANALYZE
SELECT * FROM get_events_bbox(100, 10, 110, 20, 3, 'festival');

-- Verify GiST index is being used
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, name FROM events
WHERE location && ST_MakeEnvelope(100, 10, 110, 20, 4326);
-- Should show: "Index Scan using events_location_idx"
```

### Booking.com Deep Link with Date Safety
```typescript
// Enhanced buildBookingLink with date validation
export function buildBookingLink(params: BookingLinkParams): string {
  const base = 'https://www.booking.com/searchresults.html';
  const searchParams = new URLSearchParams();

  const aid = process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID;
  if (aid) searchParams.set('aid', aid);

  // Awin click tracking (if Awin approved)
  // Format: https://www.awin1.com/cread.php?awinmid=XXXXX&awinaffid=XXXXX&ued=ENCODED_URL
  // For now, use direct Booking.com links; Awin wrapping added post-approval

  if (params.destinationId) {
    searchParams.set('dest_id', params.destinationId);
    searchParams.set('dest_type', 'city');
  } else if (params.city) {
    searchParams.set('ss', params.city);
  }

  // Safe date computation
  const today = new Date();
  if (params.checkin) {
    searchParams.set('checkin', params.checkin);
  } else if (params.startMonth) {
    const year = today.getFullYear();
    const targetDate = new Date(year, params.startMonth - 1, 1);
    // If month has passed this year, use next year
    if (targetDate < today) targetDate.setFullYear(year + 1);
    searchParams.set('checkin', targetDate.toISOString().split('T')[0]);
  }

  if (params.checkout) {
    searchParams.set('checkout', params.checkout);
  } else if (params.startMonth) {
    const checkinStr = searchParams.get('checkin');
    if (checkinStr) {
      const checkin = new Date(checkinStr);
      const checkout = new Date(checkin);
      checkout.setDate(checkout.getDate() + 7); // Default 7-day stay
      searchParams.set('checkout', checkout.toISOString().split('T')[0]);
    }
  }

  searchParams.set('no_rooms', '1');
  searchParams.set('group_adults', '2');

  return `${base}?${searchParams}`;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getStaticPaths` (Pages Router) | `generateStaticParams` (App Router) | Next.js 13+ | Must use App Router pattern; params are now a Promise in Next.js 15+ |
| Static `metadata` export | `generateMetadata` async function | Next.js 13.2+ | Enables dynamic OG tags from database |
| `params` as sync object | `params` as `Promise` | Next.js 15+ | Must `await params` in page components and generateMetadata |
| `JSON.stringify` for JSON-LD | `JSON.stringify().replace(/</g, '\\u003c')` | Ongoing | XSS prevention is now explicitly recommended in Next.js docs |
| Zod 3.x | Zod 4.x (installed: 4.3.6) | 2025 | Import from `zod` directly; API is backward-compatible for basic schemas |

**Deprecated/outdated:**
- `getStaticPaths` / `getStaticProps`: Replaced by `generateStaticParams` + async Server Components in App Router
- `themeColor` / `colorScheme` in metadata: Deprecated since Next.js 14; use `generateViewport` instead

## Open Questions

1. **Supabase RPC function search_path for PostGIS**
   - What we know: The existing `get_events_geojson` function uses bare `ST_AsGeoJSON()` successfully, suggesting PostGIS is in the default search_path
   - What's unclear: Whether `set search_path = ''` (Supabase security best practice shown in newer docs) would break PostGIS function resolution
   - Recommendation: Create the new bbox function WITHOUT `set search_path = ''` initially, matching the pattern of the working `get_events_geojson`. Add search_path restriction only if security audit requires it.

2. **Awin vs Direct Booking.com Affiliate Links**
   - What we know: User must apply to Booking.com via Awin (2-4 week approval). Current implementation uses direct `aid=` parameter.
   - What's unclear: Whether Awin requires wrapping links through `awin1.com/cread.php` redirect or if direct `aid=` links work for tracking.
   - Recommendation: Build with direct `aid=` parameter now (already working). Add Awin redirect wrapper as a feature flag when approval is received. The link builder already handles missing env vars gracefully.

3. **Mini MapLibre Map on Detail Pages**
   - What we know: User wants embedded mini map showing event location
   - What's unclear: Whether a second MapLibre instance on detail pages impacts PERF-02 (map initial load < 2s)
   - Recommendation: Lazy-load the mini map with `next/dynamic` + `ssr: false`. Use a static map image as placeholder. The PERF-02 requirement likely applies to the main map page, not detail pages.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 with happy-dom |
| Config file | `vitest.config.mts` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |
| Estimated runtime | ~5 seconds |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAGE-03 | JSON-LD Event structured data rendered in page | unit | `npx vitest run tests/structured-data.test.ts -t "Event JSON-LD"` | No - Wave 0 gap |
| PAGE-04 | OG meta tags set via generateMetadata | unit | `npx vitest run tests/metadata.test.ts -t "Open Graph"` | No - Wave 0 gap |
| PAGE-05 | BreadcrumbList JSON-LD + visual breadcrumbs | unit | `npx vitest run tests/breadcrumbs.test.ts` | No - Wave 0 gap |
| PERF-02 | Map initial load < 2 seconds | manual | Lighthouse audit in Chrome DevTools or `npx lighthouse` | N/A - manual |
| PERF-03 | API response < 200ms with PostGIS indexes | integration | `EXPLAIN ANALYZE SELECT * FROM get_events_bbox(...)` in Supabase SQL Editor | N/A - SQL verification |

### Nyquist Sampling Rate
- **Minimum sample interval:** After every committed task, run: `npx vitest run`
- **Full suite trigger:** Before merging final task of any plan wave
- **Phase-complete gate:** Full suite green before `/gsd:verify-work` runs
- **Estimated feedback latency per task:** ~5 seconds

### Wave 0 Gaps (must be created before implementation)
- [ ] `tests/api/events-bbox.test.ts` -- covers Route Handler validation (Zod schema, error responses)
- [ ] `tests/structured-data.test.ts` -- covers PAGE-03 (Event JSON-LD output) and PAGE-05 (BreadcrumbList JSON-LD)
- [ ] `tests/metadata.test.ts` -- covers PAGE-04 (generateMetadata returns correct OG fields)
- [ ] `tests/affiliates.test.ts` -- already exists, extend with Awin parameter tests and date safety tests
- [ ] `tests/breadcrumbs.test.ts` -- covers PAGE-05 visual component rendering

## Sources

### Primary (HIGH confidence)
- [Next.js generateMetadata docs](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) - OG tags, Metadata type, dynamic metadata pattern (v16.1.6)
- [Next.js generateStaticParams docs](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) - SSG with dynamic routes (v16.1.6)
- [Next.js JSON-LD guide](https://nextjs.org/docs/app/guides/json-ld) - Script tag pattern, XSS prevention, schema-dts usage (v16.1.6)
- [Supabase PostGIS docs](https://supabase.com/docs/guides/database/extensions/postgis) - ST_MakeEnvelope RPC pattern, bbox query, JavaScript client call
- [PostGIS official docs](https://postgis.net/docs/ST_Envelope.html) - ST_MakeEnvelope signature, && operator behavior
- [Google BreadcrumbList docs](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb) - Required properties, JSON-LD format
- [schema-dts npm](https://www.npmjs.com/package/schema-dts) - TypeScript JSON-LD types, WithContext usage

### Secondary (MEDIUM confidence)
- [Booking.com affiliate link docs](https://affiliates.support.booking.com/kb/s/article/Links) - URL parameters: aid, dest_id, checkin, checkout, date format constraints
- [FTC Affiliate Disclosure guidelines](https://www.referralcandy.com/blog/ftc-affiliate-disclosure) - Clear and conspicuous standard, placement near content
- [Dub.co Zod API validation](https://dub.co/blog/zod-api-validation) - Zod with Next.js Route Handlers pattern

### Tertiary (LOW confidence)
- GetYourGuide affiliate deep link parameters - Partner Portal docs behind auth; current implementation uses `partner_id` and `q` params based on Phase 1 working code; exact current parameter spec not verified against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed/available; patterns verified against current official docs
- Architecture: HIGH - PostGIS bbox pattern verified from Supabase docs; SSG pattern from Next.js 16 docs
- Pitfalls: HIGH - Most pitfalls from established PostGIS + Next.js patterns; date validation from Booking.com docs

**Research date:** 2026-03-01
**Valid until:** 2026-03-31 (stable stack, no fast-moving dependencies)
