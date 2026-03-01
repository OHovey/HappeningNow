# Phase 1: Map Foundation - Research

**Researched:** 2026-03-01
**Domain:** Interactive mapping, geospatial data, email capture, affiliate monetisation
**Confidence:** HIGH

## Summary

Phase 1 builds the core product: an interactive world map with event markers, timeline filtering, category toggles, event detail panels with affiliate links, and email capture. The stack is Next.js 15 + TypeScript + Tailwind v4 on Vercel, MapLibre GL JS with OpenFreeMap tiles for the map, Supabase PostgreSQL + PostGIS for geospatial data, Kit (formerly ConvertKit) API v4 for email, and Plausible/next-plausible for analytics.

The architecture centers on a single GeoJSON source loaded once on map init, with `setFilter()` expressions controlling what renders based on month and category. This is a GPU-side operation that avoids re-fetching data or re-parsing JSON on every scrubber interaction. MapLibre GL JS must be isolated as a client-only component via the `next/dynamic` wrapper pattern to prevent SSR failures from WebGL/`window` dependencies.

**Primary recommendation:** Build the map as a single client island with all event data pre-loaded as GeoJSON, using `setFilter()` for timeline and category changes, circle layers (not HTML markers) for performance, and a bottom-sheet panel pattern for event details.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Map visual style:** Pulsing colored dots as event markers, color-coded by category (e.g., festivals vs wildlife). Numbered cluster circles that expand on click/zoom when markers overlap. No emoji or icon markers -- simple dots with pulse animation.
- **Timeline scrubber:** Month pills/tabs (Jan, Feb, Mar...) -- tappable buttons, not a drag slider. Fade in/out transitions when switching months -- markers appear/disappear smoothly. Default view on load: current month's events.
- **Category filtering:** Persistent toggle buttons (Festivals / Wildlife) visible near the map. Always accessible, one-tap to show/hide a category. Works alongside the month selector.
- **Event detail panel:** Bottom sheet pattern -- slides up from bottom on marker click. Hero image at top, full-width -- visual impact first. Event name, description, dates below the photo. Color-coded crowd badge (Busy/Moderate/Quiet) included from Phase 1. Primary action buttons for affiliate CTAs ("Book a stay", "Find tours") -- large, colored, prominent.
- **Email capture:** Email form lives inside the event detail bottom sheet -- contextual CTA ("Get alerts for events like this"). Collects email + interest checkboxes (Festivals / Wildlife). Auto-tags subscriber in ConvertKit based on which event they were viewing. Inline success message replaces the form after submission -- no page reload, no toast.

### Claude's Discretion
- Map theme (dark, light, terrain, etc.)
- Color palette for category coding
- Exact spacing, typography, and layout proportions
- Loading skeleton design
- Error state handling

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | Next.js 15 + TypeScript + Tailwind v4 + App Router on Vercel | Standard Stack: create-next-app scaffold, Tailwind v4 CSS-first config |
| FOUND-02 | Supabase PostgreSQL + PostGIS, core tables with spatial indexes | Architecture: PostGIS enable, geometry(Point,4326), GiST indexes |
| FOUND-03 | Seed data: 500+ festivals, 100+ wildlife events, 30+ destinations | Architecture: GeoJSON export from Supabase, bulk insert patterns |
| FOUND-04 | Seed data: 10+ migration routes as GeoJSON LineStrings | Architecture: geometry column for routes, seed script pattern |
| MAP-01 | MapLibre GL JS with OpenFreeMap tiles, client-only via next/dynamic | Standard Stack: maplibre-gl + OpenFreeMap style URL, SSR isolation pattern |
| MAP-02 | Color-coded pulsing dot markers sized by event scale | Code Examples: circle layer + pulse animation via requestAnimationFrame |
| MAP-03 | Marker clustering with numbered circles | Code Examples: GeoJSON source cluster config, circle+symbol layers |
| MAP-04 | Timeline scrubber with setFilter() on pre-loaded data | Architecture: setFilter expression pattern, month filter logic |
| MAP-05 | Category toggle buttons show/hide marker layers | Architecture: setFilter compound expression with category + month |
| MAP-06 | "What's happening this week" default view | Architecture: initial filter set to current month on map load |
| MAP-07 | Month picker dropdown for direct month selection | Architecture: month pills UI, filter update on click |
| MAP-08 | Click marker opens side panel with details + affiliate CTAs | Architecture: bottom sheet, click handler, panel state |
| MAP-09 | Map controls: zoom, locate me, fullscreen | Standard Stack: NavigationControl, GeolocateControl, FullscreenControl |
| AFFL-01 | Booking.com affiliate deep links with destination + dates | Code Examples: URL format with aid, checkin, checkout params |
| AFFL-02 | GetYourGuide affiliate deep links for tours | Code Examples: deep link with partner ID parameter |
| AFFL-03 | Affiliate CTAs contextually placed at discovery intent | Architecture: bottom sheet CTA buttons pattern |
| EMAIL-01 | Email capture component (inline form) on all pages | Architecture: form inside bottom sheet, inline success state |
| EMAIL-02 | Kit API v4 integration for email submissions | Standard Stack: POST /v4/subscribers endpoint, X-Kit-Api-Key header |
| EMAIL-03 | Interest-based tagging (festivals/wildlife/region) | Code Examples: POST /v4/tags/{tag_id}/subscribers/{id} after creation |
| PERF-04 | Responsive design: mobile-first, touch-optimised map | Pitfalls: touch event handling, bottom sheet mobile UX |
| PERF-05 | Error boundaries and loading states throughout | Architecture: React error boundaries, loading skeletons |
| PERF-06 | Analytics integration (Plausible -- privacy-focused) | Standard Stack: next-plausible package, PlausibleProvider in layout |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.x (latest) | React framework, App Router, SSR/SSG | Industry standard for React; built-in Vercel deployment |
| react / react-dom | 19.x | UI library | Ships with Next.js 15 |
| typescript | 5.x | Type safety | Ships with create-next-app |
| tailwindcss | 4.x | Utility-first CSS | CSS-first config (no JS config file), automatic content detection |
| maplibre-gl | 5.19.x | Interactive vector map rendering | Free, open-source Mapbox fork; WebGL-based; zero API key cost |
| @supabase/supabase-js | 2.x (latest) | Supabase client for PostgreSQL queries | Official JS client; typed queries; works in both server and client |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next-plausible | latest | Plausible analytics integration | App Router layout provider + custom events |
| @tailwindcss/postcss | 4.x | PostCSS plugin for Tailwind v4 | Required for Tailwind v4 build pipeline |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| MapLibre GL JS (vanilla) | react-map-gl / @vis.gl/react-maplibre | React wrappers add abstraction; vanilla gives full control over layers/filters/animations and is better documented for setFilter patterns |
| Plausible | Umami | Both privacy-focused; Plausible has better Next.js package (next-plausible) with proxy support |
| Kit (ConvertKit) API direct | ConvertKit npm package | Official npm packages are v3 only; v4 API is simple enough for direct fetch calls |

**Installation:**
```bash
npx create-next-app@latest happeningnow --typescript --tailwind --eslint --app --src-dir
cd happeningnow
npm install maplibre-gl @supabase/supabase-js next-plausible
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    layout.tsx          # Root layout with PlausibleProvider
    page.tsx            # Home page (server component) renders MapShell
    api/
      subscribe/
        route.ts        # POST handler for email capture (server-side Kit API call)
  components/
    map/
      MapShell.tsx      # Client island wrapper (next/dynamic, ssr:false)
      MapView.tsx       # 'use client' — MapLibre init, layers, controls
      MapControls.tsx   # Zoom, locate, fullscreen button group
      TimelineScrubber.tsx  # Month pills, filter dispatch
      CategoryToggles.tsx   # Festival/Wildlife toggle buttons
    panel/
      EventPanel.tsx    # Bottom sheet with event details
      AffiliateLinks.tsx    # Booking.com + GetYourGuide CTA buttons
      EmailCapture.tsx  # Inline form + success state
    ui/
      BottomSheet.tsx   # Reusable slide-up sheet component
      CrowdBadge.tsx    # Color-coded crowd indicator
      ErrorBoundary.tsx # React error boundary wrapper
      LoadingSkeleton.tsx   # Skeleton placeholder
  lib/
    supabase/
      client.ts         # createClient singleton (browser)
      server.ts         # createClient for server components / API routes
      types.ts          # Generated or manual DB types
    map/
      sources.ts        # GeoJSON source config, clustering params
      layers.ts         # Layer definitions (circles, clusters, symbols)
      filters.ts        # setFilter expression builders
      animations.ts     # Pulse animation loop
    convertkit.ts       # Kit API v4 helper (subscribe, tag)
    affiliates.ts       # Booking.com + GetYourGuide URL builders
    constants.ts        # Category colors, month names, etc.
  data/
    seed/               # Seed JSON files or SQL scripts
```

### Pattern 1: MapLibre SSR Isolation (Client Island)
**What:** MapLibre GL JS requires `window`, `document`, and WebGL. Next.js App Router server components will crash on import.
**When to use:** Always — MapLibre cannot run server-side.
**Critical detail:** In Next.js 15 App Router, `ssr: false` with `next/dynamic` is NOT allowed in Server Components directly. You must create a client component wrapper.

```typescript
// src/components/map/MapShell.tsx
'use client';

import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <div className="h-screen w-full animate-pulse bg-gray-900" />,
});

export default function MapShell() {
  return <MapView />;
}
```

```typescript
// src/app/page.tsx (Server Component)
import MapShell from '@/components/map/MapShell';

export default function HomePage() {
  return <MapShell />;
}
```

### Pattern 2: Single GeoJSON Source with setFilter Architecture
**What:** Load all events once as a single GeoJSON source. Use `map.setFilter()` to show/hide markers by month and category. GPU-side filtering — no network round-trips, no data re-parsing.
**When to use:** When total event count is under ~50K features (we have ~600).

```typescript
// Source setup with clustering
map.addSource('events', {
  type: 'geojson',
  data: geojsonFeatureCollection, // All events, all months
  cluster: true,
  clusterMaxZoom: 14,
  clusterRadius: 50,
});

// Filter by month AND category
function updateFilters(month: number, categories: string[]) {
  const filter: any[] = ['all',
    ['==', ['get', 'month'], month],
    ['in', ['get', 'category'], ['literal', categories]],
  ];
  map.setFilter('event-circles', filter);
  map.setFilter('event-circles-pulse', filter);
}
```

**Important:** Clustering operates on the source before filters are applied to layers. If you need clustering to respect filters, you must update the source data instead. With ~600 events, the simplest approach is to filter at the source level using `map.getSource('events').setData(filteredGeoJSON)` when the dataset is small enough that this is imperceptible. Alternatively, use separate sources per category.

### Pattern 3: Circle Layer Pulse Animation
**What:** Pulsing dot effect using two overlaid circle layers — one solid, one animated with requestAnimationFrame changing opacity and radius.
**When to use:** For the pulsing event markers (locked decision).

```typescript
// Solid base circle
map.addLayer({
  id: 'event-circles',
  type: 'circle',
  source: 'events',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': ['match', ['get', 'category'],
      'festival', '#f97316',  // orange
      'wildlife', '#22c55e',  // green
      '#3b82f6'               // blue default
    ],
    'circle-radius': ['interpolate', ['linear'], ['get', 'scale'], 1, 5, 10, 12],
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff',
  },
});

// Animated pulse ring (overlay)
map.addLayer({
  id: 'event-circles-pulse',
  type: 'circle',
  source: 'events',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': ['match', ['get', 'category'],
      'festival', '#f97316',
      'wildlife', '#22c55e',
      '#3b82f6'
    ],
    'circle-radius': 8,
    'circle-opacity': 0.4,
  },
});

// Animation loop
function animatePulse(timestamp: number) {
  const pulse = Math.sin(timestamp / 500) * 0.3 + 0.7; // 0.4 to 1.0
  const radius = 8 + Math.sin(timestamp / 500) * 4;     // 4 to 12
  map.setPaintProperty('event-circles-pulse', 'circle-opacity', pulse * 0.4);
  map.setPaintProperty('event-circles-pulse', 'circle-radius', radius);
  requestAnimationFrame(animatePulse);
}
requestAnimationFrame(animatePulse);
```

### Pattern 4: Bottom Sheet Panel
**What:** Slide-up panel from bottom on marker click. Mobile-native pattern.
**When to use:** Event detail display (locked decision).

```typescript
// Simplified bottom sheet with Tailwind transitions
// Use CSS transform + transition for GPU-accelerated slide
// States: closed (translate-y-full), peek (translate-y-1/2), open (translate-y-0)
// Touch: track touchmove deltaY to allow drag-to-dismiss
```

### Pattern 5: Server-Side Email Submission (API Route)
**What:** Client form submits to Next.js API route, which calls Kit API v4 server-side. Keeps API key secret.
**When to use:** Always — never expose Kit API key to browser.

```typescript
// src/app/api/subscribe/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, interests, eventCategory } = await request.json();

  // 1. Create subscriber
  const subRes = await fetch('https://api.kit.com/v4/subscribers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Kit-Api-Key': process.env.KIT_API_KEY!,
    },
    body: JSON.stringify({ email_address: email, state: 'active' }),
  });
  const { subscriber } = await subRes.json();

  // 2. Tag subscriber based on interests
  for (const tagId of getTagIds(interests, eventCategory)) {
    await fetch(`https://api.kit.com/v4/tags/${tagId}/subscribers/${subscriber.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Kit-Api-Key': process.env.KIT_API_KEY!,
      },
    });
  }

  return NextResponse.json({ success: true });
}
```

### Anti-Patterns to Avoid
- **Importing maplibre-gl in a server component:** Will crash. Always use next/dynamic with ssr:false via a client wrapper component.
- **Using setData() for timeline scrubbing on large datasets:** Re-parses entire GeoJSON on every call. Use setFilter() for GPU-side filtering (but see clustering caveat above).
- **HTML Markers for 500+ points:** DOM nodes don't scale. Use circle layers (WebGL-rendered).
- **Exposing Kit API key in client-side fetch:** Use an API route as a proxy.
- **Using `ssr: false` directly in a Server Component:** Next.js 15 App Router throws an error. Must be inside a `'use client'` component.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Map rendering | Custom canvas/WebGL | MapLibre GL JS | Vector tile rendering, touch handling, projections, WebGL shaders |
| Map tile hosting | Self-host tiles | OpenFreeMap (`tiles.openfreemap.org/styles/liberty`) | Free, no API key, no rate limits, auto-attribution |
| Geospatial queries | Manual lat/lng math | PostGIS `geometry(Point, 4326)` + GiST index | Spatial indexing, distance calculations, bounding box queries |
| Marker clustering | Manual clustering algorithm | MapLibre built-in `cluster: true` on GeoJSON source | Supercluster under the hood, zoom-aware, performant |
| Email service | SMTP/SES integration | Kit (ConvertKit) API v4 | Deliverability, unsubscribe handling, GDPR compliance, sequences |
| Analytics | Custom event tracking | Plausible via next-plausible | Privacy-compliant, no cookie banner, proxy support for ad-blockers |
| CSS utility framework | Custom CSS system | Tailwind v4 | Consistent design tokens, responsive utilities, purged production CSS |
| Bottom sheet gesture | Custom touch handling | CSS transform + `touchmove` listener (or a lightweight lib) | Smooth 60fps animation, snap points, drag-to-dismiss |

**Key insight:** This phase combines multiple complex domains (WebGL maps, geospatial databases, email APIs). Every one of these has edge cases that consume weeks if built from scratch. Use the established tools and focus development time on the product experience.

## Common Pitfalls

### Pitfall 1: MapLibre SSR Crash
**What goes wrong:** Importing `maplibre-gl` in any server-rendered context causes `ReferenceError: window is not defined`.
**Why it happens:** MapLibre requires browser globals (`window`, `document`, `WebGLRenderingContext`).
**How to avoid:** Use the client island pattern: `'use client'` wrapper component with `next/dynamic({ ssr: false })`. Never import `maplibre-gl` at the top level of a server component.
**Warning signs:** Build errors mentioning `window` or `document` not defined.

### Pitfall 2: Clustering + Filtering Interaction
**What goes wrong:** `setFilter()` on a layer does NOT affect clustering. Clusters still count filtered-out points.
**Why it happens:** Clustering happens at the source level (Supercluster), filtering happens at the layer level (GPU). They operate independently.
**How to avoid:** With ~600 total events, use `source.setData(filteredGeoJSON)` to update the source with only matching events. This re-runs clustering on the filtered set. At this data size, the performance cost is negligible.
**Warning signs:** Cluster counts showing "50" when only 5 markers are visible after filtering.

### Pitfall 3: Supabase Free Tier Pausing
**What goes wrong:** Project pauses after 7 days of inactivity, breaking the live site.
**Why it happens:** Supabase free tier auto-pauses unused projects.
**How to avoid:** Set up a GitHub Actions cron job that pings the database twice per week. Or upgrade to Pro ($25/month) once the site is live.
**Warning signs:** 503 errors from Supabase API after a period of no traffic.

### Pitfall 4: Tailwind v4 Configuration Change
**What goes wrong:** Developers look for `tailwind.config.js` or `tailwind.config.ts` — it no longer exists in v4.
**Why it happens:** Tailwind v4 moved to CSS-first configuration with `@theme` directive in CSS.
**How to avoid:** Use `@import "tailwindcss"` in `globals.css`. Customize via `@theme { }` block in CSS, not a JS config file. Content detection is automatic.
**Warning signs:** Trying to create a `tailwind.config.js` file; classes not applying.

### Pitfall 5: Bottom Sheet on Mobile Touch Conflicts
**What goes wrong:** Map pan gestures conflict with bottom sheet drag gestures, causing janky UX.
**Why it happens:** Both the map and bottom sheet listen for touch events in overlapping areas.
**How to avoid:** When the bottom sheet is open, apply `pointer-events: none` to the map or use `stopPropagation()` on the sheet's touch area. Ensure the bottom sheet has a clear drag handle area.
**Warning signs:** Map panning when trying to scroll the bottom sheet content.

### Pitfall 6: Missing MapLibre CSS Import
**What goes wrong:** Map renders but controls are unstyled, popups are mispositioned.
**Why it happens:** MapLibre requires its CSS file (`maplibre-gl/dist/maplibre-gl.css`) for proper rendering.
**How to avoid:** Import the CSS in the client component: `import 'maplibre-gl/dist/maplibre-gl.css'`.
**Warning signs:** Map loads but UI controls look broken or overlapping.

### Pitfall 7: Kit API v4 -- Subscriber Must Exist Before Tagging
**What goes wrong:** Tag request returns 404.
**Why it happens:** Kit v4 `POST /v4/tags/{tag_id}/subscribers/{id}` requires the subscriber to already exist. Tagging is a separate step from creation.
**How to avoid:** Always create subscriber first (`POST /v4/subscribers`), extract `subscriber.id` from response, then tag.
**Warning signs:** 404 responses on tag endpoint.

## Code Examples

### MapLibre Initialization with OpenFreeMap
```typescript
// Source: https://openfreemap.org/quick_start/
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: [0, 20],    // World view centered
  zoom: 2,
  fadeDuration: 0,     // Disable fade for snappy filter transitions
});

// Add controls
map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  trackUserLocation: true,
}), 'top-right');
map.addControl(new maplibregl.FullscreenControl(), 'top-right');
```

### Clustering Setup
```typescript
// Source: https://maplibre.org/maplibre-gl-js/docs/examples/create-and-style-clusters/
map.on('load', () => {
  map.addSource('events', {
    type: 'geojson',
    data: eventGeoJSON,
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  });

  // Cluster circles — sized and colored by count
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'events',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': ['step', ['get', 'point_count'],
        '#51bbd6', 10, '#f1f075', 50, '#f28cb1'],
      'circle-radius': ['step', ['get', 'point_count'],
        15, 10, 20, 50, 25],
    },
  });

  // Cluster count labels
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'events',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['Noto Sans Regular'],
      'text-size': 12,
    },
  });

  // Click cluster to expand
  map.on('click', 'clusters', async (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
    const clusterId = features[0].properties.cluster_id;
    const zoom = await (map.getSource('events') as maplibregl.GeoJSONSource)
      .getClusterExpansionZoom(clusterId);
    map.easeTo({ center: (features[0].geometry as any).coordinates, zoom });
  });
});
```

### Supabase PostGIS Table Creation
```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Events table
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('festival', 'wildlife')),
  description TEXT,
  image_url TEXT,
  start_month INTEGER NOT NULL CHECK (start_month BETWEEN 1 AND 12),
  end_month INTEGER NOT NULL CHECK (end_month BETWEEN 1 AND 12),
  location geometry(Point, 4326) NOT NULL,
  country TEXT,
  region TEXT,
  scale INTEGER DEFAULT 5 CHECK (scale BETWEEN 1 AND 10),
  crowd_level TEXT CHECK (crowd_level IN ('quiet', 'moderate', 'busy')),
  booking_destination_id TEXT,    -- Booking.com destination param
  getyourguide_location_id TEXT, -- GetYourGuide location param
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Spatial index (GiST) — critical for PostGIS performance
CREATE INDEX events_location_idx ON events USING GIST (location);

-- Filter indexes
CREATE INDEX events_category_idx ON events (category);
CREATE INDEX events_month_idx ON events (start_month, end_month);

-- Destinations table
CREATE TABLE destinations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  location geometry(Point, 4326) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX destinations_location_idx ON destinations USING GIST (location);

-- Migration routes table
CREATE TABLE migration_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  species TEXT NOT NULL,
  name TEXT NOT NULL,
  route geometry(LineString, 4326) NOT NULL,
  peak_months INTEGER[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX migration_routes_route_idx ON migration_routes USING GIST (route);
```

### GeoJSON Export from Supabase for Map
```typescript
// Fetch events and convert to GeoJSON FeatureCollection
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function fetchEventsGeoJSON() {
  // Use PostGIS ST_AsGeoJSON to get geometry as GeoJSON
  const { data, error } = await supabase
    .rpc('get_events_geojson');
  // RPC function returns a FeatureCollection
  return data;
}

// Supabase RPC function (create in SQL editor):
// CREATE OR REPLACE FUNCTION get_events_geojson()
// RETURNS JSON AS $$
//   SELECT json_build_object(
//     'type', 'FeatureCollection',
//     'features', COALESCE(json_agg(
//       json_build_object(
//         'type', 'Feature',
//         'geometry', ST_AsGeoJSON(location)::json,
//         'properties', json_build_object(
//           'id', id, 'name', name, 'slug', slug,
//           'category', category, 'start_month', start_month,
//           'end_month', end_month, 'scale', scale,
//           'crowd_level', crowd_level, 'image_url', image_url,
//           'description', description
//         )
//       )
//     ), '[]'::json)
//   ) FROM events;
// $$ LANGUAGE sql;
```

### Booking.com Affiliate Link Builder
```typescript
// Source: https://affiliates.support.booking.com/kb/s/article/Links
function buildBookingLink(params: {
  destinationId?: string;
  city?: string;
  checkin?: string;  // YYYY-MM-DD
  checkout?: string; // YYYY-MM-DD
}): string {
  const base = 'https://www.booking.com/searchresults.html';
  const searchParams = new URLSearchParams({
    aid: process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID!,
    ...(params.destinationId && { dest_id: params.destinationId, dest_type: 'city' }),
    ...(params.city && { ss: params.city }),
    ...(params.checkin && { checkin: params.checkin }),
    ...(params.checkout && { checkout: params.checkout }),
    no_rooms: '1',
    group_adults: '2',
  });
  return `${base}?${searchParams}`;
}
```

### GetYourGuide Affiliate Link Builder
```typescript
// Source: https://partner.getyourguide.support/
function buildGetYourGuideLink(params: {
  locationId?: string;
  query?: string;
}): string {
  const base = params.locationId
    ? `https://www.getyourguide.com/l${params.locationId}`
    : 'https://www.getyourguide.com/s/';
  const searchParams = new URLSearchParams({
    partner_id: process.env.NEXT_PUBLIC_GYG_PARTNER_ID!,
    ...(params.query && { q: params.query }),
  });
  return `${base}?${searchParams}`;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 JS config (`tailwind.config.js`) | Tailwind v4 CSS-first config (`@theme` in CSS) | Tailwind v4 (2025) | No JS config file; `@import "tailwindcss"` in CSS |
| ConvertKit API v3 (`api.convertkit.com/v3/`) | Kit API v4 (`api.kit.com/v4/`) | 2024-2025 rebrand | New URL, cursor-based pagination, OAuth support |
| Mapbox GL JS (proprietary) | MapLibre GL JS (open source fork) | 2020 fork, now v5.19 | Zero cost, no API keys for map rendering |
| `next/dynamic` with `ssr: false` in Server Components | Client wrapper component + `next/dynamic` inside it | Next.js 13+ App Router | Direct `ssr: false` in Server Components throws error |
| PostGIS `geography` type | `geometry(Point, 4326)` | N/A (both exist) | 5-10x faster queries; project decision |
| Page Router (`pages/`) | App Router (`app/`) | Next.js 13+ (stable 14+) | Server components, streaming, layouts |

**Deprecated/outdated:**
- `tailwind.config.js` / `tailwind.config.ts`: Replaced by CSS-first `@theme` in Tailwind v4
- ConvertKit v3 API (`api.convertkit.com`): Still works but v4 is current; domain changed to `api.kit.com`
- Mapbox GL JS free tier: Mapbox now charges per map load; MapLibre is the free alternative

## Open Questions

1. **Exact Booking.com affiliate link parameters**
   - What we know: `aid` (affiliate ID), `dest_id`, `checkin`, `checkout` are standard params
   - What's unclear: Full parameter spec requires approved affiliate account access to documentation portal
   - Recommendation: Use placeholder `aid` during development; finalize link format after Awin approval

2. **GetYourGuide deep link format**
   - What we know: Partner ID parameter exists, location-based links work
   - What's unclear: Exact URL structure for activity searches by location requires partner portal access
   - Recommendation: Use simple search links (`getyourguide.com/s/?q=...&partner_id=...`) until partner account is active

3. **Pulse animation performance at scale**
   - What we know: `setPaintProperty` on every frame works for moderate datasets
   - What's unclear: Whether continuous `requestAnimationFrame` with `setPaintProperty` causes issues when 200+ markers are visible
   - Recommendation: Test with full dataset; if laggy, switch to CSS animation on HTML overlay or limit pulse to visible viewport markers only

4. **Supabase free tier vs Pro for production**
   - What we know: Free tier pauses after 7 days inactivity; limited to 2 active projects
   - What's unclear: Whether free tier performance is sufficient for production traffic
   - Recommendation: Start on free tier with keep-alive cron; budget for Pro ($25/month) once site goes live

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (recommended for Next.js 15 + TypeScript) |
| Config file | None yet -- Wave 0 gap |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |
| Estimated runtime | ~5 seconds (unit tests only at this phase) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | Next.js project builds and deploys | smoke | `npm run build` | N/A (build command) |
| FOUND-02 | PostGIS tables exist with indexes | integration | `npx vitest run tests/db/schema.test.ts` | No -- Wave 0 gap |
| FOUND-03 | 500+ festival + 100+ wildlife events seeded | integration | `npx vitest run tests/db/seed.test.ts` | No -- Wave 0 gap |
| FOUND-04 | 10+ migration routes seeded | integration | `npx vitest run tests/db/seed.test.ts` | No -- Wave 0 gap |
| MAP-01 | MapLibre renders with OpenFreeMap tiles | e2e / manual | Manual -- requires browser WebGL | N/A |
| MAP-02 | Color-coded pulsing markers display | e2e / manual | Manual -- visual verification | N/A |
| MAP-03 | Clustering works at low zoom | e2e / manual | Manual -- visual verification | N/A |
| MAP-04 | Timeline setFilter works | unit | `npx vitest run tests/map/filters.test.ts` | No -- Wave 0 gap |
| MAP-05 | Category toggles filter correctly | unit | `npx vitest run tests/map/filters.test.ts` | No -- Wave 0 gap |
| MAP-06 | Default view shows current month | unit | `npx vitest run tests/map/filters.test.ts` | No -- Wave 0 gap |
| MAP-07 | Month picker triggers filter update | unit | `npx vitest run tests/map/filters.test.ts` | No -- Wave 0 gap |
| MAP-08 | Click marker opens panel with details | e2e / manual | Manual -- requires browser interaction | N/A |
| MAP-09 | Map controls present (zoom, locate, fullscreen) | e2e / manual | Manual -- visual verification | N/A |
| AFFL-01 | Booking.com links have correct params | unit | `npx vitest run tests/affiliates.test.ts` | No -- Wave 0 gap |
| AFFL-02 | GetYourGuide links have correct params | unit | `npx vitest run tests/affiliates.test.ts` | No -- Wave 0 gap |
| AFFL-03 | CTAs display in event panel | e2e / manual | Manual -- visual verification | N/A |
| EMAIL-01 | Email form renders in bottom sheet | e2e / manual | Manual -- visual verification | N/A |
| EMAIL-02 | Subscribe API route calls Kit API | unit | `npx vitest run tests/api/subscribe.test.ts` | No -- Wave 0 gap |
| EMAIL-03 | Tags applied based on interests | unit | `npx vitest run tests/api/subscribe.test.ts` | No -- Wave 0 gap |
| PERF-04 | Responsive layout on mobile | e2e / manual | Manual -- device testing | N/A |
| PERF-05 | Error boundaries catch failures | unit | `npx vitest run tests/components/error-boundary.test.ts` | No -- Wave 0 gap |
| PERF-06 | Plausible analytics loads | smoke | Manual -- check network tab for plausible script | N/A |

### Nyquist Sampling Rate
- **Minimum sample interval:** After every committed task, run: `npx vitest run --reporter=verbose`
- **Full suite trigger:** Before merging final task of any plan wave
- **Phase-complete gate:** Full suite green + manual visual verification of map rendering before `/gsd:verify-work`
- **Estimated feedback latency per task:** ~5 seconds

### Wave 0 Gaps (must be created before implementation)
- [ ] `vitest.config.ts` -- Vitest configuration with path aliases matching tsconfig
- [ ] `tests/db/schema.test.ts` -- Covers FOUND-02 (PostGIS tables + indexes exist)
- [ ] `tests/db/seed.test.ts` -- Covers FOUND-03, FOUND-04 (event and route counts)
- [ ] `tests/map/filters.test.ts` -- Covers MAP-04, MAP-05, MAP-06, MAP-07 (filter expression builders)
- [ ] `tests/affiliates.test.ts` -- Covers AFFL-01, AFFL-02 (URL builder output)
- [ ] `tests/api/subscribe.test.ts` -- Covers EMAIL-02, EMAIL-03 (Kit API route handler)
- [ ] `tests/components/error-boundary.test.ts` -- Covers PERF-05 (error boundary rendering)
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom`

## Sources

### Primary (HIGH confidence)
- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js/docs/) -- clustering, layers, controls, animation examples
- [MapLibre Cluster Example](https://maplibre.org/maplibre-gl-js/docs/examples/create-and-style-clusters/) -- full clustering code pattern
- [Next.js Official Docs](https://nextjs.org/docs/app/getting-started/installation) -- create-next-app, App Router, dynamic imports
- [Next.js Lazy Loading](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading) -- next/dynamic ssr:false pattern
- [Supabase PostGIS Docs](https://supabase.com/docs/guides/database/extensions/postgis) -- extension setup, spatial queries, GiST indexes
- [Kit API v4 - Create Subscriber](https://developers.kit.com/api-reference/subscribers/create-a-subscriber) -- endpoint, headers, body, response
- [Kit API v4 - Tag Subscriber](https://developers.kit.com/api-reference/tags/tag-a-subscriber) -- POST /v4/tags/{tag_id}/subscribers/{id}
- [OpenFreeMap](https://openfreemap.org/) -- free tile hosting, style URLs, no API keys
- [OpenFreeMap Quick Start](https://openfreemap.org/quick_start/) -- MapLibre integration
- [maplibre-gl npm](https://www.npmjs.com/package/maplibre-gl) -- v5.19.x latest

### Secondary (MEDIUM confidence)
- [next-plausible GitHub](https://github.com/4lejandrito/next-plausible) -- App Router integration, proxy support
- [Plausible Next.js Integration Docs](https://plausible.io/docs/nextjs-integration) -- official setup guide
- [MapLibre Next.js Starter](https://github.com/richard-unterberg/maplibre-nextjs-ts-starter) -- reference project structure
- [Booking.com Affiliate Links](https://affiliates.support.booking.com/kb/s/article/Links) -- URL parameter format
- [Supabase Keep-Alive Solutions](https://github.com/travisvn/supabase-pause-prevention) -- GitHub Actions cron pattern

### Tertiary (LOW confidence)
- [GetYourGuide Partner API](https://code.getyourguide.com/partner-api-spec/) -- API spec exists but deep link format needs partner account verification
- MapLibre pulse animation via `setPaintProperty` per frame -- pattern assembled from multiple sources, not from a single official example

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified via official docs and npm
- Architecture: HIGH -- setFilter pattern verified in MapLibre docs; SSR isolation pattern confirmed in Next.js 15 docs
- Pitfalls: HIGH -- clustering+filter interaction, SSR crash, and Tailwind v4 config change all documented
- Affiliate links: MEDIUM -- exact URL parameters need affiliate account access to fully verify
- Pulse animation: MEDIUM -- pattern assembled from documented primitives but no single canonical example

**Research date:** 2026-03-01
**Valid until:** 2026-03-31 (stable stack; MapLibre minor versions may increment)

**Recommendation for Claude's Discretion items:**
- **Map theme:** Use OpenFreeMap `liberty` style (clean, neutral, good contrast for colored markers)
- **Color palette:** Orange (#f97316) for festivals, Green (#22c55e) for wildlife, Blue (#3b82f6) for other -- high contrast on light map backgrounds, accessible
- **Loading skeleton:** Dark gray pulsing rectangle matching map container dimensions
- **Error states:** Inline error message with retry button; React ErrorBoundary wrapping map + panel separately
