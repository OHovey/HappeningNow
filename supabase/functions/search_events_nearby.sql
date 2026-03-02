-- Radius-based RPC function for spatial event search
-- Returns events within a geographic radius with optional date/category filters
-- Call via Supabase client: supabase.rpc('search_events_nearby', { user_lng, user_lat, radius_meters, start_m, end_m, filter_category })

CREATE OR REPLACE FUNCTION search_events_nearby(
  user_lng float,
  user_lat float,
  radius_meters float,
  start_m int DEFAULT NULL,
  end_m int DEFAULT NULL,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  category text,
  description text,
  image_url text,
  start_month int,
  end_month int,
  lng float,
  lat float,
  country text,
  region text,
  scale int,
  crowd_level text,
  booking_destination_id text,
  getyourguide_location_id text,
  distance_meters float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    e.id, e.name, e.slug, e.category, e.description, e.image_url,
    e.start_month, e.end_month,
    ST_X(e.location) AS lng,
    ST_Y(e.location) AS lat,
    e.country, e.region, e.scale, e.crowd_level,
    e.booking_destination_id, e.getyourguide_location_id,
    ST_Distance(
      e.location::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) AS distance_meters
  FROM events e
  WHERE ST_DWithin(
    e.location::geography,
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
    radius_meters
  )
  AND (filter_category IS NULL OR e.category = filter_category)
  AND (start_m IS NULL OR end_m IS NULL OR (
    CASE
      WHEN e.start_month <= e.end_month THEN
        -- Normal range: event March-June, search April-May
        NOT (end_m < e.start_month OR start_m > e.end_month)
      ELSE
        -- Wrap-around: event Nov-Feb
        NOT (start_m > e.end_month AND end_m < e.start_month)
    END
  ))
  ORDER BY distance_meters ASC;
$$;
