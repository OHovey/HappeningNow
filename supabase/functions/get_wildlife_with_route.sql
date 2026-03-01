-- RPC to fetch a migration route by slug with route geometry as GeoJSON coordinates.
-- Returns a single row with all migration_route columns plus route_geojson (the LineString as GeoJSON).
CREATE OR REPLACE FUNCTION get_wildlife_with_route(route_slug TEXT)
RETURNS TABLE (
  id UUID,
  species TEXT,
  name TEXT,
  slug TEXT,
  peak_months INTEGER[],
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  route_geojson JSON
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    mr.id,
    mr.species,
    mr.name,
    mr.slug,
    mr.peak_months,
    mr.description,
    mr.image_url,
    mr.created_at,
    ST_AsGeoJSON(mr.route)::json AS route_geojson
  FROM migration_routes mr
  WHERE mr.slug = route_slug
  LIMIT 1;
$$;
