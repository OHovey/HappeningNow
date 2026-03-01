# Phase 2: Database and Affiliate Infrastructure - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Production-harden the PostGIS schema with correct spatial column types and verified query performance. Build a spatial events API (bbox + month + category). Wire affiliate deep links for Booking.com (via Awin) and GetYourGuide. Create event and wildlife SSG detail pages with structured data, OG tags, and breadcrumb navigation.

</domain>

<decisions>
## Implementation Decisions

### Affiliate link behavior
- Booking.com deep links pre-fill destination city + event check-in/check-out dates
- When no specific Booking.com match exists, fall back to a generic destination search for the nearest city/region (still earns commission)
- Small inline FTC disclosure note near each affiliate CTA (e.g., "Affiliate link" badge or small text)
- GetYourGuide links open to a location-based search for the event's city/region (no curated experience IDs needed)

### Event detail pages (/event/[slug])
- Full-width hero image with event name and dates overlaid (immersive travel-site feel)
- Below the hero, include all of: event description + dates + location, crowd level badge + best time tip, mini embedded MapLibre map pinpointing the event, and a nearby events section (same region or time period)
- OG images use the event photo directly from the database (no generated branded templates)

### Wildlife detail pages (/wildlife/[slug])
- Mini animated map showing the migration route with marked viewing locations, month-aware with current position highlighted
- Same content structure as event pages where applicable (hero, description, crowd info, nearby)
- OG images use the wildlife photo directly

### Spatial API & map data loading
- Full switch from Phase 1 static seed data to live bbox API calls (clean break, no hybrid approach)
- Map re-fetches events on debounced moveend (300-500ms) when user pans/zooms
- API returns all events in the viewport (no server-side pagination) — ~600 total events keeps payloads manageable, MapLibre handles client-side clustering
- API supports server-side category filtering via ?category=festival|wildlife parameter

### Breadcrumb & navigation
- Breadcrumb pattern: Home > Region > Event/Species Name (consistent across both event and wildlife pages)
- Breadcrumb region links point to future SEO listing page URLs (e.g., /festivals/southeast-asia) — reserved now, built in Phase 4
- Floating "Back to Map" button on all detail pages, preserving last viewport/filters

### Claude's Discretion
- Exact debounce timing (300-500ms range)
- Loading states and error handling on detail pages
- Mini map sizing and interaction details
- Nearby events algorithm (geographic vs temporal proximity)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-database-and-affiliate-infrastructure*
*Context gathered: 2026-03-01*
