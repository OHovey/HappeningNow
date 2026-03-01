-- RPC to fetch an event by slug with coordinates extracted from PostGIS geometry.
-- Returns a single row with all events table columns plus lng/lat from ST_X/ST_Y.
CREATE OR REPLACE FUNCTION get_event_with_coords(event_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  category TEXT,
  description TEXT,
  image_url TEXT,
  start_month INTEGER,
  end_month INTEGER,
  country TEXT,
  region TEXT,
  scale INTEGER,
  crowd_level TEXT,
  booking_destination_id TEXT,
  getyourguide_location_id TEXT,
  created_at TIMESTAMPTZ,
  lng DOUBLE PRECISION,
  lat DOUBLE PRECISION
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    e.id,
    e.name,
    e.slug,
    e.category::TEXT,
    e.description,
    e.image_url,
    e.start_month,
    e.end_month,
    e.country,
    e.region,
    e.scale,
    e.crowd_level::TEXT,
    e.booking_destination_id,
    e.getyourguide_location_id,
    e.created_at,
    ST_X(e.location) AS lng,
    ST_Y(e.location) AS lat
  FROM events e
  WHERE e.slug = event_slug
  LIMIT 1;
$$;
