# HappeningNow.travel

## What This Is

An interactive travel events radar that shows what's happening around the world, when — festivals, wildlife events, and crowd levels on one animated map. Users browse by month, discover events, and book accommodation/experiences through affiliate links. Monetised through Booking.com, GetYourGuide/Viator affiliate commissions, display ads, and email list growth.

## Core Value

The Timeline Map — an animated world map where users scrub through months and see pulsing dots for festivals, wildlife spectacles, and crowd levels appear and disappear. This is the visual "wow" moment that makes the product memorable and shareable.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Interactive map with event markers (MapLibre GL JS + OpenFreeMap tiles)
- [ ] Timeline scrubber to filter events by month with animated transitions
- [ ] Category toggles (festivals / wildlife / both) with marker clustering
- [ ] Event detail side panel with photos, descriptions, and affiliate links
- [ ] Booking.com deep links for accommodation near events
- [ ] GetYourGuide/Viator deep links for experiences/tours
- [ ] Event detail pages (SSG) with structured data and OG tags
- [ ] Wildlife event detail pages (SSG) with viewing info
- [ ] Destination drilldown with 12-month calendar grid showing events, crowds, weather
- [ ] Reverse search tool ("I have a week off, show me what's nearby")
- [ ] Migration route tracker with animated paths on map
- [ ] Crowd heatmap overlay (green→red) changing with month scrubber
- [ ] Programmatic SEO pages (~3,500+ pages: festivals/region/month, wildlife/region, what-to-do/destination/month)
- [ ] Email capture with ConvertKit integration and interest-based segmentation
- [ ] Seed data: ~500 festivals, ~100 wildlife events, ~30+ destinations with crowd/weather data
- [ ] Data pipeline for scaling to 2000+ events (Wikipedia scraping, PredictHQ API)
- [ ] Responsive/mobile-optimised design with Lighthouse score > 90
- [ ] Deploy on Vercel with Supabase PostgreSQL + PostGIS backend

### Out of Scope

- Real-time chat / user accounts — not a social platform
- Mobile native app — web-first, mobile later
- Video content hosting — static images only for v1
- Full OTA booking integration — affiliate deep links only, no booking flow
- User-generated content — all data is curated/scraped
- PredictHQ paid tier — use free tier or manual data first

## Context

- **Tech stack decided:** Next.js 14+ (App Router), TypeScript, PostgreSQL (Supabase + PostGIS), MapLibre GL JS, Tailwind CSS, Vercel deployment
- **Mapping:** MapLibre GL JS with OpenFreeMap tiles (free, unlimited, no API key) — chosen over Mapbox for zero cost at scale
- **Database:** Supabase free tier (500MB) with PostGIS for spatial queries (ST_DWithin, ST_Distance)
- **Affiliate model:** Booking.com (~4-5% of booking value), GetYourGuide (8%), Viator (8%), Amazon Associates (1-4.5%)
- **Data sourcing strategy:** Manual curation of top 100 festivals → Wikipedia/tourism board scraping → PredictHQ API enrichment → automated pipeline
- **Full detailed SPEC.md exists** with complete data model (SQL schemas), API routes, component architecture, and 10-phase breakdown
- **Cost at launch:** ~£10/year (domain only). Everything else on free tiers.

## Constraints

- **Budget:** Free tiers only at launch (Supabase, Vercel, OpenFreeMap, Nominatim)
- **Data:** Seed data must be curated/generated as part of the build — no existing dataset
- **Mapping:** MapLibre GL JS only (not Mapbox) to avoid usage-based billing
- **SEO:** Pages must be statically generated (SSG/ISR) for search engine indexing and performance
- **Performance:** Lighthouse > 90, map load < 2s, API responses < 200ms

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MapLibre over Mapbox | Zero cost at any scale, same WebGL capabilities | — Pending |
| Supabase over raw PostgreSQL | Free tier, PostGIS, instant REST API, auth, edge functions | — Pending |
| OpenFreeMap tiles | Free, unlimited, no API key required | — Pending |
| Affiliate-only monetisation (no ads initially) | Low traffic at launch makes ads worthless; affiliate links contextual and useful | — Pending |
| SSG + ISR for SEO pages | Pre-render at build time for CDN speed, revalidate periodically | — Pending |
| ConvertKit for email | Good free tier, tag-based segmentation, API for programmatic subscribe | — Pending |
| Nominatim for geocoding | Free, no API key, OpenStreetMap data | — Pending |

---
*Last updated: 2026-03-01 after initialization*
