# Phase 1: Map Foundation - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Interactive world map where users explore events by scrubbing through months, filtering by category (festivals, wildlife), clicking markers for event details with affiliate links, and signing up for email updates. Crowd heatmaps, migration animations, and destination pages are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Map visual style
- Pulsing colored dots as event markers, color-coded by category (e.g., festivals vs wildlife)
- Numbered cluster circles that expand on click/zoom when markers overlap
- No emoji or icon markers — simple dots with pulse animation

### Timeline scrubber
- Month pills/tabs (Jan, Feb, Mar...) — tappable buttons, not a drag slider
- Fade in/out transitions when switching months — markers appear/disappear smoothly
- Default view on load: current month's events

### Category filtering
- Persistent toggle buttons (Festivals / Wildlife) visible near the map
- Always accessible, one-tap to show/hide a category
- Works alongside the month selector

### Event detail panel
- Bottom sheet pattern — slides up from bottom on marker click
- Hero image at top, full-width — visual impact first
- Event name, description, dates below the photo
- Color-coded crowd badge (Busy/Moderate/Quiet) included from Phase 1
- Primary action buttons for affiliate CTAs ("Book a stay", "Find tours") — large, colored, prominent

### Email capture
- Email form lives inside the event detail bottom sheet — contextual CTA ("Get alerts for events like this")
- Collects email + interest checkboxes (Festivals / Wildlife)
- Auto-tags subscriber in ConvertKit based on which event they were viewing
- Inline success message replaces the form after submission — no page reload, no toast

### Claude's Discretion
- Map theme (dark, light, terrain, etc.)
- Color palette for category coding
- Exact spacing, typography, and layout proportions
- Loading skeleton design
- Error state handling

</decisions>

<specifics>
## Specific Ideas

No specific references — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-map-foundation*
*Context gathered: 2026-03-01*
