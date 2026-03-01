# Feature Research

**Domain:** Interactive travel events discovery map — festivals, wildlife, crowd calendars with affiliate monetisation
**Researched:** 2026-03-01
**Confidence:** MEDIUM (competitor analysis via web research; no direct access to competitor internals; patterns cross-validated across multiple sources)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Interactive world map with zoomable event markers | Every map-based discovery platform (Roadtrippers, Wanderlog, TripAdvisor) sets this expectation. A list view alone is perceived as low-effort. | HIGH | MapLibre GL JS handles this. Marker clustering required — raw dots at world zoom = visual noise. |
| Event filtering by category | FestivalNet, Everfest, and all comparable platforms offer type filtering (music, food, cultural, wildlife). No filter = unusable with >50 events. | LOW | Toggles for festivals / wildlife / both. Already scoped. |
| Event detail view with key facts | Name, dates, location, description, link to more. Every event discovery site (from FestivalNet to Everfest) provides this. Missing = dead end for the user. | LOW | Side panel on map. Must include affiliate CTAs. |
| Search / location-based filtering | FestivalNet uses state + city + radius. Users type a place and expect relevant results. | MEDIUM | Nominatim geocoding already chosen. Radius search via PostGIS ST_DWithin. |
| Filter events by month or time period | Month-based browsing is the primary navigation pattern on all calendar-style sites (festivals.day, FestivalNet, Vacasa's festival guides). | MEDIUM | The timeline scrubber IS this feature. Core mechanic of the product. |
| Mobile-responsive design | Over 60% of travel inspiration happens on mobile (Expedia Group Q3 2025 data). Non-responsive = broken product for majority of users. | MEDIUM | Tailwind CSS handles layout. Map panel must collapse correctly on mobile — sidebar becomes full-screen overlay. |
| Event/destination detail pages (static, indexed) | Users expect shareable, linkable URLs for specific events. SEO requires it. Every content site from Viator to responsible travel provides destination/event pages. | MEDIUM | SSG with Next.js App Router. Structured data (JSON-LD Event schema) required for Google rich results. |
| Fast page loads | Google's Core Web Vitals are table stakes for discovery via search. Slow = penalised in rankings AND users leave. Sub-3s expectation on mobile. | HIGH | Lighthouse >90 target already set. Map tiles via OpenFreeMap CDN. SSG for all content pages. |
| Affiliate links to book accommodation | Users who discover an event immediately want to explore accommodation. Booking.com widget/deep link is now an expected CTA pattern on all travel content sites. | LOW | Deep links, not full booking flow. Already scoped. |
| "Best time to visit" destination information | Sites like TheBestTimeToVisit.com, Viator, and G Adventures have trained users to expect seasonal guidance per destination. Missing = incomplete product. | MEDIUM | The 12-month destination grid with crowd/weather data covers this. |
| Breadcrumb / clear navigation | Users arriving from SEO need to understand site structure instantly. Required for both UX and Google structured data. | LOW | Standard Next.js layout hierarchy. |
| OG tags and social sharing metadata | Users share interesting events on social. Without OG tags, shares look broken. Expected by any site that has shareable content. | LOW | Per-page og:image and og:title on all SSG pages. |

---

### Differentiators (Competitive Advantage)

Features that set HappeningNow.travel apart. Not expected by users, but create the "wow" moment and drive return visits / shares.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Animated timeline scrubber — month-by-month world map | No competitor offers a temporal, animated world event map. FestivalNet filters by month but shows a list. This is the core "wow" — watching dots appear and disappear as you drag the slider. Directly linked to shareability and virality. | HIGH | The product's defining differentiator. MapLibre GL JS transition animations on marker visibility. Scrubber state drives all displayed data. Must be butter-smooth. |
| Crowd heatmap overlay synced to month scrubber | Google Maps shows "popular times" per venue but not per destination at world scale. Sightsmap shows static photo density. A colour-coded (green→red) heatmap that CHANGES as you scrub months is completely novel and solves the "avoid overtourism" intent that's growing +120% YoY in search data (2024-2025). | HIGH | PostGIS heatmap data per destination per month. Rendered as MapLibre GL JS heatmap layer. Requires seed data for crowd levels per destination per month (~30+ destinations). |
| Wildlife migration route animation | No consumer travel site shows animated migration paths. eBird and BirdCast exist but are science tools, not travel inspiration. Showing a wildebeest migration path animate across a map in real-time is a high-share visual. | HIGH | SVG or GeoJSON LineString animated paths on MapLibre. Data: 20-30 key migration routes. Requires manual curation. |
| Destination "12-month dashboard" — events + crowds + weather at a glance | TripAdvisor shows reviews. TheBestTimeToVisit.com shows climate. No site combines festivals, wildlife events, crowd levels, and weather for a destination in a single scannable grid. This creates a genuinely useful planning tool, not just inspiration. | HIGH | Destination drilldown page with calendar-grid component. Requires joining festival, wildlife, crowd, and weather data per destination. |
| "I have a week off" reverse-search tool | Users don't always start with a destination. They start with availability. No major travel inspiration site solves "available July 10-17, within 4 hours flight, want a festival" in one search. Directly targets the growing audience of spontaneous travellers. | HIGH | Form: dates + departure region + interests → PostGIS spatial query + date overlap → ranked results. Complex query logic. |
| Programmatic SEO at scale (~3,500 pages) | Most festival/wildlife sites have thin content or no SEO strategy. Capturing "Carnival Brazil February", "wildebeest migration Kenya July", "what to do in Japan April" long-tail queries at scale is a compounding traffic moat. | HIGH | Next.js generateStaticParams + SSG. Requires structured data templates and seed data quality. |
| Integrated accommodation + experience affiliate CTAs contextually placed | Affiliate CTAs on most travel blogs are generic banners. Contextual deep links ("Stay near Rio Carnival: Booking.com results" + "Book a carnival tour: GetYourGuide results") immediately adjacent to event discovery is a conversion advantage. Commission rates: Booking.com ~4-5%, GYG/Viator 8%. | MEDIUM | Dynamic deep links constructed from event location + date. No API integration needed — URL parameter construction. |
| Wildlife event as first-class content type | Everfest and FestivalNet cover only human festivals. Adding wildebeest migration, whale watching seasons, bioluminescence blooms, cherry blossom peaks as "events" on the same map creates a unique content layer competitors don't have. | MEDIUM | Data model already handles this with `event_type` field. Requires ~100 curated wildlife events with viewing windows. |
| Email segmentation by interest + destination intent | Most travel email lists are undifferentiated. Tagging subscribers by category interest (wildlife vs. festivals) and destination region allows highly relevant follow-up sequences that convert to affiliate clicks. | MEDIUM | ConvertKit tag-based segmentation on subscribe. Interest + departure region captured at form. |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems — deliberately out of scope.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| User accounts / profiles | "Personalisation" and saved trips sound valuable. Other travel platforms have it. | Adds auth complexity, GDPR surface area, support burden, and "login wall" friction that kills SEO conversion. At low-traffic launch stage, personalisation data is thin and useless. | Save-to-URL state (encode filters in query params). Add accounts only after 50k MAU justifies the engineering cost. |
| User-generated event submissions | Community-sourced data sounds like scale. | Spam, moderation overhead, data quality collapse. Every UGC platform that doesn't have moderation budget ends up with garbage. Event data quality is a competitive advantage — losing it kills trust. | Manual curation + Wikipedia/tourism board scraping. PredictHQ API for enrichment at scale. |
| Real-time event data | Live updates sound impressive. | Real-time requires websockets or polling, increases infra cost, and travel events don't change hour-to-hour. False precision on "real-time" erodes trust if data goes stale. | Monthly ISR revalidation is sufficient. Events are seasonal, not live. |
| Full OTA booking flow (booking accommodation in-product) | Seamless UX, no handoff. | Requires PCI compliance, customer support for failed bookings, supplier contracts. Booking.com and GYG affiliate programmes provide this at zero infra cost. | Affiliate deep links. Let established OTAs handle checkout. |
| Ticketing / event registration | Festival ticket sales seem like natural extension. | Stripe integration, event organiser partnerships, fraud risk, customer support. Completely different business model from content + affiliate. | Link to official event ticket pages. Viator/GYG handle ticketed experiences. |
| Social sharing feed / community timeline | "Community" features drive engagement in theory. | Without existing audience, a dead social feed is worse than no social feed (ghost town signal). Requires moderation. No differentiated value vs. Instagram travel accounts. | Social sharing buttons for external platforms. Focus on creating content that gets shared, not a place to share it. |
| Native mobile app (iOS/Android) | Mobile-first users want an app. | PWA achieves near-native on mobile at zero additional engineering cost. App store submission, cross-platform maintenance, and push notification infra are significant scope additions. Lighthouse >90 PWA is sufficient for MVP. | Responsive PWA. Revisit native only after product-market fit confirmed. |
| AI trip planning chatbot | AI travel assistants are trending (Booking.com + OpenAI integration noted in research). | LLM API costs scale with traffic. At launch, HAL/RAG over event data is complex to implement well and often hallucinates. Incorrect festival dates destroy trust. | High-quality structured content that AI tools CAN index and cite. Make the site the source that ChatGPT references, not a product competing with it. |
| Video content hosting | Rich media makes events come alive. | Video hosting = bandwidth costs, CDN costs, encoding pipeline, rights issues. Static images only are sufficient for MVP. | Use YouTube embeds for any video content. No self-hosted video. |
| Weather API real-time integration | "Current weather" next to events seems useful. | Real-time weather requires paid API (OpenWeatherMap free tier is limited). Weather at booking time is not the same as weather at event time (months away). | Static historical climate data per destination per month. This is what users actually need for planning. |

---

## Feature Dependencies

```
[Map base layer (MapLibre + OpenFreeMap tiles)]
    └──required by──> [Event markers on map]
                          └──required by──> [Timeline scrubber filtering markers]
                                                └──required by──> [Crowd heatmap overlay synced to scrubber]
                                                └──required by──> [Wildlife migration animation synced to scrubber]

[Seed data (festivals + wildlife events + destinations)]
    └──required by──> [Event markers on map]
    └──required by──> [Event detail pages (SSG)]
    └──required by──> [Programmatic SEO pages]
    └──required by──> [Destination 12-month dashboard]
    └──required by──> [Reverse search tool]

[Event detail pages (SSG)]
    └──required by──> [Affiliate CTAs (Booking.com / GYG deep links)]
    └──required by──> [Programmatic SEO pages]
    └──required by──> [Event schema JSON-LD]

[PostGIS spatial queries]
    └──required by──> [Search by location / radius]
    └──required by──> [Reverse search tool]
    └──required by──> [Crowd heatmap data queries]

[Email capture form]
    └──enhanced by──> [Interest-based segmentation tags]
    └──enhanced by──> [Lead magnet (e.g., "Best festivals by month" PDF)]

[Category toggles (festivals / wildlife)]
    └──enhances──> [Timeline scrubber]
    └──enhances──> [Map marker display]

[Destination 12-month dashboard]
    ──conflicts with scope of──> [Real-time weather API] (use static climate data instead)

[User accounts]
    ──conflicts with scope of──> [Saved events / trips] (use URL state instead)
```

### Dependency Notes

- **Seed data must come before almost everything.** Map markers, detail pages, SEO pages, and the reverse search tool are all empty without quality seed data. This means data pipeline work must happen early in the roadmap — not as an afterthought.
- **Timeline scrubber requires stable map layer.** Smooth animation depends on marker data being pre-loaded or fast to query. The data model must include `month_start` and `month_end` fields for all events.
- **Programmatic SEO depends on data quality, not just quantity.** Thin pages with one-sentence descriptions will not rank. Each SSG page needs sufficient unique content (description, crowd context, affiliate links, related events). Data enrichment is a prerequisite.
- **Crowd heatmap overlay enhances scrubber.** The scrubber works without crowd data, but the heatmap is a core differentiator. It should be built on top of a working scrubber, not in parallel.
- **Affiliate links require no API.** Booking.com and GetYourGuide deep links are URL-constructed (lat/lng + dates). Zero API dependency. This means monetisation can be added to any event detail page immediately once the page exists.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to prove the core concept and capture the first affiliate conversions.

- [ ] **Interactive map with event markers** — the product literally does not exist without this. MapLibre GL JS + OpenFreeMap.
- [ ] **Timeline scrubber (month filtering)** — the "wow" moment and the primary differentiator. Must animate smoothly. Without it, this is just FestivalNet.
- [ ] **Category toggles (festivals / wildlife)** — needed for usability at >100 markers. Without this the map is noise.
- [ ] **Event detail side panel** — user clicks marker → gets name, dates, description, photos, and affiliate links. This is the conversion step.
- [ ] **Seed data: 100+ festivals, 30+ wildlife events, 10+ destinations** — below this threshold, the map looks empty and untrustworthy.
- [ ] **Booking.com + GetYourGuide affiliate deep links on detail panel** — monetisation only works if CTAs exist at the moment of discovery intent.
- [ ] **5-10 static destination pages (SSG)** — needed to test SEO and programmatic page template before scaling to 3,500+.
- [ ] **Event schema JSON-LD on detail pages** — required for Google rich results eligibility from day one. Cheap to implement, high return.
- [ ] **Email capture with ConvertKit** — list building starts at launch. Even 10 subscribers at day 1 is better than 0.
- [ ] **Mobile-responsive design (Lighthouse >90)** — majority of discovery traffic is mobile; non-responsive product is broken for the core audience.

### Add After Validation (v1.x)

Features to add once core concept is validated (traffic, affiliate clicks, email sign-ups showing traction).

- [ ] **Crowd heatmap overlay** — adds depth to the scrubber experience. Add once scrubber mechanics are stable. Trigger: first 1,000 MAU.
- [ ] **Wildlife migration route animations** — high-share visual, but requires data curation. Trigger: 500+ wildlife events in database.
- [ ] **Full programmatic SEO rollout (3,500+ pages)** — scale from 10 destination pages once template is proven to drive organic traffic. Trigger: at least 3 pages ranking in top 10.
- [ ] **Destination 12-month dashboard** — valuable planning tool but requires joining festival + wildlife + crowd + weather data. Trigger: 30+ destinations with full data.
- [ ] **Data pipeline (Wikipedia scraping + PredictHQ)** — needed to scale beyond 500 manually curated events. Trigger: manual curation becomes the bottleneck.
- [ ] **Interest-based email segmentation sequences** — automated nurture campaigns. Trigger: 500+ email subscribers.

### Future Consideration (v2+)

Defer until product-market fit is established.

- [ ] **Reverse "I have a week off" search tool** — high value but complex PostGIS + date-overlap query logic. Defer until data volume justifies it (2,000+ events needed to make results feel rich).
- [ ] **Native PWA / installable app experience** — after mobile web traffic is proven and engagement metrics justify the investment.
- [ ] **Contextual AI summaries on destination pages** — once the site has enough unique data to be the source, not the synthesizer. Avoid LLM hallucination risk on event dates.
- [ ] **Amazon Associates integration** — lower commission (1-4.5%) than GYG/Booking.com. Add for travel gear / packing recommendations only after core affiliate channels are optimised.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Interactive map + event markers | HIGH | HIGH | P1 |
| Timeline scrubber (animated) | HIGH | HIGH | P1 |
| Event detail side panel + affiliate CTAs | HIGH | MEDIUM | P1 |
| Seed data (100+ events) | HIGH | HIGH | P1 |
| Mobile-responsive design | HIGH | MEDIUM | P1 |
| Event schema JSON-LD | MEDIUM | LOW | P1 |
| Category toggles | MEDIUM | LOW | P1 |
| Email capture (ConvertKit) | MEDIUM | LOW | P1 |
| Crowd heatmap overlay | HIGH | HIGH | P2 |
| Wildlife migration animations | HIGH | MEDIUM | P2 |
| Destination 12-month dashboard | HIGH | HIGH | P2 |
| Programmatic SEO pages (full scale) | HIGH | HIGH | P2 |
| Data pipeline (Wikipedia / PredictHQ) | HIGH | HIGH | P2 |
| OG tags / social metadata | MEDIUM | LOW | P1 |
| Location search (Nominatim) | MEDIUM | MEDIUM | P2 |
| Reverse search tool | HIGH | HIGH | P3 |
| Email segmentation sequences | MEDIUM | MEDIUM | P3 |
| PWA / installable app | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | FestivalNet | Everfest | TheBestTimeToVisit | Our Approach |
|---------|-------------|----------|--------------------|--------------|
| World map view | No (list only) | No (list + search) | No (text/tables) | YES — core differentiator |
| Timeline / month scrubber | Month filter (dropdown) | Filter by date | Month navigation | Animated scrubber — visual and interactive |
| Wildlife events | No | No | Climate only | YES — first-class content type |
| Crowd data | No | No | Seasonal overview text | YES — green/red heatmap by month |
| Migration route animation | No | No | No | YES — MapLibre animated paths |
| Affiliate links | No direct links | No | No | YES — Booking.com + GYG contextually placed |
| Programmatic SEO | Basic (state pages) | Limited | Yes (country/month) | 3,500+ pages at launch scale |
| Destination planning dashboard | No | No | Partial (climate only) | 12-month grid: events + crowds + weather |
| Email capture | No | No | Sidebar form | YES — ConvertKit, interest segmentation |
| Mobile-responsive | Yes | Yes | Yes | YES — Lighthouse >90 target |
| Event schema / structured data | Partial | Minimal | No | YES — JSON-LD on all event pages from day one |

---

## Sources

- [FestivalNet festival finder — features observed via live site](https://festivalnet.com/find-festivals) — MEDIUM confidence (direct observation)
- [Everfest Fest300 list — competitor feature set](https://www.everfest.com/fest300) — MEDIUM confidence (site unreachable during research; description sourced from SaaSHub and RocketReach profiles)
- [festivals.day world festival calendar](https://festivals.day/) — LOW confidence (site unreachable during research)
- [TravelTime interactive map UX blog](https://traveltime.com/blog/interactive-map-design-ux-mobile-desktop) — HIGH confidence (direct source, specific UX patterns)
- [TopPlace map layers — crowd/popularity heatmaps](https://www.avuxi.com/topplace/map-layers) — HIGH confidence (direct observation)
- [TheBestTimeToVisit.com — features observed](https://www.thebesttimetovisit.com/) — HIGH confidence (direct observation)
- [Programmatic SEO 2026 guide](https://zumeirah.com/programmatic-seo-in-2026/) — MEDIUM confidence (commercial blog, consistent with multiple sources)
- [Google event schema structured data](https://developers.google.com/search/docs/appearance/structured-data/event) — HIGH confidence (official Google documentation)
- [GetYourGuide affiliate programme](https://partner.getyourguide.com/) — HIGH confidence (official partner page; 8% commission confirmed)
- [Backlinko travel affiliate programme analysis 2026](https://backlinko.com/affiliate-marketing-travel) — MEDIUM confidence (aggregated research, widely referenced)
- [Advance Travel and Tourism: events as travel motivators 2026](https://www.advancetravelandtourism.com/insights/can-events-will-make-or-break-marketing-in-2026/) — MEDIUM confidence (industry publication)
- [Expedia Group Q3 2025 travel trends](https://partner.expediagroup.com/en-us/resources/blog/q3-2025-travel-trends-insights) — HIGH confidence (official Expedia partner data)
- [ZealConnect: OTA market trends 2025-2026](https://zealconnect.com/travel-industry-trends-2025-how-new-otas-reshaped-the-market-2026-outlook/) — MEDIUM confidence (industry analysis)
- [BirdCast bird migration forecasts](https://birdcast.org/) — HIGH confidence (official Cornell Lab tool; confirms real-time migration data exists for science, not travel inspiration)

---

*Feature research for: Interactive travel events map platform (HappeningNow.travel)*
*Researched: 2026-03-01*
