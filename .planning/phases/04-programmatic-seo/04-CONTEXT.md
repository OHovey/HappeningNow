# Phase 4: Programmatic SEO - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate 3,500+ search-indexable pages covering festivals by region/month, wildlife by region/species, and destination month guides. Each page has structured data, canonical URLs, and ISR caching. Pages include filtered maps, event cards with affiliate links, internal links, and email capture. XML sitemap submitted to Google Search Console. llms.txt and llms-full.txt for AI discoverability.

</domain>

<decisions>
## Implementation Decisions

### Page content strategy
- What-to-do destination/month pages show events + weather data + crowd levels (practical travel planning focus)
- Distinct templates per page type: festival pages emphasize calendar/dates/tickets, wildlife pages emphasize seasons/locations/tour operators, what-to-do pages emphasize combined planning data
- 20+ template variations for intro text to avoid repetitive patterns that Google could flag as thin/duplicate content
- Template intros are data-driven and clean — factual, no forced personality (e.g., "12 festivals happening in Thailand this March, from water festivals to temple celebrations")

### Page layout & components
- Match existing HappeningNow site style — same card components, map style, visual language. Consistent brand experience
- Email capture form placed inline after the intro text, before main content (early visibility)
- Affiliate links are prominent with pricing displayed — bold CTA buttons on event cards, show price range
- Interactive embedded Mapbox map on each page with markers for that page's events (full pan/zoom/click)

### AI intros — SKIPPED
- No AI-generated intros for launch. Use well-crafted template sentences with dynamic data slots instead
- Revisit AI intros later if SEO performance needs differentiation
- Research AI content detection avoidance strategies for potential future use

### AI discoverability (llms.txt)
- llms.txt: detailed data catalog — list regions, countries, species covered with URL structures so AI assistants can make specific page recommendations
- llms-full.txt: full event data including event names, dates, locations, descriptions — enough for AI assistants to answer specific travel questions directly
- Include affiliate/booking links in llms-full.txt so AI assistants can pass them through when recommending events
- Static files regenerated on a schedule (daily or on deploy), not dynamic. Zero runtime cost

### Claude's Discretion
- Thin page handling strategy (noindex thresholds, enrichment with related content, or both)
- Internal linking strategy across programmatic pages
- Template intro specificity level (how much local detail to include)
- Exact template sentence structures and variation patterns
- Map loading/performance optimization approach

</decisions>

<specifics>
## Specific Ideas

- 20+ intro template variations is a hard minimum to protect SEO — avoid any detectable patterns across pages
- User explicitly does not want to frontload the site build with AI-written content
- Affiliate links should feel commercial and conversion-focused, not subtle — show pricing and bold CTAs
- What-to-do pages are the primary content play (~2,000+ pages) — these need weather + crowd data alongside events

</specifics>

<deferred>
## Deferred Ideas

- AI-generated intros — revisit after launch if SEO performance data suggests differentiation is needed
- Research into AI content detection avoidance for search engines — relevant if AI intros are added later

</deferred>

---

*Phase: 04-programmatic-seo*
*Context gathered: 2026-03-02*
