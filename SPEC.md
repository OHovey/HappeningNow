# HappeningNow.travel — Technical Specification

## Project Overview

**Name:** HappeningNow.travel
**Domain:** happeningnow.travel
**One-liner:** An interactive travel events radar showing what's happening around the world, when — festivals, wildlife events, and crowd levels on one animated map.
**Tech Stack:** Next.js 14+ (App Router), TypeScript, PostgreSQL (Supabase), MapLibre GL JS, Tailwind CSS, deployed on Vercel.
**Monetisation:** Booking.com affiliate (accommodation), GetYourGuide/Viator affiliate (experiences/tours), display ads (Ezoic → Mediavine at scale), email list (ConvertKit).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  Next.js App Router + MapLibre GL JS + Tailwind     │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Timeline │ │Destination│ │ Reverse  │            │
│  │   Map    │ │ Drilldown │ │  Search  │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐                          │
│  │Migration │ │  Crowd   │                          │
│  │ Tracker  │ │ Heatmap  │                          │
│  └──────────┘ └──────────┘                          │
├─────────────────────────────────────────────────────┤
│                   API LAYER                          │
│  Next.js API Routes (Route Handlers)                │
│  /api/events, /api/destinations, /api/wildlife,     │
│  /api/crowds, /api/search, /api/affiliate           │
├─────────────────────────────────────────────────────┤
│                   DATABASE                           │
│  PostgreSQL (Supabase) + PostGIS extension           │
│                                                      │
│  Tables: events, destinations, wildlife_events,      │
│  migration_routes, crowd_data, destinations_months   │
├─────────────────────────────────────────────────────┤
│              EXTERNAL DATA SOURCES                   │
│  PredictHQ API │ Open-Meteo │ Movebank              │
│  AI Scraping   │ Booking.com│ GetYourGuide           │
└─────────────────────────────────────────────────────┘
```

---

## Technology Decisions & Rationale

### Mapping: MapLibre GL JS (NOT Mapbox)

**Decision:** Use MapLibre GL JS with OpenFreeMap tiles.
**Rationale:** MapLibre is the open-source fork of Mapbox GL JS. Zero cost at any scale. Same WebGL-powered vector tile rendering, smooth animations, and rich interactivity. No API key usage billing.

**Implementation:**
- Library: `maplibre-gl` (npm package)
- Tile source: OpenFreeMap (`https://tiles.openfreemap.org/styles/liberty`) for base tiles — free, unlimited, no API key
- Alternative tile source: MapTiler free tier (100k map loads/month) if OpenFreeMap quality insufficient
- React wrapper: `react-map-gl` (supports MapLibre via `mapLib` prop) for React integration with Next.js
- GeoJSON for all custom data layers (events, wildlife routes, crowd heatmap)
- Geocoding: Nominatim (OpenStreetMap) — free, no API key required

**Key MapLibre features needed:**
- `map.setFilter()` — filter event markers by month/category in real time
- `map.setPaintProperty()` — animate dot sizes and colours
- GeoJSON source with `cluster: true` — cluster nearby events at low zoom
- Heatmap layer type — for crowd density overlay
- Line layer with `line-gradient` — for animated migration routes
- Popup/panel on click — show event detail with affiliate links
- `map.flyTo()` — smooth camera transitions on destination drilldown

### Database: Supabase (PostgreSQL + PostGIS)

**Decision:** Supabase hosted PostgreSQL with PostGIS extension.
**Rationale:** Free tier gives 500MB database, 2 projects. PostGIS enables spatial queries (find events within radius, nearest accommodation). Supabase provides instant REST API, auth, and realtime subscriptions. Row-level security for future user accounts. Edge functions for serverless compute. No server management.

**PostGIS usage:**
- Store all locations as `geography(Point, 4326)` columns
- Spatial index for `ST_DWithin()` queries (find events within X km of a point)
- `ST_Distance()` for sorting results by proximity
- Migration route paths stored as `geography(LineString, 4326)`

### Frontend Framework: Next.js 14+ App Router

**Decision:** Next.js with App Router, server components, and static generation.
**Rationale:** 
- Static generation (SSG) for all programmatic SEO pages — pre-render at build time, serve from CDN = fast + cheap
- Server components for data fetching without client-side JavaScript overhead
- API route handlers for dynamic queries (search, filtering)
- ISR (Incremental Static Regeneration) for pages that update periodically (crowd data, new events)
- Image optimisation built-in
- Vercel deployment for free tier (100GB bandwidth, serverless functions)

### Affiliate Integration

**Booking.com:**
- **Affiliate Partner Programme** (not Demand API — the Demand API requires full partner approval and is for OTAs)
- Use **deep links** with affiliate tracking parameters: `https://www.booking.com/searchresults.html?aid=YOUR_AID&dest_id=CITY_ID&checkin=DATE&checkout=DATE`
- Alternatively use their **Search Box Widget** (JavaScript embed) for in-page search
- Commission: 25-40% of Booking.com's commission (which is ~15% of booking value) = ~4-5% of total booking value
- Apply at: `https://www.booking.com/affiliate-program/v2/index.html`

**GetYourGuide:**
- Partner affiliate programme with widget embed
- API available for approved partners: search activities by location, get pricing, deep links
- Commission: 8% of booking value
- Apply at: `https://partner.getyourguide.com/`

**Viator:**
- Affiliate programme through Impact (affiliate network)
- Widget embeds and deep links available
- Commission: 8% of booking value
- Apply via Impact: `https://www.viator.com/affiliates`

**Amazon Associates:**
- For gear recommendations (binoculars, cameras, travel equipment) contextual to wildlife events
- Standard affiliate links with `tag=YOUR_TAG`
- Commission: 1-4.5% depending on category

**Implementation approach:** Start with Booking.com deep links and GetYourGuide widgets embedded in event/destination detail panels. No API integration needed initially — just parameterised URLs. Upgrade to API integration when traffic justifies the effort.

---

## Data Model

### Core Tables

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- DESTINATIONS
-- ============================================
CREATE TABLE destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,               -- URL-friendly: "barcelona-spain"
    country_code CHAR(2) NOT NULL,           -- ISO 3166-1 alpha-2
    country_name TEXT NOT NULL,
    region TEXT,                              -- "Europe", "Southeast Asia", etc.
    sub_region TEXT,                          -- "Western Europe", "Iberian Peninsula"
    location GEOGRAPHY(Point, 4326) NOT NULL,
    population INTEGER,
    timezone TEXT,                            -- "Europe/Madrid"
    description TEXT,                         -- AI-generated, unique per destination
    image_url TEXT,                           -- Hero image URL
    booking_com_dest_id TEXT,                -- Booking.com destination ID for deep links
    booking_com_dest_type TEXT DEFAULT 'city', -- 'city', 'region', 'landmark'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_destinations_location ON destinations USING GIST (location);
CREATE INDEX idx_destinations_country ON destinations(country_code);
CREATE INDEX idx_destinations_slug ON destinations(slug);

-- ============================================
-- EVENTS (Festivals, Cultural Events, etc.)
-- ============================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id UUID REFERENCES destinations(id),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,                   -- 'music_festival', 'cultural_festival', 
                                              -- 'food_festival', 'religious_festival',
                                              -- 'sporting_event', 'carnival', 'market',
                                              -- 'light_show', 'film_festival', 'other'
    subcategory TEXT,                         -- More specific: 'electronic_music', 'jazz', etc.
    description TEXT,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    venue_name TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    recurrence TEXT,                          -- 'annual', 'biennial', 'one_off', null
    typical_month INTEGER,                   -- 1-12, for annual events (SEO pages)
    typical_start_day INTEGER,               -- Approximate day of month
    typical_duration_days INTEGER,
    estimated_attendance INTEGER,
    scale TEXT,                               -- 'local', 'regional', 'national', 'international'
    cost_level TEXT,                          -- 'free', 'budget', 'moderate', 'expensive'
    website_url TEXT,
    image_url TEXT,
    tags TEXT[],                              -- ['outdoor', 'family_friendly', 'nightlife']
    source TEXT,                              -- Where we got the data
    source_id TEXT,                           -- External ID from source
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_location ON events USING GIST (location);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_month ON events(typical_month);
CREATE INDEX idx_events_destination ON events(destination_id);
CREATE INDEX idx_events_slug ON events(slug);

-- ============================================
-- WILDLIFE EVENTS
-- ============================================
CREATE TABLE wildlife_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    species_name TEXT NOT NULL,               -- "Humpback Whale"
    species_scientific TEXT,                  -- "Megaptera novaeangliae"
    event_type TEXT NOT NULL,                 -- 'migration', 'breeding', 'nesting',
                                              -- 'calving', 'hatching', 'feeding_frenzy',
                                              -- 'spawning', 'aurora_viewing', 'bioluminescence'
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    destination_id UUID REFERENCES destinations(id),
    viewing_region TEXT,                      -- "Baja California coast"
    peak_month_start INTEGER NOT NULL,       -- 1-12
    peak_month_end INTEGER NOT NULL,         -- 1-12 (handles wrapping: start=11, end=2)
    season_month_start INTEGER,              -- Broader season window
    season_month_end INTEGER,
    best_time_of_day TEXT,                   -- 'dawn', 'dusk', 'night', 'any'
    estimated_viewing_chance TEXT,            -- 'guaranteed', 'high', 'moderate', 'low'
    tour_required BOOLEAN DEFAULT false,
    typical_tour_cost_gbp INTEGER,           -- Approximate cost for context
    tags TEXT[],                              -- ['whale_watching', 'boat_tour', 'snorkeling']
    image_url TEXT,
    getyourguide_search_term TEXT,           -- Pre-filled search for affiliate widget
    source TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wildlife_location ON wildlife_events USING GIST (location);
CREATE INDEX idx_wildlife_months ON wildlife_events(peak_month_start, peak_month_end);
CREATE INDEX idx_wildlife_type ON wildlife_events(event_type);
CREATE INDEX idx_wildlife_slug ON wildlife_events(slug);

-- ============================================
-- MIGRATION ROUTES (for animated map paths)
-- ============================================
CREATE TABLE migration_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wildlife_event_id UUID REFERENCES wildlife_events(id),
    species_name TEXT NOT NULL,
    route_name TEXT NOT NULL,                 -- "East African Wildebeest Migration"
    route_path GEOGRAPHY(LineString, 4326) NOT NULL, -- The actual route geometry
    direction TEXT,                           -- 'north_to_south', 'circular', etc.
    month_sequence JSONB,                    -- [{"month":1,"lat":X,"lng":Y,"label":"Serengeti"}...]
    total_distance_km INTEGER,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_migration_routes_path ON migration_routes USING GIST (route_path);

-- ============================================
-- CROWD DATA (monthly crowd levels per destination)
-- ============================================
CREATE TABLE crowd_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id UUID REFERENCES destinations(id) NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    crowd_level INTEGER NOT NULL CHECK (crowd_level >= 1 AND crowd_level <= 10),
                                              -- 1=deserted, 5=moderate, 10=overcrowded
    tourist_arrivals_estimate INTEGER,        -- If available
    hotel_occupancy_pct INTEGER,              -- 0-100
    avg_hotel_price_gbp INTEGER,              -- Average nightly rate
    weather_temp_avg_c REAL,                  -- Average temperature
    weather_rain_days INTEGER,                -- Rainy days in month
    weather_sunshine_hours REAL,
    data_year INTEGER DEFAULT 2025,
    source TEXT,
    UNIQUE(destination_id, month, data_year)
);

CREATE INDEX idx_crowd_destination_month ON crowd_data(destination_id, month);

-- ============================================
-- PROGRAMMATIC SEO PAGES (pre-computed)
-- ============================================
CREATE TABLE seo_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,               -- "festivals/europe/october"
    page_type TEXT NOT NULL,                 -- 'events_region_month', 'destination_events',
                                              -- 'wildlife_region', 'event_detail'
    title TEXT NOT NULL,                     -- "Festivals in Europe in October 2026"
    meta_description TEXT NOT NULL,          -- Max 160 chars
    h1 TEXT NOT NULL,
    intro_text TEXT,                         -- 2-3 paragraphs, AI-generated, unique
    destination_ids UUID[],                  -- Related destinations
    event_ids UUID[],                        -- Related events
    wildlife_event_ids UUID[],
    filters JSONB,                           -- Pre-applied filters: {"region":"europe","month":10}
    internal_links JSONB,                    -- [{"text":"...", "slug":"..."}]
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_seo_pages_slug ON seo_pages(slug);
CREATE INDEX idx_seo_pages_type ON seo_pages(page_type);

-- ============================================
-- EMAIL SUBSCRIBERS
-- ============================================
CREATE TABLE subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    interests TEXT[],                         -- ['festivals', 'wildlife', 'europe']
    preferred_regions TEXT[],
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    source TEXT                               -- 'homepage_popup', 'event_page', 'tool_result'
);
```

### GeoJSON Export Views

```sql
-- View for MapLibre event markers
CREATE VIEW v_event_markers AS
SELECT 
    e.id,
    e.name,
    e.category,
    e.scale,
    e.start_date,
    e.end_date,
    e.typical_month,
    e.estimated_attendance,
    e.image_url,
    e.slug,
    d.name AS destination_name,
    d.country_code,
    d.booking_com_dest_id,
    ST_X(e.location::geometry) AS lng,
    ST_Y(e.location::geometry) AS lat
FROM events e
LEFT JOIN destinations d ON e.destination_id = d.id
WHERE e.is_active = true;

-- View for MapLibre wildlife markers
CREATE VIEW v_wildlife_markers AS
SELECT
    w.id,
    w.species_name,
    w.event_type,
    w.peak_month_start,
    w.peak_month_end,
    w.estimated_viewing_chance,
    w.slug,
    w.image_url,
    w.getyourguide_search_term,
    d.name AS destination_name,
    d.country_code,
    ST_X(w.location::geometry) AS lng,
    ST_Y(w.location::geometry) AS lat
FROM wildlife_events w
LEFT JOIN destinations d ON w.destination_id = d.id
WHERE w.is_active = true;
```

---

## Data Sourcing Strategy

### Tier 1: Seed Data (Manual + AI — needed for MVP)

Build an initial dataset of ~500 events and ~100 wildlife events to launch with. This is the minimum viable dataset.

**Festivals & Cultural Events (Target: 500 initial):**
1. **Wikipedia scraping** — "List of festivals in [country]" pages exist for most countries. Parse with AI to extract: name, location, dates, category, estimated size. This is the richest free source.
2. **Government tourism board sites** — Most national tourism websites list major festivals. Scrape with AI.
3. **Manual curation of top 100** — The 100 most famous festivals worldwide (Glastonbury, Carnival, Oktoberfest, Diwali, Holi, Mardi Gras, Songkran, etc.) should have hand-verified rich data.
4. **Eventbrite public listings** — Their public-facing website (not API) lists events by location. Scrape festival-category events.

**Wildlife Events (Target: 100 initial):**
1. **Manual curation** — The top ~100 wildlife spectacles are well-documented. Sources: World Wildlife Fund, National Geographic migration guides, Lonely Planet wildlife guides. Curate by hand/AI.
2. **Movebank Data Repository** — Free, open-access animal tracking datasets. Over 7,500 studies. Use for actual migration route GeoJSON paths. API endpoint: `https://www.movebank.org/movebank/service/direct-read?entity_type=study` (public studies only).
3. **GBIF Occurrence API** — `https://api.gbif.org/v1/occurrence/search` — Species occurrence data by location and date. Free, no auth required. Use to validate seasonal presence.

**Crowd Data (Target: all 500 destinations):**
1. **Open-Meteo API** — `https://api.open-meteo.com/v1/forecast` — Free, no API key, weather data for any coordinate. Temperature, rain, sunshine hours by month.
2. **Numbeo** — Cost of living and hotel price indices by city. Scrape city pages.
3. **AI estimation** — For crowd levels, use Claude to estimate 1-10 crowd levels per destination per month based on known tourist seasons. Cross-reference with Google Trends data for "[destination] holiday" searches by month.

### Tier 2: Enrichment APIs (Post-MVP)

**PredictHQ Events API:**
- Endpoint: `https://api.predicthq.com/v1/events/`
- Auth: OAuth 2.0 Bearer token
- Filters: `category=festivals,performing-arts,community`, `location.within=RADIUS@LAT,LNG`, `active.gte=DATE`
- Returns: title, description, start/end, location (lat/lng), predicted attendance, rank
- Pricing: Free tier = 1,000 API calls/month. Paid starts ~$200/month.
- Use case: Automated discovery of new events. Run weekly to supplement manual data.

**Songkick API (music events only):**
- Endpoint: `https://api.songkick.com/api/3.0/events.json`
- Auth: API key (free, apply at songkick.com/developer)
- Filters: location (metro area or lat/lng), min_date, max_date
- Returns: event name, venue, artists, date, location
- Use case: Supplement music festival data specifically.

### Tier 3: Continuous Data Pipeline (Month 3+)

Build an automated pipeline that runs weekly:
1. PredictHQ API scan for new events in monitored regions
2. AI scraping of tourism board RSS feeds for new festival announcements
3. Movebank new public study notifications
4. Open-Meteo climate data refresh (monthly)
5. Crowd level model retraining with any new data

---

## API Routes

### `/api/events`

```
GET /api/events?month=10&region=europe&category=music_festival&limit=50&offset=0
GET /api/events?lat=41.38&lng=2.17&radius_km=200&month=10
GET /api/events/[slug]
```

Response format (GeoJSON FeatureCollection for map consumption):
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [2.17, 41.38] },
      "properties": {
        "id": "uuid",
        "name": "Primavera Sound",
        "category": "music_festival",
        "scale": "international",
        "start_date": "2026-06-04",
        "end_date": "2026-06-08",
        "estimated_attendance": 200000,
        "destination_name": "Barcelona",
        "country_code": "ES",
        "image_url": "...",
        "slug": "primavera-sound-barcelona",
        "booking_link": "https://www.booking.com/searchresults.html?aid=YOUR_AID&dest_id=-372490&checkin=2026-06-03&checkout=2026-06-09"
      }
    }
  ],
  "meta": { "total": 127, "limit": 50, "offset": 0 }
}
```

### `/api/wildlife`

```
GET /api/wildlife?month=10&region=africa&type=migration
GET /api/wildlife?lat=-2.33&lng=34.83&radius_km=500
GET /api/wildlife/[slug]
GET /api/wildlife/routes/[id]  -- Returns GeoJSON LineString for animation
```

### `/api/destinations`

```
GET /api/destinations/[slug]
GET /api/destinations/[slug]/calendar  -- Returns 12-month event + crowd summary
GET /api/destinations?country=ES&has_events_in_month=10
```

### `/api/search`

```
POST /api/search/reverse
Body: {
  "date_from": "2026-10-01",
  "date_to": "2026-10-07",
  "airport_code": "LHR",          // Optional
  "max_flight_hours": 4,          // Optional
  "categories": ["music_festival", "wildlife"],
  "sort_by": "worth_score"        // attendance * uniqueness / crowd_level
}
```

### `/api/crowds`

```
GET /api/crowds/[destination_slug]?month=10
GET /api/crowds/heatmap?month=10&region=europe  -- Returns GeoJSON for heatmap layer
```

---

## Page Structure & Routes

### Dynamic App Pages

| Route | Component | Data Source | Rendering |
|-------|-----------|-------------|-----------|
| `/` | Homepage — Timeline Map | `/api/events` + `/api/wildlife` | Client-side (interactive map) |
| `/explore` | Full-screen map with all controls | All APIs | Client-side |
| `/destination/[slug]` | Destination drilldown | `/api/destinations/[slug]/calendar` | SSG + ISR (revalidate 24h) |
| `/event/[slug]` | Event detail page | `/api/events/[slug]` | SSG + ISR |
| `/wildlife/[slug]` | Wildlife event detail | `/api/wildlife/[slug]` | SSG + ISR |
| `/search` | Reverse search tool | `/api/search/reverse` | Client-side |

### Programmatic SEO Pages (SSG)

| Pattern | Example | Volume | Template |
|---------|---------|--------|----------|
| `/festivals/[region]/[month]` | `/festivals/europe/october` | ~120 (10 regions × 12 months) | Event list + map + intro text |
| `/festivals/[country]` | `/festivals/spain` | ~80 countries | Country event list + calendar |
| `/festivals/[country]/[month]` | `/festivals/spain/october` | ~960 | Filtered event list |
| `/wildlife/[region]` | `/wildlife/east-africa` | ~15 | Wildlife events by region |
| `/wildlife/[species]` | `/wildlife/humpback-whale` | ~50 species | Species page with all viewing locations |
| `/wildlife/[region]/[month]` | `/wildlife/east-africa/july` | ~180 | What to see where, when |
| `/what-to-do/[destination]/[month]` | `/what-to-do/barcelona/october` | ~2000+ | Combined events + crowd + weather |
| `/best-festivals/[year]` | `/best-festivals/2026` | 1/year | Annual roundup |

**Total programmatic pages: ~3,500+ from initial dataset, scaling to 10,000+ as data grows.**

Each programmatic page includes:
- Unique AI-generated intro paragraph (2-3 sentences) — generated at build time
- Pre-filtered map view (embedded MapLibre showing relevant markers)
- Event/wildlife cards with affiliate links
- "Nearby accommodation" Booking.com deep link
- "Book experiences" GetYourGuide deep link
- Internal links to related pages (other months, nearby destinations)
- Email capture: "Get notified about [topic]"
- JSON-LD structured data (Event schema, TouristDestination schema)
- Open Graph tags for social sharing

---

## Component Architecture

### Core Components

```
src/
├── app/
│   ├── layout.tsx                    # Root layout, nav, footer
│   ├── page.tsx                      # Homepage with hero map
│   ├── explore/page.tsx              # Full-screen map tool
│   ├── destination/[slug]/page.tsx   # Destination drilldown
│   ├── event/[slug]/page.tsx         # Event detail
│   ├── wildlife/[slug]/page.tsx      # Wildlife event detail
│   ├── search/page.tsx               # Reverse search
│   ├── festivals/[...path]/page.tsx  # Catch-all for SEO pages
│   ├── wildlife/[...path]/page.tsx   # Catch-all for wildlife SEO pages
│   ├── what-to-do/[...path]/page.tsx # Combined SEO pages
│   └── api/                          # Route handlers
│       ├── events/route.ts
│       ├── wildlife/route.ts
│       ├── destinations/route.ts
│       ├── search/route.ts
│       └── crowds/route.ts
├── components/
│   ├── map/
│   │   ├── MapContainer.tsx          # MapLibre GL JS initialisation
│   │   ├── TimelineScrubber.tsx      # Horizontal month slider
│   │   ├── EventMarkers.tsx          # GeoJSON event layer
│   │   ├── WildlifeMarkers.tsx       # GeoJSON wildlife layer
│   │   ├── MigrationRoutes.tsx       # Animated line layers
│   │   ├── CrowdHeatmap.tsx          # Heatmap overlay layer
│   │   ├── EventPopup.tsx            # Click popup with affiliate links
│   │   ├── LayerToggle.tsx           # Toggle festivals/wildlife/crowds
│   │   └── MapControls.tsx           # Zoom, locate me, fullscreen
│   ├── search/
│   │   ├── MonthPicker.tsx           # "I want to go in [month]"
│   │   ├── CategoryFilter.tsx        # Festival type filter chips
│   │   ├── RegionSelector.tsx        # Region/country dropdown
│   │   ├── ReverseSearchForm.tsx     # "I have a week off..." form
│   │   └── SearchResults.tsx         # Ranked result cards
│   ├── destination/
│   │   ├── CalendarGrid.tsx          # 12-month event/crowd calendar
│   │   ├── EventCard.tsx             # Event summary card
│   │   ├── WildlifeCard.tsx          # Wildlife event card
│   │   └── CrowdIndicator.tsx        # Green→Red crowd badge
│   ├── affiliate/
│   │   ├── BookingWidget.tsx         # Booking.com deep link button/search
│   │   ├── ExperienceWidget.tsx      # GetYourGuide/Viator embed
│   │   └── GearRecommendation.tsx    # Amazon affiliate contextual
│   ├── seo/
│   │   ├── JsonLd.tsx                # Structured data component
│   │   ├── OpenGraph.tsx             # OG tags
│   │   └── Breadcrumbs.tsx           # Breadcrumb navigation
│   ├── email/
│   │   ├── EmailCapture.tsx          # Inline email signup
│   │   └── AlertSignup.tsx           # "Alert me about events in [region]"
│   └── ui/
│       ├── Header.tsx
│       ├── Footer.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
├── lib/
│   ├── supabase.ts                   # Supabase client
│   ├── maplibre.ts                   # MapLibre config & helpers
│   ├── affiliate.ts                  # Affiliate link generators
│   ├── geojson.ts                    # GeoJSON conversion utilities
│   ├── seo.ts                        # Slug generation, meta helpers
│   └── types.ts                      # TypeScript interfaces
├── data/
│   ├── seed/                         # Initial seed data JSON files
│   │   ├── festivals.json
│   │   ├── wildlife.json
│   │   ├── destinations.json
│   │   └── migration-routes.json
│   └── scripts/
│       ├── seed-database.ts          # Seed script
│       ├── generate-seo-pages.ts     # Generate SEO page records
│       └── scrape-events.ts          # Data collection scripts
└── styles/
    └── globals.css                   # Tailwind + custom map styles
```

---

## Tool Specifications

### Tool 1: The Timeline Map (Homepage)

**User experience:**
1. Page loads → map renders at world view showing "What's happening this week" (events with dates overlapping current week)
2. Pulsing coloured dots: 🟠 orange = festivals, 🟢 green = wildlife, 🔵 blue = celestial/other
3. Dot size corresponds to event scale (international = 16px, local = 6px)
4. Below the map: horizontal scrubber bar with 12 months labelled
5. User drags scrubber to a different month → map animates: dots fade out and new dots fade in based on selected month
6. Above the map: sentence "What's happening in the world in **[Month Picker]**?" where month is a dropdown
7. Toggle buttons above map: 🎪 Festivals | 🐋 Wildlife | All
8. At low zoom levels, nearby events cluster into numbered circles. Click cluster → zoom in
9. Click any event dot → side panel slides in from right with: event name, dates, photo, description, "Stay nearby" (Booking.com link), "Book experiences" (GetYourGuide link)

**Technical implementation:**
- MapLibre source: GeoJSON FeatureCollection loaded from `/api/events?month=CURRENT`
- On scrubber change: fetch new month data, update source with `map.getSource('events').setData(newGeoJSON)`
- Use CSS transition on opacity for fade effect during data swap
- Clustering: `source` config with `cluster: true, clusterMaxZoom: 14, clusterRadius: 50`
- Different layers for different categories, toggled with `map.setLayoutProperty(layerId, 'visibility', 'visible'/'none')`
- Side panel: React state, absolute positioned div that slides in/out

### Tool 2: Destination Drilldown

**User experience:**
1. Click any country or destination on the map → map zooms in (`flyTo`), URL updates to `/destination/[slug]`
2. Below the zoomed map: a 12-column calendar grid showing the full year
3. Each column (month) contains stacked coloured pills:
   - 🟠 Festival pills (click to expand)
   - 🟢 Wildlife pills
   - Crowd level bar (green→amber→red gradient background)
   - Temperature and rain summary
4. Click any pill → expands to show event details + affiliate links
5. Right sidebar: "Best time to visit" AI summary, accommodation price range by month (chart)

**Technical implementation:**
- SSG page at `/destination/[slug]` — pre-rendered at build time from `destinations` + `events` + `crowd_data` + `wildlife_events` tables
- Calendar grid: CSS Grid, 12 columns
- Pills: absolutely positioned within each column, coloured by category
- Crowd gradient: computed from `crowd_level` (1-10) mapped to green→red HSL
- Charts: Recharts (lightweight) for price/temperature trends

### Tool 3: Reverse Search ("What Can I See?")

**User experience:**
1. Form with inputs: "I have time off from **[date]** to **[date]**" + "I'm near **[location/airport]**" + "Show me **[festivals / wildlife / both]**"
2. Optional: "Max travel time: [2h / 4h / 8h / any]"
3. Submit → results appear as ranked cards below the form, and markers on the map
4. Each card: event photo, name, dates, travel time from their location, crowd level indicator, accommodation price range, "Worth the trip" composite score
5. "Worth the trip" score = (event scale × uniqueness) ÷ (crowd level × distance)
6. Each card has: "Stay nearby" Booking.com button, "Book experience" GetYourGuide button

**Technical implementation:**
- Client-side form, POST to `/api/search/reverse`
- Server: query events + wildlife where `start_date >= date_from AND end_date <= date_to`
- If location provided: filter by `ST_DWithin(location, ST_MakePoint(lng, lat)::geography, radius_meters)`
- Radius calculated from max_flight_hours (rough: 2h = 2000km, 4h = 4000km, 8h = 8000km)
- Score calculation done server-side, results sorted by score descending
- Results rendered as cards + GeoJSON markers on the map

### Tool 4: Migration Tracker

**User experience:**
1. Accessed via wildlife toggle on main map, or `/wildlife` route
2. Shows animated paths on the map: curved lines representing migration routes
3. Timeline scrubber controls which month → a "pulse dot" moves along each active route to show where animals are in that month
4. Toggle species as layers: 🐋 Whales | 🦓 Wildebeest | 🦋 Butterflies | 🐦 Birds | All
5. Click any point on a route → popup: "Best viewing spots nearby", "Peak dates at this location", "Book a safari/tour" (GetYourGuide link)
6. Route colours: different per species group

**Technical implementation:**
- Migration routes stored as GeoJSON LineStrings in `migration_routes` table
- MapLibre line layer with `line-gradient` paint property for visual style
- Animation: use `month_sequence` JSONB to position a circle marker at the correct lat/lng for the selected month
- On scrubber change: update circle marker positions using `map.getSource('migration-dots').setData(updatedPositions)`
- Each route is a separate MapLibre layer, toggled independently
- Click handler on route line or dot → show popup with nearest viewing locations (query `wildlife_events` within radius of clicked point)

### Tool 5: Crowd Heatmap Overlay

**User experience:**
1. Toggle button on main map: "Show crowds" — activates a translucent heatmap layer
2. Heatmap colours: green (low crowds) → amber → red (overcrowded)
3. Changes with month scrubber — drag to August and Mediterranean goes red, November goes green
4. Interacts with event data: creates visible "aha moments" — user sees a festival in a green (quiet) area and realises the opportunity
5. Click on any heatmap region → popup shows: crowd level score, tourist numbers, "Discover quiet alternatives nearby" link

**Technical implementation:**
- `crowd_data` table provides per-destination, per-month crowd scores
- Generate heatmap GeoJSON: each destination as a weighted point (weight = crowd_level)
- MapLibre heatmap layer: `heatmap-weight` = crowd_level property, `heatmap-color` = green→amber→red interpolation
- On month change: swap GeoJSON source data with the new month's crowd weights
- Heatmap layer sits below event markers (z-order) so events are always clickable
- Alternative at high zoom: switch from heatmap to circle markers with colour-coded crowd levels

---

## GSD Phase Breakdown

This project should be broken into the following phases for GSD execution. Each phase is designed to produce a working, deployable increment.

### Phase 1: Foundation
**Goal:** Database, base Next.js project, MapLibre rendering a basic map with sample data.
- Set up Next.js 14 project with TypeScript, Tailwind, App Router
- Set up Supabase project with PostGIS, create all tables and indexes
- Create seed data: 50 manually curated festivals + 20 wildlife events + 30 destinations (JSON files)
- Run seed script to populate database
- Implement MapLibre GL JS basic map rendering on homepage
- Load event markers from Supabase via API route, display as GeoJSON dots on map
- Basic click → popup showing event name and dates
- Deploy to Vercel

**Verification:** Map loads, 50 event dots visible, clicking a dot shows popup with event name. Page deployed and accessible.

### Phase 2: Timeline & Filtering
**Goal:** The Timeline Map tool is fully functional — scrubber, month filtering, category toggles, clustering.
- Build TimelineScrubber component (horizontal 12-month slider)
- Wire scrubber to API: on month change, fetch filtered events, update map source
- Implement category toggle buttons (festivals / wildlife / both)
- Implement marker clustering at low zoom levels
- Style markers: size by scale, colour by category, pulse animation on hover
- Add "What's happening this week" default view on page load
- Add MonthPicker dropdown above the map

**Verification:** Drag scrubber → markers change. Toggle categories → markers filter. Clusters appear at world zoom and break apart on zoom in.

### Phase 3: Event Detail & Affiliate Integration
**Goal:** Clicking an event opens a rich side panel with affiliate links. Event detail pages exist.
- Build EventPopup / side panel component with: name, dates, photo, description, crowd level
- Generate Booking.com affiliate deep links per event (parameterised with destination, dates)
- Add "Stay nearby" button linking to Booking.com
- Add GetYourGuide widget/deep link for "Book experiences"
- Build `/event/[slug]` detail pages (SSG)
- Build `/wildlife/[slug]` detail pages (SSG)
- Add JSON-LD structured data (Event schema) to detail pages
- Add Open Graph meta tags for social sharing

**Verification:** Click event dot → panel shows with working Booking.com and GetYourGuide links (open correct pages). `/event/primavera-sound-barcelona` renders as a full page with structured data visible in source.

### Phase 4: Destination Drilldown
**Goal:** The Destination Drilldown tool works — click a destination, see the 12-month calendar view.
- Build `/destination/[slug]` page with SSG
- Build CalendarGrid component (12-column CSS grid)
- Populate with events, wildlife events, and crowd data per month
- Style crowd level as background gradient per column
- Add weather summary (temperature, rain) from crowd_data
- "Best time to visit" AI-generated text in seed data
- Internal linking: event pills link to event detail pages
- Booking.com widget on destination page: pre-filled with destination and "best" month

**Verification:** `/destination/barcelona-spain` shows full calendar with events in correct months, crowd levels coloured, weather shown. Affiliate links work.

### Phase 5: Reverse Search
**Goal:** The "What Can I See?" reverse search tool works.
- Build `/search` page with ReverseSearchForm component
- Implement date range picker, location input (with Nominatim geocoding), category filter
- Implement max travel distance slider
- Build `/api/search/reverse` endpoint with PostGIS spatial queries
- Implement "worth the trip" scoring algorithm
- Render results as ranked cards with affiliate links
- Show results simultaneously on the map as highlighted markers

**Verification:** Enter dates + location → relevant events appear ranked by score. Map shows corresponding markers. Affiliate links work on each result card.

### Phase 6: Wildlife & Migration Tracker
**Goal:** Migration routes animate on the map, wildlife events fully integrated.
- Seed 10 major migration routes as GeoJSON LineStrings (wildebeest, humpback whale, Arctic tern, monarch butterfly, caribou, sardine run, flamingo, sea turtle, grey whale, snow goose)
- Build MigrationRoutes component with MapLibre line layers
- Implement animated position dot based on selected month from `month_sequence` data
- Build species toggle controls
- Click route → popup with viewing info and tour affiliate links
- Wildlife events appear alongside festival events on the Timeline Map

**Verification:** Toggle wildlife layer → migration routes appear. Drag scrubber → animal dots move along routes. Click route → popup with tour booking link.

### Phase 7: Crowd Heatmap
**Goal:** Crowd heatmap overlay toggle works on the main map.
- Populate crowd_data table for all destinations (AI-estimated if needed)
- Build CrowdHeatmap MapLibre layer
- Wire to month scrubber: on month change, update heatmap weights
- Style: green→amber→red colour ramp
- Z-order: heatmap below event markers
- Click interaction: show crowd detail popup
- Add crowd indicators to event popup ("This event happens during peak crowds" / "Low season — great timing!")

**Verification:** Toggle "Show crowds" → heatmap appears. Mediterranean goes red in August, green in November. Events remain clickable above heatmap.

### Phase 8: Programmatic SEO Pages
**Goal:** Thousands of SEO pages auto-generated and deployed.
- Build `generate-seo-pages.ts` script that creates page records from database combinations
- Generate unique AI intro text for each page (batch process via Claude API)
- Build catch-all routes: `/festivals/[...path]`, `/wildlife/[...path]`, `/what-to-do/[...path]`
- Implement `generateStaticParams()` for SSG of all pages
- Each page: embedded mini-map (pre-filtered), event cards, affiliate links, internal links, email capture
- Generate XML sitemap from seo_pages table
- Add `robots.txt` and sitemap submission config
- Breadcrumb navigation on all pages

**Verification:** `/festivals/europe/october` renders with correct events, unique intro text, working map, affiliate links, and valid JSON-LD. Sitemap includes all generated pages.

### Phase 9: Email Capture & Polish
**Goal:** Email capture working, UI polish, performance optimisation.
- Integrate ConvertKit API for email submissions
- Build EmailCapture component (inline form, not intrusive popup)
- Build AlertSignup component ("Alert me about events in [region]")
- Implement tag-based segmentation: interests, regions
- Responsive design audit: mobile-first for all components
- Map mobile optimisation: touch gestures, simplified controls on small screens
- Image optimisation: Next.js Image component, lazy loading
- Performance audit: Core Web Vitals, Lighthouse score > 90
- Error boundaries and loading states throughout
- Add Ezoic ad code placeholder (activate when traffic permits)
- Analytics: Plausible or Umami (privacy-focused, no cookie banner needed)

**Verification:** Email submit works and appears in ConvertKit. Lighthouse mobile score > 90. All pages responsive. Map works on mobile with touch gestures.

### Phase 10: Data Scaling & Automation
**Goal:** Scale from 500 to 2000+ events, automate data pipeline.
- Build scraping scripts for Wikipedia festival lists (top 30 countries)
- Build PredictHQ API integration script (if budget allows, otherwise continue manual + AI)
- Build Songkick API integration for music events
- Expand wildlife events to 100+ with AI research
- Build weekly cron job (Supabase Edge Function or Vercel Cron) to check for new events
- Build data validation pipeline: deduplicate, geocode missing locations, flag anomalies
- Regenerate SEO pages after data updates (ISR or rebuild trigger)

**Verification:** Database contains 2000+ events across 50+ countries. Automated scraping adds new events weekly. SEO pages reflect new data within 24 hours.

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# MapLibre (no key needed for OpenFreeMap tiles)
NEXT_PUBLIC_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty

# Affiliate
NEXT_PUBLIC_BOOKING_AID=your_booking_affiliate_id
NEXT_PUBLIC_GYG_PARTNER_ID=your_getyourguide_partner_id
NEXT_PUBLIC_AMAZON_TAG=your_amazon_tag

# Email
CONVERTKIT_API_KEY=xxx
CONVERTKIT_FORM_ID=xxx

# Data sourcing (server-side only)
PREDICTHQ_API_TOKEN=xxx
SONGKICK_API_KEY=xxx

# Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=happeningnow.travel

# OpenAI/Claude for AI-generated text
ANTHROPIC_API_KEY=xxx
```

---

## Performance Targets

| Metric | Target | How |
|--------|--------|-----|
| Lighthouse Performance | > 90 | SSG pages, image optimisation, code splitting |
| First Contentful Paint | < 1.5s | Server-rendered above-fold, lazy load map |
| Largest Contentful Paint | < 2.5s | Optimised hero images, prioritised loading |
| Map initial load | < 2s | Vector tiles (small), GeoJSON lazy loaded |
| Time to Interactive | < 3s | Code splitting, deferred non-critical JS |
| SEO page build time | < 30s each | Efficient database queries, batch generation |
| API response time | < 200ms | PostGIS spatial indexes, Supabase edge |
| Mobile usability | 100% | Responsive grid, touch-optimised map |

---

## Deployment

- **Hosting:** Vercel (free tier: 100GB bandwidth, serverless functions, automatic SSL)
- **Database:** Supabase free tier (500MB, 2 projects)
- **CDN:** Vercel Edge Network (automatic)
- **Domain:** Purchase via Namecheap/Cloudflare (~£10/year)
- **Monitoring:** Vercel Analytics (built-in) + Plausible (free self-hosted or €9/month hosted)
- **Error tracking:** Sentry free tier
- **CI/CD:** GitHub → Vercel auto-deploy on push to main

**Cost at launch: ~£10/year (domain only).** Everything else is free tier.
**Cost at scale (50k+ monthly visitors): ~£20-50/month** (Supabase Pro £25, Plausible £9, domain £10/year).
