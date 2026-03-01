-- RPC to fetch all migration routes with route geometry as GeoJSON coordinates.
-- Returns all rows from migration_routes with route_geojson (LineString as GeoJSON).
CREATE OR REPLACE FUNCTION get_all_routes_with_geojson()
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
  FROM migration_routes mr;
$$;
