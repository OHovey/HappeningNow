-- GeoJSON export RPC function
-- Returns all events as a GeoJSON FeatureCollection for MapLibre GL JS
-- Call via Supabase client: supabase.rpc('get_events_geojson')

CREATE OR REPLACE FUNCTION get_events_geojson()
RETURNS json
LANGUAGE sql
STABLE
AS $$
  SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(
      json_agg(
        json_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(e.location)::json,
          'properties', json_build_object(
            'id', e.id,
            'name', e.name,
            'slug', e.slug,
            'category', e.category,
            'description', e.description,
            'image_url', e.image_url,
            'start_month', e.start_month,
            'end_month', e.end_month,
            'scale', e.scale,
            'crowd_level', e.crowd_level,
            'country', e.country,
            'region', e.region,
            'booking_destination_id', e.booking_destination_id,
            'getyourguide_location_id', e.getyourguide_location_id
          )
        )
      ),
      '[]'::json
    )
  )
  FROM events e;
$$;
