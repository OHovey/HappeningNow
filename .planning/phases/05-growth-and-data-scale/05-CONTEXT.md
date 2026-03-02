# Phase 5: Growth and Data Scale - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can search for events near a location within a date range and get ranked results with "worth the trip" scoring. Email subscribers receive region-based alerts with optional category filtering. The event database grows through automated Wikipedia scraping and PredictHQ ingestion with quality gating.

</domain>

<decisions>
## Implementation Decisions

### Search page layout
- Sidebar with map layout — form controls in left sidebar, map takes up remaining space
- Text input with Nominatim autocomplete for location entry
- Scrollable ranked result cards below the search form in the sidebar
- Auto-search on filter change (debounced) — no explicit search button
- Clicking a result card centers the map on that event's marker

### "Worth the trip" scoring
- Visual badge system: "Must See" / "Worth It" / "Consider" based on score thresholds
- Uniqueness is the dominant weighting factor — a one-of-a-kind festival far away ranks above a generic fair nearby
- Quick indicator tags on each card showing key factors: "Highly Unique", "Low Crowds", "2h drive"
- Haversine straight-line distance estimate for travel time (~60km/h average) — no external routing API

### Email alert signup
- Signup CTA on both search results page and programmatic SEO region pages
- Region pre-filled from page context (search location or current browsing region)
- Inline success confirmation — form transforms to "You'll get alerts for events near [location]"
- Optional category filter checkboxes (festivals, wildlife, markets, etc.) — default is all events

### Data pipeline
- Auto-ingest with quality gate: events above threshold (has dates, location, description) publish automatically; below threshold goes to review queue
- Wikipedia as primary discovery source — curated festival/event lists with dates and locations
- PredictHQ as supplementary source (free tier)
- Fuzzy match deduplication: name similarity + location proximity + date overlap; merge data from new source to fill missing fields; flag uncertain matches for review
- Weekly batch processing — sufficient cadence for event data

### Claude's Discretion
- Loading skeletons and empty state design for search
- Exact badge score thresholds and color scheme
- ConvertKit integration specifics and sequence design
- Wikipedia scraping selectors and page targeting
- Quality threshold criteria and scoring
- Review queue implementation details

</decisions>

<specifics>
## Specific Ideas

- Search should feel like a travel search tool — sidebar + map is the familiar pattern (Google Flights, Airbnb)
- Badges should give users a quick gut-check verdict without needing to understand the scoring math
- Alert signup should be nearly zero friction — pre-fill everything possible from context

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-growth-and-data-scale*
*Context gathered: 2026-03-02*
