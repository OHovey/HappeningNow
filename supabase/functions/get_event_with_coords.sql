-- RPC to fetch an event by slug with coordinates extracted from PostGIS geometry.
-- Returns a single row with all events table columns plus lng/lat from ST_X/ST_Y.
-- For wildlife events linked to a migration route, also returns route_geojson and peak_months.
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
  migration_route_id UUID,
  created_at TIMESTAMPTZ,
  lng DOUBLE PRECISION,
  lat DOUBLE PRECISION,
  route_geojson JSON,
  peak_months INTEGER[]
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
    e.migration_route_id,
    e.created_at,
    ST_X(e.location) AS lng,
    ST_Y(e.location) AS lat,
    ST_AsGeoJSON(mr.route)::JSON AS route_geojson,
    mr.peak_months
  FROM events e
  LEFT JOIN migration_routes mr ON e.migration_route_id = mr.id
  WHERE e.slug = event_slug
  LIMIT 1;
$$;
