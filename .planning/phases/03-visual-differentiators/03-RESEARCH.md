# Phase 3: Visual Differentiators - Research

**Researched:** 2026-03-01
**Domain:** MapLibre GL JS heatmap/animation layers, Next.js SSG destination pages, Booking.com affiliate widget
**Confidence:** HIGH

## Summary

Phase 3 adds three visual layers to the existing MapLibre map: a crowd heatmap overlay synced to the month scrubber, animated migration route lines with pulsing position dots, and `/destination/[slug]` SSG pages with a 12-month calendar grid. The technical foundation is solid because MapLibre GL JS natively supports heatmap layers with configurable color ramps and line layers with dash arrays, and the project already has working patterns for sources, layers, filters, and animations (see `src/lib/map/layers.ts`, `src/lib/map/animations.ts`, `src/lib/route-utils.ts`).

The crowd heatmap requires a new GeoJSON source built from destination `crowd_data` (already stored as JSONB keyed by month number), rendered as a `heatmap` layer type below the existing event layers. Migration route animation builds directly on the existing `computeActivePosition()` function and MiniMap route rendering, upgrading from static markers to animated layer-level rendering on the main map. Destination pages follow the exact same SSG pattern as `/event/[slug]` — `generateStaticParams` + server component + client detail component.

**Primary recommendation:** Use MapLibre's native `heatmap` layer type for crowd overlay (no external heatmap library needed), extend `computeActivePosition()` to accept a `selectedMonth` parameter instead of hardcoding `new Date()`, and reuse the existing `/event/[slug]` page architecture for `/destination/[slug]`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Cool-to-warm color gradient (blue/purple for low crowds to orange/red for packed) — avoids colorblind issues
- Subtle background wash — semi-transparent overlay, event markers sit clearly on top
- Regional blob granularity — broad heat regions, not city-level precision
- Smooth animated fade when scrubbing months — colors blend between months as the scrubber moves
- Pulsing dot indicator — universal across all species, no per-species icons needed
- Auto-play when visible — dot position synced to the currently selected month on the scrubber
- Trail effect on route line — solid/bright behind the dot, faded/dashed ahead, giving a sense of direction and progress
- All species visible simultaneously — color-coded with distinct route colors per species, small legend to identify them
- Horizontal 12-column strip on desktop (all months visible as a one-liner), collapses responsively for mobile
- Column info priority: crowd bar (top) to events (middle) to weather (bottom) — crowd level is the hero info
- Thin colored top bar per column using cool-to-warm gradient — doesn't interfere with content readability
- Best time to visit: 2-3 recommended months highlighted with subtle border in the grid, short explanatory sentence above
- Heatmap click: map tooltip popup at click location — shows crowd score, tourist volume, and "find quieter alternatives" link
- Quieter alternatives: pans/zooms the map to show nearby lower-crowd destinations for the same month (stays in exploration flow)
- Migration route click: opens the existing side/bottom detail panel with viewing spots, peak dates, and tour booking links
- Mobile: all interactions use bottom sheet pattern (consistent with Phase 1), thumb-friendly

### Claude's Discretion
- Exact tooltip/popup animation and dismiss behavior
- Species legend positioning and design
- Loading skeletons for heatmap and migration data
- Weather icon set and temperature display format
- Exact spacing, typography, and responsive breakpoints for the destination grid
- How the horizontal grid collapses on mobile (accordion, vertical stack, swipe cards, etc.)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CROWD-01 | Crowd heatmap overlay toggle on main map | MapLibre `heatmap` layer type with `visibility` toggle; GeoJSON point source from destinations `crowd_data` |
| CROWD-02 | Heatmap synced to month scrubber | `heatmap-weight` expression keyed to a `crowd_score` property; re-set source data or update property per month via `setData()` |
| CROWD-03 | Heatmap renders below event markers (z-order) | `map.addLayer(heatmapLayer, 'clusters')` — `beforeId` parameter ensures z-ordering |
| CROWD-04 | Click heatmap region shows crowd detail popup | MapLibre `Popup` class positioned at click point; query rendered features on click |
| CROWD-05 | Crowd indicators on event popup | Add crowd badge text to existing `EventPanel` using `crowd_level` property (already in GeoJSON properties) |
| WILD-01 | Wildlife events as first-class map content | Already implemented in Phase 1 — wildlife events appear as green dots; verify no regression |
| WILD-02 | Animated migration route paths on map | MapLibre `line` layer per route source; `line-dasharray` for trail effect (solid behind dot, dashed ahead) |
| WILD-03 | Pulse dot moves along route for selected month | `requestAnimationFrame` loop updating a `circle` layer source position using `computeActivePosition(coords, peakMonths, selectedMonth)` |
| WILD-04 | Species toggle controls | Toggle component filtering `line` and `circle` layer visibility by species; reuse `CategoryToggles` pattern |
| WILD-05 | Click route/dot shows popup with viewing spots | Click handler on route/dot layers opening bottom sheet with migration route details and affiliate links |
| DEST-01 | `/destination/[slug]` SSG pages with map flyTo | `generateStaticParams` + server component fetching destination + client MiniMap with flyTo; follows `/event/[slug]` pattern |
| DEST-02 | 12-month calendar grid with events, wildlife, crowd | Client component rendering 12 columns; data from destination `crowd_data`, `weather_data`, and events query filtered by destination region |
| DEST-03 | Crowd level green-to-red gradient per month column | CSS `background-color` computed from `crowd_data[month]` score using the same cool-to-warm ramp |
| DEST-04 | Weather summary per month | Render `weather_data[month].temp_c`, `rain_days`, `sunshine_hours` from destination JSONB |
| DEST-05 | Best time to visit summary text | Computed from `crowd_data` (lowest scores) + `weather_data` (best weather); 2-3 month recommendation |
| DEST-06 | Event/wildlife pills in calendar that expand | Expandable pills per month column showing events occurring in that month at this destination |
| DEST-07 | Booking.com widget on destination page | Booking.com `<ins>` embed tag with `flexiproduct.js`, pre-filled with `data-dest_id` and best month |
| PERF-01 | Lighthouse mobile score > 90 | next/font optimization, next/image priority for LCP, lazy-load third-party scripts (Booking.com widget), avoid layout shift |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| maplibre-gl | ^5.19.0 | Heatmap layer, line layers, animated circle layers, popups | Already installed; native heatmap/line layer types, no plugin needed |
| next | 16.1.6 | SSG destination pages via generateStaticParams | Already installed; App Router async server components |
| @supabase/supabase-js | ^2.98.0 | Fetch destination data, crowd scores, weather | Already installed; RPC pattern for PostGIS geometry extraction |
| tailwindcss | ^4 | Responsive 12-column grid, gradient backgrounds | Already installed; utility-first CSS for the calendar grid |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @turf/along | ^7.3.4 | Smooth distance-based point interpolation along migration routes | If index-based interpolation in `computeActivePosition` is too choppy for smooth animation |
| @turf/length | ^7.3.4 | Calculate total route distance for proportional positioning | Paired with @turf/along for distance-based interpolation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| MapLibre native heatmap | h3-js hexagonal binning | H3 gives fixed-size hexagons but adds 200KB+ bundle; native heatmap sufficient for regional blobs |
| @turf/along | Manual index interpolation | Already have `computeActivePosition` using index math; Turf only needed if animation smoothness is insufficient |
| Booking.com `<ins>` embed | Custom search form with deep links | Custom form gives full design control but loses Booking.com's built-in UX and auto-suggest; embed is simpler and officially supported |

**Installation:**
```bash
# Only if smooth animation interpolation is needed (evaluate first without)
npm install @turf/along @turf/length
```

No new core dependencies are required. MapLibre already supports all needed layer types.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── destination/
│       └── [slug]/
│           └── page.tsx           # SSG destination page (server component)
├── components/
│   ├── map/
│   │   ├── MapView.tsx            # Extended: add heatmap source/layers, route layers, species toggles
│   │   ├── CrowdHeatmapToggle.tsx # NEW: toggle button for heatmap visibility
│   │   ├── SpeciesToggles.tsx     # NEW: species filter toggles
│   │   └── SpeciesLegend.tsx      # NEW: color-coded legend
│   └── destination/
│       ├── CalendarGrid.tsx       # NEW: 12-month calendar grid (client component)
│       ├── MonthColumn.tsx        # NEW: single month column with crowd/events/weather
│       ├── BestTimeToVisit.tsx    # NEW: recommended months summary
│       └── BookingWidget.tsx      # NEW: Booking.com search box embed
├── lib/
│   ├── map/
│   │   ├── layers.ts             # Extended: heatmap layer, route line layers, dot layers
│   │   ├── heatmap.ts            # NEW: heatmap source builder, color ramp, month filtering
│   │   └── migration-layers.ts   # NEW: route line layers, animated dot logic
│   ├── crowd-colors.ts           # NEW: shared cool-to-warm gradient function (map + calendar)
│   ├── route-utils.ts            # Extended: accept selectedMonth parameter
│   └── supabase/
│       ├── queries.ts            # Extended: destination queries, crowd data queries
│       └── types.ts              # Extended: DestinationWithCoords type
```

### Pattern 1: Heatmap as Separate GeoJSON Source
**What:** Create a dedicated `crowd-heatmap` GeoJSON source from destinations table, separate from the `events` source. Each feature is a destination Point with a `crowd_score` property for the selected month.
**When to use:** Always — heatmap data is fundamentally different from event data (destinations vs events, different table, different purpose).
**Example:**
```typescript
// Source: MapLibre GL JS heatmap layer docs
// https://maplibre.org/maplibre-gl-js/docs/examples/create-a-heatmap-layer/

function buildCrowdHeatmapSource(
  destinations: DestinationWithCoords[],
  month: number
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: destinations.map((d) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [d.lng, d.lat] },
      properties: {
        crowd_score: d.crowd_data?.[String(month)] ?? 5,
        name: d.name,
        slug: d.slug,
        tourist_volume: estimateTouristVolume(d.crowd_data?.[String(month)] ?? 5),
      },
    })),
  };
}

const crowdHeatmapLayer: LayerSpecification = {
  id: 'crowd-heatmap',
  type: 'heatmap',
  source: 'crowd-heatmap',
  paint: {
    'heatmap-weight': [
      'interpolate', ['linear'],
      ['get', 'crowd_score'],
      1, 0,    // quiet = no heat
      10, 1,   // packed = full heat
    ],
    'heatmap-intensity': [
      'interpolate', ['linear'],
      ['zoom'],
      0, 1,
      9, 3,
    ],
    // Cool-to-warm: blue/purple (low) -> orange/red (packed)
    'heatmap-color': [
      'interpolate', ['linear'],
      ['heatmap-density'],
      0, 'rgba(103, 58, 183, 0)',     // transparent purple
      0.2, 'rgba(103, 58, 183, 0.4)', // light purple
      0.4, 'rgba(33, 150, 243, 0.6)', // blue
      0.6, 'rgba(255, 193, 7, 0.7)',  // amber
      0.8, 'rgba(255, 87, 34, 0.8)',  // deep orange
      1.0, 'rgba(244, 67, 54, 0.9)',  // red
    ],
    'heatmap-radius': [
      'interpolate', ['linear'],
      ['zoom'],
      0, 20,
      5, 40,
      9, 60,
    ],
    'heatmap-opacity': 0.6, // Semi-transparent — event markers on top
  },
};
```

### Pattern 2: Trail Effect via Dual Line Layers
**What:** Render each migration route as TWO line layers — a solid "completed" segment and a dashed "upcoming" segment, split at the animated dot position.
**When to use:** For the trail effect requirement (solid behind dot, dashed ahead).
**Example:**
```typescript
// Two GeoJSON sources per route, updated each frame:
// 1. 'route-{id}-completed': LineString from start to dot position
// 2. 'route-{id}-upcoming': LineString from dot position to end

// Completed (behind dot): solid, bright
const completedLineLayer: LayerSpecification = {
  id: 'route-completed',
  type: 'line',
  source: 'route-completed',
  paint: {
    'line-color': '#22c55e', // per-species color via expression
    'line-width': 3,
    'line-opacity': 0.9,
  },
  layout: { 'line-cap': 'round', 'line-join': 'round' },
};

// Upcoming (ahead of dot): dashed, faded
const upcomingLineLayer: LayerSpecification = {
  id: 'route-upcoming',
  type: 'line',
  source: 'route-upcoming',
  paint: {
    'line-color': '#22c55e',
    'line-width': 2,
    'line-opacity': 0.4,
    'line-dasharray': [2, 4],
  },
  layout: { 'line-cap': 'round', 'line-join': 'round' },
};
```

### Pattern 3: SSG Destination Page (Follows Event Page Pattern)
**What:** `/destination/[slug]` as an async server component with `generateStaticParams`, fetching destination data via RPC, rendering client components for interactive parts.
**When to use:** All destination pages — matches existing `/event/[slug]` architecture.
**Example:**
```typescript
// Source: existing pattern in src/app/event/[slug]/page.tsx

export async function generateStaticParams() {
  const slugs = await getAllDestinationSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) notFound();

  const events = await getEventsByDestination(destination);

  return (
    <>
      <Breadcrumbs items={[...]} />
      <DestinationHero destination={destination} />
      <CalendarGrid
        destination={destination}
        events={events}
      />
      <BookingWidget
        destId={destination.booking_destination_id}
        destName={destination.name}
        bestMonth={computeBestMonth(destination)}
      />
      <BackToMap />
    </>
  );
}
```

### Pattern 4: Booking.com Widget Embed
**What:** Use the official Booking.com `<ins>` embed tag with `flexiproduct.js` loaded via `next/script`.
**When to use:** On destination pages — pre-fill with destination and best month.
**Example:**
```typescript
// Source: Booking.com Affiliate Support Centre
// https://affiliates.support.booking.com/kb/s/article/Search-Box

import Script from 'next/script';

function BookingWidget({ destId, destName, bestMonth }: BookingWidgetProps) {
  const aid = process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID;

  return (
    <div>
      <ins
        className="bookingaff"
        data-aid={aid || ''}
        data-prod="nsb"
        data-dest_id={destId || ''}
        data-dest_type="city"
        data-width="100%"
      >
        {/* Fallback: deep link to Booking.com */}
        <a href={buildBookingLink({ destinationId: destId, city: destName, startMonth: bestMonth })}>
          Search hotels in {destName}
        </a>
      </ins>
      <Script
        src="//aff.bstatic.com/static/affiliate_base/js/flexiproduct.js"
        strategy="lazyOnload"
      />
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Re-creating map sources on every month change:** Use `setData()` on existing source, not `removeSource` + `addSource`. Re-creating sources causes flicker and memory leaks.
- **Using setFilter() for heatmap month sync:** The heatmap `weight` needs to change per feature based on the month's crowd score. Since the weight value itself changes (not just which features are visible), `setData()` with updated `crowd_score` properties is correct.
- **Animating with setInterval instead of requestAnimationFrame:** `setInterval` is not synced to display refresh, causes jank. The project already uses `requestAnimationFrame` in `startPulseAnimation`.
- **Loading Booking.com flexiproduct.js eagerly:** Third-party script will tank Lighthouse score. Must use `next/script strategy="lazyOnload"`.
- **Hardcoding colors in multiple places:** The cool-to-warm gradient is used in both the map heatmap layer AND the calendar grid CSS. Extract a shared `crowdScoreToColor(score: number): string` function.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Heatmap rendering | Custom canvas overlay with pixel manipulation | MapLibre native `heatmap` layer type | GPU-accelerated, handles zoom/pan/projection, configurable via style spec |
| Color interpolation for crowd gradient | Manual RGB lerp function | CSS `color-mix()` or a shared lookup table from score to hex | Edge cases with color spaces; a 10-value lookup is simpler and consistent |
| Booking.com search widget | Custom hotel search form | Official `<ins>` embed + `flexiproduct.js` | Maintains affiliate compliance, auto-suggest works, Booking.com handles UX |
| Route distance calculation | Manual Haversine math for position along route | Index-based interpolation (existing `computeActivePosition`) or `@turf/along` | Geodesic math has edge cases at antimeridian and poles |
| Calendar grid responsive collapse | Custom resize observer logic | CSS Grid with `auto-fill` / `minmax()` or a simple Tailwind responsive class toggle | CSS Grid handles the 12-to-N column collapse natively |

**Key insight:** MapLibre's style specification handles the two hardest rendering problems (heatmap blending and line animation) at the GPU level. The application code only needs to build GeoJSON sources and update them when the month changes.

## Common Pitfalls

### Pitfall 1: Heatmap Z-Order Conflicts
**What goes wrong:** Heatmap layer renders on top of event markers, making events un-clickable.
**Why it happens:** MapLibre layers render in order of addition. If heatmap is added after event layers, it covers them.
**How to avoid:** Use the `beforeId` parameter: `map.addLayer(heatmapLayer, 'clusters')` to insert the heatmap BELOW the cluster layer.
**Warning signs:** Event markers visually appear but click handlers stop firing.

### Pitfall 2: Heatmap Source Update Jank
**What goes wrong:** Scrubbing months causes visible flicker or lag in the heatmap.
**Why it happens:** Calling `setData()` on a GeoJSON source with many features triggers JSON serialization on the main thread. With 30+ destinations this is unlikely to be an issue, but if expanded to hundreds of points, it can cause 100-200ms stalls.
**How to avoid:** For 30 destinations, `setData()` is fine. If scaling beyond 100, consider pre-computing all 12 months of GeoJSON and swapping instantly, or use `updateData()` with feature IDs.
**Warning signs:** Frame drops during month scrubbing, especially on mobile.

### Pitfall 3: Animated Dot Opacity/Z-Index Fight with Route Lines
**What goes wrong:** The animated dot is invisible because it renders below the route line, or the route line renders above event markers.
**Why it happens:** Layer ordering in MapLibre is insertion-order based. If dot layer is added before line layer, the dot is hidden.
**How to avoid:** Add layers in strict order: heatmap (bottom) -> route lines -> route dots -> event layers (top). Use `beforeId` to ensure correct insertion.
**Warning signs:** Dots not visible, or route lines covering event markers.

### Pitfall 4: computeActivePosition Hardcodes Current Date
**What goes wrong:** Animated dot always shows current real-world month position, ignoring the timeline scrubber selection.
**Why it happens:** Existing `computeActivePosition()` in `src/lib/route-utils.ts` uses `new Date().getMonth() + 1` internally.
**How to avoid:** Add a `selectedMonth` parameter to `computeActivePosition()` and pass the scrubber value. Maintain backward compatibility by defaulting to `new Date().getMonth() + 1`.
**Warning signs:** Dot position doesn't change when user scrubs months.

### Pitfall 5: Booking.com Widget Blocks LCP
**What goes wrong:** Lighthouse mobile score drops below 90 because `flexiproduct.js` blocks rendering.
**Why it happens:** Third-party scripts loaded eagerly block the main thread during page load.
**How to avoid:** Load via `next/script` with `strategy="lazyOnload"` — only loads after `window.onload` fires. Include a static fallback link inside the `<ins>` tag so the CTA is visible even before the script loads.
**Warning signs:** Lighthouse TBT (Total Blocking Time) spikes on destination pages.

### Pitfall 6: Destination Weather Data Shape Mismatch
**What goes wrong:** Weather data renders as `undefined` or throws at runtime.
**Why it happens:** Seed data uses `temp_c`, `rain_days`, `sunshine_hours` but the TypeScript type in `types.ts` uses `temp`, `rain`, `sunshine`. These names do not match.
**How to avoid:** Audit the actual JSONB structure in the database against the TypeScript `Destination.weather_data` type. The seed script (line 51) defines `temp_c`, `rain_days`, `sunshine_hours` — update the TypeScript type to match, or normalize in the RPC.
**Warning signs:** `destination.weather_data["1"].temp` returns `undefined` when the actual key is `temp_c`.

## Code Examples

Verified patterns from official sources and existing codebase:

### Adding Heatmap Layer Below Events
```typescript
// Source: MapLibre docs - addLayer with beforeId
// https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#addlayer

// In MapView.tsx, after adding event layers:
map.addSource('crowd-heatmap', {
  type: 'geojson',
  data: buildCrowdHeatmapSource(destinations, selectedMonth),
});

// Insert BELOW clusters — events remain clickable on top
map.addLayer(crowdHeatmapLayer, 'clusters');
```

### Toggling Heatmap Visibility
```typescript
// Source: MapLibre docs - setLayoutProperty
// https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#setlayoutproperty

function toggleHeatmap(map: maplibregl.Map, visible: boolean) {
  map.setLayoutProperty(
    'crowd-heatmap',
    'visibility',
    visible ? 'visible' : 'none'
  );
}
```

### Updating Heatmap When Month Changes
```typescript
// Source: MapLibre docs - GeoJSONSource.setData
// https://maplibre.org/maplibre-gl-js/docs/API/classes/GeoJSONSource/#setdata

useEffect(() => {
  const map = mapRef.current;
  if (!map || !heatmapEnabled || !destinations) return;

  const source = map.getSource('crowd-heatmap') as maplibregl.GeoJSONSource;
  if (source) {
    source.setData(buildCrowdHeatmapSource(destinations, selectedMonth));
  }
}, [selectedMonth, heatmapEnabled, destinations]);
```

### MapLibre Popup for Heatmap Click
```typescript
// Source: MapLibre docs - Popup class
// https://maplibre.org/maplibre-gl-js/docs/API/classes/Popup/

map.on('click', 'crowd-heatmap', (e) => {
  if (!e.features?.length) return;
  const props = e.features[0].properties;

  new maplibregl.Popup({ closeButton: true, maxWidth: '280px' })
    .setLngLat(e.lngLat)
    .setHTML(`
      <div class="p-3">
        <h3 class="font-semibold">${props.name}</h3>
        <p>Crowd score: ${props.crowd_score}/10</p>
        <p>Est. tourists: ${props.tourist_volume}</p>
        <button onclick="findQuieterAlternatives('${props.slug}')">
          Find quieter alternatives
        </button>
      </div>
    `)
    .addTo(map);
});
```

### Extended computeActivePosition with Selected Month
```typescript
// Source: existing src/lib/route-utils.ts — extended

export function computeActivePosition(
  routeCoordinates: number[][],
  peakMonths: number[],
  selectedMonth?: number, // NEW: optional, defaults to current month
): [number, number] | undefined {
  if (!routeCoordinates?.length || !peakMonths?.length) return undefined;

  const month = selectedMonth ?? (new Date().getMonth() + 1);
  // ... rest of existing logic using `month` instead of `currentMonth`
}
```

### Shared Crowd Color Function
```typescript
// NEW: src/lib/crowd-colors.ts
// Used by both heatmap layer config and calendar grid CSS

const CROWD_COLORS = [
  '#7c3aed', // 1 - purple (empty)
  '#6366f1', // 2 - indigo
  '#3b82f6', // 3 - blue
  '#06b6d4', // 4 - cyan
  '#10b981', // 5 - emerald
  '#eab308', // 6 - yellow
  '#f97316', // 7 - orange
  '#ef4444', // 8 - red
  '#dc2626', // 9 - deep red
  '#991b1b', // 10 - dark red (packed)
] as const;

export function crowdScoreToColor(score: number): string {
  const clamped = Math.max(1, Math.min(10, Math.round(score)));
  return CROWD_COLORS[clamped - 1];
}

export function crowdScoreToLabel(score: number): string {
  if (score <= 3) return 'Low season';
  if (score <= 6) return 'Moderate';
  if (score <= 8) return 'Busy';
  return 'Peak crowds';
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom canvas heatmap overlays | MapLibre native `heatmap` layer type | Available since MapLibre GL JS v1 | GPU-accelerated, no plugin, style-spec configurable |
| Mapbox GL JS (proprietary) | MapLibre GL JS (open source) | Project decision pre-build | No API key cost, same WebGL capabilities |
| GeoJSON `setData()` for all updates | `updateData()` for partial updates | MapLibre GL JS v3+ | Only relevant at 100+ features; `setData()` fine for 30 destinations |
| next/image with `loading="lazy"` for LCP | `priority` prop for LCP images | Next.js 13+ | Lazy-loading LCP image is a Lighthouse penalty; use `priority` on hero images |

**Deprecated/outdated:**
- `maplibre-gl` v4 syntax for source creation is the same as v5 — no breaking changes for this use case
- `line-dasharray` does not support data-driven styling — use two separate layers for solid/dashed segments

## Open Questions

1. **Weather data key mismatch between TypeScript type and seed data**
   - What we know: Seed script (`SeedDestination` type, line 51) uses `temp_c`, `rain_days`, `sunshine_hours`. TypeScript type in `types.ts` (line 41) uses `temp`, `rain`, `sunshine`.
   - What's unclear: Which keys are actually stored in the database JSONB? The seed script writes `temp_c`/`rain_days`/`sunshine_hours`.
   - Recommendation: Verify actual database JSONB keys. Update TypeScript `Destination.weather_data` type to match seed data: `{ temp_c: number; rain_days: number; sunshine_hours: number }`. Alternatively, normalize in an RPC.

2. **Heatmap click interaction on low-density areas**
   - What we know: MapLibre heatmap layers are pixel-based blending — `queryRenderedFeatures` returns the source point features within the heatmap's visual radius.
   - What's unclear: When clicking a heatmap region between two destination points, which feature is returned? Can we reliably identify the "region" clicked?
   - Recommendation: Use `queryRenderedFeatures` with the `crowd-heatmap` layer and take the first result. If no result, fall through to event marker click. For the "quieter alternatives" feature, query all destinations visible in the current viewport and sort by crowd score for the selected month.

3. **Number of migration routes to animate simultaneously**
   - What we know: Seed data has 10+ migration routes. Each route needs 2 line layers (solid + dashed) plus 1 animated dot.
   - What's unclear: Is 30+ simultaneous layers (10 routes x 3 layers) a performance concern on mobile?
   - Recommendation: 30 layers is well within MapLibre's capability (hundreds of layers are fine). However, if routes overlap globally, consider only loading routes whose bounding box intersects the current viewport. This can be done client-side by filtering before adding sources.

4. **Destination page data freshness**
   - What we know: Destination pages are SSG (`generateStaticParams`). Crowd and weather data is static seed data that doesn't change frequently.
   - What's unclear: Should events on the destination calendar grid be static (build-time) or fetched client-side for freshness?
   - Recommendation: Keep everything static at build time. Events are seeded, not user-generated. If ISR is needed later (Phase 4 introduces it), it can be added with `revalidate` in the route segment config.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^3.2.4 with happy-dom |
| Config file | vitest.config.mts |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |
| Estimated runtime | ~3 seconds |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CROWD-01 | Heatmap source builder produces valid GeoJSON with crowd_score | unit | `npx vitest run tests/map/heatmap.test.ts -t "heatmap source"` | No — Wave 0 gap |
| CROWD-02 | Heatmap source updates crowd_score property when month changes | unit | `npx vitest run tests/map/heatmap.test.ts -t "month sync"` | No — Wave 0 gap |
| CROWD-03 | Heatmap layer config has correct id and type | unit | `npx vitest run tests/map/heatmap.test.ts -t "layer config"` | No — Wave 0 gap |
| CROWD-04 | Crowd popup data structure includes score, volume, alternatives link | unit | `npx vitest run tests/map/heatmap.test.ts -t "popup data"` | No — Wave 0 gap |
| CROWD-05 | CrowdBadge renders correct label for each crowd_level | unit | `npx vitest run tests/components/crowd-badge.test.tsx` | No — Wave 0 gap |
| WILD-01 | Wildlife events already appear on map (regression check) | smoke | `npx vitest run tests/map/filters.test.ts -t "wildlife"` | Partial — filters.test.ts exists |
| WILD-02 | Route line layers have correct paint properties | unit | `npx vitest run tests/map/migration-layers.test.ts` | No — Wave 0 gap |
| WILD-03 | computeActivePosition returns correct position for given selectedMonth | unit | `npx vitest run tests/map/route-utils.test.ts` | No — Wave 0 gap |
| WILD-04 | Species toggle filters correct layers | unit | `npx vitest run tests/components/species-toggles.test.tsx` | No — Wave 0 gap |
| WILD-05 | Migration popup data includes viewing spots, peak dates, tour links | unit | `npx vitest run tests/map/migration-layers.test.ts -t "popup"` | No — Wave 0 gap |
| DEST-01 | getDestinationBySlug returns valid destination data | unit | `npx vitest run tests/api/destination-queries.test.ts` | No — Wave 0 gap |
| DEST-02 | CalendarGrid renders 12 month columns | unit | `npx vitest run tests/components/calendar-grid.test.tsx` | No — Wave 0 gap |
| DEST-03 | crowdScoreToColor returns correct hex for each score 1-10 | unit | `npx vitest run tests/crowd-colors.test.ts` | No — Wave 0 gap |
| DEST-04 | MonthColumn renders weather data (temp, rain, sunshine) | unit | `npx vitest run tests/components/calendar-grid.test.tsx -t "weather"` | No — Wave 0 gap |
| DEST-05 | computeBestMonth picks lowest crowd + best weather months | unit | `npx vitest run tests/destination-utils.test.ts` | No — Wave 0 gap |
| DEST-06 | Event pills render and expand for each month | unit | `npx vitest run tests/components/calendar-grid.test.tsx -t "pills"` | No — Wave 0 gap |
| DEST-07 | BookingWidget renders ins tag with correct data attributes | unit | `npx vitest run tests/components/booking-widget.test.tsx` | No — Wave 0 gap |
| PERF-01 | Lighthouse mobile score > 90 | manual-only | `npx lighthouse http://localhost:3000 --only-categories=performance --output=json` | N/A — requires running server |

### Nyquist Sampling Rate
- **Minimum sample interval:** After every committed task -> run: `npx vitest run`
- **Full suite trigger:** Before merging final task of any plan wave
- **Phase-complete gate:** Full suite green before `/gsd:verify-work` runs
- **Estimated feedback latency per task:** ~3 seconds

### Wave 0 Gaps (must be created before implementation)
- [ ] `tests/map/heatmap.test.ts` — covers CROWD-01, CROWD-02, CROWD-03, CROWD-04
- [ ] `tests/components/crowd-badge.test.tsx` — covers CROWD-05
- [ ] `tests/map/migration-layers.test.ts` — covers WILD-02, WILD-05
- [ ] `tests/map/route-utils.test.ts` — covers WILD-03
- [ ] `tests/components/species-toggles.test.tsx` — covers WILD-04
- [ ] `tests/api/destination-queries.test.ts` — covers DEST-01
- [ ] `tests/components/calendar-grid.test.tsx` — covers DEST-02, DEST-04, DEST-06
- [ ] `tests/crowd-colors.test.ts` — covers DEST-03
- [ ] `tests/destination-utils.test.ts` — covers DEST-05
- [ ] `tests/components/booking-widget.test.tsx` — covers DEST-07

## Sources

### Primary (HIGH confidence)
- [MapLibre GL JS Heatmap Layer Example](https://maplibre.org/maplibre-gl-js/docs/examples/create-a-heatmap-layer/) — full heatmap layer code with paint properties and color ramp
- [MapLibre Style Spec — Layers](https://maplibre.org/maplibre-style-spec/layers/) — authoritative reference for heatmap and line layer properties
- [MapLibre GL JS — Animate Point Along Route](https://maplibre.org/maplibre-gl-js/docs/examples/animate-a-point-along-a-route/) — requestAnimationFrame + GeoJSON setData pattern
- [MapLibre GL JS — GeoJSONSource.setData](https://maplibre.org/maplibre-gl-js/docs/API/classes/GeoJSONSource/) — dynamic source update API
- [Next.js generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) — SSG dynamic route pattern
- Existing codebase: `src/lib/map/layers.ts`, `src/lib/map/animations.ts`, `src/lib/route-utils.ts`, `src/app/event/[slug]/page.tsx` — verified working patterns

### Secondary (MEDIUM confidence)
- [Booking.com Affiliate Support — Search Box](https://affiliates.support.booking.com/kb/s/article/Search-Box) — `<ins>` embed code structure with flexiproduct.js
- [@turf/along npm](https://www.npmjs.com/package/@turf/along) — v7.3.4, distance-based point interpolation
- [Next.js Lighthouse Optimization Guide](https://www.wisp.blog/blog/mastering-mobile-performance-a-complete-guide-to-improving-nextjs-lighthouse-scores) — next/font, next/image priority, next/script lazyOnload

### Tertiary (LOW confidence)
- [MapLibre setData performance issue #106](https://github.com/maplibre/maplibre-gl-js/issues/106) — potential concern at 100+ features; unlikely to affect 30 destinations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - MapLibre already installed, all needed layer types are native, no new core dependencies
- Architecture: HIGH - follows exact patterns from existing codebase (layer configs, SSG pages, source management)
- Pitfalls: HIGH - identified from codebase audit (z-order, weather type mismatch, computeActivePosition hardcoding)

**Research date:** 2026-03-01
**Valid until:** 2026-03-31 (stable stack, no fast-moving dependencies)
