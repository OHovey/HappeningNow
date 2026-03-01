-- RPC to fetch all destinations with coordinates extracted from PostGIS geometry.
-- Returns all destination columns plus lng/lat from ST_X/ST_Y.
CREATE OR REPLACE FUNCTION get_destinations_with_coords()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  country TEXT,
  region TEXT,
  crowd_data JSONB,
  weather_data JSONB,
  created_at TIMESTAMPTZ,
  lng DOUBLE PRECISION,
  lat DOUBLE PRECISION
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    d.id,
    d.name,
    d.slug,
    d.country,
    d.region,
    d.crowd_data,
    d.weather_data,
    d.created_at,
    ST_X(d.location) AS lng,
    ST_Y(d.location) AS lat
  FROM destinations d
  ORDER BY d.name;
$$;
