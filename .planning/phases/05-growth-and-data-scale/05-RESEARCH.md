# Phase 5: Growth and Data Scale - Research

**Researched:** 2026-03-02
**Domain:** Spatial search, geocoding, email segmentation, data ingestion
**Confidence:** MEDIUM

## Summary

Phase 5 adds three capabilities: a reverse search page where users find events near a location within a date range, region-based email alerts via Kit (ConvertKit), and a Wikipedia-based seed data script. The spatial search is the most technically complex piece, requiring server-side geocoding (Nominatim for single lookups, NOT autocomplete), a PostGIS RPC function using `ST_DWithin` with geography casting for meter-based radius queries, and a client-side scoring algorithm that ranks results by uniqueness, distance, and crowd level.

A critical discovery: Nominatim's usage policy explicitly forbids autocomplete/search-as-you-type on their public API. The CONTEXT.md specifies "Nominatim autocomplete" for location entry, but this must be implemented as debounced server-side lookups (minimum 1 second between requests) or by using Photon (komoot's free geocoder designed for search-as-you-type). The project already uses geometry(Point, 4326) columns, so the spatial query must cast to geography for meter-based distance: `ST_DWithin(location::geography, point::geography, radius_meters)`.

**Primary recommendation:** Use Photon (photon.komoot.io) for search-as-you-type location input (it is designed for this), Nominatim for server-side geocoding of final selected location, PostGIS ST_DWithin with geography cast for radius search, client-side scoring with `scale` as uniqueness proxy, and a simple TypeScript script using MediaWiki API + cheerio for Wikipedia seed data.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Horizontal bar form at top -- Google Flights style with location, dates, category, distance in one row
- Text input with Nominatim autocomplete for location entry
- Results displayed as cards + map side by side -- ranked cards on left, map with highlighted markers on right
- Auto-search on filter change (debounced) -- no explicit search button
- Clicking a result card highlights its map marker and vice versa
- Score is hidden from users -- determines rank order only, no visible badge or number
- Uniqueness is the dominant weighting factor -- a one-of-a-kind festival far away ranks above a generic fair nearby
- Quick indicator tags on each card showing key factors: "Highly Unique", "Low Crowds", "2h drive" -- explains ranking without showing the score
- Haversine straight-line distance estimate for travel time (~60km/h average) -- no external routing API
- Signup CTA on search results page only (not on region/SEO pages)
- Region pre-filled from current search location -- minimal friction
- Inline success confirmation -- form transforms to "You'll get alerts for events near [location]"
- Optional category filter checkboxes (festivals, wildlife, markets, etc.) -- default is all events
- Wikipedia scraping as seed/placeholder data -- real data pipeline coming in a future milestone with its own spec
- Minimal one-time/manually-triggered script -- not a reusable pipeline framework
- Script scrapes Wikipedia festival/event lists and geocodes via Nominatim to get lat/lng
- Events arrive search-ready with coordinates for spatial queries

### Claude's Discretion
- Loading skeletons and empty state design for search page
- Exact indicator tag labels and styling
- ConvertKit integration specifics and sequence design
- Wikipedia page targeting and scraping selectors
- Quality thresholds for seed data inclusion

### Deferred Ideas (OUT OF SCOPE)
- Full data ingestion pipeline with PredictHQ and other sources -- future milestone with dedicated spec
- Alert signup on region/SEO pages -- could revisit if search page placement isn't getting enough signups
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SRCH-01 | `/search` page with form: date range + location/airport + category filter + max travel distance | Photon API for location autocomplete, debounced form with URL state, horizontal bar layout |
| SRCH-02 | Nominatim geocoding for location input | Photon for type-ahead, Nominatim for final geocode; server-side API route with caching |
| SRCH-03 | PostGIS spatial query for events within radius of user location overlapping date range | ST_DWithin with geography cast, month overlap logic from existing get_events_bbox pattern |
| SRCH-04 | "Worth the trip" scoring algorithm (event scale x uniqueness / crowd level x distance) | Client-side scoring using `scale` as uniqueness proxy, Haversine for distance, crowd_level mapping |
| SRCH-05 | Results rendered as ranked cards with photo, travel time, crowd indicator, price range, affiliate links | Reuse existing EventPanel/card patterns, add indicator tags, affiliate link helpers already exist |
| SRCH-06 | Results simultaneously shown as highlighted markers on the map | MapLibre setFilter/setPaintProperty on search result IDs, reuse existing map infrastructure |
| EMAIL-04 | Alert signup: "Alert me about events in [region]" | Extend existing Kit integration with region tag, new subscribe endpoint variant |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router, API routes, SSR | Already in project |
| @supabase/supabase-js | ^2.98.0 | PostGIS RPC calls | Already in project |
| MapLibre GL JS | ^5.19.0 | Map rendering, marker highlighting | Already in project |
| zod | ^4.3.6 | Request validation | Already in project, used in events API |
| cheerio | ^1.0.0 | HTML parsing for Wikipedia tables | Standard Node.js HTML parser, lightweight |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Photon API | hosted | Search-as-you-type location geocoding | Location input autocomplete on /search page |
| Nominatim API | hosted | Server-side geocoding (final resolution) | Geocoding Wikipedia scraped locations |
| MediaWiki API | hosted | Fetching Wikipedia page HTML | Wikipedia seed data script |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Photon for autocomplete | Nominatim only | Nominatim FORBIDS autocomplete; Photon is designed for it |
| cheerio for parsing | JSDOM | cheerio is 10x faster, smaller, sufficient for table extraction |
| Client-side scoring | DB-side scoring | Client-side is simpler, avoids complex SQL, dataset is small (<1000 events) |

**Installation:**
```bash
npm install cheerio
```

No other new packages needed -- all other dependencies already exist in the project.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── search/
│   │   └── page.tsx              # /search page (server component shell)
│   ├── api/
│   │   ├── geocode/
│   │   │   └── route.ts          # Proxy to Photon/Nominatim with caching
│   │   ├── search/
│   │   │   └── route.ts          # PostGIS spatial search endpoint
│   │   └── subscribe/
│   │       └── route.ts          # Existing + extend for region alerts
├── components/
│   ├── search/
│   │   ├── SearchBar.tsx         # Horizontal form bar
│   │   ├── LocationInput.tsx     # Autocomplete input with Photon
│   │   ├── SearchResults.tsx     # Ranked result cards
│   │   └── ResultCard.tsx        # Individual result with indicator tags
│   └── panel/
│       └── AlertSignup.tsx       # Region alert email capture
├── lib/
│   ├── geocode.ts                # Geocoding helper (Photon + Nominatim)
│   └── scoring.ts                # "Worth the trip" scoring algorithm
scripts/
└── scrape-wikipedia.ts           # One-time Wikipedia seed script
supabase/
└── functions/
    └── search_events_nearby.sql  # PostGIS radius + date overlap RPC
```

### Pattern 1: Server-Side Geocoding Proxy
**What:** API route that proxies Photon requests, adding caching and rate limiting
**When to use:** All location autocomplete requests from the search page
**Example:**
```typescript
// src/app/api/geocode/route.ts
// Source: Photon API docs (https://github.com/komoot/photon/blob/master/docs/api-v1.md)
import { NextResponse } from 'next/server';

const PHOTON_BASE = 'https://photon.komoot.io/api/';
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q || q.length < 2) {
    return NextResponse.json({ features: [] });
  }

  const cacheKey = q.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const url = new URL(PHOTON_BASE);
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '5');
  url.searchParams.set('lang', 'en');
  // Filter to cities/towns/countries only (not streets/houses)
  url.searchParams.set('layer', 'city,state,country');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'HappeningNow.travel/1.0' },
  });

  if (!res.ok) {
    return NextResponse.json({ features: [] }, { status: 502 });
  }

  const data = await res.json();
  cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL });
  return NextResponse.json(data);
}
```

### Pattern 2: PostGIS Radius Search with Date Overlap
**What:** Supabase RPC function using ST_DWithin with geography cast
**When to use:** The core search query
**Example:**
```sql
-- supabase/functions/search_events_nearby.sql
-- Source: PostGIS docs (https://postgis.net/docs/ST_DWithin.html)
CREATE OR REPLACE FUNCTION search_events_nearby(
  user_lng float,
  user_lat float,
  radius_meters float,
  start_m int DEFAULT NULL,
  end_m int DEFAULT NULL,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  category text,
  description text,
  image_url text,
  start_month int,
  end_month int,
  lng float,
  lat float,
  country text,
  region text,
  scale int,
  crowd_level text,
  booking_destination_id text,
  getyourguide_location_id text,
  distance_meters float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    e.id, e.name, e.slug, e.category, e.description, e.image_url,
    e.start_month, e.end_month,
    ST_X(e.location) AS lng,
    ST_Y(e.location) AS lat,
    e.country, e.region, e.scale, e.crowd_level,
    e.booking_destination_id, e.getyourguide_location_id,
    ST_Distance(e.location::geography, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) AS distance_meters
  FROM events e
  WHERE ST_DWithin(
    e.location::geography,
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
    radius_meters
  )
  AND (filter_category IS NULL OR e.category = filter_category)
  AND (start_m IS NULL OR end_m IS NULL OR (
    CASE
      WHEN e.start_month <= e.end_month THEN
        -- Normal range: event March-June, search April-May
        NOT (end_m < e.start_month OR start_m > e.end_month)
      ELSE
        -- Wrap-around: event Nov-Feb
        NOT (start_m > e.end_month AND end_m < e.start_month)
    END
  ))
  ORDER BY distance_meters ASC;
$$;
```

### Pattern 3: Client-Side "Worth the Trip" Scoring
**What:** Score events by uniqueness, distance, and crowd level for ranking
**When to use:** After fetching search results, before rendering
**Example:**
```typescript
// src/lib/scoring.ts
interface ScoredEvent {
  scale: number;          // 1-10, used as uniqueness proxy
  crowd_level: string | null;
  distance_meters: number;
}

const CROWD_PENALTY: Record<string, number> = {
  quiet: 1.0,    // no penalty
  moderate: 0.7,
  busy: 0.4,
};

/**
 * "Worth the trip" score. Higher = better.
 * Uniqueness (scale) is dominant. Distance and crowds reduce score.
 * Formula: (scale^2) / (distance_km * crowd_penalty)
 */
export function worthTheTripScore(event: ScoredEvent): number {
  const uniqueness = event.scale * event.scale; // Square to make dominant
  const distanceKm = Math.max(event.distance_meters / 1000, 1); // min 1km
  const crowdFactor = CROWD_PENALTY[event.crowd_level ?? 'moderate'] ?? 0.7;
  return (uniqueness * crowdFactor) / Math.log2(distanceKm + 1);
}

/**
 * Haversine travel time estimate at ~60km/h average.
 */
export function estimateTravelTime(distanceMeters: number): string {
  const hours = distanceMeters / 1000 / 60;
  if (hours < 1) return `${Math.round(hours * 60)}min drive`;
  return `${hours.toFixed(1)}h drive`;
}

/**
 * Generate indicator tags for a result card.
 */
export function getIndicatorTags(event: ScoredEvent): string[] {
  const tags: string[] = [];
  if (event.scale >= 8) tags.push('Highly Unique');
  else if (event.scale >= 6) tags.push('Unique');
  if (event.crowd_level === 'quiet') tags.push('Low Crowds');
  tags.push(estimateTravelTime(event.distance_meters));
  return tags;
}
```

### Pattern 4: Debounced Auto-Search with URL State
**What:** Search form syncs to URL params, auto-fires on change
**When to use:** The search page form
**Example:**
```typescript
// Search page pattern: useSearchParams for state, debounced fetch
'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useCallback } from 'react';

function useDebounce(callback: () => void, delay: number) {
  const timerRef = useRef<NodeJS.Timeout>();
  return useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(callback, delay);
  }, [callback, delay]);
}

// URL state: /search?lat=51.5&lng=-0.1&from=3&to=6&cat=festival&radius=200
// All filter changes update URL params -> triggers fetch -> updates results
```

### Anti-Patterns to Avoid
- **Direct Nominatim autocomplete from client:** Forbidden by usage policy, will get banned. Use Photon or server proxy.
- **Geography column type for events:** Project uses geometry(Point, 4326). Do NOT migrate to geography type. Cast inline with `::geography` in queries.
- **Complex scoring in SQL:** Keep scoring client-side. The dataset is small (<1000 events), and the formula will iterate. SQL scoring adds complexity with no performance benefit.
- **Building a full pipeline framework for Wikipedia:** The user explicitly wants a minimal one-time script, not a reusable pipeline.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Location autocomplete | Custom geocoder/index | Photon API (photon.komoot.io) | Designed for search-as-you-type, handles typos, free |
| HTML table parsing | Regex-based parser | cheerio | Tables have rowspan, colspan, nested elements |
| Spatial distance queries | Haversine in JS | PostGIS ST_DWithin + ST_Distance | Uses spatial index, handles edge cases |
| Geocoding rate limiting | Custom queue | Server-side API route with in-memory cache | Simple, sufficient for seed script volume |
| GeoJSON response format | Manual JSON assembly | PostGIS ST_AsGeoJSON + json_build_object | Already established pattern in get_events_bbox |

**Key insight:** The project already has all spatial infrastructure (PostGIS, GeoJSON RPCs, MapLibre layers). The search feature is an extension, not a new system. Reuse the existing patterns from `get_events_bbox.sql` and `src/app/api/events/route.ts`.

## Common Pitfalls

### Pitfall 1: Nominatim Autocomplete Ban
**What goes wrong:** Implementing type-ahead search against Nominatim's public API
**Why it happens:** Nominatim's usage policy explicitly forbids autocomplete. Each keystroke = a request, violating the 1 req/sec limit.
**How to avoid:** Use Photon (photon.komoot.io) for autocomplete. It is explicitly designed for search-as-you-type. Use Nominatim only for the Wikipedia seed script geocoding (single lookups with 1s delay).
**Warning signs:** Getting 429 errors or IP bans from nominatim.openstreetmap.org

### Pitfall 2: Geometry vs Geography Distance Units
**What goes wrong:** Using ST_DWithin on geometry(Point, 4326) column with meters as distance
**Why it happens:** geometry SRID 4326 distance units are degrees, not meters. 100 "meters" actually means 100 degrees (~11,000 km).
**How to avoid:** Always cast to geography: `ST_DWithin(location::geography, point::geography, radius_meters)`
**Warning signs:** All events worldwide appearing in search results regardless of radius

### Pitfall 3: Month Overlap with Wrap-Around
**What goes wrong:** Events spanning December-February (start_month=12, end_month=2) not matching searches in January
**Why it happens:** Simple `BETWEEN` comparison fails when start > end (wrap-around)
**How to avoid:** Use the same CASE-based logic already in get_events_bbox.sql. The project has a working pattern for this.
**Warning signs:** Winter festivals disappearing from search results

### Pitfall 4: Photon/Nominatim Response Format Mismatch
**What goes wrong:** Assuming Photon returns the same format as Nominatim
**Why it happens:** Both use OSM data but have different JSON response structures
**How to avoid:** Photon returns GeoJSON FeatureCollection with properties (name, city, country, countrycode, osm_key, osm_value). Nominatim returns flat objects with display_name, lat, lon. Use a normalizing adapter.
**Warning signs:** Undefined errors when accessing response fields

### Pitfall 5: Wikipedia Table Inconsistency
**What goes wrong:** Scraping script breaks on different Wikipedia list pages
**Why it happens:** Wikipedia tables have no enforced schema. Different country pages use different column orders, header names, and formatting conventions.
**How to avoid:** Target a small set of well-structured pages. Add per-page column mapping. Validate output before inserting. Accept that some pages will need manual data entry.
**Warning signs:** Missing data, wrong columns, geocoding failures on malformed location strings

### Pitfall 6: Stale In-Memory Cache on Vercel
**What goes wrong:** In-memory Map() cache for geocoding results resets on every cold start
**Why it happens:** Vercel serverless functions are ephemeral. Cache lives only for the function instance lifetime.
**How to avoid:** For the geocode proxy, this is acceptable -- the cache helps within a session and reduces redundant calls. For persistent caching, use Supabase or KV, but it is not needed at this scale.
**Warning signs:** Higher-than-expected Photon API calls. Not a blocking issue.

## Code Examples

### PostGIS: Creating the Search RPC Function
```sql
-- Source: PostGIS docs (https://postgis.net/docs/ST_DWithin.html)
-- Pattern follows existing get_events_bbox.sql

-- CRITICAL: Cast geometry to geography for meter-based distance
-- The events table uses geometry(Point, 4326), NOT geography.
-- ST_DWithin(geom::geography, point::geography, meters) is correct.
-- ST_DWithin(geom, point, meters) would use DEGREES and return wrong results.

SELECT ST_DWithin(
  e.location::geography,
  ST_SetSRID(ST_MakePoint(-0.1276, 51.5074), 4326)::geography,
  200000  -- 200km in meters
)
FROM events e;
```

### Photon API: Location Autocomplete
```typescript
// Source: Photon API docs (https://github.com/komoot/photon/blob/master/docs/api-v1.md)
// Returns GeoJSON FeatureCollection
const response = await fetch(
  'https://photon.komoot.io/api/?q=london&limit=5&lang=en&layer=city,state,country'
);
const data = await response.json();
// data.features[0].geometry.coordinates = [lng, lat]
// data.features[0].properties = { name, city, state, country, countrycode, ... }
```

### MapLibre: Highlighting Search Result Markers
```typescript
// Source: existing MapView.tsx pattern
// After search results arrive, highlight matching markers on the map
// Use setFilter to show only result events in a highlight layer
const resultIds = results.map(r => r.id);
map.setFilter('events-highlight', ['in', ['get', 'id'], ['literal', resultIds]]);
map.setPaintProperty('events-highlight', 'circle-color', '#ef4444');
map.setPaintProperty('events-highlight', 'circle-stroke-width', 3);
```

### Wikipedia Seed Script: MediaWiki API + Cheerio
```typescript
// Fetch parsed HTML for a Wikipedia page
const url = 'https://en.wikipedia.org/w/api.php?action=parse&page=List_of_music_festivals&prop=text&format=json';
const res = await fetch(url, { headers: { 'User-Agent': 'HappeningNow.travel/1.0 seed script' } });
const data = await res.json();
const html = data.parse.text['*'];

// Parse tables with cheerio
import * as cheerio from 'cheerio';
const $ = cheerio.load(html);
$('table.wikitable tr').each((_, row) => {
  const cells = $(row).find('td');
  if (cells.length >= 3) {
    const name = $(cells[0]).text().trim();
    const location = $(cells[1]).text().trim();
    // ... geocode location with Nominatim (with 1s delay between requests)
  }
});
```

### Kit API: Region Alert Subscription
```typescript
// Extend existing convertkit.ts pattern
// Add region tag support alongside existing festivals/wildlife tags
export async function subscribeWithRegionAlert(
  email: string,
  region: string,
  categories: string[]
): Promise<void> {
  const subscriber = await createSubscriber(email);

  // Tag with region (create tag if it doesn't exist, or use custom field)
  // Kit v4: custom fields are better for free-text region data
  await setSubscriberCustomField(subscriber.id, 'alert_region', region);

  // Apply category tags as before
  for (const cat of categories) {
    const tagId = TAG_IDS[cat.toLowerCase()];
    if (tagId) await tagSubscriber(subscriber.id, tagId);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Nominatim for autocomplete | Photon for type-ahead, Nominatim for batch geocoding | Ongoing policy | Must use Photon for search-as-you-type |
| ConvertKit API v3 | Kit API v4 (beta) | 2024 rebrand | v4 uses X-Kit-Api-Key header, different endpoints; project already uses v4 |
| geography columns for spatial search | geometry(Point, 4326) with ::geography cast | N/A | Project decision: geometry is 5-10x faster for most queries; cast only when meters needed |

**Deprecated/outdated:**
- ConvertKit API v3: Still works but v4 is the documented path forward. Project already uses v4.
- PredictHQ integration: Explicitly deferred to future milestone per CONTEXT.md.

## Open Questions

1. **Uniqueness field missing from schema**
   - What we know: The events table has `scale` (1-10) but no explicit `uniqueness` column. CONTEXT.md says uniqueness is the dominant scoring factor.
   - What's unclear: Whether `scale` is a sufficient proxy for uniqueness, or if a new column should be added.
   - Recommendation: Use `scale` as the uniqueness proxy. It represents event significance/size which correlates with uniqueness. Adding a separate column would require re-seeding all data. If refinement is needed later, a `uniqueness` column can be added as a v2 enhancement.

2. **Photon API rate limits for production**
   - What we know: Photon's public instance (photon.komoot.io) says "reasonable limit" with no exact number. It handles "thousands of requests per minute" in production for Komoot.
   - What's unclear: Whether HappeningNow's traffic will exceed the "reasonable" threshold.
   - Recommendation: Start with the public instance. If throttled, self-hosting Photon is straightforward (Java jar + download pre-built database). Monitor 429 responses.

3. **Kit custom fields vs tags for region data**
   - What we know: Kit tags are fixed labels (festivals, wildlife). Regions are free-text ("London", "Barcelona", "Southeast Asia").
   - What's unclear: Whether Kit's free tier supports custom fields, and how to trigger automated alerts based on region.
   - Recommendation: Use Kit custom fields for the region string. Automated alert sending requires Kit automations or manual broadcast filtering by custom field. For v1, collect the data; automation can be manual.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | vitest.config.ts |
| Quick run command | `npm test` |
| Full suite command | `npm test` |
| Estimated runtime | ~5 seconds |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRCH-01 | /search page renders form with location, dates, category, distance | component | `npx vitest run tests/search/search-page.test.tsx -x` | No - Wave 0 gap |
| SRCH-02 | Geocode API route proxies Photon, validates input, caches | unit | `npx vitest run tests/api/geocode.test.ts -x` | No - Wave 0 gap |
| SRCH-03 | Search API returns events within radius with date overlap | unit | `npx vitest run tests/api/search.test.ts -x` | No - Wave 0 gap |
| SRCH-04 | Scoring algorithm ranks by uniqueness > distance > crowd | unit | `npx vitest run tests/scoring.test.ts -x` | No - Wave 0 gap |
| SRCH-05 | Result cards show indicator tags, travel time, affiliate links | component | `npx vitest run tests/search/result-card.test.tsx -x` | No - Wave 0 gap |
| SRCH-06 | Map highlights search result markers | unit | `npx vitest run tests/search/map-highlight.test.ts -x` | No - Wave 0 gap |
| EMAIL-04 | Alert signup submits region + categories to subscribe API | unit | `npx vitest run tests/api/alert-signup.test.ts -x` | No - Wave 0 gap |

### Nyquist Sampling Rate
- **Minimum sample interval:** After every committed task, run: `npm test`
- **Full suite trigger:** Before merging final task of any plan wave
- **Phase-complete gate:** Full suite green before `/gsd:verify-work` runs
- **Estimated feedback latency per task:** ~5 seconds

### Wave 0 Gaps (must be created before implementation)
- [ ] `tests/search/search-page.test.tsx` -- covers SRCH-01 (form rendering, field validation)
- [ ] `tests/api/geocode.test.ts` -- covers SRCH-02 (Photon proxy, input validation, caching)
- [ ] `tests/api/search.test.ts` -- covers SRCH-03 (spatial query params, response shape)
- [ ] `tests/scoring.test.ts` -- covers SRCH-04 (scoring formula, ranking order, indicator tags)
- [ ] `tests/search/result-card.test.tsx` -- covers SRCH-05 (card rendering, tags, affiliate links)
- [ ] `tests/search/map-highlight.test.ts` -- covers SRCH-06 (filter expression, highlight layer)
- [ ] `tests/api/alert-signup.test.ts` -- covers EMAIL-04 (region alert subscription)

## Sources

### Primary (HIGH confidence)
- [PostGIS ST_DWithin docs](https://postgis.net/docs/ST_DWithin.html) - function signatures, geography vs geometry, distance units
- [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/) - autocomplete forbidden, rate limits, caching requirement
- [Photon API docs](https://github.com/komoot/photon/blob/master/docs/api-v1.md) - search endpoint, parameters, response format, layer filtering
- [Photon hosted instance](https://photon.komoot.io/) - production-ready, GeoJSON responses
- Existing codebase - schema.sql, get_events_bbox.sql, events API route, convertkit.ts, EmailCapture.tsx

### Secondary (MEDIUM confidence)
- [PostGIS geometry vs geography blog](https://blog.frank-mich.com/its-a-trap-postgis-geometry-with-srid-4326-is-not-a-geography/) - casting pattern verified against official docs
- [MediaWiki API: Parsing wikitext](https://www.mediawiki.org/wiki/API:Parsing_wikitext) - action=parse endpoint for Wikipedia HTML
- [Kit API v4 developer docs](https://developers.kit.com/api-reference/upgrading-to-v4) - tag subscriber endpoints, custom fields

### Tertiary (LOW confidence)
- Wikipedia table structure consistency - varies by page, scraping robustness needs validation per target page
- Kit API v4 custom field support on free tier - not confirmed in search results, needs validation
- Photon public instance rate limits - "reasonable" is undefined, needs monitoring

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all core libraries already in project, only adding cheerio
- Architecture: HIGH - extends existing patterns (PostGIS RPC, API routes, MapLibre layers)
- Pitfalls: HIGH - Nominatim autocomplete ban is well-documented, geometry/geography casting is verified
- Scoring algorithm: MEDIUM - formula is reasonable but untested; tuning may be needed
- Wikipedia scraping: MEDIUM - MediaWiki API is reliable, but table structure varies by page
- Kit region alerts: LOW - custom field approach needs validation on free tier

**Research date:** 2026-03-02
**Valid until:** 2026-04-01 (stable domain, 30-day validity)
