-- Migration: Expand event categories from festival/wildlife to 6 categories
-- New categories: festival, concert, sport, arts, event, wildlife
-- Also adds tm_segment and tm_genre columns for raw Ticketmaster classification data.

-- 1. Drop old CHECK constraint and add new one
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_check;
ALTER TABLE events ADD CONSTRAINT events_category_check
  CHECK (category IN ('festival', 'concert', 'sport', 'arts', 'event', 'wildlife'));

-- 2. Add columns for raw Ticketmaster classification data
ALTER TABLE events ADD COLUMN IF NOT EXISTS tm_segment TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tm_genre TEXT;

-- 3. Reclassify existing Ticketmaster events by name patterns
-- Order matters: sport first, arts second, concert as catch-all last

-- Sport: names matching championship/tournament/cup/football/basketball/etc (guarded by NOT containing 'fest')
UPDATE events
SET category = 'sport'
WHERE source = 'ticketmaster'
  AND category = 'festival'
  AND name !~* 'fest'
  AND name ~* '(championship|tournament|cup\b|football|basketball|baseball|hockey|soccer|tennis|golf|boxing|wrestling|nba|nfl|mlb|nhl|mls|rugby|cricket|racing|grand prix|formula|f1|ufc|mma)';

-- Arts: names matching ballet/opera/symphony/theatre/broadway/etc
UPDATE events
SET category = 'arts'
WHERE source = 'ticketmaster'
  AND category = 'festival'
  AND name !~* 'fest'
  AND name ~* '(ballet|opera|symphony|orchestra|theatre|theater|broadway|musical|philharmonic|dance company|recital|chamber music)';

-- Concert: remaining Ticketmaster events without "fest" in name
UPDATE events
SET category = 'concert'
WHERE source = 'ticketmaster'
  AND category = 'festival'
  AND name !~* 'fest';
