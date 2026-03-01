# Phase 3: Visual Differentiators - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Add three visual layers to the existing map: crowd heatmap overlay that responds to the month scrubber, animated wildlife migration routes with position tracking, and destination drilldown pages with a 12-month calendar grid. These are the visual differentiators that make SEO pages non-thin. No new data models or navigation structures — this builds on the map, events, and destinations from Phases 1-2.

</domain>

<decisions>
## Implementation Decisions

### Heatmap appearance
- Cool-to-warm color gradient (blue/purple for low crowds → orange/red for packed) — avoids colorblind issues
- Subtle background wash — semi-transparent overlay, event markers sit clearly on top
- Regional blob granularity — broad heat regions, not city-level precision
- Smooth animated fade when scrubbing months — colors blend between months as the scrubber moves

### Migration animations
- Pulsing dot indicator — universal across all species, no per-species icons needed
- Auto-play when visible — dot position synced to the currently selected month on the scrubber
- Trail effect on route line — solid/bright behind the dot, faded/dashed ahead, giving a sense of direction and progress
- All species visible simultaneously — color-coded with distinct route colors per species, small legend to identify them

### Destination dashboard layout
- Horizontal 12-column strip on desktop (all months visible as a one-liner), collapses responsively for mobile
- Column info priority: crowd bar (top) → events (middle) → weather (bottom) — crowd level is the hero info
- Thin colored top bar per column using cool-to-warm gradient — doesn't interfere with content readability
- Best time to visit: 2-3 recommended months highlighted with subtle border in the grid, short explanatory sentence above

### Interaction & popups
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

</decisions>

<specifics>
## Specific Ideas

- Heatmap should feel like context, not the star — event markers always remain the primary visual element
- Migration trail effect should make month-scrubbing feel dynamic and alive
- Destination grid should be scannable at a glance — a user should instantly see the crowd pattern across a full year
- Quieter alternatives should keep users on the map exploring, not jump them to separate pages

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-visual-differentiators*
*Context gathered: 2026-03-01*
