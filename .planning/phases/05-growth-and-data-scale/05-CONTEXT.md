# Phase 5: Growth and Data Scale - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can search for events near a location within a date range and get ranked results with "worth the trip" scoring. Email subscribers receive region-based alerts with optional category filtering. The event database gets seeded with Wikipedia placeholder data (real data pipeline deferred to a future milestone with its own spec).

</domain>

<decisions>
## Implementation Decisions

### Search page layout
- Horizontal bar form at top — Google Flights style with location, dates, category, distance in one row
- Text input with Nominatim autocomplete for location entry
- Results displayed as cards + map side by side — ranked cards on left, map with highlighted markers on right
- Auto-search on filter change (debounced) — no explicit search button
- Clicking a result card highlights its map marker and vice versa

### "Worth the trip" scoring
- Score is hidden from users — determines rank order only, no visible badge or number
- Uniqueness is the dominant weighting factor — a one-of-a-kind festival far away ranks above a generic fair nearby
- Quick indicator tags on each card showing key factors: "Highly Unique", "Low Crowds", "2h drive" — explains ranking without showing the score
- Haversine straight-line distance estimate for travel time (~60km/h average) — no external routing API

### Email alert signup
- Signup CTA on search results page only (not on region/SEO pages)
- Region pre-filled from current search location — minimal friction
- Inline success confirmation — form transforms to "You'll get alerts for events near [location]"
- Optional category filter checkboxes (festivals, wildlife, markets, etc.) — default is all events

### Data pipeline (placeholder)
- Wikipedia scraping as seed/placeholder data — real data pipeline coming in a future milestone with its own spec
- Minimal one-time/manually-triggered script — not a reusable pipeline framework
- Script scrapes Wikipedia festival/event lists and geocodes via Nominatim to get lat/lng
- Events arrive search-ready with coordinates for spatial queries

### Claude's Discretion
- Loading skeletons and empty state design for search page
- Exact indicator tag labels and styling
- ConvertKit integration specifics and sequence design
- Wikipedia page targeting and scraping selectors
- Quality thresholds for seed data inclusion

</decisions>

<specifics>
## Specific Ideas

- Search layout should feel like Google Flights — horizontal bar, familiar travel search pattern
- Ranking should be invisible — position tells the story, indicator tags explain why without showing math
- Alert signup should be nearly zero friction — pre-fill everything from context, just need an email

</specifics>

<deferred>
## Deferred Ideas

- Full data ingestion pipeline with PredictHQ and other sources — future milestone with dedicated spec
- Alert signup on region/SEO pages — could revisit if search page placement isn't getting enough signups

</deferred>

---

*Phase: 05-growth-and-data-scale*
*Context gathered: 2026-03-02*
