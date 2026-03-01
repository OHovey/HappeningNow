-- Bounding-box RPC function for viewport-based event fetching
-- Returns events within a geographic bounding box as a GeoJSON FeatureCollection
-- Call via Supabase client: supabase.rpc('get_events_bbox', { min_lng, min_lat, max_lng, max_lat, filter_month, filter_category })

CREATE OR REPLACE FUNCTION get_events_bbox(
  min_lng float,
  min_lat float,
  max_lng float,
  max_lat float,
  filter_month int DEFAULT NULL,
  filter_category text DEFAULT NULL
)
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
  FROM events e
  WHERE e.location && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    AND (filter_month IS NULL OR (
      CASE WHEN e.start_month <= e.end_month
        THEN filter_month BETWEEN e.start_month AND e.end_month
        ELSE filter_month >= e.start_month OR filter_month <= e.end_month
      END
    ))
    AND (filter_category IS NULL OR e.category = filter_category);
$$;
