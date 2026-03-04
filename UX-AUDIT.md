# UX Audit — HappeningNow.travel
## Date: 2026-03-02

---

## CRITICAL ISSUES (P0 — Blocks core user flows)

### 1. Mobile homepage: Species toggles dominate the viewport
- **Page:** Homepage (mobile 390px)
- **Screenshot:** audit-10-mobile-homepage.png
- **Problem:** 12 species toggle buttons + "All" button wrap into 3 rows, consuming ~25% of the visible map area. On mobile, the category toggles lose their labels (by design), but species toggles still show as unlabeled colored dots that are hard to distinguish. The migration routes legend also covers the bottom-right of the map.
- **Nielsen Heuristic Violated:** #8 Aesthetic & minimalist design — every extra unit of information competes with relevant info
- **Fix:** Collapse species toggles into a single expandable "Routes" button. Show species legend only when expanded. On mobile, hide the legend entirely and use the expandable panel.

### 2. Mobile homepage: Timeline scrubber barely visible / cut off
- **Page:** Homepage (mobile)
- **Screenshot:** audit-10-mobile-homepage.png
- **Problem:** The timeline scrubber at the bottom is almost completely hidden behind the MapLibre attribution bar. Only "Mar" and partial "Jul" visible. The gradient overlay is too subtle on mobile. Users can't scrub months — the primary interaction feature.
- **Nielsen Heuristic Violated:** #1 Visibility of system status, #7 Flexibility and efficiency
- **Fix:** Raise the timeline scrubber above the attribution. Add more padding. Make the gradient overlay stronger. Consider a persistent scrubber bar with clear month labels.

### 3. Search page: Geocode failure is silent
- **Page:** /search
- **Screenshot:** audit-06-search-geocode-error.png
- **Problem:** Typing "Barcelona" into the location field triggers the geocode API which returns a 500 error. No feedback is shown to the user — the empty state still says "Search for events by entering a location above" even though they DID enter a location. The user has no idea why nothing happened.
- **Nielsen Heuristic Violated:** #1 Visibility of system status, #9 Help users recognize/recover from errors
- **Fix:** Show an inline error message below the input: "We couldn't find that location. Try a different search." Add a loading indicator while geocoding.

### 4. Map MiniMap rendering: Only renders ~60% width
- **Page:** /event/pongal, /wildlife/great-wildebeest-migration
- **Screenshots:** audit-07-event-detail.png, audit-04-wildlife-detail.png
- **Problem:** The MiniMap only renders into approximately 60% of its container width. The right ~40% is blank/white. This makes the map look broken.
- **Nielsen Heuristic Violated:** #1 Visibility of system status — looks like a rendering error
- **Fix:** Ensure the MiniMap container has explicit dimensions and call `map.resize()` after mount. The container likely has a CSS width issue with the border-radius or overflow styling.

---

## HIGH PRIORITY ISSUES (P1 — Degrades experience significantly)

### 5. No global navigation — no way to discover other pages
- **All pages**
- **Problem:** There is no header, nav bar, or any navigation element. The homepage is just a full-screen map. Detail pages have breadcrumbs and a "Back to Map" button, but there's no way to navigate to /search, /destination/*, or discover the app's other features. A new user has no idea the search page exists.
- **Nielsen Heuristic Violated:** #3 User control & freedom, #6 Recognition over recall
- **Fix:** Add a minimal header/nav overlay on the homepage map (logo + search icon + hamburger menu). On detail pages, add a proper header with links to Search, Map, and back navigation.

### 6. Homepage has zero onboarding or context
- **Page:** Homepage
- **Problem:** A new user lands on a world map with some dots and month buttons. There's no title, no explanation, no hint about what this app does. The user has to figure out they should click dots and scrub months entirely on their own.
- **Nielsen Heuristic Violated:** #10 Help and documentation, #6 Recognition over recall
- **Fix:** Add a subtle welcome overlay or toast on first visit: "Explore festivals and wildlife events worldwide. Tap a marker to learn more, scrub months below to travel through time." Dismiss on first interaction.

### 7. "Back to Map" button overlaps content on mobile
- **Page:** /event/pongal (mobile)
- **Screenshot:** audit-13-mobile-event-detail.png
- **Problem:** The floating "Back to Map" button (bottom-right, position:fixed) overlaps the MiniMap on mobile and sits on top of the map content. It can obscure map features.
- **Fix:** Move the "Back to Map" to inline in the page flow (after the hero, in a sticky top bar) rather than a floating FAB. Or move it to a top-left back arrow.

### 8. Event detail page — "When" and "Where" cards don't stack on mobile
- **Page:** /event/pongal (mobile)
- **Screenshot:** audit-13-mobile-event-detail.png
- **Problem:** The When/Where info cards stack vertically on mobile (good) but they're very tall with too much padding for the small amount of content they contain. Each card shows one line of text ("January" / "Asia, India") with a label, taking up a disproportionate amount of vertical space.
- **Fix:** Reduce padding on mobile. Consider an inline layout: "January · Asia, India" as a single line rather than two separate cards on mobile.

### 9. What-to-do page: Overwhelming wall of event cards
- **Page:** /what-to-do/barcelona/6
- **Screenshot:** audit-09-what-to-do.png
- **Problem:** 31 events displayed as individual cards in a 3-column grid with no grouping, filtering, or pagination. The page is extremely long. Every card has "Book a stay" + "Find tours" buttons, creating visual noise. The affiliate disclosure "We may earn a commission" is repeated 31 times.
- **Nielsen Heuristic Violated:** #8 Aesthetic & minimalist design, #7 Flexibility and efficiency
- **Fix:** Group events by category (Festivals / Wildlife). Add a "Show more" button after 6-9 cards. Move the commission disclosure to a single footer note. Add filter pills at the top (All / Festivals / Wildlife).

### 10. Destination calendar grid: Very small text on mobile
- **Page:** /destination/barcelona (mobile)
- **Problem:** The 12-month calendar grid collapses to 3 columns, making event pills inside each column extremely cramped. Text is 10px and truncated. Crowd bars are barely visible.
- **Fix:** On mobile, switch to a horizontal scrolling row or a list view instead of a grid. Or show months as expandable cards.

---

## MEDIUM PRIORITY ISSUES (P2 — Polish and refinement)

### 11. Hero gradient placeholder images look generic
- **Pages:** All event/wildlife detail pages without images
- **Problem:** Events without images show a flat orange or green gradient with a tiny music note or globe icon at 15% opacity. This looks like a placeholder that was never finished, not an intentional design choice.
- **Fix:** Use category-specific pattern backgrounds (geometric patterns, topographic lines, illustrated motifs). Or use a generated abstract background based on the event name hash.

### 12. Crowd badge color contrast
- **Page:** All pages with CrowdBadge
- **Problem:** The "PEAK CROWDS" badge uses dark red background with white text — good. But "LOW CROWDS" and "MODERATE" badges may have contrast issues on certain hero image backgrounds since they use semi-transparent backgrounds.
- **Fix:** Add a subtle dark backdrop-filter or ensure minimum contrast ratio of 4.5:1.

### 13. Affiliate CTA buttons lack visual hierarchy
- **All pages with affiliate links**
- **Problem:** "Book a stay" (dark navy) and "Find tours" (terracotta) are given equal visual weight, but Booking.com is likely the higher-converting action for most events. The colors are muted and don't create urgency.
- **Fix:** Make the primary CTA (Book a stay) larger or more prominent. Use a more energetic color for the primary action. Consider making the secondary CTA a ghost/outline button.

### 14. Email capture form is buried in the bottom sheet
- **Page:** Homepage bottom sheet (EventPanel)
- **Problem:** The email signup form is below the affiliate links, below a divider, at the very bottom of the panel. Users have to scroll past the fold in a bottom sheet to even see it. Very low visibility.
- **Fix:** Move the email capture above the affiliate links, or create a separate sticky CTA: "Get alerts for this event" that's always visible.

### 15. No loading state when timeline month changes
- **Page:** Homepage
- **Problem:** Clicking a different month triggers a data fetch, but the map just goes still. The loading spinner only appears after a 3-second delay. Users don't know if their click registered.
- **Fix:** Add immediate visual feedback — briefly highlight the selected month button with an animation, show a subtle inline loading indicator, or fade the markers briefly.

### 16. Breadcrumb "Asia" link goes to /festivals/asia which 404s
- **Page:** /event/pongal
- **Problem:** The breadcrumb shows "Home > Asia > Pongal" where "Asia" links to /festivals/asia, but that route doesn't exist and returns a 404.
- **Fix:** Either create the festival listing pages for all regions, or make the breadcrumb region name non-clickable (just text).

### 17. Search page: Map only visible on desktop (lg breakpoint)
- **Page:** /search (mobile)
- **Problem:** The search map is `hidden lg:block`. On mobile, users see only the search bar and results list — no map at all. For a map-centric travel app, this is a significant omission.
- **Fix:** Add a toggle button on mobile: "List" / "Map" view toggle, like Airbnb does.

### 18. No search page discovery from homepage
- **Page:** Homepage
- **Problem:** There's no search icon, link, or CTA anywhere on the homepage that leads to /search. Users would have to know the URL exists.
- **Fix:** Add a search icon button in the map controls overlay, or a "Search events near you" CTA.

---

## LOW PRIORITY (P3 — Nice-to-haves)

### 19. Festival listing pages (e.g. /festivals/europe) all 404
- Multiple pages return 404, suggesting the dynamic route requires exact region slugs that differ from intuitive URLs.

### 20. The "Back to Map" button text should be contextual
- On wildlife pages, it should say "Back to Map" (correct). On event detail pages coming from search, it should maybe say "Back to search results."

### 21. No favicon/branding visible in screenshots
- The browser tab shows the page title but there's no visible brand mark or logo anywhere on the site itself.

### 22. Console warnings about MapLibre values
- "Expected value to be of type number" warnings on event detail pages — the MiniMap is receiving non-numeric coordinates somewhere.
